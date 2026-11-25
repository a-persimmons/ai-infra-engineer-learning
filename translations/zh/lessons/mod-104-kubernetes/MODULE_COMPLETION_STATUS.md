# 模块 04：Kubernetes 基础——完成状态

**日期：** 2025 年 10 月 15 日  
**状态：** **100% 完成**——所有讲义已创建！

---

## 已完成文件

### 已创建讲义（9/9）——100% 完成

1. **01-k8s-introduction.md**（825 行）
   - 为什么 ML 基础设施需要 Kubernetes。
   - 容器编排收益。
   - K8s 与 Docker Compose 及其他编排工具对比。
   - 何时使用 Kubernetes。
   - K8s 生态概览。
   - 实践：本地安装 minikube/kind。
   - 实践：部署第一个 ML 应用至 K8s。

2. **02-k8s-architecture.md**（939 行）
   - 控制平面组件（API Server、etcd、Scheduler、Controller Manager）。
   - 节点组件（kubelet、kube-proxy、容器运行时）。
   - 插件（DNS、仪表盘、监控）。
   - 组件间通信。
   - ML 专用架构考量。
   - 实践：探索 K8s 集群组件。

3. **03-core-resources.md**（856 行）
   - Pod：最小原子单元。
   - 多容器模式（Sidecar、Ambassador、Adapter）。
   - Init Container。
   - ReplicaSet 与 Deployment。
   - Service（ClusterIP、NodePort、LoadBalancer）。
   - ConfigMap 与 Secret。
   - 面向多租户的 Namespace。
   - Label 与 Selector。
   - 实践：使用 ConfigMap 部署 ML API。

4. **04-deployments-services.md**（848 行）
   - 高级部署策略（滚动更新、蓝绿、金丝雀）。
   - 综合健康检查配置。
   - 服务发现与负载均衡。
   - 将 ML 模型暴露为服务。
   - 健康检查（Liveness、Readiness、Startup Probe）。
   - ML 工作负载 Resource Request 与 Limit。
   - PodDisruptionBudget。
   - 实践：滚动更新部署 ML 模型。
   - 实践：金丝雀部署。

5. **05-networking-ingress.md**（1,063 行）——新增
   - Kubernetes 网络模型。
   - Service 类型（ClusterIP、NodePort、LoadBalancer）。
   - Ingress Controller（Nginx、Traefik）。
   - ML API Ingress 规则。
   - 使用 cert-manager 进行 TLS/SSL 终止。
   - 安全网络策略。
   - 限流与 CORS。
   - 使用 Ingress 进行金丝雀部署。
   - 实践：使用 Ingress 部署多模型 ML API。

6. **06-storage-persistence.md**（1,050 行）——新增
   - Volume 与 PersistentVolume。
   - PersistentVolumeClaim（PVC）。
   - 动态供应 StorageClass。
   - 访问模式（RWO、ROX、RWX、RWOP）。
   - 分布式训练 StatefulSet。
   - ML 数据集、检查点与模型存储策略。
   - 性能优化（I/O 瓶颈）。
   - 备份与灾难恢复。
   - 实践：使用持久化存储开展 ML 训练。

7. **07-helm-package-manager.md**（1,015 行）——新增
   - Helm 是什么及其对 ML 的意义。
   - 安装与使用 Helm 3。
   - Chart、Release、Repository、Values。
   - 为 ML 应用创建自定义 Helm Chart。
   - 环境专用 Values（开发/预发布/生产）。
   - Chart 依赖（子 Chart）。
   - Helm Hook 与条件资源。
   - 使用 Helm 管理密钥。
   - 发布及共享 Chart。
   - 实践：使用 Helm 部署 ML 平台。

8. **08-gpu-scheduling.md**（1,090 行）——新增
   - Kubernetes GPU 支持（Device Plugin Framework）。
   - NVIDIA GPU Operator 安装配置。
   - GPU 工作负载调度（基础与多 GPU）。
   - GPU 节点亲和性、污点与容忍。
   - GPU 共享策略（时间切片与 MIG）。
   - 使用 DCGM 监控 GPU 利用率。
   - GPU 调度最佳实践。
   - GPU 调度故障排查。
   - 实践：GPU 加速 ML 训练流水线。

9. **09-monitoring-troubleshooting.md**（1,005 行）——新增
   - kubectl 调试命令（describe、logs、exec、top）。
   - 调试 ML 训练作业与推理服务。
   - 日志策略及最佳实践。
   - 使用 Loki、Fluentd 聚合日志。
   - Prometheus 与 Grafana 指标。
   - ML 应用埋点。
   - 使用 Alertmanager 告警。
   - OpenTelemetry 分布式追踪。
   - 生产最佳实践及运行手册。
   - 实践：完整可观测性技术栈。

### 辅助文件

- **README.md**（418 行）：模块概览及结构，已完成。
- **quiz.md**（543 行）：考核测验，已完成。
- **resources.md**（360 行）：学习资源，已完成。
- **exercises/**：动手练习，已完成。

---

## 统计

### 内容指标

- **讲义总数：** 9/9（100%）。
- **内容总行数：** 约 8,700 行（仅讲义）。
- **每课平均行数：** 967 行。
- **模块文件总数：** 13 个。
- **动手练习：** 全部讲义包含 9 个以上综合练习。

### 讲义明细

- **第 01–04 课：** 3,468 行（上一次会话创建）。
- **第 05–09 课：** 5,223 行（本次会话创建）。
- **辅助文件：** 约 1,500 行。

### 覆盖率

- Kubernetes 基础：100%。
- 网络及 Ingress：100%。
- 存储与持久化：100%。
- 包管理（Helm）：100%。
- GPU 调度：100%。
- 监控与故障排查：100%。

---

## 达成的学习成果

完成模块后，学习者将能够：

### Kubernetes 核心技能

- 理解 Kubernetes 架构与组件。
- 部署及管理容器化 ML 应用。
- 配置 Service、Ingress 与网络。
- 实现 ML 工作负载持久化存储。
- 使用 Helm 打包并部署 ML 平台。

### ML 专用技能

- 高效调度 GPU 工作负载。
- 使用 StatefulSet 配置分布式训练。
- 实现数据集与模型存储策略。
- 使用 Prometheus 监控 ML 训练及推理。
- 调试常见 ML 基础设施问题。

### 生产技能

- 实现健康检查及自动扩缩容。
- 为 ML API 配置 TLS/SSL。
- 搭建日志与监控技术栈。
- 创建 ML 基础设施告警。
- 应用生产部署最佳实践。

---

## 质量标准

原文称全部讲义符合以下质量标准：

- **聚焦 ML/AI：** 每课采用 ML 专用示例，而非通用 IT。
- **生产就绪：** 来自真实公司的模式（Uber、Netflix、OpenAI、Spotify）。
- **动手实践：** 每课包含综合实践练习。
- **真实场景：** 架构图、代码示例及故障排查。
- **全面：** 每课平均 900 行以上，超过 400 行目标。
- **行业相关：** 技能可应用于 ML 基础设施岗位。

---

## 实际价值

原文认为本模块可帮助学习者准备以下公司类型的岗位：

- **大型科技公司：** Google、Meta、Amazon、Microsoft（规模化 ML Kubernetes）。
- **AI 公司：** OpenAI、Anthropic、Cohere、Hugging Face（GPU 调度、模型服务）。
- **大量使用 ML 的初创公司：** Uber、Spotify、Netflix、Airbnb（生产 ML 基础设施）。
- **企业：** 在生产部署 ML 模型的公司。

### 验证的技能

- ML 工作负载 Kubernetes 管理。
- GPU 资源管理。
- ML 模型服务与部署。
- 生产监控及可观测性。
- 使用 Helm 实现基础设施即代码。

---

## 覆盖主题（完整清单）

### 第 01 课：Kubernetes 导论
- ML 为什么使用 K8s、安装、生态、第一个部署。

### 第 02 课：Kubernetes 架构
- 控制平面、节点组件、ML 专用考量。

### 第 03 课：核心资源
- Pod、Deployment、Service、ConfigMap、Secret、Namespace。

### 第 04 课：Deployment 与 Service
- 滚动更新、金丝雀、蓝绿、健康检查、自动扩缩容。

### 第 05 课：网络与 Ingress
- K8s 网络模型、Service、Ingress、TLS、NetworkPolicy。

### 第 06 课：存储与持久化
- Volume、PVC、StorageClass、StatefulSet、ML 存储策略。

### 第 07 课：Helm 包管理器
- Chart、Release、自定义 Chart、Values、依赖、最佳实践。

### 第 08 课：GPU 调度
- GPU Operator、Device Plugin、调度、共享（MIG/时间切片）、监控。

### 第 09 课：监控与故障排查
- kubectl 调试、日志、Prometheus、Grafana、告警、分布式追踪。

---

## 模块完成检查清单

- [x] 全部 9 份核心讲义已创建。
- [x] README.md（模块概览）。
- [x] quiz.md（考核）。
- [x] resources.md（补充材料）。
- [x] exercises/（动手实验）。
- [x] 全部内容包含 ML 专用示例。
- [x] 包含生产就绪模式。
- [x] 引用真实公司案例。
- [x] 每课包含故障排查。
- [x] 每课包含实践练习。
- [x] 代码示例已测试验证（原文声明）。
- [x] 满足质量标准（每课 900 行以上，原文声明）。

---

## 状态：模块 04 完成

**完成日期：** 2025 年 10 月 15 日。

**原文当时的下一步：**
1. 模块 04（Kubernetes）：完成。
2. 模块 05（数据流水线与编排）：待完成。
3. 模块 06（MLOps 与实验追踪）：待完成。
4. 模块 07（GPU 计算与资源管理）：待完成。
5. 模块 08（监控与可观测性）：待完成。
6. 模块 09（基础设施即代码）：待完成。
7. 模块 10（LLM 基础设施基础）：待完成。

**原文当时的试点仓库进度：约 80%。**
- 模块 01–04：100%（4/10 个模块）。
- 模块 05–10：0%（剩余 6 个模块）。
- 项目 02–03：25%（已创建结构，待实现）。

---

**原文结论：模块 04 已具备供学习者使用的生产就绪内容。**

> 译注：本文为 2025 年 10 月 15 日历史进度快照，不代表当前仓库或中文翻译状态。文件行数、质量及测试声明均沿用原文，未在本次翻译中独立验证。当前测验实际路径请参见 quizzes/ 目录。
