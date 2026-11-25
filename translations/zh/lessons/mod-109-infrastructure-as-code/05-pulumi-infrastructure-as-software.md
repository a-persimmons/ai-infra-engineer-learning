# 第 05 课：Pulumi——基础设施即软件

## 学习目标

完成本课后，你将能够：

- 理解 Pulumi 的「基础设施即软件」（Infrastructure as Software）理念。
- 安装并配置 Pulumi CLI。
- 使用 ML 工程师熟悉的 Python 编写基础设施代码。
- 深入比较 Pulumi 与 Terraform。
- 使用 Pulumi Python SDK 部署 ML 基础设施。
- 在基础设施代码中利用 Python 特性（循环、条件、函数）。
- 管理 Pulumi Stack 与配置。
- 使用 Python 构建完整 ML 平台。
- 判断何时使用 Pulumi 或 Terraform。

## 什么是 Pulumi？

**Pulumi** 是一种基础设施即代码工具，允许使用**通用编程语言**（Python、TypeScript、Go、C#、Java），而不是 HCL 等领域特定语言。

### 理念：基础设施即软件

```
Terraform:     Infrastructure as Code (DSL)
               ↓
               HCL (domain-specific language)

Pulumi:        Infrastructure as Software
               ↓
               Real programming languages (Python, TypeScript, etc.)
```

**关键区别：** 使用 Pulumi 时，可以利用与应用开发相同的语言及工具编写基础设施代码。

### 为什么 ML 工程师使用 Pulumi？

如果你已经熟悉 Python（许多 ML 工程师使用 Python），Pulumi 可以让你：

1. **使用熟悉的语法：** 不需要学习 HCL。
2. **利用语言特性：** 循环、函数、类与库。
3. **共享代码：** ML 代码与基础设施使用相同语言。
4. **获得 IDE 支持：** 智能提示、类型检查与调试。
5. **测试基础设施：** 使用 pytest、unittest 等工具。

## 安装 Pulumi

### macOS
```bash
brew install pulumi/tap/pulumi

# Verify installation
pulumi version
# v3.95.0
```

### Linux
```bash
curl -fsSL https://get.pulumi.com | sh

# Add to PATH
echo 'export PATH=$PATH:$HOME/.pulumi/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
pulumi version
```

### Windows
```powershell
# Using Chocolatey
choco install pulumi

# Or using winget
winget install pulumi

# Verify
pulumi version
```

### 安装 Python SDK
```bash
pip install pulumi pulumi-aws pulumi-gcp pulumi-kubernetes
```

## Pulumi 基础

### 项目结构

```bash
# Create new Pulumi project
mkdir ml-infrastructure-pulumi
cd ml-infrastructure-pulumi

pulumi new python -y
# Creates:
# - Pulumi.yaml       (project configuration)
# - __main__.py       (infrastructure code)
# - requirements.txt  (Python dependencies)
# - venv/            (Python virtual environment)
```

**Pulumi.yaml：**
```yaml
name: ml-infrastructure
runtime: python
description: ML infrastructure using Pulumi
```

**__main__.py（基础示例）：**
```python
import pulumi
import pulumi_aws as aws

# Create an S3 bucket
bucket = aws.s3.Bucket('ml-datasets',
    bucket='my-ml-datasets-unique-name',
    tags={
        'Name': 'ML Datasets',
        'Environment': 'production'
    }
)

# Export bucket name
pulumi.export('bucket_name', bucket.id)
```

### Pulumi CLI 命令

```bash
# Login to Pulumi service (free for individuals)
pulumi login

# Or use local state backend
pulumi login --local

# Or use S3
pulumi login s3://my-pulumi-state-bucket

# Create new stack (environment)
pulumi stack init dev

# Preview changes (like terraform plan)
pulumi preview

# Deploy infrastructure (like terraform apply)
pulumi up

# Destroy infrastructure
pulumi destroy

# View current state
pulumi stack

# Export stack output
pulumi stack output bucket_name

# Refresh state
pulumi refresh

# View deployment history
pulumi stack history
```

### 基础工作流

```bash
# 1. Initialize project
pulumi new python -y

# 2. Write infrastructure code in __main__.py

# 3. Install dependencies
pip install -r requirements.txt

# 4. Preview changes
pulumi preview

# 5. Deploy
pulumi up

# 6. View outputs
pulumi stack output

# 7. When done, destroy
pulumi destroy
```

## 基于 Python 的基础设施示例

### 使用 Python 逻辑创建 S3 存储桶

```python
import pulumi
import pulumi_aws as aws

# Configuration
config = pulumi.Config()
environment = config.get('environment') or 'dev'
enable_versioning = config.get_bool('enable_versioning') or False

# List of bucket types needed
bucket_types = ['datasets', 'models', 'artifacts']

# Create multiple buckets using Python loop
buckets = {}
for bucket_type in bucket_types:
    # Conditional bucket configuration based on environment
    if environment == 'production':
        storage_class = 'STANDARD'
        lifecycle_days = 365
    else:
        storage_class = 'STANDARD_IA'
        lifecycle_days = 30

    # Create bucket
    bucket = aws.s3.Bucket(f'ml-{bucket_type}',
        bucket=f'ml-{bucket_type}-{environment}-{aws.get_caller_identity().account_id}',
        tags={
            'Name': f'ML {bucket_type.title()}',
            'Environment': environment,
            'Type': bucket_type,
            'ManagedBy': 'Pulumi'
        }
    )

    # Conditional versioning (only for production models bucket)
    if bucket_type == 'models' and environment == 'production':
        versioning = aws.s3.BucketVersioningV2(f'{bucket_type}-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status='Enabled'
            )
        )

    # Lifecycle rules using Python variables
    lifecycle = aws.s3.BucketLifecycleConfigurationV2(f'{bucket_type}-lifecycle',
        bucket=bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id=f'archive-old-{bucket_type}',
                status='Enabled',
                transitions=[
                    aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                        days=lifecycle_days,
                        storage_class=storage_class
                    )
                ]
            )
        ]
    )

    # Store in dictionary for later reference
    buckets[bucket_type] = bucket

    # Export bucket names
    pulumi.export(f'{bucket_type}_bucket', bucket.id)

# Complex logic: Calculate and export total estimated storage cost
def calculate_storage_cost(bucket_dict):
    """Calculate estimated monthly storage cost"""
    cost_per_gb = {
        'STANDARD': 0.023,
        'STANDARD_IA': 0.0125,
    }

    # This is a simplified example - real cost would come from CloudWatch metrics
    estimated_gb = 1000  # Assume 1TB per bucket
    total_cost = len(bucket_dict) * estimated_gb * cost_per_gb[storage_class]

    return f"${total_cost:.2f}/month"

pulumi.export('estimated_storage_cost', calculate_storage_cost(buckets))
```

### 使用 Python 函数创建 GPU 实例

```python
import pulumi
import pulumi_aws as aws
from typing import Dict, List

def create_gpu_instance(
    name: str,
    instance_type: str = 'p3.2xlarge',
    disk_size: int = 500,
    spot: bool = True,
    tags: Dict[str, str] = None
) -> aws.ec2.Instance:
    """
    Create a GPU instance with best practices.

    Args:
        name: Instance name
        instance_type: EC2 instance type
        disk_size: Root volume size in GB
        spot: Use spot instances for cost savings
        tags: Additional tags

    Returns:
        AWS EC2 Instance resource
    """

    # Get latest Deep Learning AMI
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=['amazon'],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name='name',
                values=['Deep Learning AMI GPU PyTorch *']
            ),
            aws.ec2.GetAmiFilterArgs(
                name='architecture',
                values=['x86_64']
            )
        ]
    )

    # Default tags
    default_tags = {
        'Name': name,
        'ManagedBy': 'Pulumi',
        'Workload': 'ML-Training'
    }

    # Merge with user tags
    if tags:
        default_tags.update(tags)

    # Startup script
    user_data = """#!/bin/bash
    pip install --upgrade torch torchvision torchaudio
    pip install transformers datasets accelerate
    pip install wandb mlflow
    echo "GPU instance ready!" > /tmp/setup_complete.txt
    """

    # Create instance
    instance_args = {
        'instance_type': instance_type,
        'ami': ami.id,
        'user_data': user_data,
        'tags': default_tags,
        'root_block_device': aws.ec2.InstanceRootBlockDeviceArgs(
            volume_size=disk_size,
            volume_type='gp3',
            iops=3000,
            throughput=125
        )
    }

    # Add spot configuration if requested
    if spot:
        instance_args['instance_market_options'] = aws.ec2.InstanceInstanceMarketOptionsArgs(
            market_type='spot',
            spot_options=aws.ec2.InstanceInstanceMarketOptionsSpotOptionsArgs(
                max_price='3.00',
                spot_instance_type='persistent',
                instance_interruption_behavior='stop'
            )
        )

    instance = aws.ec2.Instance(name, **instance_args)

    return instance

# Usage: Create multiple GPU instances with different configurations
gpu_instances = []

# Development instance (small, spot)
dev_gpu = create_gpu_instance(
    name='gpu-dev',
    instance_type='p3.2xlarge',
    disk_size=100,
    spot=True,
    tags={'Environment': 'dev'}
)
gpu_instances.append(dev_gpu)

# Production instances (large, on-demand for reliability)
for i in range(3):
    prod_gpu = create_gpu_instance(
        name=f'gpu-prod-{i}',
        instance_type='p3.8xlarge',
        disk_size=500,
        spot=False,  # On-demand for production
        tags={
            'Environment': 'production',
            'Index': str(i)
        }
    )
    gpu_instances.append(prod_gpu)

# Export all instance IPs using list comprehension
pulumi.export('gpu_instance_ips', [instance.public_ip for instance in gpu_instances])
```

### ML 基础设施模块（可复用类）

```python
import pulumi
import pulumi_aws as aws
from typing import Optional, Dict, List

class MLInfrastructure:
    """
    Reusable ML infrastructure module.
    Creates VPC, subnets, GPU instances, and storage for ML workloads.
    """

    def __init__(
        self,
        name: str,
        environment: str,
        vpc_cidr: str = '10.0.0.0/16',
        gpu_instance_type: str = 'p3.2xlarge',
        gpu_instance_count: int = 2
    ):
        self.name = name
        self.environment = environment
        self.vpc_cidr = vpc_cidr
        self.gpu_instance_type = gpu_instance_type
        self.gpu_instance_count = gpu_instance_count

        # Create components
        self.vpc = self._create_vpc()
        self.subnets = self._create_subnets()
        self.security_groups = self._create_security_groups()
        self.buckets = self._create_storage()
        self.gpu_instances = self._create_gpu_cluster()

        # Export outputs
        self._export_outputs()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC for ML infrastructure"""
        return aws.ec2.Vpc(f'{self.name}-vpc',
            cidr_block=self.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                'Name': f'{self.name}-vpc',
                'Environment': self.environment
            }
        )

    def _create_subnets(self) -> Dict[str, aws.ec2.Subnet]:
        """Create public and private subnets"""
        # Internet Gateway
        igw = aws.ec2.InternetGateway(f'{self.name}-igw',
            vpc_id=self.vpc.id,
            tags={'Name': f'{self.name}-igw'}
        )

        # Public subnet
        public_subnet = aws.ec2.Subnet(f'{self.name}-public',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone='us-west-2a',
            map_public_ip_on_launch=True,
            tags={
                'Name': f'{self.name}-public',
                'Type': 'Public'
            }
        )

        # Private subnet
        private_subnet = aws.ec2.Subnet(f'{self.name}-private',
            vpc_id=self.vpc.id,
            cidr_block='10.0.10.0/24',
            availability_zone='us-west-2a',
            tags={
                'Name': f'{self.name}-private',
                'Type': 'Private'
            }
        )

        # Route table for public subnet
        public_rt = aws.ec2.RouteTable(f'{self.name}-public-rt',
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block='0.0.0.0/0',
                    gateway_id=igw.id
                )
            ],
            tags={'Name': f'{self.name}-public-rt'}
        )

        # Associate route table
        aws.ec2.RouteTableAssociation(f'{self.name}-public-rta',
            subnet_id=public_subnet.id,
            route_table_id=public_rt.id
        )

        return {
            'public': public_subnet,
            'private': private_subnet
        }

    def _create_security_groups(self) -> Dict[str, aws.ec2.SecurityGroup]:
        """Create security groups for GPU instances"""
        gpu_sg = aws.ec2.SecurityGroup(f'{self.name}-gpu-sg',
            vpc_id=self.vpc.id,
            description='Security group for GPU training instances',
            ingress=[
                # SSH
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=22,
                    to_port=22,
                    cidr_blocks=['0.0.0.0/0']
                ),
                # Jupyter
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=8888,
                    to_port=8888,
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            egress=[
                # All outbound
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            tags={'Name': f'{self.name}-gpu-sg'}
        )

        return {'gpu': gpu_sg}

    def _create_storage(self) -> Dict[str, aws.s3.Bucket]:
        """Create S3 buckets for datasets and models"""
        account_id = aws.get_caller_identity().account_id

        buckets = {}
        for bucket_type in ['datasets', 'models']:
            bucket = aws.s3.Bucket(f'{self.name}-{bucket_type}',
                bucket=f'{self.name}-{bucket_type}-{account_id}',
                tags={
                    'Name': f'{self.name}-{bucket_type}',
                    'Environment': self.environment
                }
            )
            buckets[bucket_type] = bucket

        return buckets

    def _create_gpu_cluster(self) -> List[aws.ec2.Instance]:
        """Create GPU training cluster"""
        # Get latest Deep Learning AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=['amazon'],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name='name',
                    values=['Deep Learning AMI GPU PyTorch *']
                )
            ]
        )

        instances = []
        for i in range(self.gpu_instance_count):
            instance = aws.ec2.Instance(f'{self.name}-gpu-{i}',
                instance_type=self.gpu_instance_type,
                ami=ami.id,
                subnet_id=self.subnets['public'].id,
                vpc_security_group_ids=[self.security_groups['gpu'].id],
                tags={
                    'Name': f'{self.name}-gpu-{i}',
                    'Environment': self.environment,
                    'Index': str(i)
                }
            )
            instances.append(instance)

        return instances

    def _export_outputs(self):
        """Export important values"""
        pulumi.export('vpc_id', self.vpc.id)
        pulumi.export('datasets_bucket', self.buckets['datasets'].id)
        pulumi.export('models_bucket', self.buckets['models'].id)
        pulumi.export('gpu_ips', [inst.public_ip for inst in self.gpu_instances])

# Usage: Create ML infrastructure with one line
ml_infra = MLInfrastructure(
    name='ml-platform',
    environment='production',
    gpu_instance_type='p3.8xlarge',
    gpu_instance_count=4
)
```

## Pulumi Stack 与配置

### Stack（堆栈）

Stack 是基础设施的独立实例，类似于 Terraform Workspace。

```bash
# Create stacks for different environments
pulumi stack init dev
pulumi stack init staging
pulumi stack init production

# List stacks
pulumi stack ls
# NAME        LAST UPDATE  RESOURCE COUNT
# dev         2 hours ago  15
# staging     1 day ago    20
# production* 1 week ago   50

# Switch stack
pulumi stack select dev

# View stack details
pulumi stack

# Delete stack
pulumi stack rm staging
```

### 配置

每个 Stack 拥有自己的配置：

```bash
# Set configuration values
pulumi config set aws:region us-west-2
pulumi config set environment dev
pulumi config set gpu_instance_count 2

# Set secret (encrypted)
pulumi config set --secret db_password SuperSecret123

# Set structured config (JSON)
pulumi config set gpu_config '{"type":"p3.2xlarge","count":4}' --json

# View configuration
pulumi config

# Get specific value
pulumi config get environment
```

**在 Python 中访问：**
```python
import pulumi

config = pulumi.Config()

# Get values
environment = config.require('environment')  # Required, error if not set
region = config.get('region') or 'us-west-2'  # Optional with default
gpu_count = config.get_int('gpu_instance_count') or 2

# Get secret (decrypted automatically)
db_password = config.require_secret('db_password')

# Get structured config
gpu_config = config.require_object('gpu_config')
instance_type = gpu_config['type']
instance_count = gpu_config['count']
```

**Pulumi.dev.yaml（自动生成）：**
```yaml
config:
  aws:region: us-west-2
  ml-infrastructure:environment: dev
  ml-infrastructure:gpu_instance_count: "2"
  ml-infrastructure:db_password:
    secure: AAABANKnPZl... # Encrypted
```

### 环境专用配置

```python
import pulumi
import pulumi_aws as aws

config = pulumi.Config()
environment = config.require('environment')

# Environment-specific settings
settings = {
    'dev': {
        'instance_type': 't3.large',
        'instance_count': 1,
        'disk_size': 50,
        'use_spot': True
    },
    'staging': {
        'instance_type': 'p3.2xlarge',
        'instance_count': 2,
        'disk_size': 100,
        'use_spot': True
    },
    'production': {
        'instance_type': 'p3.8xlarge',
        'instance_count': 10,
        'disk_size': 500,
        'use_spot': False
    }
}

env_config = settings[environment]

# Create instances based on environment
for i in range(env_config['instance_count']):
    instance = aws.ec2.Instance(f'ml-server-{i}',
        instance_type=env_config['instance_type'],
        # ... other configuration
        tags={
            'Environment': environment,
            'Index': str(i)
        }
    )
```

## 完整 ML 平台示例

**__main__.py——完整 ML 平台：**

```python
"""
Complete ML Training Platform with Pulumi
"""
import pulumi
import pulumi_aws as aws
import json
from typing import List, Dict

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
environment = config.get('environment') or stack_name

# AWS Configuration
aws_config = pulumi.Config('aws')
region = aws_config.get('region') or 'us-west-2'

# ML Platform Configuration
ml_config = config.require_object('ml_platform')
gpu_instance_type = ml_config.get('gpu_instance_type', 'p3.2xlarge')
gpu_instance_count = ml_config.get('gpu_instance_count', 2)
enable_spot = ml_config.get('enable_spot', True)

# Get current account ID
account_id = aws.get_caller_identity().account_id

# ============================================================================
# VPC and Networking
# ============================================================================

vpc = aws.ec2.Vpc('ml-vpc',
    cidr_block='10.0.0.0/16',
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        'Name': f'{project_name}-vpc',
        'Environment': environment
    }
)

# Internet Gateway
igw = aws.ec2.InternetGateway('ml-igw',
    vpc_id=vpc.id,
    tags={'Name': f'{project_name}-igw'}
)

# Public Subnets
public_subnets = []
for i, az in enumerate(['us-west-2a', 'us-west-2b']):
    subnet = aws.ec2.Subnet(f'ml-public-{i}',
        vpc_id=vpc.id,
        cidr_block=f'10.0.{i+1}.0/24',
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            'Name': f'{project_name}-public-{i}',
            'Type': 'Public'
        }
    )
    public_subnets.append(subnet)

# Private Subnets
private_subnets = []
for i, az in enumerate(['us-west-2a', 'us-west-2b']):
    subnet = aws.ec2.Subnet(f'ml-private-{i}',
        vpc_id=vpc.id,
        cidr_block=f'10.0.{i+10}.0/24',
        availability_zone=az,
        tags={
            'Name': f'{project_name}-private-{i}',
            'Type': 'Private'
        }
    )
    private_subnets.append(subnet)

# Route Table for Public Subnets
public_rt = aws.ec2.RouteTable('ml-public-rt',
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block='0.0.0.0/0',
            gateway_id=igw.id
        )
    ],
    tags={'Name': f'{project_name}-public-rt'}
)

# Associate public subnets with route table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(f'ml-public-rta-{i}',
        subnet_id=subnet.id,
        route_table_id=public_rt.id
    )

# ============================================================================
# Security Groups
# ============================================================================

gpu_sg = aws.ec2.SecurityGroup('gpu-training-sg',
    vpc_id=vpc.id,
    description='Security group for GPU training instances',
    ingress=[
        # SSH
        aws.ec2.SecurityGroupIngressArgs(
            protocol='tcp',
            from_port=22,
            to_port=22,
            cidr_blocks=['0.0.0.0/0'],
            description='SSH access'
        ),
        # Jupyter
        aws.ec2.SecurityGroupIngressArgs(
            protocol='tcp',
            from_port=8888,
            to_port=8888,
            cidr_blocks=['0.0.0.0/0'],
            description='Jupyter notebook'
        ),
        # TensorBoard
        aws.ec2.SecurityGroupIngressArgs(
            protocol='tcp',
            from_port=6006,
            to_port=6006,
            cidr_blocks=['0.0.0.0/0'],
            description='TensorBoard'
        ),
        # Instance to instance communication
        aws.ec2.SecurityGroupIngressArgs(
            protocol='-1',
            from_port=0,
            to_port=0,
            self=True,
            description='Instance to instance'
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0'],
            description='All outbound'
        )
    ],
    tags={'Name': f'{project_name}-gpu-sg'}
)

# ============================================================================
# S3 Storage
# ============================================================================

# Storage buckets
bucket_types = ['datasets', 'models', 'artifacts']
buckets = {}

for bucket_type in bucket_types:
    bucket = aws.s3.Bucket(f'ml-{bucket_type}',
        bucket=f'{project_name}-{bucket_type}-{account_id}',
        tags={
            'Name': f'{project_name}-{bucket_type}',
            'Environment': environment,
            'Type': bucket_type
        }
    )

    # Enable versioning for models
    if bucket_type == 'models':
        aws.s3.BucketVersioningV2(f'{bucket_type}-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status='Enabled'
            )
        )

    # Encryption
    aws.s3.BucketServerSideEncryptionConfigurationV2(f'{bucket_type}-encryption',
        bucket=bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='AES256'
                )
            )
        ]
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(f'{bucket_type}-public-access-block',
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    buckets[bucket_type] = bucket

# ============================================================================
# IAM Roles
# ============================================================================

# IAM role for GPU instances
gpu_role = aws.iam.Role('gpu-instance-role',
    assume_role_policy=json.dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Action': 'sts:AssumeRole',
            'Effect': 'Allow',
            'Principal': {
                'Service': 'ec2.amazonaws.com'
            }
        }]
    }),
    tags={'Name': f'{project_name}-gpu-role'}
)

# Custom policy for S3 access
gpu_policy = aws.iam.RolePolicy('gpu-s3-policy',
    role=gpu_role.id,
    policy=pulumi.Output.all(
        buckets['datasets'].arn,
        buckets['models'].arn,
        buckets['artifacts'].arn
    ).apply(lambda arns: json.dumps({
        'Version': '2012-10-17',
        'Statement': [
            {
                'Effect': 'Allow',
                'Action': ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
            },
            {
                'Effect': 'Allow',
                'Action': ['cloudwatch:PutMetricData'],
                'Resource': '*'
            }
        ]
    }))
)

# Instance profile
instance_profile = aws.iam.InstanceProfile('gpu-instance-profile',
    role=gpu_role.name
)

# ============================================================================
# GPU Training Instances
# ============================================================================

# Get latest Deep Learning AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=['amazon'],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name='name',
            values=['Deep Learning AMI GPU PyTorch *']
        ),
        aws.ec2.GetAmiFilterArgs(
            name='architecture',
            values=['x86_64']
        )
    ]
)

# Startup script
user_data = pulumi.Output.all(
    buckets['datasets'].id,
    buckets['models'].id
).apply(lambda args: f"""#!/bin/bash
# Update packages
yum update -y

# Install additional ML tools
pip install --upgrade torch torchvision torchaudio
pip install transformers datasets accelerate
pip install wandb mlflow tensorboard

# Configure AWS CLI
aws configure set default.region {region}

# Create directories
mkdir -p /data/datasets /data/models /data/artifacts

# Sync S3 buckets
aws s3 sync s3://{args[0]} /data/datasets
aws s3 sync s3://{args[1]} /data/models

# Setup complete
echo "GPU instance ready at $(date)" > /tmp/setup_complete.txt
""")

# Create GPU instances
gpu_instances = []
for i in range(gpu_instance_count):
    instance_args = {
        'instance_type': gpu_instance_type,
        'ami': ami.id,
        'subnet_id': public_subnets[i % len(public_subnets)].id,
        'vpc_security_group_ids': [gpu_sg.id],
        'iam_instance_profile': instance_profile.name,
        'user_data': user_data,
        'root_block_device': aws.ec2.InstanceRootBlockDeviceArgs(
            volume_size=500,
            volume_type='gp3',
            iops=3000,
            throughput=125
        ),
        'tags': {
            'Name': f'{project_name}-gpu-{i}',
            'Environment': environment,
            'Index': str(i),
            'Workload': 'ML-Training'
        }
    }

    # Add spot configuration if enabled
    if enable_spot:
        instance_args['instance_market_options'] = aws.ec2.InstanceInstanceMarketOptionsArgs(
            market_type='spot',
            spot_options=aws.ec2.InstanceInstanceMarketOptionsSpotOptionsArgs(
                max_price='3.00',
                spot_instance_type='persistent',
                instance_interruption_behavior='stop'
            )
        )

    instance = aws.ec2.Instance(f'gpu-{i}', **instance_args)
    gpu_instances.append(instance)

# ============================================================================
# Outputs
# ============================================================================

pulumi.export('vpc_id', vpc.id)
pulumi.export('public_subnet_ids', [s.id for s in public_subnets])
pulumi.export('private_subnet_ids', [s.id for s in private_subnets])
pulumi.export('gpu_security_group_id', gpu_sg.id)

pulumi.export('datasets_bucket', buckets['datasets'].id)
pulumi.export('models_bucket', buckets['models'].id)
pulumi.export('artifacts_bucket', buckets['artifacts'].id)

pulumi.export('gpu_instance_ids', [inst.id for inst in gpu_instances])
pulumi.export('gpu_instance_ips', [inst.public_ip for inst in gpu_instances])

# SSH commands for each instance
pulumi.export('ssh_commands', pulumi.Output.all(
    *[inst.public_ip for inst in gpu_instances]
).apply(lambda ips: [f'ssh ec2-user@{ip}' for ip in ips]))

# Cost estimation
pulumi.export('estimated_monthly_cost', pulumi.Output.all(
    *[inst.instance_type for inst in gpu_instances]
).apply(lambda types: f"${len(types) * 3.06 * 730:.2f} (spot) or ${len(types) * 3.06 * 730 / 0.3:.2f} (on-demand)"))
```

**Pulumi.yaml：**
```yaml
name: ml-platform
runtime: python
description: Complete ML training platform
```

**Pulumi.dev.yaml：**
```yaml
config:
  aws:region: us-west-2
  ml-platform:environment: dev
  ml-platform:ml_platform:
    gpu_instance_type: p3.2xlarge
    gpu_instance_count: 2
    enable_spot: true
```

**Pulumi.production.yaml：**
```yaml
config:
  aws:region: us-west-2
  ml-platform:environment: production
  ml-platform:ml_platform:
    gpu_instance_type: p3.8xlarge
    gpu_instance_count: 10
    enable_spot: false
```

**部署：**
```bash
# Dev environment
pulumi stack select dev
pulumi up

# Production environment
pulumi stack select production
pulumi up
```

## Pulumi 与 Terraform 对比

### 详细比较

| 特性 | Terraform | Pulumi |
|---|---|---|
| **语言** | HCL（DSL） | Python、TypeScript、Go、C#、Java |
| **学习曲线** | 中等（学习 HCL） | 较低（熟悉 Python 时） |
| **类型安全** | 原文评价为有限 | 完整语言类型支持（取决于语言） |
| **IDE 支持** | 原文评价为基础 | 优秀（智能提示、调试） |
| **测试** | terraform validate、tflint | pytest、unittest 等完整测试框架 |
| **循环** | for_each、count | 原生语言循环 |
| **条件** | 三元表达式、count 等模式 | 原生 if/else |
| **函数** | 内置函数为主 | 完整语言能力 |
| **状态管理** | 优秀 | 优秀 |
| **Provider 生态（原文统计）** | 3,000+ Provider | 100+ Provider（持续增长） |
| **社区** | 非常庞大 | 持续增长 |
| **企业支持** | Terraform Cloud | Pulumi Cloud |
| **费用（原文）** | 免费（原文标为 OSS）及付费 Terraform Cloud | 免费个人套餐及付费 Pulumi Cloud |
| **多云** | 优秀 | 优秀 |
| **成熟度（原文评价）** | 非常成熟（2014 年） | 成熟（2018 年） |
| **文档（原文评价）** | 优秀 | 良好 |

### 代码比较

**创建 5 个 S3 存储桶：**

**Terraform：**
```hcl
variable "bucket_names" {
  default = ["datasets", "models", "artifacts", "logs", "backups"]
}

resource "aws_s3_bucket" "buckets" {
  for_each = toset(var.bucket_names)

  bucket = "ml-${each.value}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "ML ${title(each.value)}"
  }
}
```

**Pulumi（Python）：**
```python
bucket_names = ['datasets', 'models', 'artifacts', 'logs', 'backups']

buckets = {}
for name in bucket_names:
    buckets[name] = aws.s3.Bucket(f'ml-{name}',
        bucket=f'ml-{name}-{account_id}',
        tags={'Name': f'ML {name.title()}'}
    )
```

**复杂逻辑：**

**Terraform：**
```hcl
# Create instances based on complex rules
locals {
  # Complex logic in locals
  instance_configs = {
    for env in ["dev", "staging", "prod"] :
    env => {
      type  = env == "prod" ? "p3.8xlarge" : env == "staging" ? "p3.2xlarge" : "t3.large"
      count = env == "prod" ? 10 : env == "staging" ? 3 : 1
    }
  }
}

# Flatten for resource creation
locals {
  instances = flatten([
    for env, config in local.instance_configs : [
      for i in range(config.count) : {
        env   = env
        type  = config.type
        index = i
      }
    ]
  ])
}

resource "aws_instance" "servers" {
  for_each = { for idx, inst in local.instances : "${inst.env}-${inst.index}" => inst }

  instance_type = each.value.type
  # ...
}
```

**Pulumi（Python）：**
```python
# Same logic, much clearer
instance_configs = {
    'dev': {'type': 't3.large', 'count': 1},
    'staging': {'type': 'p3.2xlarge', 'count': 3},
    'prod': {'type': 'p3.8xlarge', 'count': 10}
}

instances = []
for env, config in instance_configs.items():
    for i in range(config['count']):
        instance = aws.ec2.Instance(f'{env}-{i}',
            instance_type=config['type'],
            # ...
        )
        instances.append(instance)
```

## 何时选择 Pulumi 或 Terraform

### 适合选择 Terraform 的情况

- 团队已掌握 HCL。
- 需要较广的 Provider 覆盖范围（原文列举 3,000+ Provider）。
- 所在组织大量使用 Terraform。
- 偏好声明式 DSL。
- 需要成熟的工具体系。
- 合规要求使用特定工具。

### 适合选择 Pulumi 的情况

- 团队熟悉 Python、TypeScript 或 Go。
- 希望使用熟悉的编程语言。
- 需要复杂逻辑与抽象。
- 希望获得较好的 IDE 支持及类型安全能力。
- 偏好「基础设施即软件」理念。
- 正在围绕基础设施构建工具。

### 对于 ML 团队

**原文认为 Pulumi 在许多场景中更合适，因为：**
- ML 工程师通常熟悉 Python。
- 复杂的 ML 基础设施可以利用完整的编程能力。
- 使用相同语言更便于与 ML 工作流集成。
- 适合动态基础设施相关逻辑（实验追踪、自动扩缩容等）。

## 核心要点

- Pulumi 使用通用编程语言（Python、TypeScript 等）。
- 采用「基础设施即软件」理念。
- 为 ML 工程师提供熟悉的 Python 语法。
- 支持循环、函数、类与库等完整语言特性。
- 支持 IDE 与语言类型系统。
- 使用 Stack 管理多个环境。
- 每个 Stack 具有独立配置，类似 Terraform Workspace。
- 根据团队技能与实际需求选择工具。

## 下一步

- **第 06 课：** 高级 IaC 模式（模块、多环境）。
- **第 07 课：** 基础设施 GitOps 与 CI/CD。
- **第 08 课：** 安全最佳实践。

---

**下一课：** [06-advanced-iac-patterns.md](06-advanced-iac-patterns.md)

> 译注：工具对比与 Provider 数量为原文评价和统计，并非当前完整能力清单。Terraform 支持类型约束、模块、terraform test 等能力，较新 Terraform 采用 BSL 许可证；Terraform Cloud 也有名称演进。Pulumi 使用通用语言描述期望资源状态，并不意味着可以忽略依赖图、Output 的异步求值和 Preview 阶段的不确定值；Python 类型注解也不是自动运行时验证。动态扩缩容通常由云端控制器实现，而非 IaC 语言自身。原始代码块保留，未执行云资源部署。
