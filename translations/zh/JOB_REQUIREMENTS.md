# 岗位要求 — AI 基础设施工程师

**岗位：** AI 基础设施工程师（20 级，中级）
**研究周期：** 2026-11
**分析的招聘信息：** 33 条（最近 90 天，时间窗口始于 2026-08-04）
**所属学习路线：** [`ai-infra-engineer-learning`](./)

本文将当前招聘信息中抽样提取的要求映射到现有课程。机器可读版本见 [`.aicg/job-requirements.json`](./.aicg/job-requirements.json)。建议新增的内容（如有）见 [`.aicg/curriculum-plan-delta.json`](./.aicg/curriculum-plan-delta.json)。

归属规则：每项要求归属于真正需要该技能的最低级别岗位。更高级别的学习路线引用其归属课程，除非需要不同的学习深度。

---

## 摘要

提取的 30 项不同要求中，**25 项已被现有模块或练习完整覆盖**，**4 项部分覆盖**（依据归属规则，深度内容归属于高级或初级路线），**1 项未覆盖要求远低于 0.30 的频率阈值**（MCP 为 0.03）。根据优先保持课程连续性的政策，**本周期不建议新增内容**——这是连续第四个周期得出这一结论（2026-08、2026-09、2026-10、2026-11）。

**2026-10 周期为 2026-11 设置了三个具体触发条件，按既定标准判断，三者均未触发：**

- **至少 10 条招聘信息明确提到 NVIDIA Dynamo：** 实际为 1/33（仅 Hippocratic AI——“NVIDIA Dynamo/NIXL、SGLang、vLLM 或 TensorRT-LLM”）。**未触发。**
- **明确提到 OTel GenAI 语义约定的比例 ≥0.30：** 实际为 0/33。招聘信息提到了基础 OpenTelemetry（Lambda p18、CoreWeave p20、Etched p11），但仍没有任何信息明确提及 `gen_ai.*` 扩展约定。semconv-genai 仓库于 2026 年中迁移至独立仓库，截至 2026 年 8 月仍标记为“Development”（尚未稳定），这与招聘端尚未出现相关要求相符。**未触发。**
- **提升裸金属网络课程深度（级别均衡样本 n≥25，硬性要求比例 ≥0.30）：** 实际级别均衡样本 n=15（低于 n≥25 的规模要求），仅硬性要求比例为 4/15 = 0.27（低于 0.30）。**两项标准均未达到。**

与 2026-10 相比的信号稳定性：

- **裸金属网络**维持在 **0.42**（此前为 0.40、0.43）。级别均衡视角（中级及中高级，n=15）为 0.33，高于岗位级别阈值，但提升深度的触发条件要求 n≥25 且仅硬性要求比例 ≥0.30，本周期两者均未达到。硬性要求的深度仍集中于高级或 Staff 级岗位（Anthropic 集群基础设施、xAI 网络、Anduril 物理基础设施、Jane Street 性能）。中级岗位仍多将其列为“加分项”或“熟悉即可”。归属于高级路线仍然适当。
- **Go/Rust/C++ 系统编程**维持在 **0.64**（此前为 0.69、0.66）。根据归属规则，仍属于初级路线（`ai-infra-junior-engineer-learning`）。mod-101 已说明需要接触多种语言。工程师路线无需采取措施。
- **LLM 服务框架**降至 **0.18**（此前为 0.40、0.34）。mod-110 的 exercise-03（vLLM 深入学习）、exercise-01（生产级 LLM 服务）和 exercise-06（推理优化）已完整覆盖。变化源自样本构成（本周期专门从事推理的公司较少）。
- **Kubernetes**回升至 **0.70**（此前为 0.54、0.77）——源自样本构成。
- **可观测性**降至 **0.18**（此前为 0.34、0.46）——源自样本构成。

2026-10 趋势扫描的观察项在工程师级别仍普遍**低于**三条招聘信息的证据门槛：

- **NVIDIA Dynamo：** 1/33（Hippocratic）。NVIDIA 自身有多个标注 Dynamo 的在招岗位，属于预期的供应商端偏差；非 NVIDIA 招聘端的信号尚未扩大。本周期首次出现明确的“NIXL”表述（Hippocratic）。
- **解耦式推理：** 3/33（Together Reliability p04、Fireworks p08、Hippocratic p10）——概念本身已达到三条招聘信息的门槛，但总体比例仅为 0.09，且三个岗位都来自 mod-110 已为学习者做好准备的推理专业公司。
- **OTel GenAI 约定：** 0/33，仍未被明确提及。
- **Kubernetes DRA：** 1/33（NVIDIA p19，首次明确提及 DRA，属于供应商端）。
- **MCP：** 1/33（DoorDash MDX 加分项）。

2026-10 的“基础设施工程师构建 LLM Agent 用于运维”信号持续回落，目前为 0.06（此前为 0.11、0.23）。集中在 Together AI 的短暂峰值已经消退，这进一步表明它是某个雇主的产品计划，而非市场转变。

---

## 按类别划分的岗位要求

### 编程基础

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| 使用 Python 实现基础设施自动化 | 0.76 | [Junior AI Infra Engineer](../ai-infra-junior-engineer-learning/) | [`mod-101-foundations`](./lessons/mod-101-foundations/) |
| 使用 Go / Rust / C++ 进行系统编程 | 0.64 | [Junior AI Infra Engineer](../ai-infra-junior-engineer-learning/) — 见 [note](#note-on-gorustcpp) | [`mod-101-foundations`](./lessons/mod-101-foundations/) — 部分覆盖 |

**证据要点：** Anthropic 分布式系统（×2）：*“扎实的编程基础，熟练使用 Python、Rust、Go、Java 或类似语言”*（p01、p02）。xAI 训练/推理相关技术需求在 Together AI 推理岗位中延续：*“了解 Rust、Cython 和编译器”*（p06）。Together AI 基础设施系统：*“扎实的 Python、Go 或 Rust 软件工程技能”*（p07）。Hippocratic AI：*“Python 和 C++”* 的要求隐含于 *“深入的 C++/CUDA 系统编程能力”*（p10）。Etched 测试基础设施：*“扎实的 Python、C++ 或 Rust 编程技能”*（p11）。Perplexity MTS：*“面向系统和基础设施自动化的 Python 和 C++ 编程”*（p12）。NVIDIA 容器：*“专家级系统编程语言知识（Go、C）”*（p19）。CoreWeave：*“扎实的 Python 或 Go 编程能力（C++ 为加分项）”*（p20）。Anduril Staff：*“熟练使用 Python、Go、C++ 或类似后端语言”*（p27）。Capital One：*“6 年以上 Python、Go、Scala 或 Java 编程经验”*（p29）。GitHub Copilot 推理：*“4 年以上使用 C、C++、C#、JavaScript、Go、Ruby、Rust 或 Python 编写生产代码的软件工程经验”*（p30）。

<a id="note-on-gorustcpp"></a>**关于 Go/Rust/C++ 的说明：** 连续第四个周期处于 0.64–0.69 区间。按照归属规则，语言广度属于初级路线。mod-101 已说明需要接触多种语言。初级路线（`ai-infra-junior-engineer-learning`）的研究周期应评估是否需要专门的 Go 或 Rust 练习，而不是在工程师级别采取措施。

### 容器与编排

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| Docker、多阶段构建、GPU 容器 | 0.15（明确提及） | 本岗位 | [`mod-103-containerization`](./lessons/mod-103-containerization/) |
| 生产级 Kubernetes（CRD、Operator、GPU 调度、RBAC） | 0.70 | 本岗位 | [`mod-104-kubernetes`](./lessons/mod-104-kubernetes/) |

**证据要点：** Lambda 核心基础设施：*“5 年以上平台、基础设施或 SRE 岗位经验，包括大规模生产环境 Kubernetes 运维……深入了解 Kubernetes 内部机制及 Day-2 运维”*（p18）。NVIDIA 容器/K8s：*“深入理解容器编排系统（K8s）……具有 K8s Operator 框架经验……使 GPU 成为云原生环境的一等资源”*（p19）。vCluster：*“5 年以上生产 Kubernetes 部署和运维经验，最好在裸金属上……NVIDIA GPU Operator……CNI 插件、覆盖网络……Kubernetes Operator”*（p21）。Perplexity：*“精通 Kubernetes 管理，包括自定义资源定义、Operator 和集群管理”*（p12）。Deepgram 平台：*“专家级 Kubernetes 架构及大规模环境运维知识”*（p13）。Docker 被明确列为要求的比例持续下降，因为它已被视作默认基础技能。

### 云平台

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| 深入掌握 AWS/GCP/Azure 中一个，并具备第二个的实用知识 | 0.21（明确提及） | 本岗位 | [`mod-102-cloud-computing`](./lessons/mod-102-cloud-computing/) |
| 多云以及本地、云端、边缘混合架构模式 | 0.12 | 本岗位 | [`mod-102-cloud-computing`](./lessons/mod-102-cloud-computing/) + [`mod-109-infrastructure-as-code`](./lessons/mod-109-infrastructure-as-code/) |

**证据要点：** Anthropic 基础设施：*“AWS 和/或 GCP 上的现代云基础设施，包括 Kubernetes 和基础设施即代码”*（p01、p02）。Deepgram：*“AWS 经验……设计、构建并优化 AI/ML 作业调度”*（p13）。Gusto ML 平台：*“至少掌握一个主流云平台（优先 AWS，但非必须）”*（p26）。Capital One：*“7 年以上在 AWS、Google Cloud、Azure 或私有云部署可扩展 AI 解决方案的经验”*（p29）。Mastercard：*“负责本地或私有云环境的基础设施路线图”*（p33）。明确提及超大规模云厂商的比例持续下降，因为招聘信息越来越默认候选人熟悉云，而非逐一列举供应商。

### 基础设施即代码与 CI/CD

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| Terraform（或等效 IaC 工具 Pulumi、Ansible）、Helm | 0.21 | 本岗位 | [`mod-109-infrastructure-as-code`](./lessons/mod-109-infrastructure-as-code/) |
| CI/CD（GitHub Actions / GitLab）；GitOps（ArgoCD/Flux） | 0.15 | 本岗位 | [`mod-109-infrastructure-as-code`](./lessons/mod-109-infrastructure-as-code/) + [`mod-106-mlops`](./lessons/mod-106-mlops/) |
| 密钥管理、IAM、SSO/OIDC、API 安全 | 0.00 | 本岗位 | [`mod-109-infrastructure-as-code`](./lessons/mod-109-infrastructure-as-code/) |

**证据要点：** Together AI 基础设施系统：*“具备 Linux、Kubernetes、Terraform、Ansible 或类似基础设施技术经验”*（p07）。Etched：*“具有自动化和配置管理（如 Ansible、Terraform）及 CI/CD 经验”*（p11）。Perplexity：*“基础设施即代码工具（Terraform、Ansible）和 GitOps 实践”*（p12）。Lambda：*“熟练使用基础设施即代码（Terraform、Pulumi 或等效工具）……熟悉 Helm、Kustomize 或类似工具以及基于 GitOps 的交付”*（p18）。Deepgram：*“具有使用 Terraform 构建和管理生产基础设施的实际经验证明”*（p13）。本周期明确提及密钥/IAM 的比例降至 0（样本构成因素——本周期企业/金融类样本没有强调认证和身份）。

### 可观测性与可靠性

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| 指标/日志/链路追踪（Prometheus、Grafana、OTel、Datadog）及 SLO | 0.18 | 本岗位 | [`mod-108-monitoring-observability`](./lessons/mod-108-monitoring-observability/) |
| 值班轮换、事故响应、根因分析（RCA） | 0.12 | 本岗位 | [`mod-108-monitoring-observability`](./lessons/mod-108-monitoring-observability/) |
| OpenTelemetry GenAI 语义约定（`gen_ai.*`） | **0.00** | 本岗位 | 见 [watch-list](#opentelemetry-genai-semantic-conventions--still-no-posting-signal) |

**证据要点：** Etched：*“具有监控和可观测性工具（如 Prometheus、Grafana）的使用经验”*（p11）。Lambda：*“具有可观测性技术栈（Prometheus、Grafana、OpenTelemetry）的实践经验”*（p18）。CoreWeave：*“使用 Prometheus、Grafana、OpenTelemetry 监控和诊断基础设施”*（p20）。Datadog：*“开发 Datadog LLM 可观测性产品的新功能和基础能力”*（p22）。Together AI 可靠性：*“按照明确的可靠性和可观测性标准进行运维”*（p10——同一类别）。**仍没有任何招聘信息明确提及 OTel GenAI 语义约定（0/33），见观察清单。**

### GPU 计算与分布式训练

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| NVIDIA GPU 技术栈（CUDA、GPU Operator、MIG、GPU 节点运维） | 0.39 | 本岗位 | [`mod-107-gpu-computing`](./lessons/mod-107-gpu-computing/) |
| 分布式训练（PyTorch DDP、FSDP、DeepSpeed、Ray Train、Megatron/JAX） | 0.09 | 本岗位 | [`mod-107-gpu-computing/exercises/exercise-06-distributed-gpu-training`](./lessons/mod-107-gpu-computing/exercises/exercise-06-distributed-gpu-training/) |
| **裸金属网络（InfiniBand、NCCL、NVLink、RoCE）** | **0.42（持续）** | [Senior AI Infra Engineer](../ai-infra-senior-engineer-learning/) | 部分覆盖——[`mod-107`](./lessons/mod-107-gpu-computing/) 提供入门接触；深入运维属于高级/性能路线 |
| 高性能并行存储（VAST、Weka、Lustre、DDN、GPUDirect Storage） | 0.24 | [Senior AI Infra Engineer](../ai-infra-senior-engineer-learning/) | 未直接覆盖；通过 [`mod-107`](./lessons/mod-107-gpu-computing/) 接触相关概念 |
| GPU 调度（NVIDIA GPU Operator、Run:AI/KAI、Volcano、**DRA**） | 0.15 | 本岗位 | [`mod-104-kubernetes`](./lessons/mod-104-kubernetes/) |

**证据要点：** Anthropic：*“GPU、TPU 或 Trainium 等机器学习基础设施以及 NCCL 等相关网络技术”*（p01、p02）。Together AI 印度推理：*“GPU 集群软件栈经验（NCCL、CUDA、InfiniBand/RoCE）……接触裸金属供应（PXE/iPXE、Redfish/IPMI、BMC）”*（p05）。Together AI 基础设施系统：*“GPU 基础设施、CUDA、NCCL 或 NVLink/NVSwitch 经验……InfiniBand 或 RoCE 网络经验”*（p07）。Hippocratic：*“GPU 通信技术，包括 NCCL、NVLink/NVSwitch、InfiniBand、RoCE、RDMA、UCX……NVLS、SHARP、GPUDirect RDMA、UCX 或拓扑优化”*（p10）。Lightning AI 基础设施运维：*“NVIDIA GPU、DCGM、InfiniBand、RoCE/RDMA、NVLink……PXE、BMC、IPMI、Redfish 或 iDRAC……VAST、Ceph、GPFS 或 WEKA”*（p15）。Ai2：*“工作负载调度器经验（Kubernetes 或 Slurm）……高性能网络知识（NCCL 和 InfiniBand）……本地存储系统（WEKA 和 Ceph）”*（p16）。CoreWeave：*“CUDA Kernel、NCCL/SHARP、RDMA/NUMA 或 GPU 互连拓扑”*（p20）。Anduril 物理基础设施：*“100 块以上 GPU 集群中的 NVLink、InfiniBand、RoCE、Spectrum-X……VAST、DDN、Weka、Lustre……NVIDIA NVL72 机架级系统……强烈优先考虑 Run:ai 或类似 GPU 编排技术”*（p28）。Jane Street：*“InfiniBand、RoCE、GPUDirect、PXN、rail 优化、NVLink……NCCL 或 MPI 集合通信算法……CUTLASS、CUB、Thrust、cuDNN、cuBLAS”*（p31）。NVIDIA 容器：*“突出优势：容器设备接口（CDI）和动态资源分配（DRA）”*（p19）——**本周期首次明确提及 DRA。**

### LLM 服务与推理优化

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| LLM 服务框架（vLLM、SGLang、TensorRT-LLM、Triton、TGI、**Dynamo**）；连续批处理、PagedAttention、KV Cache、Token 流式输出、限流 | 0.18 | 本岗位 | [`mod-110-llm-infrastructure/exercises/exercise-03-vllm-deep-dive`](./lessons/mod-110-llm-infrastructure/exercises/exercise-03-vllm-deep-dive/) + [`exercise-01-production-llm-serving`](./lessons/mod-110-llm-infrastructure/exercises/exercise-01-production-llm-serving/) + [`exercise-06-inference-optimization-llm`](./lessons/mod-110-llm-infrastructure/exercises/exercise-06-inference-optimization-llm/) |
| NVIDIA 专用服务技术（Triton、Dynamo、NeMo、TensorRT） | 0.12 | 本岗位 | [`exercise-06-inference-optimization-llm`](./lessons/mod-110-llm-infrastructure/exercises/exercise-06-inference-optimization-llm/) + [`exercise-01-production-llm-serving`](./lessons/mod-110-llm-infrastructure/exercises/exercise-01-production-llm-serving/) |
| 模型量化（INT8/INT4/FP8/FP4/FP6、GPTQ、AWQ） | 0.03 | 本岗位 | [`exercise-06-inference-optimization-llm`](./lessons/mod-110-llm-infrastructure/exercises/exercise-06-inference-optimization-llm/) + [`mod-107/exercise-08-mixed-precision`](./lessons/mod-107-gpu-computing/exercises/exercise-08-mixed-precision/) |
| 高级推理（推测解码、KV Cache 调优、前缀缓存、Eagle、多 LoRA、解耦式服务） | 0.12 | 本岗位 | [`exercise-03-vllm-deep-dive`](./lessons/mod-110-llm-infrastructure/exercises/exercise-03-vllm-deep-dive/) + [`exercise-13-semantic-caching`](./lessons/mod-110-llm-infrastructure/exercises/exercise-13-semantic-caching/) |
| **NVIDIA Dynamo + NIXL**（解耦式推理） | **0.03** | 本岗位 | [`exercise-03-vllm-deep-dive`](./lessons/mod-110-llm-infrastructure/exercises/exercise-03-vllm-deep-dive/) — 已覆盖底层概念；见 [watch-list](#nvidia-dynamo--disaggregated-inference-still-emerging) |

**证据要点：** Together AI ML 推理：*“了解现有 AI 推理系统，如 TGI、vLLM、TensorRT-LLM 或 Optimum……推测解码……CUDA/Triton 编程”*（p06）。Fireworks：*“vLLM、SGLang 或 TRT-LLM……上下文长度、解耦式 Prefill、KV Cache 显存估算”*（p08）。Hippocratic：*“为 vLLM、SGLang 或 TensorRT-LLM 贡献代码……推测解码及 Eagle 方法……FP4/FP6 量化……带优化缓存的解耦式服务……NVIDIA Dynamo/NIXL”*（p10）。Databricks 模型服务：*“模型服务、推理系统或相关基础设施……微调及专有大语言模型……CPU 和 GPU 工作负载上的高吞吐量、低延迟推理”*（p23）。Capital One：*“LLM 推理、向量数据库、护栏和记忆系统专业知识……AWS Ultraclusters、Hugging Face、PyTorch、向量数据库、NeMo Guardrails”*（p29）。GitHub Copilot：*“AI 或大语言模型推理系统、模型 API 或模型供应商集成”*（p30）。

### LLM 安全、护栏与成本

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| LLM 安全控制：护栏、提示词注入防御、个人身份信息脱敏、工具调用安全 | 0.03 | 本岗位 | [`exercise-11-llm-guardrails`](./lessons/mod-110-llm-infrastructure/exercises/exercise-11-llm-guardrails/) |
| LLM 成本路由/归因、语义缓存、GPU 利用率 | 0.00 | 本岗位 | [`exercise-08-llm-cost-routing`](./lessons/mod-110-llm-infrastructure/exercises/exercise-08-llm-cost-routing/) + [`exercise-13-semantic-caching`](./lessons/mod-110-llm-infrastructure/exercises/exercise-13-semantic-caching/) + [`mod-107/exercise-11-gpu-cost-optimization`](./lessons/mod-107-gpu-computing/exercises/exercise-11-gpu-cost-optimization/) |

**证据要点：** Capital One（p29）：*“护栏……NeMo Guardrails”*。本周期没有明确提到成本路由，此前周期 Deepgram 和 Figma 内部 AI 的信号已回落。现有覆盖仍适用——这是样本构成造成的下降，而非结构性需求收缩。

### MLOps、数据流水线与模型注册中心

| 要求 | 频率 | 归属 | 课程覆盖 |
|---|---|---|---|
| 模型注册中心、实验追踪、特征存储（MLflow、Feast/Tecton、Argo Workflows） | 0.06 | 本岗位 | [`mod-106-mlops`](./lessons/mod-106-mlops/) |
| 数据流水线（Airflow/Prefect/Dagster/Argo、Spark、Kafka） | 0.03 | 本岗位 | [`mod-105-data-pipelines`](./lessons/mod-105-data-pipelines/) |
| 微调流水线（LoRA、SFT、DPO、RLHF、GRPO） | 0.00 | 本岗位 | [`exercise-05-finetuning-at-scale`](./lessons/mod-110-llm-infrastructure/exercises/exercise-05-finetuning-at-scale/) |

**证据要点：** Fireworks：*“PyTorch、MLflow、Vertex AI、SageMaker”*（p08）。Gusto：*“设计和开发机器学习生命周期的基础设施与平台服务”*（p26）。DoorDash MDX：*“加分项：Kubernetes、Airflow、Ray”*（p25）。数据、MLflow 和微调在本周期频率较低，反映样本构成——本周期偏重推理/HPC，涉及数据平台的岗位较少。现有课程覆盖仍然适用。

---

## 低于阈值的要求（观察清单，暂不提出新增建议）

### 裸金属网络 — 持续信号，尚未触发课程深度提升

- **本周期频率：** 0.42（14/33 条招聘信息）——此前为 0.40（2026-10）、0.43（2026-09）。连续三个周期稳定。
- **级别均衡样本（中级及中高级，n=15）：** 0.33，高于岗位级别阈值。
- **级别均衡样本中仅硬性要求：** 4/15 = **0.27，低于 0.30 的提升阈值。**
- **提升触发条件的样本量：** n=15，**低于要求的 n≥25。**
- **状态：** 2026-10 周期设定了具体触发条件：“如果 2026-11 周期的级别均衡样本（中级及中高级，n≥25）中，至少 0.30 的中级招聘信息将裸金属网络列为*硬性*要求（而非加分项），则应在 mod-107 增加练习。” 本周期的样本量和硬性要求比例都不达标。岗位级别信号可以重复观察到，但深度硬性要求仍集中于高级/Staff 招聘信息（Anthropic 集群基础设施、xAI 网络、Anduril 物理基础设施、Jane Street 性能、Together AI 存储）。中级岗位仍将其作为“加分项”或“熟悉即可”。
- **本周期决定：** [`mod-107`](./lessons/mod-107-gpu-computing/) 与 lab-03 的现有覆盖对工程师级别已足够；归属仍为 [`ai-infra-senior-engineer-learning`](../ai-infra-senior-engineer-learning/)。继续监测。如果 2026-12 周期的中级样本更多偏向推理/HPC（n≥25），仍可能触发该条件。
- **学习资源：** [NVIDIA NCCL docs](https://docs.nvidia.com/deeplearning/nccl/user-guide/)、[NVIDIA DOCA / NIXL docs](https://docs.nvidia.com/doca/)、用于拓扑感知放置的 [MLPerf Training methodology](https://mlcommons.org/benchmarks/training/)、用于了解 RoCE 演进的 [Ultra Ethernet Consortium](https://ultraethernet.org/)。

### NVIDIA Dynamo / 解耦式推理 — 仍在兴起

- **样本频率：** 0.03——仅 Hippocratic AI 明确提及 Dynamo（p10——“NVIDIA Dynamo/NIXL、SGLang、vLLM 或 TensorRT-LLM”）。这是非 NVIDIA 招聘信息首次明确提及 NIXL。
- **触发状态：** 2026-10 周期设定条件：“如果 2026-11 有至少 10 条招聘信息提及 Dynamo，则建议在 mod-110 增加练习。” 实际为 **1/33，既低于触发条件（≥10），也低于三条招聘信息的证据门槛。未触发。**
- **背景：** NVIDIA 自身正在多个岗位大量招聘 Dynamo 相关人员（供应商端），非 NVIDIA 招聘端的采用情况并未同步扩大。底层概念（连续批处理、KV Cache 管理、Prefill/Decode 分离）已在 [`exercise-03-vllm-deep-dive`](./lessons/mod-110-llm-infrastructure/exercises/exercise-03-vllm-deep-dive/) 和 [`exercise-06-inference-optimization-llm`](./lessons/mod-110-llm-infrastructure/exercises/exercise-06-inference-optimization-llm/) 中覆盖；Dynamo 是复用这些技术基础的同类服务框架。理解 vLLM/SGLang 内部机制的学习者可以直接迁移知识。此外，更广义的“解耦式服务”概念已达到三条招聘信息的门槛（Together Reliability p04、Fireworks p08、Hippocratic p10，合计 3/33），但总体比例 0.09 仍低于 0.30 的连续性阈值。
- **决定：** 列入观察清单。2026-12 重新测量。如果 Dynamo 出现在至少 10 条招聘信息中，或“解耦式服务”比例 ≥0.30，则下一周期建议在 mod-110 增加练习。
- **学习资源：** [NVIDIA Dynamo docs](https://docs.nvidia.com/dynamo/)、[NVIDIA technical blog: Dynamo 1 production-ready](https://developer.nvidia.com/blog/nvidia-dynamo-1-production-ready)、[Rafay blog on disaggregated inference](https://rafay.co/ai-and-cloud-native-blog/nvidia-dynamo-turning-disaggregated-inference-into-a-production-system)。

### OpenTelemetry GenAI 语义约定 — 招聘端仍无信号

- **样本频率：** **0/33**——连续第二个周期为零。Lambda（p18）、CoreWeave（p20）和 Etched（p11）提及基础 OpenTelemetry，但没有招聘信息明确引用 `gen_ai.*` 扩展约定。
- **触发状态：** 2026-10 周期设定条件：“如果 2026-11 明确提及 OTel GenAI 约定的比例 ≥0.30，则建议在 mod-108 增加练习。” 实际：**0.00。未触发。**
- **背景：** semconv-genai 约定于 2026 年中迁移至专门仓库（`open-telemetry/semantic-conventions-genai`），截至 2026 年 8 月仍标记为 **Development**（尚未稳定）。供应商确实在采用它（Datadog、TrueFoundry、Dash0、Lyzr、Greptime、OneUptime 的插桩），但约定名称尚未传导到招聘措辞。mod-108 现有 OTel 内容已覆盖基础技能。
- **决定：** 不变。监测 2026-12 招聘信息是否开始将“OTel GenAI”或“`gen_ai.*` 属性”作为独立的明确要求，这可能取决于 semconv-genai 仓库是否脱离 Development 状态。
- **学习资源：** [OTel GenAI semantic conventions spec](https://opentelemetry.io/docs/specs/semconv/gen-ai/)、[open-telemetry/semantic-conventions-genai repo](https://github.com/open-telemetry/semantic-conventions-genai)、[Greptime GenAI conventions post](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions)。

### 面向基础设施运维的 Agent 编排（自行构建 LLM 驱动的 DevOps 工具）

- **样本频率（狭义——构建用于运维基础设施的 AI Agent）：** 0.06（p25 DoorDash MDX 加分项、p33 Mastercard “Agentic AI 架构”）——此前为 0.11（2026-10）、0.23（2026-09）。
- **状态：** 信号继续回落。2026-10 集中于 Together AI 的峰值已消退，进一步表明它是 Together AI 的产品计划（“AI Infrastructure Agents”），而非市场转变。企业中的类似需求（Mastercard、Capital One GenAI 平台）集中于 Principal/高级级别。
- **决定：** 低于 0.30 阈值。不采取措施。列入观察清单。
- **学习资源：** [Anthropic agent skills docs](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)、[OpenAI Agents SDK](https://openai.com/index/new-tools-for-building-agents/)、[LangGraph docs](https://langchain-ai.github.io/langgraph/)。

### 模型上下文协议（MCP）

- **样本频率：** 0.03（1 条招聘信息——DoorDash MDX 加分项，p25）。
- **状态：** 连续第四个周期处于 0.03–0.06 区间。MCP 在招聘信息中的采用仍处于兴起阶段。外部分析显示，MCP 在*标注 Agent 框架*的招聘信息中占 17–24%，即使在这个有利的子样本中仍低于 0.30 门槛。在通用 AI 基础设施工程师岗位中维持在 0.03–0.06。
- **决定：** 低于阈值。列入观察清单。
- **学习资源：** [modelcontextprotocol.io spec](https://modelcontextprotocol.io/)、[Anthropic's MCP intro](https://www.anthropic.com/news/model-context-protocol)。

### Ray / KubeRay / Ray Serve / Ray Train

- **样本频率：** 0.12（3 条招聘信息——供应商 Anyscale p17、Anduril Staff p27、DoorDash MDX 加分项 p25）。相较上周期 0.14 基本持平。
- **状态：** 稳定，但集中于特定雇主；mod-107 已在概念层面介绍这一替代分布式计算层。
- **决定：** 低于阈值；可作为未来周期的扩展候选。
- **学习资源：** [Ray docs](https://docs.ray.io/en/latest/)、[KubeRay](https://github.com/ray-project/kuberay)。

### SLURM / HPC 调度 / 裸金属集群供应

- **样本频率：** 0.18（6 条招聘信息——Perplexity、Deepgram、Lightning AI 基础设施运维、Ai2、Lambda 加分项、Anduril Staff）。与上周期 0.20 基本持平。
- **状态：** SLURM 在前沿实验室的训练环境中仍占主导，但在更广泛的 AI 基础设施工程师市场中并非默认选项，后者以 Kubernetes 为先。Perplexity（p12）明确将其列为硬性要求；其他雇主将其与 K8s 并列为可选调度器。
- **决定：** 工程师级别低于 0.30。归属仍为 [`ai-infra-senior-engineer-learning`](../ai-infra-senior-engineer-learning/)。mod-107 lab-03 为工程师级别提供了充分的入门接触。
- **学习资源：** [SLURM docs](https://slurm.schedmd.com/)。

### 高性能并行存储（VAST、Weka、Lustre、DDN、Ceph、GPUDirect Storage）

- **样本频率：** 0.24（8 条招聘信息——Lightning AI ×2、Ai2、CoreWeave、vCluster、Anduril Physical、Jane Street、Shield AI）。相比上周期 0.14 上升，由偏重 HPC 的样本推动。
- **状态：** 信号集中于裸金属/HPC 雇主（此前周期的 Together AI 专职 Staff 岗位、Anduril 物理基础设施、Lightning AI、Jane Street）。中级岗位将其视作“接触过”而非独立负责。
- **决定：** 低于阈值。与裸金属网络一样，归属 [`ai-infra-senior-engineer-learning`](../ai-infra-senior-engineer-learning/)。mod-107 的入门内容对工程师级别已足够。
- **学习资源：** [NVIDIA GPUDirect Storage](https://docs.nvidia.com/gpudirect-storage/)、[Weka architecture](https://www.weka.io/learn/glossary/)、[VAST platform docs](https://www.vastdata.com/)。

### AMD ROCm / AWS Trainium / Inferentia / Google TPU

- **样本频率：** Anthropic（p01、p02——“GPU、TPU 或 Trainium”）和 Anduril Staff（p27——“AWS Trainium、Google TPU、自定义 ASIC”）明确提及 AWS Trainium / Google TPU，共 3 条招聘信息（0.09）。AMD ROCm：0 条。
- **状态：** Trainium/TPU 首次达到三条招聘信息的证据门槛，但总体比例 0.09 仍远低于 0.30 的连续性阈值。AMD ROCm 仍无信号。此前周期的独立市场数据显示，美国约有 180 个 ROCm 相关岗位，集中于 AMD/Meta/HPE。
- **决定：** 不采取措施。继续监测。
- **学习资源：** [AMD ROCm docs](https://rocm.docs.amd.com/)、[AWS Neuron SDK](https://awsdocs-neuron.readthedocs-hosted.com/)、[Google Cloud TPU docs](https://cloud.google.com/tpu/docs)。

### 容器沙箱（Firecracker、gVisor、Kata Containers）

- **样本频率：** 本周期 0 条招聘信息（与 2026-10 相同）。
- **状态：** 高度专业化；只出现在产品本身提供代码执行服务的岗位或对安全高度敏感的企业中。
- **决定：** 远低于阈值。更适合归于高级/架构师级别。
- **学习资源：** [Firecracker](https://firecracker-microvm.github.io/)、[gVisor](https://gvisor.dev/)、[Kata Containers](https://katacontainers.io/)。

### 通过 DRA / KAI Scheduler 实现 Kubernetes GPU 调度（收购 Run:ai 后）

- **样本频率：** 0.03（1 条招聘信息——NVIDIA 容器岗位 p19 将“容器设备接口（CDI）和动态资源分配（DRA）”列为突出优势类优先资格）。Anduril Physical（p28）明确提到 Run:AI。目前尚无 NVIDIA/Anduril 之外的招聘信息。
- **状态：** 本周期首次明确提及 DRA，但来自 NVIDIA 自身，是供应商端先行者信号，并非市场扩散。低于三条招聘信息的证据门槛。mod-104 以合适的抽象层次覆盖 GPU 调度；当 DRA 进一步传导到招聘信息时，可以自然地将其纳入内容更新。
- **决定：** 不采取措施。继续监测；mod-104 可在下一次内容刷新时逐步提及 DRA（不属于本研究周期的新增建议）。
- **学习资源：** [Kubernetes DRA docs](https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/)、[NVIDIA KAI Scheduler](https://github.com/NVIDIA/kai-scheduler)。

---

## 课程覆盖映射

| 模块 | 覆盖的要求 |
|---|---|
| [`mod-101-foundations`](./lessons/mod-101-foundations/) | Python 基础（归属于初级）；接触 Go/Rust |
| [`mod-102-cloud-computing`](./lessons/mod-102-cloud-computing/) | AWS/GCP/Azure；多云策略 |
| [`mod-103-containerization`](./lessons/mod-103-containerization/) | Docker、多阶段构建、GPU 容器、镜像安全 |
| [`mod-104-kubernetes`](./lessons/mod-104-kubernetes/) | K8s CRD、Operator、RBAC、GPU 调度、Helm |
| [`mod-105-data-pipelines`](./lessons/mod-105-data-pipelines/) | Airflow、Spark、Kafka、DVC、数据质量 |
| [`mod-106-mlops`](./lessons/mod-106-mlops/) | MLflow、Feast、ML CI/CD、部署策略、重新训练 |
| [`mod-107-gpu-computing`](./lessons/mod-107-gpu-computing/) | CUDA、GPU 集群运维、DDP/FSDP/DeepSpeed、混合精度、成本、接触 SLURM 和 NCCL |
| [`mod-108-monitoring-observability`](./lessons/mod-108-monitoring-observability/) | Prometheus/Grafana/OTel/Jaeger；SLI/SLO；值班 |
| [`mod-109-infrastructure-as-code`](./lessons/mod-109-infrastructure-as-code/) | Terraform、Pulumi、GitOps、策略即代码、密钥 |
| [`mod-110-llm-infrastructure`](./lessons/mod-110-llm-infrastructure/) | vLLM、RAG、向量数据库、护栏、成本路由、语义缓存、评估、微调 |
| [`project-101-basic-model-serving`](./projects/project-101-basic-model-serving/) | 端到端 FastAPI/Docker/K8s/Prometheus 模型服务 |
| [`project-102-mlops-pipeline`](./projects/project-102-mlops-pipeline/) | Airflow + MLflow + DVC + K8s CI/CD |
| [`project-103-llm-deployment`](./projects/project-103-llm-deployment/) | vLLM + 向量数据库 + LangChain + K8s GPU + Terraform + Prometheus |

---

## 变更建议

见 [`.aicg/curriculum-plan-delta.json`](./.aicg/curriculum-plan-delta.json)。根据优先保持连续性的政策，**本周期建议新增的模块、练习和项目均为零**——连续第四个周期得出这一结论。

2026-10 周期设定的三个具体触发条件本周期均未达到：

1. **至少 10 条招聘信息提及 Dynamo** → 实际为 1/33。
2. **明确提及 OTel GenAI 的比例 ≥0.30** → 实际为 0/33。
3. **裸金属网络课程深度提升（级别均衡 n≥25，仅硬性要求比例 ≥0.30）** → 实际 n=15，仅硬性要求比例 0.27。

持续高于阈值的信号（裸金属网络 0.42、Go/Rust/C++ 0.64）已根据归属规则分别分配至高级与初级路线；工程师级别的现有覆盖已足够。2026-10 周期的三个新兴项目（NVIDIA Dynamo、解耦式推理、OTel GenAI 约定）均处于三条招聘信息的证据门槛或以下，三者的底层概念已在 mod-108 / mod-110 中覆盖。本周期新出现的明确要求——Kubernetes DRA（NVIDIA p19）也仅为 1/33（供应商端先行者），完全可以纳入 mod-104 的 GPU 调度抽象。

**延续至 2026-12 的触发条件：**
- Dynamo 出现在至少 10 条招聘信息中，或“解耦式服务”比例 ≥0.30 → 建议在 mod-110 增加 Dynamo/解耦式推理练习。
- 明确提及 OTel GenAI 约定的比例 ≥0.30 → 建议在 mod-108 增加 LLM 遥测练习。
- 级别均衡裸金属网络样本 n≥25，且仅硬性要求比例 ≥0.30 → 建议在 mod-107 增加 NCCL 拓扑/AllReduce 基准测试练习。
