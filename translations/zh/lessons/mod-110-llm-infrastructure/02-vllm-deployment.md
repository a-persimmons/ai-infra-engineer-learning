# 第 02 课：vLLM 部署

## 目录
1. [vLLM 简介](#vllm-简介)
2. [vLLM 架构与特性](#vllm-架构与特性)
3. [安装与配置](#安装与配置)
4. [vLLM 基础用法](#vllm-基础用法)
5. [使用 vLLM 部署 LLM](#使用-vllm-部署-llm)
6. [OpenAI 兼容 API Server](#openai-兼容-api-server)
7. [性能优化](#性能优化)
8. [监控 vLLM 部署](#监控-vllm-部署)
9. [Docker 部署](#docker-部署)
10. [Kubernetes 部署](#kubernetes-部署)
11. [生产环境最佳实践](#生产环境最佳实践)
12. [故障排查](#故障排查)
13. [总结](#总结)

## vLLM 简介

vLLM（Virtual LLM）是一种专门面向大型语言模型的高吞吐量、显存高效的推理引擎。它最初由加州大学伯克利分校的研究人员开发，因其性能与易用性，成为生产 LLM 服务的常用方案之一。

### 为什么使用 vLLM？

**性能优势：**
- 原文示例：相比 Hugging Face Transformers，吞吐量提高 10–20 倍。
- **PagedAttention：** 创新的显存管理技术。
- **连续批处理：** 高效处理请求。
- **优化后的 CUDA Kernel：** 提高 GPU 利用率。

**生产环境特性：**
- OpenAI 兼容 API Server。
- 流式响应。
- 多模型相关支持。
- 支持量化（AWQ、GPTQ）。
- 使用张量并行服务大型模型。

**开发者体验：**
- 简单的 Python API。
- 易于与现有代码集成。
- 广泛的模型支持。
- 活跃的社区与开发。

### 学习目标

完成本课后，你将能够：
- 理解 vLLM 架构及 PagedAttention。
- 针对不同环境安装与配置 vLLM。
- 使用 vLLM Python API 部署 LLM。
- 搭建 OpenAI 兼容 API Server。
- 针对生产工作负载优化 vLLM 性能。
- 在 Docker 与 Kubernetes 中部署 vLLM。
- 监控并排查 vLLM 部署问题。
- 实施生产环境最佳实践。

## vLLM 架构与特性

### 核心架构

vLLM 架构围绕若干关键创新构建：

```
┌─────────────────────────────────────────────────────────┐
│                    vLLM Architecture                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Request Scheduler (Front-end)          │    │
│  │  - Request queuing and prioritization          │    │
│  │  - Continuous batching logic                   │    │
│  │  - Token budget management                     │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │         Memory Manager (PagedAttention)        │    │
│  │  - Dynamic KV cache allocation                 │    │
│  │  - Memory block management                     │    │
│  │  - Efficient memory sharing                    │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │         Model Executor (Back-end)              │    │
│  │  - Model inference                             │    │
│  │  - Optimized CUDA kernels                      │    │
│  │  - Tensor parallelism support                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### PagedAttention：关键创新

PagedAttention 是 vLLM 的显存管理技术，受到操作系统分页机制的启发。

**传统方法：**
```
┌────────────────────────────────────────┐
│  Request 1: [KV Cache: 100 tokens]    │  Wastes space
│  Allocated: 2048 tokens               │  if request is
│  Wasted: 1948 tokens                  │  shorter
└────────────────────────────────────────┘
```

**PagedAttention 方法：**
```
┌────────────────────────────────────────┐
│  Memory divided into blocks (e.g., 16) │
│  Allocate only needed blocks           │
│  Share blocks across requests          │
│  Dynamic allocation as tokens generate │
└────────────────────────────────────────┘
```

**收益：**
- **减少浪费：** 根据实际需要分配显存块，降低内部及外部碎片。
- **显存共享：** 并行采样等场景可共享适用的 KV Cache。
- **动态增长：** 随序列增长分配块。
- **更大的批次：** 在有限显存中容纳更多请求。

### 连续批处理（Continuous Batching）

与静态批处理不同，连续批处理允许 vLLM 在批次出现可用位置时加入新请求。

```python
# Traditional static batching
# Batch 1: [Req A, Req B, Req C, Req D]
# Wait for ALL to complete before starting Batch 2
# Problem: If Req A finishes early, GPU sits idle

# Continuous batching (vLLM)
# Iteration 1: [Req A, Req B, Req C, Req D]
# Iteration 2: [Req B, Req C, Req D, Req E]  # A done, E added
# Iteration 3: [Req C, Req D, Req E, Req F]  # B done, F added
# Result: GPU never idle!
```

**影响（原文示例）：**
- 吞吐量提高 2–10 倍。
- GPU 利用率提高（60–90%）。
- 平均延迟降低。
- 在变化负载下性能更平稳。

### 模型支持

vLLM 支持广泛的 LLM 架构。

**原文列举的支持模型：**
- LLaMA / LLaMA 2 / LLaMA 3。
- Mistral / Mixtral。
- Falcon。
- GPT-2 / GPT-J / GPT-NeoX。
- OPT。
- BLOOM。
- CodeLlama。
- Yi。
- Qwen。

**量化支持（原文列举）：**
- AWQ（4-bit）。
- GPTQ（4-bit、8-bit）。
- SqueezeLLM。

**查询当前兼容性：** https://docs.vllm.ai/en/latest/models/supported_models.html

## 安装与配置

### 前置条件

安装 vLLM 前，确保满足以下条件：

```bash
# System requirements
# - Linux OS (Ubuntu 20.04+ recommended)
# - Python 3.8 or higher
# - NVIDIA GPU with compute capability 7.0+ (V100, T4, A10, A100, etc.)
# - CUDA 11.8 or higher
# - 16GB+ system RAM

# Check CUDA version
nvidia-smi

# Check Python version
python --version
```

### 安装方式

#### 方式 1：pip 安装（推荐快速入门）

```bash
# Create virtual environment
python -m venv vllm-env
source vllm-env/bin/activate

# Install vLLM
pip install vllm

# Verify installation
python -c "import vllm; print(vllm.__version__)"
```

#### 方式 2：针对特定 CUDA 版本安装

```bash
# For CUDA 11.8
pip install vllm

# For CUDA 12.1
export VLLM_VERSION=0.2.7  # Check latest version
export PYTHON_VERSION=310
pip install https://github.com/vllm-project/vllm/releases/download/v${VLLM_VERSION}/vllm-${VLLM_VERSION}+cu121-cp${PYTHON_VERSION}-cp${PYTHON_VERSION}-manylinux1_x86_64.whl
```

#### 方式 3：从源码构建（用于开发）

```bash
# Clone repository
git clone https://github.com/vllm-project/vllm.git
cd vllm

# Install build dependencies
pip install -e .
```

### 安装后验证

```python
# test_vllm.py
from vllm import LLM, SamplingParams

# This test uses a small model - should work with 4GB+ GPU
def test_vllm_installation():
    """Test vLLM installation with a small model"""

    # Initialize with a small model
    llm = LLM(
        model="facebook/opt-125m",  # Small 125M parameter model
        max_model_len=512,
        gpu_memory_utilization=0.3
    )

    # Simple generation test
    prompts = ["Hello, how are you?"]
    sampling_params = SamplingParams(temperature=0.8, max_tokens=50)

    outputs = llm.generate(prompts, sampling_params)

    for output in outputs:
        print(f"Prompt: {output.prompt}")
        print(f"Generated: {output.outputs[0].text}")
        print("✓ vLLM installation successful!")

if __name__ == "__main__":
    test_vllm_installation()
```

运行测试：
```bash
python test_vllm.py
```

## vLLM 基础用法

### Python API——离线推理

使用 vLLM 的 Python API 执行离线批量推理是最简单的入门方式之一。

```python
# basic_usage.py
from vllm import LLM, SamplingParams

def basic_generation_example():
    """Basic vLLM generation example"""

    # Initialize the LLM
    llm = LLM(
        model="meta-llama/Llama-2-7b-chat-hf",
        # Download from Hugging Face Hub
        # Requires HF token for gated models
    )

    # Define sampling parameters
    sampling_params = SamplingParams(
        temperature=0.7,    # Randomness (0.0 = deterministic, 1.0 = creative)
        top_p=0.9,         # Nucleus sampling
        max_tokens=256,    # Maximum tokens to generate
        stop=["</s>"]      # Stop sequences
    )

    # Single prompt
    prompt = "Explain quantum computing in simple terms:"
    outputs = llm.generate([prompt], sampling_params)

    print(outputs[0].outputs[0].text)

def batch_generation_example():
    """Batch generation - vLLM's strength"""

    llm = LLM(model="meta-llama/Llama-2-7b-chat-hf")

    # Multiple prompts - processed efficiently in batch
    prompts = [
        "What is machine learning?",
        "Explain neural networks.",
        "What is deep learning?",
        "Describe transformers architecture.",
        "What are LLMs?"
    ]

    sampling_params = SamplingParams(temperature=0.7, max_tokens=100)

    # All prompts processed in single call
    outputs = llm.generate(prompts, sampling_params)

    for prompt, output in zip(prompts, outputs):
        print(f"\nPrompt: {prompt}")
        print(f"Response: {output.outputs[0].text}")
        print(f"Tokens: {len(output.outputs[0].token_ids)}")

if __name__ == "__main__":
    basic_generation_example()
    # batch_generation_example()
```

### 高级采样参数

```python
# advanced_sampling.py
from vllm import SamplingParams

class SamplingConfigurations:
    """Different sampling configurations for various use cases"""

    @staticmethod
    def deterministic():
        """For consistent, deterministic outputs"""
        return SamplingParams(
            temperature=0.0,
            top_p=1.0,
            max_tokens=512
        )

    @staticmethod
    def creative():
        """For creative, diverse outputs"""
        return SamplingParams(
            temperature=1.0,
            top_p=0.95,
            top_k=50,
            max_tokens=1024
        )

    @staticmethod
    def balanced():
        """Balanced between creativity and coherence"""
        return SamplingParams(
            temperature=0.7,
            top_p=0.9,
            max_tokens=512,
            frequency_penalty=0.1,  # Reduce repetition
            presence_penalty=0.1    # Encourage diversity
        )

    @staticmethod
    def code_generation():
        """Optimized for code generation"""
        return SamplingParams(
            temperature=0.2,  # Lower for more accurate code
            top_p=0.95,
            max_tokens=2048,
            stop=["```\n", "\n\n\n"]  # Stop at code block end
        )

    @staticmethod
    def chat():
        """Optimized for chat applications"""
        return SamplingParams(
            temperature=0.7,
            top_p=0.9,
            max_tokens=512,
            repetition_penalty=1.1,  # Discourage repetition
            stop=["User:", "Human:"]  # Stop at user turn
        )

# Usage example
llm = LLM(model="meta-llama/Llama-2-7b-chat-hf")

prompt = "Write a Python function to calculate fibonacci:"
outputs = llm.generate(
    [prompt],
    SamplingConfigurations.code_generation()
)

print(outputs[0].outputs[0].text)
```

### 多轮对话

```python
# conversation.py
from vllm import LLM, SamplingParams

class ConversationManager:
    """Manage multi-turn conversations with vLLM"""

    def __init__(self, model_name: str):
        self.llm = LLM(model=model_name)
        self.conversations = {}  # Track conversation history

    def format_llama2_prompt(self, messages: list) -> str:
        """Format messages for Llama 2 chat format"""
        prompt = "<s>[INST] "

        for i, msg in enumerate(messages):
            if msg["role"] == "user":
                if i > 0:
                    prompt += f"[INST] {msg['content']} [/INST] "
                else:
                    prompt += f"{msg['content']} [/INST] "
            elif msg["role"] == "assistant":
                prompt += f"{msg['content']} </s>"

        return prompt

    def chat(self, conversation_id: str, user_message: str) -> str:
        """Process a chat message and return response"""

        # Initialize conversation if new
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []

        # Add user message
        self.conversations[conversation_id].append({
            "role": "user",
            "content": user_message
        })

        # Format prompt
        prompt = self.format_llama2_prompt(
            self.conversations[conversation_id]
        )

        # Generate response
        sampling_params = SamplingParams(
            temperature=0.7,
            max_tokens=512,
            stop=["</s>"]
        )

        outputs = self.llm.generate([prompt], sampling_params)
        response = outputs[0].outputs[0].text.strip()

        # Add assistant response to history
        self.conversations[conversation_id].append({
            "role": "assistant",
            "content": response
        })

        return response

# Example usage
manager = ConversationManager("meta-llama/Llama-2-7b-chat-hf")

# Conversation 1
print(manager.chat("user123", "Hello! What's your name?"))
print(manager.chat("user123", "Can you help me with Python?"))
print(manager.chat("user123", "Show me a for loop example."))

# Conversation 2 (separate context)
print(manager.chat("user456", "Tell me about machine learning."))
```

## 使用 vLLM 部署 LLM

### 模型选择与下载

```python
# model_downloader.py
from huggingface_hub import snapshot_download
import os

class ModelDownloader:
    """Download and manage LLM models"""

    def __init__(self, cache_dir: str = "./models"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def download_model(
        self,
        model_id: str,
        token: str = None,
        quantization: str = None
    ):
        """Download model from Hugging Face Hub"""

        print(f"Downloading {model_id}...")

        # For gated models (Llama 2, etc.), you need a HF token
        model_path = snapshot_download(
            repo_id=model_id,
            cache_dir=self.cache_dir,
            token=token,
            # Optionally download specific files
            allow_patterns=["*.json", "*.safetensors", "*.model", "*.bin"]
        )

        print(f"Model downloaded to: {model_path}")
        return model_path

    def list_downloaded_models(self):
        """List all downloaded models"""
        models = []
        for item in os.listdir(self.cache_dir):
            model_path = os.path.join(self.cache_dir, item)
            if os.path.isdir(model_path):
                models.append(item)
        return models

# Example usage
downloader = ModelDownloader()

# Download popular open models
models_to_download = [
    "meta-llama/Llama-2-7b-chat-hf",  # Requires HF token
    "mistralai/Mistral-7B-Instruct-v0.1",
    "codellama/CodeLlama-7b-hf"
]

# Set your Hugging Face token
HF_TOKEN = os.getenv("HF_TOKEN")

for model_id in models_to_download:
    downloader.download_model(model_id, token=HF_TOKEN)
```

### 生产部署配置

```python
# production_config.py
from vllm import LLM, SamplingParams
from dataclasses import dataclass
from typing import Optional

@dataclass
class vLLMConfig:
    """Production-ready vLLM configuration"""

    # Model settings
    model: str
    tokenizer: Optional[str] = None

    # Memory settings
    gpu_memory_utilization: float = 0.90  # Use 90% of GPU memory
    max_model_len: int = 4096            # Maximum sequence length

    # Performance settings
    tensor_parallel_size: int = 1         # Number of GPUs for tensor parallelism
    trust_remote_code: bool = False       # For custom model code

    # Quantization
    quantization: Optional[str] = None    # "awq", "gptq", or None

    # Engine settings
    max_num_seqs: int = 256              # Max concurrent sequences
    max_num_batched_tokens: Optional[int] = None

    # Logging
    disable_log_stats: bool = False
    disable_log_requests: bool = False

class ProductionLLM:
    """Production-ready LLM wrapper"""

    def __init__(self, config: vLLMConfig):
        self.config = config
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        """Initialize vLLM with production settings"""
        return LLM(
            model=self.config.model,
            tokenizer=self.config.tokenizer,
            tensor_parallel_size=self.config.tensor_parallel_size,
            gpu_memory_utilization=self.config.gpu_memory_utilization,
            max_model_len=self.config.max_model_len,
            trust_remote_code=self.config.trust_remote_code,
            quantization=self.config.quantization,
            max_num_seqs=self.config.max_num_seqs,
            disable_log_stats=self.config.disable_log_stats
        )

    def generate(self, prompts, sampling_params):
        """Generate with error handling"""
        try:
            outputs = self.llm.generate(prompts, sampling_params)
            return outputs
        except Exception as e:
            print(f"Generation error: {e}")
            raise

# Example configurations

# Small model config (for T4, development)
small_config = vLLMConfig(
    model="meta-llama/Llama-2-7b-chat-hf",
    gpu_memory_utilization=0.85,
    max_model_len=2048,
    tensor_parallel_size=1
)

# Medium model config (for A10G, production)
medium_config = vLLMConfig(
    model="meta-llama/Llama-2-13b-chat-hf",
    gpu_memory_utilization=0.90,
    max_model_len=4096,
    tensor_parallel_size=1
)

# Large model config (for multi-GPU A100)
large_config = vLLMConfig(
    model="meta-llama/Llama-2-70b-chat-hf",
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    tensor_parallel_size=4  # 4 GPUs
)

# Quantized model config (for cost optimization)
quantized_config = vLLMConfig(
    model="TheBloke/Llama-2-7B-Chat-AWQ",
    quantization="awq",
    gpu_memory_utilization=0.90,
    max_model_len=4096
)

# Usage
llm = ProductionLLM(medium_config)
outputs = llm.generate(
    ["Hello, how are you?"],
    SamplingParams(temperature=0.7, max_tokens=100)
)
```

### 大型模型的张量并行

```python
# tensor_parallel.py
from vllm import LLM

def deploy_large_model_multi_gpu():
    """Deploy 70B model across multiple GPUs"""

    # Llama 2 70B requires ~140GB in FP16
    # With 4x A100-40GB, we can distribute the model

    llm = LLM(
        model="meta-llama/Llama-2-70b-chat-hf",
        tensor_parallel_size=4,  # Use 4 GPUs
        gpu_memory_utilization=0.95,
        max_model_len=4096,
        # vLLM automatically splits model across GPUs
    )

    return llm

# GPU allocation visualization:
"""
GPU 0: [Layers 0-19]  + [Attention heads 0-15]
GPU 1: [Layers 20-39] + [Attention heads 16-31]
GPU 2: [Layers 40-59] + [Attention heads 32-47]
GPU 3: [Layers 60-79] + [Attention heads 48-63]

Communication: All-reduce for attention, point-to-point for layers
"""
```

## OpenAI 兼容 API Server

vLLM 的重要特性之一是内置 OpenAI 兼容 API Server。

### 启动 API Server

```bash
# Basic server start
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-2-7b-chat-hf \
    --host 0.0.0.0 \
    --port 8000

# Production server with optimizations
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-2-7b-chat-hf \
    --host 0.0.0.0 \
    --port 8000 \
    --tensor-parallel-size 1 \
    --gpu-memory-utilization 0.90 \
    --max-model-len 4096 \
    --disable-log-requests \
    --served-model-name llama-2-7b-chat
```

### API Server 配置脚本

```python
# api_server.py
import subprocess
import argparse
from typing import Optional

class vLLMAPIServer:
    """Manage vLLM API server"""

    def __init__(
        self,
        model: str,
        host: str = "0.0.0.0",
        port: int = 8000,
        tensor_parallel_size: int = 1,
        gpu_memory_utilization: float = 0.90,
        max_model_len: int = 4096,
        served_model_name: Optional[str] = None
    ):
        self.model = model
        self.host = host
        self.port = port
        self.tensor_parallel_size = tensor_parallel_size
        self.gpu_memory_utilization = gpu_memory_utilization
        self.max_model_len = max_model_len
        self.served_model_name = served_model_name or model.split("/")[-1]

    def build_command(self) -> list:
        """Build server startup command"""
        cmd = [
            "python", "-m", "vllm.entrypoints.openai.api_server",
            "--model", self.model,
            "--host", self.host,
            "--port", str(self.port),
            "--tensor-parallel-size", str(self.tensor_parallel_size),
            "--gpu-memory-utilization", str(self.gpu_memory_utilization),
            "--max-model-len", str(self.max_model_len),
            "--served-model-name", self.served_model_name
        ]
        return cmd

    def start(self):
        """Start the API server"""
        cmd = self.build_command()
        print(f"Starting vLLM API server...")
        print(f"Command: {' '.join(cmd)}")
        print(f"API will be available at http://{self.host}:{self.port}")

        # Run server (blocks)
        subprocess.run(cmd)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--tensor-parallel-size", type=int, default=1)

    args = parser.parse_args()

    server = vLLMAPIServer(
        model=args.model,
        port=args.port,
        tensor_parallel_size=args.tensor_parallel_size
    )

    server.start()
```

### 使用 OpenAI 兼容 API

```python
# client.py
from openai import OpenAI

# Point to vLLM server instead of OpenAI
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="dummy"  # vLLM doesn't require real key by default
)

# Chat completions (matches OpenAI API)
def chat_completion_example():
    response = client.chat.completions.create(
        model="llama-2-7b-chat",  # Use served-model-name
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Explain quantum computing."}
        ],
        temperature=0.7,
        max_tokens=512
    )

    print(response.choices[0].message.content)

# Streaming completions
def streaming_example():
    stream = client.chat.completions.create(
        model="llama-2-7b-chat",
        messages=[{"role": "user", "content": "Count from 1 to 10"}],
        stream=True,
        max_tokens=100
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print()

# Text completions (non-chat)
def text_completion_example():
    response = client.completions.create(
        model="llama-2-7b-chat",
        prompt="Once upon a time,",
        max_tokens=100,
        temperature=0.8
    )

    print(response.choices[0].text)

if __name__ == "__main__":
    chat_completion_example()
    streaming_example()
    text_completion_example()
```

### 自定义 FastAPI 封装

为了实现更细粒度的控制，可以围绕 vLLM 构建自定义 API：

```python
# custom_api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from vllm import LLM, SamplingParams
from typing import List, Optional
import uvicorn

app = FastAPI(title="Custom vLLM API")

# Initialize vLLM
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    gpu_memory_utilization=0.90
)

# Request/Response models
class GenerationRequest(BaseModel):
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.7
    top_p: float = 0.9
    stop: Optional[List[str]] = None

class GenerationResponse(BaseModel):
    text: str
    tokens_generated: int
    finish_reason: str

class BatchRequest(BaseModel):
    prompts: List[str]
    max_tokens: int = 256
    temperature: float = 0.7

# Endpoints
@app.post("/generate", response_model=GenerationResponse)
async def generate(request: GenerationRequest):
    """Single generation endpoint"""
    try:
        sampling_params = SamplingParams(
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
            stop=request.stop
        )

        outputs = llm.generate([request.prompt], sampling_params)
        output = outputs[0].outputs[0]

        return GenerationResponse(
            text=output.text,
            tokens_generated=len(output.token_ids),
            finish_reason=output.finish_reason
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch_generate")
async def batch_generate(request: BatchRequest):
    """Batch generation endpoint - vLLM's strength"""
    try:
        sampling_params = SamplingParams(
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        outputs = llm.generate(request.prompts, sampling_params)

        results = []
        for output in outputs:
            results.append({
                "text": output.outputs[0].text,
                "tokens": len(output.outputs[0].token_ids)
            })

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "model": "llama-2-7b-chat"}

@app.get("/model_info")
async def model_info():
    """Model information"""
    return {
        "model": "llama-2-7b-chat",
        "max_model_len": 4096,
        "tensor_parallel_size": 1
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 性能优化

### GPU 显存优化

```python
# memory_optimization.py

def optimize_for_throughput(model_name: str):
    """Maximize throughput - use most GPU memory"""
    return LLM(
        model=model_name,
        gpu_memory_utilization=0.95,  # Use 95% of GPU memory
        max_num_seqs=256,             # High concurrency
        max_model_len=2048            # Shorter sequences = more batch
    )

def optimize_for_latency(model_name: str):
    """Minimize latency - reduce batch size"""
    return LLM(
        model=model_name,
        gpu_memory_utilization=0.80,  # Leave room for bursty traffic
        max_num_seqs=32,              # Lower concurrency
        max_model_len=4096            # Support longer sequences
    )

def optimize_for_long_context(model_name: str):
    """Support very long contexts"""
    return LLM(
        model=model_name,
        gpu_memory_utilization=0.90,
        max_model_len=8192,           # Longer sequences
        max_num_seqs=16               # Fewer concurrent requests
    )
```

### 批处理策略

```python
# batching.py
from vllm import LLM, SamplingParams
import asyncio
from collections import deque
import time

class AdaptiveBatchProcessor:
    """Adaptive batching for optimal throughput"""

    def __init__(
        self,
        llm: LLM,
        max_batch_size: int = 32,
        max_wait_ms: int = 100
    ):
        self.llm = llm
        self.max_batch_size = max_batch_size
        self.max_wait_ms = max_wait_ms
        self.queue = deque()
        self.processing = False

    async def add_request(self, prompt: str, sampling_params: SamplingParams):
        """Add request to queue"""
        future = asyncio.Future()
        self.queue.append((prompt, sampling_params, future))

        # Trigger processing if not already running
        if not self.processing:
            asyncio.create_task(self._process_batch())

        return await future

    async def _process_batch(self):
        """Process queued requests in batches"""
        self.processing = True
        start_time = time.time()

        while self.queue:
            batch = []
            prompts = []
            params_list = []
            futures = []

            # Collect batch
            while (len(batch) < self.max_batch_size and
                   self.queue and
                   (time.time() - start_time) * 1000 < self.max_wait_ms):
                prompt, params, future = self.queue.popleft()
                prompts.append(prompt)
                params_list.append(params)
                futures.append(future)
                batch.append((prompt, params, future))

            if not batch:
                break

            # Process batch
            # Note: vLLM handles different sampling params per request
            outputs = self.llm.generate(prompts, params_list[0])

            # Resolve futures
            for future, output in zip(futures, outputs):
                future.set_result(output.outputs[0].text)

            start_time = time.time()

        self.processing = False

# Usage
llm = LLM(model="meta-llama/Llama-2-7b-chat-hf")
processor = AdaptiveBatchProcessor(llm)

async def handle_request(prompt: str):
    params = SamplingParams(temperature=0.7, max_tokens=100)
    result = await processor.add_request(prompt, params)
    return result
```

### 基准测试

```python
# benchmark.py
import time
import statistics
from vllm import LLM, SamplingParams
from typing import List

class vLLMBenchmark:
    """Benchmark vLLM performance"""

    def __init__(self, model: str):
        self.llm = LLM(
            model=model,
            gpu_memory_utilization=0.90
        )
        self.model = model

    def benchmark_throughput(
        self,
        num_requests: int = 100,
        prompt_length: int = 100,
        output_length: int = 100
    ):
        """Measure throughput (requests/second)"""

        # Generate test prompts
        test_prompt = "Hello " * prompt_length
        prompts = [test_prompt] * num_requests

        sampling_params = SamplingParams(
            temperature=0.0,
            max_tokens=output_length
        )

        # Warm-up
        self.llm.generate([test_prompt], sampling_params)

        # Benchmark
        start_time = time.time()
        outputs = self.llm.generate(prompts, sampling_params)
        end_time = time.time()

        duration = end_time - start_time
        throughput = num_requests / duration

        # Calculate tokens
        total_tokens = sum(
            len(output.outputs[0].token_ids) for output in outputs
        )
        tokens_per_second = total_tokens / duration

        return {
            "num_requests": num_requests,
            "duration_seconds": round(duration, 2),
            "requests_per_second": round(throughput, 2),
            "tokens_per_second": round(tokens_per_second, 2),
            "average_latency_ms": round((duration / num_requests) * 1000, 2)
        }

    def benchmark_latency(
        self,
        num_trials: int = 50,
        prompt_length: int = 100,
        output_length: int = 100
    ):
        """Measure latency distribution"""

        test_prompt = "Hello " * prompt_length
        sampling_params = SamplingParams(
            temperature=0.0,
            max_tokens=output_length
        )

        latencies = []

        for _ in range(num_trials):
            start_time = time.time()
            self.llm.generate([test_prompt], sampling_params)
            end_time = time.time()
            latencies.append((end_time - start_time) * 1000)  # ms

        return {
            "num_trials": num_trials,
            "mean_latency_ms": round(statistics.mean(latencies), 2),
            "median_latency_ms": round(statistics.median(latencies), 2),
            "p95_latency_ms": round(sorted(latencies)[int(num_trials * 0.95)], 2),
            "p99_latency_ms": round(sorted(latencies)[int(num_trials * 0.99)], 2),
            "min_latency_ms": round(min(latencies), 2),
            "max_latency_ms": round(max(latencies), 2)
        }

# Run benchmarks
benchmark = vLLMBenchmark("meta-llama/Llama-2-7b-chat-hf")

print("Throughput Benchmark:")
print(benchmark.benchmark_throughput(num_requests=100))

print("\nLatency Benchmark:")
print(benchmark.benchmark_latency(num_trials=50))
```

## 监控 vLLM 部署

### 指标采集

```python
# monitoring.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from vllm import LLM, SamplingParams
import time
from functools import wraps

# Prometheus metrics
REQUEST_COUNT = Counter(
    'vllm_requests_total',
    'Total number of requests',
    ['model', 'status']
)

REQUEST_DURATION = Histogram(
    'vllm_request_duration_seconds',
    'Request duration in seconds',
    ['model']
)

TOKENS_GENERATED = Counter(
    'vllm_tokens_generated_total',
    'Total tokens generated',
    ['model']
)

ACTIVE_REQUESTS = Gauge(
    'vllm_active_requests',
    'Number of active requests',
    ['model']
)

GPU_MEMORY_USAGE = Gauge(
    'vllm_gpu_memory_bytes',
    'GPU memory usage in bytes',
    ['gpu_id']
)

class MonitoredLLM:
    """vLLM wrapper with monitoring"""

    def __init__(self, model: str):
        self.model_name = model
        self.llm = LLM(model=model)

        # Start Prometheus metrics server
        start_http_server(8001)

    def generate(self, prompts, sampling_params):
        """Generate with monitoring"""

        ACTIVE_REQUESTS.labels(model=self.model_name).inc()

        start_time = time.time()
        status = "success"

        try:
            outputs = self.llm.generate(prompts, sampling_params)

            # Count tokens
            total_tokens = sum(
                len(output.outputs[0].token_ids) for output in outputs
            )
            TOKENS_GENERATED.labels(model=self.model_name).inc(total_tokens)

            return outputs

        except Exception as e:
            status = "error"
            raise

        finally:
            duration = time.time() - start_time

            REQUEST_DURATION.labels(model=self.model_name).observe(duration)
            REQUEST_COUNT.labels(model=self.model_name, status=status).inc()
            ACTIVE_REQUESTS.labels(model=self.model_name).dec()

# Usage
monitored_llm = MonitoredLLM("meta-llama/Llama-2-7b-chat-hf")

# Metrics available at http://localhost:8001/metrics
```

### 日志配置

```python
# logging_config.py
import logging
import sys
from datetime import datetime

def setup_vllm_logging(log_level=logging.INFO):
    """Configure comprehensive logging for vLLM"""

    # Create logger
    logger = logging.getLogger("vllm_service")
    logger.setLevel(log_level)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # File handler
    file_handler = logging.FileHandler(
        f"vllm_service_{datetime.now().strftime('%Y%m%d')}.log"
    )
    file_handler.setLevel(log_level)

    # Format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

# Usage
logger = setup_vllm_logging()

logger.info("vLLM service starting...")
logger.info("Model loaded successfully")
logger.warning("High GPU memory usage detected")
logger.error("Request failed with error: ...")
```

## Docker 部署

### vLLM Dockerfile

```dockerfile
# Dockerfile
FROM nvidia/cuda:12.1.0-devel-ubuntu22.04

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install vLLM
RUN pip3 install vllm

# Copy application code
COPY api_server.py /app/
COPY requirements.txt /app/
RUN pip3 install -r requirements.txt

# Expose port
EXPOSE 8000

# Set environment variables
ENV MODEL_NAME="meta-llama/Llama-2-7b-chat-hf"
ENV HOST="0.0.0.0"
ENV PORT="8000"

# Run server
CMD python3 -m vllm.entrypoints.openai.api_server \
    --model ${MODEL_NAME} \
    --host ${HOST} \
    --port ${PORT} \
    --tensor-parallel-size 1
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  vllm-server:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=0
      - MODEL_NAME=meta-llama/Llama-2-7b-chat-hf
      - HF_TOKEN=${HF_TOKEN}
    ports:
      - "8000:8000"
    volumes:
      - ./models:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

### 构建与运行

```bash
# Build image
docker build -t vllm-server:latest .

# Run container
docker run --gpus all \
  -p 8000:8000 \
  -e MODEL_NAME="meta-llama/Llama-2-7b-chat-hf" \
  -v $(pwd)/models:/root/.cache/huggingface \
  vllm-server:latest

# Or use docker-compose
docker-compose up -d
```

## Kubernetes 部署

### Kubernetes Manifest

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-serving
  labels:
    app: vllm-serving
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vllm-serving
  template:
    metadata:
      labels:
        app: vllm-serving
    spec:
      containers:
      - name: vllm-server
        image: vllm-server:latest
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_NAME
          value: "meta-llama/Llama-2-7b-chat-hf"
        - name: HF_TOKEN
          valueFrom:
            secretKeyRef:
              name: huggingface-token
              key: token
        resources:
          requests:
            nvidia.com/gpu: 1
            memory: "32Gi"
            cpu: "8"
          limits:
            nvidia.com/gpu: 1
            memory: "32Gi"
        volumeMounts:
        - name: model-cache
          mountPath: /root/.cache/huggingface
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
      volumes:
      - name: model-cache
        persistentVolumeClaim:
          claimName: model-cache-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: vllm-service
spec:
  selector:
    app: vllm-serving
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-cache-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
```

### Horizontal Pod Autoscaler（HPA）

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-serving
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: nvidia.com/gpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: vllm_active_requests
      target:
        type: AverageValue
        averageValue: "50"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

## 生产环境最佳实践

### 1. 模型缓存策略

```python
# model_cache.py
import os
from pathlib import Path

class ModelCache:
    """Manage model caching for fast startup"""

    def __init__(self, cache_dir: str = "/data/models"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def preload_models(self, model_list: list):
        """Preload models to cache"""
        from huggingface_hub import snapshot_download

        for model_id in model_list:
            print(f"Preloading {model_id}...")
            snapshot_download(
                repo_id=model_id,
                cache_dir=self.cache_dir,
                token=os.getenv("HF_TOKEN")
            )

    def get_model_path(self, model_id: str) -> str:
        """Get cached model path"""
        # vLLM will automatically use cached models
        return str(self.cache_dir)

# In init container or startup script
cache = ModelCache()
cache.preload_models([
    "meta-llama/Llama-2-7b-chat-hf",
    "meta-llama/Llama-2-13b-chat-hf"
])
```

### 2. 优雅关闭

```python
# graceful_shutdown.py
import signal
import sys

class GracefulShutdown:
    """Handle graceful shutdown of vLLM server"""

    def __init__(self, server):
        self.server = server
        self.is_shutting_down = False

        # Register signal handlers
        signal.signal(signal.SIGTERM, self.handle_signal)
        signal.signal(signal.SIGINT, self.handle_signal)

    def handle_signal(self, signum, frame):
        """Handle shutdown signal"""
        if self.is_shutting_down:
            return

        print("Received shutdown signal, starting graceful shutdown...")
        self.is_shutting_down = True

        # Stop accepting new requests
        # Complete in-flight requests
        # Clean up resources

        print("Shutdown complete")
        sys.exit(0)
```

### 3. 健康检查

```python
# health_checks.py
from fastapi import FastAPI
from pydantic import BaseModel

class HealthStatus(BaseModel):
    status: str
    model_loaded: bool
    gpu_available: bool
    active_requests: int

@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Comprehensive health check"""
    import torch

    return HealthStatus(
        status="healthy",
        model_loaded=True,  # Check if model is loaded
        gpu_available=torch.cuda.is_available(),
        active_requests=get_active_request_count()
    )

@app.get("/ready")
async def readiness_check():
    """Readiness check for K8s"""
    # Check if server is ready to handle requests
    if not model_loaded():
        return {"ready": False}, 503
    return {"ready": True}
```

## 故障排查

### 常见问题与解决方案

**问题 1：显存不足（OOM）**
```python
# Solution: Reduce GPU memory utilization or max_model_len
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    gpu_memory_utilization=0.85,  # Reduce from 0.90
    max_model_len=2048            # Reduce from 4096
)
```

**问题 2：冷启动缓慢**
```bash
# Solution: Preload models in init container
# Use persistent volume for model cache
```

**问题 3：吞吐量不足**
```python
# Solution: Increase max_num_seqs
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    max_num_seqs=256  # Increase batch size
)
```

**问题 4：延迟较高**
```python
# Solution: Reduce batch size for lower latency
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    max_num_seqs=32  # Smaller batches = lower latency
)
```

## 总结

本课全面介绍了 vLLM 部署。

### 核心要点

1. **vLLM 的 PagedAttention** 支持高效显存管理，原文示例吞吐量提升 10–20 倍（整个系统的综合效果）。
2. **连续批处理**提高 GPU 利用率。
3. **OpenAI 兼容 API**简化集成。
4. **张量并行**支持大型模型服务。
5. **生产部署**需要监控、健康检查及优雅关闭。
6. **Kubernetes 容器编排**支持可扩展部署。

### 下一步

下一课探索 RAG（检索增强生成）系统，在 vLLM 部署知识的基础上构建智能文档问答系统。

---

**下一课：** [03-rag-systems.md](./03-rag-systems.md)

> 译注：vLLM 的 CLI、Engine API、指标名称及模型兼容性随版本演进，应固定依赖并查看对应版本文档。OpenAI 兼容不代表所有 API、参数或行为完全一致。单个服务进程通常以基础模型为核心，多模型服务需结合具体版本的适配器及部署拓扑。PagedAttention 不能消除所有显存浪费，性能提升也并非仅来自这一技术。连续批处理需平衡 TTFT、TPOT、吞吐量及队列延迟；GPU 利用率不等同于 SLO 达标。生产部署应配置身份验证、配额、请求长度限制和可信模型来源，避免不受信任的远程代码。原始代码块保留，未运行 GPU 基准测试。
