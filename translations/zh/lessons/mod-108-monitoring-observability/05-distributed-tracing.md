# 第 05 课：使用 Jaeger 与 Tempo 实现分布式链路追踪

## 学习目标

完成本课后，你将能够：
- 理解分布式链路追踪的概念与术语。
- 安装并配置 Jaeger，采集 Trace。
- 部署 Grafana Tempo，实现成本高效的链路追踪。
- 使用 OpenTelemetry 为 Python 应用埋点。
- 分析 Trace 以识别性能瓶颈。
- 将 Trace 与日志、指标进行关联。
- 为 ML 管道设计链路追踪策略。

## 前置条件

- 完成第 01–04 课（可观测性基础）。
- 理解微服务架构。
- 具有 Python 编程经验。
- 熟悉 HTTP 与异步操作。

## 导论

分布式链路追踪记录请求在复杂分布式系统中的流转过程。对于 AI 基础设施，链路追踪能够帮助理解：
- ML 管道的每个阶段耗时多久。
- 多服务推理中哪里存在瓶颈。
- 数据处理、模型加载与预测之间的依赖关系。
- 不同 GPU Worker 的延迟分布。

指标告诉你**什么操作较慢**，日志帮助理解**为什么失败**，链路追踪则告诉你**时间消耗在哪里**。

### 为什么 ML 系统需要分布式链路追踪？

1. **多服务推理：** 追踪请求经过预处理 → 模型服务 → 后处理的过程。
2. **管道调试：** 识别数据管道中的缓慢阶段。
3. **延迟分析：** 理解推理耗时分布。
4. **依赖映射：** 可视化服务依赖关系。
5. **性能优化：** 寻找并行化或缓存的机会。

---

## 1. 链路追踪基础

### 核心概念

**Trace（追踪链路）：** 一个请求在系统中的完整流转过程。

**Span（跨度）：** Trace 中的单个操作，例如 HTTP 请求、数据库查询、模型推理。

**Trace ID：** 整个 Trace 的唯一标识符。

**Span ID：** 特定 Span 的标识符。

**Parent Span（父 Span）：** 发起当前 Span 的上级 Span。

### Trace 结构

```
Trace ID: abc123
│
├─ Span: HTTP POST /predict (100ms)
│  ├─ Span: Load model (20ms)
│  ├─ Span: Preprocess data (15ms)
│  ├─ Span: Model inference (50ms)
│  │  ├─ Span: GPU transfer (5ms)
│  │  ├─ Span: Forward pass (40ms)
│  │  └─ Span: GPU sync (5ms)
│  └─ Span: Postprocess results (15ms)
```

### Span 属性

Span 可以包含以下元数据：
- **名称：** 操作名称，例如 model_inference。
- **开始时间：** 操作开始的时间。
- **持续时间：** 操作耗时。
- **标签：** 键值对形式的元数据（model_name、batch_size 等）。
- **日志：** Span 期间发生的事件。
- **状态：** 成功、错误或未知。

---

## 2. OpenTelemetry

OpenTelemetry（OTel）是业界广泛采用的遥测埋点标准，提供厂商中立的 API 与 SDK。

### 安装 OpenTelemetry

```bash
# Core packages
pip install opentelemetry-api==1.20.0
pip install opentelemetry-sdk==1.20.0

# Instrumentation libraries
pip install opentelemetry-instrumentation==0.41b0
pip install opentelemetry-instrumentation-fastapi==0.41b0
pip install opentelemetry-instrumentation-requests==0.41b0

# Exporters
pip install opentelemetry-exporter-jaeger==1.20.0
pip install opentelemetry-exporter-otlp==1.20.0
```

### 基础埋点

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import Resource

# Configure resource (service identification)
resource = Resource.create({
    "service.name": "ml-model-serving",
    "service.version": "1.0.0",
    "deployment.environment": "production"
})

# Setup tracer provider
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer_provider = trace.get_tracer_provider()

# Configure Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)

# Add span processor
tracer_provider.add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

# Get tracer
tracer = trace.get_tracer(__name__)

# Create spans
def process_request(data):
    with tracer.start_as_current_span("process_request") as span:
        span.set_attribute("request.size", len(data))

        # Child span
        with tracer.start_as_current_span("preprocess"):
            preprocessed = preprocess(data)

        # Another child span
        with tracer.start_as_current_span("inference"):
            result = model.predict(preprocessed)

        span.set_attribute("result.size", len(result))
        return result
```

---

## 3. Jaeger

Jaeger 是最初由 Uber 开发的分布式链路追踪平台。

### 架构

```
┌─────────────┐
│ Application │
│  (OpenTel)  │
└──────┬──────┘
       │ UDP/gRPC
       ↓
┌──────────────┐      ┌─────────────┐
│    Jaeger    │─────>│   Storage   │
│    Agent     │      │(Elasticsearch│
└──────┬───────┘      │  Cassandra) │
       │              └─────────────┘
       │                      │
       ↓                      ↓
┌──────────────┐      ┌─────────────┐
│   Jaeger     │<─────│   Jaeger    │
│  Collector   │      │    Query    │
└──────────────┘      └──────┬──────┘
                             │
                             ↓
                      ┌─────────────┐
                      │  Jaeger UI  │
                      └─────────────┘
```

### 安装 Jaeger

**一体化 Docker 部署（开发环境）：**

```yaml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:1.50
    container_name: jaeger
    environment:
      - COLLECTOR_ZIPKIN_HTTP_PORT=9411
    ports:
      - "5775:5775/udp"   # Agent (compact thrift)
      - "6831:6831/udp"   # Agent (thrift)
      - "6832:6832/udp"   # Agent (binary thrift)
      - "5778:5778"       # Agent config
      - "16686:16686"     # UI
      - "14268:14268"     # Collector HTTP
      - "14250:14250"     # Collector gRPC
      - "9411:9411"       # Zipkin compatible
    networks:
      - tracing

networks:
  tracing:
    driver: bridge
```

**生产部署（Kubernetes + Elasticsearch）：**

```yaml
# Elasticsearch backend
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: jaeger-es
  namespace: tracing
spec:
  version: 8.10.0
  nodeSets:
    - name: default
      count: 3
      config:
        node.store.allow_mmap: false
      volumeClaimTemplates:
        - metadata:
            name: elasticsearch-data
          spec:
            accessModes:
              - ReadWriteOnce
            resources:
              requests:
                storage: 100Gi

---
# Jaeger Operator
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger-production
  namespace: tracing
spec:
  strategy: production
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: https://jaeger-es-es-http:9200
        index-prefix: jaeger
    secretName: jaeger-es-secret
  collector:
    replicas: 3
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
  query:
    replicas: 2
    resources:
      limits:
        cpu: 500m
        memory: 1Gi
```

### FastAPI 埋点

```python
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Setup tracing
resource = Resource.create({
    "service.name": "ml-serving",
    "service.version": "1.0.0"
})

provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(
    OTLPSpanExporter(endpoint="jaeger:4317", insecure=True)
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Create FastAPI app
app = FastAPI()

# Automatically instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Get tracer for manual instrumentation
tracer = trace.get_tracer(__name__)

@app.post("/predict")
async def predict(data: dict):
    """Instrumented prediction endpoint"""

    # Automatic span created by FastAPIInstrumentor
    # Add custom spans for specific operations

    with tracer.start_as_current_span("load_model") as span:
        span.set_attribute("model.name", data.get("model"))
        model = load_model(data.get("model"))

    with tracer.start_as_current_span("preprocess") as span:
        span.set_attribute("input.size", len(data.get("inputs")))
        processed = preprocess(data.get("inputs"))

    with tracer.start_as_current_span("inference") as span:
        span.set_attribute("batch.size", len(processed))
        predictions = model.predict(processed)
        span.set_attribute("predictions.count", len(predictions))

    return {"predictions": predictions}
```

---

## 4. Grafana Tempo

Tempo 是旨在降低成本、简化运维的分布式链路追踪后端。

### Tempo 与 Jaeger 比较

| 特性 | Tempo | Jaeger |
|---|---|---|
| **存储** | 对象存储（S3、GCS） | Elasticsearch、Cassandra |
| **索引** | 原文描述为仅索引 Trace ID | Trace 属性索引 |
| **搜索** | 按 Trace ID 或通过指标/日志查找 | 基于标签搜索 |
| **成本** | 原文评价为很低 | 原文评价为较高 |
| **查询界面** | Grafana | Jaeger UI |
| **集成** | 原生 Grafana 集成 | 独立界面 |

### 安装 Tempo

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  tempo:
    image: grafana/tempo:2.3.0
    container_name: tempo
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo-config.yaml:/etc/tempo.yaml
      - tempo_data:/tmp/tempo
    ports:
      - "3200:3200"   # Tempo HTTP
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.1.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_FEATURE_TOGGLES_ENABLE=traceqlEditor
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-datasources.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
    networks:
      - monitoring
    depends_on:
      - tempo

volumes:
  tempo_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

**tempo-config.yaml：**

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
        grpc:
    jaeger:
      protocols:
        thrift_http:
        grpc:

ingester:
  trace_idle_period: 10s
  max_block_bytes: 1_000_000
  max_block_duration: 5m

compactor:
  compaction:
    block_retention: 168h  # 7 days

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/traces
    pool:
      max_workers: 100
      queue_depth: 10000

overrides:
  per_tenant_override_config: /etc/tempo-overrides.yaml
  metrics_generator_processors:
    - service-graphs
    - span-metrics
```

**Grafana 数据源配置：**

```yaml
# grafana-datasources.yaml
apiVersion: 1

datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    editable: false
    jsonData:
      tracesToLogs:
        datasourceUid: loki
        tags: ['job', 'instance', 'pod', 'namespace']
        mappedTags: [{ key: 'service.name', value: 'service' }]
        mapTagNamesEnabled: false
        spanStartTimeShift: '1h'
        spanEndTimeShift: '1h'
      tracesToMetrics:
        datasourceUid: prometheus
        tags: [{ key: 'service.name', value: 'service' }]
        queries:
          - name: 'Sample query'
            query: 'sum(rate(traces_spanmetrics_latency_bucket{$$__tags}[5m]))'
      serviceMap:
        datasourceUid: prometheus
      nodeGraph:
        enabled: true
```

---

## 5. 完整 ML 管道链路追踪示例

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.trace import Status, StatusCode
import time
import logging

# Configure tracing
resource = Resource.create({
    "service.name": "ml-inference-pipeline",
    "service.version": "2.0.0",
    "deployment.environment": "production",
    "service.namespace": "ml-platform"
})

provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(
    OTLPSpanExporter(
        endpoint="tempo:4317",
        insecure=True
    )
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

class MLInferencePipeline:
    """ML inference pipeline with comprehensive tracing"""

    def __init__(self, model_name: str, model_version: str):
        self.model_name = model_name
        self.model_version = model_version
        self.model = None
        self.logger = logging.getLogger(__name__)

    def process_request(self, inputs: list, request_id: str):
        """
        Process inference request with distributed tracing

        Creates a trace showing:
        - Total request time
        - Time spent in each pipeline stage
        - GPU operations
        - Any errors or warnings
        """

        # Root span for entire request
        with tracer.start_as_current_span(
            "ml_inference_request",
            attributes={
                "request.id": request_id,
                "model.name": self.model_name,
                "model.version": self.model_version,
                "input.count": len(inputs)
            }
        ) as root_span:

            try:
                # Stage 1: Model loading
                if self.model is None:
                    self._load_model()

                # Stage 2: Input validation
                validated_inputs = self._validate_inputs(inputs)

                # Stage 3: Preprocessing
                preprocessed = self._preprocess(validated_inputs)

                # Stage 4: Inference
                predictions = self._infer(preprocessed)

                # Stage 5: Postprocessing
                results = self._postprocess(predictions)

                # Record success
                root_span.set_status(Status(StatusCode.OK))
                root_span.set_attribute("predictions.count", len(results))

                return results

            except Exception as e:
                # Record error in span
                root_span.set_status(
                    Status(StatusCode.ERROR, str(e))
                )
                root_span.record_exception(e)
                self.logger.error(f"Inference failed: {e}", exc_info=True)
                raise

    def _load_model(self):
        """Load model with tracing"""
        with tracer.start_as_current_span(
            "load_model",
            attributes={
                "model.name": self.model_name,
                "model.version": self.model_version
            }
        ) as span:
            start_time = time.time()

            try:
                # Simulate model loading
                time.sleep(0.5)
                self.model = f"MockModel-{self.model_name}"

                load_time = time.time() - start_time
                span.set_attribute("model.load_time_seconds", load_time)
                span.set_attribute("model.size_mb", 512)

                # Add event
                span.add_event(
                    "model_loaded",
                    attributes={"load_time": load_time}
                )

            except Exception as e:
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.record_exception(e)
                raise

    def _validate_inputs(self, inputs: list):
        """Validate inputs with tracing"""
        with tracer.start_as_current_span(
            "validate_inputs",
            attributes={"input.count": len(inputs)}
        ) as span:

            if not inputs:
                span.set_status(Status(StatusCode.ERROR, "Empty inputs"))
                raise ValueError("Inputs cannot be empty")

            if len(inputs) > 128:
                span.add_event(
                    "large_batch_warning",
                    attributes={"batch_size": len(inputs)}
                )

            span.set_attribute("validation.passed", True)
            return inputs

    def _preprocess(self, inputs: list):
        """Preprocess with sub-operations traced"""
        with tracer.start_as_current_span(
            "preprocess",
            attributes={"input.count": len(inputs)}
        ) as span:

            # Sub-operation: Tokenization
            with tracer.start_as_current_span("tokenize") as token_span:
                time.sleep(0.02)
                token_span.set_attribute("tokens.count", len(inputs) * 512)

            # Sub-operation: Normalization
            with tracer.start_as_current_span("normalize") as norm_span:
                time.sleep(0.01)
                norm_span.set_attribute("normalization.method", "zscore")

            # Sub-operation: Batching
            with tracer.start_as_current_span("batch") as batch_span:
                batch_size = min(len(inputs), 32)
                batch_span.set_attribute("batch.size", batch_size)

            span.set_attribute("preprocessed.count", len(inputs))
            return inputs

    def _infer(self, preprocessed: list):
        """Inference with GPU operations traced"""
        with tracer.start_as_current_span(
            "inference",
            attributes={
                "batch.size": len(preprocessed),
                "model.name": self.model_name
            }
        ) as span:

            # GPU transfer
            with tracer.start_as_current_span(
                "gpu_transfer",
                attributes={"device": "cuda:0"}
            ) as gpu_span:
                time.sleep(0.005)
                gpu_span.set_attribute("transfer.direction", "host_to_device")
                gpu_span.set_attribute("data.size_mb", 10)

            # Forward pass
            with tracer.start_as_current_span(
                "forward_pass",
                attributes={"device": "cuda:0"}
            ) as forward_span:
                time.sleep(0.05)
                forward_span.set_attribute("gpu.utilization", 87.5)
                forward_span.set_attribute("gpu.memory_used_mb", 2048)

                # Add event for GPU metrics
                forward_span.add_event(
                    "gpu_stats",
                    attributes={
                        "gpu_id": 0,
                        "temperature": 72,
                        "power_watts": 180
                    }
                )

            # GPU sync
            with tracer.start_as_current_span("gpu_sync") as sync_span:
                time.sleep(0.003)
                sync_span.set_attribute("transfer.direction", "device_to_host")

            span.set_attribute("predictions.generated", len(preprocessed))
            return preprocessed  # Mock predictions

    def _postprocess(self, predictions: list):
        """Postprocess with tracing"""
        with tracer.start_as_current_span(
            "postprocess",
            attributes={"predictions.count": len(predictions)}
        ) as span:

            # Apply threshold
            with tracer.start_as_current_span("apply_threshold") as thresh_span:
                time.sleep(0.005)
                thresh_span.set_attribute("threshold", 0.5)

            # Format results
            with tracer.start_as_current_span("format_results") as format_span:
                time.sleep(0.003)
                format_span.set_attribute("format", "json")

            span.set_attribute("results.count", len(predictions))
            return predictions


# Usage example
if __name__ == "__main__":
    pipeline = MLInferencePipeline(
        model_name="bert-base",
        model_version="v1.2"
    )

    # Process request
    results = pipeline.process_request(
        inputs=["sample input 1", "sample input 2"],
        request_id="req-12345"
    )

    print(f"Results: {results}")
```

---

## 6. 关联 Trace、日志与指标

### Trace 上下文传播

```python
from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
import logging
import structlog

# Get current span context
def log_with_trace_context(message: str, **kwargs):
    """Log with trace and span IDs"""

    current_span = trace.get_current_span()
    span_context = current_span.get_span_context()

    logger = structlog.get_logger()
    logger.info(
        message,
        trace_id=format(span_context.trace_id, '032x'),
        span_id=format(span_context.span_id, '016x'),
        **kwargs
    )

# Usage
with tracer.start_as_current_span("operation") as span:
    log_with_trace_context(
        "Processing batch",
        batch_size=32,
        model="bert"
    )
```

### 在 Grafana 中关联 Trace

在 Grafana 中配置从 Trace 到日志的关联：

```yaml
# In Tempo datasource configuration
tracesToLogs:
  datasourceUid: 'loki'
  tags: ['service', 'namespace']
  mappedTags:
    - key: 'service.name'
      value: 'service'
  filterByTraceID: true
  filterBySpanID: false
```

---

## 总结

本课学习了：

- 分布式链路追踪概念（Trace、Span、上下文传播）。
- 使用 OpenTelemetry 为 Python 应用埋点。
- 搭建 Jaeger 进行 Trace 采集与分析。
- 部署 Grafana Tempo，实现成本高效的链路追踪。
- 为 ML 管道实现全面的链路追踪埋点。
- 分析 Trace 以识别性能瓶颈。
- 将 Trace 与日志、指标关联。

## 下一步

- **第 06 课：** 学习告警策略及告警管理。
- **实践：** 使用 OpenTelemetry 为自己的 ML 服务埋点。
- **练习：** 追踪完整的 ML 推理管道。

## 补充资源

- [OpenTelemetry 文档](https://opentelemetry.io/docs/)
- [Jaeger 文档](https://www.jaegertracing.io/docs/)
- [Grafana Tempo 文档](https://grafana.com/docs/tempo/latest/)
- [分布式链路追踪最佳实践](https://opentelemetry.io/docs/concepts/signals/traces/)

---

**预计时长：** 4–5 小时
**难度：** 中级至高级
**前置条件：** 第 01–04 课、Python、微服务基础。

> 译注：Tempo 与 Jaeger 的比较为原文所处版本的简化描述。现代 Tempo 支持使用 TraceQL 查询 Span 属性，并非只能按 Trace ID 搜索；实际成本取决于数据量、保留期限、采样策略及查询负载。Jaeger 部署组件及接口存在版本差异。OpenTelemetry Span 状态通常为 UNSET、OK 或 ERROR，Span Event 与独立 Log Record 应区分。上下文传播应遵循信任边界，避免将敏感数据放入 Baggage。全部原始代码块保持不变，未逐项部署验证。
