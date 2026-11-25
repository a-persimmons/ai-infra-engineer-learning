# 模块 03：使用 Docker 实现容器化

**时长：** 35 小时
**难度：** 中级
**前置条件：** 完成模块 01 与 02。

## 模块概览

本模块深入探讨面向机器学习应用的 Docker 容器化。你将学习构建优化的 Docker 镜像、管理机器学习特有依赖、处理容器内 GPU 访问，并使用 Docker Compose 编排多容器机器学习系统。

完成本模块后，你将能够熟练地对各类机器学习应用进行容器化，从简单推理服务到复杂多组件机器学习管道。

## 学习成果

完成本模块后，你将能够：

1. **理解 Docker 架构**——解释 Docker 的工作方式及其对机器学习工作负载的益处。
2. **编写生产级 Dockerfile**——为机器学习应用创建优化的 Dockerfile。
3. **优化镜像大小**——通过多阶段构建与层缓存将镜像大小减少 50–80%。
4. **管理机器学习依赖**——正确处理 PyTorch、TensorFlow、CUDA 及系统依赖。
5. **启用 GPU 访问**——配置 Docker 容器使用 NVIDIA GPU。
6. **使用 Docker Compose**——编排多容器机器学习系统（模型 + API + 数据库 + 缓存）。
7. **使用容器镜像仓库**——向 Docker Hub、ECR、GCR、ACR 推送或拉取镜像。
8. **调试容器问题**——排查机器学习场景中常见的 Docker 问题。

## 为什么容器化对机器学习重要

### 没有容器时的问题

**“在我的电脑上能运行！”**——经典的开发者问题在机器学习中被进一步放大：

- 机器学习模型依赖特定库版本（PyTorch 2.0 与 2.1）。
- CUDA 驱动、工具包与库之间需要保持版本兼容。
- 系统库（libcudnn、libnccl）具有复杂依赖。
- Python 环境容易损坏且对版本敏感。
- 部署环境与开发环境不同。

### 解决方案：Docker 容器

Docker 通过以下方式解决这些问题：

1. **打包一切**——代码、依赖、系统库均放入一个镜像。
2. **可复现性**——相同容器在兼容环境中以相同方式运行。
3. **隔离**——避免与其他应用发生冲突。
4. **可移植性**——在笔记本电脑、云虚拟机、Kubernetes 等环境运行。
5. **版本控制**——像管理代码一样对镜像打标签并管理版本。

### 实际影响

**示例：LLM 部署**
- 不使用 Docker：在新机器上配置 CUDA、PyTorch 和依赖需要 2–3 天。
- 使用 Docker：5 分钟拉取镜像并启动服务。

**示例：多模型服务**
- 不使用 Docker：不同模型要求不同 Python 版本 → 使用独立虚拟机。
- 使用 Docker：在同一台机器上运行具有不同依赖的 10 个模型。

## 模块结构

### 第 01 课：Docker 导论（4 小时）
**文件：** `01-docker-introduction.md`

- 容器与虚拟机比较
- Docker 架构（守护进程、客户端、镜像、容器）
- 安装 Docker 和 NVIDIA Container Toolkit
- Docker 基础命令
- 第一个容器：从 Hello World 到机器学习模型
- **实操：**运行预构建机器学习容器

### 第 02 课：面向机器学习应用的 Dockerfile（5 小时）
**文件：** `02-dockerfile-ml-apps.md`

- Dockerfile 语法与指令
- 机器学习基础镜像（python:3.11、nvidia/cuda、pytorch/pytorch）
- 安装机器学习框架（PyTorch、TensorFlow）
- 将代码和模型复制到镜像中
- 设置工作目录和入口点
- **实操：**为 PyTorch 模型编写 Dockerfile

### 第 03 课：镜像优化（5 小时）
**文件：** `03-image-optimization.md`

- 多阶段构建（分离构建与运行时）
- 层缓存策略
- 最小化镜像大小（从 500MB 减至 150MB 的技术）
- 使用 .dockerignore 加快构建
- 选择精简基础镜像
- 安全扫描与漏洞
- **实操：**将镜像大小优化 70%

### 第 04 课：Docker 网络与数据卷（5 小时）
**文件：** `04-docker-networking-volumes.md`

- Docker 网络模式（bridge、host、none）
- 推理服务的端口映射
- 容器之间的通信
- 用于持久化存储的 Docker Volume
- 用于开发的 Bind Mount
- 使用数据卷管理数据集
- **实操：**具有网络连接的多容器应用

### 第 05 课：Docker Compose（5 小时）
**文件：** `05-docker-compose.md`

- Docker Compose 概览
- 编写 docker-compose.yml
- 多服务机器学习应用（API + 模型 + Redis + PostgreSQL）
- 环境变量与密钥
- 健康检查与依赖
- 使用 Compose 扩缩容服务
- **实操：**使用 Compose 构建完整机器学习技术栈

### 第 06 课：容器镜像仓库（4 小时）
**文件：** `06-container-registries.md`

- Docker Hub：公共与私有仓库
- AWS ECR（Elastic Container Registry）
- GCP GCR/Artifact Registry
- Azure ACR（Azure Container Registry）
- 镜像标签策略（latest、语义化版本）
- 与镜像仓库集成的 CI/CD
- **实操：**向多个镜像仓库推送镜像

### 第 07 课：Docker 的 GPU 支持（5 小时）
**文件：** `07-gpu-docker.md`

- 安装 NVIDIA Container Toolkit
- 运行 GPU 加速容器
- CUDA 基础镜像（nvidia/cuda）
- 将特定 GPU 映射至容器
- GPU 显存管理
- 多 GPU 容器
- 监控容器中的 GPU 使用情况
- **实操：**部署 GPU 加速推理服务

## 动手活动

### 活动 1：容器化图像分类服务
**时长：** 3 小时
**交付物：** 小于 500MB、通过 FastAPI 提供 ResNet 模型服务的 Docker 镜像。

### 活动 2：多阶段构建优化
**时长：** 2 小时
**交付物：** 使用多阶段构建将镜像从 2GB 减至 500MB 以下。

### 活动 3：多容器机器学习应用
**时长：** 4 小时
**交付物：** 包含模型服务器、API 网关、缓存与数据库的 Docker Compose 技术栈。

### 活动 4：GPU 容器部署
**时长：** 3 小时
**交付物：** 提供 Stable Diffusion 模型服务的 GPU 加速容器。

### 活动 5：结合镜像仓库的 CI/CD
**时长：** 2 小时
**交付物：** 构建并推送镜像的 GitHub Actions 工作流。

## 评估

### 测验：Docker 概念与最佳实践
**位置：** `quiz.md`
**题目：** 20 道选择题与简答题。
**通过分数：** 70%（答对 14/20）。
**主题：** Docker 架构、Dockerfile 语法、优化、GPU 容器。

### 实践：构建生产级机器学习容器
**目标：** 为机器学习模型部署创建优化、安全的容器。

**要求：**
1. 使用多阶段 Dockerfile 优化大小。
2. CPU 模型镜像小于 500MB，或 GPU 模型镜像小于 2GB。
3. 为安全起见使用非 root 用户。
4. 健康检查端点。
5. 正确处理信号，实现优雅关闭。
6. 环境变量配置。
7. README 文档。

**提交物：** 包含 Dockerfile、代码和 README 的 GitHub 仓库。

## 前置条件检查

开始模块 03 前，请确认：

- [ ] 完成模块 01 和 02。
- [ ] 已安装 Docker（Docker Desktop 或 Docker Engine）。
- [ ] 熟悉基本命令行。
- [ ] 理解 REST API（模块 01）。
- [ ] （可选）具有 NVIDIA GPU 及驱动，用于 GPU 课程。
- [ ] （可选）安装 NVIDIA Container Toolkit，使 Docker 支持 GPU。

### 安装验证

```bash
# Verify Docker installation
docker --version
docker run hello-world

# Verify Docker Compose
docker compose version

# (Optional) Verify NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

## 涵盖的核心概念

### Docker 基础
- 镜像与容器
- Dockerfile 指令（FROM、RUN、COPY、CMD、ENTRYPOINT）
- 镜像层与缓存
- Docker 守护进程与客户端架构

### 机器学习特有的关注点
- 镜像中的大型模型文件（超过 1GB）
- CUDA 与 GPU 依赖
- 容器中的 Python 包管理
- 数据卷挂载策略

### 生产环境最佳实践
- 安全（非 root 用户、扫描）
- 优化（多阶段构建、层缓存）
- 日志与监控
- 健康检查与优雅关闭

### DevOps 集成
- 容器镜像仓库与版本管理
- CI/CD 集成
- 环境管理
- 密钥处理

## 工具与技术

### 必需
- **Docker Engine**（v20.10+）或 **Docker Desktop**
- **Docker Compose**（v2.0+）
- **Python**（3.9+），用于机器学习应用代码

### 可选但推荐
- **NVIDIA Docker**（GPU 支持）
- 带 Docker 扩展的 **Visual Studio Code**
- **Docker 镜像仓库账号**（Docker Hub 免费层）
- **GitHub 账号**（CI/CD 练习）

### 云平台集成
- **AWS ECR**——Elastic Container Registry
- **GCP GCR**——Google Container Registry / Artifact Registry
- **Azure ACR**——Azure Container Registry

## 常见陷阱与解决方案

### 陷阱 1：镜像过大
**问题：** 机器学习镜像常超过 5GB。
**方案：** 多阶段构建、精简基础镜像、层优化。
**目标：** CPU 镜像小于 500MB，GPU 镜像小于 2GB。

### 陷阱 2：构建缓存失效
**问题：** 微小代码变更导致所有层重新构建。
**方案：** 合理安排层顺序，单独安装依赖。
**影响：** 从 20 分钟构建缩短至 30 秒。

### 陷阱 3：GPU 无法访问
**问题：** 容器内出现 CUDA 错误。
**方案：** NVIDIA Container Toolkit、正确基础镜像、GPU 参数。
**验证：** 容器内 `nvidia-smi` 可正常运行。

### 陷阱 4：模型文件对镜像而言太大
**问题：** 10GB LLM 模型难以打包进镜像。
**方案：** 数据卷挂载、模型注册中心、启动时下载。
**替代方案：** 使用支持外部存储的模型服务平台。

### 陷阱 5：容器成为黑盒
**问题：** 无法调试容器内的问题。
**方案：** `docker exec`、`docker logs`、附加调试器。
**实践：** 学习 Docker 调试技术。

## 真实场景应用

### 场景 1：多模型服务平台
**挑战：** 提供 50 个具有不同依赖的模型服务。
**方案：** 每个模型使用隔离容器，通过 Docker Compose 编排。
**收益：** 避免版本冲突，独立扩缩容。

### 场景 2：可复现机器学习研究
**挑战：** 因环境差异导致论文结果不可复现。
**方案：** 发布包含确切依赖的 Docker 镜像。
**收益：** 其他人可以在兼容环境下复现结果。

### 场景 3：边缘 AI 部署
**挑战：** 在资源受限的边缘设备上部署模型。
**方案：** 高度优化的 Docker 镜像（小于 100MB）。
**收益：** 快速部署，资源使用量低。

### 场景 4：机器学习模型 CI/CD
**挑战：** 自动化模型测试与部署。
**方案：** CI/CD 流水线中使用 Docker 容器。
**收益：** 一致的测试与部署环境。

## 成功标准

能够完成以下任务时，你就掌握了模块 03：

- [ ] 为机器学习应用从零编写 Dockerfile。
- [ ] 为 CPU 工作负载构建小于 500MB 的镜像。
- [ ] 有效使用多阶段构建。
- [ ] 配置容器内 GPU 访问。
- [ ] 使用 Docker Compose 构建多容器应用。
- [ ] 从容器镜像仓库推送和拉取镜像。
- [ ] 高效调试容器问题。
- [ ] 将 Docker 集成至 CI/CD 工作流。
- [ ] 应用安全最佳实践（非 root 用户、扫描）。
- [ ] 使用层缓存优化构建时间。

## 时间估算

| 组成 | 预计时间 |
|---|---|
| 讲义（7 节） | 35 小时 |
| 练习（5 项） | 12–15 小时 |
| 测验 | 1–2 小时 |
| 实践评估 | 4–6 小时 |
| **总计** | **52–58 小时** |

**推荐节奏：**
- 兼职学习（每周 10 小时）：5–6 周。
- 全职学习（每周 40 小时）：1.5 周。

## 参考资料

**官方文档：**
- [Docker 文档](https://docs.docker.com/)
- [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/)

**其他资料：**
参见 `resources.md` 中的完整清单：
- 书籍和教程
- 视频课程
- 博客文章
- GitHub 仓库
- 社区论坛

## 下一步

完成模块 03 后：

1. **完成测验**，得分 ≥70%。
2. **完成实践评估**——构建生产级容器。
3. **选择你的路线：**
   - **模块 04：Kubernetes 基础**——大规模容器编排。
   - **模块 05：数据管道**——构建机器学习数据工作流。
   - **深入学习：高级 Docker**——安全、网络、优化。

## 学习建议

1. **迭代构建镜像**——第一次不必追求完美。
2. **仔细研究层缓存**——这是首要优化技术。
3. **认真使用 .dockerignore**——排除不必要文件。
4. **推送前本地测试**——确认镜像可用后再推送。
5. **学会阅读构建输出**——理解每个镜像层的作用。
6. **保留速查表**——记录机器学习常见 Dockerfile 模式。
7. **尝试 GPU 容器**——即使没有 GPU，也应理解相关概念。

---

**准备好进行容器化了吗？** 从[第 01 课：Docker 导论](./01-docker-introduction.md)开始。

**需要安装 Docker？** 查看[安装指南](https://docs.docker.com/get-docker/)。

**有问题？** 在 GitHub 仓库中创建 Issue 或 Discussion。
