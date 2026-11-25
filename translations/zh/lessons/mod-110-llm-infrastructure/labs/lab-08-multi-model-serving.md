# 实验 08：通过智能路由实现多模型服务

**时长：** 75 分钟  **前置条件：** vLLM 或 OpenAI API；一个能力较强的模型和一个成本较低的模型。

## 目标

构建路由层，将每个查询发送给能够处理它的最小模型，在保持质量的同时测量成本节省量。

## 步骤

### 1. 心智模型

- Tier 0：低成本小模型（Mistral-7B、Phi-3-mini、gpt-4o-mini），用于简短事实性或程式化查询。
- Tier 1：中型模型（Llama-3-70B、gpt-4o），用于推理或长上下文。
- Tier 2：能力较强的前沿模型（gpt-4o、claude-3.5-sonnet），仅用于最困难的查询。

### 2. 路由器
```python
import re
from openai import OpenAI

tier_clients = {
    0: OpenAI(base_url="http://localhost:8000/v1", api_key="dummy"),
    1: OpenAI(api_key="$OPENAI_KEY"),
    2: OpenAI(api_key="$OPENAI_KEY"),
}
tier_models = {
    0: "mistralai/Mistral-7B-Instruct-v0.3",
    1: "gpt-4o-mini",
    2: "gpt-4o",
}

def classify(query: str) -> int:
    """Cheap heuristic classifier. Real systems use a tiny LLM classifier."""
    if len(query) < 200 and not any(k in query.lower() for k in ["analyze","reason","compare","derive"]):
        return 0
    if len(query) < 4000:
        return 1
    return 2

def route(query: str) -> str:
    tier = classify(query)
    client = tier_clients[tier]
    model = tier_models[tier]
    r = client.chat.completions.create(model=model, messages=[{"role":"user","content":query}], max_tokens=400)
    return r.choices[0].message.content, tier
```

### 3. 基于置信度的升级

若小模型回答过短或表现出不确定性，则在更大的模型上重试：
```python
def confident(text):
    return len(text) > 100 and not any(p in text.lower() for p in ["i don't know", "unable to", "i'm not sure"])

def route_with_escalation(query, max_tier=2):
    for t in range(max_tier+1):
        ans = tier_clients[t].chat.completions.create(
            model=tier_models[t], messages=[{"role":"user","content":query}], max_tokens=400
        ).choices[0].message.content
        if confident(ans) or t == max_tier:
            return ans, t
```

### 4. 测量
```python
queries = [
    "What is 2+2?",                                         # → tier 0
    "Summarize the plot of Hamlet in one sentence.",        # → tier 0
    "Compare the design tradeoffs of Raft and Paxos in 200 words.",  # → tier 1
    "<5000-char legal document>... Identify all clauses related to termination.",  # → tier 2
]
import time
results = []
for q in queries:
    t0 = time.perf_counter()
    ans, tier = route(q)
    results.append({"q":q[:50], "tier":tier, "ms":int((time.perf_counter()-t0)*1000), "len":len(ans)})
for r in results: print(r)
```

### 5. 成本报告

使用实验 06 的成本查询：
```python
# pseudo: total = sum(price(tier) * tokens(tier))
```
与始终使用 Tier 2 的基线比较；原文给出的典型预期是，经良好调优的路由可降低 50–70% 成本，而质量损失较小。

### 6. 生产环境改进

- 使用训练得到的分类器（基于 TF-IDF 的逻辑回归，或微型 BERT）替代启发式分类器。
- 追踪各层级的接受率；如果 Tier 0 超过 50% 的请求需要升级，调整该类请求的路由层级。
- 在留出的评估集上对路由变更进行 A/B 测试。

## 验证

- [ ] 简单查询路由至 Tier 0。
- [ ] 长查询或复杂查询路由至 Tier 2。
- [ ] 代表性工作负载的总成本低于始终使用前沿模型的基线。

## 清理

无。

## 故障排查

- **分类器将全部请求发送至 Tier 0** — 启发式规则过于宽松；收紧长度/关键词阈值。
- **用户察觉质量下降** — 建立带已知正确答案的离线评估集；当 Tier 0 在该评估集上的准确率下降时发出告警。
- **由于升级而导致延迟增加** — 限制升级深度；某些查询本质上就难以由小模型处理。
