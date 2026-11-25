# 第 02 课：Terraform 基础

## 学习目标

完成本课后，你将能够：

- 在系统中安装并配置 Terraform。
- 理解 HCL（HashiCorp Configuration Language）语法。
- 使用 Provider、Resource 与 Data Source。
- 有效使用变量、输出与局部值。
- 掌握 Terraform CLI 核心命令。
- 创建第一个完整的 Terraform 项目。

## 安装 Terraform

### macOS（Homebrew）

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
terraform version
# Terraform v1.6.0
```

### Linux（Ubuntu/Debian）

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update
sudo apt install terraform

# Verify
terraform -version
```

### Windows（Chocolatey）

```powershell
choco install terraform

# Verify
terraform -version
```

### 使用 tfenv（版本管理器）

管理多个 Terraform 版本：

```bash
# Install tfenv
git clone https://github.com/tfutils/tfenv.git ~/.tfenv

# Add to PATH
echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Install specific version
tfenv install 1.6.0
tfenv use 1.6.0

# Install latest
tfenv install latest
tfenv use latest
```

## Terraform 配置结构

### 基础项目布局

```
ml-infrastructure/
├── main.tf              # Primary resources
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── versions.tf          # Provider version constraints
├── terraform.tfvars     # Variable values (don't commit secrets!)
└── .gitignore           # Ignore .terraform/ and *.tfstate
```

### 最小可运行示例

**main.tf：**
```hcl
# Configure AWS Provider
provider "aws" {
  region = "us-west-2"
}

# Create S3 bucket for ML datasets
resource "aws_s3_bucket" "ml_data" {
  bucket = "my-ml-datasets-unique-name"

  tags = {
    Name        = "ML Datasets"
    Environment = "development"
  }
}
```

## HCL 语法基础

### 注释

```hcl
# Single-line comment

/*
Multi-line
comment
*/

// Also works (C-style)
```

### Block（配置块）

```hcl
<BLOCK_TYPE> "<BLOCK_LABEL>" "<BLOCK_LABEL>" {
  # Block body
  <IDENTIFIER> = <EXPRESSION>
}

# Example:
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"
}
```

### Argument（参数）与 Attribute（属性）

```hcl
resource "aws_instance" "ml_server" {
  ami           = "ami-12345678"  # Argument
  instance_type = "p3.2xlarge"   # Argument

  # After creation, you can reference attributes:
  # aws_instance.ml_server.id
  # aws_instance.ml_server.public_ip
  # aws_instance.ml_server.private_ip
}
```

### 数据类型

```hcl
# String
variable "region" {
  type    = string
  default = "us-west-2"
}

# Number
variable "instance_count" {
  type    = number
  default = 3
}

# Boolean
variable "enable_monitoring" {
  type    = bool
  default = true
}

# List
variable "availability_zones" {
  type    = list(string)
  default = ["us-west-2a", "us-west-2b"]
}

# Map
variable "instance_types" {
  type = map(string)
  default = {
    dev  = "t3.micro"
    prod = "p3.8xlarge"
  }
}

# Object
variable "server_config" {
  type = object({
    instance_type = string
    disk_size     = number
    monitoring    = bool
  })
  default = {
    instance_type = "p3.2xlarge"
    disk_size     = 100
    monitoring    = true
  }
}
```

### 表达式

```hcl
# References
var.region
aws_instance.ml_server.public_ip

# String interpolation
"The server IP is ${aws_instance.ml_server.public_ip}"

# String template
"ml-bucket-${var.environment}-${var.region}"

# Arithmetic
instance_count * 2
disk_size + 50

# Comparison
instance_count > 5
var.environment == "production"

# Logical
var.enable_gpu && var.environment == "prod"
```

## Provider（提供程序）

Provider 是与云平台 API 交互的插件。

### Provider 配置

**versions.tf：**
```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Any 5.x version
    }
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0, < 6.0"
    }
  }
}
```

**main.tf：**
```hcl
# AWS Provider
provider "aws" {
  region  = "us-west-2"
  profile = "default"  # AWS CLI profile

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = "ML-Platform"
    }
  }
}

# GCP Provider
provider "google" {
  project = "my-ml-project"
  region  = "us-central1"
  zone    = "us-central1-a"
}

# Multiple provider configurations (aliases)
provider "aws" {
  alias  = "us-east"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu-west"
  region = "eu-west-1"
}

# Use aliased provider
resource "aws_instance" "east_server" {
  provider = aws.us-east
  # ...
}
```

### Provider 身份验证

```hcl
# ❌ DON'T: Hardcode credentials
provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"  # Never do this!
  secret_key = "wJalrXUtnFEMI..."
}

# ✅ DO: Use environment variables
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
provider "aws" {
  region = "us-west-2"
}

# ✅ DO: Use AWS CLI profile
provider "aws" {
  region  = "us-west-2"
  profile = "ml-admin"
}

# ✅ DO: Use instance profile / IAM role (when running on EC2)
provider "aws" {
  region = "us-west-2"
  # Automatically uses instance metadata
}
```

## Resource（资源）

Resource 是希望创建及管理的基础设施组件。

### 基础资源

```hcl
resource "aws_instance" "ml_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "p3.2xlarge"

  tags = {
    Name = "ML Training Server"
  }
}
```

### 具有依赖关系的资源

```hcl
# Security group (created first)
resource "aws_security_group" "ml_sg" {
  name        = "ml-security-group"
  description = "Security group for ML servers"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Instance (created second, depends on security group)
resource "aws_instance" "ml_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "p3.2xlarge"

  # Implicit dependency (Terraform detects automatically)
  vpc_security_group_ids = [aws_security_group.ml_sg.id]

  tags = {
    Name = "ML Training Server"
  }
}
```

### 显式依赖关系

```hcl
resource "aws_instance" "ml_server" {
  ami           = "ami-12345678"
  instance_type = "p3.2xlarge"

  # Explicit dependency (when implicit doesn't work)
  depends_on = [
    aws_iam_role_policy_attachment.ml_policy
  ]
}
```

### 资源元参数（Meta-Arguments）

#### count

```hcl
# Create 3 identical GPU instances
resource "aws_instance" "ml_cluster" {
  count = 3

  ami           = "ami-12345678"
  instance_type = "p3.2xlarge"

  tags = {
    Name = "ML Server ${count.index}"  # ML Server 0, 1, 2
  }
}

# Reference specific instance
output "first_server_ip" {
  value = aws_instance.ml_cluster[0].public_ip
}

# Reference all instances
output "all_server_ips" {
  value = aws_instance.ml_cluster[*].public_ip
}
```

#### for_each

```hcl
# Create buckets for different environments
variable "environments" {
  type    = set(string)
  default = ["dev", "staging", "prod"]
}

resource "aws_s3_bucket" "ml_data" {
  for_each = var.environments

  bucket = "ml-datasets-${each.value}"

  tags = {
    Environment = each.value
  }
}

# Reference specific bucket
output "prod_bucket" {
  value = aws_s3_bucket.ml_data["prod"].bucket
}
```

#### lifecycle

```hcl
resource "aws_instance" "ml_server" {
  ami           = "ami-12345678"
  instance_type = "p3.2xlarge"

  lifecycle {
    # Prevent accidental destruction
    prevent_destroy = true

    # Create new before destroying old (zero downtime)
    create_before_destroy = true

    # Ignore changes to specific attributes
    ignore_changes = [
      tags,
      user_data
    ]
  }
}
```

## Data Source（数据源）

Data Source 用于获取已有资源等外部数据的信息。

### 获取已有资源

```hcl
# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Use the AMI in a resource
resource "aws_instance" "ml_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "p3.2xlarge"
}
```

### 获取账号信息

```hcl
# Get current AWS account ID and region
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Use in configurations
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

output "account_info" {
  value = "Account: ${local.account_id}, Region: ${local.region}"
}
```

### 获取可用区

```hcl
# Get all available AZs in current region
data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Use in resource
resource "aws_subnet" "ml_subnet" {
  count = length(data.aws_availability_zones.available.names)

  vpc_id            = aws_vpc.main.id
  availability_zone = data.aws_availability_zones.available.names[count.index]
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
}
```

## Variable（变量）

变量使配置具有灵活性与可复用性。

### 定义变量

**variables.tf：**
```hcl
# Basic variable
variable "region" {
  description = "AWS region for ML infrastructure"
  type        = string
  default     = "us-west-2"
}

# Variable with validation
variable "instance_type" {
  description = "EC2 instance type for ML training"
  type        = string
  default     = "p3.2xlarge"

  validation {
    condition     = can(regex("^p3\\.", var.instance_type))
    error_message = "Instance type must be a p3 GPU instance."
  }
}

# Variable without default (must be provided)
variable "project_name" {
  description = "Name of the ML project"
  type        = string
}

# Complex variable
variable "training_cluster" {
  description = "Configuration for ML training cluster"
  type = object({
    instance_count = number
    instance_type  = string
    disk_size_gb   = number
    enable_spot    = bool
  })
  default = {
    instance_count = 4
    instance_type  = "p3.8xlarge"
    disk_size_gb   = 500
    enable_spot    = true
  }
}
```

### 提供变量值

**方法 1：terraform.tfvars**
```hcl
# terraform.tfvars
region       = "us-east-1"
project_name = "image-classification"

training_cluster = {
  instance_count = 8
  instance_type  = "p3.16xlarge"
  disk_size_gb   = 1000
  enable_spot    = false
}
```

**方法 2：命令行**
```bash
terraform apply \
  -var="region=us-east-1" \
  -var="project_name=nlp-project"
```

**方法 3：环境变量**
```bash
export TF_VAR_region="us-east-1"
export TF_VAR_project_name="computer-vision"
terraform apply
```

**方法 4：变量文件**
```bash
# dev.tfvars
terraform apply -var-file="dev.tfvars"

# prod.tfvars
terraform apply -var-file="prod.tfvars"
```

### 使用变量

```hcl
resource "aws_instance" "ml_server" {
  ami           = data.aws_ami.ml_ami.id
  instance_type = var.instance_type

  tags = {
    Name    = "${var.project_name}-training"
    Project = var.project_name
  }
}

resource "aws_instance" "training_cluster" {
  count = var.training_cluster.instance_count

  ami           = data.aws_ami.ml_ami.id
  instance_type = var.training_cluster.instance_type

  root_block_device {
    volume_size = var.training_cluster.disk_size_gb
  }
}
```

## Output（输出）

Output 用于显示 Terraform 执行后得到的值，也可以将值暴露给其他模块或系统。

### 定义输出

**outputs.tf：**
```hcl
# Simple output
output "ml_server_public_ip" {
  description = "Public IP of ML training server"
  value       = aws_instance.ml_server.public_ip
}

# Output with multiple values
output "cluster_ips" {
  description = "Public IPs of all training cluster nodes"
  value       = aws_instance.training_cluster[*].public_ip
}

# Sensitive output (won't show in CLI, but available programmatically)
output "database_password" {
  description = "RDS database password"
  value       = aws_db_instance.ml_db.password
  sensitive   = true
}

# Structured output
output "infrastructure_info" {
  description = "Complete infrastructure information"
  value = {
    server_ip      = aws_instance.ml_server.public_ip
    s3_bucket      = aws_s3_bucket.ml_data.bucket
    cluster_size   = length(aws_instance.training_cluster)
    total_cost_est = "$${aws_instance.ml_server.instance_type == "p3.2xlarge" ? 3.06 : 12.24}/hour"
  }
}
```

### 使用输出

```bash
# After terraform apply
terraform output
# ml_server_public_ip = "54.123.45.67"
# cluster_ips = ["54.123.45.68", "54.123.45.69", "54.123.45.70"]

# Get specific output
terraform output ml_server_public_ip
# 54.123.45.67

# Get output in JSON
terraform output -json
# {"ml_server_public_ip": {"sensitive": false, "value": "54.123.45.67"}}

# Use in scripts
SERVER_IP=$(terraform output -raw ml_server_public_ip)
ssh ubuntu@$SERVER_IP
```

## Local Value（局部值）

局部值用于定义模块内部可复用的表达式，遵循 DRY（Don't Repeat Yourself，不要重复自己）原则。

```hcl
locals {
  # Common tags for all resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = "AI-Research"
  }

  # Computed values
  cluster_name = "${var.project_name}-${var.environment}-cluster"

  # Conditional logic
  use_gpu = var.environment == "prod" ? true : false

  instance_type = local.use_gpu ? "p3.8xlarge" : "t3.large"

  # Data transformations
  availability_zones = slice(
    data.aws_availability_zones.available.names,
    0,
    min(3, length(data.aws_availability_zones.available.names))
  )
}

# Use locals in resources
resource "aws_instance" "ml_server" {
  ami           = data.aws_ami.ml_ami.id
  instance_type = local.instance_type

  tags = merge(
    local.common_tags,
    {
      Name = local.cluster_name
    }
  )
}
```

## Terraform CLI 命令

### terraform init

初始化 Terraform 工作目录。

```bash
# Initialize (downloads providers)
terraform init

# Upgrade provider versions
terraform init -upgrade

# Migrate state backend
terraform init -migrate-state
```

### terraform fmt

将配置文件格式化为标准风格。

```bash
# Format all .tf files in current directory
terraform fmt

# Format recursively
terraform fmt -recursive

# Check if files are formatted (CI/CD)
terraform fmt -check
```

### terraform validate

验证配置的语法与内部一致性。

```bash
# Validate configuration
terraform validate

# Example output:
# Success! The configuration is valid.

# Or if there are errors:
# Error: Unsupported argument
#   on main.tf line 5, in resource "aws_instance" "ml_server":
#   5:   invalid_arg = "value"
```

### terraform plan

在应用变更之前预览变更计划。

```bash
# Create execution plan
terraform plan

# Save plan to file
terraform plan -out=tfplan

# Show what will be destroyed
terraform plan -destroy

# Target specific resource
terraform plan -target=aws_instance.ml_server

# Use variable file
terraform plan -var-file="prod.tfvars"
```

### terraform apply

将变更应用至基础设施。

```bash
# Apply changes (will prompt for confirmation)
terraform apply

# Auto-approve (dangerous, for automation only)
terraform apply -auto-approve

# Apply saved plan
terraform apply tfplan

# Apply with variables
terraform apply -var="instance_count=5"

# Target specific resource
terraform apply -target=aws_instance.ml_server
```

### terraform destroy

销毁当前配置与状态所管理的基础设施资源（受权限、生命周期保护等条件限制）。

```bash
# Destroy everything (prompts for confirmation)
terraform destroy

# Auto-approve destruction
terraform destroy -auto-approve

# Destroy specific resource
terraform destroy -target=aws_instance.ml_server
```

### terraform show

展示当前状态或计划。

```bash
# Show current state
terraform show

# Show saved plan
terraform show tfplan

# Output in JSON
terraform show -json
```

### terraform output

显示输出值。

```bash
# Show all outputs
terraform output

# Show specific output
terraform output ml_server_ip

# Output in JSON
terraform output -json

# Raw output (no quotes, for scripts)
terraform output -raw ml_server_ip
```

### terraform state

执行高级状态管理操作。

```bash
# List all resources in state
terraform state list

# Show specific resource
terraform state show aws_instance.ml_server

# Remove resource from state (doesn't destroy)
terraform state rm aws_instance.ml_server

# Move/rename resource
terraform state mv aws_instance.old aws_instance.new

# Pull remote state
terraform state pull
```

### terraform console

用于测试表达式的交互式控制台。

```bash
terraform console

# Try expressions:
> var.region
"us-west-2"

> aws_instance.ml_server.public_ip
"54.123.45.67"

> length(aws_instance.training_cluster)
3

> [for s in aws_instance.training_cluster : s.id]
["i-0abc123", "i-0def456", "i-0ghi789"]
```

## 第一个 Terraform 项目

创建一个完整的 ML 基础设施项目。

### 步骤 1：项目结构

```bash
mkdir ml-infrastructure
cd ml-infrastructure

# Create files
touch main.tf variables.tf outputs.tf versions.tf terraform.tfvars
touch .gitignore
```

### 步骤 2：versions.tf

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

### 步骤 3：variables.tf

```hcl
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "ml-training"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "p3.2xlarge"
}
```

### 步骤 4：main.tf

```hcl
provider "aws" {
  region = var.region
}

# Data source: Latest Deep Learning AMI
data "aws_ami" "deep_learning" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning AMI GPU PyTorch*"]
  }
}

# S3 bucket for datasets
resource "aws_s3_bucket" "datasets" {
  bucket = "${var.project_name}-datasets-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name    = "ML Datasets"
    Project = var.project_name
  }
}

# S3 bucket for models
resource "aws_s3_bucket" "models" {
  bucket = "${var.project_name}-models-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name    = "ML Models"
    Project = var.project_name
  }
}

# Security group
resource "aws_security_group" "ml_sg" {
  name        = "${var.project_name}-sg"
  description = "Security group for ML training server"

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production!
  }

  # Jupyter notebook
  ingress {
    from_port   = 8888
    to_port     = 8888
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

# IAM role for EC2
resource "aws_iam_role" "ml_role" {
  name = "${var.project_name}-role"

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

# Attach S3 read/write policy
resource "aws_iam_role_policy_attachment" "s3_policy" {
  role       = aws_iam_role.ml_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Instance profile
resource "aws_iam_instance_profile" "ml_profile" {
  name = "${var.project_name}-profile"
  role = aws_iam_role.ml_role.name
}

# Get current account ID
data "aws_caller_identity" "current" {}

# EC2 instance for ML training
resource "aws_instance" "ml_server" {
  ami           = data.aws_ami.deep_learning.id
  instance_type = var.instance_type

  iam_instance_profile   = aws_iam_instance_profile.ml_profile.name
  vpc_security_group_ids = [aws_security_group.ml_sg.id]

  root_block_device {
    volume_size = 100
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              echo "Setup complete" > /tmp/setup.log
              EOF

  tags = {
    Name    = "${var.project_name}-server"
    Project = var.project_name
  }
}
```

### 步骤 5：outputs.tf

```hcl
output "ml_server_public_ip" {
  description = "Public IP of ML training server"
  value       = aws_instance.ml_server.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to server"
  value       = "ssh -i your-key.pem ubuntu@${aws_instance.ml_server.public_ip}"
}

output "datasets_bucket" {
  description = "S3 bucket for datasets"
  value       = aws_s3_bucket.datasets.bucket
}

output "models_bucket" {
  description = "S3 bucket for models"
  value       = aws_s3_bucket.models.bucket
}
```

### 步骤 6：.gitignore

```
# Local .terraform directories
**/.terraform/*

# .tfstate files
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Exclude all .tfvars files with secrets
*.tfvars
*.tfvars.json

# Ignore override files
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Ignore CLI configuration files
.terraformrc
terraform.rc

# Lock files (some teams commit this)
.terraform.lock.hcl
```

### 步骤 7：部署

```bash
# Initialize
terraform init

# Format code
terraform fmt

# Validate
terraform validate

# Plan
terraform plan

# Apply
terraform apply

# Get outputs
terraform output ml_server_public_ip

# Connect
ssh -i your-key.pem ubuntu@$(terraform output -raw ml_server_public_ip)

# When done, destroy
terraform destroy
```

## 最佳实践

- 使用 Git 管理全部 Terraform 配置代码。
- 提交前运行 `terraform fmt`。
- 使用 `terraform validate` 发现配置语法及一致性错误。
- 在 `apply` 前始终审查 `terraform plan`。
- 使用远程状态后端（S3、Terraform Cloud 等）。
- 不提交 `.tfstate` 文件或包含密钥的 `terraform.tfvars`。
- 使用变量增强可复用性。
- 为资源采用一致的标签。
- 使用 Data Source 引用已有基础设施。
- 将大型配置拆分为模块。

## 常见错误与解决方案

### 错误：找不到 Provider

```bash
# Error: Provider "aws" not found
# Solution:
terraform init
```

### 错误：资源已存在

```bash
# Error: resource already exists
# Solution: Import existing resource
terraform import aws_instance.ml_server i-1234567890abcdef0
```

### 错误：语法无效

```bash
# Error: Argument or block definition required
# Solution: Run validate
terraform validate
# Fix syntax based on error message
```

## 下一步

掌握 Terraform 基础后，可以继续：

- **第 03 课：** 学习状态管理与团队协作。
- **第 04 课：** 使用 Terraform 构建完整的 AI 基础设施。
- **第 05 课：** 探索使用 Python 编写 IaC 的 Pulumi。

## 核心要点

- Terraform 使用 HCL（HashiCorp Configuration Language）。
- Provider 将 Terraform 与云平台 API 连接起来。
- Resource 表示需要创建及管理的基础设施组件。
- Data Source 获取已有资源的信息。
- Variable 增强配置可复用性。
- Output 展示重要值。
- 基础工作流：init → fmt → validate → plan → apply；实验结束且确实需要删除资源时执行 destroy。
- 不要将密钥或状态文件提交至版本控制。

---

**下一课：** [03-terraform-state-management.md](03-terraform-state-management.md)

> 译注：validate 不会检查全部云平台权限、资源配额或实际部署可行性。Plan 及 State 文件可能包含敏感数据；sensitive 标记主要控制展示，不等同于加密存储。应提交并审查 .terraform.lock.hcl 依赖锁文件，避免将 Provider 缓存与敏感状态提交。destroy 是破坏性操作，不属于每次生产发布的必要步骤。所有原始代码块保留，尚未实际执行云资源操作。
