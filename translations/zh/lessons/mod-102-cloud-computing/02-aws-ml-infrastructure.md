# 第 02 课：面向机器学习基础设施的 AWS

**时长：** 7 小时
**目标：** 掌握用于构建、部署及管理机器学习基础设施的 AWS 服务。

## 导论

Amazon Web Services（AWS）是广泛使用的云平台之一，提供丰富的机器学习基础设施服务。本课涵盖构建生产机器学习系统所需的核心 AWS 服务，从计算与存储到托管机器学习服务。

## AWS 机器学习服务全景

```
┌──────────────────────────────────────────────────────────────┐
│                   AWS ML Services Stack                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Managed ML Services                                          │
│  ┌────────────┬─────────────┬──────────────┐                │
│  │ SageMaker  │   Bedrock   │  Rekognition │                │
│  │ (Training/ │  (Gen AI)   │  (Computer   │                │
│  │  Serving)  │             │   Vision)    │                │
│  └────────────┴─────────────┴──────────────┘                │
│                       ↓                                       │
│  Compute Layer                                                │
│  ┌────────────┬─────────────┬──────────────┐                │
│  │    EC2     │     ECS     │     EKS      │                │
│  │ (VMs+GPU)  │ (Containers)│ (Kubernetes) │                │
│  └────────────┴─────────────┴──────────────┘                │
│                       ↓                                       │
│  Storage Layer                                                │
│  ┌────────────┬─────────────┬──────────────┐                │
│  │     S3     │     EBS     │     EFS      │                │
│  │  (Object)  │   (Block)   │    (File)    │                │
│  └────────────┴─────────────┴──────────────┘                │
│                       ↓                                       │
│  Foundation Layer                                             │
│  ┌────────────┬─────────────┬──────────────┐                │
│  │    VPC     │     IAM     │  CloudWatch  │                │
│  │ (Network)  │  (Security) │ (Monitoring) │                │
│  └────────────┴─────────────┴──────────────┘                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 第一部分：AWS 账号配置与 IAM

### 设置 AWS 账号

**步骤 1：创建 AWS 账号**
```bash
# Sign up at: https://aws.amazon.com/
# You'll need:
# - Email address
# - Credit card (won't be charged for free tier)
# - Phone number for verification

# Free Tier includes (12 months):
# - 750 hours/month t2.micro EC2 (1 vCPU, 1 GB RAM)
# - 5 GB S3 storage
# - 30 GB EBS storage
# - 15 GB data transfer out
```

**步骤 2：保护 Root 账号**
```bash
# CRITICAL: Never use root account for daily operations!

# 1. Enable MFA (Multi-Factor Authentication)
#    Account → Security Credentials → MFA → Activate MFA
#    Use: Google Authenticator, Authy, or hardware token

# 2. Create billing alarm
#    CloudWatch → Alarms → Create Alarm → Billing
#    Alert when: EstimatedCharges > $10
```

**步骤 3：安装 AWS CLI**
```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
# Output: aws-cli/2.x.x Python/3.x.x Linux/x.x.x

# Configure AWS CLI
aws configure
# AWS Access Key ID: [Your key]
# AWS Secret Access Key: [Your secret]
# Default region name: us-east-1
# Default output format: json

# Test configuration
aws sts get-caller-identity
```

### IAM（Identity and Access Management，身份与访问管理）

**理解 IAM 概念：**
```
IAM Components:

1. Users: Individual people
2. Groups: Collections of users
3. Roles: Permissions for AWS services
4. Policies: JSON documents defining permissions

Principle of Least Privilege:
Grant only the permissions needed for the task
```

**为机器学习开发创建 IAM 用户：**
```bash
# Create user
aws iam create-user --user-name ml-engineer

# Attach policy for ML development
aws iam attach-user-policy \
    --user-name ml-engineer \
    --policy-arn arn:aws:iam::aws:policy/AmazonSageMakerFullAccess

aws iam attach-user-policy \
    --user-name ml-engineer \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

aws iam attach-user-policy \
    --user-name ml-engineer \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access key
aws iam create-access-key --user-name ml-engineer
```

**机器学习 IAM 策略示例：**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:*",
        "ec2:DescribeInstances",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

> 译注：本课保留原文 IAM 用户与策略示例。实际人员访问优先使用 IAM Identity Center、联合身份和短期凭据；工作负载优先使用 IAM Role。不要为 Root 账号创建日常使用的访问密钥，也不要直接将示例中的宽泛策略应用于生产环境。

## 第二部分：用于机器学习计算的 EC2

### 面向机器学习的 EC2 实例类型

**通用型（t3、m5）：**
- 轻量级推理工作负载。
- 开发与测试。
- 成本效益较好。

**计算优化型（c5、c6i）：**
- 基于 CPU 的训练。
- 批量推理。
- 高性能计算。

**GPU 实例：**
```
┌──────────────┬─────────────┬──────────┬─────────────┬───────────┐
│ Instance     │ GPU         │ GPU RAM  │ vCPUs       │ Cost/hour │
├──────────────┼─────────────┼──────────┼─────────────┼───────────┤
│ g4dn.xlarge  │ 1x T4       │ 16 GB    │ 4           │ $0.526    │
│ g4dn.12xl    │ 4x T4       │ 64 GB    │ 48          │ $3.912    │
│ p3.2xlarge   │ 1x V100     │ 16 GB    │ 8           │ $3.06     │
│ p3.8xlarge   │ 4x V100     │ 64 GB    │ 32          │ $12.24    │
│ p4d.24xlarge │ 8x A100     │ 320 GB   │ 96          │ $32.77    │
│ g5.xlarge    │ 1x A10G     │ 24 GB    │ 4           │ $1.006    │
│ g5.48xlarge  │ 8x A10G     │ 192 GB   │ 192         │ $16.288   │
└──────────────┴─────────────┴──────────┴─────────────┴───────────┘

Recommendations:
- Development: g4dn.xlarge (T4, affordable)
- Small models: g5.xlarge (A10G, good value)
- Medium models: p3.2xlarge (V100, proven)
- Large models: p3.8xlarge or p4d.24xlarge (A100)
```

### 启动用于机器学习的 EC2 实例

**使用 AWS 控制台：**
```
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Choose AMI: Deep Learning AMI (Ubuntu)
   - Pre-installed: PyTorch, TensorFlow, CUDA
4. Choose Instance Type: g4dn.xlarge
5. Configure:
   - Network: Default VPC
   - Storage: 50 GB gp3
   - Security Group: Allow SSH (22), HTTP (8000)
6. Review and Launch
7. Create/Select Key Pair
8. Launch
```

**使用 AWS CLI：**
```bash
# Find Deep Learning AMI
aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=Deep Learning AMI (Ubuntu*" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].[ImageId,Name]' \
    --output text

# Create security group
aws ec2 create-security-group \
    --group-name ml-training \
    --description "ML training security group"

# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-name ml-training \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# Allow custom port for Jupyter/API
aws ec2 authorize-security-group-ingress \
    --group-name ml-training \
    --protocol tcp \
    --port 8000-8888 \
    --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
    --image-id ami-xxxxx \
    --instance-type g4dn.xlarge \
    --key-name my-key-pair \
    --security-groups ml-training \
    --block-device-mappings '[
        {
            "DeviceName": "/dev/sda1",
            "Ebs": {
                "VolumeSize": 100,
                "VolumeType": "gp3",
                "DeleteOnTermination": true
            }
        }
    ]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ml-training}]'

# Get instance details
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=ml-training" \
    --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,State.Name]' \
    --output table
```

**连接实例：**
```bash
# SSH into instance
ssh -i my-key-pair.pem ubuntu@<public-ip>

# Verify GPU
nvidia-smi

# Activate conda environment
conda activate pytorch

# Test PyTorch with GPU
python -c "import torch; print(torch.cuda.is_available())"
```

### 使用 Spot 实例降低成本

**什么是 Spot 实例？**
- 利用闲置 EC2 容量，原文示例折扣最高可达 90%。
- 可能在收到两分钟中断通知后被回收。
- 非常适合具有检查点恢复能力的训练。

**启动 Spot 实例：**
```bash
# Create spot instance request
aws ec2 request-spot-instances \
    --spot-price "0.50" \
    --instance-count 1 \
    --type "one-time" \
    --launch-specification '{
        "ImageId": "ami-xxxxx",
        "InstanceType": "g4dn.xlarge",
        "KeyName": "my-key-pair",
        "SecurityGroups": ["ml-training"]
    }'

# Monitor spot price history
aws ec2 describe-spot-price-history \
    --instance-types g4dn.xlarge \
    --start-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --product-descriptions "Linux/UNIX" \
    --query 'SpotPriceHistory[*].[Timestamp,SpotPrice]' \
    --output table
```

**Spot 实例最佳实践：**
```python
# Implement checkpointing in training script
import torch

def train_with_checkpoints(model, train_loader, epochs=10):
    checkpoint_dir = "/data/checkpoints"

    # Resume from checkpoint if exists
    start_epoch = 0
    if os.path.exists(f"{checkpoint_dir}/latest.pth"):
        checkpoint = torch.load(f"{checkpoint_dir}/latest.pth")
        model.load_state_dict(checkpoint['model_state'])
        start_epoch = checkpoint['epoch']
        print(f"Resumed from epoch {start_epoch}")

    for epoch in range(start_epoch, epochs):
        # Training loop
        for batch in train_loader:
            # ... training code ...
            pass

        # Save checkpoint after each epoch
        torch.save({
            'epoch': epoch + 1,
            'model_state': model.state_dict(),
            'optimizer_state': optimizer.state_dict(),
        }, f"{checkpoint_dir}/latest.pth")

        print(f"Checkpoint saved at epoch {epoch + 1}")
```

## 第三部分：用于数据与模型存储的 S3

### S3 概念

```
S3 Hierarchy:

Bucket (globally unique name)
  ├─ folder/ (prefix, not real directory)
  │   ├─ file1.txt (object)
  │   └─ file2.txt (object)
  └─ models/
      ├─ model-v1.pth
      └─ model-v2.pth

Key Features:
- Unlimited storage
- 99.999999999% durability (11 nines)
- Versioning support
- Lifecycle policies
- Access control (IAM, bucket policies)
```

### 创建及使用 S3 存储桶

**创建存储桶：**
```bash
# Create bucket
aws s3 mb s3://my-ml-datasets-12345

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket my-ml-datasets-12345 \
    --versioning-configuration Status=Enabled

# Set lifecycle policy (archive old data)
aws s3api put-bucket-lifecycle-configuration \
    --bucket my-ml-datasets-12345 \
    --lifecycle-configuration file://lifecycle.json
```

**lifecycle.json：**
```json
{
  "Rules": [
    {
      "Id": "Archive old models",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "models/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

**上传/下载数据：**
```bash
# Upload file
aws s3 cp model.pth s3://my-ml-datasets-12345/models/model-v1.pth

# Upload directory
aws s3 cp datasets/ s3://my-ml-datasets-12345/datasets/ --recursive

# Download file
aws s3 cp s3://my-ml-datasets-12345/models/model-v1.pth ./

# Sync directory (efficient, only changed files)
aws s3 sync s3://my-ml-datasets-12345/datasets/ ./datasets/

# List objects
aws s3 ls s3://my-ml-datasets-12345/models/

# Delete object
aws s3 rm s3://my-ml-datasets-12345/models/old-model.pth
```

**Python SDK（boto3）：**
```python
import boto3

# Create S3 client
s3 = boto3.client('s3')

# Upload file
s3.upload_file('model.pth', 'my-ml-datasets-12345', 'models/model-v1.pth')

# Download file
s3.download_file('my-ml-datasets-12345', 'models/model-v1.pth', 'model.pth')

# List objects
response = s3.list_objects_v2(Bucket='my-ml-datasets-12345', Prefix='models/')
for obj in response['Contents']:
    print(obj['Key'], obj['Size'])

# Generate pre-signed URL (temporary access)
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'my-ml-datasets-12345', 'Key': 'models/model-v1.pth'},
    ExpiresIn=3600  # 1 hour
)
print(f"Download URL: {url}")
```

### S3 存储类别与成本

```
┌────────────────────┬──────────────┬─────────────┬──────────────┐
│ Storage Class      │ Cost/GB/mo   │ Retrieval   │ Use Case     │
├────────────────────┼──────────────┼─────────────┼──────────────┤
│ Standard           │ $0.023       │ Free        │ Active data  │
│ Intelligent-Tier   │ $0.023-0.015 │ Free        │ Unknown      │
│ Standard-IA        │ $0.0125      │ $0.01/GB    │ Infrequent   │
│ One Zone-IA        │ $0.01        │ $0.01/GB    │ Backups      │
│ Glacier Instant    │ $0.004       │ $0.03/GB    │ Archive      │
│ Glacier Flexible   │ $0.0036      │ Variable    │ Long-term    │
│ Glacier Deep       │ $0.00099     │ $0.02/GB    │ Compliance   │
└────────────────────┴──────────────┴─────────────┴──────────────┘

Recommendations:
- Training data: Standard (frequent access)
- Trained models: Standard-IA (occasional access)
- Old experiments: Glacier (archive)
```

## 第四部分：用于 Kubernetes 的 EKS

### Amazon EKS 概览

**什么是 EKS？**
- 托管 Kubernetes 服务。
- AWS 管理控制面。
- 你管理 Worker 节点（也可选择进一步托管的计算模式）。
- 与 AWS 服务集成。

**为什么在机器学习中使用 EKS？**
- 可扩展的模型服务。
- 多模型部署。
- 资源隔离。
- 自动扩缩容。
- 高可用性。

### 设置 EKS 集群

**前置条件：**
```bash
# Install eksctl
curl --silent --location "https://github.com/weksctl-io/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
eksctl version
kubectl version --client
```

**创建 EKS 集群：**
```bash
# Create cluster with eksctl (simple)
eksctl create cluster \
    --name ml-serving-cluster \
    --region us-east-1 \
    --nodegroup-name ml-nodes \
    --node-type m5.large \
    --nodes 2 \
    --nodes-min 1 \
    --nodes-max 4 \
    --managed

# This takes ~15 minutes
# Creates:
# - EKS control plane
# - VPC with subnets
# - Security groups
# - IAM roles
# - Node group (EC2 instances)

# Verify cluster
kubectl get nodes
```

**cluster-config.yaml（进阶配置）：**
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ml-serving-cluster
  region: us-east-1
  version: "1.28"

nodeGroups:
  - name: cpu-nodes
    instanceType: m5.xlarge
    desiredCapacity: 2
    minSize: 1
    maxSize: 5
    volumeSize: 50
    labels:
      workload: cpu
    tags:
      Environment: production
      Team: ml-infrastructure

  - name: gpu-nodes
    instanceType: g4dn.xlarge
    desiredCapacity: 0
    minSize: 0
    maxSize: 3
    volumeSize: 100
    labels:
      workload: gpu
    taints:
      - key: nvidia.com/gpu
        value: "true"
        effect: NoSchedule

# Create with config
eksctl create cluster -f cluster-config.yaml
```

### 在 EKS 上部署机器学习模型

**示例：部署模型服务 API：**
```yaml
# ml-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-model
  template:
    metadata:
      labels:
        app: ml-model
    spec:
      containers:
      - name: model-server
        image: <your-ecr-repo>/ml-model:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          value: "s3://my-ml-datasets-12345/models/model-v1.pth"
        - name: AWS_REGION
          value: "us-east-1"
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ml-model-service
spec:
  type: LoadBalancer
  selector:
    app: ml-model
  ports:
  - port: 80
    targetPort: 8000
```

**部署：**
```bash
# Apply deployment
kubectl apply -f ml-deployment.yaml

# Check deployment
kubectl get deployments
kubectl get pods
kubectl get services

# Get service URL
kubectl get service ml-model-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Test endpoint
curl http://<load-balancer-url>/health
```

## 第五部分：用于托管机器学习的 SageMaker

### SageMaker 组件

```
SageMaker Services:

1. Training Jobs: Managed training infrastructure
2. Endpoints: Managed model hosting
3. Feature Store: Centralized feature management
4. Model Registry: Version control for models
5. Pipelines: ML workflow orchestration
6. Studio: IDE for ML development
```

### 使用 SageMaker 训练

**Python SDK 示例：**
```python
import sagemaker
from sagemaker.pytorch import PyTorch

# Get SageMaker session
sagemaker_session = sagemaker.Session()
role = sagemaker.get_execution_role()  # IAM role for SageMaker

# Define training job
pytorch_estimator = PyTorch(
    entry_point='train.py',
    source_dir='scripts',
    role=role,
    framework_version='2.0.0',
    py_version='py310',
    instance_count=1,
    instance_type='ml.p3.2xlarge',  # 1x V100 GPU
    hyperparameters={
        'epochs': 10,
        'batch-size': 32,
        'learning-rate': 0.001
    },
    output_path='s3://my-ml-datasets-12345/models/',
    base_job_name='resnet-training'
)

# Start training
pytorch_estimator.fit({
    'training': 's3://my-ml-datasets-12345/datasets/imagenet/',
    'validation': 's3://my-ml-datasets-12345/datasets/imagenet-val/'
})

# Training job runs on managed infrastructure
# Model artifacts saved to S3 automatically
```

**train.py（SageMaker 训练脚本）：**
```python
import argparse
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import os

def train(args):
    # Training code here
    model = create_model()
    train_loader = DataLoader(...)

    for epoch in range(args.epochs):
        for batch in train_loader:
            # Training step
            pass

    # Save model
    model_path = os.path.join(args.model_dir, 'model.pth')
    torch.save(model.state_dict(), model_path)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    # SageMaker-specific arguments
    parser.add_argument('--model-dir', type=str, default=os.environ['SM_MODEL_DIR'])
    parser.add_argument('--train', type=str, default=os.environ['SM_CHANNEL_TRAINING'])
    parser.add_argument('--validation', type=str, default=os.environ['SM_CHANNEL_VALIDATION'])

    # Hyperparameters
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--learning-rate', type=float, default=0.001)

    args = parser.parse_args()
    train(args)
```

### 使用 SageMaker 部署模型

**部署训练完成的模型：**
```python
# Deploy model to endpoint
predictor = pytorch_estimator.deploy(
    initial_instance_count=2,
    instance_type='ml.m5.xlarge',
    endpoint_name='resnet-endpoint'
)

# Make predictions
import numpy as np

input_data = np.random.rand(1, 3, 224, 224).astype('float32')
prediction = predictor.predict(input_data)

print(f"Prediction: {prediction}")

# Update endpoint (rolling deployment)
predictor.update_endpoint(
    initial_instance_count=3,
    instance_type='ml.m5.2xlarge'
)

# Delete endpoint (important for cost savings!)
predictor.delete_endpoint()
```

### SageMaker 定价

```
Training Instances:
- ml.p3.2xlarge (1x V100):  $3.825/hour
- ml.p3.8xlarge (4x V100):  $14.688/hour
- ml.g4dn.xlarge (1x T4):   $0.736/hour

Hosting Instances:
- ml.t3.medium:             $0.065/hour
- ml.m5.xlarge:             $0.269/hour
- ml.c5.2xlarge:            $0.476/hour

Cost Example (ResNet-50 Training):
- Training: ml.p3.2xlarge × 20 hours = $76.50
- Hosting: ml.m5.xlarge × 720 hours/month = $193.68/month
```

## 第六部分：使用 VPC 构建网络

### VPC 基础

```
VPC Architecture:

AWS Cloud
├─ Region (us-east-1)
│   ├─ VPC (10.0.0.0/16)
│   │   ├─ Public Subnet (10.0.1.0/24) [AZ-1]
│   │   │   ├─ Internet Gateway
│   │   │   ├─ NAT Gateway
│   │   │   └─ Load Balancer
│   │   ├─ Private Subnet (10.0.2.0/24) [AZ-1]
│   │   │   ├─ EC2 Instances
│   │   │   └─ EKS Nodes
│   │   ├─ Public Subnet (10.0.3.0/24) [AZ-2]
│   │   └─ Private Subnet (10.0.4.0/24) [AZ-2]
│   └─ Security Groups & NACLs
```

**为机器学习创建 VPC：**
```bash
# Create VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ml-vpc}]'

# Create subnets (public and private in each AZ)
aws ec2 create-subnet \
    --vpc-id vpc-xxxxx \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ml-public-1a}]'

# Create internet gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=ml-igw}]'

# Attach to VPC
aws ec2 attach-internet-gateway \
    --vpc-id vpc-xxxxx \
    --internet-gateway-id igw-xxxxx
```

## 核心要点

1. **IAM 安全：** 使用 MFA，遵循最小权限原则，不使用 Root 进行日常操作。
2. **EC2 计算：** 使用 GPU 实例训练，使用 Spot 节省成本。
3. **S3 存储：** 版本管理、生命周期策略、适当的存储类别。
4. **EKS 编排：** 使用托管 Kubernetes 实现可扩展的模型服务。
5. **SageMaker：** 托管训练与部署。
6. **VPC 网络：** 隔离资源，使用私有子网。
7. **成本优化：** Spot 实例、合理调整规格、自动关闭资源。

## 实践练习

**在 AWS 上部署完整机器学习系统：**

1. 创建 S3 存储桶，用于存储数据集及模型。
2. 使用 Deep Learning AMI 启动 EC2 GPU 实例。
3. 训练简单模型并保存至 S3。
4. 将模型部署至 EKS 集群。
5. 通过 Application Load Balancer 暴露服务。
6. 设置 CloudWatch 监控。
7. 计算月度成本。

## 自我检查问题

1. 使用 Spot 实例进行训练有哪些收益？
2. 何时使用 SageMaker，何时使用 EC2 进行训练？
3. 应使用哪种 S3 存储类别归档实验数据？
4. 如何确保 EKS 上模型服务的高可用性？
5. SageMaker 需要哪些 IAM 权限？
6. 如何优化大型数据集的 S3 存储成本？
7. 公共子网与私有子网有什么区别？

## 补充资源

- [AWS 机器学习服务概览](https://aws.amazon.com/machine-learning/)
- [SageMaker 文档](https://docs.aws.amazon.com/sagemaker/)
- [EKS 最佳实践](https://aws.github.io/aws-eks-best-practices/)
- [AWS CLI 参考](https://docs.aws.amazon.com/cli/)
- [boto3 文档](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

---

**下一课：** [03-gcp-ml-infrastructure.md](./03-gcp-ml-infrastructure.md)——面向机器学习的 Google Cloud Platform。

> 译注：本课大量命令、配置及架构示意位于代码块中，均保留原文。具体实例、AMI、Kubernetes 版本、SDK 接口及价格需要按实际区域和当前文档核对。Spot 中断通知并非所有情形都保证两分钟。执行练习前设置费用告警并使用隔离沙箱；结束后清理创建的 Endpoint、EKS 集群、节点、负载均衡器、NAT Gateway、磁盘及其他持续计费资源。S3 版本管理可能保留已删除对象的旧版本，删除与生命周期策略需谨慎配置。
