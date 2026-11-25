# 练习 08：生产级模型服务

**时长：** 4 小时
**难度：** 入门进阶
**前置条件：** 练习 06（FastAPI）、07（云环境初始化）

## 目标

将之前的简单 FastAPI 模型服务强化为面向生产的服务：优雅启动与关闭、请求验证、可观测性、批处理、异步处理、结构化错误、契约测试与 Docker 化部署。交付一个可以放心交给运维团队的服务。

## 为什么重要

从「FastAPI 能返回预测」到「运维团队能够无人值守地运行服务」之间的差距，就是这项工作的核心。本练习逐项涵盖这些能力，避免你只能通过凌晨两点的告警才发现问题。

## 要求

构建 FastAPI 服务 model-serve：

### 功能性

1. **POST /v1/predict**——单行预测。
2. **POST /v1/predict/batch**——一次最多 128 行；按输入顺序返回逐行结果。
3. **GET /v1/models**——列出当前加载的模型名称与版本。
4. **POST /v1/admin/reload**——从磁盘重新加载模型；通过 X-Admin-Token 请求头进行授权。

### 非功能性

5. /health 提供**存活检查**；/ready 提供**就绪检查**（模型加载前返回 503）。
6. /metrics 暴露 **Prometheus 指标**：请求数量、延迟直方图、正在处理的请求 Gauge、逐类别预测 Counter、模型版本信息 Gauge。
7. 将**结构化 JSON 日志**输出至 stdout，包含来自 X-Request-Id 请求头的 request_id（缺少时自动生成）。
8. **优雅关闭**：退出前最多等待 25 秒以排空正在处理的请求；收到 SIGTERM 后拒绝新请求。
9. 通过 Pydantic 进行**请求验证**；无效输入返回可预期的 422 及字段级错误。
10. **请求体大小限制**（默认 1MB），超出返回 413。
11. **限流**（每 IP 每分钟 60 次请求），超出返回 429 与 Retry-After。

### 运维

12. 容器中以**非 Root 用户**运行。
13. 容器使用**只读根文件系统**（仅写入 /tmp）。
14. Dockerfile 中设置**健康检查**，每 15 秒探测 /health。
15. 镜像大小低于 400MB。

## 建议结构

```
model-serve/
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml          # api + prometheus
├── prometheus.yml
├── src/model_serve/
│   ├── __init__.py
│   ├── app.py                  # FastAPI factory
│   ├── config.py               # Settings via pydantic-settings
│   ├── lifespan.py             # startup/shutdown
│   ├── routes/
│   │   ├── predict.py
│   │   ├── admin.py
│   │   └── health.py
│   ├── middleware/
│   │   ├── request_id.py
│   │   ├── rate_limit.py       # slowapi or hand-rolled
│   │   └── body_size.py
│   ├── instrumentation/
│   │   └── prom.py
│   └── ml/
│       ├── loader.py
│       └── schemas.py          # Pydantic in/out
└── tests/
    ├── contract/               # API contract tests
    ├── unit/
    └── conftest.py             # spins up the app on a random port
```

## 分步操作

### 步骤 1——项目骨架（15 分钟）
初始化项目。固定 fastapi、uvicorn[standard]、pydantic>=2、prometheus-fastapi-instrumentator、slowapi、python-json-logger 的版本。

### 步骤 2——通过 Lifespan 管理模型加载（30 分钟）
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    model = await asyncio.to_thread(joblib.load, settings.MODEL_PATH)
    app.state.model = model
    app.state.model_version = settings.MODEL_VERSION
    yield
    # graceful drain handled by uvicorn's shutdown signal
```

### 步骤 3——请求验证与批处理（45 分钟）
- 单行：PredictRequest 包含特征向量与验证边界。
- 批处理：BatchRequest 包含 items: list[PredictRequest]，长度不超过 128。
- 在响应中返回逐行延迟。

### 步骤 4——中间件（45 分钟）
- request_id：确保 X-Request-Id 存在；存入请求状态与日志上下文。
- body_size：载荷超过 1MB 时返回 413。
- rate_limit：使用按客户端 IP 限流的 slowapi.Limiter；支持环境变量配置。

### 步骤 5——可观测性（45 分钟）
- 自定义指标：predictions_total{class}、predict_latency_seconds、inflight_requests、model_info{version}。
- 配置 Instrumentator 暴露 /metrics 与自动采集的 FastAPI 请求直方图。
- 结构化日志：python-json-logger Formatter；每行日志包含 request_id。

### 步骤 6——优雅关闭（30 分钟）
- 为 Uvicorn 设置 --timeout-graceful-shutdown 25。
- 在 Lifespan 关闭阶段等待正在处理的请求 Gauge 降至零，并设置截止时间。

### 步骤 7——Docker 化（30 分钟）
使用多阶段构建（参照模块 103 实验 02）。非 Root 用户、只读文件系统、健康检查。

### 步骤 8——契约测试（45 分钟）
```python
@pytest.fixture
def client(tmp_path, monkeypatch):
    # spawn the model artifact, override settings, create app
    ...

def test_predict_happy_path(client): ...
def test_predict_bad_input_returns_422_with_field_errors(client): ...
def test_batch_over_128_returns_400(client): ...
def test_rate_limit_returns_429_after_60_calls(client): ...
def test_metrics_endpoint_exposes_expected_metrics(client): ...
def test_health_always_200(client): ...
def test_ready_returns_503_until_lifespan_loads_model(client): ...
```

## 交付物

1. 满足全部 15 项要求的代码。
2. 覆盖全部要求的契约测试套件。
3. Dockerfile 与 docker-compose.yml，启动服务和用于抓取其指标的 Prometheus 实例。
4. 简短的 OPERATIONS.md，描述运维工程师如何部署、扩缩容、排查故障以及轮换模型。

## 验证

- [ ] docker compose up 启动 API 与 Prometheus。
- [ ] curl localhost:8000/health → 200；/ready → 503，预热后变为 200。
- [ ] 向 /v1/predict 发送有效请求体，返回预测与延迟。
- [ ] 同一 IP 在 60 秒内发送 65 次请求，最后几次返回 429 及 Retry-After。
- [ ] 发送 130 个批处理条目返回 400 及解释性消息（原文要求）。
- [ ] 施加负载后 curl /metrics 显示全部五项自定义指标，且数值合理。
- [ ] 在一个人工延迟十秒的请求期间向容器发送 SIGTERM，退出前等待该请求完成。
- [ ] pytest tests/contract 全部通过。
- [ ] docker image inspect 显示镜像小于 400MB，用户为 1000。

## 拓展目标

- 添加**影子部署**模式：将 1% 流量复制至 v2 模型，并将影子预测与主模型预测一同记录，供离线比较。
- 通过请求头（X-Variant: v2）实现 **A/B 路由**。
- 实现 Kubernetes Deployment + HPA + ServiceMonitor 清单，并在集群上执行相同契约测试。

## 常见陷阱

- **在请求处理器中加载模型**——严重影响首次请求延迟。应在 Lifespan 中加载。
- **HTTP 中间件与异步环境的兼容性问题**——原文建议采用 BaseHTTPMiddleware；某些库可能交互不良。
- **在指标端点之前应用限流**——为 /metrics 设置合适的独立限流或例外，否则抓取器可能被阻止。
- **健康检查与就绪检查混用**——存活表示进程存活；就绪表示能够提供流量服务。混淆两者可能导致下游临时故障时反复重启。
- **JSON 日志记录器吞掉异常堆栈**——使用 exc_info=True，确保 Formatter 处理 exc_text。

## 参考答案

engineer-solutions 仓库中的参考实现。

> 译注：原文同时要求 Pydantic 验证错误返回 422、批大小超限返回 400，需显式设计错误契约。BaseHTTPMiddleware 也存在 ContextVar 传播等限制，并非通用异步安全修复；可按需使用纯 ASGI 中间件。只读根文件系统须在容器运行配置中启用，/tmp 可使用 tmpfs。管理接口应实施可靠身份认证、授权及审计。
