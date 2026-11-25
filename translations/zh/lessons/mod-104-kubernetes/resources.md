# 模块 04 资源：Kubernetes 基础

## 官方文档

### Kubernetes 核心
- [Kubernetes 文档](https://kubernetes.io/docs/) — 完整官方文档
- [Kubernetes 概念](https://kubernetes.io/docs/concepts/) — 架构与基础
- [kubectl 参考](https://kubernetes.io/docs/reference/kubectl/) — 命令行工具文档
- [Kubernetes API 参考](https://kubernetes.io/docs/reference/kubernetes-api/) — 完整 API 文档
- [kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/) — 常用命令

### Helm
- [Helm 文档](https://helm.sh/docs/) — Kubernetes 包管理器
- [Helm Charts 仓库](https://artifacthub.io/) — 公共 Helm Charts
- [Helm 最佳实践](https://helm.sh/docs/chart_best_practices/) — Chart 开发指南

### GPU 支持
- [Kubernetes 设备插件](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/)
- [NVIDIA GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/getting-started.html)
- [Kubernetes GPU 调度](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)

---

## 书籍

### Kubernetes 基础
1. **《Kubernetes in Action》** — Marko Luksa
   - 全面的 K8s 入门。
   - 全书贯穿动手示例。
   - 适合初级至中级学习者。
2. **《Kubernetes: Up and Running》** — Brendan Burns、Joe Beda、Kelsey Hightower
   - 由 K8s 创建者撰写。
   - 运行应用的实践指南。
   - 来自 Google 工程师的最佳实践。
3. **《The Kubernetes Book》** — Nigel Poulton
   - 清晰简练的解释。
   - 适合快速学习。
   - 定期更新。

### 高级 Kubernetes
4. **《Production Kubernetes》** — Josh Rosso、Rich Lander、Alex Brand、John Harris
   - 构建生产级集群。
   - 安全、网络、监控。
   - 真实场景。
5. **《Programming Kubernetes》** — Michael Hausenblas、Stefan Schimanski
   - 使用自定义资源扩展 Kubernetes。
   - 构建 Operator。
   - 适合高级用户。

### Kubernetes 上的 ML
6. **《Kubeflow for Machine Learning》** — Trevor Grant 等
   - Kubernetes 上的 ML 工作流。
   - 深入 Kubeflow 平台。
   - 端到端 ML 流水线。

---

## 在线课程

### Kubernetes 基础
- **[Kubernetes 初学者课程](https://www.youtube.com/watch?v=X48VuDVv0do)**（freeCodeCamp、YouTube、免费）
  - 4 小时全面入门。
  - 动手演示。
  - 良好的起点。
- **[CKAD 认证课程](https://www.udemy.com/course/certified-kubernetes-application-developer/)**（Udemy）
  - Mumshad Mannambeth 的热门课程。
  - 动手实验。
  - 认证准备。
- **[Kubernetes 入门](https://www.pluralsight.com/courses/kubernetes-getting-started)**（Pluralsight，订阅）
  - Nigel Poulton 的课程。
  - 清晰的解释。
  - 实践示例。

### 高级 Kubernetes
- **[Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)**（免费，GitHub）
  - Kelsey Hightower 编写。
  - 手动搭建 K8s 集群。
  - 深入理解各组件。
- **[GCP 上的高级 Kubernetes](https://www.coursera.org/learn/advanced-kubernetes-on-gcp)**（Coursera）
  - GKE 高级概念。
  - 安全、网络、监控。
  - Google Cloud 官方培训。

### Kubernetes 上的 ML
- **[Machine Learning with Kubeflow](https://www.linkedin.com/learning/machine-learning-with-kubeflow)**（LinkedIn Learning）
  - Kubeflow 平台。
  - K8s 上的 ML 工作流。
  - 动手项目。

---

## 教程与指南

### 交互式学习
- **[Play with Kubernetes](https://labs.play-with-k8s.com/)** — 免费浏览器 K8s 实验环境。
- **[Katacoda Kubernetes 场景](https://www.katacoda.com/courses/kubernetes)** — 交互式教程（原文资源）。
- **[Kubernetes by Example](https://kubernetesbyexample.com/)** — 动手示例。

### 博客与文章

#### Kubernetes 基础
- [理解 Kubernetes 对象](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)
- [Kubernetes 初学者指南](https://www.cncf.io/blog/2019/08/19/how-kubernetes-became-the-solution-for-migrating-legacy-applications/)
- [Kubernetes 网络详解](https://sookocheff.com/post/kubernetes/understanding-kubernetes-networking-model/)

#### 最佳实践
- [Kubernetes 最佳实践（Google）](https://cloud.google.com/blog/products/containers-kubernetes/your-guide-kubernetes-best-practices)
- [生产最佳实践](https://learnk8s.io/production-best-practices)
- [资源请求与限制](https://sysdig.com/blog/kubernetes-limits-requests/)

#### Kubernetes 上的 ML
- [在 Kubernetes 上部署 ML 模型](https://towardsdatascience.com/deploying-machine-learning-models-on-kubernetes-a-complete-guide-8d5b5e8d8e62)
- [K8s GPU 调度](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)
- [使用 Kubernetes 实现 MLOps](https://www.infoq.com/articles/mlops-kubernetes/)

---

## 工具与软件

### Kubernetes 发行版

#### 本地开发
- **[minikube](https://minikube.sigs.k8s.io/)** — 本地 K8s 集群（原文称最流行）。
- **[kind](https://kind.sigs.k8s.io/)** — Docker 中的 Kubernetes（快速、轻量）。
- **[k3s](https://k3s.io/)** — 轻量 K8s，适合边缘/IoT。
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — 内置 K8s 集群（配置简单）。
- **[MicroK8s](https://microk8s.io/)** — Ubuntu 的精简 K8s。

#### 云托管 Kubernetes
- **[AWS EKS](https://aws.amazon.com/eks/)** — Elastic Kubernetes Service。
- **[Google GKE](https://cloud.google.com/kubernetes-engine)** — Google Kubernetes Engine。
- **[Azure AKS](https://azure.microsoft.com/en-us/services/kubernetes-service/)** — Azure Kubernetes Service。
- **[DigitalOcean DOKS](https://www.digitalocean.com/products/kubernetes/)** — 价格较低的托管 K8s。

### 必备 CLI 工具
```bash
# kubectl - Kubernetes CLI (required)
# Install: https://kubernetes.io/docs/tasks/tools/

# kubectx - Switch between clusters
# kubens - Switch between namespaces
brew install kubectx

# k9s - Terminal-based K8s UI
brew install k9s

# stern - Multi-pod log tailing
brew install stern

# Helm - Package manager
brew install helm
```

### GUI 工具
- **[Lens](https://k8slens.dev/)** — Kubernetes IDE（原文称免费、优秀）。
- **[Octant](https://octant.dev/)** — Web K8s 仪表盘（VMware）。
- **[K9s](https://k9scli.io/)** — 终端用户界面。
- **[Kubernetes Dashboard](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/)** — 官方 Web UI。

### 监控与可观测性
- **[Prometheus](https://prometheus.io/)** — 指标采集。
- **[Grafana](https://grafana.com/)** — 可视化。
- **[Jaeger](https://www.jaegertracing.io/)** — 分布式追踪。
- **[Kiali](https://kiali.io/)** — 服务网格可观测性。

### CI/CD
- **[ArgoCD](https://argoproj.github.io/cd/)** — GitOps 持续交付。
- **[Flux](https://fluxcd.io/)** — GitOps 工具包。
- **[Tekton](https://tekton.dev/)** — 云原生 CI/CD。
- **[Jenkins X](https://jenkins-x.io/)** — K8s CI/CD。

### 安全
- **[Falco](https://falco.org/)** — 运行时安全。
- **[OPA（Open Policy Agent）](https://www.openpolicyagent.org/)** — 策略执行。
- **[KubeSec](https://kubesec.io/)** — 安全风险分析。
- **[Trivy](https://aquasecurity.github.io/trivy/)** — 容器漏洞扫描。

---

## 面向 ML 的 Kubernetes

### Kubernetes 上的 ML 平台
- **[Kubeflow](https://www.kubeflow.org/)** — 端到端 ML 平台。
- **[K8s 上的 MLflow](https://mlflow.org/)** — 实验追踪。
- **[Seldon Core](https://www.seldon.io/)** — ML 部署平台。
- **[KServe（KFServing）](https://kserve.github.io/website/)** — Serverless 模型服务。
- **[K8s 上的 Ray](https://docs.ray.io/en/latest/cluster/kubernetes/index.html)** — 分布式计算。

### GPU 调度
- **[NVIDIA GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/)** — 自动化 GPU 配置。
- **[GPU Device Plugin](https://github.com/NVIDIA/k8s-device-plugin)** — NVIDIA GPU 设备插件。
- **[GPUDirect Storage](https://docs.nvidia.com/gpudirect-storage/)** — 高性能数据加载。

---

## 社区与论坛

### 官方社区
- **[Kubernetes Slack](https://kubernetes.slack.com/)** — 官方 Slack，原文称非常活跃。
- **[Kubernetes Discourse](https://discuss.kubernetes.io/)** — 论坛讨论。
- **[Kubernetes GitHub](https://github.com/kubernetes/kubernetes)** — 源代码与 Issue。
- **[CNCF Slack](https://cloud-native.slack.com/)** — 云原生计算基金会。

### 讨论论坛
- **[r/kubernetes](https://reddit.com/r/kubernetes)** — Kubernetes Reddit 社区。
- **[Stack Overflow — kubernetes](https://stackoverflow.com/questions/tagged/kubernetes)** — 问答。
- **[Server Fault — kubernetes](https://serverfault.com/questions/tagged/kubernetes)** — 面向运维的问答。

### 社交媒体
- **[@kubernetesio](https://twitter.com/kubernetesio)** — Kubernetes 官方 Twitter。
- **[@kelseyhightower](https://twitter.com/kelseyhightower)** — Kelsey Hightower，K8s 倡导者。
- **[@thockin](https://twitter.com/thockin)** — Tim Hockin，K8s 联合创建者。
- **[@brendandburns](https://twitter.com/brendandburns)** — Brendan Burns，K8s 联合创建者。

### 聚会及会议
- **[KubeCon + CloudNativeCon](https://www.cncf.io/kubecon-cloudnativecon-events/)** — 重要 K8s 会议。
- **[Kubernetes Community Days](https://www.cncf.io/kubernetes-community-days/)** — 本地社区活动。
- **[Meetup.com — Kubernetes](https://www.meetup.com/topics/kubernetes/)** — 本地 K8s 聚会。

---

## 速查表与参考

- **[kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)** — 官方 kubectl 命令。
- **[Kubernetes API 速查表](https://unofficial-kubernetes.readthedocs.io/en/latest/api-reference/v1/definitions/)** — API 对象参考。
- **[YAML 模板](https://k8syaml.com/)** — 常见 K8s YAML 示例。
- **[Kubernetes Patterns](https://k8spatterns.io/)** — K8s 设计模式。

---

## 认证

### CNCF 认证
- **[CKAD](https://www.cncf.io/certification/ckad/)** — 侧重应用部署（推荐）。
- **[CKA](https://www.cncf.io/certification/cka/)** — 集群管理。
- **[CKS](https://www.cncf.io/certification/cks/)** — 安全方向。

### 云平台专项
- **[Google Cloud Professional Cloud Developer](https://cloud.google.com/certification/cloud-developer)** — 包含 GKE。
- **[AWS Certified Solutions Architect](https://aws.amazon.com/certification/certified-solutions-architect-professional/)** — 包含 EKS。
- **[Microsoft Certified: Azure Administrator](https://docs.microsoft.com/en-us/learn/certifications/azure-administrator/)** — 包含 AKS。

---

## YouTube 频道

- **[Kubernetes](https://www.youtube.com/c/KubernetesCommunity)** — 官方 K8s 频道。
- **[CNCF](https://www.youtube.com/c/cloudnativefdn)** — 云原生计算基金会。
- **[TechWorld with Nana](https://www.youtube.com/c/TechWorldwithNana)** — K8s 教程。
- **[That DevOps Guy](https://www.youtube.com/c/MarcelDempers)** — K8s 与 DevOps。
- **[Just me and Opensource](https://www.youtube.com/c/wenkatn-justmeandopensource)** — 深入 K8s。

---

## 播客

- **[Kubernetes Podcast from Google](https://kubernetespodcast.com/)** — K8s 每周新闻与访谈。
- **[The Podlets](https://thepodlets.io/)** — 云原生讨论。
- **[Software Engineering Daily — Kubernetes 专题](https://softwareengineeringdaily.com/?s=kubernetes)** — K8s 访谈。

---

## GitHub 仓库

### 学习资源
- **[Awesome Kubernetes](https://github.com/ramitsurana/awesome-kubernetes)** — 精选 K8s 资源。
- **[Kubernetes Examples](https://github.com/kubernetes/examples)** — 官方应用示例。
- **[Kubernetes Failure Stories](https://github.com/hjacobs/kubernetes-failure-stories)** — 从生产事故中学习。

### 工具及项目
- **[Helm Charts](https://github.com/helm/charts)** — Helm Chart 仓库。
- **[Kubernetes Device Plugins](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/resource-management/device-plugin.md)** — 设备插件规范。
- **[KubeEdge](https://github.com/kubeedge/kubeedge)** — 边缘计算 K8s。

---

## 最佳实践指南

### 生产 Kubernetes
- [生产最佳实践](https://learnk8s.io/production-best-practices)
- [Kubernetes 安全最佳实践](https://kubernetes.io/docs/concepts/security/security-best-practices/)
- [资源管理最佳实践](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-resource-requests-and-limits)

### Kubernetes 上的 ML
- [K8s 上的规模化 ML 推理](https://developer.nvidia.com/blog/deploying-machine-learning-models-in-production-with-kubernetes/)
- [GPU 最佳实践](https://cloud.google.com/kubernetes-engine/docs/how-to/gpus)
- [Kubeflow 最佳实践](https://www.kubeflow.org/docs/started/installing-kubeflow/)

---

## 补充学习路线

### 模块 04 之后

**下一模块：**
- **模块 05：数据流水线与编排** — 构建 ML 数据工作流。

**深入选项：**
- **高级 Kubernetes 网络** — 服务网格、网络策略。
- **Kubernetes Operator** — 构建自定义控制器。
- **多集群管理** — 联邦、多集群部署。
- **Kubernetes 安全** — RBAC、Pod 安全、网络策略。

---

## 故障排查资源

### 常见问题
- [Kubernetes 故障排查指南](https://kubernetes.io/docs/tasks/debug/)
- [调试 Pod](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- [调试 Service](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [网络故障排查](https://kubernetes.io/docs/tasks/debug/debug-cluster/network-troubleshooting/)

### 调试工具
- `kubectl describe` — 详细资源信息。
- `kubectl logs` — 容器日志。
- `kubectl exec` — 在容器内执行命令。
- `kubectl port-forward` — 调试时转发端口。
- `kubectl top` — 资源使用情况（需要 Metrics Server）。

---

## 实践环境

### 免费 Kubernetes 集群
- **[Play with Kubernetes](https://labs.play-with-k8s.com/)** — 免费 4 小时会话（原文描述）。
- **[Killercoda（原 Katacoda）](https://killercoda.com/playgrounds/course/kubernetes)** — 交互式场景。
- **[GCP Free Tier GKE](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster#free-tier-autopilot-cluster)** — 原文称免费 Autopilot 集群。

### 沙箱
- **Minikube** — 免费本地集群。
- **kind** — 基于 Docker 的免费 K8s。
- **Docker Desktop K8s** — 内置集群。

---

## 持续学习

- **每天练习 kubectl** — 掌握 CLI。
- **部署真实应用** — 做中学。
- **学习官方文档** — 内容优秀。
- **加入 K8s 社区** — Slack、Reddit、论坛。
- **在 Twitter 关注 K8s** — 及时了解动态。
- **为项目贡献** — 开源贡献。
- **参加 KubeCon** — 重要 K8s 会议（提供线上选项）。
- **获取认证** — CKAD 或 CKA 验证技能。
- **构建 Operator** — 进一步提升 K8s 专业能力。
- **分享知识** — 写博客、演讲、指导他人。

---

**对资源清单有问题或建议？** 在 GitHub 创建 Issue！

**希望贡献？** 提交 PR，添加更多高质量资源。

> 译注：外链、产品状态、免费额度与认证名称依原文保留，未逐一核验。GKE 免费管理费用不等于免费计算资源。
