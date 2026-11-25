# 第 02 课：面向机器学习应用的 Dockerfile

**时长：** 5 小时
**目标：** 为机器学习应用编写面向生产环境的 Dockerfile。

## 学习目标

完成本课后，你将能够：

1. 理解 Dockerfile 语法与指令。
2. 为机器学习工作负载选择适当的基础镜像。
3. 在容器中安装机器学习框架（PyTorch、TensorFlow）。
4. 将应用代码和模型文件复制至镜像。
5. 配置机器学习服务的入口点与命令。
6. 高效处理 Python 依赖。
7. 为 PyTorch 应用编写第一个 Dockerfile。

## Dockerfile 简介

**Dockerfile** 是包含 Docker 镜像构建指令的文本文件。可以将其理解为一份配方：

```dockerfile
# Recipe for a Docker image
FROM python:3.11-slim          # Start with this base
RUN apt-get update             # Run these commands
COPY app.py /app/              # Copy these files
CMD ["python", "app.py"]       # Run this when container starts
```

运行 `docker build` 时，Docker 按顺序执行指令，生成相应的构建层与元数据。这些步骤可以利用缓存，使后续构建更快。

## Dockerfile 指令

### FROM：选择基础镜像

Dockerfile 的构建阶段通过 `FROM` 指定基础镜像：

```dockerfile
# Official Python image
FROM python:3.11-slim

# NVIDIA CUDA image for GPU support
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Pre-built PyTorch image
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
```

**选择合适的基础镜像：**
- **python:3.11-slim：** 小型 Python 镜像（原文约 50MB），适合 CPU 工作负载。
- **python:3.11：** 完整 Python 镜像（原文约 300MB），包含更多工具。
- **nvidia/cuda：** 为 GPU 工作负载提供 CUDA 支持。
- **pytorch/pytorch：** 预装 PyTorch，相关标签包含 CUDA。

### RUN：执行命令

`RUN` 在镜像构建期间执行命令：

```dockerfile
# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    transformers==4.35.0 \
    fastapi==0.104.1
```

**最佳实践：**
- 使用 `&&` 连接相关命令，减少镜像层。
- 清理软件包缓存（`rm -rf /var/lib/apt/lists/*`）。
- 使用 pip 的 `--no-cache-dir` 节省镜像空间。

### WORKDIR：设置工作目录

`WORKDIR` 为后续指令设置工作目录：

```dockerfile
WORKDIR /app

# Now all commands run in /app
COPY model.py .           # Copies to /app/model.py
RUN python setup.py       # Runs in /app
```

### COPY 与 ADD：复制文件

`COPY` 将构建上下文中的文件复制至镜像：

```dockerfile
# Copy a single file
COPY requirements.txt /app/

# Copy entire directory
COPY ./src /app/src

# Copy model weights (be careful with large files!)
COPY models/resnet50.pth /app/models/
```

**COPY 与 ADD：**
- 简单文件复制使用 COPY。
- ADD 可以解压特定归档文件及下载 URL；不需要这些功能时优先使用 COPY。

### ENV：设置环境变量

`ENV` 设置环境变量：

```dockerfile
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CUDA_VISIBLE_DEVICES=0 \
    MODEL_PATH=/app/models/model.pth
```

**常见机器学习环境变量：**
- `PYTHONUNBUFFERED=1`：实时查看日志。
- `CUDA_VISIBLE_DEVICES`：控制 CUDA 设备可见性。
- `OMP_NUM_THREADS`：控制 CPU 线程数。
- `TOKENIZERS_PARALLELISM=false`：禁用 Tokenizer 并行以避免相关警告。

### EXPOSE：声明端口

`EXPOSE` 声明容器监听的端口：

```dockerfile
# Document that API runs on port 8000
EXPOSE 8000
```

**注意：** EXPOSE 本身不会发布端口，运行时仍可使用 -p：

```bash
docker run -p 8000:8000 my-ml-app
```

### CMD 与 ENTRYPOINT：容器启动

**CMD** 指定默认命令或参数：

```dockerfile
# Exec form (preferred)
CMD ["python", "app.py"]

# Shell form (avoid - doesn't handle signals properly)
CMD python app.py
```

**ENTRYPOINT** 定义入口可执行程序：

```dockerfile
# Container always runs python
ENTRYPOINT ["python"]

# Default argument (can be overridden)
CMD ["app.py"]

# Running: docker run my-image train.py
# Executes: python train.py
```

**面向机器学习的最佳实践：**
```dockerfile
# Flexible entry point
ENTRYPOINT ["python", "-m"]
CMD ["serve"]

# docker run my-image serve     → python -m serve
# docker run my-image train     → python -m train
```

## 面向机器学习应用的基础镜像

### Python 官方镜像

**python:3.11-slim**（推荐 CPU 工作负载）
```dockerfile
FROM python:3.11-slim
# Size: ~50MB base, ~500MB with ML packages
# Pros: Small, fast builds, official
# Cons: No GPU support, minimal tools
```

**python:3.11**
```dockerfile
FROM python:3.11
# Size: ~300MB base
# Pros: More tools included
# Cons: Larger, unnecessary packages
```

### NVIDIA CUDA 镜像

**用于 GPU 工作负载：**

```dockerfile
# Runtime image (for inference)
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Devel image (for training/compilation)
FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04
```

**理解 CUDA 镜像标签：**
- `12.1.0`：CUDA 版本。
- `cudnn8`：cuDNN 版本（深度学习基础运算库）。
- `runtime` 与 `devel`：runtime 较小，devel 包含编译器等开发工具。
- `ubuntu22.04`：基础操作系统。

**何时使用哪一种：**
- **runtime：** 推理、模型服务（体积较小）。
- **devel：** 需要编译的训练环境、从源码构建（体积较大但工具完整）。

### 框架专用镜像

**PyTorch 官方镜像：**

```dockerfile
# CPU
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

# GPU runtime
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

# GPU development
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-devel
```

**TensorFlow 官方镜像：**

```dockerfile
# CPU
FROM tensorflow/tensorflow:2.15.0

# GPU
FROM tensorflow/tensorflow:2.15.0-gpu
```

**Hugging Face 镜像：**

```dockerfile
FROM huggingface/transformers-pytorch-gpu:latest
```

### 选择基础镜像：决策树

```
Do you need GPU?
├─ No  → python:3.11-slim
└─ Yes → Do you need to compile code?
    ├─ No  → nvidia/cuda:12.1-runtime or pytorch/pytorch:*-runtime
    └─ Yes → nvidia/cuda:12.1-devel or pytorch/pytorch:*-devel
```

## 安装机器学习依赖

### 使用 requirements.txt

**最佳实践：独立的依赖文件。**

```dockerfile
# Copy only requirements first (for caching)
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Then copy code
COPY . /app/
```

**为什么顺序重要：**
- Docker 缓存镜像构建步骤。
- 代码发生变化但依赖未改变时，Docker 可以复用依赖层。
- 加快重新构建速度。

**requirements.txt 示例：**

```txt
# requirements.txt
torch==2.1.0
torchvision==0.16.0
transformers==4.35.0
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
numpy==1.24.3
pillow==10.1.0
```

### 使用 conda（替代方案）

```dockerfile
FROM continuumio/miniconda3

# Copy environment file
COPY environment.yml /tmp/

# Create environment
RUN conda env create -f /tmp/environment.yml

# Activate environment
SHELL ["conda", "run", "-n", "myenv", "/bin/bash", "-c"]

# Run app in conda environment
CMD ["conda", "run", "-n", "myenv", "python", "app.py"]
```

**何时使用 conda：**
- 需要非 Python 依赖（编译后的 C++ 库）。
- 数据科学软件包具有复杂依赖。
- 团队已采用 conda。

**何时使用 pip：**
- 依赖较简单。
- 需要更小的镜像（原文估计 conda 增加 500MB 以上）。
- 希望获得较快的构建速度。

### 安装 PyTorch

**仅 CPU：**

```dockerfile
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    --index-url https://download.pytorch.org/whl/cpu
```

**GPU（CUDA 12.1）：**

```dockerfile
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    --index-url https://download.pytorch.org/whl/cu121
```

**故障排查：版本匹配**

**常见陷阱：** CUDA 版本不匹配。

```dockerfile
# WRONG: CUDA 12.1 base image, PyTorch built for CUDA 11.8
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04
RUN pip install torch  # Defaults to CUDA 11.8!

# CORRECT: Match versions
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04
RUN pip install torch --index-url https://download.pytorch.org/whl/cu121
```

### 安装 TensorFlow

**CPU：**

```dockerfile
RUN pip install --no-cache-dir tensorflow==2.15.0
```

**GPU：**

```dockerfile
# Use TensorFlow's official GPU image
FROM tensorflow/tensorflow:2.15.0-gpu

# Or install manually
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04
RUN pip install --no-cache-dir tensorflow[and-cuda]==2.15.0
```

## 复制代码与模型

### 复制应用代码

```dockerfile
# Create app directory
WORKDIR /app

# Copy source code
COPY src/ /app/src/
COPY configs/ /app/configs/

# Copy entry point
COPY main.py /app/
```

### 处理模型文件

**小模型（低于 100MB）：**

```dockerfile
# Can include in image
COPY models/resnet50.pth /app/models/
```

**大模型（超过 100MB）：**

原文不推荐直接放入镜像，因为会使镜像变大、拉取速度变慢。

**可选方案：**

1. **启动时下载：**

```dockerfile
# startup.sh
#!/bin/bash
if [ ! -f /app/models/model.pth ]; then
    echo "Downloading model..."
    wget https://storage.googleapis.com/my-models/model.pth -O /app/models/model.pth
fi
python main.py
```

2. **作为数据卷挂载：**

```bash
docker run -v /host/models:/app/models my-image
```

3. **使用模型注册中心：**

```python
# app.py - download from MLflow or S3
import mlflow
model = mlflow.pytorch.load_model("models:/my-model/production")
```

### 使用 .dockerignore

创建 .dockerignore 排除不必要的文件：

```
# .dockerignore
**/__pycache__
**/.git
**/.venv
**/.pytest_cache
*.pyc
*.pyo
*.pyd
.DS_Store
.env
*.log
notebooks/
tests/
docs/
data/large_dataset/
```

**收益：**
- 构建更快（减少传输到构建器的数据）。
- 有助于缩小镜像。
- 避免意外复制敏感文件。

> 译注：100MB 是原文经验阈值。模型是否随镜像分发，应综合评估启动速度、网络可用性、不可变发布、镜像缓存及独立模型更新要求。下载或挂载时应验证模型版本与完整性。不要依赖 .dockerignore 作为唯一的密钥保护措施。

## 完整 Dockerfile 示例

### 示例 1：简单的 PyTorch 推理 API

```dockerfile
# Start with Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY models/ ./models/
COPY main.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    MODEL_PATH=/app/models/model.pth

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 示例 2：GPU 加速训练容器

```dockerfile
# CUDA base image with cuDNN
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install Python 3.11
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.11 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

WORKDIR /workspace

# Install PyTorch with CUDA 12.1 support
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    torchvision==0.16.0 \
    --index-url https://download.pytorch.org/whl/cu121

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy training code
COPY train.py .
COPY utils/ ./utils/
COPY configs/ ./configs/

# Set environment variables for GPU
ENV CUDA_VISIBLE_DEVICES=0 \
    PYTHONUNBUFFERED=1 \
    TOKENIZERS_PARALLELISM=false

# Entry point for flexible commands
ENTRYPOINT ["python"]
CMD ["train.py"]
```

### 示例 3：Hugging Face Transformers 模型

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install git (needed for transformers)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app.py .
COPY config.json .

# Create cache directory for models
RUN mkdir -p /app/model_cache

# Environment variables
ENV TRANSFORMERS_CACHE=/app/model_cache \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# Download model at build time (optional)
RUN python -c "from transformers import AutoModel; AutoModel.from_pretrained('bert-base-uncased')"

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 构建及运行镜像

### 构建镜像

```bash
# Build with tag
docker build -t my-ml-app:v1.0 .

# Build with build arguments
docker build --build-arg CUDA_VERSION=12.1 -t my-ml-app:v1.0 .

# Build and view progress
docker build --progress=plain -t my-ml-app:v1.0 .
```

### 运行容器

```bash
# Basic run
docker run my-ml-app:v1.0

# Run with port mapping
docker run -p 8000:8000 my-ml-app:v1.0

# Run with GPU
docker run --gpus all my-ml-app:v1.0

# Run in detached mode
docker run -d -p 8000:8000 --name ml-api my-ml-app:v1.0

# Run with environment variables
docker run -e MODEL_NAME=resnet50 -p 8000:8000 my-ml-app:v1.0

# Run with volume mount
docker run -v $(pwd)/models:/app/models -p 8000:8000 my-ml-app:v1.0
```

## 常见陷阱及解决方案

### 陷阱 1：镜像体积过大

**问题：**
```dockerfile
FROM python:3.11
RUN pip install torch torchvision
# Result: 5GB+ image
```

**解决方案：**
```dockerfile
FROM python:3.11-slim
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
# Result: ~2GB image (we'll optimize further in next lesson)
```

### 陷阱 2：缓存失效

**问题：**
```dockerfile
COPY . /app/                    # Copies everything
RUN pip install -r requirements.txt  # Reinstalls every time code changes
```

**解决方案：**
```dockerfile
COPY requirements.txt /app/
RUN pip install -r requirements.txt  # Cached unless requirements change
COPY . /app/                          # Code changes don't affect pip layer
```

### 陷阱 3：以 Root 用户运行

**问题：**
```dockerfile
# Container runs as root (security risk)
CMD ["python", "app.py"]
```

**解决方案：**
```dockerfile
# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

CMD ["python", "app.py"]
```

### 陷阱 4：缺少健康检查

**问题：**
```dockerfile
# No way to know if service is healthy
CMD ["python", "app.py"]
```

**解决方案：**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

## 动手练习：构建第一个机器学习 Dockerfile

### 目标

为提供 PyTorch 图像分类模型服务的 FastAPI 应用创建 Dockerfile。

### 应用结构
```
ml-api/
├── Dockerfile
├── requirements.txt
├── app.py
├── model.py
└── models/
    └── resnet18.pth
```

### 步骤 1：创建应用文件

**app.py：**
```python
from fastapi import FastAPI, File, UploadFile
from PIL import Image
import torch
from model import ImageClassifier
import io

app = FastAPI()
classifier = ImageClassifier()

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read()))
    result = classifier.predict(image)
    return {"prediction": result}
```

**requirements.txt：**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
torchvision==0.16.0
pillow==10.1.0
python-multipart==0.0.6
```

### 步骤 2：编写 Dockerfile

**TODO：完成此 Dockerfile。**

```dockerfile
# TODO: Choose appropriate base image


# TODO: Set working directory


# TODO: Install system dependencies (if needed)


# TODO: Copy and install Python requirements


# TODO: Copy application code


# TODO: Set environment variables


# TODO: Expose port


# TODO: Add health check


# TODO: Set command to run the application

```

### 步骤 3：构建与测试

```bash
# Build the image
docker build -t ml-api:v1 .

# Run the container
docker run -d -p 8000:8000 --name ml-api ml-api:v1

# Test health endpoint
curl http://localhost:8000/health

# Test prediction (with an image)
curl -X POST -F "file=@test_image.jpg" http://localhost:8000/predict
```

### 成功标准
- [ ] 镜像构建成功。
- [ ] 容器启动时无错误。
- [ ] 健康检查返回 200 OK。
- [ ] 可以通过 API 进行预测。
- [ ] 镜像大小低于 2GB。

## 总结

本课学习了：

1. **Dockerfile 语法**——FROM、RUN、COPY、CMD、ENTRYPOINT 等。
2. **基础镜像**——在 Python、CUDA 与框架专用镜像之间选择。
3. **机器学习依赖**——安装版本匹配的 PyTorch、TensorFlow。
4. **代码管理**——复制代码及处理模型文件。
5. **最佳实践**——镜像层缓存、.dockerignore、非 Root 用户。
6. **构建与运行**——docker build 和 docker run 命令。

**核心要点：**
- 顺序很重要：先安装依赖再复制代码，以利用缓存。
- 尽可能选择精简基础镜像。
- 使用 .dockerignore 排除不必要的文件。
- 确保 CUDA 基础镜像、依赖包及宿主机驱动兼容。
- 避免无条件地将大模型打包至镜像。

## 下一步是什么？

下一课 **03-image-optimization.md** 将学习：
- 使用多阶段构建减少 50–70% 的镜像体积（原文目标）。
- 高级镜像层缓存策略。
- 优化构建时间及运行时。
- 安全扫描与漏洞管理。

---

## 自我检查问题

1. CMD 与 ENTRYPOINT 有什么区别？
2. 为什么应在复制应用代码之前复制 requirements.txt？
3. 何时使用 nvidia/cuda 基础镜像，何时使用 pytorch/pytorch？
4. 如何安装支持 CUDA 12.1 的 PyTorch？
5. 为什么以 Root 用户运行容器存在安全风险？

## 补充资源

- [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/)
- [Dockerfile 编写最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [PyTorch Docker 镜像](https://hub.docker.com/r/pytorch/pytorch)
- [NVIDIA NGC Catalog](https://catalog.ngc.nvidia.com/)

---

**下一课：** [03-image-optimization.md](./03-image-optimization.md)

> 译注：原文代码块、注释与示意图保持不变。镜像体积、框架版本、CUDA 兼容性与安装命令需按目标平台实际验证；并非每条 Dockerfile 指令都会生成新的文件系统层。
