# 练习 07：GPU 显存分析与 OOM 诊断

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 03（训练流水线）

## 目标

对一个刻意容易发生 OOM 的训练脚本进行分析，识别真正占用显存的组件（激活值、参数、优化器状态、梯度），并应用三种缓解措施：梯度检查点、优化器状态分片和激活值重计算。测量每项措施的影响。

## 为什么重要

显存是前沿模型的重要约束。一个 130 亿参数模型能否放入 GPU，通常并不只取决于参数数量，还取决于激活值与优化器状态。掌握分析与缓解技术，可以在更小的 GPU 上运行更大的模型。

## 要求

1. 使用 `torch.cuda.memory_summary` 和 `torch.cuda.memory._record_memory_history` 进行分析。
2. 应用梯度检查点，将激活显存减半。
3. 使用 `bitsandbytes.optim.Adam8bit`，将优化器状态大小降低至四分之一。
4. 在特定 Transformer Block 上使用 `torch.utils.checkpoint.checkpoint_sequential`。
5. 生成可视化显存轨迹（上传至 https://pytorch.org/memory_viz）。
6. 记录四类显存来源以及缓解措施的实测效果。

## 分步操作

### 步骤 1——基线 OOM（30 分钟）
从训练中等规模模型（例如 GPT-2 medium，约 3.5 亿参数）的脚本开始，选择恰好会导致 GPU OOM 的批大小。
```python
import torch
from transformers import GPT2LMHeadModel
model = GPT2LMHeadModel.from_pretrained("gpt2-medium").cuda()
opt = torch.optim.AdamW(model.parameters(), lr=1e-5)
for _ in range(10):
    x = torch.randint(0, 50000, (16, 512), device="cuda")
    out = model(x, labels=x).loss
    out.backward()
    opt.step(); opt.zero_grad()
```
预期出现 OOM。通过 `torch.cuda.max_memory_allocated() / 1e9` 记录崩溃前的峰值显存。

### 步骤 2——获取轨迹快照（15 分钟）
```python
torch.cuda.memory._record_memory_history(max_entries=100_000)
# training loop
torch.cuda.memory._dump_snapshot("baseline.bin")
torch.cuda.memory._record_memory_history(enabled=None)
```
上传至 memory_viz，识别最大的显存分配。

### 步骤 3——分解显存占用（15 分钟）
对于使用 AdamW 进行 fp32 训练的 3.5 亿参数模型：
- 参数：约 1.4 GB。
- 梯度：约 1.4 GB。
- AdamW 状态（参数大小的两倍）：约 2.8 GB。
- 激活值：取决于批大小与序列长度，通常为 3–10 GB。

因此优化器状态、梯度及参数合计约 5.6 GB，其余主要来自激活值。

### 步骤 4——梯度检查点（30 分钟）
```python
model.gradient_checkpointing_enable()
```
适用于 Hugging Face 模型；在反向传播时重新计算激活值，以计算换取显存。预期激活显存降低约 30–50%，训练速度下降约 30%。

### 步骤 5——Adam8bit（20 分钟）
```python
import bitsandbytes as bnb
opt = bnb.optim.AdamW8bit(model.parameters(), lr=1e-5)
```
将优化器状态量化至 8-bit，节省约 75% 的状态显存。

### 步骤 6——自定义重计算（30 分钟）
对于非 Hugging Face 模型，可以针对每个 Block 使用 `torch.utils.checkpoint.checkpoint`：
```python
from torch.utils.checkpoint import checkpoint
class CheckpointedBlock(nn.Module):
    def __init__(self, block): super().__init__(); self.block = block
    def forward(self, x): return checkpoint(self.block, x, use_reentrant=False)
```

### 步骤 7——测量每项缓解措施（20 分钟）
记录各方案的峰值显存与步耗时：基线（使用可容纳的较小批大小）、+ 梯度检查点、+ Adam8bit、+ 两者。生成比较表格。

## 交付物

1. 展示 OOM 行为的 `train_baseline.py`。
2. 包含三项缓解措施的 `train_optimized.py`。
3. 可在 memory_viz 中查看的显存快照（`baseline.bin`、`optimized.bin`）。
4. `MEMORY_REPORT.md`：显存分解、缓解措施比较表与建议。

## 验证

- [ ] 基线在所选批大小下发生 OOM，优化后在相同批大小下运行且保留超过 20% 的显存余量。
- [ ] 使用全部三项措施后，峰值显存降低至少 50%。
- [ ] 训练步耗时增加低于 50%（梯度检查点的代价）。
- [ ] 损失曲线在浮点误差范围内保持一致（原文目标）。

## 拓展目标

- 通过 `accelerate` 或 `deepspeed` 为优化器状态添加 **CPU Offload**。
- 在多 GPU 上添加 **FSDP**（Fully Sharded Data Parallel，完全分片数据并行），与单 GPU + 检查点比较。
- **逐层**分析激活显存，识别最严重的占用来源。

## 常见陷阱

- **自定义模型中的 `gradient_checkpointing_enable()` 无效**——此方法适用于支持它的 Hugging Face 模型。对于自定义架构，直接使用 `checkpoint()`。
- **Adam8bit 第一步缓慢**——首次调用时初始化量化参数，应忽略首次迭代的计时。
- **显存快照过大**——默认 `max_entries=100_000` 可能产生数 MB 的快照。长时间运行时定期采样。
- **峰值显存统计需要重置**——在不同测试场景之间使用 `torch.cuda.reset_peak_memory_stats()` 以准确比较。

> 译注：Adam8bit 属于优化器状态量化，并不等同于分片；它也可能引入数值差异。梯度检查点与激活值重计算是相关技术，收益不可简单相加。
