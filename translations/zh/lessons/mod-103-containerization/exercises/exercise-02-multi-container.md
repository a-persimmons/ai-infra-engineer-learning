# 练习 02：多容器机器学习应用

**预计时间：** 3–4 小时
**难度：** 中级
**前置条件：** 已完成练习 01，并安装 Docker Compose

## 目标

使用 Docker Compose 构建完整机器学习应用技术栈，包含：
- FastAPI 机器学习推理服务。
- 用于记录预测结果的 PostgreSQL 数据库。
- 用于缓存结果的 Redis。
- 用于采集指标的 Prometheus。

## 架构

```
User → API (FastAPI) → Model Server
           ↓              ↓
       PostgreSQL      Redis
           ↓
       Prometheus
```

## 项目结构

```
ml-stack/
├── docker-compose.yml
├── .env
├── api/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── postgres/
│   └── init.sql
├── prometheus/
│   └── prometheus.yml
└── README.md
```

## 任务

### 任务 1：创建 Docker Compose 文件

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  # TODO: Define api service
  # - Build from ./api
  # - Expose port 8000
  # - Environment variables for DB and Redis
  # - Depends on postgres and redis
  # - Add health check

  # TODO: Define postgres service
  # - Use postgres:15-alpine
  # - Set POSTGRES_PASSWORD, POSTGRES_DB
  # - Mount volume for data persistence
  # - Mount init.sql for schema
  # - Add health check

  # TODO: Define redis service
  # - Use redis:7-alpine
  # - Mount volume for persistence
  # - Add health check

  # TODO: Define prometheus service (stretch goal)
  # - Use prom/prometheus:latest
  # - Mount prometheus.yml config
  # - Expose port 9090

# TODO: Define named volumes

# TODO: Define custom network
```

### 任务 2：API 服务

**api/Dockerfile：**
```dockerfile
# TODO: Create optimized Dockerfile
# - Use multi-stage build
# - Run as non-root user
# - Health check
```

**api/requirements.txt：**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
python-multipart==0.0.6
redis==5.0.1
psycopg2-binary==2.9.9
prometheus-client==0.19.0
```

**api/main.py：**
```python
from fastapi import FastAPI, HTTPException
import redis
import psycopg2
import os
from datetime import datetime

app = FastAPI()

# TODO: Initialize Redis client
# redis_client = redis.from_url(os.getenv("REDIS_URL"))

# TODO: Initialize PostgreSQL connection
# db_conn = psycopg2.connect(os.getenv("DATABASE_URL"))

@app.get("/health")
def health():
    # TODO: Check Redis and Postgres connectivity
    pass

@app.post("/predict")
async def predict(data: dict):
    # TODO: Implement prediction logic
    # 1. Check Redis cache
    # 2. If not cached, run model inference
    # 3. Cache result in Redis
    # 4. Log prediction to PostgreSQL
    pass

# TODO: Add metrics endpoint for Prometheus
```

### 任务 3：数据库 Schema

**postgres/init.sql：**
```sql
-- TODO: Create predictions table
-- Columns: id, input_data, prediction, confidence, timestamp

CREATE TABLE IF NOT EXISTS predictions (
    -- TODO: Define schema
);

-- TODO: Create index on timestamp for faster queries
```

### 任务 4：Prometheus 配置

**prometheus/prometheus.yml：**
```yaml
# TODO: Configure Prometheus to scrape API metrics
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ml-api'
    # TODO: Configure scrape target
```

## 测试

```bash
# Start the stack
docker compose up -d

# Check all services are running
docker compose ps

# View logs
docker compose logs -f api

# Test health check
curl http://localhost:8000/health

# Make a prediction
curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d '{"features": [1.0, 2.0, 3.0]}'

# Make same prediction again (should be cached)
curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d '{"features": [1.0, 2.0, 3.0]}'

# Check database
docker compose exec postgres psql -U postgres -d predictions \
    -c "SELECT * FROM predictions LIMIT 10;"

# Check Redis cache
docker compose exec redis redis-cli KEYS "*"

# View metrics (stretch goal)
open http://localhost:9090

# Stop stack
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 成功标准

- [ ] 所有服务均成功启动。
- [ ] API 健康检查通过。
- [ ] 预测结果记录至 PostgreSQL。
- [ ] 重复预测返回缓存结果。
- [ ] Redis 数据在重启后仍然保留。
- [ ] 服务之间可以通过名称通信。
- [ ] 优雅关闭正常工作。
- [ ] Prometheus 采集指标（拓展目标）。

## 拓展目标

1. **添加 Grafana**：可视化 Prometheus 指标。
2. **负载均衡**：通过 Nginx 运行多个 API 副本。
3. **异步预测**：使用消息队列（RabbitMQ/Kafka）。
4. **独立开发与生产配置**：docker-compose.override.yml。
5. **模型版本管理**：存储多个模型版本。

## 常见问题

**服务之间无法连接：**
- 验证全部服务位于同一网络。
- 检查服务名称是否匹配（postgres、redis、api）。
- 连接前等待健康检查通过。

**数据库连接失败：**
- 确保两个服务中的 POSTGRES_PASSWORD 一致。
- 检查 DATABASE_URL 格式：`postgresql://user:password@host:port/database`。
- 验证 init.sql 已执行（检查 docker compose logs postgres）。

**缓存不工作：**
- 使用 docker compose exec redis redis-cli ping 检查 Redis 连接。
- 验证 REDIS_URL 环境变量。
- 检查日志中的连接错误。

---

**下一项练习：** [exercise-03-gpu-container.md](./exercise-03-gpu-container.md)（面向机器学习工作负载的 GPU 容器）。

**相关练习：** [exercise-04-container-security/](./exercise-04-container-security/) 与 [exercise-08-production-model-serving](../../mod-101-foundations/exercises/exercise-08-production-model-serving/)，用于深入学习生产就绪能力。
