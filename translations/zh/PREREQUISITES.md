# AI 基础设施工程师课程前置知识

本课程面向希望将 AI 基础设施技能提升至中级专业水平的工程师。开始之前，请确保具备必要基础。

---

## 🎯 快速评估

**已经完成初级 AI 基础设施工程师课程？** ✅ 你已经可以开始！

**尚未完成初级课程？** → 使用下方的自我评估来检查准备程度。

---

## 选项 1：完成初级课程（推荐）

[**初级 AI 基础设施工程师**](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning) 课程提供本工程师级别课程所需的全部前置知识。

### 模块直接映射

本工程师课程的每项前置要求都包含在初级课程中：

| 工程师课程前置要求 | 初级模块 | 小时 | 学习内容 |
|-----------------------|---------------|-------|-------------------|
| **Python 3.9+（中级）** | [模块 001：Python 基础](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-001-python-fundamentals) | 15h | OOP、类型提示、测试、错误处理、装饰器、上下文管理器 |
| **Linux/Unix 命令行基础** | [模块 002：Linux 基础](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-002-linux-essentials) | 15h | CLI 导航、Bash 脚本、进程、SSH、网络、系统管理 |
| **Git 基础** | [模块 003：Git 与版本控制](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-003-git-version-control) | 10h | 分支、合并、变基、协作工作流、GitHub/GitLab |
| **ML 基本概念** | [模块 004：ML 基础](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-004-ml-basics) | 20h | PyTorch、TensorFlow、训练、推理、评估、模型导出 |
| **Docker 基础** | [模块 005：Docker 与容器化](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-005-docker-containers) | 15h | Docker 镜像、容器、多阶段构建、Docker Compose |
| **Kubernetes 入门** | [模块 006：Kubernetes 入门](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-006-kubernetes-intro) | 20h | Pod、Deployment、Service、ConfigMap、Secret、基本操作 |
| **API 开发** | [模块 007：API 与 Web 服务](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-007-apis-web-services) | 15h | REST API、FastAPI、Flask、身份验证、测试 |
| **数据库基础** | [模块 008：数据库与 SQL](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-008-databases-sql) | 15h | SQL 基础、PostgreSQL、Redis、数据建模 |
| **监控基础** | [模块 009：监控与日志](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-009-monitoring-basics) | 15h | Prometheus、Grafana、日志、告警基础 |
| **云平台** | [模块 010：云平台](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-010-cloud-platforms) | 20h | AWS、GCP、Azure 基础——虚拟机、存储、网络 |

**初级课程总时长**：440 小时（兼职学习 22 周，全职学习 11 周）

### 为什么先完成初级课程？

1. **全面覆盖**：所有前置知识均有动手实践
2. **建立作品集**：5 个可写入简历的项目
3. **就业技能**：使你具备入门级 AI 基础设施职位所需的能力
4. **平稳过渡**：专为本工程师课程做准备
5. **没有知识缺口**：确保具备全部基础知识

### 开始初级课程

```bash
# Clone the Junior repository
git clone https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning.git
cd ai-infra-junior-engineer-learning

# Follow the getting started guide
cat GETTING_STARTED.md
```

---

## 选项 2：自我评估清单

如果未完成初级课程，请验证自己能否执行以下全部任务。缺少任何一项技能？→ 请先完成对应的初级模块。

### Python 技能 ✅

**适用于**：全部工程师模块

- [ ] 编写具有 OOP、类型提示和全面文档字符串的生产级 Python 代码
- [ ] 使用 async/await 进行并发编程
- [ ] 使用 pytest 编写全面的单元测试（覆盖率 80% 以上）
- [ ] 使用虚拟环境（venv、conda）与依赖管理
- [ ] 理解并使用装饰器、上下文管理器和生成器
- [ ] 分析及优化 Python 代码性能
- [ ] 使用自定义异常优雅地处理错误
- [ ] 使用 Python dataclass 与 Pydantic 进行验证

**自测**：
```python
# Can you build a production-quality REST API with:
# - Type hints throughout
# - Async endpoints
# - Error handling
# - Comprehensive tests
# - Pydantic validation?
```

**缺少技能？** → [初级模块 001](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-001-python-fundamentals)

---

### Linux/Unix 技能 ✅

**适用于**：云计算、容器化、Kubernetes、全部部署模块

- [ ] 高效使用 Linux CLI 导航及操作（cd、ls、grep、sed、awk、find）
- [ ] 编写用于自动化的 Bash 脚本（循环、条件、函数）
- [ ] 管理进程（ps、top、htop、kill、systemctl）
- [ ] 理解文件权限和所有权（chmod、chown）
- [ ] 配置 SSH 密钥和安全远程访问
- [ ] 使用日志排查系统问题（/var/log、journalctl）
- [ ] 使用包管理器（apt、yum、brew）
- [ ] 理解环境变量与 PATH

**自测**：
```bash
# Can you write a bash script that:
# - Monitors system resources
# - Logs to syslog
# - Handles errors gracefully
# - Runs as a systemd service?
```

**缺少技能？** → [初级模块 002](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-002-linux-essentials)

---

### Git 与版本控制技能 ✅

**适用于**：全部模块（尤其是 IaC、MLOps、CI/CD）

- [ ] 使用 Git 工作流（功能分支、拉取请求）
- [ ] 熟练进行分支、合并和变基
- [ ] 解决合并冲突
- [ ] 理解 Git 内部机制（commit、tree、blob、ref）
- [ ] 使用 GitHub/GitLab 进行协作及代码审查
- [ ] 遵循约定式提交及语义化版本控制
- [ ] 理解 GitOps 原则
- [ ] 使用 Git Hook 实现自动化

**自测**：
```bash
# Can you:
# - Set up a GitOps workflow with ArgoCD?
# - Implement pre-commit hooks?
# - Manage multiple release branches?
```

**缺少技能？** → [初级模块 003](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-003-git-version-control)

---

### 机器学习技能 ✅

**适用于**：全部模块（所有 AI 基础设施工作的基础）

- [ ] 使用 PyTorch 或 TensorFlow 训练基本模型
- [ ] 理解训练集、验证集与测试集划分
- [ ] 执行模型评估（准确率、精确率、召回率、F1、AUC）
- [ ] 导出并加载已训练模型（检查点、ONNX）
- [ ] 理解过拟合、欠拟合与正则化
- [ ] 使用数据加载器和预处理流水线
- [ ] 排查训练问题（损失不下降、NaN）
- [ ] 理解基本神经网络架构

**自测**：
```python
# Can you:
# - Train a CNN for image classification?
# - Implement custom loss functions?
# - Use transfer learning?
# - Export model for production serving?
```

**缺少技能？** → [初级模块 004](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-004-ml-basics)

---

### Docker 与容器化技能 ✅

**适用于**：容器化、Kubernetes、MLOps、全部部署模块

- [ ] 使用 Dockerfile 构建 Docker 镜像
- [ ] 使用多阶段构建进行优化
- [ ] 使用卷挂载及端口映射运行容器
- [ ] 使用 Docker Compose 运行多服务应用
- [ ] 理解容器网络（bridge、host、overlay）
- [ ] 管理容器资源（CPU、内存限制）
- [ ] 排查容器问题（logs、exec、inspect）
- [ ] 理解容器安全基础（用户命名空间、只读文件系统）

**自测**：
```bash
# Can you:
# - Build optimized ML serving container (<500MB)?
# - Set up multi-container app with Docker Compose?
# - Implement health checks and auto-restart?
```

**缺少技能？** → [初级模块 005](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-005-docker-containers)

---

### Kubernetes 技能 ✅

**适用于**：Kubernetes、MLOps、监控模块

- [ ] 将应用部署到 Kubernetes
- [ ] 理解 Pod、Deployment、Service、Ingress
- [ ] 使用 ConfigMap 和 Secret 进行配置
- [ ] 排查 Pod 问题（logs、describe、exec、port-forward）
- [ ] 理解基本资源管理（requests、limits）
- [ ] 高效使用 kubectl
- [ ] 理解 Kubernetes 网络基础
- [ ] 部署多层应用

**自测**：
```bash
# Can you:
# - Deploy ML model API to Kubernetes?
# - Set up horizontal pod autoscaling?
# - Configure ingress for external access?
# - Debug pod startup failures?
```

**缺少技能？** → [初级模块 006](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-006-kubernetes-intro)

---

### API 开发技能 ✅

**适用于**：基础知识、MLOps、LLM 基础设施模块

- [ ] 使用 FastAPI 或 Flask 构建 REST API
- [ ] 实现身份验证和授权
- [ ] 编写 API 测试（单元和集成）
- [ ] 生成 OpenAPI/Swagger 文档
- [ ] 实现限流和缓存
- [ ] 正确处理错误与验证
- [ ] 使用异步端点支持高并发
- [ ] 将 API 部署到生产环境

**自测**：
```python
# Can you build an API that:
# - Serves ML model predictions?
# - Has authentication (JWT)?
# - Includes comprehensive tests?
# - Has auto-generated docs?
```

**缺少技能？** → [初级模块 007](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-007-apis-web-services)

---

### 数据库技能 ✅

**适用于**：数据流水线、MLOps 模块

- [ ] 编写复杂 SQL 查询（连接、聚合、子查询）
- [ ] 设计规范化数据库 Schema
- [ ] 在生产环境使用 PostgreSQL 或 MySQL
- [ ] 理解索引与查询优化
- [ ] 使用 Redis 实现缓存
- [ ] 执行数据库迁移
- [ ] 实现连接池
- [ ] 理解 ACID 属性及事务

**自测**：
```sql
-- Can you:
-- - Design schema for ML experiment tracking?
-- - Optimize slow queries?
-- - Implement caching strategy?
```

**缺少技能？** → [初级模块 008](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-008-databases-sql)

---

### 监控与日志技能 ✅

**适用于**：监控与可观测性模块

- [ ] 配置 Prometheus 进行指标采集
- [ ] 创建 Grafana 仪表盘
- [ ] 实现应用日志（结构化日志）
- [ ] 基于指标配置告警
- [ ] 理解指标类型（Counter、Gauge、Histogram）
- [ ] 使用日志与指标排查问题
- [ ] 实现日志聚合
- [ ] 理解可观测性的基本概念

**自测**：
```bash
# Can you:
# - Set up Prometheus + Grafana for ML API?
# - Create custom metrics for model performance?
# - Configure alerts for service downtime?
```

**缺少技能？** → [初级模块 009](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-009-monitoring-basics)

---

### 云平台技能 ✅

**适用于**：云计算、全部部署模块

- [ ] 在 AWS/GCP/Azure 上部署虚拟机及存储
- [ ] 使用云 CLI 工具（aws-cli、gcloud、az）
- [ ] 理解云网络（VPC、子网、安全组）
- [ ] 将容器化应用部署到云端
- [ ] 监控云资源与成本
- [ ] 使用托管服务（RDS、Cloud SQL、S3、GCS）
- [ ] 实现基本 IAM（用户、角色、策略）
- [ ] 理解云定价模式

**自测**：
```bash
# Can you:
# - Deploy Kubernetes cluster to cloud?
# - Set up VPC with public/private subnets?
# - Implement cost monitoring and alerts?
```

**缺少技能？** → [初级模块 010](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning/tree/main/lessons/mod-010-cloud-platforms)

---

## 选项 3：替代学习路径

### 如果你有行业经验

具备相关领域 **1–2 年**经验的工程师可能可以跳过某些初级模块：

#### DevOps/SRE 背景
**可能跳过**：初级模块 002、003、005（Linux、Git、Docker）
**应复习**：模块 004、006、009（ML 基础、Kubernetes、监控）
**必须完成**：模块 001、007、008（面向 ML 的 Python、API、数据库）

#### 后端开发背景
**可能跳过**：初级模块 001、003、007、008（Python、Git、API、数据库）
**应复习**：模块 005、006、009（Docker、Kubernetes、监控）
**必须完成**：模块 002、004（Linux、ML 基础）

#### 数据工程背景
**可能跳过**：初级模块 001、008、009（Python、数据库、监控）
**应复习**：模块 002、003、005（Linux、Git、Docker）
**必须完成**：模块 004、006（ML 基础、Kubernetes）

#### ML/数据科学背景
**可能跳过**：初级模块 004（ML 基础）
**应复习**：模块 001、007（面向基础设施的 Python、API）
**必须完成**：模块 002、003、005、006、009（Linux、Git、Docker、Kubernetes、监控）

**建议**：即使拥有经验，也应复习全部初级模块，确保没有知识缺口。初级课程特别关注 AI/ML 基础设施，这可能与通用软件工程不同。

---

## 推荐学习计划

### 计划 A：快速路线（具备大多数前置知识）
**时长**：4–6 周

**第 1 周**：使用上述清单自我评估
**第 2 周**：完成缺失的初级模块
**第 3 周**：复习初级项目并动手实践
**第 4 周**：快速复习薄弱领域
**第 5–6 周**：开始工程师模块 101（基础知识）

**最适合**：具有 1–2 年 DevOps/ML 经验的工程师

---

### 计划 B：标准路线（先完成初级课程）
**时长**：22–24 周

**第 1–22 周**：完成全部初级课程（440 小时）
**第 23 周**：构建综合项目并完善作品集
**第 24 周**：开始工程师模块 101（基础知识）

**最适合**：转行人员、训练营毕业生、近期计算机专业毕业生

---

### 计划 C：兼职路线（在职人员）
**时长**：44–48 周

**第 1–44 周**：兼职完成初级课程（每周 10 小时）
**第 45–47 周**：构建综合项目
**第 48 周**：开始工程师课程

**最适合**：利用晚上和周末学习的在职人员

---

## 自动化技能评估

### 运行自我评估工具

```bash
# Clone Junior repository
git clone https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning.git
cd ai-infra-junior-engineer-learning

# Run automated skill assessment
python scripts/assess_skills.py

# Output will show:
# - Current skill levels for each area
# - Recommended modules to complete
# - Estimated time to readiness
```

评估工具检查：
- Python 编程能力（通过编程挑战）
- Linux/Git 知识（通过命令模拟）
- Docker/Kubernetes 动手能力（通过实践任务）
- ML 基础（通过概念问题）
- 云平台熟悉程度（通过场景问题）

**通过分数**：所有领域达到 70% 以上
**建议**：达到 85% 以上，以顺利过渡到工程师课程

---

## 获取帮助

### 如果不确定自己是否准备充分

**选项 1**：在 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 发帖
- 分享你的背景和经验
- 从社区获得个性化建议

**选项 2**：加入我们的 [Discord 服务器](https://discord.gg/ai-infra-curriculum)
- 在 #prerequisites 频道提问
- 获得讲师及同伴的反馈

**选项 3**：预约答疑时间
- 每周问答（周五太平洋时间下午 3–4 点）
- 一对一前置知识咨询（需预约）

**选项 4**：查看初级课程结构
- 浏览 [初级课程结构](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning)
- 尝试各模块的第一个练习
- 如果可以轻松完成，你可能已经准备充分

---

## 成功标准：准备好了吗？

当你能够自信地做到以下事项时，就已准备好开始工程师课程：

### 技术能力
- [ ] 从零部署完整 ML 应用（API + Docker + K8s + 监控）
- [ ] 排查分布式系统中的生产问题
- [ ] 编写基础设施自动化脚本（Python + Bash）
- [ ] 解释 ML 模型服务架构及权衡
- [ ] 操作云环境并排查故障
- [ ] 理解并优化云成本
- [ ] 为 ML 应用实现 CI/CD 流水线
- [ ] 监控系统及模型性能，并进行告警

### 评估分数
- [ ] 初级课程评估平均分达到 80% 以上
- [ ] 至少完成两个获得“优秀”等级的初级项目
- [ ] 展示自我评估清单中的熟练能力
- [ ] 构建展示全部前置技能的作品集项目

### 时间投入准备
- [ ] 可投入每周 40 小时以上（全职）或 20 小时以上（兼职）
- [ ] 有至少 6 个月时间专注学习
- [ ] 可以访问云账户（AWS/GCP/Azure 免费层）
- [ ] 具备合适的硬件（8 GB 以上 RAM、性能适中的 CPU，GPU 可选）

---

## 如果没有前置知识就开始，会怎样？

**场景 1**：缺少 Python/Linux/Git 基础
❌ **结果**：学习模块 101 时遇到困难，无法完成练习
✅ **解决方法**：先完成初级模块 001–003（40 小时）

**场景 2**：缺少 ML 基础
❌ **结果**：无法理解 ML 基础设施的权衡
✅ **解决方法**：完成初级模块 004（20 小时）

**场景 3**：缺少 Docker/Kubernetes
❌ **结果**：无法完成容器化和编排模块
✅ **解决方法**：完成初级模块 005–006（35 小时）

**场景 4**：缺少监控及云基础
❌ **结果**：学习可观测性和部署模块时遇到困难
✅ **解决方法**：完成初级模块 009–010（35 小时）

**结论**：没有前置知识就开始会显著减慢进度，并降低学习效果。我们强烈建议先完成初级课程或验证全部前置技能。

---

## 前置知识时间线总结

| 起点 | 准备所需时间 | 推荐路径 |
|---------------|---------------|------------------|
| **完全初学者** | 22–44 周 | 完成全部初级课程 |
| **有一定编程经验** | 16–22 周 | 完成初级课程，跳过熟悉模块 |
| **1–2 年 DevOps/后端经验** | 8–12 周 | 自我评估、弥补缺口、复习模块 |
| **1–2 年 ML 工程经验** | 6–10 周 | 专注基础设施模块（002、005、006、009） |
| **刚完成初级课程** | 0 周 | 立即开始！✅ |

---

## 准备好开始了吗？

### ✅ 如果具备全部前置知识

**恭喜！** 你已准备好开始工程师课程。

**下一步**：
1. 阅读 [快速开始指南](./GETTING_STARTED.md)
2. 配置开发环境
3. 开始 [模块 101：基础知识](./lessons/mod-101-foundations/README.md)

### ⚠️ 如果缺少前置知识

**不用担心！** 初级课程专为帮助你做好准备而设计。

**下一步**：
1. 访问 [初级 AI 基础设施工程师](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning) 仓库
2. 完成相关模块（或全部模块，以全面做好准备）
3. 通过初级项目建立作品集
4. 准备好后返回这里

---

## 有问题？

**可以在完成初级前置课程的同时开始工程师课程吗？**
不推荐。先完成前置知识会使学习更成功。

**初级课程需要多久？**
- 全职：11 周（每周 40 小时）
- 兼职：22 周（每周 20 小时）
- 在职人员：44 周（每周 10 小时）

**需要完成全部初级模块吗？**
如果自我评估的所有领域均达到 80% 以上，可以跳过模块。不过我们建议全部完成，以全面做好准备。

**行业经验可以抵扣前置要求吗？**
自我评估清单允许你验证来自任何渠道的技能。如果能够展示熟练程度，则不论在哪里学到，都视为满足前置要求。

**如果自我评估失败怎么办？**
完成相关初级模块，再次参加评估。重新评估没有惩罚。

---

**今天开始你的旅程：**

👉 **[初级 AI 基础设施工程师学习路线](https://github.com/ai-infra-curriculum/ai-infra-junior-engineer-learning)**

👉 **[工程师课程快速开始](./GETTING_STARTED.md)**（已完成前置知识时）

---

*最后更新：2025 年 10 月*
*维护方：AI 基础设施课程团队*
