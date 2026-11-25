# 阅读清单 — 高级工程师路线

你已完成 AI Infrastructure Engineer 课程，能够端到端搭建生产 ML 平台：使用 Kubernetes 提供服务、MLflow 追踪实验、Terraform 供应基础设施、Prometheus/Grafana 实现可观测性，以及构建包含 RAG 的 LLM 技术栈。接下来的 9–18 个月，将从“能够构建”走向“能够规模化运营并排查复杂问题”。

这份清单经过有选择的筛选。相比浅尝辄止，宁愿少读一些内容，结合代码深入学习。

## 路线 1 — 大规模生产 ML 平台

### 书籍

- *Designing Machine Learning Systems* — Chip Huyen。思考端到端生产 ML 的参考书。
- *Machine Learning Engineering* — Andriy Burkov。更精炼，偏向检查清单。
- *Reliable Machine Learning* — Pineau 等。侧重运维：可复现性、监控、事故响应。

### 论文

- “Hidden Technical Debt in Machine Learning Systems” — Sculley 等（NeurIPS 2015）。必读。
- “The ML Test Score: A Rubric for ML Production Readiness” — Breck 等（Google）。
- “TFX: A TensorFlow-Based Production-Scale Machine Learning Platform” — Baylor 等（KDD 2017）。
- Uber 的 *Michelangelo* 和 Meta 的 *Looper* 工程博客系列。
- “Continuous Delivery for Machine Learning” — Sato、Wider、Windheuser（martinfowler.com）。

### 构建

- 在一个课程项目中加入**影子部署 + 自动 A/B 测试 + 指标退化时自动回滚**。记录出现的问题。
- 实现**多租户特征存储**，通过一致 API 支持在线查询（Redis 后端）和离线查询（Parquet 后端）。

---

## 路线 2 — 深入 LLM 基础设施

超越模块 110 的内容。

### 论文（按顺序阅读）

- *Attention Is All You Need* — Vaswani 等。
- *Efficient Memory Management for Large Language Model Serving with PagedAttention* — Kwon 等（vLLM 论文）。
- *FlashAttention* 和 *FlashAttention-2* — Tri Dao。
- *DeepSpeed-Inference* — Aminabadi 等。
- 若将运营安全流水线，阅读 *Sparrow / Constitutional AI / RLHF* 相关论文。

### 需要掌握的主题

- KV Cache 管理、分页注意力、连续批处理。
- 推测解码、前瞻解码。
- 微调的 LoRA / QLoRA / DoRA。
- 量化（int8、int4、FP8、AWQ、GPTQ）：分别付出什么代价、获得什么收益。
- 大规模 Multi-LoRA 服务。
- 生产护栏：提示注入防御、输出过滤、Schema 约束生成。
- Embedding 流水线、混合检索、重排序。

### 构建

- 选一个 7–13B 参数模型，用三种方式提供服务：HuggingFace Transformers、vLLM、TensorRT-LLM。测量延迟、吞吐量、每百万 Token 成本，找出性能断崖。
- 端到端构建生产级 **RAG 应用**，包含混合检索（BM25 + 稠密向量）、重排序、引用溯源和质量监控。

---

## 路线 3 — 深入分布式系统

ML 平台本质上是在分布式系统之上叠加 ML。

### 书籍

- *Designing Data-Intensive Applications* — Martin Kleppmann。阅读复制、分区、一致性和流处理章节。
- *Database Internals* — Alex Petrov。

### 经典论文

- *MapReduce*（Dean 与 Ghemawat，2004）
- *Bigtable*（Chang 等，2006）
- *Dynamo*（DeCandia 等，2007）
- *Spanner*（Corbett 等，2012），及后续 *Spanner: Becoming a SQL System*
- *Kafka: a Distributed Messaging System for Log Processing*（Kreps 等，2011）
- *The Dataflow Model*（Akidau 等）

### 构建

- 使用熟悉的语言实现 Raft 或 Paxos。简化版本即可，之后阅读其他人的生产实现。

---

## 路线 4 — 深入 Kubernetes 与 Operator

模块 104 涵盖基础；进阶意味着构建 Operator，并理解 API 机制。

### 书籍

- *Kubernetes in Action* — Marko Lukša（第 2 版）。
- *Programming Kubernetes* — Hausenblas 与 Schimanski。
- *Kubernetes Patterns* — Ibryam 与 Huß。

### 构建

- 使用 kubebuilder 或 Operator SDK 构建真正的 **Operator**。一个 ModelDeployment CRD 协调 Deployment + Service + HPA + ServiceMonitor + Istio VirtualService，是良好的入门项目。
- 阅读一个特定子系统的源码（kube-scheduler 的 NodeAffinity 评分、kubelet 的卷挂载生命周期、kube-apiserver 的准入链）。不要试图读完全部源码。

---

## 路线 5 — AI 工作负载性能工程

### 书籍

- *Systems Performance* — Brendan Gregg（第 2 版）。必读。
- *BPF Performance Tools* — Brendan Gregg。
- *Computer Systems: A Programmer's Perspective* — Bryant 与 O'Hallaron，学习缓存和内存层次基础。

### GPU 专项

- NVIDIA 的 *CUDA C++ Programming Guide* — 内存层次和异步执行章节。
- *PMPP — Programming Massively Parallel Processors* — Hwu、Kirk、El Hajj（第 4 版）。
- NVIDIA Tensor Core 编程模型（mma 指令）。

### 构建

- 对实际模型服务端点进行端到端性能分析。找出瓶颈（CPU？GPU 内存带宽？GC？反序列化？），消除瓶颈，并使用火焰图记录过程。

---

## 路线 6 — 可观测性与 SRE

### 书籍

- *Site Reliability Engineering*（Google SRE 书籍）。完整阅读。
- *The Site Reliability Workbook*（Google）。
- *Observability Engineering* — Majors、Fong-Jones、Miranda。
- *Seeking SRE* — David Blank-Edelman 主编。

### 主题

- ML 服务的 SLI/SLO/SLA 设计（准确率、延迟、新鲜度）。
- 错误预算燃烧率告警 vs 阈值告警。
- 推理流水线分布式追踪。
- ML 专项漂移与质量监控（Evidently、Arize、WhyLabs）。

### 构建

- 使用 **OpenTelemetry** 端到端为真实服务埋点：指标、日志、追踪。在三种信号中可视化同一个请求。
- 为真实服务定义实际 SLO，计算错误预算，构建燃烧率告警。

---

## 路线 7 — ML 系统安全

容易被低估。原文认为招聘团队越来越关注它。

### 书籍

- *Building Secure and Reliable Systems* — Google SRE/Security。
- *Threat Modeling: Designing for Security* — Adam Shostack。

### 主题

- ML 服务栈威胁建模（数据外泄、模型窃取、对抗性输入）。
- ML 流水线供应链攻击（数据集投毒、模型制品被篡改）。
- 全链路 mTLS — Istio 或 Linkerd。
- LLM 服务的提示注入、越狱和输出过滤。
- 差分隐私基础。

### 构建

- 在 CI 中加入 Trivy + Grype 扫描。使用 cosign 签名镜像。配置 Kyverno 或 OPA，仅允许已签名镜像。对同一系统进行端到端威胁建模。

---

## 路线 8 — 成本工程

这是高级工程师获得决策话语权的领域。

### 主题

- 预留实例、Spot 实例和按需实例的决策建模。
- GPU 规格合理化与抢占策略。
- 将每千次预测成本作为主要指标。
- 出站流量、NAT 和 S3 请求的成本结构。
- 多租户成本分摊。

### 构建

- 针对一个课程项目，制作**每千次预测成本**仪表盘，按工作负载、实例类型及存储层拆分。找出最重要的三个优化杠杆并量化影响。

---

## 如何使用这份清单

- 未来 9–12 个月**最多选择 3 条路线**。
- **每条路线构建一个有分量的项目。** 只阅读不实践，知识容易遗忘。
- **公开写作。** 博客、会议演讲或 RFC 能很快暴露理解中的不足。
- **寻找学习伙伴。** 向他人解释 DDIA 第 5 章，才是真正学习它的方法。

下一步：完成至少 3 条路线及其构建项目后，进入 [Staff Engineer 路线](staff-engineer-path.md)。
