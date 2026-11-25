# 模块 10：LLM 基础设施——测验

## 说明
- 覆盖模块 10 全部 8 课。
- 25 道选择题和 3 道实践场景题。
- 及格线：80%（20/25）。
- 预计用时：60 分钟。
- 文末提供答案汇总及解释。

---

## LLM 基础设施基础（1–4 题）

### 第 1 题

LLM 基础设施与传统 ML 基础设施的主要区别是什么？

A) LLM 只能在 CPU 运行
B) LLM 需要大量 GPU 显存及专门的服务优化
C) LLM 不需要监控
D) LLM 总是在本地部署

**答案：B**

**解释：** LLM 通常具有 7B 到 70B 以上参数，需要专门的 GPU 基础设施、内存优化技术（如 PagedAttention）及满足大量计算需求的服务框架。

### 第 2 题

低流量 LLM 应用采用哪种部署方式最具成本效益？

A) 全天运行的专用 GPU 集群
B) 可自动缩容至零的无服务器推理
C) 多 GPU 分布式服务
D) 仅 CPU 推理

**答案：B**

**解释：** 低流量应用在空闲时缩容至零，避免浪费 GPU 成本。高流量应用可能适合专用资源，而低流量可受益于按使用量计费。

### 第 3 题

使用 FP16 服务 7B 参数 LLM 通常需要多少 GPU 显存？

A) 2–4 GB
B) 7–10 GB
C) 14–16 GB
D) 40 GB 以上

**答案：C**

**解释：** FP16 每参数 2 字节，7B 模型权重约需 14 GB，此外还有 KV Cache、激活及服务开销。原文估计总计 14–16 GB，适合 T4（16 GB）或 A10G（24 GB）。

### 第 4 题

哪个因素对 LLM 推理延迟影响最大？

A) CPU 速度
B) 网络带宽
C) GPU 显存带宽及 KV Cache 管理
D) 存储 IOPS

**答案：C**

**解释：** 自回归 LLM 逐 Token 生成往往受显存带宽限制，而非计算能力限制。GPU 显存带宽决定模型加载权重及管理 KV Cache 的速度，是重要的推理瓶颈。

---

## vLLM 部署（5–8 题）

### 第 5 题

vLLM 中的 PagedAttention 是什么？

A) 减少模型大小的方法
B) 借鉴虚拟内存分页管理 KV Cache 的技术
C) 加速训练的方法
D) GPU 调度算法

**答案：B**

**解释：** PagedAttention 是 vLLM 的核心创新，采用类似虚拟内存分页的方式高效管理 KV Cache，减少显存浪费，使更多请求可进入批次，从而提高吞吐。

### 第 6 题

vLLM 原生提供哪种 API 兼容性？

A) 仅 Hugging Face API
B) 仅自定义 vLLM API
C) 兼容 OpenAI API
D) AWS Bedrock API

**答案：C**

**解释：** vLLM 提供兼容 OpenAI 的 API 端点，包括聊天补全、文本补全和流式端点，方便基于 OpenAI SDK 的应用替换后端。

### 第 7 题

vLLM 的 --max-model-len 参数控制什么？

A) 最大模型参数量
B) 输入和输出的最大上下文长度
C) 最大并发请求数
D) 最大 GPU 显存分配

**答案：B**

**解释：** 该参数设置模型处理的最大 Token 总长度（输入 + 输出）。这对显存管理很重要，需要与 max-num-seqs 平衡以优化吞吐。

### 第 8 题

在 Kubernetes 部署 vLLM，推荐怎样设置资源请求？

A) Request 低于 Limit 以支持超额分配
B) GPU Request 与 Limit 应相等
C) 无需资源限制
D) 只设置 Request，永不设置 Limit

**答案：B**

**解释：** GPU Request 和 Limit 应一致（例如均为 nvidia.com/gpu: 1）。原文将 GPU 视作独占资源，不同于 CPU 或内存的超额分配。

---

## RAG 系统（9–12 题）

### 第 9 题

RAG 的主要目的是什么？

A) 加速模型训练
B) 减小模型大小
C) 使用外部知识库的相关上下文增强 LLM 回答
D) 改善 GPU 利用率

**答案：C**

**解释：** RAG 从文档、数据库等外部来源检索相关信息并放入提示词，弥补 LLM 知识局限，帮助回答专有数据或训练集以外的信息。

### 第 10 题

RAG 流程中的 Chunking 是什么？

A) 压缩模型权重
B) 将文档划分成较小且语义明确的片段
C) 将多个查询组成批次
D) 跨设备拆分 GPU 工作负载

**答案：B**

**解释：** 将长文档分成较小片段（原文举例 200–1000 Token），适应嵌入模型限制并提供聚焦的上下文。良好切分兼顾语义连贯与检索质量。

### 第 11 题

高级 RAG 的重排序步骤有什么作用？

A) 按字母顺序排列文档
B) 使用更复杂的模型重新排列候选项以提高检索精度
C) 压缩检索文档
D) 删除重复结果

**答案：B**

**解释：** 使用 Cross-Encoder 或专门模型，比单纯向量相似度更精确地评估候选项相关性，将最相关文档排在上下文前部。

### 第 12 题

嵌入模型的哪个特征对 RAG 检索质量最重要？

A) 参数量
B) 推理速度
C) 查询与文档嵌入之间的语义相似度
D) GPU 显存占用

**答案：C**

**解释：** 嵌入质量直接影响检索准确性。使相关查询与文档具有高语义相似度的模型（可借助 NDCG 等排序指标评估）可以检索更相关上下文，从而改善回答。

---

## 向量数据库（13–16 题）

### 第 13 题

向量数据库相似度搜索的主要数据结构是什么？

A) B-tree
B) 哈希表
C) HNSW 或 IVF 等近似最近邻（ANN）索引
D) 链表

**答案：C**

**解释：** 向量数据库使用 HNSW（分层可导航小世界图）、IVF（倒排文件索引）或 FAISS 等实现高维嵌入的快速相似度搜索，在准确率可控取舍下提供次线性搜索时间。

### 第 14 题

Qdrant 中的 Collection 是什么？

A) 一组数据库用户
B) 具有相同维度和配置的命名向量集合
C) 向量备份
D) 查询结果集

**答案：B**

**解释：** Collection 类似关系数据库的表，保存相同维度的向量及元数据（Payload），并具有索引和配置设置。

### 第 15 题

增大 HNSW 的 ef_construct 参数有什么取舍？

A) 更高准确率，但索引构建更慢
B) 更低准确率，但索引更快
C) 仅增加内存使用
D) 没有取舍，应总是增大

**答案：A**

**解释：** ef_construct 控制构图期间动态候选列表的大小。更高值可构建更高质量的图，得到更准确的搜索结果，但需要更多构建计算。

### 第 16 题

哪个向量数据库功能对生产 RAG 至关重要？

A) 内置 LLM 托管
B) 在保持向量搜索性能的同时按元数据过滤
C) 自动训练模型
D) 视频存储

**答案：B**

**解释：** 生产 RAG 需要在向量相似度搜索时过滤文档类型、日期、用户权限等元数据。高效过滤可避免相似但无关的文档，并支持多租户 RAG。

---

## LLM 微调基础设施（17–19 题）

### 第 17 题

LoRA（低秩适配）做什么？

A) 压缩模型以加速推理
B) 向冻结的预训练权重添加可训练低秩矩阵
C) 减少数据集大小
D) 自动提高模型准确率

**答案：B**

**解释：** LoRA 冻结预训练权重并添加小型可训练低秩分解矩阵，大幅减少可训练参数（原文称常达 1000 倍），使消费级 GPU 微调成为可能，同时保持质量。

### 第 18 题

QLoRA 相较 LoRA 的主要优势是什么？

A) 训练更快
B) 准确率更高
C) 将基础模型量化至 4 位，同时以较高精度训练 LoRA Adapter
D) 实现更简单

**答案：C**

**解释：** QLoRA 将基础模型 4 位量化与 LoRA 微调结合。原文估计相比单独 LoRA 可减少约 4 倍内存，使 65B 模型在 24–48 GB 显存消费级 GPU 上的微调成为可能。

### 第 19 题

LLM 微调中的灾难性遗忘是什么？

A) GPU 显存溢出
B) 模型过拟合微调数据时忘记预训练知识
C) 丢失保存的检查点
D) 优化器状态损坏

**答案：B**

**解释：** 激进微调可能让模型丧失通用能力，过于偏向狭窄的微调任务。LoRA、较低学习率、多样化训练数据等有助于缓解。

---

## LLM 服务优化（20–22 题）

### 第 20 题

将 LLM 从 FP16 量化为 INT8 有何效果？

A) 内存减半，质量损失较小
B) 内存减少 4 倍
C) 没有内存节省
D) 模型无法使用

**答案：A**

**解释：** INT8 为 8 位，FP16 为 16 位，权重占用约减半，支持 INT8 的硬件还可加速推理。LLM.int8()、GPTQ 等量化技术旨在减轻质量下降。

### 第 21 题

LLM 服务中的 Continuous Batching 是什么？

A) 以连续数据流训练
B) 将相同提示词请求组成批次
C) 旧请求完成时动态加入新请求
D) 服务前预处理批次

**答案：C**

**解释：** 连续批处理（迭代级批处理）在已有请求完成生成后即可加入新请求，无需等待整个批次完成，显著改善 GPU 利用率和吞吐。

### 第 22 题

Flash Attention 旨在优化什么？

A) 模型压缩
B) 注意力计算的内存访问模式
C) 数据集加载
D) 网络通信

**答案：B**

**解释：** 重新组织注意力计算，优化内存层次，减少 GPU 显存读写。在数学上实现与标准注意力相同的结果，并减少内存及执行时间。

---

## LLM 平台架构（23–24 题）

### 第 23 题

多模型 LLM 平台的模型路由器有什么用途？

A) 在 GPU 服务器间负载均衡
B) 按任务、成本或延迟要求将请求路由至合适模型
C) 路由网络流量
D) 存储路由表

**答案：B**

**解释：** 根据任务类型（编码或聊天）、质量要求、延迟约束或成本选择模型。简单任务可路由到较小、较快的模型，复杂任务可使用较大模型。

### 第 24 题

LLM 系统实现语义缓存的主要收益是什么？

A) 更快加载模型
B) 为相似查询返回缓存回答，降低基础设施成本
C) 更高模型准确率
D) 简化部署

**答案：B**

**解释：** 保存查询回答，并为语义相似的请求复用（如“什么是 AI？”和“定义人工智能”）。原文称常见查询模式可减少 30–70% 的 LLM API 调用，降低成本。

---

## 生产 LLM 最佳实践（25–25 题）

### 第 25 题

LLM 服务性能退化时首先应监控什么？

A) 代码质量指标
B) GPU 利用率、显存和队列深度
C) 用户登录模式
D) 数据库查询性能

**答案：B**

**解释：** LLM 性能经常受 GPU 资源限制。检查 GPU 利用率（高吞吐下通常较高）、显存使用（防止 OOM）及请求队列深度（容量问题），可迅速了解资源约束。

---

## 第九部分：实践场景（扩展回答）

### 场景 1：成本优化挑战

**情况：** 初创公司使用 Llama 2 70B 提供聊天机器人服务。当前 AWS 费用为每月 10,000 美元（4 块 A100 全天运行）。每天 500 名活跃用户，使用时间分散但主要集中于工作时间（PST 9:00–17:00）。平均响应时间 800ms，可以接受。

**问题：**
1. 找出至少五种具体成本优化策略。
2. 估算各项可能节省的费用。
3. 解释取舍。
4. 推荐实施方案。

**参考答案：**

**成本优化策略：**

1. **切换至较小模型（Llama 2 13B 或 Mistral 7B）**
   - 潜在节省：50–70%（每月 5,000–7,000 美元）。
   - 取舍：回答质量可能略有下降。
   - 实施：A/B 测试以验证质量可接受。
   - 理由：聊天机器人场景下，较小模型常能提供原文估计的 80–90% 质量。
2. **实施自动扩缩容及定时扩缩容**
   - 潜在节省：40–50%（每月 4,000–5,000 美元）。
   - 取舍：扩容时冷启动延迟 2–5 分钟。
   - 实施：非工作时间（18:00–次日 8:00）缩至 0–1 块 GPU，8:30 预热。
   - 理由：用量集中于工作时间。
3. **量化（GPTQ 或 AWQ 4 位量化）**
   - 潜在节省：30–40%（每月 3,000–4,000 美元）。
   - 取舍：原文估计质量影响不足 5%，显存降低允许使用较少 GPU。
   - 实施：量化模型，测试质量并重新部署。
   - 理由：4 位 70B 可部署到 2 块 A100，而非 4 块。
4. **语义缓存**
   - 潜在节省：20–30%（每月 2,000–3,000 美元）。
   - 取舍：缓存回答过时、缓存存储费用。
   - 实施：部署 Redis 嵌入缓存，TTL 1 小时。
   - 理由：用户查询可能具有常见模式，如 FAQ。
5. **Spot 实例（AWS EC2 Spot）**
   - 潜在节省：60–70%（每月 6,000–7,000 美元）。
   - 取舍：可能中断（原文假设每小时 2% 概率）。
   - 实施：Spot 上运行，按需实例兜底，保存检查点。
   - 理由：适当重试可处理部分中断。
6. **迁移至成本效益更高的云**
   - 潜在节省：30–50%（每月 3,000–5,000 美元）。
   - 取舍：工具不同，存在迁移工作。
   - 实施：评估 Lambda Labs、RunPod 或 CoreWeave 价格。
   - 理由：原文认为专用 GPU 云常比 AWS 便宜 2–3 倍。

**推荐实施方案（分阶段）：**

**第一阶段（第 1–2 周）：快速收益——节省 5,500 美元**
- 实施语义缓存（每月减少 2,500 美元）。
- 启用非工作时间的定时扩缩容（每月减少 3,000 美元）。
- 总节省约 55%。

**第二阶段（第 3–4 周）：模型优化——额外节省 3,000 美元**
- 测试 4 位量化 70B 模型。
- 若质量可接受，部署以减少 GPU 数量。
- 额外节省约 30%。
- 原文累计估计约 85%。

**第三阶段（第 2 个月）：基础设施迁移——额外节省 1,500 美元**
- 评估并迁移至成本效益较高的 GPU 云。
- 适当使用 Spot 实例。
- 原文额外估计约 15%。
- **原文总目标：每月 10,000 美元降至约 1,500–2,000 美元（减少 80–85%）。**

**风险缓解：**
- 部署优化前始终 A/B 测试质量。
- 为 Spot 实例保留按需兜底。
- 为缓存命中率及响应时间设置告警。
- 全程监控用户满意度。

---

### 场景 2：RAG 系统质量问题

**情况：** 为内部公司文档（10,000 份，约 5000 万 Token）部署 RAG。用户反映频繁返回无关信息或遗漏明显答案。当前配置：
- 嵌入：all-MiniLM-L6-v2（384 维）。
- 向量库：Qdrant 默认配置。
- 切分：1500 Token，无重叠。
- 检索：Top-5 片段。
- LLM：Llama 2 13B。

**问题：**
1. 诊断可能根因。
2. 提出具体改进。
3. 解释如何衡量成功。
4. 描述测试方法。

**参考答案：**

**根因分析：**

1. **嵌入模型不足：** all-MiniLM-L6-v2 是轻量通用模型；384 维可能无法捕捉足够语义；未针对领域技术文档优化。
2. **切分不理想：** 1500 Token 很大（原文称接近 LLM 上下文限制）；无重叠可能切断相关内容；固定大小忽视语义边界。
3. **检索受限：** Top-5 可能遗漏相关上下文；没有重排序改善精度；结果缺少多样性。
4. **向量库默认设置：** Qdrant HNSW 参数未调优，可能存在准确率与速度取舍问题。

**改进方案：**

**1. 升级嵌入模型**
```python
# Before: all-MiniLM-L6-v2 (384 dim)
# After: e5-large-v2 or instructor-xl (768-1024 dim)

from sentence_transformers import SentenceTransformer

# Better embedding model
model = SentenceTransformer('intfloat/e5-large-v2')

# Add instruction prefix for queries
query_embedding = model.encode("query: " + user_query)
```
- 预期：检索准确率提高 20–30%。
- 取舍：嵌入慢 2–3 倍，存储增加 2 倍。

**2. 优化切分策略**
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Improved chunking
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,           # Smaller chunks
    chunk_overlap=50,         # Overlap to preserve context
    separators=["\n\n", "\n", ". ", " ", ""],  # Respect semantic boundaries
    length_function=len,
)

chunks = splitter.split_documents(docs)
```
- 预期：检索提高 15–25%。
- 取舍：片段多 2–3 倍，存储增加。

**3. 实施两阶段检索与重排序**
```python
# Stage 1: Retrieve top-20 candidates (recall)
candidates = vector_db.search(query_embedding, top_k=20)

# Stage 2: Rerank with cross-encoder (precision)
from sentence_transformers import CrossEncoder
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

scores = reranker.predict([(query, doc.text) for doc in candidates])
top_5 = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)[:5]
```
- 预期：精度改善 25–35%。
- 取舍：每查询增加 100–200ms 延迟。

**4. 调优向量数据库配置**
```python
from qdrant_client import QdrantClient
from qdrant_client.models import HnswConfigDiff

client.update_collection(
    collection_name="docs",
    hnsw_config=HnswConfigDiff(
        m=32,              # More connections per node (default: 16)
        ef_construct=256,  # Better graph quality (default: 100)
    )
)

# Increase search accuracy
results = client.search(
    collection_name="docs",
    query_vector=query_embedding,
    limit=20,
    search_params={"hnsw_ef": 128, "exact": False}  # Higher ef for better recall
)
```
- 预期：召回改善 10–15%。
- 取舍：索引时间 2 倍，内存增加 20%。

**5. 增加混合检索（稠密 + 稀疏）**
```python
from qdrant_client.models import SparseVector

# Combine dense embeddings with BM25 sparse vectors
results = client.search_batch(
    collection_name="docs",
    requests=[
        # Dense search
        SearchRequest(vector=dense_embedding, limit=10),
        # Sparse search (BM25)
        SearchRequest(sparse_vector=sparse_embedding, limit=10)
    ]
)

# Reciprocal Rank Fusion to combine results
final_results = reciprocal_rank_fusion(results[0], results[1])
```
- 预期：检索改善 15–20%。
- 取舍：索引流程更加复杂。

**衡量成功：**

1. **离线指标（上线前）：**
   - 创建 100–200 个查询—文档对的评估集。
   - 测量 Recall@5、Recall@10、MRR、NDCG@10。
   - 目标：Recall@10 超过 85%，MRR 超过 0.7。
2. **在线指标（生产）：**
   - 用户反馈：回答点赞/点踩。
   - 回答相关性：LLM-as-judge 打分。
   - 检索文档点击率。
   - 任务完成率。
3. **质量保证：**
   ```python
   # Create eval dataset
   eval_queries = [
       {
           "query": "How do I reset my password?",
           "relevant_docs": ["doc_123", "doc_456"],
           "irrelevant_docs": ["doc_789"]
       },
       # ... 100+ more
   ]

   # Calculate metrics
   def evaluate_retrieval(eval_set, retrieval_fn):
       recalls = []
       for item in eval_set:
           retrieved = retrieval_fn(item["query"])
           relevant_found = len(set(retrieved) & set(item["relevant_docs"]))
           recalls.append(relevant_found / len(item["relevant_docs"]))
       return sum(recalls) / len(recalls)
   ```

**测试方法：**

1. **A/B 测试框架：**
   - 逐步部署改进。
   - 将 10% 流量导向新版。
   - 对比一周指标。
   - 逐步增至 50%，再到 100%。
2. **具体测试顺序：**
   - 第 1 周：测试嵌入模型升级。
   - 第 2 周：测试新切分策略。
   - 第 3 周：增加重排序。
   - 第 4 周：调优向量库设置。
   - 第 5 周：全量部署与监控。
3. **回滚计划：**
   - 保存旧嵌入及索引两周。
   - 错误率超过 2% 自动回滚。
   - 质量分下降超过 10% 时人工审查。

**预期结果（原文示例）：**
- 检索准确率：60% → 85% 以上（Recall@10）。
- 用户满意度：65% → 90% 以上。
- 延迟：400ms → 600ms（可接受取舍）。
- 基础设施费用：增加 30%（更好的嵌入、更多片段）。

---

### 场景 3：生产 LLM 事故响应

**情况：** 凌晨 2 点收到 PagerDuty 告警：“LLM Service - High P99 Latency”。生产指标如下：
- P50 延迟：800ms（正常）。
- P99 延迟：45 秒（正常 2 秒）。
- 请求速率：120 req/s（正常 100）。
- GPU 利用率：98%（正常 85%）。
- GPU 显存：78/80 GB（正常 60/80 GB）。
- 请求队列深度：450（正常 20）。
- 错误率：0.5%（正常）。

**问题：**
1. 可能根因是什么？
2. 应采取哪些立即措施？
3. 应收集哪些数据进行根因分析（RCA）？
4. 应实施哪些预防措施？

**参考答案：**

**立即诊断（前 5 分钟）：**

看起来是 **GPU 饱和导致队列积压**，而非服务完全中断。关键指标：
- GPU 利用率 98%（接近饱和）。
- 队列深度 450，对比正常 20（22.5 倍）。
- P99 激增但 P50 正常（部分请求仍快速完成）。
- 请求速率小幅增加（20%）。

**根因假设：**
1. **主要：** 少数极长的生成请求（max_tokens 很高）阻碍批次处理。
2. **次要：** 小幅流量增加使系统超过最佳容量。
3. **促成因素：** 未强制请求超时或最大 Token 限制。

**立即措施（0–15 分钟）：**

```bash
# 1. Check current requests and identify outliers
kubectl exec -it vllm-pod-0 -- curl localhost:8000/metrics | grep request_duration

# 2. Check for stuck requests
kubectl logs vllm-deployment --tail=100 | grep -i "error\|timeout\|oom"

# 3. Check request parameters distribution
# Look for abnormally high max_tokens in recent requests
curl http://prometheus:9090/api/v1/query?query='histogram_quantile(0.99, request_max_tokens)'

# 4. Immediate mitigation: Scale up pods (if auto-scaling not enabled)
kubectl scale deployment vllm-deployment --replicas=6  # From 4 to 6

# 5. Implement request timeout if not present
kubectl set env deployment/vllm-deployment VLLM_REQUEST_TIMEOUT=30s

# 6. Monitor queue decrease
watch -n 5 'kubectl get pods -l app=vllm -o wide && echo "Queue depth:" && curl -s prometheus:9090/api/v1/query?query=vllm_queue_depth'
```

**RCA 数据收集（15–30 分钟）：**

1. **请求 Trace：**
```python
# Query distributed traces for slow requests
import jaeger_client

# Find P99 requests in last hour
slow_requests = jaeger.query(
    service="vllm-service",
    start_time=now - 1h,
    duration_min=10000ms,  # >10s requests
    limit=100
)

# Analyze their parameters
for trace in slow_requests:
    print(f"Request ID: {trace.id}")
    print(f"Max tokens: {trace.tags['max_tokens']}")
    print(f"Input length: {trace.tags['input_length']}")
    print(f"Output length: {trace.tags['output_length']}")
```

2. **GPU 指标：**
```bash
# Export GPU metrics for analysis
kubectl exec vllm-pod-0 -- nvidia-smi dmon -s u -c 60 > gpu_utilization.log

# Check for memory fragmentation
kubectl exec vllm-pod-0 -- nvidia-smi --query-gpu=memory.used,memory.free --format=csv
```

3. **请求分布：**
```promql
# PromQL queries to run
histogram_quantile(0.99, rate(vllm_request_tokens_bucket[5m]))
histogram_quantile(0.99, rate(vllm_generation_tokens_bucket[5m]))
rate(vllm_requests_total[5m])
```

4. **应用日志：**
```bash
# Extract all requests from incident window
kubectl logs vllm-deployment --since=2h --timestamps > incident_logs.txt

# Parse for patterns
cat incident_logs.txt | jq 'select(.duration_ms > 10000)' | jq -s 'group_by(.endpoint) | map({endpoint: .[0].endpoint, count: length})'
```

**根因分析发现（示例）：**

调查发现：
- 15 个请求的 max_tokens=4096（正常 512）。
- 来自未设置 Token 限制的新集成。
- GPU 利用率 98% 时，连续批处理无法高效处理混合长度请求。
- 长请求限制批次吞吐，队列积压。

**预防措施：**

**1. 实施请求验证：**
```python
# Add to vLLM frontend
from fastapi import HTTPException

@app.post("/v1/completions")
async def completions(request: CompletionRequest):
    # Enforce limits
    if request.max_tokens > 1024:
        raise HTTPException(
            status_code=400,
            detail="max_tokens cannot exceed 1024. Use streaming for longer outputs."
        )

    if len(request.prompt) > 4096:
        raise HTTPException(
            status_code=400,
            detail="Prompt length cannot exceed 4096 tokens"
        )

    # Add timeout
    try:
        result = await asyncio.wait_for(
            generate(request),
            timeout=30.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Request timeout")

    return result
```

**2. 设置主动告警：**
```yaml
# prometheus_rules.yml
groups:
  - name: vllm_capacity
    interval: 30s
    rules:
      # Alert before queue builds up
      - alert: VLLMQueueDepthHigh
        expr: vllm_queue_depth > 50
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "vLLM queue depth high (current: {{ $value }})"

      # Alert on GPU memory pressure
      - alert: GPUMemoryHigh
        expr: gpu_memory_used_bytes / gpu_memory_total_bytes > 0.85
        for: 5m
        labels:
          severity: warning

      # Alert on P99 latency degradation
      - alert: HighP99Latency
        expr: histogram_quantile(0.99, rate(vllm_request_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: critical
```

**3. 实施自动扩缩容：**
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
    name: vllm-deployment
  minReplicas: 4
  maxReplicas: 12
  metrics:
    # Scale on queue depth
    - type: Pods
      pods:
        metric:
          name: vllm_queue_depth
        target:
          type: AverageValue
          averageValue: "30"
    # Scale on GPU utilization
    - type: Pods
      pods:
        metric:
          name: gpu_utilization_percent
        target:
          type: AverageValue
          averageValue: "80"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 120
```

**4. 实施限流：**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/v1/completions")
@limiter.limit("100/minute")  # Per-IP limit
async def completions(request: Request):
    # Also implement token-bucket for total system throughput
    if not await acquire_token():
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    ...
```

**5. 改善容量规划：**
```python
# Capacity model
def calculate_capacity(gpu_count, model_size, avg_request_params):
    """
    GPU count: 4x A100 (80GB each)
    Model: Llama 2 70B (FP16)
    Avg request: 512 input + 256 output tokens
    """

    # Memory per request (KV cache)
    memory_per_token = 0.5  # MB per token for 70B model
    tokens_per_request = 512 + 256
    memory_per_request = tokens_per_token * memory_per_token

    # Available memory (after model weights)
    total_memory = gpu_count * 80 * 1024  # MB
    model_memory = 140 * 1024  # 140GB for 70B FP16
    available_memory = total_memory - model_memory

    # Max concurrent requests
    max_concurrent = available_memory / memory_per_request

    # Throughput (tokens/sec per GPU ~= 30 for 70B)
    throughput_tokens_per_sec = gpu_count * 30

    # Requests per second
    requests_per_sec = throughput_tokens_per_sec / tokens_per_request

    print(f"Max concurrent requests: {max_concurrent:.0f}")
    print(f"Max throughput: {requests_per_sec:.1f} req/s")
    print(f"Safe operating point (80% capacity): {requests_per_sec * 0.8:.1f} req/s")

    return max_concurrent, requests_per_sec

# Run capacity planning
calculate_capacity(gpu_count=4, model_size="70B", avg_request_params={})
```

**6. 实施请求优先级：**
```python
import heapq
from enum import IntEnum

class Priority(IntEnum):
    CRITICAL = 0  # Production API
    HIGH = 1      # Internal tools
    MEDIUM = 2    # Batch processing
    LOW = 3       # Experimental

class PriorityQueue:
    def __init__(self):
        self.queue = []

    def add_request(self, request, priority: Priority):
        heapq.heappush(self.queue, (priority.value, time.time(), request))

    def get_next_batch(self, batch_size):
        batch = []
        for _ in range(min(batch_size, len(self.queue))):
            if self.queue:
                _, _, request = heapq.heappop(self.queue)
                batch.append(request)
        return batch
```

**事故报告：**

**影响：**
- 持续 45 分钟。
- 约 5,400 个请求受影响（原文称 10% 经历高延迟）。
- 无数据丢失或错误。
- 用户影响较小（90% 请求未受影响）。

**时间线：**
- 02:00：告警触发。
- 02:05：工程师收到呼叫，开始调查。
- 02:15：识别根因并部署缓解措施。
- 02:30：清空队列，延迟恢复正常。
- 02:45：事故解决。

**行动项：**
1. 实现请求参数验证（第 1 周）。
2. 增加主动队列深度告警（第 1 周）。
3. 部署基于队列的 HPA（第 2 周）。
4. 增加客户端级限流（第 2 周）。
5. 改善容量规划文档（第 3 周）。
6. 实现请求优先级（第 4 周）。

---

## 评分指南

### 选择题（1–25）
- 每题 1 分，共 25 分。
- 及格：20/25（80%）。

### 场景题
- 根据完整性及深度评分。
- 特别优秀的场景答案可获得额外分数。
- 评估重点：根因分析准确性、方案全面性、对取舍的理解、建议的生产就绪程度。

### 场景评分标准

**优秀（90–100%）：**
- 准确识别根因，提供带代码示例的全面方案。
- 清楚解释取舍，包含测量与验证策略。
- 展示生产级思维。

**良好（80–89%）：**
- 识别主要根因，提出可实践方案。
- 提及关键取舍，包含基本指标。

**合格（70–79%）：**
- 识别部分根因，提出一些方案。
- 认识到取舍存在，但缺少部分细节。

**需要改进（低于 70%）：**
- 遗漏关键根因，方案不完整或不切实际。
- 未考虑取舍，缺少测量策略。

---

## 答案汇总

**按部分：**

- 1–4：B、B、C、C（基础）。
- 5–8：B、C、B、B（vLLM）。
- 9–12：C、B、B、C（RAG）。
- 13–16：C、B、A、B（向量数据库）。
- 17–19：B、C、B（微调）。
- 20–22：A、C、B（优化）。
- 23–24：B、B（平台架构）。
- 25：B（生产实践）。

**完整答案：**


1. B | 2. B | 3. C | 4. C | 5. B
6. C | 7. B | 8. B | 9. C | 10. B
11. B | 12. C | 13. C | 14. B | 15. A
16. B | 17. B | 18. C | 19. B | 20. A
21. C | 22. B | 23. B | 24. B | 25. B

---

## 按成绩推荐下一步

### 90–100%（23–25 题正确）
优秀！你对 LLM 基础设施理解扎实。
- 完成高级练习（06–08）。
- 构建结合多个概念的作品集项目。
- 为开源 LLM 工具作贡献。
- 开始准备高级 AI 基础设施工程师岗位。

### 80–89%（20–22 题正确）
良好！已理解核心概念。
- 复习答错的部分，动手练习薄弱主题。
- 完成全部八个练习。
- 构建生产级 LLM 项目。
- 聚焦优化及扩展。

### 70–79%（18–19 题正确）
方向正确，但需要更多练习。
- 重读错题相关讲义，聚焦实践，复习优化和生产主题。
- 在第 05–08 课投入额外时间。
- 结合解答重做练习。
- 为每个主要主题构建小项目。

### 低于 70%（不足 18 题正确）
继续前需补充学习。
1. 仔细重读全部讲义。
2. 记录关键概念。
3. 先完成初级练习（01–03）。
4. 复习先修模块（Kubernetes、监控）。
5. 专注学习一周后重测。

资源：查看 resources.md 的教程与课程；参加社区论坛提问；将学习与动手实践结合。

---

## 补充学习资源

### 特定主题较弱时

**vLLM（5–8 题）：**
- 重读第 02 课。
- 完成练习 01：使用 vLLM 部署 Llama 2。
- 观看 vLLM YouTube 教程；阅读 vLLM 文档。

**RAG（9–12 题）：**
- 重读第 03 课。
- 完成练习 02：构建基础 RAG 系统。
- 阅读 LangChain RAG 教程；尝试不同切分策略。

**向量数据库（13–16 题）：**
- 重读第 04 课。
- 完成练习 03：搭建向量数据库。
- 阅读 Qdrant/Weaviate 文档；对不同 ANN 算法做基准测试。

**微调（17–19 题）：**
- 重读第 05 课。
- 完成练习 04：使用 LoRA 微调。
- 阅读 Hugging Face PEFT 文档；在不同数据集微调模型。

**优化（20–22 题）：**
- 重读第 06 课。
- 完成练习 05：优化 LLM 推理。
- 阅读 GPTQ、AWQ 量化指南；测试量化与全精度性能。

**平台架构（23–24 题）：**
- 重读第 07 课。
- 完成练习 08：构建多模型 API。
- 学习生产 LLM 平台架构；设计自己的平台。

**生产实践（25 题）：**
- 重读第 08 课。
- 完成练习 06：Kubernetes 部署。
- 完成练习 07：实现监控。
- 练习事故响应场景。

---

## 认证建议

根据成绩考虑以下认证：

**90% 以上：**
- 可考虑针对岗位的认证。
- 考虑 Kubernetes 认证（CKA/CKAD）。
- 探索云认证（原文列出 AWS ML Specialty、GCP ML Engineer）。

**80–89%：**
- 先完成剩余练习，构建 1–2 个作品集项目，再考虑认证。

**低于 80%：**
- 聚焦基础，完成全部练习并积累实践经验。
- 重测后再考虑认证。

---

## 反馈与改进

本测验旨在检验实用 LLM 基础设施知识。如果有改进建议，例如：
- 补充场景主题。
- 需要澄清之处。
- 增加真实案例。

欢迎提交反馈，帮助改善课程。

祝学习顺利！

> 译注：原文的 GPU 显存、加速、质量、费用与效果百分比均为示例或假设，不能作为保证。7B FP16 的 14 GB 仅为权重十进制估算，实际显存还受上下文长度、并发等影响；65B QLoRA 在 24 GB 上并不普遍可行。GPU 推理的 Prefill 与 Decode 瓶颈不同。FAISS 是库而非独立 ANN 算法；Kubernetes 支持通过设备插件等实现特定 GPU 共享机制。语义缓存必须考虑租户隔离、权限与时效。场景 1 的节省比例重叠，不能直接相加，原文累计数值自相矛盾，保留供核对。场景 2 的改进收益需在实际评估集验证，向量维数也不能单独决定效果。认证与练习名称沿用原文，可能与实际目录及当前认证状态不同。代码块保留原样。
