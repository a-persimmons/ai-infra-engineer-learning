# 第 01 课：可观测性导论

## 学习目标

完成本课后，你将能够：

1. 解释监控与可观测性的区别。
2. 理解可观测性的三大支柱：指标、日志与链路追踪。
3. 描述 OpenTelemetry 标准及其组件。
4. 从零开始设计具有可观测性的系统。
5. 针对不同使用场景选择合适的可观测性工具。

## 导论

在现代分布式系统中，尤其是 ML 基础设施中，理解系统行为至关重要。可观测性超越了传统监控，不仅帮助你了解系统正在发生**什么**，还帮助你理解系统**为什么**会表现出这样的行为。

## 监控与可观测性

### 传统监控

```
Traditional Monitoring:
┌──────────────────────────────────────────────┐
│ "Known Unknowns"                             │
│                                              │
│ • Pre-defined dashboards                    │
│ • Fixed metrics (CPU, memory, disk)         │
│ • Static alerts                             │
│ • Assumes you know what to look for        │
│                                              │
│ Example: "CPU > 80% → Alert"                │
└──────────────────────────────────────────────┘

Works well for:
✓ Stable, well-understood systems
✓ Known failure modes
✓ Infrastructure metrics

Fails for:
✗ Novel failures
✗ Complex distributed systems
✗ Debugging unknown issues
```

### 现代可观测性

```
Observability:
┌──────────────────────────────────────────────┐
│ "Unknown Unknowns"                           │
│                                              │
│ • Ask arbitrary questions                   │
│ • Slice data any way you need              │
│ • Understand system behavior               │
│ • Debug issues you've never seen           │
│                                              │
│ Example: "Why did this specific user        │
│          request fail 5 minutes ago?"       │
└──────────────────────────────────────────────┘

Enables:
✓ Root cause analysis
✓ Debugging complex issues
✓ Understanding system behavior
✓ Proactive problem detection
```

### 关键区别

| 方面 | 监控 | 可观测性 |
|---|---|---|
| **关注点** | 已知指标 | 系统内部状态 |
| **问题** | 预先定义 | 临时提出、灵活探索 |
| **范围** | 「系统正常吗？」 | 「为什么失败？」 |
| **数据** | 聚合指标 | 高基数事件 |
| **时间** | 实时状态 | 历史分析 |
| **方法** | 从外向内 | 从内向外 |

## 可观测性的三大支柱

### 1. 指标（Metrics）

**随时间聚合的数值测量**

```python
# Examples of metrics
request_count = 1523           # Counter
response_time_ms = 45.3        # Gauge
error_rate_percent = 0.1       # Derived metric
cpu_utilization = 67.5         # Gauge

# Metrics are cheap to collect and store
# But lose individual event details
```

**使用场景：**
- 系统健康监控（CPU、内存、磁盘）。
- 应用性能（延迟、吞吐量）。
- 业务指标（每秒请求数、收入）。
- 告警与 SLO。

**特点：**
- 优点：存储成本较低。
- 优点：查询速度快。
- 优点：适合趋势分析与告警。
- 缺点：丢失单个事件的上下文。
- 缺点：维度数量（基数）受到限制。

---

### 2. 日志（Logs）

**带有上下文的离散事件**

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Failed to process payment",
  "user_id": "user_12345",
  "transaction_id": "txn_abc123",
  "amount": 99.99,
  "error_code": "INSUFFICIENT_FUNDS",
  "trace_id": "trace_xyz789"
}
```

**使用场景：**
- 调试特定故障。
- 审计追踪与合规。
- 理解事件顺序。
- 详细错误分析。

**特点：**
- 优点：每个事件具有丰富上下文。
- 优点：能够保留完整细节。
- 优点：可搜索。
- 缺点：长期存储成本较高。
- 缺点：大规模查询可能较慢。
- 缺点：缺乏适当过滤时容易产生噪声。

---

### 3. 链路追踪（Traces）

**请求在分布式系统中的流转路径**

```
Trace: User Login Request
┌─────────────────────────────────────────────────┐
│ Frontend Service          [50ms]                │
│   ↓                                             │
│ API Gateway               [10ms]                │
│   ↓                                             │
│ Auth Service              [200ms]               │
│   ├─ DB Query            [180ms] ← Slow!       │
│   └─ Cache Check         [5ms]                 │
│   ↓                                             │
│ User Service              [30ms]                │
│                                                 │
│ Total: 290ms                                    │
└─────────────────────────────────────────────────┘

The slow DB query is the bottleneck!
```

**使用场景：**
- 查找分布式系统瓶颈。
- 理解服务依赖关系。
- 性能优化。
- 请求级调试。

**特点：**
- 优点：展示请求流转过程。
- 优点：识别瓶颈。
- 优点：映射服务依赖关系。
- 缺点：采集成本较高（需要采样）。
- 缺点：实现较复杂。
- 缺点：数据基数较高。

## 结合三大支柱

实际调试示例：

```
1. METRICS alert: API latency > 500ms (anomaly detected)
   └─> "Something is slow, but what?"

2. TRACES show: Auth service taking 200ms (vs usual 50ms)
   └─> "Auth service is slow, but why?"

3. LOGS reveal: Database connection pool exhausted
   └─> "Root cause: connection pool too small"

Solution: Increase connection pool size
Verification: Metrics show latency back to normal
```

## OpenTelemetry

OpenTelemetry 是业界广泛采用的可观测性标准与工具体系：

```
┌──────────────────────────────────────────┐
│          OpenTelemetry                   │
│                                          │
│  ┌────────────┐  ┌────────────┐         │
│  │   API      │  │    SDK     │         │
│  │ (Standard) │  │ (Impl)     │         │
│  └────────────┘  └────────────┘         │
│         ↓              ↓                 │
│  ┌─────────────────────────────┐        │
│  │   Auto-instrumentation      │        │
│  │   (No code changes)         │        │
│  └─────────────────────────────┘        │
│         ↓                                │
│  ┌─────────────────────────────┐        │
│  │   Exporters                 │        │
│  │   (Send to backends)        │        │
│  └─────────────────────────────┘        │
└──────────────────────────────────────────┘

Backends: Prometheus, Jaeger, Datadog, etc.
```

### OpenTelemetry 组件

```python
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider

# 1. Traces
tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("process_request"):
    # Your code here
    result = process_data()

# 2. Metrics
meter = metrics.get_meter(__name__)
request_counter = meter.create_counter(
    "requests_total",
    description="Total requests"
)
request_counter.add(1, {"endpoint": "/api/predict"})

# 3. Context Propagation (automatic)
# Trace context is automatically propagated across services
```

## 设计具有可观测性的系统

### 可观测性原则

**1. 高基数（High Cardinality）**
```python
# BAD: Low cardinality (limited debugging)
log("Request failed")

# GOOD: High cardinality (rich context)
log({
    "event": "request_failed",
    "user_id": user_id,
    "endpoint": endpoint,
    "status_code": 500,
    "latency_ms": 245,
    "error": str(e),
    "trace_id": trace_id
})
```

**2. 结构化数据**
```python
# BAD: Unstructured string
logger.info(f"User {user_id} made purchase of ${amount}")

# GOOD: Structured JSON
logger.info("purchase_completed", extra={
    "user_id": user_id,
    "amount": amount,
    "currency": "USD",
    "items_count": len(items)
})
```

**3. 上下文传播（Context Propagation）**
```python
# Trace ID propagates through entire request
import uuid

trace_id = str(uuid.uuid4())

# Include in all logs for this request
logger = logging.LoggerAdapter(logger, {"trace_id": trace_id})

# Forward to downstream services
headers = {"X-Trace-ID": trace_id}
response = requests.post(url, headers=headers)
```

**4. 采样策略**
```python
# Sample 100% of errors, 1% of successes
def should_trace(response):
    if response.status_code >= 500:
        return True  # Always trace errors
    elif response.status_code >= 400:
        return random.random() < 0.1  # 10% of client errors
    else:
        return random.random() < 0.01  # 1% of success

if should_trace(response):
    send_trace_to_backend(trace)
```

### 埋点策略

```python
# Automatic instrumentation (preferred)
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()

# Manual instrumentation (when needed)
@app.route('/api/predict')
def predict():
    with tracer.start_as_current_span("model_inference"):
        # Span automatically includes timing
        result = model.predict(data)
    return result
```

## 具有可观测性的 ML 系统

ML 系统具有独特的可观测性需求：

```
ML System Observability:
┌──────────────────────────────────────────────┐
│                                              │
│  Infrastructure Metrics:                    │
│  • GPU utilization, memory                  │
│  • Training throughput                      │
│  • Data pipeline latency                    │
│                                              │
│  Model Metrics:                             │
│  • Inference latency                        │
│  • Prediction confidence                    │
│  • Model accuracy (online)                  │
│  • Feature distributions                    │
│                                              │
│  Data Quality:                              │
│  • Missing features                         │
│  • Out-of-range values                      │
│  • Data drift                               │
│  • Schema violations                        │
│                                              │
│  Business Metrics:                          │
│  • Predictions/second                       │
│  • Cost per prediction                      │
│  • Model version usage                      │
│  • A/B test metrics                         │
└──────────────────────────────────────────────┘
```

### 示例：ML 推理可观测性

```python
import time
from prometheus_client import Counter, Histogram, Gauge

# Metrics
predictions_total = Counter(
    'ml_predictions_total',
    'Total predictions',
    ['model_version', 'status']
)

prediction_latency = Histogram(
    'ml_prediction_latency_seconds',
    'Prediction latency',
    ['model_version']
)

prediction_confidence = Histogram(
    'ml_prediction_confidence',
    'Prediction confidence score',
    ['model_version']
)

# Instrumented prediction function
def predict(features, model_version='v1'):
    start = time.time()

    try:
        # Trace the prediction
        with tracer.start_as_current_span("model_predict"):
            result = model.predict(features)

        # Record metrics
        latency = time.time() - start
        prediction_latency.labels(model_version=model_version).observe(latency)
        prediction_confidence.labels(model_version=model_version).observe(result.confidence)
        predictions_total.labels(model_version=model_version, status='success').inc()

        # Structured logging
        logger.info("prediction_completed", extra={
            "model_version": model_version,
            "latency_ms": latency * 1000,
            "confidence": result.confidence,
            "features_count": len(features)
        })

        return result

    except Exception as e:
        predictions_total.labels(model_version=model_version, status='error').inc()

        logger.error("prediction_failed", extra={
            "model_version": model_version,
            "error": str(e),
            "features_count": len(features)
        })
        raise
```

## 工具选型指南

### 指标：何时使用哪种工具

```
Prometheus:
✓ Infrastructure metrics
✓ Application metrics
✓ Kubernetes environments
✓ On-premises deployment
✗ Long-term storage (use remote storage)
✗ High cardinality (label explosion)

InfluxDB:
✓ IoT and sensor data
✓ Time-series analytics
✓ High write throughput
✗ Complex queries
✗ Distributed setups

Cloud Providers (CloudWatch, Stackdriver):
✓ Cloud-native applications
✓ Managed services
✓ Easy integration
✗ Vendor lock-in
✗ Cost at scale
```

### 日志：何时使用哪种工具

```
ELK/EFK Stack:
✓ Full-text search
✓ Complex queries
✓ On-premises
✓ Full control
✗ Operational complexity
✗ Cost of running Elasticsearch

Loki (Grafana):
✓ Kubernetes environments
✓ Lower cost than ELK
✓ Grafana integration
✗ Limited query capabilities
✗ Newer, less mature

Cloud Providers (CloudWatch Logs):
✓ Cloud-native apps
✓ No infrastructure management
✗ Expensive at scale
✗ Limited query power
```

### 链路追踪：何时使用哪种工具

```
Jaeger:
✓ Microservices
✓ Kubernetes
✓ OpenTelemetry compatible
✓ Open source
✗ Operational complexity

Zipkin:
✓ Simple setup
✓ Mature ecosystem
✗ Less active development

Cloud Providers (X-Ray, Cloud Trace):
✓ Cloud-native apps
✓ Automatic instrumentation
✗ Vendor lock-in
✗ Cost
```

## 可观测性成熟度模型

```
Level 1: Ad-hoc
• No standardization
• Manual log checking
• Reactive debugging

Level 2: Basic Monitoring
• Infrastructure metrics
• Simple dashboards
• Basic alerting

Level 3: Structured Observability
• Metrics + Logs + Traces
• Centralized logging
• Distributed tracing

Level 4: Advanced Observability
• High cardinality data
• Automated anomaly detection
• SLO-based alerting

Level 5: Proactive Intelligence
• AI-powered insights
• Predictive alerting
• Auto-remediation
```

## 实践练习

### 练习 1：埋点规划

为以下 ML API 设计可观测性：

```python
@app.route('/api/v1/predict', methods=['POST'])
def predict():
    """
    Receives features, returns prediction

    TODO: Add observability
    - What metrics to track?
    - What to log?
    - What to trace?
    """
    data = request.json
    features = extract_features(data)
    prediction = model.predict(features)
    return jsonify({"prediction": prediction})
```

**你的任务：**
1. 列出需要采集的全部指标。
2. 设计结构化日志格式。
3. 确定用于链路追踪的 Span。
4. 规划采样策略。

---

### 练习 2：可观测性与监控

判断以下情况属于监控还是可观测性：

1. 展示 API 平均延迟的仪表盘。
2. 搜索 user_123 的全部请求日志。
3. 磁盘使用率超过 90% 时告警。
4. 通过 Trace 确定某个具体请求中哪个服务较慢。
5. 展示过去 24 小时 CPU 使用率的图表。
6. 根据五分钟前添加的自定义属性过滤日志。

<details>
<summary>答案</summary>

1. 监控（预定义指标）。
2. 可观测性（灵活查询）。
3. 监控（已知阈值）。
4. 可观测性（请求级调试）。
5. 监控（标准指标）。
6. 可观测性（临时查询维度）。
</details>

---

### 练习 3：高基数设计

改进以下低基数日志：

```python
# BAD: Low cardinality
if error:
    logger.error("Request failed")
```

将其改写为具有高基数属性的日志。

## 总结

本课学习了：

1. **监控与可观测性：** 监控追踪已知问题，可观测性帮助调试未知问题。
2. **三大支柱：** 指标（趋势）、日志（事件）、链路追踪（请求流转）。
3. **OpenTelemetry：** 可观测性埋点的行业标准。
4. **可观测性设计：** 高基数、结构化数据、上下文传播。
5. **ML 特有需求：** 模型性能、数据质量与业务指标。
6. **工具选型：** 根据使用场景、规模及环境进行选择。

## 核心要点

- **可观测性旨在理解系统行为**，而不仅仅是监控健康状况。
- **三大支柱协同工作**——指标发出告警，链路追踪缩小排查范围，日志解释具体原因。
- 高基数属性有助于调试复杂问题。
- 结构化数据支持灵活的查询与分析。
- ML 系统需要超越传统基础设施监控的专门可观测性能力。
- **从简单方案开始，逐步演进**，不要试图一次实现所有能力。

## 延伸阅读

- [《Observability Engineering》](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)
- [OpenTelemetry 文档](https://opentelemetry.io/docs/)
- [Charity Majors 关于可观测性的文章](https://charity.wtf/tag/observability/)
- [Google SRE 手册——监控分布式系统](https://sre.google/sre-book/monitoring-distributed-systems/)

## 下一步

下一课 **Prometheus 指标采集** 将深入介绍如何使用 Prometheus 实现指标采集，包括指标类型、Exporter 与 PromQL 查询。

---

**接下来开始采集指标，构建具有可观测性的系统！**

> 译注：监控与可观测性并非互斥，表格为原文教学性比较。高基数属性适合日志、Trace 等事件分析场景，并不意味着应将请求 ID 或用户 ID 直接作为 Prometheus 指标标签。应结合成本预算、采样、隐私保护与访问权限设计遥测系统。OpenTelemetry 负责遥测数据生成、采集与导出，通常还需要后端进行存储和查询。原始代码块、图示及其中的英文注释保持不变。
