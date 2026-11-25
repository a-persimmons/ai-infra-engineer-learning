# 第 03 课：镜像优化

**时长：** 5 小时
**目标：** 针对体积、构建速度与运行时性能优化 Docker 镜像。

## 学习目标

完成本课后，你将能够：

1. 使用多阶段构建分离构建依赖与运行时依赖。
2. 实现镜像层缓存策略，加快重新构建。
3. 将 ML 镜像从 3GB 以上缩减至 1GB 以下（练习目标）。
4. 编写有效的 .dockerignore 文件。
5. 安全地使用构建参数与 Secret。
6. 在 alpine、slim 和完整基础镜像之间作出选择。
7. 应用安全扫描与漏洞管理。

## 镜像优化为什么重要

### 问题：臃肿的 ML 镜像

未经优化的 ML Docker 镜像很容易达到：
- **3–5GB**：基础 PyTorch/TensorFlow 应用。
- **10–15GB**：包含构建工具与多个框架的镜像。
- **20GB 以上**：包含不必要系统软件包的镜像。

**实际影响（原文示例）：**

| 指标 | 未优化（5GB） | 优化后（500MB） |
|---|---|---|
| 拉取时间（100Mbps） | 约 7 分钟 | 约 40 秒 |
| 构建时间 | 15–20 分钟 | 2–3 分钟 |
| 存储费用（每个镜像） | 0.10–0.20 美元/月 | 0.01–0.02 美元/月 |
| 部署速度 | 慢 | 快 |
| 安全攻击面 | 大（软件包较多） | 小（最少的软件包） |

**对于每天部署 50 次的团队：**
- 未优化：约 6 小时等待时间。
- 优化后：约 30 分钟等待时间。
- **每天节省约 5.5 小时！**

## 多阶段构建

### 概念

多阶段构建在一个 Dockerfile 中使用多个 FROM 语句：

1. **构建阶段：** 安装编译器、构建工具并编译代码。
2. **运行阶段：** 仅复制编译产物与最少的运行时依赖。

**优化前（单阶段）：**
```dockerfile
FROM python:3.11
RUN apt-get update && apt-get install -y \
    gcc g++ make cmake \
    git curl wget
RUN pip install torch torchvision
COPY . /app
# Result: 3.5GB image with build tools still present
```

**优化后（多阶段）：**
```dockerfile
# Stage 1: Build
FROM python:3.11 AS builder
RUN apt-get update && apt-get install -y gcc g++
RUN pip install --user torch torchvision

# Stage 2: Runtime
FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
COPY . /app
# Result: 1.2GB image without build tools
```

### 基础多阶段构建示例

```dockerfile
# ========================================
# Stage 1: Build dependencies
# ========================================
FROM python:3.11 AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python packages to user directory
RUN pip install --user --no-cache-dir -r requirements.txt

# ========================================
# Stage 2: Runtime image
# ========================================
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY src/ ./src/
COPY main.py .

# Set environment
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "main.py"]
```

**体积比较：**
- 单阶段：约 2.8GB。
- 多阶段：约 1.1GB。
- **节省 60%。**

### 进阶多阶段构建：从源码编译

针对需要编译的软件包：

```dockerfile
# ========================================
# Stage 1: Compile dependencies
# ========================================
FROM python:3.11 AS compiler

WORKDIR /build

# Install compilers and build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone and build custom library
RUN git clone https://github.com/example/custom-ml-lib.git && \
    cd custom-ml-lib && \
    mkdir build && cd build && \
    cmake .. && make -j$(nproc) && make install

# ========================================
# Stage 2: Python dependencies
# ========================================
FROM python:3.11 AS python-builder

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ========================================
# Stage 3: Final runtime
# ========================================
FROM python:3.11-slim

# Copy compiled library
COPY --from=compiler /usr/local/lib /usr/local/lib

# Copy Python packages
COPY --from=python-builder /root/.local /root/.local

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

ENV PATH=/root/.local/bin:$PATH \
    LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

CMD ["python", "main.py"]
```

### GPU 镜像的多阶段构建

```dockerfile
# ========================================
# Build stage with CUDA development tools
# ========================================
FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04 AS builder

# Install Python and build tools
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Install PyTorch with CUDA
COPY requirements.txt .
RUN pip3 install --user --no-cache-dir \
    torch==2.1.0 \
    --index-url https://download.pytorch.org/whl/cu121

RUN pip3 install --user --no-cache-dir -r requirements.txt

# ========================================
# Runtime stage with CUDA runtime only
# ========================================
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install Python (no dev packages)
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

WORKDIR /app
COPY . /app

ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

CMD ["python3.11", "main.py"]
```

**体积比较：**
- devel 基础镜像：8.2GB。
- runtime 基础镜像：4.1GB。
- **节省 50%。**

## 镜像层缓存策略

### 理解 Docker 镜像层缓存

Docker 缓存每一层。在以下情况下，某层缓存可能失效：

1. 指令发生变化。
2. 指令复制的文件发生变化。
3. 前面的镜像层失效。

**示例：**
```dockerfile
FROM python:3.11-slim                  # Layer 1 (cached)
COPY requirements.txt .                # Layer 2 (cached if file unchanged)
RUN pip install -r requirements.txt    # Layer 3 (cached if Layer 2 cached)
COPY . /app                            # Layer 4 (invalidated if ANY file changes)
```

### 优化规则：按照变化频率排列

**错误做法（频繁使缓存失效）：**
```dockerfile
FROM python:3.11-slim
COPY . /app                           # Changes often
RUN pip install -r requirements.txt   # Reinstalls every time!
```

**正确做法（高效缓存）：**
```dockerfile
FROM python:3.11-slim
COPY requirements.txt .               # Changes rarely
RUN pip install -r requirements.txt   # Cached!
COPY . /app                           # Changes often (but doesn't affect pip)
```

### 按变化频率拆分依赖

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 1. System dependencies (change rarely)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Python core dependencies (change occasionally)
COPY requirements-core.txt .
RUN pip install --no-cache-dir -r requirements-core.txt

# 3. Python dev dependencies (change more frequently)
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# 4. Application code (changes frequently)
COPY src/ ./src/
COPY main.py .

CMD ["python", "main.py"]
```

### 使用通配符复制特定文件

```dockerfile
# Copy only Python files (ignore other changes)
COPY src/*.py ./src/

# Copy configuration files
COPY *.json *.yaml ./

# Copy model files separately
COPY models/*.pth ./models/
```

### 缓存挂载（BuildKit）

使用 BuildKit 缓存挂载保存软件包缓存：

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.11-slim

# Mount pip cache during build
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch torchvision

# Subsequent builds reuse downloaded packages!
```

**启用 BuildKit：**
```bash
export DOCKER_BUILDKIT=1
docker build -t my-image .
```

## 缩小镜像体积

### 技术 1：使用 Slim/Alpine 基础镜像

**基础镜像比较：**

| 镜像 | 大小 | 优点 | 缺点 |
|---|---|---|---|
| python:3.11 | 1GB | 包含完整工具 | 体积较大 |
| python:3.11-slim | 130MB | 平衡较好 | 缺少部分工具 |
| python:3.11-alpine | 50MB | 非常小 | 编译兼容问题、构建较慢 |

**针对 ML 工作负载：**
- **使用 slim：** 对 ML 软件包而言通常是较好的折中。
- **谨慎使用 alpine：** 许多 ML 库可能难以编译，或存在性能问题。

```dockerfile
# Good for ML
FROM python:3.11-slim

# Problematic for ML (compilation issues)
FROM python:3.11-alpine
```

### 技术 2：使用完毕后移除构建依赖

```dockerfile
FROM python:3.11-slim

# Install build deps, use them, remove them in ONE layer
RUN apt-get update && apt-get install -y \
    gcc g++ \
    && pip install --no-cache-dir some-package-requiring-compilation \
    && apt-get purge -y gcc g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*
```

**为什么在同一个 RUN 指令中完成？**
- 每个 RUN 创建一个镜像层。
- 镜像层逐层叠加（在后续层删除文件不会缩小前面的层）。

**错误做法（不会缩小体积）：**
```dockerfile
RUN apt-get install gcc g++     # Layer 1: +200MB
RUN pip install package          # Layer 2: +50MB
RUN apt-get remove gcc g++       # Layer 3: +0MB (but Layer 1 still exists!)
# Total: 250MB
```

**正确做法（实际缩小体积）：**
```dockerfile
RUN apt-get install gcc g++ && \
    pip install package && \
    apt-get remove gcc g++       # Layer 1: +50MB
# Total: 50MB
```

### 技术 3：清理软件包缓存

```dockerfile
FROM ubuntu:22.04

# Clean apt cache
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*  # Remove apt cache

# Clean pip cache
RUN pip install --no-cache-dir torch  # --no-cache-dir prevents caching

# Clean conda cache (if using conda)
RUN conda install numpy && \
    conda clean -afy
```

### 技术 4：使用 .dockerignore

创建 .dockerignore，从构建上下文中排除文件：

```
# .dockerignore

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
*.so
.venv/
venv/
ENV/

# Data
data/
datasets/
*.csv
*.parquet

# Models (if not needed in image)
models/*.pth
models/*.h5
*.onnx

# Development
.git/
.gitignore
.vscode/
.idea/
*.md
LICENSE
Dockerfile
docker-compose.yml

# Tests
tests/
test_*.py
*_test.py

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Notebooks
*.ipynb
.ipynb_checkpoints/

# Large files
*.zip
*.tar.gz
*.pkl
```

**影响：**
- 构建更快（发送给 Docker 构建器的数据更少）。
- 镜像更小（避免意外复制大型文件）。
- 安全性更好（避免复制 .env 和凭据）。

### 技术 5：只安装需要的内容

**错误做法（安装所有内容）：**
```dockerfile
RUN pip install transformers
# Includes: PyTorch, TensorFlow, Flax, JAX, and all dependencies
```

**正确做法（最少依赖）：**
```dockerfile
RUN pip install transformers torch
# Explicit about what you need
```

**检查镜像包含的内容：**
```bash
# See all installed packages
docker run my-image pip list

# Check image layers
docker history my-image

# Dive tool for detailed analysis
dive my-image
```

## 高级优化技术

### 技术 6：Distroless 镜像

Google 的 distroless 镜像只包含应用与运行时所需依赖：

```dockerfile
# Build stage
FROM python:3.11 AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt
COPY . /app

# Runtime with distroless
FROM gcr.io/distroless/python3-debian11

COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

ENV PATH=/root/.local/bin:$PATH
WORKDIR /app

CMD ["main.py"]
```

**优点：**
- 攻击面较小（无 Shell，无软件包管理器）。
- 体积更小。
- 安全性更好。

**缺点：**
- 调试较困难（没有 Shell）。
- 支持特定语言与运行时。

### 技术 7：压缩与合并镜像层（Squashing）

```bash
# Build with compression
docker build --compress -t my-image .

# Squash layers (experimental)
docker build --squash -t my-image .

# Export and import to squash
docker save my-image | docker load
```

**注意：** 合并层可能失去镜像层缓存带来的收益。

### 技术 8：使用 dive 进行静态分析

```bash
# Install dive
wget https://github.com/wagoodman/dive/releases/download/v0.11.0/dive_0.11.0_linux_amd64.deb
sudo apt install ./dive_0.11.0_linux_amd64.deb

# Analyze image
dive my-ml-image:latest
```

**dive 显示：**
- 每层大小。
- 浪费空间。
- 效率评分。
- 层之间的文件变化。

## 构建参数与 Secret

### 构建参数

在构建时传递变量：

```dockerfile
# Define build argument
ARG PYTHON_VERSION=3.11
ARG CUDA_VERSION=12.1

# Use in FROM
FROM python:${PYTHON_VERSION}-slim

# Use in RUN
RUN echo "Building with CUDA ${CUDA_VERSION}"

ARG MODEL_VERSION=v1.0
ENV MODEL_VERSION=${MODEL_VERSION}
```

**使用参数构建：**
```bash
docker build \
    --build-arg PYTHON_VERSION=3.10 \
    --build-arg MODEL_VERSION=v2.0 \
    -t my-image .
```

### Secret 管理

**绝不要这样做：**
```dockerfile
# Secrets baked into image!
ENV AWS_SECRET_KEY=abc123
COPY .env /app/
```

**使用 BuildKit Secret：**
```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.11-slim

# Mount secret during build (not stored in image)
RUN --mount=type=secret,id=pip_token \
    pip install --extra-index-url=https://$(cat /run/secrets/pip_token)@my-pypi.com/simple my-package
```

**使用 Secret 构建：**
```bash
docker build --secret id=pip_token,src=./pip_token.txt -t my-image .
```

## 完整优化示例

### 优化前：未优化的 Dockerfile（5.2GB）

```dockerfile
FROM python:3.11

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    vim \
    wget

COPY . /app
WORKDIR /app

RUN pip install torch torchvision transformers fastapi uvicorn

CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

### 优化后：经过优化的 Dockerfile（680MB）

```dockerfile
# syntax=docker/dockerfile:1

# ========================================
# Build stage
# ========================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements (with caching)
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --no-cache-dir -r requirements.txt

# ========================================
# Runtime stage
# ========================================
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /root/.local /root/.local

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy application (use .dockerignore to exclude unnecessary files)
COPY src/ ./src/
COPY main.py .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Set environment
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**采用的优化措施：**
1. 多阶段构建（Builder + Runtime）。
2. Slim 基础镜像。
3. 最少依赖。
4. BuildKit 缓存挂载。
5. 清理软件包缓存。
6. 非 Root 用户。
7. 健康检查。
8. .dockerignore（外部文件）。
9. 合理的镜像层顺序。

**结果（原文示例）：**
- 大小：5.2GB → 680MB（减少 87%）。
- 构建时间：12 分钟 → 2 分钟（使用缓存）。
- 安全性：更好（非 Root、最少软件包）。

## 测量与比较

### 检查镜像大小

```bash
# List image sizes
docker images

# Detailed layer information
docker history my-image

# Total size with all tags
docker images my-image
```

### 比较优化效果

```bash
# Before optimization
docker build -t my-image:unoptimized -f Dockerfile.old .
docker images my-image:unoptimized

# After optimization
docker build -t my-image:optimized .
docker images my-image:optimized

# Compare
docker history my-image:unoptimized
docker history my-image:optimized
```

## 动手练习：优化臃肿镜像

### 场景

你拥有以下未经优化的 PyTorch NLP 应用 Dockerfile：

```dockerfile
FROM python:3.11

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    vim \
    nano \
    htop \
    tree

COPY . /app
WORKDIR /app

RUN pip install \
    torch==2.1.0 \
    transformers==4.35.0 \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    pandas \
    numpy \
    scikit-learn

CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

**当前大小：** 约 4.8GB。

### 你的任务

优化此 Dockerfile，达到以下要求：
- [ ] 将大小缩减至 1.5GB 以下。
- [ ] 使用多阶段构建。
- [ ] 应用镜像层缓存最佳实践。
- [ ] 添加非 Root 用户。
- [ ] 添加健康检查。
- [ ] 创建 .dockerignore。

**目标：体积减少 70% 以上。**

### 解决方案模板

```dockerfile
# TODO: Implement multi-stage build

# TODO: Build stage


# TODO: Runtime stage


# TODO: Add security and health checks

```

## 常见优化错误

### 错误 1：优化目标不正确

**错误重点：** 删除 5MB 文档。

**正确重点：** 删除 500MB 构建工具。

**优先顺序：**
1. 大型依赖（编译器、开发软件包）。
2. 未使用的系统软件包。
3. 软件包缓存。
4. 最后考虑小规模优化。

### 错误 2：为了体积而破坏功能

不要移除应用需要的软件包！

```bash
# Test thoroughly after optimization
docker run my-image python -c "import torch; print(torch.__version__)"
docker run my-image curl http://localhost:8000/health
```

### 错误 3：为了体积牺牲安全性

**错误做法：** 为节省一个镜像层而使用 Root 运行。

**正确做法：** 即使增加 50MB，也应添加非 Root 用户（原文举例）。

## 总结

本课学习了：

1. **多阶段构建**——分离构建与运行时依赖。
2. **镜像层缓存**——按变化频率排列指令。
3. **缩小体积**——使用 Slim 镜像、清理缓存、移除构建依赖。
4. **.dockerignore**——排除不必要文件。
5. **构建参数**——参数化构建。
6. **Secret**——不要将 Secret 写入镜像。
7. **测量**——使用 docker history 与 dive。

**核心原则：**
- 从满足需求的最小基础镜像开始。
- 通过多阶段构建实现关注点分离。
- 按照从最不常变化到最常变化的顺序排列层。
- 在安装的同一层进行清理。
- 充分利用 .dockerignore。
- 测量并迭代。

**典型结果（原文示例）：**
- **体积：** 3–5GB → 500MB–1GB（减少 70–85%）。
- **构建时间：** 10–15 分钟 → 2–3 分钟（使用缓存）。
- **拉取时间：** 5–7 分钟 → 30–40 秒。

## 下一步

下一课 **04-docker-networking-volumes.md** 将学习：
- Docker 网络模式。
- 容器间通信。
- ML 服务的端口映射。
- 用于持久化数据与模型的数据卷。
- 用于开发的绑定挂载。

---

## 自我检查问题

1. 什么是多阶段构建？何时使用？
2. 为什么应该在复制应用代码之前复制 requirements.txt？
3. python:3.11 与 python:3.11-slim 有什么区别？
4. 如何清理 apt 缓存以缩小镜像？
5. 以下指令有什么问题：`RUN apt install gcc && ... && RUN apt remove gcc`？

## 补充资源

- [多阶段构建文档](https://docs.docker.com/build/building/multi-stage/)
- [BuildKit 文档](https://docs.docker.com/build/buildkit/)
- [dive——镜像分析工具](https://github.com/wagoodman/dive)
- [Distroless 镜像](https://github.com/GoogleContainerTools/distroless)

---

**下一课：** [04-docker-networking-volumes.md](./04-docker-networking-volumes.md)

> 译注：体积、时间与费用数字为原文示例，并非实测保证。镜像压缩后传输大小可能不同于本地解压大小。多阶段构建需要确保运行时仍包含必要的动态库及兼容 ABI；BuildKit Secret 不应被复制到镜像或输出到日志。镜像精简不能替代漏洞扫描与运行时安全策略。保留全部原始代码块和其中英文注释。
