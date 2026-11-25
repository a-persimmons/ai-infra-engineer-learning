# 故障排查 — 项目 103（LLM 部署）

LLM 部署项目中常见的故障模式。每项遵循：症状 → 诊断 → 修复 → 预防。

> **提示：** 执行运行手册之前，先使用 `kubectl describe pod <llm-serving-pod>`、`kubectl logs <pod> --tail=200` 和 `nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv` 捕获当前状态。有了快照后，多数问题更容易定位。

---

## 1. 模型加载时显存不足（OOM）

**症状**
- Pod 启动时崩溃，出现 `torch.cuda.OutOfMemoryError`、`CUDA out of memory`，或容器以 137 退出。
- 崩溃前 nvidia-smi 显示 GPU 显存接近 100%。

**诊断**
1. 计算所需内存：params × bytes_per_param + activations + KV cache + overhead。
   - Llama-3.1-8B 的 FP16 权重本身约 16GB。
   - 每序列 KV Cache：2 × n_layers × n_heads × head_dim × seq_len × bytes。Llama-3.1-8B 在 4k 上下文约为 0.5GB/序列。
2. 与 GPU 显存（`nvidia-smi --query-gpu=memory.total`）比较。
3. 检查 vLLM 配置中的 max_num_seqs、max_model_len、gpu_memory_utilization。

**修复**
- 将 gpu_memory_utilization 从默认 0.9 降至 0.85，留出余量。
- 将 max_model_len 降至实际用量（不要为永远不会用到的上下文长度预留 KV）。
- 减少 max_num_seqs（并行序列数）。
- 量化权重（AWQ、GPTQ，或 H100/L40S 上使用 Transformer Engine 的 FP8）。
- 使用更大显存的 GPU（A10G 24GB → A100 40/80GB → H100 80GB）。

**预防**
- 部署前计算内存预算，并记录于 Helm values。
- 对 `nvidia_gpu_memory_used_bytes / total > 0.95` 添加告警。

---

## 2. 首 Token 时间（TTFT）过长

**症状**
- /generate 请求的首 Token 需要 2–10 秒甚至更久，负载下 P95 TTFT 超过 1 秒。

**诊断**
1. 区分 prefill 与 decode 延迟。vLLM 暴露 vllm:time_to_first_token_seconds_bucket。
2. 检查队列深度（vllm:num_requests_waiting）：数值较高意味着调度器尚未接纳请求。
3. 检查提示长度分布：单个 32k Token 提示可能主导 prefill。

**修复**
- 多个请求共享公共前缀（系统提示、few-shot 示例）时启用前缀缓存。
- prefill 阶段 GPU 利用率偏低时，增大 max_num_batched_tokens。
- 对非常长的提示评估分块 prefill（vLLM 0.6+）。
- 对较短输出添加推测解码（原文 vLLM 参数 --speculative-model）。

**预防**
- 设置 TTFT P95 的 SLO（例如提示不超过 2k Token 时低于 500ms）。
- vllm:num_requests_waiting 大于 0 且超过 60 秒时告警。

---

## 3. 吞吐量平台期（tokens/sec 不再扩展）

**症状**
- 增加 GPU 或副本没有提升总 tokens/sec。

**诊断**
1. 使用 `nvidia-smi dmon -s u` 检查每块 GPU 的利用率。如果保持在 50%，瓶颈可能在其他位置。
2. 检查 CPU 利用率：分词、采样、JSON 序列化可能是 CPU 密集型操作。
3. 检查网络：张量并行下，NCCL all-reduce 延迟可能随 GPU 数量增加；可使用 nccl-tests 量化。

**修复**
- 将分词器绑定至 Worker 池，避免在请求处理线程执行。
- 原文建议切换至 --enforce-eager false，让 vLLM 为固定批次大小使用 CUDA Graph。
- 多 GPU 场景优先使用 NVLink 而非 PCIe（原文估计 NVLink 快约 10 倍）。
- 量化时确保框架可将量化融合到 Kernel，避免反量化 → 矩阵乘法 → 再量化。

**预防**
- 将 Roofline 分析加入项目交付物。明确计算受限或内存受限的运行区间，为之后的决策提供依据。

---

## 4. 多 GPU 张量并行中 NCCL 卡住

**症状**
- Pod 日志出现 NCCL WARN Cuda failure，或数分钟没有输出。
- nvidia-smi 显示 GPU 利用率为 0%。

**诊断**
1. 设置 NCCL_DEBUG=INFO，检查 all-reduce 环的构建。
2. 检查 GPU 能否互相访问：`nvidia-smi topo -m` 应在同一 TP 组 GPU 之间显示 NV#（NVLink）或 PIX（PCIe）。
3. 验证 CUDA_VISIBLE_DEVICES 符合预期拓扑。

**修复**
- 强制使用指定网卡：NCCL_SOCKET_IFNAME=eth0（或 Pod 实际网卡）。
- 若集群有 IB 但未使用，可设置 NCCL_IB_DISABLE=1，明确回退至 TCP。
- 使用 kubectl rollout restart 重启 Pod。原文指出，init container 遗留的共享内存可能使旧 NCCL 状态在进程重启后仍存在。

**预防**
- 在每个新集群运行 nccl-tests 作为预检任务，在加载模型前发现互联问题。
- 固定容器镜像内 NCCL 版本。NCCL 确实存在版本特定缺陷。

---

## 5. KV Cache 频繁淘汰（负载下尾延迟高）

**症状**
- P99 延迟是 P50 的 10 倍。并发请求增加时吞吐量下降。

**诊断**
- 检查 vllm:gpu_cache_usage_perc；负载下持续超过 95% 时，调度器可能频繁淘汰和重新 prefill。
- 检查 vllm:num_preempted_requests_total；增加意味着发生了抢占。

**修复**
- 减少 max_num_seqs，让更少序列竞争 KV 块。
- 增加 GPU 资源（更多总缓存）。
- 对聊天应用启用前缀缓存，去除不同会话重复系统提示的计算。
- 评估 PagedAttention 的 swap_space，将压力转移至 CPU 内存（更慢但有界）。

**预防**
- 将 KV Cache 作为负载模型的核心容量维度。单纯使用每秒请求数不足以描述 LLM 服务。

---

## 6. SSE 流式连接在生成中途断开

**症状**
- 客户端收到部分输出后出现 connection closed。
- 服务端日志没有错误。

**诊断**
1. 检查 Ingress/负载均衡器空闲超时（原文称多数默认值为 30–60 秒，长生成可能超过）。
2. 使用 kubectl describe ingress 检查 proxy-read-timeout 和 proxy-send-timeout 注解。
3. 确认客户端确实在消费流（部分客户端缓冲 SSE）。

**修复**
- 设置 Ingress 注解：nginx.ingress.kubernetes.io/proxy-read-timeout: "600" 及 proxy-send-timeout: "600"。
- 每 15–20 秒发送一次 SSE 注释 `: keep-alive`，防止中间层超时。
- 对极长生成，考虑拆分为多个请求。

**预防**
- 在 CI 中包含长生成测试（生成至少 2,000 个输出 Token）。

---

## 7. 模型加载缓慢（5 分钟以上）

**症状**
- Pod 启动后数分钟处于 Running 但未 Ready。

**诊断**
1. 检查每次 Pod 启动时是否都从 Hub 下载模型（查找 Hugging Face 下载日志）。
2. 检查 readinessProbe。如果轮询的 /ready 端点仅在模型完全加载后才改变状态，则等待时间即实际加载时间。

**修复**
- 将模型预打包到镜像，或使用已预填充模型的 PVC。
- 使用更高带宽的存储类（原文举例 gp3 1GiB/s 替代 gp2）。
- 对分片模型并行预取各分片。
- 原文建议增大 readinessProbe.initialDelaySeconds，以留出加载时间。

**预防**
- 通过 DaemonSet 在节点预拉取容器镜像。
- 在项目 README 记录每种模型与硬件组合的预期冷启动时间。

---

## 8. FP8 数值漂移（量化输出偏离基线）

**症状**
- FP8/AWQ/GPTQ 量化模型输出质量劣于 FP16 基线（例如输出更长、幻觉更多、JSON 损坏）。

**诊断**
1. 在留出评估集上比较指标（困惑度、准确率、指令遵循分数）。
2. 检查校准数据是否符合推理分布。用 Wikitext 校准却服务聊天可能损害质量。
3. 检查激活缩放是 per-tensor（FP8）还是 per-channel（AWQ）；不适合的缩放策略会降低质量。

**修复**
- 使用符合服务分布的样本重新校准 AWQ/GPTQ。
- 对 Transformer Engine 的 FP8，确认 fp8_recipe 设置正确（DelayedScaling vs Current）。
- 尝试另一种量化方案；原文认为聊天任务 AWQ 通常比 GPTQ 更能保留质量。

**预防**
- 提升至生产前，始终在真实评估集上评估量化版本。项目规格中的 1.5 个百分点阈值是有意采取的保守标准。

---

## 9. HPA 从不扩容（或从不缩容）

**症状**
- 即使负载变化，副本数仍停留在最小值或最大值。

**诊断**
1. `kubectl describe hpa <name>`：检查 conditions 和目标/当前值。
2. 确认指标已到达 Prometheus 及 HPA 指标源（Prometheus Adapter、KEDA）。
3. GPU 工作负载的 CPU 指标不一定反映真实负载；确保 HPA 使用请求相关指标（队列深度、RPS、GPU 利用率）。

**修复**
- 将 HPA 切换到自定义指标：vllm:num_requests_waiting 是有用信号。
- 若 Prometheus Adapter 不稳定，可使用 KEDA 的 prometheus scaler。
- 设置 behavior.scaleDown.stabilizationWindowSeconds: 300，避免频繁震荡。

**预防**
- 专门测试 HPA。进行阶跃负载测试，验证扩容和缩容均符合预期。

---

## 10. 突发负载下队列饱和

**症状**
- 突发请求造成积压，新请求在队列中等待数秒至数分钟。

**诊断**
- vllm:num_requests_waiting 突增。
- 租户级追踪显示一个租户耗尽所有容量。

**修复**
- 在 API 层添加租户级限流（例如 FastAPI 中按 API Key 的 RateLimitMiddleware）。
- 当 num_requests_waiting > N 时返回 HTTP 429，实现负载卸载。
- 增加副本（基于队列深度的 HPA，参见第 9 项）。
- 混合负载考虑分级路由：小模型用于低成本/快速请求，大模型用于高级服务。

**预防**
- 始终为突发流量建模，而不只考虑稳态。原文强调尾部吞吐量表现比均值更重要。

---

## 11. 部署后的意外成本

**症状**
- 月度云账单 GPU 支出远高于预估。

**诊断**
1. 检查实际 GPU 小时成本：replicas × hours_running × on_demand_rate。
2. 对比项目 COST.md 分析。
3. 查找僵尸 Pod（扩展至 10 副本却未缩容）、Spot 中断导致重新启动、低效批处理（GPU 利用率低但仍全量供应）。

**修复**
- 合理调整规格和副本数：若稳态 GPU 利用率低于 40%，可能存在过多副本。
- 对批处理或非关键路径使用 Spot 实例。
- 添加 nvidia_gpu_utilization 的 Prometheus 查询，并在利用率持续偏低时告警。

**预防**
- 在运行手册中加入每周成本评审。成本会变化，上季度合理的配置这季度可能不再合理。

---

## 12. Tokenizer 不匹配导致无意义输出

**症状**
- 输出字符级别不连贯，可能包含 BPE 痕迹（例如 Ġthe 而非带空格的 the）。

**诊断**
1. 检查分词器版本是否匹配模型版本。原文以 Llama-3 与 Llama-3.1 为例提醒注意版本。
2. 比较训练时与服务时的 tokenizer.encode("hello world")。

**修复**
- 在容器镜像中固定 tokenizer 和模型版本。
- 添加启动自检：编码、解码一条测试字符串，与预期输出比较。

**预防**
- 将 tokenizer 打包进模型制品。不要在运行时下载所谓的最新分词器。

---

## 13. CUDA 不匹配导致镜像构建或运行失败

**症状**
- docker build 成功，但在 GPU 节点运行容器时出现 CUDA driver version is insufficient 并崩溃。

**诊断**
- 容器 CUDA 版本高于宿主机驱动支持的版本。
- 宿主机 nvidia-smi 显示驱动版本（原文举例 535.x 支持至 CUDA 12.2）。

**修复**
- 将容器 CUDA 版本与宿主机驱动匹配：使用 nvcr.io/nvidia/cuda:12.2.2-runtime-ubuntu22.04 或其他匹配版本。
- 如果确实需要更新 CUDA，则升级宿主机驱动。

**预防**
- 在集群统一驱动与 CUDA 版本组合，并记录于集群配置说明。

---

## 14. Prometheus 采集导致服务 Pod CPU 升高

**症状**
- 服务 Pod CPU 每 15 秒出现峰值，与 Prometheus 采集时间一致。

**诊断**
- 检查 vLLM 指标基数。每请求标签可能造成基数爆炸。

**修复**
- 通过 Prometheus relabel 配置移除高基数标签。
- 如果 15 秒一次的开销显著，降低采集频率。

**预防**
- 部署前审计指标基数，使用 prometheus_tsdb_head_series 验证。

---

## 15. Spot 中断导致生成过程中 Pod 被驱逐

**症状**
- 正在处理的请求因连接重置而失败；Pod 在 30–60 秒后于新节点重启。

**诊断**
- 使用 `kubectl describe node <node>` 检查节点事件，查找 SpotInterruption 或 Preempted。

**修复**
- 添加 preStop Hook 并设置 terminationGracePeriodSeconds: 120，让 Pod 有机会排空正在处理的请求。
- 使用 AWS Spot 中断通知处理器等服务（原文示例提前 2 分钟通知），优雅地卸载负载。
- 延迟敏感的关键路径优先使用按需或预留实例。

**预防**
- 为中断做好规划。Spot 有利于成本，但需要相应架构。

---

## 另见

- docs/ARCHITECTURE.md — 系统设计及组件概览
- docs/DEPLOYMENT.md — 生产部署指南
- docs/OPTIMIZATION.md — 性能调优手册
- docs/COST.md — 成本分析及优化
- docs/RAG.md — 检索增强生成模式（如果适用于你的实现）

> 译注：原文指标名和 CLI 参数依版本变化，实际配置应核对正在运行的 vLLM 版本。KV Cache 公式中的 n_heads 应使用 KV heads（尤其 GQA 模型）；降低 gpu_memory_utilization 也可能使缓存容量不足。137 退出码不能单独证明 GPU OOM。readinessProbe 失败不会重启容器；长启动通常使用 startupProbe 并正确配置 livenessProbe。Prometheus 丢弃标签可降低存储基数，但未必减少应用端指标生成开销。原文的硬件带宽、量化质量、故障耗时与阈值均非普遍保证。
