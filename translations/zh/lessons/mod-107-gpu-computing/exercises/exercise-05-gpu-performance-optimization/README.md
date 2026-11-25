# 练习 05：GPU 性能优化与性能分析

**预计时长：** 32–40 小时。

## 业务背景

ML 团队每月花费 18 万美元用于模型训练的 GPU 计算。近期性能分析表明：
- 平均 GPU 利用率：45%（目标超过 80%）。
- 训练吞吐量：每秒 2,400 个样本（预期超过 5,000）。
- 显存利用率：可用显存的 60%。
- 多 GPU 扩展效率：65%（目标超过 90%）。

工程副总裁要求你**优化 GPU 性能，将训练时间缩短 50%**，并每月减少 9 万美元云费用。你需要构建综合 GPU 性能分析与优化框架。

## 学习目标

完成本练习后，你将能够：

1. 使用 NVIDIA Nsight Systems、Nsight Compute 与 PyTorch Profiler 分析 GPU 工作负载。
2. 识别并修复 GPU 性能瓶颈（Kernel 效率、显存带宽、数据加载）。
3. 优化 CUDA Kernel 与混合精度训练。
4. 使用高效通信模式实现多 GPU 数据并行。
5. 应用高级显存优化（梯度检查点、激活值卸载、固定内存）。
6. 设计自动化性能回归检测系统。

## 前置条件

- Module 107 练习 04（GPU 集群管理）。
- 理解深度学习训练循环。
- 基本熟悉 PyTorch 或 TensorFlow。
- 熟练使用 Linux 命令行。
- Python 编程（高级）。

## 问题描述

构建 **GPU 性能优化框架**，具备以下能力：

1. **分析 GPU 工作负载**，识别瓶颈。
2. **依据性能分析数据推荐优化。**
3. **自动修复常见性能问题。**
4. **通过 A/B 测试验证改进。**
5. **在 CI/CD 流水线中检测性能回归。**

### 成功指标

- 训练吞吐量增加超过 100%（每秒 2,400 → 5,000 个以上样本）。
- GPU 利用率提高至 85% 以上。
- 2–8 块 GPU 的扩展效率超过 90%。
- 显存利用率优化至 80% 以上且不发生 OOM。
- 自动检测超过 5% 的性能回归。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                   Performance Optimization System            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Profile Collector│      │  Bottleneck      │            │
│  │  - Nsight Systems │─────▶│  Analyzer        │            │
│  │  - Nsight Compute │      │  - Kernel time   │            │
│  │  - PyTorch Profile│      │  - Memory BW     │            │
│  │  - DCGM metrics   │      │  - Data loading  │            │
│  └──────────────────┘      └──────────────────┘            │
│           │                          │                       │
│           │                          ▼                       │
│           │                 ┌──────────────────┐            │
│           │                 │  Optimization    │            │
│           │                 │  Recommender     │            │
│           │                 │  - Mixed prec.   │            │
│           │                 │  - Kernel fusion │            │
│           │                 │  - Memory opts   │            │
│           │                 └──────────────────┘            │
│           │                          │                       │
│           ▼                          ▼                       │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Automated       │      │  Performance     │            │
│  │  Optimizer       │◀─────│  Validator       │            │
│  │  - Auto mixed    │      │  - A/B testing   │            │
│  │  - Gradient ckpt │      │  - Regression    │            │
│  │  - Data prefetch │      │    detection     │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 实现任务

### 第一部分：GPU 性能分析框架（8–10 小时）

构建从多个来源采集性能数据的综合分析系统。

#### 1.1 性能数据采集器

创建 `src/profiling/profile_collector.py`：

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
import subprocess
import json
from pathlib import Path

class ProfilerType(Enum):
    NSIGHT_SYSTEMS = "nsys"
    NSIGHT_COMPUTE = "ncu"
    PYTORCH_PROFILER = "pytorch"
    DCGM = "dcgm"

@dataclass
class ProfileResult:
    profiler_type: ProfilerType
    profile_path: str
    summary: Dict
    recommendations: List[str]

class NsightSystemsProfiler:
    """
    Profile entire application using NVIDIA Nsight Systems.
    Identifies high-level bottlenecks: kernels, data transfers, CPU overhead.
    """

    def profile(
        self,
        command: str,
        output_path: str,
        duration: Optional[int] = None
    ) -> ProfileResult:
        """
        TODO: Run nsys profile command
        - Execute: nsys profile -o {output_path} --stats=true {command}
        - Capture CUDA kernel times, memory transfers, CPU activity
        - Parse output report (JSON format)
        - Extract key metrics:
          - Total kernel time (should be >80% of GPU time)
          - Memory transfer time (should be <10%)
          - CPU overhead (gaps between kernel launches)

        Example output to parse:
        {
            "cuda_kernels": [
                {"name": "volta_sgemm", "time_ns": 1234567, "grid": [128, 1, 1]}
            ],
            "cuda_memory": [
                {"type": "HtoD", "size_bytes": 4096, "time_ns": 500}
            ]
        }
        """
        pass

    def analyze_timeline(self, profile_path: str) -> Dict:
        """
        TODO: Analyze timeline for common issues
        - GPU idle periods (gaps between kernels >1ms)
        - CPU-GPU synchronization points (cudaDeviceSynchronize)
        - Memory transfer overlaps with compute
        - Return bottleneck report:
          {
              "gpu_idle_time_ms": 150,
              "sync_overhead_ms": 45,
              "memory_transfer_concurrent": True/False
          }
        """
        pass

class NsightComputeProfiler:
    """
    Profile individual CUDA kernels using NVIDIA Nsight Compute.
    Provides detailed metrics: SM efficiency, memory bandwidth, occupancy.
    """

    def profile_kernel(
        self,
        command: str,
        kernel_name: str,
        output_path: str
    ) -> ProfileResult:
        """
        TODO: Profile specific kernel with detailed metrics
        - Execute: ncu --kernel-name {kernel_name} -o {output_path} {command}
        - Collect metrics:
          - SM efficiency (should be >80%)
          - Memory bandwidth utilization (should be >60% of peak)
          - Achieved occupancy (should be >50%)
          - Warp execution efficiency
          - Register/shared memory usage

        Key metrics to extract:
        - sm__throughput.avg.pct_of_peak_sustained_elapsed
        - dram__throughput.avg.pct_of_peak_sustained_elapsed
        - sm__warps_active.avg.pct_of_peak_sustained_active
        """
        pass

    def identify_bottlenecks(self, profile_result: ProfileResult) -> List[str]:
        """
        TODO: Identify kernel-level bottlenecks
        - If SM efficiency <60%: "Compute bound - optimize algorithm"
        - If memory BW >80% but SM <60%: "Memory bound - reduce memory access"
        - If occupancy <30%: "Low occupancy - reduce register usage or increase blocks"
        - If warp efficiency <80%: "Branch divergence - reduce conditional code"
        """
        pass

class PyTorchProfiler:
    """
    Profile PyTorch training loops with operator-level granularity.
    """

    def profile_training_step(
        self,
        model,
        data_loader,
        num_steps: int = 10,
        output_path: str = "./pytorch_profile"
    ) -> ProfileResult:
        """
        TODO: Profile PyTorch training using torch.profiler

        import torch.profiler as profiler

        with profiler.profile(
            activities=[
                profiler.ProfilerActivity.CPU,
                profiler.ProfilerActivity.CUDA,
            ],
            schedule=profiler.schedule(wait=1, warmup=1, active=3, repeat=2),
            on_trace_ready=profiler.tensorboard_trace_handler(output_path),
            record_shapes=True,
            profile_memory=True,
            with_stack=True
        ) as prof:
            for step, batch in enumerate(data_loader):
                if step >= num_steps:
                    break

                # TODO: Run training step
                outputs = model(batch['input'])
                loss = criterion(outputs, batch['target'])
                loss.backward()
                optimizer.step()
                optimizer.zero_grad()

                prof.step()

        # TODO: Parse profiler output
        # Extract top 10 time-consuming operations
        # Identify data loading bottlenecks (CPU time while GPU idle)
        # Memory allocation overhead
        """
        pass

    def analyze_operator_breakdown(self, profile_path: str) -> Dict:
        """
        TODO: Analyze which PyTorch operators consume most time
        - Group by operation type (conv2d, matmul, activation, etc.)
        - Calculate % of total training time
        - Identify optimization opportunities:
          - Can operations be fused? (e.g., conv + bn + relu)
          - Are there unnecessary data copies?
          - Is autocast (mixed precision) being used?
        """
        pass

class ProfileCollector:
    """Main interface for collecting all profiling data."""

    def __init__(self):
        self.nsys_profiler = NsightSystemsProfiler()
        self.ncu_profiler = NsightComputeProfiler()
        self.pytorch_profiler = PyTorchProfiler()

    def profile_comprehensive(
        self,
        command: str,
        output_dir: str,
        include_kernel_details: bool = True
    ) -> Dict[ProfilerType, ProfileResult]:
        """
        TODO: Run all profilers and collect results
        1. Nsight Systems for high-level timeline
        2. Nsight Compute for top 5 kernels (if include_kernel_details)
        3. PyTorch Profiler for operator breakdown

        Return consolidated report with all findings
        """
        pass
```

#### 1.2 测试要求

创建 `tests/test_profiling.py`：

```python
def test_nsight_systems_profiling():
    """Test that Nsight Systems captures kernel times correctly."""
    # TODO: Run simple CUDA program and verify profiling works
    pass

def test_pytorch_profiler_integration():
    """Test PyTorch profiler with dummy model."""
    # TODO: Profile simple model training and verify output
    pass
```

### 第二部分：瓶颈分析引擎（7–9 小时）

构建自动化系统，分析性能数据并识别性能问题。

#### 2.1 瓶颈分析器

创建 `src/analysis/bottleneck_analyzer.py`：

```python
from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class BottleneckType(Enum):
    KERNEL_EFFICIENCY = "kernel_efficiency"
    MEMORY_BANDWIDTH = "memory_bandwidth"
    DATA_LOADING = "data_loading"
    CPU_GPU_SYNC = "cpu_gpu_sync"
    MULTI_GPU_COMM = "multi_gpu_comm"
    MEMORY_ALLOCATION = "memory_allocation"

@dataclass
class Bottleneck:
    type: BottleneckType
    severity: float  # 0-1, where 1 is critical
    description: str
    evidence: Dict
    recommendations: List[str]

class KernelAnalyzer:
    """Analyze CUDA kernel performance."""

    THRESHOLDS = {
        'sm_efficiency_min': 60.0,      # SM efficiency should be >60%
        'memory_bw_utilization_min': 60.0,  # Memory BW should be >60%
        'occupancy_min': 30.0,          # Occupancy should be >30%
        'warp_efficiency_min': 80.0     # Warp efficiency should be >80%
    }

    def analyze(self, kernel_metrics: Dict) -> List[Bottleneck]:
        """
        TODO: Analyze kernel performance metrics

        Check each metric against thresholds:
        1. SM Efficiency:
           - <40%: Critical - kernel is severely underutilizing GPU
           - 40-60%: Warning - room for optimization
           - >60%: Good

        2. Memory Bandwidth:
           - >80% with low SM efficiency: Memory bound
           - Recommend: reduce memory access, use shared memory, coalesce access

        3. Occupancy:
           - <30%: Too few threads per SM
           - Recommend: increase block size, reduce register usage

        4. Warp Efficiency:
           - <80%: Branch divergence or uncoalesced memory access
           - Recommend: remove conditionals, align memory access

        Return list of Bottleneck objects with specific recommendations
        """
        bottlenecks = []

        # TODO: Implement threshold checks
        sm_efficiency = kernel_metrics.get('sm_efficiency', 0)
        if sm_efficiency < self.THRESHOLDS['sm_efficiency_min']:
            severity = 1.0 - (sm_efficiency / 100.0)
            bottlenecks.append(Bottleneck(
                type=BottleneckType.KERNEL_EFFICIENCY,
                severity=severity,
                description=f"Low SM efficiency: {sm_efficiency:.1f}%",
                evidence={'sm_efficiency': sm_efficiency},
                recommendations=[
                    "Profile with Nsight Compute to identify compute bottlenecks",
                    "Consider kernel fusion to reduce launch overhead",
                    "Optimize algorithm for better parallelism"
                ]
            ))

        # TODO: Add similar checks for memory BW, occupancy, warp efficiency

        return bottlenecks

class DataLoadingAnalyzer:
    """Analyze data loading pipeline performance."""

    def analyze(self, timeline_data: Dict) -> List[Bottleneck]:
        """
        TODO: Detect data loading bottlenecks

        Look for patterns:
        1. GPU idle while CPU prepares next batch:
           - Evidence: Gaps >5ms between kernel launches
           - Recommendation: Increase num_workers in DataLoader

        2. Data transfer time > compute time:
           - Evidence: H2D memory transfers take >50% of step time
           - Recommendations:
             - Use pinned memory (pin_memory=True)
             - Prefetch to GPU (non_blocking=True)
             - Reduce batch size if data doesn't fit in GPU memory

        3. CPU preprocessing bottleneck:
           - Evidence: CPU time > GPU time
           - Recommendations:
             - Move preprocessing to GPU (using DALI or kornia)
             - Simplify transforms
             - Use faster image decoding (turbojpeg)
        """
        pass

class MultiGPUAnalyzer:
    """Analyze multi-GPU communication patterns."""

    def analyze(self, nccl_metrics: Dict, num_gpus: int) -> List[Bottleneck]:
        """
        TODO: Analyze multi-GPU scaling efficiency

        Calculate scaling efficiency:
        - Ideal speedup: N GPUs → N× faster
        - Actual speedup = (single_gpu_time / multi_gpu_time)
        - Scaling efficiency = (actual_speedup / num_gpus) × 100%

        Bottlenecks:
        1. Gradient synchronization overhead:
           - If NCCL allreduce time > 10% of step time
           - Recommendations:
             - Use gradient accumulation to amortize comm cost
             - Enable NCCL_P2P_DISABLE=0 for NVLink
             - Use FP16 gradients (automatic with mixed precision)

        2. Load imbalance:
           - If max_gpu_time / min_gpu_time > 1.1
           - Some GPUs finish earlier, wait for stragglers
           - Recommendation: Balance data distribution

        3. Communication-computation overlap:
           - DDP should overlap gradient allreduce with backward pass
           - Check if gradient_as_bucket_view=True
        """
        pass

class BottleneckAnalyzer:
    """Main bottleneck analysis coordinator."""

    def __init__(self):
        self.kernel_analyzer = KernelAnalyzer()
        self.data_loading_analyzer = DataLoadingAnalyzer()
        self.multi_gpu_analyzer = MultiGPUAnalyzer()

    def analyze_all(
        self,
        profile_results: Dict
    ) -> List[Bottleneck]:
        """
        TODO: Run all analyzers and consolidate findings
        1. Analyze kernel performance
        2. Analyze data loading pipeline
        3. Analyze multi-GPU communication (if applicable)
        4. Rank bottlenecks by severity
        5. Return top 5 most critical issues
        """
        pass

    def generate_report(self, bottlenecks: List[Bottleneck]) -> str:
        """
        TODO: Generate human-readable report

        Format:
        === GPU Performance Analysis Report ===

        Critical Issues (severity >0.7):
        1. [KERNEL_EFFICIENCY] Low SM efficiency: 45.2%
           Recommendations:
           - Profile with Nsight Compute to identify compute bottlenecks
           - Consider kernel fusion to reduce launch overhead

        Warnings (severity 0.4-0.7):
        2. [DATA_LOADING] GPU idle time detected: 12% of training time
           Recommendations:
           - Increase DataLoader num_workers from 4 to 8
           - Enable pinned memory

        Estimated Performance Improvement: 2.1× faster training
        """
        pass
```

### 第三部分：自动化优化框架（9–11 小时）

实现常见性能问题的自动修复。

#### 3.1 优化策略

创建 `src/optimization/optimizers.py`：

```python
from typing import Dict, Any
import torch
import torch.nn as nn

class MixedPrecisionOptimizer:
    """
    Implement automatic mixed precision (AMP) training.
    Uses FP16 for compute-intensive ops, FP32 for numerically sensitive ops.

    Benefits:
    - 2-3× faster training on Tensor Core GPUs (V100, A100)
    - 50% reduction in memory usage
    - Minimal accuracy impact (<0.1% typically)
    """

    def __init__(self):
        self.scaler = torch.cuda.amp.GradScaler()

    def wrap_training_step(self, model, criterion, optimizer):
        """
        TODO: Wrap training step with autocast

        def training_step(batch):
            with torch.cuda.amp.autocast():
                outputs = model(batch['input'])
                loss = criterion(outputs, batch['target'])

            optimizer.zero_grad()
            self.scaler.scale(loss).backward()
            self.scaler.step(optimizer)
            self.scaler.update()

            return loss.item()

        return training_step
        """
        pass

    def estimate_speedup(self, model: nn.Module) -> float:
        """
        TODO: Estimate speedup from mixed precision

        Count operations by type:
        - MatMul, Conv2d: High speedup (2-3×) from Tensor Cores
        - BatchNorm, LayerNorm: Medium speedup (1.5×)
        - Activations: Low speedup (1.2×)

        Weighted average based on operation counts
        """
        pass

class GradientCheckpointingOptimizer:
    """
    Implement gradient checkpointing to reduce memory usage.

    Trade-off:
    - Memory: 40-60% reduction (enables larger batch sizes)
    - Speed: 20-30% slower (recompute activations during backward)

    Net benefit: Often 1.5× faster due to larger batches
    """

    def apply_checkpointing(
        self,
        model: nn.Module,
        checkpoint_segments: int = 4
    ) -> nn.Module:
        """
        TODO: Apply gradient checkpointing to model

        For transformer models:
        - Checkpoint every N transformer blocks
        - Keep final layer activations (small memory cost)

        Example for HuggingFace models:
        model.gradient_checkpointing_enable()

        For custom models:
        from torch.utils.checkpoint import checkpoint

        def forward_with_checkpointing(x):
            # Divide model into segments
            for segment in self.segments:
                x = checkpoint(segment, x)
            return x
        """
        pass

class DataLoadingOptimizer:
    """Optimize PyTorch DataLoader configuration."""

    def optimize_dataloader(
        self,
        dataset,
        batch_size: int,
        current_config: Dict
    ) -> Dict:
        """
        TODO: Recommend optimal DataLoader settings

        Determine optimal num_workers:
        - Run benchmark with num_workers = [0, 2, 4, 8, 16]
        - Measure samples/sec for each
        - Select configuration with highest throughput

        Other optimizations:
        - pin_memory=True: Faster H2D transfers (uses pinned memory)
        - prefetch_factor=2: Prefetch 2 batches per worker
        - persistent_workers=True: Keep workers alive between epochs

        Return:
        {
            'num_workers': 8,
            'pin_memory': True,
            'prefetch_factor': 2,
            'persistent_workers': True,
            'estimated_speedup': 1.4
        }
        """
        pass

class KernelFusionOptimizer:
    """Optimize model by fusing operations."""

    def fuse_conv_bn_relu(self, model: nn.Module) -> nn.Module:
        """
        TODO: Fuse Conv2d + BatchNorm2d + ReLU

        Reduces kernel launches from 3 to 1:
        - Conv2d: y = Wx + b
        - BatchNorm: y = γ(y - μ) / σ + β
        - ReLU: y = max(0, y)

        Fused kernel does all three in one pass

        For inference (eval mode):
        torch.quantization.fuse_modules(model, [['conv', 'bn', 'relu']])

        For training:
        More complex - need custom fused op or use torch.compile()
        """
        pass

    def apply_torch_compile(
        self,
        model: nn.Module,
        mode: str = "reduce-overhead"
    ) -> nn.Module:
        """
        TODO: Apply torch.compile() for automatic kernel fusion

        PyTorch 2.0+ feature - automatically fuses operations

        model = torch.compile(model, mode=mode)

        Modes:
        - "reduce-overhead": Optimize for many small ops (RNNs)
        - "max-autotune": Maximum optimization, longer compile time
        - "default": Balanced

        Typical speedup: 1.3-2× depending on model
        """
        pass

class MemoryOptimizer:
    """Optimize GPU memory usage."""

    def find_optimal_batch_size(
        self,
        model: nn.Module,
        sample_input: torch.Tensor,
        max_batch_size: int = 512
    ) -> int:
        """
        TODO: Binary search for maximum batch size that fits in memory

        Algorithm:
        1. Start with batch_size = max_batch_size
        2. Try forward + backward pass
        3. If OOM: batch_size //= 2
        4. If success: try batch_size * 1.5
        5. Repeat until convergence

        Return largest batch size that doesn't OOM with 10% safety margin
        """
        pass

    def enable_activation_checkpointing(
        self,
        model: nn.Module,
        checkpoint_ratio: float = 0.5
    ):
        """
        TODO: Checkpoint 50% of transformer blocks to save memory
        See GradientCheckpointingOptimizer for implementation
        """
        pass

class AutoOptimizer:
    """Automatically apply optimizations based on bottleneck analysis."""

    def __init__(self):
        self.mixed_precision = MixedPrecisionOptimizer()
        self.gradient_checkpointing = GradientCheckpointingOptimizer()
        self.data_loading = DataLoadingOptimizer()
        self.kernel_fusion = KernelFusionOptimizer()
        self.memory = MemoryOptimizer()

    def optimize(
        self,
        model: nn.Module,
        data_loader,
        bottlenecks: List[Bottleneck],
        config: Dict
    ) -> Dict[str, Any]:
        """
        TODO: Apply optimizations based on identified bottlenecks

        Decision tree:
        1. If KERNEL_EFFICIENCY bottleneck:
           - Apply mixed precision (AMP)
           - Apply torch.compile() for kernel fusion

        2. If MEMORY_BANDWIDTH bottleneck:
           - Enable gradient checkpointing
           - Find optimal batch size

        3. If DATA_LOADING bottleneck:
           - Optimize DataLoader (num_workers, pinned memory)

        4. If MULTI_GPU_COMM bottleneck:
           - Enable gradient accumulation
           - Use DDP with gradient_as_bucket_view=True

        Return:
        {
            'optimizations_applied': ['mixed_precision', 'torch_compile'],
            'estimated_speedup': 2.3,
            'memory_saved_gb': 4.2,
            'new_config': {...}
        }
        """
        pass
```

#### 3.2 测试要求

创建 `tests/test_optimizations.py`：

```python
def test_mixed_precision_speedup():
    """Verify AMP provides speedup on Tensor Core GPUs."""
    # TODO: Compare training time with/without AMP
    pass

def test_gradient_checkpointing_memory():
    """Verify gradient checkpointing reduces memory usage."""
    # TODO: Measure memory usage with/without checkpointing
    pass
```

### 第四部分：性能验证与回归检测（8–10 小时）

构建系统，验证优化效果并检测回归。

#### 4.1 性能验证器

创建 `src/validation/performance_validator.py`：

```python
from dataclasses import dataclass
from typing import Dict, List
import time
import torch

@dataclass
class PerformanceMetrics:
    samples_per_second: float
    gpu_utilization: float
    memory_usage_gb: float
    multi_gpu_scaling_efficiency: float
    step_time_ms: float

class PerformanceBenchmark:
    """Run controlled performance benchmarks."""

    def benchmark_training(
        self,
        model: torch.nn.Module,
        data_loader,
        num_steps: int = 100,
        warmup_steps: int = 10
    ) -> PerformanceMetrics:
        """
        TODO: Benchmark training performance

        1. Warmup phase (10 steps):
           - Allows GPU clocks to ramp up
           - Fills caches
           - Stabilizes memory allocator

        2. Measurement phase (100 steps):
           - Record time for each step
           - Sample GPU metrics every 10 steps:
             - nvidia-smi for utilization, memory
             - DCGM for detailed metrics

        3. Calculate metrics:
           - samples_per_second = (num_steps × batch_size) / total_time
           - gpu_utilization = average SM activity %
           - memory_usage_gb = peak memory allocated
           - step_time_ms = average time per step

        Return PerformanceMetrics object
        """
        pass

    def benchmark_multi_gpu_scaling(
        self,
        model: torch.nn.Module,
        data_loader,
        gpu_counts: List[int] = [1, 2, 4, 8]
    ) -> Dict[int, PerformanceMetrics]:
        """
        TODO: Measure multi-GPU scaling efficiency

        For each GPU count:
        1. Initialize DDP with world_size = gpu_count
        2. Run benchmark
        3. Calculate scaling efficiency:
           speedup = time_1gpu / time_Ngpu
           efficiency = speedup / N

        Return metrics for each configuration
        """
        pass

class ABTestValidator:
    """A/B test baseline vs optimized configurations."""

    def compare_configurations(
        self,
        baseline_config: Dict,
        optimized_config: Dict,
        model_fn,
        data_loader,
        num_runs: int = 3
    ) -> Dict:
        """
        TODO: Statistical comparison of configurations

        1. Run each configuration num_runs times
        2. Calculate mean and std dev for metrics
        3. Perform t-test to determine statistical significance
        4. Report improvement:
           - Speedup: optimized_samples_per_sec / baseline_samples_per_sec
           - Memory savings: baseline_memory_gb - optimized_memory_gb
           - Confidence interval (95%)

        Return:
        {
            'speedup': 2.1,
            'speedup_confidence_interval': (1.9, 2.3),
            'p_value': 0.001,
            'statistically_significant': True,
            'baseline_metrics': PerformanceMetrics(...),
            'optimized_metrics': PerformanceMetrics(...)
        }
        """
        pass

class RegressionDetector:
    """Detect performance regressions in CI/CD pipeline."""

    def __init__(self, metrics_db_path: str):
        self.metrics_db_path = metrics_db_path
        # TODO: Initialize connection to metrics database (SQLite or PostgreSQL)

    def record_benchmark(
        self,
        commit_sha: str,
        branch: str,
        metrics: PerformanceMetrics,
        metadata: Dict
    ):
        """
        TODO: Record benchmark results to database

        Table schema:
        CREATE TABLE benchmarks (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT NOW(),
            commit_sha VARCHAR(40),
            branch VARCHAR(100),
            samples_per_second FLOAT,
            gpu_utilization FLOAT,
            memory_usage_gb FLOAT,
            step_time_ms FLOAT,
            gpu_type VARCHAR(50),
            num_gpus INT,
            batch_size INT
        );

        Insert current benchmark results
        """
        pass

    def detect_regression(
        self,
        current_metrics: PerformanceMetrics,
        baseline_branch: str = "main",
        regression_threshold: float = 0.05  # 5% slowdown
    ) -> Dict:
        """
        TODO: Detect if current performance is worse than baseline

        1. Query last 10 benchmarks from baseline_branch
        2. Calculate baseline mean and std dev
        3. Compare current metrics:
           - If current_samples_per_sec < baseline_mean × (1 - threshold):
             REGRESSION DETECTED

        4. Identify likely culprit:
           - Binary search through recent commits
           - Find first commit where regression appears

        Return:
        {
            'regression_detected': True/False,
            'current_samples_per_sec': 4200,
            'baseline_samples_per_sec': 4800,
            'performance_delta': -12.5,  # % change
            'threshold': -5.0,
            'likely_culprit_commit': 'abc123def',
            'recommendation': 'Revert commit or investigate...'
        }
        """
        pass

    def generate_performance_report(
        self,
        start_date: str,
        end_date: str
    ) -> str:
        """
        TODO: Generate performance trends over time

        Query benchmarks in date range
        Generate matplotlib charts:
        1. Samples/sec over time (line chart)
        2. GPU utilization over time
        3. Memory usage over time

        Identify:
        - Performance improvements (commits that increased throughput)
        - Regressions (commits that decreased throughput)
        - Trends (gradual improvement/degradation)

        Save charts and return summary report
        """
        pass

class PerformanceValidator:
    """Main validation coordinator."""

    def __init__(self, metrics_db_path: str):
        self.benchmark = PerformanceBenchmark()
        self.ab_test = ABTestValidator()
        self.regression_detector = RegressionDetector(metrics_db_path)

    def validate_optimization(
        self,
        baseline_model,
        optimized_model,
        data_loader,
        commit_sha: str
    ) -> Dict:
        """
        TODO: Complete validation workflow

        1. Benchmark baseline configuration
        2. Benchmark optimized configuration
        3. A/B test comparison with statistical significance
        4. Record results to database
        5. Check for regressions against main branch
        6. Generate validation report

        Return comprehensive validation results
        """
        pass
```

#### 4.2 CI/CD 集成

创建 `.github/workflows/performance-benchmark.yml`：

```yaml
name: GPU Performance Benchmark

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  benchmark:
    runs-on: [self-hosted, gpu, a100]  # GPU runner required

    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

      - name: Run performance benchmark
        run: |
          python scripts/run_benchmark.py \
            --commit-sha ${{ github.sha }} \
            --branch ${{ github.ref_name }} \
            --output benchmark_results.json

      - name: Detect performance regression
        id: regression
        run: |
          python scripts/detect_regression.py \
            --results benchmark_results.json \
            --threshold 0.05

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('benchmark_results.json'));

            const comment = `## GPU Performance Benchmark Results

            **Samples/sec**: ${results.samples_per_second.toFixed(0)} (${results.performance_delta > 0 ? '+' : ''}${results.performance_delta.toFixed(1)}%)
            **GPU Utilization**: ${results.gpu_utilization.toFixed(1)}%
            **Memory Usage**: ${results.memory_usage_gb.toFixed(2)} GB

            ${results.regression_detected ? '⚠️ **Performance regression detected!**' : '✅ No regression detected'}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

      - name: Fail if regression detected
        if: steps.regression.outputs.regression == 'true'
        run: |
          echo "Performance regression detected!"
          exit 1
```

## 验收标准

### 功能需求

- [ ] 性能采集器从 Nsight Systems、Nsight Compute 与 PyTorch Profiler 获取数据。
- [ ] 瓶颈分析器识别前 5 个性能问题，并提供严重程度分数。
- [ ] 自动优化器应用修复（AMP、梯度检查点、DataLoader 调优）。
- [ ] A/B 测试以统计显著性（p 小于 0.05）验证优化。
- [ ] 性能下降超过 5% 时，回归检测器发出告警。
- [ ] CI/CD 集成在每个 PR 上运行基准测试。

### 性能需求

- [ ] 训练吞吐量提高超过 100%（每秒 2,400 → 5,000 个以上样本）。
- [ ] GPU 利用率超过 85%（原为 45%）。
- [ ] 2–8 块 GPU 的扩展效率超过 90%。
- [ ] 显存利用率超过 80%，且无 OOM。
- [ ] 性能分析开销低于 5%（尽量减少对训练时间的影响）。

### 代码质量

- [ ] 所有性能分析及优化代码测试覆盖率达到 80% 以上。
- [ ] 全面处理错误（分析失败、优化期间 OOM）。
- [ ] 记录全部优化决策的详细日志。
- [ ] 所有公开函数具备类型标注。
- [ ] 所有类具备含示例的 Docstring。

## 测试策略

### 单元测试

```python
# tests/test_kernel_analyzer.py
def test_kernel_bottleneck_detection():
    """Test that low SM efficiency is correctly flagged."""
    metrics = {'sm_efficiency': 35.0}
    analyzer = KernelAnalyzer()
    bottlenecks = analyzer.analyze(metrics)
    assert len(bottlenecks) > 0
    assert bottlenecks[0].type == BottleneckType.KERNEL_EFFICIENCY

# tests/test_mixed_precision.py
def test_amp_speedup():
    """Verify AMP provides 2×+ speedup on A100."""
    # Requires GPU testing environment
    pass
```

### 集成测试

```python
# tests/test_end_to_end.py
def test_full_optimization_pipeline():
    """Test complete workflow: profile → analyze → optimize → validate."""
    # 1. Profile baseline
    # 2. Identify bottlenecks
    # 3. Apply optimizations
    # 4. Validate improvement
    pass
```

### 手动测试

1. **分析真实训练工作负载：**
   ```bash
   python src/profiling/profile_collector.py \
     --command "python train.py" \
     --output ./profiles/baseline
   ```

2. **分析瓶颈：**
   ```bash
   python src/analysis/bottleneck_analyzer.py \
     --profile ./profiles/baseline \
     --output bottleneck_report.json
   ```

3. **应用优化：**
   ```bash
   python src/optimization/auto_optimizer.py \
     --bottlenecks bottleneck_report.json \
     --model-config config/model.yaml \
     --output optimized_config.yaml
   ```

4. **验证改进：**
   ```bash
   python src/validation/performance_validator.py \
     --baseline config/model.yaml \
     --optimized optimized_config.yaml \
     --output validation_report.json
   ```

## 交付物

1. **源代码**（`src/`）：
   - `profiling/profile_collector.py`——多来源性能分析系统。
   - `analysis/bottleneck_analyzer.py`——自动化瓶颈检测。
   - `optimization/optimizers.py`——优化策略（AMP、检查点等）。
   - `validation/performance_validator.py`——A/B 测试与回归检测。

2. **测试**（`tests/`）：
   - 全部分析器及优化器的单元测试。
   - 完整流水线集成测试。
   - 用于验证的基准测试脚本。

3. **CI/CD 集成**（`.github/workflows/`）：
   - `performance-benchmark.yml`——PR 自动化基准测试。

4. **文档**（`docs/`）：
   - `OPTIMIZATION_GUIDE.md`——优化框架使用方法。
   - `PROFILING_GUIDE.md`——GPU 工作负载性能分析方法。
   - `BENCHMARKING.md`——性能基准测试最佳实践。

5. **示例脚本**（`scripts/`）：
   - `run_benchmark.py`——运行性能基准测试。
   - `detect_regression.py`——检测性能回归。
   - `optimize_model.py`——优化已有训练脚本。

## 额外挑战

1. **自定义 CUDA Kernel 优化（额外 8 小时）：**
   - 从性能分析数据识别缓慢的 PyTorch 算子。
   - 为热点编写优化的 CUDA Kernel。
   - 通过 PyTorch C++ 扩展集成自定义 Kernel。
   - 验证特定操作的 2–5 倍加速。

2. **多节点 GPU 性能分析（额外 6 小时）：**
   - 分析多节点分布式训练。
   - 识别网络通信瓶颈。
   - 优化 NCCL 通信模式。
   - 测量最多 32 块 GPU 的扩展效率。

3. **能源效率优化（额外 5 小时）：**
   - 测量 GPU 功耗（瓦）。
   - 优化每瓦性能。
   - 动态电压/频率调整。
   - 生成能源效率报告。

## 资源

### 官方文档

- [NVIDIA Nsight Systems](https://developer.nvidia.com/nsight-systems)
- [NVIDIA Nsight Compute](https://developer.nvidia.com/nsight-compute)
- [PyTorch Profiler](https://pytorch.org/tutorials/recipes/recipes/profiler_recipe.html)
- [PyTorch 性能调优指南](https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)
- [CUDA C++ 最佳实践指南](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)

### 教程

- [混合精度训练](https://pytorch.org/docs/stable/notes/amp_examples.html)
- [梯度检查点](https://pytorch.org/docs/stable/checkpoint.html)
- [分布式数据并行](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)

### 示例代码

```python
# Example: Complete optimization workflow

from profiling.profile_collector import ProfileCollector
from analysis.bottleneck_analyzer import BottleneckAnalyzer
from optimization.optimizers import AutoOptimizer
from validation.performance_validator import PerformanceValidator

# 1. Profile baseline
collector = ProfileCollector()
profile_results = collector.profile_comprehensive(
    command="python train.py --config baseline.yaml",
    output_dir="./profiles/baseline"
)

# 2. Analyze bottlenecks
analyzer = BottleneckAnalyzer()
bottlenecks = analyzer.analyze_all(profile_results)
print(analyzer.generate_report(bottlenecks))

# 3. Apply optimizations
optimizer = AutoOptimizer()
optimizations = optimizer.optimize(
    model=model,
    data_loader=train_loader,
    bottlenecks=bottlenecks,
    config=baseline_config
)

# 4. Validate improvements
validator = PerformanceValidator(metrics_db_path="./metrics.db")
validation_results = validator.validate_optimization(
    baseline_model=baseline_model,
    optimized_model=optimized_model,
    data_loader=train_loader,
    commit_sha="abc123"
)

print(f"Speedup: {validation_results['speedup']:.2f}×")
print(f"Memory saved: {validation_results['memory_saved_gb']:.2f} GB")
```

## 提交

通过 Git 提交你的实现：

```bash
git add .
git commit -m "Complete Exercise 05: GPU Performance Optimization"
git push origin exercise-05-gpu-performance-optimization
```

确保提交包含：
- 完成所有 TODO 注释所要求实现的源代码。
- 覆盖率超过 80% 的单元及集成测试。
- 自动化基准测试 CI/CD 工作流。
- 包含用法示例的文档。
- 展示超过 2 倍性能改进的基准测试结果。

---

**预计时长分解：**
- 第一部分（性能分析框架）：8–10 小时。
- 第二部分（瓶颈分析）：7–9 小时。
- 第三部分（自动化优化）：9–11 小时。
- 第四部分（验证与回归检测）：8–10 小时。
- **合计：** 32–40 小时。

> 译注：性能及成本数字为原文目标。提高显存占用并非独立优化目标，应关注吞吐、收敛、显存余量与实际成本；统计显著性需结合实验设计和效应大小。原始代码块及 TODO 保留，未运行 GPU 基准测试。
