# 模块 06：MLOps 与实验追踪 — 学习资源

## 概览
本文精选学习资源，帮助你深入理解本模块涉及的 MLOps 概念、工具和最佳实践。

---

## 📚 必读资料

### 书籍

1. **《Introducing MLOps》（MLOps 入门）**，作者：Mark Treveil 等人
   - 全面的 MLOps 实践指南
   - 真实案例研究
   - 工具推荐
   - [O'Reilly](https://www.oreilly.com/library/view/introducing-mlops/9781492083283/)

2. **《Machine Learning Design Patterns》（机器学习设计模式）**，作者：Valliappa Lakshmanan, Sara Robinson, Michael Munn
   - 生产级 ML 系统的设计模式
   - 来自 Google 的最佳实践
   - [O'Reilly](https://www.oreilly.com/library/view/machine-learning-design/9781098115777/)

3. **《Building Machine Learning Powered Applications》（构建机器学习驱动的应用）**，作者：Emmanuel Ameisen
   - 端到端 ML 产品开发
   - 实用部署策略
   - [O'Reilly](https://www.oreilly.com/library/view/building-machine-learning/9781492045106/)

4. **《Reliable Machine Learning》（可靠机器学习）**，作者：Cathy Chen, Niall Murphy, 等人
   - 适用于 ML 系统的 SRE 原则
   - 生产环境可靠性模式
   - [O'Reilly](https://www.oreilly.com/library/view/reliable-machine-learning/9781098106218/)

### 研究论文

1. **《机器学习系统中的隐性技术债务》** (2015)
   - 识别机器学习特有的技术债务
   - MLOps 从业者必读
   - [NeurIPS](https://papers.nips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf)

2. **《机器学习：技术债务的高息信用卡》** (2014)
   - Google 处理 ML 技术债务的经验
   - [Google Research](https://research.google/pubs/pub43146/)

3. **《用于模型报告的模型卡》** (2019)
   - 模型文档框架
   - 透明度与问责
   - [arXiv](https://arxiv.org/abs/1810.03993)

4. **《高风险 AI 中的数据级联效应》** (2021)
   - 数据质量对 ML 系统的重要性
   - [ACM CHI](https://dl.acm.org/doi/10.1145/3411764.3445518)

---

## 🛠️ 工具与平台

### 实验追踪

1. **MLflow**
   - [文档](https://mlflow.org/docs/latest/index.html)
   - [GitHub](https://github.com/mlflow/mlflow)
   - [教程](https://mlflow.org/docs/latest/tutorials-and-examples/index.html)
   - 开源，不依赖特定平台

2. **Weights & Biases**
   - [文档](https://docs.wandb.ai/)
   - [教程](https://wandb.ai/site/tutorials)
   - [博客](https://wandb.ai/fully-connected)
   - 出色的可视化与协作功能

3. **Neptune.ai**
   - [文档](https://docs.neptune.ai/)
   - [示例](https://docs.neptune.ai/examples/)
   - 专注于元数据管理

### 特征存储

1. **Feast**
   - [文档](https://docs.feast.dev/)
   - [GitHub](https://github.com/feast-dev/feast)
   - [教程](https://docs.feast.dev/tutorials/tutorials-overview)
   - 开源，不依赖特定云平台

2. **Tecton**
   - [文档](https://docs.tecton.ai/)
   - [博客](https://www.tecton.ai/blog/)
   - 企业级特征平台

3. **Hopsworks**
   - [文档](https://docs.hopsworks.ai/)
   - [教程](https://docs.hopsworks.ai/latest/tutorials/)
   - 完整的 ML 平台

### 模型服务

1. **TorchServe**
   - [文档](https://pytorch.org/serve/)
   - [GitHub](https://github.com/pytorch/serve)
   - PyTorch 模型服务

2. **TensorFlow Serving**
   - [文档](https://www.tensorflow.org/tfx/guide/serving)
   - [GitHub](https://github.com/tensorflow/serving)
   - TensorFlow 模型服务

3. **NVIDIA Triton Inference Server**
   - [文档](https://docs.nvidia.com/deeplearning/triton-inference-server/)
   - [GitHub](https://github.com/triton-inference-server/server)
   - 支持多种框架

4. **KServe（原 KFServing）**
   - [文档](https://kserve.github.io/website/)
   - [GitHub](https://github.com/kserve/kserve)
   - Kubernetes 原生模型服务

### 面向 ML 的 CI/CD

1. **GitHub Actions**
   - [ML 工作流](https://github.com/machine-learning-apps/actions-ml-cicd)
   - [文档](https://docs.github.com/en/actions)

2. **GitLab CI/CD**
   - [文档](https://docs.gitlab.com/ee/ci/)
   - [ML 使用案例](https://about.gitlab.com/blog/2021/05/17/ci-cd-with-ml/)

3. **DVC（数据版本控制）**
   - [文档](https://dvc.org/doc)
   - [GitHub](https://github.com/iterative/dvc)
   - 数据与模型版本管理

---

## 🎓 在线课程

### 免费课程

1. **Made With ML — MLOps 课程**
   - [课程链接](https://madewithml.com/)
   - 全面而实用的 MLOps
   - 免费且开源

2. **Full Stack Deep Learning（全栈深度学习）**
   - [课程链接](https://fullstackdeeplearning.com/)
   - 生产级 ML 系统
   - 免费讲义及资料

3. **MLOps.org 资源**
   - [网站](https://ml-ops.org/)
   - 社区驱动的资源
   - 最佳实践与模式

4. **Google Cloud MLOps**
   - [课程](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
   - MLOps 成熟度模型
   - 架构模式

### 付费课程

1. **生产级机器学习工程（MLOps）专项课程**
   - [Coursera - DeepLearning.AI](https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops)
   - 吴恩达的 MLOps 课程
   - 包含 4 门课的专项课程

2. **MLOps — 机器学习运维专项课程**
   - [Coursera - Duke University](https://www.coursera.org/specializations/mlops-machine-learning-duke)
   - MLOps 实际实施

3. **实用 MLOps：将机器学习投入运营**
   - [LinkedIn Learning](https://www.linkedin.com/learning/practical-mlops-operationalizing-machine-learning)
   - MLOps 动手实践

---

## 📝 博客与文章

### 企业工程博客

1. **Netflix 技术博客 — ML 基础设施**
   - [博客](https://netflixtechblog.com/)
   - 搜索：“ML”、“experimentation”、“A/B testing”
   - 真实的大规模系统挑战

2. **Uber 工程博客 — Michelangelo**
   - [博客](https://www.uber.com/blog/engineering/)
   - ML 平台架构
   - 特征存储实现

3. **Airbnb 工程博客**
   - [博客](https://medium.com/airbnb-engineering)
   - ML 基础设施文章
   - 实验平台

4. **LinkedIn 工程博客**
   - [博客](https://engineering.linkedin.com/)
   - 大规模生产级 ML

5. **Spotify 工程博客**
   - [博客](https://engineering.atspotify.com/)
   - ML 平台与推荐系统

### 个人博客

1. **Eugene Yan — 应用机器学习**
   - [博客](https://eugeneyan.com/)
   - 实用的 ML 工程见解
   - 面向 ML 的系统设计

2. **Chip Huyen — ML 系统**
   - [博客](https://huyenchip.com/blog/)
   - 生产级 ML 最佳实践
   - 《Designing Machine Learning Systems》（设计机器学习系统）的作者

3. **MLOps Community**
   - [网站](https://mlops.community/)
   - 社区资源
   - 播客和视频

---

## 🎥 视频内容

### YouTube 频道

1. **MLOps Community**
   - [频道](https://www.youtube.com/@mlopscommunity)
   - 演讲与教程
   - 社区聚会

2. **Weights & Biases**
   - [频道](https://www.youtube.com/@WeightsBiases)
   - MLOps 教程
   - 专家访谈

3. **Neptune.ai**
   - [频道](https://www.youtube.com/@neptune_ai)
   - ML 实验追踪
   - 最佳实践

### 会议演讲

1. **MLOps World**
   - [网站](https://mlopsworld.com/)
   - 年度会议
   - 提供会议录像

2. **Applied ML Summit**
   - [往期演讲](https://www.youtube.com/c/AppliedMLSummit)
   - 生产级 ML 挑战

3. **MLSys 会议**
   - [会议论文集](https://mlsys.org/)
   - ML 系统的学术研究

---

## 🧪 动手实践

### 交互式教程

1. **MLflow 示例**
   - [GitHub](https://github.com/mlflow/mlflow/tree/master/examples)
   - 可直接运行的示例
   - 多种框架

2. **Feast 教程**
   - [Feast 快速入门](https://docs.feast.dev/getting-started/quickstart)
   - [研讨会资料](https://github.com/feast-dev/feast-workshop)

3. **DVC 教程**
   - [快速开始](https://dvc.org/doc/start)
   - [使用案例](https://dvc.org/doc/use-cases)

### 示例项目

1. **全栈 ML 项目模板**
   - [GitHub](https://github.com/full-stack-deep-learning/fsdl-text-recognizer-2022)
   - 完整的 MLOps 配置
   - 最佳实践

2. **MLOps-Basics**
   - [GitHub](https://github.com/graviraja/MLOps-Basics)
   - 分步骤实施 MLOps
   - 10 周课程

3. **Awesome MLOps**
   - [GitHub](https://github.com/visenger/awesome-mlops)
   - 精选 MLOps 资源列表
   - 工具与框架

---

## 📊 案例研究

### 行业案例研究

1. **Uber — Michelangelo：ML 平台**
   - [文章](https://www.uber.com/blog/michelangelo-machine-learning-platform/)
   - 端到端 ML 平台
   - 规模：数千个模型

2. **Netflix — ML 基础设施**
   - [多篇文章](https://netflixtechblog.com/tagged/machine-learning)
   - 实验平台
   - 推荐系统

3. **Airbnb — ML 基础设施**
   - [Bighead：Airbnb 的 ML 平台](https://medium.com/airbnb-engineering/bighead-airbnbs-end-to-end-machine-learning-platform-8b08ea9f65e2)
   - 特征存储：Zipline

4. **LinkedIn — Pro-ML：生产级 ML 基础设施**
   - [博客文章](https://engineering.linkedin.com/blog/2019/01/scaling-machine-learning-productivity-at-linkedin)
   - 特征存储实现

---

## 🔧 工具对比

### 特征存储对比

| 特性 | Feast | Tecton | Hopsworks | AWS Feature Store |
|---------|-------|--------|-----------|-------------------|
| **类型** | 开源 | 商业 | 开源/商业 | 云服务 |
| **部署** | 自托管 | 托管 | 自托管/托管 | 仅 AWS |
| **流式处理** | 有限 | 支持 | 支持 | 支持 |
| **转换** | 有限 | 丰富 | 丰富 | 有限 |
| **适用场景** | 入门 | 企业 | 完整平台 | AWS 用户 |

### 实验追踪对比

| 特性 | MLflow | W&B | Neptune.ai | Comet ML |
|---------|--------|-----|------------|----------|
| **类型** | 开源 | 商业 | 商业 | 商业 |
| **自托管** | 支持 | 不支持 | 不支持 | 不支持 |
| **可视化** | 基础 | 优秀 | 良好 | 良好 |
| **协作** | 有限 | 优秀 | 良好 | 良好 |
| **适用场景** | 开源需求 | 团队 | 元数据管理 | 研究团队 |

---

## 🎯 学习路线建议

### 入门路线（1–2 个月）
1. 从 MLflow 教程入手
2. 读完《Introducing MLOps》
3. 构建使用 MLflow 追踪实验的示例项目
4. 使用 GitHub Actions 学习基础 CI/CD
5. 使用 Docker 部署简单模型

### 进阶路线（2–3 个月）
1. 使用 Feast 实现特征存储
2. 构建完整的 ML CI/CD 管道
3. 学习《Machine Learning Design Patterns》
4. 实现 A/B 测试框架
5. 添加监控和告警

### 高级路线（3–6 个月）
1. 设计 ML 平台架构
2. 实现持续训练
3. 研究科技公司的 ML 平台论文
4. 构建自定义 MLOps 工具
5. 针对规模和成本进行优化

---

## 🌐 社区与论坛

1. **MLOps Community Slack**
   - [加入](https://mlops.community/)
   - 活跃的讨论
   - 求职机会

2. **Reddit - r/mlops**
   - [子版块](https://www.reddit.com/r/mlops/)
   - 问题与讨论

3. **Stack Overflow**
   - 标签: `mlops`, `mlflow`, `kubeflow`
   - 技术问答

4. **LinkedIn 群组**
   - MLOps Community
   - 机器学习工程师

---

## 📈 跟进最新进展

### 新闻简报

1. **MLOps Newsletter**
   - 每周 MLOps 更新
   - 工具公告

2. **DeepLearning.AI 的 The Batch**
   - 每周 AI 新闻
   - 包含 MLOps 主题

3. **Andriy Burkov 的 ML News**
   - 每周 ML 更新

### 播客

1. **MLOps.community Podcast**
   - 从业者访谈
   - 真实实践经验

2. **Practical AI**
   - 应用 ML 主题
   - 定期发布 MLOps 节目

3. **The TWIML AI Podcast**
   - ML 与 AI 新闻
   - 行业专家

---

## 🔍 可继续探索的主题

掌握本模块后，可以考虑探索：

1. **高级主题**
   - 模型优化（量化、剪枝）
   - 分布式训练
   - 多模型推理优化
   - 实时特征计算

2. **专项领域**
   - 自然语言处理领域的 MLOps
   - 计算机视觉领域的 MLOps
   - 强化学习领域的 MLOps
   - 边缘 ML 部署

3. **企业关注事项**
   - ML 治理框架
   - 法规合规（GDPR、CCPA）
   - 模型可解释性
   - 偏差与公平性测试

---

## 📝 推荐学习计划

### 第 1–2 周：基础
- MLflow 教程
- 实验追踪实践
- 阅读《Introducing MLOps》（第 1–4 章）

### 第 3–4 周：特征工程
- Feast 教程
- 特征存储实现
- 阅读设计模式书籍

### 第 5–6 周：CI/CD
- 构建 CI/CD 管道
- 自动化测试
- 部署自动化

### 第 7–8 周：生产部署
- 配置模型服务
- 实现监控
- A/B 测试框架

### 第 9–10 周：最佳实践
- 模型治理
- 文档
- 技术债务审查

---

## 🎓 认证

可以考虑以下认证来验证所学知识：

1. **TensorFlow 认证**
   - [Google Developers](https://www.tensorflow.org/certificate)
   - 包含部署相关主题

2. **AWS 机器学习专项认证**
   - 包含 AWS 上的 MLOps

3. **Microsoft Azure AI 工程师助理认证**
   - Azure ML 与 MLOps

4. **Google Cloud 专业机器学习工程师认证**
   - 全面的 ML 工程知识

---

## 📞 获取帮助

如果在学习本模块期间遇到问题：

1. 查看课程中的练习和示例
2. 查阅工具的官方文档
3. 使用具体错误信息在 Stack Overflow 搜索
4. 在 MLOps Community Slack 中提问
5. 查看相关工具的 GitHub Issues

---

## ✨ 贡献

发现我们遗漏的优质资源了吗？欢迎贡献：
- 提交包含新增资源的拉取请求
- 确保资源与 MLOps 相关
- 附上简短介绍以及资源的价值

---

**最后更新:** 2024-01-15

学习愉快！🚀
