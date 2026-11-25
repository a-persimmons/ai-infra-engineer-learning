# 第 05 课：面向机器学习应用的 Docker Compose

**时长：** 5 小时
**目标：** 使用 Docker Compose 编排多容器机器学习应用。

## 学习目标

完成本课后，你将能够：

1. 为机器学习技术栈编写 docker-compose.yml 文件。
2. 定义多服务应用（API、模型、数据库、缓存）。
3. 管理环境变量与 Secret。
4. 配置服务依赖与健康检查。
5. 在开发和测试工作流中使用 Compose。
6. 使用 Docker Compose 扩缩容服务。
7. 调试 Compose 应用并排查故障。

## Docker Compose 简介

### 什么是 Docker Compose？

**Docker Compose** 是一种通过 YAML 配置文件定义并运行多容器 Docker 应用的工具。

**不使用 Compose：**
```bash
# Start each service manually
docker network create ml-network
docker run -d --name postgres --network ml-network ...
docker run -d --name redis --network ml-network ...
docker run -d --name model-server --network ml-network ...
docker run -d --name api-gateway --network ml-network -p 8000:8000 ...
```

**使用 Compose：**
```bash
# Single command starts entire stack
docker compose up
```

### 为什么在机器学习中使用 Docker Compose？

**收益：**
1. **声明式配置**——在一个文件中定义完整技术栈。
2. **可复现性**——每次使用相同的技术栈配置。
3. **开发工作流**——快速搭建本地开发环境。
4. **测试**——启动完整技术栈进行集成测试。
5. **文档**——compose.yml 记录了应用架构。
6. **易于共享**——团队成员能够快速运行技术栈。

**适合以下场景：**
- 机器学习应用的本地开发。
- 与数据库及其他服务进行集成测试。
- 演示环境。
- 小型生产部署（原文举例为 1–3 台服务器）。

**不太适合以下场景：**
- 大规模生产环境（可使用 Kubernetes）。
- 跨宿主机部署（可使用 Swarm 或 Kubernetes）。

> 译注：普通 Docker Compose 主要面向单个 Docker Engine，不会自动将服务调度到多台服务器。小型多主机部署仍需要独立管理各主机或采用集群编排工具。

## Docker Compose 基础

### 安装

```bash
# Docker Compose v2 (included with Docker Desktop)
docker compose version

# If not installed, install plugin
sudo apt-get install docker-compose-plugin

# Verify
docker compose version
# Output: Docker Compose version v2.20.0
```

### compose.yml 的基本结构

```yaml
version: '3.8'  # Optional in newer versions

services:
  # Service definitions
  service1:
    image: nginx
    ports:
      - "80:80"

  service2:
    build: ./app
    depends_on:
      - service1

volumes:
  # Named volumes

networks:
  # Custom networks
```

### 简单示例：Web 应用 + 数据库

```yaml
version: '3.8'

services:
  web:
    image: python:3.11-slim
    command: python -m http.server 8000
    ports:
      - "8000:8000"
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

**运行：**
```bash
# Start all services
docker compose up

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 使用 Docker Compose 构建机器学习应用技术栈

### 架构

```
┌─────────────────────────────────────────────┐
│           ML Application Stack               │
├─────────────────────────────────────────────┤
│                                              │
│  API Gateway (FastAPI) ──────┐             │
│       ↓                       ↓              │
│  Model Server (PyTorch)   Redis (Cache)    │
│       ↓                       ↓              │
│  PostgreSQL (Logs)    Prometheus (Metrics)  │
│                                              │
└─────────────────────────────────────────────┘
```

### 完整机器学习技术栈示例

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  # ===================================
  # API Gateway
  # ===================================
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MODEL_SERVER_URL=http://model-server:8000
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:mlpassword@postgres:5432/predictions
      - LOG_LEVEL=info
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      model-server:
        condition: service_healthy
    networks:
      - ml-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ===================================
  # Model Server (PyTorch)
  # ===================================
  model-server:
    build:
      context: ./model-server
      dockerfile: Dockerfile
    environment:
      - MODEL_PATH=/models/model.pth
      - BATCH_SIZE=32
      - GPU_ENABLED=false
    volumes:
      - model-weights:/models
    networks:
      - ml-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    # Uncomment for GPU support
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  # ===================================
  # PostgreSQL Database
  # ===================================
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=mlpassword
      - POSTGRES_DB=predictions
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ml-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===================================
  # Redis Cache
  # ===================================
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - ml-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===================================
  # Prometheus Monitoring
  # ===================================
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - ml-network
    restart: unless-stopped

  # ===================================
  # Grafana Dashboards
  # ===================================
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus
    networks:
      - ml-network
    restart: unless-stopped

# ===================================
# Volumes
# ===================================
volumes:
  model-weights:
    driver: local
  postgres-data:
    driver: local
  redis-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local

# ===================================
# Networks
# ===================================
networks:
  ml-network:
    driver: bridge
```

## 服务配置

### 构建镜像

```yaml
services:
  api:
    # Use pre-built image
    image: my-api:v1.0

    # Or build from Dockerfile
    build:
      context: ./api
      dockerfile: Dockerfile

    # Build with arguments
    build:
      context: ./api
      args:
        PYTHON_VERSION: 3.11
        BUILD_DATE: "2024-01-15"

    # Build target (multi-stage)
    build:
      context: ./api
      target: production
```

### 环境变量

**方法 1：直接在 compose.yml 中定义**
```yaml
services:
  api:
    environment:
      - DEBUG=false
      - MODEL_NAME=resnet50
      - API_KEY=secret123  # Don't do this for real secrets!
```

**方法 2：环境变量文件**

**.env：**
```bash
DEBUG=false
MODEL_NAME=resnet50
DB_PASSWORD=secret123
```

**compose.yml：**
```yaml
services:
  api:
    env_file:
      - .env
      - .env.production  # Can have multiple
```

**方法 3：变量替换**

**.env：**
```bash
POSTGRES_PASSWORD=mysecret
```

**compose.yml：**
```yaml
services:
  db:
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

### 端口与网络

```yaml
services:
  api:
    # Publish to host
    ports:
      - "8000:8000"          # host:container
      - "127.0.0.1:8001:8001"  # localhost only
      - "8002"               # random host port

    # Expose to other containers (not host)
    expose:
      - "8000"

    # Join networks
    networks:
      - frontend
      - backend

networks:
  frontend:
  backend:
```

### 数据卷与绑定挂载

```yaml
services:
  model-server:
    volumes:
      # Named volume
      - model-data:/app/models

      # Bind mount (development)
      - ./src:/app/src:ro  # read-only

      # Anonymous volume
      - /app/logs

      # tmpfs (in-memory)
    tmpfs:
      - /tmp

volumes:
  model-data:
```

### 依赖与启动顺序

```yaml
services:
  api:
    depends_on:
      # Simple dependency (starts after db)
      - db

      # With condition (waits for health check)
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### 资源限制

```yaml
services:
  model-server:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G

      # GPU support
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Docker Compose 命令

### 基本命令

```bash
# Start services
docker compose up

# Start in detached mode
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs

# Follow logs
docker compose logs -f

# Logs for specific service
docker compose logs -f api

# List running services
docker compose ps

# Execute command in service
docker compose exec api bash

# Rebuild images
docker compose build

# Rebuild and restart
docker compose up --build

# Scale services
docker compose up --scale model-server=3
```

### 高级命令

```bash
# Validate compose file
docker compose config

# View resolved config
docker compose config --resolve-image-digests

# Pull images
docker compose pull

# Push images
docker compose push

# Restart specific service
docker compose restart api

# Pause services
docker compose pause

# Unpause services
docker compose unpause

# View resource usage
docker compose top
```

## 使用 Compose 的开发工作流

### 开发时的热重载

**compose.dev.yml：**
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./api
      target: development  # Multi-stage build target
    volumes:
      - ./api/src:/app/src  # Mount source for live reload
    environment:
      - RELOAD=true
      - DEBUG=true
    command: uvicorn main:app --reload --host 0.0.0.0
    ports:
      - "8000:8000"
      - "5678:5678"  # Debugger port

  model-server:
    build:
      context: ./model-server
      target: development
    volumes:
      - ./model-server/src:/app/src
    environment:
      - DEBUG=true
```

**使用方式：**
```bash
# Development mode
docker compose -f compose.dev.yml up

# Production mode
docker compose -f compose.yml up
```

### 使用 Compose 进行测试

**compose.test.yml：**
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./api
      target: test
    environment:
      - TESTING=true
      - DATABASE_URL=postgresql://postgres:test@test-db:5432/test
    command: pytest tests/ -v
    depends_on:
      - test-db

  test-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=test
```

**运行测试：**
```bash
# Run tests
docker compose -f compose.test.yml up --abort-on-container-exit

# Clean up
docker compose -f compose.test.yml down -v
```

### 多个 Compose 文件

```bash
# Override base config with dev config
docker compose -f compose.yml -f compose.dev.yml up

# Production with monitoring
docker compose -f compose.yml -f compose.monitoring.yml up
```

## 机器学习服务的扩缩容

### 扩缩容无状态服务

```yaml
services:
  model-server:
    build: ./model-server
    deploy:
      replicas: 3  # Start 3 instances
```

**运行时扩缩容：**
```bash
# Scale up
docker compose up --scale model-server=5

# Scale down
docker compose up --scale model-server=2
```

### 负载均衡

**添加 Nginx 作为负载均衡器：**

**compose.yml：**
```yaml
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - model-server

  model-server:
    build: ./model-server
    deploy:
      replicas: 3
```

**nginx.conf：**
```nginx
upstream model_servers {
    server model-server:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://model_servers;
    }
}
```

## 动手练习：构建完整机器学习技术栈

### 目标

创建面向生产环境的机器学习应用技术栈，包括：
- 提供预测接口的 FastAPI。
- PyTorch 模型服务器。
- 用于缓存的 Redis。
- 用于日志记录的 PostgreSQL。
- 用于监控的 Prometheus + Grafana。

### 项目结构

```
ml-stack/
├── docker-compose.yml
├── .env
├── api/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── model-server/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── serve.py
├── postgres/
│   └── init.sql
└── prometheus/
    └── prometheus.yml
```

### TODO：实现技术栈

**1. 创建 docker-compose.yml**（参考上面的示例）。

**2. API 服务（api/main.py）：**
```python
from fastapi import FastAPI
import httpx
import redis
import psycopg2
import os

app = FastAPI()

# Configuration from environment
MODEL_URL = os.getenv("MODEL_SERVER_URL")
redis_client = redis.from_url(os.getenv("REDIS_URL"))

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
async def predict(data: dict):
    # TODO: Implement prediction with caching
    # 1. Check Redis cache
    # 2. If not cached, call model server
    # 3. Cache result
    # 4. Log to PostgreSQL
    # 5. Return prediction
    pass
```

**3. 模型服务器（model-server/serve.py）：**
```python
from fastapi import FastAPI
import torch

app = FastAPI()

# TODO: Load model
# model = torch.load("/models/model.pth")

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
def predict(data: dict):
    # TODO: Run inference
    pass
```

**4. 测试技术栈：**
```bash
# Start stack
docker compose up -d

# Check services
docker compose ps

# Test API
curl http://localhost:8000/health

# View logs
docker compose logs -f api

# Monitor metrics
open http://localhost:9090  # Prometheus
open http://localhost:3000  # Grafana

# Stop stack
docker compose down
```

## Docker Compose 故障排查

### 常见问题

**问题 1：服务无法启动**
```bash
# View detailed logs
docker compose logs service-name

# Check service status
docker compose ps

# Restart service
docker compose restart service-name
```

**问题 2：网络错误**
```bash
# Inspect network
docker network inspect ml-stack_default

# Test connectivity
docker compose exec api ping model-server
```

**问题 3：数据卷权限问题**
```bash
# Check volume
docker volume inspect ml-stack_model-data

# Fix permissions
docker compose exec api chown -R appuser:appuser /data
```

**问题 4：端口冲突**
```bash
# Change port in compose.yml
ports:
  - "8001:8000"  # Use different host port
```

## 生产环境考虑因素

### 安全

```yaml
services:
  api:
    # Don't run as root
    user: "1000:1000"

    # Read-only root filesystem
    read_only: true

    # No new privileges
    security_opt:
      - no-new-privileges:true

    # Limit capabilities
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### Secret 管理

**使用 Docker Secret（Swarm）或外部密钥管理器：**

```yaml
services:
  api:
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 日志

```yaml
services:
  api:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## 总结

本课学习了：

1. **Docker Compose 基础**——使用 YAML 定义多容器应用。
2. **机器学习技术栈配置**——API、模型服务器、数据库、缓存及监控。
3. **服务依赖**——健康检查及启动顺序。
4. **开发工作流**——热重载、测试及多个配置文件。
5. **扩缩容**——复制服务及负载均衡。
6. **故障排查**——调试 Compose 应用。

**核心要点：**
- Compose 简化多容器应用开发。
- 使用健康检查与 depends_on 提高可靠性。
- 为开发、测试和生产环境使用独立配置。
- 使用命名数据卷持久化数据。
- 使用环境变量文件进行配置管理。

## 下一步是什么？

下一课 **06-container-registries.md** 将学习：
- 将镜像推送至 Docker Hub、ECR、GCR、ACR。
- 镜像标签策略。
- 镜像仓库与 CI/CD 的集成。
- 企业私有镜像仓库。
- 镜像漏洞扫描。

---

## 自我检查问题

1. depends_on 与带 condition 的 depends_on 有什么区别？
2. 如何针对不同环境覆盖配置？
3. Compose 中健康检查的作用是什么？
4. 如何将服务扩展到五个副本？
5. 命名数据卷与绑定挂载有什么区别？

## 补充资源

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Compose 文件参考](https://docs.docker.com/compose/compose-file/)
- [Awesome Compose 示例](https://github.com/docker/awesome-compose)

---

**下一课：** [06-container-registries.md](./06-container-registries.md)

> 译注：depends_on 与健康检查并不替代应用自身的连接重试及故障恢复。服务扩容时需避免固定宿主机端口和固定容器名称产生冲突；资源限制的支持情况取决于 Compose 实现与运行方式。.env 文件不等同于安全的密钥存储，普通 Compose 也支持文件式 Secret，但其安全机制与 Swarm Secret 不完全相同。原文全部代码块和内部英文注释保持不变，未逐项运行验证。
