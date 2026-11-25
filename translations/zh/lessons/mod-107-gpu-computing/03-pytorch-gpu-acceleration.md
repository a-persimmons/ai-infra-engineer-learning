# 第 03 课：PyTorch GPU 加速

## 学习目标

完成本课后，你将能够：

1. 在 CPU 与 GPU 之间高效移动 PyTorch 张量和模型。
2. 使用自动混合精度（AMP）实现混合精度训练。
3. 分析 GPU 显存使用情况，识别内存瓶颈。
4. 优化 PyTorch 训练循环中的 GPU 利用率。
5. 排查常见 GPU 错误及性能问题。
6. 使用 PyTorch Profiler 识别性能瓶颈。

## 导论

PyTorch 提供了高级、符合 Python 编程习惯的 GPU 计算接口。尽管它抽象了大部分 CUDA 复杂性，理解 PyTorch 如何使用 GPU，仍然是构建高效 ML 基础设施的重要能力。

## 将数据移动到 GPU

### 基础张量操作

```python
import torch

# Create tensor on CPU (default)
x_cpu = torch.randn(1000, 1000)
print(f"Device: {x_cpu.device}")  # cpu

# Move to GPU
x_gpu = x_cpu.cuda()  # Method 1
x_gpu = x_cpu.to('cuda')  # Method 2
x_gpu = x_cpu.to(device='cuda:0')  # Method 3: Specific GPU

# Check device
print(f"Device: {x_gpu.device}")  # cuda:0
print(f"Is CUDA: {x_gpu.is_cuda}")  # True

# Create directly on GPU
y_gpu = torch.randn(1000, 1000, device='cuda')
z_gpu = torch.randn(1000, 1000).cuda()

# Move back to CPU
result_cpu = x_gpu.cpu()
result_cpu = x_gpu.to('cpu')
```

### 与设备无关的代码

```python
# Best practice: Write device-agnostic code
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Create tensors on specified device
x = torch.randn(1000, 1000, device=device)
y = torch.randn(1000, 1000, device=device)

# Operations work regardless of device
z = x + y
result = torch.mm(x, y)
```

### 多 GPU 选择

```python
# Check number of GPUs
n_gpus = torch.cuda.device_count()
print(f"Number of GPUs: {n_gpus}")

# Get GPU names
for i in range(n_gpus):
    print(f"GPU {i}: {torch.cuda.get_device_name(i)}")

# Specify which GPU to use
x = torch.randn(1000, device='cuda:0')  # First GPU
y = torch.randn(1000, device='cuda:1')  # Second GPU

# Set default GPU
torch.cuda.set_device(0)
x = torch.randn(1000).cuda()  # Uses cuda:0

# Context manager for temporary device change
with torch.cuda.device(1):
    y = torch.randn(1000).cuda()  # Uses cuda:1
```

## 将模型移动到 GPU

### 基础模型传输

```python
import torch.nn as nn

# Define model
class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(1000, 500)
        self.fc2 = nn.Linear(500, 10)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Create model
model = MyModel()

# Move to GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# Now all model parameters and buffers are on GPU
for param in model.parameters():
    print(param.device)  # cuda:0
```

### 使用 GPU 的训练循环

```python
# Complete training loop
def train_epoch(model, dataloader, optimizer, criterion, device):
    model.train()
    total_loss = 0

    for batch_idx, (data, target) in enumerate(dataloader):
        # Move data to GPU
        data = data.to(device, non_blocking=True)
        target = target.to(device, non_blocking=True)

        # Forward pass
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)

        # Backward pass
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    return total_loss / len(dataloader)

# Usage
model = MyModel().to(device)
optimizer = torch.optim.Adam(model.parameters())
criterion = nn.CrossEntropyLoss()

for epoch in range(num_epochs):
    loss = train_epoch(model, train_loader, optimizer, criterion, device)
    print(f"Epoch {epoch}: Loss = {loss:.4f}")
```

### 非阻塞传输

```python
# Use non_blocking=True for faster transfers with pinned memory
for data, target in train_loader:
    data = data.to(device, non_blocking=True)
    target = target.to(device, non_blocking=True)

    # This allows the transfer to happen asynchronously
    # CPU can prepare next batch while GPU processes current

# Requires pinned memory in DataLoader
train_loader = DataLoader(
    dataset,
    batch_size=32,
    pin_memory=True,  # Enable pinned memory
    num_workers=4
)
```

## 混合精度训练

### 什么是混合精度？

混合精度同时使用 FP16（16 位浮点数）与 FP32（32 位浮点数）：

```
┌─────────────────────────────────────────────────────┐
│           Mixed Precision Training                  │
│                                                     │
│  FP16 (half precision):                            │
│  - Forward pass computations                       │
│  - Backward pass gradient computation              │
│  - 2x memory reduction                             │
│  - 2-3x speed improvement (with Tensor Cores)     │
│                                                     │
│  FP32 (full precision):                            │
│  - Master weights                                  │
│  - Loss scaling (prevent underflow)                │
│  - Optimizer updates                               │
│                                                     │
│  Benefits:                                         │
│  ✓ Faster training (Tensor Cores)                 │
│  ✓ Lower memory usage                             │
│  ✓ Larger batch sizes possible                    │
│  ✓ Minimal accuracy loss                          │
└─────────────────────────────────────────────────────┘
```

### 自动混合精度（Automatic Mixed Precision，AMP）

PyTorch 提供 `torch.cuda.amp`，便于实现混合精度训练：

```python
from torch.cuda.amp import autocast, GradScaler

# Create gradient scaler (handles loss scaling)
scaler = GradScaler()

model = MyModel().to(device)
optimizer = torch.optim.Adam(model.parameters())

for epoch in range(num_epochs):
    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        optimizer.zero_grad()

        # Forward pass with autocast
        with autocast():
            output = model(data)
            loss = criterion(output, target)

        # Backward pass with gradient scaling
        scaler.scale(loss).backward()

        # Optimizer step with unscaling
        scaler.step(optimizer)
        scaler.update()

        if batch_idx % 100 == 0:
            print(f"Loss: {loss.item():.4f}")
```

### AMP 的工作原理

```python
# What happens under the hood:

# 1. autocast() automatically casts operations
with autocast():
    # This operation uses FP16
    z = torch.mm(x, y)  # FP16 matrix multiplication

    # This operation stays in FP32 (for numerical stability)
    loss = F.cross_entropy(z, target)  # FP32 loss

# 2. GradScaler prevents gradient underflow
scaler = GradScaler()

# Scale loss to prevent gradient underflow in FP16
scaled_loss = loss * scale_factor  # e.g., scale_factor = 65536
scaled_loss.backward()  # Compute scaled gradients

# Unscale gradients before optimizer step
unscaled_grads = grads / scale_factor
optimizer.step()

# Adjust scale factor for next iteration
scaler.update()  # Increase if no overflow, decrease if overflow
```

### BFloat16（Brain Floating Point）

```python
# BFloat16 (BF16): Alternative to FP16
# - Same range as FP32
# - Lower precision than FP16
# - No gradient scaling needed
# - Supported on Ampere+ GPUs

# Enable BF16
torch.set_float32_matmul_precision('medium')  # or 'high'

# Use BF16 autocast
with torch.autocast(device_type='cuda', dtype=torch.bfloat16):
    output = model(data)
    loss = criterion(output, target)

# No scaler needed!
loss.backward()
optimizer.step()
```

### 不同精度类型比较

```python
import time

def benchmark_precision(model, data, iterations=100):
    """Compare FP32, FP16, and BF16 performance"""

    # FP32 (baseline)
    model_fp32 = model.float()
    data_fp32 = data.float()

    start = time.time()
    for _ in range(iterations):
        with torch.no_grad():
            _ = model_fp32(data_fp32)
    torch.cuda.synchronize()
    fp32_time = time.time() - start

    # FP16 with AMP
    model_amp = model.half()
    data_amp = data.half()

    start = time.time()
    for _ in range(iterations):
        with torch.no_grad(), autocast():
            _ = model_amp(data_amp)
    torch.cuda.synchronize()
    fp16_time = time.time() - start

    # BF16
    model_bf16 = model.bfloat16()
    data_bf16 = data.bfloat16()

    start = time.time()
    for _ in range(iterations):
        with torch.no_grad():
            _ = model_bf16(data_bf16)
    torch.cuda.synchronize()
    bf16_time = time.time() - start

    print(f"FP32: {fp32_time:.3f}s (baseline)")
    print(f"FP16: {fp16_time:.3f}s ({fp32_time/fp16_time:.2f}x speedup)")
    print(f"BF16: {bf16_time:.3f}s ({fp32_time/bf16_time:.2f}x speedup)")

# Test
model = MyModel().cuda()
data = torch.randn(128, 1000).cuda()
benchmark_precision(model, data)
```

## GPU 显存管理

### 监控显存使用

```python
# Check GPU memory
if torch.cuda.is_available():
    # Current memory allocated
    allocated = torch.cuda.memory_allocated() / 1024**3  # GB
    print(f"Allocated: {allocated:.2f} GB")

    # Peak memory allocated
    peak = torch.cuda.max_memory_allocated() / 1024**3
    print(f"Peak: {peak:.2f} GB")

    # Memory reserved by PyTorch
    reserved = torch.cuda.memory_reserved() / 1024**3
    print(f"Reserved: {reserved:.2f} GB")

    # Total GPU memory
    total = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print(f"Total: {total:.2f} GB")

    # Reset peak stats
    torch.cuda.reset_peak_memory_stats()
```

### 训练过程中的显存分析

```python
def train_with_memory_tracking(model, dataloader, optimizer, criterion, device):
    """Training loop with memory tracking"""
    model.train()

    for batch_idx, (data, target) in enumerate(dataloader):
        # Track memory before batch
        mem_before = torch.cuda.memory_allocated() / 1024**2  # MB

        data, target = data.to(device), target.to(device)

        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()

        # Track memory after batch
        mem_after = torch.cuda.memory_allocated() / 1024**2
        mem_peak = torch.cuda.max_memory_allocated() / 1024**2

        if batch_idx % 10 == 0:
            print(f"Batch {batch_idx}:")
            print(f"  Memory: {mem_after:.0f} MB")
            print(f"  Peak: {mem_peak:.0f} MB")
            print(f"  Delta: {mem_after - mem_before:.0f} MB")

        # Clear cache periodically (caution: can slow training)
        if batch_idx % 100 == 0:
            torch.cuda.empty_cache()
```

### 处理显存不足（OOM）错误

```python
# Common OOM scenarios and solutions

# Problem 1: Batch size too large
# Solution: Reduce batch size or use gradient accumulation

# Gradient accumulation
accumulation_steps = 4
effective_batch_size = batch_size * accumulation_steps

for i, (data, target) in enumerate(train_loader):
    data, target = data.to(device), target.to(device)

    output = model(data)
    loss = criterion(output, target) / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# Problem 2: Large model doesn't fit
# Solution: Gradient checkpointing

from torch.utils.checkpoint import checkpoint

class CheckpointedModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.Linear(1000, 1000) for _ in range(10)
        ])

    def forward(self, x):
        # Use checkpointing for layers
        for layer in self.layers:
            x = checkpoint(layer, x)
        return x

# Trade-off: Recompute activations during backward pass
# Memory: ↓ (don't store all activations)
# Speed: ↓ (recompute during backward)

# Problem 3: Memory leak
# Solution: Clear cache and check for references

torch.cuda.empty_cache()  # Free unused memory

# Check for lingering tensors
import gc
gc.collect()
torch.cuda.empty_cache()
```

### 节省显存的训练技术

```python
# Technique 1: Delete unnecessary variables
def train_step(data, target):
    output = model(data)
    loss = criterion(output, target)
    loss.backward()

    # Delete tensors explicitly
    del output
    del loss
    torch.cuda.empty_cache()

# Technique 2: Use torch.no_grad() for validation
@torch.no_grad()
def validate(model, val_loader, criterion, device):
    model.eval()
    val_loss = 0

    for data, target in val_loader:
        data, target = data.to(device), target.to(device)
        output = model(data)
        val_loss += criterion(output, target).item()

    return val_loss / len(val_loader)

# Technique 3: Set zero_grad(set_to_none=True)
# Faster and more memory-efficient than zero_grad()
optimizer.zero_grad(set_to_none=True)

# Technique 4: Use empty_cache() strategically
# Don't use too frequently (overhead), but helps between phases
torch.cuda.empty_cache()  # After validation, before training
```

## 性能分析

### 使用 PyTorch Profiler

```python
from torch.profiler import profile, record_function, ProfilerActivity

# Basic profiling
with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    for i in range(10):
        data, target = next(iter(train_loader))
        data, target = data.to(device), target.to(device)

        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

# Print results
print(prof.key_averages().table(
    sort_by="cuda_time_total",
    row_limit=10
))

# Export for TensorBoard
prof.export_chrome_trace("trace.json")

# Detailed profiling with record_function
with profile(activities=[ProfilerActivity.CUDA]) as prof:
    with record_function("data_loading"):
        data, target = next(iter(train_loader))
        data, target = data.to(device), target.to(device)

    with record_function("forward"):
        output = model(data)

    with record_function("loss"):
        loss = criterion(output, target)

    with record_function("backward"):
        loss.backward()

    with record_function("optimizer"):
        optimizer.step()

print(prof.key_averages().table(sort_by="cuda_time_total"))
```

### 高级性能分析

```python
# Profile with scheduling (warmup, active, skip)
from torch.profiler import schedule

# Skip first 5 batches, warmup 2 batches, profile 3 batches, repeat
my_schedule = schedule(
    skip_first=5,
    wait=1,
    warmup=2,
    active=3,
    repeat=2
)

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    schedule=my_schedule,
    on_trace_ready=torch.profiler.tensorboard_trace_handler('./log'),
    record_shapes=True,
    profile_memory=True,
    with_stack=True
) as prof:
    for step, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        prof.step()  # Signal end of step

# View in TensorBoard
# tensorboard --logdir=./log
```

### 显存分析

```python
# Profile memory usage
with profile(
    activities=[ProfilerActivity.CUDA],
    profile_memory=True,
    record_shapes=True
) as prof:
    for _ in range(10):
        data, target = next(iter(train_loader))
        data, target = data.to(device), target.to(device)

        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

# Show memory usage
print(prof.key_averages().table(
    sort_by="self_cuda_memory_usage",
    row_limit=10
))

# Find memory bottlenecks
memory_events = [
    event for event in prof.key_averages()
    if event.self_cuda_memory_usage > 0
]
memory_events.sort(key=lambda x: x.self_cuda_memory_usage, reverse=True)

for event in memory_events[:5]:
    print(f"{event.key}: {event.self_cuda_memory_usage / 1024**2:.2f} MB")
```

## 优化数据加载

### Pin Memory 与 Num Workers

```python
# Optimize DataLoader for GPU training
train_loader = DataLoader(
    dataset,
    batch_size=32,
    shuffle=True,
    num_workers=4,      # Parallel data loading (CPU cores)
    pin_memory=True,    # Faster transfer to GPU
    prefetch_factor=2,  # Prefetch batches per worker
    persistent_workers=True  # Keep workers alive
)

# Impact on performance:
# - num_workers: 0 (slow) → 4 (fast, diminishing returns after ~4-8)
# - pin_memory: False → True (~2x faster transfers)
# - prefetch_factor: 2-4 (balance memory vs speed)
```

### 数据加载基准测试

```python
import time

def benchmark_dataloader(loader, num_batches=100):
    """Measure data loading speed"""
    start = time.time()

    for i, (data, target) in enumerate(loader):
        if i >= num_batches:
            break

        # Simulate transfer to GPU
        data = data.to(device, non_blocking=True)
        target = target.to(device, non_blocking=True)

    elapsed = time.time() - start
    batches_per_sec = num_batches / elapsed

    print(f"Batches/sec: {batches_per_sec:.2f}")
    print(f"Time/batch: {elapsed/num_batches*1000:.2f} ms")

# Test different configurations
configs = [
    {'num_workers': 0, 'pin_memory': False},
    {'num_workers': 0, 'pin_memory': True},
    {'num_workers': 4, 'pin_memory': True},
    {'num_workers': 8, 'pin_memory': True},
]

for config in configs:
    loader = DataLoader(dataset, batch_size=32, **config)
    print(f"\nConfig: {config}")
    benchmark_dataloader(loader)
```

## 常见性能问题

### 问题 1：GPU 利用率低

```python
# Check GPU utilization
# nvidia-smi -l 1

# If GPU utilization < 80%:

# Cause 1: Data loading bottleneck
# Solution: Increase num_workers, use pin_memory

# Cause 2: Small batch size
# Solution: Increase batch size (if memory allows)

# Cause 3: CPU preprocessing too slow
# Solution: Move preprocessing to GPU or simplify

# Cause 4: Synchronization points
# Avoid .item(), .cpu() in training loop
bad_example = []
for data, target in train_loader:
    loss = train_step(data, target)
    bad_example.append(loss.item())  # Synchronization!

# Better: Accumulate on GPU, sync at end
good_example = []
for data, target in train_loader:
    loss = train_step(data, target)
    good_example.append(loss.detach())  # No sync

total_loss = torch.stack(good_example).mean().item()  # One sync
```

### 问题 2：显存碎片

```python
# Symptom: OOM errors despite low memory usage

# Solution 1: Empty cache periodically
if batch_idx % 100 == 0:
    torch.cuda.empty_cache()

# Solution 2: Preallocate tensors
class PreallocatedBuffer:
    def __init__(self, shape, device):
        self.buffer = torch.empty(shape, device=device)

    def get(self):
        return self.buffer

# Reuse buffer instead of allocating new tensors
buffer = PreallocatedBuffer((batch_size, *input_shape), device)

# Solution 3: Use memory pools (advanced)
torch.cuda.memory.set_per_process_memory_fraction(0.8, device=0)
```

### 问题 3：混合精度运行缓慢

```python
# Mixed precision should be faster, but sometimes isn't

# Check: Are Tensor Cores being used?
# Tensor Cores require specific dimensions (multiples of 8)

# Bad: Odd dimensions
model = nn.Linear(1001, 503)  # Won't use Tensor Cores efficiently

# Good: Multiple of 8
model = nn.Linear(1024, 512)  # Uses Tensor Cores

# Check hardware support
props = torch.cuda.get_device_properties(0)
if props.major >= 7:  # Volta or newer
    print("Tensor Cores supported")
else:
    print("No Tensor Cores - FP16 may not help")
```

## 实践练习

### 练习 1：GPU 训练循环

实现一个完整的、支持 GPU 的训练循环：

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# TODO: Implement training function
def train_model(model, train_loader, val_loader, epochs=10):
    """
    Train model with:
    - GPU support
    - Mixed precision
    - Memory tracking
    - Validation
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    # Your code here
    pass

# Test
model = nn.Sequential(
    nn.Linear(100, 256),
    nn.ReLU(),
    nn.Linear(256, 10)
)

# Create dummy data
X = torch.randn(1000, 100)
y = torch.randint(0, 10, (1000,))
dataset = TensorDataset(X, y)
train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

train_model(model, train_loader, train_loader)
```

### 练习 2：显存优化

```python
# TODO: Optimize this code to reduce memory usage
def memory_hungry_training(model, data_loader):
    optimizer = torch.optim.Adam(model.parameters())

    for data, target in data_loader:
        output = model(data)
        loss = F.cross_entropy(output, target)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

    # Hints:
    # - Use gradient accumulation
    # - Add memory tracking
    # - Use mixed precision
    # - Clear cache when needed
```

### 练习 3：性能分析与优化

```python
# TODO: Profile this code and identify bottlenecks
def slow_training_loop(model, data_loader, device):
    for data, target in data_loader:
        data = data.to(device)
        target = target.to(device)

        output = model(data)
        loss = F.cross_entropy(output, target)

        # Extract loss value (problematic!)
        loss_value = loss.item()

        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        print(f"Loss: {loss_value}")

# Use PyTorch Profiler to identify issues
# Then optimize the code
```

## 总结

本课学习了：

1. **GPU 数据传输：** 将张量与模型移动到 GPU，编写与设备无关的代码。
2. **混合精度：** 使用 AMP 进行 FP16/BF16 训练（原文示例加速 2–3 倍）。
3. **显存管理：** 监控、分析并优化 GPU 显存。
4. **性能分析：** 使用 PyTorch Profiler 查找瓶颈。
5. **数据加载：** 针对 GPU 训练优化 DataLoader。
6. **常见问题：** 识别并修复 GPU 性能问题。

## 核心要点

- 在支持的现代 GPU（Volta 及更新架构）上优先评估混合精度，争取加速收益。
- 使用 pin_memory 与 num_workers 提高数据加载效率。
- 避免训练循环中不必要的同步操作（例如 .item()、.cpu()）。
- **先分析，再优化**——使用 Profiler 找出真正的瓶颈。
- 显存资源宝贵——大模型可以使用梯度检查点技术。
- 批大小很重要——较大的批次可能提高 GPU 利用率。

## 延伸阅读

- [PyTorch CUDA 语义](https://pytorch.org/docs/stable/notes/cuda.html)
- [自动混合精度](https://pytorch.org/docs/stable/amp.html)
- [PyTorch Profiler](https://pytorch.org/tutorials/recipes/recipes/profiler_recipe.html)
- [性能调优指南](https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)

## 下一步

下一课 **分布式训练基础** 将探索如何使用 PyTorch 分布式训练能力，将训练扩展至多 GPU 与多台机器。

---

**准备扩展到多 GPU 了吗？接下来深入分布式训练。**

> 译注：较新 PyTorch 推荐使用 torch.amp.autocast 和 torch.amp.GradScaler，原文 torch.cuda.amp 接口存在弃用情况。混合精度并非无条件提速，必须验证数值稳定性、模型质量与硬件支持；BF16 与 FP16 的动态范围不同。DataLoader Worker 数量、锁页内存及批大小应通过实测选择。Gradient checkpointing 通常以额外重计算换取显存节省。原始代码块保持不变，未逐项执行。
