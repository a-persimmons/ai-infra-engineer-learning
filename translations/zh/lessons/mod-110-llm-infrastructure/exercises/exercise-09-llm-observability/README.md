# 练习 09：LLM 专用可观测性

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 06 与 mod-108 监控模块

## 目标

为 LLM 服务技术栈添加 LLM 专用指标埋点：首 token 延迟（TTFT）、吞吐量（tokens/s）、提示词与补全长度分布、模型选择次数、租户级用量，以及采样式提示词与响应日志。

## 为什么重要

通用 HTTP 指标（延迟、错误率）无法回答「LLM 是否正常工作」。LLM 专用信号包括流式输出健康状况、token 吞吐量、响应质量漂移和滥用模式。

## 要求

1. 面向 LLM 服务的自定义 Prometheus 指标。
2. 以 1% 的采样率记录请求的提示词与补全内容。
3. 专门为 LLM 设计的 Grafana 仪表盘。
4. 对异常 token 用量峰值告警。
5. 用于安全分析的匿名化提示词语料库。

## 分步操作

### 步骤 1——自定义指标（45 分钟）
```python
from prometheus_client import Histogram, Counter, Summary

TTFT = Histogram("llm_ttft_seconds", "Time to first token", ["model", "tenant"],
                  buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0))
THROUGHPUT = Histogram("llm_tokens_per_second", "Generation throughput", ["model"],
                        buckets=(10, 25, 50, 100, 200, 500))
PROMPT_LEN = Histogram("llm_prompt_tokens", "Prompt token count", ["model"],
                        buckets=(100, 500, 1000, 4000, 8000, 16000, 32000))
COMP_LEN = Histogram("llm_completion_tokens", "Completion token count", ["model"],
                      buckets=(50, 100, 250, 500, 1000, 2000))
MODEL_SELECT = Counter("llm_model_selected_total", "Model routing decisions",
                        ["model", "tier"])

async def chat(req):
    t0 = time.perf_counter()
    first_token = None
    tokens = 0
    async for chunk in stream:
        if first_token is None:
            TTFT.labels(req.model, req.tenant).observe(time.perf_counter() - t0)
            first_token = time.perf_counter()
        tokens += 1
    duration = time.perf_counter() - first_token
    THROUGHPUT.labels(req.model).observe(tokens / duration)
    PROMPT_LEN.labels(req.model).observe(req.usage.prompt_tokens)
    COMP_LEN.labels(req.model).observe(req.usage.completion_tokens)
```

### 步骤 2——采样式请求日志（30 分钟）
```python
import random
def maybe_log(req, resp):
    if random.random() < 0.01:    # 1% sample
        s3_log({
            "ts": time.time(),
            "tenant": req.tenant,
            "model": req.model,
            "prompt": anonymize(req.messages),
            "completion": resp.choices[0].message.content,
            "usage": dict(resp.usage),
        })

def anonymize(messages):
    # Strip PII: emails, phone numbers, anything matching SSN/credit card patterns
    text = json.dumps(messages)
    text = re.sub(r"\b\w+@\w+\.\w+\b", "[EMAIL]", text)
    text = re.sub(r"\b\d{3}[- ]?\d{3}[- ]?\d{4}\b", "[PHONE]", text)
    return json.loads(text)
```

### 步骤 3——Grafana 仪表盘（60 分钟）

面板：
- **按模型与租户统计每秒请求数**
- **按模型统计 TTFT p50/p95/p99**
- **吞吐量（tokens/s）分布**
- **提示词长度分布热力图**（识别滥用或失控的提示词）
- **补全长度 p99**（识别循环）
- **租户级 token 预算消耗进度**
- **模型选择比例**（路由健康状态）
- **按类型统计错误**（限流、模型错误、验证错误）

### 步骤 4——异常告警（30 分钟）
```yaml
- alert: PromptTokenSpike
  expr: |
    histogram_quantile(0.99, sum by (le, tenant) (rate(llm_prompt_tokens_bucket[5m])))
    > 16000
  labels: { severity: warning }
  annotations: { summary: "Tenant {{ $labels.tenant }} sending unusually long prompts" }

- alert: CompletionExceedsAverage
  expr: |
    histogram_quantile(0.99, sum by (le) (rate(llm_completion_tokens_bucket[5m])))
    > 2 * histogram_quantile(0.50, sum by (le) (rate(llm_completion_tokens_bucket[1d])))
  labels: { severity: info }
  annotations: { summary: "Completion lengths 2× typical — possible loop or stuck generation" }
```

### 步骤 5——成本仪表盘（15 分钟）

与 mod-106 的练习 06 关联：按时间追踪租户级 token 成本。

## 交付物

1. 包含全部五项自定义指标的已埋点服务。
2. S3 中的采样提示词日志。
3. Grafana 仪表盘 JSON。
4. 已部署的告警规则。

## 验证

- [ ] Prometheus 抓取所有指标。
- [ ] 仪表盘渲染全部面板。
- [ ] 采样日志捕获约 1% 的请求，并脱敏个人身份信息（PII）。
- [ ] 合成滥用测试（超大提示词）触发告警。

## 常见陷阱

- **记录原始提示词 → 泄露 PII**——记录前进行匿名化；在受监管环境中考虑完全不记录。
- **在非流式响应上测量 TTFT**——该指标仅对流式响应有意义。
- **token 计数与账单不一致**——使用与 Stripe/计费系统读取的相同 usage 对象。
