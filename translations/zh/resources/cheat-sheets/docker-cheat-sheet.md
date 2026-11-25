# Docker 速查表

常用 Docker 命令及最佳实践的快速参考。

---

## 基础命令

### 镜像
```bash
# Build image from Dockerfile
docker build -t myimage:tag .

# Build with build args
docker build --build-arg VERSION=1.0 -t myimage:tag .

# List images
docker images

# Remove image
docker rmi myimage:tag

# Remove unused images
docker image prune -a

# Pull image from registry
docker pull nginx:latest

# Push image to registry
docker push myregistry.com/myimage:tag

# Tag image
docker tag myimage:tag myregistry.com/myimage:tag

# Inspect image
docker inspect myimage:tag

# View image history
docker history myimage:tag
```

### 容器
```bash
# Run container
docker run -d --name mycontainer myimage:tag

# Run with port mapping
docker run -d -p 8080:80 --name mycontainer myimage:tag

# Run with environment variables
docker run -d -e KEY=value --name mycontainer myimage:tag

# Run with volume mount
docker run -d -v /host/path:/container/path myimage:tag

# Run interactively
docker run -it myimage:tag /bin/bash

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop mycontainer

# Start stopped container
docker start mycontainer

# Restart container
docker restart mycontainer

# Remove container
docker rm mycontainer

# Remove running container (force)
docker rm -f mycontainer

# View container logs
docker logs mycontainer

# Follow logs in real-time
docker logs -f mycontainer

# Execute command in running container
docker exec -it mycontainer /bin/bash

# Copy files from container
docker cp mycontainer:/path/to/file /host/path

# Copy files to container
docker cp /host/path mycontainer:/path/to/file

# View container stats
docker stats mycontainer

# Inspect container
docker inspect mycontainer
```

### 清理
```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Remove everything (containers, images, volumes, networks)
docker system prune -a --volumes
```

---

## Dockerfile 最佳实践

### 多阶段构建示例
```dockerfile
# Stage 1: Build
FROM python:3.11-slim as builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY . .

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app .

# Make sure scripts are in PATH
ENV PATH=/root/.local/bin:$PATH

# Run as non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["python", "main.py"]
```

### 最佳实践
```dockerfile
# ✅ Use specific version tags (not 'latest')
FROM python:3.11-slim

# ✅ Combine RUN commands to reduce layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ✅ Copy requirements first (better layer caching)
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# ✅ Use .dockerignore to exclude unnecessary files
# Create .dockerignore with: __pycache__, *.pyc, .git, etc.

# ✅ Run as non-root user
USER appuser

# ✅ Use EXPOSE to document ports
EXPOSE 8000

# ✅ Use ENTRYPOINT for main command, CMD for default args
ENTRYPOINT ["python"]
CMD ["app.py"]
```

---

## Docker Compose

### 基础 docker-compose.yml
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://db:5432/mydb
    depends_on:
      - db
    volumes:
      - ./app:/app
    networks:
      - mynetwork

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - mynetwork

volumes:
  postgres_data:

networks:
  mynetwork:
```

### Docker Compose 命令
```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# Build and start
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f web

# Execute command in service
docker-compose exec web bash

# List services
docker-compose ps

# Scale service
docker-compose up --scale web=3
```

---

## 网络

```bash
# List networks
docker network ls

# Create network
docker network create mynetwork

# Connect container to network
docker network connect mynetwork mycontainer

# Disconnect container from network
docker network disconnect mynetwork mycontainer

# Inspect network
docker network inspect mynetwork

# Remove network
docker network rm mynetwork
```

---

## 数据卷

```bash
# List volumes
docker volume ls

# Create volume
docker volume create myvolume

# Inspect volume
docker volume inspect myvolume

# Remove volume
docker volume rm myvolume

# Use volume in container
docker run -v myvolume:/app/data myimage:tag

# Use bind mount
docker run -v /host/path:/container/path myimage:tag

# Read-only mount
docker run -v /host/path:/container/path:ro myimage:tag
```

---

## 调试

```bash
# View container logs
docker logs mycontainer

# Stream logs
docker logs -f mycontainer

# Show last 100 lines
docker logs --tail 100 mycontainer

# Show logs with timestamps
docker logs -t mycontainer

# Inspect container (full JSON)
docker inspect mycontainer

# View processes in container
docker top mycontainer

# View container resource usage
docker stats mycontainer

# Execute shell in running container
docker exec -it mycontainer /bin/bash

# View container filesystem changes
docker diff mycontainer

# Export container filesystem
docker export mycontainer > container.tar
```

---

## 镜像仓库操作

```bash
# Login to registry
docker login myregistry.com

# Logout
docker logout myregistry.com

# Tag for registry
docker tag myimage:tag myregistry.com/myimage:tag

# Push to registry
docker push myregistry.com/myimage:tag

# Pull from registry
docker pull myregistry.com/myimage:tag
```

---

## 安全

```bash
# Run container with limited resources
docker run --memory="512m" --cpus="1.0" myimage:tag

# Run with read-only filesystem
docker run --read-only myimage:tag

# Scan image for vulnerabilities
docker scan myimage:tag

# Run with security options
docker run --security-opt no-new-privileges myimage:tag

# Drop capabilities
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myimage:tag
```

---

## 实用单行命令

```bash
# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker rm $(docker ps -a -q)

# Remove all images
docker rmi $(docker images -q)

# Get container IP address
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' mycontainer

# Follow logs of multiple containers
docker-compose logs -f web db

# Remove dangling images
docker images -f "dangling=true" -q | xargs docker rmi

# Container stats for all running containers
docker stats --all --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 实用技巧

1. **使用 .dockerignore** — 排除不必要的文件（如 .git、__pycache__）。
2. **多阶段构建** — 减小最终镜像大小。
3. **层缓存** — 按变更频率从低到高排列 Dockerfile 指令。
4. **明确的标签** — 生产环境不要使用 :latest。
5. **健康检查** — 在 Dockerfile 中加入 HEALTHCHECK。
6. **非 root 用户** — 生产环境尽量使用非 root 用户运行。
7. **资源限制** — 设置内存和 CPU 限制。
8. **日志** — 使用 json-file 或 journald 日志驱动。
9. **密钥** — 使用 Docker secrets 或环境变量（不要硬编码）。
10. **扫描镜像** — 定期扫描漏洞。

---

**另见：**
- [Kubernetes 速查表](./kubernetes-cheat-sheet.md)
- [Git 速查表](./git-cheat-sheet.md)
- [Linux 命令速查表](./linux-cheat-sheet.md)

> 译注：清理命令可能删除仍需要的镜像、容器或数据卷，请先确认影响范围；生产环境优先采用不可变镜像 digest 和专用密钥管理。
