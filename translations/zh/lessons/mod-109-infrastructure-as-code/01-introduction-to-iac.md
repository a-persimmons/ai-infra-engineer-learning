# 第 01 课：基础设施即代码导论

## 学习目标

完成本课后，你将能够：

- 理解基础设施即代码（IaC）的含义及其重要性。
- 识别 IaC 在 AI/ML 基础设施中解决的问题。
- 区分声明式与命令式方法。
- 比较常用 IaC 工具（Terraform、Pulumi、CloudFormation、Ansible）。
- 理解 AI/ML 基础设施的特殊考虑因素。

## 什么是基础设施即代码？

**基础设施即代码（Infrastructure as Code，IaC）** 是通过机器可读的定义文件管理和供应基础设施的实践，而不是依赖手动流程或交互式配置工具。

### 传统基础设施管理

```
Developer → Opens AWS Console → Clicks buttons → Creates EC2 instance
           → Configures security groups manually
           → Sets up networking in UI
           → Forgets exactly what was configured
           → Cannot easily reproduce
```

**问题：**
- 手动操作，容易出错，耗费时间。
- 没有版本控制或审计记录。
- 难以复现。
- 协作困难。
- 环境不一致（开发环境与生产环境）。

### 基础设施即代码方法

```python
# infrastructure/main.tf
resource "aws_instance" "ml_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "p3.2xlarge"  # GPU instance

  tags = {
    Name        = "ML-Training-Server"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
```

**优势：**
- 支持版本控制（Git）。
- 可复现且一致。
- 自动化部署。
- 支持协作（代码审查）。
- 配置本身可以作为文档。
- 易于为不同环境复制配置。

## IaC 为什么对 AI 基础设施重要

AI/ML 基础设施面临独特挑战，使 IaC 尤其有价值。

### 1. 成本管理

GPU 实例价格较高（原文示例为每小时 3–24 美元以上）。IaC 能够：

```hcl
# Provision GPU cluster only when needed
resource "aws_instance" "training_cluster" {
  count         = var.training_active ? 3 : 0  # Conditional creation
  instance_type = "p3.8xlarge"
  # ... configuration
}
```

为训练创建昂贵的资源，在完成后销毁，有望节省数千美元。

### 2. 可复现的实验

ML 实验必须具备可复现性。IaC 帮助创建一致的基础设施：

```python
# Pulumi example - same infrastructure every time
training_env = aws.ec2.Instance(
    "ml-training",
    instance_type="p3.2xlarge",
    ami="ami-tensorflow-gpu-2.12",
    user_data="""#!/bin/bash
        pip install tensorflow==2.12.0
        python /opt/ml/train.py
    """
)
```

### 3. 多环境管理

轻松创建开发、预发布与生产环境：

```
infrastructure/
├── environments/
│   ├── dev/
│   │   └── terraform.tfvars    # instance_type = "t3.medium"
│   ├── staging/
│   │   └── terraform.tfvars    # instance_type = "p3.2xlarge"
│   └── prod/
│       └── terraform.tfvars    # instance_type = "p3.8xlarge"
└── main.tf                     # Same code, different configs
```

### 4. 灾难恢复

基础设施发生故障时，可在较短时间内重建（原文目标为数分钟）：

```bash
# Disaster strikes - entire cluster lost
terraform apply  # Rebuild everything from code
# ✓ GPU cluster
# ✓ Storage buckets
# ✓ Networking
# ✓ Load balancers
# ✓ Monitoring
# All recreated in <10 minutes
```

### 5. 协作

基础设施变更经过代码审查：

```
Pull Request: Add GPU cluster for new model training
Files changed:
  + gpu_cluster.tf      (new GPU instances)
  + storage.tf          (add model storage bucket)

Reviewers: @ml-team, @infra-team
Status: 2 approvals required
```

## 声明式与命令式方法

### 命令式（How，如何做）

逐步指定**如何**实现期望状态：

```bash
# Imperative - shell script
aws ec2 run-instances \
  --image-id ami-12345678 \
  --instance-type p3.2xlarge \
  --key-name my-key

aws ec2 create-security-group \
  --group-name ml-sg \
  --description "ML security group"

aws ec2 authorize-security-group-ingress \
  --group-name ml-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0
```

**问题：**
- 必须手动处理当前状态。
- 重复执行可能产生重复资源。
- 难以维护。
- 错误恢复复杂。

### 声明式（What，做成什么）

指定期望的最终状态**是什么**：

```hcl
# Declarative - Terraform
resource "aws_instance" "ml_server" {
  ami           = "ami-12345678"
  instance_type = "p3.2xlarge"
  key_name      = "my-key"
}

resource "aws_security_group" "ml_sg" {
  name        = "ml-sg"
  description = "ML security group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**优势：**
- 幂等性（可以安全地重复执行，前提是配置与资源操作具备相应保证）。
- 可检测状态漂移，并通过应用变更进行纠正。
- 更容易理解。
- 自动解析依赖关系。

## 常用 IaC 工具

### 1. Terraform

**开发者：** HashiCorp。

**语言：** HCL（HashiCorp Configuration Language）。

**方法：** 声明式。

**云平台支持：** 多云（AWS、GCP、Azure，原文称超过 3,000 个 Provider）。

```hcl
provider "aws" {
  region = "us-west-2"
}

resource "aws_instance" "ml_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "p3.2xlarge"
}
```

**优点：**
- 行业常用标准。
- 庞大的 Provider 生态。
- 强大的社区。
- 完善的状态管理。
- 支持多云。

**缺点：**
- 需要学习领域特定语言（HCL）。
- 与通用编程语言相比，灵活性有所限制。

**适用场景：** 多云环境、大型团队、标准化建设。

### 2. Pulumi

**开发者：** Pulumi Corp。

**语言：** Python、TypeScript、Go、C#、Java。

**方法：** 声明式资源模型。

**云平台支持：** 多云。

```python
import pulumi
import pulumi_aws as aws

ml_server = aws.ec2.Instance(
    "ml-server",
    instance_type="p3.2xlarge",
    ami="ami-0c55b159cbfafe1f0"
)

pulumi.export("instance_id", ml_server.id)
```

**优点：**
- 使用熟悉的编程语言，例如 Python。
- 完整的语言特性（循环、条件、函数）。
- 类型安全与 IDE 支持（取决于所用语言）。
- 对软件开发人员较为友好。

**缺点（原文评价）：**
- 社区规模小于 Terraform。
- 相对较新，成熟度有所不同。
- Provider 覆盖范围较小。

**适用场景：** 大量使用 Python 的团队、复杂逻辑、软件工程师。

### 3. AWS CloudFormation

**开发者：** AWS。

**语言：** YAML 或 JSON。

**方法：** 声明式。

**云平台支持：** 主要面向 AWS。

```yaml
Resources:
  MLServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: p3.2xlarge
      ImageId: ami-0c55b159cbfafe1f0
```

**优点：**
- 原生 AWS 集成。
- 不需要额外工具。
- AWS 提供支持。
- 使用 StackSets 管理多账号资源。

**缺点：**
- 主要面向 AWS，存在厂商锁定风险。
- YAML 配置较冗长。
- 抽象能力有限。
- 原文认为迭代速度较慢。

**适用场景：** 仅使用 AWS 的组织、具有合规要求的环境。

### 4. Ansible

**开发者：** Red Hat。

**语言：** YAML。

**方法：** 命令式为主，也可以采用声明式资源管理。

**云平台支持：** 多云与配置管理。

```yaml
- name: Create ML EC2 instance
  amazon.aws.ec2_instance:
    name: ml-server
    instance_type: p3.2xlarge
    image_id: ami-0c55b159cbfafe1f0
    state: present
```

**优点：**
- 同时支持配置管理与资源供应。
- 无需常驻 Agent。
- 简洁的 YAML。
- 适合已有服务器。

**缺点：**
- 命令式操作可能产生问题。
- 状态管理能力相对有限。
- 原文认为大型基础设施的执行速度较慢。

**适用场景：** 配置管理、混合云、本地部署。

### 对比矩阵

| 特性 | Terraform | Pulumi | CloudFormation | Ansible |
|---|---|---|---|---|
| **多云支持** | 优秀 | 优秀 | 主要为 AWS | 良好 |
| **状态管理** | 优秀 | 优秀 | 良好 | 有限 |
| **学习曲线** | 中等 | 较低（熟悉 Python 时） | 中等 | 较低 |
| **社区** | 庞大 | 持续增长 | 庞大（AWS） | 庞大 |
| **语言** | HCL（DSL） | Python/TS/Go | YAML/JSON | YAML |
| **费用（原文）** | 免费（原文标为 OSS） | 免费及付费套餐 | AWS 服务原文标为免费 | 免费（OSS） |
| **AI/ML 适用性（原文评价）** | 非常适合 | 非常适合 | 适合 | 视场景而定 |

> 译注：Terraform 较新版本采用 Business Source License（BSL），不能笼统称为 OSI 定义的开源软件；OpenTofu 是采用开源许可证的相关替代方案。IaC 工具本身的费用不包括创建的云资源费用。工具评价为原作者观点。

## IaC 核心概念

### 1. Provider（提供程序）

与 API（AWS、GCP、Azure 等）交互的插件：

```hcl
provider "aws" {
  region = "us-west-2"
}

provider "google" {
  project = "my-ml-project"
  region  = "us-central1"
}
```

### 2. Resource（资源）

需要创建的基础设施组件：

```hcl
resource "aws_s3_bucket" "ml_data" {
  bucket = "my-ml-datasets"
}

resource "aws_instance" "gpu_server" {
  ami           = "ami-12345"
  instance_type = "p3.8xlarge"
}
```

### 3. State（状态）

IaC 工具追踪的当前基础设施状态：

```
terraform.tfstate
{
  "resources": [
    {
      "type": "aws_instance",
      "name": "gpu_server",
      "instances": [{
        "attributes": {
          "id": "i-0abc123",
          "public_ip": "54.123.45.67"
        }
      }]
    }
  ]
}
```

### 4. Variable（变量）

对基础设施进行参数化，以提高可复用性：

```hcl
variable "instance_type" {
  description = "EC2 instance type for ML training"
  type        = string
  default     = "p3.2xlarge"
}

resource "aws_instance" "ml_server" {
  instance_type = var.instance_type
}
```

### 5. Output（输出）

导出供其他地方使用的值：

```hcl
output "ml_server_ip" {
  value = aws_instance.ml_server.public_ip
}

output "s3_bucket_name" {
  value = aws_s3_bucket.ml_data.bucket
}
```

## IaC 工作流

```
1. Write Code
   ├── Define infrastructure in .tf or .py files
   └── Specify providers, resources, variables

2. Version Control
   ├── Commit to Git
   └── Create pull request for review

3. Plan
   ├── terraform plan / pulumi preview
   └── Review changes before applying

4. Apply
   ├── terraform apply / pulumi up
   └── Infrastructure is created/modified

5. Monitor State
   ├── Check terraform.tfstate
   └── Verify infrastructure matches code

6. Update
   ├── Modify code
   └── Repeat plan → apply cycle

7. Destroy (when done)
   ├── terraform destroy / pulumi destroy
   └── Remove all infrastructure (save money!)
```

## AI 基础设施 IaC 模式

### 模式 1：训练环境

```hcl
# GPU cluster for training
module "training_cluster" {
  source = "./modules/gpu-cluster"

  instance_count = 4
  instance_type  = "p3.8xlarge"
  dataset_bucket = "s3://my-datasets"

  # Automatically shut down after 8 hours
  auto_shutdown_hours = 8
}
```

### 模式 2：模型服务基础设施

```hcl
# Kubernetes cluster for model serving
module "inference_cluster" {
  source = "./modules/eks-cluster"

  node_groups = {
    cpu_nodes = {
      instance_type = "c5.2xlarge"
      min_size      = 2
      max_size      = 10
    }
    gpu_nodes = {
      instance_type = "p3.2xlarge"
      min_size      = 1
      max_size      = 5
    }
  }
}
```

### 模式 3：数据管道基础设施

```hcl
# S3 buckets for ML data
resource "aws_s3_bucket" "raw_data" {
  bucket = "ml-raw-data-${var.environment}"
}

resource "aws_s3_bucket" "processed_data" {
  bucket = "ml-processed-data-${var.environment}"
}

resource "aws_s3_bucket" "models" {
  bucket = "ml-models-${var.environment}"

  versioning {
    enabled = true  # Track model versions
  }
}
```

## AI/ML 基础设施的特殊考虑因素

### 1. GPU 可用性

GPU 容量有限，且因区域而异：

```hcl
# Check multiple regions for GPU availability
variable "gpu_regions" {
  default = ["us-west-2", "us-east-1", "eu-west-1"]
}

# Use availability zones with GPU instances
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}
```

### 2. 成本优化

```hcl
# Use spot instances for training (70% cheaper)
resource "aws_spot_instance_request" "ml_training" {
  ami           = "ami-12345"
  instance_type = "p3.8xlarge"
  spot_price    = "3.00"  # Max price per hour

  # Persistent request - auto-retry if terminated
  spot_type = "persistent"
}
```

### 3. 数据局部性（Data Locality）

```hcl
# Ensure compute and storage are in same region
variable "region" {
  default = "us-west-2"
}

resource "aws_s3_bucket" "datasets" {
  bucket = "ml-datasets"
  region = var.region  # Same region as GPU instances
}

resource "aws_instance" "gpu_server" {
  region = var.region
  # ...
}
```

### 4. 推理自动扩缩容

```hcl
# Auto-scale inference servers based on load
resource "aws_autoscaling_group" "inference" {
  min_size         = 2
  max_size         = 20
  desired_capacity = 5

  target_group_arns = [aws_lb_target_group.inference.arn]

  # Scale based on CPU or custom metrics
  tag {
    key                 = "ModelVersion"
    value               = "v2.3"
    propagate_at_launch = true
  }
}
```

## 最佳实践

### 1. 从小规模开始

从简单资源开始，逐步增加复杂度：

```
Week 1: Single EC2 instance
Week 2: Add S3 buckets
Week 3: Add networking
Week 4: Complete ML platform
```

### 2. 使用版本控制

```bash
git init
git add *.tf
git commit -m "Initial ML infrastructure"
git push origin main
```

### 3. 始终先执行 Plan

```bash
terraform plan   # See what will change
# Review output carefully
terraform apply  # Only if plan looks good
```

### 4. 使用远程状态

将状态存储在 S3 等远程后端，而不是本地：

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "ml-infrastructure/terraform.tfstate"
    region = "us-west-2"
  }
}
```

### 5. 为资源添加标签

```hcl
locals {
  common_tags = {
    Project     = "ML-Platform"
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = "AI-Research"
    Owner       = "ml-team@company.com"
  }
}

resource "aws_instance" "ml_server" {
  # ...
  tags = local.common_tags
}
```

## 应避免的常见陷阱

### 不要手动编辑基础设施

```
DON'T: Log into AWS Console and modify instance
DO:    Update Terraform code and apply
```

### 不要提交密钥

```hcl
# ❌ DON'T DO THIS
provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"  # Secret in code!
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# ✅ DO THIS
provider "aws" {
  # Credentials from environment variables or AWS CLI config
}
```

### 不要跳过 Plan

```bash
# ❌ DON'T
terraform apply -auto-approve  # Dangerous!

# ✅ DO
terraform plan
# Review output
terraform apply
```

### 不要无计划地混用手动操作与 IaC

应明确资源管理归属。混合管理方式容易导致状态漂移及混乱。

## 入门检查清单

- [ ] 安装 Terraform 或 Pulumi。
- [ ] 配置云平台 CLI（AWS CLI、gcloud 等）。
- [ ] 安全配置凭据。
- [ ] 创建第一个简单资源（S3 存储桶）。
- [ ] 使用版本控制管理代码。
- [ ] 学习阅读 Plan 输出。
- [ ] 练习 Apply 与 Destroy 的完整周期。
- [ ] 配置远程状态后端。
- [ ] 创建可复用模块。

## 下一步

理解 IaC 基础后，可以继续：

- **第 02 课：** 深入学习 Terraform 语法与命令。
- **第 03 课：** 掌握团队协作中的状态管理。
- **第 04 课：** 使用 Terraform 构建实际 AI 基础设施。

## 核心要点

- IaC 通过代码管理基础设施，而不是依赖手动流程。
- 声明式方法（Terraform、Pulumi）适合基础设施资源管理。
- IaC 对 AI/ML 的成本、可复现性及规模化要求十分重要。
- Terraform 与 Pulumi 是常用的多云 IaC 工具。
- 使用版本控制，应用变更前审查 Plan，避免未经管理的手动变更。
- AI 基础设施需要考虑 GPU、成本优化与数据局部性等特殊需求。

## 补充资源

- [Terraform 文档](https://www.terraform.io/docs)
- [Pulumi 文档](https://www.pulumi.com/docs)
- [HashiCorp Terraform 学习资料](https://learn.hashicorp.com/terraform)
- [AWS Well-Architected Framework——IaC](https://aws.amazon.com/architecture/well-architected/)

---

**下一课：** [02-terraform-fundamentals.md](02-terraform-fundamentals.md)

> 译注：IaC 能够帮助复现基础设施配置，但不能单独保证实验可复现；还需要固定镜像、模型、数据、代码和运行参数。状态漂移检测不等于持续自动修复。灾难恢复还需要数据备份、恢复流程及演练。原文 GPU 价格及供应商数量未独立核验。所有代码块保留原文，执行资源创建或销毁命令前应确认账号、区域、工作空间及费用。
