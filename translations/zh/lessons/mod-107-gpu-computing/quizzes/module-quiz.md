# 模块 07：GPU 计算与分布式训练——测验

## 说明

- 共 25 道选择与简答题。
- 及格分数：80%（20/25）。
- 时间限制：45 分钟。
- 开卷（可参考讲义）。

---

## 选择题（1–20）

### 第 1 题：GPU 架构

**GPU 与 CPU 架构的主要区别是什么，使 GPU 适合机器学习？**

A) GPU 时钟频率更高
B) GPU 拥有数千个为并行运算优化的较简单核心
C) GPU 缓存更大
D) GPU 分支预测更好

<details>
<summary>答案</summary>

**B) GPU 拥有数千个为并行运算优化的较简单核心**

GPU 拥有数千个为并行运算优化的较简单核心。

</details>

---

### 第 2 题：CUDA 核心与 Tensor Core

**Tensor Core 相较 CUDA 核心对深度学习的主要优势是什么？**

A) 更高时钟频率
B) 更大内存带宽
C) 加速混合精度矩阵乘加运算
D) 更好的整数运算支持

<details>
<summary>答案</summary>

**C) 加速混合精度矩阵乘加运算**

加速混合精度矩阵乘加运算（原文示例 FP16 最多加速 8 倍）。

</details>

---

### 第 3 题：内存层次

**哪种 GPU 内存访问速度最快？**

A) 全局内存（VRAM）
B) 共享内存
C) 寄存器
D) L2 缓存

<details>
<summary>答案</summary>

**C) 寄存器**

寄存器（约 1 个周期延迟）。

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

**C) 32**

32 个线程。

</details>

---

### 第 5 题：混合精度训练

**FP16 混合精度训练相较 FP32 通常可减少多少内存？**

A) 1.5 倍
B) 2 倍
C) 4 倍
D) 8 倍

<details>
<summary>答案</summary>

**B) 2 倍**

2 倍（每个 FP16 参数占 2 字节，FP32 占 4 字节）。

</details>

---

### 第 6 题：DP 与 DDP

**关于 DataParallel（DP）与 DistributedDataParallel（DDP），哪项正确？**

A) DP 比 DDP 快
B) DP 多进程，DDP 单进程
C) DDP 存在 GPU 0 瓶颈，DP 没有
D) DDP 更快且使用多进程

<details>
<summary>答案</summary>

**D) DDP 更快且使用多进程**

DDP 更快且采用多进程（避免 GIL 竞争和 GPU 0 瓶颈）。

</details>

---

### 第 7 题：AllReduce 操作

**分布式训练中的 AllReduce 有什么作用？**

A) 从 Rank 0 向其余 Rank 发送数据
B) 汇总所有 Rank 的值并将结果分发给所有 Rank
C) 从所有 Rank 收集数据到 Rank 0
D) 从 Rank 0 分散数据至所有 Rank

<details>
<summary>答案</summary>

**B) 汇总所有 Rank 的值并将结果分发给所有 Rank**

汇总所有 Rank 的值（如求和、平均），并将结果分发给所有 Rank。

</details>

---

### 第 8 题：数据并行

**数据并行中跨 GPU 复制的是什么？**

A) 数据
B) 模型
C) 优化器
D) 损失函数

<details>
<summary>答案</summary>

**B) 模型**

复制模型，数据在 GPU 间拆分。

</details>

---

### 第 9 题：模型并行

**什么时候需要模型并行而非数据并行？**

A) 希望更快训练
B) 模型过大，单块 GPU 无法容纳
C) 数据集很大
D) 希望提高准确率

<details>
<summary>答案</summary>

**B) 模型过大，单块 GPU 无法容纳**

模型过大，无法装入单块 GPU 显存时。

</details>

---

### 第 10 题：梯度检查点

**梯度检查点在显存与速度之间有何取舍？**

A) 更多显存、更快训练
B) 更少显存、更快训练
C) 更多显存、更慢训练
D) 更少显存、更慢训练

<details>
<summary>答案</summary>

**D) 更少显存、更慢训练**

减少显存（保存约 √N 个激活而非 N 个），训练变慢（原文估计重计算使速度下降约 33%）。

</details>

---

### 第 11 题：Ring AllReduce

**Ring AllReduce 每块 GPU 的通信量复杂度是多少？**

A) O(N)，N 为 GPU 数量
B) O(N²)
C) O(log N)
D) O(1)，常数

<details>
<summary>答案</summary>

**D) O(1)，常数**

O(1)——每块 GPU 的通信量相对 GPU 数量为常数，因此扩展性较好。

</details>

---

### 第 12 题：流水线并行

**流水线并行主要开销或效率损失是什么？**

A) 通信开销
B) 显存碎片
C) 流水线开始及结束时的气泡
D) 梯度同步

<details>
<summary>答案</summary>

**C) 流水线开始及结束时的气泡**

流水线气泡：每批开始与结束时部分 GPU 空闲。

</details>

---

### 第 13 题：ZeRO Stage 3

**DeepSpeed ZeRO Stage 3 跨 GPU 分片哪些内容？**

A) 仅优化器状态
B) 优化器状态及梯度
C) 优化器状态、梯度及模型参数
D) 仅模型参数

<details>
<summary>答案</summary>

**C) 优化器状态、梯度及模型参数**

优化器状态、梯度及模型参数（最大限度减少显存占用）。

</details>

---

### 第 14 题：Flash Attention

**Flash Attention 相较标准注意力的内存复杂度是什么？**

A) O(N²)，与标准相同
B) O(N log N)
C) O(N)
D) O(√N)

<details>
<summary>答案</summary>

**C) O(N)**

O(N)——避免显式构造 O(N²) 的注意力矩阵。

</details>

---

### 第 15 题：GPU 利用率

**GPU 利用率持续低于 50%，最可能的瓶颈是什么？**

A) GPU 计算太慢
B) 数据加载或 CPU 预处理
C) GPU 显存不足
D) 网络带宽

<details>
<summary>答案</summary>

**B) 数据加载或 CPU 预处理**

数据加载或 CPU 预处理（GPU 正在等待数据）。

</details>

---

### 第 16 题：训练时的显存

**M 个参数的模型采用 FP32 和 Adam 优化器训练，忽略激活时约需多少内存？**

A) M 字节
B) 2M 字节
C) 4M 字节
D) 16M 字节

<details>
<summary>答案</summary>

**D) 16M 字节**

约 16M 字节 = 4M（参数）+ 4M（梯度）+ 8M（Adam 状态：一阶矩和二阶矩）。

</details>

---

### 第 17 题：页锁定内存

**PyTorch DataLoader 使用 pinned memory 的主要收益是什么？**

A) CPU 处理更快
B) 更大 Batch Size
C) CPU 到 GPU 的内存传输更快
D) 更少内存占用

<details>
<summary>答案</summary>

**C) CPU 到 GPU 的内存传输更快**

CPU 到 GPU 的内存传输更快（原文示例通过 DMA 加速 2–3 倍）。

</details>

---

### 第 18 题：DistributedSampler

**为什么 DDP 训练需要 DistributedSampler？**

A) 确保每个 GPU 处理不同的数据样本
B) 增大 Batch Size
C) 提高数据加载速度
D) 减少内存占用

<details>
<summary>答案</summary>

**A) 确保每个 GPU 处理不同的数据样本**

使各 GPU 处理不同数据样本，避免重叠。

</details>

---

### 第 19 题：梯度累积

**batch_size=16、accumulation_steps=4、world_size=8 时有效批量大小是多少？**

A) 16
B) 64
C) 128
D) 512

<details>
<summary>答案</summary>

**D) 512**

512（16 × 4 × 8 = 512）。

</details>

---

### 第 20 题：张量并行

**按列拆分权重的张量并行中，计算后需要什么操作？**

A) AllReduce 求和
B) 拼接
C) 广播
D) 分散

<details>
<summary>答案</summary>

**B) 拼接**

拼接——每块 GPU 计算一部分列，将结果拼接。

</details>

---

## 简答题（21–25）

### 第 21 题：GPU 显存构成

**列举训练期间消耗 GPU 显存的四个主要部分，给出各自近似大小（假设 M 个参数）。**

<details>
<summary>答案</summary>

1. 模型参数：M × 4 字节（FP32）= 4M 字节。
2. 梯度：M × 4 字节 = 4M 字节。
3. Adam 优化器状态：M × 8 字节 = 8M 字节（一阶矩及二阶矩）。
4. 激活：随批量大小与序列长度变化（可能是最大部分）。

总计：约 16M + 激活占用。
</details>

---

### 第 22 题：性能分析流程

**如何诊断训练任务 GPU 利用率低于 50% 的原因？**

<details>
<summary>答案</summary>

1. 用 nvidia-smi 等工具监控 GPU 利用率。
2. 分析数据加载耗时与计算耗时。
3. 检查批量大小（太小会导致利用不足）。
4. 使用 PyTorch Profiler 或 Nsight Systems 进行性能分析。
5. 查找 CPU-GPU 同步点（.item()、.cpu()）。
6. 检查 DataLoader 配置（num_workers、pin_memory）。
7. 确认没有过多磁盘 I/O 或预处理。
8. 显存允许时考虑增大批量。

核心洞察：GPU 利用率低于 50% 通常提示数据加载瓶颈，而非计算瓶颈。
</details>

---

### 第 23 题：DDP 设置

**编写在 PyTorch 中设置 DistributedDataParallel 模型的最小代码，包括进程组初始化和模型封装。**

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

### 第 24 题：显存优化技术

**列举五种减少训练 GPU 显存占用的技术，并简要解释。**

<details>
<summary>答案</summary>

1. **混合精度（FP16/BF16）：** 用 16 位浮点数替代 32 位浮点数（占用减半）。
2. **梯度检查点：** 在反向传播中重算激活而非全部保存（√N 内存）。
3. **梯度累积：** 用较小物理批量模拟较大批量。
4. **减少 Batch Size：** 较小批量减少激活占用。
5. **ZeRO 优化器：** 将优化器状态、梯度、参数分片到多个 GPU。

补充：
- Flash Attention：注意力内存 O(N) 对比 O(N²)。
- CPU Offloading：将暂不用的层移至 CPU。
- 模型并行：在多个 GPU 间拆分模型。
</details>

---

### 第 25 题：扩展效率

**解释分布式训练中强扩展与弱扩展的区别。深度学习中哪种更常用，为什么？**

<details>
<summary>答案</summary>

**强扩展：**
- 总工作量固定。
- GPU 更多意味着更快处理同一数据集。
- 示例：1 块 GPU 处理 1000 个样本，与 4 块 GPU 处理 1000 个样本比较。
- 理想：4 块 GPU 加速 4 倍。
- 问题：通信开销限制扩展效率。

**弱扩展：**
- 每块 GPU 工作量固定。
- GPU 更多意味着更大的总批量。
- 示例：每块 GPU 1000 个样本 × N 块 GPU。
- 理想：无论 GPU 数量多少，耗时相同。
- 保持 GPU 效率。

**原文认为深度学习中最常用弱扩展。**

原因：
- 保持良好 GPU 利用率。
- 较大批量配合适当学习率调整可能改善收敛。
- 避免通信成为瓶颈。
- 更贴合实际训练扩展方式。

取舍：有效批量增大后可能需要调整学习率。
</details>

---

## 评分指南

- **20–25 题正确：** 优秀，GPU 计算及分布式训练理解扎实。
- **16–19 题正确：** 良好，复习薄弱主题。
- **12–15 题正确：** 原文标为及格，复习讲义后再试。
- **不足 12 题：** 重测前复习全部讲义。

---

## 下一步

通过测验后：
1. 完成模块 07 的动手练习。
2. 实现小型分布式训练项目。
3. 进入模块 08：监控与可观测性。

祝顺利！

> 译注：原文开头及格线为 20 题，与文末 12 题不一致。混合精度并不保证整体训练显存减半；Ring AllReduce 的每设备通信数据量可近似不随设备数增长，但通信步数与延迟仍随设备数变化。DistributedSampler 在填充尾部样本时可能重复样本。性能倍数与扩展策略均需实际测量。
