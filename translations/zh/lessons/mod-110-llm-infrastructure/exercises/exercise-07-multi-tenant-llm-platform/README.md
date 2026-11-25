# 练习 07：多租户 LLM 平台

**时长：** 4 小时
**难度：** 高级
**前置条件：** 练习 03 与 06

## 目标

构建多租户 LLM 平台：共享 GPU 池提供 N 个模型的服务、租户级 API Key 与配额及限流、按租户路由请求、独立计量。让租户无感知地共享基础设施。

## 要求

1. 所有租户使用统一入口。
2. 通过 API Key 进行租户身份验证。
3. 租户级限流与 token 配额。
4. 按租户配置将请求路由到正确模型。
5. 租户级成本归因与账单导出。
6. 租户隔离：租户 A 的流量峰值不会降低租户 B 的服务质量。

## 分步操作

### 步骤 1——租户配置（15 分钟）
```yaml
# tenants.yaml
- id: tenant-a
  api_key_hash: <sha256>
  models_allowed: ["mistral-7b", "llama-3-8b"]
  rate_limit_rpm: 1000
  tokens_per_day: 10_000_000
  priority: 1
- id: tenant-b
  api_key_hash: <sha256>
  models_allowed: ["mistral-7b"]
  rate_limit_rpm: 100
  tokens_per_day: 1_000_000
  priority: 0
```

### 步骤 2——身份验证中间件（30 分钟）
```python
from fastapi import HTTPException, Header
import hashlib

TENANTS = load_tenants()

async def auth(authorization: str = Header(...)) -> dict:
    api_key = authorization.removeprefix("Bearer ")
    h = hashlib.sha256(api_key.encode()).hexdigest()
    for tenant in TENANTS:
        if tenant["api_key_hash"] == h:
            return tenant
    raise HTTPException(401, "invalid api key")
```

### 步骤 3——限流与配额（45 分钟）
```python
import redis
r = redis.Redis()

async def check_quota(tenant: dict, est_tokens: int = 1000):
    # Rate limit per minute
    key = f"rate:{tenant['id']}:{int(time.time()/60)}"
    count = r.incr(key)
    if count == 1: r.expire(key, 120)
    if count > tenant["rate_limit_rpm"]:
        raise HTTPException(429, "rate limit exceeded")
    
    # Daily token quota
    daily_key = f"tokens:{tenant['id']}:{time.strftime('%Y-%m-%d')}"
    used = int(r.get(daily_key) or 0)
    if used + est_tokens > tenant["tokens_per_day"]:
        raise HTTPException(429, "daily token quota exhausted")
```

### 步骤 4——请求路由与优先级（45 分钟）
```python
@app.post("/v1/chat/completions")
async def chat(req: dict, tenant = Depends(auth)):
    await check_quota(tenant)
    
    model = req["model"]
    if model not in tenant["models_allowed"]:
        raise HTTPException(403, f"model {model} not allowed")
    
    # Forward to vLLM with priority
    extra = {"priority": tenant["priority"]}
    r = await vllm_client.chat.completions.create(
        model=model, messages=req["messages"], extra_body=extra,
    )
    
    # Record actual usage
    r.usage_for_billing = r.usage
    record_usage(tenant, model, r.usage)
    return r
```

### 步骤 5——租户级计量（30 分钟）
```python
import time, json
def record_usage(tenant, model, usage):
    rec = {
        "ts": int(time.time()), "tenant": tenant["id"], "model": model,
        "prompt_tokens": usage.prompt_tokens, "completion_tokens": usage.completion_tokens,
    }
    # Append to S3 line-delimited JSON (daily file)
    s3.put_object(Bucket="usage", Key=f"{tenant['id']}/{date.today()}.jsonl",
                   Body=json.dumps(rec) + "\n", IfMatch=...)   # or use Kinesis Firehose
```

### 步骤 6——账单导出（30 分钟）
每日 Athena 查询 → 租户级账单：
```sql
SELECT tenant, model,
       SUM(prompt_tokens) AS prompt,
       SUM(completion_tokens) AS completion,
       SUM(prompt_tokens * 0.0001/1000 + completion_tokens * 0.0003/1000) AS cost_usd
FROM usage
WHERE date = current_date - 1
GROUP BY tenant, model;
```

### 步骤 7——隔离测试（30 分钟）
合成测试：租户 A 以每分钟 5,000 次请求施加负载。租户 B 的延迟仍应低于 200ms。通过并行负载测试验证。

## 交付物

1. vLLM 前方可用的多租户代理。
2. 身份验证、限流、配额及路由均可用。
3. S3 中的用量记录。
4. 每日账单导出查询。
5. 隔离测试报告。

## 验证

- [ ] 错误 API Key → 401。
- [ ] 超出每分钟请求数 → 429。
- [ ] 请求未授权模型 → 403。
- [ ] 租户 A 超载不会使租户 B 的性能退化超过 20%。

## 常见陷阱

- **日志包含 API Key**——在中间件中遮蔽。
- **配额在 UTC 午夜还是租户本地午夜重置**——选择一种方案并记录。
- **仅靠优先级不能实现隔离**——真正隔离需要独立 Worker 池或限流。
- **流式响应导致账单虚高**——流式响应逐步计算 token，容易重复计数。
