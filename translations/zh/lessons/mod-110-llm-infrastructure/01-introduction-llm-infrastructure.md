# 第 01 课：LLM 基础设施导论

## 目录
1. [导论](#导论)
2. [什么是 LLM 基础设施](#什么是-llm-基础设施)
3. [LLM 基础设施为何不同](#llm-基础设施为何不同)
4. [LLM 基础设施的独特挑战](#llm-基础设施的独特挑战)
5. [LLM 部署模式](#llm-部署模式)
6. [硬件需求](#硬件需求)
7. [成本考虑](#成本考虑)
8. [LLM 服务框架概览](#llm-服务框架概览)
9. [行业生态](#行业生态)
10. [入门路线图](#入门路线图)
11. [总结](#总结)

## 导论

大型语言模型（LLM）推动了人工智能的发展，广泛应用于聊天机器人、代码助手、文档分析与内容生成。然而，在生产环境部署和管理 LLM 所面临的基础设施挑战，与传统机器学习或 Web 应用部署有显著区别。

本课全面介绍 LLM 基础设施的基本概念、挑战及模式，为深入具体实现以及构建生产级 LLM 系统打下基础。

### 学习目标

完成本课后，你将能够：
- 定义 LLM 基础设施并解释其独特特征。
- 识别 LLM 与传统 ML 基础设施的关键区别。
- 理解部署与扩展 LLM 的主要挑战。
- 描述常见 LLM 部署模式及其适用时机。
- 明确不同 LLM 工作负载的硬件需求。
- 计算并估算 LLM 基础设施费用。
- 评估不同 LLM 服务框架与工具。
- 根据充分的信息进行架构决策。

## 什么是 LLM 基础设施

### 定义

**LLM 基础设施**是生产环境中部署、提供服务、管理及运营大型语言模型所需的完整技术栈，包括：

- **计算资源：** GPU、CPU、内存以及运行 LLM 的专用硬件。
- **模型服务：** 托管模型并处理推理请求的系统。
- **存储：** 保存大型模型文件、Embedding 及向量数据库的方案。
- **编排：** 面向 LLM 工作负载的 Kubernetes 与容器管理。
- **网络：** LLM 服务的负载均衡器、API 网关及路由。
- **监控：** 追踪性能、费用及质量的可观测性工具。
- **数据管道：** 准备训练数据及微调的系统。
- **支撑服务：** 向量数据库、缓存层与集成工具。

### LLM 基础设施的范围

LLM 基础设施包含多个相互关联的领域：

#### 1. 推理基础设施
提供模型预测所需的系统及资源：
- 模型托管与服务。
- 请求处理及批处理。
- 响应生成与流式输出。
- 负载均衡及自动扩缩容。

#### 2. 微调基础设施
使用领域专用数据定制模型所需的资源：
- 训练集群与 GPU 管理。
- 数据预处理管道。
- 实验追踪及模型版本管理。
- 模型评估与验证。

#### 3. RAG 基础设施
检索增强生成系统的组件：
- 存储 Embedding 的向量数据库。
- 文档处理与切分。
- 检索与排序系统。
- Embedding 模型服务。

#### 4. 支撑基础设施
支持 LLM 应用的其他系统：
- 缓存层（Redis、Memcached）。
- API 网关与身份验证。
- 监控与日志。
- 费用追踪与优化。

### LLM 基础设施技术栈示例

完整的 LLM 基础设施技术栈可能如下所示：

```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│  (Chatbots, Code Assistants, Document Analysis, etc.)  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│        (Authentication, Rate Limiting, Routing)         │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────────────────┐            ┌──────────────────────┐
│   LLM Serving     │            │   Vector Database    │
│   (vLLM, TGI)     │            │ (Qdrant, Weaviate)   │
│                   │            │                      │
│ ┌───────────────┐ │            │ ┌────────────────┐  │
│ │  Llama 2 7B   │ │            │ │   Embeddings   │  │
│ └───────────────┘ │            │ │   (1M vectors) │  │
│ ┌───────────────┐ │            │ └────────────────┘  │
│ │  Mistral 7B   │ │            │                      │
│ └───────────────┘ │            └──────────────────────┘
└───────────────────┘
        │                                   │
┌───────────────────────────────────────────────────────┐
│              Kubernetes Orchestration                  │
│  (Pod Management, Auto-scaling, Service Discovery)    │
└───────────────────────────────────────────────────────┘
        │
┌───────────────────────────────────────────────────────┐
│                  Compute Resources                     │
│      (GPU Nodes: A100, A10G, T4, etc.)                │
└───────────────────────────────────────────────────────┘
        │
┌───────────────────────────────────────────────────────┐
│              Monitoring & Observability                │
│    (Prometheus, Grafana, ELK Stack, Cost Tracking)   │
└───────────────────────────────────────────────────────┘
```

## LLM 基础设施为何不同

理解 LLM 与传统 ML 基础设施的根本区别，对于构建有效的 LLM 系统十分重要。

### 1. 模型大小与内存需求

**传统 ML 模型：**
- 大小：通常为 10MB–1GB。
- 内存：可轻松装入 CPU 内存或单 GPU 显存。
- 示例：BERT-base（1.1 亿参数）约为 440MB。

**大型语言模型：**
- 大小：5GB–100GB 以上（原文压缩模型示例）。
- 内存：可能需要多块 GPU 或专用硬件。
- 示例：Llama 2 70B 的 FP16 权重约为 140GB。

**对基础设施的影响：**
```python
# Memory calculation for LLM inference
def calculate_memory_requirements(num_parameters, precision="fp16"):
    """
    Calculate minimum GPU memory needed for LLM inference
    """
    bytes_per_param = {
        "fp32": 4,
        "fp16": 2,
        "int8": 1,
        "int4": 0.5
    }

    # Model weights
    model_memory_gb = (num_parameters * bytes_per_param[precision]) / (1024**3)

    # KV cache (rough estimate: 20% of model size per request)
    kv_cache_gb = model_memory_gb * 0.2

    # Activation memory (rough estimate: 30% of model size)
    activation_gb = model_memory_gb * 0.3

    total_memory_gb = model_memory_gb + kv_cache_gb + activation_gb

    return {
        "model_memory_gb": round(model_memory_gb, 2),
        "kv_cache_gb": round(kv_cache_gb, 2),
        "activation_gb": round(activation_gb, 2),
        "total_memory_gb": round(total_memory_gb, 2),
        "recommended_gpu_memory_gb": round(total_memory_gb * 1.2, 2)  # 20% buffer
    }

# Example: Llama 2 7B
print("Llama 2 7B (FP16):")
print(calculate_memory_requirements(7_000_000_000, "fp16"))
# Output:
# {
#   'model_memory_gb': 13.04,
#   'kv_cache_gb': 2.61,
#   'activation_gb': 3.91,
#   'total_memory_gb': 19.56,
#   'recommended_gpu_memory_gb': 23.47
# }

# Example: Llama 2 70B
print("\nLlama 2 70B (FP16):")
print(calculate_memory_requirements(70_000_000_000, "fp16"))
# Requires 234GB+ GPU memory!
```

### 2. 计算强度与延迟

**传统 ML：**
- 推理时间：毫秒级（原文示例通常低于 50ms）。
- 计算：许多模型可以在 CPU 上运行。
- 批处理：相对简单且有效。

**LLM：**
- 推理时间：秒级（完整响应约 1–30 秒）。
- 计算：为达到实用延迟，通常需要 GPU 等加速硬件。
- 批处理：由于序列长度不同而较复杂。

**性能比较（原文示例）：**

| 模型类型 | 硬件 | P95 延迟 | 吞吐量 |
|---|---|---|---|
| BERT 分类 | CPU（8 核） | 20ms | 400 请求/秒 |
| BERT 分类 | GPU（T4） | 5ms | 2000 请求/秒 |
| Llama 2 7B（50 token） | CPU（32 核） | 45 秒 | 0.02 请求/秒 |
| Llama 2 7B（50 token） | GPU（T4） | 3 秒 | 0.33 请求/秒 |
| Llama 2 7B（50 token） | GPU（A100） | 1.2 秒 | 0.83 请求/秒 |

### 3. 成本结构

**传统 ML：**
- 单请求费用相对可预测。
- 通常可以使用 CPU。
- 原文假设扩展费用线性增长。

**LLM：**
- 固定费用较高（GPU 基础设施）。
- 费用随生成 token 数量而变化。
- 优化对于系统的经济可行性十分重要。

**成本比较示例：**

```python
# Monthly cost calculator
def calculate_monthly_llm_cost(
    requests_per_day,
    avg_input_tokens,
    avg_output_tokens,
    gpu_type="A10G",
    gpu_cost_per_hour=1.20
):
    """
    Calculate monthly infrastructure costs for LLM serving
    """
    # GPU requirements (simplified)
    gpu_requirements = {
        "7B_model": {"A10G": 1, "T4": 1, "A100": 0.5},
        "13B_model": {"A10G": 1, "T4": 2, "A100": 1},
        "70B_model": {"A10G": 4, "T4": 8, "A100": 2}
    }

    # Throughput estimates (requests per GPU per second)
    throughput = {
        "7B_model": {"A10G": 0.5, "T4": 0.3, "A100": 1.0},
    }

    # Calculate required GPUs for 7B model
    requests_per_second = requests_per_day / 86400
    gpus_needed = max(1, requests_per_second / throughput["7B_model"][gpu_type])

    # Monthly GPU cost
    monthly_gpu_cost = gpus_needed * gpu_cost_per_hour * 24 * 30

    # Total tokens processed
    total_requests_monthly = requests_per_day * 30
    total_tokens = total_requests_monthly * (avg_input_tokens + avg_output_tokens)

    # Cost per request and per token
    cost_per_request = monthly_gpu_cost / total_requests_monthly
    cost_per_million_tokens = (monthly_gpu_cost / total_tokens) * 1_000_000

    return {
        "requests_per_day": requests_per_day,
        "gpus_needed": round(gpus_needed, 2),
        "monthly_gpu_cost": round(monthly_gpu_cost, 2),
        "cost_per_request": round(cost_per_request, 4),
        "cost_per_million_tokens": round(cost_per_million_tokens, 2),
        "gpu_type": gpu_type
    }

# Example: Medium traffic service
print("Medium Traffic (10,000 requests/day):")
print(calculate_monthly_llm_cost(
    requests_per_day=10_000,
    avg_input_tokens=500,
    avg_output_tokens=200,
    gpu_type="A10G",
    gpu_cost_per_hour=1.20
))
# Output shows real costs for infrastructure planning
```

### 4. 基础设施复杂度

**传统 ML：**
- 标准部署模式（REST API、批处理）。
- 相对成熟的扩展策略。
- 成熟的工具生态。

**LLM：**
- 复杂的部署需求（GPU 调度、张量并行）。
- 新的优化技术（量化、KV Cache 管理）。
- 快速演进的工具生态。

## LLM 基础设施的独特挑战

### 挑战 1：显存约束

LLM 服务的主要约束之一是 GPU 显存（VRAM）。与较小的传统模型相比，LLM 往往需要仔细规划显存才能成功运行。

**显存组成：**

1. **模型权重：** 模型参数本身，通常是重要组成部分。
2. **KV Cache：** 缓存 Key 与 Value，以加速生成，随上下文长度增长。
3. **激活值显存：** 计算过程中的临时张量。
4. **批处理显存：** 并发请求引入的额外显存。

**缓解策略：**
- 模型低精度表示及量化（FP16、INT8、INT4）。
- KV Cache 优化（vLLM 的 PagedAttention）。
- 张量并行（将模型拆分到多块 GPU）。
- 卸载（Offloading，将部分权重或状态放在 CPU 内存或磁盘）。

### 挑战 2：推理延迟

LLM 的自回归解码具有顺序依赖：通常需要生成当前 token，才能继续生成下一个 token。这带来独特的延迟挑战。

**延迟因素：**
- **模型大小：** 模型越大，每个 token 所需计算通常越多。
- **上下文长度：** 上下文越长，KV Cache 相关操作开销通常越大。
- **输出长度：** 输出 token 越多，生成时间通常越长（原文近似为线性增长）。
- **批大小：** 较大批次可能提高 GPU 利用率，但增加单请求延迟。

**优化策略：**
```python
# Latency optimization techniques
optimization_techniques = {
    "quantization": {
        "latency_improvement": "1.5-3x",
        "quality_impact": "minimal to moderate",
        "implementation": "GPTQ, AWQ, GGUF"
    },
    "flash_attention": {
        "latency_improvement": "1.5-2x",
        "quality_impact": "none",
        "implementation": "vLLM, TensorRT-LLM"
    },
    "speculative_decoding": {
        "latency_improvement": "1.5-2.5x",
        "quality_impact": "none",
        "implementation": "vLLM, HF Transformers"
    },
    "continuous_batching": {
        "throughput_improvement": "3-10x",
        "latency_impact": "minimal",
        "implementation": "vLLM, TensorRT-LLM"
    }
}
```

### 挑战 3：成本管理

如果缺少合理管理，LLM 基础设施成本可能快速增长。原文举例，单 GPU 每小时可能花费 1–10 美元，大型部署可能需要数十块 GPU。

**成本驱动因素：**
- GPU 租赁费用（AWS、GCP、Azure）。
- 模型大小与复杂度。
- 请求量和流量模式。
- 低效的资源利用。

**成本优化框架：**

```python
# Cost optimization decision framework
class LLMCostOptimizer:
    def __init__(self, budget_per_month, expected_requests_per_day):
        self.budget = budget_per_month
        self.daily_requests = expected_requests_per_day

    def recommend_strategy(self):
        """
        Recommend cost optimization strategy based on usage
        """
        strategies = []

        # Calculate constraints
        cost_per_request_limit = self.budget / (self.daily_requests * 30)

        if cost_per_request_limit < 0.001:
            strategies.append("Critical: Use smallest viable model (7B)")
            strategies.append("Implement aggressive caching")
            strategies.append("Use INT8 or INT4 quantization")
            strategies.append("Consider spot instances for non-critical workloads")
        elif cost_per_request_limit < 0.01:
            strategies.append("Use 7B or 13B model with quantization")
            strategies.append("Implement request batching")
            strategies.append("Use mid-tier GPUs (A10G, T4)")
        else:
            strategies.append("Budget allows for larger models or premium GPUs")
            strategies.append("Focus on performance over cost optimization")

        return strategies

# Example usage
optimizer = LLMCostOptimizer(budget_per_month=5000, expected_requests_per_day=50_000)
print(optimizer.recommend_strategy())
```

### 挑战 4：质量与一致性

LLM 可以产生不同的输出，在生产环境中确保质量与一致性具有挑战。

**质量挑战：**
- 非确定性输出（即使 temperature=0）。
- 幻觉与事实错误。
- 对提示词敏感。
- 上下文长度限制。

**质量保证策略：**
- 全面的提示词测试。
- 输出验证与过滤。
- 对模型更新进行 A/B 测试。
- 对关键应用实施人工审核。
- 使用 RAG 提供事实依据。

### 挑战 5：扩展复杂度

LLM 基础设施的扩展与传统 Web 服务不同。

**挑战：**
- GPU 调度与分配。
- 有状态推理（上下文管理）。
- 不固定的处理时间。
- 冷启动延迟。
- 过度供应资源的成本影响。

**扩展模式：**
```yaml
# Example: Auto-scaling configuration for LLM pods
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: llm-serving-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: llm-serving
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
        name: llm_queue_length
      target:
        type: AverageValue
        averageValue: "10"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Slower scale-down
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60  # Faster scale-up
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

### 挑战 6：模型更新与版本管理

部署新模型或新版本需要仔细编排。

**挑战：**
- 大型模型下载（10–100GB）。
- 部署期间的 GPU 显存约束。
- 金丝雀部署与逐步发布。
- A/B 测试基础设施。
- 回滚能力。

## LLM 部署模式

不同使用场景需要不同部署模式。理解这些模式，有助于设计合适的架构。

### 模式 1：单模型推理 API

**描述：** 托管单个 LLM，并提供处理推理请求的 API 端点。

**使用场景：**
- 概念验证项目。
- 单一用途应用（例如聊天机器人）。
- 低至中等流量服务。

**架构：**
```
┌──────────┐      ┌─────────────────┐      ┌──────────────┐
│  Client  │─────▶│  Load Balancer  │─────▶│  LLM Server  │
│          │      │   (NGINX/ALB)   │      │  (vLLM Pod)  │
└──────────┘      └─────────────────┘      └──────────────┘
                                                   │
                                            ┌──────────────┐
                                            │  GPU: A10G   │
                                            │  Model: 7B   │
                                            └──────────────┘
```

**优点：**
- 易于实现与管理。
- 基础设施复杂度较低。
- 资源使用较可预测。

**缺点：**
- 缺少副本时存在单点故障。
- 对不同使用场景的灵活性有限。
- 流量间歇性出现时，资源可能利用不足。

**配置示例：**
```python
# Simple vLLM server deployment
from vllm import LLM, SamplingParams

# Initialize model
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=1,
    gpu_memory_utilization=0.90,
    max_model_len=4096
)

# Sampling parameters
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512
)

# Simple API wrapper (using FastAPI)
from fastapi import FastAPI
app = FastAPI()

@app.post("/v1/completions")
async def generate(prompt: str):
    outputs = llm.generate([prompt], sampling_params)
    return {"text": outputs[0].outputs[0].text}
```

### 模式 2：多模型服务平台

**描述：** 同时托管多个 LLM，根据模型选择或使用场景路由请求。

**使用场景：**
- 具有多种 LLM 使用场景的组织。
- 不同模型之间的 A/B 测试。
- 面向不同任务的专用模型（聊天、代码、摘要）。

**架构：**
```
                   ┌─────────────────┐
                   │  API Gateway    │
                   │  (Model Router) │
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐   ┌──────▼──────┐  ┌──────▼──────┐
   │  Chat Model │   │  Code Model │  │ Summary Model│
   │  Llama-2-7B │   │ CodeLlama   │  │  Mistral-7B │
   └─────────────┘   └─────────────┘  └─────────────┘
```

**实现示例：**
```python
# Multi-model router
from fastapi import FastAPI, HTTPException
from typing import Dict
import asyncio

class MultiModelRouter:
    def __init__(self):
        self.models: Dict[str, LLM] = {}
        self._initialize_models()

    def _initialize_models(self):
        """Initialize multiple models"""
        model_configs = {
            "chat": {
                "model": "meta-llama/Llama-2-7b-chat-hf",
                "gpu_ids": [0]
            },
            "code": {
                "model": "codellama/CodeLlama-7b-hf",
                "gpu_ids": [1]
            },
            "summary": {
                "model": "mistralai/Mistral-7B-v0.1",
                "gpu_ids": [2]
            }
        }

        for name, config in model_configs.items():
            self.models[name] = LLM(
                model=config["model"],
                tensor_parallel_size=1,
                # Assign specific GPU
                # This requires proper GPU allocation in K8s
            )

    async def generate(self, model_name: str, prompt: str, **kwargs):
        """Route request to appropriate model"""
        if model_name not in self.models:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

        llm = self.models[model_name]
        outputs = llm.generate([prompt], SamplingParams(**kwargs))
        return outputs[0].outputs[0].text

# FastAPI app
app = FastAPI()
router = MultiModelRouter()

@app.post("/v1/{model_name}/completions")
async def generate(model_name: str, prompt: str):
    text = await router.generate(model_name, prompt)
    return {"model": model_name, "text": text}
```

### 模式 3：RAG（检索增强生成）

**描述：** 将 LLM 与向量数据库检索相结合，使生成能够依据特定文档或知识库。

**使用场景：**
- 文档问答。
- 基于企业知识库的客户支持。
- 代码搜索与解释。
- 法律或医疗文档分析。

**架构：**
```
┌────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client   │────▶│  RAG API    │────▶│Vector DB    │
└────────────┘     └──────┬──────┘     │ (Qdrant)    │
                          │            └─────────────┘
                          │
                   ┌──────▼──────┐
                   │  LLM Server │
                   │  (vLLM)     │
                   └─────────────┘
```

**流程：**
1. 用户提交查询。
2. 对查询进行向量化，并搜索向量数据库。
3. 检索相关文档。
4. 将上下文与查询发送给 LLM。
5. LLM 根据相关依据生成响应。

**实现示例：**
```python
# RAG system implementation
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from sentence_transformers import SentenceTransformer

class RAGSystem:
    def __init__(self, llm: LLM, vector_db_url: str):
        self.llm = llm
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_client = QdrantClient(url=vector_db_url)
        self.collection_name = "documents"

    def retrieve(self, query: str, top_k: int = 5):
        """Retrieve relevant documents from vector DB"""
        # Embed query
        query_vector = self.embedding_model.encode(query).tolist()

        # Search vector DB
        results = self.vector_client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=top_k
        )

        # Extract documents
        documents = [hit.payload["text"] for hit in results]
        return documents

    def generate(self, query: str, context_docs: list):
        """Generate response using retrieved context"""
        # Build prompt with context
        context = "\n\n".join(context_docs)
        prompt = f"""Answer the question based on the following context:

Context:
{context}

Question: {query}

Answer:"""

        # Generate response
        outputs = self.llm.generate([prompt], SamplingParams(
            temperature=0.3,
            max_tokens=512
        ))

        return outputs[0].outputs[0].text

    def rag_query(self, query: str):
        """Complete RAG flow"""
        # Retrieve relevant documents
        docs = self.retrieve(query, top_k=5)

        # Generate response with context
        response = self.generate(query, docs)

        return {
            "query": query,
            "response": response,
            "sources": docs
        }

# API endpoint
@app.post("/v1/rag/query")
async def rag_query(query: str):
    result = rag_system.rag_query(query)
    return result
```

### 模式 4：微调管道

**描述：** 使用自定义数据微调 LLM 的基础设施，与推理基础设施分离。

**使用场景：**
- 领域适配（医疗、法律、金融）。
- 风格适配（品牌语气、正式程度）。
- 特定任务优化。
- 在保持性能的情况下使用较小模型。

**架构：**
```
┌────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Training  │────▶│  Fine-tuning    │────▶│  Model       │
│  Data      │     │  Pipeline       │     │  Registry    │
└────────────┘     └─────────────────┘     └──────────────┘
                          │                       │
                   ┌──────▼──────┐               │
                   │  GPU Cluster│               │
                   │  (Training) │               │
                   └─────────────┘               │
                                                 │
                                          ┌──────▼──────┐
                                          │  Inference  │
                                          │  Deployment │
                                          └─────────────┘
```

**工作流：**
```python
# Fine-tuning pipeline orchestration
class FineTuningPipeline:
    def __init__(self, base_model: str, output_dir: str):
        self.base_model = base_model
        self.output_dir = output_dir

    def prepare_data(self, raw_data_path: str):
        """Prepare and validate training data"""
        # Data preprocessing logic
        pass

    def train(self, training_config: dict):
        """Execute fine-tuning job"""
        from transformers import AutoModelForCausalLM, TrainingArguments, Trainer
        from peft import LoraConfig, get_peft_model

        # Load base model
        model = AutoModelForCausalLM.from_pretrained(
            self.base_model,
            load_in_8bit=True,  # Use 8-bit for memory efficiency
            device_map="auto"
        )

        # Configure LoRA
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "v_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )

        # Get PEFT model
        model = get_peft_model(model, lora_config)

        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=4,
            gradient_accumulation_steps=4,
            learning_rate=2e-4,
            fp16=True,
            logging_steps=10,
            save_strategy="epoch"
        )

        # Train (simplified - actual implementation needs dataset, etc.)
        # trainer = Trainer(model=model, args=training_args, ...)
        # trainer.train()

        return model

    def evaluate(self, model, eval_dataset):
        """Evaluate fine-tuned model"""
        # Evaluation logic
        pass

    def deploy(self, model_path: str):
        """Deploy fine-tuned model to inference"""
        # Deployment logic
        pass
```

### 模式 5：混合云部署

**描述：** 出于成本、合规或性能需求，将 LLM 工作负载分布于云平台与本地基础设施。

**使用场景：**
- 成本优化（Spot 实例、预留容量）。
- 数据驻留要求。
- 混合云策略。
- 灾难恢复。

**架构：**
```
                    ┌─────────────────┐
                    │  Global Router  │
                    │  (Multi-Cloud)  │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌──────▼──────┐   ┌──────▼──────┐
    │   AWS     │     │    GCP      │   │ On-Premises │
    │  (Primary)│     │  (Failover) │   │  (Sensitive)│
    └───────────┘     └─────────────┘   └─────────────┘
```

## 硬件需求

理解硬件需求对于 LLM 基础设施规划十分重要。

### GPU 类型及使用场景

| GPU 型号 | 显存 | 相对性能（原文） | 每小时费用（美元） | 适用场景 |
|---|---|---|---|---|
| NVIDIA T4 | 16GB | 1× | 0.35–0.50 | 小模型（7B）、开发 |
| NVIDIA A10G | 24GB | 2.5× | 1.00–1.50 | 7B–13B 模型、生产 |
| NVIDIA A100（40GB） | 40GB | 5× | 3.00–4.00 | 13B–30B 模型、训练 |
| NVIDIA A100（80GB） | 80GB | 5× | 4.00–5.50 | 30B–70B 模型、大批次 |
| NVIDIA H100 | 80GB | 8× | 8.00–10.00 | 大型模型、高性能场景 |

### 模型大小与 GPU 对应关系

```python
# GPU requirements estimator
def estimate_gpu_requirements(
    model_size_billions: float,
    precision: str = "fp16",
    tensor_parallel: int = 1
):
    """
    Estimate GPU requirements for a given model size
    """
    # Calculate memory per GPU
    memory_per_param = {"fp32": 4, "fp16": 2, "int8": 1, "int4": 0.5}
    model_memory_gb = (model_size_billions * 1e9 * memory_per_param[precision]) / (1024**3)

    # Add overhead (KV cache, activations)
    total_memory_gb = model_memory_gb * 1.5

    # Divide by tensor parallel
    memory_per_gpu = total_memory_gb / tensor_parallel

    # Recommend GPU
    recommendations = []
    if memory_per_gpu <= 14:
        recommendations.append(("T4", 16, tensor_parallel))
    if memory_per_gpu <= 22:
        recommendations.append(("A10G", 24, tensor_parallel))
    if memory_per_gpu <= 38:
        recommendations.append(("A100-40GB", 40, tensor_parallel))
    if memory_per_gpu <= 75:
        recommendations.append(("A100-80GB", 80, tensor_parallel))

    return {
        "model_size_b": model_size_billions,
        "precision": precision,
        "tensor_parallel": tensor_parallel,
        "memory_per_gpu_gb": round(memory_per_gpu, 2),
        "recommendations": recommendations
    }

# Examples
print("7B Model:")
print(estimate_gpu_requirements(7, "fp16", 1))

print("\n70B Model:")
print(estimate_gpu_requirements(70, "fp16", 4))
```

### CPU 与内存需求

GPU 并非唯一考虑因素：
- **CPU：** 每块 GPU 配置 8–16 核用于预处理与分词。
- **系统内存：** 64–256GB，用于数据加载、缓存。
- **存储：** 建议使用 NVMe SSD，加快模型加载。
  - 每个模型 100–500GB。
  - IOPS 对多模型服务十分重要。
- **网络：** 10Gbps 以上，用于多 GPU 通信及快速下载模型。

## 成本考虑

### 基础设施成本构成

```python
# Comprehensive cost calculator
class LLMCostCalculator:
    def __init__(self):
        self.gpu_costs = {
            "T4": 0.40,
            "A10G": 1.20,
            "A100-40GB": 3.50,
            "A100-80GB": 5.00,
            "H100": 8.50
        }

    def calculate_monthly_cost(
        self,
        gpu_type: str,
        num_gpus: int,
        utilization: float = 1.0,
        storage_gb: int = 100,
        network_gb: int = 1000,
        additional_costs: dict = None
    ):
        """
        Calculate comprehensive monthly infrastructure costs
        """
        # GPU costs
        gpu_hourly = self.gpu_costs[gpu_type] * num_gpus * utilization
        gpu_monthly = gpu_hourly * 24 * 30

        # Storage costs (NVMe SSD: ~$0.15/GB/month)
        storage_monthly = storage_gb * 0.15

        # Network costs (egress: ~$0.08/GB)
        network_monthly = network_gb * 0.08

        # Additional costs (monitoring, load balancer, etc.)
        additional_monthly = 0
        if additional_costs:
            additional_monthly = sum(additional_costs.values())

        total_monthly = (
            gpu_monthly +
            storage_monthly +
            network_monthly +
            additional_monthly
        )

        return {
            "gpu_monthly": round(gpu_monthly, 2),
            "storage_monthly": round(storage_monthly, 2),
            "network_monthly": round(network_monthly, 2),
            "additional_monthly": round(additional_monthly, 2),
            "total_monthly": round(total_monthly, 2),
            "gpu_type": gpu_type,
            "num_gpus": num_gpus,
            "utilization": utilization
        }

# Example calculations
calculator = LLMCostCalculator()

print("Single A10G Instance:")
print(calculator.calculate_monthly_cost(
    gpu_type="A10G",
    num_gpus=1,
    utilization=0.7,  # 70% utilization
    storage_gb=150,
    network_gb=2000,
    additional_costs={"monitoring": 50, "load_balancer": 30}
))

print("\n4x A100 Cluster:")
print(calculator.calculate_monthly_cost(
    gpu_type="A100-80GB",
    num_gpus=4,
    utilization=0.85,
    storage_gb=500,
    network_gb=10000,
    additional_costs={"monitoring": 200, "load_balancer": 100}
))
```

### 成本优化策略

1. **合理调整规格**
   - 从满足需求的最小模型开始。
   - 监控实际 GPU 利用率。
   - 仅在需要时扩容。

2. **量化（原文示例）**
   - INT8：约降低 50% 成本，质量损失较小。
   - INT4：约降低 75% 成本，存在一定质量损失。

3. **Spot 实例**
   - 非关键工作负载的费用可能节省 50–70%。
   - 妥善处理中断。

4. **缓存**
   - 缓存 Embedding 与常见响应。
   - 原文示例：减少 30–60% 计算量。

5. **请求批处理**
   - 原文示例：GPU 利用率从 30% 提高至 80% 以上。
   - 在控制延迟影响的情况下提高吞吐量。

## LLM 服务框架概览

### vLLM

**适用场景：** 高吞吐量推理、生产部署。

**关键特性：**
- PagedAttention，实现高效显存管理。
- Continuous Batching（连续批处理）。
- OpenAI 兼容 API。
- 支持量化。

**性能：** 原文示例相较 Hugging Face Transformers 提高 10–20 倍吞吐量。

```python
# vLLM quick start
from vllm import LLM, SamplingParams

llm = LLM(model="meta-llama/Llama-2-7b-chat-hf")
sampling_params = SamplingParams(temperature=0.8, top_p=0.95)

prompts = ["Hello, my name is", "The future of AI is"]
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(f"Prompt: {output.prompt}")
    print(f"Generated: {output.outputs[0].text}")
```

### Text Generation Inference（TGI）

**适用场景：** Hugging Face 生态集成、生产部署。

**关键特性：**
- 针对 Hugging Face 模型优化。
- Token 流式输出。
- 张量并行。
- 支持 Flash Attention。

### TensorRT-LLM

**适用场景：** 追求 NVIDIA GPU 上的高性能。

**关键特性：**
- 高度优化的推理引擎。
- 支持 H100 上的 FP8。
- 支持多 GPU、多节点。
- 高级量化能力。

**取舍：** 配置更复杂，灵活性可能较低。

### Ray Serve

**适用场景：** 多模型服务、复杂管道。

**关键特性：**
- 分布式服务框架。
- 模型组合及管道。
- 自动扩缩容。
- 与 Ray 生态集成。

### LangChain/LlamaIndex

**适用场景：** RAG 应用、复杂调用链。

**关键特性：**
- LLM 应用的高级抽象。
- RAG 组件。
- Agent 框架。
- 支持多种 LLM 提供商。

## 行业生态

### 主要云服务商

**AWS**
- Bedrock：托管 LLM 服务。
- SageMaker：自定义 LLM 部署。
- EC2 实例：P4、P5 等自管理方案。

**Google Cloud**
- Vertex AI：托管 LLM 服务。
- GKE：基于 Kubernetes 部署。
- 部分模型支持 TPU。

**Azure**
- Azure OpenAI Service：托管 GPT-4 等模型。
- ML Studio：自定义部署。
- ND 系列 VM：GPU 实例。

### 专业 GPU 云服务商（原文评价）

**Lambda Labs：** 成本高效、开发者友好。

**RunPod：** Serverless GPU、灵活计费。

**CoreWeave：** 高性能 GPU 基础设施。

**Paperspace：** 面向 ML 的 Gradient 平台。

### 向量数据库生态

**Pinecone：** 托管、可扩展、易用。

**Weaviate：** 开源、灵活、适合混合检索。

**Qdrant：** 基于 Rust 的高性能方案，适用于生产。

**Chroma：** 轻量、开发者友好、可嵌入。

**Milvus：** 可扩展，具有企业级功能。

## 入门路线图

### 阶段 1：本地开发（第 1 周）
1. 配置 Python 环境。
2. 安装 transformers 与 vLLM。
3. 在本地运行小模型（原文示例 Llama 2 7B）。
4. 尝试不同提示词与参数。

### 阶段 2：云部署（第 2–3 周）
1. 搭建云 GPU 实例。
2. 部署 vLLM Server。
3. 构建 OpenAI 兼容 API。
4. 实现基础监控。

### 阶段 3：生产功能（第 4–5 周）
1. 添加缓存层。
2. 实现负载均衡。
3. 搭建全面的监控。
4. 添加身份验证与限流。

### 阶段 4：进阶（第 6–8 周）
1. 使用向量数据库构建 RAG 系统。
2. 实现微调管道。
3. 使用量化优化。
4. 部署至 Kubernetes。

## 总结

本课介绍了 LLM 基础设施基础。

### 核心要点

1. **LLM 基础设施与传统 ML 存在根本区别**，主要涉及模型大小、内存需求及计算强度。

2. **主要挑战包括：**
   - 显存约束，需要谨慎选择 GPU。
   - 推理延迟，需要优化技术。
   - 成本管理，需要策略性决策。
   - 概率性输出的质量保证。

3. **常见部署模式：**
   - 单模型推理 API。
   - 多模型服务平台。
   - RAG 系统。
   - 微调管道。
   - 混合云部署。

4. **硬件选型非常重要：**
   - 使 GPU 显存满足模型需求。
   - 考虑成本与性能之间的取舍。
   - 为扩展及增长做好规划。

5. **成本优化十分重要：**
   - 合理调整模型及基础设施规格。
   - 利用量化与缓存。
   - 持续监控及优化。

6. **框架选择很重要：**
   - vLLM：高吞吐量生产部署。
   - TGI：Hugging Face 集成。
   - TensorRT-LLM：高性能推理。
   - Ray Serve：复杂管道。

### 下一步

下一课深入 vLLM 部署：
- 详细架构与特性。
- 生产部署配置。
- 性能优化技术。
- Kubernetes 部署策略。
- 监控与故障排查。

### 自我检查问题

1. LLM 推理中的三个主要显存组成是什么？
2. 为什么 LLM 通常难以在 CPU 上高效运行？
3. LLM 基础设施的主要成本驱动因素是什么？
4. 何时选择 RAG 而不是微调？
5. FP16 的 7B 参数模型需要多少 GPU 显存？
6. 连续批处理有哪些好处？
7. 列举三种 LLM 基础设施成本优化策略。
8. vLLM 与 TensorRT-LLM 有什么区别？

### 推荐阅读

- [vLLM 文档](https://vllm.readthedocs.io/)
- [The Illustrated Transformer（图解 Transformer）](http://jalammar.github.io/illustrated-transformer/)
- [Hugging Face LLM 课程](https://huggingface.co/learn/nlp-course/)
- [NVIDIA TensorRT-LLM 文档](https://github.com/NVIDIA/TensorRT-LLM)

---

**下一课：** [02-vllm-deployment.md](./02-vllm-deployment.md)

> 译注：原文性能、价格及节省比例均为示例，未独立核验。7B 模型 FP16 权重约 14GB（十进制），但实际运行还需 KV Cache、工作区等显存。FP16 是低精度浮点表示，不宜与 INT4/INT8 整数量化完全等同。量化的显存节省并不直接等于费用节省；RAG 也不保证消除幻觉。吞吐量应结合并发、输入输出 token 长度、TTFT、TPOT 与端到端延迟评估。硬件及框架列表不是当前完整生态。LangChain/LlamaIndex 属于应用编排层，并非与 vLLM 同类的推理引擎。所有原始代码块及英文注释保持不变。
