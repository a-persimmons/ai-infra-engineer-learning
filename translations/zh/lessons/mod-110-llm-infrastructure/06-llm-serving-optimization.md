# 第 06 课：LLM 服务优化

## 目录
1. [导论](#导论)
2. [模型量化技术](#模型量化技术)
3. [Flash Attention 2](#flash-attention-2)
4. [连续批处理](#连续批处理)
5. [动态批处理策略](#动态批处理策略)
6. [多 GPU 推理](#多-gpu-推理)
7. [流水线并行](#流水线并行)
8. [KV Cache 管理](#kv-cache-管理)
9. [提示词缓存](#提示词缓存)
10. [推测解码](#推测解码)
11. [LLM 推理基准测试](#llm-推理基准测试)
12. [成本与性能取舍](#成本与性能取舍)
13. [生产优化检查清单](#生产优化检查清单)
14. [总结](#总结)

## 导论

优化 LLM 服务对于成本效率及用户体验都至关重要。本课介绍提高 LLM 推理吞吐量、降低延迟并减少基础设施费用的高级技术。

### 学习目标

完成本课后，你将能够：
- 实现多种量化技术（GPTQ、AWQ、GGUF、bitsandbytes）。
- 使用 Flash Attention 2 加速推理。
- 实现连续批处理及动态批处理。
- 使用张量并行及流水线并行配置多 GPU 推理。
- 优化 KV Cache 管理。
- 实现提示词缓存策略。
- 使用推测解码加速生成。
- 对 LLM 性能进行基准测试与分析。
- 根据充分的信息进行成本与性能取舍。

## 模型量化技术

### 理解量化

量化降低模型权重或激活值的精度，以一定的准确率损失风险换取显存及计算资源节省。

```python
# Quantization precision comparison
quantization_comparison = {
    'FP32': {
        'bits_per_param': 32,
        'memory_factor': 1.0,
        'speed_factor': 1.0,
        'accuracy': 'Baseline',
        'use_case': 'Research, maximum accuracy'
    },
    'FP16': {
        'bits_per_param': 16,
        'memory_factor': 0.5,
        'speed_factor': 1.5,
        'accuracy': '~100% of FP32',
        'use_case': 'Standard production deployment'
    },
    'INT8': {
        'bits_per_param': 8,
        'memory_factor': 0.25,
        'speed_factor': 2.0,
        'accuracy': '98-99% of FP32',
        'use_case': 'Memory-constrained deployments'
    },
    'INT4': {
        'bits_per_param': 4,
        'memory_factor': 0.125,
        'speed_factor': 2.5,
        'accuracy': '95-98% of FP32',
        'use_case': 'Edge devices, maximum throughput'
    }
}


def calculate_quantization_savings(model_size_b: float, from_precision: str, to_precision: str):
    """
    Calculate memory and cost savings from quantization
    """
    precision_bytes = {
        'FP32': 4,
        'FP16': 2,
        'BF16': 2,
        'INT8': 1,
        'INT4': 0.5
    }

    original_memory_gb = model_size_b * precision_bytes[from_precision]
    quantized_memory_gb = model_size_b * precision_bytes[to_precision]

    memory_reduction = original_memory_gb / quantized_memory_gb
    memory_saved_gb = original_memory_gb - quantized_memory_gb

    return {
        'original_memory_gb': round(original_memory_gb, 2),
        'quantized_memory_gb': round(quantized_memory_gb, 2),
        'memory_saved_gb': round(memory_saved_gb, 2),
        'reduction_factor': f"{memory_reduction:.1f}x",
        'percentage_saved': f"{(memory_saved_gb / original_memory_gb) * 100:.1f}%"
    }


# Example: Llama 2 70B
print("Llama 2 70B: FP16 → INT4")
print(calculate_quantization_savings(70, 'FP16', 'INT4'))
# Can fit 70B model in 35GB instead of 140GB!
```

### GPTQ（Generative Pre-trained Transformer Quantization）

GPTQ 是针对生成式模型优化的训练后量化方法。

```python
# Install dependencies
# pip install auto-gptq optimum

from transformers import AutoModelForCausalLM, AutoTokenizer, GPTQConfig

# GPTQ quantization configuration
gptq_config = GPTQConfig(
    bits=4,                          # Quantization bits
    dataset="c4",                    # Calibration dataset
    tokenizer=None,                  # Will be set below
    group_size=128,                  # Group size for quantization
    damp_percent=0.01,               # Damping percentage
    desc_act=False,                  # Activate descending order
    sym=True,                        # Symmetric quantization
    true_sequential=True,            # Sequential quantization
    use_cuda_fp16=True,              # Use CUDA FP16
    model_seqlen=2048,              # Model sequence length
)

# Load and quantize model
model_name = "meta-llama/Llama-2-7b-hf"
tokenizer = AutoTokenizer.from_pretrained(model_name)
gptq_config.tokenizer = tokenizer

# Quantize (this takes time - run once, save the result)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=gptq_config,
    device_map="auto"
)

# Save quantized model
model.save_pretrained("./llama-2-7b-gptq-4bit")
tokenizer.save_pretrained("./llama-2-7b-gptq-4bit")

# Later, load the quantized model (fast)
quantized_model = AutoModelForCausalLM.from_pretrained(
    "./llama-2-7b-gptq-4bit",
    device_map="auto"
)
```

### AWQ（Activation-aware Weight Quantization，激活感知权重量化）

AWQ 根据激活值统计信息保护重要权重，原文认为其可以获得优于 GPTQ 的准确率。

```python
# Install dependencies
# pip install autoawq

from awq import AutoAWQForCausalLM
from transformers import AutoTokenizer

model_name = "meta-llama/Llama-2-7b-hf"
quant_path = "llama-2-7b-awq-4bit"

# Load model
model = AutoAWQForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Quantization configuration
quant_config = {
    "zero_point": True,
    "q_group_size": 128,
    "w_bit": 4,
    "version": "GEMM"
}

# Quantize (using calibration data)
model.quantize(tokenizer, quant_config=quant_config)

# Save quantized model
model.save_quantized(quant_path)
tokenizer.save_pretrained(quant_path)

# Load for inference
model = AutoAWQForCausalLM.from_quantized(
    quant_path,
    fuse_layers=True,  # Fuse layers for faster inference
    device_map="auto"
)
```

### GGUF

GGUF（原文展开为 GPT-Generated Unified Format）主要用于 llama.cpp 生态中的 CPU 及边缘部署。

```bash
# Convert model to GGUF format
# Install llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Convert Hugging Face model to GGUF
python convert.py /path/to/llama-2-7b --outtype q4_0 --outfile llama-2-7b-q4_0.gguf

# Quantization types:
# q4_0: 4-bit (smallest, fastest)
# q4_1: 4-bit (better quality)
# q5_0: 5-bit
# q5_1: 5-bit (better quality)
# q8_0: 8-bit (best quality)

# Run inference
./main -m llama-2-7b-q4_0.gguf -p "Once upon a time" -n 128
```

### bitsandbytes 量化

bitsandbytes 为 Hugging Face 模型提供易于使用的量化能力。

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

# 8-bit quantization
bnb_config_8bit = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0,           # Outlier threshold
    llm_int8_has_fp16_weight=False,   # Use INT8 for all
)

model_8bit = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config_8bit,
    device_map="auto"
)

# 4-bit quantization (NF4)
bnb_config_4bit = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",        # NormalFloat4
    bnb_4bit_use_double_quant=True,   # Double quantization
)

model_4bit = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config_4bit,
    device_map="auto"
)

# Memory usage comparison
print(f"8-bit model memory: {model_8bit.get_memory_footprint() / 1e9:.2f} GB")
print(f"4-bit model memory: {model_4bit.get_memory_footprint() / 1e9:.2f} GB")
```

### 量化方案比较

```python
# Comprehensive quantization benchmark
class QuantizationBenchmark:
    """
    Compare different quantization methods
    """
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.results = {}

    def benchmark_method(self, method: str, config: dict):
        """
        Benchmark a specific quantization method
        """
        import time
        import torch

        # Load model based on method
        start_time = time.time()

        if method == 'fp16':
            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16,
                device_map="auto"
            )
        elif method == 'gptq':
            model = AutoModelForCausalLM.from_pretrained(
                config['model_path'],
                device_map="auto"
            )
        elif method == 'awq':
            from awq import AutoAWQForCausalLM
            model = AutoAWQForCausalLM.from_quantized(
                config['model_path'],
                fuse_layers=True,
                device_map="auto"
            )
        elif method == 'bnb_8bit':
            bnb_config = BitsAndBytesConfig(load_in_8bit=True)
            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                quantization_config=bnb_config,
                device_map="auto"
            )
        elif method == 'bnb_4bit':
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4"
            )
            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                quantization_config=bnb_config,
                device_map="auto"
            )

        load_time = time.time() - start_time

        # Get memory usage
        memory_gb = model.get_memory_footprint() / 1e9

        # Benchmark inference
        tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        prompt = "Once upon a time"
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Warmup
        for _ in range(3):
            with torch.no_grad():
                _ = model.generate(**inputs, max_new_tokens=10)

        # Measure
        num_runs = 10
        start_time = time.time()
        for _ in range(num_runs):
            with torch.no_grad():
                outputs = model.generate(**inputs, max_new_tokens=50)
        inference_time = (time.time() - start_time) / num_runs

        # Calculate tokens per second
        tokens_generated = 50
        tokens_per_sec = tokens_generated / inference_time

        self.results[method] = {
            'load_time_sec': round(load_time, 2),
            'memory_gb': round(memory_gb, 2),
            'inference_time_sec': round(inference_time, 3),
            'tokens_per_sec': round(tokens_per_sec, 2)
        }

        return self.results[method]

    def compare_all(self):
        """
        Compare all available quantization methods
        """
        methods = ['fp16', 'bnb_8bit', 'bnb_4bit']

        for method in methods:
            print(f"\nBenchmarking {method}...")
            try:
                result = self.benchmark_method(method, {})
                print(f"Results: {result}")
            except Exception as e:
                print(f"Failed: {e}")

        return self.results


# Usage
benchmark = QuantizationBenchmark("meta-llama/Llama-2-7b-hf")
results = benchmark.compare_all()
```

## Flash Attention 2

### 什么是 Flash Attention？

Flash Attention 是一种优化后的注意力算法，通过减少内存访问开销来降低显存使用并提高速度，而不改变注意力的数学定义。

**主要优势：**
- 注意力计算加速 2–4 倍（原文示例）。
- 减少显存使用，支持更长上下文。
- 数学上等价于标准注意力。

```python
# Using Flash Attention 2 with vLLM
from vllm import LLM, SamplingParams

# Flash Attention 2 is enabled by default in vLLM
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=1,
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    # Flash Attention 2 automatically used if available
)

# For Hugging Face Transformers
from transformers import AutoModelForCausalLM
import torch

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-chat-hf",
    torch_dtype=torch.float16,
    device_map="auto",
    attn_implementation="flash_attention_2"  # Enable Flash Attention 2
)
```

### Flash Attention 对性能的影响

```python
# Flash Attention benchmark comparison
class FlashAttentionBenchmark:
    """
    Compare standard attention vs Flash Attention
    """
    def __init__(self, model_name: str):
        self.model_name = model_name

    def benchmark_attention(self, use_flash: bool, sequence_length: int):
        """
        Benchmark with/without Flash Attention
        """
        import time
        import torch

        # Load model
        if use_flash:
            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                attn_implementation="flash_attention_2"
            )
        else:
            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                attn_implementation="eager"  # Standard attention
            )

        tokenizer = AutoTokenizer.from_pretrained(self.model_name)

        # Create long prompt
        prompt = "Hello " * (sequence_length // 2)
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Warmup
        for _ in range(3):
            with torch.no_grad():
                _ = model.generate(**inputs, max_new_tokens=10)

        # Measure
        num_runs = 5
        start_time = time.time()
        for _ in range(num_runs):
            with torch.no_grad():
                outputs = model.generate(**inputs, max_new_tokens=50)

        avg_time = (time.time() - start_time) / num_runs

        # Memory usage
        memory_gb = torch.cuda.max_memory_allocated() / 1e9

        return {
            'attention_type': 'Flash Attention 2' if use_flash else 'Standard',
            'sequence_length': sequence_length,
            'avg_time_sec': round(avg_time, 3),
            'memory_gb': round(memory_gb, 2),
            'tokens_per_sec': round(50 / avg_time, 2)
        }

    def compare(self, sequence_lengths=[512, 1024, 2048, 4096]):
        """
        Compare Flash vs Standard across different sequence lengths
        """
        results = []

        for seq_len in sequence_lengths:
            print(f"\nTesting sequence length: {seq_len}")

            # Standard attention
            std_result = self.benchmark_attention(False, seq_len)
            print(f"Standard: {std_result}")

            # Flash attention
            flash_result = self.benchmark_attention(True, seq_len)
            print(f"Flash: {flash_result}")

            # Calculate improvement
            speedup = std_result['avg_time_sec'] / flash_result['avg_time_sec']
            memory_savings = std_result['memory_gb'] - flash_result['memory_gb']

            results.append({
                'sequence_length': seq_len,
                'standard_time': std_result['avg_time_sec'],
                'flash_time': flash_result['avg_time_sec'],
                'speedup': f"{speedup:.2f}x",
                'memory_savings_gb': round(memory_savings, 2)
            })

        return results


# Usage
benchmark = FlashAttentionBenchmark("meta-llama/Llama-2-7b-chat-hf")
results = benchmark.compare()
```

### 在生产环境中启用 Flash Attention

```python
# Dockerfile for Flash Attention support
"""
FROM nvidia/cuda:12.1.0-devel-ubuntu22.04

# Install dependencies
RUN apt-get update && apt-get install -y python3-pip git

# Install Flash Attention 2
RUN pip install packaging ninja
RUN pip install flash-attn --no-build-isolation

# Install vLLM with Flash Attention support
RUN pip install vllm

# Your application code
COPY . /app
WORKDIR /app

CMD ["python", "serve.py"]
"""

# Kubernetes deployment with Flash Attention
"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-server-flash-attn
spec:
  replicas: 2
  selector:
    matchLabels:
      app: llm-server
  template:
    metadata:
      labels:
        app: llm-server
    spec:
      containers:
      - name: vllm
        image: your-registry/vllm-flash-attn:latest
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: 32Gi
          requests:
            nvidia.com/gpu: 1
            memory: 32Gi
        env:
        - name: MODEL_NAME
          value: "meta-llama/Llama-2-7b-chat-hf"
        - name: MAX_MODEL_LEN
          value: "4096"
        ports:
        - containerPort: 8000
"""
```

## 连续批处理

### 理解连续批处理

传统静态批处理需要等待批次内所有请求完成后，才能处理新的请求。连续批处理（Continuous Batching，也称迭代级批处理）允许在出现空闲位置时加入新请求。

```python
# Visualization of batching strategies
"""
Traditional Static Batching:
Time: 0s    1s    2s    3s    4s    5s
Req1: [================]
Req2: [================]
Req3: [================]
Req4:                   [================]
Req5:                   [================]
Req6:                   [================]

Continuous Batching:
Time: 0s    1s    2s    3s    4s    5s
Req1: [================]
Req2: [================]
Req3: [================]
Req4:      [================]
Req5:           [================]
Req6:                [================]

Result: Continuous batching achieves higher GPU utilization and lower average latency!
"""
```

### vLLM 连续批处理

vLLM 默认实现连续批处理，PagedAttention 为高效显存管理提供支持：

```python
from vllm import LLM, SamplingParams
from typing import List

# Initialize vLLM with optimized settings for continuous batching
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=1,
    max_num_batched_tokens=8192,      # Max tokens in a batch
    max_num_seqs=256,                 # Max concurrent sequences
    gpu_memory_utilization=0.90,      # Leave headroom for dynamic batching
    enable_prefix_caching=True,       # Cache common prefixes
)

# Sampling parameters
sampling_params = SamplingParams(
    temperature=0.8,
    top_p=0.95,
    max_tokens=256
)

# Process multiple requests (continuous batching happens automatically)
prompts = [
    "Write a story about",
    "Explain quantum computing",
    "What is the capital of",
    # ... hundreds of prompts
]

# vLLM automatically batches and schedules these efficiently
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(f"Prompt: {output.prompt}")
    print(f"Output: {output.outputs[0].text}\n")
```

### 连续批处理指标

```python
# Monitor continuous batching performance
class ContinuousBatchingMonitor:
    """
    Monitor continuous batching metrics
    """
    def __init__(self):
        self.metrics = {
            'batch_sizes': [],
            'queue_lengths': [],
            'gpu_utilization': [],
            'throughput': []
        }

    def collect_metrics(self, batch_size: int, queue_length: int, gpu_util: float):
        """
        Collect metrics during serving
        """
        self.metrics['batch_sizes'].append(batch_size)
        self.metrics['queue_lengths'].append(queue_length)
        self.metrics['gpu_utilization'].append(gpu_util)

    def calculate_throughput(self, tokens_generated: int, time_elapsed: float):
        """
        Calculate tokens per second
        """
        throughput = tokens_generated / time_elapsed
        self.metrics['throughput'].append(throughput)
        return throughput

    def report(self):
        """
        Generate performance report
        """
        import numpy as np

        report = {
            'avg_batch_size': np.mean(self.metrics['batch_sizes']),
            'p95_batch_size': np.percentile(self.metrics['batch_sizes'], 95),
            'avg_queue_length': np.mean(self.metrics['queue_lengths']),
            'avg_gpu_utilization': np.mean(self.metrics['gpu_utilization']),
            'avg_throughput': np.mean(self.metrics['throughput'])
        }

        return report


# Integration with vLLM server
"""
# In your vLLM server code:
monitor = ContinuousBatchingMonitor()

# After each batch
monitor.collect_metrics(
    batch_size=current_batch_size,
    queue_length=len(request_queue),
    gpu_util=get_gpu_utilization()
)

# Periodically log report
if time.time() - last_report_time > 60:
    print(monitor.report())
    last_report_time = time.time()
"""
```

## 动态批处理策略

### 自适应批大小

```python
class AdaptiveBatcher:
    """
    Dynamically adjust batch size based on request patterns
    """
    def __init__(
        self,
        min_batch_size: int = 1,
        max_batch_size: int = 32,
        target_latency_ms: float = 100
    ):
        self.min_batch_size = min_batch_size
        self.max_batch_size = max_batch_size
        self.target_latency_ms = target_latency_ms
        self.current_batch_size = min_batch_size
        self.latency_history = []

    def adjust_batch_size(self, observed_latency_ms: float):
        """
        Adjust batch size based on observed latency
        """
        self.latency_history.append(observed_latency_ms)

        # Keep last 100 measurements
        if len(self.latency_history) > 100:
            self.latency_history.pop(0)

        # Calculate average latency
        avg_latency = sum(self.latency_history) / len(self.latency_history)

        # Adjust batch size
        if avg_latency < self.target_latency_ms * 0.8:
            # Latency is good, increase batch size
            self.current_batch_size = min(
                self.current_batch_size + 1,
                self.max_batch_size
            )
        elif avg_latency > self.target_latency_ms * 1.2:
            # Latency is too high, decrease batch size
            self.current_batch_size = max(
                self.current_batch_size - 1,
                self.min_batch_size
            )

        return self.current_batch_size

    def get_batch_size(self) -> int:
        """
        Get current recommended batch size
        """
        return self.current_batch_size


# Usage in serving loop
batcher = AdaptiveBatcher(
    min_batch_size=1,
    max_batch_size=64,
    target_latency_ms=100
)

while True:
    # Get current batch size
    batch_size = batcher.get_batch_size()

    # Process batch
    start_time = time.time()
    outputs = process_batch(requests[:batch_size])
    latency_ms = (time.time() - start_time) * 1000

    # Adjust for next iteration
    batcher.adjust_batch_size(latency_ms)
```

### 基于优先级的批处理

```python
from queue import PriorityQueue
import time
from dataclasses import dataclass, field
from typing import Any

@dataclass(order=True)
class PrioritizedRequest:
    """
    Request with priority for batching
    """
    priority: int
    timestamp: float = field(compare=False)
    request_id: str = field(compare=False)
    prompt: str = field(compare=False)
    params: Any = field(compare=False)


class PriorityBatcher:
    """
    Batch requests based on priority
    """
    def __init__(self, batch_size: int = 8):
        self.batch_size = batch_size
        self.queue = PriorityQueue()

    def add_request(
        self,
        request_id: str,
        prompt: str,
        priority: int = 5,  # 1 = highest, 10 = lowest
        params: dict = None
    ):
        """
        Add request to queue with priority
        """
        request = PrioritizedRequest(
            priority=priority,
            timestamp=time.time(),
            request_id=request_id,
            prompt=prompt,
            params=params or {}
        )
        self.queue.put(request)

    def get_batch(self):
        """
        Get next batch, prioritizing high-priority requests
        """
        batch = []
        while len(batch) < self.batch_size and not self.queue.empty():
            batch.append(self.queue.get())

        return batch

    def has_requests(self):
        """
        Check if there are pending requests
        """
        return not self.queue.empty()


# Usage
batcher = PriorityBatcher(batch_size=8)

# Add requests with different priorities
batcher.add_request("req1", "Regular prompt", priority=5)
batcher.add_request("req2", "Important prompt", priority=1)  # Processed first
batcher.add_request("req3", "Low priority prompt", priority=10)

# Get batch (high priority first)
batch = batcher.get_batch()
```

## 多 GPU 推理

### 张量并行

张量并行将单个模型层拆分至多个 GPU，可用于无法装入单块 GPU 的大型模型。

```python
# vLLM with tensor parallelism
from vllm import LLM, SamplingParams

# Split model across 4 GPUs
llm = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    tensor_parallel_size=4,           # Use 4 GPUs
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    dtype="float16"
)

# Usage is the same
outputs = llm.generate(prompts, sampling_params)
```

### 张量并行配置

```python
# Calculate optimal tensor parallel size
def calculate_tensor_parallel_size(
    model_size_b: float,
    available_gpus: list,
    precision: str = "fp16"
):
    """
    Calculate optimal number of GPUs for tensor parallelism
    """
    # Memory calculation
    precision_bytes = {'fp32': 4, 'fp16': 2, 'int8': 1}
    model_memory_gb = model_size_b * precision_bytes[precision]

    # Add overhead for KV cache and activations (50%)
    total_memory_needed = model_memory_gb * 1.5

    # GPU memory (GB)
    gpu_memory = {
        'T4': 16,
        'A10G': 24,
        'A100-40GB': 40,
        'A100-80GB': 80
    }

    configurations = []

    for gpu_type in available_gpus:
        single_gpu_memory = gpu_memory[gpu_type]

        # Calculate minimum GPUs needed
        min_gpus = int(np.ceil(total_memory_needed / single_gpu_memory))

        # Tensor parallel size should be power of 2
        tp_sizes = [1, 2, 4, 8]
        valid_tp_sizes = [tp for tp in tp_sizes if tp >= min_gpus]

        for tp in valid_tp_sizes:
            memory_per_gpu = total_memory_needed / tp
            utilization = memory_per_gpu / single_gpu_memory

            if utilization <= 0.95:  # Leave some headroom
                configurations.append({
                    'gpu_type': gpu_type,
                    'tensor_parallel_size': tp,
                    'memory_per_gpu_gb': round(memory_per_gpu, 2),
                    'utilization': f"{utilization * 100:.1f}%",
                    'total_gpus_needed': tp
                })

    return configurations


# Example: Llama 2 70B
configs = calculate_tensor_parallel_size(
    model_size_b=70,
    available_gpus=['A10G', 'A100-40GB', 'A100-80GB'],
    precision='fp16'
)

print("Optimal configurations for Llama 2 70B:")
for config in configs:
    print(config)
```

### 使用 Ray Serve 实现多模型、多 GPU 服务

```python
# Deploy multiple models across GPUs with Ray Serve
from ray import serve
import ray
from vllm import LLM, SamplingParams

# Initialize Ray
ray.init()

@serve.deployment(
    ray_actor_options={"num_gpus": 1},
    autoscaling_config={"min_replicas": 1, "max_replicas": 4}
)
class LLMDeployment:
    def __init__(self, model_name: str):
        self.llm = LLM(
            model=model_name,
            tensor_parallel_size=1,
            gpu_memory_utilization=0.90
        )
        self.sampling_params = SamplingParams(
            temperature=0.8,
            top_p=0.95,
            max_tokens=256
        )

    def __call__(self, request):
        prompt = request.query_params.get("prompt")
        outputs = self.llm.generate([prompt], self.sampling_params)
        return {"text": outputs[0].outputs[0].text}


# Deploy multiple models
serve.run(
    LLMDeployment.bind(model_name="meta-llama/Llama-2-7b-chat-hf"),
    name="llama-7b",
    route_prefix="/v1/llama-7b"
)

serve.run(
    LLMDeployment.bind(model_name="mistralai/Mistral-7B-Instruct-v0.1"),
    name="mistral-7b",
    route_prefix="/v1/mistral-7b"
)

# Each model automatically gets its own GPU(s) via Ray's scheduling
```

## 流水线并行

### 理解流水线并行

流水线并行将模型拆分为多个阶段，每个阶段位于不同 GPU，适用于超大型模型及高吞吐量场景。

```python
# Pipeline parallelism visualization
"""
GPU 0: [Layers 0-7  ]  →  [Layers 0-7  ]  →  [Layers 0-7  ]
GPU 1: [Layers 8-15 ]  →  [Layers 8-15 ]  →  [Layers 8-15 ]
GPU 2: [Layers 16-23]  →  [Layers 16-23]  →  [Layers 16-23]
GPU 3: [Layers 24-31]  →  [Layers 24-31]  →  [Layers 24-31]

Time:  Batch 1         Batch 2         Batch 3

Pipeline parallelism allows processing multiple batches simultaneously!
"""
```

### DeepSpeed 推理流水线

```python
# DeepSpeed inference with pipeline parallelism
import deepspeed
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "meta-llama/Llama-2-70b-hf"

# Load model
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# DeepSpeed inference configuration
ds_config = {
    "fp16": {
        "enabled": True
    },
    "bf16": {
        "enabled": False
    },
    "zero_optimization": {
        "stage": 3,
        "offload_param": {
            "device": "cpu"
        }
    },
    "tensor_parallel": {
        "tp_size": 4  # 4-way tensor parallelism
    },
    "pipeline_parallel": {
        "pp_size": 2  # 2-way pipeline parallelism
    }
}

# Initialize DeepSpeed engine
engine = deepspeed.init_inference(
    model=model,
    config=ds_config,
    tensor_parallel={"tp_size": 4},
    dtype=torch.float16,
    replace_with_kernel_inject=True
)

# Use model for inference
inputs = tokenizer("Hello, world!", return_tensors="pt")
outputs = engine.module.generate(**inputs, max_new_tokens=50)
print(tokenizer.decode(outputs[0]))
```

## KV Cache 管理

### 理解 KV Cache

KV（Key-Value，键值）缓存保存先前 token 的注意力 Key 与 Value，避免在生成过程中重复计算。

```python
# KV cache memory calculation
def calculate_kv_cache_memory(
    batch_size: int,
    sequence_length: int,
    num_layers: int,
    hidden_size: int,
    num_attention_heads: int,
    precision_bytes: int = 2  # FP16
):
    """
    Calculate KV cache memory requirements
    """
    # Keys and Values for each layer
    # Each: (batch_size, num_heads, seq_length, head_dim)
    head_dim = hidden_size // num_attention_heads

    # Memory per layer (keys + values)
    memory_per_layer = (
        2 *  # keys and values
        batch_size *
        num_attention_heads *
        sequence_length *
        head_dim *
        precision_bytes
    )

    total_memory = memory_per_layer * num_layers

    return {
        'memory_per_layer_mb': memory_per_layer / (1024**2),
        'total_memory_mb': total_memory / (1024**2),
        'total_memory_gb': total_memory / (1024**3)
    }


# Example: Llama 2 7B with batch of 8
kv_cache = calculate_kv_cache_memory(
    batch_size=8,
    sequence_length=2048,
    num_layers=32,
    hidden_size=4096,
    num_attention_heads=32
)
print(f"KV Cache for batch of 8: {kv_cache['total_memory_gb']:.2f} GB")
```

### PagedAttention（vLLM 的方法）

PagedAttention 类似虚拟内存分页机制管理 KV Cache，提高显存使用效率，并支持动态批处理。

```python
# vLLM with optimized KV cache management
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=1,
    max_model_len=4096,
    gpu_memory_utilization=0.90,  # Reserve memory for KV cache
    # PagedAttention automatically manages KV cache efficiently
)

# vLLM benefits:
# - Non-contiguous KV cache (like virtual memory paging)
# - Efficient memory sharing for common prefixes
# - Dynamic allocation based on actual sequence length
```

### KV Cache 优化策略

```python
class KVCacheOptimizer:
    """
    Strategies for optimizing KV cache usage
    """
    @staticmethod
    def estimate_max_batch_size(
        available_memory_gb: float,
        model_memory_gb: float,
        sequence_length: int,
        kv_cache_per_token_mb: float
    ):
        """
        Estimate maximum batch size given memory constraints
        """
        # Available memory for KV cache
        kv_cache_memory_gb = available_memory_gb - model_memory_gb

        # Memory per sequence
        memory_per_sequence_mb = sequence_length * kv_cache_per_token_mb
        memory_per_sequence_gb = memory_per_sequence_mb / 1024

        # Maximum batch size
        max_batch_size = int(kv_cache_memory_gb / memory_per_sequence_gb)

        return max(1, max_batch_size)

    @staticmethod
    def optimize_for_throughput(
        target_throughput_tokens_per_sec: int,
        model_tokens_per_sec_single: int,
        available_memory_gb: float,
        model_memory_gb: float
    ):
        """
        Find optimal configuration for target throughput
        """
        # Calculate required batch size
        required_batch = target_throughput_tokens_per_sec / model_tokens_per_sec_single

        # Check if memory allows this batch size
        max_batch = KVCacheOptimizer.estimate_max_batch_size(
            available_memory_gb=available_memory_gb,
            model_memory_gb=model_memory_gb,
            sequence_length=2048,  # Assume 2K context
            kv_cache_per_token_mb=0.5  # Rough estimate
        )

        if required_batch <= max_batch:
            return {
                'feasible': True,
                'recommended_batch_size': int(required_batch),
                'max_batch_size': max_batch
            }
        else:
            return {
                'feasible': False,
                'required_batch_size': int(required_batch),
                'max_batch_size': max_batch,
                'suggestion': 'Need more GPUs or smaller model'
            }


# Usage
optimizer = KVCacheOptimizer()

config = optimizer.optimize_for_throughput(
    target_throughput_tokens_per_sec=1000,
    model_tokens_per_sec_single=50,
    available_memory_gb=80,
    model_memory_gb=14
)
print(config)
```

## 提示词缓存

### 自动前缀缓存（Automatic Prefix Caching）

缓存公共提示词前缀，避免重复计算。

```python
# vLLM with prefix caching
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    enable_prefix_caching=True,  # Enable prefix caching
    max_model_len=4096
)

# Common system prompt
system_prompt = """You are a helpful AI assistant. You are knowledgeable,
accurate, and always strive to provide the best possible answers."""

# Multiple requests with same prefix
prompts = [
    f"{system_prompt}\n\nUser: What is Python?\nAssistant:",
    f"{system_prompt}\n\nUser: What is JavaScript?\nAssistant:",
    f"{system_prompt}\n\nUser: What is Rust?\nAssistant:",
]

# First request processes full prompt
# Subsequent requests reuse cached system prompt computation!
outputs = llm.generate(prompts, SamplingParams(max_tokens=100))
```

### 手动响应缓存

```python
import hashlib
import json
from typing import Optional
import redis

class LLMResponseCache:
    """
    Cache LLM responses for identical requests
    """
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        self.ttl_seconds = 3600  # 1 hour cache

    def _generate_cache_key(self, prompt: str, params: dict) -> str:
        """
        Generate cache key from prompt and parameters
        """
        cache_input = {
            'prompt': prompt,
            'params': params
        }
        cache_str = json.dumps(cache_input, sort_keys=True)
        return hashlib.md5(cache_str.encode()).hexdigest()

    def get(self, prompt: str, params: dict) -> Optional[str]:
        """
        Get cached response if available
        """
        key = self._generate_cache_key(prompt, params)
        cached = self.redis_client.get(key)

        if cached:
            # Update stats
            self.redis_client.incr("cache_hits")
            return cached

        self.redis_client.incr("cache_misses")
        return None

    def set(self, prompt: str, params: dict, response: str):
        """
        Cache response
        """
        key = self._generate_cache_key(prompt, params)
        self.redis_client.setex(key, self.ttl_seconds, response)

    def get_stats(self):
        """
        Get cache statistics
        """
        hits = int(self.redis_client.get("cache_hits") or 0)
        misses = int(self.redis_client.get("cache_misses") or 0)
        total = hits + misses

        return {
            'hits': hits,
            'misses': misses,
            'total_requests': total,
            'hit_rate': (hits / total * 100) if total > 0 else 0
        }


# Usage with LLM serving
cache = LLMResponseCache()

def generate_with_cache(prompt: str, params: dict):
    """
    Generate response with caching
    """
    # Check cache first
    cached_response = cache.get(prompt, params)
    if cached_response:
        return cached_response

    # Generate new response
    response = llm.generate([prompt], SamplingParams(**params))
    response_text = response[0].outputs[0].text

    # Cache result
    cache.set(prompt, params, response_text)

    return response_text
```

### 语义缓存（Semantic Caching）

```python
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Tuple

class SemanticCache:
    """
    Cache based on semantic similarity rather than exact matches
    """
    def __init__(self, similarity_threshold: float = 0.95):
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.cache = []  # List of (embedding, prompt, response)
        self.similarity_threshold = similarity_threshold

    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Get embedding for text
        """
        return self.embedding_model.encode(text)

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculate cosine similarity between vectors
        """
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

    def get(self, prompt: str) -> Optional[str]:
        """
        Get cached response if semantically similar prompt exists
        """
        if not self.cache:
            return None

        # Get embedding for new prompt
        prompt_embedding = self._get_embedding(prompt)

        # Find most similar cached prompt
        max_similarity = 0
        best_match = None

        for cached_embedding, cached_prompt, cached_response in self.cache:
            similarity = self._cosine_similarity(prompt_embedding, cached_embedding)

            if similarity > max_similarity:
                max_similarity = similarity
                best_match = cached_response

        # Return if above threshold
        if max_similarity >= self.similarity_threshold:
            return best_match

        return None

    def set(self, prompt: str, response: str):
        """
        Add prompt and response to cache
        """
        embedding = self._get_embedding(prompt)
        self.cache.append((embedding, prompt, response))

        # Limit cache size
        if len(self.cache) > 1000:
            self.cache.pop(0)


# Usage
semantic_cache = SemanticCache(similarity_threshold=0.95)

# First query
prompt1 = "What is machine learning?"
response1 = generate_llm_response(prompt1)
semantic_cache.set(prompt1, response1)

# Similar query (will hit cache)
prompt2 = "Can you explain machine learning?"
cached = semantic_cache.get(prompt2)  # Returns response1!
```

## 推测解码

### 什么是推测解码？

推测解码（Speculative Decoding）使用较小的草稿模型快速生成候选 token，再通过较大的目标模型并行验证这些候选 token。原文示例可获得 2–3 倍加速。

```python
# Speculative decoding with vLLM
from vllm import LLM, SamplingParams

# Target model (large, accurate)
target_model = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    tensor_parallel_size=4
)

# Draft model (small, fast)
draft_model = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=1
)

# Enable speculative decoding
target_model.enable_speculative_decoding(
    draft_model=draft_model,
    num_speculative_tokens=5  # Generate 5 tokens ahead
)

# Use normally - speculative decoding happens automatically
outputs = target_model.generate(prompts, sampling_params)
```

### 实现推测解码

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

class SpeculativeDecoder:
    """
    Implement speculative decoding manually
    """
    def __init__(
        self,
        target_model_name: str,
        draft_model_name: str,
        num_speculative_tokens: int = 5
    ):
        # Load models
        self.target_model = AutoModelForCausalLM.from_pretrained(
            target_model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        self.draft_model = AutoModelForCausalLM.from_pretrained(
            draft_model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        self.tokenizer = AutoTokenizer.from_pretrained(target_model_name)
        self.num_speculative_tokens = num_speculative_tokens

    def generate(self, prompt: str, max_tokens: int = 100):
        """
        Generate text using speculative decoding
        """
        # Tokenize prompt
        input_ids = self.tokenizer.encode(prompt, return_tensors="pt").to(
            self.target_model.device
        )

        generated_tokens = []
        accepted_tokens = 0
        total_drafted_tokens = 0

        while len(generated_tokens) < max_tokens:
            # Step 1: Draft model generates K tokens
            draft_tokens = self._draft_generate(
                input_ids,
                num_tokens=self.num_speculative_tokens
            )
            total_drafted_tokens += len(draft_tokens)

            # Step 2: Target model verifies all at once (parallel)
            accepted = self._verify_tokens(input_ids, draft_tokens)
            accepted_tokens += len(accepted)

            # Step 3: Add accepted tokens
            generated_tokens.extend(accepted)
            input_ids = torch.cat([
                input_ids,
                torch.tensor([accepted], device=input_ids.device)
            ], dim=1)

            # If not all tokens accepted, generate one more with target model
            if len(accepted) < len(draft_tokens):
                next_token = self._target_generate_one(input_ids)
                generated_tokens.append(next_token)
                input_ids = torch.cat([
                    input_ids,
                    torch.tensor([[next_token]], device=input_ids.device)
                ], dim=1)
                accepted_tokens += 1

        # Calculate acceptance rate
        acceptance_rate = accepted_tokens / total_drafted_tokens if total_drafted_tokens > 0 else 0

        # Decode
        output_text = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)

        return {
            'text': output_text,
            'acceptance_rate': acceptance_rate,
            'total_tokens': len(generated_tokens)
        }

    def _draft_generate(self, input_ids: torch.Tensor, num_tokens: int):
        """
        Generate tokens with draft model
        """
        draft_tokens = []

        with torch.no_grad():
            current_ids = input_ids

            for _ in range(num_tokens):
                outputs = self.draft_model(current_ids)
                next_token = outputs.logits[:, -1, :].argmax(dim=-1)
                draft_tokens.append(next_token.item())
                current_ids = torch.cat([
                    current_ids,
                    next_token.unsqueeze(0)
                ], dim=1)

        return draft_tokens

    def _verify_tokens(self, input_ids: torch.Tensor, draft_tokens: list):
        """
        Verify draft tokens with target model (parallel)
        """
        # Create input with all draft tokens
        all_ids = torch.cat([
            input_ids,
            torch.tensor([draft_tokens], device=input_ids.device)
        ], dim=1)

        # Get target model's predictions for all positions at once
        with torch.no_grad():
            outputs = self.target_model(all_ids)
            predictions = outputs.logits[:, -len(draft_tokens)-1:-1, :].argmax(dim=-1)

        # Check which tokens match
        accepted = []
        for i, (pred, draft) in enumerate(zip(predictions[0], draft_tokens)):
            if pred.item() == draft:
                accepted.append(draft)
            else:
                break  # Stop at first mismatch

        return accepted

    def _target_generate_one(self, input_ids: torch.Tensor):
        """
        Generate one token with target model
        """
        with torch.no_grad():
            outputs = self.target_model(input_ids)
            next_token = outputs.logits[:, -1, :].argmax(dim=-1)
        return next_token.item()


# Usage
decoder = SpeculativeDecoder(
    target_model_name="meta-llama/Llama-2-13b-chat-hf",
    draft_model_name="meta-llama/Llama-2-7b-chat-hf",
    num_speculative_tokens=5
)

result = decoder.generate("Once upon a time", max_tokens=100)
print(f"Generated: {result['text']}")
print(f"Acceptance rate: {result['acceptance_rate']:.2%}")
```

## LLM 推理基准测试

### 综合基准测试套件

```python
import time
import torch
import numpy as np
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class BenchmarkResult:
    """
    Results from a benchmark run
    """
    metric_name: str
    value: float
    unit: str
    percentile: Optional[int] = None


class LLMBenchmark:
    """
    Comprehensive LLM inference benchmarking
    """
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer
        self.results = {}

    def benchmark_latency(
        self,
        prompts: List[str],
        max_tokens: int = 50,
        num_warmup: int = 3,
        num_runs: int = 10
    ):
        """
        Benchmark inference latency
        """
        # Warmup
        for _ in range(num_warmup):
            inputs = self.tokenizer(prompts[0], return_tensors="pt").to(self.model.device)
            with torch.no_grad():
                _ = self.model.generate(**inputs, max_new_tokens=10)

        # Measure
        latencies = []
        for _ in range(num_runs):
            for prompt in prompts:
                inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

                start_time = time.time()
                with torch.no_grad():
                    outputs = self.model.generate(**inputs, max_new_tokens=max_tokens)
                latency = time.time() - start_time

                latencies.append(latency * 1000)  # Convert to ms

        # Calculate statistics
        self.results['latency'] = {
            'mean_ms': np.mean(latencies),
            'median_ms': np.median(latencies),
            'p50_ms': np.percentile(latencies, 50),
            'p95_ms': np.percentile(latencies, 95),
            'p99_ms': np.percentile(latencies, 99),
            'min_ms': np.min(latencies),
            'max_ms': np.max(latencies),
            'std_ms': np.std(latencies)
        }

        return self.results['latency']

    def benchmark_throughput(
        self,
        prompts: List[str],
        max_tokens: int = 50,
        duration_seconds: int = 60
    ):
        """
        Benchmark throughput (requests per second)
        """
        start_time = time.time()
        num_requests = 0
        total_tokens = 0

        while time.time() - start_time < duration_seconds:
            prompt = prompts[num_requests % len(prompts)]
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

            with torch.no_grad():
                outputs = self.model.generate(**inputs, max_new_tokens=max_tokens)

            num_requests += 1
            total_tokens += outputs.shape[1]

        elapsed = time.time() - start_time

        self.results['throughput'] = {
            'requests_per_second': num_requests / elapsed,
            'tokens_per_second': total_tokens / elapsed,
            'total_requests': num_requests,
            'total_tokens': total_tokens,
            'duration_seconds': elapsed
        }

        return self.results['throughput']

    def benchmark_memory(self):
        """
        Benchmark GPU memory usage
        """
        torch.cuda.reset_peak_memory_stats()

        # Run a few inferences
        prompt = "Hello, world!"
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            _ = self.model.generate(**inputs, max_new_tokens=100)

        # Get memory stats
        allocated_gb = torch.cuda.memory_allocated() / 1e9
        reserved_gb = torch.cuda.memory_reserved() / 1e9
        peak_gb = torch.cuda.max_memory_allocated() / 1e9

        self.results['memory'] = {
            'allocated_gb': allocated_gb,
            'reserved_gb': reserved_gb,
            'peak_gb': peak_gb
        }

        return self.results['memory']

    def benchmark_scaling(
        self,
        base_prompt: str,
        sequence_lengths: List[int] = [128, 256, 512, 1024, 2048]
    ):
        """
        Benchmark how latency scales with sequence length
        """
        scaling_results = []

        for seq_len in sequence_lengths:
            # Create prompt of specific length
            tokens = self.tokenizer.encode(base_prompt)
            while len(tokens) < seq_len:
                tokens.extend(tokens[:min(len(tokens), seq_len - len(tokens))])
            tokens = tokens[:seq_len]
            prompt = self.tokenizer.decode(tokens)

            # Measure latency
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

            latencies = []
            for _ in range(5):
                start_time = time.time()
                with torch.no_grad():
                    _ = self.model.generate(**inputs, max_new_tokens=50)
                latencies.append((time.time() - start_time) * 1000)

            scaling_results.append({
                'sequence_length': seq_len,
                'avg_latency_ms': np.mean(latencies),
                'tokens_per_second': 50 / (np.mean(latencies) / 1000)
            })

        self.results['scaling'] = scaling_results
        return scaling_results

    def generate_report(self):
        """
        Generate comprehensive benchmark report
        """
        print("=" * 60)
        print("LLM INFERENCE BENCHMARK REPORT")
        print("=" * 60)

        if 'latency' in self.results:
            print("\nLatency Metrics:")
            for key, value in self.results['latency'].items():
                print(f"  {key}: {value:.2f}")

        if 'throughput' in self.results:
            print("\nThroughput Metrics:")
            for key, value in self.results['throughput'].items():
                print(f"  {key}: {value:.2f}")

        if 'memory' in self.results:
            print("\nMemory Metrics:")
            for key, value in self.results['memory'].items():
                print(f"  {key}: {value:.2f}")

        if 'scaling' in self.results:
            print("\nScaling Analysis:")
            for result in self.results['scaling']:
                print(f"  Seq Length {result['sequence_length']}: "
                      f"{result['avg_latency_ms']:.2f}ms, "
                      f"{result['tokens_per_second']:.2f} tokens/sec")

        print("=" * 60)


# Usage
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-chat-hf",
    torch_dtype=torch.float16,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")

benchmark = LLMBenchmark(model, tokenizer)

# Run benchmarks
prompts = [
    "What is machine learning?",
    "Explain quantum computing",
    "Write a story about"
]

benchmark.benchmark_latency(prompts)
benchmark.benchmark_throughput(prompts, duration_seconds=30)
benchmark.benchmark_memory()
benchmark.benchmark_scaling("Hello world")

# Generate report
benchmark.generate_report()
```

## 成本与性能取舍

### 优化决策框架

```python
class CostPerformanceOptimizer:
    """
    Framework for making cost vs performance trade-off decisions
    """
    def __init__(self):
        self.gpu_costs = {
            'T4': 0.40,
            'A10G': 1.20,
            'A100-40GB': 3.50,
            'A100-80GB': 5.00
        }

        self.performance_factors = {
            'T4': 1.0,
            'A10G': 2.5,
            'A100-40GB': 5.0,
            'A100-80GB': 5.5
        }

    def analyze_configuration(
        self,
        gpu_type: str,
        quantization: str,
        batch_size: int,
        requests_per_day: int,
        target_latency_ms: int
    ):
        """
        Analyze a specific configuration
        """
        # Base performance
        base_performance = self.performance_factors[gpu_type]

        # Quantization impact
        quant_speedup = {
            'fp16': 1.0,
            'int8': 1.5,
            'int4': 2.0
        }[quantization]

        # Effective performance
        effective_performance = base_performance * quant_speedup

        # Batch size impact on latency
        latency_penalty = 1 + (batch_size - 1) * 0.1

        # Estimated latency
        estimated_latency_ms = 100 / effective_performance * latency_penalty

        # Meets SLA?
        meets_sla = estimated_latency_ms <= target_latency_ms

        # Cost calculation
        requests_per_second = requests_per_day / 86400
        gpus_needed = max(1, requests_per_second / (effective_performance * batch_size))

        monthly_cost = gpus_needed * self.gpu_costs[gpu_type] * 24 * 30

        # Cost per request
        cost_per_request = monthly_cost / requests_per_day / 30

        return {
            'configuration': {
                'gpu_type': gpu_type,
                'quantization': quantization,
                'batch_size': batch_size
            },
            'performance': {
                'estimated_latency_ms': round(estimated_latency_ms, 2),
                'meets_sla': meets_sla,
                'effective_performance': round(effective_performance, 2)
            },
            'cost': {
                'gpus_needed': round(gpus_needed, 2),
                'monthly_cost': round(monthly_cost, 2),
                'cost_per_request': round(cost_per_request, 6)
            },
            'score': self._calculate_score(
                meets_sla, cost_per_request, estimated_latency_ms, target_latency_ms
            )
        }

    def _calculate_score(
        self,
        meets_sla: bool,
        cost_per_request: float,
        latency_ms: float,
        target_latency_ms: int
    ):
        """
        Calculate overall score (higher is better)
        """
        if not meets_sla:
            return 0  # Doesn't meet requirements

        # Score based on cost efficiency and latency margin
        latency_margin = (target_latency_ms - latency_ms) / target_latency_ms
        cost_score = 1 / (cost_per_request * 1000)  # Lower cost = higher score

        return cost_score * (1 + latency_margin)

    def find_optimal_configuration(
        self,
        requests_per_day: int,
        target_latency_ms: int,
        budget_per_month: float = None
    ):
        """
        Find optimal configuration
        """
        configurations = []

        for gpu_type in ['T4', 'A10G', 'A100-40GB']:
            for quantization in ['fp16', 'int8', 'int4']:
                for batch_size in [1, 2, 4, 8, 16]:
                    config = self.analyze_configuration(
                        gpu_type=gpu_type,
                        quantization=quantization,
                        batch_size=batch_size,
                        requests_per_day=requests_per_day,
                        target_latency_ms=target_latency_ms
                    )

                    # Filter by budget if specified
                    if budget_per_month and config['cost']['monthly_cost'] > budget_per_month:
                        continue

                    if config['score'] > 0:
                        configurations.append(config)

        # Sort by score
        configurations.sort(key=lambda x: x['score'], reverse=True)

        return configurations[:5]  # Top 5


# Usage
optimizer = CostPerformanceOptimizer()

# Find best configuration
optimal_configs = optimizer.find_optimal_configuration(
    requests_per_day=100000,
    target_latency_ms=200,
    budget_per_month=5000
)

print("Top 5 configurations:")
for i, config in enumerate(optimal_configs, 1):
    print(f"\n{i}. Configuration:")
    print(f"   GPU: {config['configuration']['gpu_type']}")
    print(f"   Quantization: {config['configuration']['quantization']}")
    print(f"   Batch Size: {config['configuration']['batch_size']}")
    print(f"   Latency: {config['performance']['estimated_latency_ms']}ms")
    print(f"   Monthly Cost: ${config['cost']['monthly_cost']}")
    print(f"   Cost per Request: ${config['cost']['cost_per_request']}")
    print(f"   Score: {config['score']:.2f}")
```

## 生产优化检查清单

```python
# Production optimization checklist
production_checklist = {
    "Model Selection": {
        "tasks": [
            "Choose smallest model that meets accuracy requirements",
            "Benchmark multiple model sizes",
            "Consider fine-tuned smaller models vs larger base models",
            "Evaluate domain-specific models"
        ],
        "verification": "Run A/B tests to validate model choice"
    },
    "Quantization": {
        "tasks": [
            "Test INT8 quantization (98-99% accuracy, 50% cost reduction)",
            "Consider INT4 for non-critical workloads",
            "Benchmark GPTQ vs AWQ vs bitsandbytes",
            "Validate output quality after quantization"
        ],
        "verification": "Quality metrics within 2% of baseline"
    },
    "Serving Framework": {
        "tasks": [
            "Use vLLM for production (best throughput)",
            "Enable Flash Attention 2",
            "Configure continuous batching",
            "Enable prefix caching for common prompts"
        ],
        "verification": "Achieve 3x+ throughput vs naive implementation"
    },
    "GPU Configuration": {
        "tasks": [
            "Right-size GPU tier (don't over-provision)",
            "Configure tensor parallelism for large models",
            "Set optimal gpu_memory_utilization (0.85-0.95)",
            "Monitor actual GPU utilization"
        ],
        "verification": "GPU utilization consistently >70%"
    },
    "Batching": {
        "tasks": [
            "Configure max_num_batched_tokens appropriately",
            "Set max_num_seqs based on workload",
            "Monitor batch size distribution",
            "Tune timeout parameters"
        ],
        "verification": "Average batch size >8 under load"
    },
    "Caching": {
        "tasks": [
            "Implement response caching (Redis)",
            "Enable prefix caching in vLLM",
            "Consider semantic caching for similar queries",
            "Set appropriate cache TTLs"
        ],
        "verification": "Cache hit rate >30%"
    },
    "Monitoring": {
        "tasks": [
            "Track latency percentiles (p50, p95, p99)",
            "Monitor GPU utilization and memory",
            "Track throughput (tokens/sec, requests/sec)",
            "Monitor cost per request",
            "Alert on SLA violations"
        ],
        "verification": "Full observability dashboard operational"
    },
    "Cost Optimization": {
        "tasks": [
            "Use spot instances where appropriate",
            "Implement auto-scaling",
            "Right-size for actual traffic patterns",
            "Review and optimize monthly"
        ],
        "verification": "Cost per request tracked and optimized"
    }
}


# Automated checklist verification
class ProductionReadinessChecker:
    """
    Verify production optimization checklist
    """
    def __init__(self):
        self.checks = {}

    def check_quantization(self, model):
        """
        Verify quantization is enabled
        """
        # Check if model is quantized
        quantized = hasattr(model, 'quantization_config')
        self.checks['quantization'] = quantized
        return quantized

    def check_flash_attention(self, model):
        """
        Verify Flash Attention is enabled
        """
        # Check model config
        has_flash = getattr(model.config, '_attn_implementation', None) == 'flash_attention_2'
        self.checks['flash_attention'] = has_flash
        return has_flash

    def check_gpu_utilization(self, target_utilization: float = 0.70):
        """
        Verify GPU utilization meets target
        """
        import torch
        if not torch.cuda.is_available():
            return False

        # Get current utilization (this is simplified)
        allocated = torch.cuda.memory_allocated() / torch.cuda.get_device_properties(0).total_memory
        self.checks['gpu_utilization'] = allocated >= target_utilization
        return allocated >= target_utilization

    def check_monitoring(self, prometheus_endpoint: str):
        """
        Verify monitoring is configured
        """
        import requests
        try:
            response = requests.get(f"{prometheus_endpoint}/metrics", timeout=5)
            has_monitoring = response.status_code == 200
            self.checks['monitoring'] = has_monitoring
            return has_monitoring
        except:
            self.checks['monitoring'] = False
            return False

    def generate_report(self):
        """
        Generate readiness report
        """
        total_checks = len(self.checks)
        passed_checks = sum(self.checks.values())

        print("=" * 60)
        print("PRODUCTION READINESS REPORT")
        print("=" * 60)
        print(f"\nPassed: {passed_checks}/{total_checks} checks\n")

        for check_name, passed in self.checks.items():
            status = "✓ PASS" if passed else "✗ FAIL"
            print(f"{status}: {check_name}")

        print("\n" + "=" * 60)

        if passed_checks == total_checks:
            print("✓ System is production ready!")
        else:
            print("✗ System needs optimization before production deployment")

        return passed_checks == total_checks
```

## 总结

本课全面介绍了 LLM 服务的优化技术。

### 核心要点

1. **量化：** 原文示例在较小质量损失下减少 50–75% 成本。
   - INT8：原文认为质量与成本平衡较好。
   - INT4：原文认为成本节省幅度更大。
   - GPTQ、AWQ 用于训练后量化。

2. **Flash Attention 2：** 原文示例在不损失质量的情况下加速 2–4 倍。
   - 原文描述 vLLM 默认启用该实现。
   - 支持更长的上下文窗口。

3. **连续批处理：** 原文示例吞吐量提高 3–10 倍。
   - vLLM 自动执行。
   - 提高 GPU 利用率。

4. **多 GPU 推理：** 扩展以支持大型模型。
   - 张量并行用于拆分模型层。
   - 流水线并行用于提高适用负载的吞吐量。

5. **缓存：** 原文示例减少 30–60% 成本。
   - 响应缓存用于相同请求。
   - 前缀缓存用于公共提示词。
   - 语义缓存用于相似查询。

6. **推测解码：** 原文示例加速 2–3 倍。
   - 使用小型草稿模型与大型目标模型。
   - 适用于希望保持目标模型输出质量的场景。

7. **基准测试：** 全面测量。
   - 延迟、吞吐量、显存。
   - 扩展特性。
   - 单请求费用。

8. **生产检查清单：** 系统化优化。
   - 原文建议从量化、Flash Attention 与缓存建立优化基线。
   - 持续监控与迭代。
   - 平衡成本与性能。

### 下一步

下一课介绍完整 LLM 平台架构，包括多模型服务、API 网关、监控及安全。

---

**下一课：** [07-llm-platform-architecture.md](./07-llm-platform-architecture.md)

> 译注：上述性能倍数和成本节省比例是原文示例，不能直接叠加，也不是实际负载下的保证。GGUF 是模型文件格式，并非单一量化算法。AWQ 与 GPTQ 的准确率和速度关系取决于模型、量化设置及硬件。Flash Attention 数学等价不代表浮点结果逐位一致；注意力后端由硬件、模型及引擎版本决定。KV Cache 通常保存在 GPU 显存中，也可采用 CPU 卸载等机制；缓存大小取决于模型层数、KV Head 数量、Head Dimension、数据类型及序列长度。前缀缓存复用计算状态，响应缓存复用生成结果，两者不同；语义缓存还需验证命中质量及租户隔离。推测解码加速取决于接受率、草稿成本和批处理负载。基准测试应固定模型、硬件、输入输出长度，并分别统计 TTFT、TPOT、端到端延迟、吞吐量及 SLO 达标率。原始代码块及英文注释保留，未执行实际基准测试。
