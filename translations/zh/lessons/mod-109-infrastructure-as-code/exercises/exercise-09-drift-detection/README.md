# 练习 09：漂移检测与修复

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 04（状态管理）

## 目标

为 Terraform 管理的基础设施实现自动化漂移检测：定时执行 `plan`、生成漂移报告、按严重程度分类（表面变更与实质变更），并建立修复工作流（恢复或接受变更）。

## 为什么重要

配置漂移会悄然破坏 IaC 规范。六个月不检查，「手动修复」不断累积，下一次 `terraform apply` 可能提出 200 项你不了解的变更。漂移检测将其变成持续管理的事项。

## 要求

1. 每天为每个项目执行 `plan`，将输出保存至 S3。
2. 漂移报告：逐项资源记录发生了什么变更、由谁变更（来自 CloudTrail）。
3. 严重程度规则：标签 = 信息，实例类型 = 警告，安全组规则 = 严重。
4. 按严重程度发送 Slack 通知。
5. 修复流程：审查 → 恢复或接受变更。

## 分步操作

### 步骤 1——定时执行 `plan`（45 分钟）
每个项目使用 GitHub Actions / GitLab 的定时任务：
```yaml
on:
  schedule:
    - cron: "0 6 * * *"   # daily 6am UTC
jobs:
  drift-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - id: plan
        run: |
          terraform plan -no-color -detailed-exitcode -out=plan.tfplan
          echo "exit_code=$?" >> $GITHUB_OUTPUT
      - if: steps.plan.outputs.exit_code == '2'
        run: |
          terraform show -json plan.tfplan > drift.json
          aws s3 cp drift.json s3://drift-reports/$(date +%Y-%m-%d)/$REPO.json
          # Trigger downstream report
```

检测到变更时，`-detailed-exitcode` 返回 2。

### 步骤 2——漂移分类（30 分钟）
```python
# classify_drift.py
import json
RULES = [
    {"resource_type": "aws_iam_role", "attribute": "assume_role_policy", "severity": "critical"},
    {"resource_type": "aws_security_group_rule", "attribute": "*", "severity": "critical"},
    {"resource_type": "aws_instance", "attribute": "instance_type", "severity": "warning"},
    {"resource_type": "*", "attribute": "tags", "severity": "info"},
]

def classify(drift):
    for change in drift["resource_changes"]:
        for attr, _ in change.get("change", {}).get("after", {}).items():
            for rule in RULES:
                if matches(change["type"], rule["resource_type"]) and matches(attr, rule["attribute"]):
                    yield {"resource": change["address"], "attribute": attr,
                           "severity": rule["severity"]}
                    break
```

### 步骤 3——CloudTrail 归因（45 分钟）
对于每个发生漂移的资源，查询 CloudTrail，查找变更执行者：
```python
import boto3
ct = boto3.client('cloudtrail')

def who_changed(resource_arn, since):
    events = ct.lookup_events(
        LookupAttributes=[{"AttributeKey": "ResourceName", "AttributeValue": resource_arn}],
        StartTime=since,
    )
    if events.get("Events"):
        return events["Events"][0]["Username"]
    return "unknown"
```

### 步骤 4——Slack 通知（15 分钟）
```python
import requests
def notify(drift_report):
    severity_counts = Counter(d["severity"] for d in drift_report)
    color = "danger" if severity_counts["critical"] > 0 else "warning"
    msg = {
        "attachments": [{
            "color": color,
            "title": f"Drift in {project}",
            "fields": [
                {"title": "Resources drifted", "value": str(len(drift_report)), "short": True},
                {"title": "Critical", "value": str(severity_counts["critical"]), "short": True},
            ],
            "actions": [
                {"name": "view", "type": "button", "text": "View report",
                 "url": f"https://drift-dashboard/{project}/today"},
            ],
        }]
    }
    requests.post(SLACK_WEBHOOK, json=msg)
```

### 步骤 5——修复工作流（15 分钟）
两种选择：

- **恢复**：执行 `terraform apply`，恢复声明的状态。
- **接受**：执行 `terraform refresh`，然后保存新状态，或者更新 HCL，使配置与现实一致。

按漂移类型决定：

- 信息级 → 忽略（或下次部署时修复）。
- 警告级 → 下次站会排查。
- 严重级 → 通知值班人员。

在 `DRIFT_RUNBOOK.md` 中记录决策树。

> 译注：接受真实资源变更通常需要同步更新 HCL；仅刷新状态不会消除配置与实际资源之间的差异。不要将含有敏感信息的状态文件提交至 Git。

## 交付物

1. 每个项目的漂移检查工作流。
2. `classify_drift.py` 脚本。
3. 可用的 Slack 通知。
4. `DRIFT_RUNBOOK.md`。
5. 演示：引入手动变更 → 检测到漂移 → 收到通知。

## 验证

- [ ] 每日运行生成报告（多数日期为空）。
- [ ] 合成漂移（手动编辑资源）触发通知。
- [ ] 严重程度分类正确。
- [ ] CloudTrail 归因能够识别变更执行者。

## 拓展目标

- 添加表面漂移的**自动修复**（自动修复标签）。
- 添加**月度趋势报告**：各项目的漂移频率。
- 集成 **driftctl** 或 **CloudCustodian**，实现更丰富的检测。

## 常见陷阱

- **使用过时状态执行 `plan`**——原文建议先执行 `terraform refresh`。
- **将所有漂移都报告为严重级**——造成告警疲劳。按严重程度过滤。
- **未经审查自动修复**——漂移可能源于真实的紧急修复；贸然恢复可能破坏业务。
- **未启用 CloudTrail**——没有它，归因只能依靠猜测。

> 译注：默认的 Terraform plan 会刷新资源信息；若要专门识别外部漂移，可使用 refresh-only plan。旧版 refresh 命令会修改状态，应谨慎操作。
