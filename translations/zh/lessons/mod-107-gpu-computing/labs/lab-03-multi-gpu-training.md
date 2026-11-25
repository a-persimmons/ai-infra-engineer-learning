# 实验 03：使用 DistributedDataParallel 进行多 GPU 训练

**时长：** 90 分钟  **前置条件：** 具有至少两块 GPU 的机器或多 GPU 云实例。

## 目标

使用 PyTorch DistributedDataParallel，在单节点的多块 GPU 上训练小型模型，观察各 GPU 的梯度同步与近似线性的扩展效果。

## 步骤

### 1. 训练脚本
```python
# train_ddp.py
import os, time, torch, torch.distributed as dist
import torch.nn as nn
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler, TensorDataset

def main():
    dist.init_process_group(backend="nccl")
    local_rank = int(os.environ["LOCAL_RANK"])
    torch.cuda.set_device(local_rank)
    device = torch.device(f"cuda:{local_rank}")

    # synthetic dataset
    N = 1_000_000
    X = torch.randn(N, 128)
    y = torch.randint(0, 10, (N,))
    ds = TensorDataset(X, y)
    sampler = DistributedSampler(ds)
    loader = DataLoader(ds, batch_size=4096, sampler=sampler, num_workers=4, pin_memory=True)

    model = nn.Sequential(nn.Linear(128, 256), nn.ReLU(), nn.Linear(256, 10)).to(device)
    model = DDP(model, device_ids=[local_rank])
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()

    for epoch in range(3):
        sampler.set_epoch(epoch)
        t0 = time.perf_counter()
        for xb, yb in loader:
            xb, yb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True)
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
        if local_rank == 0:
            print(f"epoch {epoch} took {time.perf_counter()-t0:.1f}s")

    dist.destroy_process_group()

if __name__ == "__main__":
    main()
```

### 2. 使用 torchrun 启动
```bash
torchrun --standalone --nproc-per-node=2 train_ddp.py
# Or for 4 GPUs: --nproc-per-node=4
```

### 3. 用于比较的单 GPU 基准

禁用 DDP，只在 `cuda:0` 上运行。比较每轮训练时间。

### 4. 观察 NCCL 通信
```bash
NCCL_DEBUG=INFO torchrun --standalone --nproc-per-node=2 train_ddp.py 2>&1 | grep -i 'nccl' | head
```

### 5. 使用 `nvidia-smi dmon` 检查

在另一个终端中执行：
```bash
nvidia-smi dmon -i 0,1 -s pucvmet -c 30
```
观察训练期间各 GPU 的利用率与显存使用情况。

## 验证

- [ ] 训练期间两块（或全部）GPU 均显示非零利用率。
- [ ] N 块 GPU 的每轮训练时间约为单 GPU 的 1/N（另计少量 NCCL 开销）。
- [ ] `loss` 随训练轮数增加而下降。

## 清理

无。

## 故障排查

- **`Address already in use`** — 上次运行遗留了主进程端口。等待或修改 `--master-port`。
- **NCCL 卡住** — 检查 GPU 间连通性；`nvidia-smi topo -m` 显示 NVLink/PCIe 拓扑。
- **没有扩展收益** — DataLoader 成为瓶颈；增加 `num_workers` 或使用 `pin_memory=True`。
- **`each process gets 100% of data`** — 忘记使用 `DistributedSampler`，每个 rank 都读取完整数据集。
