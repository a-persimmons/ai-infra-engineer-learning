# 模块 07：GPU 计算与分布式训练——动手练习

## 概览

本模块包含五项循序渐进的动手实验，用于培养 GPU 计算及分布式训练技能。每项实验包含起始代码、详细说明与解题提示。

**总时长（原文估算）：** 15–20 小时
**前置条件：** 已完成模块 07 讲义，具备云端或本地 GPU 访问能力。

---

## 实验 1：GPU 基础与性能分析（3–4 小时）

### 目标
- 搭建 GPU 开发环境。
- 分析 GPU 与 CPU 的性能。
- 理解 GPU 显存管理。
- 使用 PyTorch Profiler。

### 任务

#### 任务 1.1：环境配置
```bash
# Verify CUDA installation
nvidia-smi
nvcc --version

# Install PyTorch with CUDA support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install profiling tools
pip install nvidia-ml-py3 torch-tb-profiler
```

#### 任务 1.2：GPU 与 CPU 基准测试
创建脚本，完成以下工作：
1. 比较 CPU 与 GPU 的矩阵乘法性能。
2. 测试不同矩阵尺寸：128、512、1024、2048、4096。
3. 绘制加速比与矩阵尺寸的关系图。
4. 计算实际达到的 TFLOPS。

**起始代码：**
```python
import torch
import time
import matplotlib.pyplot as plt

def benchmark_matmul(device, size, iterations=100):
    """Benchmark matrix multiplication"""
    # TODO: Implement benchmark
    # - Create random matrices
    # - Warmup runs
    # - Timed runs with synchronization
    # - Calculate TFLOPS
    pass

# Test different sizes
sizes = [128, 512, 1024, 2048, 4096]
# TODO: Run benchmarks and plot results
```

**交付物：**
- 基准测试脚本。
- 性能图（加速比与矩阵尺寸的关系）。
- 结果分析报告。

---

#### 任务 1.3：显存分析
分析模型训练期间的显存使用：
1. 追踪训练各阶段的显存占用。
2. 识别显存瓶颈。
3. 比较 FP32 与 FP16 的显存占用。

**起始代码：**
```python
def profile_training_memory():
    """Profile GPU memory during training"""
    model = create_model().cuda()
    optimizer = torch.optim.Adam(model.parameters())

    # TODO: Implement memory profiling
    # - Track memory before/after each stage
    # - Create visualization
    # - Test with different precisions
    pass
```

---

## 实验 2：混合精度训练（3–4 小时）

### 目标
- 实现自动混合精度（AMP）。
- 比较训练速度及显存使用。
- 处理数值稳定性问题。
- 验证 FP16 下的准确率。

### 任务

#### 任务 2.1：AMP 实现
将训练循环转换为混合精度训练：

**起始代码：**
```python
from torch.cuda.amp import autocast, GradScaler

def train_with_amp(model, train_loader, epochs=10):
    """Implement AMP training"""
    scaler = GradScaler()

    for epoch in range(epochs):
        for data, target in train_loader:
            # TODO: Implement AMP training loop
            # - Forward pass with autocast
            # - Loss computation
            # - Backward with scaling
            # - Optimizer step
            pass

# TODO: Compare FP32 vs FP16:
# - Training speed
# - Memory usage
# - Final accuracy
```

#### 任务 2.2：数值稳定性
测试并修复数值稳定性问题：
1. 训练容易出现不稳定情况的模型。
2. 检测 NaN/Inf 值。
3. 实现损失缩放调整。
4. 比较 FP16 与 BF16。

**预期发现（原文示例）：**
- 在支持 Tensor Core 的 GPU 上，FP16 约获得 2 倍加速。
- 显存使用约减少 50%。
- 准确率差异小于 1%。

---

## 实验 3：分布式数据并行（4–5 小时）

### 目标
- 实现 DistributedDataParallel（DDP）。
- 搭建多 GPU 训练环境。
- 测量扩展效率。
- 调试常见 DDP 问题。

### 任务

#### 任务 3.1：单节点多 GPU 配置
在单台机器上实现 DDP 训练：

**起始代码：**
```python
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler

def setup(rank, world_size):
    """Initialize distributed environment"""
    # TODO: Implement setup
    pass

def cleanup():
    """Cleanup distributed environment"""
    # TODO: Implement cleanup
    pass

def train(rank, world_size):
    """Main training function"""
    print(f"Running on rank {rank}")
    setup(rank, world_size)

    # TODO: Implement DDP training
    # - Create model and wrap with DDP
    # - Create DistributedSampler
    # - Training loop
    # - Save checkpoints (rank 0 only)

    cleanup()

if __name__ == '__main__':
    world_size = torch.cuda.device_count()
    torch.multiprocessing.spawn(
        train,
        args=(world_size,),
        nprocs=world_size,
        join=True
    )
```

#### 任务 3.2：扩展效率分析
测量并分析扩展效率：
1. 使用 1、2、4 块 GPU 训练（如果可用）。
2. 测量训练时间与吞吐量。
3. 计算加速比及效率。
4. 识别通信瓶颈。

**交付物：**
- DDP 训练脚本。
- 扩展效率图。
- 瓶颈分析。

---

#### 任务 3.3：梯度累积
使用 DDP 实现梯度累积：

**起始代码：**
```python
def train_with_accumulation(model, train_loader, accumulation_steps=4):
    """DDP training with gradient accumulation"""
    # TODO: Implement
    # - Use model.no_sync() for intermediate steps
    # - Synchronize on final step
    # - Track effective batch size
    pass
```

**测试：** 验证 accumulation_steps=4、batch_size=8 的配置是否与 batch_size=32 得到相同结果（在其他相关训练条件一致时）。

---

## 实验 4：显存优化（3–4 小时）

### 目标
- 实现梯度检查点。
- 优化大型模型训练。
- 使用 Flash Attention。
- 调试 OOM 错误。

### 任务

#### 任务 4.1：梯度检查点
添加检查点以减少显存占用：

**起始代码：**
```python
from torch.utils.checkpoint import checkpoint

class CheckpointedTransformer(nn.Module):
    """Transformer with gradient checkpointing"""
    def __init__(self, num_layers=12):
        super().__init__()
        self.layers = nn.ModuleList([
            TransformerLayer() for _ in range(num_layers)
        ])

    def forward(self, x):
        # TODO: Implement forward with checkpointing
        # - Checkpoint every N layers
        # - Measure memory savings
        pass
```

**比较：**
- 峰值显存：使用与不使用检查点。
- 训练速度：重计算引入的开销。
- 找到合适的检查点频率。

---

#### 任务 4.2：Flash Attention 集成
使用 Flash Attention 替换标准注意力：

```python
# Before: Standard attention (O(N²) memory)
def standard_attention(Q, K, V):
    scores = torch.matmul(Q, K.transpose(-2, -1))
    attn_weights = torch.softmax(scores / np.sqrt(d_k), dim=-1)
    return torch.matmul(attn_weights, V)

# TODO: Implement Flash Attention
# - Install: pip install flash-attn
# - Replace standard attention
# - Benchmark memory and speed
```

**预期结果（原文示例）：**
- 长序列的显存使用降低 10–20 倍。
- 加速 2–4 倍。
- 数学上等价的输出。

---

#### 任务 4.3：OOM 调试
调试并修复容易触发 OOM 的训练脚本：

**故意包含问题的代码：**
```python
# This code will OOM - fix it!
def train_large_model():
    model = VeryLargeModel(num_layers=48, hidden_size=4096).cuda()
    optimizer = torch.optim.Adam(model.parameters())

    for epoch in range(100):
        for batch in large_dataloader:  # batch_size=64
            data, target = batch
            data, target = data.cuda(), target.cuda()

            output = model(data)
            loss = criterion(output, target)

            # Accumulate losses (MEMORY LEAK!)
            all_losses.append(loss)

            loss.backward()
            optimizer.step()

# TODO: Fix all OOM issues:
# - Reduce batch size
# - Add gradient accumulation
# - Enable mixed precision
# - Add gradient checkpointing
# - Fix memory leaks
# - Use torch.no_grad() for validation
```

---

## 实验 5：生产 GPU 管道（4–5 小时）

### 目标
- 构建面向生产的训练管道。
- 实现监控与日志。
- 添加检查点及恢复训练能力。
- 优化端到端性能。

### 任务

#### 任务 5.1：完整训练管道
构建包含以下能力的生产管道：
- DDP 多 GPU 训练。
- 混合精度（AMP）。
- 梯度累积。
- 学习率调度。
- 检查点管理。
- TensorBoard 日志。
- GPU 指标监控。

**模板结构：**
```python
class ProductionTrainer:
    def __init__(self, model, train_loader, val_loader, config):
        # TODO: Initialize all components
        # - DDP setup
        # - AMP scaler
        # - Optimizers
        # - Schedulers
        # - Loggers
        pass

    def train_epoch(self, epoch):
        # TODO: Training loop with all optimizations
        pass

    def validate(self):
        # TODO: Validation with torch.no_grad()
        pass

    def save_checkpoint(self, epoch):
        # TODO: Save model, optimizer, scheduler states
        pass

    def load_checkpoint(self, path):
        # TODO: Resume from checkpoint
        pass
```

---

#### 任务 5.2：性能分析
分析完整管道的性能：
1. 使用 PyTorch Profiler 识别瓶颈。
2. 优化数据加载。
3. 调整批大小。
4. 尝试实现超过 80% 的 GPU 利用率（原文目标）。

**性能分析脚本：**
```python
from torch.profiler import profile, record_function, ProfilerActivity

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    profile_memory=True,
    record_shapes=True,
    with_stack=True,
) as prof:
    # TODO: Run training for 100 steps
    # - Add record_function markers
    # - Export to TensorBoard
    # - Analyze results
    pass

# TODO: Create optimization report
```

---

#### 任务 5.3：监控仪表盘
创建实时监控仪表盘：

```python
class GPUMonitor:
    """Real-time GPU monitoring"""
    def __init__(self):
        # TODO: Initialize monitoring
        # - Setup Prometheus metrics
        # - TensorBoard writers
        # - nvidia-ml-py
        pass

    def log_metrics(self, step, metrics):
        # TODO: Log all metrics
        # - Training loss/accuracy
        # - GPU utilization
        # - GPU memory
        # - Temperature
        # - Throughput
        pass

# TODO: Integrate with training loop
# - Log every N steps
# - Create visualizations
# - Set up alerts for issues
```

---

## 评分标准

### 实验 1：GPU 基础（20 分）
- [5 分] 正确实现基准测试。
- [5 分] 准确的性能测量。
- [5 分] 完整的显存分析。
- [5 分] 分析及报告质量。

### 实验 2：混合精度（20 分）
- [5 分] 正确实现 AMP。
- [5 分] 正确缩放梯度。
- [5 分] 处理数值稳定性问题。
- [5 分] 性能比较。

### 实验 3：分布式训练（25 分）
- [8 分] 正确配置 DDP。
- [7 分] 扩展效率分析。
- [5 分] 梯度累积。
- [5 分] 检查点实现。

### 实验 4：显存优化（20 分）
- [5 分] 梯度检查点。
- [5 分] Flash Attention 集成。
- [5 分] OOM 修复。
- [5 分] 显存分析。

### 实验 5：生产管道（15 分）
- [5 分] 完整实现管道。
- [5 分] 性能分析。
- [5 分] 监控仪表盘。

**总分：100 分**
**及格：70 分**

---

## 提交

创建包含以下内容的 Git 仓库：
```
gpu-computing-labs/
├── lab1-gpu-basics/
│   ├── benchmark.py
│   ├── memory_profiling.py
│   ├── results/
│   └── REPORT.md
├── lab2-mixed-precision/
│   ├── amp_training.py
│   ├── stability_tests.py
│   └── REPORT.md
├── lab3-distributed/
│   ├── ddp_training.py
│   ├── scaling_analysis.py
│   └── REPORT.md
├── lab4-memory/
│   ├── gradient_checkpointing.py
│   ├── flash_attention.py
│   ├── oom_fixes.py
│   └── REPORT.md
├── lab5-production/
│   ├── trainer.py
│   ├── monitor.py
│   ├── profiling.py
│   └── REPORT.md
└── README.md
```

## 资源

- 示例数据集：使用 CIFAR-10 或 MNIST 快速测试。
- 云 GPU：Google Colab、Kaggle、AWS、GCP。
- 参考实现：原文说明可在提交截止日期后查看 `solutions/` 目录。

---

## 获取帮助

原文所列渠道：
- **答疑时间：** 周二下午 2–4 点。
- **讨论论坛：** [链接]
- **Slack 频道：** #gpu-computing-labs。
- **助教邮箱：** gpu-labs@example.com。

---

## 成功建议

1. **尽早开始：** 这些实验需要一定时间。
2. **增量测试：** 不要一次性编写全部内容。
3. **使用性能分析工具：** 先测量，再优化。
4. **阅读错误信息：** 它们有助于排查问题。
5. **积极提问：** 利用答疑及论坛。
6. **记录文档：** 编写清晰的报告。
7. **保存检查点：** 避免丢失数小时的训练进度。

---

**开始 GPU 实践吧！**

> 译注：原文总时长 15–20 小时与各实验时长逐项合计的 17–22 小时不完全一致。混合精度收益、Flash Attention 性能及 GPU 利用率均需实测，数学等价不保证浮点结果逐位相同；梯度累积与大批次训练的结果也可能受 BatchNorm、随机性、损失归一化等因素影响。答疑渠道与示例邮箱未经核实。保留所有原始代码块及其中英文注释，未实际执行 GPU 实验。
