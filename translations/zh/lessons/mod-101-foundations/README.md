# 模块 01：机器学习基础设施基础

**时长：** 40 小时
**难度：** 入门
**前置知识：** 基础 Python 编程、熟悉命令行

## 模块概览

欢迎进入 AI 基础设施工程学习旅程的第一个模块！本模块将建立机器学习基础设施职业生涯所需的基本概念、工具和实践方法。

你将学习什么是机器学习基础设施、它为何重要，以及如何搭建专业开发环境。完成本模块后，你将使用基础模型服务框架部署第一个机器学习模型。

## 学习成果

完成本模块后，你将能够：

1. **理解机器学习生命周期** — 解释从训练到生产环境的各个开发阶段。
2. **搭建开发环境** — 为机器学习基础设施工作配置 Python、Docker、Git 和云工具。
3. **部署第一个机器学习模型** — 使用 TorchServe 或 TensorFlow Serving 部署预训练模型。
4. **理解基础设施的作用** — 阐述基础设施如何支撑机器学习系统。
5. **使用机器学习框架** — 初步使用 PyTorch 和 TensorFlow。
6. **应用 MLOps 基础知识** — 理解关键 MLOps 概念及其重要性。

## 涵盖主题

### 1. 机器学习基础设施与 MLOps 导论

- 什么是机器学习基础设施？
- ML 工程与 ML 基础设施工程的区别。
- MLOps：定义、重要性和成熟度级别。
- 行业趋势与职业机会。

### 2. 机器学习生命周期

- 训练阶段：数据、模型开发、实验。
- 服务阶段：部署、推理、监控。
- 反馈闭环：性能追踪、重新训练。
- 基础设施在各阶段的作用。

### 3. 机器学习框架概览

- PyTorch：动态计算图，对研究友好。
- TensorFlow：静态计算图，面向生产环境优化。
- Hugging Face Transformers：预训练模型与生态系统。
- 何时选择哪种框架。

### 4. 开发环境搭建

- Python 3.9+ 与虚拟环境。
- 使用 Git 进行版本控制。
- Docker 基础及安装。
- 云平台配置（AWS/GCP/Azure）。
- 为机器学习工作配置 VS Code 或 PyCharm。

### 5. 云平台介绍

- 基础设施即服务（IaaS）与平台即服务（PaaS）。
- 主要云服务提供商：AWS、GCP、Azure。
- 机器学习核心服务：计算、存储、网络。
- 免费额度与成本管理基础。

### 6. 模型服务基础

- 什么是模型服务？
- 服务框架：TorchServe、TensorFlow Serving、FastAPI。
- 用于模型推理的 REST API。
- 同步与异步服务。

## 课程安排

### 第 01 课：机器学习基础设施导论（3 小时）

介绍该领域、职业发展路径与核心概念。

**阅读：** `01-introduction.md`
**练习：** 无（导入课程）。

### 第 02 课：环境搭建（5 小时）

动手安装全部开发工具并进行验证。

**阅读：** `02-environment-setup.md`
**练习：** `exercises/exercise-01-environment.md`

### 第 03 课：机器学习基础设施基础（4 小时）

深入理解机器学习生命周期和基础设施需求。

**阅读：** `03-ml-infrastructure-basics.md`
**练习：** `exercises/exercise-02-ml-lifecycle.md`

### 第 04 课：机器学习框架基础（6 小时）

从基础设施工程师的视角使用 PyTorch 和 TensorFlow。

**阅读：** `04-ml-frameworks.md`
**练习：** `exercises/exercise-03-frameworks.md`

### 第 05 课：云计算入门（5 小时）

云平台、云服务和首次部署。

**阅读：** `05-cloud-intro.md`
**练习：** `exercises/exercise-04-cloud.md`

### 第 06 课：模型服务基础（8 小时）

使用 TorchServe 或 TensorFlow Serving 部署第一个机器学习模型。

**阅读：** `06-model-serving.md`
**练习：** `exercises/exercise-05-serving.md`

### 第 07 课：容器化入门（6 小时）

Docker 基础及机器学习应用容器化。

**阅读：** `07-docker-basics.md`
**练习：** `exercises/exercise-06-docker.md`

### 第 08 课：机器学习 API 开发（5 小时）

使用 FastAPI 构建模型推理 REST API。

**阅读：** `08-api-development.md`
**练习：** `exercises/exercise-07-api.md`

## 动手活动

### 活动 1：搭建完整开发环境

安装并配置所有必要工具：Python、Git、Docker、云平台 CLI、VS Code。

**时间：** 3–4 小时
**交付物：** 所有工具均可正常使用的环境截图。

### 活动 2：部署预训练图像分类模型

使用 TorchServe 或 TensorFlow Serving 部署 ResNet 模型。

**时间：** 4–5 小时
**交付物：** 能够接收上传图像的可用模型服务。

### 活动 3：创建简单的模型推理 REST API

构建封装模型推理逻辑的 FastAPI 应用。

**时间：** 3–4 小时
**交付物：** 具有 `/predict` 端点及文档的 API。

### 活动 4：使用 Docker 将机器学习服务容器化

将 API 和模型打包进 Docker 容器。

**时间：** 2–3 小时
**交付物：** 可运行模型服务的 Docker 镜像。

## 能力评估

### 测验：机器学习基础设施概念与术语

**位置：** `quizzes/module-01-quiz.md`
**题目：** 20 道选择题与简答题。
**通过分数：** 70%（答对 14/20）。
**主题：** MLOps、机器学习生命周期、云基础、服务概念。

### 实践：部署并测试简单机器学习模型

**目标：** 部署预训练模型并演示推理。

**要求：**

1. 模型已部署，可通过 HTTP 访问。
2. 成功处理图像输入。
3. 返回预测结果及置信度分数。
4. 小图像响应时间小于 500ms。
5. 包含基本错误处理。

**提交物：** 包含代码、README 和演示视频或截图的 GitHub 仓库。

## 其他参考资料

### 推荐阅读

- **Andriy Burkov 的《Machine Learning Engineering》** — 第 1–2 章（生产环境中的机器学习）。
- **Google 的《Rules of Machine Learning》** — [最佳实践](https://developers.google.com/machine-learning/guides/rules-of-ml)。
- **MLOps 成熟度模型** — Microsoft 的框架。

### 视频教程

- **Full Stack Deep Learning** — 课程介绍和机器学习基础设施概览。
- **Andrew Ng 的 MLOps 专项课程** — 第一门课程（MLOps 导论）。

### 文档

- [PyTorch 文档](https://pytorch.org/docs/stable/index.html)
- [TensorFlow 文档](https://www.tensorflow.org/guide)
- [TorchServe 文档](https://pytorch.org/serve/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Docker 文档](https://docs.docker.com/)

### 交互式教程

- [Katacoda Docker 实践场景](https://www.katacoda.com/courses/docker)
- [Google Cloud Skills Boost](https://www.cloudskillsboost.google/paths)

完整参考资料清单见本目录下的 `resources.md`。

## 常见问题

**问：本模块需要 GPU 吗？**

答：不需要，CPU 足够。本模块将使用小模型与预训练权重，GPU 在后续模块才会变得重要。

**问：应该选择哪个云平台？**

答：AWS、GCP 或 Azure 均可。如果不确定，可以从 GCP（免费额度较充足）或 AWS（行业使用广泛）开始。也可以尝试多个平台。

**问：每课需要多长时间？**

答：预估时间仅供参考，根据你的背景，每课预计需要 3–8 小时。不要急于完成，深入理解概念。

**问：做练习卡住怎么办？**

答：检查解答目录、复习课程材料、搜索官方文档，并在 GitHub Discussions 提问。学习调试和寻找解决方案本身就是能力培养的一部分。

**问：如果已经安装 Python/Docker，可以跳过环境搭建吗？**

答：仍然应检查环境搭建课程，确保你的环境符合课程要求。缺失依赖会导致后续模块出现问题。

## 学习建议

1. **动手实践必不可少** — 不要只阅读，亲自输入代码并运行示例。
2. **记录学习过程** — 记录命令、错误与解决方案。
3. **建立作品集** — 将所有练习代码保存到个人 GitHub 仓库。
4. **加入社区** — 与其他学习者交流，互相支持并分享知识。
5. **适当休息** — 机器学习基础设施概念可能较为密集，暂时离开后再以清醒的状态回来学习。
6. **主动提问** — 没有过于基础的问题，理解基础至关重要。

## 模块前置条件检查

开始前请确认：

- [ ] 电脑具有 8GB 以上内存和 20GB 以上可用磁盘空间。
- [ ] Linux、macOS 或带 WSL2 的 Windows。
- [ ] 拥有安装软件所需的管理员或 sudo 权限。
- [ ] 可用于下载和访问云服务的互联网连接。
- [ ] 用于代码仓库的 GitHub 账号。
- [ ] 文本编辑器（推荐 VS Code）。
- [ ] Python 基础知识（函数、类、导入）。
- [ ] 熟悉命令行（cd、ls、mkdir、cat）。

如果缺少任何前置条件，请在开始第 01 课前解决。

## 下一步

完成本模块后：

1. **参加模块测验** — 验证理解程度。
2. **完成实践评估** — 部署可用模型。
3. **审查自己的成果** — 确保代码质量和文档完整。
4. **进入模块 02** — 面向机器学习的云计算（更深入的云平台技能）。

---

**准备好了吗？** 从 `01-introduction.md` 开始机器学习基础设施学习之旅！

**有问题或反馈？** 在 GitHub 仓库中提交 Issue。
