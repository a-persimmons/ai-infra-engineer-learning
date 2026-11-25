# 练习 10：GPU 共享策略（MIG、MPS、时间切片）

**时长：** 2.5 小时
**难度：** 中级以上
**前置条件：** 带 GPU 与 NVIDIA Device Plugin 的 Kubernetes 集群

## 目标

在 Kubernetes 中配置 NVIDIA 的三种 GPU 共享策略——Multi-Instance GPU（MIG）、Multi-Process Service（MPS）与时间切片，并通过真实工作负载（并发 iris-api 推理与小型训练任务）分析其取舍。

## 为什么重要

团队的 GPU 账单通常随 GPU 数量近似线性增长。共享策略可以将一块价值约 2 万美元的 H100 划分为七个较小的逻辑 GPU，供开发工作负载使用。错误配置（例如在生产中运行 MPS，使各任务互相干扰）可能引发实际事故。

## 背景

| 策略 | 隔离 | 调度 | 最佳适用场景 |
|---|---|---|---|
| **MIG** | 硬件级（计算与显存） | 静态分区 | 多租户、生产、受监管场景 |
| **MPS** | 进程级（共享 SM 与显存） | 协作式 | 单团队多进程推理 |
| **时间切片** | 无独立硬件隔离（轮询） | 抢占式 | 开发、测试、临时工作负载 |

## 要求

对每种策略演示：
1. 集群侧配置（Device Plugin 配置）。
2. 请求分区或共享资源的 Pod spec。
3. 在共享 GPU 上运行的工作负载。
4. 干扰测量（第二个工作负载对第一个的影响）。

## 分步操作

### 策略 1——MIG（45 分钟）

**前置条件：** Ampere+ 数据中心 GPU（A100/A30/H100/H200）。

#### 启用 MIG 模式并创建实例（宿主端）：
```bash
sudo nvidia-smi -mig 1                       # enable MIG mode
sudo nvidia-smi mig -cgi 1g.5gb,1g.5gb,2g.10gb -C   # create instances
nvidia-smi mig -lgi                          # list
```

#### Device Plugin 配置：
```yaml
# nvidia-device-plugin config
sharing:
  mig:
    strategy: mixed       # exposes 1g.5gb, 2g.10gb, etc. as separate resources
```

#### 请求 MIG 实例的 Pod：
```yaml
resources:
  limits: { "nvidia.com/mig-1g.5gb": 1 }
```

#### 验证隔离：
在同一物理 GPU 的不同 MIG 实例上运行两个 Pod。在其中一个运行触发 OOM 的任务，验证另一个不受影响。

### 策略 2——MPS（45 分钟）

#### 在 Device Plugin 中启用 MPS：
```yaml
sharing:
  mps:
    replicas: 4           # one GPU appears as 4 to the scheduler
```

#### 请求共享 GPU 份额的 Pod：
```yaml
resources:
  limits: { "nvidia.com/gpu": 1 }    # gets 1/4 of the actual GPU
```

#### 在一块 GPU 上并发运行四个推理 Pod。
测量各 Pod 吞吐量并与单 Pod 基线比较；原文预期合计吞吐量为完全独立运行时吞吐量之和的约 70–80%。

#### 演示干扰：
在一个 Pod 中运行显存密集型训练任务，观察其他 Pod 的推理延迟峰值。**MPS 不提供 MIG 式硬件显存隔离。**

### 策略 3——时间切片（30 分钟）

#### 在 Device Plugin 中启用：
```yaml
sharing:
  timeSlicing:
    resources:
      - name: nvidia.com/gpu
        replicas: 4
```

#### Pod 仍按此前方式请求 GPU；节点现在显示四倍的逻辑 GPU 数量。

#### 并发运行四个任务。观察：
- 每个任务看到完整 GPU 显存，没有独立分区。
- 竞争资源时任务互相干扰明显；每个任务吞吐量约为独占时的 25%。
- 单个 Pod 的显存泄漏可能影响整个 GPU 上的任务。

## 比较

在各共享策略与基线（独占 GPU）下运行相同推理工作负载（iris-api，100 req/s）。记录：
- 每个 Pod 的 p50/p95 延迟。
- 每个 Pod 的 GPU 显存使用量。
- 单个 Pod 出现异常时的故障模式。

## 交付物

1. 三种可用配置。
2. `COMPARISON.md`：实测数据与干扰观察表格。
3. `RECOMMENDATIONS.md`：每种策略的适用时机。

## 验证

- [ ] MIG：一个 Pod 的 OOM 不影响另一 MIG 分片上的 Pod。
- [ ] MPS：四个 Pod 的合计吞吐量至少为单 Pod 基线的两倍。
- [ ] 时间切片：四个 Pod 调度至一块 GPU，延迟退化但没有崩溃。

## 拓展目标

- 添加由 Helm 管理的 **GPU Operator**，实现面向生产环境的安装。
- 使用 **DCGM** 监控共享 GPU 上的进程级使用情况。
- 组合 MIG 与 MPS：在小型 MIG 分片上运行 MPS，为多个小型推理副本提供服务。

## 常见陷阱

- **启用或禁用 MIG 模式可能需要 GPU 重置或重启**——不是通用的热切换操作。安排停机窗口。
- **MPS 留下运行中的守护进程**——Pod 崩溃后，应检查并清理遗留状态，否则后续 Pod 可能受到影响。
- **生产中使用时间切片**——原文强烈不推荐。一个异常租户可能影响整个 GPU。
- **显存计算**——MIG 严格划分显存；MPS 和时间切片共享物理资源。不要申请超过可隔离范围的资源。

## 参考答案

engineer-solutions 仓库中的参考清单。

> 译注：MIG 模式切换是否需要重启取决于 GPU 架构；MPS 可配置显存和计算份额，但不等同于 MIG 的硬件隔离。Kubernetes Device Plugin 中的 MPS 与 MIG 组合也受版本及支持范围限制。
