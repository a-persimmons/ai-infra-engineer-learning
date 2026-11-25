# 第 03 课：Terraform 状态管理

## 学习目标

完成本课后，你将能够：

- 理解 Terraform State 的含义及其重要性。
- 区分本地与远程状态后端。
- 配置 S3 + DynamoDB 后端，实现团队协作。
- 实现状态锁，防止并发修改。
- 掌握状态操作命令（list、show、mv、rm、pull、push）。
- 使用 Workspace 管理多个环境。
- 加密保护状态文件。
- 规划备份及灾难恢复。
- 将状态管理最佳实践应用于 ML 基础设施。

## 什么是 Terraform State？

### 状态文件

Terraform 将受管理基础设施的信息保存到**状态文件**（`terraform.tfstate`）中。它是一个将 Terraform 配置映射至真实资源的 JSON 文件。

**状态文件片段示例：**
```json
{
  "version": 4,
  "terraform_version": "1.6.0",
  "serial": 3,
  "lineage": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "outputs": {
    "ml_server_ip": {
      "value": "54.123.45.67",
      "type": "string"
    }
  },
  "resources": [
    {
      "mode": "managed",
      "type": "aws_instance",
      "name": "ml_server",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "schema_version": 1,
          "attributes": {
            "id": "i-0abc123def456789",
            "instance_type": "p3.2xlarge",
            "ami": "ami-0c55b159cbfafe1f0",
            "public_ip": "54.123.45.67",
            "private_ip": "10.0.1.42",
            "tags": {
              "Name": "ML-Training-Server"
            }
          }
        }
      ]
    }
  ]
}
```

### 状态为何重要

**1. 将配置映射到真实资源**

Terraform 需要知道哪些真实资源与配置对应：

```hcl
# Your configuration
resource "aws_instance" "ml_server" {
  instance_type = "p3.2xlarge"
  ami           = "ami-12345"
}
```

状态文件表示：「此配置对应 EC2 实例 i-0abc123def456789」。

**2. 追踪元数据**

状态存储重要元数据，包括：
- 资源依赖关系。
- 输出值。
- Provider 配置相关信息。
- 资源属性。

**3. 性能优化**

对于包含数百个资源的大型基础设施，逐个查询云平台 API 较慢。状态提供缓存。

**4. 支持协作**

多个团队成员需要在同一套基础设施上工作。状态提供共享的管理记录。

### 没有状态会怎样？

```bash
# First apply
terraform apply
# Creates: EC2 instance i-0abc123

# Delete state file
rm terraform.tfstate

# Second apply
terraform apply
# Terraform doesn't know instance exists!
# Creates: ANOTHER EC2 instance i-0def456

# Result: Duplicate resources, no management, chaos!
```

## 本地状态与远程状态

### 本地状态（默认）

**位置：** 工作目录中的 `terraform.tfstate`。

**优点：**
- 适合单用户场景。
- 无需额外配置。
- 访问速度快。

**缺点：**
- 团队协作困难（文件冲突）。
- 无法跨机器共享状态锁（并发 Apply 可能导致损坏）。
- 电脑损坏时可能丢失。
- 密钥等敏感数据可能以明文存储在磁盘上。
- 默认没有完整的版本历史。

**适用场景：** 个人学习、概念验证、单开发者项目。

### 远程状态

**位置：** 云存储（S3、Azure Blob、GCS、Terraform Cloud）。

**优点：**
- 支持团队协作。
- 支持状态锁（取决于后端及配置）。
- 版本管理与备份。
- 静态加密。
- 访问控制。
- 灾难恢复。

**缺点：**
- 需要初始配置。
- 可能产生费用（原文认为通常很低）。

**适用场景：** 生产基础设施、团队项目、ML 平台。

## 配置远程状态：S3 + DynamoDB

原文介绍的 AWS 常见远程后端组合：
- **S3：** 存储状态文件。
- **DynamoDB：** 提供状态锁。

> 译注：较新 Terraform 的 S3 后端支持原生 S3 锁文件（use_lockfile），DynamoDB 锁定机制已进入弃用路径。新项目应依据所用版本的文档选择；以下保留原文方案。

### 步骤 1：创建用于状态的 S3 存储桶

```hcl
# bootstrap/s3-backend.tf
# Run this first to create the backend infrastructure

provider "aws" {
  region = "us-west-2"
}

# S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "my-company-terraform-state"  # Must be globally unique

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name        = "Terraform State Bucket"
    Purpose     = "Infrastructure State"
    ManagedBy   = "Terraform"
  }
}

# Enable versioning (keep history of state changes)
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption (protect secrets in state)
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access (security best practice)
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable logging (audit access to state)
resource "aws_s3_bucket" "terraform_logs" {
  bucket = "my-company-terraform-state-logs"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_logging" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  target_bucket = aws_s3_bucket.terraform_logs.id
  target_prefix = "state-access-logs/"
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"  # On-demand pricing
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name      = "Terraform State Locks"
    Purpose   = "State Locking"
    ManagedBy = "Terraform"
  }
}

# Outputs
output "s3_bucket_name" {
  value       = aws_s3_bucket.terraform_state.id
  description = "Name of the S3 bucket for Terraform state"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "Name of DynamoDB table for state locking"
}
```

**部署后端基础设施：**
```bash
cd bootstrap
terraform init
terraform apply

# Note the outputs
# s3_bucket_name = "my-company-terraform-state"
# dynamodb_table_name = "terraform-state-locks"
```

### 步骤 2：在项目中配置 Backend

**backend.tf（主项目中）：**
```hcl
terraform {
  backend "s3" {
    bucket         = "my-company-terraform-state"
    key            = "ml-infrastructure/production/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true

    # Optional: Use assume role for cross-account access
    # role_arn = "arn:aws:iam::123456789012:role/TerraformRole"
  }
}
```

**关键参数说明：**
- `bucket`：S3 存储桶名称。
- `key`：状态文件路径（同一存储桶可以支持多个项目）。
- `region`：存储桶所在 AWS 区域。
- `dynamodb_table`：用于锁定的表。
- `encrypt`：启用服务端加密。

### 步骤 3：从本地状态迁移至远程状态

```bash
# Your project with local state
cd ml-infrastructure

# Add backend.tf configuration (as shown above)

# Initialize with backend migration
terraform init -migrate-state

# Terraform will prompt:
# Do you want to copy existing state to the new backend?
#   Pre-existing state was found while migrating the previous "local" backend to the
#   newly configured "s3" backend. No existing state was found in the newly
#   configured "s3" backend. Do you want to copy this state to the new "s3"
#   backend? Enter "yes" to copy and "no" to start with an empty state.

# Enter: yes

# Verify migration
terraform state list

# Old local state is now in S3
# Local terraform.tfstate is backed up as terraform.tfstate.backup
```

### 多项目与多环境模式

```hcl
# Use different state file paths per environment

# Development environment
terraform {
  backend "s3" {
    bucket = "my-company-terraform-state"
    key    = "ml-platform/dev/terraform.tfstate"
    region = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt = true
  }
}

# Staging environment
terraform {
  backend "s3" {
    bucket = "my-company-terraform-state"
    key    = "ml-platform/staging/terraform.tfstate"
    region = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt = true
  }
}

# Production environment
terraform {
  backend "s3" {
    bucket = "my-company-terraform-state"
    key    = "ml-platform/production/terraform.tfstate"
    region = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt = true
  }
}
```

**目录结构：**
```
ml-platform/
├── environments/
│   ├── dev/
│   │   ├── backend.tf      # dev state path
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── backend.tf      # staging state path
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── backend.tf      # production state path
│       ├── main.tf
│       └── terraform.tfvars
└── modules/
    └── gpu-cluster/
```

## 状态锁

状态锁用于防止多个用户同时运行会修改同一状态的 Terraform 操作，例如 apply，以免造成冲突或状态损坏。

### 锁定机制

```
User 1: terraform apply
  ↓
  Acquires lock in DynamoDB (LockID: "ml-platform/prod/terraform.tfstate")
  ↓
  Reading state from S3...
  ↓
  Making changes...
  ↓
  Writing state to S3...
  ↓
  Releases lock

User 2: terraform apply (while User 1 is still running)
  ↓
  Attempts to acquire lock
  ↓
  Lock is already held!
  ↓
  Error: Error acquiring the state lock
```

**错误信息：**
```
Error: Error acquiring the state lock

Error message: ConditionalCheckFailedException: The conditional request failed
Lock Info:
  ID:        a1b2c3d4-e5f6-7890-abcd-ef1234567890
  Path:      my-company-terraform-state/ml-platform/prod/terraform.tfstate
  Operation: OperationTypeApply
  Who:       user1@host1
  Version:   1.6.0
  Created:   2024-01-15 10:30:00 UTC
  Info:

Terraform acquires a state lock to protect the state from being written
by multiple users at the same time. Please resolve the issue above and try
again. For most commands, you can disable locking with the "-lock=false"
flag, but this is not recommended.
```

### 查看锁定状态

锁定期间的 DynamoDB 表记录：
```json
{
  "LockID": "my-company-terraform-state/ml-platform/prod/terraform.tfstate",
  "Info": "{\"ID\":\"a1b2c3d4-e5f6-7890-abcd-ef1234567890\",\"Operation\":\"OperationTypeApply\",\"Info\":\"\",\"Who\":\"user1@host1\",\"Version\":\"1.6.0\",\"Created\":\"2024-01-15T10:30:00Z\",\"Path\":\"my-company-terraform-state/ml-platform/prod/terraform.tfstate\"}"
}
```

### 强制解锁（仅限紧急情况）

如果锁无法释放，例如进程崩溃：

```bash
# Get lock ID from error message
terraform force-unlock a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Terraform will warn:
# Do not unlock the state unless you are certain another process is not holding the lock.
# Unlocking the state when another process holds it can cause corruption and data loss.

# Only proceed if you're ABSOLUTELY SURE no other process is running
```

**更安全的方式：**
```bash
# Check if process is actually running
ps aux | grep terraform

# Or check DynamoDB table
aws dynamodb get-item \
  --table-name terraform-state-locks \
  --key '{"LockID":{"S":"my-company-terraform-state/ml-platform/prod/terraform.tfstate"}}'

# If legitimately stuck, force unlock
terraform force-unlock <lock-id>
```

## 状态命令

### terraform state list

列出状态中的全部资源。

```bash
# List all resources
terraform state list

# Output:
# aws_instance.ml_server
# aws_s3_bucket.datasets
# aws_s3_bucket.models
# aws_security_group.ml_sg
# aws_iam_role.ml_role
# aws_iam_instance_profile.ml_profile

# Filter resources
terraform state list | grep aws_instance
# aws_instance.ml_server
# aws_instance.gpu_cluster[0]
# aws_instance.gpu_cluster[1]
# aws_instance.gpu_cluster[2]
```

### terraform state show

展示特定资源的详细信息。

```bash
# Show resource details
terraform state show aws_instance.ml_server

# Output:
# resource "aws_instance" "ml_server" {
#     ami                          = "ami-0c55b159cbfafe1f0"
#     arn                          = "arn:aws:ec2:us-west-2:123456789012:instance/i-0abc123def456789"
#     associate_public_ip_address  = true
#     availability_zone            = "us-west-2a"
#     id                           = "i-0abc123def456789"
#     instance_type                = "p3.2xlarge"
#     private_ip                   = "10.0.1.42"
#     public_ip                    = "54.123.45.67"
#     tags                         = {
#         "Name" = "ML-Training-Server"
#     }
#     vpc_security_group_ids       = [
#         "sg-0def456ghi789jkl0",
#     ]
# }

# Use in scripts
PUBLIC_IP=$(terraform state show aws_instance.ml_server | grep public_ip | head -1 | awk '{print $3}' | tr -d '"')
echo $PUBLIC_IP
```

### terraform state mv

移动或重命名状态中的资源地址，不直接改变实际基础设施。

**使用场景：**
1. 重命名配置中的资源。
2. 在模块间移动资源。
3. 重构基础设施。

**示例 1：重命名资源**
```hcl
# Old configuration
resource "aws_instance" "old_name" {
  ami           = "ami-12345"
  instance_type = "p3.2xlarge"
}

# New configuration (you want to rename)
resource "aws_instance" "new_name" {
  ami           = "ami-12345"
  instance_type = "p3.2xlarge"
}
```

如果没有执行 state mv 或声明相应的 moved 块，Terraform 可能销毁 old_name 并创建 new_name，造成停机。

```bash
# Rename in state first
terraform state mv aws_instance.old_name aws_instance.new_name

# Then update configuration
# Now terraform plan shows no changes
```

**示例 2：移动到模块**
```bash
# Before: resource at root level
# resource "aws_instance" "ml_server"

# Move to module
terraform state mv aws_instance.ml_server module.gpu_cluster.aws_instance.ml_server

# Update configuration to use module
# module "gpu_cluster" {
#   source = "./modules/gpu-cluster"
# }
```

**示例 3：拆分资源**
```bash
# You have a count-based resource
# resource "aws_instance" "cluster" {
#   count = 3
# }

# Access: aws_instance.cluster[0], [1], [2]

# Split into individual resources
terraform state mv 'aws_instance.cluster[0]' aws_instance.cluster_node_1
terraform state mv 'aws_instance.cluster[1]' aws_instance.cluster_node_2
terraform state mv 'aws_instance.cluster[2]' aws_instance.cluster_node_3
```

### terraform state rm

从状态中移除资源，不直接销毁真实基础设施。

**使用场景：**
1. 停止使用 Terraform 管理某个资源。
2. 错误导入了手动创建的资源。
3. 将资源移交给另一团队或系统。

```bash
# Remove resource from state
terraform state rm aws_instance.legacy_server

# The EC2 instance still exists in AWS
# But Terraform no longer manages it

# Next terraform apply won't try to modify or destroy it
```

**资源移交流程：**
```bash
# Scenario: Moving ML inference cluster to another team

# 1. Export resource configuration
terraform state show aws_instance.inference_cluster > inference_cluster.txt

# 2. Remove from your state
terraform state rm aws_instance.inference_cluster

# 3. Remove from your .tf files
# (delete the resource block)

# 4. Verify
terraform plan
# Should show no changes for this resource

# 5. Give inference_cluster.txt and resource ID to other team
# They can import it: terraform import aws_instance.their_name i-0abc123
```

### terraform state pull

将远程状态下载至标准输出。

```bash
# View remote state
terraform state pull

# Save to file
terraform state pull > state-backup.json

# Use in scripts
STATE=$(terraform state pull)
echo $STATE | jq '.resources[] | select(.type=="aws_instance")'
```

### terraform state push

将本地状态上传到远程后端（危险操作，极少需要）。

```bash
# Restore from backup
terraform state push state-backup.json

# Warning: This will overwrite remote state!
# Only use for disaster recovery
```

**更安全的替代方案：**
- S3 版本管理（恢复此前版本）。
- Terraform Cloud/Enterprise 状态备份。

### terraform state replace-provider

更新状态中的 Provider 引用，适用于 Provider 迁移。

```bash
# Scenario: Migrating from community provider to official one

# Old provider: registry.terraform.io/terraform-providers/aws
# New provider: registry.terraform.io/hashicorp/aws

terraform state replace-provider \
  registry.terraform.io/terraform-providers/aws \
  registry.terraform.io/hashicorp/aws
```

## Workspace（工作空间）

Workspace 允许使用同一套配置管理基础设施的多个实例。

### 默认 Workspace

每个 Terraform 项目初始具有 default 工作空间。

```bash
# Show current workspace
terraform workspace show
# default

# List all workspaces
terraform workspace list
# * default
```

### 创建并使用 Workspace

```bash
# Create development workspace
terraform workspace new dev
# Created and switched to workspace "dev"!

# Create staging workspace
terraform workspace new staging

# Create production workspace
terraform workspace new production

# List workspaces
terraform workspace list
#   default
#   dev
# * production
#   staging

# Switch workspace
terraform workspace select dev
# Switched to workspace "dev".

# Delete workspace (must be empty)
terraform workspace delete staging
```

### 感知 Workspace 的配置

```hcl
# Use workspace name in resource naming
resource "aws_instance" "ml_server" {
  ami           = "ami-12345"
  instance_type = terraform.workspace == "production" ? "p3.8xlarge" : "p3.2xlarge"

  tags = {
    Name        = "ml-server-${terraform.workspace}"
    Environment = terraform.workspace
  }
}

# Different instance counts per workspace
resource "aws_instance" "training_cluster" {
  count = terraform.workspace == "production" ? 10 : 2

  ami           = "ami-12345"
  instance_type = "p3.8xlarge"

  tags = {
    Name        = "training-${terraform.workspace}-${count.index}"
    Environment = terraform.workspace
  }
}

# Load workspace-specific variables
locals {
  env_config = {
    dev = {
      instance_count = 1
      instance_type  = "t3.large"
      disk_size      = 50
    }
    staging = {
      instance_count = 2
      instance_type  = "p3.2xlarge"
      disk_size      = 100
    }
    production = {
      instance_count = 10
      instance_type  = "p3.8xlarge"
      disk_size      = 500
    }
  }

  config = local.env_config[terraform.workspace]
}

resource "aws_instance" "ml_cluster" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type

  root_block_device {
    volume_size = local.config.disk_size
  }
}
```

### Workspace 与远程状态

使用 S3 后端时，每个 Workspace 具有自己的状态文件：

```
my-company-terraform-state/
└── ml-platform/
    └── env:/
        ├── default/
        │   └── terraform.tfstate
        ├── dev/
        │   └── terraform.tfstate
        ├── staging/
        │   └── terraform.tfstate
        └── production/
            └── terraform.tfstate
```

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-company-terraform-state"
    key            = "ml-platform/terraform.tfstate"  # Base path
    region         = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}

# Actual paths:
# dev:        ml-platform/env:/dev/terraform.tfstate
# staging:    ml-platform/env:/staging/terraform.tfstate
# production: ml-platform/env:/production/terraform.tfstate
```

### Workspace 与独立目录比较

**Workspace：**
- 所有环境使用同一套代码。
- 容易切换环境。
- 减少代码重复。
- 存在将变更应用到错误环境的风险。
- 共享后端配置。

**独立目录：**
- 有利于实现环境隔离。
- 每个环境可以使用不同后端。
- 更容易强制落实关注点分离。
- 可能出现代码重复。
- 保持配置同步更加复杂。

**针对 ML 基础设施的建议：**
生产与非生产环境使用独立目录，在非生产环境内部使用 Workspace：

```
ml-infrastructure/
├── production/           # Separate directory for production
│   ├── backend.tf       # Production-specific backend
│   ├── main.tf
│   └── terraform.tfvars
└── non-production/      # Separate directory for dev/staging
    ├── backend.tf       # Non-prod backend
    ├── main.tf
    └── terraform.tfvars # Use workspaces: dev, staging
```

## 状态安全与加密

### 静态加密

**S3 加密（步骤 1 中已配置）：**
```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # AWS-managed keys
    }
  }
}

# Or use KMS for more control
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
  }
}

resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}
```

### 传输加密

始终为 S3 后端使用 HTTPS（默认启用）。

### 状态中的敏感数据

**问题：** 状态文件可能包含明文敏感信息。

```json
{
  "resources": [
    {
      "type": "aws_db_instance",
      "name": "ml_database",
      "instances": [{
        "attributes": {
          "password": "super-secret-password-123",  // ❌ Visible in state!
          "username": "admin"
        }
      }]
    }
  ]
}
```

**最佳实践：**

1. **使用带加密能力的远程状态。**
2. **限制状态文件访问权限。**
3. **使用密钥管理服务。**

```hcl
# ❌ DON'T: Hardcode secrets
resource "aws_db_instance" "ml_db" {
  password = "super-secret-password"  # Will be in state!
}

# ✅ DO: Use AWS Secrets Manager
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "ml-database-password"
}

resource "aws_db_instance" "ml_db" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
  # Still in state, but at least not in code
}

# ✅ BETTER: Use IAM authentication (no passwords)
resource "aws_db_instance" "ml_db" {
  iam_database_authentication_enabled = true
  # No password needed!
}
```

### 访问控制

**S3 存储桶策略（限制状态访问）：**
```hcl
resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnforcedTLS"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "RestrictAccess"
        Effect = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::123456789012:role/TerraformRole",
            "arn:aws:iam::123456789012:user/ml-admin"
          ]
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.terraform_state.arn}/*"
      }
    ]
  })
}
```

**Terraform 用户的 IAM 策略：**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-company-terraform-state",
        "arn:aws:s3:::my-company-terraform-state/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-west-2:123456789012:table/terraform-state-locks"
    }
  ]
}
```

## 备份与灾难恢复

### S3 版本管理（自动备份）

步骤 1 中已经配置。启用版本管理后，S3 可以保留状态文件的各个版本（受生命周期策略等影响）。

**查看版本：**
```bash
# List all versions
aws s3api list-object-versions \
  --bucket my-company-terraform-state \
  --prefix ml-platform/production/terraform.tfstate

# Output shows all versions with VersionId
```

**恢复此前版本：**
```bash
# 1. Download specific version
aws s3api get-object \
  --bucket my-company-terraform-state \
  --key ml-platform/production/terraform.tfstate \
  --version-id <VERSION_ID> \
  state-backup.json

# 2. Restore using state push (CAREFUL!)
terraform state push state-backup.json
```

### 手动备份

**自动备份脚本：**
```bash
#!/bin/bash
# backup-terraform-state.sh

BUCKET="my-company-terraform-state"
STATE_KEY="ml-platform/production/terraform.tfstate"
BACKUP_DIR="./state-backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Download current state
aws s3 cp s3://${BUCKET}/${STATE_KEY} \
  ${BACKUP_DIR}/terraform.tfstate.${DATE}

# Keep only last 30 days
find $BACKUP_DIR -name "terraform.tfstate.*" -mtime +30 -delete

echo "State backed up to ${BACKUP_DIR}/terraform.tfstate.${DATE}"
```

**使用 cron 调度：**
```bash
# Run backup daily at 2 AM
0 2 * * * /path/to/backup-terraform-state.sh
```

### 灾难恢复流程

**场景：状态文件损坏**

```bash
# Step 1: Don't panic! State is versioned.

# Step 2: List recent versions
aws s3api list-object-versions \
  --bucket my-company-terraform-state \
  --prefix ml-platform/production/terraform.tfstate \
  --max-items 10

# Step 3: Download last known good version
aws s3api get-object \
  --bucket my-company-terraform-state \
  --key ml-platform/production/terraform.tfstate \
  --version-id <GOOD_VERSION_ID> \
  recovered-state.json

# Step 4: Verify the recovered state
cat recovered-state.json | jq '.resources | length'
# Should show expected number of resources

# Step 5: Push recovered state (CAREFUL!)
terraform state push recovered-state.json

# Step 6: Verify infrastructure matches
terraform plan
# Should show minimal or no changes

# Step 7: If plan looks good, you're recovered!
```

**场景：状态文件完全丢失**

如果状态和备份均丢失（远程状态配置完善时较少发生），可以尝试重建管理关系：

```bash
# Step 1: Start with empty state
rm terraform.tfstate terraform.tfstate.backup

# Step 2: Import existing resources one by one
terraform import aws_instance.ml_server i-0abc123def456789
terraform import aws_s3_bucket.datasets my-ml-datasets-bucket
terraform import aws_security_group.ml_sg sg-0def456ghi789jkl0
# ... import all resources

# Step 3: Verify
terraform plan
# Should show "No changes" or only minor differences

# This is tedious - that's why remote state + backups are critical!
```

## 实际 ML 基础设施的状态管理

### 多区域 GPU 训练平台

```hcl
# State organized by region and environment
# backend.tf

terraform {
  backend "s3" {
    bucket         = "ml-platform-terraform-state"
    key            = "${var.region}/${terraform.workspace}/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "ml-platform-state-locks"
    encrypt        = true
  }
}

# State file paths:
# us-west-2/production/terraform.tfstate
# us-east-1/production/terraform.tfstate
# eu-west-1/production/terraform.tfstate
# us-west-2/dev/terraform.tfstate
```

### 处理大型状态文件

**问题：** 包含 500 个以上资源的状态文件可能导致操作缓慢。

**方案 1：拆分为多个状态文件**
```
ml-platform/
├── networking/           # VPC, subnets, etc.
│   └── terraform.tfstate
├── compute/             # EC2, EKS clusters
│   └── terraform.tfstate
├── storage/             # S3, EFS, RDS
│   └── terraform.tfstate
└── monitoring/          # CloudWatch, Prometheus
    └── terraform.tfstate
```

**方案 2：使用 Data Source 进行跨状态引用**
```hcl
# In compute/ directory
data "terraform_remote_state" "networking" {
  backend = "s3"

  config = {
    bucket = "ml-platform-terraform-state"
    key    = "networking/production/terraform.tfstate"
    region = "us-west-2"
  }
}

# Use outputs from networking state
resource "aws_instance" "ml_server" {
  subnet_id              = data.terraform_remote_state.networking.outputs.private_subnet_id
  vpc_security_group_ids = [data.terraform_remote_state.networking.outputs.ml_sg_id]
}
```

### CI/CD 中的状态管理

**GitHub Actions 工作流：**
```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    paths:
      - 'infrastructure/**'
  push:
    branches:
      - main

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color
        working-directory: infrastructure
        continue-on-error: true

      - name: Comment PR with Plan
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const output = `#### Terraform Plan 📖\`${{ steps.plan.outcome }}\`

            <details><summary>Show Plan</summary>

            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`

            </details>`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve
        working-directory: infrastructure
```

## 最佳实践检查清单

- [ ] 团队项目始终使用远程状态。
- [ ] 为状态文件启用 S3 版本管理。
- [ ] 启用静态加密（S3、DynamoDB）。
- [ ] 配置状态锁（原文采用 DynamoDB）。
- [ ] 使用 IAM 限制状态文件访问。
- [ ] 不将状态文件提交至版本控制。
- [ ] 为每个环境设置唯一状态路径。
- [ ] 定期备份状态文件。
- [ ] 测试灾难恢复流程。
- [ ] 使用 Workspace 或独立目录管理环境。
- [ ] 监控状态文件访问（S3 日志）。
- [ ] 使用 terraform state 命令，而非手动编辑。
- [ ] 在 Pull Request 中审查计划中的状态变更，而非提交敏感状态文件。
- [ ] 记录状态文件组织结构。
- [ ] 规划灾难恢复流程。

## 应避免的常见错误

### 错误 1：将状态提交至 Git

```bash
# .gitignore
*.tfstate
*.tfstate.*
*.tfstate.backup

# ALWAYS ignore state files!
```

### 错误 2：手动编辑状态

```bash
# ❌ NEVER DO THIS
vim terraform.tfstate  # Editing state file directly

# ✅ DO THIS
terraform state rm aws_instance.old_server
terraform state mv aws_instance.a aws_instance.b
```

### 错误 3：多个环境共用同一状态文件

```hcl
# ❌ WRONG: Same state file for dev and prod
terraform {
  backend "s3" {
    bucket = "terraform-state"
    key    = "infrastructure.tfstate"  # Same for all!
  }
}

# ✅ CORRECT: Different state per environment
terraform {
  backend "s3" {
    bucket = "terraform-state"
    key    = "infrastructure/${var.environment}.tfstate"
  }
}
```

### 错误 4：忽视锁定错误

```bash
# ❌ DON'T
terraform apply -lock=false  # Skips locking!

# ✅ DO
# Wait for other user to finish, or investigate stuck lock
```

### 错误 5：没有备份

配置自动备份，并定期测试恢复。

## 核心要点

- State 是 Terraform 对基础设施的管理记录。
- 远程状态支持团队协作，提高安全性。
- S3 + DynamoDB 是原文介绍的 AWS 后端方案。
- 状态锁防止并发修改。
- 使用 terraform state 命令，不要随意手动编辑状态。
- Workspace 支持用一份配置管理多个环境实例。
- 加密状态文件（S3 加密、KMS）。
- 保留备份及灾难恢复计划。
- 使用 IAM 与存储桶策略限制访问。
- 使用独立状态文件实现生产隔离。

## 下一步

- **第 04 课：** 使用 Terraform 构建完整的 AI 基础设施。
- **第 05 课：** 探索使用 Python 编写基础设施的 Pulumi。
- **第 06 课：** 学习高级 IaC 模式及模块。

---

**下一课：** [04-building-ai-infrastructure-terraform.md](04-building-ai-infrastructure-terraform.md)

> 译注：本地后端也支持本地文件锁；但不提供跨机器协作保证。状态是管理映射和最近记录，不等同于真实资源的实时状态。执行 state rm、mv、push、force-unlock 或恢复旧版本前，应确认无人并发操作、备份当前状态并审查后续 Plan。删除状态记录并不删除资源，若配置仍然存在，后续 Apply 可能创建新资源。生产环境的隔离还需独立账号、凭据及权限。所有原始代码块及其中英文注释保持不变，未执行实际云操作。
