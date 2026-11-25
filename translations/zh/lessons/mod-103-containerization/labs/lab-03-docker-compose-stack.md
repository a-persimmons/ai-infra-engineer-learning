# 实验 03：编排多服务技术栈

**时长：** 75 分钟  **前置条件：** 完成实验 02。

## 目标

使用 Docker Compose 搭建具有代表性的机器学习模型服务技术栈：一个 API 容器、一个 Redis 特征存储缓存和一个 Postgres 元数据库，包含健康检查并按依赖关系顺序启动。

## 步骤

### 1. compose.yaml
```yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      REDIS_URL: redis://cache:6379/0
      POSTGRES_URL: postgresql://app:app@db:5432/models
    depends_on:
      cache: { condition: service_healthy }
      db:    { condition: service_healthy }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 5

  cache:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: models
    volumes: [pg_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d models"]
      interval: 5s
      retries: 10

volumes: { pg_data: {} }
```

### 2. 启动服务栈
```bash
docker compose up -d
docker compose ps
docker compose logs -f api
```

### 3. 测试 API
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/predict -d '...'
```

### 4. 检查网络
```bash
docker network ls
docker network inspect <project>_default
```
注意：在自定义桥接网络中，服务通过服务名称（`cache`、`db`）互相访问。

### 5. 重新构建与重启循环
```bash
docker compose up -d --build api
```

### 6. 数据卷与数据持久化
```bash
docker compose down            # data persists
docker compose down -v         # data deleted
```

## 验证
- [ ] `docker compose ps` 显示三个服务均为 `running (healthy)`。
- [ ] API 能从 Redis 和 Postgres 读取数据（通过同时访问二者的端点进行测试）。
- [ ] 执行 `docker compose down && up` 后，Postgres 中的数据仍然存在。

## 清理
```bash
docker compose down -v
docker image prune -f
```

## 故障排查
- **API 在数据库就绪前启动** — `depends_on.condition: service_healthy` 要求依赖服务配置健康检查，而不仅仅是 `service_started`。
- **`Cannot connect to Postgres`** — 在 Compose 网络内部，使用服务名 `db`，而不是 `localhost`。
- **数据卷未持久化** — 命名卷（`pg_data`）可以持久化；匿名卷（`/var/lib/postgresql/data`）在宿主机上同样会持久化，但会被 `down -v` 清除。
