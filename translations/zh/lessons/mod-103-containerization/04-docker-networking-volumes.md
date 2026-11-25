# 第 04 课：Docker 网络与数据卷

**时长：** 5 小时
**目标：** 掌握面向 ML 应用的 Docker 网络与持久化存储。

## 学习目标

完成本课后，你将能够：

1. 理解 Docker 网络模式及其适用时机。
2. 实现容器间通信。
3. 为 ML 推理服务映射端口。
4. 使用数据卷持久化存储模型。
5. 理解绑定挂载与命名卷的区别。
6. 在容器间共享数据。
7. 使用合适的网络构建多容器 ML 应用。

## Docker 网络基础

### 网络为什么对 ML 重要

ML 应用通常需要多个服务：
- **模型服务器**提供预测服务。
- **API 网关**处理请求。
- **数据库**存储预测日志。
- **缓存（Redis）**缓存特征。
- **消息队列**用于异步处理。

这些服务需要可靠且安全地通信。

### Docker 网络驱动

Docker 提供多种网络驱动：

| 驱动 | 使用场景 | 隔离 | 性能 |
|---|---|---|---|
| **bridge** | 单宿主机、容器间通信 | 隔离网络 | 良好 |
| **host** | 容器使用宿主机网络 | 无独立网络隔离 | 原文评价最佳 |
| **none** | 无网络连接 | 网络隔离 | 不适用 |
| **overlay** | 多宿主机（Swarm 等） | 跨宿主机 | 良好 |

## Bridge 网络（默认）

### Bridge 网络如何工作

```
┌──────────────────────────────────────────────┐
│            Host Machine                       │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │     Docker Bridge Network           │    │
│  │     (172.17.0.0/16)                 │    │
│  │                                      │    │
│  │  ┌──────────┐      ┌──────────┐    │    │
│  │  │Container1│      │Container2│    │    │
│  │  │172.17.0.2│─────▶│172.17.0.3│    │    │
│  │  └──────────┘      └──────────┘    │    │
│  └─────────────────────────────────────┘    │
│             │                                 │
│             ▼                                 │
│      Host Network                            │
└──────────────────────────────────────────────┘
```

### 默认 Bridge 网络

默认 Bridge 网络上的容器可以相互通信：

```bash
# Start container 1
docker run -d --name model-server nginx

# Start container 2 (can ping container 1 by IP)
docker run --name client alpine ping 172.17.0.2
```

**限制：**
- 通常必须使用 IP 地址（默认不提供按容器名称解析的 DNS）。
- 容器共享同一网络。
- 隔离能力较弱。

### 自定义 Bridge 网络（推荐）

```bash
# Create custom network
docker network create ml-network

# Run containers on custom network
docker run -d --name model-server --network ml-network my-model:v1
docker run -d --name api-gateway --network ml-network my-api:v1

# Containers can reach each other by name!
# Inside api-gateway container:
curl http://model-server:8000/predict
```

**优点：**
- 通过容器名称进行 **DNS 解析**。
- **更好的隔离**（默认仅同网络容器直接通信）。
- **简单的服务发现**。

### 创建与管理网络

```bash
# Create network
docker network create ml-network

# List networks
docker network ls

# Inspect network
docker network inspect ml-network

# Connect running container to network
docker network connect ml-network my-container

# Disconnect from network
docker network disconnect ml-network my-container

# Remove network
docker network rm ml-network
```

## 端口映射

### 发布端口

将容器端口映射到宿主机端口：

```bash
# Format: -p HOST_PORT:CONTAINER_PORT

# Map container port 8000 to host port 8000
docker run -p 8000:8000 my-ml-api

# Map to different host port
docker run -p 8080:8000 my-ml-api

# Map to localhost only (more secure)
docker run -p 127.0.0.1:8000:8000 my-ml-api

# Map multiple ports
docker run -p 8000:8000 -p 8001:8001 my-ml-api

# Map random host port (Docker chooses)
docker run -p 8000 my-ml-api
```

### 查找已映射端口

```bash
# See port mappings
docker port my-container

# Output:
# 8000/tcp -> 0.0.0.0:8000
```

### 示例：ML 推理 API

**Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN pip install fastapi uvicorn torch

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**运行：**
```bash
# Build image
docker build -t ml-api .

# Run with port mapping
docker run -d -p 8000:8000 --name ml-api ml-api

# Test API
curl http://localhost:8000/health
```

## Host 网络模式

### 何时使用 Host 网络

Host 模式移除独立的网络隔离：

```bash
# Container uses host's network directly
docker run --network host my-ml-api
```

**使用场景：**
- 需要尽可能高的网络性能（无相应 NAT 开销）。
- 需要绑定特定的宿主机网络接口。
- 本地测试。

**缺点：**
- 无端口隔离（可能发生冲突）。
- 网络安全边界较弱。
- 可移植性较差（依赖宿主机）。

**示例：高性能推理**

```bash
# For latency-critical ML serving
docker run --network host \
    --gpus all \
    nvidia/triton-inference-server:latest
```

## 多容器通信

### 场景：ML 应用技术栈

```
┌─────────────┐
│   Client    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ API Gateway │ (port 8000)
└─────┬───────┘
      │
      ├─────────────────┐
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│Model Server │   │  Redis      │
│  (PyTorch)  │   │  (Cache)    │
└─────┬───────┘   └─────────────┘
      │
      ▼
┌─────────────┐
│ PostgreSQL  │
│   (Logs)    │
└─────────────┘
```

### 实现

**1. 创建网络：**
```bash
docker network create ml-stack
```

**2. 启动 PostgreSQL：**
```bash
docker run -d \
    --name postgres \
    --network ml-stack \
    -e POSTGRES_PASSWORD=secret \
    -e POSTGRES_DB=predictions \
    postgres:15
```

**3. 启动 Redis：**
```bash
docker run -d \
    --name redis \
    --network ml-stack \
    redis:7-alpine
```

**4. 启动模型服务器：**
```bash
docker run -d \
    --name model-server \
    --network ml-stack \
    --gpus all \
    my-model-server:v1
```

**5. 启动 API 网关：**
```bash
docker run -d \
    --name api-gateway \
    --network ml-stack \
    -p 8000:8000 \
    -e MODEL_URL=http://model-server:8000 \
    -e REDIS_URL=redis://redis:6379 \
    -e DB_URL=postgresql://postgres:secret@postgres:5432/predictions \
    my-api-gateway:v1
```

**API 网关代码（Python）：**
```python
import os
import httpx
import redis
from fastapi import FastAPI

app = FastAPI()

# Service discovery via environment variables
MODEL_URL = os.getenv("MODEL_URL")
redis_client = redis.from_url(os.getenv("REDIS_URL"))

@app.post("/predict")
async def predict(data: dict):
    # Check cache
    cache_key = f"prediction:{hash(str(data))}"
    cached = redis_client.get(cache_key)
    if cached:
        return {"prediction": cached, "cached": True}

    # Call model server
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MODEL_URL}/predict", json=data)
        result = response.json()

    # Cache result
    redis_client.setex(cache_key, 3600, result["prediction"])

    return {"prediction": result["prediction"], "cached": False}
```

## Docker 数据卷

### 为什么需要数据卷？

容器自身的可写文件系统是**临时性的**：
- 删除容器时数据丢失。
- 无法通过独立可写层直接共享数据。
- 不适合持久化存储模型、数据集与日志。

**数据卷解决这些问题：**
- 持久化存储（删除容器后仍可保留）。
- 容器间可共享。
- 原文认为性能优于绑定挂载。
- 由 Docker 管理。

### 数据卷类型

```
┌──────────────────────────────────────────────────────┐
│                    Volume Types                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Named Volumes (Managed by Docker)                │
│     docker volume create my-volume                   │
│     Location: /var/lib/docker/volumes/               │
│                                                       │
│  2. Anonymous Volumes                                │
│     Automatically created, cleaned up                │
│                                                       │
│  3. Bind Mounts (Host directory)                     │
│     -v /host/path:/container/path                    │
│     Full control, host-dependent                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 命名卷（Named Volume）

**创建与使用：**

```bash
# Create volume
docker volume create model-weights

# List volumes
docker volume ls

# Inspect volume
docker volume inspect model-weights

# Use volume
docker run -v model-weights:/app/models my-ml-app

# Remove volume
docker volume rm model-weights
```

**示例：持久化模型存储**

```bash
# Create volume for models
docker volume create ml-models

# Download model into volume
docker run --rm \
    -v ml-models:/models \
    alpine sh -c "wget https://example.com/model.pth -O /models/model.pth"

# Use model in inference container
docker run -d \
    -v ml-models:/app/models \
    -p 8000:8000 \
    my-inference-server

# Model persists even if container is deleted!
```

### 绑定挂载（Bind Mount）

将宿主机目录映射至容器：

```bash
# Format: -v /absolute/host/path:/container/path

# Mount current directory
docker run -v $(pwd):/app my-image

# Mount specific directory
docker run -v /data/models:/app/models my-image

# Read-only mount
docker run -v /data/models:/app/models:ro my-image
```

**何时使用绑定挂载：**
- 开发（实时代码重新加载）。
- 访问特定宿主机目录。
- 配置文件。
- 宿主机上的数据集。

**示例：开发工作流**

```bash
# Mount code for live reloading
docker run -it --rm \
    -v $(pwd)/src:/app/src \
    -v $(pwd)/models:/app/models \
    -p 8000:8000 \
    -e RELOAD=true \
    my-ml-api
```

### tmpfs 挂载（临时存储）

将数据存储在宿主机内存中（不进行持久化）：

```bash
# Mount tmpfs for temporary data
docker run --tmpfs /tmp:size=1g my-image
```

**使用场景：**
- 敏感数据（密码、Token）。
- 临时处理文件。
- 快速 I/O 需求。

## 面向 ML 工作负载的数据卷

### 场景 1：模型存储

```bash
# Create volume for model weights
docker volume create model-artifacts

# Training container saves model
docker run --rm \
    -v model-artifacts:/app/outputs \
    --gpus all \
    my-training-image python train.py

# Inference container loads model
docker run -d \
    -v model-artifacts:/app/models \
    -p 8000:8000 \
    my-inference-image
```

### 场景 2：数据集管理

```bash
# Mount large dataset from host
docker run --rm \
    -v /data/imagenet:/dataset:ro \
    -v training-logs:/logs \
    --gpus all \
    my-training-image python train.py --data /dataset
```

### 场景 3：容器之间共享数据

```bash
# Create shared volume
docker volume create shared-data

# Container 1: Preprocess data
docker run --rm \
    -v shared-data:/data \
    my-preprocessor python preprocess.py --output /data/processed

# Container 2: Train on processed data
docker run --rm \
    -v shared-data:/data \
    --gpus all \
    my-trainer python train.py --input /data/processed
```

### 场景 4：日志与指标

```bash
# Persistent logs
docker run -d \
    -v app-logs:/app/logs \
    -v prometheus-data:/prometheus \
    my-ml-service
```

## ML 数据卷最佳实践

### 1. 不要将大型文件包含在镜像内

**错误做法：**
```dockerfile
COPY models/large-model.pth /app/models/  # 5GB added to image!
```

**正确做法：**
```bash
# Download model at runtime
docker run -v models:/app/models my-image
# Or download in startup script
```

### 2. 使用只读挂载提高安全性

```bash
# Prevent accidental modification of dataset
docker run -v /data/dataset:/dataset:ro my-training-image
```

### 3. 分离代码、数据与输出

```bash
docker run \
    -v $(pwd)/src:/app/src:ro \      # Code (read-only)
    -v /data/training:/data:ro \     # Data (read-only)
    -v model-outputs:/outputs \       # Outputs (read-write)
    --gpus all \
    my-training-image
```

### 4. 数据卷备份

```bash
# Backup volume to tar file
docker run --rm \
    -v model-weights:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/models-backup.tar.gz -C /data .

# Restore volume from backup
docker run --rm \
    -v model-weights:/data \
    -v $(pwd):/backup \
    alpine sh -c "cd /data && tar xzf /backup/models-backup.tar.gz"
```

## 动手练习：多容器 ML 应用

### 目标

构建包含以下组件的多容器 ML 应用：
- **模型服务器**（PyTorch 推理）。
- **API 网关**（FastAPI）。
- **Redis**（特征缓存）。
- **PostgreSQL**（预测日志记录）。

### 架构

```
User → API Gateway (8000) → Model Server (internal)
                ↓              ↓
             Redis          PostgreSQL
           (cache)           (logs)
```

### 实现步骤

**1. 创建网络：**
```bash
docker network create ml-app
```

**2. 启动服务：**

```bash
# PostgreSQL
docker run -d \
    --name postgres \
    --network ml-app \
    -e POSTGRES_PASSWORD=mlpassword \
    -e POSTGRES_DB=predictions \
    -v postgres-data:/var/lib/postgresql/data \
    postgres:15

# Redis
docker run -d \
    --name redis \
    --network ml-app \
    -v redis-data:/data \
    redis:7-alpine

# Model Server (you'll build this)
docker build -t model-server ./model-server
docker run -d \
    --name model-server \
    --network ml-app \
    -v model-weights:/app/models \
    model-server

# API Gateway (you'll build this)
docker build -t api-gateway ./api-gateway
docker run -d \
    --name api-gateway \
    --network ml-app \
    -p 8000:8000 \
    -e MODEL_URL=http://model-server:8000 \
    -e REDIS_URL=redis://redis:6379 \
    -e DATABASE_URL=postgresql://postgres:mlpassword@postgres:5432/predictions \
    api-gateway
```

**3. 测试：**

```bash
# Health check
curl http://localhost:8000/health

# Make prediction
curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d '{"features": [1.0, 2.0, 3.0]}'

# Check logs in database
docker exec -it postgres psql -U postgres -d predictions \
    -c "SELECT * FROM predictions LIMIT 10;"
```

### TODO：完成练习

**model-server/Dockerfile：**
```dockerfile
# TODO: Create Dockerfile for model server
# - Use PyTorch base image
# - Copy model code
# - Mount volume for model weights
# - Expose port 8000
```

**api-gateway/Dockerfile：**
```dockerfile
# TODO: Create Dockerfile for API gateway
# - Use Python 3.11-slim
# - Install FastAPI, Redis, PostgreSQL clients
# - Copy API code
# - Expose port 8000
```

## 网络与数据卷故障排查

### 网络问题

**问题：容器无法通信。**

```bash
# Check if containers are on same network
docker network inspect ml-network

# Verify DNS resolution
docker exec container1 ping container2

# Check firewall rules
docker exec container1 telnet container2 8000
```

**问题：端口已被占用。**

```bash
# Find what's using the port
sudo lsof -i :8000

# Use different host port
docker run -p 8001:8000 my-image
```

### 数据卷问题

**问题：权限不足（Permission denied）。**

```bash
# Check volume permissions
docker run --rm -v my-volume:/data alpine ls -la /data

# Fix ownership
docker run --rm -v my-volume:/data alpine chown -R 1000:1000 /data
```

**问题：数据卷无法挂载。**

```bash
# Inspect volume
docker volume inspect my-volume

# Verify mount
docker inspect my-container | grep -A 10 Mounts
```

## 总结

本课学习了：

1. **Docker 网络**——Bridge、Host、自定义网络与服务发现。
2. **端口映射**——使 ML 服务能够接收外部流量。
3. **多容器应用**——连接模型服务器、API 与数据库。
4. **数据卷**——使用命名卷或绑定挂载持久化存储。
5. **ML 专用模式**——模型存储、数据集管理及日志持久化。

**核心要点：**
- 使用自定义 Bridge 网络实现服务发现。
- 使用命名卷存储持久化数据（模型、日志）。
- 开发环境使用绑定挂载。
- 对数据集使用只读挂载。
- 使用独立网络加强安全隔离。

## 下一步

下一课 **05-docker-compose.md** 将学习：
- 通过 YAML 定义多容器应用。
- 通过单条命令管理整个 ML 技术栈。
- 环境变量与配置。
- 健康检查与依赖关系。
- 服务扩缩容。

---

## 自我检查问题

1. Bridge 与 Host 网络有什么区别？
2. 自定义网络上的容器如何发现彼此？
3. 何时使用命名卷，何时使用绑定挂载？
4. 如何在两个容器之间共享数据？
5. 端口映射的格式是什么？

## 补充资源

- [Docker 网络概览](https://docs.docker.com/network/)
- [Docker 数据卷文档](https://docs.docker.com/storage/volumes/)
- [容器网络最佳实践](https://docs.docker.com/network/network-tutorial-standalone/)

---

**下一课：** [05-docker-compose.md](./05-docker-compose.md)

> 译注：Kubernetes 一般通过 CNI 实现网络，而非直接使用 Docker Overlay 驱动；Host 网络在不同操作系统及 Docker Desktop 版本中的支持有所不同。命名卷并非总比绑定挂载快，应按存储后端实测。tmpfs 在某些配置下可能被交换到磁盘，不应仅依赖它保护密钥。只读挂载只约束当前容器，不阻止其他写入方修改共享数据。实验中的凭据与端口映射不能直接用于生产；应限制对外监听、采用可靠认证并保护数据库。代码块及其英文内容保留原样。
