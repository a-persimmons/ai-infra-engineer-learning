# 课程提案：AI 基础设施工程师——2026-10

由 `aicg org research --apply` 生成。限制：

- `max_modules_per_run`：1
- `max_exercises_per_run`：3
- `max_projects_per_run`：0
- `min_evidence_count`：每项至少 3 条招聘信息

## 理由

本轮不新增内容——连续第三个周期得出相同结论（2026-08、2026-09、2026-10）。

对过去 90 天（窗口起始于 2026-07-04，观察日期为 2026-10-02）的 35 条新招聘信息进行抽样，识别出 26 项不同要求，覆盖推理平台专家企业（Together AI 7 条、Hippocratic、Etched、Fireworks、Baseten、Cursor、Lightning AI、Deepgram 2 条、xAI 推理）、前沿实验室（Anthropic 3 条、xAI 网络、Ai2）、平台与厂商（vCluster、Databricks、Anyscale、Datadog、间接涉及 NVIDIA）、MLOps/ML 平台团队（SimpliSafe、Gusto、Stripe、DoorDash）以及企业、国防与金融（Figma 2 条、Gatik、Anduril、Intercom）。

所有达到或超过 0.30 连续性偏好频率阈值的要求，均已由现有模块或练习覆盖，或依据归属规则由相邻路线负责。

连续两个周期的信号现已稳定：裸金属网络维持在 0.40（此前 0.43，职级均衡后为 0.38），但硬性要求的深度仍集中于高级/Staff 职级。上一周期已将深入内容归入 ai-infra-senior-engineer-learning，mod-107 的工程师级接触足够。Go/Rust/C++ 维持在 0.69（此前 0.66）；依据归属规则，语言广度由 ai-infra-junior-engineer-learning 负责。

LLM 服务由 0.34 升至 0.40，但已由 mod-110 覆盖（vLLM/SGLang/TensorRT-LLM/Triton；本轮首次出现的 NVIDIA Dynamo 仅见于两条招聘信息，它是复用相同 KV Cache/批处理基础能力的同类服务框架）。

上周期「基础设施工程师自行构建运维 LLM Agent」的信号为 0.23，本轮狭义信号降至 0.11，且集中在 Together AI（四条狭义提及中的三条），属于雇主自身举措，而非市场变化。

独立 30 天趋势扫描标记的三个新兴项目（NVIDIA Dynamo、分离式推理/NIXL、OTel GenAI 语义约定）在样本中分别出现不超过两条招聘信息（Dynamo 2、分离式推理 1、OTel GenAI 0），均低于三条招聘信息的证据下限以及 0.30 频率阈值。其概念基础（KV Cache 管理、连续批处理、OTel）已由 mod-108 与 mod-110 覆盖。

MCP 为 0.06、Kubernetes DRA 为 0.03、AMD ROCm/AWS Trainium 明确提及次数为 0，均继续保留在观察清单中。

这是成熟、持续演进课程的预期结果：中级工程师岗位市场保持稳定，真正的变化属于跨路线调整（初级负责语言广度，高级负责裸金属深度），厂商侧技术变化尚未以达到规定阈值的频率进入招聘描述。若 2026-11 中 Dynamo 出现在 ≥10 条招聘信息中，或 OTel GenAI 约定明确提及频率 ≥0.30，再提出 mod-110 或 mod-108 的增量练习。

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
