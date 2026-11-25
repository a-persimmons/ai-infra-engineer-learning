# 练习 08：成本感知 LLM 路由

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 07；实验 08

## 目标

构建路由层，为每个请求选择具备足够能力且成本最低的模型。实现分类器（启发式规则 + 小型 LLM）以决定模型层级，并基于置信度进行升级。测量相较始终使用前沿模型的基线节省了多少成本。

## 要求

1. 三个层级：小型（本地 Mistral-7B）、中型（gpt-4o-mini）、大型（gpt-4o）。
2. 为每个请求选择层级的分类器。
3. 基于置信度升级（先使用小模型；不确定时在更大模型上重试）。
4. 成本追踪与基线比较。
5. 在留出的测试集上进行质量评估。

## 分步操作

### 步骤 1——启发式分类器（30 分钟）
```python
def classify_heuristic(query: str) -> int:
    if len(query) < 200 and not any(k in query.lower() for k in ["analyze","reason","derive","compare"]):
        return 0   # small
    if len(query) < 4000:
        return 1   # medium
    return 2       # large
```

### 步骤 2——基于 LLM 的分类器（60 分钟）
使用一次小型 LLM 调用（成本低，每次分类约 0.001 美元）选择层级：
```python
def classify_llm(query: str) -> int:
    r = client_small.chat.completions.create(
        model="mistral-7b",
        messages=[
            {"role":"system","content":"Classify the user query difficulty as 0 (trivial), 1 (moderate), or 2 (complex). Reply with only the digit."},
            {"role":"user","content":query},
        ],
        max_tokens=2, temperature=0,
    )
    return int(r.choices[0].message.content.strip())
```

### 步骤 3——基于置信度升级（45 分钟）
```python
def route_with_escalation(query, max_tier=2):
    tier = classify_heuristic(query)
    for t in range(tier, max_tier+1):
        ans = clients[t].chat.completions.create(model=models[t], messages=[{"role":"user","content":query}], max_tokens=400).choices[0].message.content
        if confident(ans):
            return ans, t
    return ans, max_tier

def confident(text):
    return len(text) > 100 and not any(p in text.lower() for p in ["i don't know", "unable to", "not sure", "cannot determine"])
```

### 步骤 4——测试集（30 分钟）
构造 100 条覆盖不同难度的查询，分别运行以下策略：

1. 始终使用小模型的基线
2. 始终使用大模型的基线
3. 启发式路由
4. 基于 LLM 的路由
5. 带升级机制的路由

记录成本与质量（准备留出的标准答案；按照练习 12 使用精确匹配或 LLM-as-Judge）。

### 步骤 5——结果矩阵（15 分钟）

| 策略 | 成本（美元） | 可接受回答比例 | 平均延迟 |
|---|---|---|---|
| 始终使用小模型 | 0.10 | 60% | 200ms |
| 始终使用大模型 | 5.00 | 95% | 2000ms |
| 启发式 | 1.20 | 88% | 500ms |
| 基于 LLM | 1.50 | 92% | 700ms |
| 带升级 | 2.10 | 96% | 600ms |

### 步骤 6——生产环境改进（30 分钟）
- 缓存分类器决策（相似查询 → 相同层级）。
- 追踪各层级接受率；发生漂移时重新调整启发式规则。
- 每周对路由变更进行 A/B 测试。

## 交付物

1. 支持全部三种策略的路由实现。
2. 测试集与评估框架。
3. `RESULTS.md` 比较结果。
4. `ROUTING_PLAYBOOK.md`：如何增加新层级、何时重新训练分类器。

## 验证

- [ ] 相较始终使用大模型的方案，在质量达到 90% 以上时成本降低至少 50%。
- [ ] 升级机制正确识别被误判为简单、实际困难的查询。

## 常见陷阱

- **分类器幻觉**——LLM 分类器有时返回「the query is...」而非单个数字。使用严格解析与回退机制。
- **分类器的延迟开销**——增加约 100ms；如果因此避免一次 3000ms 的调用，则值得。
- **漂移**——随着查询组合变化，启发式规则不再有效；应持续监控。

> 译注：模型价格与结果矩阵为原文示例，实际评估时应使用当前价格和真实测量数据。
