# 模块 00：你与模型的关系

> **角色：** AI 基础设施工程师 · **组织：** AI 基础设施课程体系 · **级别：** L20

AI Career Curriculum 中的每个角色都围绕同一个对象——模型——开展工作，但各自的切入角度不同。在进入技术模块之前，本章先帮助你理解自己的位置、负责的工作，以及需要依赖哪些角色。

## 你的位置

你的工作是**运行模型**：保证模型可用、快速且成本合理。

对你而言，模型是一种工作负载。它需要 GPU、内存、网络、存储和推理服务栈，并且必须在真实流量下达到延迟、可用性和成本目标。你很少直接改变模型说什么；你改变的是模型能否提供响应、响应速度以及响应成本。

## 六种与模型的关系

| 组织 | 与模型的关系 |
| --- | --- |
| [AI Workforce](https://github.com/ai-workforce-curriculum) | **与模型协作**：指导模型、检查输出，并围绕它重新设计自己的工作。 |
| [AI Startup](https://github.com/ai-startup-curriculum) | **围绕模型建立公司**：决定模型用于什么、谁会为它付费。 |
| [AI Governance](https://github.com/ai-governance-curriculum) | **治理并保障模型**：判断用途是否可接受，并证明它持续符合要求。 |
| [AI Engineering](https://github.com/ai-engineering-curriculum) | **利用模型构建应用**：将模型转化为人们使用的产品与 Agent。 |
| [ML Engineering](https://github.com/ml-engineering-curriculum) | **构建并训练模型**：决定模型学习什么。 |
| [AI Infrastructure](https://github.com/AI-Infra-Curriculum)（当前位置） | **运行模型**：保证模型可用、快速且成本合理。 |

## 你负责什么

- **计算资源**：GPU 和加速器容量、集群、调度与配额。
- **模型服务**：推理引擎、批处理、自动扩缩容、路由与发布。
- **管道与平台**：训练及评估任务运行所依赖的基础设施。
- **可靠性**：AI 系统的 SLO、可观测性、值班和故障响应。
- **成本**：基础设施账单及影响成本的各项因素。

**你不负责的事项：** 模型使用什么数据训练、产品要求模型完成什么任务，以及某种用途是否被允许。你为负责这些事项的人员提供所需的平台与数据，帮助他们做出决策。

## 你与谁合作

下表每行对应一个同级课程组织：你提供什么、对方提供什么，以及最可能与你合作的相近级别角色。

| 组织 | 你向对方提供 | 对方向你提供 | 对应角色 |
| --- | --- | --- | --- |
| AI Workforce | 可靠、快速、文档完善且限制明确的 AI 工具，避免停机或限流打断日常工作 | 实际使用模式与痛点，包括延迟、限流和停机 | [AI 辅助软件工程师](https://github.com/ai-workforce-curriculum/ai-assisted-software-engineer-learning) |
| AI Startup | 单位经济性：每次请求、每位用户或客户的服务成本，以及规模变化带来的成本变化 | 增长预测、成本目标和可靠性承诺，作为平台预算的依据 | [联合创始人 / CTO](https://github.com/ai-startup-curriculum/cto-curriculum) |
| AI Governance | 审计日志、访问控制、数据驻留保障，以及控制措施在生产环境中实际运行的证据 | 日志、访问、保留、驻留等控制要求及所需证据 | [AI 治理分析师](https://github.com/ai-governance-curriculum/ai-governance-analyst-learning) |
| AI Engineering | 延迟、吞吐、限流和单次调用成本明确的模型服务端点，以及排查问题所需的遥测数据 | 流量特征、延迟预算和模型组合需求，使容量与路由符合产品的实际调用方式 | [Agentic AI 开发工程师](https://github.com/ai-engineering-curriculum/agentic-ai-developer-learning) |
| ML Engineering | 训练和微调集群、实验与产物存储，以及模型进入生产环境的途径 | 资源特征明确的模型产物（内存、吞吐、精度）及需要调度的训练任务 | [机器学习工程师](https://github.com/ml-engineering-curriculum/ml-engineer-learning) |

## 职业进阶路径

- **前一阶段：** [初级 AI 基础设施工程师](https://github.com/AI-Infra-Curriculum/ai-infra-junior-engineer-learning)。
- **后一阶段：** [AI/ML 平台工程师](https://github.com/AI-Infra-Curriculum/ai-infra-ml-platform-learning)、[MLOps 工程师](https://github.com/AI-Infra-Curriculum/ai-infra-mlops-learning)、[高级 AI 基础设施工程师](https://github.com/AI-Infra-Curriculum/ai-infra-senior-engineer-learning)。

## 场景：一次模型升级，六个组织

供应商发布了新版本模型，并将在 90 天后停用生产环境正在使用的旧版本。没有任何一个组织独自负责整个升级过程。六个组织的分工如下：

1. **AI Workforce：** 重新检查基于旧模型建立的日常工作流（提示词、审核习惯、团队操作手册），识别输出质量变化，并更新实际使用的指导规范。
2. **AI Startup：** 根据成本、客户承诺和产品路线图，决定当前是否值得升级，并向客户说明变化及时间。
3. **AI Governance：** 对新版本重新运行风险与安全评估，更新模型清单和文档，批准或阻止发布。
4. **AI Engineering：** 重新运行产品评估，调整出现退化的提示词和工具定义，使用功能开关逐步发布，并保留回滚路径。
5. **ML Engineering：** 重新验证依赖旧模型的微调、蒸馏或自研模型，并使用团队自己的数据评测新版本。
6. **AI Infrastructure（你的职责）：** 建立新版本的推理服务，规划 GPU 容量或限流额度，逐步迁移流量，并观察延迟、错误率和成本仪表盘。

如果其中任意一项被忽略，升级就可能以其他组织难以察觉的方式失败。理解哪一项是你的职责，以及相邻职责由谁负责，正是本模块的目的。

## 继续之前

完成 [练习 01：绘制模型职责边界](exercises/exercise-01-map-your-model-boundary.md)，随后通过[课程大纲](../../CURRICULUM.md)进入第一个技术模块。
