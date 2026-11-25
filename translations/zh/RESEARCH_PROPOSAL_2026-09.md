# 课程提案：AI 基础设施工程师——2026-09

由 `aicg org research --apply` 生成。限制：

- `max_modules_per_run`：1
- `max_exercises_per_run`：3
- `max_projects_per_run`：0
- `min_evidence_count`：每项至少 3 条招聘信息

## 理由

本轮不新增内容。对过去 90 天（窗口起始于 2026-06-04，观察日期为 2026-09-02）的 35 条新招聘信息进行抽样，共识别出 27 项不同要求，覆盖前沿实验室（Anthropic 6 条、Perplexity、Scale AI、Together AI 4 条、xAI、Lila 2 条、Ai2）、超大规模服务商与基础设施厂商（NVIDIA、Lightning AI 2 条、Mithril、Cisco、vCluster Labs）、MLOps 与模型服务专家企业（Hippocratic、Utilidata、Deepgram、SpaceX 推理）以及企业（Capstone、SimpliSafe 2 条、DoorDash、Airbnb、Figma、Anduril、Gatik、Glean、Allen Institute）。

所有达到或超过 0.30 连续性偏好频率阈值的要求，均由现有模块或练习覆盖，或者依据归属规则由相邻学习路线负责。

相较 2026-08 周期，有两个频率变化被列入观察清单，但均不足以支持工程师级课程新增：

1. 裸金属网络（InfiniBand/NCCL/NVLink）由 0.23 升至 0.43，但样本偏向 Staff/高级岗位，上一周期已将深入内容归入高级工程师路线，现有 mod-107 lab-03 与参考资料足以提供工程师级接触。如果 2026-10 的职级均衡样本确认频率 ≥0.30，则值得增加一个 mod-107 练习。
2. Go/Rust/C++ 系统编程由 0.30 升至 0.66，但依据归属规则，基础语言广度由初级路线（ai-infra-junior-engineer-learning）负责；mod-101 已提到多语言接触，初级路线的研究周期应评估是否值得在那里增加 Go 或 Rust 专项练习。

构建 LLM 驱动的 Agent 运维工具的新兴模式（Glean、Capstone、Gatik、Airbnb、Figma）频率为 0.23，低于阈值，继续观察。MCP 仍为 0.03（仅 Airbnb 一条招聘信息）。

RAG（0.37 → 0.03）、MLflow（0.40 → 0.06）和 LLM 护栏（0.30 → 0.06）需求下降，反映本轮样本偏重模型服务、基础设施和 HPC，而非市场需求萎缩；现有练习继续保留。

这是成熟、持续演进课程的预期结果：高频市场信号保持稳定，真正的变化属于跨路线调整（初级路线负责语言广度，高级路线负责裸金属深度），而非工程师路线的新增内容。

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
