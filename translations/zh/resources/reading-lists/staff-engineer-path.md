# 阅读清单 — Staff Engineer 路线

你已经运营生产 ML 平台超过 3 年，能够主导跨团队项目的技术设计。下一步是深度与影响力——这正是 Staff 和 Senior 的区别。

这份清单更关注**如何开展工作**，而非学习什么。阅读内容更多涉及个人经历和方法论，而不只是技术。

## 路线 1 — 不依赖职权的领导力

### 书籍

- *Staff Engineer: Leadership Beyond the Management Track*（Staff 工程师：管理路线之外的领导力）— Will Larson。**必读。**
- *The Staff Engineer's Path* — Tanya Reilly。
- *The Manager's Path* — Camille Fournier（即便不做管理，也需要理解背景）。
- *An Elegant Puzzle* — Will Larson。

### 实践

- 编写一份让其他高级工程师**愿意阅读**的设计文档。主动征求评审意见并迭代。
- 针对你的平台领域，每季度开展一次跨团队技术评审。以书面形式记录决策。
- 确定未来一年指导的 3 位工程师。教学能够帮助你发现自己真正不懂的东西。

---

## 路线 2 — 大规模系统设计

### 书籍

- *Designing Data-Intensive Applications*（设计数据密集型应用）— Martin Kleppmann（此阶段重读会有不同收获）。
- *Software Engineering at Google* — Winters、Manshreck、Wright。
- *Accelerate* — Forsgren、Humble、Kim。高绩效实践的实证依据。
- *Team Topologies* — Skelton 与 Pais。

### 实践

- 撰写一份能经受 5 位以上高级工程师评审的**平台 RFC**。
- 端到端负责一次大型迁移（将 50 个以上服务从旧基础设施迁移至新基础设施），记录操作手册。
- 对相邻团队的系统进行一次**技术尽职调查评审**。

---

## 路线 3 — 战略与路线图

### 书籍

- *Good Strategy / Bad Strategy* — Richard Rumelt。**必读。**
- *Continuous Discovery Habits* — Teresa Torres。
- *Building a Second Brain* — Tiago Forte（此阶段用于个人知识管理）。

### 实践

- 编写一份与公司业务目标相连的**三年平台愿景**，向上一级主管的主管推介。
- 每季度开展一次协调 3 个以上团队的路线图规划活动。
- 练习透明地拒绝不合适的请求，并记录替代方案。

---

## 路线 4 — 与研究人员和产品团队协作

### 书籍

- *Inspired* — Marty Cagan。
- *The Lean Startup* — Eric Ries（略读）。
- *Crucial Conversations* — Patterson、Grenny、McMillan、Switzler。

### 实践

- 加入研究团队协作一个月，将其需求转化为平台承诺。
- 组织产品与工程联合头脑风暴，作为工程师，结束时应**理解产品经理的思维模型**，而不是要求对方理解你的模型。

---

## 路线 5 — 深入分布式系统

基础已经掌握，现在追溯源头。

### 书籍和论文

- *Distributed Systems* — van Steen 与 Tanenbaum（可在线免费阅读）。
- *Principles of Distributed Computing* — Lynch。
- “Paxos Made Simple” — Lamport。
- “In Search of an Understandable Consensus Algorithm (Raft)” — Ongaro 与 Ousterhout。
- “Calvin: Fast Distributed Transactions for Partitioned Database Systems” — Thomson 等。
- “Chain Replication for Supporting High Throughput and Availability” — van Renesse 与 Schneider。

### 源码阅读（选一个，深入两周）

- etcd 的 Raft 实现。
- CockroachDB 的分布式 SQL 层。
- Apache Kafka 的控制器。
- Cassandra 的 Gossip 和 hinted handoff（提示移交）。

---

## 路线 6 — 大规模 ML 平台（多租户）

超越单服务的生产 ML。

### 论文和工程博客

- *TFX: A TensorFlow-Based Production-Scale Machine Learning Platform* — Baylor 等。
- Uber 的 Michelangelo 平台工程博客系列。
- Meta 的 PyTorch Platform 技术文章。
- Netflix 的 Metaflow 设计。
- *Triton Inference Server* 设计文档。
- *vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention* — Kwon 等。

### 构建

- 设计并主导构建一个**多租户模型服务层**，使用共享 CPU/GPU 池托管 50 个以上模型。考虑模型加载与淘汰、公平调度、租户级限流、隔离、故障影响范围限制及成本归属。

---

## 路线 7 — 可靠性文化

超越运行手册。

### 书籍与论文

- *Site Reliability Engineering* — Google SRE 书籍，完整重读。
- *Seeking SRE* — David Blank-Edelman 主编。
- “Failure Sketching: A Technique for Automated Root Cause Diagnosis of In-Production Failures” — Kasikci 等。
- Netflix 的 *Principles of Chaos*。

### 实践

- 每季度开展一次 **GameDay**：在预发布环境有意制造故障，衡量团队可以和无法诊断的问题。
- 为组织编写事故复盘文化文档。
- 引入**错误预算**，作为控制发布节奏的政策工具。

---

## 路线 8 — 行业洞察

追踪即将到来的变化，而非仅关注已有技术。

### 阅读习惯

- 每季度花一个周末略读 **NeurIPS / ICML / ICLR** 会议论文集。
- 订阅 *The Pragmatic Engineer*（Gergely Orosz）、*MLOps Community* 新闻通讯和 *Latent Space* 播客。
- 每月观看一次 *Strange Loop* 或 *QCon* 主题演讲。
- 每年阅读最新的 *State of DevOps*、*Stack Overflow Developer Survey* 和 Google DORA 报告。

---

## 职业发展

Staff 工程师不仅需要做好工作，也需要善于选择值得做的工作。

### 决策框架

- **Glue work（黏合性工作）** — Tanya Reilly 的文章。维系团队运转却未体现在绩效考核中的工作。有意识地开展并记录这些工作。
- **晋升 vs 影响力** — 定期问自己：我是在优化下一个职级，还是在选择影响力最大的工作？
- **两个披萨团队原则** — 有效的注意力范围有限，应谨慎选择需要投入协调成本的工作。

### 培养习惯

- 每个工作日写 250 个词：设计文档、RFC、事故复盘、回顾总结。
- 将 10% 时间用于指导他人，不设例外。
- 为重大技术选择维护个人**决策日志**，每季度重读。

---

## 如何使用这份清单

- 这是一份 **2–5 年的阅读清单**，有意放慢节奏。
- 不要以读完清单为目标，而应关注下季度日常工作所需。
- 重读自己的工作成果。在此阶段，最有价值的参考资料是自己的事故复盘和 RFC。
- 寻找另一家公司的一位 Staff 工程师同行，每季度交流心得。

完成此路线后，通常会选择领域专精（特定 ML 模态或行业），或者向 Principal/Distinguished Engineer 发展（更广的范围、更大的影响力，最终参与制定行业标准）。
