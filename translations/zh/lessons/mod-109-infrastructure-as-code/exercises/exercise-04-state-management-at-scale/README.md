# 练习 04：规模化 Terraform 状态管理

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 03；实验 03

## 目标

为跨四个环境的 50 多个 Terraform 项目设计状态管理策略。实现带锁的远程后端、项目级隔离、Workspace 使用模式，以及状态损坏事故的恢复流程。

## 为什么重要

状态管理是 Terraform 部署最容易发生灾难性故障的环节：覆盖状态、丢失状态、并发 apply 冲突。规划完善的策略可以避免许多团队曾遭遇的耗时三天的清理工作。

## 要求

1. S3 + DynamoDB 后端，每个环境一个存储桶。
2. 每个项目独立状态文件，具有明确的键命名规范。
3. 确定 Workspace 策略（按 Workspace 或按目录）。
4. 状态迁移运行手册（在项目之间迁移资源）。
5. 状态恢复流程（通过 S3 版本管理恢复）。
6. 定时漂移检测任务。

## 分步操作

### 步骤 1——初始化后端（30 分钟）
创建后端基础设施（先有鸡还是先有蛋的问题：初始化使用本地状态，再执行迁移）。

各环境使用 `company-tfstate-{dev,staging,prod}` S3 存储桶，启用版本管理、加密和 KMS Key。

每个区域使用一张 `tfstate-locks` DynamoDB 表。

### 步骤 2——键命名规范（15 分钟）
```
s3://company-tfstate-prod/
  ml-platform/vpc/terraform.tfstate
  ml-platform/eks/terraform.tfstate
  ml-platform/rds/terraform.tfstate
  data-platform/...
```
分层结构：组织 → 团队 → 项目。可预测且易于审计。

### 步骤 3——后端配置（15 分钟）
```hcl
terraform {
  backend "s3" {
    bucket         = "company-tfstate-prod"
    key            = "ml-platform/vpc/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "tfstate-locks"
    encrypt        = true
    kms_key_id     = "alias/tfstate"
  }
}
```

### 步骤 4——Workspace 与目录对比（30 分钟）
**Workspace**（每个 Workspace 一个状态）：非常适合「大量相似资源」（按租户、按区域）。
```bash
terraform workspace new us-west-2
terraform workspace select us-west-2
```

**目录**（一个项目对应一个状态）：更适合「不同类型的资源」。大多数团队选择此方案。

对于多环境，为每个环境使用独立目录，而不是独立 Workspace。Workspace 容易模糊边界；目录使差异更加明确。

### 步骤 5——IAM 模型（30 分钟）
按后端存储桶和角色划分：

- **Reader**：只读路径上的 `s3:GetObject`、`s3:ListBucket`。
- **Engineer**：`s3:GetObject`、`s3:PutObject`、`dynamodb:GetItem`/`PutItem`/`DeleteItem`。
- **Restore-only**：用于状态恢复的 `s3:GetObjectVersion`。

CI 服务账号具有 Engineer 角色。

### 步骤 6——状态迁移运行手册（30 分钟）
在两个状态之间迁移资源（例如，将 RDS 所有权从 `data-platform` 转移到 `ml-platform`）：

```bash
# In source project
terraform state pull > /tmp/old-state.tfstate
terraform state rm 'module.rds'

# In destination project
terraform state push -force /tmp/source-state.tfstate  # carefully
# Then:
terraform state mv 'aws_db_instance.this' 'module.rds.aws_db_instance.this'

# Verify both ends with: terraform plan (should show no changes)
```

将此过程记录在 `STATE_MIGRATION.md` 中。

### 步骤 7——恢复流程（15 分钟）
```bash
# List state file versions
aws s3api list-object-versions --bucket company-tfstate-prod \
  --prefix ml-platform/vpc/terraform.tfstate

# Restore a specific version
aws s3api copy-object \
  --bucket company-tfstate-prod \
  --copy-source 'company-tfstate-prod/ml-platform/vpc/terraform.tfstate?versionId=<vid>' \
  --key ml-platform/vpc/terraform.tfstate

# Verify
terraform init -reconfigure
terraform plan
```

### 步骤 8——漂移检测（15 分钟）
每天针对每个项目执行 CI 任务：`terraform plan -detailed-exitcode`。退出码 2 表示存在变更，发送 Slack 通知。

## 交付物

1. 后端初始化模块。
2. `STATE_MIGRATION.md` 运行手册。
3. `STATE_RECOVERY.md` 运行手册。
4. 每个项目的漂移检测任务。

## 验证

- [ ] 后端已创建、加密并启用版本管理。
- [ ] 两名工程师无法同时对同一个状态执行 apply。
- [ ] 在沙箱中测试过状态迁移。
- [ ] 成功从刻意损坏的状态中恢复。

## 常见陷阱

- **后端配置块使用插值**——不允许。使用 `-backend-config` 或环境变量。
- **两个项目使用同一个键**——并发 apply 可能损坏状态。严格的键命名规范可以防止此问题。
- **`terraform state push -force`**——高风险操作。始终保留备份。
- **没有版本管理**——缺少版本管理时，状态损坏可能无法恢复。始终启用 S3 版本管理。

> 译注：原文要求的 DynamoDB 状态锁属于较早的后端方案；使用新版 Terraform 时也可核对 S3 原生锁文件方案。plan 返回 2 表示存在变更，不一定全部由外部漂移导致。
