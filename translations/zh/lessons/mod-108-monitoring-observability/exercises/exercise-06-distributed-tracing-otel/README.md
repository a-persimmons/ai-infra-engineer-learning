# 练习 06：使用 OpenTelemetry 实现分布式链路追踪

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 05；Jaeger 或 Tempo 正在运行

## 目标

为三个 Python 服务组成的技术栈（frontend → backend → feature-store）添加 OpenTelemetry 埋点，将 Trace 导出至 Tempo，与日志和指标关联，并利用 Trace 诊断合成慢调用场景。

## 为什么重要

Trace 可以直接回答「这次请求的时间花在了哪里？」有了它们，就不必仅靠猜测。当团队习惯使用 Trace 后，只通过 grep 排查日志会显得低效。

## 要求

1. 为三个 Python 服务添加 OTel 埋点。
2. Trace Context 自动跨 HTTP 边界传播。
3. 为进程内工作（模型推理、特征查询）创建自定义 Span。
4. 将 Trace 导出至 **Tempo**（或 Jaeger）。
5. **日志包含 trace_id**（与练习 05 关联）。
6. **指标包含 Trace Exemplar**，从 Grafana 面板链接至 Trace。
7. 使用 Trace 诊断合成慢调用场景。

## 分步操作

### 步骤 1——安装 OTel（15 分钟）
```bash
pip install opentelemetry-api opentelemetry-sdk \
  opentelemetry-exporter-otlp \
  opentelemetry-instrumentation-fastapi \
  opentelemetry-instrumentation-requests \
  opentelemetry-instrumentation-logging
```

### 步骤 2——Tempo（30 分钟）
```yaml
# tempo.yaml
server: { http_listen_port: 3200 }
distributor:
  receivers:
    otlp:
      protocols:
        grpc: {}
        http: {}
storage:
  trace:
    backend: local
    local: { path: /tmp/tempo/blocks }
```
```bash
docker run -d -p 3200:3200 -p 4317:4317 -p 4318:4318 \
  -v $PWD/tempo.yaml:/etc/tempo.yaml grafana/tempo:2.5.0 \
  -config.file=/etc/tempo.yaml
```

### 步骤 3——通用 OTel 初始化（15 分钟）
```python
# tracing.py
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor

def init_tracing(service_name: str, otlp_endpoint: str = "http://localhost:4318/v1/traces"):
    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint)))
    trace.set_tracer_provider(provider)
    RequestsInstrumentor().instrument()
    LoggingInstrumentor().instrument(set_logging_format=True)

def instrument_app(app, service_name: str):
    FastAPIInstrumentor().instrument_app(app, tracer_provider=trace.get_tracer_provider())
```

### 步骤 4——三个服务（60 分钟）

**Frontend**（`frontend.py`）：接收客户端请求并调用 Backend。
**Backend**（`backend.py`）：负责协调，调用 Feature Store 并执行推理。
**Feature Store**（`fs.py`）：返回特征（模拟）。

每个应用：
```python
from fastapi import FastAPI
from tracing import init_tracing, instrument_app

init_tracing("backend")     # or frontend / feature-store
app = FastAPI()
instrument_app(app, "backend")

tracer = trace.get_tracer(__name__)

@app.post("/v1/predict")
async def predict(req):
    with tracer.start_as_current_span("fetch_features") as span:
        features = httpx.get("http://feature-store:8000/features/" + req.user_id).json()
        span.set_attribute("feature.count", len(features))
    with tracer.start_as_current_span("inference") as span:
        pred = model.predict(features)
        span.set_attribute("model.version", "v3")
    return {"prediction": pred}
```

运行全部三个服务，向 Frontend 发起请求。打开 Tempo / Grafana Explore → 找到 Trace → 查看三个服务及自定义 Span。

### 步骤 5——日志与 Trace 关联（15 分钟）
通过 `LoggingInstrumentor`，Python 日志在 Trace Context 中可以自动包含 Trace ID。验证日志行现在具有 trace_id。与练习 05 的派生字段配置结合，实现 Loki → Tempo 深度链接。

### 步骤 6——指标 Exemplar（30 分钟）
在 Prometheus 中启用 Exemplar 存储：
```yaml
global:
  scrape_interval: 5s
storage:
  exemplars:
    max_exemplars: 100000
```
确保指标将 `trace_id` 作为 Exemplar：
```python
from prometheus_client import Histogram
LATENCY = Histogram("http_request_duration_seconds", "...")
LATENCY.observe(latency, exemplar={"trace_id": current_trace_id()})
```
Grafana 的延迟面板现在显示彩色圆点；点击即可打开 Trace。

### 步骤 7——诊断慢调用场景（15 分钟）
在 Feature Store 中人为添加 500ms 的 sleep。在 Tempo 中观察：
- 总请求时间：约 520ms。
- 时间分解：Frontend 5ms + Backend 510ms（推理 10ms + 特征查询 500ms）。

不用读取任何日志，约十秒即可诊断出缓慢的组件。

## 交付物

1. 三个已埋点的 Python 服务。
2. 运行并存储 Trace 的 Tempo。
3. Grafana，包含 Tempo 数据源、日志关联和 Exemplar。
4. `DEBUGGING.md`，说明如何使用 Trace 诊断三种常见慢调用场景。

## 验证

- [ ] 单个客户端请求产生跨全部三个服务的 Trace。
- [ ] 自定义 Span（fetch_features、inference）具有正确属性。
- [ ] 点击 Loki 中的日志行打开对应的 Tempo Trace。
- [ ] 点击 Grafana 面板中的高延迟 Exemplar 打开对应的 Trace。
- [ ] 能够通过单条 Trace 识别缓慢组件（Feature Store）。

## 拓展目标

- 添加 **gRPC** Trace Context 传播，为 gRPC Backend 添加埋点。
- 添加**数据库 Span 埋点**（`opentelemetry-instrumentation-asyncpg`）。
- 实现 SDK 级**链路追踪采样**（健康流量采样 1%，错误采样 100%）。

## 常见陷阱

- **Span 缺少 parent_id**——传播存在问题。验证服务间正确传递 `traceparent` Header。
- **崩溃时 BatchSpanProcessor 丢失 Span**——开发环境可调整导出超时；测试时使用 `SimpleSpanProcessor`。
- **Tempo 存储填满磁盘**——Tempo 的 local 后端不适用于生产规模的持久化方案；考虑 S3/GCS。
- **OTel 开销明显**——原文估计批量导出增加约 5–10ms 尾部延迟。调优 `max_export_batch_size`。

> 译注：SDK 头部采样通常无法预知请求最终是否失败；若要保留全部错误 Trace，通常需配合 Collector 尾部采样。日志字段命名取决于 Formatter 配置，需确认映射。
