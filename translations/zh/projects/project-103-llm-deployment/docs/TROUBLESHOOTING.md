# 故障排查——项目 103（LLM 部署）

LLM 部署项目的主要故障模式。每条按照症状 → 诊断 → 修复 → 预防组织。

> **提示：** 阅读运行手册前，使用 `kubectl describe pod <llm-serving-pod>`、`kubectl logs <pod> --tail=200` 及 `nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv` 捕获当前状态。很多问题可通过快照快速定位。

---

## 1. 模型加载时显存不足（OOM）

**症状**
- Pod 启动时崩溃，出现 torch.cuda.OutOfMemoryError、CUDA out of memory 或退出码 137。
- 崩溃前 nvidia-smi 显示显存接近 100%。

**诊断**
1. 计算所需内存：参数量 × 每参数字节数 + 激活 + KV Cache + 开销。
   - Llama-3.1-8B FP16 权重约 16GB。
   - 每序列 KV Cache：2 × 层数 × KV 头数 × 头维度 × 序列长度 × 每元素字节数。Llama-3.1-8B 在 4k 上下文约 0.5GB/序列。
2. 与 GPU 总显存比较（`nvidia-smi --query-gpu=memory.total`）。
3. 检查 vLLM 的 max_num_seqs、max_model_len、gpu_memory_utilization。

**修复**
- 将 gpu_memory_utilization 从默认 0.9 降至 0.85，留出余量。
- 将 max_model_len 降至实际需求，不为无用上下文保留 KV 容量。
- 减少 max_num_seqs（并发序列数）。
- 量化权重（AWQ、GPTQ，或 H100/L40S 使用 Transformer Engine FP8）。
- 使用更大显存 GPU（A10G 24GB → A100 40/80GB → H100 80GB）。

**预防**
- 部署前计算显存预算，在 Helm Values 中记录。
- 针对 `nvidia_gpu_memory_used_bytes / total > 0.95` 设置告警。

---

## 2. 首 Token 延迟过长（TTFT）

**症状**
- /generate 请求后首 Token 需要 2–10 秒以上；负载下 P95 TTFT 超过 1 秒。

**诊断**
1. 区分 Prefill 与 Decode 延迟。vLLM 暴露 vllm:time_to_first_token_seconds_bucket。
2. 检查队列深度 vllm:num_requests_waiting——较高值意味着调度器尚未接纳请求。
3. 检查提示词长度分布——单个 32k Token 提示词可能占据大量 Prefill 时间。

**修复**
- 多请求共享前缀（系统提示、Few-shot 示例）时启用 Prefix Caching。
- Prefill GPU 利用率不足时增大 max_num_batched_tokens。
- 极长提示词评估 Chunked Prefill（原文 vLLM 0.6+）。
- 短输出考虑推测解码（原文参数 --speculative-model）。

**预防**
- 设置 TTFT P95 SLO（例如提示词不超过 2k Token 时低于 500ms）。
- vllm:num_requests_waiting 大于 0 持续超过 60 秒时告警。

---

## 3. 吞吐达到平台期（Token/秒不再扩展）

**症状**
- 增加 GPU 或副本未提高总 Token/秒。

**诊断**
1. 检查每块 GPU 利用率：`nvidia-smi dmon -s u`。若 GPU 仅 50%，瓶颈可能在别处。
2. 检查 CPU：分词、采样、JSON 序列化可能受 CPU 限制。
3. 检查网络：张量并行时 NCCL AllReduce 延迟随 GPU 数增加，nccl-tests 可量化。

**修复**
- 将 Tokenizer 放入 Worker Pool，避免在请求处理线程运行。
- 关闭 enforce-eager，使 vLLM 对固定批量利用 CUDA Graph。
- 多 GPU 优先考虑 NVLink 连接，而非 PCIe（原文估计快约 10 倍）。
- 量化时确保框架可将量化融合至 Kernel，避免反量化 → MatMul → 再量化。

**预防**
- 交付物包含 Roofline 分析。了解计算受限与内存受限场景，指导后续决策。

---

## 4. 多 GPU 张量并行 NCCL 挂起

**症状**
- Pod 日志出现 NCCL WARN Cuda failure，或数分钟无输出。
- nvidia-smi 显示 GPU 利用率 0%。

**诊断**
1. 设置 NCCL_DEBUG=INFO，检查 AllReduce 环构建过程。
2. 确认 GPU 互相可见：`nvidia-smi topo -m` 中 TP 组 GPU 间应显示 NV#（NVLink）或 PIX（PCIe）。
3. 验证 CUDA_VISIBLE_DEVICES 与预期拓扑一致。

**修复**
- 指定网卡：NCCL_SOCKET_IFNAME=eth0（或 Pod 实际网卡）。
- 集群有 IB 但不使用时，设置 NCCL_IB_DISABLE=1 回退至 TCP。
- 使用 kubectl rollout restart 重启 Pod。原文指出 Init Container 遗留共享内存可能导致 NCCL 状态问题。

**预防**
- 新集群运行模型前使用 nccl-tests 预检互联问题。
- 在镜像固定 NCCL 版本，相关缺陷可能与版本有关。

---

## 5. KV Cache 频繁驱逐（负载下尾延迟高）

**症状**
- P99 延迟为 P50 的 10 倍，并发增加时吞吐下降。

**诊断**
- 检查 vllm:gpu_cache_usage_perc，负载下持续超过 95% 可能表示调度器反复驱逐与重新 Prefill。
- 检查 vllm:num_preempted_requests_total，增长说明发生抢占。

**修复**
- 减少 max_num_seqs，减少竞争 KV Block 的序列数。
- 增加 GPU 资源以提高总缓存容量。
- 聊天应用启用 Prefix Caching，复用系统提示词。
- 评估 PagedAttention 的 swap_space，将部分压力转移至 CPU 内存（较慢，但有容量限制）。

**预防**
- 将 KV Cache 作为一等容量维度，仅使用每秒请求数不足以描述 LLM 服务负载。

---

## 6. SSE 流式连接生成中途断开

**症状**
- 客户端收到部分输出后出现 connection closed。
- 服务端无错误日志。

**诊断**
1. 检查 Ingress/负载均衡器空闲超时（原文常见默认 30–60 秒）。
2. 使用 kubectl describe ingress 检查 proxy-read-timeout、proxy-send-timeout 注解。
3. 确认客户端实际消费流（某些客户端缓冲 SSE）。

**修复**
- Ingress 设置 nginx.ingress.kubernetes.io/proxy-read-timeout: "600" 和 proxy-send-timeout: "600"。
- SSE 流每 15–20 秒发送 `: keep-alive` 注释，避免中间节点超时。
- 极长生成考虑分段独立请求。

**预防**
- CI 包含长生成测试（至少 2,000 个输出 Token）。

---

## 7. 模型加载缓慢（超过 5 分钟）

**症状**
- Pod 启动后数分钟处于 Running 但未 Ready。

**诊断**
1. 检查每次启动是否从 Hub 下载模型（查看 Hugging Face 下载日志）。
2. 检查 readinessProbe。若 /ready 仅在完全加载后变为就绪，等待时间即实际加载时间。

**修复**
- 将模型预打包至容器镜像，或使用预填充模型的 PVC。
- 使用更高带宽存储类型（例如 gp3 对比 gp2，原文举例 1GiB/s）。
- 分片模型并行预取各 Shard。
- 原文建议增加 readinessProbe.initialDelaySeconds，避免加载期间重启。

**预防**
- 使用 DaemonSet 在节点预拉取镜像。
- README 记录每种模型与硬件组合的预期冷启动时间。

---

## 8. FP8 数值漂移（量化输出偏离基线）

**症状**
- FP8/AWQ/GPTQ 模型输出质量低于 FP16 基线，如输出更长、幻觉增加、JSON 损坏。

**诊断**
1. 使用留出评估集比较困惑度、准确率、指令遵循分数。
2. 检查校准数据与推理分布匹配程度；Wikitext 校准用于聊天可能影响质量。
3. 检查激活缩放是 Per-tensor（FP8）还是 Per-channel（AWQ），错误缩放策略影响质量。

**修复**
- 用匹配服务分布的数据重新校准 AWQ/GPTQ。
- Transformer Engine FP8 检查 fp8_recipe（DelayedScaling 或 Current）。
- 尝试其他量化方案，原文认为 AWQ 聊天质量通常优于 GPTQ。

**预防**
- 生产晋升前在实际评估集测试量化版本，项目规范 1.5 个百分点阈值旨在保守控制质量。

---

## 9. HPA 不扩容或不缩容

**症状**
- 负载变化时副本数仍卡在最小或最大值。

**诊断**
1. `kubectl describe hpa <name>`，检查 Conditions 及目标/当前指标。
2. 确认指标到达 Prometheus 与 HPA 指标来源（Prometheus Adapter、KEDA）。
3. GPU 负载中 CPU 指标可能无法反映实际负载，确认 HPA 使用请求相关指标（队列深度、RPS、GPU 利用率）。

**修复**
- HPA 改用自定义指标：vllm:num_requests_waiting 是较好的信号。
- Prometheus Adapter 不稳定时考虑 KEDA prometheus Scaler。
- 设置 behavior.scaleDown.stabilizationWindowSeconds: 300，避免震荡。

**预防**
- 专门进行 HPA 负载测试。用阶梯负载验证扩缩容均如预期发生。

---

## 10. 突发负载下队列饱和

**症状**
- 突发请求造成积压，新请求排队数秒至数分钟。

**诊断**
- vllm:num_requests_waiting 激增。
- 按租户追踪发现单租户占用全部容量。

**修复**
- API 层按租户限流（例如 FastAPI 中按 API Key 使用 RateLimitMiddleware）。
- num_requests_waiting 大于 N 时返回 HTTP 429，实施负载卸除。
- 增加副本（HPA 基于队列深度，参见第 9 节）。
- 混合负载可采用分级路由，小模型低成本快速服务，大模型服务高端需求。

**预防**
- 除稳态外，始终对突发流量建模。原文强调尾部吞吐表现比均值更重要。

---

## 11. 部署后费用超预期

**症状**
- 云月账单 GPU 费用远高于预测。

**诊断**
1. 检查实际 GPU 小时数（副本数 × 运行小时数），乘按需费率估算费用。
2. 与项目 COST.md 分析比较。
3. 检查僵尸 Pod（扩至 10 个副本却不缩回）、Spot 中断导致重启、低效批处理（GPU 利用率低但完整供应）。

**修复**
- 合理调整规格：GPU 稳态利用率低于 40% 时检查是否副本过多。
- 批处理或非关键路径使用 Spot。
- 添加 nvidia_gpu_utilization Prometheus 查询，持续低利用率时告警。

**预防**
- 运行手册加入每周成本复盘。费用会漂移，上季度的合理配置本季度可能不合理。

---

## 12. Tokenizer 不匹配导致乱码输出

**症状**
- 输出不连贯，可能有 BPE 表示残留（如 Ġthe 而非带空格的 the）。

**诊断**
1. 检查 Tokenizer 与模型版本是否匹配；Llama-3 与 Llama-3.1 的 Tokenizer 配置需核对。
2. 比较训练与服务时 tokenizer.encode("hello world") 的结果。

**修复**
- 镜像内固定 Tokenizer 及模型版本。
- 启动自检：对测试字符串编码、解码并与预期对比。

**预防**
- Tokenizer 打包进模型产物，运行时不下载所谓 latest。

---

## 13. CUDA 不匹配导致镜像构建或运行失败

**症状**
- docker build 成功，但 GPU 节点容器崩溃，出现 CUDA driver version is insufficient。

**诊断**
- 容器 CUDA 版本超过宿主驱动支持范围。
- 宿主 nvidia-smi 显示驱动版本（原文举例 535.x 支持至 CUDA 12.2）。

**修复**
- 将容器 CUDA 与宿主驱动匹配，如 nvcr.io/nvidia/cuda:12.2.2-runtime-ubuntu22.04 或适用版本。
- 确需新版 CUDA 时升级宿主驱动。

**预防**
- 集群统一驱动与 CUDA 组合，在集群配置笔记记录。

---

## 14. Prometheus 抓取造成服务 Pod CPU 升高

**症状**
- Pod CPU 每 15 秒激增，与 Prometheus 抓取一致。

**诊断**
- 检查 vLLM 指标基数。逐请求 Label 可能使基数爆炸。

**修复**
- 使用 Prometheus Relabel 配置删除高基数标签。
- 若每 15 秒抓取开销明显，降低采集频率。

**预防**
- 部署前审计指标基数，使用 prometheus_tsdb_head_series 验证。

---

## 15. Spot 中断导致生成中途 Pod 被驱逐

**症状**
- 进行中请求出现 connection reset，30–60 秒后 Pod 在新节点重启。

**诊断**
- `kubectl describe node <node>` 检查事件中的 SpotInterruption 或 Preempted。

**修复**
- 添加 PreStop Hook，terminationGracePeriodSeconds: 120，让 Pod 排空进行中请求。
- 使用 AWS Spot 中断通知处理器（原文示例两分钟预警）等机制优雅卸载流量。
- 延迟关键路径优先按需或预留实例。

**预防**
- 为中断做好规划。Spot 能降低成本，但需要合适架构。

---

## 另见

- docs/ARCHITECTURE.md——系统设计及组件概览。
- docs/DEPLOYMENT.md——生产部署指南。
- docs/OPTIMIZATION.md——性能调优手册。
- docs/COST.md——成本分析与优化。
- docs/RAG.md——检索增强生成模式（如适用）。

> 译注：第 1 节 KV Cache 公式中的原文 n_heads 对 GQA 模型应理解为 KV Head 数，退出码 137 也可能由宿主内存不足等原因导致。Readiness 探针失败不会重启容器，慢启动应配合 Startup Probe 与 Liveness 配置。vLLM 参数及指标名称随版本变化，降低 gpu_memory_utilization 可能进一步压缩可用 KV 容量；应根据错误原因调整。Prometheus 抓取后删除标签不能降低应用生成高基数指标的开销，应优先修复埋点。量化性能、拓扑带宽及驱动兼容性需按实际版本验证；未运行原文命令。
