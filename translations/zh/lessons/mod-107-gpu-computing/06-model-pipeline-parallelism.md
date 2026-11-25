# 第 06 课：模型并行与流水线并行

## 学习目标

完成本课后，你将能够：

1. 理解何时以及为什么使用模型并行。
2. 将模型层拆分至不同 GPU，实现简单的模型并行。
3. 理解流水线并行及其收益。
4. 针对大型模型层实现张量并行。
5. 使用 DeepSpeed 与 Megatron 等库实现高级并行。
6. 计算显存节省量并分析性能取舍。

## 导论

当模型过大、无法装入单块 GPU 时，仅依赖普通数据并行并不足够。模型并行技术将模型本身拆分到多个设备，使训练数千亿甚至万亿参数的模型成为可能。

## 何时使用模型并行

### 显存问题

```
Model Size Examples:
┌────────────────────────────────────────────┐
│ BERT-Base:         340M params   │   1.3 GB │
│ GPT-2:             1.5B params   │   6 GB   │
│ BERT-Large:        340M params   │   1.3 GB │
│ GPT-3 Small:       6.7B params   │  27 GB   │
│ GPT-3:             175B params   │ 700 GB   │
│ LLaMA-70B:         70B params    │ 280 GB   │
│ GPT-4:            ~1.7T params   │  ~7 TB   │
└────────────────────────────────────────────┘

A100 GPU: 80 GB VRAM
→ GPT-3 doesn't fit on single GPU!
→ Need model parallelism
```

### 决策框架

```python
def should_use_model_parallelism(model_size_gb, gpu_memory_gb, num_gpus):
    """
    Decide if model parallelism is needed

    During training, memory requirements:
    - Model parameters
    - Gradients (same size as parameters)
    - Optimizer states (2x parameters for Adam)
    - Activations (depends on batch size)

    Total ≈ 4x model size (without activations)
    """
    training_memory_needed = model_size_gb * 4

    # Can it fit with data parallelism?
    if training_memory_needed <= gpu_memory_gb:
        print("✓ Use data parallelism (model fits on single GPU)")
        return False

    # Need model parallelism
    memory_per_gpu = training_memory_needed / num_gpus

    if memory_per_gpu <= gpu_memory_gb:
        print("⚠ Need model parallelism (model too large for single GPU)")
        return True
    else:
        print("❌ Need more GPUs or reduce model/batch size")
        return True

# Example
should_use_model_parallelism(
    model_size_gb=70,  # 70GB model
    gpu_memory_gb=80,   # A100
    num_gpus=4
)
```

## 模型并行的类型

### 1. 朴素模型并行（逐层并行）

将模型层拆分到不同 GPU：

```python
import torch
import torch.nn as nn

class NaiveModelParallel(nn.Module):
    def __init__(self):
        super().__init__()
        # First half on GPU 0
        self.layer1 = nn.Linear(1000, 1000).to('cuda:0')
        self.layer2 = nn.Linear(1000, 1000).to('cuda:0')

        # Second half on GPU 1
        self.layer3 = nn.Linear(1000, 1000).to('cuda:1')
        self.layer4 = nn.Linear(1000, 10).to('cuda:1')

    def forward(self, x):
        # Start on GPU 0
        x = x.to('cuda:0')
        x = torch.relu(self.layer1(x))
        x = torch.relu(self.layer2(x))

        # Move to GPU 1
        x = x.to('cuda:1')
        x = torch.relu(self.layer3(x))
        x = self.layer4(x)

        return x

# Usage
model = NaiveModelParallel()
data = torch.randn(32, 1000)
output = model(data)  # Output on cuda:1
```

**执行流程：**

```
Time →
┌────────────────────────────────────────┐
│ GPU 0: [Layer1][Layer2][IDLE][IDLE]   │
│                    ↓                   │
│        Transfer data to GPU 1          │
│                    ↓                   │
│ GPU 1: [IDLE][IDLE][Layer3][Layer4]   │
└────────────────────────────────────────┘

Problem: GPUs are underutilized!
- GPU 0 idle while GPU 1 works
- GPU 1 idle while GPU 0 works
- Sequential execution (bubble)
```

### 2. 流水线并行

将模型拆分为多个阶段，以流水线方式处理小批次：

```
Micro-batching Pipeline:
Time →
┌──────────────────────────────────────────────┐
│ GPU 0: [B1][B2][B3][B4][B5]...               │
│                                               │
│ GPU 1:     [B1][B2][B3][B4][B5]...           │
│                                               │
│ GPU 2:         [B1][B2][B3][B4][B5]...       │
│                                               │
│ GPU 3:             [B1][B2][B3][B4][B5]...   │
└──────────────────────────────────────────────┘

Benefits:
✓ Better GPU utilization
✓ Pipeline different micro-batches
✓ Reduced bubble overhead

Challenges:
✗ Complex implementation
✗ Still has "bubble" at start/end
✗ Requires micro-batch management
```

### 3. 张量并行

将单个模型层或张量拆分到不同 GPU：

```
Matrix Multiplication: Y = XW

Column-wise split:
┌─────────────────────────────────────┐
│ GPU 0: Y₁ = X × W₁  (first half)   │
│ GPU 1: Y₂ = X × W₂  (second half)  │
│                                     │
│ Result: Y = [Y₁, Y₂]  (concatenate)│
└─────────────────────────────────────┘

Row-wise split:
┌─────────────────────────────────────┐
│ GPU 0: Y₁ = X₁ × W  (first half)   │
│ GPU 1: Y₂ = X₂ × W  (second half)  │
│                                     │
│ Result: Y = Y₁ + Y₂  (all-reduce)  │
└─────────────────────────────────────┘

Benefits:
✓ Fine-grained parallelism
✓ All GPUs work simultaneously
✓ Good for transformer layers

Challenges:
✗ Communication overhead
✗ Requires collective ops
✗ Complex to implement
```

## 实现流水线并行

### 使用微批次的简单流水线

```python
import torch
import torch.nn as nn
from torch.distributed import rpc

class PipelineParallelModel(nn.Module):
    def __init__(self, num_stages):
        super().__init__()
        self.num_stages = num_stages

        # Stage 0: Input layers (GPU 0)
        self.stage0 = nn.Sequential(
            nn.Linear(1000, 512),
            nn.ReLU(),
            nn.Linear(512, 512),
            nn.ReLU()
        ).cuda(0)

        # Stage 1: Middle layers (GPU 1)
        self.stage1 = nn.Sequential(
            nn.Linear(512, 512),
            nn.ReLU(),
            nn.Linear(512, 512),
            nn.ReLU()
        ).cuda(1)

        # Stage 2: Output layers (GPU 2)
        self.stage2 = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, 10)
        ).cuda(2)

    def forward(self, x, micro_batch_size):
        """Forward with micro-batching"""
        batch_size = x.size(0)
        num_micro_batches = batch_size // micro_batch_size

        outputs = []

        for i in range(num_micro_batches):
            start = i * micro_batch_size
            end = start + micro_batch_size

            # Micro-batch
            micro_batch = x[start:end]

            # Stage 0
            x0 = self.stage0(micro_batch.cuda(0))

            # Stage 1
            x1 = self.stage1(x0.cuda(1))

            # Stage 2
            x2 = self.stage2(x1.cuda(2))

            outputs.append(x2)

        return torch.cat(outputs, dim=0)

# Better: Use torch.distributed.pipeline
from torch.distributed.pipeline.sync import Pipe

# Define model
layers = nn.Sequential(
    nn.Linear(1000, 512), nn.ReLU(),
    nn.Linear(512, 512), nn.ReLU(),
    nn.Linear(512, 512), nn.ReLU(),
    nn.Linear(512, 10)
)

# Split across GPUs
model = Pipe(layers, chunks=8, checkpoint='never')
# Automatically pipelines with 8 micro-batches
```

### GPipe 风格的流水线

```python
class GPipeModel(nn.Module):
    """
    GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism
    https://arxiv.org/abs/1811.06965
    """
    def __init__(self, layers_per_stage, num_stages):
        super().__init__()
        self.stages = nn.ModuleList()

        for i in range(num_stages):
            stage = nn.Sequential(
                *[nn.Linear(512, 512), nn.ReLU()] * layers_per_stage
            )
            stage = stage.cuda(i)
            self.stages.append(stage)

    def forward(self, x, num_micro_batches=4):
        # Split into micro-batches
        micro_batches = torch.chunk(x, num_micro_batches, dim=0)

        # Pipeline execution
        outputs = []
        for micro_batch in micro_batches:
            # Forward through all stages
            activations = micro_batch
            for i, stage in enumerate(self.stages):
                activations = activations.cuda(i)
                activations = stage(activations)

            outputs.append(activations)

        return torch.cat(outputs, dim=0)
```

## 实现张量并行

### 按列并行

```python
import torch
import torch.nn as nn
import torch.distributed as dist

class ColumnParallelLinear(nn.Module):
    """
    Linear layer with column-wise parallelism

    Y = XW → Y = X[W₁|W₂] = [XW₁|XW₂]
    """
    def __init__(self, in_features, out_features, world_size, rank):
        super().__init__()
        self.world_size = world_size
        self.rank = rank

        # Each rank gets a portion of columns
        assert out_features % world_size == 0
        self.out_features_per_partition = out_features // world_size

        # Partition of weight matrix
        self.weight = nn.Parameter(
            torch.randn(in_features, self.out_features_per_partition)
        )

    def forward(self, x):
        # x is replicated across ranks
        # Each rank computes a portion of output
        output_parallel = torch.matmul(x, self.weight)

        # No communication needed - outputs are independent
        return output_parallel

class RowParallelLinear(nn.Module):
    """
    Linear layer with row-wise parallelism

    Y = XW → Y = [X₁|X₂]W = X₁W + X₂W (AllReduce)
    """
    def __init__(self, in_features, out_features, world_size, rank):
        super().__init__()
        self.world_size = world_size
        self.rank = rank

        # Each rank gets a portion of rows
        assert in_features % world_size == 0
        self.in_features_per_partition = in_features // world_size

        # Partition of weight matrix
        self.weight = nn.Parameter(
            torch.randn(self.in_features_per_partition, out_features)
        )

    def forward(self, x):
        # x is partitioned across ranks (each rank has portion)
        # Each rank computes partial output
        output_parallel = torch.matmul(x, self.weight)

        # AllReduce to get final output
        dist.all_reduce(output_parallel, op=dist.ReduceOp.SUM)

        return output_parallel
```

### Megatron 风格的 Transformer 并行

```python
class ParallelAttention(nn.Module):
    """
    Tensor parallel attention from Megatron-LM
    """
    def __init__(self, hidden_size, num_heads, world_size, rank):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = hidden_size // num_heads
        self.world_size = world_size
        self.rank = rank

        # QKV projection - column parallel
        # Each GPU computes subset of attention heads
        self.qkv_proj = ColumnParallelLinear(
            hidden_size,
            3 * hidden_size,
            world_size,
            rank
        )

        # Output projection - row parallel
        # Reduces results across GPUs
        self.out_proj = RowParallelLinear(
            hidden_size,
            hidden_size,
            world_size,
            rank
        )

    def forward(self, x):
        batch_size, seq_len, hidden_size = x.shape

        # QKV projection (column parallel)
        qkv = self.qkv_proj(x)

        # Split into Q, K, V (each GPU has subset of heads)
        q, k, v = torch.chunk(qkv, 3, dim=-1)

        # Attention computation (independent per head)
        attention_output = self.compute_attention(q, k, v)

        # Output projection (row parallel with AllReduce)
        output = self.out_proj(attention_output)

        return output

    def compute_attention(self, q, k, v):
        # Standard attention math
        # Each GPU computes attention for its subset of heads
        scores = torch.matmul(q, k.transpose(-2, -1))
        scores = scores / (self.head_dim ** 0.5)
        attn_weights = torch.softmax(scores, dim=-1)
        output = torch.matmul(attn_weights, v)
        return output
```

## 使用 DeepSpeed 实现模型并行

### DeepSpeed ZeRO

ZeRO（Zero Redundancy Optimizer，零冗余优化器）对优化器状态、梯度和参数进行分片：

```python
import deepspeed

# DeepSpeed configuration
ds_config = {
    "train_batch_size": 32,
    "optimizer": {
        "type": "Adam",
        "params": {
            "lr": 0.001
        }
    },
    "zero_optimization": {
        "stage": 3,  # Partition optimizer states, gradients, and parameters
        "offload_optimizer": {
            "device": "cpu"  # Offload to CPU
        },
        "offload_param": {
            "device": "cpu"
        }
    },
    "fp16": {
        "enabled": True
    }
}

# Initialize DeepSpeed
model_engine, optimizer, train_loader, _ = deepspeed.initialize(
    model=model,
    model_parameters=model.parameters(),
    config=ds_config,
    training_data=train_dataset
)

# Training loop
for batch in train_loader:
    data, target = batch
    output = model_engine(data)
    loss = criterion(output, target)

    model_engine.backward(loss)
    model_engine.step()
```

**ZeRO 的各个阶段：**

```
┌──────────────────────────────────────────────────────┐
│              DeepSpeed ZeRO Stages                   │
│                                                      │
│ Stage 0 (Disabled):                                 │
│   No partitioning, standard DDP                     │
│                                                      │
│ Stage 1 (Optimizer States):                         │
│   Partition optimizer states across GPUs            │
│   Memory reduction: 4x                              │
│                                                      │
│ Stage 2 (+ Gradients):                              │
│   Partition gradients across GPUs                   │
│   Memory reduction: 8x                              │
│                                                      │
│ Stage 3 (+ Parameters):                             │
│   Partition model parameters across GPUs            │
│   Memory reduction: N (linear with GPUs)            │
│   Can train models N times larger!                  │
└──────────────────────────────────────────────────────┘
```

### DeepSpeed 流水线并行

```python
from deepspeed.pipe import PipelineModule, LayerSpec

# Define model as pipeline stages
layers = [
    LayerSpec(nn.Linear, 1000, 512),
    LayerSpec(nn.ReLU),
    LayerSpec(nn.Linear, 512, 512),
    LayerSpec(nn.ReLU),
    LayerSpec(nn.Linear, 512, 10)
]

# Create pipeline
model = PipelineModule(
    layers=layers,
    num_stages=4,  # Number of GPUs
    loss_fn=nn.CrossEntropyLoss()
)

# DeepSpeed config for pipeline
ds_config = {
    "train_batch_size": 32,
    "train_micro_batch_size_per_gpu": 8,
    "pipeline": {
        "pipe_partitioned": True,
        "grad_partitioned": True
    }
}

# Initialize
model_engine, optimizer, train_loader, _ = deepspeed.initialize(
    model=model,
    config=ds_config
)
```

## 显存节省量计算

```python
def calculate_memory_savings(
    num_params,
    num_gpus,
    use_zero_stage=0,
    use_amp=False,
    use_gradient_checkpointing=False
):
    """
    Calculate memory savings from various techniques

    Args:
        num_params: Number of model parameters
        num_gpus: Number of GPUs
        use_zero_stage: 0, 1, 2, or 3
        use_amp: Mixed precision training
        use_gradient_checkpointing: Activation checkpointing
    """
    bytes_per_param = 2 if use_amp else 4  # FP16 vs FP32

    # Base memory (single GPU, no optimizations)
    model_memory = num_params * bytes_per_param
    gradient_memory = num_params * bytes_per_param
    optimizer_memory = num_params * bytes_per_param * 2  # Adam states

    base_memory = model_memory + gradient_memory + optimizer_memory

    # With optimizations
    if use_zero_stage == 0:
        # Standard DDP - full replication
        final_memory = base_memory
    elif use_zero_stage == 1:
        # Partition optimizer states
        final_memory = model_memory + gradient_memory + (optimizer_memory / num_gpus)
    elif use_zero_stage == 2:
        # Partition gradients + optimizer
        final_memory = model_memory + (gradient_memory / num_gpus) + (optimizer_memory / num_gpus)
    elif use_zero_stage == 3:
        # Partition everything
        final_memory = (model_memory / num_gpus) + (gradient_memory / num_gpus) + (optimizer_memory / num_gpus)

    # Gradient checkpointing saves activation memory (not counted here)
    # but reduces memory by ~sqrt(num_layers) factor

    savings_ratio = base_memory / final_memory

    print(f"Base memory: {base_memory / 1024**3:.2f} GB")
    print(f"Optimized memory: {final_memory / 1024**3:.2f} GB")
    print(f"Savings: {savings_ratio:.2f}x")
    print(f"Can train model {savings_ratio:.1f}x larger!")

    return final_memory

# Example: 7B parameter model
calculate_memory_savings(
    num_params=7_000_000_000,
    num_gpus=8,
    use_zero_stage=3,
    use_amp=True,
    use_gradient_checkpointing=True
)
```

## 性能取舍

```
┌──────────────────────────────────────────────────────┐
│          Model Parallelism Trade-offs                │
│                                                      │
│ Naive Model Parallel:                                │
│   Memory: ✓✓✓ (N-way reduction)                    │
│   Speed:  ✗✗✗ (sequential, low utilization)        │
│                                                      │
│ Pipeline Parallel:                                   │
│   Memory: ✓✓ (N-way reduction)                     │
│   Speed:  ✓ (better utilization, bubble overhead)  │
│                                                      │
│ Tensor Parallel:                                     │
│   Memory: ✓ (per-layer reduction)                  │
│   Speed:  ✓✓ (good utilization, communication)    │
│                                                      │
│ ZeRO Stage 3:                                        │
│   Memory: ✓✓✓ (N-way reduction)                    │
│   Speed:  ✓ (communication overhead)               │
│                                                      │
│ Hybrid (Pipeline + Tensor + Data):                  │
│   Memory: ✓✓✓ (best)                               │
│   Speed:  ✓✓ (complex but effective)              │
└──────────────────────────────────────────────────────┘
```

## 实践练习

### 练习 1：实现朴素模型并行

```python
# TODO: Split this model across 2 GPUs
class LargeModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(1000, 1000), nn.ReLU(),
            nn.Linear(1000, 1000), nn.ReLU(),
            nn.Linear(1000, 1000), nn.ReLU(),
            nn.Linear(1000, 1000), nn.ReLU(),
            nn.Linear(1000, 10)
        )

# Implement model parallel version
# - Split layers across GPUs
# - Handle data movement
# - Measure GPU utilization
```

### 练习 2：比较显存使用情况

```python
# TODO: Measure memory usage with different techniques
def compare_memory_techniques():
    """
    Measure peak memory with:
    - Standard training
    - Gradient checkpointing
    - Mixed precision
    - ZeRO Stage 2
    - ZeRO Stage 3
    """
    pass
```

### 练习 3：实现简单流水线

```python
# TODO: Implement micro-batch pipeline
def pipeline_forward(model_stages, data, micro_batch_size):
    """
    Implement pipelined forward pass:
    - Split data into micro-batches
    - Pipeline through stages
    - Collect outputs
    """
    pass
```

## 总结

本课学习了：

1. **适用时机：** 模型过大、无法装入单块 GPU 时使用模型并行。
2. **类型：** 朴素并行（逐层）、流水线并行、张量并行。
3. **流水线并行：** 使用微批次提高 GPU 利用率。
4. **张量并行：** 按列或按行拆分，实现细粒度并行。
5. **DeepSpeed ZeRO：** 分片优化器状态、梯度与参数。
6. **显存节省：** 计算并优化显存使用。
7. **取舍：** 显存、速度与复杂度之间的平衡。

## 核心要点

- **模型并行** 支持训练无法装入单块 GPU 的大型模型。
- **流水线并行** 改善朴素模型并行的效率，但存在流水线气泡开销。
- **张量并行** 提供细粒度并行能力，同时引入通信成本。
- **DeepSpeed ZeRO** 是实现大规模训练状态分片的常用方案。
- **混合并行**（数据并行、模型并行、流水线并行）可以支持更大规模模型。
- 显存资源昂贵，需要针对生产负载进行优化。

## 延伸阅读

- [Megatron-LM 论文](https://arxiv.org/abs/1909.08053)——Transformer 张量并行。
- [GPipe 论文](https://arxiv.org/abs/1811.06965)——流水线并行。
- [DeepSpeed ZeRO](https://arxiv.org/abs/1910.02054)——零冗余优化器。
- [PyTorch 流水线并行](https://pytorch.org/docs/stable/pipeline.html)

## 下一步

下一课 **GPU 显存管理与优化** 将深入显存优化技术、性能分析工具以及 OOM 错误排查。

---

**准备优化显存使用了吗？接下来掌握 GPU 显存管理。**

> 译注：ZeRO 本质上是对数据并行训练状态进行分片，与传统逐层模型并行及张量并行不同。不同 ZeRO Stage 的分片范围、通信与峰值显存不同；不能简单将所有显存需求除以 GPU 数量。流水线气泡及张量通信开销取决于微批次数、调度方式、层划分及互连拓扑。PyTorch 流水线并行接口与 DeepSpeed API 存在版本差异，原文代码块及注释保留，未实际执行。
