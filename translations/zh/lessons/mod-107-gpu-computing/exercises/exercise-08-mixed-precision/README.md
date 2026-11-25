# 练习 08：混合精度训练基准测试

**时长：** 2 小时
**难度：** 中级
**前置条件：** 练习 03 与 07

## 目标

对相同训练工作负载，跨多个批大小测试 fp32、fp16（AMP）、bf16 与 TF32。生成建议矩阵，说明不同条件（GPU 世代、模型架构、数值稳定性要求）下应使用何种精度。

## 为什么重要

混合精度在现代 GPU 上可以使训练吞吐量提升至两至三倍。错误选择（例如 Pascal GPU 上的 fp16 或 Volta 上的 bf16）可能直到你发现训练速度比同事慢一倍时才显现。了解原因可以帮助你正确解读 NVIDIA 的性能宣传材料。

## 要求

实现一个改变以下变量的基准测试：
- 精度：fp32、fp16（AMP）、bf16（AMP）、TF32。
- 批大小：32、128、512。
- 模型：ResNet-50（视觉）与小型 Transformer Encoder（语言）。

每种组合报告：
- 吞吐量（images/sec 或 tokens/sec）。
- 峰值显存（GB）。
- 单步延迟（ms）。
- 固定步数后的最终 Loss（验证数值收敛）。

为每个模型生成原文要求的 6×3 结果表格，并附建议段落。

## 分步操作

### 步骤 1——精度开关（30 分钟）
```python
def train_step_fp32(model, opt, loss_fn, xb, yb):
    out = model(xb)
    loss = loss_fn(out, yb)
    loss.backward()
    opt.step(); opt.zero_grad()
    return loss.item()

def train_step_amp(model, opt, scaler, loss_fn, xb, yb, dtype=torch.float16):
    with torch.amp.autocast("cuda", dtype=dtype):
        loss = loss_fn(model(xb), yb)
    scaler.scale(loss).backward()
    scaler.step(opt); scaler.update(); opt.zero_grad()
    return loss.item()
```

对于 TF32（原文所述 Ampere+ 默认设置）：`torch.backends.cuda.matmul.allow_tf32 = True; torch.backends.cudnn.allow_tf32 = True`。无需改动模型代码；以 fp32 运行，内部矩阵乘法使用 TF32。

### 步骤 2——ResNet 基准测试（45 分钟）
```python
from torchvision.models import resnet50
import time

def bench(precision, batch_size, steps=50):
    model = resnet50(num_classes=1000).cuda().train()
    opt = torch.optim.SGD(model.parameters(), lr=0.1)
    scaler = torch.amp.GradScaler("cuda") if precision == torch.float16 else None
    loss_fn = torch.nn.CrossEntropyLoss()
    
    x = torch.randn(batch_size, 3, 224, 224, device="cuda")
    y = torch.randint(0, 1000, (batch_size,), device="cuda")
    
    # warm
    for _ in range(5):
        train_step_amp(model, opt, scaler, loss_fn, x, y, dtype=precision) if scaler else train_step_fp32(...)
        torch.cuda.synchronize()
    
    torch.cuda.reset_peak_memory_stats()
    t0 = time.perf_counter()
    for _ in range(steps):
        train_step_...
        torch.cuda.synchronize()
    elapsed = time.perf_counter() - t0
    
    return {
        "throughput_im_per_s": batch_size * steps / elapsed,
        "ms_per_step":         elapsed / steps * 1000,
        "peak_gb":             torch.cuda.max_memory_allocated() / 1e9,
    }
```

### 步骤 3——Transformer 基准测试（30 分钟）
替换为小型 Transformer（例如六层 Encoder、512 维、八个 Head）。使用合成 token ID。

### 步骤 4——数值收敛（15 分钟）
对于每种精度，固定随机种子训练 100 步，报告最终 Loss。原文预期 ResNet 在 CIFAR 上的差异约在 0.01 以内；Transformer 使用 fp16 时可能略有偏离（可改用 bf16）。

### 步骤 5——汇总结果（15 分钟）
生成 CSV 与 Markdown 表格。在报告中标记 GPU 世代（V100、A100、H100、RTX 30/40 系列等）。

## 交付物

1. 可运行的基准测试 `bench_precision.py`。
2. `RESULTS.md`，包含各模型及各 GPU 的 6×3 表格。
3. `RECOMMENDATIONS.md`（「何时使用哪种精度」），至少包含：
   - 三项推荐做法。
   - 三项不推荐做法。
   - 每类 GPU 的建议。

## 验证

- [ ] 在 Ampere+ 上，两个模型均能使用四种精度训练而不出现 NaN。
- [ ] 在 Ampere+ Tensor Core GPU 上，fp16 / bf16 吞吐量至少为 fp32 的 1.5 倍。
- [ ] fp16/bf16 峰值显存不超过 fp32 的 60%。
- [ ] 对 Ampere 上矩阵乘法密集的工作负载，TF32 无需修改模型代码便实现约 1.5 倍加速，并且没有显著准确率退化。

## 拓展目标

- 为 H100 添加 **fp8**（需要 Transformer Engine）。
- 添加多 GPU 下的 **NCCL AllReduce 精度**比较。
- 分析 **Kernel 选择**：不同精度下 cuDNN 选择了哪些 CUDA Kernel？使用 `CUDNN_LOGINFO_DBG=1`。

## 常见陷阱

- **fp16 在最初几步出现 NaN**——GradScaler 初始缩放因子通常为 65536；检测到非有限梯度时会降低缩放值并跳过更新。原文建议容忍前 10 步，但仍需排查持续 NaN。
- **不支持 bf16**——Volta（V100）、Pascal 等缺少原生 bf16 加速；`torch.amp.autocast("cuda", dtype=torch.bfloat16)` 可能报错或无法获得预期加速。
- **小批次下 AMP 没有帮助**——Kernel 启动开销占主导；需要适当的批大小才能看到加速收益。
- **TF32 引入小幅精度差异**——对机器学习训练通常可接受，但对高精度科学计算不一定适用。

## 参考答案

engineer-solutions 仓库中的参考实现包含数类 GPU 的预生成结果。

> 译注：四种精度与三种批大小实际上形成 12 种组合，原文的 6×3 表格要求存在不一致。TF32 默认开关也随 PyTorch 版本变化。
