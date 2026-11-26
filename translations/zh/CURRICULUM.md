# AI 基础设施工程师课程大纲

<!-- aicg:orientation:start -->
> **从这里开始：** [模块 00：你与模型的关系](lessons/00-your-relationship-to-the-model/README.md)。了解该岗位与模型的关系、负责的内容，以及与其他配套课程所对应岗位的协作关系。
<!-- aicg:orientation:end -->

> **面向未来 AI 基础设施工程师的全面实践课程**

## 目录

- [课程概览](#curriculum-overview)
- [学习理念](#learning-philosophy)
- [课程结构](#curriculum-structure)
- [前置知识](#prerequisites)
- [学习成果](#learning-outcomes)
- [课程模块](#modules)
  - [模块 01：基础知识](#module-01-foundations)
  - [模块 02：云计算基础](#module-02-cloud-computing-fundamentals)
  - [模块 03：容器化与 Docker](#module-03-containerization--docker)
  - [模块 04：Kubernetes 基础](#module-04-kubernetes-fundamentals)
  - [模块 05：数据流水线工程](#module-05-data-pipeline-engineering)
  - [模块 06：MLOps 基础](#module-06-mlops-fundamentals)
  - [模块 07：GPU 计算与 ML 加速](#module-07-gpu-computing--ml-acceleration)
  - [模块 08：监控与可观测性](#module-08-monitoring--observability)
  - [模块 09：基础设施即代码](#module-09-infrastructure-as-code)
  - [模块 10：LLM 基础设施](#module-10-llm-infrastructure)
- [实践项目](#projects)
  - [项目 01：基础模型服务系统](#project-101-basic-model-serving-system)
  - [项目 02：MLOps 流水线](#project-102-mlops-pipeline)
  - [项目 103：生产级 LLM 部署](#project-103-production-llm-deployment)
- [评估策略](#assessment-strategy)
- [时间投入](#time-commitment)
- [学习计划](#study-plans)
- [职业发展](#career-progression)
- [学习资源](#learning-resources)
- [获取帮助](#getting-help)

---

## 课程概览 {#curriculum-overview}

本课程旨在帮助你从基础知识进阶至生产级 AI 基础设施工程技能。通过 10 个全面模块和 3 个实践项目，你将掌握大规模构建、部署与维护 AI/ML 系统所需的专业能力。

### 仓库统计

- **文件总数**：207
- **代码总行数**：约 95,000+
- **学习时长**：500+ 小时
- **模块**：10 个完整模块
- **项目**：3 个循序渐进的项目
- **状态**：🚧 正在积极开发——各模块练习与实验当前的完成情况，见下方[进度说明](#progress-notes)

### 本课程的独特之处

1. **渐进式学习**：每个模块建立在此前知识之上
2. **动手实践项目**：真实场景与生产级代码
3. **贴合行业**：基于顶尖科技公司的实际岗位要求
4. **完整解决方案**：从基础到 LLM 部署
5. **面向生产**：重视最佳实践、测试与监控
6. **职业导向**：对齐 AI 基础设施工程师岗位

---

## 学习理念 {#learning-philosophy}

### 我们的方法

**做中学**：每个概念都通过实际练习和真实代码巩固。

**生产思维**：我们不仅教你如何构建系统，还教你如何正确地构建系统。每个项目都考虑监控、测试、安全与可扩展性。

**逐步增加复杂度**：从基础开始，逐渐增加复杂度。最终，你将能够部署生产级 LLM 系统。

**真实场景**：所有项目都基于实际行业用例与需求。

### 教学方法

1. **概念基础**：先理解为什么，再理解怎么做
2. **引导式实现**：具有明确目标的分步练习
3. **独立实践**：带 TODO 注释的代码骨架引导你的工作
4. **项目整合**：在完整的端到端项目中应用概念
5. **持续评估**：测验、练习与实践考试

---

## 课程结构 {#curriculum-structure}

### 模块组织方式

10 个模块均遵循统一结构：

```
modules/XX-module-name/
├── README.md              # Module overview and objectives
├── lecture-notes.md       # Comprehensive lecture content
├── exercises/             # Hands-on practice exercises
│   ├── exercise-01.md
│   ├── exercise-02.md
│   └── solutions/        # Exercise solutions
├── labs/                  # Practical lab environments
│   └── lab-XX.md
├── quizzes/              # Knowledge assessments
│   └── quiz-XX.md
└── resources.md          # Additional learning materials
```

### 项目组织方式

每个项目包括：

```
projects/project-XX-name/
├── README.md              # Project overview
├── requirements.md        # Detailed requirements
├── architecture.md        # System architecture
├── setup.md              # Setup instructions
├── src/                  # Code stubs with TODOs
├── tests/                # Test stubs
├── docs/                 # Documentation templates
├── configs/              # Configuration files
└── scripts/              # Helper scripts
```

---

## 前置知识 {#prerequisites}

### 必备知识

开始本课程之前，你应当具备：

#### 编程技能
- **Python**：中级水平（3 年以上经验）
  - 面向对象编程
  - 文件 I/O 与数据结构
  - 错误处理与日志
  - 虚拟环境与包管理
  - 异步编程基础

#### 系统管理
- **Linux**：基本命令行操作能力
  - 文件系统导航
  - 进程管理
  - 文本编辑器（vim/nano）
  - 权限与所有权
  - 基本网络命令

#### 版本控制
- **Git**：基本操作
  - Clone、commit、push、pull
  - 分支与合并
  - 解决冲突

#### 网络
- **基础知识**：理解以下内容
  - TCP/IP 基础
  - HTTP/HTTPS 协议
  - DNS 解析
  - 端口与防火墙

### 建议掌握的知识

以下知识有帮助，但并非必需：

- 基本机器学习概念
- 接触过云平台（AWS、GCP 或 Azure）
- 数据库经验（SQL 或 NoSQL）
- API 与 REST 基础
- 熟悉 YAML 和 JSON 格式

### 技术要求

#### 硬件
- **CPU**：建议 4 核以上
- **内存**：至少 16GB，建议 32GB
- **存储**：100GB 可用空间，用于 Docker 镜像与数据集
- **GPU**：可选，但有助于模块 07 学习（提供云端替代方案）

#### 软件
- **操作系统**：Linux（推荐 Ubuntu 22.04）或 macOS
  - Windows 用户：需要 WSL2
- **Python**：3.11 或更高版本
- **Git**：最新版本
- **文本编辑器/IDE**：VS Code、PyCharm 或类似工具
- **互联网**：稳定的宽带连接以访问云资源

#### 云账户（免费额度即可）
- AWS 账户（免费额度）
- Google Cloud 账户（300 美元免费额度）
- Docker Hub 账户（免费）
- GitHub 账户（免费）

---

## 学习成果 {#learning-outcomes}

完成本课程后，你将能够：

### 核心能力

#### 基础设施与系统
- ✅ 使用 Docker 设计和部署容器化应用
- ✅ 使用 Kubernetes 编排复杂工作负载
- ✅ 使用 Terraform 实现基础设施即代码
- ✅ 构建具备弹性与可扩展性的云架构
- ✅ 管理 ML 工作负载的 GPU 资源

#### 机器学习运维
- ✅ 将 ML 模型部署到生产环境
- ✅ 为 ML 系统实现 CI/CD 流水线
- ✅ 构建与维护数据处理流水线
- ✅ 监控模型性能与系统健康状况
- ✅ 实现模型版本管理与实验追踪

#### 大语言模型
- ✅ 在生产环境部署与提供 LLM 服务
- ✅ 为 RAG 系统实现向量数据库
- ✅ 优化 LLM 推理成本与性能
- ✅ 构建多模型 AI 系统
- ✅ 实现 LLM 可观测性与监控

#### 生产工程
- ✅ 实现全面的监控与告警
- ✅ 设计高可用与容错系统
- ✅ 优化云环境成本
- ✅ 实现安全最佳实践
- ✅ 编写具有测试的生产级代码

### 就业准备

完成本课程后，你将具备以下岗位所需的能力：

- **AI 基础设施工程师**岗位
- **ML 平台工程师**岗位
- **MLOps 工程师**岗位
- 专注 ML 的 **DevOps 工程师**岗位

**预期薪资范围**：120,000–180,000 美元（美国，入门至中级）

---

## 课程模块 {#modules}

### 模块 01：基础知识 {#module-01-foundations}
**状态**：✅ 完成 | **时长**：40 小时 | **文件**：15

#### 概览
建立 AI 基础设施工程所需的基础知识。本模块涵盖 Python 最佳实践、Linux 系统管理、网络基础和开发环境搭建。

#### 学习目标
学完本模块，你将能够：
- 掌握基础设施代码的 Python 开发最佳实践
- 熟练操作和管理 Linux 系统
- 理解分布式系统的网络基础
- 搭建专业开发环境
- 在团队中有效使用版本控制

#### 涵盖主题
- **面向基础设施的 Python**
  - 虚拟环境与依赖管理
  - 日志与错误处理模式
  - 配置管理
  - 基础设施代码测试
  - 面向 I/O 操作的异步编程

- **Linux 系统管理**
  - 文件系统层次结构与管理
  - 进程与服务管理（systemd）
  - 用户与权限管理
  - 系统监控与日志
  - 用于自动化的 Shell 脚本

- **网络基础**
  - TCP/IP 协议栈与协议
  - DNS 与服务发现
  - 负载均衡概念
  - 网络安全基础
  - 网络故障排查

- **开发环境**
  - IDE 配置与效率工具
  - Git 工作流与最佳实践
  - SSH 密钥与安全访问
  - 开发环境与生产环境的区别

#### 关键技术
- Python 3.11+
- Linux (Ubuntu 22.04)
- Git 与 GitHub
- VSCode/PyCharm
- Bash 脚本

#### 所含材料
- 全面的讲义（3,500+ 行）
- 10 个动手练习及答案
- 5 个实践实验
- 2 项评估（测验与实践考试）
- 丰富的资源清单

#### 评估
- **测验**：覆盖全部主题的 30 道题
- **实践考试**：构建用于系统监控的 Python CLI 工具
- **通过分数**：80%

#### 时间投入
- 讲义：12 小时
- 练习：15 小时
- 实验：8 小时
- 评估：5 小时

---

### 模块 02：云计算基础 {#module-02-cloud-computing-fundamentals}
**状态**：✅ 完成 | **时长**：45 小时 | **文件**：11

#### 概览
通过 AWS、Google Cloud 和 Azure 的动手实践掌握云计算基础。学习设计云解决方案、管理资源和优化成本。

#### 学习目标
学完本模块，你将能够：
- 理解云服务模型（IaaS、PaaS、SaaS）
- 在主要云供应商上部署和管理资源
- 设计具备可扩展性与可靠性的云架构
- 实现云安全最佳实践
- 优化云成本与资源利用率

#### 涵盖主题
- **云服务模型**
  - 基础设施即服务（IaaS）
  - 平台即服务（PaaS）
  - 无服务器与函数即服务
  - 面向 ML/AI 的托管服务

- **AWS 基础**
  - EC2 实例与自动扩缩容
  - S3 存储与数据管理
  - VPC 网络与安全组
  - IAM 角色与策略
  - 面向 ML 工作负载的 SageMaker

- **Google Cloud Platform**
  - Compute Engine 与实例管理
  - Cloud Storage 与数据湖
  - Cloud AI Platform
  - 网络与安全
  - 成本管理工具

- **Azure 基础**
  - 虚拟机与规模集
  - Blob 存储与数据服务
  - Azure ML 平台
  - 资源组与管理

- **多云策略**
  - 各供应商的适用场景
  - 多云架构
  - 云可移植性考量
  - 成本比较与优化

#### 关键技术
- AWS (EC2, S3, VPC, IAM, SageMaker)
- Google Cloud (Compute Engine, Cloud Storage, AI Platform)
- Azure (VMs, Blob Storage, Azure ML)
- 云 CLI 工具（aws-cli、gcloud、az）
- Terraform（入门）

#### 所含材料
- 全面的讲义（4,200+ 行）
- 8 个动手练习及答案
- 4 个云实验（AWS、GCP、Azure、多云）
- 2 项评估
- 成本优化指南

#### 评估
- **测验**：35 道云概念题
- **实践考试**：在 AWS 上部署多层应用
- **通过分数**：80%

#### 时间投入
- 讲义：15 小时
- 练习：18 小时
- 实验：8 小时
- 评估：4 小时

---

### 模块 03：容器化与 Docker {#module-03-containerization--docker}
**状态**：✅ 完成 | **时长**：50 小时 | **文件**：14

#### 概览
深入学习 Docker 容器化技术。学习为 AI/ML 工作负载构建、优化和管理容器。

#### 学习目标
学完本模块，你将能够：
- 为 ML 应用构建高效 Docker 镜像
- 优化容器镜像体积与性能
- 为生产环境实现多阶段构建
- 管理容器网络与存储
- 使用 Docker Compose 管理多容器应用
- 实现容器安全最佳实践

#### 涵盖主题
- **Docker 基础**
  - 容器架构与隔离
  - 镜像、层与缓存
  - Dockerfile 最佳实践
  - 构建镜像与添加标签
  - 容器生命周期管理

- **Docker 进阶**
  - 面向 ML 应用的多阶段构建
  - BuildKit 与构建优化
  - 卷管理与持久化
  - 网络配置与服务发现
  - 资源限制与约束

- **面向 ML/AI 的 Docker**
  - 支持 GPU 的容器
  - ML 框架基础镜像
  - 模型打包与版本管理
  - 数据卷管理
  - 依赖管理

- **Docker Compose**
  - 服务编排
  - 环境配置
  - 开发环境
  - 使用容器进行集成测试

- **容器安全**
  - 镜像扫描与漏洞检测
  - 非 root 容器
  - 密钥管理
  - 网络隔离
  - 安全最佳实践

#### 关键技术
- Docker Engine 24+
- Docker Compose
- Docker BuildKit
- 容器镜像仓库（Docker Hub、ECR、GCR）
- 安全扫描工具（Trivy、Snyk）

#### 所含材料
- 全面的讲义（4,800+ 行）
- 12 个动手练习及答案
- 6 个实践实验
- 2 项评估
- 生产级 Dockerfile 模板

#### 评估
- **测验**：40 道容器化题
- **实践考试**：将完整的 ML 应用容器化
- **通过分数**：80%

#### 时间投入
- 讲义：16 小时
- 练习：20 小时
- 实验：10 小时
- 评估：4 小时

---

### 模块 04：Kubernetes 基础 {#module-04-kubernetes-fundamentals}
**状态**：✅ 完成 | **时长**：60 小时 | **文件**：13

#### 概览
掌握使用 Kubernetes 编排容器化 ML 工作负载。学习部署、扩缩容与管理生产级 Kubernetes 集群。

#### 学习目标
学完本模块，你将能够：
- 理解 Kubernetes 架构与组件
- 在 Kubernetes 上部署与管理应用
- 实现自动扩缩容与自愈
- 配置网络与服务发现
- 管理存储与有状态应用
- 使用 RBAC 与网络策略实现安全

#### 涵盖主题
- **Kubernetes 架构**
  - 控制平面组件
  - 节点架构
  - Pod 设计与生命周期
  - Controller 与 Operator
  - 集群网络

- **核心工作负载**
  - Deployment 与 ReplicaSet
  - 用于有状态应用的 StatefulSet
  - DaemonSet 与 Job
  - 用于批处理的 CronJob
  - Init 容器与 Sidecar

- **网络**
  - Service（ClusterIP、NodePort、LoadBalancer）
  - Ingress Controller 与路由
  - 网络策略与安全
  - DNS 与服务发现
  - CNI 插件

- **存储**
  - 卷与持久卷
  - StorageClass 与动态供应
  - StatefulSet 存储
  - 数据持久化模式

- **配置与密钥**
  - 用于配置的 ConfigMap
  - 密钥管理
  - 环境变量
  - 外部密钥管理

- **扩缩容与资源**
  - Pod 水平自动扩缩容
  - Pod 垂直自动扩缩容
  - 集群自动扩缩容
  - 资源请求与限制
  - 服务质量（QoS）

- **安全**
  - RBAC 与 ServiceAccount
  - Pod 安全标准
  - 网络策略
  - 镜像安全
  - 密钥加密

#### 关键技术
- Kubernetes 1.28+
- kubectl CLI
- Helm 3
- Minikube/Kind（本地开发）
- EKS/GKE/AKS（云端 Kubernetes）

#### 所含材料
- 全面的讲义（5,500+ 行）
- 15 个动手练习及答案
- 8 个实践实验
- 2 项评估
- 生产级资源清单

#### 评估
- **测验**：50 道 Kubernetes 题
- **实践考试**：在 Kubernetes 上部署可扩展的 ML 应用
- **通过分数**：80%

#### 时间投入
- 讲义：20 小时
- 练习：25 小时
- 实验：12 小时
- 评估：3 小时

---

### 模块 05：数据流水线工程 {#module-05-data-pipeline-engineering}
**状态**：✅ 完成 | **时长**：50 小时 | **文件**：12

#### 概览
为 ML 工作负载构建健壮的数据流水线。学习利用现代数据工程工具大规模摄取、处理和存储数据。

#### 学习目标
学完本模块，你将能够：
- 设计和实现 ML 数据流水线
- 处理批量数据与流式数据
- 使用 Apache Spark 进行分布式处理
- 实现数据质量控制与验证
- 构建 ETL/ELT 工作流
- 管理数据版本与血缘

#### 涵盖主题
- **数据流水线基础**
  - 流水线架构模式
  - 批处理与流处理
  - 数据质量与验证
  - 错误处理与重试逻辑
  - 监控与告警

- **Apache Airflow**
  - DAG 设计与最佳实践
  - Operator 与 Sensor
  - 任务依赖与调度
  - 动态 DAG 生成
  - 监控与故障排查

- **Apache Spark**
  - RDD、DataFrame 和 Dataset API
  - 转换与行动操作
  - 用于数据处理的 Spark SQL
  - 用于 Python 集成的 PySpark
  - 性能优化

- **数据存储**
  - 数据湖与数据仓库
  - Parquet、Avro 和 ORC 格式
  - 分区策略
  - 数据版本管理（DVC）
  - 特征存储

- **流处理**
  - Apache Kafka 基础
  - 实时数据摄取
  - 流处理模式
  - 窗口操作
  - 精确一次语义

- **数据质量**
  - Schema 验证
  - 数据剖析
  - 异常检测
  - 数据血缘追踪
  - Great Expectations 框架

#### 关键技术
- Apache Airflow 2.7+
- Apache Spark 3.4+
- Apache Kafka
- PostgreSQL
- DVC（数据版本控制）
- Great Expectations

#### 所含材料
- 全面的讲义（4,600+ 行）
- 12 个动手练习及答案
- 6 个实践实验
- 2 项评估
- 流水线模板与 DAG

#### 评估
- **测验**：40 道数据流水线题
- **实践考试**：构建端到端 ML 数据流水线
- **通过分数**：80%

#### 时间投入
- 讲义：18 小时
- 练习：20 小时
- 实验：10 小时
- 评估：2 小时

---

### 模块 06：MLOps 基础 {#module-06-mlops-fundamentals}
**状态**：✅ 完成 | **时长**：55 小时 | **文件**：12

#### 概览
学习 MLOps 实践，弥合 ML 开发与生产部署之间的鸿沟。为 ML 系统实现持续集成、部署与监控。

#### 学习目标
学完本模块，你将能够：
- 为 ML 模型实现 CI/CD 流水线
- 管理模型版本与实验追踪
- 将模型部署到生产环境
- 监控模型性能与数据漂移
- 为模型实施 A/B 测试
- 构建重新训练流水线

#### 涵盖主题
- **MLOps 原则**
  - ML 生命周期管理
  - 开发与生产
  - ML 系统中的技术债务
  - 团队协作模式
  - MLOps 成熟度模型

- **实验追踪**
  - MLflow 实验与运行
  - 参数与指标记录
  - 产物管理
  - 模型注册中心
  - 实验比较

- **模型服务**
  - 模型服务架构
  - 使用 FastAPI 构建 REST API
  - 批量推理与实时推理
  - 生产环境的模型版本管理
  - 金丝雀部署

- **面向 ML 的 CI/CD**
  - ML 自动化测试
  - 模型验证流水线
  - 持续训练
  - 用于 ML 的 GitHub Actions
  - 部署自动化

- **模型监控**
  - 性能指标追踪
  - 数据漂移检测
  - 模型性能退化告警
  - 特征监控
  - 日志与调试

- **特征工程**
  - 特征存储（Feast）
  - 特征转换流水线
  - 特征版本管理
  - 在线与离线特征
  - 特征监控

#### 关键技术
- MLflow
- FastAPI
- Feast（特征存储）
- GitHub Actions
- Prometheus
- Grafana

#### 所含材料
- 全面的讲义（5,000+ 行）
- 14 个动手练习及答案
- 7 个实践实验
- 2 项评估
- MLOps 模板与工作流

#### 评估
- **测验**：45 道 MLOps 题
- **实践考试**：构建完整的 MLOps 流水线
- **通过分数**：80%

#### 时间投入
- 讲义：18 小时
- 练习：22 小时
- 实验：12 小时
- 评估：3 小时

---

### 模块 07：GPU 计算与 ML 加速 {#module-07-gpu-computing--ml-acceleration}
**状态**：✅ 完成 | **时长**：50 小时 | **文件**：12

#### 概览
掌握面向 ML 工作负载的 GPU 计算。学习优化训练和推理、管理 GPU 资源，并实现具有成本效益的加速策略。

#### 学习目标
学完本模块，你将能够：
- 理解面向 ML 工作负载的 GPU 架构
- 配置 GPU 所需的 CUDA 和 ML 框架
- 优化训练和推理性能
- 管理多 GPU 系统
- 实现 GPU 工作负载成本优化
- 有效使用云 GPU 服务

#### 涵盖主题
- **GPU 基础**
  - GPU 架构（CUDA Core、Tensor Core）
  - CPU 与 GPU 计算
  - 内存层次结构与带宽
  - CUDA 编程基础
  - 为 ML 工作负载选择 GPU

- **ML 框架的 GPU 支持**
  - PyTorch GPU 操作
  - TensorFlow GPU 配置
  - 混合精度训练
  - 梯度累积
  - 多 GPU 训练

- **训练优化**
  - 分布式训练策略
  - 数据并行
  - 模型并行
  - 流水线并行
  - 梯度检查点

- **推理优化**
  - 模型量化
  - TensorRT 优化
  - ONNX 模型导出
  - 批处理策略
  - 使用 Triton 进行动态批处理

- **GPU 资源管理**
  - Docker GPU 支持
  - Kubernetes GPU 调度
  - GPU 共享与时间切片
  - 资源配额与限制
  - 监控 GPU 利用率

- **云 GPU 服务**
  - AWS EC2 GPU 实例
  - GCP GPU 产品
  - Azure GPU 虚拟机
  - 成本优化策略
  - 用于训练的竞价实例

#### 关键技术
- NVIDIA CUDA 12+
- PyTorch 2.0+
- TensorFlow 2.14+
- NVIDIA Triton Inference Server
- TensorRT
- Docker GPU 运行时

#### 所含材料
- 全面的讲义（4,400+ 行）
- 11 个动手练习及答案
- 6 个实践实验
- 2 项评估
- GPU 优化指南

#### 评估
- **测验**：40 道 GPU 计算题
- **实践考试**：优化模型的 GPU 推理性能
- **通过分数**：80%

#### 时间投入
- 讲义：16 小时
- 练习：20 小时
- 实验：12 小时
- 评估：2 小时

---

### 模块 08：监控与可观测性 {#module-08-monitoring--observability}
**状态**：✅ 完成 | **时长**：45 小时 | **文件**：11

#### 概览
为 ML 基础设施实现全面的监控与可观测性。学习收集指标、创建仪表盘、设置告警，以及排查生产问题。

#### 学习目标
学完本模块，你将能够：
- 为 ML 系统设计监控策略
- 使用 Prometheus 收集并存储指标
- 使用 Grafana 创建信息丰富的仪表盘
- 实现告警与值班流程
- 使用分布式链路追踪进行调试
- 分析日志以排查故障

#### 涵盖主题
- **可观测性基础**
  - 指标、日志与链路追踪
  - 可观测性的三大支柱
  - SLI、SLO 和 SLA
  - 监控与可观测性的区别
  - 告警疲劳及最佳实践

- **Prometheus**
  - 指标收集与存储
  - PromQL 查询语言
  - 服务发现
  - Exporter 与插桩
  - 记录规则与聚合

- **Grafana**
  - 仪表盘设计原则
  - 可视化类型
  - 模板变量
  - 告警规则
  - 团队协作

- **应用插桩**
  - 使用 Python 自定义指标
  - ML 专用指标
  - 请求链路追踪
  - 性能剖析
  - 资源利用率

- **分布式链路追踪**
  - Jaeger 架构
  - OpenTelemetry 插桩
  - 链路采样策略
  - 性能分析
  - 调试分布式系统

- **日志管理**
  - 集中式日志（ELK 技术栈）
  - 日志聚合模式
  - 结构化日志
  - 日志分析与搜索
  - 日志保留策略

- **告警**
  - 告警设计与调优
  - 通知渠道
  - 升级策略
  - 值班最佳实践
  - 事故响应

#### 关键技术
- Prometheus
- Grafana
- Jaeger
- OpenTelemetry
- ELK 技术栈（Elasticsearch、Logstash、Kibana）
- Alertmanager

#### 所含材料
- 全面的讲义（4,200+ 行）
- 10 个动手练习及答案
- 5 个实践实验
- 2 项评估
- 仪表盘模板与告警规则

#### 评估
- **测验**：35 道监控题
- **实践考试**：为 ML 服务构建完整监控技术栈
- **通过分数**：80%

#### 时间投入
- 讲义：15 小时
- 练习：18 小时
- 实验：10 小时
- 评估：2 小时

---

### 模块 09：基础设施即代码 {#module-09-infrastructure-as-code}
**状态**：✅ 完成 | **时长**：50 小时 | **文件**：12

#### 概览
使用 Terraform 和 Pulumi 掌握基础设施即代码。学习跨云供应商供应、管理基础设施并对其进行版本管理。

#### 学习目标
学完本模块，你将能够：
- 使用 Terraform 编写基础设施代码
- 有效管理状态和工作空间
- 设计可复用的基础设施模块
- 为基础设施实现 CI/CD
- 使用 Pulumi 进行编程式基础设施管理
- 应用 IaC 最佳实践与模式

#### 涵盖主题
- **IaC 基础**
  - 基础设施即代码原则
  - 声明式与命令式方法
  - 状态管理
  - 幂等性与收敛
  - 基础设施版本控制

- **Terraform 基础**
  - HCL 语法与结构
  - Provider 与资源
  - 变量与输出
  - 数据源
  - 状态管理

- **Terraform 进阶**
  - 模块与组合
  - 工作空间与环境
  - 远程状态后端
  - Terraform Cloud/Enterprise
  - 基础设施代码测试

- **使用 Terraform 实现多云**
  - AWS 资源（EC2、S3、VPC）
  - GCP 资源（Compute、Storage）
  - Azure 资源
  - 多云模式
  - Provider 版本管理

- **Pulumi**
  - 使用 Python 管理基础设施
  - Stack 管理
  - 密钥与配置
  - 组件资源
  - 使用 Pulumi 进行测试

- **面向 ML 基础设施的 IaC**
  - Kubernetes 集群供应
  - GPU 实例管理
  - ML 平台部署
  - 成本优化
  - 灾难恢复

- **面向基础设施的 CI/CD**
  - 自动化测试
  - Plan 与 Apply 工作流
  - 用于 Terraform 的 GitHub Actions
  - 策略即代码（Sentinel、OPA）
  - 漂移检测

#### 关键技术
- Terraform 1.6+
- Pulumi 3.0+
- AWS/GCP/Azure Provider
- GitHub Actions
- Terraform Cloud
- OpenTofu

#### 所含材料
- 全面的讲义（4,700+ 行）
- 13 个动手练习及答案
- 7 个实践实验
- 2 项评估
- Terraform 模块与 Pulumi 组件

#### 评估
- **测验**：40 道 IaC 题
- **实践考试**：使用 Terraform 部署完整 ML 基础设施
- **通过分数**：80%

#### 时间投入
- 讲义：16 小时
- 练习：20 小时
- 实验：12 小时
- 评估：2 小时

---

### 模块 10：LLM 基础设施 {#module-10-llm-infrastructure}
**状态**：✅ 完成 | **时长**：55 小时 | **文件**：12

#### 概览
为大语言模型构建生产级基础设施。学习借助向量数据库、RAG 系统与具有成本效益的推理策略部署、服务和优化 LLM。

#### 学习目标
学完本模块，你将能够：
- 在生产环境部署与提供 LLM 服务
- 实现 RAG（检索增强生成）系统
- 管理用于嵌入向量的向量数据库
- 优化 LLM 推理成本与性能
- 构建多模型 AI 应用
- 实现 LLM 可观测性与监控

#### 涵盖主题
- **LLM 基础**
  - Transformer 架构回顾
  - 模型家族（GPT、BERT、LLaMA）
  - 预训练与微调
  - 提示词工程基础
  - LLM 能力与局限

- **LLM 部署**
  - 模型托管选项
  - 使用 vLLM 实现高效推理
  - 文本生成推理（TGI）
  - 模型量化（GPTQ、AWQ）
  - 多 GPU 服务

- **向量数据库**
  - 嵌入向量基础
  - Weaviate 架构
  - 索引类型（HNSW、IVF）
  - 混合检索
  - 性能优化

- **RAG 系统**
  - RAG 架构模式
  - 文档切片策略
  - 检索优化
  - 上下文窗口管理
  - 重排序与过滤

- **LangChain 与编排**
  - LangChain 组件
  - Chain 组合
  - 记忆管理
  - Agent 框架
  - 工具集成

- **生产级 LLM 系统**
  - LLM 服务 API 设计
  - 流式响应
  - 限流与配额
  - 缓存策略
  - 成本追踪

- **LLM 可观测性**
  - 提示词与响应日志记录
  - 延迟与吞吐量指标
  - 每次请求成本追踪
  - 质量监控
  - 用户反馈闭环

- **微调基础设施**
  - LoRA 与 QLoRA
  - 微调流水线
  - 评估框架
  - 模型版本管理
  - 部署策略

#### 关键技术
- vLLM
- Weaviate
- LangChain
- Hugging Face Transformers
- FastAPI
- CUDA 与 TensorRT-LLM

#### 所含材料
- 全面的讲义（5,200+ 行）
- 14 个动手练习及答案
- 8 个实践实验
- 2 项评估
- 生产级 LLM 部署模板

#### 评估
- **测验**：45 道 LLM 基础设施题
- **实践考试**：部署生产级 RAG 系统
- **通过分数**：80%

#### 时间投入
- 讲义：18 小时
- 练习：22 小时
- 实验：12 小时
- 评估：3 小时

---

## 实践项目 {#projects}

### 项目 01：基础模型服务系统 {#project-101-basic-model-serving-system}
**状态**：✅ 完成 | **时长**：60 小时 | **文件**：约 30

#### 概览
从零构建完整的模型服务系统。本项目整合模块 1–5 的概念，创建具有监控、日志和基本 MLOps 实践的生产级 ML 服务。

#### 项目目标
- 将机器学习模型部署为 REST API
- 实现监控与日志
- 将应用容器化
- 部署到 Kubernetes
- 实现基础 CI/CD

#### 学习成果
完成本项目后，你将能够：
- ✅ 使用 FastAPI 为 ML 模型构建 REST API
- ✅ 使用 Docker 将 ML 应用容器化
- ✅ 将应用部署到 Kubernetes
- ✅ 实现 Prometheus 监控
- ✅ 创建 Grafana 仪表盘
- ✅ 编写全面测试
- ✅ 搭建 GitHub Actions CI/CD

#### 项目结构
```
project-101-model-serving/
├── src/                       # Application code
│   ├── api/                  # FastAPI endpoints
│   ├── models/               # ML model handling
│   ├── monitoring/           # Metrics collection
│   └── utils/                # Helper functions
├── tests/                     # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── kubernetes/                # K8s manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── monitoring/
├── monitoring/                # Prometheus & Grafana
│   ├── prometheus/
│   └── grafana/
├── docker/                    # Docker configurations
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/workflows/         # CI/CD pipelines
└── docs/                      # Documentation
```

#### 关键功能
- **模型 API**：用于推理的 RESTful 端点
- **健康检查**：存活与就绪探针
- **监控**：自定义 Prometheus 指标
- **仪表盘**：预构建 Grafana 仪表盘
- **自动扩缩容**：HPA 配置
- **测试**：90% 以上的代码覆盖率
- **文档**：使用 Swagger 生成 API 文档

#### 所用技术
- Python 3.11, FastAPI
- Scikit-learn（示例模型）
- Docker 与 Docker Compose
- Kubernetes
- Prometheus 与 Grafana
- GitHub Actions
- pytest

#### 评估标准
- 代码质量与组织结构
- 测试覆盖率（至少 80%）
- 文档完整性
- 监控实现
- Kubernetes 最佳实践
- 安全考量

#### 时间分配
- 搭建与规划：8 小时
- 核心实现：25 小时
- 测试：12 小时
- Kubernetes 部署：10 小时
- 文档：5 小时

---

### 项目 02：MLOps 流水线 {#project-102-mlops-pipeline}
**状态**：✅ 完成 | **时长**：70 小时 | **文件**：30

#### 概览
构建包含实验追踪、模型注册中心、自动训练与部署的端到端 MLOps 流水线。本项目整合模块 1–8 的概念。

#### 项目目标
- 实现完整的 ML 生命周期管理
- 使用 Airflow 构建数据处理流水线
- 使用 MLflow 追踪实验
- 自动化模型训练与部署
- 监控生产环境模型性能
- 实现持续训练

#### 学习成果
完成本项目后，你将能够：
- ✅ 设计和实现 MLOps 工作流
- ✅ 使用 Apache Airflow 构建数据流水线
- ✅ 使用 MLflow 追踪实验
- ✅ 实现模型注册中心模式
- ✅ 部署支持自动回滚的模型
- ✅ 监控数据与模型漂移
- ✅ 对模型实施 A/B 测试
- ✅ 构建重新训练流水线

#### 项目结构
```
project-102-mlops-pipeline/
├── src/
│   ├── data/                 # Data processing
│   ├── training/             # Training pipeline
│   ├── serving/              # Model serving
│   ├── monitoring/           # Monitoring system
│   └── orchestration/        # Workflow orchestration
├── airflow/
│   ├── dags/                 # Airflow DAGs
│   ├── plugins/
│   └── config/
├── mlflow/                    # MLflow configuration
│   ├── models/
│   └── artifacts/
├── kubernetes/                # K8s deployments
│   ├── airflow/
│   ├── mlflow/
│   └── serving/
├── monitoring/
│   ├── drift-detection/
│   ├── performance/
│   └── dashboards/
├── tests/
│   ├── data/
│   ├── model/
│   └── pipeline/
└── docs/
```

#### 关键功能
- **数据流水线**：使用 Airflow 实现自动化 ETL
- **实验追踪**：MLflow 实验
- **模型注册中心**：集中式模型管理
- **自动训练**：定时训练作业
- **模型验证**：自动质量门禁
- **A/B 测试**：在模型之间分配流量
- **漂移检测**：数据与模型漂移监控
- **重新训练**：触发式及定时重新训练

#### 所用技术
- Apache Airflow 2.7+
- MLflow
- PostgreSQL（元数据存储）
- S3（产物存储）
- Kubernetes
- Prometheus 与 Grafana
- Great Expectations
- Feast（特征存储）

#### 流水线工作流
1. **数据摄取**：每日批处理
2. **特征工程**：转换并存储特征
3. **模型训练**：自动化训练与实验追踪
4. **模型验证**：质量与性能检查
5. **模型部署**：具有监控的分阶段发布
6. **性能监控**：持续评估
7. **重新训练**：检测到漂移时触发

#### 评估标准
- 流水线可靠性与错误处理
- 实验追踪实现
- 模型验证策略
- 监控全面性
- 文档质量
- 代码组织与测试

#### 时间分配
- 架构与设计：10 小时
- 数据流水线：15 小时
- 训练流水线：15 小时
- 服务与部署：12 小时
- 监控：10 小时
- 测试：8 小时

---

### 项目 103：生产级 LLM 部署 {#project-103-production-llm-deployment}
**状态**：✅ 完成 | **时长**：80 小时 | **文件**：47

#### 概览
部署具有 RAG 能力、向量检索和全面可观测性的生产级大语言模型系统。本综合项目整合全部 10 个模块。

#### 项目目标
- 为生产推理部署 LLM
- 使用向量数据库实现 RAG
- 构建可扩展的 LLM 基础设施
- 优化成本与性能
- 实现全面监控
- 以代码供应基础设施

#### 学习成果
完成本项目后，你将能够：
- ✅ 使用 vLLM 部署 LLM 以实现高效服务
- ✅ 使用 Weaviate 构建 RAG 系统
- ✅ 实现语义搜索与检索
- ✅ 优化 LLM 推理性能
- ✅ 构建多模型 AI 系统
- ✅ 实现 LLM 专用监控
- ✅ 使用 Terraform 管理基础设施
- ✅ 在支持 GPU 的 Kubernetes 上部署

#### 项目结构
```
project-103-llm-deployment/
├── src/
│   ├── api/                  # FastAPI LLM service
│   ├── llm/                  # LLM inference
│   ├── rag/                  # RAG implementation
│   ├── vectordb/             # Vector database
│   ├── monitoring/           # Observability
│   └── utils/
├── terraform/                 # Infrastructure as Code
│   ├── aws/
│   ├── gcp/
│   └── modules/
├── kubernetes/
│   ├── base/                 # Base manifests
│   ├── overlays/             # Environment overlays
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   ├── llm-deployment/       # LLM serving
│   ├── vectordb/             # Weaviate
│   └── monitoring/
├── docker/
│   ├── llm-service/
│   ├── rag-service/
│   └── ingestion/
├── data/
│   ├── documents/            # Source documents
│   ├── embeddings/           # Generated embeddings
│   └── scripts/              # Data processing
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   │   └── dashboards/       # LLM dashboards
│   └── alerts/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── performance/
├── scripts/
│   ├── deploy.sh
│   ├── scale.sh
│   └── benchmark.sh
└── docs/
    ├── architecture/
    ├── api/
    ├── deployment/
    └── troubleshooting/
```

#### 关键功能

**LLM 服务**
- 使用 vLLM 实现高效推理
- 多 GPU 支持
- 动态批处理
- 流式响应
- 模型量化

**RAG 系统**
- 文档摄取流水线
- 语义切片
- 向量嵌入（sentence-transformers）
- 混合检索（向量 + 关键词）
- 上下文窗口优化
- 重排序

**向量数据库**
- Weaviate 部署
- Schema 设计
- 索引优化
- 备份与恢复
- 多租户

**基础设施**
- 使用 Terraform 管理云资源
- 带 GPU 节点的 Kubernetes
- 基于负载的自动扩缩容
- 成本优化
- 多环境支持

**监控与可观测性**
- 请求/响应日志
- 延迟与吞吐量指标
- 每次请求成本追踪
- GPU 利用率监控
- 质量指标（相关性、连贯性）
- 异常告警

**API 设计**
- RESTful 端点
- SSE 流式响应
- 身份验证与授权
- 限流
- API 版本管理

#### 所用技术
- **LLM**: vLLM, Hugging Face Transformers
- **向量数据库**：Weaviate
- **编排**：LangChain
- **基础设施**：Terraform、Kubernetes
- **监控**：Prometheus、Grafana、Jaeger
- **云平台**：AWS（EKS、EC2 GPU 实例）
- **存储**：S3、EBS
- **API**: FastAPI, Uvicorn
- **测试**：pytest、locust

#### 系统架构

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│   Load Balancer/Ingress    │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │  API Gateway │
    └──────┬───────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌─────────┐   ┌─────────┐
│   LLM   │   │   RAG   │
│ Service │   │ Service │
└────┬────┘   └────┬────┘
     │             │
     │             ▼
     │      ┌────────────┐
     │      │  Weaviate  │
     │      │  Vector DB │
     │      └────────────┘
     │
     ▼
┌─────────────────────┐
│  vLLM Inference     │
│  (GPU-accelerated)  │
└─────────────────────┘
```

#### 部署场景

**开发环境**
- 单 GPU 实例
- 本地 Weaviate
- 最少副本数
- 调试级日志

**预发布环境**
- 2 个 GPU 实例
- 托管 Weaviate
- 启用自动扩缩容
- 性能测试

**生产环境**
- 4 个以上 GPU 实例
- 高可用 Weaviate
- 积极的自动扩缩容策略
- 全面监控
- 多区域部署（可选）

#### 性能目标
- **延迟**：RAG 查询 p95 < 2 秒
- **吞吐量**：100+ 请求/秒
- **可用性**：99.9% 正常运行时间
- **成本**：每 1K Token < 0.10 美元
- **GPU 利用率**：> 70%

#### 评估标准
- 系统架构与设计
- LLM 推理优化
- RAG 实现质量
- 基础设施即代码最佳实践
- 监控与可观测性
- 性能与成本优化
- 文档完整性
- 测试覆盖率与质量
- 安全实现

#### 时间分配
- 架构与规划：12 小时
- LLM 服务实现：18 小时
- RAG 系统实现：15 小时
- 向量数据库搭建：8 小时
- 基础设施供应：12 小时
- 监控实现：8 小时
- 测试与优化：5 小时
- 文档：2 小时

#### 附加挑战
- 实现微调流水线
- 添加多模型路由
- 构建提示词缓存系统
- 实现成本追踪仪表盘
- 添加自动化评估流水线
- 部署到多个云供应商

---

## 评估策略 {#assessment-strategy}

### 理念
评估旨在验证理论知识与实践技能。每个模块和项目均包含多种评估类型，以确保全面理解。

### 评估类型

#### 1. 模块测验
- **形式**：单选题、多选题、判断题
- **题量**：每模块 30–50 道
- **时长**：45–60 分钟
- **通过分数**：80%
- **重考**：不限次数，间隔 24 小时
- **目的**：验证概念理解

#### 2. 实践考试
- **形式**：动手编程挑战
- **时长**：2–4 小时
- **通过标准**：满足全部要求并达到代码质量标准
- **提交方式**：GitHub 仓库
- **审核**：自动化测试与人工审核
- **目的**：验证实践技能

#### 3. 项目评估
- **形式**：完整的项目实现
- **时长**：2–4 周内投入 60–80 小时
- **评估标准**：
  - 功能（40%）
  - 代码质量（20%）
  - 测试（15%）
  - 文档（15%）
  - 最佳实践（10%）
- **提交方式**：GitHub 仓库与演示视频
- **目的**：验证端到端能力

#### 4. 代码评审
- **形式**：同伴与讲师评审
- **重点**：代码质量、最佳实践、设计模式
- **频率**：所有项目
- **目的**：促进专业能力发展

### 评分细则

#### 代码质量（20%）
- 代码整洁、易读
- 风格一致（PEP 8）
- 有意义的变量命名
- 恰当的文档
- 无代码坏味道

#### 功能（40%）
- 满足全部要求
- 处理边界情况
- 错误处理
- 性能达到可接受水平
- 安全考量

#### 测试（15%）
- 单元测试覆盖率 > 80%
- 包含集成测试
- 关键路径具有端到端测试
- 测试质量与断言
- CI/CD 集成

#### 文档（15%）
- README 完整性
- API 文档
- 架构图
- 安装配置说明
- 故障排查指南

#### 最佳实践（10%）
- 设计模式
- 安全实践
- 性能优化
- 监控实现
- 生产就绪程度

### 认证路径

#### 第一级：模块完成徽章
- 每完成一个模块即可获得一个徽章
- 要求：通过测验与实践考试
- 认可形式：可分享到 LinkedIn 的徽章

#### 第二级：项目证书
- 每完成一个项目获得一份证书
- 要求：通过全部评估标准
- 认可形式：专业证书

#### 第三级：课程完成
- **AI 基础设施工程师证书**
- 要求：
  - 完成全部 10 个模块
  - 完成全部 3 个项目
  - 全部评估的平均分至少达到 80%
- 认可形式：经验证的证书与作品集

### 作品集建设
在整个课程学习过程中，你将建立包括以下内容的作品集：
- 10 个以上动手练习
- 3 个完整的生产级项目
- 公开 GitHub 仓库
- 技术博客文章（可选）
- 演示视频

---

## 时间投入 {#time-commitment}

### 总时长
**预计总时长**：500+ 小时（业余学习 6–12 个月）

### 按模块划分
| 模块 | 讲义 | 练习 | 实验 | 评估 | 总计 |
|--------|----------|-----------|------|------------|-------|
| 01：基础知识 | 12h | 15h | 8h | 5h | **40h** |
| 02：云计算 | 15h | 18h | 8h | 4h | **45h** |
| 03：容器化 | 16h | 20h | 10h | 4h | **50h** |
| 04：Kubernetes | 20h | 25h | 12h | 3h | **60h** |
| 05：数据流水线 | 18h | 20h | 10h | 2h | **50h** |
| 06：MLOps | 18h | 22h | 12h | 3h | **55h** |
| 07：GPU 计算 | 16h | 20h | 12h | 2h | **50h** |
| 08：监控 | 15h | 18h | 10h | 2h | **45h** |
| 09：基础设施即代码 | 16h | 20h | 12h | 2h | **50h** |
| 10：LLM 基础设施 | 18h | 22h | 12h | 3h | **55h** |
| **小计** | **164h** | **200h** | **106h** | **30h** | **500h** |

### 按项目划分
| 项目 | 规划 | 实现 | 测试 | 文档 | 总计 |
|---------|----------|----------------|---------|---------------|-------|
| 01：模型服务 | 8h | 25h | 12h | 15h | **60h** |
| 02：MLOps 流水线 | 10h | 42h | 8h | 10h | **70h** |
| 03：LLM 部署 | 12h | 53h | 5h | 10h | **80h** |
| **小计** | **30h** | **120h** | **25h** | **35h** | **210h** |

### 总计
**模块 + 项目**：500h + 210h = **710 小时**

---

## 学习计划 {#study-plans}

### 全职路线（3–4 个月）
**投入**：每周 40 小时

#### 第 1 个月
- **第 1–2 周**：模块 01–02（基础知识、云计算）
- **第 3–4 周**：模块 03–04（容器、Kubernetes）

#### 第 2 个月
- **第 5–6 周**：模块 05–06（数据、MLOps）
- **第 7–8 周**：项目 01 + 模块 07–08

#### 第 3 个月
- **第 9–10 周**：模块 09–10（IaC、LLM）
- **第 11–12 周**：项目 02

#### 第 4 个月
- **第 13–16 周**：项目 03 + 最终复习

### 兼职路线（6–9 个月）
**投入**：每周 20 小时

#### 第 1–2 个月
- 模块 01–04（每两周一个模块）
- 适量练习与实验

#### 第 3–4 个月
- 模块 05–08
- 开始项目 01

#### 第 5–6 个月
- 完成项目 01
- 模块 09–10

#### 第 7–8 个月
- 项目 02

#### 第 9 个月
- 项目 03
- 最终复习与认证

### 自定进度路线（12 个月以上）
**投入**：每周 10 小时

- **灵活安排**
- 每月完成一个模块
- 每三个月完成一个项目
- 适合在职人士
- 延长支持与访问期限

### 周末集中学习路线（9–12 个月）
**投入**：每个周末 15–20 小时

- **集中在周六和周日**
- 每月两个模块
- 利用专门安排的长周末完成项目
- 适合朝九晚五的在职人士

### 推荐每周学习安排（兼职）

**周一至周三**（6 小时）
- 每天 2 小时：视频讲义与阅读
- 专注于理解概念

**周四至周五**（6 小时）
- 每天 3 小时：动手练习
- 实践编程与实现

**周六**（4 小时）
- 实验与实践工作
- 更长的专注学习时段

**周日**（4 小时）
- 项目工作
- 复习与巩固

---

## 职业发展 {#career-progression}

### AI 基础设施工程师

#### 岗位概览
入门至中级岗位，专注于构建和维护 AI/ML 系统的基础设施。

#### 职责
- 部署和维护生产环境的 ML 模型
- 构建 ML 系统的 CI/CD 流水线
- 管理容器化应用
- 实现监控与告警
- 优化基础设施成本
- 与数据科学家和工程师协作

#### 必备技能（本课程涵盖）
- ✅ Python 编程
- ✅ Docker 与 Kubernetes
- ✅ 云平台（AWS/GCP/Azure）
- ✅ MLOps 实践
- ✅ 监控与可观测性
- ✅ 基础设施即代码

#### 薪资范围（美国，2025 年）
- **入门级**：100,000–140,000 美元
- **中级**：140,000–180,000 美元
- **高级**：180,000–250,000+ 美元

#### 主要招聘公司
- Google, Meta, Amazon, Microsoft
- OpenAI, Anthropic, Databricks
- Uber, Airbnb, Netflix
- Scale AI, Hugging Face
- 金融服务公司（Goldman Sachs、JPMorgan）

### 完成本课程后的职业路径

#### 近期发展方向
1. **高级 AI 基础设施工程师**（2–3 年经验）
   - 主导基础设施项目
   - 指导初级工程师
   - 设计系统架构
   - 推动技术决策

2. **MLOps 工程师**（替代路线）
   - 专注于 ML 生命周期
   - 模型部署自动化
   - 实验追踪
   - ML 平台开发

3. **平台工程师**（替代路线）
   - 内部 ML 平台开发
   - 开发者工具与体验
   - 自助式基础设施

#### 长期职业选择（5 年以上）

**技术路线**
- **AI 基础设施架构师**
  - 设计企业级 AI 平台
  - 多云策略
  - 技术领导力
  - 薪资：200,000–350,000+ 美元

- **Staff/Principal 工程师**
  - 公司范围的技术影响力
  - 架构与标准
  - 研究与创新
  - 薪资：250,000–500,000+ 美元

**管理路线**
- **工程经理**
  - 领导基础设施团队
  - 项目管理
  - 人才培养
  - 薪资：180,000–300,000+ 美元

- **ML 基础设施总监**
  - 战略规划
  - 组织范围的影响力
  - 预算与资源管理
  - 薪资：250,000–450,000+ 美元

### 行业趋势（2025 年）

**高需求领域**
- LLM 基础设施与优化
- 多云 ML 平台
- AI 工作负载成本优化
- 实时 ML 推理
- 边缘 AI 部署

**新兴技能**
- LLM 微调与部署
- 向量数据库优化
- AI 安全与治理
- 绿色 AI（能源效率）
- 联邦学习基础设施

---

## 学习资源 {#learning-resources}

### 本课程所含资源

#### 讲义材料
- 10 个全面模块
- 45,000+ 行讲义
- 包含示例的详细解释
- 架构图
- 代码示例

#### 动手练习
- 120+ 编程练习
- 分步解答
- 难度逐步增加
- 真实场景

#### 实践实验
- 60+ 实验环境
- 云端沙箱访问
- 预配置环境
- 故障排查指南

#### 实践项目
- 3 个完整项目
- 起始代码与代码骨架
- 架构模板
- 测试框架

#### 评估
- 400+ 道测验题
- 13 项实践考试
- 项目评分细则
- 自我评估工具

### 推荐外部资源

#### 书籍
- Chip Huyen 著 **《Designing Machine Learning Systems》（设计机器学习系统）**
- Andriy Burkov 著 **《Machine Learning Engineering》（机器学习工程）**
- Marko Luksa 著 **《Kubernetes in Action》（Kubernetes 实战）**
- Yevgeniy Brikman 著 **《Terraform: Up and Running》（Terraform 实战）**
- Google 著 **《Site Reliability Engineering》（站点可靠性工程）**

#### 在线课程（补充）
- **Fast.ai**：实用深度学习
- **DeepLearning.AI**：MLOps 专项课程
- **Linux Foundation**：Kubernetes 课程
- **A Cloud Guru**：云平台课程

#### 文档
- **Kubernetes 文档**：https://kubernetes.io/docs/
- **Terraform 注册中心**：https://registry.terraform.io/
- **MLflow 文档**：https://mlflow.org/docs/
- **vLLM 文档**：https://docs.vllm.ai/
- **Weaviate 文档**：https://weaviate.io/developers/weaviate

#### 社区
- **Kubernetes Slack**：k8s.io/community
- **MLOps Community**：mlops.community
- **r/MachineLearning**：Reddit 社区
- **Hugging Face 论坛**：discuss.huggingface.co
- **Stack Overflow**：标签 kubernetes、mlops、docker

#### 博客与通讯
- **The Batch** (DeepLearning.AI)
- **MLOps.community 博客**
- **Kubernetes 博客**
- **Hugging Face 博客**
- **AWS 机器学习博客**

#### YouTube 频道
- **TechWorld with Nana**：DevOps 与 Kubernetes
- **Yannic Kilcher**：ML 研究与 LLM
- **Weights & Biases**：MLOps 教程
- **Google Cloud Tech**：云与 AI

#### 播客
- **The TWIML AI Podcast**
- **Kubernetes Podcast**
- **Software Engineering Daily**
- **The Changelog**

---

## 获取帮助 {#getting-help}

### 支持渠道

#### GitHub Discussions
- 提出问题
- 分享解决方案
- 联系同伴
- 获取讲师反馈

#### 答疑时间
- 每周直播课程
- 与讲师问答
- 代码评审
- 职业指导

#### Discord 社区
- 实时聊天
- 学习小组
- 项目协作
- 建立人脉

#### 电子邮件支持
- 技术问题：support@ai-infra-curriculum.com
- 行政事务：admin@ai-infra-curriculum.com
- 响应时间：24–48 小时

### 故障排查资源

#### 常见问题
每个模块均包括：
- 故障排查指南
- 常见问题解答
- 已知问题与解决方案
- 调试策略

#### 代码示例
- 可运行的参考实现
- 常见模式与反模式
- 最佳实践
- 性能优化建议

### 学习小组指南

#### 寻找学习伙伴
- Discord 的 #study-groups 频道
- 根据时区匹配
- 考虑技能水平
- 项目协作

#### 学习小组最佳实践
- 定期会面
- 轮流担任组织者
- 共享资源
- 代码评审活动
- 模拟面试

---

## 后续步骤

### 开始学习

1. **检查前置知识**：确保具备必需的知识
2. **搭建环境**：遵循模块 01 的配置指南
3. **选择学习计划**：选择适合自己日程的进度
4. **加入社区**：在 Discord 与 GitHub 上建立联系
5. **开始模块 01**：开启学习之旅

### 认证路径

1. 完成全部 10 个模块
2. 通过全部模块评估
3. 完成全部 3 个项目
4. 提交作品集供评审
5. 获得 AI 基础设施工程师证书

### 就业准备

- 建立公开 GitHub 作品集
- 编写技术博客文章
- 参与开源贡献
- 在社区建立人脉
- 准备技术面试

---

## 联系与支持

**电子邮件**：support@ai-infra-curriculum.com
**网站**：https://github.com/ai-infra-curriculum
**Discord**：[加入我们的社区](#)
**答疑时间**：周三美国东部标准时间 18:00–19:00

---

## 致谢

本课程的开发基于：
- 对顶尖科技公司 500+ 条招聘信息的分析
- 对 50+ 位 AI 基础设施工程师的访谈
- 行业最佳实践与标准
- 试点计划参与者的反馈
- AI/ML 基础设施的最新趋势（2024–2025 年）

---

## 版本历史

**版本 1.0**（2025-01-15）
- 首次发布课程
- 10 个完整模块
- 3 个全面项目
- 500+ 小时的内容

---

**准备好开启 AI 基础设施工程学习之旅了吗？**
**从[模块 01：基础知识](lessons/mod-101-foundations/README.md)开始**

---

## 进度说明 {#progress-notes}

此前“✅ 100% 完成”的声明并不准确。截至 2026-05-22，本课程仍在积极开发中；以下是对照“所含材料”承诺的实际完成情况：

### 各模块练习 / 实验状态（2026-05-22 实验与练习内容更新后）

| 模块 | 承诺的练习 | 已有练习 | 承诺的实验 | 已有实验 |
|---|---|---|---|---|
| 101 基础知识 | 10 | **10 ✅** | 5 | **5 ✅** |
| 102 云计算 | 8 | **8 ✅** | 4 | **4 ✅** |
| 103 容器化 | 12 | **12 ✅** | 6 | **6 ✅** |
| 104 Kubernetes | 15 | **15 ✅** | 8 | **8 ✅** |
| 105 数据流水线 | 12 | **12 ✅** | 6 | **6 ✅** |
| 106 MLOps | 14 | **14 ✅** | 7 | **7 ✅** |
| 107 GPU | 11 | 3 | 6 | **6 ✅** |
| 108 监控 | 10 | **10 ✅** | 5 | **5 ✅** |
| 109 IaC | 13 | **13 ✅** | 7 | **7 ✅** |
| 110 LLM | 14 | **14 ✅** | 8 | **8 ✅** |

**状态更新：** 所承诺的 62 个实验均于 2026-05-22 编写为内容充实的动手实践指南（包含目标、前置条件、编号步骤、验证清单、清理操作和故障排查）。文件位于 `lessons/mod-XXX-*/labs/`。

练习仍存在缺口（119 个中已有 32 个）。这一缺口将在单独的内容更新中解决，因为每个练习都以现有练习同等的 25–50 KB 深度为目标，需要大量独立、专注的编写工作。

### 项目状态

三个项目（101、102、103）均完整且可运行，是本课程打磨得最成熟的部分。

### 现在可以做什么

即使存在练习和实验缺口，本课程仍可以作为端到端自学路线使用：

- 阅读各模块讲义（均已完整提供）。
- 完成已有练习（内容充实，每个 25–50 KB）。
- 参加各模块测验。
- 构建全部三个项目。

剩余练习和实验有助于提升完整性，但并不会阻碍核心学习成果的实现。

---

*最后更新：2026-05-22*
*课程版本：1.1.0*
*状态：🚧 正在积极开发*
