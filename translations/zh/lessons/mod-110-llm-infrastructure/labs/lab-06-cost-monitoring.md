# 实验 06：成本追踪与预算告警

**时长：** 60 分钟  **前置条件：** 具有 `/metrics` 端点的 vLLM，或商业 LLM API。

## 目标

按请求和租户追踪 token 使用量，计算估计成本，在 Grafana 中展示成本数据，并在超出每日/每月预算时发出告警。

## 步骤

### 1. 获取 token 计数

OpenAI 兼容响应通常包含 `usage`（流式响应可能需要显式启用）：
```python
r = client.chat.completions.create(...)
print(r.usage)  # CompletionUsage(prompt_tokens=N, completion_tokens=M, total_tokens=N+M)
```

### 2. 使用中间件将用量记录至指标计数器
```python
# middleware_cost.py
from prometheus_client import Counter

TOKENS_USED = Counter(
    "llm_tokens_total", "Tokens consumed",
    ["tenant","model","kind"],   # kind = prompt | completion
)
COST_USD = Counter(
    "llm_cost_usd_total", "Estimated cost in USD",
    ["tenant","model"],
)

# Cost per 1k tokens (lookup table)
PRICES = {
    "mistralai/Mistral-7B-Instruct-v0.3": (0.0001, 0.0002),  # self-hosted estimate
    "gpt-4o":                              (0.0025, 0.01),
    "claude-3.5-sonnet":                   (0.003, 0.015),
}

def log_usage(tenant, model, usage):
    prompt_p, comp_p = PRICES[model]
    TOKENS_USED.labels(tenant=tenant, model=model, kind="prompt").inc(usage.prompt_tokens)
    TOKENS_USED.labels(tenant=tenant, model=model, kind="completion").inc(usage.completion_tokens)
    cost = (usage.prompt_tokens/1000)*prompt_p + (usage.completion_tokens/1000)*comp_p
    COST_USD.labels(tenant=tenant, model=model).inc(cost)
```
封装代理，使每次 LLM 调用都经过 `log_usage(...)`。

### 3. Prometheus 查询
```promql
# Total cost today by tenant
sum by (tenant) (increase(llm_cost_usd_total[1d]))

# Cost per million tokens by model
sum by (model) (rate(llm_cost_usd_total[5m]))
/
sum by (model) (rate(llm_tokens_total[5m])) * 1e6

# Top 10 spenders
topk(10, sum by (tenant) (increase(llm_cost_usd_total[1d])))
```

### 4. Grafana 仪表盘面板

- 按租户统计每日成本（随时间变化的堆叠柱状图）。
- 按模型统计每千 token 成本（条形仪表）。
- 成本最高的租户（表格）。
- 每月预算消耗（统计值，显示累计与预测）。

### 5. 预算告警
```yaml
- alert: TenantDailyBudgetExceeded
  expr: |
    sum by (tenant) (increase(llm_cost_usd_total[1d])) > 100
  labels: { severity: warning }
  annotations:
    summary: "Tenant {{ $labels.tenant }} exceeded $100 today"
```

### 6. 通过中间件实现硬性预算上限（防御性措施）
```python
DAILY_LIMITS = {"team-a": 100.0}

def check_budget(tenant):
    # Query the counter for today's value
    today = ...  # Prometheus query result
    if today > DAILY_LIMITS.get(tenant, float("inf")):
        raise HTTPException(429, f"daily budget ${DAILY_LIMITS[tenant]} exhausted")
```

### 7. 成本感知路由

将低优先级流量路由到更便宜的模型（小型开源 LLM）；将高端服务流量路由到成本较高的 API。

## 验证

- [ ] 每次请求均按准确的 `usage` 数值增加 token 计数器。
- [ ] 成本计数器与手动计算结果一致。
- [ ] 合成负载使每日成本超过阈值时触发告警。

## 清理

无。

## 故障排查

- **指标中的 token 数是实际数值的两倍** — 中间件被调用两次；检查重复埋点。
- **成本为零** — 定价表缺少对应模型；默认分支应明确发出警告，而不是悄然使用 0。
- **Pod 重启时计数器重置** — Counter 数值自进程启动以来累计。使用时间窗口上的 `increase()`，而非原始数值。
