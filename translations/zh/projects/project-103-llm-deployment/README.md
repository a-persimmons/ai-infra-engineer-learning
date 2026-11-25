# 项目 03：LLM 部署平台

## 概览

构建生产就绪的 LLM 部署平台，服务开放权重模型（如 Llama 2 7B），支持 RAG（检索增强生成）、高级优化、成本监控及性能调优。

## 学习目标

- 规模化部署和服务开放权重 LLM。
- 实现模型精度调整和量化优化（FP16、INT8）。
- 构建使用向量数据库的 RAG 系统。
- 优化推理成本与性能。
- 实现 LLM 专用监控。
- 理解并管理 LLM 基础设施成本。

## 前置条件

- 完成项目 01、02。
- 完成模块 01–10（特别是 mod-110：LLM 基础设施）。
- 理解大语言模型。
- 熟悉 Transformer 架构。
- 可访问 GPU 实例（云或本地）。

## 项目规格

基于 [project-specifications.json 中的 proj-103](../../curriculum/project-specifications.json)。

**时长：** 50 小时。

**难度：** 高。

## 技术

- **LLM 服务：** vLLM 或 TensorRT-LLM。
- **向量数据库：** Pinecone、Weaviate 或 Milvus。
- **LLM 框架：** Hugging Face Transformers。
- **RAG 框架：** LangChain 或 LlamaIndex。
- **API：** FastAPI。
- **容器化：** Docker、Kubernetes。
- **监控：** Prometheus、Grafana。

## 项目结构

```
project-103-llm-deployment/
├── README.md (this file)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── src/
│   ├── llm/               # LLM serving logic
│   ├── rag/               # RAG implementation
│   ├── api/               # FastAPI application
│   ├── embeddings/        # Embedding generation
│   └── ingestion/         # Document ingestion pipeline
├── tests/
│   ├── test_llm.py
│   ├── test_rag.py
│   └── test_api.py
├── kubernetes/            # K8s manifests with GPU config
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── gpu-node-pool.yaml
│   └── hpa.yaml
├── monitoring/            # Prometheus, Grafana configs
├── docs/
│   ├── ARCHITECTURE.md
│   ├── RAG.md
│   ├── OPTIMIZATION.md
│   ├── COST.md
│   └── DEPLOYMENT.md
├── prompts/               # Prompt templates
├── data/                  # Sample documents for RAG
└── notebooks/             # Experimentation notebooks
```

## 需实现的主要功能

### 1. LLM 服务

```python
# TODO: Implement LLM serving with vLLM
# - Model loading and quantization (FP16/INT8)
# - Continuous batching
# - KV cache optimization
# - Streaming responses
```

### 2. RAG 系统

```python
# TODO: Implement RAG pipeline
# - Document ingestion and chunking
# - Embedding generation
# - Vector database integration
# - Retrieval with similarity search
# - Context injection into prompts
```

### 3. API 端点

```python
# TODO: Implement FastAPI endpoints
# - POST /generate (standard generation)
# - POST /rag-generate (RAG-augmented generation)
# - GET /health
# - GET /metrics
# - Streaming support (SSE or WebSocket)
```

### 4. 性能优化

```python
# TODO: Implement optimizations
# - Model quantization (reduce memory by 30%+)
# - Continuous batching (increase throughput 3-5x)
# - GPU utilization monitoring
# - Request queuing and batching
```

### 5. 成本监控

```python
# TODO: Implement cost tracking
# - Cost per request calculation
# - Monthly cost projections
# - Cost optimization recommendations
# - Dashboard showing cost trends
```

## 架构图

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  FastAPI API    │
│   (Routing)     │
└────┬────────┬───┘
     │        │
     ▼        ▼
┌────────┐  ┌──────────────┐
│  RAG   │  │ Direct LLM   │
│ System │  │  Generation  │
└────┬───┘  └──────┬───────┘
     │             │
     ▼             │
┌──────────┐       │
│ Vector   │       │
│ Database │       │
│(Pinecone)│       │
└──────────┘       │
     │             │
     └─────┬───────┘
           ▼
    ┌──────────────┐
    │  vLLM Engine │
    │ (Llama 2 7B) │
    │   with GPU   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Prometheus  │
    │  Monitoring  │
    └──────────────┘
```

## 硬件需求

### 最低配置（开发）
- GPU：NVIDIA T4（16GB 显存）。
- CPU：4 核。
- RAM：16GB。
- 存储：50GB。

### 推荐配置（生产）
- GPU：NVIDIA A10 或 A100（24GB 以上显存）。
- CPU：8 核。
- RAM：32GB。
- 存储：100GB。

## 成本估算

**云月费（原文示例）：**
- GPU 实例（A10，全天运行）：300–500 美元。
- 托管向量数据库：50–100 美元。
- 存储及网络：20–50 美元。
- **总计：370–650 美元/月。**

**成本优化建议：**
- 使用 Spot 实例（原文估计节省 60%）。
- 非工作时间缩容至零。
- 模型量化（较小实例）。
- 请求批处理（较高吞吐）。

## 实现路线图

### 第一阶段：基础 LLM 服务（第 1 周）
- [ ] 搭建 vLLM 或 TensorRT-LLM。
- [ ] 部署 Llama 2 7B。
- [ ] 实现基础推理 API。
- [ ] 添加 FP16 精度优化（原文称量化）。

### 第二阶段：RAG 实现（第 2 周）
- [ ] 搭建向量数据库。
- [ ] 实现文档摄取流水线。
- [ ] 生成嵌入。
- [ ] 构建 RAG 检索逻辑。
- [ ] 集成 RAG 与 LLM。

### 第三阶段：优化（第 3 周）
- [ ] 实现连续批处理。
- [ ] 优化 KV Cache。
- [ ] 添加请求队列。
- [ ] 达到 80% 以上 GPU 利用率。
- [ ] 将延迟降至 500ms 以下。

### 第四阶段：监控与部署（第 4 周）
- [ ] 增加全面监控。
- [ ] 实现成本追踪。
- [ ] 部署至支持 GPU 的 Kubernetes。
- [ ] 设置自动扩缩容。
- [ ] 完成文档。

## 成功指标

- [ ] LLM 服务 TTFT 低于 500ms。
- [ ] 吞吐超过 100 Token/秒。
- [ ] 负载下 GPU 利用率超过 70%。
- [ ] RAG 检索相关上下文（人工评估）。
- [ ] 通过量化减少 30% 以上内存。
- [ ] 记录并优化每千次请求成本。
- [ ] 完整监控仪表盘正常。
- [ ] 文档支持他人部署及扩展。

## 关键挑战

### 1. GPU 显存不足（OOM）
**方案：** 量化、较小批量、参数更少的模型。

### 2. 推理缓慢
**方案：** 启用连续批处理、使用 GPU、优化预处理。

### 3. RAG 质量较差
**方案：** 调整切分大小、增加重排序、改善检索参数。

### 4. 成本高
**方案：** Spot 实例、量化、批处理、响应缓存。

## 资源

- [vLLM 文档](https://docs.vllm.ai/)
- [LangChain 文档](https://python.langchain.com/docs/)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)
- [向量数据库对比](https://benchmark.vectorview.ai/)
- [LLM 优化指南](https://huggingface.co/docs/transformers/main/en/optimization)

## 测试策略

### 1. 单元测试
- 模型加载与推理。
- 嵌入生成。
- 向量搜索。
- API 端点。

### 2. 集成测试
- 端到端 RAG 流程。
- LLM 生成质量。
- 检索准确性。

### 3. 性能测试
- 延迟基准（P50、P95、P99）。
- 吞吐测试（请求/秒）。
- 负载下 GPU 利用率。
- 每千次请求成本。

### 4. 质量评估
- RAG 相关性评估。
- LLM 回答质量（人工）。
- 提示词工程测试。

## 交付物

1. 可运行 LLM 服务 API。
2. 正常运行 RAG 系统。
3. 支持 GPU 的 Kubernetes 部署。
4. 监控仪表盘。
5. 成本分析报告。
6. 性能基准测试结果。
7. 完整文档。
8. 演示视频（可选）。

## 下一步

1. 复习 LLM 基础（模块 10）。
2. 设置 GPU 实例（本地或云）。
3. 从基础 LLM 服务开始。
4. 逐步实现 RAG。
5. 优化与基准测试。
6. 部署至生产。

---

**注意：** 这是需要 GPU 访问及较多计算资源的高级项目。考虑云额度或 Spot 实例以减少成本。

**重要：** 原文以 2024–2025 年为背景，认为 LLM 服务是前沿技术，相关技能需求较高。

**问题？** 查看[故障排查指南](./docs/TROUBLESHOOTING.md)或在 GitHub Discussions 提问。

> 译注：费用为原文历史估计，实际全天 GPU 成本可能明显不同；FP16 是低精度格式，不必然属于权重量化。7B 模型的显存需求随精度、上下文及并发变化，性能目标未实测。模型许可及硬件、软件版本需自行核对。
