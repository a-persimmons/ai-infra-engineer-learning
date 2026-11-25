# 第 06 课：模型服务基础

**时长：** 8 小时
**目标：** 理解如何在生产环境中部署机器学习模型并提供服务。

## 导论

模型服务（Model Serving）是使机器学习模型能够在生产环境中接受推理请求的过程。对于机器学习基础设施工程师，这是主要职责之一。

**模型服务为什么重要：**
- 模型只有投入实际使用才能发挥价值。
- 服务阶段的要求与训练阶段存在显著区别。
- 性能、延迟与可靠性至关重要。
- 必须处理真实世界的流量模式。
- 需要监控、版本管理与回滚能力。

本课介绍从简单方案到生产级方案的模型服务基础。

## 什么是模型服务？

```
┌─────────────────────────────────────────────────────────────┐
│                    ML Model Lifecycle                        │
└─────────────────────────────────────────────────────────────┘

Training Phase              Serving Phase
┌─────────────┐            ┌──────────────────────────────┐
│             │            │                              │
│  Training   │            │   Input Data                 │
│  Data       │            │       ↓                      │
│     ↓       │            │   Preprocessing              │
│  Training   │            │       ↓                      │
│  Pipeline   │            │   Model Inference            │
│     ↓       │   ──────►  │       ↓                      │
│  Model      │            │   Post-processing            │
│  (weights)  │            │       ↓                      │
│             │            │   Prediction/Response        │
│             │            │                              │
└─────────────┘            └──────────────────────────────┘

Training: Hours/Days        Serving: Milliseconds
Batch Processing           Real-time Processing
Optimize for Accuracy      Optimize for Latency
Can Retry                  Must Succeed First Try
```

### 训练与服务的主要区别

| 方面 | 训练 | 服务 |
|---|---|---|
| **时间约束** | 数小时或数天 | 毫秒级 |
| **数据量** | 数百万个样本 | 每次一个样本（也可批处理） |
| **计算** | 并行/分布式 | 单次推理 |
| **优化目标** | 准确率 | 延迟与吞吐量 |
| **容错** | 可以重试 | 必须可靠 |
| **扩展** | 水平扩展（更多 GPU） | 水平扩展（更多副本） |
| **成本模式** | 临时性 | 持续性 |

## 模型服务要求

### 1. 性能要求

**延迟（Latency）：** 从请求到响应的时间。
```
Latency Budget Examples:

Real-time Applications:
- Search ranking: < 50ms
- Ad serving: < 20ms
- Fraud detection: < 100ms
- Chatbots: < 500ms

Batch Processing:
- Email spam filtering: < 5 seconds
- Content recommendation: < 1 second
- Image processing: < 2 seconds
```

**吞吐量（Throughput）：** 每秒处理的请求数。
```
Throughput Requirements:

Small Application:     10 req/sec
Medium Application:    100 req/sec
Large Application:     1,000 req/sec
Massive Scale:         10,000+ req/sec
```

**可用性（Availability）：** 服务可用时间占比。
```
Availability Levels:

99% (Two 9s):     ~3.65 days downtime/year
99.9% (Three 9s): ~8.76 hours downtime/year
99.99% (Four 9s): ~52 minutes downtime/year
99.999% (Five 9s): ~5 minutes downtime/year
```

### 2. 功能要求

- **版本管理：** 支持多个模型版本。
- **A/B 测试：** 将流量路由至不同模型。
- **监控：** 追踪预测与性能。
- **日志：** 记录预测的审计轨迹。
- **批处理：** 合并多个请求以提高效率。
- **缓存：** 保存频繁使用的预测结果。
- **回退：** 妥善处理模型故障。

### 3. 运维要求

- **易于部署：** 模型更新简单。
- **回滚：** 从失败部署中快速恢复。
- **可扩展性：** 处理流量峰值。
- **资源效率：** 优化成本。
- **安全：** 保护模型与数据。
- **可观测性：** 理解系统行为。

## 模型服务方案

### 1. 内嵌模型（最简单）

**描述：** 模型在应用代码内部运行。

```python
# Example: Flask app with embedded model
from flask import Flask, request, jsonify
import torch
import torchvision.models as models

app = Flask(__name__)

# Load model at startup
model = models.resnet18(pretrained=True)
model.eval()

@app.route('/predict', methods=['POST'])
def predict():
    # Get image from request
    image = process_image(request.files['image'])

    # Run inference
    with torch.no_grad():
        prediction = model(image)

    return jsonify({'class': get_class_name(prediction)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**优点：**
- 实现简单。
- 不需要额外基础设施。
- 延迟低（没有额外网络调用）。

**缺点：**
- 更新模型需要重启应用（采用朴素加载方式时）。
- 难以独立扩展。
- 没有内置模型版本管理。
- 受编程语言限制（原文以 Python 为例）。

**适用场景：** 原型、简单应用、低流量。

### 2. 模型即服务（微服务）

**描述：** 模型在独立服务中运行。

```
┌──────────────┐       HTTP/gRPC      ┌──────────────┐
│              │  ────────────────►   │              │
│  Application │                      │ Model Service│
│              │  ◄────────────────   │              │
└──────────────┘       Response       └──────────────┘
```

**架构示例：**
```python
# Model Service (FastAPI)
from fastapi import FastAPI, UploadFile
import torch

app = FastAPI()

# Load model
model = load_model("resnet18")

@app.post("/predict")
async def predict(image: UploadFile):
    processed = preprocess(await image.read())
    prediction = model(processed)
    return {"prediction": prediction.tolist()}

# Application calls this service
import httpx

async def get_prediction(image_data):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://model-service:8000/predict",
            files={"image": image_data}
        )
    return response.json()
```

**优点：**
- 独立扩展。
- 更新模型无需修改应用。
- 可以为多个应用提供服务。
- 可以使用不同技术栈。

**缺点：**
- 额外网络延迟。
- 基础设施复杂度更高。
- 需要负载均衡。

**适用场景：** 多个应用使用相同模型，或者需要独立扩展。

### 3. 模型服务框架

**描述：** 使用专门的框架提供生产模型服务。

**常用框架：**

#### TorchServe（PyTorch）

```bash
# Install
pip install torchserve torch-model-archiver

# Create model archive
torch-model-archiver \
  --model-name resnet18 \
  --version 1.0 \
  --model-file model.py \
  --serialized-file resnet18.pth \
  --handler image_classifier

# Start server
torchserve \
  --start \
  --model-store model_store \
  --models resnet18=resnet18.mar

# Make prediction
curl http://localhost:8080/predictions/resnet18 -T image.jpg
```

**特性：**
- 多模型服务。
- 模型版本管理。
- 批量推理。
- 指标（Prometheus）。
- 模型管理 API。
- GPU 支持。

#### TensorFlow Serving

```bash
# Install
apt-get install tensorflow-model-server

# Serve model
tensorflow_model_server \
  --rest_api_port=8501 \
  --model_name=resnet \
  --model_base_path=/models/resnet

# Make prediction
curl -X POST http://localhost:8501/v1/models/resnet:predict \
  -H "Content-Type: application/json" \
  -d '{"instances": [{"input": [...]}]}'
```

**特性：**
- 高性能模型服务。
- gRPC 与 REST API。
- 模型版本管理。
- 批处理。
- GPU 支持。
- 经历过 Google 规模的生产实践。

#### ONNX Runtime

```python
# Convert model to ONNX
import torch.onnx

torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=12
)

# Serve with ONNX Runtime
import onnxruntime as ort

session = ort.InferenceSession("model.onnx")
input_name = session.get_inputs()[0].name

# Run inference
outputs = session.run(None, {input_name: input_data})
```

**特性：**
- 与训练框架解耦。
- 在许多场景下比原生框架推理更快。
- 跨平台。
- 硬件加速。

**优点：**
- 面向生产使用。
- 包含内置最佳实践。
- 性能优化。
- 监控与指标。
- 模型管理。

**缺点：**
- 存在学习曲线。
- 相较自定义方案灵活性较低。
- 部分方案与特定框架绑定。

**适用场景：** 生产部署，需要可靠性及性能。

> 译注：ONNX Runtime 本身主要是推理运行时，并不等同于提供完整 HTTP 服务、监控及模型管理的服务框架。TorchServe 等项目的维护状态应在选型前核对。

### 4. 云机器学习平台

**描述：** 使用云平台的全托管模型服务。

#### AWS SageMaker

```python
import boto3

# Deploy model
sagemaker = boto3.client('sagemaker')

sagemaker.create_model(
    ModelName='my-model',
    PrimaryContainer={
        'Image': 'pytorch-inference:1.12',
        'ModelDataUrl': 's3://bucket/model.tar.gz'
    },
    ExecutionRoleArn='arn:aws:iam::role'
)

sagemaker.create_endpoint(
    EndpointName='my-endpoint',
    EndpointConfigName='my-config'
)

# Make prediction
runtime = boto3.client('sagemaker-runtime')
response = runtime.invoke_endpoint(
    EndpointName='my-endpoint',
    Body=json.dumps(data)
)
```

#### GCP Vertex AI

```python
from google.cloud import aiplatform

# Deploy model
model = aiplatform.Model.upload(
    display_name="my-model",
    artifact_uri="gs://bucket/model",
    serving_container_image_uri="pytorch-prediction-latest"
)

endpoint = model.deploy(
    machine_type="n1-standard-4",
    min_replica_count=1,
    max_replica_count=10
)

# Make prediction
prediction = endpoint.predict(instances=[data])
```

#### Azure ML

```python
from azure.ai.ml import MLClient

# Deploy model
ml_client = MLClient.from_config()

deployment = ml_client.online_deployments.begin_create_or_update(
    deployment_name="my-deployment",
    model="my-model:1",
    instance_type="Standard_DS3_v2",
    instance_count=2
)

# Make prediction
response = ml_client.online_endpoints.invoke(
    endpoint_name="my-endpoint",
    request_file="request.json"
)
```

**优点：**
- 全托管。
- 自动扩缩容。
- 减少底层基础设施管理。
- 集成监控。
- 支持 A/B 测试。

**缺点：**
- 厂商锁定。
- 可能价格较高。
- 控制能力较少。
- 框架限制。

**适用场景：** 希望采用托管方案，有云预算，并且需要快速部署。

## 推理优化技术

### 1. 批量推理

**问题：** 每次处理一个请求效率较低。

**解决方案：** 将多个请求合并成批次。

```python
# Without batching (slow)
for request in requests:
    result = model(request)
    send_response(result)

# With batching (fast)
batch = []
for request in requests:
    batch.append(request)
    if len(batch) >= BATCH_SIZE:
        results = model(batch)
        for result in results:
            send_response(result)
        batch = []
```

**性能影响：**
- 吞吐量可能提高 3–10 倍（原文示例）。
- 取舍：等待批次填满会增加延迟。

**配置：**
```python
BATCH_SIZE = 32  # How many requests to batch
MAX_WAIT_TIME = 50  # Max milliseconds to wait for batch

# Send batch when either:
# 1. Batch is full (batch_size reached)
# 2. Max wait time exceeded
```

### 2. 模型量化

**问题：** 模型体积大、速度慢。

**解决方案：** 降低数值精度（FP32 → INT8）。

```python
# PyTorch quantization
import torch

model = load_model()

# Dynamic quantization (easiest)
quantized_model = torch.quantization.quantize_dynamic(
    model,
    {torch.nn.Linear},
    dtype=torch.qint8
)

# Benefits:
# - 4x smaller model
# - 2-4x faster inference
# - Minimal accuracy loss (<1%)
```

### 3. 模型缓存

**问题：** 相同输入被反复请求。

**解决方案：** 缓存预测结果。

```python
from functools import lru_cache
import hashlib

class CachedModel:
    def __init__(self, model, cache_size=1000):
        self.model = model
        self.cache = {}
        self.cache_size = cache_size

    def predict(self, input_data):
        # Create cache key
        cache_key = hashlib.md5(input_data).hexdigest()

        # Check cache
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Run inference
        result = self.model(input_data)

        # Store in cache
        if len(self.cache) < self.cache_size:
            self.cache[cache_key] = result

        return result
```

**适用时机：**
- 推理成本较高的模型。
- 输入空间有限。
- 读取密集型工作负载。

### 4. 模型预热

**问题：** 首次推理非常缓慢。

**解决方案：** 在启动过程中提前预热模型。

```python
def warm_up_model(model, num_warmup=10):
    """
    Run dummy inferences to warm up model
    """
    dummy_input = torch.randn(1, 3, 224, 224)

    print("Warming up model...")
    for i in range(num_warmup):
        with torch.no_grad():
            _ = model(dummy_input)
    print("Model warmed up!")

# In serving code
model = load_model()
warm_up_model(model)
# Now ready for real requests
```

### 5. 异步处理

**问题：** 阻塞式 I/O 降低服务效率。

**解决方案：** 使用 async/await 模式。

```python
from fastapi import FastAPI
import asyncio

app = FastAPI()

@app.post("/predict")
async def predict(image: UploadFile):
    # Read file asynchronously
    image_data = await image.read()

    # Preprocess asynchronously
    processed = await preprocess_async(image_data)

    # Run inference (CPU-bound, use thread pool)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, model.predict, processed)

    return {"prediction": result}
```

## 部署策略

### 1. 蓝绿部署

```
Initial State (Blue):
Users → Load Balancer → Blue Deployment (v1.0)

Deploy Green:
Users → Load Balancer → Blue Deployment (v1.0)
                      → Green Deployment (v2.0) [testing]

Switch Traffic:
Users → Load Balancer → Green Deployment (v2.0)
        Old Blue (v1.0) [kept for rollback]

Rollback if needed:
Users → Load Balancer → Blue Deployment (v1.0)
```

**优点：**
- 目标为零停机。
- 快速回滚。
- 切换前充分测试。

**缺点：**
- 部署期间需要两倍资源。
- 一次性切换全部流量。

### 2. 金丝雀部署

```
Initial State:
Users → Load Balancer → v1.0 (100%)

Canary (5%):
Users → Load Balancer → v1.0 (95%)
                      → v2.0 (5%)

Increase (50%):
Users → Load Balancer → v1.0 (50%)
                      → v2.0 (50%)

Full Rollout:
Users → Load Balancer → v2.0 (100%)
```

**优点：**
- 逐步发布。
- 尽早发现错误。
- 出现问题时减少影响范围。

**缺点：**
- 发布速度较慢。
- 需要流量路由逻辑。
- 监控更加复杂。

### 3. 影子部署

```
Production:
Users → Load Balancer → v1.0 (serves users)
                      ↓
                    Copy requests
                      ↓
                    v2.0 (shadow, no response to users)
```

**优点：**
- 不直接改变用户收到的响应。
- 使用真实流量测试。
- 比较模型性能。

**缺点：**
- 计算成本可能达到两倍。
- 无法发现全部问题（例如缺少用户实际响应反馈）。

> 译注：影子部署仍可能通过资源竞争、隐私风险或写入副作用影响生产，并非零风险。异步 I/O 也不会自动加速计算密集型推理，需要独立调度及并发控制。

## 监控模型服务

### 关键指标

**基础设施指标：**
```python
# Latency
p50_latency: 45ms   # 50% of requests < 45ms
p95_latency: 120ms  # 95% of requests < 120ms
p99_latency: 300ms  # 99% of requests < 300ms

# Throughput
requests_per_second: 150

# Resource Usage
cpu_usage: 65%
memory_usage: 3.2 GB
gpu_utilization: 80%

# Availability
uptime: 99.95%
error_rate: 0.05%
```

**模型指标：**
```python
# Prediction distribution
class_0: 35%
class_1: 45%
class_2: 20%

# Confidence scores
avg_confidence: 0.87
low_confidence_count: 45 (predictions < 0.5)

# Data drift
input_mean: 0.52 (expected: 0.5)
input_std: 0.31 (expected: 0.3)
```

### 实现监控

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
prediction_count = Counter(
    'model_predictions_total',
    'Total predictions made',
    ['model_version', 'status']
)

prediction_latency = Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency in seconds'
)

model_confidence = Histogram(
    'model_prediction_confidence',
    'Prediction confidence scores'
)

# Use in serving code
@app.post("/predict")
async def predict(image: UploadFile):
    start_time = time.time()

    try:
        # Run inference
        result = await model.predict(image)

        # Record metrics
        prediction_count.labels(
            model_version='v1.0',
            status='success'
        ).inc()

        model_confidence.observe(result['confidence'])

        return result

    except Exception as e:
        prediction_count.labels(
            model_version='v1.0',
            status='error'
        ).inc()
        raise

    finally:
        latency = time.time() - start_time
        prediction_latency.observe(latency)
```

## 实践示例：完整模型服务方案

```python
# production_serving.py
from fastapi import FastAPI, UploadFile, HTTPException
from prometheus_client import make_asgi_app, Counter, Histogram
import torch
import logging
from typing import Dict
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Metrics
predictions = Counter('predictions_total', 'Total predictions', ['status'])
latency = Histogram('prediction_latency_seconds', 'Prediction latency')

# Create app
app = FastAPI(title="ML Model Serving")

# Add Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Global model (loaded once)
MODEL = None

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    global MODEL
    logger.info("Loading model...")
    MODEL = load_and_warmup_model()
    logger.info("Model loaded and ready!")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None
    }

@app.post("/predict")
async def predict(image: UploadFile) -> Dict:
    """Prediction endpoint"""
    start_time = time.time()

    try:
        # Validate input
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "Invalid image type")

        # Process image
        image_data = await image.read()
        processed = preprocess(image_data)

        # Run inference
        with torch.no_grad():
            prediction = MODEL(processed)

        # Post-process
        result = {
            "class": get_class_name(prediction),
            "confidence": float(prediction.max()),
            "latency_ms": (time.time() - start_time) * 1000
        }

        # Record success
        predictions.labels(status='success').inc()

        return result

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        predictions.labels(status='error').inc()
        raise HTTPException(500, str(e))

    finally:
        latency.observe(time.time() - start_time)

def load_and_warmup_model():
    """Load model and warm up"""
    import torchvision.models as models

    # Load model
    model = models.resnet18(pretrained=True)
    model.eval()

    # Warm up
    dummy = torch.randn(1, 3, 224, 224)
    for _ in range(10):
        with torch.no_grad():
            _ = model(dummy)

    return model

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 核心要点

1. **模型服务**是使模型能够在生产环境中进行推理。
2. **关键要求：** 低延迟、高吞吐量、高可用性。
3. **方案：** 内嵌模型、微服务、模型服务框架、云平台。
4. **优化：** 批处理、量化、缓存、预热、异步处理。
5. **部署：** 蓝绿、金丝雀与影子部署策略。
6. **监控：** 追踪延迟、吞吐量、错误与模型指标。
7. **生产推理工具：** TorchServe、TensorFlow Serving、ONNX Runtime。

## 自我检查问题

1. 训练工作负载与服务工作负载有什么区别？
2. 内嵌模型与微服务各有什么优缺点？
3. 批量推理如何改善吞吐量？
4. 什么是量化？它有什么收益？
5. 蓝绿部署与金丝雀部署有什么区别？
6. 模型服务需要监控哪些指标？
7. 何时使用 TorchServe，何时使用简单的 FastAPI 服务？

## 补充资源

- [TorchServe 文档](https://pytorch.org/serve/)
- [TensorFlow Serving 指南](https://www.tensorflow.org/tfx/guide/serving)
- [ONNX Runtime](https://onnxruntime.ai/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [模型服务最佳实践](https://ml-ops.org/content/model-serving)
- [Prometheus 监控](https://prometheus.io/docs/introduction/overview/)

---

**下一课：** [07-docker-basics.md](./07-docker-basics.md)——容器化基础。
