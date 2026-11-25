# 实验 05：使用 `torch.amp` 进行混合精度训练

**时长：** 45 分钟  **前置条件：** 支持 CUDA 的 PyTorch、Volta 或更新架构 GPU。

## 目标

将 fp32 训练循环改为混合精度（fp16/bf16）训练，测量加速比和显存节省量。

## 步骤

### 1. 基准 fp32 训练循环
```python
import time, torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

device = torch.device("cuda")
X = torch.randn(50_000, 1024); y = torch.randint(0, 10, (50_000,))
loader = DataLoader(TensorDataset(X, y), batch_size=512, num_workers=2, pin_memory=True)

model = nn.Sequential(nn.Linear(1024, 2048), nn.ReLU(), nn.Linear(2048, 10)).to(device)
opt = torch.optim.Adam(model.parameters())
loss_fn = nn.CrossEntropyLoss()

def train_one_epoch(amp=False, dtype=None):
    scaler = torch.amp.GradScaler("cuda") if amp and dtype is torch.float16 else None
    t0 = time.perf_counter()
    for xb, yb in loader:
        xb, yb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True)
        opt.zero_grad()
        if amp:
            with torch.amp.autocast("cuda", dtype=dtype):
                loss = loss_fn(model(xb), yb)
            if scaler:
                scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
            else:
                loss.backward(); opt.step()
        else:
            loss_fn(model(xb), yb).backward(); opt.step()
    torch.cuda.synchronize()
    return time.perf_counter() - t0

print(f"fp32: {train_one_epoch():.2f}s peak mem {torch.cuda.max_memory_allocated()/1e9:.2f} GB")
torch.cuda.reset_peak_memory_stats()
print(f"fp16: {train_one_epoch(amp=True, dtype=torch.float16):.2f}s peak mem {torch.cuda.max_memory_allocated()/1e9:.2f} GB")
torch.cuda.reset_peak_memory_stats()
print(f"bf16: {train_one_epoch(amp=True, dtype=torch.bfloat16):.2f}s peak mem {torch.cuda.max_memory_allocated()/1e9:.2f} GB")
```

### 2. 运行并比较

在 Ampere 或更新架构（RTX 30 系列、A100、H100）上的预期结果：

- fp16 比 fp32 快约 1.5–2 倍。
- bf16 与 fp16 速度相近，但数值稳定性更高。
- fp16/bf16 的峰值显存约为 fp32 的 50%。

### 3. 诊断不稳定的 fp16

若使用 fp16 时 loss 变为 NaN，原文建议增大 `GradScaler` 中的 `init_scale`，或切换至 bf16。

> 译注：增大初始缩放值并非通用修复方法，若 NaN 源于溢出，应检查缩放因子、学习率及数值稳定性。

### 4. fp16 权重存储

仅用于推理时：
```python
model_fp16 = model.half().to(device)
```
将模型显存占用减半。

## 验证

- [ ] fp16 每轮训练时间短于 fp32。
- [ ] fp16 峰值显存低于 fp32。
- [ ] 三种精度下 loss 均收敛（没有 NaN）。

## 清理

无。

## 故障排查

- **`RuntimeError: Found dtype Half but expected Float`** — 某个运算不适合 autocast。使用 `with torch.amp.autocast(..., enabled=False)` 包裹该运算。
- **fp16 反而更慢** — 旧 GPU 没有 Tensor Core。Pascal（GTX 10 系列）无法获得相同收益。
- **不支持 bf16** — 原生硬件 bf16 加速需要 Ampere 或更新架构。
