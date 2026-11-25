# 练习 04：向量数据库基准测试

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 03（Qdrant）

## 目标

对三个向量数据库（Qdrant、Weaviate、pgvector）使用相同工作负载（100 万至 1,000 万向量）进行基准测试。测量索引构建速度、查询延迟、召回率和内存占用，形成决策矩阵。

## 为什么重要

向量数据库的选择将影响未来一年的运维习惯与成本。依据营销材料选择容易后悔；基于自己的工作负载测量，才能做出有把握的决策。

## 要求

1. 100 万个 384 维向量（使用 sentence-transformers 对语料库生成嵌入）。
2. 将相同数据集加载至三个数据库。
3. 基准指标：索引时间、并发 1 与 32 时查询 p50/p95、Recall@10、内存。
4. 带元数据过滤的查询基准测试。
5. 比较矩阵与选型建议。

## 分步操作

### 步骤 1——生成数据集（30 分钟）
```python
from sentence_transformers import SentenceTransformer
from datasets import load_dataset

ds = load_dataset("wikipedia", "20220301.simple", split="train[:1000000]")
emb = SentenceTransformer("all-MiniLM-L6-v2")
vectors = emb.encode([x["text"][:200] for x in ds], batch_size=256, show_progress_bar=True)
# 1M × 384 float32 ≈ 1.5 GB
```

### 步骤 2——Qdrant（45 分钟）
建立索引、执行基准测试并记录。

### 步骤 3——Weaviate（45 分钟）
```bash
docker run -d -p 8080:8080 semitechnologies/weaviate:1.39.13
```
使用相同数据集与查询。

### 步骤 4——pgvector（45 分钟）
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=app pgvector/pgvector:pg15
psql ... -c "CREATE EXTENSION vector; CREATE TABLE docs (id int, embedding vector(384), metadata jsonb);"
# COPY for bulk insert
psql -c "CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);"
```

### 步骤 5——基准测试框架（45 分钟）
```python
import time, random
def bench(client, n_queries=1000, concurrency=1):
    queries = [random_vector() for _ in range(n_queries)]
    # ... run with thread pool
    return {"p50_ms": ..., "p95_ms": ..., "throughput_qps": ...}

results = {
    "qdrant":   bench(qdrant_client),
    "weaviate": bench(weaviate_client),
    "pgvector": bench(pg_conn),
}
```

### 步骤 6——带过滤条件的查询基准测试（15 分钟）
相同查询加元数据过滤条件（例如 `category = "science"`）。每个数据库的过滤语义不同；同时测量速度与正确性。

### 步骤 7——比较矩阵（15 分钟）

| 指标 | Qdrant | Weaviate | pgvector |
|---|---|---|---|
| 索引时间（100 万向量） | | | |
| 查询 p50（ms） | | | |
| 查询 p95（ms） | | | |
| 并发 32 时吞吐量 | | | |
| Recall@10 | | | |
| 内存 | | | |
| 带过滤条件的查询延迟 | | | |
| 运维复杂度 | | | |

## 交付物

1. 每个数据库的基准测试脚本。
2. `RESULTS.md` 比较矩阵。
3. `RECOMMENDATION.md`：每种数据库的适用场景。

## 验证

- [ ] 三个数据库针对相同查询返回相似的 top-k 结果。
- [ ] 每个数据库 Recall@10 ≥ 0.95（允许边缘情况存在一些差异）。
- [ ] 基准测试数据可复现。

## 常见陷阱

- **距离度量不同**——余弦距离与 L2 距离产生不同排序，应统一度量。
- **索引参数不匹配**——HNSW m=8 与 m=16 会影响召回率和速度，应匹配配置。
- **预热很重要**——首次查询总是较慢。
