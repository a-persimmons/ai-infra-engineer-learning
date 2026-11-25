# 阅读清单——高级工程师路线

完成 AI 基础设施工程师课程后，你已经能够端到端搭建生产 ML 平台：使用 Kubernetes 提供服务、MLflow 追踪实验、Terraform 供应资源、Prometheus/Grafana 实现可观测性，并搭建带 RAG 的 LLM 技术栈。接下来 9–18 个月的目标，是从「能搭建」走向「能规模化运营，并解决棘手问题」。

这是一份经过筛选、具有明确观点的清单。宁可结合代码深入阅读少量材料，也不要把所有资料浅尝辄止。

## 路线 1——规模化生产 ML 平台

### 书籍

- *Designing Machine Learning Systems*（设计机器学习系统）——Chip Huyen。思考端到端生产 ML 的参考书。
- *Machine Learning Engineering*——Andriy Burkov。内容紧凑，更偏向检查清单。
- *Reliable Machine Learning*——Pineau 等（原文署名）。侧重运维：可复现性、监控、事故响应。

### 论文

- 《Hidden Technical Debt in Machine Learning Systems》（机器学习系统中的隐性技术债务）——Sculley 等（NeurIPS 2015）。必读。
- 《The ML Test Score: A Rubric for ML Production Readiness》——Breck 等（Google）。
- 《TFX: A TensorFlow-Based Production-Scale Machine Learning Platform》——Baylor 等（KDD 2017）。
- Uber 的 Michelangelo 和 Meta 的 Looper 工程博客系列。
- 《Continuous Delivery for Machine Learning》——Sato、Wider、Windheuser（martinfowler.com）。

### 实践

- 为课程中的一个项目增加**影子部署、自动化 A/B 测试和指标退化时自动回滚**。记录哪里出现了问题。
- 实现**多租户特征存储**，使用统一 API 支持在线（Redis）和离线（Parquet）查询。

---

## 路线 2——深入掌握 LLM 基础设施

超越 Module 110 的学习范围。

### 论文（按顺序阅读）

- *Attention Is All You Need*——Vaswani 等。
- *Efficient Memory Management for Large Language Model Serving with PagedAttention*——Kwon 等（vLLM 论文）。
- *FlashAttention* 与 *FlashAttention-2*——Tri Dao。
- *DeepSpeed-Inference*——Aminabadi 等。
- 如果需要运营安全相关流水线，阅读 Sparrow、Constitutional AI、RLHF 论文。

### 需要掌握的主题

- KV Cache 管理、PagedAttention、连续批处理。
- 推测解码、Lookahead Decoding。
- LoRA、QLoRA、DoRA 微调。
- 量化（INT8、INT4、FP8、AWQ、GPTQ）：各方法的代价与收益。
- 规模化 Multi-LoRA 服务。
- 生产护栏：提示注入防御、输出过滤、Schema 约束生成。
- 嵌入流水线、混合检索、重排序。

### 实践

- 选取 7–13B 参数模型，分别使用 Hugging Face Transformers、vLLM、TensorRT-LLM 提供服务。测量延迟、吞吐量、每百万 Token 成本，找出性能急剧变化的临界点。
- 端到端构建**生产级 RAG 应用**，包含混合检索（BM25 + 稠密向量）、重排序、引用依据及质量监控。

---

## 路线 3——分布式系统深度

ML 平台本质上是承载 ML 的分布式系统。

### 书籍

- *Designing Data-Intensive Applications*（数据密集型应用系统设计）——Martin Kleppmann。阅读复制、分区、一致性、流处理章节。
- *Database Internals*（数据库内部原理）——Alex Petrov。

### 经典论文

- *MapReduce*（Dean 与 Ghemawat，2004）。
- *Bigtable*（Chang 等，2006）。
- *Dynamo*（DeCandia 等，2007）。
- *Spanner*（Corbett 等，2012）及后续 *Spanner: Becoming a SQL System*。
- *Kafka: a Distributed Messaging System for Log Processing*（Kreps 等，2011）。
- *The Dataflow Model*（Akidau 等）。

### 实践

- 用熟悉的语言实现 Raft 或 Paxos。简单教学版本即可，然后阅读他人的生产实现。

---

## 路线 4——深入 Kubernetes 与 Operator

Module 104 涵盖基础；高级阶段意味着能够构建 Operator 并理解 API 机制。

### 书籍

- *Kubernetes in Action*——Marko Lukša（第 2 版）。
- *Programming Kubernetes*——Hausenblas 与 Schimanski。
- *Kubernetes Patterns*——Ibryam 与 Huß。

### 实践

- 使用 kubebuilder 或 Operator SDK 构建真实 **Operator**。一个将 ModelDeployment CRD 协调为 Deployment + Service + HPA + ServiceMonitor + Istio VirtualService 的项目是良好起点。
- 选定一个子系统深入阅读源码，例如 kube-scheduler 的 NodeAffinity 评分、kubelet 数据卷挂载生命周期、kube-apiserver 准入链。不要试图通读所有源码。

---

## 路线 5——AI 工作负载性能工程

### 书籍

- *Systems Performance*（系统性能）——Brendan Gregg（第 2 版）。必读。
- *BPF Performance Tools*——Brendan Gregg。
- *Computer Systems: A Programmer's Perspective*（深入理解计算机系统）——Bryant 与 O'Hallaron，学习缓存及内存层次基础。

### GPU 专项

- NVIDIA *CUDA C++ Programming Guide*——内存层次与异步执行章节。
- *PMPP — Programming Massively Parallel Processors*——Hwu、Kirk、El Hajj（第 4 版）。
- NVIDIA Tensor Core 编程模型（mma 指令）。

### 实践

- 对真实模型服务端点进行端到端性能分析，定位瓶颈（CPU、GPU 显存带宽、GC、反序列化等），消除瓶颈，并使用火焰图记录过程。

---

## 路线 6——可观测性与 SRE

### 书籍

- *Site Reliability Engineering*（Google SRE 手册）。完整阅读。
- *The Site Reliability Workbook*（Google）。
- *Observability Engineering*——Majors、Fong-Jones、Miranda。
- *Seeking SRE*——David Blank-Edelman（编）。

### 主题

- ML 服务的 SLI/SLO/SLA 设计（准确率、延迟、新鲜度）。
- Burn-rate 告警与阈值告警。
- 推理流水线的分布式追踪。
- ML 专用漂移及质量监控（Evidently、Arize、WhyLabs）。

### 实践

- 使用 **OpenTelemetry** 端到端埋点真实服务：指标、日志、Trace。在三种信号中可视化同一请求。
- 为真实服务定义 SLO，计算错误预算，构建 Burn-rate 告警。

---

## 路线 7——ML 系统安全

容易被低估的领域。原作者认为招聘团队越来越重视这一能力。

### 书籍

- *Building Secure and Reliable Systems*——Google SRE/Security。
- *Threat Modeling: Designing for Security*——Adam Shostack。

### 主题

- ML 服务技术栈的威胁建模（数据泄露、模型窃取、对抗输入）。
- ML 流水线供应链攻击（投毒数据集、受损模型产物）。
- 全链路 mTLS（Istio 或 Linkerd）。
- LLM 服务中的提示注入、越狱、输出过滤。
- 差分隐私基础。

### 实践

- 在 CI 中添加 Trivy 与 Grype 扫描。使用 cosign 签名镜像，利用 Kyverno 或 OPA 执行仅允许签名镜像的策略，并对同一系统开展端到端威胁建模。

---

## 路线 8——成本工程

高级工程师创造重要价值的领域。

### 主题

- 预留实例、Spot 与按需实例的决策建模。
- GPU 合理规格配置及抢占策略。
- 将每千次预测成本作为主要指标。
- 出站流量、NAT 和 S3 请求的费用结构。
- 多租户成本分摊。

### 实践

- 为某一课程项目构建**每千次预测成本仪表盘**，按工作负载、实例类型及存储层拆分。找出三个最有影响力的优化杠杆，并量化收益。

---

## 如何使用本清单

- 接下来 9–12 个月最多选择 **3 条路线**。
- **每条路线构建一个有实质内容的项目。** 只阅读不实践，知识很快遗忘。
- **公开写作。** 博客、会议演讲或 RFC 能迅速暴露理解缺口。
- **找学习伙伴。** 向别人解释 DDIA 第 5 章，本身就是学习过程。

完成至少三条路线及相应项目后，进入[Staff 工程师路线](staff-engineer-path.md)。
