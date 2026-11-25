# 练习 05：ML 框架基准测试工具

## 学习目标

完成本练习后，你将能够：
- 比较 PyTorch、TensorFlow 与 JAX 的性能。
- 对 GPU 与 CPU 训练性能进行基准测试。
- 分析显存及内存使用，并进行优化。
- 理解生产环境中不同框架的取舍。
- 构建自动化基准测试基础设施。

## 概览

选择合适的 ML 框架对于 AI 基础设施至关重要。本练习将构建一套综合基准测试工具，帮助团队根据具体使用场景，以数据为依据进行框架选型。

## 前置条件

- Python 3.11+，已安装 PyTorch、TensorFlow、JAX。
- 理解神经网络基础。
- 具有 GPU 访问能力（可选，但完整基准测试推荐使用）。
- 了解 Python 性能分析工具。

## 问题描述

构建框架基准测试工具 `mlbench`，具备以下能力：

1. **训练相同模型：** 在 PyTorch、TensorFlow 与 JAX 中实现。
2. **测量性能指标：** 训练时间、吞吐量、内存使用。
3. **比较 GPU 与 CPU** 性能。
4. **分析内存使用**并识别瓶颈。
5. **生成综合报告**，包含可视化图表。

## 需求

### 功能需求

#### FR1：模型实现
- 在 PyTorch、TensorFlow、JAX 中实现相同模型：
  - 用于图像分类的 CNN（ResNet-18/34）。
  - 用于 NLP 的 Transformer（类似 BERT）。
  - 用于表格数据的 MLP。
- 确保不同框架中的模型架构一致。
- 使用相同超参数（学习率、批大小等）。

#### FR2：基准测试指标
- 训练时间（每个 Epoch、总时间）。
- 吞吐量（样本/秒）。
- GPU 利用率（%）。
- 内存使用（峰值、平均值）。
- 模型大小（参数量、磁盘占用）。
- 推理延迟（平均值、P50、P95、P99）。

#### FR3：设备比较
- CPU 与 GPU 训练。
- 单 GPU 与多 GPU。
- 混合精度（FP32 与 FP16）。
- 批大小的影响。

#### FR4：报告
- 生成 JSON/CSV 格式结果。
- 创建可视化图表。
- 生成包含比较结果的 HTML 报告。
- 根据结果提供建议。

### 非功能需求

#### NFR1：准确性
- 确保不同模型训练达到相近准确率（原文目标 ±2%）。
- 在基准测试前验证正确性。
- 使用固定随机种子以提高可复现性。

#### NFR2：自动化
- 通过一条命令运行全部基准测试。
- 支持部分测试（跳过指定框架）。
- 恢复中断的基准测试。
- 追踪进度与预计剩余时间。

#### NFR3：可扩展性
- 易于添加新框架。
- 可插拔模型架构。
- 支持 YAML/JSON 配置。

## 实现任务

### 任务 1：框架抽象层（4–5 小时）

为全部框架创建统一接口：

```python
# src/framework_interface.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Tuple
import time

@dataclass
class BenchmarkResult:
    """Benchmark results for a single run"""
    framework: str
    model_name: str
    device: str  # "cpu", "cuda:0", "mps"
    batch_size: int
    precision: str  # "fp32", "fp16"

    # Training metrics
    train_time_per_epoch: float  # seconds
    total_train_time: float
    samples_per_second: float

    # Memory metrics
    peak_memory_mb: float
    avg_memory_mb: float

    # Accuracy metrics
    final_train_accuracy: float
    final_val_accuracy: float

    # Model metrics
    num_parameters: int
    model_size_mb: float

    # Inference metrics
    inference_latency_mean_ms: float
    inference_latency_p95_ms: float
    inference_latency_p99_ms: float

class FrameworkInterface(ABC):
    """Abstract interface for ML frameworks"""

    def __init__(self, device: str = "cpu"):
        self.device = device
        self.model = None

    @abstractmethod
    def build_model(self, model_type: str, **kwargs) -> Any:
        """
        Build model of specified type

        TODO: Implement for each framework
        - "cnn": ResNet-18 for image classification
        - "transformer": BERT-like for NLP
        - "mlp": Multi-layer perceptron

        Args:
            model_type: Type of model to build
            **kwargs: Model-specific parameters

        Returns:
            Model object
        """
        pass

    @abstractmethod
    def train_epoch(
        self,
        model: Any,
        train_loader: Any,
        optimizer: Any,
        loss_fn: Any
    ) -> Dict[str, float]:
        """
        Train for one epoch

        TODO: Implement training loop
        - Forward pass
        - Backward pass
        - Optimizer step
        - Track metrics

        Returns:
            {"loss": float, "accuracy": float, "time": float}
        """
        pass

    @abstractmethod
    def evaluate(
        self,
        model: Any,
        val_loader: Any,
        loss_fn: Any
    ) -> Dict[str, float]:
        """
        Evaluate model

        TODO: Implement evaluation loop
        Returns: {"loss": float, "accuracy": float}
        """
        pass

    @abstractmethod
    def benchmark_inference(
        self,
        model: Any,
        input_shape: Tuple,
        num_runs: int = 1000
    ) -> Dict[str, float]:
        """
        Benchmark inference latency

        TODO:
        1. Warmup (10 runs)
        2. Run inference num_runs times
        3. Measure latency for each run
        4. Calculate statistics (mean, p50, p95, p99)

        Returns:
            {
                "mean_ms": float,
                "p50_ms": float,
                "p95_ms": float,
                "p99_ms": float
            }
        """
        pass

    @abstractmethod
    def get_memory_usage(self) -> Dict[str, float]:
        """
        Get current memory usage

        TODO: Query framework-specific memory stats
        Returns: {"allocated_mb": float, "reserved_mb": float}
        """
        pass

    @abstractmethod
    def count_parameters(self, model: Any) -> int:
        """TODO: Count trainable parameters"""
        pass

    @abstractmethod
    def save_model(self, model: Any, path: str) -> None:
        """TODO: Save model to disk"""
        pass

    @abstractmethod
    def load_model(self, path: str) -> Any:
        """TODO: Load model from disk"""
        pass
```

**验收标准：**
- [ ] 抽象接口覆盖全部框架。
- [ ] 不同实现之间的 API 保持一致。
- [ ] CPU 与 GPU 内存追踪正常工作。
- [ ] 推理基准测试准确。

---

### 任务 2：PyTorch 实现（3–4 小时）

```python
# src/pytorch_impl.py

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models
import time
import numpy as np
from typing import Any, Dict, Tuple

class PyTorchFramework(FrameworkInterface):
    """PyTorch implementation"""

    def __init__(self, device: str = "cpu"):
        super().__init__(device)
        self.torch_device = torch.device(device)

    def build_model(self, model_type: str, **kwargs) -> nn.Module:
        """
        TODO: Build PyTorch models

        CNN (ResNet-18):
        ```python
        model = models.resnet18(num_classes=kwargs.get("num_classes", 10))
        model = model.to(self.torch_device)
        return model
        ```

        Transformer:
        ```python
        from torch.nn import Transformer
        # Build BERT-like encoder
        ```

        MLP:
        ```python
        class MLP(nn.Module):
            def __init__(self, input_dim, hidden_dims, output_dim):
                # Build multi-layer perceptron
        ```
        """
        pass

    def train_epoch(
        self,
        model: nn.Module,
        train_loader: Any,
        optimizer: optim.Optimizer,
        loss_fn: nn.Module
    ) -> Dict[str, float]:
        """
        TODO: PyTorch training loop

        ```python
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        start_time = time.time()

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(self.torch_device), target.to(self.torch_device)

            optimizer.zero_grad()
            output = model(data)
            loss = loss_fn(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        epoch_time = time.time() - start_time
        accuracy = 100.0 * correct / total
        avg_loss = total_loss / len(train_loader)

        return {
            "loss": avg_loss,
            "accuracy": accuracy,
            "time": epoch_time
        }
        ```
        """
        pass

    def evaluate(
        self,
        model: nn.Module,
        val_loader: Any,
        loss_fn: nn.Module
    ) -> Dict[str, float]:
        """TODO: PyTorch evaluation loop"""
        pass

    def benchmark_inference(
        self,
        model: nn.Module,
        input_shape: Tuple,
        num_runs: int = 1000
    ) -> Dict[str, float]:
        """
        TODO: Benchmark PyTorch inference

        ```python
        model.eval()
        dummy_input = torch.randn(1, *input_shape).to(self.torch_device)

        # Warmup
        with torch.no_grad():
            for _ in range(10):
                _ = model(dummy_input)

        # Benchmark
        latencies = []
        with torch.no_grad():
            for _ in range(num_runs):
                if self.torch_device.type == 'cuda':
                    torch.cuda.synchronize()

                start = time.perf_counter()
                _ = model(dummy_input)

                if self.torch_device.type == 'cuda':
                    torch.cuda.synchronize()

                end = time.perf_counter()
                latencies.append((end - start) * 1000)  # ms

        latencies = np.array(latencies)
        return {
            "mean_ms": np.mean(latencies),
            "p50_ms": np.percentile(latencies, 50),
            "p95_ms": np.percentile(latencies, 95),
            "p99_ms": np.percentile(latencies, 99)
        }
        ```
        """
        pass

    def get_memory_usage(self) -> Dict[str, float]:
        """
        TODO: Get PyTorch memory usage

        ```python
        if self.torch_device.type == 'cuda':
            allocated = torch.cuda.memory_allocated(self.torch_device) / 1024**2
            reserved = torch.cuda.memory_reserved(self.torch_device) / 1024**2
        else:
            # Use psutil for CPU memory
            import psutil
            process = psutil.Process()
            allocated = process.memory_info().rss / 1024**2
            reserved = allocated

        return {"allocated_mb": allocated, "reserved_mb": reserved}
        ```
        """
        pass

    def count_parameters(self, model: nn.Module) -> int:
        """
        TODO: Count PyTorch parameters

        ```python
        return sum(p.numel() for p in model.parameters() if p.requires_grad)
        ```
        """
        pass
```

**验收标准：**
- [ ] 全部模型正确构建。
- [ ] 训练循环可在 CPU 与 GPU 上运行。
- [ ] 内存追踪准确。
- [ ] 推理基准测试可靠。

---

### 任务 3：TensorFlow 实现（3–4 小时）

```python
# src/tensorflow_impl.py

import tensorflow as tf
from tensorflow import keras
import time
import numpy as np
from typing import Any, Dict, Tuple

class TensorFlowFramework(FrameworkInterface):
    """TensorFlow implementation"""

    def __init__(self, device: str = "cpu"):
        super().__init__(device)
        # Set device
        if device == "cpu":
            tf.config.set_visible_devices([], 'GPU')

    def build_model(self, model_type: str, **kwargs) -> keras.Model:
        """
        TODO: Build TensorFlow models

        CNN (ResNet-18):
        ```python
        model = keras.applications.ResNet50(
            weights=None,
            input_shape=kwargs.get("input_shape", (224, 224, 3)),
            classes=kwargs.get("num_classes", 10)
        )
        return model
        ```

        Transformer:
        ```python
        from tensorflow.keras.layers import (
            MultiHeadAttention, LayerNormalization, Dense
        )
        # Build transformer encoder
        ```

        MLP:
        ```python
        model = keras.Sequential([
            keras.layers.Dense(hidden_dim, activation='relu'),
            keras.layers.Dense(hidden_dim, activation='relu'),
            keras.layers.Dense(output_dim, activation='softmax')
        ])
        ```
        """
        pass

    def train_epoch(
        self,
        model: keras.Model,
        train_loader: Any,
        optimizer: keras.optimizers.Optimizer,
        loss_fn: keras.losses.Loss
    ) -> Dict[str, float]:
        """
        TODO: TensorFlow training loop

        ```python
        train_loss = keras.metrics.Mean()
        train_accuracy = keras.metrics.CategoricalAccuracy()

        start_time = time.time()

        for data, target in train_loader:
            with tf.GradientTape() as tape:
                predictions = model(data, training=True)
                loss = loss_fn(target, predictions)

            gradients = tape.gradient(loss, model.trainable_variables)
            optimizer.apply_gradients(zip(gradients, model.trainable_variables))

            train_loss(loss)
            train_accuracy(target, predictions)

        epoch_time = time.time() - start_time

        return {
            "loss": float(train_loss.result()),
            "accuracy": float(train_accuracy.result() * 100),
            "time": epoch_time
        }
        ```
        """
        pass

    def evaluate(
        self,
        model: keras.Model,
        val_loader: Any,
        loss_fn: keras.losses.Loss
    ) -> Dict[str, float]:
        """TODO: TensorFlow evaluation"""
        pass

    def benchmark_inference(
        self,
        model: keras.Model,
        input_shape: Tuple,
        num_runs: int = 1000
    ) -> Dict[str, float]:
        """
        TODO: Benchmark TensorFlow inference

        Similar to PyTorch but use TensorFlow APIs
        - Use tf.function for compiled inference
        - Use tf.timestamp() for accurate timing
        """
        pass

    def get_memory_usage(self) -> Dict[str, float]:
        """
        TODO: Get TensorFlow memory usage

        ```python
        if tf.config.list_physical_devices('GPU'):
            # GPU memory
            memory_info = tf.config.experimental.get_memory_info('GPU:0')
            allocated = memory_info['current'] / 1024**2
            reserved = memory_info['peak'] / 1024**2
        else:
            # CPU memory
            import psutil
            process = psutil.Process()
            allocated = process.memory_info().rss / 1024**2
            reserved = allocated

        return {"allocated_mb": allocated, "reserved_mb": reserved}
        ```
        """
        pass

    def count_parameters(self, model: keras.Model) -> int:
        """
        TODO: Count TensorFlow parameters

        ```python
        return int(sum([tf.size(w).numpy() for w in model.trainable_weights]))
        ```
        """
        pass
```

**验收标准：**
- [ ] 全部 TensorFlow 模型正确构建。
- [ ] 训练表现与 PyTorch 接近（原文目标 ±5%）。
- [ ] 内存追踪正常工作。
- [ ] 推理基准测试准确。

---

### 任务 4：JAX 实现（4–5 小时）

```python
# src/jax_impl.py

import jax
import jax.numpy as jnp
from flax import linen as nn
import optax
import time
import numpy as np
from typing import Any, Dict, Tuple

class JAXFramework(FrameworkInterface):
    """JAX/Flax implementation"""

    def __init__(self, device: str = "cpu"):
        super().__init__(device)
        # JAX device management
        if device == "cpu":
            jax.config.update('jax_platform_name', 'cpu')

    def build_model(self, model_type: str, **kwargs) -> nn.Module:
        """
        TODO: Build JAX/Flax models

        CNN:
        ```python
        class ResNet18(nn.Module):
            num_classes: int = 10

            @nn.compact
            def __call__(self, x, training: bool = False):
                # Build ResNet-18 architecture
                # Use nn.Conv, nn.BatchNorm, nn.relu
                pass

        return ResNet18(num_classes=kwargs.get("num_classes", 10))
        ```

        MLP:
        ```python
        class MLP(nn.Module):
            hidden_dims: Tuple[int, ...]
            num_classes: int

            @nn.compact
            def __call__(self, x):
                for dim in self.hidden_dims:
                    x = nn.Dense(dim)(x)
                    x = nn.relu(x)
                x = nn.Dense(self.num_classes)(x)
                return x
        ```
        """
        pass

    def train_epoch(
        self,
        model: nn.Module,
        params: Any,
        train_loader: Any,
        optimizer_state: Any,
        tx: optax.GradientTransformation
    ) -> Dict[str, float]:
        """
        TODO: JAX training loop

        ```python
        @jax.jit
        def train_step(params, opt_state, batch):
            def loss_fn(params):
                logits = model.apply({'params': params}, batch['image'])
                loss = optax.softmax_cross_entropy_with_integer_labels(
                    logits, batch['label']
                ).mean()
                return loss, logits

            (loss, logits), grads = jax.value_and_grad(loss_fn, has_aux=True)(params)
            updates, new_opt_state = tx.update(grads, opt_state)
            new_params = optax.apply_updates(params, updates)

            accuracy = jnp.mean(jnp.argmax(logits, -1) == batch['label'])

            return new_params, new_opt_state, loss, accuracy

        total_loss = 0
        total_accuracy = 0
        num_batches = 0

        start_time = time.time()

        for batch in train_loader:
            params, optimizer_state, loss, acc = train_step(
                params, optimizer_state, batch
            )
            total_loss += float(loss)
            total_accuracy += float(acc)
            num_batches += 1

        epoch_time = time.time() - start_time

        return {
            "loss": total_loss / num_batches,
            "accuracy": (total_accuracy / num_batches) * 100,
            "time": epoch_time
        }
        ```
        """
        pass

    def benchmark_inference(
        self,
        model: nn.Module,
        params: Any,
        input_shape: Tuple,
        num_runs: int = 1000
    ) -> Dict[str, float]:
        """
        TODO: Benchmark JAX inference

        ```python
        # Create JIT-compiled inference function
        @jax.jit
        def inference_fn(params, x):
            return model.apply({'params': params}, x)

        dummy_input = jnp.ones((1, *input_shape))

        # Warmup
        for _ in range(10):
            _ = inference_fn(params, dummy_input)
            jax.block_until_ready(_)

        # Benchmark
        latencies = []
        for _ in range(num_runs):
            start = time.perf_counter()
            output = inference_fn(params, dummy_input)
            jax.block_until_ready(output)
            end = time.perf_counter()
            latencies.append((end - start) * 1000)

        latencies = np.array(latencies)
        return {
            "mean_ms": np.mean(latencies),
            "p50_ms": np.percentile(latencies, 50),
            "p95_ms": np.percentile(latencies, 95),
            "p99_ms": np.percentile(latencies, 99)
        }
        ```
        """
        pass

    def get_memory_usage(self) -> Dict[str, float]:
        """
        TODO: Get JAX memory usage

        JAX doesn't expose memory APIs directly,
        use nvidia-smi or psutil
        """
        pass
```

**验收标准：**
- [ ] JAX 模型能够构建及训练。
- [ ] JIT 编译正确工作。
- [ ] 性能具有与 PyTorch 比较的竞争力。
- [ ] 推理基准测试准确。

---

### 任务 5：基准测试编排器（5–6 小时）

```python
# src/benchmark_runner.py

from dataclasses import dataclass, asdict
from typing import List, Dict, Optional
from pathlib import Path
import json
import yaml
from rich.console import Console
from rich.progress import Progress, TaskID
from rich.table import Table

@dataclass
class BenchmarkConfig:
    """Benchmark configuration"""
    frameworks: List[str]  # ["pytorch", "tensorflow", "jax"]
    models: List[str]  # ["cnn", "transformer", "mlp"]
    devices: List[str]  # ["cpu", "cuda:0"]
    batch_sizes: List[int]  # [32, 64, 128]
    num_epochs: int = 5
    dataset: str = "cifar10"
    precision: List[str] = None  # ["fp32", "fp16"]

    def __post_init__(self):
        if self.precision is None:
            self.precision = ["fp32"]

class BenchmarkRunner:
    """Run comprehensive benchmarks"""

    def __init__(self, config: BenchmarkConfig):
        self.config = config
        self.results: List[BenchmarkResult] = []
        self.console = Console()

    def run_all_benchmarks(self) -> List[BenchmarkResult]:
        """
        TODO: Run all benchmark combinations

        ```python
        total_benchmarks = (
            len(self.config.frameworks) *
            len(self.config.models) *
            len(self.config.devices) *
            len(self.config.batch_sizes) *
            len(self.config.precision)
        )

        with Progress() as progress:
            task = progress.add_task(
                "[green]Running benchmarks...",
                total=total_benchmarks
            )

            for framework in self.config.frameworks:
                for model in self.config.models:
                    for device in self.config.devices:
                        for batch_size in self.config.batch_sizes:
                            for precision in self.config.precision:
                                result = self.run_single_benchmark(
                                    framework, model, device,
                                    batch_size, precision
                                )
                                self.results.append(result)
                                progress.update(task, advance=1)

        return self.results
        ```
        """
        pass

    def run_single_benchmark(
        self,
        framework: str,
        model: str,
        device: str,
        batch_size: int,
        precision: str
    ) -> BenchmarkResult:
        """
        TODO: Run single benchmark

        Steps:
        1. Initialize framework implementation
        2. Build model
        3. Load dataset
        4. Train for N epochs
        5. Measure metrics
        6. Benchmark inference
        7. Return results
        """
        pass

    def save_results(self, output_dir: Path) -> None:
        """
        TODO: Save results to disk

        Save as:
        - results.json (raw data)
        - results.csv (table format)
        - report.html (formatted report)
        """
        pass

    def print_summary(self) -> None:
        """
        TODO: Print results summary table

        ```python
        table = Table(title="Benchmark Results Summary")
        table.add_column("Framework", style="cyan")
        table.add_column("Model", style="magenta")
        table.add_column("Device", style="green")
        table.add_column("Batch Size", justify="right")
        table.add_column("Train Time (s)", justify="right")
        table.add_column("Throughput (samples/s)", justify="right")
        table.add_column("Peak Memory (MB)", justify="right")
        table.add_column("Inference (ms)", justify="right")

        for result in self.results:
            table.add_row(
                result.framework,
                result.model_name,
                result.device,
                str(result.batch_size),
                f"{result.total_train_time:.2f}",
                f"{result.samples_per_second:.0f}",
                f"{result.peak_memory_mb:.0f}",
                f"{result.inference_latency_mean_ms:.2f}"
            )

        self.console.print(table)
        ```
        """
        pass
```

**验收标准：**
- [ ] 运行全部基准测试组合。
- [ ] 使用 rich 追踪进度。
- [ ] 以多种格式保存结果。
- [ ] 生成汇总表格。

---

### 任务 6：可视化与报告（4–5 小时）

```python
# src/visualizer.py

import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import List
import pandas as pd

class BenchmarkVisualizer:
    """Generate visualizations from benchmark results"""

    def __init__(self, results: List[BenchmarkResult]):
        self.results = results
        self.df = pd.DataFrame([asdict(r) for r in results])

    def plot_training_time_comparison(self, output: Path) -> None:
        """
        TODO: Plot training time comparison

        ```python
        fig, ax = plt.subplots(figsize=(12, 6))

        sns.barplot(
            data=self.df,
            x="model_name",
            y="total_train_time",
            hue="framework",
            ax=ax
        )

        ax.set_title("Training Time Comparison")
        ax.set_xlabel("Model")
        ax.set_ylabel("Time (seconds)")
        ax.legend(title="Framework")

        plt.tight_layout()
        plt.savefig(output / "training_time.png", dpi=300)
        plt.close()
        ```
        """
        pass

    def plot_throughput_comparison(self, output: Path) -> None:
        """TODO: Plot samples/second comparison"""
        pass

    def plot_memory_usage(self, output: Path) -> None:
        """TODO: Plot peak memory usage"""
        pass

    def plot_inference_latency(self, output: Path) -> None:
        """TODO: Plot inference latency comparison"""
        pass

    def plot_gpu_vs_cpu(self, output: Path) -> None:
        """
        TODO: Plot GPU vs CPU speedup

        Calculate speedup factor for each framework/model
        """
        pass

    def plot_batch_size_impact(self, output: Path) -> None:
        """TODO: Plot how batch size affects throughput"""
        pass

    def generate_html_report(self, output: Path) -> None:
        """
        TODO: Generate comprehensive HTML report

        ```python
        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>ML Framework Benchmark Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; }}
                img {{ max-width: 100%; height: auto; margin: 20px 0; }}
                .recommendation {{ background: #e7f3fe; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <h1>ML Framework Benchmark Report</h1>

            <h2>Configuration</h2>
            <ul>
                <li>Frameworks: {", ".join(self.df['framework'].unique())}</li>
                <li>Models: {", ".join(self.df['model_name'].unique())}</li>
                <li>Devices: {", ".join(self.df['device'].unique())}</li>
            </ul>

            <h2>Results Summary</h2>
            {self.df.to_html()}

            <h2>Visualizations</h2>
            <img src="training_time.png" alt="Training Time">
            <img src="throughput.png" alt="Throughput">
            <img src="memory.png" alt="Memory Usage">
            <img src="inference.png" alt="Inference Latency">

            <h2>Recommendations</h2>
            <div class="recommendation">
                {self._generate_recommendations()}
            </div>
        </body>
        </html>
        '''

        (output / "report.html").write_text(html)
        ```
        """
        pass

    def _generate_recommendations(self) -> str:
        """
        TODO: Generate framework recommendations

        Analyze results and provide guidance:
        - Best for training speed
        - Best for inference latency
        - Most memory efficient
        - Best GPU utilization
        """
        pass
```

**验收标准：**
- [ ] 全部可视化图表正确生成。
- [ ] HTML 报告内容全面。
- [ ] 建议以数据为依据。
- [ ] 图表达到可发表的质量。

---

## 交付物

1. **源代码**（`src/`）
   - `framework_interface.py`
   - `pytorch_impl.py`
   - `tensorflow_impl.py`
   - `jax_impl.py`
   - `benchmark_runner.py`
   - `visualizer.py`
   - `cli.py`

2. **配置**（`configs/`）
   - `benchmark_config.yaml`——默认配置。
   - `quick_test.yaml`——用于测试的快速基准测试。
   - `comprehensive.yaml`——完整基准测试套件。

3. **测试**（`tests/`）
   - 每个框架的单元测试。
   - 基准测试集成测试。
   - 对高成本操作使用 Mock 测试。

4. **文档**
   - 包含用法示例的 README.md。
   - 包含示例基准测试结果的 RESULTS.md。
   - 包含框架比较分析的 ANALYSIS.md。

---

## CLI 界面

```bash
# Run all benchmarks
mlbench run --config configs/benchmark_config.yaml

# Run specific framework
mlbench run --frameworks pytorch tensorflow

# Run specific model
mlbench run --models cnn --devices cuda:0

# Quick test (1 epoch)
mlbench run --config configs/quick_test.yaml

# Generate report from existing results
mlbench report --results results/benchmark_results.json --output report/

# Compare two benchmark runs
mlbench compare results1.json results2.json
```

---

## 评分标准

| 标准 | 权重 | 描述 |
|---|---|---|
| **正确性** | 30% | 模型训练达到相近准确率 |
| **完整性** | 25% | 实现全部框架 |
| **基准测试** | 20% | 测量准确且可复现 |
| **报告** | 15% | 清晰的可视化与建议 |
| **代码质量** | 10% | 代码清晰，测试充分 |

**及格分数：** 70%。
**优秀：** 90% 以上。

---

## 资源

- [PyTorch 基准测试](https://pytorch.org/tutorials/recipes/recipes/benchmark.html)
- [TensorFlow Profiler](https://www.tensorflow.org/guide/profiler)
- [JAX 基准测试](https://jax.readthedocs.io/en/latest/async_dispatch.html)

---

## 预计时长

- **任务 1**（接口）：4–5 小时。
- **任务 2**（PyTorch）：3–4 小时。
- **任务 3**（TensorFlow）：3–4 小时。
- **任务 4**（JAX）：4–5 小时。
- **任务 5**（编排器）：5–6 小时。
- **任务 6**（可视化）：4–5 小时。
- **测试：** 6–8 小时。
- **文档：** 2–3 小时。

**合计：** 31–40 小时。

---

**本练习提供生产 ML 基础设施决策与基准测试方法的实践经验。**

> 译注：框架比较需要控制模型初始化、数据顺序、优化器细节、硬件、编译模式及精度设置。GPU 操作通常异步执行，应在适当位置同步后测量；JAX JIT 等编译开销应与稳定运行阶段分开报告。不同框架的显存分配器统计口径可能不同，需统一测量方法。随机种子不能单独保证跨框架结果一致；准确率与性能阈值为原文练习目标，并非框架性能保证。原始代码块与 TODO 保留，未实际运行基准测试。
