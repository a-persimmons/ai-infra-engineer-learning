# 练习 13：LLM 语义缓存

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 实验 03（向量数据库）、练习 04

## 目标

构建能够对语义等价查询返回缓存响应的语义缓存，而不只是匹配字节完全相同的查询。测量命中率、成本节省及延迟降低情况。

## 为什么重要

以查询字符串为键的标准缓存在 LLM 工作负载中的命中率约为 5%（用户会以不同措辞表达相同意图）。原文指出，语义缓存通过嵌入相似度匹配，将命中率提升至 30–60%，从而使账单减半。

## 要求

1. 以查询的嵌入向量作为缓存键。
2. 命中阈值：余弦相似度大于 0.92。
3. TTL：24 小时。
4. 租户级隔离（不能跨租户泄露）。
5. 命中率、节省成本及延迟指标。
6. 用于测试的绕过缓存查询参数。

## 分步操作

### 步骤 1——嵌入与向量存储（30 分钟）
使用 sentence-transformers + Qdrant（参见实验 03）。
```python
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct

emb_model = SentenceTransformer("all-MiniLM-L6-v2")
qdrant = QdrantClient(host="localhost", port=6333)
qdrant.recreate_collection(
    collection_name="llm_cache",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)
```

### 步骤 2——缓存检查（30 分钟）
```python
import hashlib, time
THRESHOLD = 0.92
TTL_SEC = 24 * 3600

def cache_lookup(query: str, tenant: str) -> dict | None:
    q = emb_model.encode([query])[0].tolist()
    hits = qdrant.search(
        collection_name="llm_cache",
        query_vector=q,
        limit=1,
        query_filter={"must": [{"key": "tenant", "match": {"value": tenant}}]},
    )
    if hits and hits[0].score >= THRESHOLD:
        # Check TTL
        if time.time() - hits[0].payload["ts"] < TTL_SEC:
            return hits[0].payload
    return None
```

### 步骤 3——写入缓存（15 分钟）
```python
def cache_write(query: str, response: dict, tenant: str, usage: dict):
    q = emb_model.encode([query])[0].tolist()
    qdrant.upsert(
        collection_name="llm_cache",
        points=[PointStruct(
            id=hashlib.md5(f"{tenant}:{query}:{time.time()}".encode()).hexdigest()[:32],
            vector=q,
            payload={
                "tenant": tenant,
                "query": query,
                "response": response,
                "ts": time.time(),
                "usage": usage,
            },
        )],
    )
```

### 步骤 4——集成（15 分钟）
```python
async def chat(req, tenant):
    if not req.get("bypass_cache"):
        cached = cache_lookup(req["query"], tenant)
        if cached:
            CACHE_HIT.labels(tenant=tenant).inc()
            return cached["response"]
    
    CACHE_MISS.labels(tenant=tenant).inc()
    resp = await llm.chat.completions.create(...)
    cache_write(req["query"], resp, tenant, resp.usage)
    return resp
```

### 步骤 5——指标（15 分钟）
```python
CACHE_HIT  = Counter("llm_cache_hits_total",   "Cache hits",   ["tenant"])
CACHE_MISS = Counter("llm_cache_misses_total", "Cache misses", ["tenant"])
CACHE_SAVINGS = Counter("llm_cache_tokens_saved_total", "Tokens saved by cache", ["tenant"])
```

### 步骤 6——命中率测试（30 分钟）

生成 100 个语义主题的 1,000 个查询变体。预热之后：

- 预期：约 30–60% 命中率。
- 验证：缓存命中时返回缓存响应，而非再次调用 LLM。
- 与无缓存方案比较成本。

### 步骤 7——TTL 与淘汰（15 分钟）

调度任务，删除超过 TTL_SEC 的 Qdrant Point。或者使用 Qdrant 的 `payload_indexing`，并在查询时施加 TTL 过滤条件。

## 交付物

1. 缓存实现与 Qdrant 配置。
2. 缓存命中/未命中指标。
3. 演示语义等价处理的测试。
4. `RESULTS.md`：命中率、成本节省、延迟改善。

## 验证

- [ ] 代表性工作负载上的命中率 ≥30%。
- [ ] 缓存响应与原始响应一致。
- [ ] 租户 A 的查询不会返回租户 B 的缓存。
- [ ] TTL 到期后条目失效。

## 常见陷阱

- **阈值过低**——为略有差异的问题返回错误答案。
- **没有租户级过滤**——造成跨租户数据泄露。
- **缓存动态内容**——「天气怎么样？」不应缓存。将提示词标记为可缓存或不可缓存。
- **缓存击穿**——N 个并发且相同的未命中请求均调用 LLM。使用 singleflight 模式。

> 译注：实际缓存键还应考虑模型、提示词版本、上下文及授权范围；命中率和成本收益需实测。
