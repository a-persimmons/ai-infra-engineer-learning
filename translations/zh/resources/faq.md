# 常见问题（FAQ）

## 通用问题

### 这条学习路线是关于什么的？

这是一套帮助你成为 AI 基础设施工程师的综合课程，涵盖 Docker、Kubernetes、云平台、分布式训练以及生产 ML 系统。

### 课程适合谁？

- 希望转向 AI 基础设施的软件工程师。
- 希望深入理解基础设施的 ML 工程师。
- 希望专精 ML 基础设施的 DevOps 工程师。
- 对构建和扩展 ML 系统感兴趣的人。

### 需要哪些前置知识？

**必需：**
- Python 编程（中级）。
- Linux/Unix 命令行基础。
- Git 基础。
- ML 基本概念。

**推荐：**
- 了解云平台。
- Docker 基础。
- 网络基础。

### 完成课程需要多久？

- **全职**（每周 40 小时）：12–15 周。
- **兼职**（每周 10 小时）：50–60 周（约一年）。
- **周末学习**（每周 20 小时）：25–30 周（约 6–7 个月）。

总计：500 小时以上内容。

### 课程免费吗？

学习资料完全免费且开源（MIT 许可证）。但以下资源可能产生费用：
- 云资源（原文认为多数练习在免费层限额内）。
- 用于训练项目的 GPU 实例（原文估计总费用低于 100 美元）。

### 可以获得证书吗？

目前属于自主学习路线，没有正式认证。但完成全部项目可以形成有力的作品集，向雇主展示技能。

---

## 技术问题

### 需要掌握哪些编程语言？

主要是 **Python**，需要熟悉：
- 函数与类。
- 文件 I/O 和错误处理。
- 包管理（pip、venv）。
- async/await 基础概念。

### 应选择哪家云服务商？

理想情况下学习 AWS、GCP、Azure 三家，因为 Module 02 均有涵盖。也可以从任意一家开始：
- **AWS：** 原文认为业界使用广泛，ML 服务丰富。
- **GCP：** 强调 ML/AI，适合实验。
- **Azure：** 增长较快，适合企业。

原文指出三家均有免费层或新用户额度。

### 需要 GPU 吗？

**本地开发：** 不需要，多数练习可在 CPU 上运行。

**训练项目：** 需要 GPU 访问能力，可以使用：
- 云 GPU 实例（AWS、GCP、Azure）。
- Google Colab（有免费层）。
- Kaggle Notebook（有免费 GPU 访问）。

### 练习遇到困难怎么办？

1. 重读讲义。
2. 查看 FAQ（即本文）。
3. 搜索现有 [GitHub Issues](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues)。
4. 在 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 提问。
5. 创建带 question 标签的新 Issue。

### 可以跳过模块吗？

虽然课程循序渐进，如果已经掌握相关知识，也可以跳过模块。不过：
- 完成测验以验证理解。
- 确保具备后续模块所需的前置技能。

---

## 项目问题

### 如何判断项目实现是否正确？

学习项目提供代码桩，因此：
1. 完成 TODO 后，全部测试应通过。
2. 应用运行无错误。
3. 对照讲义中的最佳实践检查实现。
4. 在 Discussions 分享代码，获得社区反馈。

### 可以使用不同于建议的技术吗？

可以！代码桩提供一种实现方式，但鼓励：
- 尝试替代框架或库。
- 实现额外功能。
- 根据不同需求进行优化。

欢迎在 Discussions 分享替代实现。

### 应该完成全部项目吗？

如果希望获得完整学习体验，原文建议完成全部项目。每个项目巩固不同概念：
- 项目 01：基础（服务、Docker、K8s）。
- 项目 02：分布式训练。
- 项目 03：MLOps 流水线。
- 项目 04：自动扩缩容系统。
- 项目 05：完整 ML 平台。

> 译注：上述五项为原文旧版项目描述。当前仓库实际包含 project-101、project-102、project-103 三个项目，以项目目录为准。

### 可以将项目加入作品集吗？

可以。自己编写的项目代码可以用于作品集，展示求职相关技能。

---

## 云平台与费用问题

### 云资源需要花多少钱？

**原文估算总费用：** 超出免费层后仍低于 100 美元。

**费用明细（原文估算）：**
- 模块 01–02（AWS/GCP/Azure 基础）：免费层。
- 模块 03–04（Kubernetes）：约 20 美元。
- 模块 05–06（分布式训练）：约 30–50 美元。
- 模块 07–10（生产系统）：约 20–30 美元。

**节省费用的建议：**
- 尽可能使用免费层。
- 不使用时关闭资源。
- 使用 Spot/Preemptible 实例（原文估计便宜 60–90%）。
- 设置账单告警。

### 如何避免意外云账单？

1. **立即设置账单告警**（建议阈值：10、25、50 美元）。
2. 每次学习结束后**关闭资源**。
3. 使用云预算工具：
   - AWS Budgets。
   - GCP Budget Alerts。
   - Azure Cost Management。
4. 每日监控用量。
5. 使用自动关闭脚本（讲义提供）。

### 没有云账号可以完成课程吗？

Module 01 可以在本地完成。原文认为 Module 02 及后续部分需要云访问能力，以实践：
- 云存储及网络。
- 托管 ML 服务。
- Kubernetes 集群。
- 分布式训练。

可以利用免费层或额度尽量降低成本。

---

## 职业问题

### 完成课程后可以申请什么岗位？

原文列举的岗位和美国薪资范围：
- **AI 基础设施工程师：** 12万–18万美元。
- **ML 平台工程师：** 13万–19万美元。
- **MLOps 工程师：** 11万–17万美元。
- **Senior 云工程师（ML 方向）：** 13万–20万美元。

### 相比训练营或学位课程如何？

**优势：**
- 免费开源。
- 自主学习。
- 动手实践、项目驱动。
- 贴近行业的课程。

**需要考虑：**
- 没有正式认证。
- 需要自律。
- 无讲师支持（依赖社区）。
- 无就业安置服务。

### 完成课程后应该做什么？

1. **建立作品集：** 在 GitHub 发布项目。
2. **写作：** 写博客记录所学内容。
3. **回馈社区：** 帮助改进课程。
4. **建立联系：** 加入 ML 基础设施社区。
5. **申请岗位：** 用作品集展示技能。
6. **持续学习：** 技术演进迅速。

### 应该参与开源贡献吗？

原文鼓励为本仓库或其他 ML 基础设施项目作贡献：
- 展示技能。
- 建立人脉。
- 帮助学习。
- 丰富简历。

---

## 内容问题

### 为什么代码包含 TODO？

包含 TODO 的代码桩是有意设计的：
- 指导实现。
- 提供提示及最佳实践。
- 让你通过动手学习。
- 让你对自己的代码负责。

原文称完整解答可在独立解答仓库获取。

### 视频教程在哪里？

这是文字课程，优势包括：
- 自主节奏（按需略读或深入学习）。
- 容易搜索与查阅。
- 易于访问（无视频带宽要求）。
- 可以翻译。

未来可能增加视频教程。

### 可以翻译为其他语言吗？

可以！欢迎翻译贡献。参见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

### 内容多久更新一次？

原文说明维护方式：
- 每季度更新新工具与最佳实践。
- 根据社区报告修复问题。
- 根据反馈改善内容。
- 随技术演进增加新模块。

---

## 社区问题

### 如何获得帮助？

1. 阅读文档：讲义、README、FAQ。
2. 搜索 Issues，可能有人问过相同问题。
3. 在 GitHub Discussions 向社区提问。
4. 对缺陷或不清楚的内容创建 Issue。

### 如何贡献？

参见 [CONTRIBUTING.md](../CONTRIBUTING.md)。贡献方式：
- 修复错别字或错误。
- 改善解释。
- 增加示例或练习。
- 审查 Pull Request。
- 帮助回答问题。
- 分享经验。

### 有社区聊天渠道吗？

原文说明 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 是支持的渠道。暂未安排 Slack/Discord 实时聊天及定期答疑；如果希望组织学习小组，可创建 Discussion。

### 可以分享学习进度吗？

欢迎：
- 在 GitHub Discussions 分享。
- 在社交媒体使用 #AIInfraLearning。
- 撰写博客记录学习历程。
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

## 还有问题？

- **搜索现有问题：** [GitHub Issues](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues)。
- **向社区提问：** [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)。
- **报告缺陷：** 创建新 [Issue](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues/new)。

---

**没有找到答案？创建 Discussion 或 Issue！**

> 译注：课程时长、薪资及云费用属于原文估算，不保证就业或成本上限。免费额度及资源资格需按实际账号核实；预算告警不等于硬性支出限制，停止计算实例后存储与网络资源也可能持续收费。原文社区地址与维护承诺未经本次独立核实。
