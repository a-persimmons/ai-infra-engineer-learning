# 模块 09：基础设施即代码——测验

检验对 IaC 概念、Terraform、Pulumi 以及 AI/ML 基础设施 IaC 最佳实践的理解。

**时长：** 45 分钟  
**题目：** 25 道选择题及 3 道场景题  
**及格分数：** 70%（20/28）

---

## 选择题

### 第 1 题：IaC 基础

**基础设施即代码相较手工管理基础设施的主要收益是什么？**

A) 初次部署更快
B) 无需学习新工具
C) 基础设施可纳入版本控制并一致复现
D) 无需云服务商

<details>
<summary>答案</summary>

**C) 基础设施可纳入版本控制并一致复现**

主要优势是可复现性与版本控制。部署速度可能逐步改善，但关键是像对待代码一样对待基础设施，支持 Git 工作流、代码审查及一致的环境。

</details>

---

### 第 2 题：声明式与命令式

**以下哪项最符合声明式 IaC？**

A) 指定创建资源的逐步指令
B) 描述期望最终状态，由工具确定如何实现
C) 手动顺序运行命令
D) 用 Shell 脚本自动化任务

<details>
<summary>答案</summary>

**B) 描述期望最终状态，由工具确定如何实现**

Terraform 和 Pulumi 等声明式 IaC 关注想要什么（WHAT），而不是如何创建（HOW）。工具处理实现细节并实现幂等性。

</details>

---

### 第 3 题：Terraform State

**Terraform 状态的用途是什么？**

A) 安全存储 API 凭据
B) 追踪所管理基础设施的当前状态
C) 定义应创建的资源
D) 部署期间执行 Shell 命令

<details>
<summary>答案</summary>

**B) 追踪所管理基础设施的当前状态**

Terraform State 是将配置映射到实际资源的 JSON 文件，记录资源 ID、属性及依赖关系，以正确规划更新。

</details>

---

### 第 4 题：远程状态后端

**为什么使用 S3 等远程状态后端而非本地状态？**

A) Terraform 命令运行更快
B) 支持团队协作并防止并发修改
C) 所有 Terraform 项目都必须使用
D) 自动备份基础设施

<details>
<summary>答案</summary>

**B) 支持团队协作并防止并发修改**

远程状态后端让团队成员安全地协作。通过状态锁（如 DynamoDB）防止并发修改，本地状态主要适合个人开发。

</details>

---

### 第 5 题：资源依赖

**Terraform 如何确定创建资源的顺序？**

A) 按资源名称字母顺序
B) 按 .tf 文件中出现的顺序
C) 分析隐式与显式依赖
D) 随机创建，出错后重试

<details>
<summary>答案</summary>

**C) 分析隐式与显式依赖**

Terraform 分析资源引用（隐式）与 `depends_on` 声明（显式）来构建依赖图，并自动按正确顺序创建资源。

</details>

---

### 第 6 题：HCL 变量

**在 Terraform 资源中如何正确引用 instance_type 变量？**

A) `${instance_type}`
B) `var.instance_type`
C) `variable.instance_type`
D) `$instance_type`

<details>
<summary>答案</summary>

**B) `var.instance_type`**

HCL 使用 var. 前缀加变量名来引用变量。字符串中可使用插值语法，但正确引用仍为 var.instance_type。

</details>

---

### 第 7 题：count 与 for_each

**何时使用 for_each 而非 count？**

A) 仅需要一个资源
B) 从 Map 或 Set 创建资源，且需要稳定标识
C) 按字母顺序创建资源
D) 仅使用模块时

<details>
<summary>答案</summary>

**B) 从 Map 或 Set 创建资源，且需要稳定标识**

需要用键而不是索引标识资源时，优先使用 for_each，避免列表顺序变化造成非预期资源销毁。

</details>

---

### 第 8 题：GPU 实例供应

**使用哪个 Terraform 元参数仅在生产环境创建昂贵 GPU 实例？**

A) `lifecycle { prevent_destroy = true }`
B) `count = var.environment == "prod" ? 3 : 0`
C) `depends_on = [var.environment]`
D) `for_each = var.gpu_instances`

<details>
<summary>答案</summary>

**B) `count = var.environment == "prod" ? 3 : 0`**

将 count 与条件表达式结合，可按条件创建资源。count 为 0 时不创建资源，从而节省非生产环境费用。

</details>

---

### 第 9 题：Terraform Plan

**terraform plan 的作用是什么？**

A) 创建基础设施资源
B) 预览变更而不实际执行
C) 格式化文件
D) 初始化工作目录

<details>
<summary>答案</summary>

**B) 预览变更而不实际执行**

生成执行计划，展示达到期望状态所需操作。它是预演，不修改实际基础设施。

</details>

---

### 第 10 题：Terraform 状态锁

**S3 后端中使用 DynamoDB 实现状态锁的作用是什么？**

A) 加密状态文件
B) 防止可能损坏状态的并发 Terraform 操作
C) 自动备份状态
D) 为状态文件进行版本管理

<details>
<summary>答案</summary>

**B) 防止可能损坏状态的并发 Terraform 操作**

状态锁防止多个成员同时运行 terraform apply 而损坏状态。原文使用 DynamoDB 为 S3 后端提供锁机制。

</details>

---

### 第 11 题：数据源

**Terraform 数据源用于什么？**

A) 创建新基础设施
B) 获取现有资源的信息
C) 安全存储敏感数据
D) 定义输入变量

<details>
<summary>答案</summary>

**B) 获取现有资源的信息**

数据源允许查询现有基础设施（如 AMI、VPC 或可用区），并在配置中使用相关信息，属于读取操作。

</details>

---

### 第 12 题：Terraform 模块

**Terraform 模块的主要用途是什么？**

A) 加快 Terraform 运行
B) 组织与复用基础设施代码
C) 加密敏感数据
D) 管理状态文件

<details>
<summary>答案</summary>

**B) 组织与复用基础设施代码**

模块封装共同使用的多个资源，支持复用、组织及复杂基础设施模式的抽象。

</details>

---

### 第 13 题：Pulumi 与 Terraform

**Pulumi 与 Terraform 的主要区别是什么？**

A) Pulumi 跨云，Terraform 仅 AWS
B) Pulumi 使用通用编程语言，Terraform 使用 HCL
C) Terraform 支持状态管理，Pulumi 不支持
D) Pulumi 是命令式，Terraform 是声明式

<details>
<summary>答案</summary>

**B) Pulumi 使用通用编程语言，Terraform 使用 HCL**

Pulumi 支持 Python、TypeScript、Go 等语言，Terraform 使用领域专用语言 HCL。二者均为声明式，支持多云。

</details>

---

### 第 14 题：ML 训练的 Spot 实例

**Spot 实例为何有利于 Terraform 管理的 ML 训练？**

A) GPU 性能更好
B) 比按需实例最多便宜 90%
C) 保证永不被中断
D) 网络更快

<details>
<summary>答案</summary>

**B) 比按需实例最多便宜 90%**

利用云平台空闲容量，Spot 实例可显著节省费用（原文最高 90%）。可能中断，适用于具备检查点的容错训练。

</details>

---

### 第 15 题：敏感输出

**如何标记 Terraform 输出为敏感，防止其显示在 CLI？**

A) `output "password" { value = var.password }`
B) `output "password" { value = var.password, sensitive = true }`
C) `output "password" { value = var.password, hidden = true }`
D) `output "password" { value = var.password, encrypted = true }`

<details>
<summary>答案</summary>

**B) `output "password" { value = var.password, sensitive = true }`**

sensitive = true 可在常规 CLI 输出中隐藏敏感值，保护密码或 API Key 等信息。

</details>

---

### 第 16 题：Terraform Workspace

**Terraform Workspace 的用途是什么？**

A) 在不同云服务商运行 Terraform
B) 使用相同配置管理多个环境（开发、预发布、生产）
C) 并行化 Terraform 操作
D) Terraform 代码版本管理

<details>
<summary>答案</summary>

**B) 使用相同配置管理多个环境（开发、预发布、生产）**

Workspace 通过独立状态文件，支持使用同一配置管理多个环境。每个 Workspace 有独立状态。

</details>

---

### 第 17 题：基础设施 GitOps

**基础设施 GitOps 的关键原则是什么？**

A) 直接在云控制台变更
B) 通过 Git PR 及自动化流水线变更
C) 基础设施代码不使用 Git
D) 仅开发人员可变更基础设施

<details>
<summary>答案</summary>

**B) 通过 Git PR 及自动化流水线变更**

GitOps 将 Git 作为唯一事实来源。所有变更通过 PR 提议、审查，再由 CI/CD 自动应用。

</details>

---

### 第 18 题：terraform fmt

**terraform fmt 命令有什么作用？**

A) 验证配置语法
B) 按规范风格格式化代码
C) 创建执行计划
D) 初始化工作目录

<details>
<summary>答案</summary>

**B) 按规范风格格式化代码**

自动将 Terraform 配置文件格式化为规范风格，保证代码库一致性，便于代码审查及 CI/CD。

</details>

---

### 第 19 题：防止资源销毁

**哪个生命周期元参数防止意外销毁关键资源？**

A) `create_before_destroy = true`
B) `prevent_destroy = true`
C) `ignore_changes = all`
D) `destroy = false`

<details>
<summary>答案</summary>

**B) `prevent_destroy = true`**

在 lifecycle 块设置 prevent_destroy = true 后，Terraform 将拒绝会销毁该资源的计划，防止意外删除。

</details>

---

### 第 20 题：EC2 的 IAM 角色

**为什么 ML 训练 EC2 实例应使用 IAM 角色而非硬编码凭据？**

A) IAM 角色更快
B) IAM 角色提供自动轮换的临时凭据
C) AWS 强制使用 IAM 角色
D) IAM 角色更便宜

<details>
<summary>答案</summary>

**B) IAM 角色提供自动轮换的临时凭据**

通过 Instance Profile 使用 EC2 IAM 角色，提供自动轮换的临时凭据。相比硬编码访问密钥更安全，符合 AWS 最佳实践。

</details>

---

### 第 21 题：状态文件安全

**Terraform 状态文件可能包含敏感数据，最佳实践是什么？**

A) 提交到 Git 备份
B) 使用加密远程状态（如 S3 + KMS）
C) 只保存在本地机器
D) 通过电子邮件发送给团队成员

<details>
<summary>答案</summary>

**B) 使用加密远程状态（如 S3 + KMS）**

状态文件常包含敏感信息。加密远程状态（S3 + KMS、Terraform Cloud 等）有助于安全、备份及团队协作。

</details>

---

### 第 22 题：tfsec 与 Checkov

**tfsec 与 Checkov 在 IaC 工作流中做什么？**

A) 格式化 Terraform 代码
B) 扫描基础设施代码的安全问题与错误配置
C) 生成文档
D) 部署基础设施

<details>
<summary>答案</summary>

**B) 扫描基础设施代码的安全问题与错误配置**

部署前分析 Terraform 代码，发现潜在安全问题、合规及最佳实践违规。

</details>

---

### 第 23 题：推理自动扩缩容

**使用哪个 Terraform 资源基于负载自动扩缩容 ML 推理服务器？**

A) `aws_instance`
B) `aws_autoscaling_group`
C) `aws_lambda_function`
D) `aws_ecs_task`

<details>
<summary>答案</summary>

**B) `aws_autoscaling_group`**

Auto Scaling Group 按需求自动调整 EC2 实例数。ML 推理可使用 CPU、请求数或自定义指标扩缩容。

</details>

---

### 第 24 题：Terraform Import

**terraform import 的作用是什么？**

A) 导入 Provider 插件
B) 将已有基础设施纳入 Terraform 管理
C) 从 Registry 导入模块
D) 加载变量文件

<details>
<summary>答案</summary>

**B) 将已有基础设施纳入 Terraform 管理**

将现有云资源导入 Terraform State，以便后续管理。传统 import 工作流仍需编写相应配置。

</details>

---

### 第 25 题：费用优化

**哪个工具可以在应用 Terraform 变更前估算基础设施成本？**

A) terraform plan
B) Infracost
C) terraform validate
D) tfsec

<details>
<summary>答案</summary>

**B) Infracost**

Infracost 分析 Terraform 代码并在部署前估算费用，集成 CI/CD 后可在 PR 中展示基础设施变更的费用影响。

</details>

---

## 场景题

### 场景 1：多环境 ML 基础设施

**背景：**

为 ML 训练平台构建基础设施，需要独立的开发、预发布及生产环境。每个环境需要：
- 开发：1 台 t3.large。
- 预发布：2 台 p3.2xlarge GPU 实例。
- 生产：4 台 p3.8xlarge GPU 实例。

各环境共享代码库，但配置不同。

**问题：** 使用 Terraform 管理这些环境的最佳方法是什么？

A) 创建三个重复代码的独立 Terraform 项目  
B) 使用 Terraform Workspace 及各环境的变量文件  
C) 所有环境使用硬编码值的单一配置  
D) 手动创建开发/预发布资源，仅生产使用 Terraform

**你的答案与解释：**

<details>
<summary>推荐答案</summary>

**B) 使用 Terraform Workspace 及各环境变量文件。**

**解释：**
最佳实践是采用 Workspace 或独立目录，以及针对环境的 .tfvars 文件：

```hcl
# variables.tf
variable "environment" {
  type = string
}

variable "instance_config" {
  type = map(object({
    count = number
    type  = string
  }))
  default = {
    dev = {
      count = 1
      type  = "t3.large"
    }
    staging = {
      count = 2
      type  = "p3.2xlarge"
    }
    prod = {
      count = 4
      type  = "p3.8xlarge"
    }
  }
}

# main.tf
resource "aws_instance" "ml_cluster" {
  count         = var.instance_config[var.environment].count
  instance_type = var.instance_config[var.environment].type
  # ...
}
```

然后使用各 Workspace 的 tfvars：

```bash
terraform workspace new dev
terraform apply -var="environment=dev"
```

该方法遵循 DRY（不要重复自己）原则，并支持不同环境配置。
</details>

---

### 场景 2：状态文件损坏

**背景：**
团队使用 Terraform 管理 ML 基础设施。两名工程师不慎同时运行 terraform apply，导致状态文件损坏，生产 GPU 集群状态与实际不一致。

**问题：** 如何恢复并防止再次发生？

**你的答案：**

<details>
<summary>推荐答案</summary>

**恢复步骤：**

1. **立即停止所有 Terraform 操作。**

   ```bash
   # Communicate to team to halt all terraform commands
   ```

2. **从备份恢复状态。**

   ```bash
   # If using S3 backend with versioning
   aws s3api list-object-versions --bucket my-terraform-state --prefix prod/terraform.tfstate

   # Restore previous version
   aws s3api get-object --bucket my-terraform-state \
     --key prod/terraform.tfstate \
     --version-id <previous-version-id> \
     terraform.tfstate.restored
   ```

3. **验证基础设施。**

   ```bash
   terraform plan
   # Check if plan matches expected state
   ```

4. **必要时刷新状态。**

   ```bash
   terraform refresh
   # Updates state to match real infrastructure
   ```

**预防：**

1. **启用状态锁。**

   ```hcl
   terraform {
     backend "s3" {
       bucket         = "my-terraform-state"
       key            = "prod/terraform.tfstate"
       region         = "us-west-2"
       dynamodb_table = "terraform-state-lock"  # State locking
       encrypt        = true
     }
   }
   ```

2. **启用 S3 版本管理。**

   ```hcl
   resource "aws_s3_bucket_versioning" "state" {
     bucket = aws_s3_bucket.terraform_state.id
     versioning_configuration {
       status = "Enabled"
     }
   }
   ```

3. **实施 CI/CD。**
   - 使用 Atlantis 或 GitHub Actions。
   - 仅允许通过自动化流水线执行 terraform apply。
   - 要求 PR 审批。
4. **团队培训。**
   - 培训状态管理。
   - 为常见场景建立运行手册。
</details>

---

### 场景 3：密钥管理

**背景：**

部署 ML 推理服务，需要：
- 用于存储预测的数据库密码。
- 外部 ML 模型 API 的 API Key。
- 用于访问 S3 存储桶的 AWS 访问密钥。

服务运行于由 Terraform 管理的 EC2 实例上。

**问题：** 如何在 Terraform 配置中安全管理密钥？

**你的答案：**

<details>
<summary>推荐答案</summary>

**安全密钥管理方案：**

1. **使用 AWS Secrets Manager 保存敏感数据。**

   ```hcl
   # Create secrets in Secrets Manager
   resource "aws_secretsmanager_secret" "db_password" {
     name = "ml-inference-db-password"
   }

   resource "aws_secretsmanager_secret_version" "db_password" {
     secret_id     = aws_secretsmanager_secret.db_password.id
     secret_string = var.db_password  # Provided via TF_VAR or secure CI/CD
   }

   resource "aws_secretsmanager_secret" "api_key" {
     name = "ml-model-api-key"
   }

   resource "aws_secretsmanager_secret_version" "api_key" {
     secret_id     = aws_secretsmanager_secret.api_key.id
     secret_string = var.ml_api_key
   }
   ```

2. **使用 IAM 角色，而非访问密钥。**

   ```hcl
   # Create IAM role with S3 permissions
   resource "aws_iam_role" "ml_inference" {
     name = "ml-inference-role"

     assume_role_policy = jsonencode({
       Version = "2012-10-17"
       Statement = [{
         Action = "sts:AssumeRole"
         Effect = "Allow"
         Principal = {
           Service = "ec2.amazonaws.com"
         }
       }]
     })
   }

   resource "aws_iam_role_policy" "s3_access" {
     role = aws_iam_role.ml_inference.id

     policy = jsonencode({
       Version = "2012-10-17"
       Statement = [{
         Action   = ["s3:GetObject", "s3:PutObject"]
         Effect   = "Allow"
         Resource = "arn:aws:s3:::ml-predictions/*"
       }]
     })
   }

   # Grant permission to read secrets
   resource "aws_iam_role_policy" "secrets_access" {
     role = aws_iam_role.ml_inference.id

     policy = jsonencode({
       Version = "2012-10-17"
       Statement = [{
         Action   = ["secretsmanager:GetSecretValue"]
         Effect   = "Allow"
         Resource = [
           aws_secretsmanager_secret.db_password.arn,
           aws_secretsmanager_secret.api_key.arn
         ]
       }]
     })
   }

   # Attach role to instance
   resource "aws_iam_instance_profile" "ml_inference" {
     name = "ml-inference-profile"
     role = aws_iam_role.ml_inference.name
   }

   resource "aws_instance" "ml_inference" {
     ami                  = data.aws_ami.ml_ami.id
     instance_type        = "c5.2xlarge"
     iam_instance_profile = aws_iam_instance_profile.ml_inference.name

     user_data = <<-EOF
       #!/bin/bash
       # Application retrieves secrets at runtime
       DB_PASSWORD=$(aws secretsmanager get-secret-value \
         --secret-id ${aws_secretsmanager_secret.db_password.id} \
         --query SecretString --output text)

       API_KEY=$(aws secretsmanager get-secret-value \
         --secret-id ${aws_secretsmanager_secret.api_key.id} \
         --query SecretString --output text)

       # Start application with secrets from environment
       export DB_PASSWORD
       export API_KEY
       /opt/ml-service/start.sh
     EOF
   }
   ```

3. **绝不提交密钥。**

   ```hcl
   # .gitignore
   *.tfvars
   terraform.tfstate
   terraform.tfstate.backup
   .terraform/
   ```

4. **使用加密状态。**

   ```hcl
   terraform {
     backend "s3" {
       bucket  = "terraform-state"
       key     = "ml-inference/terraform.tfstate"
       region  = "us-west-2"
       encrypt = true
       kms_key_id = "arn:aws:kms:us-west-2:123456789:key/..."
     }
   }
   ```

**不要做：**
- 在 .tf 文件硬编码密钥。
- 提交包含密钥的 terraform.tfvars。
- 可使用 IAM 角色时使用访问密钥。
- 在明文环境变量中保存密钥。
- 状态文件不加密。
</details>

---

## 测验评分指南

### 分值分布
- **选择题（1–25）：** 每题 1 分，共 25 分。
- **场景 1：** 1 分。
- **场景 2：** 1 分。
- **场景 3：** 1 分。

**满分：** 28 分。

### 评分等级
- **25–28 分（89–100%）：** 优秀，IaC 理解深入。
- **20–24 分（71–86%）：** 良好，IaC 基础扎实。
- **16–19 分（57–68%）：** 需要改进，复习讲义。
- **低于 16 分（低于 57%）：** 不足，重新学习模块。

### 按成绩推荐下一步

**优秀（89–100%）**
- 进入模块 10：LLM 基础设施。
- 考虑进阶 IaC 主题（Terragrunt、CDK for Terraform）。
- 开始实现真实项目。

**良好（71–86%）**
- 复习测验薄弱领域。
- 完成全部动手练习。
- 进入模块 10。

**需要改进（57–68%）**
- 重读第 3–8 课。
- 完成动手练习。
- 继续前重测。

**不足（低于 57%）**
- 从第 01 课重新学习。
- 完成全部练习。
- 寻找额外资源或指导。

---

## 额外实践

### 动手挑战

1. **挑战 1：** 使用 Terraform 创建完整 ML 训练基础设施。
   - 2 台 p3.2xlarge GPU 实例。
   - 用于数据与模型的 S3 存储桶。
   - 合适的 IAM 角色与安全组。
   - S3 + DynamoDB 远程状态。
2. **挑战 2：** 实现多环境配置。
   - 使用 Workspace 或独立目录。
   - 各环境实例数量不同。
   - 环境专用标签。
3. **挑战 3：** 搭建 GitOps 工作流。
   - GitHub Actions 流水线执行 terraform plan/apply。
   - 使用 tfsec 扫描安全问题。
   - 使用 Infracost 估算费用。
   - 要求 PR 审批。

---

**恭喜完成模块 09 测验！**

返回[模块 README](../README.md)，查看补充资源与下一步。

> 译注：较新 Terraform 的 S3 后端支持原生锁文件，DynamoDB 锁属于原文历史方案。sensitive 仅用于隐藏常规输出，不意味着状态中的值被移除或加密。生产与开发环境的隔离通常需要独立账号、权限及状态后端。恢复损坏状态前应备份并审查实际资源，避免强制推送或误执行破坏性计划。所有代码块保留原样。
