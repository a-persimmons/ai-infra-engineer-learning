# 第 07 课：Docker 中的 GPU 支持

**时长：** 5 小时
**目标：** 在 Docker 容器中运行 GPU 加速的机器学习工作负载。

## 学习目标

完成本课后，你将能够：

1. 安装及配置 NVIDIA Container Toolkit。
2. 运行 GPU 加速容器。
3. 使用支持 CUDA 的基础镜像。
4. 将指定 GPU 分配至容器。
5. 监控容器化工作负载的 GPU 使用情况。
6. 部署多 GPU 训练容器。
7. 排查常见的 GPU 容器问题。

## 为什么使用 GPU 容器？

### 挑战

机器学习训练与推理经常需要 GPU 才能达到可接受的性能。原文给出以下示例：

- **训练：** GPU 相比 CPU 快 100 倍。
- **推理：** 对大型模型快 10–50 倍。
- **成本：** 更具成本效益（执行速度更快可能降低云计算费用）。

**但 GPU 增加了复杂度：**
- CUDA Toolkit 版本必须与驱动兼容。
- 库依赖容易发生冲突。
- GPU 资源需要谨慎分配。
- 环境配置容易出错。

### 解决方案：GPU 容器

支持 GPU 的 Docker 容器有助于解决这些问题：

```
┌──────────────────────────────────────────────┐
│           GPU Container Benefits              │
├──────────────────────────────────────────────┤
│                                               │
│  ✅ Reproducible GPU environments            │
│  ✅ No driver/CUDA version conflicts         │
│  ✅ Easy multi-GPU resource allocation       │
│  ✅ Portable across different machines       │
│  ✅ Isolation between workloads              │
│                                               │
└──────────────────────────────────────────────┘
```

**实际影响（原文示例）：**
- 配置时间：2–3 小时 → 5 分钟。
- 一致性：减少「在我的电脑上能运行」的问题。
- 资源利用率：40% → 80% 以上（改善 GPU 共享）。

## NVIDIA Container Toolkit

### 架构

```
┌────────────────────────────────────────────────┐
│                  Docker Container               │
│  ┌──────────────────────────────────────────┐  │
│  │     ML Application (PyTorch/TF)          │  │
│  │              ↓                            │  │
│  │        CUDA Libraries                     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  NVIDIA Container Toolkit   │
        │    (nvidia-docker2)         │
        └─────────────┬───────────────┘
                      │
        ┌─────────────▼──────────────┐
        │    Docker Engine            │
        └─────────────┬───────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   NVIDIA Driver (Host)      │
        └─────────────┬───────────────┘
                      │
        ┌─────────────▼──────────────┐
        │      GPU Hardware           │
        └─────────────────────────────┘
```

**关键组件：**
1. **NVIDIA 驱动**——安装在宿主机操作系统（例如 525.125.06）。
2. **NVIDIA Container Toolkit**——使 Docker 容器能够访问 GPU。
3. **CUDA 库**——位于容器内部，可以采用不同的兼容版本。

### 安装

**前置条件：**
```bash
# Check if you have NVIDIA GPU
lspci | grep -i nvidia

# Check NVIDIA driver
nvidia-smi
```

**安装 NVIDIA Container Toolkit：**

```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
    sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Configure Docker
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

**验证安装：**

```bash
# Test GPU access in container
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Should show your GPU(s)
```

## 运行 GPU 容器

### 基础 GPU 容器

```bash
# Run with all GPUs
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Run with specific number of GPUs
docker run --rm --gpus 2 nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Run with specific GPU device
docker run --rm --gpus '"device=0"' nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Run with multiple specific GPUs
docker run --rm --gpus '"device=0,2"' nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

### GPU 参数说明

```bash
# All GPUs
--gpus all

# Specific count
--gpus 2

# Specific devices
--gpus '"device=0"'
--gpus '"device=0,1,3"'

# GPU capabilities (for advanced use)
--gpus '"capabilities=compute,utility"'
```

## CUDA 基础镜像

### NVIDIA 官方镜像

**镜像命名规范：**
```
nvidia/cuda:[CUDA_VERSION]-[FLAVOR]-[OS]

Examples:
nvidia/cuda:12.1.0-base-ubuntu22.04
nvidia/cuda:12.1.0-runtime-ubuntu22.04
nvidia/cuda:12.1.0-devel-ubuntu22.04
nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu20.04
```

**镜像变体：**

| 变体 | 大小 | 包含内容 | 使用场景 |
|---|---|---|---|
| **base** | 约 200MB | 基础 CUDA 运行库 | 最小 GPU 访问环境 |
| **runtime** | 约 1.5GB | CUDA 运行库及其他库 | 推理 |
| **devel** | 约 3.5GB | Runtime、编译器、头文件 | 需要编译的训练及源码构建 |
| **cudnn** | 不定 | 额外包含 cuDNN（深度学习库） | 深度学习工作负载 |

### 选择合适的镜像

```
Need to compile CUDA code?
├─ Yes → devel
└─ No  → Do you need cuDNN?
    ├─ Yes → cudnn8-runtime
    └─ No  → runtime
```

**示例：**

```dockerfile
# Inference (lightweight)
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Training (need compilers)
FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04

# Minimal GPU access
FROM nvidia/cuda:12.1.0-base-ubuntu22.04
```

## 构建支持 GPU 的镜像

### PyTorch GPU 镜像

**Dockerfile：**
```dockerfile
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install PyTorch with CUDA 12.1
COPY requirements.txt .
RUN pip3 install --no-cache-dir \
    torch==2.1.0 torchvision==0.16.0 \
    --index-url https://download.pytorch.org/whl/cu121

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . /app

# Verify GPU access
RUN python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"

ENV PYTHONUNBUFFERED=1

CMD ["python3", "train.py"]
```

**构建及运行：**
```bash
# Build
docker build -t pytorch-gpu:v1 .

# Run with GPU
docker run --rm --gpus all pytorch-gpu:v1
```

### TensorFlow GPU 镜像

**Dockerfile：**
```dockerfile
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install TensorFlow with GPU support
RUN pip3 install --no-cache-dir tensorflow[and-cuda]==2.15.0

COPY . /app

# Verify GPU
RUN python3 -c "import tensorflow as tf; print('GPUs:', tf.config.list_physical_devices('GPU'))"

CMD ["python3", "train.py"]
```

### Hugging Face Transformers GPU 镜像

**Dockerfile：**
```dockerfile
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install transformers with PyTorch GPU support
RUN pip3 install --no-cache-dir \
    torch==2.1.0 \
    --index-url https://download.pytorch.org/whl/cu121

RUN pip3 install --no-cache-dir \
    transformers==4.35.0 \
    accelerate \
    bitsandbytes

COPY . /app

CMD ["python3", "inference.py"]
```

## GPU 资源管理

### 限制 GPU 显存

**设置显存限制：**
```bash
# Limit to 4GB
docker run --rm --gpus all \
    -e CUDA_VISIBLE_DEVICES=0 \
    -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:4096 \
    pytorch-gpu:v1
```

**在 Python 代码中：**
```python
import torch

# Limit GPU memory fraction
torch.cuda.set_per_process_memory_fraction(0.5, device=0)  # Use 50% of GPU 0

# Or set memory limit
import os
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512'
```

### 多 GPU 分配

```bash
# Container 1: Use GPU 0
docker run -d --name worker1 --gpus '"device=0"' pytorch-gpu:v1

# Container 2: Use GPU 1
docker run -d --name worker2 --gpus '"device=1"' pytorch-gpu:v1

# Container 3: Use GPUs 2 and 3
docker run -d --name worker3 --gpus '"device=2,3"' pytorch-gpu:v1
```

### GPU 共享（MIG，多实例 GPU）

以 NVIDIA A100/H100 GPU 为例：

```bash
# Enable MIG mode (requires reboot)
sudo nvidia-smi -mig 1

# Create GPU instances
sudo nvidia-smi mig -cgi 9,9,9,9  # 4 instances

# Run container with MIG instance
docker run --rm --gpus '"device=0:0"' pytorch-gpu:v1
```

> 译注：Docker 的 GPU 设备分配通常不等于显存硬隔离。框架的显存限制可能只约束其自身分配器；MIG 能否使用、支持哪些实例规格取决于 GPU 型号、驱动和配置。

## 监控 GPU 使用情况

### 在容器中使用 nvidia-smi

```bash
# Install nvidia-smi in container
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Monitor GPU while container runs
docker run -d --name training --gpus all pytorch-gpu:v1
watch -n 1 nvidia-smi
```

### DCGM（Data Center GPU Manager，数据中心 GPU 管理器）

```bash
# Run DCGM exporter for Prometheus
docker run -d \
    --gpus all \
    --name dcgm-exporter \
    -p 9400:9400 \
    nvidia/dcgm-exporter:latest

# Scrape metrics
curl http://localhost:9400/metrics | grep gpu
```

### 使用 Python 监控

**monitor_gpu.py：**
```python
import torch
import time

def monitor_gpu():
    while True:
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                mem_allocated = torch.cuda.memory_allocated(i) / 1024**3
                mem_reserved = torch.cuda.memory_reserved(i) / 1024**3
                print(f"GPU {i}: Allocated: {mem_allocated:.2f}GB, Reserved: {mem_reserved:.2f}GB")
        time.sleep(5)

if __name__ == "__main__":
    monitor_gpu()
```

## 多 GPU 训练

### 数据并行训练（Data Parallel）

**train.py：**
```python
import torch
import torch.nn as nn
from torch.nn.parallel import DataParallel

# Define model
model = MyModel()

# Use all available GPUs
if torch.cuda.device_count() > 1:
    print(f"Using {torch.cuda.device_count()} GPUs")
    model = DataParallel(model)

model = model.cuda()

# Training loop
for batch in dataloader:
    # Data automatically distributed across GPUs
    outputs = model(batch)
```

**运行：**
```bash
# Use all GPUs
docker run --rm --gpus all \
    -v $(pwd)/data:/data \
    pytorch-gpu:v1 python train.py
```

### 分布式数据并行（DDP）

**Dockerfile：**
```dockerfile
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip3 install --no-cache-dir \
    torch==2.1.0 \
    --index-url https://download.pytorch.org/whl/cu121

COPY . /app

# Use all GPUs with DDP
CMD ["python3", "-m", "torch.distributed.launch", \
     "--nproc_per_node=auto", "train_ddp.py"]
```

## 使用 Docker Compose 配置 GPU

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  # Training job on GPU 0
  trainer-1:
    build: ./trainer
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]
    volumes:
      - training-data:/data
      - model-outputs:/outputs

  # Training job on GPU 1
  trainer-2:
    build: ./trainer
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['1']
              capabilities: [gpu]
    volumes:
      - training-data:/data
      - model-outputs:/outputs

  # Inference service on GPU 2
  inference:
    build: ./inference
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['2']
              capabilities: [gpu]
    ports:
      - "8000:8000"

volumes:
  training-data:
  model-outputs:
```

## 常见 GPU 容器问题

### 问题 1：CUDA 版本不匹配

**错误：**
```
RuntimeError: CUDA version mismatch: PyTorch compiled with 12.1 but running with 11.8
```

**解决方案：**
```dockerfile
# Match CUDA versions
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install PyTorch built for CUDA 12.1
RUN pip install torch --index-url https://download.pytorch.org/whl/cu121
```

### 问题 2：GPU 不可见

**错误：**
```
RuntimeError: CUDA not available
```

**检查清单：**
```bash
# 1. Verify NVIDIA driver on host
nvidia-smi

# 2. Check Container Toolkit installation
nvidia-ctk --version

# 3. Run with --gpus flag
docker run --gpus all ...  # Don't forget this!

# 4. Check container sees GPU
docker run --rm --gpus all nvidia/cuda:12.1.0-base nvidia-smi
```

### 问题 3：显存不足（OOM）

**错误：**
```
RuntimeError: CUDA out of memory
```

**解决方案：**
```python
# 1. Reduce batch size
batch_size = 16  # Try smaller value

# 2. Clear cache
torch.cuda.empty_cache()

# 3. Use gradient accumulation
for i, batch in enumerate(dataloader):
    loss = model(batch)
    loss = loss / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# 4. Use mixed precision
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    outputs = model(inputs)
    loss = criterion(outputs, targets)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

### 问题 4：性能缓慢

**诊断：**
```bash
# Monitor GPU utilization
nvidia-smi dmon -s pucvmet

# Should see high GPU utilization (>80%)
# If low, you have a bottleneck (likely data loading)
```

**解决方案：**
```python
# Use multiple data loading workers
train_loader = DataLoader(
    dataset,
    batch_size=32,
    num_workers=4,  # Parallel data loading
    pin_memory=True  # Faster GPU transfer
)

# Prefetch to GPU
from torch.utils.data import DataLoader
from prefetch_generator import BackgroundGenerator

class DataLoaderX(DataLoader):
    def __iter__(self):
        return BackgroundGenerator(super().__iter__())
```

## 动手练习：GPU 训练流水线

### 目标

使用 Docker 构建完整的 GPU 加速训练流水线。

### 要求

1. 用于训练的多阶段 Dockerfile。
2. 数据预处理容器。
3. 配备 GPU 的训练容器。
4. 模型导出容器。
5. 使用 Docker Compose 进行编排。

### 项目结构

```
gpu-training/
├── docker-compose.yml
├── preprocess/
│   ├── Dockerfile
│   └── preprocess.py
├── train/
│   ├── Dockerfile
│   └── train.py
└── export/
    ├── Dockerfile
    └── export.py
```

### 实现

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  preprocess:
    build: ./preprocess
    volumes:
      - raw-data:/data/raw
      - processed-data:/data/processed
    command: python preprocess.py

  train:
    build: ./train
    depends_on:
      - preprocess
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - processed-data:/data
      - models:/models
    environment:
      - EPOCHS=10
      - BATCH_SIZE=32
    command: python train.py

  export:
    build: ./export
    depends_on:
      - train
    volumes:
      - models:/models
      - artifacts:/artifacts
    command: python export.py

volumes:
  raw-data:
  processed-data:
  models:
  artifacts:
```

**preprocess/Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
RUN pip install --no-cache-dir pandas numpy scikit-learn

COPY preprocess.py .
CMD ["python", "preprocess.py"]
```

**preprocess/preprocess.py：**
```python
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

RAW = Path("/data/raw")
OUT = Path("/data/processed")
OUT.mkdir(parents=True, exist_ok=True)

df = pd.concat(pd.read_csv(p) for p in RAW.glob("*.csv"))
df = df.dropna().drop_duplicates()
train, test = train_test_split(df, test_size=0.2, random_state=42)
train.to_parquet(OUT / "train.parquet")
test.to_parquet(OUT / "test.parquet")
print(f"preprocess: train={len(train)} test={len(test)}")
```

**train/Dockerfile：**
```dockerfile
FROM nvidia/cuda:12.2.0-cudnn8-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip3 install --no-cache-dir torch torchvision pandas pyarrow

COPY train.py .
CMD ["python3", "train.py"]
```

**train/train.py：**
```python
import os
import torch
import torch.nn as nn
import pandas as pd
from pathlib import Path

EPOCHS = int(os.environ.get("EPOCHS", 10))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", 32))
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"train: device={device}")

train = pd.read_parquet("/data/train.parquet")
X = torch.tensor(train.drop(columns=["label"]).values, dtype=torch.float32, device=device)
y = torch.tensor(train["label"].values, dtype=torch.long, device=device)

model = nn.Sequential(
    nn.Linear(X.shape[1], 128), nn.ReLU(),
    nn.Linear(128, int(y.max().item()) + 1),
).to(device)

opt = torch.optim.Adam(model.parameters(), lr=1e-3)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(EPOCHS):
    for i in range(0, len(X), BATCH_SIZE):
        opt.zero_grad()
        out = model(X[i:i + BATCH_SIZE])
        loss = loss_fn(out, y[i:i + BATCH_SIZE])
        loss.backward()
        opt.step()
    print(f"epoch={epoch} loss={loss.item():.4f}")

Path("/models").mkdir(exist_ok=True)
torch.save(model.state_dict(), "/models/model.pt")
```

**export/Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
RUN pip install --no-cache-dir torch onnx

COPY export.py .
CMD ["python", "export.py"]
```

**export/export.py：**
```python
import torch
import torch.nn as nn
from pathlib import Path

# Reconstruct the architecture identically to train.py.
# In production, persist the architecture or use torch.jit.script.
input_dim = 16  # match feature count
num_classes = 10
model = nn.Sequential(
    nn.Linear(input_dim, 128), nn.ReLU(),
    nn.Linear(128, num_classes),
)
model.load_state_dict(torch.load("/models/model.pt", map_location="cpu"))
model.train(False)  # switch to inference mode (equivalent to .eval())

dummy = torch.randn(1, input_dim)
out = Path("/artifacts")
out.mkdir(exist_ok=True)
torch.onnx.export(model, dummy, out / "model.onnx", opset_version=17)
print("export: wrote /artifacts/model.onnx")
```

运行完整流水线：

```bash
docker compose build
docker compose up --abort-on-container-exit
```

train 服务通过 nvidia 驱动请求一块 GPU。使用 `docker compose run train nvidia-smi` 验证容器内 GPU 的可见性。

## 总结

本课学习了：

1. **NVIDIA Container Toolkit**——安装与配置。
2. **GPU 容器**——在 Docker 中运行 CUDA 工作负载。
3. **CUDA 基础镜像**——选择 base、runtime、devel、cudnn 变体。
4. **GPU 分配**——将特定 GPU 分配至容器。
5. **监控**——使用 nvidia-smi、DCGM 获取 GPU 指标。
6. **多 GPU**——数据并行与分布式训练。
7. **故障排查**——常见问题及解决方案。

**核心要点：**
- GPU 容器有助于减少驱动与 CUDA 环境配置冲突。
- 推理使用 runtime 镜像；需要开发或编译工具的训练使用 devel 镜像。
- 监控 GPU 利用率，识别瓶颈。
- 在多 GPU 系统中显式分配 GPU。
- 确保基础镜像与框架的 CUDA 版本兼容。

## 下一步是什么？

下一课 **08-production-best-practices.md** 将学习：
- 容器安全最佳实践。
- 健康检查与重启策略。
- 生产环境日志与监控。
- 资源限制（CPU、内存、GPU）。
- 面向生产环境的 Dockerfile 模板。

---

## 自我检查问题

1. CUDA base、runtime、devel 镜像有什么区别？
2. 如何运行一个只能访问 GPU 2 的容器？
3. 什么原因会导致「CUDA version mismatch」错误？
4. 如何监控运行中容器的 GPU 显存使用量？
5. DataParallel 与 DistributedDataParallel 有什么区别？

## 补充资源

- [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-docker)
- [NVIDIA NGC Catalog](https://catalog.ngc.nvidia.com/)
- [PyTorch Docker 镜像](https://hub.docker.com/r/pytorch/pytorch)
- [CUDA Docker Hub](https://hub.docker.com/r/nvidia/cuda)

---

**下一课：** [08-production-best-practices.md](./08-production-best-practices.md)

> 译注：GPU 加速倍数、显存利用率和镜像大小均为原文示例，实际收益取决于模型、精度、批大小、硬件、数据加载与通信开销。容器无法消除宿主机驱动兼容性要求；训练也不一定需要 devel 镜像。全部原始代码块及内部英文注释保持不变，未逐项执行验证。
