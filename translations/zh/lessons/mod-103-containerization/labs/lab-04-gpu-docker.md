# 实验 04：运行带 PyTorch CUDA 的 GPU 容器

**时长：** 60 分钟  **前置条件：** 一台配备 NVIDIA GPU 且已安装 NVIDIA Container Toolkit 的机器。

## 目标

在能够使用宿主机 NVIDIA GPU 的 Docker 容器中运行 PyTorch 推理工作负载。验证 CUDA 设备可见性并运行简单基准测试。

## 步骤

### 1. 验证宿主机 GPU 访问
```bash
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```
两条命令都应列出 GPU。如果第二条失败，请安装 NVIDIA Container Toolkit。

### 2. PyTorch CUDA Dockerfile
```dockerfile
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime
WORKDIR /app
COPY app.py .
CMD ["python", "app.py"]
```

### 3. 示例 app.py
```python
import time, torch
print("cuda available:", torch.cuda.is_available())
print("device count:", torch.cuda.device_count())
print("device name:", torch.cuda.get_device_name(0))

# Tiny benchmark
x = torch.randn(4096, 4096, device="cuda")
torch.cuda.synchronize()
t0 = time.perf_counter()
for _ in range(50):
    x = x @ x
torch.cuda.synchronize()
print(f"50x 4096x4096 matmul: {time.perf_counter()-t0:.3f}s")
```

### 4. 构建并使用 GPU 运行
```bash
docker build -t torch-gpu .
docker run --rm --gpus all torch-gpu
```

### 5. 限制 GPU 访问
```bash
docker run --rm --gpus '"device=0"' torch-gpu              # specific GPU
docker run --rm --gpus '"device=0,1"' torch-gpu            # multiple
docker run --rm --gpus 'count=1,capabilities=compute,utility' torch-gpu
```

## 验证
- [ ] 容器内 `torch.cuda.is_available()` 返回 True。
- [ ] 基准测试完成（RTX 30 系列及以上的矩阵乘法通常少于 2 秒）。
- [ ] 不带 `--gpus all` 运行时回退至 CPU，速度明显变慢（移除该参数进行验证）。

## 清理
```bash
docker rmi torch-gpu
```

## 故障排查
- **`could not select device driver "" with capabilities: [[gpu]]`** — 未安装 NVIDIA Container Toolkit，或安装后未重启 Docker 守护进程。
- **CUDA OOM** — 使容器镜像中的 CUDA 主版本与宿主机驱动匹配（`nvidia-smi` 显示支持的最高 CUDA 版本）。
- **Windows 上的 WSL2** — 使用 WSL2 内核 5.10.43+ 和 Docker Desktop 的 GPU 集成功能。

> 译注：原文将 CUDA OOM 与版本兼容性关联；显存不足通常还需检查模型大小、批大小以及显存占用。
