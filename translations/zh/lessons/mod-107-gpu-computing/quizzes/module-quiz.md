# 模块 07：GPU 计算与分布式训练 — 测验

## 说明

- 25 道选择题和简答题
- 通过标准：80%（答对 20/25）
- 时间限制：45 分钟
- 开卷（可参考课程材料）

---

## 选择题（1–20）

### 第 1 题：GPU 架构
**GPU 与 CPU 的哪项主要架构差异使 GPU 适合机器学习？**

A) GPU 时钟频率更高
B) GPU 拥有数千个针对并行运算优化的较简单核心
C) GPU 缓存更大
D) GPU 分支预测更好

<details>
<summary>答案</summary>
B) GPU 拥有数千个针对并行运算优化的较简单核心。
</details>

---

### 第 2 题：CUDA Core 与 Tensor Core
**对于深度学习，Tensor Core 相较 CUDA Core 的主要优势是什么？**

A) 更高时钟频率
B) 更大内存带宽
C) 加速混合精度矩阵乘加运算
D) 更好地支持整数运算

<details>
<summary>答案</summary>
C) 加速混合精度矩阵乘加运算（FP16 最高可达 8 倍加速）。
</details>

---

### 第 3 题：内存层次
**哪种 GPU 内存访问速度最快？**

A) 全局内存（显存）
B) 共享内存
C) 寄存器
D) L2 缓存

<details>
<summary>答案</summary>
C) 寄存器（约 1 个时钟周期延迟）。
</details>

---

### 第 4 题：Warp 分歧
**一个 Warp 包含多少个以 SIMT 方式共同执行的线程？**

A) 8
B) 16
C) 32
D) 64

<details>
<summary>答案</summary>
C) 32 个线程。
</details>

---

### 第 5 题：混合精度训练
**与 FP32 相比，FP16 混合精度训练的典型内存缩减比例是多少？**

A) 1.5 倍
B) 2 倍
C) 4 倍
D) 8 倍

<details>
<summary>答案</summary>
B) 2 倍（FP16 每参数 2 字节，FP32 为 4 字节）。
</details>

---

### 第 6 题：DP 与 DDP
**关于 DataParallel（DP）和 DistributedDataParallel（DDP），哪项正确？**

A) DP 比 DDP 更快
B) DP 使用多进程，DDP 使用单进程
C) DDP 存在 GPU 0 瓶颈，DP 不存在
D) DDP 更快并使用多进程

<details>
<summary>答案</summary>
D) DDP 更快，使用多进程（避免 GIL 争用和 GPU 0 瓶颈）。
</details>

---

### 第 7 题：AllReduce
**分布式训练中的 AllReduce 执行什么操作？**

A) 从 rank 0 向其他 rank 发送数据
B) 合并所有 rank 的值并将结果分发给全部 rank
C) 将所有 rank 的数据收集至 rank 0
D) 将 rank 0 数据分散至其他 rank

<details>
<summary>答案</summary>
B) 合并所有 rank 的值（例如求和、平均）并将结果分发给所有 rank。
</details>

---

### 第 8 题：数据并行
**数据并行中，在各 GPU 上复制的是什么？**

A) 数据
B) 模型
C) 优化器
D) 损失函数

<details>
<summary>答案</summary>
B) 复制模型，数据分割到各 GPU。
</details>

---

### 第 9 题：模型并行
**什么时候需要模型并行而不是数据并行？**

A) 希望训练更快时
B) 模型太大，无法放入单个 GPU 时
C) 数据集很大时
D) 希望精度更高时

<details>
<summary>答案</summary>
B) 模型太大，无法放入单 GPU 显存。
</details>

---

### 第 10 题：梯度检查点
**梯度检查点的内存与速度权衡是什么？**

A) 更多内存，更快训练
B) 更少内存，更快训练
C) 更多内存，更慢训练
D) 更少内存，更慢训练

<details>
<summary>答案</summary>
D) 更少内存（保存约 √N 而不是 N 个激活），更慢训练（重计算使训练约慢 33%）。
</details>

---

### 第 11 题：Ring AllReduce
**Ring AllReduce 的通信复杂度（每 GPU 带宽）是多少？**

A) O(N)，N 是 GPU 数量
B) O(N²)
C) O(log N)
D) O(1)，常数

<details>
<summary>答案</summary>
D) O(1)：每 GPU 的带宽需求不随 GPU 数量线性增长，因此扩展性较好。
</details>

---

### 第 12 题：流水线并行
**流水线并行的主要开销或低效率来源是什么？**

A) 通信开销
B) 内存碎片
C) 开始与结束时的流水线气泡
D) 梯度同步

<details>
<summary>答案</summary>
C) 流水线气泡：每批次开始与结束时，部分 GPU 闲置。
</details>

---

### 第 13 题：ZeRO Stage 3
**DeepSpeed ZeRO Stage 3 在 GPU 之间分片哪些内容？**

A) 仅优化器状态
B) 优化器状态和梯度
C) 优化器状态、梯度和模型参数
D) 仅模型参数

<details>
<summary>答案</summary>
C) 优化器状态、梯度和模型参数（最大程度节省内存）。
</details>

---

### 第 14 题：Flash Attention
**相较标准注意力，Flash Attention 的内存复杂度是多少？**

A) O(N²)，与标准相同
B) O(N log N)
C) O(N)
D) O(√N)

<details>
<summary>答案</summary>
C) O(N)：避免显式构造 O(N²) 的注意力矩阵。
</details>

---

### 第 15 题：GPU 利用率
**GPU 利用率持续低于 50% 时，最可能的瓶颈是什么？**

A) GPU 计算太慢
B) 数据加载或 CPU 预处理
C) GPU 显存不足
D) 网络带宽

<details>
<summary>答案</summary>
B) 数据加载或 CPU 预处理（GPU 等待数据）。
</details>

---

### 第 16 题：训练内存
**含 M 个参数的模型使用 FP32 和 Adam 训练时，不计激活值约需多少内存？**

A) M 字节
B) 2M 字节
C) 4M 字节
D) 16M 字节

<details>
<summary>答案</summary>
D) 约 16M 字节：4M 参数 + 4M 梯度 + 8M Adam 状态（一阶矩和二阶矩）。
</details>

---

### 第 17 题：页锁定内存
**PyTorch DataLoader 使用 pinned memory 的主要好处是什么？**

A) 更快的 CPU 处理
B) 更大批次
C) 更快的 CPU 到 GPU 内存传输
D) 更低内存占用

<details>
<summary>答案</summary>
C) 更快的 CPU 到 GPU 内存传输（DMA 可带来约 2–3 倍加速）。
</details>

---

### 第 18 题：DistributedSampler
**DDP 训练为何需要 DistributedSampler？**

A) 确保各 GPU 处理不同样本
B) 增大批次
C) 加速数据加载
D) 降低内存使用

<details>
<summary>答案</summary>
A) 确保各 GPU 处理不同的数据样本（避免重叠）。
</details>

---

### 第 19 题：梯度累积
**batch_size=16、accumulation_steps=4、world_size=8 时，有效批次大小是多少？**

A) 16
B) 64
C) 128
D) 512

<details>
<summary>答案</summary>
D) 512（16 × 4 × 8 = 512）。
</details>

---

### 第 20 题：张量并行
**张量并行按列分割权重时，计算后需要什么操作？**

A) AllReduce（求和）
B) 拼接
C) 广播
D) 散发

<details>
<summary>答案</summary>
B) 拼接：每个 GPU 计算部分列，再拼接结果。
</details>

---

## 简答题（21–25）

### 第 21 题：GPU 内存构成
**列出训练期间占用 GPU 内存的 4 个主要组成部分，并给出各自近似大小（假设 M 个参数）。**

<details>
<summary>答案</summary>

1. 模型参数：M × 4 字节（FP32）= 4M 字节
2. 梯度：M × 4 字节 = 4M 字节
3. 优化器状态（Adam）：M × 8 字节 = 8M 字节（一阶矩和二阶矩）
4. 激活值：随批次大小和序列长度变化（可能是最大部分）

总计：约 16M + 激活值。
</details>

---

### 第 22 题：性能分析流程
**描述诊断训练任务 GPU 利用率低于 50% 的步骤。**

<details>
<summary>答案</summary>

1. 使用 `nvidia-smi` 等工具监控 GPU 利用率
2. 分析数据加载时间和计算时间
3. 检查批次大小（过小导致利用率低）
4. 使用 PyTorch Profiler 或 Nsight Systems 分析
5. 查找 CPU-GPU 同步点（.item()、.cpu()）
6. 检查 DataLoader 配置（num_workers、pin_memory）
7. 确认没有过多磁盘 I/O 或预处理
8. 显存允许时尝试增大批次

关键：低于 50% 的 GPU 利用率通常提示数据加载瓶颈，而非计算瓶颈。
</details>

---

### 第 23 题：DDP 配置
**编写 PyTorch 中配置 DistributedDataParallel 模型的最小代码，包含进程组初始化和模型包装。**

<details>
<summary>答案</summary>

```python
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

# Initialize process group
def setup(rank, world_size):
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'
    dist.init_process_group("nccl", rank=rank, world_size=world_size)

# Setup
setup(rank, world_size)

# Create model and move to GPU
model = MyModel().to(rank)

# Wrap with DDP
ddp_model = DDP(model, device_ids=[rank])

# Use ddp_model for training
# ...

# Cleanup
dist.destroy_process_group()
```
</details>

---

### 第 24 题：内存优化技术
**列举 5 种减少训练期间 GPU 内存占用的技术，并简述各自原理。**

<details>
<summary>答案</summary>

1. **混合精度（FP16/BF16）**：使用 16 位浮点数替代 32 位（约减半）。
2. **梯度检查点**：反向传播时重计算激活值，而不是全部保存（约 √N 内存）。
3. **梯度累积**：通过较小的物理批次模拟较大批次。
4. **减小批次**：较小批次占用较少激活内存。
5. **ZeRO 优化器**：跨 GPU 分片优化器状态、梯度、参数。

额外方法：
- Flash Attention：注意力内存 O(N) 而非 O(N²)
- CPU Offloading：将暂时不用的层移至 CPU
- 模型并行：跨 GPU 切分模型
</details>

---

### 第 25 题：扩展效率
**解释分布式训练中的强扩展和弱扩展。深度学习中哪种更常用，为什么？**

<details>
<summary>答案</summary>

**强扩展（Strong Scaling）：**
- 总工作量固定
- 更多 GPU 更快处理同一数据集
- 示例：1 GPU 处理 1000 样本 vs 4 GPU 处理 1000 样本
- 理想：4 GPU 实现 4 倍加速
- 问题：通信开销限制扩展

**弱扩展（Weak Scaling）：**
- 每 GPU 工作量固定
- 更多 GPU 意味着更大的总批次
- 示例：每 GPU 1000 样本 × N GPU
- 理想：不论 GPU 数量，耗时相同
- 保持 GPU 效率

**深度学习中更常用：弱扩展。**

原因：
- 保持较好的 GPU 利用率
- 合理调整学习率时，更大的批次可能改善收敛
- 避免通信成为瓶颈
- 更符合实际训练扩展方式

权衡：有效批次增大后，可能需要调整学习率。
</details>

---

## 评分指南

- **答对 20–25 题**：优秀，充分理解 GPU 计算与分布式训练
- **答对 16–19 题**：良好，复习薄弱主题
- **答对 12–15 题**：原文列为通过，复习课程后再尝试
- **少于 12 题**：重做之前请复习全部课程

> 译注：原文此处通过等级与开头 80% 通过标准不一致；建议以开头标准为准。性能与显存节省数字是原文的示例估计，具体取决于模型、硬件和实现。Ring AllReduce 单卡数据量约为 2(N−1)/N 倍消息大小，但通信步骤随 N 增长。DistributedSampler 在补齐样本时也可能出现重复。

---

## 下一步

通过测验后：
1. 完成模块 07 实践练习
2. 实现一个小型分布式训练项目
3. 进入模块 08：监控与可观测性

---

**祝你顺利！**
