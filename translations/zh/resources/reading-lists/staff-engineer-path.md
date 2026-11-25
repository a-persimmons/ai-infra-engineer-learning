# 阅读清单——Staff 工程师路线

你已经运营生产 ML 平台三年以上，能够主导跨团队项目的技术设计。下一阶段要发展的是深度与影响力——这正是 Staff 工程师与 Senior 工程师的重要区别。

这份清单更侧重**如何开展工作**，而非具体学习什么。阅读内容更多是经验、传记与方法论，而非纯技术。

## 路线 1——不依赖正式职权的领导力

### 书籍

- *Staff Engineer: Leadership Beyond the Management Track*——Will Larson。**必读。**
- *The Staff Engineer's Path*——Tanya Reilly。
- *The Manager's Path*——Camille Fournier（即使不担任管理者，也需要了解管理背景）。
- *An Elegant Puzzle*——Will Larson。

### 实践

- 写一份让其他 Senior 工程师**愿意阅读**的设计文档，主动征求审查意见并迭代。
- 每季度为负责的平台领域组织跨团队技术评审，将决策记录成文。
- 确定未来一年要指导的 3 名工程师。教学能够揭示自己尚未掌握的知识。

---

## 路线 2——规模化系统设计

### 书籍

- *Designing Data-Intensive Applications*——Martin Kleppmann（此阶段重读会有不同收获）。
- *Software Engineering at Google*——Winters、Manshreck、Wright。
- *Accelerate*——Forsgren、Humble、Kim。关于高绩效实践的实证研究。
- *Team Topologies*——Skelton 与 Pais。

### 实践

- 编写能通过 5 名以上 Senior 工程师评审的**平台 RFC**。
- 端到端主导重大迁移，例如将 50 个以上服务从旧基础设施迁移到新设施，并记录迁移手册。
- 对相邻团队的系统开展**技术尽职调查**。

---

## 路线 3——战略与路线图

### 书籍

- *Good Strategy / Bad Strategy*（好战略，坏战略）——Richard Rumelt。**必读。**
- *Continuous Discovery Habits*——Teresa Torres。
- *Building a Second Brain*——Tiago Forte（用于此阶段的个人知识管理）。

### 实践

- 编写与公司业务目标关联的**三年平台愿景**，向上一级管理者介绍。
- 每季度开展路线图规划，使三个以上团队目标对齐。
- 练习透明地拒绝不合理需求，并记录可选方案。

---

## 路线 4——与研究及产品团队合作

### 书籍

- *Inspired*——Marty Cagan。
- *The Lean Startup*（精益创业）——Eric Ries（略读）。
- *Crucial Conversations*（关键对话）——Patterson、Grenny、McMillan、Switzler。

### 实践

- 与研究团队共同工作一个月，将他们的需求转换为平台交付承诺。
- 组织产品与工程头脑风暴。作为工程师，目标是**理解产品经理的思考框架**，而不是单方面让产品经理接受工程思路。

---

## 路线 5——掌握分布式系统

基础已完成，现在深入原始资料。

### 书籍与论文

- *Distributed Systems*——van Steen 与 Tanenbaum（在线免费）。
- *Principles of Distributed Computing*——Lynch。
- 《Paxos Made Simple》——Lamport。
- 《In Search of an Understandable Consensus Algorithm (Raft)》——Ongaro 与 Ousterhout。
- 《Calvin: Fast Distributed Transactions for Partitioned Database Systems》——Thomson 等。
- 《Chain Replication for Supporting High Throughput and Availability》——van Renesse 与 Schneider。

### 源码阅读（选择一个，深入两周）

- etcd 的 Raft 实现。
- CockroachDB 分布式 SQL 层。
- Apache Kafka Controller。
- Cassandra Gossip 与 Hinted Handoff。

---

## 路线 6——规模化 ML 平台（多租户）

超越单服务生产 ML。

### 论文与工程博客

- *TFX: A TensorFlow-Based Production-Scale Machine Learning Platform*——Baylor 等。
- Uber Michelangelo 平台工程博客系列。
- Meta PyTorch Platform 文章。
- Netflix Metaflow 设计。
- *Triton Inference Server* 设计文档。
- *vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention*——Kwon 等（原文标题表述）。

### 实践

- 设计并主导构建**多租户模型服务层**，以共享 CPU/GPU 池托管 50 个以上模型。考虑模型加载与驱逐、公平调度、租户级限流、隔离、影响范围控制及成本归属。

---

## 路线 7——可靠性文化

超越运行手册。

### 书籍与论文

- *Site Reliability Engineering*——Google SRE 手册，完整重读。
- *Seeking SRE*——David Blank-Edelman（编）。
- 《Failure Sketching: A Technique for Automated Root Cause Diagnosis of In-Production Failures》——Kasikci 等。
- Netflix *Principles of Chaos*。

### 实践

- 每季度组织 **GameDay**，有意在预发布环境注入故障，测量团队能与不能诊断的问题。
- 为组织编写事故复盘文化文档。
- 引入**错误预算**，作为控制发布节奏的政策杠杆。

---

## 路线 8——行业洞察

关注未来变化，而不仅是现有技术。

### 阅读习惯

- 每季度用一个周末浏览 NeurIPS、ICML、ICLR 论文集。
- 订阅 *The Pragmatic Engineer*（Gergely Orosz）、*MLOps Community* Newsletter、*Latent Space* 播客。
- 每月观看一次 Strange Loop 或 QCon 主题演讲。
- 每年阅读最新 State of DevOps、Stack Overflow Developer Survey、Google DORA 报告。

---

## 职业发展

Staff 工程师不仅需要擅长工作，还需要擅长选择值得做的工作。

### 决策框架

- **Glue Work（黏合工作）**——Tanya Reilly 的文章。让团队紧密协作却不一定体现在绩效中的工作；有意识地承担并记录。
- **晋升与影响力**——定期问自己：是在优化下一个职级，还是在选择杠杆效应最大的工作？
- **两个披萨团队原则**——注意力覆盖范围有限，谨慎选择需要承担的协调成本。

### 需要培养的习惯

- 每个工作日写 250 个词：设计文档、RFC、事故复盘、回顾。
- 将 10% 时间投入指导他人。
- 为重要技术选择维护个人**决策日志**，每季度重读。

---

## 如何使用本清单

- 这是刻意放慢节奏的 **2–5 年阅读清单**。
- 不要以完成阅读为目标，而是聚焦下一季度实际工作所需。
- 重读自己的工作成果。这个阶段最有价值的资料可能是你自己的事故复盘和 RFC。
- 寻找另一家公司的 Staff 工程师伙伴，每季度交换经验。

完成这条路线后，下一步通常是领域专业化（特定 ML 模态或行业），或走向 Principal/Distinguished Engineer（更广范围、更大影响力，最终参与制定行业标准）。
