# 模块 09：基础设施即代码（IaC）

## 模块概览

基础设施即代码（Infrastructure as Code，IaC）是现代 DevOps 与 AI 基础设施管理的基础实践。本模块教授如何使用代码定义、部署和管理基础设施，为 AI/ML 工作负载实现版本控制、自动化、可复现性与协作。

## 为什么对 AI 基础设施重要

手动管理 AI 基础设施容易出错、速度慢，且难以扩展。IaC 使你能够实现：

- **可复现性**：部署一致的开发、预发布和生产环境。
- **版本控制**：与应用代码一起在 Git 中追踪基础设施变更。
- **自动化**：将基础设施供应纳入 CI/CD 流水线。
- **协作**：团队可以审查并批准基础设施变更。
- **灾难恢复**：在几分钟内依据代码重建整个基础设施。
- **成本管理**：轻松启动或关闭昂贵的 GPU 集群。
- **多云**：使用通用模式在 AWS、GCP、Azure 上部署 AI 工作负载。

## 学习目标

完成本模块后，你将能够：

1. **理解 IaC 原则**及其对 AI 基础设施的益处。
2. **使用 Terraform** 为机器学习工作负载创建云资源。
3. 安全地**管理基础设施状态**并开展团队协作。
4. **应用 Pulumi** 实现基于 Python 的基础设施管理。
5. **实现 GitOps 工作流**来管理基础设施变更。
6. **设计模块化、可复用的基础设施**组件。
7. 保护 IaC 中的**敏感数据**（凭据、API Key）。
8. **实现 CI/CD 流水线**用于基础设施部署。
9. **应用最佳实践**实现大规模 IaC。

## 前置条件

- **模块 02**：云计算基础（AWS/GCP/Azure 基础）
- **模块 03**：使用 Docker 进行容器化
- **模块 04**：Kubernetes 基础
- 基本理解云服务（虚拟机、存储、网络）
- 熟悉命令行工具
- Git 基础

## 模块结构

本模块包含 **8 节综合讲义**：

### 第 01 课：基础设施即代码导论
- 什么是 IaC，为什么重要
- IaC 与手动基础设施管理对比
- 声明式与命令式方法
- IaC 工具生态（Terraform、Pulumi、CloudFormation、Ansible）
- AI/ML 基础设施的特殊考虑因素

### 第 02 课：Terraform 基础
- 安装与配置 Terraform
- HCL（HashiCorp Configuration Language）语法
- Provider、Resource、Data Source
- Variable、Output、Local
- Terraform CLI 命令（init、plan、apply、destroy）
- 第一个 Terraform 项目

### 第 03 课：Terraform 状态管理
- 理解 Terraform 状态
- 本地与远程状态后端
- 状态锁与协作
- S3 + DynamoDB 后端配置
- 状态检查与操作
- 使用 Workspace 管理环境

### 第 04 课：使用 Terraform 构建 AI 基础设施
- 创建 GPU 实例（AWS p3、GCP A100）
- 搭建 Kubernetes 集群（EKS、GKE、AKS）
- 为数据集创建存储（S3、GCS、Azure Blob）
- 网络与安全组
- IAM 角色与权限
- 完整机器学习平台示例

### 第 05 课：Pulumi——基础设施即软件
- Pulumi 导论
- 基于 Python 的基础设施代码
- Pulumi 与 Terraform 比较
- 使用 Pulumi 部署机器学习基础设施
- 使用循环、条件与 Python 库
- Pulumi Stack 与配置

### 第 06 课：高级 IaC 模式
- 模块与代码复用
- 多环境策略（dev/staging/prod）
- 多云部署
- 使用外部数据实现动态配置
- 条件资源
- for_each 与 count 模式

### 第 07 课：GitOps 与 IaC CI/CD
- 面向基础设施的 GitOps 原则
- 基础设施变更的 Pull Request 工作流
- IaC 自动化测试（terraform validate、plan）
- 使用 GitHub Actions 实现 CI/CD 流水线
- 使用 Atlantis 自动化 Terraform
- 策略即代码（Sentinel、OPA）

### 第 08 课：安全与最佳实践
- 密钥管理（AWS Secrets Manager、HashiCorp Vault）
- 防止凭据泄露
- 基础设施安全扫描（tfsec、Checkov）
- 成本估算与优化
- 标签策略
- 文档与团队协作
- 灾难恢复流程

## 动手练习

本模块在 `exercises/` 目录包含实践练习：

1. **练习 01**：使用 Terraform 部署简单 EC2 实例。
2. **练习 02**：为机器学习数据集创建启用版本管理的 S3 存储桶。
3. **练习 03**：为机器学习工作负载创建 GKE 集群。
4. **练习 04**：构建可复用的 Terraform 模块。
5. **练习 05**：使用 S3 后端配置远程状态。
6. **练习 06**：使用 Pulumi（Python）部署机器学习基础设施。
7. **练习 07**：使用 GitHub Actions 创建 GitOps 工作流。
8. **练习 08**：使用 AWS Secrets Manager 实现密钥管理。

**每个练习预计耗时**：1–2 小时。
**动手总时间**：8–16 小时。

## 评估

- **测验**：覆盖所有讲义的 25 道题。
- **实践考试**：设计并部署完整的机器学习基础设施：
  - 用于训练的 GPU 实例。
  - 用于推理的 Kubernetes 集群。
  - 存储数据与模型的 S3 存储桶。
  - 监控与日志配置。
  - 全部使用 Terraform 与远程状态管理。

## 工具与技术

### 主要工具
- **Terraform**（v1.5+）—— HashiCorp 的 IaC 工具。
- **Pulumi**（Python SDK）—— 使用真实编程语言的现代 IaC。
- **AWS CLI** / **gcloud** / **az** —— 云服务提供商的 CLI。

### 辅助工具
- **tfenv** —— Terraform 版本管理器。
- **tflint** —— Terraform 静态检查工具。
- **tfsec** —— Terraform 安全扫描工具。
- **Checkov** —— 策略即代码扫描工具。
- **terraform-docs** —— 根据 Terraform 模块生成文档。
- **Atlantis** —— Terraform Pull Request 自动化。

### 云服务提供商
- AWS（主要示例）
- Google Cloud Platform
- Microsoft Azure

## 预计时间

- **阅读与理解**：18–22 小时
- **动手练习**：12–16 小时
- **测验与评估**：2–3 小时
- **总计**：32–41 小时

## 参考资料

参见 `resources.md`：

- Terraform 与 Pulumi 官方文档
- 最佳实践指南
- Terraform Registry 模块
- 视频教程与课程
- 社区资源
- 认证信息

## 学习路线

**本模块建立在以下模块之上：**
- 模块 02：云计算基础
- 模块 03：容器化
- 模块 04：Kubernetes

**本模块为以下内容做准备：**
- 模块 10：LLM 基础设施（使用 IaC 部署 LLM 基础设施）
- 项目 02：MLOps 流水线（基础设施自动化）
- 项目 03：LLM 部署（可扩展的 LLM 基础设施）

## 真实场景应用

完成本模块后，你将能够：

- 按需创建完整的机器学习训练环境。
- 部署用于模型服务的 Kubernetes 集群。
- 管理多环境机器学习基础设施（dev/staging/prod）。
- 为关键机器学习系统实施灾难恢复。
- 与团队协作完成基础设施变更。
- 通过自动化降低基础设施成本。
- 使用可审计的基础设施满足合规要求。

## 快速开始

从**第 01 课：基础设施即代码导论**开始理解基础概念，然后按顺序学习各课。

---

**模块难度**：中级
**推荐背景**：云计算基础、命令行经验
**学习成果**：面向生产级 AI 基础设施的 IaC 技能。

开始使用代码构建基础设施吧！
