# 实验 04：使用 OpenTelemetry + Jaeger 进行分布式链路追踪

**时长：** 75 分钟  **前置条件：** Docker。

## 目标

为包含两个服务的 Python 流水线（frontend → backend）添加 OpenTelemetry 埋点，将链路追踪数据导出至 Jaeger，并探索跨两个服务的单次请求。

## 步骤

### 1. 运行 Jaeger all-in-one
```bash
docker run -d --name jaeger -p 16686:16686 -p 4317:4317 -p 4318:4318 \
  jaegertracing/all-in-one:1.57
```
界面地址：http://localhost:16686 。

### 2. 安装 OTel
```bash
pip install opentelemetry-api opentelemetry-sdk \
  opentelemetry-exporter-otlp opentelemetry-instrumentation-fastapi \
  opentelemetry-instrumentation-requests fastapi uvicorn requests
```

### 3. 后端服务
```python
# backend.py
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

provider = TracerProvider(resource=Resource.create({"service.name": "backend"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")))
trace.set_tracer_provider(provider)

app = FastAPI()
FastAPIInstrumentor().instrument_app(app)
tracer = trace.get_tracer(__name__)

@app.get("/work")
def work():
    with tracer.start_as_current_span("compute") as span:
        span.set_attribute("custom.label", "demo")
        return {"result": 42}
```

### 4. 前端服务
```python
# frontend.py
import requests
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

provider = TracerProvider(resource=Resource.create({"service.name": "frontend"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")))
trace.set_tracer_provider(provider)
RequestsInstrumentor().instrument()

app = FastAPI()
FastAPIInstrumentor().instrument_app(app)

@app.get("/call")
def call():
    r = requests.get("http://localhost:8001/work")
    return {"backend": r.json()}
```

### 5. 运行两个服务
```bash
uvicorn backend:app --port 8001 &
uvicorn frontend:app --port 8000 &
```

### 6. 发送请求并观察
```bash
curl http://localhost:8000/call
```
打开 Jaeger 界面 → 选择 “frontend” 服务 → 找到 Trace → 查看它跨越两个服务，并包含 `compute` 子 Span。

## 验证

- [ ] 发出请求后约 10 秒内，Trace 出现在 Jaeger 中。
- [ ] Trace 跨越 `frontend` 和 `backend` 两个服务。
- [ ] `compute` 自定义 Span 显示 `custom.label=demo` 属性。

## 清理
```bash
pkill -f uvicorn
docker stop jaeger && docker rm jaeger
```

## 故障排查

- **Jaeger 中没有 Trace** — 验证 OTLP 端点可访问；HTTP 默认端口为 4318，gRPC 为 4317。
- **Span 出现但未关联** — Trace 上下文未传播；确认已启用 `RequestsInstrumentor`。
- **性能开销** — BatchSpanProcessor 执行批处理；生产环境可调整 `max_queue_size` 和 `schedule_delay_millis`。
