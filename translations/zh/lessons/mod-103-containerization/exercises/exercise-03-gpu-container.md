# 练习 03：GPU 加速的机器学习容器

**预计时间：** 2–3 小时
**难度：** 中级
**前置条件：** NVIDIA GPU，已安装 NVIDIA Container Toolkit

## 目标

构建并运行 GPU 加速的 PyTorch 训练容器，在 MNIST 数据集上训练简单神经网络。

## 学习目标

- 使用支持 CUDA 的基础镜像。
- 配置容器中的 GPU 访问。
- 在训练期间监控 GPU 使用情况。
- 高效管理 GPU 显存。

## 项目结构

```
gpu-training/
├── Dockerfile
├── requirements.txt
├── train.py
└── README.md
```

## 步骤 1：创建训练脚本

**train.py：**
```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import time

# Simple CNN model
class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 64, 3, 1)
        self.fc1 = nn.Linear(9216, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = torch.max_pool2d(x, 2)
        x = torch.relu(self.conv2(x))
        x = torch.max_pool2d(x, 2)
        x = torch.flatten(x, 1)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def train():
    # Check GPU availability
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Memory Allocated: {torch.cuda.memory_allocated(0) / 1024**2:.2f} MB")

    # Load MNIST dataset
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])

    train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

    # Initialize model
    model = SimpleCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Training loop
    epochs = 5
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        start_time = time.time()

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)

            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

            if batch_idx % 100 == 0:
                print(f'Epoch: {epoch+1}/{epochs}, Batch: {batch_idx}/{len(train_loader)}, Loss: {loss.item():.4f}')

                if torch.cuda.is_available():
                    mem_allocated = torch.cuda.memory_allocated(0) / 1024**2
                    mem_reserved = torch.cuda.memory_reserved(0) / 1024**2
                    print(f'GPU Memory - Allocated: {mem_allocated:.2f} MB, Reserved: {mem_reserved:.2f} MB')

        epoch_time = time.time() - start_time
        avg_loss = total_loss / len(train_loader)
        print(f'Epoch {epoch+1} completed in {epoch_time:.2f}s, Avg Loss: {avg_loss:.4f}')

    # Save model
    torch.save(model.state_dict(), '/models/mnist_cnn.pth')
    print("Model saved to /models/mnist_cnn.pth")

if __name__ == "__main__":
    train()
```

**requirements.txt：**
```txt
torch==2.1.0
torchvision==0.16.0
```

## 步骤 2：创建 Dockerfile

**TODO：完成此支持 GPU 的 Dockerfile。**

```dockerfile
# TODO: Choose CUDA base image
# Recommendation: nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04


# TODO: Install Python 3.11


# TODO: Set working directory


# TODO: Copy requirements and install PyTorch with CUDA support
# Use: --index-url https://download.pytorch.org/whl/cu121


# TODO: Copy training script


# TODO: Create directory for saving models


# TODO: Verify GPU access at build time (optional)
# RUN python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"


# TODO: Set environment variables
# CUDA_VISIBLE_DEVICES, PYTHONUNBUFFERED


# TODO: Set command to run training
# CMD ["python", "train.py"]

```

## 步骤 3：构建与运行

```bash
# Build the image
docker build -t gpu-training:v1.0 .

# Check image size
docker images gpu-training:v1.0

# Run with all GPUs
docker run --rm --gpus all \
    -v $(pwd)/models:/models \
    -v $(pwd)/data:/data \
    gpu-training:v1.0

# Run with specific GPU
docker run --rm --gpus '"device=0"' \
    -v $(pwd)/models:/models \
    -v $(pwd)/data:/data \
    gpu-training:v1.0

# Run and monitor GPU
# Terminal 1: Run training
docker run --rm --gpus all \
    -v $(pwd)/models:/models \
    --name gpu-train \
    gpu-training:v1.0

# Terminal 2: Monitor GPU
watch -n 1 nvidia-smi

# Or use DCGM
docker run --rm --gpus all \
    nvidia/dcgm-exporter:latest
```

## 成功标准

- [ ] 容器能够识别 GPU（CUDA available: True）。
- [ ] 训练在 GPU 而非 CPU 上运行。
- [ ] 训练期间 GPU 利用率高于 70%。
- [ ] 使用 GPU 时，训练在两分钟以内完成。
- [ ] 模型成功保存至数据卷。
- [ ] 没有 CUDA 错误或警告。
- [ ] 镜像大小低于 4GB。

## 拓展目标

1. **多 GPU 训练**：使用 DataParallel 或 DDP。
2. **混合精度**：实现自动混合精度（AMP）。
3. **GPU 监控**：添加自定义 GPU 指标。
4. **显存优化**：实现梯度检查点。
5. **Docker Compose**：添加 TensorBoard 服务。

## 性能比较

分别在 CPU 和 GPU 上执行相同训练：

```bash
# CPU training
docker run --rm \
    -v $(pwd)/models:/models \
    -e CUDA_VISIBLE_DEVICES="" \
    gpu-training:v1.0

# Time: ~10-15 minutes

# GPU training
docker run --rm --gpus all \
    -v $(pwd)/models:/models \
    gpu-training:v1.0

# Time: ~1-2 minutes
# Speedup: 5-10x
```

## 故障排查

**「CUDA not available」：**
```bash
# Verify NVIDIA driver
nvidia-smi

# Verify Container Toolkit
nvidia-ctk --version

# Test GPU in container
docker run --rm --gpus all nvidia/cuda:12.1.0-base nvidia-smi
```

**「CUDA version mismatch」：**
```bash
# Check host CUDA version
nvidia-smi | grep "CUDA Version"

# Use matching PyTorch version
pip install torch --index-url https://download.pytorch.org/whl/cu121
```

**「Out of memory」：**
```python
# Reduce batch size in train.py
batch_size = 32  # Try 16 or 8

# Clear cache
torch.cuda.empty_cache()
```

## 额外挑战

1. **分布式训练**：同时使用两块 GPU 进行训练。
2. **实验追踪**：添加 MLflow。
3. **检查点**：每个 Epoch 结束后保存模型。
4. **提前停止**：当验证损失趋于稳定、不再改善时停止训练。
5. **超参数调优**：使用 Ray Tune。

---

**恭喜！** 你已经完成 Docker 容器化的这些练习。

**下一模块：** [模块 104：Kubernetes](../../mod-104-kubernetes/)。

> 译注：GPU 利用率、训练时间与镜像大小是原文练习目标，不是所有硬件或软件配置下都能实现的保证。MNIST 之类的小规模工作负载可能受数据加载或 Kernel 启动开销限制。
