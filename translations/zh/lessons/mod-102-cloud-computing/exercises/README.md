# 模块 02 练习：面向 ML 的云计算

## 概览

这些动手练习用于巩固模块 02 的知识。每项练习都旨在培养跨云平台部署及管理 ML 基础设施的实践技能。

## 练习列表

### 练习 01：多云 ML 部署
**时长：** 3–4 小时
**难度：** 中级
**文件：** `exercise-01-multi-cloud.md`

在 AWS、GCP 和 Azure 上部署相同的 ML 模型，并比较：
- 部署复杂度。
- 性能特征。
- 成本差异。
- 管理开销。

### 练习 02：云成本优化
**时长：** 2–3 小时
**难度：** 中级
**文件：** `exercise-02-cost-optimization.md`

分析并优化 ML 工作负载的云支出：
- 识别成本驱动因素。
- 实施成本节省策略。
- 设置账单告警。
- 比较预留实例、按需实例与 Spot 实例。

### 练习 03：网络架构设计
**时长：** 2–3 小时
**难度：** 中级
**文件：** `exercise-03-networking.md`

设计并实现安全网络架构：
- 包含公共与私有子网的 VPC 设计。
- 安全组及防火墙规则。
- 负载均衡器配置。
- VPN 或私有连接配置。

### 练习 04：云存储管道
**时长：** 2–3 小时
**难度：** 初级至中级
**文件：** `exercise-04-storage-pipeline.md`

使用云存储服务构建数据管道：
- 将数据集上传至对象存储。
- 实施数据版本管理。
- 设置缓存层。
- 优化数据传输费用。

### 练习 05：托管 ML 服务比较
**时长：** 3–4 小时
**难度：** 中级
**文件：** `exercise-05-managed-services.md`

使用各云平台的托管服务部署相同模型：
- AWS SageMaker。
- GCP Vertex AI。
- Azure Machine Learning。
- 比较功能、易用性与成本。

## 前置条件

开始练习之前：

- [ ] 完成模块 02 的全部讲义。
- [ ] 拥有有效的 AWS、GCP 和 Azure 账号。
- [ ] 已安装并配置云平台 CLI 工具（aws、gcloud、az）。
- [ ] 理解基础网络概念。
- [ ] 熟悉 Terraform 或其他 IaC 工具（有帮助，但非必需）。

## 环境配置说明

### 1. 验证云平台账号

```bash
# Verify AWS CLI
aws sts get-caller-identity

# Verify GCP CLI
gcloud auth list

# Verify Azure CLI
az account show
```

### 2. 设置账单告警

**AWS：**
```bash
# Create billing alarm for $50
aws cloudwatch put-metric-alarm \
  --alarm-name "BillingAlarm" \
  --alarm-description "Alert if billing exceeds $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

**GCP：**
```bash
# Set budget alert in GCP Console
# Navigation: Billing → Budgets & Alerts → Create Budget
```

**Azure：**
```bash
# Set budget alert
az consumption budget create \
  --budget-name "ML-Budget" \
  --amount 50 \
  --time-grain Monthly
```

### 3. 克隆练习模板

```bash
cd ~/ai-infrastructure-learning
git clone <your-fork> exercises-module-02
cd exercises-module-02
```

## 练习指南

### 最佳实践

1. **记录所有内容：** 记录命令、错误与解决方案。
2. **版本控制：** 经常将进度提交至 Git。
3. **成本意识：** 不使用时关闭资源。
4. **安全：** 不要提交凭据或 API Key。
5. **清理：** 完成练习后删除资源。

### 提交格式

每项练习提交：
1. **代码：** 所有配置文件、脚本及 IaC 代码。
2. **文档：** 包含配置说明与架构图的 README。
3. **结果：** 证明成功完成的截图、日志或输出。
4. **反思：** 简短说明（原文要求 200–300 词）：
   - 学到了什么。
   - 遇到了哪些挑战。
   - 如何改进解决方案。

### 获取帮助

遇到困难时：

1. 复习相关讲义。
2. 查阅云服务商文档。
3. 在 Stack Overflow 搜索错误信息。
4. 在 GitHub Discussions 提问。
5. 查看每项练习提供的解题提示。

## 完成标准

能够完成以下任务，即达到模块 02 的练习目标：

- [ ] 在多个云平台部署 ML 模型。
- [ ] 实施成本优化策略。
- [ ] 设计安全网络架构。
- [ ] 使用云存储构建高效数据管道。
- [ ] 评估并使用托管 ML 服务。
- [ ] 排查常见云部署问题。
- [ ] 有效估算和监控云成本。

## 时间估算

| 练习 | 预计时间 | 难度 |
|---|---|---|
| 01——多云 | 3–4 小时 | 中级 |
| 02——成本优化 | 2–3 小时 | 中级 |
| 03——网络 | 2–3 小时 | 中级 |
| 04——存储管道 | 2–3 小时 | 初级至中级 |
| 05——托管服务 | 3–4 小时 | 中级 |
| **合计（原文）** | **12–17 小时** | — |

## 成本估算

原文认为，在以下条件下可以利用免费额度完成练习：
- 使用最小实例类型（t2.micro、e2-micro、B1S）。
- 完成后立即清理资源。
- 不超过免费使用时长（原文举例每项服务每月 750 小时）。
- 非关键工作负载采用 Spot 实例。

**免费额度用尽后的预期费用（原文示例）：**
- 练习 01：2–5 美元。
- 练习 02：1–3 美元。
- 练习 03：1–2 美元。
- 练习 04：1–2 美元。
- 练习 05：3–5 美元。

**总计：约 8–17 美元。**

## 补充资源

### 故障排查指南
- AWS 故障排查：https://aws.amazon.com/premiumsupport/knowledge-center/
- GCP 故障排查：https://cloud.google.com/support/docs
- Azure 故障排查：https://docs.microsoft.com/en-us/troubleshoot/azure/

### 费用计算器
- AWS Pricing Calculator：https://calculator.aws/
- GCP Pricing Calculator：https://cloud.google.com/products/calculator
- Azure Pricing Calculator：https://azure.microsoft.com/pricing/calculator/

### 社区论坛
- r/aws：https://reddit.com/r/aws
- r/googlecloud：https://reddit.com/r/googlecloud
- r/azure：https://reddit.com/r/azure

## 下一步

完成全部练习后：
1. 回顾自己的解决方案，与参考答案比较。
2. 完成模块 02 测验。
3. 完成模块 02 综合项目（可选，但推荐）。
4. 进入模块 03：Docker 容器化。

---

**有疑问？** 在 GitHub 仓库创建 Issue 或在 Discussions 发帖。

**需要参考答案？** 原文称可在认真尝试练习后查看 `solutions/` 分支中的答案文件。

> 译注：本目录沿用原文旧版练习编号及文件名，与仓库实际练习目录不完全一致。时间估算的逐项合计应为 12–17 小时；费用及免费额度条件不构成当前报价或免费保证。预算告警不会自动停止所有计费，应在执行前核实账号、区域、服务免费额度及额外费用，并清理存储、网络及其他持续计费资源。原始命令块保留，未执行云操作。
