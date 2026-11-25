# 模块 09：基础设施即代码——动手练习

通过实践练习巩固基础设施即代码概念，培养实际 ML 基础设施技能。

---

## 练习概览

| 练习 | 主题 | 难度 | 时长 | 前置条件 |
|---|---|---|---|---|
| 01 | 部署 EC2 实例 | 初级 | 1–2 小时 | AWS 账号、已安装 Terraform |
| 02 | 用于 ML 数据的 S3 存储桶 | 初级 | 1 小时 | 练习 01 |
| 03 | 使用 Terraform 构建 GPU 集群 | 中级 | 2–3 小时 | 练习 01–02 |
| 04 | 可复用 Terraform 模块 | 中级 | 2–3 小时 | 练习 01–03 |
| 05 | 使用 S3 后端的远程状态 | 中级 | 1–2 小时 | 练习 01–04 |
| 06 | 使用 Pulumi 构建 ML 基础设施 | 中级 | 2–3 小时 | Python、已安装 Pulumi |
| 07 | 使用 GitHub Actions 的 GitOps 工作流 | 高级 | 3–4 小时 | GitHub 账号、Git 知识 |
| 08 | 密钥管理 | 高级 | 2–3 小时 | AWS Secrets Manager 知识 |

**预计总时长（原文）：** 15–21 小时。

---

## 前置条件

### 所需账号

- **AWS 账号**——符合免费层资格（注册：https://aws.amazon.com/free/）。
- **GitHub 账号**——用于练习 07（https://github.com/ 免费注册）。

### 所需工具

```bash
# Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# AWS CLI
brew install awscli  # macOS
# or download from https://aws.amazon.com/cli/

# Git
brew install git  # macOS

# (Optional) Pulumi for Exercise 06
brew install pulumi  # macOS
# or download from https://www.pulumi.com/docs/install/

# (Optional) Pre-commit for Exercise 08
pip install pre-commit
```

### AWS 配置

```bash
# Configure AWS credentials
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-west-2)
# - Output format (json)

# Verify
aws sts get-caller-identity
```

---

## 练习 01：部署第一个 EC2 实例

**目标：** 使用 Terraform 创建基础 EC2 实例，理解核心工作流。

### 学习目标

- 理解 Terraform 项目结构。
- 编写基础 HCL 配置。
- 使用 terraform init、plan、apply、destroy。
- 引用数据源。

### 步骤

1. **创建项目目录。**
   ```bash
   mkdir exercise-01-ec2
   cd exercise-01-ec2
   ```

2. **创建 versions.tf。**
   ```hcl
   terraform {
     required_version = ">= 1.0"

     required_providers {
       aws = {
         source  = "hashicorp/aws"
         version = "~> 5.0"
       }
     }
   }
   ```

3. **创建 main.tf。**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   # Data source: Latest Amazon Linux 2 AMI
   data "aws_ami" "amazon_linux" {
     most_recent = true
     owners      = ["amazon"]

     filter {
       name   = "name"
       values = ["amzn2-ami-hvm-*-x86_64-gp2"]
     }
   }

   # Security group
   resource "aws_security_group" "allow_ssh" {
     name        = "allow-ssh"
     description = "Allow SSH inbound traffic"

     ingress {
       description = "SSH from anywhere"
       from_port   = 22
       to_port     = 22
       protocol    = "tcp"
       cidr_blocks = ["0.0.0.0/0"]  # TODO: Restrict this in production!
     }

     egress {
       from_port   = 0
       to_port     = 0
       protocol    = "-1"
       cidr_blocks = ["0.0.0.0/0"]
     }

     tags = {
       Name = "allow-ssh"
     }
   }

   # EC2 instance
   resource "aws_instance" "web" {
     ami           = data.aws_ami.amazon_linux.id
     instance_type = "t3.micro"  # Free tier eligible

     vpc_security_group_ids = [aws_security_group.allow_ssh.id]

     tags = {
       Name = "Exercise-01-Instance"
     }
   }
   ```

4. **创建 outputs.tf。**
   ```hcl
   output "instance_id" {
     description = "ID of the EC2 instance"
     value       = aws_instance.web.id
   }

   output "instance_public_ip" {
     description = "Public IP address of the EC2 instance"
     value       = aws_instance.web.public_ip
   }

   output "ssh_command" {
     description = "SSH command to connect to instance"
     value       = "ssh ec2-user@${aws_instance.web.public_ip}"
   }
   ```

5. **创建 .gitignore。**
   ```
   .terraform/
   *.tfstate
   *.tfstate.backup
   .terraform.lock.hcl
   ```

6. **部署。**
   ```bash
   # Initialize Terraform
   terraform init

   # Format code
   terraform fmt

   # Validate syntax
   terraform validate

   # Preview changes
   terraform plan

   # Apply changes
   terraform apply
   # Type 'yes' when prompted

   # View outputs
   terraform output

   # SSH to instance (if you have a key pair configured)
   ssh ec2-user@$(terraform output -raw instance_public_ip)

   # Destroy when done
   terraform destroy
   # Type 'yes' to confirm
   ```

### 挑战任务

- [ ] 添加密钥对，启用 SSH 访问。
- [ ] 将实例类型改为 t3.small，重新应用配置。
- [ ] 添加 User Data，启动时安装 nginx。
- [ ] 添加多条安全组规则（HTTP、HTTPS）。
- [ ] 使用姓名及日期标记资源。

### 预期结果

- 成功创建 EC2 实例。
- 已关联安全组。
- 输出公共 IP 地址。
- 可以通过 SSH 访问实例（如果配置了密钥）。
- 在本地创建 Terraform 状态文件。

---

## 练习 02：用于 ML 数据的 S3 存储桶

**目标：** 创建具有合适配置的 S3 存储桶，用于 ML 数据集及模型。

### 学习目标

- 为 S3 存储桶配置生命周期策略。
- 为模型存储启用版本管理。
- 设置存储桶加密。
- 使用变量进行配置。

### 步骤

1. **创建项目目录。**
   ```bash
   mkdir exercise-02-s3
   cd exercise-02-s3
   ```

2. **创建 variables.tf。**
   ```hcl
   variable "project_name" {
     description = "Name of the ML project"
     type        = string
     default     = "ml-project"
   }

   variable "environment" {
     description = "Environment (dev, staging, prod)"
     type        = string
     default     = "dev"
   }
   ```

3. **创建 main.tf。**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   data "aws_caller_identity" "current" {}

   locals {
     account_id = data.aws_caller_identity.current.account_id
   }

   # Bucket for raw datasets
   resource "aws_s3_bucket" "datasets" {
     bucket = "${var.project_name}-datasets-${local.account_id}"

     tags = {
       Name        = "ML Datasets"
       Environment = var.environment
       Purpose     = "raw-data"
     }
   }

   # Enable versioning for datasets
   resource "aws_s3_bucket_versioning" "datasets" {
     bucket = aws_s3_bucket.datasets.id

     versioning_configuration {
       status = "Enabled"
     }
   }

   # Lifecycle policy for datasets
   resource "aws_s3_bucket_lifecycle_configuration" "datasets" {
     bucket = aws_s3_bucket.datasets.id

     rule {
       id     = "archive-old-data"
       status = "Enabled"

       transition {
         days          = 30
         storage_class = "STANDARD_IA"  # Infrequent Access
       }

       transition {
         days          = 90
         storage_class = "GLACIER"
       }
     }
   }

   # Bucket for trained models
   resource "aws_s3_bucket" "models" {
     bucket = "${var.project_name}-models-${local.account_id}"

     tags = {
       Name        = "ML Models"
       Environment = var.environment
       Purpose     = "model-artifacts"
     }
   }

   # Enable versioning for models (critical!)
   resource "aws_s3_bucket_versioning" "models" {
     bucket = aws_s3_bucket.models.id

     versioning_configuration {
       status = "Enabled"
     }
   }

   # Server-side encryption
   resource "aws_s3_bucket_server_side_encryption_configuration" "models" {
     bucket = aws_s3_bucket.models.id

     rule {
       apply_server_side_encryption_by_default {
         sse_algorithm = "AES256"
       }
     }
   }

   # Block public access
   resource "aws_s3_bucket_public_access_block" "models" {
     bucket = aws_s3_bucket.models.id

     block_public_acls       = true
     block_public_policy     = true
     ignore_public_acls      = true
     restrict_public_buckets = true
   }
   ```

4. **创建 outputs.tf。**
   ```hcl
   output "datasets_bucket_name" {
     description = "Name of the datasets S3 bucket"
     value       = aws_s3_bucket.datasets.bucket
   }

   output "models_bucket_name" {
     description = "Name of the models S3 bucket"
     value       = aws_s3_bucket.models.bucket
   }

   output "datasets_bucket_arn" {
     value = aws_s3_bucket.datasets.arn
   }

   output "models_bucket_arn" {
     value = aws_s3_bucket.models.arn
   }
   ```

5. **部署。**
   ```bash
   terraform init
   terraform plan
   terraform apply

   # Test bucket access
   echo "test data" > test.txt
   aws s3 cp test.txt s3://$(terraform output -raw datasets_bucket_name)/

   # List objects
   aws s3 ls s3://$(terraform output -raw datasets_bucket_name)/

   # Cleanup
   aws s3 rm s3://$(terraform output -raw datasets_bucket_name)/test.txt
   terraform destroy
   ```

### 挑战任务

- [ ] 添加第三个存储桶，用于已处理数据/特征数据。
- [ ] 实现 S3 存储桶日志记录。
- [ ] 为 Web 访问添加 CORS 配置。
- [ ] 创建用于存储桶访问的 IAM 策略文档。
- [ ] 添加生命周期规则，在 180 天后删除旧模型版本。

### 预期结果

- 已创建两个 S3 存储桶（数据集、模型）。
- 两个存储桶均启用版本管理。
- 模型存储桶已启用加密。
- 已应用生命周期策略。
- 已阻止公共访问。

---

## 练习 03：使用 Terraform 构建 GPU 集群

**目标：** 供应具有合适网络及 IAM 配置的小型 GPU 训练集群。

### 学习目标

- 配置 VPC 与子网。
- 创建 GPU 实例（p3 系列）。
- 搭建 IAM 角色及实例配置文件。
- 使用 count 创建多个实例。

### 步骤

1. **创建项目目录。**
   ```bash
   mkdir exercise-03-gpu-cluster
   cd exercise-03-gpu-cluster
   ```

2. **创建 variables.tf。**
   ```hcl
   variable "region" {
     type    = string
     default = "us-west-2"  # p3 instances available
   }

   variable "cluster_size" {
     description = "Number of GPU instances"
     type        = number
     default     = 2
   }

   variable "instance_type" {
     description = "GPU instance type"
     type        = string
     default     = "p3.2xlarge"  # 1x V100 GPU
   }
   ```

3. **创建 main.tf（部分实现，在练习中完成）。**
   ```hcl
   provider "aws" {
     region = var.region
   }

   # Get latest Deep Learning AMI
   data "aws_ami" "deep_learning" {
     most_recent = true
     owners      = ["amazon"]

     filter {
       name   = "name"
       values = ["Deep Learning AMI GPU PyTorch*"]
     }
   }

   # VPC
   resource "aws_vpc" "ml_vpc" {
     cidr_block           = "10.0.0.0/16"
     enable_dns_hostnames = true

     tags = {
       Name = "ml-training-vpc"
     }
   }

   # TODO: Add subnet, internet gateway, route table
   # TODO: Add security group
   # TODO: Add IAM role for S3 access
   # TODO: Add GPU instances with count

   # GPU instances
   resource "aws_instance" "gpu_cluster" {
     count = var.cluster_size

     ami           = data.aws_ami.deep_learning.id
     instance_type = var.instance_type

     # TODO: Add subnet_id, security_groups, iam_instance_profile

     tags = {
       Name = "GPU-Cluster-${count.index + 1}"
     }
   }
   ```

4. **完成实现。**
   - 添加子网创建。
   - 添加 Internet Gateway 及路由。
   - 创建安全组（SSH、集群节点间通信）。
   - 创建具备 S3 访问权限的 IAM 角色。
   - 将 IAM 实例配置文件关联到实例。

5. **部署并测试。**
   ```bash
   terraform init
   terraform plan
   terraform apply

   # SSH to first instance
   ssh -i your-key.pem ubuntu@$(terraform output -raw cluster_ips | jq -r '.[0]')

   # Test GPU
   nvidia-smi

   # Destroy (expensive resources!)
   terraform destroy
   ```

### 挑战任务

- [ ] 使用 Spot 实例降低成本。
- [ ] 添加 EFS，实现集群节点间共享存储。
- [ ] 配置实例在 2 小时后自动关闭。
- [ ] 添加 GPU 利用率 CloudWatch 告警。
- [ ] 创建堡垒机，实现安全 SSH 访问。

### 预期结果

- 已创建 VPC 与网络。
- 两个 GPU 实例正在运行。
- 已关联 IAM 角色。
- 实例之间能够通信。
- 已配置 SSH 访问。

**费用警告：** 原文示例 p3.2xlarge 约为每小时 3.06 美元。记得销毁实验资源！

---

## 练习 04：可复用 Terraform 模块

**目标：** 为常见 ML 基础设施模式创建可复用模块。

### 学习目标

- 理解模块结构。
- 创建模块输入及输出。
- 在根配置中组合模块。
- 管理模块版本并编写文档。

### 步骤

1. **创建项目结构。**
   ```bash
   mkdir -p exercise-04-modules/{modules/{s3-ml-bucket,gpu-instance},environments/{dev,prod}}
   cd exercise-04-modules
   ```

2. **创建 S3 模块（`modules/s3-ml-bucket/main.tf`）。**
   ```hcl
   variable "bucket_name" {
     type = string
   }

   variable "versioning_enabled" {
     type    = bool
     default = true
   }

   variable "lifecycle_days_ia" {
     type    = number
     default = 30
   }

   variable "tags" {
     type    = map(string)
     default = {}
   }

   resource "aws_s3_bucket" "this" {
     bucket = var.bucket_name
     tags   = var.tags
   }

   resource "aws_s3_bucket_versioning" "this" {
     bucket = aws_s3_bucket.this.id

     versioning_configuration {
       status = var.versioning_enabled ? "Enabled" : "Suspended"
     }
   }

   # TODO: Add lifecycle, encryption, public access block

   output "bucket_name" {
     value = aws_s3_bucket.this.bucket
   }

   output "bucket_arn" {
     value = aws_s3_bucket.this.arn
   }
   ```

3. **创建 GPU 实例模块（`modules/gpu-instance/main.tf`）。**
   ```hcl
   variable "instance_type" {
     type = string
   }

   variable "instance_name" {
     type = string
   }

   # TODO: Add more variables

   data "aws_ami" "deep_learning" {
     most_recent = true
     owners      = ["amazon"]
     # ...
   }

   resource "aws_instance" "gpu" {
     ami           = data.aws_ami.deep_learning.id
     instance_type = var.instance_type
     # ...
   }

   output "instance_id" {
     value = aws_instance.gpu.id
   }

   output "public_ip" {
     value = aws_instance.gpu.public_ip
   }
   ```

4. **在环境中使用模块。**

   **environments/dev/main.tf：**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   module "datasets_bucket" {
     source = "../../modules/s3-ml-bucket"

     bucket_name         = "ml-datasets-dev-${data.aws_caller_identity.current.account_id}"
     versioning_enabled  = true
     lifecycle_days_ia   = 30

     tags = {
       Environment = "dev"
       Purpose     = "datasets"
     }
   }

   module "gpu_server" {
     source = "../../modules/gpu-instance"

     instance_type = "t3.micro"  # Cheap for dev
     instance_name = "dev-ml-server"
   }

   data "aws_caller_identity" "current" {}
   ```

   **environments/prod/main.tf：**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   module "datasets_bucket" {
     source = "../../modules/s3-ml-bucket"

     bucket_name        = "ml-datasets-prod-${data.aws_caller_identity.current.account_id}"
     versioning_enabled = true
     lifecycle_days_ia  = 90  # Keep longer in prod

     tags = {
       Environment = "prod"
       Purpose     = "datasets"
     }
   }

   module "gpu_server" {
     source = "../../modules/gpu-instance"

     instance_type = "p3.8xlarge"  # Powerful for prod
     instance_name = "prod-ml-server"
   }

   data "aws_caller_identity" "current" {}
   ```

5. **部署。**
   ```bash
   # Dev environment
   cd environments/dev
   terraform init
   terraform apply

   # Prod environment
   cd ../prod
   terraform init
   terraform apply

   # Destroy both
   cd ../dev && terraform destroy
   cd ../prod && terraform destroy
   ```

### 挑战任务

- [ ] 使用 Git Tag 管理模块版本。
- [ ] 为每个模块创建带用法示例的 README.md。
- [ ] 将模块发布至私有 Terraform Registry。
- [ ] 添加模块输入验证。
- [ ] 创建完整 ML 平台模块（VPC + GPU + S3）。

### 预期结果

- 已创建两个可复用模块。
- 在多个环境中使用模块。
- 每个环境采用不同配置。
- 应用了 DRY 原则。

---

## 练习 05：使用 S3 后端的远程状态

**目标：** 配置远程状态存储，实现团队协作。

### 学习目标

- 搭建用于状态存储的 S3 后端。
- 使用 DynamoDB 配置状态锁。
- 启用状态加密。
- 将本地状态迁移至远程状态。

### 步骤

1. **创建状态后端基础设施。**

   **backend-setup/main.tf：**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   # S3 bucket for state
   resource "aws_s3_bucket" "terraform_state" {
     bucket = "my-terraform-state-${data.aws_caller_identity.current.account_id}"

     tags = {
       Name    = "Terraform State"
       Purpose = "terraform-state"
     }
   }

   # Enable versioning
   resource "aws_s3_bucket_versioning" "terraform_state" {
     bucket = aws_s3_bucket.terraform_state.id

     versioning_configuration {
       status = "Enabled"
     }
   }

   # Enable encryption
   resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
     bucket = aws_s3_bucket.terraform_state.id

     rule {
       apply_server_side_encryption_by_default {
         sse_algorithm = "AES256"
       }
     }
   }

   # Block public access
   resource "aws_s3_bucket_public_access_block" "terraform_state" {
     bucket = aws_s3_bucket.terraform_state.id

     block_public_acls       = true
     block_public_policy     = true
     ignore_public_acls      = true
     restrict_public_buckets = true
   }

   # DynamoDB table for state locking
   resource "aws_dynamodb_table" "terraform_locks" {
     name         = "terraform-state-locks"
     billing_mode = "PAY_PER_REQUEST"
     hash_key     = "LockID"

     attribute {
       name = "LockID"
       type = "S"
     }

     tags = {
       Name    = "Terraform State Locks"
       Purpose = "terraform-state-locking"
     }
   }

   data "aws_caller_identity" "current" {}

   output "state_bucket" {
     value = aws_s3_bucket.terraform_state.bucket
   }

   output "dynamodb_table" {
     value = aws_dynamodb_table.terraform_locks.name
   }
   ```

2. **部署后端基础设施。**
   ```bash
   cd backend-setup
   terraform init
   terraform apply
   # Note the output values
   ```

3. **创建使用远程状态的项目。**

   **project/backend.tf：**
   ```hcl
   terraform {
     backend "s3" {
       bucket         = "my-terraform-state-ACCOUNT_ID"  # Replace with your bucket
       key            = "ml-project/terraform.tfstate"
       region         = "us-west-2"
       dynamodb_table = "terraform-state-locks"
       encrypt        = true
     }
   }
   ```

   **project/main.tf：**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   resource "aws_s3_bucket" "example" {
     bucket = "example-bucket-${data.aws_caller_identity.current.account_id}"
   }

   data "aws_caller_identity" "current" {}
   ```

4. **初始化并测试。**
   ```bash
   cd project
   terraform init  # Will configure S3 backend
   terraform apply

   # Verify state is in S3
   aws s3 ls s3://my-terraform-state-ACCOUNT_ID/ml-project/

   # Test state locking by running apply in two terminals simultaneously
   # Second terminal should wait for lock
   ```

### 挑战任务

- [ ] 将现有本地状态迁移至远程后端。
- [ ] 为多个环境（开发、预发布、生产）搭建后端。
- [ ] 配置使用远程状态的 Workspace。
- [ ] 为旧状态版本添加 S3 生命周期策略。
- [ ] 创建用于最小权限状态访问的 IAM 策略。

### 预期结果

- 已创建用于状态存储的 S3 存储桶。
- 已创建用于锁定的 DynamoDB 表。
- 已启用状态加密。
- 状态存储于远程后端。
- 状态锁防止并发修改。

---

## 练习 06：使用 Pulumi（Python）构建 ML 基础设施

**目标：** 使用 Pulumi 与 Python 代替 Terraform，构建相同的 ML 基础设施。

### 学习目标

- 安装并配置 Pulumi。
- 使用 Python 代码定义基础设施。
- 比较 Pulumi 与 Terraform 工作流。
- 使用 Python 语言特性（循环、函数）。

### 步骤

1. **安装 Pulumi。**
   ```bash
   brew install pulumi  # macOS
   # or: curl -fsSL https://get.pulumi.com | sh

   # Login to Pulumi (free tier)
   pulumi login
   ```

2. **创建新的 Pulumi 项目。**
   ```bash
   mkdir exercise-06-pulumi
   cd exercise-06-pulumi

   pulumi new aws-python
   # Follow prompts:
   # - project name: ml-infrastructure
   # - description: ML infrastructure with Pulumi
   # - stack name: dev
   # - aws:region: us-west-2
   ```

3. **编辑 `__main__.py`。**
   ```python
   import pulumi
   import pulumi_aws as aws

   # Get latest Deep Learning AMI
   deep_learning_ami = aws.ec2.get_ami(
       most_recent=True,
       owners=["amazon"],
       filters=[aws.ec2.GetAmiFilterArgs(
           name="name",
           values=["Deep Learning AMI GPU PyTorch*"]
       )]
   )

   # S3 bucket for datasets
   datasets_bucket = aws.s3.Bucket(
       "ml-datasets",
       bucket=f"ml-datasets-{aws.get_caller_identity().account_id}",
       versioning=aws.s3.BucketVersioningArgs(
           enabled=True
       ),
       server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
           rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
               apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                   sse_algorithm="AES256"
               )
           )
       ),
       tags={
           "Name": "ML Datasets",
           "Purpose": "datasets"
       }
   )

   # Security group
   ml_security_group = aws.ec2.SecurityGroup(
       "ml-sg",
       description="Security group for ML training",
       ingress=[
           aws.ec2.SecurityGroupIngressArgs(
               protocol="tcp",
               from_port=22,
               to_port=22,
               cidr_blocks=["0.0.0.0/0"]
           )
       ],
       egress=[
           aws.ec2.SecurityGroupEgressArgs(
               protocol="-1",
               from_port=0,
               to_port=0,
               cidr_blocks=["0.0.0.0/0"]
           )
       ]
   )

   # Create multiple GPU instances using Python loop
   gpu_instances = []
   for i in range(2):  # Python loop!
       instance = aws.ec2.Instance(
           f"gpu-instance-{i}",
           ami=deep_learning_ami.id,
           instance_type="t3.micro",  # Use t3.micro for testing
           vpc_security_group_ids=[ml_security_group.id],
           tags={
               "Name": f"GPU-Instance-{i+1}",
               "ManagedBy": "Pulumi"
           }
       )
       gpu_instances.append(instance)

   # Exports
   pulumi.export("bucket_name", datasets_bucket.bucket)
   pulumi.export("instance_ips", [inst.public_ip for inst in gpu_instances])
   ```

4. **部署。**
   ```bash
   # Preview changes
   pulumi preview

   # Deploy
   pulumi up
   # Select 'yes'

   # View outputs
   pulumi stack output

   # Destroy
   pulumi destroy
   ```

### 挑战任务

- [ ] 使用 Pulumi 添加 IAM 角色。
- [ ] 创建生成标签的 Python 函数。
- [ ] 使用 Python 字典配置多个环境。
- [ ] 比较 Pulumi 与 Terraform 的状态管理。
- [ ] 将练习 03（GPU 集群）转换为 Pulumi 实现。

### 预期结果

- 已创建 Pulumi 项目。
- 使用 Python 定义基础设施。
- 已创建 S3 存储桶及 EC2 实例。
- Pulumi 状态保存于 Pulumi Service。
- 完成 Pulumi 与 Terraform 工作流比较。

---

## 练习 07：使用 GitHub Actions 的 GitOps 工作流

**目标：** 使用 GitHub Actions 实现自动化 Terraform 工作流，用于基础设施 CI/CD。

### 学习目标

- 为 Terraform 搭建 GitHub Actions。
- 在 PR 中自动运行 Plan。
- 添加安全扫描（tfsec）。
- 合并至 main 时自动 Apply。

### 步骤

1. **创建 GitHub 仓库。**
   ```bash
   mkdir exercise-07-gitops
   cd exercise-07-gitops
   git init
   gh repo create exercise-07-gitops --private
   ```

2. **添加 Terraform 代码（复用练习 02）。**

3. **创建 GitHub Actions 工作流。**

   **.github/workflows/terraform.yml：**
   ```yaml
   name: Terraform CI/CD

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   env:
     AWS_REGION: us-west-2

   jobs:
     terraform:
       name: Terraform
       runs-on: ubuntu-latest

       permissions:
         pull-requests: write
         contents: read

       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Setup Terraform
           uses: hashicorp/setup-terraform@v2
           with:
             terraform_version: 1.6.0

         - name: Configure AWS Credentials
           uses: aws-actions/configure-aws-credentials@v2
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: ${{ env.AWS_REGION }}

         - name: Terraform Format
           id: fmt
           run: terraform fmt -check
           continue-on-error: true

         - name: Terraform Init
           id: init
           run: terraform init

         - name: Terraform Validate
           id: validate
           run: terraform validate -no-color

         - name: tfsec Security Scan
           uses: aquasecurity/tfsec-action@v1.0.0
           with:
             soft_fail: true

         - name: Terraform Plan
           id: plan
           if: github.event_name == 'pull_request'
           run: terraform plan -no-color
           continue-on-error: true

         - name: Comment PR with Plan
           uses: actions/github-script@v6
           if: github.event_name == 'pull_request'
           with:
             github-token: ${{ secrets.GITHUB_TOKEN }}
             script: |
               const output = `#### Terraform Format 📝\`${{ steps.fmt.outcome }}\`
               #### Terraform Validation 🤖\`${{ steps.validate.outcome }}\`
               #### Terraform Plan 📖\`${{ steps.plan.outcome }}\`

               <details><summary>Show Plan</summary>

               \`\`\`terraform
               ${{ steps.plan.outputs.stdout }}
               \`\`\`

               </details>

               *Pushed by: @${{ github.actor }}, Action: \`${{ github.event_name }}\`*`;

               github.rest.issues.createComment({
                 issue_number: context.issue.number,
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 body: output
               })

         - name: Terraform Apply
           if: github.ref == 'refs/heads/main' && github.event_name == 'push'
           run: terraform apply -auto-approve
   ```

4. **将 AWS 凭据添加至 GitHub Secrets。**
   - 前往仓库 Settings → Secrets → Actions。
   - 添加 `AWS_ACCESS_KEY_ID`。
   - 添加 `AWS_SECRET_ACCESS_KEY`。

5. **测试工作流。**
   ```bash
   # Create feature branch
   git checkout -b add-bucket

   # Make change to main.tf
   # Add a new S3 bucket

   # Commit and push
   git add .
   git commit -m "Add new S3 bucket"
   git push origin add-bucket

   # Create PR
   gh pr create --title "Add new S3 bucket" --body "Adds bucket for feature data"

   # Check Actions tab - should see terraform plan in PR comments

   # Merge PR
   gh pr merge --squash

   # Check Actions tab - should see terraform apply on main
   ```

### 挑战任务

- [ ] 添加 Infracost，在 PR 中展示成本估算。
- [ ] 添加 Checkov，提供额外安全扫描。
- [ ] 实现生产部署审批要求。
- [ ] 添加定时漂移检测工作流。
- [ ] 为多个环境创建独立工作流。

### 预期结果

- 已创建 GitHub Actions 工作流。
- Terraform Plan 在 PR 时运行。
- 在 PR 中评论 Plan 输出。
- 使用 tfsec 进行安全扫描。
- 合并至 main 时运行 Terraform Apply。

---

## 练习 08：使用 AWS Secrets Manager 管理密钥

**目标：** 使用 AWS Secrets Manager 与 IAM 角色安全管理 Terraform 中的密钥。

### 步骤

1. **创建项目。**
   ```bash
   mkdir exercise-08-secrets
   cd exercise-08-secrets
   ```

2. **创建包含密钥相关配置的 main.tf。**
   ```hcl
   provider "aws" {
     region = "us-west-2"
   }

   # Generate random password for database
   resource "random_password" "db_password" {
     length  = 32
     special = true
   }

   # Store in Secrets Manager
   resource "aws_secretsmanager_secret" "db_password" {
     name        = "ml-db-password"
     description = "Database password for ML application"
   }

   resource "aws_secretsmanager_secret_version" "db_password" {
     secret_id     = aws_secretsmanager_secret.db_password.id
     secret_string = random_password.db_password.result
   }

   # IAM role for EC2 to read secrets
   resource "aws_iam_role" "ml_app" {
     name = "ml-app-role"

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

   # Policy to read specific secret
   resource "aws_iam_role_policy" "read_secret" {
     role = aws_iam_role.ml_app.id

     policy = jsonencode({
       Version = "2012-10-17"
       Statement = [{
         Action   = "secretsmanager:GetSecretValue"
         Effect   = "Allow"
         Resource = aws_secretsmanager_secret.db_password.arn
       }]
     })
   }

   # Instance profile
   resource "aws_iam_instance_profile" "ml_app" {
     name = "ml-app-profile"
     role = aws_iam_role.ml_app.name
   }

   # EC2 instance with IAM role
   resource "aws_instance" "ml_app" {
     ami                  = data.aws_ami.amazon_linux.id
     instance_type        = "t3.micro"
     iam_instance_profile = aws_iam_instance_profile.ml_app.name

     user_data = <<-EOF
       #!/bin/bash
       # Install AWS CLI
       yum install -y aws-cli

       # Retrieve secret at runtime
       DB_PASSWORD=$(aws secretsmanager get-secret-value \
         --secret-id ${aws_secretsmanager_secret.db_password.id} \
         --query SecretString \
         --output text \
         --region us-west-2)

       # Use password in application
       echo "export DB_PASSWORD='$DB_PASSWORD'" >> /etc/environment
     EOF

     tags = {
       Name = "ML-App-Server"
     }
   }

   data "aws_ami" "amazon_linux" {
     most_recent = true
     owners      = ["amazon"]
     filter {
       name   = "name"
       values = ["amzn2-ami-hvm-*-x86_64-gp2"]
     }
   }

   output "secret_arn" {
     description = "ARN of the secret"
     value       = aws_secretsmanager_secret.db_password.arn
   }
   ```

3. **添加 pre-commit Hook，防止提交密钥。**

   **.pre-commit-config.yaml：**
   ```yaml
   repos:
     - repo: https://github.com/pre-commit/pre-commit-hooks
       rev: v4.4.0
       hooks:
         - id: detect-aws-credentials
         - id: detect-private-key

     - repo: https://github.com/gitleaks/gitleaks
       rev: v8.16.1
       hooks:
         - id: gitleaks
   ```

   安装并测试：
   ```bash
   pre-commit install
   pre-commit run --all-files
   ```

4. **部署并测试。**
   ```bash
   terraform init
   terraform apply

   # Verify secret exists
   aws secretsmanager get-secret-value \
     --secret-id ml-db-password \
     --query SecretString \
     --output text

   # SSH to instance and verify secret is accessible
   # (Instance should be able to retrieve secret via IAM role)
   ```

### 挑战任务

- [ ] 使用 Lambda 自动轮换密钥。
- [ ] 使用 HashiCorp Vault 替代 AWS Secrets Manager。
- [ ] 实现密钥版本管理策略。
- [ ] 添加密钥访问监控。
- [ ] 为多环境配置创建密钥。

### 预期结果

- 已在 AWS Secrets Manager 中创建密钥。
- IAM 角色提供最小权限访问。
- Terraform 中不硬编码密钥。
- pre-commit Hook 有助于防止提交密钥。
- 应用在运行时获取密钥。

---

## 最终项目：完整 ML 平台

**目标：** 将全部练习组合为面向生产的 ML 平台。

### 需求

- [ ] 多环境配置（开发、预发布、生产）。
- [ ] 具备自动扩缩容的 GPU 训练集群。
- [ ] 用于数据、模型、日志的 S3 存储桶。
- [ ] 合适的 VPC、子网、安全组。
- [ ] 最小权限 IAM 角色。
- [ ] 密钥管理。
- [ ] 具备锁定机制的远程状态。
- [ ] 可复用模块。
- [ ] 使用 GitHub Actions 的 GitOps 工作流。
- [ ] 安全扫描（tfsec、Checkov）。
- [ ] 成本估算（Infracost）。
- [ ] 监控与日志。
- [ ] 文档。

**预计时长：** 10–15 小时。

---

## 补充资源

- [Terraform 文档](https://www.terraform.io/docs)
- [Pulumi 文档](https://www.pulumi.com/docs/)
- [AWS 免费层](https://aws.amazon.com/free/)
- [Terraform 最佳实践](https://www.terraform-best-practices.com/)

---

**恭喜完成基础设施即代码练习！**

返回[模块 README](../README.md)，继续测验及后续学习。

> 译注：本目录为原文独立练习集，与仓库编号项目不完全对应。较新 Terraform 支持 S3 原生锁文件；CI 优先使用 OIDC 短期凭据，而不是长期 AWS Access Key。状态文件仍可能包含敏感值，pre-commit 无法保证不泄漏密钥。所有云资源费用及免费层资格应实际核对。原始代码块保留，未执行云部署。
