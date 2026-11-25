# 第 08 课：最佳实践与可观测性文化

## 学习目标

完成本课后，你将能够：
- 实施 AI 基础设施可观测性最佳实践。
- 在组织内部建立可观测性文化。
- 设计成本高效的可观测性策略。
- 优化监控性能，减少系统开销。
- 为 ML 系统制定有效的服务级别目标（SLO）。
- 开展无责事故复盘，从事故中学习。
- 将可观测性能力扩展至大型 ML 平台。

## 前置条件

- 完成第 01–07 课（全面的可观测性知识）。
- 理解组织运作机制。
- 具有生产 ML 系统经验。

## 导论

可观测性不仅关乎工具，更关乎**文化、实践与思维方式**。如果团队不知道如何使用监控技术栈、忽视指标，或者告警只造成疲劳而无法推动行动，那么即便是最先进的监控技术栈也无法发挥价值。

本课介绍使可观测性真正发挥作用的软技能与组织实践。

---

## 1. 可观测性最佳实践

### 原则 1：从第一天开始设计可观测性

**不推荐的做法：**
```python
# No instrumentation
def predict(data):
    result = model.predict(data)
    return result
```

**推荐做法：**
```python
# Comprehensive instrumentation
def predict(data):
    with tracer.start_as_current_span("predict") as span:
        span.set_attribute("input.size", len(data))

        start_time = time.time()

        try:
            result = model.predict(data)

            latency = time.time() - start_time
            REQUEST_LATENCY.observe(latency)
            REQUEST_COUNT.labels(status="success").inc()

            span.set_attribute("predictions.count", len(result))
            logger.info(
                "Prediction completed",
                latency_ms=latency * 1000,
                batch_size=len(data)
            )

            return result

        except Exception as e:
            REQUEST_COUNT.labels(status="error").inc()
            span.record_exception(e)
            logger.error("Prediction failed", exc_info=True)
            raise
```

### 原则 2：使指标、日志与链路追踪可以相互关联

**使用一致的标识符：**

```python
import uuid
from contextvars import ContextVar

# Request ID context
request_id_ctx = ContextVar("request_id", default=None)

@app.middleware("http")
async def add_request_id(request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_ctx.set(request_id)

    # Add to traces
    span = trace.get_current_span()
    span.set_attribute("request.id", request_id)

    # Add to logs
    structlog.contextvars.bind_contextvars(request_id=request_id)

    # Add to metrics (as label)
    with REQUEST_DURATION.labels(request_id=request_id[:8]).time():
        response = await call_next(request)

    return response
```

**结果（原文示例）：**
- 指标带有 request_id 标签。
- 日志包含 request_id。
- Trace 包含 request_id。
- 可以方便地在 Grafana 中从一种遥测数据跳转至另一种。

> 译注：上面的指标 request_id 标签与本课后面的低基数指标建议存在冲突。生产环境不宜将每次请求的唯一 ID 作为普通 Prometheus 标签；可采用低基数指标配合 Exemplar、Trace ID 与结构化日志进行关联分析。

### 原则 3：在多个层级实现埋点

```
Application Level:
├─ Business metrics (predictions/sec, model accuracy)
├─ Application metrics (request rate, latency, errors)
└─ Code metrics (function duration, cache hits)

Infrastructure Level:
├─ Service metrics (health checks, replicas)
├─ Container metrics (CPU, memory, network)
└─ Node metrics (disk I/O, network bandwidth)

Hardware Level:
├─ GPU metrics (utilization, memory, temperature)
├─ CPU metrics (load, temperature, throttling)
└─ Storage metrics (IOPS, throughput, latency)
```

### 原则 4：监控监控系统本身

可观测性技术栈自身也需要可观测性！

```yaml
# Prometheus self-monitoring
- alert: PrometheusDown
  expr: up{job="prometheus"} == 0
  for: 5m
  labels:
    severity: critical

- alert: PrometheusHighCardinality
  expr: prometheus_tsdb_symbol_table_size_bytes > 1e9
  for: 10m
  labels:
    severity: warning

- alert: PrometheusScrapeFailures
  expr: rate(prometheus_target_scrapes_failed_total[5m]) > 0.1
  for: 10m

# Grafana monitoring
- alert: GrafanaDown
  expr: up{job="grafana"} == 0
  for: 5m

# Loki monitoring
- alert: LokiIngestionRate
  expr: rate(loki_distributor_bytes_received_total[1m]) < 100
  for: 10m
```

---

## 2. 成本高效的可观测性

### 指标基数管理

**不推荐的做法（高基数）：**
```python
# Millions of unique combinations!
REQUEST_COUNT.labels(
    user_id=user_id,           # 1M users
    request_id=request_id,     # Unique per request
    timestamp=str(time.time()) # Always unique
).inc()
```

**推荐做法（受控基数）：**
```python
# Reasonable cardinality
REQUEST_COUNT.labels(
    service="ml-serving",     # 10 services
    model=model_name,         # 20 models
    status=status_code,       # 5-10 statuses
    region=region             # 3-5 regions
).inc()
# Total: 10 × 20 × 10 × 5 = 10,000 series
```

### 日志采样

```python
import random

class SampledLogger:
    """Logger with sampling for high-volume logs"""

    def __init__(self, logger, sample_rate=0.1):
        self.logger = logger
        self.sample_rate = sample_rate

    def debug(self, msg, **kwargs):
        # Sample debug logs (keep 10%)
        if random.random() < self.sample_rate:
            self.logger.debug(msg, **kwargs)

    def info(self, msg, **kwargs):
        # Always log INFO and above
        self.logger.info(msg, **kwargs)

# Usage
logger = SampledLogger(structlog.get_logger(), sample_rate=0.1)
logger.debug("Processing item")  # Only 10% logged
logger.info("Batch completed")   # Always logged
```

### 保留策略

```yaml
# Prometheus retention
storage:
  tsdb:
    retention:
      time: 30d      # 30 days recent data
      size: 50GB     # Or 50GB, whichever comes first

# Loki retention by stream
limits_config:
  retention_period: 168h  # 7 days

# Per-tenant overrides
overrides:
  "production":
    retention_period: 720h  # 30 days
  "development":
    retention_period: 72h   # 3 days
```

### 聚合与降采样

```yaml
# Prometheus recording rules (pre-aggregate)
groups:
  - name: aggregations
    interval: 1m
    rules:
      # Instead of querying raw metrics, use pre-aggregated
      - record: job:model_requests:rate5m
        expr: sum(rate(model_requests_total[5m])) by (job, model_name)

      - record: job:model_latency:p99
        expr: histogram_quantile(0.99, sum(rate(duration_bucket[5m])) by (job, le))
```

### 成本优化检查清单

- [ ] 设置适当的保留期限（不要无限期保留）。
- [ ] 为开销较大的查询使用 Recording Rule。
- [ ] 对大量详细日志实施采样。
- [ ] 控制指标基数（避免高基数标签）。
- [ ] 使用对象存储（如 S3）替代适合迁移的本地磁盘存储。
- [ ] 将历史数据归档到更便宜的存储。
- [ ] 监控监控系统本身的成本。
- [ ] 删除未使用的指标和仪表盘。

---

## 3. 服务级别目标（SLO）

### SLI、SLO 与 SLA 定义

| 术语 | 定义 | 示例 |
|---|---|---|
| **SLI（Service Level Indicator，服务级别指标）** | 服务质量的量化度量 | 请求延迟、错误率 |
| **SLO（Service Level Objective，服务级别目标）** | SLI 的目标值 | 99.9% 的请求延迟低于 200ms |
| **SLA（Service Level Agreement，服务级别协议）** | 包含违约后果的合同约定 | 99.95% 可用率，否则退款 |

### 为 ML 系统定义 SLO

**示例 1：模型服务 SLO**

```yaml
service: bert-model-serving
slos:
  - name: availability
    description: "Service is reachable and responding"
    sli: |
      sum(rate(http_requests_total{status!~"5.."}[5m])) /
      sum(rate(http_requests_total[5m]))
    target: 0.999  # 99.9%
    window: 30d

  - name: latency
    description: "P99 latency under 500ms"
    sli: |
      histogram_quantile(0.99,
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
      )
    target: 0.5  # 500ms
    window: 30d

  - name: quality
    description: "Model accuracy above threshold"
    sli: model_accuracy{dataset="validation"}
    target: 0.92  # 92%
    window: 7d
```

**示例 2：数据管道 SLO**

```yaml
service: feature-engineering-pipeline
slos:
  - name: freshness
    description: "Data updated within 2 hours"
    sli: time() - data_last_updated_timestamp
    target: 7200  # 2 hours
    window: 7d

  - name: completeness
    description: "All expected records present"
    sli: actual_row_count / expected_row_count
    target: 0.999  # 99.9%
    window: 7d

  - name: data_quality
    description: "Data quality checks passing"
    sli: data_quality_checks_passed / data_quality_checks_total
    target: 0.95  # 95%
    window: 7d
```

### 错误预算（Error Budget）

```
Error Budget = (1 - SLO) × Total Requests

Example:
- SLO: 99.9% availability
- Error budget: 0.1%
- Over 30 days: 0.1% × 30 days = 43 minutes of downtime allowed
```

**错误预算仪表盘：**

```promql
# Burn rate (how fast we're consuming error budget)
(1 - sli_value) / (1 - slo_target)

# Remaining error budget
1 - (errors_in_window / (error_budget × requests_in_window))
```

---

## 4. 事故响应与复盘

### 无责事故复盘模板（Blameless Postmortem）

```markdown
# Incident Postmortem: [Title]

**Date:** 2025-10-15
**Duration:** 2 hours 15 minutes
**Severity:** P1 (Critical)
**Authors:** [Names]

## Summary
Brief description of what happened and impact.

## Impact
- **Users affected:** 50,000 (15% of user base)
- **Services affected:** ML model serving, API gateway
- **SLO impact:** Availability dropped to 95.2% (target: 99.9%)
- **Error budget consumed:** 2 weeks worth in 2 hours

## Root Cause
GPU memory leak in model serving container caused OOM crashes.

## Timeline (all times UTC)

| Time | Event |
|------|-------|
| 14:00 | Deployment of model v2.1 |
| 14:15 | First GPU OOM errors in logs |
| 14:30 | Alert: HighModelLatency fires |
| 14:45 | Alert: ModelServingDown fires |
| 14:50 | Engineer begins investigation |
| 15:00 | Root cause identified (memory leak) |
| 15:10 | Rollback initiated |
| 15:30 | Service restored |
| 16:15 | All metrics back to normal |

## What Went Well
- ✅ Alerts fired correctly
- ✅ Runbook was followed
- ✅ Rollback process worked smoothly
- ✅ Communication was clear and timely

## What Went Wrong
- ❌ Memory leak not caught in staging
- ❌ No memory limit on containers
- ❌ Alert delay (15 minutes before firing)
- ❌ Rollback took too long (40 minutes)

## Action Items

| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Add memory profiling to CI/CD | @eng1 | 2025-10-20 | P0 |
| Set container memory limits | @eng2 | 2025-10-18 | P0 |
| Reduce alert threshold | @eng3 | 2025-10-17 | P1 |
| Automate rollback process | @eng1 | 2025-10-25 | P1 |
| Add memory monitoring to dashboard | @eng2 | 2025-10-22 | P2 |

## Lessons Learned
1. Staging environment != production load
2. Resource limits are critical safety nets
3. Faster rollback process needed
4. Memory monitoring gaps identified
```

---

## 5. 建立可观测性文化

### 可观测性文化的三大支柱

**1. 心理安全感**
- 不因事故而指责个人。
- 从失败中学习。
- 关注发生了什么、如何发生，而不是追究是谁造成的。
- 鼓励透明沟通。

**2. 持续学习**
- 定期进行事故复盘。
- 跨团队共享经验。
- 投入培训资源。
- 将依赖个人经验的隐性知识记录下来。

**3. 所有权与责任**
- 团队对自己的服务负责。
- 建立轮流值班机制。
- 「谁构建，谁运营」（You build it, you run it）。
- 授权团队实施必要的改进。

### 可观测性推广者（Observability Champions）

在每个团队中指定可观测性推广者。

**职责：**
- 推广可观测性最佳实践。
- 在 PR 中审查埋点设计。
- 维护仪表盘与告警。
- 主持事故复盘讨论。
- 跨团队共享知识。

### 仪表盘审查

**每月仪表盘审查流程：**

1. **审计现有仪表盘**
   - 是否仍有人使用？（检查访问次数。）
   - 是否仍符合当前需求？
   - 查询是否经过优化？

2. **识别缺口**
   - 是否缺少指标？
   - 是否存在监控盲区？
   - 用户有哪些反馈？

3. **清理**
   - 删除未使用的仪表盘。
   - 修复失效的查询。
   - 更新文档。

### 知识共享

**每周可观测性答疑时间（Office Hours）：**
- 开放问答讨论。
- 演示新仪表盘。
- 共享事故经验。
- 讨论最佳实践。

**内部博客文章：**
- 「我们如何监控 X」。
- 「如何利用 Trace 调试 Y」。
- 「从事故 Z 中获得的经验」。

---

## 6. 扩展可观测性系统

### Prometheus 联邦（Federation）

```yaml
# Central Prometheus scrapes multiple regional Prometheus servers
global:
  scrape_interval: 60s  # Less frequent for federated metrics

scrape_configs:
  - job_name: 'federate-us-west'
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~"ml-.*"}'  # Only scrape ML-related metrics
    static_configs:
      - targets:
          - 'prometheus-us-west:9090'

  - job_name: 'federate-us-east'
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~"ml-.*"}'
    static_configs:
      - targets:
          - 'prometheus-us-east:9090'
```

### Loki 多租户

```yaml
# Different retention and limits per tenant
overrides:
  "team-ml":
    ingestion_rate_mb: 20
    ingestion_burst_size_mb: 40
    retention_period: 720h  # 30 days

  "team-data":
    ingestion_rate_mb: 10
    ingestion_burst_size_mb: 20
    retention_period: 168h  # 7 days
```

### 分片与复制

```yaml
# Prometheus sharding (scrape different targets)
# prometheus-shard-0.yml
global:
  external_labels:
    shard: '0'

scrape_configs:
  - job_name: 'ml-serving'
    relabel_configs:
      - source_labels: [__address__]
        modulus: 3
        target_label: __tmp_hash
        action: hashmod
      - source_labels: [__tmp_hash]
        regex: '0'
        action: keep

# prometheus-shard-1.yml
# ... regex: '1'

# prometheus-shard-2.yml
# ... regex: '2'
```

---

## 总结

本课学习了：

- 可观测性最佳实践（从第一天开始设计、关联分析、多层埋点）。
- 成本高效的可观测性策略（基数管理、采样、保留策略）。
- 为 ML 系统定义服务级别目标。
- 开展无责复盘并从事故中学习。
- 建立可观测性文化（心理安全感、持续学习）。
- 将可观测性扩展至大型平台（联邦、多租户、分片）。

## 最后的思考

可观测性是一个**持续演进的过程**，而非一次性目标：

- 从小规模开始，逐步迭代。
- 让整个团队参与进来。
- 衡量并持续改进。
- 从事故中学习。
- 不仅投入工具，也投入文化建设。

**请记住：** 目标不是追求完美的可观测性，而是获得**能够指导行动的洞察**，从而帮助团队构建更好的 ML 系统。

---

## 模块 08 完成！

恭喜完成监控与可观测性模块。现在你已经学习了以下知识：

- 使用 Prometheus 采集指标。
- 使用 Grafana 进行可视化。
- 使用 ELK/Loki 聚合日志。
- 使用 Jaeger/Tempo 追踪请求。
- 设计有效的告警。
- 监控 ML 模型并检测漂移。
- 建立可观测性文化。

## 下一模块

**模块 09：基础设施即代码（Infrastructure as Code）**——学习使用 Terraform 与 Pulumi 自动化部署基础设施。

---

**预计时长：** 3–4 小时
**难度：** 中级
**前置条件：** 第 01–07 课、生产环境经验。

> 译注：对象存储并非所有监控组件的直接替代后端，例如 Prometheus 本地 TSDB 通常仍依赖本地文件系统。日志采样应保留关键错误、安全事件及有强制留存要求的审计记录。错误预算应与 SLO 的实际统计口径和时间窗口一致。无责复盘并不意味着没有改进责任，仍需明确行动项、负责人及验收条件。Loki 多租户标识应由可信身份验证与授权层设置，不能直接信任外部客户端传入的租户头。原始代码块及其中的英文注释均保留，未逐项运行验证。
