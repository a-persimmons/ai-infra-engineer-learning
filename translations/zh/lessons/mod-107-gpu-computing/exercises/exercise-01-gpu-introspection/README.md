# 练习 01：GPU 自省与首次 CUDA 运算

**时长：** 2 小时
**难度：** 入门进阶
**前置条件：** NVIDIA GPU、CUDA Toolkit，已安装 PyTorch

## 目标

构建一个 `gpu-info` CLI，检查宿主机上的每块 GPU（计算能力、显存、NVLink 拓扑、MIG 状态、当前利用率），运行基线张量基准测试，仅在 GPU 健康时返回退出码 0。完成后，你将拥有一个可以加入任意节点启动脚本的工具。

## 为什么重要

许多 GPU 生产问题属于「GPU 配置错误」或「连接了错误的 GPU」——这些问题应在启动时发现，而非首次推理时。一个约 50 行的自省脚本可以帮助消除此类问题。

## 要求

CLI 必须：
1. 列出每块 GPU 的名称、计算能力、总显存与空闲显存、驱动版本。
2. 检测 GPU 对之间是否存在 NVLink。
3. 检测 MIG 配置（分区、GPU Instance ID）。
4. 在每块 GPU 上执行 2048×2048 矩阵乘法，报告 TFLOPS。
5. 执行显存带宽测试（设备到设备的 memcpy），报告 GB/s。
6. 将实测 TFLOPS 与芯片理论峰值比较，低于 50% 时发出警告。
7. 退出码：0（健康）、1（性能退化）、2（无 GPU 或不可用）。

## 分步操作

### 步骤 1——通过 pynvml 盘点（30 分钟）
```python
import pynvml
pynvml.nvmlInit()
n = pynvml.nvmlDeviceGetCount()
for i in range(n):
    h = pynvml.nvmlDeviceGetHandleByIndex(i)
    name = pynvml.nvmlDeviceGetName(h)
    mem = pynvml.nvmlDeviceGetMemoryInfo(h)
    util = pynvml.nvmlDeviceGetUtilizationRates(h)
    print(f"[{i}] {name}: {mem.free/1e9:.1f}/{mem.total/1e9:.1f}GB free, util={util.gpu}%")
```

### 步骤 2——NVLink 拓扑（15 分钟）
```python
links = pynvml.nvmlDeviceGetTopologyCommonAncestor(h1, h2)
# 0=PIX (same socket), 1=NV1..NV12 (NVLink), 6=PHB (peer host bridge), etc.
```

### 步骤 3——MIG 检测（15 分钟）
```python
mig_mode = pynvml.nvmlDeviceGetMigMode(h)   # (current, pending)
if mig_mode[0] == pynvml.NVML_DEVICE_MIG_ENABLE:
    for j in range(pynvml.nvmlDeviceGetMaxMigDeviceCount(h)):
        instance = pynvml.nvmlDeviceGetMigDeviceHandleByIndex(h, j)
        ...
```

### 步骤 4——矩阵乘法基准测试（30 分钟）
```python
import torch, time
def matmul_tflops(device, n=2048, repeat=50):
    a = torch.randn(n, n, device=device)
    b = torch.randn(n, n, device=device)
    # warm
    for _ in range(5): torch.matmul(a, b); torch.cuda.synchronize(device)
    t0 = time.perf_counter()
    for _ in range(repeat): torch.matmul(a, b); torch.cuda.synchronize(device)
    elapsed = time.perf_counter() - t0
    flops = 2 * n**3 * repeat
    return flops / elapsed / 1e12
```

### 步骤 5——带宽基准测试（15 分钟）
```python
def bandwidth_gbs(device, size_mb=512):
    n = size_mb * 1024 * 256          # 4-byte floats
    src = torch.randn(n, device=device); dst = torch.empty_like(src)
    for _ in range(3): dst.copy_(src); torch.cuda.synchronize(device)
    t0 = time.perf_counter()
    for _ in range(10): dst.copy_(src); torch.cuda.synchronize(device)
    elapsed = time.perf_counter() - t0
    return (src.element_size() * src.numel() * 10) / elapsed / 1e9
```

### 步骤 6——峰值比较（15 分钟）
构建各芯片理论 fp32 TFLOPS 的查找表；实测值低于 50% 时标记异常。

### 步骤 7——JSON 输出模式与退出码（15 分钟）
`--json` 输出机器可读内容；默认情况下，性能退化时返回非零退出码。

## 交付物

1. 满足全部七项要求的 `gpu-info` CLI。
2. JSON 输出 Schema 文档。
3. 至少一块真实 GPU 的输出示例。
4. 建议用途：放入 Kubernetes initContainers 或 Slurm prolog 脚本。

## 验证

- [ ] 正确识别你的 GPU。
- [ ] 空闲系统上的 TFLOPS 与厂商规格差异在 30% 以内。
- [ ] 健康 GPU 返回退出码 0。
- [ ] GPU 不可用时返回退出码 2（通过设置 `CUDA_VISIBLE_DEVICES=` 测试）。
- [ ] JSON 模式生成可解析的结构化输出。

## 拓展目标

- 添加 **ECC 错误计数**报告，非零时告警。
- 添加**温度与功耗**以及持续负载监控。
- 构建 Kubernetes **Device Plugin 探针**，依据检查结果返回 Pod Condition。

## 常见陷阱

- **pynvml 未初始化**——始终先调用 `nvmlInit()`，并使用 try/finally 保证调用 `nvmlShutdown()`。
- **CUDA 与 PyTorch 不匹配**——编译所用 CUDA 与已安装驱动不兼容时，`torch.cuda.is_available()` 返回 False。CLI 应明确报告这种情况。
- **基准测试预热很重要**——第一次矩阵乘法触发 CUDA 上下文初始化；不预热时，测得的 TFLOPS 可能只有真实值的十分之一。

> 译注：理论峰值比较必须统一计算精度、TF32/Tensor Core 配置、矩阵大小等条件。NVML 与 CUDA 对设备可见性的处理也可能不同。
