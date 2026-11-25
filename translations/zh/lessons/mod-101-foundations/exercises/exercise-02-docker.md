# 练习 02：面向 ML 的 Docker 基础

**时长：** 2–3 小时
**难度：** 中级
**前置条件：** 第 07 课（Docker 基础）

## 学习目标

完成本练习后，你将能够：
- 为 ML 应用构建 Docker 镜像。
- 优化 Dockerfile，减少镜像体积并加快构建。
- 有效使用多阶段构建。
- 管理 Docker 数据卷与网络。
- 理解镜像层缓存。
- 在容器中部署简单的 ML 模型。

---

## 第一部分：构建第一个 ML 容器（30 分钟）

### 任务 1.1：创建简单的 ML 应用

创建目录结构：
```bash
mkdir ml-docker-exercise && cd ml-docker-exercise
mkdir src
```

创建 `src/app.py`：
```python
# Simple ML inference app
from fastapi import FastAPI
import torch
import torchvision.models as models

app = FastAPI()

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = models.resnet18(pretrained=True)
    model.eval()
    print("Model loaded successfully!")

@app.get("/")
def root():
    return {"message": "ML Model API", "model": "ResNet-18"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "torch_version": torch.__version__
    }

@app.get("/info")
def info():
    if model is None:
        return {"error": "Model not loaded"}

    # Count parameters
    params = sum(p.numel() for p in model.parameters())

    return {
        "model": "ResNet-18",
        "parameters": params,
        "device": "cpu"
    }
```

创建 `requirements.txt`：
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
torchvision==0.16.0
```

**检查点：** 本地测试。
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.app:app --reload
# Visit http://localhost:8000/docs
```

---

### 任务 1.2：创建基础 Dockerfile

创建 `Dockerfile`：
```dockerfile
# TODO: Complete this Dockerfile
FROM python:3.11-slim

WORKDIR /app

# TODO: Copy requirements and install dependencies

# TODO: Copy application code

# TODO: Expose port 8000

# TODO: Set command to run the application
# Use: uvicorn src.app:app --host 0.0.0.0 --port 8000
```

**你的任务：**
1. 完成 Dockerfile。
2. 构建镜像：`docker build -t ml-app:v1 .`。
3. 运行容器：`docker run -p 8000:8000 ml-app:v1`。
4. 测试：`curl http://localhost:8000/health`。

**预期结果：**
- 镜像构建成功。
- 容器运行无错误。
- 健康检查端点返回 200。

**需要回答的问题：**
1. Docker 镜像体积是多少？（`docker images ml-app:v1`）
2. 构建花了多长时间？
3. 修改 `app.py` 后重新构建，会发生什么？

---

## 第二部分：使用多阶段构建进行优化（45 分钟）

### 任务 2.1：实现多阶段构建

基础 Dockerfile 创建的镜像较大（约 2GB）。接下来进行优化！

创建 `Dockerfile.optimized`：
```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --user -r requirements.txt

# ============================================
# Stage 2: Runtime
# ============================================
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Update PATH
ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

# Copy application code
COPY --chown=appuser:appuser src/ ./src/

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

EXPOSE 8000

CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**你的任务：**
1. 构建优化镜像：`docker build -f Dockerfile.optimized -t ml-app:v2 .`。
2. 比较镜像体积：
```bash
docker images | grep ml-app
```
3. 运行并测试：`docker run -p 8000:8000 ml-app:v2`。

**预期结果（原文示例）：**
- v2 镜像比 v1 小 30–50%。
- 两个版本功能一致。
- 首次构建可能稍慢，但重新构建更快。

**问题：**
1. 为什么多阶段构建的镜像更小？
2. `--no-cache-dir` 有什么作用？
3. 为什么在第二阶段复制 Python 包，而不是重新安装？

---

### 任务 2.2：优化镜像层缓存

修改 Dockerfile，优化镜像层缓存：

```dockerfile
# ❌ Bad: Copies everything first
COPY . .
RUN pip install -r requirements.txt

# ✅ Good: Copies requirements first
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

**你的任务：**
1. 修改 `src/app.py`（更改一条消息）。
2. 重新构建镜像。
3. 记录哪些步骤使用缓存（查找 CACHED）。
4. 修改 `requirements.txt`（添加一条注释）。
5. 重新构建并观察差异。

**预期行为：**
- 修改应用代码只使后续相关层的缓存失效。
- 修改依赖文件使依赖安装层及其后续相关层缓存失效。

---

## 第三部分：使用 Docker Compose 配置多容器环境（45 分钟）

### 任务 3.1：添加 Prometheus 监控

创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  # ML API
  ml-api:
    build: .
    image: ml-app:v2
    container_name: ml-api
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ml-network
    restart: unless-stopped

  # Prometheus monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - ml-network
    restart: unless-stopped

  # Grafana visualization
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - ml-network
    depends_on:
      - prometheus
    restart: unless-stopped

networks:
  ml-network:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

创建 `prometheus.yml`：
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ml-api'
    static_configs:
      - targets: ['ml-api:8000']
```

**你的任务：**
1. 启动所有服务：`docker-compose up -d`。
2. 查看日志：`docker-compose logs -f ml-api`。
3. 访问服务：
   - ML API：http://localhost:8000/docs
   - Prometheus：http://localhost:9090
   - Grafana：http://localhost:3000（admin/admin）
4. 停止服务：`docker-compose down`。

**预期结果：**
- 三个容器均成功启动。
- ML API 可访问且健康。
- Prometheus 显示 ml-api 为抓取目标。
- Grafana 可以连接至 Prometheus。

---

### 任务 3.2：向 ML API 添加 Prometheus 指标

修改 `src/app.py`，添加指标：

```python
from prometheus_client import Counter, Histogram, make_asgi_app
import time

# Add metrics
request_count = Counter(
    'ml_api_requests_total',
    'Total API requests',
    ['endpoint', 'status']
)

request_duration = Histogram(
    'ml_api_request_duration_seconds',
    'Request duration in seconds',
    ['endpoint']
)

# Add metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Update endpoints to record metrics
@app.get("/info")
def info():
    start_time = time.time()

    try:
        # ... existing code ...

        request_count.labels(endpoint='info', status='success').inc()
        return result
    except Exception as e:
        request_count.labels(endpoint='info', status='error').inc()
        raise
    finally:
        duration = time.time() - start_time
        request_duration.labels(endpoint='info').observe(duration)
```

**你的任务：**
1. 将 `prometheus-client` 添加至 requirements.txt。
2. 重新构建：`docker-compose build ml-api`。
3. 重启：`docker-compose up -d`。
4. 请求 `/info` 端点。
5. 查看指标：http://localhost:8000/metrics
6. 在 Prometheus 中查看：http://localhost:9090/graph
   - 查询：`ml_api_requests_total`
   - 查询：`rate(ml_api_requests_total[1m])`

---

## 第四部分：Docker 数据卷与持久化（30 分钟）

### 任务 4.1：挂载模型目录

模型可能很大。与其将模型打包进镜像，不如从宿主机挂载。

修改 `docker-compose.yml`：
```yaml
services:
  ml-api:
    # ... existing config ...
    volumes:
      - ./models:/app/models:ro  # Read-only mount
    environment:
      - MODEL_PATH=/app/models/resnet18.pth
```

修改 `src/app.py`：
```python
import os

@app.on_event("startup")
async def load_model():
    global model

    model_path = os.getenv("MODEL_PATH")

    if model_path and os.path.exists(model_path):
        # Load from file
        model = torch.load(model_path)
        print(f"Model loaded from {model_path}")
    else:
        # Load pretrained
        model = models.resnet18(pretrained=True)
        print("Model loaded (pretrained)")

    model.eval()
```

**你的任务：**
1. 创建 `models/` 目录。
2. 保存模型：
```python
import torch
import torchvision.models as models

model = models.resnet18(pretrained=True)
torch.save(model, 'models/resnet18.pth')
```
3. 重启服务，验证模型从文件加载。

---

### 任务 4.2：持久化日志

为日志创建数据卷：

```yaml
services:
  ml-api:
    volumes:
      - ./models:/app/models:ro
      - ./logs:/app/logs  # Log directory
```

向 `src/app.py` 添加日志：
```python
import logging
from datetime import datetime

# Setup file logging
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'{log_dir}/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@app.get("/info")
def info():
    logger.info("Info endpoint called")
    # ... rest of code ...
```

**你的任务：**
1. 重启服务。
2. 请求 `/info`。
3. 在宿主机检查 `logs/app.log`。
4. 验证容器重启后日志仍然存在。

---

## 第五部分：Docker 网络与通信（30 分钟）

### 任务 5.1：多服务通信

添加 Redis 缓存服务：

```yaml
services:
  # ... existing services ...

  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    networks:
      - ml-network
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  # ... existing volumes ...
  redis-data:
```

修改 `src/app.py`，使用 Redis：
```python
import redis
import json

# Connect to Redis
redis_client = redis.Redis(
    host='redis',  # Service name from docker-compose
    port=6379,
    decode_responses=True
)

@app.get("/info")
def info():
    # Check cache
    cache_key = "model_info"
    cached = redis_client.get(cache_key)

    if cached:
        logger.info("Returning cached response")
        return json.loads(cached)

    # Generate response
    if model is None:
        return {"error": "Model not loaded"}

    params = sum(p.numel() for p in model.parameters())

    response = {
        "model": "ResNet-18",
        "parameters": params,
        "device": "cpu",
        "cached": False
    }

    # Cache for 60 seconds
    redis_client.setex(cache_key, 60, json.dumps(response))

    logger.info("Generated and cached response")
    return response
```

**你的任务：**
1. 将 `redis` 添加至 requirements.txt。
2. 重新构建并重启：`docker-compose up -d --build`。
3. 测试缓存：
```bash
# First request (slow)
time curl http://localhost:8000/info

# Second request (fast, from cache)
time curl http://localhost:8000/info
```
4. 验证网络连接：
```bash
docker-compose exec ml-api ping redis
```

---

## 第六部分：挑战任务（可选，1–2 小时）

### 挑战 1：GPU 支持

修改 Dockerfile，使其支持 CPU 与 GPU：

```dockerfile
# Use a build arg to choose base image
ARG BASE_IMAGE=python:3.11-slim
FROM ${BASE_IMAGE}

# For GPU: docker build --build-arg BASE_IMAGE=nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04 -t ml-app:gpu .
```

### 挑战 2：模型热加载

实现文件监听，在文件变化时重新加载模型：

```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ModelReloader(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith('.pth'):
            logger.info(f"Model file changed: {event.src_path}")
            load_model()
```

### 挑战 3：包含依赖检查的健康检查

改进健康检查，验证所有依赖：

```python
@app.get("/health")
def health():
    checks = {
        "model": model is not None,
        "redis": False,
        "disk_space": False
    }

    # Check Redis
    try:
        redis_client.ping()
        checks["redis"] = True
    except:
        pass

    # Check disk space
    import shutil
    disk = shutil.disk_usage("/")
    checks["disk_space"] = (disk.free / disk.total) > 0.1  # >10% free

    healthy = all(checks.values())

    return {
        "status": "healthy" if healthy else "unhealthy",
        "checks": checks
    }
```

---

## 验证检查清单

完成练习后，你应能够：

- [ ] 为 ML 应用构建 Docker 镜像。
- [ ] 使用多阶段构建减少镜像体积。
- [ ] 优化 Dockerfile 的镜像层缓存。
- [ ] 为多容器应用创建 docker-compose.yml。
- [ ] 使用 Docker 数据卷持久化数据。
- [ ] 配置 Docker 网络，实现服务间通信。
- [ ] 为容器添加健康检查。
- [ ] 集成 Prometheus 指标。
- [ ] 出于安全考虑，以非 root 用户运行容器。
- [ ] 使用日志调试容器问题。

---

## 提交（如果作为课程作业）

创建包含以下内容的 ZIP 文件：
1. 所有 Dockerfile（基础版及优化版）。
2. docker-compose.yml。
3. 源代码（src/app.py）。
4. Requirements.txt。
5. 服务运行截图。
6. Prometheus 指标截图。
7. 练习中所有问题的答案。

---

## 补充资源

- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [多阶段构建指南](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Prometheus Python 客户端](https://github.com/prometheus/client_python)

---

**下一练习：** [练习 03：Kubernetes 部署](./exercise-03-kubernetes.md)

> 译注：现代 Compose V2 通常使用 docker compose。性能及体积收益需实测。默认 Grafana 凭据仅用于隔离本地环境，模型文件应来自可信来源。原始代码块及 TODO 保留，未实际运行。
