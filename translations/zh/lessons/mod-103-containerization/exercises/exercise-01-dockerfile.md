# 练习 01：构建你的第一个机器学习 Dockerfile

**预计时间：** 2–3 小时
**难度：** 入门
**前置条件：** 已安装 Docker，具备 Python 基础知识

## 目标

为提供简单机器学习模型服务的 FastAPI 应用创建 Dockerfile（使用 ResNet 实现图像分类）。

## 学习目标

- 编写面向生产环境的 Dockerfile。
- 正确安装机器学习依赖。
- 妥善处理模型文件。
- 测试容器化应用。

## 项目结构

创建以下结构：

```
ml-api-exercise/
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── app.py
├── model.py
└── README.md
```

## 步骤 1：创建应用文件

**requirements.txt：**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
torchvision==0.16.0
pillow==10.1.0
python-multipart==0.0.6
pydantic==2.5.0
```

**model.py：**
```python
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet18, ResNet18_Weights
from PIL import Image
import io

class ImageClassifier:
    def __init__(self):
        # Load pre-trained ResNet18
        self.model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
        self.model.eval()

        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        # ImageNet class labels
        self.labels = ResNet18_Weights.IMAGENET1K_V1.meta["categories"]

    def predict(self, image_bytes: bytes) -> dict:
        """Predict image class"""
        # Load image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Preprocess
        image_tensor = self.transform(image).unsqueeze(0)

        # Inference
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

        # Get top 5 predictions
        top5_prob, top5_catid = torch.topk(probabilities, 5)

        results = []
        for i in range(5):
            results.append({
                "class": self.labels[top5_catid[i]],
                "probability": float(top5_prob[i])
            })

        return results
```

**app.py：**
```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from model import ImageClassifier
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(title="Image Classification API", version="1.0.0")

# Load model at startup
classifier = None

@app.on_event("startup")
async def startup_event():
    global classifier
    logger.info("Loading model...")
    classifier = ImageClassifier()
    logger.info("Model loaded successfully")

@app.get("/")
async def root():
    return {"message": "Image Classification API", "version": "1.0.0"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model": "resnet18"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Predict image class"""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image
    image_bytes = await file.read()

    # Get prediction
    try:
        results = classifier.predict(image_bytes)
        return {
            "filename": file.filename,
            "predictions": results
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 步骤 2：编写 Dockerfile

**TODO：按照最佳实践完成此 Dockerfile。**

```dockerfile
# TODO: Choose appropriate base image
# Consider: python:3.11-slim for smaller size


# TODO: Set working directory


# TODO: Install system dependencies (if needed)


# TODO: Copy requirements.txt and install Python packages
# Remember: Copy requirements BEFORE code for better caching


# TODO: Copy application code


# TODO: Create non-root user
# Security best practice!


# TODO: Switch to non-root user


# TODO: Set environment variables
# PYTHONUNBUFFERED=1 is recommended


# TODO: Expose port


# TODO: Add health check


# TODO: Set startup command
# Use exec form: CMD ["python", "app.py"]

```

## 步骤 3：创建 .dockerignore

**TODO：创建 .dockerignore 文件。**

```
# Add files/directories to exclude from Docker build
# Examples: __pycache__, .git, *.pyc, .venv, etc.

```

## 步骤 4：构建与测试

```bash
# Build the image
docker build -t ml-api:v1.0 .

# Check image size
docker images ml-api:v1.0

# Run the container
docker run -d -p 8000:8000 --name ml-api ml-api:v1.0

# Check if running
docker ps

# View logs
docker logs ml-api

# Test health endpoint
curl http://localhost:8000/health

# Test prediction (download a test image first)
curl -X POST -F "file=@test_image.jpg" http://localhost:8000/predict

# Stop and remove
docker stop ml-api
docker rm ml-api
```

## 成功标准

你的 Dockerfile 应满足以下要求：

- [ ] 镜像构建成功且没有错误。
- [ ] 镜像大小低于 2GB（最好低于 1GB）。
- [ ] 容器启动并持续运行。
- [ ] 健康检查端点返回 200 OK。
- [ ] 使用测试图片时，预测端点正常工作。
- [ ] 以非 Root 用户运行。
- [ ] 有效利用镜像层缓存（先复制依赖文件，再复制代码）。
- [ ] 包含 .dockerignore 文件。

## 拓展目标

1. **多阶段构建**：进一步缩小镜像体积。
2. **指标端点**：添加 Prometheus 指标。
3. **异步预测**：使用 FastAPI 后台任务。
4. **模型版本管理**：通过环境变量接收模型版本。
5. **Docker Compose**：添加 Redis 缓存预测结果。

## 解题提示

<details>
<summary>点击查看提示</summary>

**基础镜像：**
```dockerfile
FROM python:3.11-slim
```

**非 Root 用户：**
```dockerfile
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser
```

**健康检查：**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

**为健康检查安装 curl：**
```dockerfile
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

</details>

## 提交要求

创建 GitHub 仓库，包含：

1. 完整 Dockerfile。
2. 全部应用文件。
3. README.md，包含：
   - 构建说明。
   - 运行说明。
   - API 使用示例。
   - 最终镜像大小。

## 常见问题与解决方案

**问题：「torch not found」**
- 解决方案：确保复制代码前已经安装 requirements.txt 中的依赖。

**问题：「Permission denied」**
- 解决方案：检查文件是否归 appuser 所有，或使用 --chown 复制文件。

**问题：「Health check failing」**
- 解决方案：确保已安装 curl，或使用 Python 进行健康检查。

**问题：「Image too large (>3GB)」**
- 解决方案：使用 python:3.11-slim 替代 python:3.11，并为 pip 添加 --no-cache-dir。

## 额外挑战

1. **针对 CPU 优化**：安装仅支持 CPU 的 PyTorch，以缩小镜像。
2. **添加日志**：实现结构化 JSON 日志。
3. **环境配置**：通过环境变量配置端口与主机地址。
4. **批量预测**：支持上传多张图片。

---

**下一项练习：** [exercise-02-multi-container.md](./exercise-02-multi-container.md)（多容器 Docker Compose 技术栈）。

**相关实验：** [lab-01-dockerfile-optimization.md](../labs/lab-01-dockerfile-optimization.md)（深入 Dockerfile 优化技术）。

> 译注：镜像大小取决于 PyTorch 构建类型与模型权重。FastAPI BackgroundTasks 适合响应后的后台任务，不等同于提供异步预测结果的完整任务队列。
