# 练习 03：端到端 PyTorch GPU 流水线

**时长：** 3 小时
**难度：** 入门进阶
**前置条件：** 支持 CUDA 的 PyTorch；练习 02

## 目标

针对 CIFAR-10 上的小型 ResNet 构建完整的 GPU 训练流水线：合理配置锁页内存与 Worker 的 DataLoader、AMP 混合精度、梯度累积、学习率调度、检查点。随后构建对应的推理流水线，加载训练完成的模型并进行吞吐量基准测试。

## 为什么重要

这是最小的、接近真实场景的机器学习训练循环。每个真实项目都是在此基础上的扩展。正确实现一次，就能逐步内化这些模式；第二次便能熟练地从记忆中实现。

## 要求

### 训练（train.py）
1. 使用 torchvision 的 ResNet-18 在 CIFAR-10 上训练。
2. DataLoader 使用 pin_memory=True、num_workers ≥ 4、persistent_workers=True。
3. 使用 `torch.amp.autocast("cuda", dtype=torch.float16)` 与 GradScaler 实现 AMP。
4. 梯度累积因子可通过 CLI 配置（测试 1、4、16）。
5. CosineAnnealingLR 调度器。
6. 每个 Epoch 保存检查点，包含模型、优化器、调度器与 Scaler 状态。出于安全考虑，优先使用 **safetensors**，而非直接 torch save。
7. 从 `--resume <ckpt>` 恢复后，后续十步的 Loss 逐位一致（原文目标）。
8. 将每个 Epoch 的指标以 JSON 格式记录至 stdout。

### 推理（infer.py）
9. 加载模型检查点。
10. 在留出的批次上运行。
11. 对批大小 1、16、128 测量吞吐量（images/sec）。
12. 使用 torch.inference_mode()，并在整个推理过程中禁用自动求导。

## 分步操作

### 步骤 1——骨架（15 分钟）
项目结构：
```
cifar-train/
├── train.py
├── infer.py
├── models/      # checkpoints
└── data/        # CIFAR-10 download cache
```

### 步骤 2——DataLoader（30 分钟）
```python
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

train_tf = transforms.Compose([
    transforms.RandomCrop(32, padding=4),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize((0.4914,0.4822,0.4465),(0.2470,0.2435,0.2616)),
])
train_ds = datasets.CIFAR10("data", train=True, download=True, transform=train_tf)
train_loader = DataLoader(train_ds, batch_size=512, shuffle=True,
                          num_workers=4, pin_memory=True, persistent_workers=True,
                          prefetch_factor=4)
```

### 步骤 3——模型、优化器与 Scaler（15 分钟）
```python
import torch
from torchvision.models import resnet18

device = torch.device("cuda")
model = resnet18(num_classes=10).to(device)
opt = torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9, weight_decay=5e-4)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=200)
scaler = torch.amp.GradScaler("cuda")
loss_fn = torch.nn.CrossEntropyLoss()
```

### 步骤 4——带 AMP 与梯度累积的训练循环（45 分钟）
```python
ACCUM = args.accum
for epoch in range(args.epochs):
    model.train()
    t0 = time.perf_counter()
    for step, (xb, yb) in enumerate(train_loader):
        xb = xb.to(device, non_blocking=True); yb = yb.to(device, non_blocking=True)
        with torch.amp.autocast("cuda", dtype=torch.float16):
            loss = loss_fn(model(xb), yb) / ACCUM
        scaler.scale(loss).backward()
        if (step + 1) % ACCUM == 0:
            scaler.step(opt)
            scaler.update()
            opt.zero_grad(set_to_none=True)
    sched.step()
    save_ckpt(epoch, model, opt, sched, scaler)
    log({"epoch": epoch, "loss": loss.item()*ACCUM, "time_s": time.perf_counter()-t0})
```

### 步骤 5——使用 safetensors 保存及恢复检查点（30 分钟）
```python
from safetensors.torch import save_file, load_file
import json

def save_ckpt(epoch, model, opt, sched, scaler, path):
    save_file(model.state_dict(), f"{path}.safetensors")
    # Optimizer/scheduler/scaler state via torch's native serializer
    torch.save({
        "epoch": epoch,
        "opt": opt.state_dict(),
        "sched": sched.state_dict(),
        "scaler": scaler.state_dict(),
    }, f"{path}.aux.pt")

def load_ckpt(path, model, opt, sched, scaler):
    model.load_state_dict(load_file(f"{path}.safetensors"))
    aux = torch.load(f"{path}.aux.pt", weights_only=True)
    opt.load_state_dict(aux["opt"])
    sched.load_state_dict(aux["sched"])
    scaler.load_state_dict(aux["scaler"])
    return aux["epoch"]
```
注意：weights_only=True 可限制加载器中的任意代码执行路径；原文建议对不可信检查点使用这一选项。

### 步骤 6——推理基准测试（30 分钟）
```python
# infer.py
import torch, time
from torchvision.models import resnet18
from safetensors.torch import load_file

model = resnet18(num_classes=10).cuda()
model.load_state_dict(load_file("models/epoch-final.safetensors"))
model.train(False)   # inference mode

for bs in (1, 16, 128):
    x = torch.randn(bs, 3, 32, 32, device="cuda")
    with torch.inference_mode():
        for _ in range(5): model(x); torch.cuda.synchronize()
        t0 = time.perf_counter()
        for _ in range(50): model(x); torch.cuda.synchronize()
        elapsed = time.perf_counter() - t0
    print(f"bs={bs:3d} throughput={bs*50/elapsed:7.0f} img/s lat/img={elapsed/(50*bs)*1000:.2f}ms")
```

### 步骤 7——恢复测试（15 分钟）
训练两个 Epoch，在第一个 Epoch 保存检查点后终止任务。从检查点恢复，验证 Loss 轨迹与未中断运行的结果在数值误差范围内一致。

## 交付物

1. 满足全部 12 项要求的 train.py 与 infer.py。
2. 包含各批大小吞吐量数字的 BENCHMARK.md。
3. 演示 --resume 产生相同的训练轨迹。

## 验证

- [ ] 训练收敛；200 个 Epoch 后最终测试准确率至少 88%（CIFAR-10 ResNet-18 基线目标）。
- [ ] 已启用 AMP——原文建议通过 nvidia-smi 观察 fp16 利用情况验证混合精度。
- [ ] 累积因子为 4 时，与四倍批大小具有相同的有效批大小（通过短时间对比运行验证）。
- [ ] 推理基准测试显示吞吐量随批大小超线性增长（原文目标）。
- [ ] 从检查点恢复后，下一步 Loss 的差异在 1e-3 以内。

## 拓展目标

- 添加 **torch.compile** 并报告加速比。
- 添加多 GPU **DDP**（结合 mod-107 实验 03 的模式）。
- 使用 torch.profiler 实现**逐步性能分析**，生成可通过 chrome://tracing 查看 的 Trace。

## 常见陷阱

- **num_workers=0**——回退至单进程 DataLoader。即使使用 4090，CPU 也可能成为瓶颈。
- **AMP 梯度早期出现 NaN**——初始 GradScaler 缩放因子过高。检测到非有限梯度时，默认机制会降低缩放因子；原文建议在最初约 100 步中让其稳定下来。
- **在 optimizer.step() 之前调用 scheduler.step()**——当前 PyTorch 会发出警告；旧版可能静默产生错误学习率。
- **代理环境中 CIFAR-10 下载失败**——提前手动下载，放置于 data/cifar-10-batches-py/。
- **加载不可信检查点**——对不可信来源使用 torch.load 的 weights_only=True，或优先选择不执行代码的 safetensors。

> 译注：DataLoader 数据准备通常仍运行于 CPU；nvidia-smi 常规利用率指标不能直接证明 FP16 运算已启用，宜使用 profiler。GradScaler 遇到非有限梯度时会跳过优化器更新，而非自动重试该批次。严格恢复需保存随机数与采样器状态并控制非确定性算子；safetensors 主要存储张量，其他状态需采用安全格式独立保存。weights_only=True 不能消除所有恶意文件风险。批量推理加速与准确率目标需实测。
