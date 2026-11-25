# 实验 06：GPU 显存分析与 OOM 诊断

**时长：** 60 分钟  **前置条件：** PyTorch + GPU。

## 目标

使用 PyTorch 的显存分析工具定位训练期间显存增长的位置，区分激活值、参数和优化器状态的显存占用，并应用梯度检查点技术。

## 步骤

### 1. 获取当前 GPU 使用情况快照
```python
import torch
print(torch.cuda.memory_summary(device=0, abbreviated=False))
```

### 2. 逐步追踪显存分配
```python
torch.cuda.memory._record_memory_history(max_entries=100_000)

# ... training loop ...

torch.cuda.memory._dump_snapshot("snapshot.bin")   # binary snapshot
torch.cuda.memory._record_memory_history(enabled=None)
```
将 `snapshot.bin` 上传至 https://pytorch.org/memory_viz，查看可视化时间线。

### 3. 强制触发 OOM 并追踪
```python
import torch
device = torch.device("cuda")
tensors = []
try:
    while True:
        tensors.append(torch.randn(2_000_000_000, device=device))   # 2B floats ≈ 8GB each
except torch.cuda.OutOfMemoryError as e:
    print(f"OOM after {len(tensors)} allocations")
    print(torch.cuda.memory_summary())
```

### 4. 使用梯度检查点容纳更大的模型
```python
from torch.utils.checkpoint import checkpoint_sequential
import torch.nn as nn

big = nn.Sequential(*[nn.Sequential(nn.Linear(4096,4096), nn.ReLU()) for _ in range(20)]).cuda()

x = torch.randn(8, 4096, device="cuda", requires_grad=True)
# Without checkpointing: stores activations for all 20 layers
# With checkpointing: re-computes activations during backward, saves memory
y = checkpoint_sequential(big, 4, x)         # group into 4 segments
y.sum().backward()
```

### 5. 分解优化器状态

对于 Adam：每个参数有一份 fp32 副本及两个动量张量 → 参数大小的 4 倍。带动量的 SGD：2 倍。

### 6. 从第一性原理计算

对于具有 P 个参数的模型，训练显存约为：

- 参数：4P 字节（fp32）。
- Adam 状态：8P 字节。
- 激活值：取决于批大小与模型深度，通常占主导。
- 梯度：4P 字节。

对于采用 Adam、fp32 训练的 10 亿参数模型，参数、状态与梯度合计约 16 GB，此外还需计入激活值。

### 7. 工具
```bash
nvidia-smi dmon -s u -c 60                  # 60s of GPU util sampling
nvidia-smi --query-gpu=memory.used,memory.total --format=csv -lms 500
```

## 验证

- [ ] `memory_summary` 显示当前分配器状态。
- [ ] 记录的快照可以在 PyTorch memory viz 工具中可视化。
- [ ] 梯度检查点显著降低峰值显存（本例中降低 20–40%）。

## 清理
```bash
rm -f snapshot.bin
```

## 故障排查

- **显存随训练轮数持续增长** — Python 中仍持有张量（`losses.append(loss)`）；使用 `.item()` 获取标量，避免持有计算图。
- **验证时 OOM，但训练时没有** — 仅使用 `model.train(False)` 不会释放显存；用 `torch.no_grad()` 包裹验证过程以跳过激活值存储。
- **`memory_summary` 显示显存碎片化** — 尝试 `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`。
