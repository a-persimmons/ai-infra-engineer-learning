# 第 08 课：生产环境最佳实践

**时长：** 4 小时
**目标：** 为机器学习工作负载构建安全、可靠、面向生产环境的 Docker 容器。

## 学习目标

完成本课后，你将能够：

1. 实施安全最佳实践（非 Root 用户、精简镜像）。
2. 配置健康检查与重启策略。
3. 为容器化 ML 服务设置合理的日志记录。
4. 应用资源限制（CPU、内存、GPU）。
5. 构建面向生产环境的 Dockerfile 模板。
6. 实现优雅关闭。
7. 使用 Secret 管理凭据。

## 安全最佳实践

### 1. 不要以 Root 用户运行

**为什么重要：**
- 如果容器被攻破，攻击者可能获得容器内的 Root 权限。
- 在存在额外漏洞或不安全配置时，可能逃逸容器并访问宿主机。
- 违反最小权限原则。

**错误做法（以 Root 运行）：**
```dockerfile
FROM python:3.11-slim
COPY app.py /app/
CMD ["python", "/app/app.py"]
```

**正确做法（以非 Root 用户运行）：**
```dockerfile
FROM python:3.11-slim

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1000 appuser

# Create app directory with correct ownership
WORKDIR /app
RUN chown -R appuser:appuser /app

# Copy files as root
COPY --chown=appuser:appuser app.py /app/

# Switch to non-root user
USER appuser

CMD ["python", "/app/app.py"]
```

**验证：**
```bash
docker run --rm my-image whoami
# Output: appuser (not root)
```

### 2. 使用精简基础镜像

**攻击面比较（原文示例）：**

| 镜像 | 大小 | 软件包数量 | CVE 数量（平均） |
|---|---|---|---|
| ubuntu:22.04 | 77MB | 约 100 | 20–30 |
| python:3.11 | 1GB | 约 500 | 50–100 |
| python:3.11-slim | 130MB | 约 80 | 10–20 |
| distroless/python3 | 50MB | 约 10 | 0–5 |

**建议：**
```dockerfile
# Production: Use slim or distroless
FROM python:3.11-slim  # Good balance

# Or for maximum security
FROM gcr.io/distroless/python3-debian11  # Minimal
```

### 3. 扫描漏洞

```bash
# Install Trivy
sudo apt-get install trivy

# Scan image
trivy image my-ml-api:v1.0

# Fail build if HIGH/CRITICAL vulnerabilities
trivy image --severity HIGH,CRITICAL --exit-code 1 my-ml-api:v1.0

# In CI/CD
docker build -t my-ml-api:v1.0 .
trivy image --severity HIGH,CRITICAL --exit-code 1 my-ml-api:v1.0 || exit 1
docker push my-ml-api:v1.0
```

### 4. 不要在镜像中包含 Secret

**绝不要这样做：**
```dockerfile
# Secrets baked into image!
ENV API_KEY=sk-abc123
COPY .env /app/
COPY credentials.json /app/
```

**较好的方法：**

**选项 1：运行时环境变量**
```bash
docker run -e API_KEY=sk-abc123 my-image
```

**选项 2：通过数据卷挂载 Secret**
```bash
docker run -v /secrets:/secrets:ro my-image
```

**选项 3：Docker Secret（Swarm）**
```yaml
services:
  api:
    secrets:
      - api_key
secrets:
  api_key:
    external: true
```

**选项 4：云端密钥管理器**
```python
# In app: fetch from AWS Secrets Manager, GCP Secret Manager, etc.
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='api-key')
```

### 5. 只读根文件系统

```dockerfile
FROM python:3.11-slim

# App doesn't write to filesystem (except /tmp)
USER appuser

# In docker run:
# docker run --read-only --tmpfs /tmp my-image
```

**docker-compose.yml：**
```yaml
services:
  api:
    image: my-api:v1
    read_only: true
    tmpfs:
      - /tmp
```

### 6. 移除不必要的 Linux Capabilities

```bash
# Drop all capabilities, add only what's needed
docker run \
    --cap-drop=ALL \
    --cap-add=NET_BIND_SERVICE \
    my-image
```

**docker-compose.yml：**
```yaml
services:
  api:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if binding to port < 1024
```

## 健康检查

### 健康检查为什么重要

**没有健康检查：**
- 容器仍在运行，但应用已崩溃 → 流量被发送给故障容器。
- 数据库连接丢失 → 容器标记为「运行中」，实际上请求失败。

**具备健康检查：**
- 编排器能够了解应用的实际健康状态。
- 配合支持相应行为的编排器，自动重启不健康的容器。
- 负载均衡器能够移除不健康的实例。

### 实现健康检查

**在 Dockerfile 中：**
```dockerfile
FROM python:3.11-slim

COPY app.py /app/
WORKDIR /app

RUN pip install fastapi uvicorn

HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=40s \
            --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0"]
```

**参数说明：**
- `--interval=30s`：每 30 秒检查一次。
- `--timeout=10s`：检查超过 10 秒则判定失败。
- `--start-period=40s`：启动宽限期为 40 秒，其间失败通常不计入重试次数。
- `--retries=3`：连续失败三次后标记为不健康。

**健康检查端点（app.py）：**
```python
from fastapi import FastAPI, HTTPException
import torch

app = FastAPI()

# Global model (loaded at startup)
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = torch.load("model.pth")

@app.get("/health")
async def health():
    """Health check endpoint"""
    checks = {
        "model_loaded": model is not None,
        "gpu_available": torch.cuda.is_available() if model else False
    }

    if not all(checks.values()):
        raise HTTPException(status_code=503, detail=checks)

    return {"status": "healthy", "checks": checks}
```

**在 Docker Compose 中：**
```yaml
services:
  api:
    image: my-ml-api:v1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**检查状态：**
```bash
# View health status
docker ps

# Detailed health info
docker inspect --format='{{.State.Health.Status}}' container-name
```

## 重启策略

**策略：**

| 策略 | 行为 | 使用场景 |
|---|---|---|
| `no` | 不自动重启 | 开发/测试 |
| `on-failure` | 以非零退出码退出时重启 | 临时故障 |
| `always` | 自动重启（手动停止后存在例外） | 关键服务 |
| `unless-stopped` | 类似 always，但尊重手动停止状态 | 生产服务 |

**Docker run：**
```bash
# Restart on failure
docker run --restart=on-failure:3 my-image  # Max 3 retries

# Always restart
docker run --restart=unless-stopped my-image
```

**Docker Compose：**
```yaml
services:
  api:
    image: my-ml-api:v1
    restart: unless-stopped  # Production recommended
```

## 优雅关闭

### 问题

**没有优雅关闭：**
```
User request → Container
      ↓
Docker stops container (SIGTERM)
      ↓
Container killed after 10s (SIGKILL)
      ↓
Request fails, data potentially corrupted
```

**具备优雅关闭：**
```
User request → Container
      ↓
Docker stops container (SIGTERM)
      ↓
App finishes processing current requests
      ↓
App closes database connections
      ↓
Container exits cleanly
```

### 实现

**app.py：**
```python
import signal
import sys
from fastapi import FastAPI
import uvicorn

app = FastAPI()

# Track active requests
active_requests = 0

@app.middleware("http")
async def count_requests(request, call_next):
    global active_requests
    active_requests += 1
    try:
        response = await call_next(request)
        return response
    finally:
        active_requests -= 1

def shutdown_handler(signum, frame):
    """Handle shutdown gracefully"""
    print(f"Received signal {signum}, shutting down gracefully...")

    # Stop accepting new requests
    print(f"Waiting for {active_requests} active requests to complete...")

    # Wait for active requests (with timeout)
    import time
    max_wait = 30
    waited = 0
    while active_requests > 0 and waited < max_wait:
        time.sleep(1)
        waited += 1

    print("Shutdown complete")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY app.py requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

USER appuser

# Important: Use exec form to receive signals
CMD ["python", "app.py"]

# NOT: CMD python app.py  # Shell form doesn't forward signals!
```

**使用宽限期停止：**
```bash
# Default 10 seconds
docker stop my-container

# Custom grace period (30 seconds)
docker stop -t 30 my-container
```

## 资源限制

### 为什么需要限制资源？

**没有限制：**
- 单个容器可能消耗全部宿主机资源。
- 内存不足时，OOM Killer 可能终止进程。
- 无法公平共享资源。
- GPU 显存可能发生竞争。

**设置限制后：**
- 性能更加可预测。
- 资源分配更加公平。
- 更便于容量规划。

### CPU 限制

```bash
# Limit to 2 CPUs
docker run --cpus=2 my-image

# CPU shares (relative weight)
docker run --cpu-shares=1024 my-image

# Specific CPUs (pinning)
docker run --cpuset-cpus=0,1 my-image
```

**Docker Compose：**
```yaml
services:
  api:
    image: my-ml-api:v1
    deploy:
      resources:
        limits:
          cpus: '2.0'
        reservations:
          cpus: '1.0'
```

### 内存限制

```bash
# Limit to 4GB
docker run --memory=4g my-image

# Memory + swap limit
docker run --memory=4g --memory-swap=6g my-image

# Memory reservation (soft limit)
docker run --memory-reservation=2g my-image
```

**Docker Compose：**
```yaml
services:
  model-server:
    image: my-model:v1
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
```

### GPU 限制

```bash
# Specific GPU
docker run --gpus '"device=0"' my-image

# GPU memory fraction (if supported)
docker run --gpus all \
    -e CUDA_VISIBLE_DEVICES=0 \
    -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:4096 \
    my-image
```

## 日志最佳实践

### 结构化日志

**app.py：**
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)

# Configure logger
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info("Model loaded successfully", extra={"model_version": "v1.0"})
```

### 日志驱动

**Docker Compose：**
```yaml
services:
  api:
    image: my-ml-api:v1
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=api,environment=production"
```

**可用驱动：**
- `json-file`：默认驱动，JSON 日志。
- `syslog`：发送至 syslog。
- `journald`：systemd journal。
- `gelf`：Graylog。
- `fluentd`：Fluentd。
- `awslogs`：CloudWatch Logs。
- `gcplogs`：Google Cloud Logging。

### 集中式日志

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  api:
    image: my-ml-api:v1
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: api

  fluentd:
    image: fluent/fluentd:latest
    ports:
      - "24224:24224"
    volumes:
      - ./fluentd/fluent.conf:/fluentd/etc/fluent.conf

  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node

  kibana:
    image: kibana:8.10.0
    ports:
      - "5601:5601"
```

## 面向生产环境的 Dockerfile 模板

**ML 服务完整模板：**

```dockerfile
# ========================================
# Build stage
# ========================================
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ========================================
# Runtime stage
# ========================================
FROM python:3.11-slim

# Metadata
LABEL maintainer="your-email@example.com"
LABEL version="1.0.0"
LABEL description="Production ML API"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1000 appuser && \
    mkdir -p /app /app/logs && \
    chown -R appuser:appuser /app

# Copy Python packages from builder
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Set PATH
ENV PATH=/home/appuser/.local/bin:$PATH

WORKDIR /app

# Copy application code
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser main.py .

# Switch to non-root user
USER appuser

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    LOG_LEVEL=info

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=40s \
            --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application (exec form for signal handling)
CMD ["python", "main.py"]
```

## CI/CD 集成

**GitHub Actions 工作流：**

**.github/workflows/docker-build.yml：**
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to registry
        uses: docker/login-action@v2
        with:
          registry: ${{ secrets.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./

      - name: Build image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: false
          tags: ml-api:test
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image for vulnerabilities
        run: |
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy:latest image \
            --severity HIGH,CRITICAL \
            --exit-code 1 \
            ml-api:test

      - name: Run tests
        run: |
          docker run --rm ml-api:test pytest tests/

      - name: Push image
        if: success()
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.REGISTRY_URL }}/ml-api:${{ github.sha }}
            ${{ secrets.REGISTRY_URL }}/ml-api:latest
```

## 总结

本课学习了：

1. **安全**——非 Root 用户、精简镜像、Secret 管理。
2. **健康检查**——应用级健康监控。
3. **重启策略**——故障后的自动恢复。
4. **优雅关闭**——正确处理 SIGTERM。
5. **资源限制**——CPU、内存与 GPU 约束。
6. **日志**——结构化日志与集中式采集。
7. **生产模板**——完整 Dockerfile 示例。

**生产环境检查清单：**
- [ ] 以非 Root 用户运行。
- [ ] 使用精简基础镜像。
- [ ] 已扫描漏洞。
- [ ] 已实现健康检查。
- [ ] 已配置重启策略。
- [ ] 已实现优雅关闭。
- [ ] 已设置资源限制。
- [ ] 使用结构化日志。
- [ ] 镜像中不包含 Secret。
- [ ] 使用多阶段构建（如适用）。

## 模块 03 已完成！

**你已经学习了：**
- 面向 ML 的 Docker 基础。
- 编写优化后的 Dockerfile。
- 使用 Compose 构建多容器应用。
- 容器镜像仓库与 CI/CD。
- GPU 加速容器。
- 生产环境最佳实践。

**后续步骤：**
- 完成模块 03 的实践考核。
- 构建面向生产环境的 ML 容器。
- 进入模块 04：Kubernetes 基础。

---

## 自我检查问题

1. 为什么容器不应以 Root 用户运行？
2. 健康检查的目的是什么？
3. 如何在 Python 中实现优雅关闭？
4. 内存限制与内存预留有什么区别？
5. 如何在 CI/CD 中扫描镜像漏洞？

## 补充资源

- [Docker 安全最佳实践](https://docs.docker.com/engine/security/)
- [面向生产环境的 Dockerfile](https://docs.docker.com/develop/dev-best-practices/)
- [容器安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

**恭喜完成模块 03！**

> 译注：Docker Engine 不会仅因为容器被标记为 unhealthy 就自动重启它；普通重启策略主要依据进程退出状态。always 策略在手动停止容器后通常要等 Docker Daemon 重启或容器被手动启动才重新生效。非 Root 用户不能单独保证容器安全，仍应限制 Capabilities、宿主机挂载及特权访问。环境变量中的密钥可能通过进程环境、诊断信息或 Docker Inspect 暴露，宜优先采用访问受限的 Secret 文件或外部密钥管理服务。GPU 设备分配并不等于显存限额。镜像大小与 CVE 数量为原文示例；原始代码块保留，未逐项执行。
