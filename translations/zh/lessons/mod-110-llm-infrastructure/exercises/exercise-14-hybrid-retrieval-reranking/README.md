# 练习 14：混合检索与重排序流水线

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 实验 02（RAG）、练习 04 与 13

## 目标

将基础 RAG 流水线（仅使用稠密向量）升级为面向生产环境的模式：混合搜索（BM25 + 稠密检索）、使用 Cross-Encoder 重排序、基于来源的引用以及检索评估。测量质量提升。

## 为什么重要

原文指出，仅依靠单向量稠密检索会遗漏约 20% 的真正相关结果。混合检索与重排序是行业常用的高质量 RAG 模式；落地该模式的团队应通过置信区间而非主观感觉回答准确性问题。

## 要求

1. BM25 和稠密检索作为独立路径。
2. 使用倒数排名融合（Reciprocal Rank Fusion，RRF）合并两条路径。
3. 对 RRF 返回的 top-k 使用 Cross-Encoder 重排序。
4. 基于来源的引用：响应包含 `[source]` 标记。
5. 在留出数据集上评估检索（Recall@10、MRR）。

## 分步操作

### 步骤 1——语料库与索引（30 分钟）

使用接近真实场景的语料库（例如 10,000 篇维基百科摘要）。

稠密检索（参见实验 02）：
```python
qdrant.recreate_collection("docs", VectorParams(size=384, distance=Distance.COSINE))
qdrant.upsert(collection_name="docs", points=[PointStruct(id=i, vector=emb, payload={"text": text}) for ...])
```

BM25（稀疏检索）：
```python
from rank_bm25 import BM25Okapi
tokenized_corpus = [doc.split() for doc in corpus]
bm25 = BM25Okapi(tokenized_corpus)
```

### 步骤 2——稠密检索与 BM25 检索（30 分钟）
```python
def dense_retrieve(query, k=20):
    q = emb_model.encode([query])[0].tolist()
    hits = qdrant.search("docs", query_vector=q, limit=k)
    return [(h.id, h.score) for h in hits]

def bm25_retrieve(query, k=20):
    tokenized_query = query.split()
    scores = bm25.get_scores(tokenized_query)
    top_k = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    return [(i, scores[i]) for i in top_k]
```

### 步骤 3——倒数排名融合（15 分钟）
```python
def rrf(rankings, k=60):
    """Each ranking is [(doc_id, score), ...] ordered by relevance."""
    scores = {}
    for ranking in rankings:
        for rank, (doc_id, _) in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)

def hybrid_retrieve(query, k=20):
    dense = dense_retrieve(query, k=k)
    sparse = bm25_retrieve(query, k=k)
    fused = rrf([dense, sparse])[:k]
    return fused
```

### 步骤 4——Cross-Encoder 重排序器（45 分钟）
```python
from sentence_transformers import CrossEncoder
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank(query, candidates, k=4):
    pairs = [[query, corpus[doc_id]] for doc_id, _ in candidates]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [(doc_id, score) for (doc_id, _), score in ranked[:k]]
```

### 步骤 5——组装带引用的响应（30 分钟）
```python
def answer(question):
    candidates = hybrid_retrieve(question, k=20)
    top_docs = rerank(question, candidates, k=4)
    context = "\n\n".join([f"[doc-{i}] {corpus[doc_id]}" for i, (doc_id, _) in enumerate(top_docs)])
    
    prompt = f"""Answer the question using ONLY the context provided.
Cite sources by their bracketed id (e.g., [doc-1]). If the answer is not in the context, say "I don't know."

Context:
{context}

Question: {question}

Answer:"""
    r = llm.chat.completions.create(model="...", messages=[{"role":"user","content":prompt}])
    return {"answer": r.choices[0].message.content, "sources": [doc_id for doc_id, _ in top_docs]}
```

### 步骤 6——评估（30 分钟）
使用由 (question, gold_answer, gold_source_ids) 组成的留出数据集：
```python
def evaluate():
    metrics = []
    for q in eval_set:
        result = answer(q["question"])
        retrieved = set(result["sources"])
        relevant = set(q["gold_source_ids"])
        recall = len(retrieved & relevant) / max(len(relevant), 1)
        first_relevant_rank = next((i for i, s in enumerate(result["sources"]) if s in relevant), -1)
        mrr = 1 / (first_relevant_rank + 1) if first_relevant_rank >= 0 else 0
        metrics.append({"recall@4": recall, "mrr": mrr})
    return {
        "recall@4": mean(m["recall@4"] for m in metrics),
        "mrr": mean(m["mrr"] for m in metrics),
    }
```

比较：

- 仅稠密检索
- 仅 BM25
- RRF（混合检索）
- RRF + 重排序器

预期：RRF 相较任一单独方法使召回率提升约 10 个百分点；重排序器使 MRR 提升约 15 个百分点。

## 交付物

1. 可用的混合检索与重排序流水线。
2. 评估矩阵（4 种策略 × 2 项指标）。
3. 展示基于来源引用的示例查询。
4. `RAG_DESIGN.md`：设计决策与各种方法的适用时机。

## 验证

- [ ] 四种策略均可测量。
- [ ] 在评估集上，混合检索优于任一单独方法。
- [ ] 重排序器提高 MRR，但增加延迟。
- [ ] 响应引用来源。

## 常见陷阱

- **对全部候选集重排序**——重排序器速度较慢（Cross-Attention）；先检索 top-k。
- **引用幻觉**——只提供 doc-1 至 doc-4，LLM 却引用 doc-99。根据实际传入的上下文验证引用。
- **稠密嵌入使用与索引不同的模型**——所有嵌入必须来自相同模型。
- **评估集偏差**——简单问题使分数虚高；也应从真实生产查询中挖掘样本。
