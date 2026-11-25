# 第 01 课：面向 AI 的 GPU 计算导论

## 学习目标

完成本课后，你将能够：

1. 解释 GPU 与 CPU 架构的根本区别。
2. 理解 GPU 为什么适合机器学习工作负载。
3. 判断不同 ML 任务应使用 GPU 还是 CPU。
4. 描述 GPU 内存层次结构及其对性能的影响。
5. 理解 CUDA Core、Tensor Core 及其在 ML 加速中的作用。

## 导论

图形处理器（GPU）已经成为现代 AI 基础设施的重要支柱。GPU 最初为图形渲染而设计，后来被证明非常适合机器学习所需的并行计算。理解 GPU 架构及其适用场景，是 AI 基础设施工程师的重要能力。

## CPU 与 GPU 架构

### CPU 架构

CPU 面向**顺序处理**与**低延迟操作**设计：

```
┌─────────────────────────────────────┐
│         CPU Architecture            │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Core1│ │Core2│ │Core3│ │Core4│  │
│  │     │ │     │ │     │ │     │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  Large L1/L2/L3 Cache              │
│  Complex Control Units              │
│  Out-of-order Execution            │
│  Branch Prediction                  │
└─────────────────────────────────────┘

Characteristics:
- 4-64 powerful cores (typically)
- High clock speeds (3-5 GHz)
- Large cache hierarchy
- Complex instruction sets
- Optimized for single-thread performance
```

### GPU 架构

GPU 面向**大规模并行计算**与**高吞吐量**设计：

```
┌──────────────────────────────────────────────────┐
│            GPU Architecture (Simplified)         │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   SM 1   │ │   SM 2   │ │  SM ...  │        │
│  │┌────────┐│ │┌────────┐│ │┌────────┐│        │
│  ││ 64-128 ││ ││ 64-128 ││ ││ 64-128 ││        │
│  ││  CUDA  ││ ││  CUDA  ││ ││  CUDA  ││        │
│  ││  Cores ││ ││  Cores ││ ││  Cores ││        │
│  │└────────┘│ │└────────┘│ │└────────┘│        │
│  │┌────────┐│ │┌────────┐│ │┌────────┐│        │
│  ││ Tensor ││ ││ Tensor ││ ││ Tensor ││        │
│  ││  Cores ││ ││  Cores ││ ││  Cores ││        │
│  │└────────┘│ │└────────┘│ │└────────┘│        │
│  │ Shared   │ │ Shared   │ │ Shared   │        │
│  │ Memory   │ │ Memory   │ │ Memory   │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│         Global Memory (VRAM) - 8-80GB           │
└──────────────────────────────────────────────────┘

Characteristics:
- Thousands of simpler cores (3,000-16,000+)
- Lower clock speeds (1-2 GHz)
- Smaller cache, larger VRAM
- SIMT (Single Instruction, Multiple Threads)
- Optimized for parallel throughput
```

### 关键架构差异

| 方面 | CPU | GPU |
|---|---|---|
| **核心** | 4–64 个高性能核心 | 数千至上万个较简单的计算核心 |
| **设计目标** | 尽量降低延迟 | 尽量提高吞吐量 |
| **缓存** | 较大（每核心 MB 级） | 较小（每 SM KB 级，原文简化描述） |
| **内存** | 系统 RAM（32–512GB） | 显存 VRAM（8–80GB） |
| **时钟频率** | 3–5GHz | 1–2GHz |
| **适用场景** | 串行任务、复杂逻辑 | 并行任务、简单运算 |
| **并行方式** | 任务级 | 数据级 |

## GPU 为什么擅长机器学习

### 1. 矩阵运算

机器学习中的许多核心计算都可以表示为矩阵运算：

```python
# Neural network forward pass (simplified)
def forward_pass(input, weights, bias):
    # Matrix multiplication - highly parallelizable
    output = input @ weights + bias
    return activation(output)

# Example: 1000x1000 matrix multiplication
# CPU: Processes row-by-row or column-by-column
# GPU: Computes thousands of elements simultaneously
```

**GPU 的优势：** 可以并行计算数千个矩阵元素。

### 2. SIMT 执行模型

GPU 使用 **Single Instruction, Multiple Threads（单指令多线程，SIMT）**：

```python
# Adding two arrays element-wise
a = [1, 2, 3, 4, 5, 6, 7, 8, ...]  # Million elements
b = [2, 3, 4, 5, 6, 7, 8, 9, ...]  # Million elements

# CPU approach (simplified)
for i in range(len(a)):
    c[i] = a[i] + b[i]  # Sequential

# GPU approach
# Launch thousands of threads, each handling one (or few) elements
# All threads execute: c[thread_id] = a[thread_id] + b[thread_id]
# Parallel execution!
```

### 3. 高内存带宽

```
Memory Bandwidth Comparison:

CPU (DDR4/DDR5):     50-100 GB/s
GPU (GDDR6/HBM2):    600-2,000 GB/s

For ML workloads that are memory-bound, this 10-20x
bandwidth advantage significantly accelerates training.
```

### 4. 专用硬件

现代 GPU 包含面向 ML 的专用单元及相关互连技术：

- **Tensor Core：** 加速矩阵乘加运算。
- **RT Core：** 光线追踪（与 ML 的直接相关性较低）。
- **NVLink：** 高速 GPU 间通信。

## NVIDIA GPU 架构

### 流式多处理器（Streaming Multiprocessor，SM）

SM 是 NVIDIA GPU 的基本构建单元：

```
Streaming Multiprocessor (SM)
┌────────────────────────────────────┐
│                                    │
│  CUDA Cores (64-128 per SM)       │
│  ┌───┐┌───┐┌───┐┌───┐...          │
│  │FP ││FP ││INT││INT│...          │
│  │32 ││32 ││32 ││32 │             │
│  └───┘└───┘└───┘└───┘             │
│                                    │
│  Tensor Cores (4-8 per SM)        │
│  ┌──────────┐┌──────────┐         │
│  │  TC 1    ││  TC 2    │         │
│  └──────────┘└──────────┘         │
│                                    │
│  Special Function Units (SFUs)     │
│  Load/Store Units (LD/ST)         │
│                                    │
│  Shared Memory / L1 Cache          │
│  (64-128 KB)                       │
│                                    │
│  Registers (64K 32-bit registers)  │
└────────────────────────────────────┘
```

### CUDA Core

**CUDA Core** 是基本计算单元：

- 执行浮点与整数运算（具体执行单元因架构而异）。
- 操作单个数值（标量）。
- 每块 GPU 包含数千个 CUDA Core。
- 以 Warp（32 个线程为一组）为单位并行工作。

```python
# Example: Each CUDA core processes one element
import torch

# Create tensors
a = torch.randn(1000000).cuda()  # Million elements
b = torch.randn(1000000).cuda()

# Element-wise operations utilize CUDA cores
c = a + b        # Addition
d = a * b        # Multiplication
e = torch.relu(a)  # Activation
```

### Tensor Core

**Tensor Core** 加速矩阵运算，首次引入于 Volta 架构：

- 执行混合精度矩阵乘加（MMA）运算。
- 在适用的运算中远快于普通 CUDA Core。
- 对现代深度学习十分重要。

```python
# Matrix multiplication benefits from Tensor Cores
# D = A × B + C

A = torch.randn(1024, 1024, dtype=torch.float16).cuda()
B = torch.randn(1024, 1024, dtype=torch.float16).cuda()
C = torch.randn(1024, 1024, dtype=torch.float16).cuda()

# This operation can utilize Tensor Cores
D = torch.mm(A, B) + C

# Tensor Cores provide:
# - Up to 8x speedup for FP16 operations
# - Support for mixed precision (FP16/BF16 compute, FP32 accumulate)
```

**性能比较：**

```
Operation: 1024x1024 Matrix Multiplication

CUDA Cores (FP32):  ~100 TFLOPS  (RTX 4090)
Tensor Cores (FP16): ~660 TFLOPS (RTX 4090)

6-7x speedup with Tensor Cores!
```

### GPU 内存层次结构

理解内存层次结构对于性能优化至关重要：

```
┌──────────────────────────────────────┐
│         Registers                    │  Fastest
│         (per thread)                 │  ~1 cycle
│         ~256 KB per SM               │
├──────────────────────────────────────┤
│      Shared Memory / L1 Cache        │  Very Fast
│         (per SM)                     │  ~10 cycles
│         64-128 KB                    │
├──────────────────────────────────────┤
│         L2 Cache                     │  Fast
│         (GPU-wide)                   │  ~100 cycles
│         40-96 MB                     │
├──────────────────────────────────────┤
│      Global Memory (VRAM)            │  Slow
│         (GPU-wide)                   │  ~400 cycles
│         8-80 GB                      │  Slowest
└──────────────────────────────────────┘
```

**内存访问模式：**

```python
# BAD: Uncoalesced memory access
for i in range(N):
    value = data[i * stride]  # Scattered access

# GOOD: Coalesced memory access
for i in range(N):
    value = data[i]  # Sequential access

# PyTorch handles this for you, but good to understand!
```

## GPU 世代与计算能力（Compute Capability）

NVIDIA GPU 按架构与计算能力进行分类。

### 近期架构（原文列举）

| 架构 | 年份 | 计算能力 | 代表 GPU | 主要特性 |
|---|---|---|---|---|
| **Hopper** | 2022 | 9.0 | H100 | 第四代 Tensor Core、Transformer Engine |
| **Ada Lovelace** | 2022 | 8.9 | RTX 4090 | 第四代 Tensor Core、DLSS 3 |
| **Ampere** | 2020 | 8.0、8.6 | A100、RTX 3090 | 第三代 Tensor Core、TF32 |
| **Turing** | 2018 | 7.5 | RTX 2080 Ti | 第二代 Tensor Core、RT Core |
| **Volta** | 2017 | 7.0 | V100 | 第一代 Tensor Core |
| **Pascal** | 2016 | 6.1 | GTX 1080 Ti | 无 Tensor Core |

### 计算能力的影响

```python
# Check GPU compute capability
import torch

if torch.cuda.is_available():
    device = torch.cuda.current_device()
    print(f"GPU: {torch.cuda.get_device_name(device)}")
    capability = torch.cuda.get_device_capability(device)
    print(f"Compute Capability: {capability[0]}.{capability[1]}")

    # Tensor Core support requires compute capability >= 7.0
    has_tensor_cores = capability[0] >= 7
    print(f"Tensor Cores: {'Yes' if has_tensor_cores else 'No'}")
```

**为什么重要：**
- 较老的 GPU 可能不支持某些功能（例如 Tensor Core）。
- 影响软件兼容性（CUDA 版本要求）。
- 不同 GPU 的性能特征存在显著差异。

## 何时使用 GPU，何时使用 CPU

### 适合使用 GPU 的情况

**训练深度神经网络**
- 大量矩阵运算。
- 大批大小。
- 卷积或 Transformer 架构。

```python
# Example: Training a neural network
model = LargeTransformer().cuda()  # Move to GPU
optimizer = torch.optim.AdamW(model.parameters())

for batch in dataloader:
    inputs, targets = batch
    inputs, targets = inputs.cuda(), targets.cuda()  # GPU

    outputs = model(inputs)  # GPU acceleration!
    loss = criterion(outputs, targets)
    loss.backward()  # GPU-accelerated backprop
    optimizer.step()
```

**大规模推理**
- 高吞吐量要求。
- 批处理。
- 使用批处理的实时推理。

**大规模数据处理**
- 图像处理管道。
- 视频处理。
- 大型矩阵运算。

**并行超参数搜索**
- 并行运行多个实验。
- 网格搜索或随机搜索。

### 适合考虑 CPU 的情况

**小型模型**
- GPU 数据传输开销可能超过计算收益。
- 简单模型，例如小数据集上的线性回归。

```python
# For small data, CPU might be faster!
small_data = torch.randn(100, 10)  # 100 samples, 10 features
model = torch.nn.Linear(10, 1)

# GPU overhead not worth it:
# - Data transfer to GPU
# - Kernel launch overhead
# - GPU underutilization
```

**单条或小批量推理**
- 低延迟要求。
- 无法进行请求批处理。
- GPU 数据传输开销过高。

**内存受限场景**
- 模型无法装入 GPU 显存。
- 数据无法装入 GPU 显存。
- CPU RAM 远大于 GPU VRAM（例如 256GB RAM 与 24GB VRAM）。

**顺序运算**
- 具有依赖关系的递归或循环运算。
- 无法有效并行化。

### 决策框架

```python
def should_use_gpu(model_size, batch_size, data_size, latency_requirement):
    """
    Simplified decision framework for GPU usage
    """
    # Rule 1: Model size
    if model_size > 100_000_000:  # 100M+ parameters
        return True  # Large models almost always benefit

    # Rule 2: Batch size
    if batch_size >= 32:
        return True  # Good GPU utilization

    # Rule 3: Training vs Inference
    if is_training:
        return True  # Training benefits from GPU

    # Rule 4: Latency requirements
    if latency_requirement < 10:  # ms
        # GPU might add overhead
        return batch_size > 8

    # Rule 5: Data size
    if data_size > 10_000:
        return True  # Amortize GPU overhead

    return False
```

## GPU 规格选型考虑因素

为 ML 工作负载选择 GPU 时，应考虑：

### 1. 显存容量（VRAM）

```
Model Size Requirements (rough estimates):

Small Models (BERT-base):       4-8 GB
Medium Models (GPT-2):          8-16 GB
Large Models (LLaMA-7B):        16-24 GB
Very Large (LLaMA-70B):         80-160 GB (multi-GPU)

Rule of thumb: Need ~4x model size for training
- Model parameters
- Gradients
- Optimizer states (AdamW: 2x parameters)
- Activations
```

### 2. 内存带宽

```
GPU Memory Bandwidth:

RTX 3090:      936 GB/s   (GDDR6X)
A100 (40GB):   1,555 GB/s (HBM2)
A100 (80GB):   2,039 GB/s (HBM2e)
H100:          3,350 GB/s (HBM3)

Higher bandwidth = faster data movement
Critical for large models and batch sizes
```

### 3. 计算性能

```
Tensor TFLOPS (FP16 with Tensor Cores):

RTX 4090:     ~660 TFLOPS
A100:         ~312 TFLOPS
H100:         ~990 TFLOPS

Note: Raw TFLOPS isn't everything!
- Memory bandwidth often more important
- Software optimization matters
- Batch size affects utilization
```

### 4. GPU 间通信

```
Multi-GPU Communication:

PCIe 4.0 x16:   ~32 GB/s (typical workstations)
NVLink 3.0:     ~600 GB/s (A100)
NVLink 4.0:     ~900 GB/s (H100)

NVLink provides 20-30x faster inter-GPU communication
Critical for multi-GPU training efficiency
```

### 5. 成本考虑

```
Price/Performance (approximate, 2024):

Consumer GPUs:
- RTX 4090:     $1,600  |  Best performance/$ for single GPU
- RTX 4080:     $1,200  |  Good balance
- RTX 3090:     $1,000  |  Previous gen, still capable

Data Center GPUs:
- A100 (40GB):  $10,000 |  Production workloads
- A100 (80GB):  $15,000 |  Large models
- H100:         $30,000 |  Cutting edge

Cloud Options (per hour):
- AWS p3.2xlarge (V100):   $3.06/hr
- AWS p4d.24xlarge (A100): $32.77/hr
- GCP a2-highgpu-1g (A100): $3.67/hr
```

## 检查 GPU 可用性

### 使用 nvidia-smi

```bash
# Check GPU information
nvidia-smi

# Output:
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 525.60.13    Driver Version: 525.60.13    CUDA Version: 12.0   |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
# | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
# |===============================+======================+======================|
# |   0  NVIDIA A100-SXM...  Off  | 00000000:00:04.0 Off |                    0 |
# | N/A   32C    P0    56W / 400W |      0MiB / 40960MiB |      0%      Default |
# +-------------------------------+----------------------+----------------------+

# Monitor GPU in real-time
watch -n 1 nvidia-smi

# Monitor specific metrics
nvidia-smi --query-gpu=timestamp,name,temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total --format=csv -l 1
```

### 使用 PyTorch

```python
import torch

# Check if CUDA is available
print(f"CUDA Available: {torch.cuda.is_available()}")

# Get number of GPUs
print(f"Number of GPUs: {torch.cuda.device_count()}")

# Get GPU names
for i in range(torch.cuda.device_count()):
    print(f"GPU {i}: {torch.cuda.get_device_name(i)}")

# Get current GPU properties
if torch.cuda.is_available():
    device = torch.device("cuda")
    props = torch.cuda.get_device_properties(0)

    print(f"\nGPU Properties:")
    print(f"  Name: {props.name}")
    print(f"  Compute Capability: {props.major}.{props.minor}")
    print(f"  Total Memory: {props.total_memory / 1024**3:.2f} GB")
    print(f"  Multi Processors: {props.multi_processor_count}")
    print(f"  CUDA Cores: ~{props.multi_processor_count * 128}")  # Approximate
```

### 使用 nvidia-ml-py

```python
import nvidia_smi

nvidia_smi.nvmlInit()

# Get GPU count
device_count = nvidia_smi.nvmlDeviceGetCount()
print(f"Number of GPUs: {device_count}")

# Get detailed info for each GPU
for i in range(device_count):
    handle = nvidia_smi.nvmlDeviceGetHandleByIndex(i)

    # GPU name
    name = nvidia_smi.nvmlDeviceGetName(handle)

    # Memory info
    mem_info = nvidia_smi.nvmlDeviceGetMemoryInfo(handle)

    # Utilization
    util = nvidia_smi.nvmlDeviceGetUtilizationRates(handle)

    # Temperature
    temp = nvidia_smi.nvmlDeviceGetTemperature(handle, 0)

    print(f"\nGPU {i}: {name}")
    print(f"  Memory: {mem_info.used / 1024**3:.2f} GB / {mem_info.total / 1024**3:.2f} GB")
    print(f"  GPU Utilization: {util.gpu}%")
    print(f"  Memory Utilization: {util.memory}%")
    print(f"  Temperature: {temp}°C")

nvidia_smi.nvmlShutdown()
```

## 常见 GPU 问题及解决方案

### 问题 1：CUDA 显存不足（OOM）

```python
# Problem:
RuntimeError: CUDA out of memory. Tried to allocate 2.00 GiB...

# Solutions:
# 1. Reduce batch size
batch_size = 16  # Instead of 32

# 2. Enable gradient checkpointing
model.gradient_checkpointing_enable()

# 3. Use mixed precision
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()
with autocast():
    outputs = model(inputs)
    loss = criterion(outputs, targets)

# 4. Clear cache
torch.cuda.empty_cache()

# 5. Use gradient accumulation
accumulation_steps = 4
for i, batch in enumerate(dataloader):
    loss = model(batch) / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

### 问题 2：GPU 利用率不足

```python
# Check GPU utilization
nvidia-smi

# If GPU utilization is low (<50%):

# Solution 1: Increase batch size
batch_size = 64  # Instead of 16

# Solution 2: Optimize data loading
train_loader = DataLoader(
    dataset,
    batch_size=32,
    num_workers=4,  # Parallel data loading
    pin_memory=True,  # Faster GPU transfer
    prefetch_factor=2  # Prefetch batches
)

# Solution 3: Profile to find bottlenecks
from torch.profiler import profile, ProfilerActivity

with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    for batch in train_loader:
        outputs = model(batch)
        loss.backward()
        optimizer.step()

print(prof.key_averages().table(sort_by="cuda_time_total"))
```

### 问题 3：数据传输缓慢

```python
# Problem: CPU-GPU transfer is slow

# Solution 1: Use pinned memory
train_loader = DataLoader(
    dataset,
    pin_memory=True  # Faster transfers
)

# Solution 2: Move data asynchronously
for batch in train_loader:
    inputs = inputs.cuda(non_blocking=True)
    targets = targets.cuda(non_blocking=True)

# Solution 3: Keep data on GPU when possible
# (for small datasets that fit in memory)
full_data = dataset.tensors[0].cuda()
full_labels = dataset.tensors[1].cuda()
```

## 实践练习

### 练习 1：GPU 基准测试

比较 CPU 与 GPU 性能：

```python
import torch
import time

def benchmark_matmul(device, size=1024, iterations=100):
    """Benchmark matrix multiplication"""
    A = torch.randn(size, size, device=device)
    B = torch.randn(size, size, device=device)

    # Warmup
    for _ in range(10):
        C = torch.mm(A, B)

    # Benchmark
    start = time.time()
    for _ in range(iterations):
        C = torch.mm(A, B)
        if device.type == 'cuda':
            torch.cuda.synchronize()  # Wait for GPU
    end = time.time()

    elapsed = end - start
    ops = 2 * size**3 * iterations  # FLOPs for matmul
    tflops = ops / elapsed / 1e12

    return elapsed, tflops

# TODO: Run benchmark on CPU
cpu_time, cpu_tflops = benchmark_matmul(torch.device('cpu'))
print(f"CPU: {cpu_time:.3f}s, {cpu_tflops:.2f} TFLOPS")

# TODO: Run benchmark on GPU
if torch.cuda.is_available():
    gpu_time, gpu_tflops = benchmark_matmul(torch.device('cuda'))
    print(f"GPU: {gpu_time:.3f}s, {gpu_tflops:.2f} TFLOPS")
    print(f"Speedup: {cpu_time / gpu_time:.2f}x")
else:
    print("CUDA not available")
```

### 练习 2：显存性能分析

监控 GPU 显存使用情况：

```python
import torch

def profile_memory():
    """Profile GPU memory usage"""
    if not torch.cuda.is_available():
        print("CUDA not available")
        return

    # TODO: Record initial memory
    initial = torch.cuda.memory_allocated() / 1024**3
    print(f"Initial memory: {initial:.3f} GB")

    # TODO: Create large tensor
    size = 1000
    tensor = torch.randn(size, size, size, device='cuda')

    allocated = torch.cuda.memory_allocated() / 1024**3
    reserved = torch.cuda.memory_reserved() / 1024**3

    print(f"After allocation:")
    print(f"  Allocated: {allocated:.3f} GB")
    print(f"  Reserved: {reserved:.3f} GB")

    # TODO: Delete tensor and clear cache
    del tensor
    torch.cuda.empty_cache()

    final = torch.cuda.memory_allocated() / 1024**3
    print(f"After cleanup: {final:.3f} GB")

profile_memory()
```

## 总结

本课学习了：

1. **GPU 架构：** GPU 具有大量面向并行运算优化的计算核心，而 CPU 具有数量相对较少的高性能核心。
2. **GPU 适合 ML 的原因：** 矩阵运算、SIMT 执行、高内存带宽及专用硬件（Tensor Core）。
3. **CUDA Core 与 Tensor Core：** 前者用于通用计算，后者用于加速矩阵运算。
4. **内存层次：** 寄存器 → 共享内存 → L2 缓存 → 全局内存（VRAM，原文简化示意）。
5. **GPU 适用场景：** 大模型、大批大小、训练、并行处理。
6. **CPU 适用场景：** 小模型、部分低延迟推理、内存受限场景。
7. **GPU 选型：** 考虑显存、内存带宽、计算性能及成本。

## 核心要点

- **GPU 对现代 ML 十分重要**，原文举例适用工作负载可实现 10–100 倍加速。
- **并非所有任务都能受益于 GPU**——理解工作负载特征。
- **内存往往是瓶颈**——显存容量与带宽非常重要。
- **Tensor Core** 可以显著加速 FP16/BF16 等矩阵运算。
- **GPU 利用率很重要**——低效代码会浪费昂贵的资源。

## 延伸阅读

- [NVIDIA CUDA 编程指南](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
- [NVIDIA GPU 架构白皮书](https://www.nvidia.com/en-us/data-center/resources/ai-inferencing-technical-overview/)
- [PyTorch CUDA 语义](https://pytorch.org/docs/stable/notes/cuda.html)
- [理解 GPU 内存](https://developer.nvidia.com/blog/unified-memory-cuda-beginners/)

## 下一步

下一课将深入 **CUDA 编程基础**，学习编写 GPU 代码，理解 PyTorch 在底层如何使用 CUDA。

---

**准备编写 GPU 代码了吗？接下来探索 CUDA 编程。**

> 译注：硬件规格与加速倍数为原文示例，架构表并非当前完整产品目录。CPU 同样支持多级并行，GPU 也有多级缓存；两者的核心数量不能直接等价比较。低延迟单请求也可能受益于 GPU，特别是大模型。FP16、BF16 等 Tensor Core 支持情况取决于架构。原始代码块保持不变，未逐项执行基准测试。
