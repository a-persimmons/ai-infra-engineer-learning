# 第 05 课：面向机器学习基础设施的云计算

**时长：** 5 小时
**目标：** 理解云计算基础，以及如何利用云平台构建机器学习基础设施。

## 导论

作为机器学习基础设施工程师，你可能会花费大量时间与云平台打交道。理解云计算基础对于以下工作十分重要：

- 大规模部署机器学习模型。
- 高效管理计算资源。
- 存储和处理大型数据集。
- 构建具有成本效益的基础设施。
- 确保高可用性与可靠性。

本课介绍云计算基础及三大云服务商：AWS、GCP 与 Azure。

## 什么是云计算？

云计算是通过互联网（「云」）交付计算服务，包括服务器、存储、数据库、网络、软件及分析，从而实现更快的创新、灵活的资源供应以及规模经济。

### 关键特征

1. **按需自助服务：** 无需人工干预即可自动供应资源。
2. **广泛的网络访问：** 通过标准机制从不同地点访问。
3. **资源池化：** 多租户模式，动态分配资源。
4. **快速弹性：** 根据需求快速扩容或缩容。
5. **可计量服务：** 根据使用量计费。

### 云服务模型

```
┌─────────────────────────────────────────────────────────┐
│                     You Manage Everything               │
│  On-Premises                                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ Applications │ Data │ Runtime │ Middleware │   │    │
│  │ OS │ Virtualization │ Servers │ Storage │     │    │
│  │ Networking                                      │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  IaaS (Infrastructure as a Service)                     │
│  Examples: AWS EC2, GCP Compute Engine, Azure VMs       │
│  ┌────────────────────────────────────────────────┐    │
│  │ Applications │ Data │ Runtime │ Middleware │   │ ←You│
│  │ OS                                              │    │
│  ├────────────────────────────────────────────────┤    │
│  │ Virtualization │ Servers │ Storage │ Networking│←Provider│
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PaaS (Platform as a Service)                           │
│  Examples: AWS Elastic Beanstalk, GCP App Engine        │
│  ┌────────────────────────────────────────────────┐    │
│  │ Applications │ Data                            │ ←You│
│  ├────────────────────────────────────────────────┤    │
│  │ Runtime │ Middleware │ OS │ Virtualization │   │←Provider│
│  │ Servers │ Storage │ Networking                 │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SaaS (Software as a Service)                           │
│  Examples: Gmail, Salesforce, Dropbox                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ Everything managed by provider                  │    │
│  │ You just use the application                    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 对机器学习基础设施而言

**最常见：** IaaS（对计算资源拥有更完整的控制）。
**持续增长：** 托管机器学习服务（SageMaker、Vertex AI、Azure ML）。

## 三大云服务商

### 市场份额（2025 年，原文估计）

| 服务商 | 市场份额 | 优势 | 机器学习服务 |
|---|---|---|---|
| **AWS** | 约 32% | 成熟、服务范围广 | SageMaker、Bedrock |
| **Azure** | 约 23% | 企业集成 | Azure ML、OpenAI |
| **GCP** | 约 11% | 机器学习/AI 创新 | Vertex AI、TPU |
| **其他** | 约 34% | 阿里巴巴、Oracle、IBM | 多种服务 |

### AWS（Amazon Web Services）

**成立：** 2006 年。
**总部：** 美国华盛顿州西雅图。

**优势（原文评价）：**
- 平台成熟，服务范围广泛。
- 庞大的生态系统与社区。
- 丰富的文档和学习资源。
- 大量第三方集成。
- 全球基础设施（30 多个区域）。

**机器学习相关服务：**
- **EC2：** 虚拟机（包含 GPU 实例）。
- **S3：** 存储数据集和模型的对象存储。
- **EKS：** 托管 Kubernetes。
- **SageMaker：** 端到端机器学习平台。
- **Lambda：** 无服务器计算。
- **ECR：** 容器镜像仓库。
- **CloudWatch：** 监控与日志。

**定价模式：**
- 按量付费（按秒/小时计费）。
- 预留实例（原文举例最高 75% 折扣）。
- Spot 实例（原文举例最高 90% 折扣）。
- 面向承诺用量的 Savings Plans。

### GCP（Google Cloud Platform）

**成立：** 2008 年。
**总部：** 美国加利福尼亚州山景城。

**优势（原文评价）：**
- 机器学习/AI 能力突出，基于 Google 的机器学习基础设施。
- 专用机器学习硬件（TPU）。
- 强大的网络与数据分析能力。
- 用于大规模数据处理的 BigQuery。
- 强大的 Kubernetes 支持（Google 创建了 Kubernetes）。

**机器学习相关服务：**
- **Compute Engine：** 虚拟机。
- **GCS（Cloud Storage）：** 对象存储。
- **GKE：** 托管 Kubernetes（原文高度评价）。
- **Vertex AI：** 统一机器学习平台。
- **Cloud Functions：** 无服务器计算。
- **Cloud Run：** 容器化应用。
- **Artifact Registry：** 容器镜像与软件包仓库。
- **Cloud Monitoring：** 可观测性。

**定价模式：**
- 按秒计费（较细粒度）。
- 承诺用量折扣。
- 持续使用折扣（适用时自动生效）。
- 可抢占虚拟机（类似 AWS Spot）。

### Azure（Microsoft Azure）

**成立：** 2010 年。
**总部：** 美国华盛顿州雷德蒙德。

**优势（原文评价）：**
- 企业集成能力突出（Active Directory、Office 365）。
- 强大的混合云支持。
- 与 OpenAI 合作。
- 良好的 Windows 支持。
- 在受监管行业中具有全球业务覆盖。

**机器学习相关服务：**
- **Virtual Machines：** 计算实例。
- **Blob Storage：** 对象存储。
- **AKS：** 托管 Kubernetes。
- **Azure ML：** 机器学习平台。
- **Azure Functions：** 无服务器服务。
- **Container Registry：** 容器镜像存储。
- **Azure Monitor：** 监控与诊断。
- **Azure OpenAI：** 以服务形式提供 GPT 模型。

**定价模式：**
- 按量付费。
- 预留虚拟机实例。
- Spot VM。
- Azure Hybrid Benefit（使用已有许可证）。

## 面向机器学习的核心云服务

### 1. 计算服务

**用途：** 运行代码、训练模型、提供预测服务。

**机器学习虚拟机类型：**

```
┌─────────────────┬──────────────┬─────────────┬───────────────┐
│ Instance Type   │ CPU          │ Memory      │ Use Case      │
├─────────────────┼──────────────┼─────────────┼───────────────┤
│ General Purpose │ 2-64 vCPUs   │ 8-256 GB    │ API servers   │
│ Compute Opt.    │ 2-120 vCPUs  │ 4-240 GB    │ Batch jobs    │
│ Memory Opt.     │ 2-128 vCPUs  │ 16-4096 GB  │ Large models  │
│ GPU             │ 8-96 vCPUs   │ 61-1440 GB  │ Training      │
│ TPU (GCP only)  │ Custom       │ Custom      │ Large training│
└─────────────────┴──────────────┴─────────────┴───────────────┘
```

**GPU 实例示例：**

AWS：
- p3.2xlarge：1 块 V100 GPU、8 vCPU、61 GB RAM（约 3 美元/小时）。
- p4d.24xlarge：8 块 A100 GPU、96 vCPU、1152 GB RAM（约 32 美元/小时）。
- g5.xlarge：1 块 A10G GPU、4 vCPU、16 GB RAM（约 1 美元/小时）。

GCP：
- n1-standard-8 + 1 块 V100：8 vCPU、30 GB RAM（约 2.50 美元/小时）。
- a2-highgpu-1g：1 块 A100、12 vCPU、85 GB RAM（约 3.50 美元/小时）。

Azure：
- NC6s_v3：1 块 V100、6 vCPU、112 GB RAM（约 3 美元/小时）。
- ND40rs_v2：8 块 V100、40 vCPU、672 GB RAM（约 22 美元/小时）。

### 2. 存储服务

**用途：** 存储数据集、模型、日志与产物。

**存储类型：**

```
Object Storage (S3/GCS/Blob):
- Unlimited capacity
- Pay per GB stored + data transfer
- Best for: Datasets, models, logs
- Example: $0.023/GB/month

Block Storage (EBS/Persistent Disk/Managed Disk):
- Attached to VMs
- Fast, low-latency
- Best for: Databases, application data
- Example: $0.10/GB/month

File Storage (EFS/Filestore/Azure Files):
- Shared file systems
- NFS protocol
- Best for: Shared training data
- Example: $0.30/GB/month
```

**用于机器学习的存储类别：**

| 存储类别 | 使用场景 | 成本 | 检索时间 |
|---|---|---|---|
| 热/标准存储 | 活跃数据集 | 较高 | 即时 |
| 冷/近线存储 | 低频访问 | 较低 | 即时 |
| 归档存储 | 长期备份 | 很低 | 数小时（视类别而定） |

### 3. 网络服务

**用途：** 连接资源、暴露服务、保护流量安全。

**关键概念：**

- **VPC（Virtual Private Cloud，虚拟私有云）：** 隔离的网络。
- **子网：** VPC 内的网络分段。
- **安全组：** 防火墙规则。
- **负载均衡器：** 分发流量。
- **CDN：** 内容分发网络。

**网络费用（原文示例）：**
- 同区域内：免费或较便宜。
- 跨区域：0.01–0.02 美元/GB。
- 传输至互联网：0.05–0.09 美元/GB。
- **重要：** 数据传输往往是隐藏成本！

> 译注：同区域跨可用区流量也可能收费，归档存储检索时间取决于具体服务。实例规格、价格、折扣与市场份额均保留原文示例，未核验当前报价；GCP 承诺用量折扣通常需要购买承诺，并非默认自动获得。

## 设置第一个云环境

### AWS 配置

**步骤 1：创建账号**
```bash
# Sign up at: https://aws.amazon.com/
# Free tier: 12 months of free services
# - 750 hours/month t2.micro (1 vCPU, 1GB RAM)
# - 5GB S3 storage
# - Various other services
```

**步骤 2：安装 AWS CLI**
```bash
# Install
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version

# Configure (requires Access Key ID and Secret Access Key)
aws configure
# AWS Access Key ID: [your key]
# AWS Secret Access Key: [your secret]
# Default region name: us-east-1
# Default output format: json
```

**步骤 3：创建第一个 EC2 实例**
```bash
# List available images
aws ec2 describe-images --owners amazon --filters "Name=name,Values=amzn2-ami-hvm-*" --query 'Images[0].[ImageId,Name]'

# Create security group
aws ec2 create-security-group \
  --group-name ml-serving \
  --description "ML model serving security group"

# Allow SSH and HTTP
aws ec2 authorize-security-group-ingress \
  --group-name ml-serving \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name ml-serving \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name my-key-pair \
  --security-groups ml-serving \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ml-server}]'

# Get instance IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=ml-server" \
  --query 'Reservations[0].Instances[0].PublicIpAddress'

# SSH into instance
ssh -i my-key-pair.pem ec2-user@<instance-ip>
```

### GCP 配置

**步骤 1：创建账号**
```bash
# Sign up at: https://cloud.google.com/
# Free tier: $300 credit for 90 days + always-free tier
# - 1x e2-micro VM (0.25-1 vCPU, 1GB RAM)
# - 30GB HDD storage
# - 5GB Cloud Storage
```

**步骤 2：安装 gcloud CLI**
```bash
# Install
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize
gcloud init
# Follow prompts to authenticate and select project

# Verify
gcloud --version
```

**步骤 3：创建第一个 VM**
```bash
# List available images
gcloud compute images list

# Create instance
gcloud compute instances create ml-server \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

# Allow firewall
gcloud compute firewall-rules create allow-ml-serving \
  --allow=tcp:8000 \
  --target-tags=http-server

# SSH into instance
gcloud compute ssh ml-server --zone=us-central1-a

# Stop instance (to save costs)
gcloud compute instances stop ml-server --zone=us-central1-a

# Delete instance
gcloud compute instances delete ml-server --zone=us-central1-a
```

### Azure 配置

**步骤 1：创建账号**
```bash
# Sign up at: https://azure.microsoft.com/
# Free tier: $200 credit for 30 days + always-free services
# - 750 hours/month B1S VM (1 vCPU, 1GB RAM)
# - 5GB Blob storage
```

**步骤 2：安装 Azure CLI**
```bash
# Install
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Verify
az --version
```

**步骤 3：创建第一个 VM**
```bash
# Create resource group
az group create --name ml-infra-rg --location eastus

# Create VM
az vm create \
  --resource-group ml-infra-rg \
  --name ml-server \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys

# Open port
az vm open-port \
  --resource-group ml-infra-rg \
  --name ml-server \
  --port 8000

# Get IP address
az vm list-ip-addresses \
  --resource-group ml-infra-rg \
  --name ml-server \
  --output table

# SSH into VM
ssh azureuser@<vm-ip>

# Stop VM
az vm deallocate --resource-group ml-infra-rg --name ml-server

# Delete resources
az group delete --name ml-infra-rg --yes
```

## 云成本管理

### 理解云成本

**典型的机器学习基础设施成本：**

```
Monthly Cost Breakdown (Example):

Compute (VMs/GPUs):        $5,000  (60%)
Storage (S3/GCS):          $1,000  (12%)
Data Transfer:             $800    (10%)
Load Balancers:            $500    (6%)
Kubernetes (managed):      $500    (6%)
Monitoring/Logging:        $300    (4%)
Other services:            $200    (2%)
─────────────────────────────────────
Total:                     $8,300/month
```

### 成本优化策略

**1. 合理调整资源规格**
```bash
# Don't over-provision!
# Start small, monitor, scale up if needed

# Example: Model serving
# ❌ Bad: 8 vCPUs, 32GB RAM ($200/month)
# ✅ Good: 2 vCPUs, 4GB RAM ($50/month)
# Monitor CPU/memory usage, adjust if needed
```

**2. 使用 Spot/可抢占实例**
```bash
# Up to 90% cheaper than on-demand
# Suitable for:
# - Batch inference
# - Training (with checkpointing)
# - Development environments

# AWS Spot
aws ec2 run-instances \
  --instance-market-options 'MarketType=spot' \
  --instance-type p3.2xlarge

# GCP Preemptible
gcloud compute instances create ml-trainer \
  --preemptible \
  --machine-type=n1-standard-8

# Risk: Can be terminated with 30-second notice
```

**3. 自动关闭闲置资源**
```bash
# Schedule shutdown of dev environments
# AWS Lambda example
# Stop instances with tag Environment=dev at 6 PM
# Start at 8 AM on weekdays

# Simple cron approach
# Add to instance's crontab:
0 18 * * * sudo shutdown -h now  # Shutdown at 6 PM
```

**4. 针对稳定负载使用预留实例**
```bash
# 1-year commitment: ~30-40% discount
# 3-year commitment: ~50-60% discount

# Suitable for:
# - Production serving (always running)
# - Persistent services

# Not suitable for:
# - Training (sporadic)
# - Development (part-time)
```

**5. 监控成本并设置告警**
```bash
# AWS Cost Explorer
# GCP Cost Management
# Azure Cost Management

# Set budget alerts:
# - Daily budget: $100
# - Monthly budget: $3,000
# - Alert at 50%, 80%, 100%
```

### 成本监控工具

**云平台原生工具：**
- AWS Cost Explorer。
- GCP Cost Management。
- Azure Cost Management。

**第三方工具：**
- CloudHealth。
- Cloudability。
- Kubecost（用于 Kubernetes）。

## 基础云部署示例

**部署一个简单的 Web 服务器：**

```bash
# 1. Launch instance (using GCP as example)
gcloud compute instances create web-server \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server

# 2. SSH into instance
gcloud compute ssh web-server --zone=us-central1-a

# 3. Install dependencies
sudo apt update
sudo apt install -y python3-pip
pip3 install fastapi uvicorn

# 4. Create simple app
cat > app.py << 'EOF'
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from the cloud!"}

@app.get("/health")
def health():
    return {"status": "healthy"}
EOF

# 5. Run server
uvicorn app:app --host 0.0.0.0 --port 8000 &

# 6. Test locally
curl http://localhost:8000

# 7. Exit SSH and test externally
# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe web-server \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Create firewall rule
gcloud compute firewall-rules create allow-http-8000 \
  --allow=tcp:8000 \
  --target-tags=http-server

# Test from your machine
curl http://$EXTERNAL_IP:8000
```

## 机器学习的云平台最佳实践

### 1. 安全

```bash
# ✅ Use IAM roles (not access keys)
# ✅ Enable MFA on root/admin accounts
# ✅ Use security groups to limit access
# ✅ Encrypt data at rest and in transit
# ✅ Regularly rotate credentials
# ✅ Use private subnets for databases
# ✅ Enable logging and monitoring
# ❌ Never commit credentials to Git
# ❌ Don't use root account for daily tasks
# ❌ Avoid public S3 buckets with sensitive data
```

### 2. 可靠性

```bash
# ✅ Use multiple availability zones
# ✅ Implement health checks
# ✅ Set up auto-scaling
# ✅ Use managed services when possible
# ✅ Regular backups
# ✅ Disaster recovery plan
```

### 3. 性能

```bash
# ✅ Choose region close to users
# ✅ Use CDN for static assets
# ✅ Implement caching
# ✅ Monitor latency and throughput
# ✅ Use appropriate instance types
```

### 4. 成本优化

```bash
# ✅ Right-size instances
# ✅ Use spot/preemptible for non-critical
# ✅ Delete unused resources
# ✅ Use lifecycle policies for storage
# ✅ Monitor and set budget alerts
# ✅ Review costs monthly
```

## 面向机器学习的云服务商比较

| 特性 | AWS | GCP | Azure |
|---|---|---|---|
| **机器学习平台** | SageMaker | Vertex AI | Azure ML |
| **原文推荐场景** | 通用性 | 机器学习/AI 创新 | 企业 |
| **GPU 选项** | 优秀 | 优秀，并有 TPU | 良好 |
| **Kubernetes** | EKS | GKE（原文推荐） | AKS |
| **定价** | 复杂 | 较简单 | 中等 |
| **免费层（原文）** | 12 个月 | 300 美元额度 | 200 美元额度 |
| **文档** | 优秀 | 良好 | 良好 |
| **市场排名（原文）** | 第 1 | 第 3 | 第 2 |
| **学习曲线** | 中等 | 容易 | 中等 |

### 学习建议

原文建议**从 GCP 开始**，因为：
1. 定价和界面相对简单。
2. Kubernetes 支持良好（对机器学习非常重要）。
3. 原文所述的 300 美元免费额度。
4. 注重机器学习/AI。
5. 更易理解。

**随后学习 AWS**，因为：
1. 许多招聘岗位要求相关技能。
2. 生态系统庞大。
3. 服务范围全面。

**在以下情况下学习 Azure：**
1. 在企业环境工作。
2. 需要 Microsoft 产品集成。
3. 需要 Azure ML 的特定功能。

> 译注：免费层规则、资格、额度及适用服务可能已经变更，不能将原文的「12 个月免费」或额度视为当前承诺。创建实例前，请查看自己的账号资格、区域价格和预算；免费额度不代表所有资源都免费。

## 实践练习

**任务：** 将简单的 FastAPI 应用部署到云 VM。

**步骤：**
1. 选择云服务商（原文推荐初学者使用 GCP）。
2. 创建免费账号（确认适用资格）。
3. 启动小型 VM 实例（GCP 的 e2-micro 或 AWS 的 t2.micro）。
4. 通过 SSH 登录实例。
5. 安装 Python 与 FastAPI。
6. 创建简单的健康检查端点。
7. 运行服务器。
8. 配置防火墙以允许所需的外部访问。
9. 从本地电脑测试。
10. **重要：** 完成后关闭或删除实例，并检查其他计费资源！

**成功标准：**
- 能从本地浏览器访问健康检查端点。
- 理解 VM 基本生命周期（创建、启动、停止、删除）。
- 能估算持续运行的月度成本。

## 核心要点

1. **云计算**提供按需、可扩展的基础设施。
2. **三种模型：** IaaS（控制较多）、PaaS（管理较少）、SaaS（直接使用）。
3. **三大平台：** AWS（成熟）、GCP（机器学习优势）、Azure（企业集成优势）。
4. **核心服务：** 计算（VM）、存储（S3/GCS）、网络（VPC、负载均衡）。
5. **成本管理**至关重要：调整规格、使用 Spot 实例、监控用量。
6. **免费层**有助于学习：原文列举 AWS 12 个月、GCP 300 美元、Azure 200 美元。
7. 原文建议**先学习 GCP**，再为职业发展学习 AWS。

## 自我检查问题

1. 三种云服务模型及其区别是什么？
2. AWS、GCP 与 Azure 的主要区别是什么？
3. 什么是 GPU 实例？何时应该使用？
4. 对象存储（S3）与块存储（EBS）有什么区别？
5. 批处理工作负载如何实现最高 90% 的成本节约（原文目标）？
6. 什么是 Spot/可抢占实例？何时使用？
7. 云机器学习基础设施的主要成本构成是什么？

## 补充资源

- [AWS 免费层](https://aws.amazon.com/free/)
- [GCP 免费层](https://cloud.google.com/free)
- [Azure 免费账号](https://azure.microsoft.com/free/)
- [AWS 机器学习学习路径](https://aws.amazon.com/training/learn-about/machine-learning/)
- [GCP 机器学习指南](https://cloud.google.com/learn/training/machinelearning-ai)
- [云成本优化指南](https://cloud.google.com/cost-management)
- [云上 Kubernetes 方案比较](https://kubernetes.io/docs/setup/production-environment/turnkey-solutions/)

---

**下一课：** [06-model-serving-basics.md](./06-model-serving-basics.md)——理解模型服务基础。

> 译注：云平台优势与推荐顺序属于原作者观点，实际选择应结合岗位需求、地区可用性、组织合规、成本和现有技术栈。执行原文创建资源的命令前需核对最新官方接口与费用，测试结束应清理本次创建的全部资源，包括可能仍计费的磁盘、地址、快照与网络组件。不要将教学服务或管理端点直接无保护地暴露于互联网。
