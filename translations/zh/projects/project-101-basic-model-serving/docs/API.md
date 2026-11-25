# API 文档——机器学习模型服务

## 基础 URL

- 本地：`http://localhost:8000`
- 生产环境：`https://api.your-domain.com`

## 身份验证

目前不要求身份验证。TODO：为生产环境添加 API Key 身份验证。

---

## 端点

### 1. 健康检查

**端点：** `GET /health`

**描述：** 检查服务是否健康，是否已准备好处理请求。

**响应：**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

**状态码：**
- 200 OK——服务健康。
- 503 Service Unavailable——服务尚未就绪。

---

### 2. 指标

**端点：** `GET /metrics`

**描述：** 用于监控的 Prometheus 格式指标。

**响应：**（Prometheus 格式）
```
# HELP predictions_total Total number of predictions
# TYPE predictions_total counter
predictions_total{status="success"} 1234
predictions_total{status="error"} 56

# HELP prediction_duration_seconds Time spent on inference
# TYPE prediction_duration_seconds histogram
prediction_duration_seconds_bucket{le="0.01"} 100
...
```

---

### 3. 预测（图像分类）

**端点：** `POST /v1/predict`

**描述：** 对上传的图片进行分类。

**请求：**

*Content-Type：* multipart/form-data

**参数：**
- file（必需）：图片文件（JPEG、PNG）。
- top_k（可选）：返回排名靠前的预测数量（默认 5，最大 10）。

**示例（cURL）：**
```bash
curl -X POST "http://localhost:8000/v1/predict" \
  -F "file=@cat.jpg" \
  -F "top_k=3"
```

**示例（Python）：**
```python
import requests

url = "http://localhost:8000/v1/predict"
files = {"file": open("cat.jpg", "rb")}
data = {"top_k": 3}

response = requests.post(url, files=files, data=data)
print(response.json())
```

**响应（成功）：**
```json
{
  "predictions": [
    {
      "class_id": 281,
      "class_name": "tabby_cat",
      "probability": 0.95
    },
    {
      "class_id": 282,
      "class_name": "tiger_cat",
      "probability": 0.03
    },
    {
      "class_id": 285,
      "class_name": "Egyptian_cat",
      "probability": 0.01
    }
  ],
  "inference_time_ms": 25,
  "model_version": "resnet18-v1",
  "request_id": "uuid-1234-5678"
}
```

**响应（错误）：**
```json
{
  "detail": "Invalid image format. Supported formats: JPEG, PNG",
  "error_code": "INVALID_INPUT"
}
```

**状态码：**
- 200 OK——预测成功。
- 400 Bad Request——输入无效。
- 413 Payload Too Large——图片文件过大（最大 10MB）。
- 500 Internal Server Error——服务端错误。
- 503 Service Unavailable——模型尚未加载。

---

### 4. 批量预测（TODO）

**端点：** `POST /v1/batch-predict`

**描述：** 在一次请求中对多张图片进行分类。

**请求：**
*Content-Type：* multipart/form-data

**参数：**
- files：图片文件数组。

**示例：**
```bash
curl -X POST "http://localhost:8000/v1/batch-predict" \
  -F "files=@cat1.jpg" \
  -F "files=@cat2.jpg" \
  -F "files=@dog1.jpg"
```

**响应：**
```json
{
  "results": [
    {"filename": "cat1.jpg", "predictions": [...]},
    {"filename": "cat2.jpg", "predictions": [...]},
    {"filename": "dog1.jpg", "predictions": [...]}
  ],
  "total_inference_time_ms": 75
}
```

---

## 错误码

| 错误码 | 描述 | 处理方法 |
|---|---|---|
| `INVALID_INPUT` | 无效请求格式 | 检查请求格式 |
| `FILE_TOO_LARGE` | 文件超过大小限制 | 缩小文件 |
| `UNSUPPORTED_FORMAT` | 不支持的文件格式 | 使用 JPEG 或 PNG |
| `MODEL_NOT_LOADED` | 模型尚未就绪 | 等待后重试 |
| `INFERENCE_FAILED` | 模型推理错误 | 向支持人员报告 |
| `INTERNAL_ERROR` | 服务端错误 | 向支持人员报告 |

---

## 限流

- **开发环境：** 不限制。
- **生产环境：** 每 IP 每分钟 60 次请求（TODO：配置）。

超出限流阈值的响应：
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds.",
  "retry_after": 60
}
```

---

## ImageNet 类别

模型在具有 1,000 个类别的 ImageNet 上训练。参见 [ImageNet 类别标签](https://gist.github.com/yrevar/942d3a0ac09ec9e5eb3a)。

常见类别（原文列举）：
- 281：虎斑猫（tabby cat）。
- 282：虎纹猫（tiger cat）。
- 207–294：多种猫的品种（原文）。
- 151–268：多种狗的品种。
- ……

---

## 交互式 API 文档

访问 /docs 查看 Swagger UI 交互式文档：
```
http://localhost:8000/docs
```

访问 /redoc 查看 ReDoc 文档：
```
http://localhost:8000/redoc
```

---

## 客户端库

### Python

```python
# TODO: Create Python client library
```

### JavaScript

```javascript
// TODO: Create JavaScript client library
```

---

## 更新日志

### v1.0.0（2025-10-15）
- 首次发布。
- 图像分类端点。
- 健康检查及指标。

### 后续版本
- v1.1.0：批量预测。
- v1.2.0：视频分类。
- v1.3.0：模型版本管理与 A/B 测试。

> 译注：原文的 ImageNet 猫类别范围不准确；207–294 包含狗及其他动物类别，并非都是猫。应以实际模型的类别映射为准。尚标注 TODO 的功能不代表已经实现。
