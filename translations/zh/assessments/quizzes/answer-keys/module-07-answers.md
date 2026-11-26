# 模块 107：GPU 计算 — 参考答案

> [模块测验](../../../lessons/mod-107-gpu-computing/quizzes/module-quiz.md)的详细答案，包含解析、常见错误和课程参考。
>
> **学术诚信：** 请先尝试完成测验，再用于自学。

---

## 问题 1
**问题：** GPU 与 CPU 架构之间的哪个主要区别使 GPU 适合机器学习？

**答案：** B) GPU 拥有数千个针对并行运算优化的较简单核心

**解析：**
GPU 是面向吞吐量的处理器，围绕大规模单指令多线程（SIMT）并行构建，具有数千个小型 ALU，可以同时对许多数据元素执行相同操作。相比之下，CPU 面向低延迟，拥有少量强大的核心。深度学习工作负载（矩阵乘法、卷积、逐元素操作）天然可以分解为并行工作，与 GPU 宽广的计算结构匹配。

**常见错误：**
- 选择 A）更高的时钟频率：CPU 时钟频率通常高于 GPU；原始频率不是 GPU 的优势。
- 选择 C）更大的缓存：CPU 的每核心缓存实际上更大；GPU 牺牲缓存大小以获得更多计算资源。
- 选择 D）更好的分支预测：CPU 的分支预测复杂得多；线程束分歧是 GPU 的已知弱点。

**相关资料：** `lessons/mod-107-gpu-computing/01-introduction-gpu-computing.md`

---

## 问题 2
**问题：** 对于深度学习，Tensor Core 相比 CUDA Core 的主要优势是什么？

**答案：** C) 采用混合精度加速矩阵乘加运算

**解析：**
Tensor Core 是专用硬件单元，可在一个时钟周期内对小型矩阵块执行融合矩阵乘加（D = A*B + C），通常使用 FP16/BF16/TF32 输入及 FP32 累加。与执行相同 MMA 的通用 CUDA Core 相比，可提供约 8 倍的吞吐量。这就是混合精度训练在现代 NVIDIA GPU 上速度大幅提高的原因。

**常见错误：**
- 选择 A）更高的时钟频率：Tensor Core 共享 SM 时钟；加速来自每周期吞吐量，而非频率。
- 选择 B）更大的内存带宽：Tensor Core 不改变 HBM 带宽；它们消耗来自寄存器和共享内存的片上操作数。
- 选择 D）更好地支持整数运算：Tensor Core 支持 INT8，但主要优势是用于训练的 FP16/BF16 GEMM 加速。

**相关资料：** `lessons/mod-107-gpu-computing/01-introduction-gpu-computing.md`

---

## 问题 3
**问题：** 哪种 GPU 内存类型的访问速度最快？

**答案：** C) 寄存器（约 1 个周期延迟）

**解析：**
寄存器直接位于每个 SM 内部，是 GPU 内存层次结构中最快的存储，实际延迟约为单周期，且具有线程私有作用域。共享内存位于下一层（数十个周期中的较低值），随后是 L2 缓存，最后是全局 HBM（数百个周期）。Kernel 性能通常取决于是否将热点数据保留在寄存器与共享内存中。

**常见错误：**
- 选择 A）全局内存（VRAM）：这是最慢的一层，延迟为数百个周期。
- 选择 B）共享内存：速度快，但仍比寄存器慢，并由线程块共享。
- 选择 D）L2 缓存：位于 SM 与全局内存之间；比 HBM 快，但比寄存器慢得多。

**相关资料：** `lessons/mod-107-gpu-computing/01-introduction-gpu-computing.md`

---

## 问题 4
**问题：** 一个 warp 包含多少个以 SIMT 方式共同执行的线程？

**答案：** C) 32 个线程

**解析：**
在当前所有 NVIDIA 架构上，一个 warp 恰好由 32 个在 SIMT 下同步执行同一指令的线程组成。线程块大小通常选择 32 的倍数，使 warp 完全填满，避免浪费执行通道。warp 内的分支分歧会使不同路径串行化，这就是 warp 大小对性能很重要的原因。

**常见错误：**
- 选择 A）8 个线程：太小，更接近 CPU 上 AVX SIMD 的通道宽度。
- 选择 B）16 个线程：半个 warp；旧架构有时称其为 half-warp，但并不是 warp 的大小。
- 选择 D）64 个线程：AMD GCN 的 wavefront 为 64，而 CUDA warp 为 32。

**相关资料：** `lessons/mod-107-gpu-computing/02-cuda-programming-fundamentals.md`

---

## 问题 5
**问题：** 与 FP32 相比，使用 FP16 混合精度训练时典型的内存缩减幅度是多少？

**答案：** B) 2 倍（FP16 每个参数占 2 字节，FP32 占 4 字节）

**解析：**
FP16 和 BF16 是 16 位格式（2 字节），FP32 是 32 位（4 字节），因此以半精度存储张量会使其占用减半。实际混合精度训练为了稳定性保留一份 FP32 主权重，因此整体内存节省取决于测量对象，但单个张量的激活值或梯度内存约减半。结合 Tensor Core，还能实现显著加速。

**常见错误：**
- 选择 A）1.5 倍：低估了字节比例；FP16 是 FP32 的一半，而非四分之三。
- 选择 C）4 倍：对应 FP32 转换为 INT8/FP8，而非 FP16。
- 选择 D）8 倍：需要 4 位量化，通常用于推理。

**相关资料：** `lessons/mod-107-gpu-computing/03-pytorch-gpu-acceleration.md`

---

## 问题 6
**问题：** 关于 DataParallel（DP）与 DistributedDataParallel（DDP），哪项陈述正确？

**答案：** D) DDP 更快且使用多个进程（没有 GIL 竞争，也没有 GPU 0 瓶颈）

**解析：**
`DataParallel` 在单个 Python 进程中运行，通过 GPU 0 分发输入和汇集输出，使 GPU 0 同时成为内存与计算瓶颈，并受 Python GIL 限制。`DistributedDataParallel` 为每块 GPU 启动一个进程，使用 NCCL AllReduce 在环中求梯度平均值，避免这两个瓶颈。PyTorch 建议所有多 GPU 训练都使用 DDP，即使是在单节点上。

**常见错误：**
- 选择 A）DP 比 DDP 快：颠倒了事实；由于分发、汇集和 GIL，DP 通常更慢。
- 选择 B）DP 使用多个进程、DDP 使用单进程：恰好相反。
- 选择 C）DDP 存在 GPU 0 瓶颈，DP 没有：瓶颈属于 DP；DDP 使用对称环。

**相关资料：** `lessons/mod-107-gpu-computing/05-multi-gpu-training-strategies.md`

---

## 问题 7
**问题：** 在分布式训练中，AllReduce 操作执行什么？

**答案：** B) 合并所有 rank 的值，并将结果分发给所有 rank

**解析：**
AllReduce 对每个 rank 都拥有的张量执行满足结合律的归约（通常为求和或求平均），然后将归约结果广播回每个 rank，使它们最终拥有相同的值。在 DDP 中，它用于每次反向传播之后对各工作进程的梯度求平均。逻辑上等价于先 Reduce 再 Broadcast，但 Ring 或 Tree AllReduce 等实现具有高得多的带宽效率。

**常见错误：**
- 选择 A）将 rank 0 的数据发送给其他所有 rank：这是 Broadcast，而非 AllReduce。
- 选择 C）将所有 rank 的数据汇集到 rank 0：这是 Reduce（或 Gather），只有 rank 0 获得结果。
- 选择 D）将 rank 0 的数据分散给所有 rank：这是 Scatter，用于拆分而非合并数据。

**相关资料：** `lessons/mod-107-gpu-computing/04-distributed-training-fundamentals.md`

---

## 问题 8
**问题：** 在数据并行中，什么内容在各 GPU 上复制？

**答案：** B) 复制模型；数据在 GPU 之间划分

**解析：**
数据并行在每个 GPU 上放置完整模型（及其优化器状态）的副本，并将全局批次划分为分片，每个工作进程处理一个分片。各 GPU 在自己的分片上计算前向与反向传播，然后对梯度执行 AllReduce，使每个副本在执行优化器更新之前获得相同的平均梯度。这保持副本同步，是模型仍能装入单 GPU 时的主力扩展模式。

**常见错误：**
- 选择 A）数据：数据被分片，而非复制，这正是“数据”并行的意义。
- 选择 C）优化器：模型复制也会导致优化器状态复制，但定义性特征是模型复制。
- 选择 D）损失函数：损失函数只是代码，不是复制的单位。

**相关资料：** `lessons/mod-107-gpu-computing/05-multi-gpu-training-strategies.md`

---

## 问题 9
**问题：** 何时必须采用模型并行而非数据并行？

**答案：** B) 模型太大，无法装入单块 GPU 的显存时

**解析：**
数据并行要求每块 GPU 保存模型、梯度和优化器状态的完整副本。一旦模型超出单设备内存容量，就必须通过张量并行、流水线并行或 ZeRO-3 对模型本身分片，使各 GPU 只保存一部分。模型并行的根本目的是让模型能够装入显存，而非加快速度。

**常见错误：**
- 选择 A）希望加快训练：模型并行通常增加通信开销，每步往往比纯数据并行更慢。
- 选择 C）拥有大型数据集：大型数据集由数据并行（更多分片）处理，而非模型并行。
- 选择 D）希望获得更好准确率：并行策略不会改变模型准确率。

**相关资料：** `lessons/mod-107-gpu-computing/06-model-pipeline-parallelism.md`

---

## 问题 10
**问题：** 梯度检查点在内存和速度之间有何权衡？

**答案：** D) 更少内存（存储约 √N 层激活而非 N 层），训练更慢（由于重新计算约慢 33%）

**解析：**
梯度检查点在前向传播中仅保存部分激活值，反向传播时按需重新计算其他激活值。这将激活内存从 O(N) 降至约 O(√N) 层，但每次反向传播增加一次部分前向计算，典型每步时间开销约为 30%。当激活值内存占主导时，特别是长序列或深层 Transformer，这是关键技术。

**常见错误：**
- 选择 A）更多内存、更快训练：两个方面都错；检查点减少内存并减慢训练。
- 选择 B）更少内存、更快训练：内存方面正确，速度方面错误；重新计算需要时间。
- 选择 C）更多内存、更慢训练：颠倒了内存权衡；检查点正是为了节省内存。

**相关资料：** `lessons/mod-107-gpu-computing/07-gpu-memory-management.md`

---

## 问题 11
**问题：** Ring AllReduce 的通信复杂度（每 GPU 带宽需求）是多少？

**答案：** D) O(1)——常数

**解析：**
Ring AllReduce 将梯度张量拆分为 N 个块，在由 N 块 GPU 组成的环上先执行 reduce-scatter，再执行 all-gather。每块 GPU 总共发送和接收 2*(N-1)/N * tensor_size 字节（分别计发送量或接收量），随着 N 增长趋于常数（2 * tensor_size），与 GPU 数量无关。正是这种带宽最优性，使 Horovod 和 NCCL 将环形模式推广到大规模训练中。

**常见错误：**
- 选择 A）O(N)：描述朴素参数服务器或 Reduce + Broadcast 模式，其中中心节点带宽需求线性增长。
- 选择 B）O(N²)：对应不带聚合的全互连通信，比环形模式差得多。
- 选择 C）O(log N)：更接近树形 AllReduce 的延迟项，而非环形模式每块 GPU 的带宽需求。

**相关资料：** `lessons/mod-107-gpu-computing/04-distributed-training-fundamentals.md`

---

## 问题 12
**问题：** 流水线并行的主要开销或低效之处是什么？

**答案：** C) 流水线开始和结束时的“气泡”

**解析：**
流水线并行将层分配到不同 GPU，微批次流经各阶段。在批次开始时，后续阶段空闲，等待第一个微批次到达；在批次结束时，前面阶段空闲，等待最后一个微批次完成。这些空闲时段就是流水线“气泡”。增加微批次数量（如 GPipe、1F1B 调度）可以减少气泡，但无法彻底消除。

**常见错误：**
- 选择 A）通信开销：阶段间发送确实存在，但与气泡成本相比很小（仅传输相邻阶段间的激活值）。
- 选择 B）内存碎片：并非流水线特有问题。
- 选择 D）梯度同步：流水线并行不需要对分区层跨阶段执行 AllReduce。

**相关资料：** `lessons/mod-107-gpu-computing/06-model-pipeline-parallelism.md`

---

## 问题 13
**问题：** DeepSpeed ZeRO Stage 3 将什么内容分区到各 GPU？

**答案：** C) 优化器状态、梯度和模型参数

**解析：**
ZeRO（零冗余优化器）逐步将训练状态分片到各数据并行工作进程：Stage 1 对优化器状态分区，Stage 2 增加梯度分区，Stage 3 进一步对模型参数本身分区。Stage 3 中，每块 GPU 只保留每个张量的 1/N，参数在前向或反向传播时按需汇集，以额外通信为代价获得最大的内存缩减。

**常见错误：**
- 选择 A）只有优化器状态：这是 ZeRO Stage 1。
- 选择 B）优化器状态与梯度：这是 ZeRO Stage 2。
- 选择 D）只有模型参数：ZeRO 总是先对优化器状态分区；仅对参数分区并不是某个 ZeRO 阶段。

**相关资料：** `lessons/mod-107-gpu-computing/07-gpu-memory-management.md`

---

## 问题 14
**问题：** 与标准注意力相比，Flash Attention 的内存复杂度是多少？

**答案：** C) O(N)

**解析：**
标准注意力在 HBM 中物化完整 N×N 注意力分数矩阵，内存复杂度为 O(N²)，并受带宽限制。Flash Attention 将 Q、K、V 划分为适合 SRAM 的块，使用在线 softmax 增量计算加权和，始终不将完整注意力矩阵写入全局内存。这使内存复杂度降为 O(N)，同时利用 IO 感知机制加速 Kernel。

**常见错误：**
- 选择 A）O(N²)，与标准注意力相同：完全忽略了 Flash Attention 的目的，它明确避免 O(N²) 矩阵。
- 选择 B）O(N log N)：复杂度分析中没有对数因子。
- 选择 D）O(√N)：混淆了 Flash Attention 与梯度检查点的 √N 激活内存节省。

**相关资料：** `lessons/mod-107-gpu-computing/08-advanced-gpu-optimization.md`

---

## 问题 15
**问题：** 如果 GPU 利用率持续低于 50%，最可能的瓶颈是什么？

**答案：** B) 数据加载或 CPU 预处理

**解析：**
持续低 GPU 利用率几乎总意味着 GPU 饥饿，即处理完一个批次后等待下一个批次。常见原因是磁盘读取缓慢、单工作进程 DataLoader、繁重的 CPU 数据增强、缺少 `pin_memory`，或训练循环中的 `.cpu()`/`.item()` 同步。通过重叠 IO 与计算来解决：增加 `num_workers`、使用 `pin_memory=True`、预取数据，并在可能时将增强移至 GPU。

**常见错误：**
- 选择 A）GPU 计算太慢：如果计算是瓶颈，应看到较高（约 100%）利用率，而非低利用率。
- 选择 C）GPU 显存不足：OOM 表现为崩溃，而非低利用率。
- 选择 D）网络带宽：仅在多节点训练时相关，即使在那里，也通常表现为很高的通信耗时，而非 GPU 空闲。

**相关资料：** `lessons/mod-107-gpu-computing/08-advanced-gpu-optimization.md`

---

## 问题 16
**问题：** 对于具有 M 个参数、使用 Adam 优化器以 FP32 训练的模型，大约需要多少内存（不含激活值）？

**答案：** D) 16M 字节

**解析：**
使用 FP32（每元素 4 字节）时，参数占 4M 字节，梯度再占 4M 字节，Adam 保存两个矩缓冲区（m 和 v），各占 4M 字节，增加 8M 字节。在计算激活值之前总计 16M 字节。这就是为什么 7B 参数模型仅 FP32 权重、梯度及优化器状态就需要约 112 GB，也说明了采用混合精度和 ZeRO 分片的动机。

**常见错误：**
- 选择 A）M 字节：每个参数仅计算一个字节，相当于假设 INT8，完全忽略梯度和优化器。
- 选择 B）2M 字节：忘记 FP32 占 4 字节，并忽略梯度和优化器状态。
- 选择 C）4M 字节：仅计算参数，遗漏梯度（4M）与 Adam 矩（8M）。

**相关资料：** `lessons/mod-107-gpu-computing/07-gpu-memory-management.md`

---

## 问题 17
**问题：** 在 PyTorch DataLoader 中使用固定内存（pinned memory）的主要好处是什么？

**答案：** C) 更快的 CPU 到 GPU 内存传输（通过 DMA 加速 2–3 倍）

**解析：**
固定（页锁定）内存无法被操作系统换出，使 GPU 的 DMA 引擎能够直接从宿主机 RAM 复制数据，无需中间暂存缓冲区。结合 `non_blocking=True`，可以让 H2D 传输与 GPU 计算重叠。结果是更快且更确定的数据传输，通常比可分页内存快 2–3 倍。

**常见错误：**
- 选择 A）更快的 CPU 处理：固定内存不改变 CPU 吞吐量，只影响宿主机到设备的路径。
- 选择 B）更大的批大小：批大小受 GPU 显存限制，与宿主机内存固定无关。
- 选择 D）更低的内存使用量：固定内存实际上给操作系统施加更多限制，可能增加宿主机 RAM 压力。

**相关资料：** `lessons/mod-107-gpu-computing/03-pytorch-gpu-acceleration.md`

---

## 问题 18
**问题：** 为什么 DDP 训练需要 DistributedSampler？

**答案：** A) 确保每块 GPU 处理不同的数据样本（不重叠）

**解析：**
默认情况下，每个 DDP rank 会创建相同的 DataLoader，并以相同方式遍历数据集，使每块 GPU 都在相同样本上训练，违背数据并行的目的。`DistributedSampler` 根据 rank 确定性地划分索引，使每个工作进程每轮看到数据集的不同分片。还需要调用 `sampler.set_epoch(epoch)`，使打乱顺序在 rank 之间保持一致，但在不同轮次之间变化。

**常见错误：**
- 选择 B）增加批大小：有效批大小增加是由于存在多块 GPU，而非采样器。
- 选择 C）提高数据加载速度：这是 `num_workers`/`pin_memory` 的作用；采样器关系到正确性。
- 选择 D）降低内存使用量：采样器不改变每 GPU 内存占用。

**相关资料：** `lessons/mod-107-gpu-computing/05-multi-gpu-training-strategies.md`

---

## 问题 19
**问题：** 如果 batch_size=16、accumulation_steps=4、world_size=8，有效批大小是多少？

**答案：** D) 512

**解析：**
有效批大小 = 每 GPU 微批大小 × 累积步数 × GPU 数量 = 16 × 4 × 8 = 512。梯度累积通过推迟优化器更新来模拟更大的批次，数据并行则再次将其乘以工作进程数。缩放学习率时应使用这个数值（例如线性或平方根缩放规则）。

**常见错误：**
- 选择 A）16：只有单 GPU 微批大小，忽略累积和 world size。
- 选择 B）64：将微批乘以累积步数，但忘记 8 块 GPU。
- 选择 C）128：将微批乘以 world size，但忘记累积因子。

**相关资料：** `lessons/mod-107-gpu-computing/07-gpu-memory-management.md`

---

## 问题 20
**问题：** 在按列划分权重的张量并行中，计算完成后需要什么操作？

**答案：** B) 拼接（Concatenation）

**解析：**
在 Megatron 风格的列并行线性层中，权重矩阵沿输出（列）维度划分，每块 GPU 从完整输入计算一部分输出特征。为了组装完整输出激活值，需要沿特征维度拼接各 GPU 的部分输出（通常通过 AllGather 集合通信）。行并行层是其对偶情况：因为每块 GPU 计算部分输入特征对应的部分和，所以需要 AllReduce 求和。

**常见错误：**
- 选择 A）AllReduce（求和）：这是按*行*划分后需要的操作，此时每块 GPU 生成部分和，而非按列划分后互不重叠的输出。
- 选择 C）Broadcast：将一个 rank 的数据发送给所有 rank，无法组装分布式输出。
- 选择 D）Scatter：向外拆分数据，而按列划分模式需要合并输出，而不是进一步拆分。

**相关资料：** `lessons/mod-107-gpu-computing/06-model-pipeline-parallelism.md`

---

## 问题 21
**问题：** 列出训练期间消耗 GPU 显存的四个主要组成部分，并给出各部分近似大小（假设有 M 个参数）。

**答案：** 1. **模型参数**——FP32 中 M × 4 字节 = **4M 字节**（FP16/BF16 中为 2M）。
2. **梯度**——每个参数对应一个梯度，FP32 中 M × 4 字节 = **4M 字节**。
3. **优化器状态（Adam）**——动量与方差缓冲区，FP32 中 2 × M × 4 字节 = **8M 字节**（仅 Adam；带动量 SGD 仅为 4M）。
4. **激活值**——为反向传播保存的中间张量；**随批大小、序列长度及深度变化**，对于 Transformer 或长序列经常是最大的项。

固定总成本约为 **16M 字节**（参数、梯度及 Adam 状态），另加可变激活内存。

**解析：**
模型本身之外的 16M 字节“训练税”说明，朴素 FP32 训练 7B 模型为什么在计算激活值前就需要约 112 GB，并解释了混合精度、ZeRO 分片及梯度检查点的动机。了解分解方式，可以预测哪种优化（FP16、ZeRO-1/2/3、检查点、更小的批大小）针对哪一项。

**常见错误：**
- 仅报告参数（4M），忘记梯度和优化器状态各自增加相当数量的内存。
- 将 Adam 优化器状态报告为 4M 而非 8M（忘记它同时存储一阶矩与二阶矩）。
- 完全遗漏激活值：它们的大小可变，但对于长上下文 Transformer 经常占主导。

**相关资料：** `lessons/mod-107-gpu-computing/07-gpu-memory-management.md`

---

## 问题 22
**问题：** 描述诊断训练任务 GPU 利用率低（低于 50%）的步骤。

**答案：** 1. **观测基线**：使用 `nvidia-smi dmon`/`nvtop` 确认持续较低的 SM 利用率，并检查内存吞吐量。
2. **分别计时数据流水线与训练步**：包装 DataLoader 迭代器与前向/反向传播，比较两侧每批秒数。如果加载器耗时占主导，GPU 正处于饥饿状态。
3. **检查 DataLoader 配置**：增加 `num_workers`，启用 `pin_memory=True`，设置 `persistent_workers=True`，并在 `.to(device)` 上使用 `non_blocking=True`，使 H2D 传输与计算重叠。
4. **性能分析**：使用 PyTorch Profiler（带 `record_shapes` 和 `with_stack`）或 Nsight Systems 查看实际 Kernel 时间线及间隙。
5. **排查宿主机与设备同步**：热循环中的 `.item()`、`.cpu()`、`torch.cuda.synchronize()` 及 Python 打印或日志，每一项都可能阻塞 GPU。
6. **检查批大小与 Kernel 大小**：过小的批次或偏离 Tensor Core 分块边界的形状（不是 8/16 的倍数）会浪费计算资源。
7. **验证存储与预处理**：检查分片大小、解码成本（JPEG/音频），以及磁盘与网络 IO；考虑将数据增强移至 GPU（Kornia、DALI）。
8. **重新测量**：每次变更后重新测量，以便将改进归因于具体变更。

**解析：**
诊断思路是“如果利用率低，GPU 就在等待”，应找出它正在等待什么（数据、同步、Python）。Profiler 时间线优于猜测，因为它让 Kernel 间隙可见，并告诉你原因是宿主机代码、IO 还是通信。大多数低于 50% 利用率的情况都源于输入流水线，而非模型。

**常见错误：**
- 在确认计算确实是瓶颈之前，直接提出“购买更快的 GPU”或“使用混合精度”。
- 忘记循环中的 `.item()` 或 Python 端日志会在每次迭代时强制设备同步。
- 增加 `num_workers`，却不使用 `pin_memory` 或 `non_blocking=True`，导致传输仍与计算串行。

**相关资料：** `lessons/mod-107-gpu-computing/08-advanced-gpu-optimization.md`

---

## 问题 23
**问题：** 编写在 PyTorch 中建立 DistributedDataParallel 模型的最小代码。包括进程组初始化与模型包装。

**答案：** ```python
import os
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def setup(rank: int, world_size: int) -> None:
    os.environ.setdefault("MASTER_ADDR", "localhost")
    os.environ.setdefault("MASTER_PORT", "12355")
    dist.init_process_group(backend="nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

def cleanup() -> None:
    dist.destroy_process_group()

def train(rank: int, world_size: int) -> None:
    setup(rank, world_size)

    model = MyModel().to(rank)
    ddp_model = DDP(model, device_ids=[rank], output_device=rank)

    # Use a DistributedSampler so each rank sees a unique shard.
    # optimizer = torch.optim.AdamW(ddp_model.parameters(), lr=1e-4)
    # for epoch in range(num_epochs):
    #     sampler.set_epoch(epoch)
    #     for batch in loader:
    #         ...

    cleanup()
```
使用 `torchrun --nproc_per_node=<N> train.py` 启动（它会为你设置 `RANK`、`WORLD_SIZE`、`LOCAL_RANK`）。

**解析：**
四项必要操作是：（1）在 GPU 上使用 NCCL 后端初始化进程组；（2）通过 `torch.cuda.set_device(rank)` 将各进程绑定至自身设备；（3）使用 `DDP(..., device_ids=[rank])` 包装模型，从而注册梯度 AllReduce；（4）在结束时销毁进程组。生产环境中应搭配 `DistributedSampler`，并使用 `torchrun`，而不是手动管理环境变量。

**常见错误：**
- 遗漏 `torch.cuda.set_device(rank)`，可能导致所有 rank 都落到 GPU 0 并悄悄串行运行。
- 在 GPU 上使用 `gloo` 后端（能够工作，但 GPU 集合通信比 NCCL 慢得多）。
- 忘记 `dist.destroy_process_group()`，导致关闭时遗留 NCCL 通信器。

**相关资料：** `lessons/mod-107-gpu-computing/05-multi-gpu-training-strategies.md`

---

## 问题 24
**问题：** 列出五种降低训练期间 GPU 显存使用量的技术，并简要解释。

**答案：** 1. **混合精度（FP16/BF16）**——以 16 位存储激活值、梯度，并通过 `autocast` 进行低精度计算。激活值及梯度内存大致减半，并释放 Tensor Core 吞吐量；FP16 应搭配损失缩放器。
2. **梯度检查点**——仅保留前向传播中的一部分激活值，反向传播时重新计算其他部分。将激活内存从 O(N) 降到约 O(√N) 层，代价是约 30% 的额外计算。
3. **梯度累积**——执行 K 个微批次之后再更新优化器。无需同时保存 K 个批次的激活值，即可使用 K × 微批大小的有效批大小进行训练。
4. **ZeRO/FSDP 分片**——在数据并行 rank 之间对优化器状态（Stage 1）、梯度（Stage 2）和参数（Stage 3）进行分区，使每块 GPU 仅持有训练状态的 1/N。
5. **Flash Attention**——IO 感知的分块注意力 Kernel，避免物化 N×N 注意力矩阵，将注意力内存从 O(N²) 降为 O(N)，同时加速计算。

其他值得提及的方法：CPU/NVMe 卸载（DeepSpeed offload、FSDP CPU offload）、缩小批大小或序列长度、参数高效微调（LoRA）、用于推理的激活值或权重量化。

**解析：**
正确工具取决于内存预算中哪一项（参数、梯度、优化器状态、激活值）最大。混合精度及检查点针对激活值；ZeRO/FSDP 针对固定的 16M 字节训练税；梯度累积允许用时间换取内存，而不改变优化目标。可以结合使用，它们大多相互独立。

**常见错误：**
- 将“较小的批大小”与“梯度累积”列为节省不同内存的机制（它们以不同方式针对同一维度）。
- 将梯度检查点与梯度累积混淆；两种机制及权衡不同。
- 将 FP16 称为“免费”的 2 倍节省，没有提及 FP32 主权重及损失缩放开销。

**相关资料：** `lessons/mod-107-gpu-computing/07-gpu-memory-management.md`

---

## 问题 25
**问题：** 解释分布式训练中强扩展与弱扩展之间的区别。深度学习中哪种更常用，为什么？

**答案：** - **强扩展**：保持*总问题规模*固定（相同数据集、相同全局批大小），增加 GPU 以更快完成。N 块 GPU 的理想加速为 N 倍；实践中通信与同步开销会侵蚀这一收益，每 GPU 工作量减少，降低 Kernel 效率。
- **弱扩展**：保持*每 GPU 问题规模*固定（相同本地批大小），让全局批大小随 N 增长。理想情况下，每步耗时随 N 增长保持不变，每 GPU Kernel 仍足够大以保持设备忙碌。

**深度学习中更常用的是弱扩展。**

原因：
- 每 GPU 仍具有适当的本地批大小，保持 Tensor Core 高利用率。
- 摊销通信成本：每步本地计算越多，相对 AllReduce 成本越小。
- 符合团队实际的扩展方式：购买更多 GPU 来训练更大模型或处理更多 token，而非缩小固定任务。
- 注意：全局批大小增长需要调整学习率（线性缩放规则、LARS/LAMB、预热），在极端批大小下最终可能损害收敛。

**解析：**
强扩展的思路是“缩短实际耗时”，弱扩展的思路是“充分利用更多硬件”。深度学习工作负载受吞吐量限制，并且在适当调整学习率后，可以很好地利用更大的有效批大小，因此该领域通常采用弱扩展。强扩展主要适用于对延迟敏感的重新训练，或批大小无法进一步增长的场景。

**常见错误：**
- 颠倒定义（声称弱扩展保持总工作量固定）。
- 认为强扩展更常见，因为“希望训练更快”，忽略了减少每 GPU 工作量会损害 Kernel 效率。
- 忘记学习率缩放的注意事项：弱扩展若不调整学习率，通常会发散或导致更差的泛化。

**相关资料：** `lessons/mod-107-gpu-computing/04-distributed-training-fundamentals.md`

---
