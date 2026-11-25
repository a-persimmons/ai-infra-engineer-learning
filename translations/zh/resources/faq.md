# 常见问题（FAQ）

## 一般问题

### 这条学习路线讲什么？

这是一套全面的课程，旨在帮助你成为 AI 基础设施工程师。内容从 Docker 和 Kubernetes 延伸至云平台、分布式训练以及生产 ML 系统。

### 课程适合谁？

- 希望转向 AI 基础设施的软件工程师。
- 希望更深入理解基础设施的 ML 工程师。
- 希望专精 ML 基础设施的 DevOps 工程师。
- 对构建和扩展 ML 系统感兴趣的人。

### 需要哪些先修知识？

**必需：**
- Python 编程（中级）
- 基本 Linux/Unix 命令行
- Git 基础
- ML 基本概念

**推荐：**
- 了解云平台
- Docker 基础
- 网络基础

### 完成需要多久？

- **全职**（每周 40 小时）：12–15 周
- **兼职**（每周 10 小时）：50–60 周（约一年）
- **周末学习**（每周 20 小时）：25–30 周（约 6–7 个月）

合计：500 小时以上的内容。

### 课程免费吗？

学习材料完全免费且开源（MIT 许可证）。但以下事项可能产生费用：
- 云资源（原文认为多数练习在免费额度内）。
- 训练项目的 GPU 实例（原文估计总计低于 100 美元）。

### 可以获得证书吗？

目前，这是没有正式认证的自学路线。不过，完成所有项目可以形成有说服力的作品集，向雇主展示能力。

---

## 技术问题

### 需要掌握哪些编程语言？

主要是 **Python**。应熟悉：
- 函数与类
- 文件 I/O 和错误处理
- 包管理（pip、venv）
- 基础 async/await 概念

### 应该使用哪个云平台？

理想情况下使用全部三个平台（AWS、GCP、Azure），模块 02 均有涵盖。但你可以从其中任何一个开始：
- **AWS**：原文认为行业中最普及，拥有广泛的 ML 服务。
- **GCP**：侧重 ML/AI，适合实验。
- **Azure**：发展迅速，适合企业。

原文称三者均为新用户提供免费额度或试用金，实际资格以各平台为准。

### 需要 GPU 吗？

**本地开发：** 不需要，多数练习可在 CPU 上运行。

**训练项目：** 需要 GPU 访问能力，可以使用：
- 云 GPU 实例（AWS、GCP、Azure）
- Google Colab（有免费层）
- Kaggle Notebook（提供免费 GPU 访问）

### 练习遇到困难怎么办？

1. 重读课程材料。
2. 查看 FAQ（就是本页）。
3. 搜索现有 [GitHub Issues](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues)。
4. 在 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 提问。
5. 创建带 `question` 标签的新 Issue。

### 可以跳过模块吗？

课程按循序渐进的方式设计，但如果已有相关知识，可以跳过某些模块。不过：
- 完成测验以验证理解程度。
- 确保具备后续模块需要的先修技能。

---

## 项目问题

### 如何知道项目是否正确？

由于这些是包含代码骨架的学习项目：
1. 实现 TODO 后，所有测试应通过。
2. 应用应能无错误运行。
3. 对照课程中的最佳实践检查自己的实现。
4. 在 Discussions 分享代码，获取社区反馈。

### 可以使用与建议不同的技术吗？

可以！代码骨架提供一种实现方式，但鼓励：
- 尝试替代框架或库。
- 实现附加功能。
- 针对不同需求优化。

欢迎在 Discussions 分享替代实现。

### 应完成所有项目吗？

**是的**，如果希望获得完整学习体验。每个项目强化不同概念：
- 项目 01：基础（服务、Docker、K8s）
- 项目 02：分布式训练
- 项目 03：MLOps 流水线
- 项目 04：自动扩缩容系统
- 项目 05：完整 ML 平台

### 可以将项目放入作品集吗？

当然！你编写的项目代码归你所有。这些项目适合作为求职时展示的作品集。

---

## 云平台与费用问题

### 云资源会花多少钱？

**预计总成本（原文估计）：** 超出免费额度时低于 100 美元。

**费用明细：**
- 模块 01–02（AWS/GCP/Azure 基础）：免费层
- 模块 03–04（Kubernetes）：约 20 美元
- 模块 05–06（分布式训练）：约 30–50 美元
- 模块 07–10（生产系统）：约 20–30 美元

**节约成本的技巧：**
- 尽量使用免费额度。
- 不使用时关闭资源。
- 使用 Spot/可抢占实例（原文估计节约 60–90%）。
- 设置账单告警。

### 如何避免意外云账单？

1. **立即设置账单告警**（原文建议 10、25、50 美元）。
2. **每次学习结束后关闭资源**。
3. **使用云预算工具**：
   - AWS Budgets
   - GCP Budget Alerts
   - Azure Cost Management
4. **每天监控用量**。
5. **使用自动关闭脚本**（课程提供）。

### 没有云访问权限可以完成课程吗？

模块 01 可以本地完成。不过原文认为模块 02 及以后需要云访问来实践：
- 云存储和网络
- 托管 ML 服务
- Kubernetes 集群
- 分布式训练

可以利用免费层和试用金降低成本。

---

## 职业问题

### 完成后可以找哪些工作？

原文列举以下目标岗位和薪资（美元）：
- **AI Infrastructure Engineer**（12 万–18 万）
- **ML Platform Engineer**（13 万–19 万）
- **MLOps Engineer**（11 万–17 万）
- **Senior Cloud Engineer**（ML 方向，13 万–20 万）

### 与训练营或学位相比如何？

**优势：**
- 免费且开源
- 自定学习节奏
- 动手实践，以项目为基础
- 贴近行业的课程

**需要考虑：**
- 没有正式认证
- 需要自律
- 没有导师支持（依靠社区）
- 不提供就业安置服务

### 完成后应该做什么？

1. **构建作品集**：在 GitHub 发布项目。
2. **写作**：记录所学内容。
3. **回馈社区**：帮助完善课程。
4. **拓展人脉**：加入 ML 基础设施社区。
5. **求职**：利用作品集展示技能。
6. **持续学习**：技术发展迅速。

### 应参与开源贡献吗？

是的！参与本仓库或其他 ML 基础设施项目：
- 展示技能
- 拓展人脉
- 促进学习
- 为简历增添有价值的经历

---

## 内容问题

### 为什么代码中有 TODO？

带 TODO 的代码骨架是有意设计的：
- 指导实现。
- 提供提示与最佳实践。
- 让你通过动手学习。
- 使你能够真正掌握代码。

完整解决方案位于单独的 solutions 仓库。

### 视频教程在哪里？

这是以文本为基础的课程，优点包括：
- 自定节奏（可以略读，也可以深入阅读）
- 易于搜索和参考
- 易于访问（无需视频带宽）
- 便于翻译

未来可能添加视频教程。

### 可以将课程翻译成其他语言吗？

可以！欢迎翻译贡献。参见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

### 内容多久更新一次？

原文描述课程维护方式：
- **季度更新**：新工具和最佳实践
- **修复问题**：根据社区报告
- **改进内容**：根据反馈
- **新模块**：随着技术演进添加

---

## 社区问题

### 如何获得帮助？

1. **阅读文档**：课程、README 和本 FAQ。
2. **搜索 Issue**：可能已有其他人提过。
3. **GitHub Discussions**：向社区提问。
4. **创建 Issue**：报告缺陷或不清楚的内容。

### 如何贡献？

参见 [CONTRIBUTING.md](../CONTRIBUTING.md) 获取详细指南。贡献方式包括：
- 修复错别字或错误。
- 改进解释。
- 添加示例或练习。
- 评审 Pull Request。
- 帮助回答问题。
- 分享经验。

### 有社区聊天室吗？

原文目前支持的渠道是 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)。尚未安排实时聊天（Slack/Discord）或定期答疑时间；希望组织学习小组时可以创建 Discussion。

### 可以分享学习进度吗？

当然，课程鼓励这样做：
- 在 GitHub Discussions 分享。
- 在社交媒体使用 #AIInfraLearning 标签。
- 撰写学习历程博客。
- 制作项目视频。

---

## 故障排查

### Docker 权限被拒绝

```bash
# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Python 导入错误

```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Kubernetes 连接被拒绝

```bash
# Start minikube
minikube start

# Verify
kubectl get nodes
```

### AWS CLI 未配置

```bash
# Configure AWS CLI
aws configure

# Enter your:
# - Access Key ID
# - Secret Access Key
# - Default region (e.g., us-east-1)
# - Output format (json)
```

### 磁盘空间不足

```bash
# Clean Docker
docker system prune -a

# Clean pip cache
pip cache purge

# Check disk usage
df -h
```

---

## 仍有疑问？

- **搜索已有问题**：[GitHub Issues](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues)
- **向社区提问**：[GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)
- **报告缺陷**：创建新 [Issue](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues/new)

---

**没有找到答案？创建 Discussion 或 Issue！**

> 译注：费用、薪资、维护频率及项目编号均按原文保留，并非本次独立调查的当前数据；项目编号以仓库实际目录为准。免费额度和 GPU 配额存在地区及账号限制，预算告警不一定能自动停止计费。
