# 模块 03 资源：Docker 容器化

## 官方文档

### Docker 文档
- [Docker 文档](https://docs.docker.com/) — 完整官方文档。
- [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/) — 全部 Dockerfile 指令。
- [Docker CLI 参考](https://docs.docker.com/engine/reference/commandline/cli/) — 命令行参考。
- [Docker Compose 文档](https://docs.docker.com/compose/) — 多容器应用。
- [编写 Dockerfile 的最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker 安全](https://docs.docker.com/engine/security/) — 安全最佳实践。

### NVIDIA GPU 支持
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
- [NVIDIA NGC Catalog](https://catalog.ngc.nvidia.com/) — 预构建 GPU 容器。
- [CUDA 容器镜像](https://hub.docker.com/r/nvidia/cuda)

---

## 书籍

### Docker 基础
1. **《Docker Deep Dive》** — Nigel Poulton
   - 全面的 Docker 指南。
   - 从基础覆盖到进阶主题。
   - 定期更新以涵盖 Docker 新功能。
2. **《Docker in Action》** — Jeff Nickoloff、Stephen Kuenzli
   - 实用 Docker 模式。
   - 真实案例。
   - 适合中级学习者。
3. **《Docker for Data Science》** — Joshua Cook
   - 专门针对数据科学和 ML 的 Docker。
   - Docker 中的 Jupyter Notebook。
   - 可复现研究工作流。

### 容器最佳实践
4. **《Container Security》** — Liz Rice
   - 容器安全考虑。
   - 扫描、运行时安全、合规。
   - 对生产部署十分重要。
5. **《Kubernetes Patterns》** — Bilgin Ibryam、Roland Huß
   - 虽然聚焦 K8s，也涵盖容器设计模式。
   - 适合理解云原生架构。

---

## 在线课程

### Docker 基础
- **[Docker for Beginners](https://www.youtube.com/watch?v=fqMOX6JJhGo)**（freeCodeCamp，YouTube，免费）
  - 2 小时全面入门。
  - 动手示例。
  - 适合初学者。
- **[Docker Mastery](https://www.udemy.com/course/docker-mastery/)**（Udemy，原文约 15 美元）
  - Bret Fisher 的全面课程。
  - 涵盖 Docker、Compose、Swarm。
  - 原文评价高、定期更新。
- **[Docker Certified Associate 考试准备](https://acloudguru.com/course/docker-certified-associate-dca)**（A Cloud Guru，订阅）
  - 认证准备。
  - 深入 Docker 知识。
  - 动手实验。

### ML 专项 Docker
- **[MLOps with Docker](https://www.coursera.org/learn/mlops-docker-kubernetes)**（Coursera）
  - ML 工作流中的 Docker。
  - 与 ML 工具集成。
  - 生产部署模式。
- **[Full Stack Deep Learning](https://fullstackdeeplearning.com/)**（免费）
  - ML 容器化模块。
  - 生产 ML 系统。
  - 最佳实践。

---

## 教程与指南

### 交互教程
- **[Play with Docker](https://labs.play-with-docker.com/)** — 免费浏览器 Docker 实验环境。
- **[Katacoda Docker 场景](https://www.katacoda.com/courses/docker)** — 交互式 Docker 教程（原文资源）。
- **[Docker 101 教程](https://www.docker.com/101-tutorial/)** — 官方 Docker 入门。

### 博客与文章

#### Docker 基础
- [面向数据科学家的 Docker 入门](https://towardsdatascience.com/docker-for-data-scientists-5732501f0ba4)
- [数据科学 Docker 最佳实践](https://dagshub.com/blog/docker-best-practices-for-data-science/)
- [理解 Docker 镜像层](https://medium.com/@jessgreb01/digging-into-docker-layers-c22f948ed612)

#### 优化
- [减小 Docker 镜像大小](https://devopscube.com/reduce-docker-image-size/)
- [多阶段构建详解](https://docs.docker.com/build/building/multi-stage/)
- [CI/CD 中的 Docker 层缓存](https://testdriven.io/blog/faster-ci-builds-with-docker-cache/)

#### GPU 支持
- [运行 GPU 加速容器](https://developer.nvidia.com/blog/gpu-accelerated-sql-queries-rapids/)
- [Docker 与 CUDA：入门](https://blog.paperspace.com/nvidia-docker/)

#### 安全
- [Docker 安全速查表](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [10 项 Docker 安全最佳实践](https://snyk.io/blog/10-docker-image-security-best-practices/)

---

## 工具与软件

### Docker Desktop 免费替代方案
- **[Rancher Desktop](https://rancherdesktop.io/)** — 免费开源 Docker Desktop 替代方案。
- **[Podman](https://podman.io/)** — 无守护进程的容器引擎，兼容 Docker。
- **[containerd](https://containerd.io/)** — 行业标准容器运行时。

### 容器镜像仓库
- **[Docker Hub](https://hub.docker.com/)** — 官方仓库，免费公共仓库。
- **[GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)** — 与 GitHub 集成。
- **[Quay.io](https://quay.io/)** — Red Hat 容器仓库。
- **[AWS ECR](https://aws.amazon.com/ecr/)** — Amazon Elastic Container Registry。
- **[GCP Artifact Registry](https://cloud.google.com/artifact-registry)** — Google Cloud 仓库。
- **[Azure ACR](https://azure.microsoft.com/en-us/services/container-registry/)** — Azure Container Registry。

### 镜像扫描与安全
- **[Trivy](https://github.com/aquasecurity/trivy)** — 容器漏洞扫描器。
- **[Snyk](https://snyk.io/product/container-vulnerability-management/)** — 容器安全平台。
- **[Clair](https://github.com/quay/clair)** — 开源漏洞扫描器。
- **[Anchore](https://anchore.com/)** — 容器安全和合规。

### 构建工具
- **[Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)** — 扩展构建能力。
- **[BuildKit](https://docs.docker.com/build/buildkit/)** — 改进的构建后端。
- **[Kaniko](https://github.com/GoogleContainerTools/kaniko)** — 在 Kubernetes 中构建镜像（原文资源）。

### 开发工具
- **[VS Code Docker 扩展](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)** — VS Code 中的 Docker 支持。
- **[Portainer](https://www.portainer.io/)** — 容器管理界面。
- **[Dive](https://github.com/wagoodman/dive)** — 查看 Docker 镜像层的工具。
- **[Hadolint](https://github.com/hadolint/hadolint)** — Dockerfile linter。

---

## 预构建 ML 容器镜像

### PyTorch
- **[pytorch/pytorch](https://hub.docker.com/r/pytorch/pytorch)** — 官方 PyTorch 镜像。
- **[nvidia/pytorch](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch)** — NVIDIA 优化的 PyTorch。

### TensorFlow
- **[tensorflow/tensorflow](https://hub.docker.com/r/tensorflow/tensorflow)** — 官方 TensorFlow 镜像。
- **[nvidia/tensorflow](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/tensorflow)** — NVIDIA 优化的 TensorFlow。

### Hugging Face
- **[huggingface/transformers-pytorch-gpu](https://hub.docker.com/r/huggingface/transformers-pytorch-gpu)** — 使用 PyTorch 的 Transformers。
- **[huggingface/transformers-tensorflow-gpu](https://hub.docker.com/r/huggingface/transformers-tensorflow-gpu)** — 使用 TensorFlow 的 Transformers。

### Jupyter
- **[jupyter/datascience-notebook](https://hub.docker.com/r/jupyter/datascience-notebook)** — 带数据科学技术栈的 Jupyter。
- **[jupyter/tensorflow-notebook](https://hub.docker.com/r/jupyter/tensorflow-notebook)** — 带 TensorFlow 的 Jupyter。
- **[jupyter/pytorch-notebook](https://hub.docker.com/r/jupyter/pytorch-notebook)** — 带 PyTorch 的 Jupyter。

### NVIDIA NGC
- [NVIDIA GPU Cloud Catalog](https://catalog.ngc.nvidia.com/) — 精选 GPU 优化容器。
- 预构建 RAPIDS、CUDA、cuDNN、TensorRT 镜像。

---

## 社区与论坛

### 讨论论坛
- **[Docker Community Forums](https://forums.docker.com/)** — 官方 Docker 讨论。
- **[r/docker](https://reddit.com/r/docker)** — Docker Reddit 社区。
- **[Stack Overflow — docker](https://stackoverflow.com/questions/tagged/docker)** — 问答。
- **[Docker Community Slack](https://dockercommunity.slack.com/)** — 实时聊天。

### 社交媒体
- **[@Docker](https://twitter.com/docker)** — Docker 官方 Twitter。
- **[@solomonstre](https://twitter.com/solomonstre)** — Solomon Hykes，Docker 联合创始人。
- **[@jpetazzo](https://twitter.com/jpetazzo)** — Jérôme Petazzoni，Docker 专家。
- **[@bfirsh](https://twitter.com/bfirsh)** — Ben Firshman，Docker Compose 创建者。

---

## 速查表与参考

### 命令速查表
- [Docker CLI 速查表（PDF）](https://docs.docker.com/get-started/docker_cheatsheet.pdf)
- [Dockerfile 速查表](https://kapeli.com/cheat_sheets/Dockerfile.docset/Contents/Resources/Documents/index)
- [Docker Compose 速查表](https://devhints.io/docker-compose)

### Dockerfile 示例
- [GitHub Dockerfile 示例](https://github.com/jessfraz/dockerfiles) — Jess Frazelle 的集合。
- [Docker 官方镜像](https://github.com/docker-library/official-images) — 官方镜像构建方式。
- [Awesome Docker](https://github.com/veggiemonk/awesome-docker) — 精选 Docker 资源。

---

## YouTube 频道

- **[Docker](https://www.youtube.com/c/DockerInc)** — Docker 官方频道。
- **[TechWorld with Nana](https://www.youtube.com/c/TechWorldwithNana)** — Docker 和 DevOps 教程。
- **[NetworkChuck](https://www.youtube.com/c/NetworkChuck)** — Docker 速成课程。
- **[freeCodeCamp.org](https://www.youtube.com/c/Freecodecamp)** — 完整 Docker 课程。

---

## 播客

- **[The Podlets](https://thepodlets.io/)** — 云原生与容器讨论。
- **[Software Engineering Daily — Docker 专题](https://softwareengineeringdaily.com/?s=docker)** — Docker 访谈。

---

## GitHub 仓库

### 示例项目
- **[Docker Samples](https://github.com/dockersamples)** — 官方 Docker 示例应用。
- **[Awesome Compose](https://github.com/docker/awesome-compose)** — Docker Compose 应用示例。
- **[ML Docker 示例](https://github.com/Azure/MachineLearningNotebooks/tree/master/how-to-use-azureml/deployment/deploy-to-cloud)** — Azure ML Docker 示例。

### 工具
- **[Dive](https://github.com/wagoodman/dive)** — 查看 Docker 镜像层。
- **[Dockerize](https://github.com/jwilder/dockerize)** — 简化容器内运行应用。
- **[Docker Slim](https://github.com/docker-slim/docker-slim)** — 缩减 Docker 镜像。
- **[Watchtower](https://github.com/containrrr/watchtower)** — 自动更新运行中容器。

---

## 认证

- **[Docker Certified Associate（DCA）](https://training.mirantis.com/dca-certification-exam/)**
  - Docker 官方认证（原文描述）。
  - 验证 Docker 技能。
  - 有助于职业发展。

---

## 最佳实践指南

### 生产最佳实践
- [Docker 生产最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [十二要素应用方法论](https://12factor.net/) — 容器化应用原则。
- [CNCF 云原生安全](https://www.cncf.io/blog/2022/06/07/introduction-to-cloud-native-security/)

### 镜像优化
- [优化 Docker 镜像](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#minimize-the-number-of-layers)
- [多阶段构建最佳实践](https://www.docker.com/blog/faster-multi-platform-builds-dockerfile-cross-compilation-guide/)

### 安全
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker) — 安全配置基准。
- [Docker 安全最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

## 故障排查资源

### 常见问题
- [Docker 故障排查指南](https://docs.docker.com/config/daemon/troubleshoot/)
- [Stack Overflow — docker](https://stackoverflow.com/questions/tagged/docker) — 搜索现有解决方案。
- [Docker Community Forums](https://forums.docker.com/) — 提问。

### 性能
- [Docker 性能调优](https://docs.docker.com/config/containers/resource_constraints/)
- [监控 Docker 容器](https://docs.docker.com/config/containers/runmetrics/)

---

## 补充学习路线

### 模块 03 之后

**下一模块：**
- **模块 04：Kubernetes 基础** — 规模化编排容器。

**深入选项：**
- **高级 Docker 网络** — 自定义网络、插件、服务网格。
- **Docker Swarm** — Docker 原生编排（Kubernetes 的替代方案）。
- **容器安全** — 高级安全、扫描、运行时保护。
- **CI/CD 中的 Docker** — 自动化构建、测试、部署。

---

## 实践练习仓库

创建 GitHub 仓库，包含：
- 不同 ML 框架的 Dockerfile 示例
- 常见 ML 架构的 Docker Compose 技术栈
- 优化示例（优化前后镜像大小）
- GPU 支持示例
- 带 Docker 的 CI/CD 工作流

---

## 持续学习

- **每天构建容器** — 实践至关重要。
- **优化每个镜像** — 争取更小、更快的构建。
- **学习层缓存** — 原文将其视为首要性能优化。
- **向官方镜像学习** — 阅读流行镜像的 Dockerfile。
- **实验 GPU 容器** — 即使暂时没有 GPU 硬件。
- **加入 Docker 社区** — 向实践者学习。
- **保持更新** — Docker 发展迅速，关注发行说明。

---

**对资源清单有问题或建议？** 在 GitHub 创建 Issue！

**希望贡献？** 提交 PR，添加更多高质量资源。

> 译注：外部链接、课程价格及认证状态按原文保留，未逐一核验；部分服务和项目可能已经停止维护或迁移。
