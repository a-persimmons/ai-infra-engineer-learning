# 课程提案：AI 基础设施工程师——2026-11

由 `aicg org research --apply` 生成。限制：

- `max_modules_per_run`：1
- `max_exercises_per_run`：3
- `max_projects_per_run`：0
- `min_evidence_count`：每项至少 3 条招聘信息

## 理由

本轮不新增内容——连续第四个周期得出相同结论（2026-08、2026-09、2026-10、2026-11）。

对过去 90 天（窗口起始于 2026-08-04，观察日期为 2026-11-02）的 33 条新招聘信息进行抽样，覆盖前沿实验室（Anthropic 2 条、xAI、Together AI 4 条、Ai2、Hippocratic、Perplexity）、推理专家企业（Fireworks、Baseten、Etched、Lightning AI 2 条、Deepgram）、平台厂商（NVIDIA、CoreWeave、vCluster、Databricks、Datadog、Anyscale、Lambda）、MLOps/ML 平台团队（Gusto、DoorDash 2 条）以及企业、国防与金融（Anduril 2 条、Capital One、Mastercard、GitHub、Jane Street、Shield AI）。

2026-10 周期为 2026-11 设置了三个具体触发条件，三项均未达到：

- （A）Dynamo 出现在 ≥10 条招聘信息中 → 实际为 1/33（仅 Hippocratic AI，其同时首次明确提到 NIXL）。
- （B）OTel GenAI 约定明确提及频率 ≥0.30 → 实际为 0/33（Lambda、CoreWeave、Etched 提及普通 OpenTelemetry，但没有招聘信息提到 gen_ai.* 约定；截至 2026 年 8 月，semconv-genai 仓库仍为 Development 状态）。
- （C）裸金属网络职级均衡样本 n≥25、仅硬性要求频率 ≥0.30 → 实际职级均衡 n=15（低于样本量门槛），硬性要求频率 4/15=0.27（低于 0.30）。

三项继续列入观察清单，触发条件延续至 2026-12。

另外，更广义的「分离式模型服务」概念已达到三条招聘信息的证据下限（Together Reliability p04、Fireworks p08、Hippocratic p10），总体频率 0.09——高于证据下限但低于 0.30 连续性阈值。mod-110 exercise-03 已涵盖 KV Cache 管理与分离式模型服务所依赖的 Prefill/Decode 基础能力。

本轮新出现的要求 Kubernetes DRA（NVIDIA p19：「Container Device Interface (CDI) and Dynamic Resource Allocation (DRA)」）为 1/33，且仅出现在厂商侧；mod-104 可以在内容更新时提及 DRA。

持续高于阈值的信号在四个周期保持稳定：裸金属网络 0.43 → 0.40 → 0.42（按规则由高级路线负责）、Go/Rust/C++ 0.66 → 0.69 → 0.64（按规则由初级路线负责）、Kubernetes 0.77 → 0.54 → 0.70、Python 0.77 → 0.77 → 0.76。没有新的高于阈值但尚未覆盖的要求。

「基础设施工程师构建运维 LLM Agent」信号继续减弱（0.23 → 0.11 → 0.06），证实 2026-10 的判断：之前的峰值是 Together AI 的雇主举措，而非市场变化。

对于具有明确可衡量触发条件、并采用连续性偏好策略的成熟课程，这是预期结果：不会仅凭厂商炒作而添加内容。

## 已接受

### 模块

_无。_

### 练习

_无。_

### 项目

_无。_

## 已拒绝

_无。_

---

## 审批

**本提案不会自动向课程添加任何内容。**

如果批准部分或全部已接受的项目，请合并此 PR。合并后，运行 `aicg org promote-plan --role <role>`（或等待下一次每周审计），将过滤后的增量变更应用至 `curriculum-plan.json`，并创建内容骨架。

如果全部拒绝，请关闭 PR。无需进一步操作；下一次研究运行将重新提出仍有就业市场依据的项目。
