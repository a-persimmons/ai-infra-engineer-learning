# 模块 02：面向机器学习基础设施的云计算

**时长：** 50 小时
**难度：** 中级
**前置条件：** 完成模块 01

## 模块概览

本模块深入探讨面向机器学习基础设施的云计算平台。你将学习如何在 AWS、GCP 和 Azure 上设计、部署和管理机器学习系统，重点关注成本优化、可扩展性与生产环境最佳实践。

## 学习目标

完成本模块后，你将能够：

1. **比较并选择**适合机器学习工作负载的云平台。
2. 在 AWS、GCP、Azure 上**设计云原生**机器学习架构。
3. **优化**云端机器学习基础设施的成本。
4. **部署和管理**计算资源（虚拟机、容器、无服务器计算）。
5. **配置**数据集与模型的存储方案。
6. **实现网络配置**，确保机器学习系统安全且高效。
7. **使用托管机器学习服务**（SageMaker、Vertex AI、Azure ML）。
8. **制定多云与混合云策略**。

## 模块结构

### 第 01 课：面向机器学习的云架构（6 小时）
- 云架构模式
- 计算、存储、网络基础
- 机器学习特有的考虑因素
- 成本建模与估算
- 实践：设计机器学习系统架构

### 第 02 课：AWS 机器学习基础设施（7 小时）
- AWS 生态概览
- EC2、S3、EBS、VPC
- EKS（Elastic Kubernetes Service）
- 深入 SageMaker
- IAM 与安全
- 实践：在 AWS 上部署机器学习系统

### 第 03 课：面向机器学习的 Google Cloud Platform（7 小时）
- GCP 生态概览
- Compute Engine、Cloud Storage、GKE
- Vertex AI 平台
- TPU 的访问与使用
- GCP 网络
- 实践：在 GCP 上部署机器学习系统

### 第 04 课：Azure 机器学习基础设施（6 小时）
- Azure 生态概览
- Virtual Machines、Blob Storage、AKS
- Azure Machine Learning
- Azure OpenAI 集成
- 企业级功能
- 实践：在 Azure 上部署机器学习系统

### 第 05 课：面向机器学习的云存储（6 小时）
- 对象存储（S3、GCS、Blob）
- 块存储（EBS、Persistent Disks）
- 文件存储（EFS、Filestore）
- 数据湖与数据仓库
- 缓存策略
- 实践：优化数据管道

### 第 06 课：面向机器学习的云网络（6 小时）
- VPC 和子网设计
- 负载均衡器与流量管理
- 用于模型服务的 CDN
- VPN 与混合云连接
- 服务网格（Istio）
- 实践：保护多层机器学习系统

### 第 07 课：托管机器学习服务（6 小时）
- SageMaker、Vertex AI 与 Azure ML 对比
- 训练作业与端点
- 特征存储
- 模型注册与版本管理
- AutoML 能力
- 实践：比较托管服务

### 第 08 课：多云与成本优化（6 小时）
- 多云策略
- 云成本管理
- 预留实例与节省计划
- 用于训练的 Spot 实例
- 成本监控与告警
- 实践：优化云支出

## 前置条件

**必需：**
- 完成模块 01
- 基本理解云计算概念
- 熟悉命令行界面
- 至少拥有一个有效的云平台账号（免费额度）

**推荐：**
- Linux/Unix 命令行经验
- 网络基础知识
- 理解基础设施即代码

## 所需工具与账号

### 云平台账号
- **AWS**：免费额度账号（https://aws.amazon.com/free/）
- **GCP**：300 美元免费额度（https://cloud.google.com/free）
- **Azure**：200 美元免费额度（https://azure.microsoft.com/free/）

### CLI 工具
```bash
# AWS CLI
pip install awscli

# GCP SDK
# Download from: https://cloud.google.com/sdk/docs/install

# Azure CLI
pip install azure-cli

# Terraform (Infrastructure as Code)
# Download from: https://www.terraform.io/downloads
```

### 可选工具
- Pulumi（另一种 IaC 工具）
- 云成本监控工具
- 网络调试工具（traceroute、curl 等）

## 评估

### 测验
- 模块中期测验（第 04 课后）：20 题
- 最终测验（第 08 课后）：30 题

### 实践练习
- 练习 01：多云部署
- 练习 02：成本优化挑战
- 练习 03：网络架构设计

### 综合项目
**项目：** 部署一个面向生产环境的机器学习系统，要求：
- 多区域部署
- 自动扩缩容
- 每月成本低于 50 美元
- 99.9% 可用性
- 全面的监控

## 学习路线

```
Module 01 (Complete) ──► Module 02 (Current) ──► Module 03
    ↓                         ↓                      ↓
Foundations            Cloud Computing        Kubernetes
```

## 时间投入

- **讲义**：50 小时（每课 6–7 小时）
- **练习**：8–10 小时
- **测验**：2–3 小时
- **综合项目**：15–20 小时
- **总计**：约 75–85 小时

**推荐节奏：**
- 兼职学习（每周 10 小时）：7–8 周
- 全职学习（每周 40 小时）：2 周

## 云平台额度与免费层

> 译注：下列额度为原文所载信息，未核验当前政策。实际使用前应确认最新免费条件及费用。

### AWS 免费层
- t2.micro EC2 每月 **750 小时**（12 个月）
- **5 GB** S3 存储
- **15 GB** 出站带宽
- 许多其他服务的免费层

### GCP 免费层
- 90 天内 **300 美元额度**
- **e2-micro 实例**免费（长期免费层）
- **30 GB** 存储
- **1 GB** 到北美的出站流量

### Azure 免费层
- 30 天内 **200 美元额度**
- B1S VM 每月 **750 小时**（12 个月）
- **5 GB** Blob 存储
- 许多其他服务

**重要：** 设置账单告警，避免意外费用！

## 成功标准

能够完成以下任务时，你就掌握了本模块：

- [ ] 为特定云平台设计机器学习系统。
- [ ] 在 AWS、GCP、Azure 上部署并管理机器学习工作负载。
- [ ] 优化机器学习基础设施的云成本。
- [ ] 为机器学习系统配置安全网络。
- [ ] 选择适当的存储方案。
- [ ] 有效使用托管机器学习服务。
- [ ] 实施多云策略。
- [ ] 监控并排查云部署故障。

## 参考资料

### 文档
- [AWS 文档](https://docs.aws.amazon.com/)
- [GCP 文档](https://cloud.google.com/docs)
- [Azure 文档](https://docs.microsoft.com/azure/)

### 书籍
- 《Architecting for the Cloud: AWS Best Practices》
- 《Google Cloud Platform in Action》
- 《Azure for Architects》

### 在线资源
- AWS Training and Certification
- Google Cloud Skills Boost
- Microsoft Learn
- A Cloud Guru
- Linux Academy

### 社区
- AWS Community Builders
- GCP Community
- Azure Tech Community
- Reddit：r/aws、r/googlecloud、r/azure

## 下一步

完成本模块后：
1. 完成模块 02 测验，得分 ≥80%。
2. 完成综合项目。
3. 继续模块 03：深入 Kubernetes（原文如此）。
4. 或探索模块 04：监控与可观测性（原文如此）。

> 译注：实际仓库编号中，模块 103 是容器化，104 是 Kubernetes，108 是监控与可观测性。

---

**准备开始？** 从[第 01 课：面向机器学习的云架构](./01-cloud-architecture.md)开始。

**需要帮助？** 如果云计算概念不清楚，请复习[模块 101：基础](../mod-101-foundations/)。

**担心成本？** 原文称所有课程均可在免费额度范围内完成；请依据实际资源和当前计费政策核对。
