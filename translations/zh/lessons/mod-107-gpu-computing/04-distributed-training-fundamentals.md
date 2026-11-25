# 第 04 课：分布式训练基础

## 学习目标

完成本课后，你将能够：

1. 理解分布式训练的必要性及使用时机。
2. 解释数据并行与模型并行策略。
3. 理解集合通信操作（AllReduce、Broadcast 等）。
4. 搭建 PyTorch 分布式训练基础环境。
5. 实现同步与异步训练。
6. 计算分布式训练效率并识别瓶颈。

## 导论

随着模型和数据集不断增大，单 GPU 训练可能不再可行。分布式训练允许我们：

- 训练无法装入单块 GPU 的更大模型。
- 利用多 GPU 或多台机器加速训练。
- 处理更大的批次。
- 加快实验迭代。

## 为什么需要分布式训练？

### 规模挑战

```
Model Size Growth:
┌─────────────────────────────────────────┐
│ GPT-2 (2019):     1.5B params  │  6 GB  │
│ GPT-3 (2020):     175B params  │ 700 GB │
│ PaLM (2022):      540B params  │ 2.2 TB │
│ GPT-4 (2023):     ~1.7T params │  ~7 TB │
└─────────────────────────────────────────┘

Single A100 GPU: 80 GB VRAM
→ Need distributed training!
```

### 缩短训练时间

```
Single GPU Training Time:
Model: BERT-Large on 1M samples
- 1x RTX 4090:  ~10 days
- 4x RTX 4090:  ~3 days   (3.3x speedup)
- 8x A100:      ~1 day    (10x speedup)
- 64x A100:     ~2 hours  (120x speedup)

Note: Speedup < N due to communication overhead
```

## 并行策略

### 数据并行（Data Parallelism）

将数据拆分到不同设备，每个设备复制模型：

```
┌──────────────────────────────────────────────────────┐
│              Data Parallelism                        │
│                                                      │
│  GPU 0:  Model Copy    GPU 1:  Model Copy           │
│          ┌────────┐             ┌────────┐          │
│          │ Model  │             │ Model  │          │
│          └────────┘             └────────┘          │
│             ↑ ↓                    ↑ ↓              │
│          Batch 1                Batch 2             │
│          [0-15]                 [16-31]             │
│                                                      │
│  After forward/backward:                            │
│  ┌────────────────────────────────────┐            │
│  │  Synchronize Gradients (AllReduce) │            │
│  └────────────────────────────────────┘            │
│                     ↓                               │
│  Both GPUs update with averaged gradients          │
└──────────────────────────────────────────────────────┘

Characteristics:
✓ Easy to implement
✓ Works for most models
✓ Linear scaling (ideally)
✗ Model must fit on single GPU
✗ Communication overhead
```

### 模型并行（Model Parallelism）

将模型拆分到不同设备，处理相同的数据：

```
┌──────────────────────────────────────────────────────┐
│             Model Parallelism                        │
│                                                      │
│  GPU 0:  Layers 1-5    GPU 1:  Layers 6-10          │
│          ┌────────┐             ┌────────┐          │
│          │Layer 1 │             │Layer 6 │          │
│          │Layer 2 │             │Layer 7 │          │
│          │Layer 3 │──Forward───▶│Layer 8 │          │
│          │Layer 4 │             │Layer 9 │          │
│          │Layer 5 │◀──Backward──│Layer 10│          │
│          └────────┘             └────────┘          │
│                                                      │
│  Same batch flows through both GPUs sequentially    │
└──────────────────────────────────────────────────────┘

Characteristics:
✓ Can train very large models
✓ Lower memory per GPU
✗ More complex to implement
✗ Sequential execution (GPU idle time)
✗ Requires careful pipeline design
```

### 流水线并行（Pipeline Parallelism）

将模型拆分为多个阶段，以流水线方式处理小批次：

```
┌──────────────────────────────────────────────────────┐
│           Pipeline Parallelism                       │
│                                                      │
│  Time →                                             │
│                                                      │
│  GPU 0 (Stage 1):  [B1] [B2] [B3] [B4]             │
│  GPU 1 (Stage 2):      [B1] [B2] [B3] [B4]         │
│  GPU 2 (Stage 3):          [B1] [B2] [B3] [B4]     │
│  GPU 3 (Stage 4):              [B1] [B2] [B3] [B4] │
│                                                      │
│  Better GPU utilization than naive model parallel   │
└──────────────────────────────────────────────────────┘

Characteristics:
✓ Better GPU utilization than model parallel
✓ Can train very large models
✗ Complex to implement
✗ "Bubble" overhead at start/end
✗ Requires careful batch splitting
```

### 混合并行（Hybrid Parallelism）

组合多种策略以优化性能：

```
┌──────────────────────────────────────────────────────┐
│        Hybrid: Data + Model Parallelism             │
│                                                      │
│  Data Parallel Replicas (across nodes)              │
│      │                         │                    │
│      ├─ Node 1 ────────────────├─ Node 2           │
│      │                         │                    │
│  Model Parallel (within node)                       │
│  GPU 0  GPU 1  GPU 2  GPU 3   GPU 4  GPU 5  ...   │
│  [L1-2] [L3-4] [L5-6] [L7-8]  [L1-2] [L3-4] ...   │
│                                                      │
│  Example: GPT-3 training uses this approach         │
└──────────────────────────────────────────────────────┘
```

## 集合通信（Collective Communication）

分布式训练依赖集合通信操作。

### AllReduce

将所有进程中的数值进行归约，并将结果分发给所有进程：

```
┌──────────────────────────────────────────────────────┐
│                   AllReduce                          │
│                                                      │
│  Before:                                            │
│  GPU 0: grad = [1, 2, 3]                           │
│  GPU 1: grad = [4, 5, 6]                           │
│  GPU 2: grad = [7, 8, 9]                           │
│                                                      │
│  After AllReduce (sum):                             │
│  GPU 0: grad = [12, 15, 18]                        │
│  GPU 1: grad = [12, 15, 18]                        │
│  GPU 2: grad = [12, 15, 18]                        │
│                                                      │
│  After averaging:                                   │
│  All GPUs: grad = [4, 5, 6]                        │
└──────────────────────────────────────────────────────┘

Most important operation for data parallelism!
```

### Ring AllReduce

高效的 AllReduce 实现方式：

```
┌──────────────────────────────────────────────────────┐
│              Ring AllReduce                          │
│                                                      │
│  GPUs arranged in ring topology:                    │
│  GPU 0 ↔ GPU 1 ↔ GPU 2 ↔ GPU 3 ↔ GPU 0            │
│                                                      │
│  Phase 1: Reduce-Scatter                            │
│    Each GPU receives partial sum from neighbor      │
│    2(N-1) messages total                            │
│                                                      │
│  Phase 2: AllGather                                 │
│    Each GPU shares complete result with neighbor    │
│    2(N-1) messages total                            │
│                                                      │
│  Total: 4(N-1) messages                             │
│  Bandwidth: O(1) per GPU (optimal!)                 │
└──────────────────────────────────────────────────────┘

Benefits:
- Bandwidth doesn't increase with GPU count
- Scales to many GPUs
- Used by PyTorch DDP
```

### 其他集合通信操作

```python
# Broadcast: Send from one process to all
# Before: GPU 0: [1,2,3]   GPU 1: [0,0,0]
# After:  GPU 0: [1,2,3]   GPU 1: [1,2,3]
dist.broadcast(tensor, src=0)

# Reduce: Combine from all to one
# Before: GPU 0: [1,2]  GPU 1: [3,4]
# After:  GPU 0: [4,6]  GPU 1: [3,4]  (unchanged)
dist.reduce(tensor, dst=0, op=dist.ReduceOp.SUM)

# AllGather: Gather from all, send to all
# Before: GPU 0: [1,2]  GPU 1: [3,4]
# After:  GPU 0: [1,2,3,4]  GPU 1: [1,2,3,4]
dist.all_gather(tensor_list, tensor)

# Scatter: Split from one to all
# Before: GPU 0: [1,2,3,4]
# After:  GPU 0: [1,2]  GPU 1: [3,4]
dist.scatter(tensor, scatter_list, src=0)

# Gather: Collect from all to one
# Before: GPU 0: [1,2]  GPU 1: [3,4]
# After:  GPU 0: [1,2,3,4]  GPU 1: [3,4]
dist.gather(tensor, gather_list, dst=0)
```

## PyTorch 分布式基础

### 进程组（Process Group）

```python
import torch.distributed as dist
import torch.multiprocessing as mp

def setup(rank, world_size):
    """Initialize distributed process group"""
    # Set environment variables
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'

    # Initialize process group
    dist.init_process_group(
        backend='nccl',  # NCCL for GPU, Gloo for CPU
        rank=rank,       # Process ID (0 to world_size-1)
        world_size=world_size  # Total number of processes
    )

def cleanup():
    """Cleanup distributed"""
    dist.destroy_process_group()

# Launch processes
def main(rank, world_size):
    setup(rank, world_size)

    # Your distributed code here
    print(f"Process {rank}/{world_size}")

    cleanup()

if __name__ == '__main__':
    world_size = 4  # 4 GPUs
    mp.spawn(
        main,
        args=(world_size,),
        nprocs=world_size,
        join=True
    )
```

### 分布式数据加载

```python
from torch.utils.data.distributed import DistributedSampler

def get_dataloader(rank, world_size, batch_size):
    """Create distributed dataloader"""
    # Create dataset
    dataset = YourDataset()

    # Create distributed sampler
    # Each process gets different subset of data
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True,
        drop_last=True
    )

    # Create dataloader
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=sampler,  # Use sampler instead of shuffle
        num_workers=4,
        pin_memory=True
    )

    return dataloader

# Important: Set epoch for sampler (shuffling)
for epoch in range(num_epochs):
    train_sampler.set_epoch(epoch)  # Ensure different shuffle each epoch

    for batch in train_loader:
        # Training code
        pass
```

## 同步训练与异步训练

### 同步训练（更常见）

```python
# All workers synchronize gradients after each batch
def synchronous_training_step(model, data, target):
    """Standard synchronous training"""
    output = model(data)
    loss = criterion(output, target)
    loss.backward()

    # Implicit synchronization via AllReduce
    # All workers wait for all gradients
    optimizer.step()
    optimizer.zero_grad()

# Characteristics:
# ✓ Deterministic (same as single GPU with larger batch)
# ✓ Better convergence
# ✗ Speed limited by slowest worker
# ✗ Stragglers cause delays
```

### 异步训练（相对少见）

```python
# Workers update independently without waiting
# Implemented with parameter servers

# Characteristics:
# ✓ No waiting for stragglers
# ✓ Higher throughput
# ✗ Stale gradients
# ✗ Worse convergence
# ✗ Complex implementation

# Rarely used in modern deep learning
# Synchronous SGD preferred due to better convergence
```

## 梯度同步策略

### 标准 DDP（默认）

```python
# Synchronize gradients after backward pass
loss.backward()  # Compute gradients
# ← AllReduce happens here (automatically)
optimizer.step()  # Update with synchronized gradients
```

### 梯度累积

```python
# Accumulate gradients over multiple batches
accumulation_steps = 4

for i, (data, target) in enumerate(train_loader):
    data, target = data.to(device), target.to(device)

    output = model(data)
    loss = criterion(output, target) / accumulation_steps
    loss.backward()  # Accumulate gradients

    if (i + 1) % accumulation_steps == 0:
        # Synchronize accumulated gradients
        optimizer.step()
        optimizer.zero_grad()

# Effective batch size = batch_size * accumulation_steps * world_size
# Useful when memory limited
```

### No Sync 上下文

```python
# Skip gradient synchronization for some steps
from torch.nn.parallel import DistributedDataParallel as DDP

model = DDP(model)

for i, (data, target) in enumerate(train_loader):
    # Skip sync for intermediate steps
    if i % accumulation_steps != 0:
        with model.no_sync():
            output = model(data)
            loss = criterion(output, target)
            loss.backward()  # No AllReduce
    else:
        # Sync on last step
        output = model(data)
        loss = criterion(output, target)
        loss.backward()  # AllReduce happens
        optimizer.step()
        optimizer.zero_grad()
```

## 分布式训练效率

### 线性扩展

理想加速比：使用 N 块 GPU 的训练速度是单 GPU 的 N 倍。

```python
# Linear scaling formula:
# Speedup = T_1GPU / T_NGPU

# Example:
# 1 GPU:  100 seconds/epoch
# 4 GPUs: 25 seconds/epoch
# Speedup: 100/25 = 4x (perfect linear scaling!)

# In practice:
# 4 GPUs: ~28 seconds/epoch
# Speedup: 100/28 = 3.57x (88% efficiency)

# Efficiency = Speedup / N
# Efficiency = 3.57 / 4 = 89%
```

### 影响扩展效率的因素

```
┌──────────────────────────────────────────────────────┐
│         What Affects Scaling Efficiency?            │
│                                                      │
│  Communication Overhead:                            │
│  - AllReduce time vs computation time              │
│  - Network bandwidth (NVLink > PCIe > Ethernet)    │
│  - Model size (larger = more gradients to sync)    │
│                                                      │
│  Load Imbalance:                                    │
│  - Uneven data distribution                        │
│  - Stragglers (slow workers)                       │
│  - Different GPU speeds                            │
│                                                      │
│  Batch Size Effects:                                │
│  - Too small: Overhead dominates                   │
│  - Too large: Convergence issues                   │
│  - Sweet spot: Balance efficiency and convergence  │
└──────────────────────────────────────────────────────┘
```

### 通信与计算之比

```python
def calculate_comm_comp_ratio(model, batch_size, world_size):
    """
    Estimate communication/computation ratio
    """
    # Gradient size (bytes)
    param_size = sum(p.numel() for p in model.parameters()) * 4  # FP32

    # Computation (FLOPs)
    # Rough estimate for transformer
    seq_len = 512
    hidden = 768
    flops = 6 * param_size * batch_size * seq_len

    # Communication (bytes)
    # AllReduce: 2(N-1)/N * param_size for Ring AllReduce
    comm_bytes = 2 * (world_size - 1) / world_size * param_size

    # Communication time (assuming 100 GB/s)
    bandwidth = 100e9  # bytes/sec
    comm_time = comm_bytes / bandwidth

    # Computation time (assuming 100 TFLOPS)
    compute_power = 100e12  # FLOPS
    comp_time = flops / compute_power

    ratio = comm_time / comp_time

    print(f"Communication time: {comm_time*1000:.2f} ms")
    print(f"Computation time: {comp_time*1000:.2f} ms")
    print(f"Comm/Comp ratio: {ratio:.2f}")

    if ratio > 0.1:
        print("⚠ Communication overhead is significant!")
    else:
        print("✓ Good compute/communication balance")

    return ratio
```

### 弱扩展与强扩展（Weak Scaling vs Strong Scaling）

```
Strong Scaling (fixed total workload):
┌────────────────────────────────────┐
│ 1 GPU:  1000 samples, 100s         │
│ 2 GPUs: 1000 samples,  50s (ideal) │
│ 4 GPUs: 1000 samples,  25s (ideal) │
└────────────────────────────────────┘
Each GPU processes fewer samples
Total batch size constant

Weak Scaling (fixed per-GPU workload):
┌────────────────────────────────────┐
│ 1 GPU:  1000 samples, 100s         │
│ 2 GPUs: 2000 samples, 100s (ideal) │
│ 4 GPUs: 4000 samples, 100s (ideal) │
└────────────────────────────────────┘
Each GPU processes same number of samples
Total batch size increases

ML typically uses weak scaling:
- Larger batch size with more GPUs
- Maintains GPU efficiency
- May need to adjust learning rate
```

## 实践示例：简单分布式训练

```python
import torch
import torch.distributed as dist
import torch.nn as nn
import torch.optim as optim
import torch.multiprocessing as mp
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler

def setup(rank, world_size):
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'
    dist.init_process_group("nccl", rank=rank, world_size=world_size)

def cleanup():
    dist.destroy_process_group()

def train(rank, world_size):
    print(f"Running on rank {rank}")
    setup(rank, world_size)

    # Create model and move to GPU
    model = nn.Linear(10, 10).to(rank)
    ddp_model = DDP(model, device_ids=[rank])

    # Create optimizer
    optimizer = optim.SGD(ddp_model.parameters(), lr=0.01)

    # Create distributed dataset
    dataset = torch.randn(1000, 10)
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank
    )
    loader = DataLoader(dataset, sampler=sampler, batch_size=32)

    # Training loop
    for epoch in range(10):
        sampler.set_epoch(epoch)  # Shuffle

        for batch in loader:
            batch = batch.to(rank)

            optimizer.zero_grad()
            output = ddp_model(batch)
            loss = output.sum()
            loss.backward()
            optimizer.step()

        # Only print from rank 0
        if rank == 0:
            print(f"Epoch {epoch}, Loss: {loss.item()}")

    cleanup()

if __name__ == '__main__':
    world_size = 4
    mp.spawn(train, args=(world_size,), nprocs=world_size, join=True)
```

## 调试分布式训练

### 常见问题

```python
# Issue 1: Hanging at init_process_group
# Cause: Firewall, wrong MASTER_ADDR/PORT
# Solution: Check network, verify environment variables

# Issue 2: NCCL timeout
# Cause: Slow network, unbalanced load
# Solution: Increase timeout
os.environ['NCCL_TIMEOUT'] = '1800'  # 30 minutes

# Issue 3: Different random seeds across processes
# Solution: Set seeds properly
def set_seed(seed, rank):
    torch.manual_seed(seed + rank)  # Different seed per rank
    np.random.seed(seed + rank)

# Issue 4: Incorrect batch size scaling
# Total batch size = per_gpu_batch_size * world_size
# Remember to adjust learning rate accordingly

# Issue 5: Non-deterministic behavior
# Cause: Non-deterministic CUDA operations
# Solution:
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False
```

### 调试工具

```python
# Enable verbose logging
os.environ['NCCL_DEBUG'] = 'INFO'

# Check process group initialization
if dist.is_initialized():
    print(f"Rank: {dist.get_rank()}")
    print(f"World size: {dist.get_world_size()}")

# Barrier for synchronization debugging
dist.barrier()  # All processes wait here
print(f"Rank {rank} passed barrier")

# Test collective operations
tensor = torch.tensor([rank], device='cuda')
dist.all_reduce(tensor, op=dist.ReduceOp.SUM)
print(f"Rank {rank}: AllReduce result = {tensor.item()}")
```

## 实践练习

### 练习 1：搭建分布式环境

```python
# TODO: Implement distributed setup
def setup_distributed(rank, world_size, backend='nccl'):
    """
    Initialize distributed environment
    - Set environment variables
    - Initialize process group
    - Set device
    """
    pass

# Test with 2 processes
mp.spawn(setup_distributed, args=(2,), nprocs=2)
```

### 练习 2：分布式训练循环

```python
# TODO: Complete distributed training function
def distributed_train(rank, world_size, epochs=10):
    """
    Implement complete distributed training:
    - Setup process group
    - Create DDP model
    - Create distributed dataloader
    - Training loop
    - Synchronization
    """
    pass
```

### 练习 3：测量扩展效率

```python
# TODO: Measure and compare training time
def benchmark_scaling(model, dataset, num_gpus_list):
    """
    Measure training time with different GPU counts
    Calculate and plot scaling efficiency
    """
    results = {}

    for num_gpus in num_gpus_list:
        start = time.time()
        # Train for 100 iterations
        elapsed = time.time() - start
        results[num_gpus] = elapsed

    # Calculate efficiency
    baseline = results[1]
    for num_gpus, elapsed in results.items():
        speedup = baseline / elapsed
        efficiency = speedup / num_gpus
        print(f"{num_gpus} GPUs: {speedup:.2f}x speedup, {efficiency*100:.1f}% efficiency")

# Test with 1, 2, 4, 8 GPUs
benchmark_scaling(model, dataset, [1, 2, 4, 8])
```

## 总结

本课学习了：

1. **并行策略：** 数据并行、模型并行、流水线并行。
2. **集合通信：** AllReduce、Broadcast、Gather、Scatter。
3. **PyTorch Distributed：** 进程组、分布式采样、DDP。
4. **同步：** 同步与异步训练、梯度累积。
5. **效率指标：** 线性扩展、通信开销、弱扩展与强扩展。
6. **调试：** 分布式训练常见问题与工具。

## 核心要点

- **数据并行最常见**——适合单 GPU 能够容纳完整训练状态的模型。
- **AllReduce 很重要**——实现高效梯度同步。
- **通信开销很重要**——使用高速互连（NVLink 等）。
- **扩展并非总是线性的**——原文以 80–90% 效率为例。
- **批大小扩展**——根据全局批大小调整学习率等训练配置。
- **DistributedSampler 十分重要**——将数据分配给不同进程。

## 延伸阅读

- [PyTorch Distributed 概览](https://pytorch.org/tutorials/beginner/dist_overview.html)
- [NCCL 文档](https://docs.nvidia.com/deeplearning/nccl/)
- [分布式训练最佳实践](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [Megatron-LM 论文](https://arxiv.org/abs/1909.08053)——大规模模型并行。

## 下一步

下一课 **多 GPU 训练策略** 将实现 DistributedDataParallel，优化单节点多 GPU 训练，并探索进阶优化技术。

---

**准备实现分布式训练了吗？接下来构建可扩展的训练管道。**

> 译注：扩展效率需根据相同工作量或相同单卡工作量分别测量，不能将原文 80–90% 视为保证。全局批大小变化可能影响收敛，学习率缩放需经过验证。DistributedSampler 在某些配置下会补齐样本，从而产生重复数据；每个 Epoch 应按需调用 set_epoch。DDP 的 no_sync 需要覆盖对应前向与反向过程。原始代码块及英文注释保持不变，未进行多 GPU 实测。
