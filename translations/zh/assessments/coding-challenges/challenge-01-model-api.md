# 编程挑战 01：构建模型服务 API

**难度：** 中级
**时间限制：** 2 小时
**主题：** FastAPI、Docker、模型服务

---

## 挑战概览

构建用于提供机器学习模型服务的生产级 REST API。API 应具备适当的错误处理、日志、指标及容器化能力。

## 要求

### 功能性要求

1. **API 端点：**
   - `POST /predict`——接收输入并返回预测。
   - `GET /health`——健康检查端点。
   - `GET /metrics`——Prometheus 指标端点。
   - `GET /model/info`——返回模型元数据。
2. **模型：**
   - 使用任意预训练模型（sklearn、PyTorch、TensorFlow）。
   - 启动时加载模型。
   - 将模型缓存于内存。
3. **输入验证：**
   - 验证请求载荷结构。
   - 对无效输入返回明确错误消息。
   - 妥善处理缺失字段。
4. **日志：**
   - 记录全部请求及时间戳。
   - 记录错误及异常堆栈。
   - 使用结构化日志（JSON 格式）。
5. **指标：**
   - 追踪请求数量。
   - 追踪请求延迟（直方图）。
   - 追踪错误率。
   - 以 Prometheus 格式暴露指标。

### 非功能性要求

1. **容器化：**
   - 创建经过优化的 Dockerfile。
   - 使用多阶段构建。
   - 以非 Root 用户运行。
   - 镜像体积尽可能低于 500MB。
2. **性能：**
   - API 响应时间 p95 低于 200ms。
   - 支持并发请求。
   - 实现超时处理。
3. **代码质量：**
   - 所有函数均具有类型注解。
   - 公共函数具有文档字符串。
   - 遵循 PEP 8 风格指南。
   - 不硬编码配置值（使用配置机制）。

## 起始代码

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging

app = FastAPI()

class PredictionRequest(BaseModel):
    # TODO: Define request schema
    pass

class PredictionResponse(BaseModel):
    # TODO: Define response schema
    pass

@app.on_event("startup")
async def startup_event():
    # TODO: Load model
    pass

@app.post("/predict")
async def predict(request: PredictionRequest) -> PredictionResponse:
    # TODO: Implement prediction
    pass

@app.get("/health")
async def health():
    # TODO: Implement health check
    pass

# TODO: Add metrics endpoint
# TODO: Add model info endpoint
```

```dockerfile
# Dockerfile
FROM python:3.11-slim as builder

# TODO: Implement multi-stage build
# Stage 1: Install dependencies
# Stage 2: Copy only necessary files

# TODO: Run as non-root user
# TODO: Expose port
# TODO: Set CMD
```

## 评估标准

### 代码质量（30 分）
- [ ] 使用类型注解（5 分）。
- [ ] 恰当的文档字符串（5 分）。
- [ ] 遵循 PEP 8（5 分）。
- [ ] 无硬编码值（5 分）。
- [ ] 错误处理（10 分）。

### 功能（40 分）
- [ ] 所有端点均可用（15 分）。
- [ ] 输入验证（10 分）。
- [ ] 已实现日志（5 分）。
- [ ] 指标正常工作（10 分）。

### 容器化（20 分）
- [ ] Dockerfile 构建成功（5 分）。
- [ ] 多阶段构建（5 分）。
- [ ] 非 Root 用户（5 分）。
- [ ] 优化镜像体积（5 分）。

### 性能（10 分）
- [ ] 满足延迟要求（5 分）。
- [ ] 处理并发请求（5 分）。

**总分：100 分。**

## 提交要求

提交：
1. 源代码（app/ 目录）。
2. Dockerfile。
3. requirements.txt。
4. README.md，包含：
   - 如何构建与运行。
   - API 文档。
   - 请求示例。
   - 性能基准测试结果。

## 测试你的方案

```bash
# Build image
docker build -t model-api .

# Run container
docker run -p 8000:8000 model-api

# Test endpoints
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [1, 2, 3, 4]}'

curl http://localhost:8000/health
curl http://localhost:8000/metrics
curl http://localhost:8000/model/info
```

## 额外挑战（每项加 10 分）

1. **限流**——实现每分钟 100 次请求的限流。
2. **缓存**——对相同输入缓存预测结果。
3. **批量预测**——支持批量预测。
4. **身份验证**——添加 API Key 身份验证。
5. **OpenAPI 文档**——自定义 OpenAPI 文档。

---

**时间到了？** 提交已经完成的内容。部分完成的方案也可以获得相应分数。
