# 实验 02：PyTorch GPU 推理和基准测试

**时长：** 60 分钟  **前置条件：** 已安装支持 CUDA 的 PyTorch。

## 目标

加载真实模型（torchvision 中的 ResNet-50），将其移动至 GPU，并使用合成批次对 CPU 与 GPU 吞吐量进行基准测试。

## 步骤

### 1. 环境设置
```python
import time, torch
from torchvision.models import resnet50, ResNet50_Weights

assert torch.cuda.is_available(), "no GPU"
device = torch.device("cuda")
model = resnet50(weights=ResNet50_Weights.DEFAULT)
model.train(False)   # inference mode (equivalent to .eval())
```

### 2. CPU 基准测试
```python
x = torch.randn(8, 3, 224, 224)
with torch.inference_mode():
    # warm up
    for _ in range(3): model(x)
    t0 = time.perf_counter()
    for _ in range(50): model(x)
    cpu_s = (time.perf_counter() - t0) / 50
print(f"cpu per-batch: {cpu_s*1000:.1f} ms")
```

### 3. GPU 基准测试
```python
model_gpu = model.to(device)
x_gpu = x.to(device)
with torch.inference_mode():
    for _ in range(3): model_gpu(x_gpu); torch.cuda.synchronize()
    t0 = time.perf_counter()
    for _ in range(50): model_gpu(x_gpu); torch.cuda.synchronize()
    gpu_s = (time.perf_counter() - t0) / 50
print(f"gpu per-batch: {gpu_s*1000:.1f} ms   speedup: {cpu_s/gpu_s:.1f}x")
```

### 4. 吞吐量与批大小的关系
```python
for bs in (1, 4, 8, 16, 32, 64):
    x = torch.randn(bs, 3, 224, 224, device=device)
    with torch.inference_mode():
        for _ in range(3): model_gpu(x); torch.cuda.synchronize()
        t0 = time.perf_counter()
        for _ in range(20): model_gpu(x); torch.cuda.synchronize()
        s = (time.perf_counter()-t0)/20
    print(f"bs={bs:3d} per-batch={s*1000:6.1f}ms throughput={bs/s:7.1f} img/s")
```

### 5. 使用 autocast 进行 fp16 推理
```python
with torch.inference_mode(), torch.amp.autocast("cuda", dtype=torch.float16):
    for _ in range(3): model_gpu(x_gpu); torch.cuda.synchronize()
    t0 = time.perf_counter()
    for _ in range(50): model_gpu(x_gpu); torch.cuda.synchronize()
    fp16_s = (time.perf_counter()-t0)/50
print(f"fp16 per-batch: {fp16_s*1000:.1f}ms")
```

### 6. TorchScript / `torch.compile`（PyTorch 2.x）
```python
compiled = torch.compile(model_gpu, mode="reduce-overhead")
# Compare against eager.
```

## 验证

- [ ] 批大小为 8 时，消费级 GPU 相比 CPU 的加速比 ≥5 倍。
- [ ] 随着批大小增加，单张图像延迟下降（直到触及显存限制）。
- [ ] 在 Ampere 或更新架构上，fp16 比 fp32 快 1.5–2 倍。

## 清理

无。

## 故障排查

- **`cuda out of memory`** — 减小批大小。使用 `nvidia-smi` 检查是否有其他进程占用大量显存。
- **fp16 比 fp32 慢** — 可能使用不含 Tensor Core 的 Pascal 时代 GPU。原文指出 fp16 在 Volta 及更新架构上才有优势。
- **`torch.compile` 报错** — 某些运算尚不支持；原文给出的尝试是 `model_compiled = torch.compile(model_gpu, dynamic=True)`，若仍失败可回退至 eager 模式。
