# 模块 102：面向 ML 的云计算 — 参考答案

> [模块测验](../../../lessons/mod-102-cloud-computing/quizzes/module-quiz.md)的详细答案，包含解析、常见错误与课程参考。
>
> **学术诚信：** 请在尝试完成测验后用于自学。不要在测验期间将其作为主要参考资料。

---

## 问题 1
**问题：** 哪种云服务模式对底层基础设施提供最多控制权？

**答案：** C) 基础设施即服务（IaaS）

**解析：**
IaaS 提供最底层的云资源，包括虚拟机、虚拟磁盘、虚拟网络及安全组，将操作系统、运行时和应用技术栈交由你管理。正是这种最大的控制权，使 ML 团队在需要安装自定义 CUDA 驱动、调优内核或运行非标准框架时选择 IaaS。PaaS、SaaS、FaaS 则逐步让渡更多控制权，以换取更高层次的抽象。

**常见错误：**
- 选择 A（SaaS）：混淆了“托管程度最高”与“控制权最多”。SaaS 由服务商运营整个应用，因此用户控制权最少。
- 选择 D（FaaS）：认为无服务器模式很强大，但实际上 FaaS 完全隐藏操作系统、运行时及扩缩容，几乎不给你基础设施控制权。

**相关资料：** [lessons/mod-102-cloud-computing/01-cloud-architecture.md](../../../lessons/mod-102-cloud-computing/01-cloud-architecture.md)

---

## 问题 2
**问题：** 判断题：对于 ML 训练工作负载，预留实例总是比竞价实例便宜。

**答案：** 错误

**解析：**
竞价或可抢占实例通常比按需实例便宜 70–90%，其价格往往远低于享受 40–60% 折扣的一年期或三年期预留实例。预留实例的优势在于*容量保障*，而非单纯的价格。对于带检查点且可中断的训练任务，竞价实例几乎总是更便宜；对于更关注正常运行时间而非绝对成本的稳态推理，预留实例更合适。

**常见错误：**
- 因为预留实例听起来承诺程度最高（因此最便宜）而回答正确；承诺购买的是可用性，而不是最低单位价格。
- 忘记判断题中的“总是”是强断言，只要存在一个反例（竞价训练任务）就不成立。

**相关资料：** [lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md](../../../lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md)

---

## 问题 3
**问题：** 使用对象存储（S3/GCS/Blob）保存 ML 数据集的主要好处是什么？

**答案：** C) 以低成本实现无限扩展性与持久性

**解析：**
对象存储旨在提供实际近乎无限的容量、约 11 个 9 的持久性，而且对冷数据或温数据而言，每 GB 价格优于块存储或文件存储。因此它天然适合大型训练数据集、模型产物及检查点。它*并不*针对低延迟随机访问或事务性查询进行优化，这是为规模和成本优势所接受的权衡。

**常见错误：**
- 选择 A（最快的读写）：对象存储的单次请求延迟高于块存储；其吞吐量通过并行请求扩展，而非依赖单次请求速度。
- 选择 B（最低随机访问延迟）：随机访问延迟重要时，块存储和本地 NVMe 才是正确选择。
- 选择 D（内置查询）：Athena/BigQuery 等查询引擎位于对象存储*之上*，存储层本身不是数据库。

**相关资料：** [lessons/mod-102-cloud-computing/05-cloud-storage.md](../../../lessons/mod-102-cloud-computing/05-cloud-storage.md)

---

## 问题 4
**问题：** 对于可以容忍中断的大语言模型训练，应选择哪种 GPU 实例实现高成本效益？

**答案：** C) 竞价 P4 实例（AWS）

**解析：**
问题给出了两个关键约束：*成本效益*与*容忍中断*，这正是竞价定价的典型适用场景。竞价 P4 实例（A100 GPU）比按需实例便宜 70–90%，定期保存检查点的任务在实例被回收后可以直接从最后一个检查点恢复。按需和预留实例无法享受这部分折扣；T2 则根本没有 GPU。

**常见错误：**
- 选择 B（预留 P4）：认为预留代表承诺且便宜，但预留实例更适合稳定推理而非突发训练。
- 选择 D（仅 CPU 的 T2）：认为其每小时价格最低，但在 CPU 上训练 LLM 速度太慢，任务总成本会远超每小时节省的费用。

**相关资料：** [lessons/mod-102-cloud-computing/02-aws-ml-infrastructure.md](../../../lessons/mod-102-cloud-computing/02-aws-ml-infrastructure.md)

---

## 问题 5
**问题：** VPC（虚拟私有云）的主要目的是什么？

**答案：** B) 隔离并保护网络资源

**解析：**
VPC 是云服务商网络中逻辑隔离的一部分，你可以控制 IP 范围、子网、路由表、安全组及网关访问。其本质是一种*安全与隔离*机制。成本、传输速度和多云都是不相关的问题。

**常见错误：**
- 选择 A（降低成本）：VPC 本身通常免费，并非成本控制机制。
- 选择 C（加快传输）：决定吞吐量的是资源放置方式和实例类型，而非是否存在 VPC。

**相关资料：** [lessons/mod-102-cloud-computing/06-cloud-networking.md](../../../lessons/mod-102-cloud-computing/06-cloud-networking.md)

---

## 问题 6
**问题：** 哪种托管 ML 服务属于哪家云服务商？正确匹配：
1. SageMaker  2. Vertex AI  3. Azure Machine Learning

**答案：** A) 1=AWS，2=GCP，3=Azure

**解析：**
SageMaker 是 AWS 的旗舰托管 ML 平台，Vertex AI 是 GCP 的统一 ML 平台（AI Platform 的继任者），Azure Machine Learning 属于 Microsoft。记住这三者是本模块后续比较托管 ML 产品的基础。

**常见错误：**
- 选择 B 或 D：混淆了 Vertex AI 的归属，它属于 GCP，而不是 AWS 或 Azure。
- 选择 C：将 Azure Machine Learning 与 Azure OpenAI Service 的名称混淆；它们是不同的产品。

**相关资料：** [lessons/mod-102-cloud-computing/07-managed-ml-services.md](../../../lessons/mod-102-cloud-computing/07-managed-ml-services.md)

---

## 问题 7
**问题：** 与 AWS 和 Azure 相比，Google Cloud Platform 独有的是什么？

**答案：** B) TPU（张量处理单元）

**解析：**
TPU 是 Google 为以矩阵运算为主的 ML 工作负载设计的 ASIC，只能通过 GCP（Cloud TPU 和 TPU VM）获取。三大云平台都提供 Kubernetes、对象存储与 GPU 虚拟机，因此这些并不独有。TPU 的使用权是团队专门选择 GCP 的重要原因之一。

**常见错误：**
- 选择 A（Kubernetes）：EKS、AKS、GKE 都存在；托管 Kubernetes 是基本能力，不是 GCP 的差异化优势。
- 选择 C 或 D：所有主流云服务商都提供对象存储和 GPU 虚拟机。

**相关资料：** [lessons/mod-102-cloud-computing/03-gcp-ml-infrastructure.md](../../../lessons/mod-102-cloud-computing/03-gcp-ml-infrastructure.md)

---

## 问题 8
**问题：** 在 AWS 中，应使用哪种服务大规模编排容器化 ML 工作负载？

**答案：** C) EKS（Elastic Kubernetes Service）

**解析：**
EKS 是 AWS 托管的 Kubernetes 控制平面，是大规模运行容器化 ML 工作负载（训练任务、推理服务、Kubeflow、Ray）的标准方式。EC2 仅提供虚拟机而无编排能力，Lambda 用于短时无状态函数，S3 用于存储；它们都不是容器编排器。

**常见错误：**
- 选择 A（EC2）：EC2 提供底层计算资源，但不提供容器调度、扩缩容或服务发现。
- 选择 B（Lambda）：Lambda 有严格的时间与内存限制，不适合长时间 GPU 训练或大模型服务。

**相关资料：** [lessons/mod-102-cloud-computing/02-aws-ml-infrastructure.md](../../../lessons/mod-102-cloud-computing/02-aws-ml-infrastructure.md)

---

## 问题 9
**问题：** 哪种 Azure 服务直接集成 OpenAI 模型，用于 LLM 部署？

**答案：** B) Azure OpenAI Service

**解析：**
Azure OpenAI Service 是 Microsoft 托管的企业级入口，提供 GPT-4、GPT-3.5、DALL-E 与嵌入模型，包括 SLA、私有网络和数据驻留保障。AKS、Azure ML 和 Functions 是通用服务，*可以*托管模型，但不提供第一方 OpenAI 集成。

**常见错误：**
- 选择 C（Azure Machine Learning）：它是 Azure 的通用 ML 平台，单凭该服务并不能获得 OpenAI 模型访问权。
- 选择 A（AKS）：LLM 服务涉及容器编排，但 AKS 是通用基础设施，而不是 OpenAI 集成服务。

**相关资料：** [lessons/mod-102-cloud-computing/04-azure-ml-infrastructure.md](../../../lessons/mod-102-cloud-computing/04-azure-ml-infrastructure.md)

---

## 问题 10
**问题：** GCP 中与 AWS S3 对应的服务是什么？

**答案：** A) Cloud Storage（GCS）

**解析：**
Google Cloud Storage 是 GCP 的对象存储服务，直接对应 AWS S3 和 Azure Blob Storage。Persistent Disk 是块存储（类似 EBS），Filestore 是托管 NFS 文件存储（类似 EFS），Cloud SQL 是托管关系型数据库。

**常见错误：**
- 选择 B（Persistent Disk）：挂载到单台虚拟机的块存储对应 EBS，而非 S3。
- 选择 C（Filestore）：NFS 风格的共享文件系统对应 EFS。

**相关资料：** [lessons/mod-102-cloud-computing/05-cloud-storage.md](../../../lessons/mod-102-cloud-computing/05-cloud-storage.md)

---

## 问题 11
**问题：** 哪种存储类型能够为高吞吐量 ML 训练数据访问提供最佳性能？

**答案：** B) 块存储（EBS/Persistent Disk）

**解析：**
在托管存储选项中，块存储提供最高 IOPS 与最低单次请求延迟，这对快速重复读取数据分片的紧密训练循环十分重要。对象存储通过并行度扩展吞吐量，但有单次请求开销；NFS 增加协议开销及元数据瓶颈；数据库则完全不是合适的工具。若需要更高性能，实例上的临时本地 NVMe 优于网络块存储。

**常见错误：**
- 选择 A（对象存储）：认为 S3 可无限扩展。聚合吞吐量可以很高，但没有缓存层时，单文件延迟会影响活跃训练循环。
- 选择 C（NFS）：认为共享文件语义天然快速，但 NFS 增加元数据和锁开销，限制大规模吞吐量。

**相关资料：** [lessons/mod-102-cloud-computing/05-cloud-storage.md](../../../lessons/mod-102-cloud-computing/05-cloud-storage.md)

---

## 问题 12
**问题：** 云网络中的安全组有何作用？

**答案：** B) 充当虚拟防火墙，控制入站与出站流量

**解析：**
安全组是关联到实例或 ENI 的有状态虚拟防火墙，按照端口、协议、源地址或目标地址定义入站和出站允许规则。它们不加密数据、不进行负载均衡，也不执行威胁检测；这些分别是 KMS、ELB 和 GuardDuty/Defender 的职责。

**常见错误：**
- 选择 A（加密静态数据）：加密由 KMS、EBS 加密或 S3 SSE 处理，而非网络规则。
- 选择 D（监控安全威胁）：混淆访问控制与检测；威胁监控由 GuardDuty、Defender 或 Security Command Center 实现。

**相关资料：** [lessons/mod-102-cloud-computing/06-cloud-networking.md](../../../lessons/mod-102-cloud-computing/06-cloud-networking.md)

---

## 问题 13
**问题：** 判断题：同一可用区内的数据传输通常免费。

**答案：** 正确

**解析：**
主流云服务商通常不对同一可用区内资源之间通过私有 IP 进行的流量收费。跨可用区流量通常每个方向每 GB 收取几美分，跨区域或互联网出站流量成本高得多。因此，将计算与存储部署在同一可用区，是数据密集型 ML 工作负载最简单的降本方式之一。

**常见错误：**
- 因为模糊记得“云数据传输总要收费”而回答错误；出站流量确实有费用，但同可用区的私有流量是例外。
- 混淆跨可用区（收费）与同可用区（免费），可用区边界是计费开始的位置。

**相关资料：** [lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md](../../../lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md)

---

## 问题 14
**问题：** 训练期间存储模型产物与检查点的推荐方法是什么？

**答案：** B) 对象存储（S3/GCS）加定期检查点

**解析：**
对象存储具有高持久性（约 11 个 9）、每 GB 价格低、任何实例均可访问、实例终止后仍可保留等特性，这些在竞价或可抢占节点可能于训练中途消失时至关重要。定期将检查点保存到对象存储是成熟模式，可恢复训练而不丢失数据。本地实例存储是临时的，数据库并非为大型二进制对象而设计，内存存储在任何故障时都会丢失。

**常见错误：**
- 选择 A（本地实例存储）：速度快，但实例被回收后检查点消失，这恰恰违背了保存检查点的初衷。
- 选择 C（数据库）：RDS/Cloud SQL 成本高、面向行，不适合数 GB 的二进制产物。

**相关资料：** [lessons/mod-102-cloud-computing/05-cloud-storage.md](../../../lessons/mod-102-cloud-computing/05-cloud-storage.md)

---

## 问题 15
**问题：** 使用哪种网络组件将传入的 ML 推理请求分配给多个实例？

**答案：** C) 负载均衡器

**解析：**
负载均衡器（AWS 的 ALB/NLB、GCP 的 Cloud Load Balancing、Azure 的 Load Balancer/Application Gateway）终止客户端连接，并将请求分发给后端池，为推理端点提供健康检查和高可用性。安全组过滤流量，VPC 定义网络边界，NAT 网关让私有子网可以访问互联网；这些都不负责分发入站流量。

**常见错误：**
- 选择 A（安全组）：安全组决定*是否*允许流量，而不是如何在后端之间分发。
- 选择 D（NAT 网关）：NAT 处理私有网络到互联网的出站流量，与入站推理请求方向相反。

**相关资料：** [lessons/mod-102-cloud-computing/06-cloud-networking.md](../../../lessons/mod-102-cloud-computing/06-cloud-networking.md)

---

## 问题 16
**问题：** 哪种策略能够最大程度地降低 ML 训练工作负载的成本？

**答案：** B) 使用竞价实例并结合检查点与自动重启

**解析：**
竞价或可抢占实例可将计算成本降低 70–90%，结合检查点保存及恢复逻辑，可以使中断对批量训练几乎不产生影响。该折扣大于预留实例，也远优于按需价格始终使用最昂贵的 GPU。题目关键词是“最大程度”，竞价实例在纯成本节省方面占优。

**常见错误：**
- 选择 C（所有工作负载使用预留实例）：预留有助于稳定使用，但会产生锁定，而且对于可中断任务仍比竞价昂贵。
- 选择 D（总是使用最强大的 GPU）：硬件过度配置是最大的浪费来源之一；合理配置优于堆砌算力。

**相关资料：** [lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md](../../../lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md)

---

## 问题 17
**问题：** 对于主流云服务商，入站（数据流入）和出站（数据流出）的典型成本差异是什么？

**答案：** C) 入站免费，出站昂贵

**解析：**
三大主流云平台均允许免费上传数据，但按 GB 对互联网出站流量收费，跨区域传输也收费（费率较低）。这种定价不对称是有意为之：降低数据迁入门槛，提高迁出成本，是厂商锁定的重要驱动力。使计算靠近数据并尽量减少出站流量，是核心成本优化习惯。

**常见错误：**
- 选择 A（入站昂贵，出站免费）：与云定价方式恰好相反。
- 选择 D（两者免费）：常见误解，尤其是只使用过免费层的工程师，小额出站免费配额掩盖了真实成本曲线。

**相关资料：** [lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md](../../../lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md)

---

## 问题 18
**问题：** 简答题：列出三种优化 ML 工作负载云成本的策略。

**答案：** 下列任意三种均可：
1. **使用竞价/可抢占实例**进行带检查点的可中断训练（节省 70–90%）。
2. **合理配置实例规格**：监控利用率，将实例类型与实际 GPU、CPU、内存需求匹配。
3. **自动扩缩容**：推理实例集群在低峰期缩容，在高峰期扩容。
4. **存储生命周期策略**：将冷数据迁移到更便宜的层级（S3 Glacier、GCS Coldline、Azure Archive）。
5. **预留实例或节省计划**：用于可预测的稳定工作负载（节省 40–60%）。
6. **尽量降低数据传输成本**：将计算与数据放在一起，避免跨区域或出站流量。

**解析：**
优秀答案应列出三种不同的调节手段，最好涵盖计算（竞价、预留、合理规格）、存储（生命周期分层）和网络（数据局部性、出站流量）。列出同一手段的三种说法，例如“竞价、可抢占和可中断实例”，不应得满分，因为只展示了一种底层策略。

**常见错误：**
- 仅列出“减少计算量”或“监控账单”等含糊说法，没有明确具体机制。
- 列出同一概念的三个变体（如竞价、可抢占、可中断），而非三种不同策略。
- 完全忽略数据传输或出站费用，这往往是 ML 工作负载最大的隐性成本项目。

**相关资料：** [lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md](../../../lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md)

---

## 问题 19
**问题：** 实施多云策略的主要原因是什么？

**答案：** B) 避免厂商锁定并增强韧性

**解析：**
多云降低对单一服务商定价权、故障和发展路线的依赖，还可以满足单一云无法满足的监管或数据驻留要求。它通常会*增加*运维复杂度和成本，以换取灵活性；因此这种权衡是有意的，而非偶然的。其他选项要么颠倒了理由，要么描述的是副作用。

**常见错误：**
- 选择 C（更复杂的架构）：额外复杂度是多云的*代价*，而不是目标。
- 选择 D（使用多个服务商的免费层）：拼接免费层是个人爱好者的策略，而非专业团队采用多云的战略理由。

**相关资料：** [lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md](../../../lessons/mod-102-cloud-computing/08-multi-cloud-cost-optimization.md)

---

## 问题 20
**问题：** 判断题：为了方便，将云凭据直接硬编码到应用代码中是一项最佳实践。

**答案：** 错误

**解析：**
硬编码凭据最终会泄露到 Git 历史、容器镜像、日志或截图中，并且会绕过云平台提供的审计、轮换和最小权限控制。正确模式包括 IAM 角色（实例或 Pod 身份）、具有工作负载身份的服务账号、密钥管理器（AWS Secrets Manager、GCP Secret Manager、Azure Key Vault），至少也应使用来源于密钥存储的环境变量。这条规则没有为了“方便”而设的例外。

**常见错误：**
- 因为硬编码在开发环境中能工作而回答正确；现在的方便会直接演变成日后的凭据轮换事故。
- 认为私有仓库足够安全：一旦密钥被提交，即使仓库是私有的，也必须视为已经泄露。

**相关资料：** [lessons/mod-102-cloud-computing/02-aws-ml-infrastructure.md](../../../lessons/mod-102-cloud-computing/02-aws-ml-infrastructure.md)

---
