# 练习 07：多账号 / 多项目安全架构

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** AWS Organizations 或 GCP Folders；管理员权限

## 目标

设计并实现机器学习平台的多账号（AWS）或多项目（GCP）安全架构：独立 prod/staging/dev/sandbox 账号、集中式审计日志、SCP/Org Policy 护栏、跨账号 IAM，以及供独立账号中的 CI 使用、向生产部署的最小权限角色。

## 为什么重要

生产环境故障影响范围是云事故的重要因素。单账号模式容易使工程师拥有超出工作所需的权限。多账号架构在云服务商提供的重要隔离边界上分离环境。随着团队扩大，主动规划通常比事后迁移更容易控制成本。

## 要求

### 拓扑

```
Management account
├── Audit account              # CloudTrail logs, S3 access logs, Config history
├── Security account           # GuardDuty hub, Security Hub, IAM identity center
├── Networking account         # Transit Gateway, central DNS, prefix lists
├── Shared services account    # ECR, container registry, CI/CD runners
└── Workload OU
    ├── Production
    ├── Staging
    ├── Development
    └── Sandbox (per-user)
```

即使测试沙箱只能创建两至三个账号，也应在代码中对全部账号建模，并将配置应用到实际拥有的子集。

### 控制措施

1. OU 级别的 **Service Control Policy（SCP）**：
   - Workload OU：拒绝禁用 CloudTrail、拒绝在不支持的区域启动资源、拒绝未批准的实例类型。
   - Production OU：拒绝 iam:CreateUser，限制 Root 用户的操作。
   - Sandbox OU：通过预算操作停止 EC2 实例，控制支出。
2. **集中式 CloudTrail**：组织级 Trail 将日志写入审计账号。
3. 每个账号启用 **AWS Config** 记录，配置 Conformance Pack：静态加密、阻止公共访问、Root 用户 MFA。
4. 整个组织启用 **GuardDuty**，在安全账号建立集中管理中心。
5. **IAM Identity Center（SSO）**，按角色配置 Permission Set：
   - DataScientist：生产数据只读，dev/sandbox 管理权限。
   - MLEngineer：dev/sandbox 管理权限，staging 写权限，prod 只读。
   - Operator：staging 与 prod 管理权限，dev 只读。
6. prod 中的**跨账号 IAM 角色** cicd-deployer，仅允许共享服务账号中的指定主体承担，权限限定为机器学习工作负载的 ECS/EKS/S3 部署。

## 分步操作

### 步骤 1——盘点现状（15 分钟）
列出账号，识别各账号运行的工作负载。如果只有一个账号，规划迁移。

### 步骤 2——供应 Organizations（30 分钟）
使用 Terraform 模块创建 OU 与若干账号。使用 aws_organizations_organizational_unit 与 aws_organizations_account。

### 步骤 3——SCP（45 分钟）
编写四至六份 SCP，涵盖上述控制措施。将其附加至 OU。在隔离的工作负载账号中尝试被禁止的操作，逐项验证。
```hcl
resource "aws_organizations_policy" "deny_root_in_prod" {
  name = "deny-root-in-prod"
  type = "SERVICE_CONTROL_POLICY"
  content = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Deny",
      Action = "*",
      Resource = "*",
      Condition = { StringLike = { "aws:PrincipalArn" = "arn:aws:iam::*:root" } }
    }]
  })
}
```

### 步骤 4——集中式日志（30 分钟）
- 在管理账号中创建组织级 Trail。
- 使用审计账号中的 KMS Key 加密。
- 应用拒绝跨账号删除的 S3 Bucket Policy。

### 步骤 5——IAM Identity Center（30 分钟）
- 在管理账号启用 Identity Center。
- 定义 Permission Set。
- 通过用户组将用户分配至账号。
- 执行 `aws sso login --profile ml-prod` 验证 SSO 登录。

### 步骤 6——CI/CD 跨账号角色（30 分钟）
```hcl
# In the prod account
resource "aws_iam_role" "cicd_deployer" {
  assume_role_policy = jsonencode({
    Statement = [{
      Effect = "Allow",
      Action = "sts:AssumeRole",
      Principal = { AWS = "arn:aws:iam::<shared-svc-account>:role/github-actions" },
      Condition = { StringEquals = { "sts:ExternalId" = "ml-cicd-prod" } }
    }]
  })
  inline_policy {
    name = "deploy"
    policy = jsonencode({...scoped to model-api ECR + ECS + S3 only...})
  }
}
```
GitHub Actions 工作流通过 OIDC 获取角色。

### 步骤 7——验证护栏（30 分钟）
每项 SCP 均需可测试。编写 `scripts/test-controls.sh`，从各类型测试账号尝试被禁止的操作，验证拒绝结果。

### 步骤 8——记录文档（30 分钟）
编写 `ARCHITECTURE.md`，包含拓扑、角色矩阵及「我被锁定在账号之外」「怀疑凭据泄露」场景的值班升级路径。

## 交付物

1. Organizations、SCP、Identity Center 的 Terraform 模块。
2. 代码化跨账号 CI/CD 角色。
3. 安全事故相关的 `ARCHITECTURE.md` 与 `RUNBOOK.md`。
4. 可用的 SSO 登录，以及从共享服务账号至生产环境的 CI/CD 部署。

## 验证

- [ ] 作为 Sandbox 用户在允许区域之外尝试创建测试 S3 存储桶（原文示例 aws s3 mb s3://test），因 SCP 而失败。
- [ ] 工作负载账号的 CloudTrail 事件在约 15 分钟内出现在审计账号的 S3 存储桶。
- [ ] aws sso login 在至少一个工作负载账号的一个 Permission Set 上可用。
- [ ] GitHub Actions 可以承担 cicd-deployer 角色并推送至生产 ECR。
- [ ] 在隔离测试环境移除 SCP 后，先前被阻止的操作可以执行（确认拒绝确由 SCP 造成）。

## 拓展目标

- 添加 **AWS Control Tower**，作为手动 Organizations 配置的更高层级抽象。
- 实现 **Break-glass 紧急访问**：用于事故的特殊账号及限时管理员角色，使用时进行专项审计。
- 为每个账号添加 **Backup Vault**，并进行跨区域复制以支持灾难恢复。
- 集成 **Detective** 或 **Lake Formation**，分析查询审计日志。

## 常见陷阱

- **SCP 不授予权限**——仍需 IAM 策略授予权限。新人容易混淆 SCP Allow 与 IAM Allow。
- **在生产中分离 SCP**——不要这样做，除非遵循已记录的紧急访问流程。「需要快速做一件事」可能引发 SCP 变更相关事故。
- **Sandbox 没有预算限制**——错误配置的 GPU 工作负载可能在周末产生上万美元费用。配置预算告警与止损动作。
- **从开发者账号执行 CI 部署**——使用专门的共享服务账号，不要将生产凭据与开发者凭据混放。

## 参考答案

engineer-solutions 仓库中的 Terraform 参考实现。

> 译注：SCP 可定义权限上限（包括 Allow 与 Deny），但不直接授予权限，也不约束管理账号。预算操作不是实时硬性费用上限；须另设配额及资源限制。GitHub OIDC 信任关系需限制仓库、分支或环境，若要求只能从共享服务账号承担生产角色，则需要明确的跨账号角色链。所有破坏性控制测试仅在隔离沙箱中进行；GCP 的对应控制需要单独实现。
