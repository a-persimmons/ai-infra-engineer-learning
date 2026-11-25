# 练习 08：面向机器学习基础设施的 FinOps 自动化

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–07；具有 AWS Cost Explorer 访问权限

## 目标

构建 `mlfinops` CLI，按团队与工作负载收集每日云支出、归因闲置 GPU/VM 成本、展示主要浪费，并将每周摘要发送至 Slack。完成后，你将拥有一款具有明确管理策略的工具，使「云账单花在哪里了？」从每季度的紧急排查转化为周一早晨的例行报告。

## 为什么重要

机器学习工作负载通常成本较高：GPU 是主要费用项目，训练作业持续数小时，闲置集群默默消耗资金。能够回答「训练运行 X 花了多少钱？」和「本周最大的浪费是什么？」的工程师能够帮助团队控制成本。

## 要求

将 `mlfinops` 构建为具有以下命令的 Python 工具：

```text
mlfinops collect    # pull yesterday's data from Cost Explorer/BigQuery Billing/etc.
mlfinops report     # weekly digest by team, workload, and waste category
mlfinops digest     # post the report to Slack
mlfinops idle       # find idle resources (GPU < 5% util for 7 days, etc.)
mlfinops budgets    # compare actual vs budget per team
```

### 必需归因维度

每一笔支出都应归因至：
1. **团队**（来自资源标签 team）。
2. **工作负载**（training / inference / batch / dev / shared）。
3. **资源类型**（EC2/GPU、S3、网络出站、托管服务）。
4. **生命周期**（active / idle / abandoned）。

### 必需输出

- 每日 Parquet 写入 S3：`s3://team-finops/daily/<date>.parquet`。
- Slack 每周摘要：支出最高的三项、浪费最高的三项、周环比变化。
- Grafana 数据源：通过 Athena 查询每日 Parquet，渲染趋势图。

### 必须实施的策略

- **必需标签检查**：在报告中标记缺少 team 与 workload 标签的所有资源。
- **GPU 闲置阈值**：标记七天内利用率低于 5% 的 GPU。
- **长期未处理的停止实例**：标记停止超过 30 天的 EC2（仍可能为 EBS 卷付费）。
- **旧快照**：标记超过 90 天的 EBS 快照。

## 分步操作

### 步骤 1——数据收集层（45 分钟）
使用 `boto3.client('ce')` 访问 AWS Cost Explorer。逐日拉取按 TAG:team 与 SERVICE 分组的数据。写入本地 Parquet。

```python
import boto3, pandas as pd
ce = boto3.client('ce')
res = ce.get_cost_and_usage(
    TimePeriod={'Start': '2026-05-01', 'End': '2026-05-02'},
    Granularity='DAILY',
    Metrics=['UnblendedCost'],
    GroupBy=[{'Type':'TAG','Key':'team'}, {'Type':'DIMENSION','Key':'SERVICE'}],
)
# Flatten to a DataFrame with columns: date, team, service, cost_usd
```

### 步骤 2——成本分配逻辑（45 分钟）
按 (team, workload, service, lifecycle) 对数据行分组。将未知团队映射至 untagged，并单独展示未打标签的支出。

### 步骤 3——闲置检测（45 分钟）
- EC2：拉取过去七天的 CloudWatch CPUUtilization，标记低于 5% 的实例。
- GPU 实例：拉取已启用的 nvidia_smi 指标或 DCGM 指标，标记闲置。
- RDS / ElastiCache：类似地使用 DatabaseConnections 或集群 CPU 指标。

### 步骤 4——每周报告（45 分钟）
通过模板生成 Markdown：总支出、支出最高的三个团队、三个服务、三个浪费项目、未打标签支出比例，以及与上一周的变化。

### 步骤 5——Slack 投递（15 分钟）
使用 Slack Incoming Webhook。以代码块发布 Markdown。添加指向 Grafana 仪表盘的按钮。

### 步骤 6——Athena 与 Grafana（30 分钟）
使用 Glue Crawler 爬取 Parquet 存储桶。将 Grafana 连接至 Athena。构建单个仪表盘，包含按团队划分的堆叠面积图及每周饼图。

### 步骤 7——Cron / Argo Workflow（15 分钟）
每日 UTC 06:00 安排 collect；每周一本地时间 09:00 安排 report 与 digest。

## 交付物

1. 满足全部四个命令要求的 mlfinops CLI。
2. Grafana 仪表盘 JSON（提交至仓库）。
3. Slack Webhook 集成。
4. 定义逐团队月度预算的 `BUDGETS.yaml`。
5. `RUNBOOK.md`，说明如何调查支出异常。

## 验证

- [ ] mlfinops collect 生成昨日的 Parquet，包含已归因至团队的数据行。
- [ ] mlfinops report 与 AWS Cost Explorer 总额的差异不超过 1%。
- [ ] mlfinops idle 在真实账号中至少标记一个资源（若确有符合条件的资源）。
- [ ] Slack 摘要成功投递且易读。
- [ ] Grafana 仪表盘渲染过去 30 天的数据。

## 拓展目标

- 添加**预测**：依据过去 14 天预测月末支出；预计超预算时告警。
- 添加按 (team, service) 划分的**异常检测**（简单 Z-score），标记高于基线三个标准差的日期。
- 构建 `mlfinops auto-stop`，对满足闲置条件的资源在人工批准后执行停止操作。
- 添加 **Savings Plans / 承诺用量**建议：识别可受益于预留容量的稳定支出。

## 常见陷阱

- **标签传播延迟**——新标签可能需要 24 小时或更久才能出现在 Cost Explorer 成本数据中。加入重试。
- **成本与用量**——UnblendedCost 与 NetUnblendedCost 的计费口径不同，后者反映适用折扣等净成本调整。应有意识地选择。
- **EBS 快照悄然累积**——免费层账号只有有限额度；生产账号可能积累数 TB 被遗忘的快照。
- **GPU 闲置不一定是浪费**——有些团队保留预热 GPU，以降低训练重启延迟。在策略中允许逐团队例外。
- **以本组织货币报告**——Cost Explorer 常使用 USD；非美元组织可能需要汇率转换。

## 参考答案

engineer-solutions 仓库中的参考实现。

> 译注：Cost Explorer 标签需先激活为成本分配标签；若要同时按更多维度归因，可能需要 Cost and Usage Report / Data Exports 与资源清单关联。应统一账单口径、处理迟到数据，并考虑共享及无法直接归因的费用；闲置标记不等同于批准删除资源。
