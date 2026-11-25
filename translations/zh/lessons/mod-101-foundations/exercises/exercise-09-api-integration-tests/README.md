# 练习 09：API 集成测试与契约测试

**时长：** 3 小时
**难度：** 入门进阶
**前置条件：** 已完成练习 06、08

## 目标

为练习 08 的 model-serve API 构建分层测试套件：单元测试（纯函数）、契约测试（进程内 FastAPI 客户端）、集成测试（容器化服务）以及消费者驱动的契约测试（模拟客户端 → 真实服务端契约验证）。完成后，你将理解不同测试类型能够发现哪些 Bug，并拥有执行全部四类测试的 CI 工作流。

## 为什么重要

模型服务至少具有四类接口：输入 Schema、输出 Schema、可观测性格式（指标与日志）和运维端点（health/ready/admin）。每种接口都需要不同的测试策略。混淆这些策略或只编写容易的测试，是生产回归的常见来源。

## 要求

### 1. 单元测试
针对不需要 HTTP 服务器的全部纯函数编写测试：特征验证、Schema 序列化、批次拆分、预测后处理。

### 2. 契约测试（进程内）
使用 FastAPI 的 TestClient 测试 app 实例。应全面覆盖每种请求与响应格式，但不接触真实模型文件——使用小型 MagicMock 或在测试中训练的 scikit-learn 模型。

### 3. 集成测试（真实容器）
通过 testcontainers 或 docker compose 启动实际 Docker 镜像，发送真实 HTTP 流量，并进行端到端验证，包括指标抓取。虽然更慢，但能够发现 Dockerfile、网络及信号处理相关 Bug。

### 4. 消费者驱动的契约测试
使用 **Pact**（或自行实现等效工具）：模拟客户端发布契约（预期请求与响应格式），服务端 CI 验证能够满足契约。防止服务端改变 API 造成下游消费者不兼容。

## 分步操作

### 步骤 1——配置测试基础设施（20 分钟）
```toml
# pyproject.toml
[tool.pytest.ini_options]
addopts = "-ra -q --strict-markers"
markers = [
    "unit: fast, no IO",
    "contract: in-process HTTP",
    "integration: containerized",
    "consumer_contract: pact-style",
]
testpaths = ["tests"]
```

通过 pytest -m unit 等命令运行指定标记的测试子集。

### 步骤 2——单元测试（30 分钟）
```python
# tests/unit/test_schemas.py
import pytest
from model_serve.ml.schemas import PredictRequest

def test_rejects_wrong_feature_count():
    with pytest.raises(ValueError):
        PredictRequest(features=[1.0, 2.0])    # only 2, expected 4

def test_normalize_idempotent():
    raw = PredictRequest(features=[1.0]*4)
    assert raw == PredictRequest.parse_obj(raw.model_dump())
```

目标：至少 30 个单元测试，覆盖 Schema、验证、归一化器和错误格式化。

### 步骤 3——契约测试（60 分钟）
```python
# tests/contract/conftest.py
import pytest
from fastapi.testclient import TestClient
from model_serve.app import create_app

@pytest.fixture
def client(tmp_path, monkeypatch):
    # train a tiny in-test model, save to tmp_path
    monkeypatch.setenv("MODEL_PATH", str(tmp_path / "m.joblib"))
    monkeypatch.setenv("RATE_LIMIT_PER_MIN", "10000")    # disable for tests
    return TestClient(create_app())

# tests/contract/test_predict.py
def test_predict_returns_expected_shape(client):
    r = client.post("/v1/predict", json={"features":[1.0]*4})
    assert r.status_code == 200
    body = r.json()
    assert set(body.keys()) == {"prediction", "latency_ms", "model_version"}
```

覆盖 OPERATIONS.md 中记录的全部响应。

### 步骤 4——集成测试（60 分钟）
```python
# tests/integration/conftest.py
import pytest
from testcontainers.compose import DockerCompose

@pytest.fixture(scope="session")
def stack():
    with DockerCompose("./", compose_file_name="docker-compose.yml") as c:
        c.wait_for("http://localhost:8000/health")
        yield c

# tests/integration/test_observability.py
import requests
def test_metrics_exposed(stack):
    r = requests.get("http://localhost:8000/metrics")
    assert r.status_code == 200
    for metric in ("predictions_total", "predict_latency_seconds", "model_info"):
        assert metric in r.text
```

### 步骤 5——使用 Pact 实现消费者驱动的契约（40 分钟）
```python
# tests/consumer_contract/test_consumer.py
from pact import Consumer, Provider

pact = Consumer("dashboard").has_pact_with(Provider("model-serve"))

def test_predict_contract():
    expected = {"prediction": float, "latency_ms": float, "model_version": str}
    (pact
        .given("model is loaded")
        .upon_receiving("a valid predict request")
        .with_request("POST", "/v1/predict", body={"features":[1.0]*4})
        .will_respond_with(200, body=expected))
    with pact:
        # consumer code calls pact.uri
        ...
```

服务端在 CI 中通过 pact-verifier 验证契约。

### 步骤 6——接入 CI（20 分钟）
```yaml
# .github/workflows/test.yml
jobs:
  unit:        runs-on: ubuntu-latest    # pytest -m unit
  contract:    runs-on: ubuntu-latest    # pytest -m contract
  integration: runs-on: ubuntu-latest    # needs Docker; pytest -m integration
  pact-verify: runs-on: ubuntu-latest    # pact-verifier against contract files
```

最快的任务优先；集成测试仅在面向 main 的 PR 上运行。

## 交付物

1. 四个目录中的测试（unit/、contract/、integration/、consumer_contract/）。
2. TESTING.md，描述每层能够发现什么问题，以及何时在哪一层添加测试。
3. 覆盖率报告（pytest --cov），证明仅单元与契约测试的行覆盖率就达到至少 80%（集成测试关注端到端行为，而非覆盖率）。
4. 展示四层测试作为独立 Job 运行的 CI 工作流文件。

## 验证

- [ ] pytest -m unit 在五秒内完成。
- [ ] pytest -m contract 在 30 秒内完成。
- [ ] pytest -m integration 在五分钟内完成；需要 Docker。
- [ ] pact-verifier 针对消费者契约文件验证通过。
- [ ] CI 工作流包含四个 Job。
- [ ] 单元与契约测试覆盖率至少 80%。

## 拓展目标

- 使用 mutmut 添加**变异测试**，验证测试能否真正发现回归。
- 使用 hypothesis 对 /v1/predict 进行**模糊测试**：生成随机有效与无效载荷，断言不存在 5xx、崩溃，且响应格式可预期。
- 添加**性能回归测试**：集成 Job 对固定合成负载测量 p95 延迟，退化超过 30% 时使 CI 失败。

## 常见陷阱

- **在错误的层级模拟模型**——在 joblib.load 或 Model.predict 处 Mock，而不是在请求处理器处。测试应覆盖尽可能多的实际代码。
- **不稳定的集成测试**——始终等待健康检查端点通过，不要依赖 time.sleep(5)。
- **Pact 契约仅仅复刻 OpenAPI**——契约应表达消费者的实际预期，而非复制规范。
- **让覆盖率目标主导行为**——执行每行代码却没有有效断言的测试并无价值。测试必须断言可观察的行为。
- **测试中启用了限流中间件**——并行测试可能触发限流；通过环境变量覆盖禁用，并独立测试限流机制。

## 参考答案

engineer-solutions 仓库中的参考实现。
