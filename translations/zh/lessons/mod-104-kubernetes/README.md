# 模块 04：Kubernetes 基础

**时长：** 60 小时
**难度：** 中级至高级
**前置条件：** 完成模块 01、02、03。

## 模块概览

Kubernetes（K8s）是容器编排的行业标准平台。本模块全面介绍 Kubernetes 基础，重点关注机器学习工作负载的部署与管理。

你将学习在 Kubernetes 上部署机器学习模型、管理计算资源（包括 GPU）、实现自动扩缩容以及排查常见问题。完成后，你将能够熟练运营面向机器学习应用的生产 Kubernetes 集群。

## 为什么机器学习需要 Kubernetes？

### 挑战：大规模容器编排

**没有 Kubernetes：**
- 手动在 100 台机器上启动和停止容器。
- 容器崩溃后没有自动恢复。
- 手动为实例配置负载均衡。
- 服务间网络复杂。
- 手动扩缩容。
- 没有内置服务发现。

**使用 Kubernetes：**
- 声明期望状态，K8s 自动维护。
- 自愈：重启失败容器。
- 内置负载均衡与服务发现。
- 基于指标自动扩缩容。
- 滚动更新与回滚。
- 跨环境标准化部署。

### 实际影响

**示例：Netflix**
- 在 Kubernetes 上运行超过 1,000 个微服务。
- 高峰期自动从 100 个 Pod 扩容到 10,000 个。
- 自愈机制在数秒内从节点故障中恢复。

**示例：Spotify**
- 全球超过 200 个 Kubernetes 集群。
- 面向机器学习模型训练的 GPU 调度。
- 通过高效资源利用降低约 80% 成本。

> 译注：以上案例数字按原文翻译，未独立核验。

## 学习成果

完成本模块后，你将能够：

1. **理解 K8s 架构**——解释控制面、节点、Pod 与核心概念。
2. **部署应用**——将机器学习模型部署为 Kubernetes Deployment。
3. **管理资源**——使用 ConfigMap、Secret、PersistentVolume。
4. **配置网络**——设置 Service、Ingress 和负载均衡。
5. **调度 GPU 工作负载**——部署 GPU 加速的机器学习推理和训练。
6. **使用 Helm Chart**——使用 Helm 打包并部署应用。
7. **实现自动扩缩容**——配置 HPA（Horizontal Pod Autoscaler）。
8. **监控集群**——使用 kubectl 与指标建立基础监控。
9. **排查问题**——调试 Pod、Service 与网络问题。
10. **应用最佳实践**——安全、资源限制与健康检查。

## 模块结构

### 第 01 课：Kubernetes 导论（6 小时）
**文件：** `01-k8s-introduction.md`

- 什么是 Kubernetes，为什么重要
- Kubernetes、Docker Compose 与 Docker Swarm 对比
- K8s 历史与生态（CNCF）
- 何时使用 Kubernetes（以及何时不使用）
- 搭建本地集群（minikube、kind、k3s）
- **实操：**向 K8s 部署第一个应用

### 第 02 课：Kubernetes 架构（8 小时）
**文件：** `02-k8s-architecture.md`

- 控制面组件（API server、etcd、scheduler、controller manager）
- 节点组件（kubelet、kube-proxy、容器运行时）
- 插件（DNS、Dashboard、监控）
- K8s 如何做出调度决策
- 理解 API server 与 kubectl
- **实操：**探索集群组件

### 第 03 课：核心资源——Pod 与 Namespace（7 小时）
**文件：** `03-core-resources.md`

- Pod：最小可部署单元
- 多容器 Pod 与 Sidecar 模式
- Init Container
- 用于逻辑隔离的 Namespace
- 标签与选择器
- 资源请求与限制
- **实操：**部署机器学习推理 Pod

### 第 04 课：Deployment 与 Service（8 小时）
**文件：** `04-deployments-services.md`

- 使用 Deployment 管理副本
- ReplicaSet（由 Deployment 管理）
- 滚动更新与回滚
- Service：ClusterIP、NodePort、LoadBalancer
- 服务发现与 DNS
- Endpoint 与 EndpointSlice
- **实操：**部署具有负载均衡能力的可扩展机器学习 API

### 第 05 课：网络与 Ingress（7 小时）
**文件：** `05-networking-ingress.md`

- Kubernetes 网络模型
- CNI 插件（Calico、Cilium、Flannel）
- 用于安全控制的 NetworkPolicy
- Ingress 控制器（Nginx、Traefik）
- TLS 终止与 SSL 证书
- 向互联网暴露服务
- **实操：**为多个服务配置 Ingress

### 第 06 课：存储与持久化（7 小时）
**文件：** `06-storage-persistence.md`

- Volume 与 PersistentVolume（PV）
- PersistentVolumeClaim（PVC）
- 用于动态供应的 StorageClass
- 面向有状态应用的 StatefulSet
- 数据卷类型（hostPath、NFS、云存储）
- 管理模型产物与数据集
- **实操：**部署具有持久化存储的模型

### 第 07 课：配置与密钥（6 小时）
**文件：** `07-configuration-secrets.md`

- 使用 ConfigMap 管理配置数据
- 使用 Secret 管理敏感信息
- 环境变量
- 挂载配置与密钥的数据卷
- 外部密钥管理（HashiCorp Vault）
- 密钥管理最佳实践
- **实操：**使用 ConfigMap 和 Secret 配置机器学习应用

### 第 08 课：Helm 包管理器（6 小时）
**文件：** `08-helm-package-manager.md`

- 什么是 Helm，为什么使用它
- Helm Chart 结构
- 从仓库安装 Chart
- 创建自定义 Chart
- 模板与 values 文件
- 使用 Helm 部署机器学习应用
- **实操：**将机器学习应用打包为 Helm Chart

### 第 09 课：GPU 调度（5 小时）
**文件：** `09-gpu-scheduling.md`

- Kubernetes GPU Device Plugin
- 请求 GPU 资源
- GPU 共享策略
- 多 GPU Pod
- GPU 节点池
- GPU 问题排查
- **实操：**部署 GPU 加速模型

### 第 10 课：监控与可观测性（6 小时）
**文件：** `10-monitoring-observability.md`

- 用于监控的 kubectl 命令
- Metrics Server
- 资源使用监控
- 日志聚合
- 健康检查（存活、就绪与启动探针）
- K8s 的 Prometheus 基础
- **实操：**为机器学习工作负载搭建监控

## 动手活动

### 活动 1：向 Kubernetes 部署第一个机器学习模型
**时长：** 2 小时
**交付物：** 运行三个机器学习推理服务副本的 Deployment。

### 活动 2：搭建完整机器学习技术栈
**时长：** 4 小时
**交付物：** 具有网络连接的模型服务器 + Redis + PostgreSQL。

### 活动 3：实现自动扩缩容
**时长：** 2 小时
**交付物：** 基于 CPU/内存自动扩缩容 Pod 的 HPA。

### 活动 4：配置带 TLS 的 Ingress
**时长：** 3 小时
**交付物：** 机器学习 API 的公开 HTTPS 端点。

### 活动 5：部署 GPU 工作负载
**时长：** 3 小时
**交付物：** 带资源限制的 GPU 加速推理服务。

## 评估

### 测验：Kubernetes 架构与概念
**位置：** `quiz.md`
**题目：** 25 道选择题与简答题。
**通过分数：** 70%（答对 18/25）。
**主题：** 架构、资源、网络、存储、GPU 调度。

### 实践：在 Kubernetes 上部署生产级机器学习系统
**目标：** 使用最佳实践部署完整机器学习系统。

**要求：**
1. 具有三个及以上副本的 Deployment。
2. 带负载均衡的 Service。
3. 带 SSL/TLS 的 Ingress。
4. 使用 ConfigMap 存储配置。
5. 使用 Secret 存储敏感数据。
6. 使用 PersistentVolume 存储模型。
7. 定义资源限制。
8. 配置健康检查。
9. 使用 HPA 自动扩缩容。
10. 监控与日志。

**提交物：** Kubernetes 清单、README 与演示。

## 前置条件检查

开始模块 04 前：

- [ ] 完成模块 01–03。
- [ ] 充分理解 Docker 容器。
- [ ] 熟悉 YAML 语法。
- [ ] 本地已安装 kubectl。
- [ ] 具有本地 Kubernetes 集群（minikube、kind 或 Docker Desktop K8s）。
- [ ] 基本理解网络概念。
- [ ] （可选）可访问云端 Kubernetes（EKS、GKE、AKS）。

### 安装验证

```bash
# Verify kubectl installation
kubectl version --client

# Verify local cluster (if using minikube)
minikube status

# Or verify Docker Desktop K8s
kubectl cluster-info

# Verify Helm (optional, will install in lesson)
helm version
```

## 涵盖的核心概念

### Kubernetes 架构
- 控制面与工作节点
- API server 作为核心组件
- 使用 etcd 存储集群状态
- Scheduler 与 Controller Manager 的职责

### 核心工作负载资源
- Pod、ReplicaSet、Deployment
- 面向有状态应用的 StatefulSet
- 面向节点级服务的 DaemonSet
- Job 与 CronJob

### 网络
- Service（ClusterIP、NodePort、LoadBalancer）
- 用于 HTTP 路由的 Ingress
- 用于安全控制的 NetworkPolicy
- DNS 与服务发现

### 存储
- Volume、PersistentVolume、PersistentVolumeClaim
- StorageClass 与动态供应
- 用于数据持久化的 StatefulSet

### 配置
- ConfigMap 与 Secret
- 环境变量
- 数据卷挂载

### 进阶主题
- GPU 调度与 Device Plugin
- 使用 Helm 进行包管理
- 自动扩缩容（HPA、VPA）
- 监控与可观测性

## 工具与技术

### 必需
- **kubectl**——Kubernetes 命令行工具。
- **本地 Kubernetes 集群**——minikube、kind 或 Docker Desktop。
- **Docker**——构建容器镜像。

### 推荐
- **Helm**——Kubernetes 包管理器。
- **k9s**——基于终端的 Kubernetes 界面。
- **kubectx/kubens**——切换 Context 与 Namespace。
- **stern**——同时追踪多个 Pod 的日志。

### 可选
- **Lens**——Kubernetes IDE（图形界面）。
- **Octant**——基于 Web 的 K8s 仪表盘。
- **Prometheus**——监控（本课程涵盖基础）。

## 常见陷阱与解决方案

### 陷阱 1：Pod 无法启动
**症状：** CrashLoopBackOff、ImagePullBackOff、Pending 状态。
**方案：** 通过 `kubectl logs` 检查日志，使用 `kubectl describe pod` 检查 Pod。

### 陷阱 2：Service 无法访问
**症状：** 无法连接服务。
**方案：** 验证 Service 选择器与 Pod 标签匹配，检查 Endpoint。

### 陷阱 3：资源不足
**症状：** Pod 一直处于 Pending 状态。
**方案：** 通过 `kubectl top nodes` 检查节点资源，调整资源请求。

### 陷阱 4：配置问题
**症状：** 应用报错、缺少环境变量。
**方案：** 验证 ConfigMap 和 Secret 已正确创建并挂载。

### 陷阱 5：未检测到 GPU
**症状：** Pod 内出现 CUDA 错误。
**方案：** 确保已安装 GPU Device Plugin，验证节点标签，检查资源请求。

## 真实场景应用

### 场景 1：可扩展模型服务
**挑战：** 提供处理可变流量（每分钟 1,000 至 100,000 次请求）的机器学习模型服务。
**方案：** 配置带 HPA 的 K8s Deployment，按需求自动扩缩容 Pod。
**收益：** 降低成本并自动处理流量峰值。

### 场景 2：多模型平台
**挑战：** 提供 50 个具有不同资源需求的模型服务。
**方案：** 每个模型使用独立 Deployment，由 K8s 高效调度。
**收益：** 资源隔离、独立扩缩容。

### 场景 3：训练任务编排
**挑战：** 高效运行数百个训练实验。
**方案：** 使用 Kubernetes Job 执行训练并进行 GPU 调度。
**收益：** 高效利用 GPU，失败时自动重试。

### 场景 4：机器学习模型 CI/CD
**挑战：** 自动化模型测试与部署。
**方案：** 使用 K8s GitOps、滚动更新与自动回滚机制。
**收益：** 安全部署、便捷回滚、审计记录。

## 成功标准

能够完成以下任务时，你就掌握了模块 04：

- [ ] 解释 Kubernetes 架构及核心组件。
- [ ] 使用 Deployment 和 Service 部署应用。
- [ ] 使用 Service 与 Ingress 配置网络。
- [ ] 使用 ConfigMap 与 Secret 管理配置。
- [ ] 使用 PV 与 PVC 搭建持久化存储。
- [ ] 使用 Helm 打包并部署应用。
- [ ] 高效调度 GPU 工作负载。
- [ ] 使用 HPA 实现自动扩缩容。
- [ ] 监控并排查 K8s 应用。
- [ ] 应用安全与资源管理最佳实践。

## 时间估算

| 组成 | 预计时间 |
|---|---|
| 讲义（10 节） | 60 小时 |
| 练习（5 项） | 14–18 小时 |
| 测验 | 1–2 小时 |
| 实践评估 | 6–8 小时 |
| **总计** | **81–88 小时** |

**推荐节奏：**
- 兼职学习（每周 10 小时）：8–9 周。
- 全职学习（每周 40 小时）：2 周。

## 参考资料

**官方文档：**
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes API 参考](https://kubernetes.io/docs/reference/)
- [Helm 文档](https://helm.sh/docs/)

**其他资料：**
参见 `resources.md` 中的完整清单：
- 书籍与课程
- 视频教程
- 交互式实验
- 社区论坛
- 最佳实践指南

## 下一步

完成模块 04 后：

1. **完成测验**，得分 ≥70%。
2. **完成实践评估**——部署生产级机器学习系统。
3. **选择你的路线：**
   - **模块 05：数据管道与编排**——Airflow、数据工作流。
   - **模块 06：MLOps 与实验追踪**——MLflow、模型注册。
   - **进阶：Kubernetes Operator**——构建自定义控制器。

## 学习建议

1. **先使用本地集群实践**——在使用云集群前熟悉操作。
2. **掌握 kubectl**——深入学习命令行工具。
3. **使用 `kubectl explain`**——查看资源的内置文档。
4. **阅读官方文档**——Kubernetes 文档质量很高。
5. **从简单开始，逐步增加复杂度**——不要试图一次学完所有内容。
6. **有效使用标签**——这是组织资源的关键。
7. **系统化排查**——日志 → describe → 事件 → debug。
8. **学好 YAML**——你将编写大量 YAML。
9. **进行实验并主动破坏系统**——本地集群就是用来学习的。
10. **加入 K8s 社区**——向有经验的实践者学习。

---

**准备好进行大规模编排了吗？** 从[第 01 课：Kubernetes 导论](./01-k8s-introduction.md)开始。

**需要安装 Kubernetes？** 查看[安装指南](https://kubernetes.io/docs/tasks/tools/)。

**有问题？** 在 GitHub 仓库中创建 Issue 或 Discussion。
