# AI 基础设施工程师 — 学习路线

<!-- aicg:site-banner -->
> 🎓 免费开源 **AI 职业课程**生态的一部分——[基础设施](https://github.com/ai-infra-curriculum) · [ML 工程](https://github.com/ml-engineering-curriculum) · [AI 工程](https://github.com/ai-engineering-curriculum) · [治理](https://github.com/ai-governance-curriculum) · [创业](https://github.com/ai-startup-curriculum) · [劳动力发展](https://github.com/ai-workforce-curriculum)。
<!-- /aicg:site-banner -->

<!-- aicg:sponsor -->
> 💜 **[赞助本课程](https://github.com/sponsors/AI-Infra-Curriculum)**——赞助使整个开源 AI 职业课程保持免费并持续发展。
<!-- /aicg:sponsor -->

<div align="center">

![许可证](https://img.shields.io/badge/license-MIT-blue.svg)
![进度](https://img.shields.io/badge/modules-10/10_complete-brightgreen.svg)
![项目](https://img.shields.io/badge/projects-3/3_complete-brightgreen.svg)
![时长](https://img.shields.io/badge/duration-500+_hours-red.svg)

*通过动手项目和实践学习掌握 AI 基础设施工程*

[前置知识](./PREREQUISITES.md) • [快速开始](#快速开始) • [课程概览](#课程概览) • [项目](#项目) • [资源](#资源)

</div>

---

## 🎯 概览

本仓库提供成为 **AI 基础设施工程师**的**完整、面向生产环境的学习路线**。通过全面的模块、真实场景项目，以及包含教学性 TODO 注释的生产级代码桩，你将培养大规模构建、部署和维护 ML 基础设施所需的技能。

**仓库状态：** ✅ **100% 完成**——全部模块和项目均可用于学习！

### 你将掌握什么

- ✅ **从零构建 ML 基础设施**（Docker、Kubernetes、云平台）
- ✅ **部署生产级 ML 系统**，实现自动扩缩容和全面监控
- ✅ **实现端到端 MLOps** 流水线（Airflow、MLflow、DVC）
- ✅ **部署前沿 LLM 基础设施**（vLLM、RAG、向量数据库）
- ✅ **扩展训练规模**，使用分布式系统和 GPU 集群
- ✅ **监控并排查**生产环境中的复杂 ML 系统
- ✅ **优化云服务商成本**（有可能节省 60–80%）

### 为什么选择这条学习路线？

- 🎓 **与行业接轨**：基于 FAANG 和顶级科技公司的实际岗位要求
- 💻 **动手实践**：带 TODO 注释的代码桩引导你完成真实实现
- 🏗️ **面向生产环境**：学习 Netflix、Uber、Airbnb、OpenAI 使用的模式
- 📊 **面向职业发展**：直接对应年薪 12 万–18 万美元的 AI 基础设施工程师岗位
- 🚀 **循序渐进**：10 个模块，从基础逐步进阶到高级 LLM 基础设施
- 🔥 **现代技术栈**：2024–2025 年技术（vLLM、RAG、GPU 优化）

---

## ✨ 最新变化

**2026-05-27——目录布局标准化：**
- 🧹 **删除根目录中 10 个空的 `mod-XXX-*/` 占位目录。** 它们是重构前布局的遗留物；正式模块内容已在 `lessons/mod-XXX-*/` 下保存了一段时间。仓库现在符合 curriculum-runner 审计所期望的布局（学习内容在 `lessons/`，配套解决方案仓库使用 `modules/`）。
- 🧹 **删除孤立的 `lessons/mod-101-foundations/exercises/solutions/`**（重复的单文件索引）。参考解决方案位于配套的 [`ai-infra-engineer-solutions`](https://github.com/ai-infra-curriculum/ai-infra-engineer-solutions) 仓库；课程中的内联指引现已直接链接到该仓库。

**2026 年 5 月更新：**
- 🧪 **全部承诺的 62 个实验已编写**，覆盖 10 个模块（基础知识至 LLM 基础设施）。每个实验均为实质性、可运行的操作指南，包含目标、前置条件、编号步骤、验证清单、清理和故障排查。
- 📒 **新增两份阅读清单：** `advanced-engineer-path.md` 和 `staff-engineer-path.md`（分别为 9–18 个月和 2–5 年）。
- 🧹 **结构清理：** 解决 mod-101 重复讲义问题，统一测验位置，为空的 Makefile/pyproject 填充真实内容，修正 CURRICULUM.md 的自述以反映实际完成情况。
- 🔍 **对 CURRICULUM.md 进行真实性检查：** 先前的“100% 完成”声明已被各模块练习和实验的详细统计取代。讲义和项目质量优秀；承诺的 119 个练习已完成 32 个，其余将在后续内容更新中补齐。

**更早的更新：**
- 📝 **模块 102–110 的全面测验**（265+ 道题）
  - 模块 102：云计算（期中及期末，50 道题）
  - 模块 103：容器化（25 道题）
  - 模块 104：Kubernetes（30 道题）
  - 模块 105：数据流水线（25 道题）
  - 模块 106：MLOps（30 道题）
  - 模块 107：GPU 计算（25 道题）
  - 模块 108：监控（25 道题）
  - 模块 109：IaC（25 道题）
  - 模块 110：LLM 基础设施（30 道题）
- 📋 **技术版本指南**——100 多种工具的完整版本规范
- 🗺️ **课程交叉参考**——与初级工程师路线的映射
- 📈 **职业进阶指南**——从工程师到首席工程师的路线图

---

## 📊 包含哪些内容

### 10 个完整学习模块（130 个文件）

| 模块 | 主题 | 小时 | 状态 | 测验 |
|--------|-------|-------|--------|------|
| 01 | **基础知识** | 50h | ✅ 完成（15 个文件） | ✅ 30 题 |
| 02 | **云计算** | 50h | ✅ 完成（11 个文件） | ✨ **+50 题** |
| 03 | **容器化** | 50h | ✅ 完成（14 个文件） | ✨ **+25 题** |
| 04 | **Kubernetes** | 50h | ✅ 完成（13 个文件） | ✨ **+30 题** |
| 05 | **数据流水线** | 50h | ✅ 完成（12 个文件） | ✨ **+25 题** |
| 06 | **MLOps** | 50h | ✅ 完成（12 个文件） | ✨ **+30 题** |
| 07 | **GPU 计算** | 50h | ✅ 完成（12 个文件） | ✨ **+25 题** |
| 08 | **监控与可观测性** | 50h | ✅ 完成（11 个文件） | ✨ **+25 题** |
| 09 | **基础设施即代码** | 50h | ✅ 完成（12 个文件） | ✨ **+25 题** |
| 10 | **LLM 基础设施** | 50h | ✅ 完成（12 个文件） | ✨ **+30 题** |

### 3 个生产级项目（77 个文件）

| 项目 | 技术 | 时长 | 文件 | 状态 |
|---------|-------------|----------|-------|--------|
| **01：基础模型服务** | FastAPI + K8s + 监控 | 30h | ~30 | ✅ 完成 |
| **02：MLOps 流水线** | Airflow + MLflow + DVC | 40h | 30 | ✅ 完成 |
| **03：LLM 部署** | vLLM + RAG + 向量数据库 | 50h | 47 | ✅ 完成 |

**仓库总计：** 207 个文件 | 约 95,000+ 行代码 | 500+ 小时学习内容

---

## 🎓 前置知识

### 选项 1：完成初级课程（推荐）

如果你已完成 [**初级 AI 基础设施工程师**](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning) 课程，就具备了**全部**必要的前置知识！✅

初级课程涵盖：
- ✅ Python 基础及高级概念
- ✅ 熟练掌握 Linux/Unix 命令行
- ✅ Git 与版本控制工作流
- ✅ ML 基础（PyTorch、TensorFlow）
- ✅ Docker 与容器化
- ✅ Kubernetes 入门
- ✅ API 开发及数据库
- ✅ 监控与云平台

**时长**：440 小时（兼职学习 22 周，全职学习 11 周）

### 选项 2：自我评估

**还未完成初级课程？** 使用全面的 [**前置知识指南**](./PREREQUISITES.md)：
- 通过详细技能清单检查准备程度
- 识别知识缺口
- 获得个性化学习建议
- 运行自动化技能评估

### 最低要求

如果自学，必须具备：
- **Python 3.9+**（中级：OOP、异步、测试、类型提示）
- **Linux/Unix CLI**（Bash 脚本、进程、调试）
- **Git 基础**（分支、合并、协作）
- **ML 基础**（PyTorch/TensorFlow、训练、推理、评估）
- **Docker 基础**（镜像、容器、Compose）
- **Kubernetes 入门**（Pod、Deployment、Service）

**👉 不确定自己是否准备好了？** 阅读 [**前置知识指南**](./PREREQUISITES.md) 进行详细评估。

---

## 🚀 快速开始

### 快速启动

```bash
# 1. Clone repository
git clone https://github.com/ai-infra-curriculum/ai-infra-engineer-learning.git
cd ai-infra-engineer-learning

# 2. Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start with Module 01
cd lessons/mod-101-foundations
cat README.md
```

### 学习路线

1. **模块 01–02（基础）**——如果刚接触 ML 基础设施，从这里开始
2. **模块 03–04（核心基础设施）**——掌握 Docker 与 Kubernetes
3. **模块 05–06（MLOps）**——数据流水线与 ML 运维
4. **模块 07–08（高级）**——GPU 计算及监控
5. **模块 09–10（现代技术栈）**——IaC 与 LLM 基础设施

**详细指南：** [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## 📖 课程概览

### 模块 01：基础知识 ✅
**50 小时 | 15 个文件**

建立 ML 基础设施的基础：
- ML 基础设施领域及职业路线
- Python 环境搭建及最佳实践
- ML 框架（PyTorch、TensorFlow）
- Docker 基础与容器化
- 使用 FastAPI 开发 REST API

[查看模块 01 →](./lessons/mod-101-foundations/README.md)

---

### 模块 02：云计算 ✅
**50 小时 | 11 个文件**

掌握面向 ML 的云平台：
- ML 工作负载的云架构
- AWS（EC2、S3、EKS、SageMaker）
- GCP（Compute Engine、GCS、GKE、Vertex AI）
- Azure（VM、Blob Storage、AKS、Azure ML）
- 多云策略与成本优化（节省 60–80%）

[查看模块 02 →](./lessons/mod-102-cloud-computing/README.md)

---

### 模块 03：容器化 ✅
**50 小时 | 14 个文件**

深入学习容器：
- Docker 架构与最佳实践
- 多阶段构建及优化
- 面向多服务应用的 Docker Compose
- 容器注册中心与镜像管理
- 安全与漏洞扫描

[查看模块 03 →](./lessons/mod-103-containerization/README.md)

---

### 模块 04：Kubernetes ✅
**50 小时 | 13 个文件**

掌握面向 ML 的 Kubernetes：
- Kubernetes 架构及组件
- Deployment、Service、ConfigMap、Secret
- GPU 资源管理与调度
- 自动扩缩容（HPA、VPA、Cluster Autoscaler）
- Helm Chart 及使用 ArgoCD 实现 GitOps

[查看模块 04 →](./lessons/mod-104-kubernetes/README.md)

---

### 模块 05：数据流水线 ✅
**50 小时 | 12 个文件**

构建健壮的数据流水线：
- 使用 Apache Airflow 编排工作流
- 使用 Apache Spark 处理数据
- 使用 Apache Kafka 处理流式数据
- 使用 DVC 进行数据版本控制
- 数据质量验证与监控

[查看模块 05 →](./lessons/mod-105-data-pipelines/README.md)

---

### 模块 06：MLOps ✅
**50 小时 | 12 个文件**

实现 MLOps 最佳实践：
- 使用 MLflow 追踪实验
- 模型注册中心及版本管理
- 特征存储与特征工程
- 面向 ML 模型的 CI/CD
- A/B 测试与实验
- ML 治理和最佳实践

[查看模块 06 →](./lessons/mod-106-mlops/README.md)

---

### 模块 07：GPU 计算与分布式训练 ✅
**50 小时 | 12 个文件**

发挥 GPU 算力：
- CUDA 编程基础
- PyTorch GPU 加速
- 分布式训练（DDP、FSDP）
- 多 GPU 和多节点训练
- 模型并行与流水线并行
- GPU 显存优化

[查看模块 07 →](./lessons/mod-107-gpu-computing/README.md)

---

### 模块 08：监控与可观测性 ✅
**50 小时 | 11 个文件**

构建全面的可观测性：
- Prometheus 和 Grafana
- 指标、日志与链路追踪（OpenTelemetry）
- 使用 Jaeger 进行分布式链路追踪
- 告警与事件响应
- 模型性能监控
- SLI、SLO 和 SLA

[查看模块 08 →](./lessons/mod-108-monitoring-observability/README.md)

---

### 模块 09：基础设施即代码 ✅
**50 小时 | 12 个文件**

自动化基础设施：
- Terraform 基础与最佳实践
- 使用 Pulumi 实现多语言 IaC
- AWS CloudFormation
- 状态管理与模块
- 多环境部署
- GitOps 工作流

[查看模块 09 →](./lessons/mod-109-infrastructure-as-code/README.md)

---

### 模块 10：LLM 基础设施 ✅
**50 小时 | 12 个文件**

掌握前沿 LLM 基础设施（2024–2025）：
- 使用 vLLM 和 TensorRT-LLM 提供 LLM 服务
- RAG（检索增强生成）
- 向量数据库（Pinecone、Weaviate、Milvus）
- 模型量化（FP16、INT8）
- 推理 GPU 优化
- 成本追踪与优化

[查看模块 10 →](./lessons/mod-110-llm-infrastructure/README.md)

---

## 🛠️ 项目

### 项目 01：基础模型服务系统 ✅
**⭐ 初级 | 30 小时 | 约 30 个文件**

构建完整的模型服务系统：
- 用于图像分类的 FastAPI REST API
- Docker 容器化及优化
- 带监控的 Kubernetes 部署
- Prometheus 与 Grafana 仪表盘
- 使用 GitHub Actions 构建 CI/CD 流水线

**技术：** FastAPI、Docker、Kubernetes、PyTorch、Prometheus、Grafana

[查看项目 01 →](./projects/project-101-basic-model-serving/README.md)

---

### 项目 02：端到端 MLOps 流水线 ✅
**⭐⭐ 中级 | 40 小时 | 30 个文件**

创建生产级 MLOps 流水线：
- Apache Airflow DAG（数据、训练、部署）
- MLflow 实验追踪与模型注册中心
- 使用 DVC 管理数据版本
- 将模型自动部署到 Kubernetes
- 全面的监控与告警
- 具有自动化测试的 CI/CD

**技术：** Airflow、MLflow、DVC、PostgreSQL、Redis、MinIO、Kubernetes

[查看项目 02 →](./projects/project-102-mlops-pipeline/README.md)

---

### 项目 03：LLM 部署平台 ✅
**⭐⭐⭐ 高级 | 50 小时 | 47 个文件**

部署前沿 LLM 基础设施：
- 使用 vLLM/TensorRT-LLM 实现优化的模型服务
- 带向量数据库（Pinecone/ChromaDB/Milvus）的 RAG 系统
- 文档导入流水线（PDF、TXT、网页）
- 支持 Server-Sent Events 流式传输的 FastAPI
- 支持 GPU 的 Kubernetes
- 成本追踪与优化
- 全面监控

**技术：** vLLM、LangChain、向量数据库、FastAPI、Kubernetes + GPU、Transformers

[查看项目 03 →](./projects/project-103-llm-deployment/README.md)

---

## 💰 成本考量

### 云成本

所有学习材料均可在**免费层限制**内完成：
- **AWS**：每月 750 小时 t2.micro + 300 美元额度（可能变化）
- **GCP**：300 美元额度（90 天）
- **Azure**：200 美元额度（30 天）

**GPU 成本**（可选，用于高级项目）：
- 按需：每小时 1–3 美元
- 竞价实例：每小时 0.30–1 美元（节省 70%）
- 完整课程的预计总成本：50–150 美元

### 优化建议

- 使用竞价实例进行训练（节省 60–90%）
- 利用多个云服务商的免费层
- 不使用资源时将其删除
- 尽可能使用本地开发

---

## 📚 资源

### 随附文档
- 带示例的全面课程材料
- 带 TODO 注释的代码桩，用于引导实现
- 包含架构图的完整项目规范
- 每个模块的测验及评估
- 最佳实践和设计模式

### 外部资源
- 📖 **阅读清单**：[resources/reading-lists/](./resources/reading-lists/)——高级工程师及 Staff 工程师路线
- 🛠️ **速查表**：[resources/cheat-sheets/](./resources/cheat-sheets/)——Docker、Kubernetes、Git、Linux、Python 基础设施
- ❓ **常见问题**：[resources/faq.md](./resources/faq.md)

### 课程文档
- 📋 **[技术版本指南](VERSIONS.md)**——所有工具及框架的推荐版本
- 🗺️ **[课程交叉参考](https://github.com/ai-infra-curriculum/.github/blob/main/CURRICULUM_CROSS_REFERENCE.md)**——初级工程师与工程师路线之间的映射
- 📈 **[职业进阶指南](https://github.com/ai-infra-curriculum/.github/blob/main/CAREER_PROGRESSION.md)**——从初级工程师到首席工程师的完整职业阶梯

---

## 🎯 学习成果与职业影响

### 完成课程后，你将具备以下岗位所需的能力：

**AI 基础设施工程师**
- 💰 薪资：12 万–18 万美元
- 🏢 公司：科技公司、AI 初创企业、专注 ML 的组织
- 📈 需求：非常高（同比增长 35%）

**ML 平台工程师**
- 💰 薪资：13 万–19 万美元
- 🏢 公司：大型科技公司、拥有 ML 团队的企业
- 📈 需求：高（专业化职位）

**MLOps 工程师**
- 💰 薪资：11 万–17 万美元
- 🏢 公司：所有大规模开展 ML 的组织
- 📈 需求：非常高（增长最快的 ML 职位）

### 你将能够展示的技能

✅ Kubernetes 专业知识与 GPU 调度
✅ 端到端 MLOps 流水线实现
✅ LLM 基础设施与 RAG 系统
✅ 分布式训练与 GPU 优化
✅ 生产监控与可观测性
✅ 掌握云平台（AWS、GCP、Azure）
✅ 使用 Terraform 实现基础设施即代码
✅ 成本优化策略

---

## 📊 仓库统计

- **文件总数：** 207
- **预计行数：** 约 95,000+
- **模块：** 10（全部完成）
- **项目：** 3（全部完成）
- **学习小时：** 500+
- **技术：** 50+

### 涵盖的技术栈

**核心基础设施：**
Docker、Kubernetes、Terraform、Helm、ArgoCD

**ML 与数据：**
PyTorch、TensorFlow、Apache Airflow、Apache Spark、Kafka、DVC

**MLOps：**
MLflow、特征存储、模型注册中心、CI/CD

**LLM 基础设施：**
vLLM、TensorRT-LLM、LangChain、向量数据库（Pinecone、Milvus、ChromaDB）

**云平台：**
AWS（EC2、S3、EKS、SageMaker）、GCP（GCE、GCS、GKE、Vertex AI）、Azure（VM、AKS、Azure ML）

**监控：**
Prometheus、Grafana、OpenTelemetry、Jaeger、ELK Stack

**GPU 计算：**
CUDA、NCCL、多 GPU 训练、分布式训练

---

## 🤝 贡献

欢迎贡献！请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)，了解：
- Bug 报告与修复
- 文档改进
- 新练习及示例
- 更新最佳实践

---

## 🆘 获取帮助

- 📖 **文档**：从 [GETTING_STARTED.md](./GETTING_STARTED.md) 开始
- 💬 **GitHub Discussions**：[提出问题](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)
- 🐛 **Issues**：[报告 Bug](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues)
- 📧 **联系方式**：ai-infra-curriculum@joshua-ferguson.com

---

## 📜 许可证

本项目采用 **MIT 许可证**——详见 [LICENSE](./LICENSE)。

---

## 🌟 成功标准

完成课程后，你应该能够：

- [ ] 自信地将 ML 模型部署到生产环境
- [ ] 从零构建完整的 MLOps 流水线
- [ ] 实现带 RAG 的 LLM 基础设施
- [ ] 将云成本优化 60–80%
- [ ] 调试复杂分布式系统
- [ ] 通过 AI 基础设施岗位的技术面试
- [ ] 自信地讨论系统设计中的权衡
- [ ] 在组织中领导基础设施项目

---

## 🚀 完成课程后的下一步

本课程为 **AI 基础设施工程师**岗位做好准备。职业进阶方向：

1. **积累经验**（1–2 年）
   - 参与生产 ML 系统工作
   - 处理事故及轮班值守
   - 为开源 ML 基础设施项目贡献代码

2. **晋升高级工程师**（累计 2–3 年）
   - 继续学习 [高级工程师路线](https://github.com/ai-infra-curriculum/ai-infra-senior-engineer-learning)
   - 领导更大型的项目并指导初级工程师
   - 设计复杂系统

3. **成为架构师**（累计 4–6 年）
   - 继续学习 [架构师路线](https://github.com/ai-infra-curriculum/ai-infra-architect-learning)
   - 设计企业级 ML 平台
   - 提供战略性技术领导力

---

<div align="center">

## 准备好掌握 AI 基础设施工程了吗？

**今天就开始你的学习之旅！**

[📘 快速开始](./GETTING_STARTED.md) | [📚 查看完整课程](./CURRICULUM.md) | [🚀 开始模块 01](./lessons/mod-101-foundations/README.md)

---

⭐ 如果你认为本仓库有价值，请为它**点 Star**！

**分享给其他**正在学习 AI 基础设施工程的人！

---

*联系方式：ai-infra-curriculum@joshua-ferguson.com*

**学习愉快！** 🎓🚀

</div>

---

<!-- aicg:maintained-by -->
由 [VeriSwarm.ai](https://veriswarm.ai) 维护
