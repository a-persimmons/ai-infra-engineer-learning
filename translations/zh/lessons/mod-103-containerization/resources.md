# 模块 03 资源：Docker 容器化

## 官方文档

### Docker 文档
- [Docker Documentation](https://docs.docker.com/)——完整官方文档。
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)——所有 Dockerfile 指令。
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)——命令行参考。
- [Docker Compose Documentation](https://docs.docker.com/compose/)——多容器应用。
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)——安全最佳实践。

### NVIDIA GPU 支持
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
- [NVIDIA NGC Catalog](https://catalog.ngc.nvidia.com/)——预构建 GPU 容器。
- [CUDA Container Images](https://hub.docker.com/r/nvidia/cuda)

---

## 书籍

### Docker 基础
1. **《Docker Deep Dive》**——Nigel Poulton
   - 综合 Docker 指南。
   - 从基础到进阶。
   - 定期更新以覆盖新功能。
2. **《Docker in Action》**——Jeff Nickoloff、Stephen Kuenzli
   - 实用 Docker 模式。
   - 真实示例。
   - 适合中级学习者。
3. **《Docker for Data Science》**——Joshua Cook
   - 面向数据科学及 ML 的 Docker。
   - Docker 中的 Jupyter Notebook。
   - 可复现研究工作流。

### 容器最佳实践
4. **《Container Security》**——Liz Rice
   - 容器安全考量。
   - 扫描、运行时安全、合规。
   - 对生产部署非常重要。
5. **《Kubernetes Patterns》**——Bilgin Ibryam、Roland Huß
   - 虽侧重 K8s，但也涵盖容器设计模式。
   - 适合理解云原生架构。

---

## 在线课程

### Docker 基础
- **[Docker for Beginners](https://www.youtube.com/watch?v=fqMOX6JJhGo)**（FreeCodeCamp、YouTube、免费）
  - 2 小时综合入门。
  - 动手示例。
  - 适合初学者。
- **[Docker Mastery](https://www.udemy.com/course/docker-mastery/)**（Udemy，原文约 15 美元）
  - Bret Fisher 的综合课程。
  - 涵盖 Docker、Compose、Swarm。
  - 评价较高，定期更新。
- **[Docker Certified Associate Exam Prep](https://acloudguru.com/course/docker-certified-associate-dca)**（A Cloud Guru，订阅）
  - 认证备考。
  - 深入 Docker 知识。
  - 动手实验。

### 面向 ML 的 Docker
- **[MLOps with Docker](https://www.coursera.org/learn/mlops-docker-kubernetes)**（Coursera）
  - 用于 ML 工作流的 Docker。
  - 与 ML 工具集成。
  - 生产部署模式。
- **[Full Stack Deep Learning](https://fullstackdeeplearning.com/)**（免费）
  - 面向 ML 的容器化模块。
  - 生产 ML 系统。
  - 最佳实践。

---

## 教程与指南

### 交互教程
- **[Play with Docker](https://labs.play-with-docker.com/)**——免费浏览器 Docker 实验环境。
- **[Katacoda Docker Scenarios](https://www.katacoda.com/courses/docker)**——交互式 Docker 教程。
- **[Docker 101 Tutorial](https://www.docker.com/101-tutorial/)**——官方 Docker 入门。

### 博客与文章

#### Docker 基础
- [Intro to Docker for Data Scientists](https://towardsdatascience.com/docker-for-data-scientists-5732501f0ba4)
- [Docker Best Practices for Data Science](https://dagshub.com/blog/docker-best-practices-for-data-science/)
- [Understanding Docker Layers](https://medium.com/@jessgreb01/digging-into-docker-layers-c22f948ed612)

#### 优化
- [Reduce Docker Image Size](https://devopscube.com/reduce-docker-image-size/)
- [Multi-Stage Builds Explained](https://docs.docker.com/build/building/multi-stage/)
- [Docker Layer Caching in CI/CD](https://testdriven.io/blog/faster-ci-builds-with-docker-cache/)

#### GPU 支持
- [Running GPU-Accelerated Containers](https://developer.nvidia.com/blog/gpu-accelerated-sql-queries-rapids/)
- [Docker and CUDA: Getting Started](https://blog.paperspace.com/nvidia-docker/)

#### 安全
- [Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [10 Docker Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/)

---

## 工具与软件

### Docker Desktop 免费替代方案
- **[Rancher Desktop](https://rancherdesktop.io/)**——免费开源的 Docker Desktop 替代方案。
- **[Podman](https://podman.io/)**——无守护进程的容器引擎，兼容 Docker。
- **[containerd](https://containerd.io/)**——业界标准容器运行时。

### 容器镜像仓库
- **[Docker Hub](https://hub.docker.com/)**——官方仓库，免费公共仓库。
- **[GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)**——GitHub 提供。
- **[Quay.io](https://quay.io/)**——Red Hat 容器仓库。
- **[AWS ECR](https://aws.amazon.com/ecr/)**——Amazon Elastic Container Registry。
- **[GCP Artifact Registry](https://cloud.google.com/artifact-registry)**——Google Cloud 仓库。
- **[Azure ACR](https://azure.microsoft.com/en-us/services/container-registry/)**——Azure 容器仓库。

### 镜像扫描与安全
- **[Trivy](https://github.com/aquasecurity/trivy)**——容器漏洞扫描器。
- **[Snyk](https://snyk.io/product/container-vulnerability-management/)**——容器安全平台。
- **[Clair](https://github.com/quay/clair)**——开源漏洞扫描器。
- **[Anchore](https://anchore.com/)**——容器安全及合规。

### 构建工具
- **[Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)**——扩展构建能力。
- **[BuildKit](https://docs.docker.com/build/buildkit/)**——改进的构建后端。
- **[Kaniko](https://github.com/GoogleContainerTools/kaniko)**——在 Kubernetes 内构建镜像。

### 开发工具
- **[VS Code Docker Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)**——VS Code Docker 支持。
- **[Portainer](https://www.portainer.io/)**——容器管理 UI。
- **[Dive](https://github.com/wagoodman/dive)**——探索 Docker 镜像层。
- **[Hadolint](https://github.com/hadolint/hadolint)**——Dockerfile Linter。

---

## 预构建 ML 容器镜像

### PyTorch
- **[pytorch/pytorch](https://hub.docker.com/r/pytorch/pytorch)**——PyTorch 官方镜像。
- **[nvidia/pytorch](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch)**——NVIDIA 优化的 PyTorch。

### TensorFlow
- **[tensorflow/tensorflow](https://hub.docker.com/r/tensorflow/tensorflow)**——TensorFlow 官方镜像。
- **[nvidia/tensorflow](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/tensorflow)**——NVIDIA 优化的 TensorFlow。

### Hugging Face
- **[huggingface/transformers-pytorch-gpu](https://hub.docker.com/r/huggingface/transformers-pytorch-gpu)**——Transformers 与 PyTorch。
- **[huggingface/transformers-tensorflow-gpu](https://hub.docker.com/r/huggingface/transformers-tensorflow-gpu)**——Transformers 与 TensorFlow。

### Jupyter
- **[jupyter/datascience-notebook](https://hub.docker.com/r/jupyter/datascience-notebook)**——带数据科学技术栈的 Jupyter。
- **[jupyter/tensorflow-notebook](https://hub.docker.com/r/jupyter/tensorflow-notebook)**——带 TensorFlow 的 Jupyter。
- **[jupyter/pytorch-notebook](https://hub.docker.com/r/jupyter/pytorch-notebook)**——带 PyTorch 的 Jupyter。

### NVIDIA NGC
- [NVIDIA GPU Cloud Catalog](https://catalog.ngc.nvidia.com/)——精选 GPU 优化容器。
- RAPIDS、CUDA、cuDNN、TensorRT 预构建镜像。

---

## 社区与论坛

### 讨论论坛
- **[Docker Community Forums](https://forums.docker.com/)**——Docker 官方讨论。
- **[r/docker](https://reddit.com/r/docker)**——Docker Reddit 社区。
- **[Stack Overflow - docker](https://stackoverflow.com/questions/tagged/docker)**——问答。
- **[Docker Community Slack](https://dockercommunity.slack.com/)**——实时聊天。

### 社交媒体
- **[@Docker](https://twitter.com/docker)**——Docker 官方 Twitter。
- **[@solomonstre](https://twitter.com/solomonstre)**——Solomon Hykes，Docker 联合创始人。
- **[@jpetazzo](https://twitter.com/jpetazzo)**——Jérôme Petazzoni，Docker 专家。
- **[@bfirsh](https://twitter.com/bfirsh)**——Ben Firshman，Docker Compose 创建者。

---

## 速查表与参考

### 命令速查表
- [Docker CLI Cheat Sheet (PDF)](https://docs.docker.com/get-started/docker_cheatsheet.pdf)
- [Dockerfile Cheat Sheet](https://kapeli.com/cheat_sheets/Dockerfile.docset/Contents/Resources/Documents/index)
- [Docker Compose Cheat Sheet](https://devhints.io/docker-compose)

### Dockerfile 示例
- [Dockerfile Examples GitHub](https://github.com/jessfraz/dockerfiles)——Jess Frazelle 的集合。
- [Docker Official Images](https://github.com/docker-library/official-images)——官方镜像的构建方式。
- [Awesome Docker](https://github.com/veggiemonk/awesome-docker)——精选 Docker 资源。

---

## YouTube 频道
- **[Docker](https://www.youtube.com/c/DockerInc)**——Docker 官方频道。
- **[TechWorld with Nana](https://www.youtube.com/c/TechWorldwithNana)**——Docker 及 DevOps 教程。
- **[NetworkChuck](https://www.youtube.com/c/NetworkChuck)**——Docker 速成课程。
- **[freeCodeCamp.org](https://www.youtube.com/c/Freecodecamp)**——完整 Docker 课程。

---

## 播客
- **[The Podlets](https://thepodlets.io/)**——云原生与容器讨论。
- **[Software Engineering Daily - Docker Episodes](https://softwareengineeringdaily.com/?s=docker)**——Docker 访谈。

---

## GitHub 仓库

### 示例项目
- **[Docker Samples](https://github.com/dockersamples)**——Docker 官方示例应用。
- **[Awesome Compose](https://github.com/docker/awesome-compose)**——Docker Compose 示例应用。
- **[ML Docker Examples](https://github.com/Azure/MachineLearningNotebooks/tree/master/how-to-use-azureml/deployment/deploy-to-cloud)**——Azure ML Docker 示例。

### 工具
- **[Dive](https://github.com/wagoodman/dive)**——探索 Docker 镜像层。
- **[Dockerize](https://github.com/jwilder/dockerize)**——简化容器内应用运行。
- **[Docker Slim](https://github.com/docker-slim/docker-slim)**——缩减 Docker 镜像体积。
- **[Watchtower](https://github.com/containrrr/watchtower)**——自动更新运行中的容器。

---

## 认证
- **[Docker Certified Associate (DCA)](https://training.mirantis.com/dca-certification-exam/)**
  - Docker 认证。
  - 验证 Docker 技能。
  - 有助于职业发展。

---

## 最佳实践指南

### 生产最佳实践
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12-Factor App Methodology](https://12factor.net/)——容器化应用原则。
- [CNCF Cloud Native Security](https://www.cncf.io/blog/2022/06/07/introduction-to-cloud-native-security/)

### 镜像优化
- [Optimizing Docker Images](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#minimize-the-number-of-layers)
- [Multi-Stage Build Best Practices](https://www.docker.com/blog/faster-multi-platform-builds-dockerfile-cross-compilation-guide/)

### 安全
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)——安全配置基准。
- [Docker Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

## 故障排查资源

### 常见问题
- [Docker Troubleshooting Guide](https://docs.docker.com/config/daemon/troubleshoot/)
- [Stack Overflow - docker](https://stackoverflow.com/questions/tagged/docker)——搜索已有解法。
- [Docker Community Forums](https://forums.docker.com/)——提问。

### 性能
- [Docker Performance Tuning](https://docs.docker.com/config/containers/resource_constraints/)
- [Monitoring Docker Containers](https://docs.docker.com/config/containers/runmetrics/)

---

## 补充学习路径

### 完成模块 03 后

**下一模块：**
- **模块 04：Kubernetes 基础**——规模化编排容器。

**深入选项：**
- **高级 Docker 网络**——自定义网络、插件、服务网格。
- **Docker Swarm**——Docker 原生编排（Kubernetes 替代方案）。
- **容器安全**——高级安全、扫描与运行时保护。
- **CI/CD 中的 Docker**——自动构建、测试、部署。

---

## 实践练习仓库

创建 GitHub 仓库，包含：
- 不同 ML 框架的 Dockerfile 示例。
- 常见 ML 架构的 Docker Compose 技术栈。
- 优化示例（镜像优化前后大小）。
- 支持 GPU 的示例。
- 使用 Docker 的 CI/CD 工作流。

---

## 持续学习
- **每天构建容器**——实践至关重要。
- **优化每个镜像**——尽量减小体积、加快构建。
- **研究层缓存**——原文认为这是首要性能优化。
- **学习官方镜像**——阅读热门镜像 Dockerfile。
- **实验 GPU 容器**——即使没有 GPU 硬件。
- **加入 Docker 社区**——向从业者学习。
- **保持更新**——Docker 演进很快，关注发布说明。

---

**对资源清单有疑问或建议？** 在 GitHub 创建 Issue！

**希望贡献？** 提交包含更多高质量资源的 PR！

> 译注：英文资源标题保留，便于搜索；服务、课程、认证、链接及免费额度均按原文收录，未逐一核实。Katacoda 与部分工具可能已停用或迁移。
