# 第 07 课：面向机器学习基础设施的 Docker 基础

**时长：** 6 小时
**目标：** 理解容器化，并使用 Docker 运行机器学习应用。

## 导论

Docker 是用于在容器中开发、交付和运行应用的平台。对于机器学习基础设施工程师，Docker 是以下工作的关键工具：

- 在开发、测试和生产环境之间创建一致的运行环境。
- 将模型及其依赖打包。
- 简化部署与扩展。
- 隔离应用以提高安全性。
- 简化依赖管理。

本课针对机器学习基础设施使用场景介绍 Docker 基础。

## 什么是 Docker？

### Docker 解决的问题

**使用 Docker 之前：**
```
Developer's Machine:
✅ Python 3.11, PyTorch 2.1, CUDA 11.8
✅ Model works perfectly

Production Server:
❌ Python 3.9, PyTorch 1.12, CUDA 11.2
❌ "But it works on my machine!"
❌ Hours spent debugging environment issues
```

**使用 Docker 之后：**
```
Developer's Machine:
✅ Build Docker image with exact dependencies
✅ Test in container

Production Server:
✅ Run same Docker image
✅ Guaranteed identical environment
✅ No surprises!
```

### 容器与虚拟机的区别

```
┌─────────────────────────────────────────────────────────┐
│              Virtual Machines (VMs)                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  App A   │  │  App B   │  │  App C   │             │
│  ├──────────┤  ├──────────┤  ├──────────┤             │
│  │  Bins    │  │  Bins    │  │  Bins    │             │
│  │  Libs    │  │  Libs    │  │  Libs    │             │
│  ├──────────┤  ├──────────┤  ├──────────┤             │
│  │ Guest OS │  │ Guest OS │  │ Guest OS │  (GBs each) │
│  └──────────┘  └──────────┘  └──────────┘             │
│              Hypervisor                                  │
│              Host OS                                     │
│              Hardware                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Docker Containers                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  App A   │  │  App B   │  │  App C   │             │
│  ├──────────┤  ├──────────┤  ├──────────┤             │
│  │  Bins    │  │  Bins    │  │  Bins    │             │
│  │  Libs    │  │  Libs    │  │  Libs    │             │
│  └──────────┘  └──────────┘  └──────────┘  (MBs each)  │
│              Docker Engine                               │
│              Host OS (shared kernel)                     │
│              Hardware                                    │
└─────────────────────────────────────────────────────────┘

Containers:                      VMs:
- Lightweight (MBs)             - Heavy (GBs)
- Fast startup (seconds)        - Slow startup (minutes)
- Share host OS kernel          - Each has own OS
- Less isolation                - Strong isolation
- More efficient                - More resource overhead
```

### Docker 核心概念

1. **镜像（Image）：** 包含应用与依赖的只读模板。
2. **容器（Container）：** 镜像的运行实例。
3. **Dockerfile：** 构建镜像的指令。
4. **镜像仓库（Registry）：** 存储镜像的服务（Docker Hub、ECR、GCR）。
5. **数据卷（Volume）：** 持久化数据存储。
6. **网络（Network）：** 容器之间的通信。

## 安装 Docker

### Linux（Ubuntu/Debian）
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker run hello-world

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### macOS
```bash
# Download Docker Desktop from: https://www.docker.com/products/docker-desktop
# Or use Homebrew
brew install --cask docker

# Verify
docker --version
docker run hello-world
```

### Windows
```bash
# Download Docker Desktop from: https://www.docker.com/products/docker-desktop
# Requires WSL2

# Verify in PowerShell or WSL2
docker --version
docker run hello-world
```

## Docker 基础命令

### 操作镜像

```bash
# Pull image from registry
docker pull python:3.11-slim

# List local images
docker images

# Remove image
docker rmi python:3.11-slim

# Search for images
docker search pytorch

# Build image from Dockerfile
docker build -t my-image:v1.0 .

# Tag image
docker tag my-image:v1.0 username/my-image:v1.0

# Push image to registry
docker push username/my-image:v1.0
```

### 操作容器

```bash
# Run container
docker run python:3.11-slim

# Run container with name
docker run --name my-container python:3.11-slim

# Run container in background (detached)
docker run -d python:3.11-slim

# Run container with port mapping
docker run -p 8000:8000 my-api:v1.0

# Run container interactively
docker run -it python:3.11-slim /bin/bash

# Run container with environment variables
docker run -e MODEL_NAME=resnet18 my-model:v1.0

# Run container with volume
docker run -v /host/path:/container/path my-app:v1.0

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop my-container

# Start stopped container
docker start my-container

# Remove container
docker rm my-container

# Remove all stopped containers
docker container prune

# View container logs
docker logs my-container

# Follow logs (live)
docker logs -f my-container

# Execute command in running container
docker exec -it my-container /bin/bash

# Inspect container
docker inspect my-container

# View container resource usage
docker stats my-container
```

## 为机器学习编写 Dockerfile

### Dockerfile 基本结构

```dockerfile
# 1. Base Image
FROM python:3.11-slim

# 2. Metadata
LABEL maintainer="you@example.com"
LABEL version="1.0"

# 3. Environment Variables
ENV PYTHONUNBUFFERED=1

# 4. Working Directory
WORKDIR /app

# 5. Install Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy Application Code
COPY . .

# 7. Expose Port
EXPOSE 8000

# 8. Run Command
CMD ["python", "app.py"]
```

### 机器学习专用 Dockerfile 示例

```dockerfile
# ML Model Serving Dockerfile

# Base image with Python
FROM python:3.11-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --user torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Update PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy application code
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser models/ ./models/

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MODEL_NAME=resnet18 \
    PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Switch to non-root user
USER appuser

# Run application
CMD ["python", "-m", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 使用多阶段构建进行优化

**问题：** Docker 镜像可能变得非常大。

**解决方案：** 多阶段构建。

```dockerfile
# ❌ Single-stage (large image: ~2GB)
FROM python:3.11
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential git
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]

# ✅ Multi-stage (smaller image: ~500MB)
# Stage 1: Build
FROM python:3.11 as builder
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

### Dockerfile 最佳实践

```dockerfile
# ✅ GOOD: Layer caching optimization
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .           # Copy requirements first
RUN pip install -r requirements.txt  # Install dependencies (cached)
COPY . .                          # Copy code last (changes frequently)

# ❌ BAD: No caching
FROM python:3.11-slim
WORKDIR /app
COPY . .                          # Copy everything (invalidates cache)
RUN pip install -r requirements.txt  # Reinstall every time

# ✅ GOOD: Combine commands to reduce layers
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# ❌ BAD: Multiple layers
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# ✅ GOOD: Use specific versions
FROM python:3.11-slim

# ❌ BAD: Use latest (unpredictable)
FROM python:latest

# ✅ GOOD: Non-root user
RUN useradd -r appuser
USER appuser

# ❌ BAD: Run as root (security risk)
# (no USER specified, defaults to root)

# ✅ GOOD: Clean up in same layer
RUN apt-get update && \
    apt-get install -y package && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ❌ BAD: Clean up in different layer (doesn't reduce size)
RUN apt-get update
RUN apt-get install -y package
RUN rm -rf /var/lib/apt/lists/*
```

## 构建与运行机器学习容器

### 构建镜像

```bash
# Basic build
docker build -t ml-model:v1.0 .

# Build with build arguments
docker build --build-arg MODEL_NAME=resnet50 -t ml-model:v1.0 .

# Build with different Dockerfile
docker build -f Dockerfile.gpu -t ml-model-gpu:v1.0 .

# Build without cache
docker build --no-cache -t ml-model:v1.0 .

# View build history
docker history ml-model:v1.0
```

### 运行机器学习容器

```bash
# Basic run
docker run ml-model:v1.0

# Run with port mapping
docker run -p 8000:8000 ml-model:v1.0

# Run in background
docker run -d -p 8000:8000 --name ml-api ml-model:v1.0

# Run with GPU support (NVIDIA)
docker run --gpus all -p 8000:8000 ml-model-gpu:v1.0

# Run with specific GPU
docker run --gpus '"device=0"' -p 8000:8000 ml-model-gpu:v1.0

# Run with resource limits
docker run \
    --memory=4g \
    --cpus=2 \
    -p 8000:8000 \
    ml-model:v1.0

# Run with environment variables
docker run \
    -e MODEL_NAME=resnet50 \
    -e BATCH_SIZE=32 \
    -p 8000:8000 \
    ml-model:v1.0

# Run with volume for models
docker run \
    -v /host/models:/app/models \
    -p 8000:8000 \
    ml-model:v1.0

# Run with restart policy
docker run \
    --restart=always \
    -d \
    -p 8000:8000 \
    ml-model:v1.0
```

## 使用 Docker Compose 管理多容器应用

### 什么是 Docker Compose？

使用 YAML 定义和运行多容器应用的工具。

### Docker Compose 文件示例

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ML API Service
  ml-api:
    build:
      context: .
      dockerfile: Dockerfile
    image: ml-model:v1.0
    container_name: ml-api
    ports:
      - "8000:8000"
    environment:
      - MODEL_NAME=resnet18
      - DEVICE=cpu
      - LOG_LEVEL=info
    volumes:
      - ./models:/app/models
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ml-network

  # Prometheus (Monitoring)
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

  # Grafana (Visualization)
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

networks:
  ml-network:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

### Docker Compose 命令

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f ml-api

# Scale service
docker-compose up -d --scale ml-api=3

# Rebuild images
docker-compose build

# Rebuild and start
docker-compose up -d --build

# View running services
docker-compose ps

# Execute command in service
docker-compose exec ml-api /bin/bash

# View resource usage
docker-compose stats
```

## Docker 网络

### 网络类型

```bash
# Bridge (default): Containers on same host
docker network create ml-bridge

# Host: Container uses host networking (no isolation)
docker run --network host ml-model:v1.0

# None: No networking
docker run --network none ml-model:v1.0

# List networks
docker network ls

# Inspect network
docker network inspect ml-bridge

# Connect container to network
docker network connect ml-bridge ml-api

# Disconnect
docker network disconnect ml-bridge ml-api
```

### 容器间通信

```bash
# Create network
docker network create ml-network

# Run containers on same network
docker run -d --name ml-api --network ml-network ml-model:v1.0
docker run -d --name redis --network ml-network redis:latest

# Containers can communicate using service names
# ml-api can reach redis at: redis:6379
```

## Docker 数据卷（持久化存储）

### 数据卷类型

```bash
# Named volume (managed by Docker)
docker volume create model-storage
docker run -v model-storage:/app/models ml-model:v1.0

# Bind mount (specific host path)
docker run -v /host/models:/app/models ml-model:v1.0

# tmpfs (in-memory, temporary)
docker run --tmpfs /tmp ml-model:v1.0

# List volumes
docker volume ls

# Inspect volume
docker volume inspect model-storage

# Remove volume
docker volume rm model-storage

# Remove unused volumes
docker volume prune
```

## 用于 GPU 工作负载的 Docker

### NVIDIA Container Toolkit 配置

```bash
# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
    sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Restart Docker
sudo systemctl restart docker

# Test GPU access
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### GPU Dockerfile

```dockerfile
# Use CUDA base image
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y python3.11 python3-pip

WORKDIR /app

# Install PyTorch with CUDA support
RUN pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118

COPY requirements.txt .
RUN pip3 install -r requirements.txt

COPY . .

ENV DEVICE=cuda

CMD ["python3", "serve.py"]
```

## Docker 镜像仓库（镜像存储）

### Docker Hub（公共镜像仓库）

```bash
# Login
docker login

# Tag image
docker tag ml-model:v1.0 username/ml-model:v1.0

# Push to Docker Hub
docker push username/ml-model:v1.0

# Pull from Docker Hub
docker pull username/ml-model:v1.0
```

### 私有镜像仓库（AWS ECR）

```bash
# Install AWS CLI
aws configure

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create repository
aws ecr create-repository --repository-name ml-model

# Tag image
docker tag ml-model:v1.0 \
    123456789012.dkr.ecr.us-east-1.amazonaws.com/ml-model:v1.0

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ml-model:v1.0
```

### 私有镜像仓库（GCP GCR）

```bash
# Configure gcloud
gcloud auth configure-docker

# Tag image
docker tag ml-model:v1.0 gcr.io/project-id/ml-model:v1.0

# Push to GCR
docker push gcr.io/project-id/ml-model:v1.0
```

## Docker 故障排查

### 常见问题

```bash
# Issue: Permission denied
# Solution: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Issue: Container exits immediately
# Check logs
docker logs container-name

# Issue: Port already in use
# Find process using port
sudo lsof -i :8000
# Kill process or use different port

# Issue: Out of disk space
# Clean up unused resources
docker system prune -a

# Issue: Container can't connect to network
# Check network configuration
docker network inspect network-name

# Issue: Image too large
# Use multi-stage builds
# Use smaller base images (alpine, slim)

# Issue: Slow build times
# Optimize layer caching
# Use .dockerignore

# Debug container
docker run -it ml-model:v1.0 /bin/bash
docker exec -it container-name /bin/bash

# View container processes
docker top container-name

# Monitor resource usage
docker stats

# Inspect everything
docker inspect container-name
```

## 实践练习

**构建并运行容器化机器学习 API：**

```bash
# 1. Create project structure
mkdir ml-docker-demo && cd ml-docker-demo

# 2. Create simple FastAPI app
cat > app.py << 'EOF'
from fastapi import FastAPI
import torch

app = FastAPI()

@app.get("/")
def root():
    return {"message": "ML API Running!"}

@app.get("/health")
def health():
    return {"status": "healthy", "torch_version": torch.__version__}

@app.get("/gpu")
def gpu_check():
    return {"cuda_available": torch.cuda.is_available()}
EOF

# 3. Create requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
EOF

# 4. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --index-url https://download.pytorch.org/whl/cpu
COPY app.py .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# 5. Build image
docker build -t ml-api:v1.0 .

# 6. Run container
docker run -d -p 8000:8000 --name ml-api ml-api:v1.0

# 7. Test
curl http://localhost:8000/health

# 8. View logs
docker logs ml-api

# 9. Cleanup
docker stop ml-api
docker rm ml-api
```

## 核心要点

1. **Docker** 使用容器创建一致、可移植的环境。
2. **容器**轻量、快速并提供一定程度的隔离。
3. **Dockerfile** 定义镜像的构建方式。
4. **多阶段构建**有助于缩小镜像体积。
5. **Docker Compose** 管理多容器应用。
6. **数据卷**提供持久化存储。
7. **网络**支持容器间通信。
8. **GPU 支持：** 对 NVIDIA GPU 容器通常需要 NVIDIA Container Toolkit。
9. **最佳实践：** 使用明确的版本、非 Root 用户与镜像层缓存。

## 自我检查问题

1. 镜像与容器有什么区别？
2. 多阶段构建的目的是什么？
3. 如何暴露并映射 Docker 容器中的端口？
4. Dockerfile 中 COPY 与 ADD 有什么区别？
5. 如何持久化 Docker 中的数据？
6. 如何启用 Docker 容器中的 GPU 访问？
7. Docker Compose 用于什么场景？

## 补充资源

- [Docker 文档](https://docs.docker.com/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-docker)
- [Docker 机器学习指南](https://docs.docker.com/get-started/)

---

**下一课：** [08-api-development.md](./08-api-development.md)——构建面向生产环境的 API。

> 译注：本课大量解释、示意图与命令位于原文代码块内，为保持示例可复制，代码块整体保留。工具安装命令与镜像标签应按当前版本核对；GCP Container Registry（GCR）属于旧版仓库方案，新部署应核对 Artifact Registry。容器共享宿主机内核，不应将其隔离能力直接等同于虚拟机。执行清理命令前确认作用范围，避免删除其他项目的数据卷或镜像。
