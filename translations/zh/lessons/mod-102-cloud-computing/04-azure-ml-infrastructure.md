# 第 04 课：面向机器学习基础设施的 Azure

**时长：** 6 小时
**难度：** 中级
**前置条件：** 第 01–03 课（云架构、AWS、GCP）

## 学习目标

完成本课后，你将能够：

1. **设置并保护** Azure 账号，正确配置身份管理。
2. **部署与管理**用于机器学习工作负载的虚拟机。
3. **使用 Azure Blob Storage** 存储数据集和模型。
4. 在 Azure Kubernetes Service（AKS）上**部署模型**。
5. **利用 Azure Machine Learning** 实现托管机器学习工作流。
6. 将 **Azure OpenAI** 服务集成到应用中。
7. **配置网络**，构建安全的机器学习基础设施。
8. 利用 Azure 定价模式**优化成本**。

---

## 目录

1. [面向机器学习的 Azure 简介](#面向机器学习的-azure-简介)
2. [Azure 账号配置与身份管理](#azure-账号配置与身份管理)
3. [面向机器学习的虚拟机](#面向机器学习的虚拟机)
4. [Azure Blob Storage](#azure-blob-storage)
5. [Azure Kubernetes Service（AKS）](#azure-kubernetes-service-aks)
6. [Azure Machine Learning](#azure-machine-learning)
7. [Azure OpenAI Service](#azure-openai-service)
8. [Azure 网络](#azure-网络)
9. [成本优化](#成本优化)
10. [动手练习](#动手练习)

---

## 面向机器学习的 Azure 简介

Microsoft Azure 提供一整套机器学习基础设施服务：

- **企业导向：** 与 Microsoft 生态深度集成。
- **Azure OpenAI：** 提供 GPT-4、GPT-3.5、DALL-E 等模型服务（原文所处时期）。
- **混合云：** 通过 Azure Arc 集成本地环境。
- **Azure ML：** 端到端托管机器学习平台。
- **合规能力：** 支持 GDPR、HIPAA、SOC 等相关合规要求。
- **全球覆盖：** 原文列举全球 60 多个区域。

### Azure 机器学习生态

```
┌──────────────────────────────────────────────────────────────────┐
│                      Azure ML Ecosystem                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Data Services        Compute              ML Services          │
│  ─────────────        ───────              ───────────          │
│  Blob Storage    →    Virtual Machines →   Azure ML Studio     │
│  Data Lake       →    AKS              →   Cognitive Services  │
│  SQL Database    →    Azure Batch      →   Azure OpenAI       │
│                                                                  │
│  Infrastructure       Networking           Monitoring           │
│  ──────────────       ──────────           ──────────           │
│  Resource Groups      VNet                 Azure Monitor       │
│  Subscriptions        Load Balancer        Application Insights│
│  Management Groups    CDN                  Log Analytics       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 何时为机器学习选择 Azure

**在以下情况下选择 Azure：**
- 所在组织以 Microsoft 产品为核心。
- 需要 Azure OpenAI（GPT-4、ChatGPT 等相关模型）。
- 需要强大的混合云能力。
- 需要企业合规与治理。
- 希望与 Office 365、Teams、Power BI 深度集成。

**在以下情况下考虑替代方案：**
- 已经大量投入 AWS/GCP。
- 需要更专业的机器学习硬件（例如 TPU）。
- 偏好以开源为先的生态。
- 成本是首要考虑因素（Azure 在部分场景下可能更贵）。

---

## Azure 账号配置与身份管理

### 创建 Azure 账号

1. **注册 Azure：**
   - 访问：https://azure.microsoft.com/free/
   - 原文所述权益为有效期 30 天的 **200 美元额度**。
   - 12 个月的部分常用免费服务。
   - 55 项以上长期免费服务。

2. **免费层权益：**
   ```
   Compute:
   - 750 hours B1S VM (Linux/Windows) per month
   - 1M Azure Functions requests
   - 20 compute hours Azure Container Instances

   Storage:
   - 5 GB Blob Storage (Hot tier)
   - 5 GB File Storage
   - 2 million reads, 2 million writes

   Databases:
   - 250 GB SQL Database
   - 5 GB Cosmos DB

   Machine Learning:
   - Azure ML compute hours (varied)
   - 5,000 transactions Cognitive Services
   ```

3. **安装 Azure CLI：**
   ```bash
   # macOS
   brew install azure-cli

   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

   # Windows
   # Download from: https://aka.ms/installazurecliwindows

   # Verify installation
   az --version

   # Login
   az login

   # Set subscription (if you have multiple)
   az account list --output table
   az account set --subscription "My Subscription"
   ```

### Azure Active Directory（Azure AD）

Azure 使用 **Azure Active Directory** 实现身份与访问管理（现称 Microsoft Entra ID）。

#### 关键概念

```
┌────────────────────────────────────────────────────────┐
│              Azure AD Hierarchy                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tenant (Organization)                                 │
│    ├── Subscription 1                                  │
│    │     ├── Resource Group A                          │
│    │     │     ├── Virtual Machine                     │
│    │     │     └── Storage Account                     │
│    │     └── Resource Group B                          │
│    │           └── AKS Cluster                         │
│    └── Subscription 2                                  │
│          └── Resource Group C                          │
│                └── Azure ML Workspace                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 创建资源组

资源组（Resource Group）是 Azure 资源的逻辑容器：

```bash
# Create resource group
az group create \
  --name ml-infrastructure-rg \
  --location eastus

# List resource groups
az group list --output table

# Delete resource group (and all resources)
az group delete --name ml-infrastructure-rg --yes
```

#### 基于角色的访问控制（RBAC）

```bash
# List available roles
az role definition list --output table

# Assign role to user
az role assignment create \
  --assignee user@example.com \
  --role "Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/ml-infrastructure-rg

# Common ML roles:
# - Contributor: Full access except granting access to others
# - Reader: View all resources but can't make changes
# - Owner: Full access including managing access
# - AcrPull: Pull images from Azure Container Registry
# - Storage Blob Data Contributor: Read, write, delete blob containers and data
```

#### 创建服务主体（Service Principal）

服务主体用于应用身份验证：

```bash
# Create service principal
az ad sp create-for-rbac \
  --name ml-training-sp \
  --role Contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/ml-infrastructure-rg

# Output:
# {
#   "appId": "xxxx-xxxx-xxxx-xxxx",
#   "displayName": "ml-training-sp",
#   "password": "xxxx-xxxx-xxxx-xxxx",
#   "tenant": "xxxx-xxxx-xxxx-xxxx"
# }

# Use in applications
export AZURE_CLIENT_ID="<appId>"
export AZURE_CLIENT_SECRET="<password>"
export AZURE_TENANT_ID="<tenant>"
export AZURE_SUBSCRIPTION_ID="<subscription-id>"
```

> 译注：免费额度、有效期和服务数量属于原文所述权益，实际以账号资格与当前条款为准。生产环境优先采用托管身份或工作负载身份联合，避免在应用中长期存储客户端密钥。

---

## 面向机器学习的虚拟机

Azure Virtual Machines 为机器学习工作负载提供可扩展计算资源。

### 面向机器学习的 VM 系列

#### 通用型（D 系列）

适用于：开发、小模型、CPU 推理。

```
┌─────────────────┬─────────┬────────────┬──────────────┐
│ VM Size         │ vCPUs   │ Memory     │ Cost/hour    │
├─────────────────┼─────────┼────────────┼──────────────┤
│ Standard_D4s_v3 │ 4       │ 16 GB      │ $0.192       │
│ Standard_D8s_v3 │ 8       │ 32 GB      │ $0.384       │
│ Standard_D16s_v3│ 16      │ 64 GB      │ $0.768       │
└─────────────────┴─────────┴────────────┴──────────────┘
```

#### GPU VM（NC/ND/NV 系列）

适用于：训练、GPU 推理。

```
┌─────────────────┬──────────────────┬────────────┬─────────┬──────────────┐
│ VM Size         │ GPU              │ GPU Memory │ vCPUs   │ Cost/hour    │
├─────────────────┼──────────────────┼────────────┼─────────┼──────────────┤
│ Standard_NC4    │ 1x Tesla K80     │ 12 GB      │ 4       │ $0.90        │
│ Standard_NC6s_v3│ 1x Tesla V100    │ 16 GB      │ 6       │ $3.06        │
│ Standard_ND6s   │ 1x Tesla P40     │ 24 GB      │ 6       │ $2.07        │
│ Standard_NC6s_v3│ 1x V100          │ 16 GB      │ 6       │ $3.06        │
│ Standard_ND40rs │ 8x V100          │ 128 GB     │ 40      │ $24.48       │
│ Standard_NC24ads│ 1x A100          │ 80 GB      │ 24      │ $3.67        │
└─────────────────┴──────────────────┴────────────┴─────────┴──────────────┘
```

### 创建 GPU VM

```bash
# List available VM sizes with GPUs
az vm list-sizes --location eastus --output table | grep NC

# Create GPU VM with Data Science VM image
az vm create \
  --resource-group ml-infrastructure-rg \
  --name ml-training-vm \
  --image microsoft-dsvm:ubuntu-1804:1804-gen2:latest \
  --size Standard_NC6s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# SSH into VM
az vm show \
  --resource-group ml-infrastructure-rg \
  --name ml-training-vm \
  --show-details \
  --query publicIps \
  --output tsv

ssh azureuser@<public-ip>

# Verify GPU
nvidia-smi
```

### Data Science Virtual Machine（DSVM）

Azure DSVM 预装机器学习框架及开发工具：

- **框架：** PyTorch、TensorFlow、scikit-learn。
- **工具：** Jupyter、VS Code、PyCharm。
- **数据工具：** Azure CLI、AzCopy、Azure Storage Explorer。
- **开发：** Git、Docker、Kubernetes 工具。

```bash
# Create DSVM (Ubuntu)
az vm create \
  --resource-group ml-infrastructure-rg \
  --name dsvm-gpu \
  --image microsoft-dsvm:ubuntu-2004:2004-gen2:latest \
  --size Standard_NC6s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys

# Create DSVM (Windows)
az vm create \
  --resource-group ml-infrastructure-rg \
  --name dsvm-windows \
  --image microsoft-dsvm:dsvm-win-2019:server-2019:latest \
  --size Standard_NC6s_v3 \
  --admin-username azureuser \
  --admin-password <secure-password>
```

### Spot VM（低优先级 VM）

原文示例：使用 Azure Spot VM 可以节省最高 **90%** 的成本。

```bash
# Create Spot VM
az vm create \
  --resource-group ml-infrastructure-rg \
  --name ml-training-spot \
  --image microsoft-dsvm:ubuntu-1804:1804-gen2:latest \
  --size Standard_NC6s_v3 \
  --priority Spot \
  --max-price 0.5 \
  --eviction-policy Deallocate \
  --admin-username azureuser \
  --generate-ssh-keys

# Cost comparison:
# Regular NC6s_v3: $3.06/hour
# Spot NC6s_v3: ~$0.30-0.60/hour (80-90% savings)
```

### VM 启动脚本

```bash
# Create startup script
cat > startup.sh << 'EOF'
#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install Python packages
pip install torch torchvision wandb mlflow

# Download dataset
mkdir -p /data
azcopy copy \
  "https://mystorageaccount.blob.core.windows.net/datasets/*" \
  "/data/" \
  --recursive

# Clone training repo
git clone https://github.com/myorg/ml-training.git /home/azureuser/training

# Start training
cd /home/azureuser/training
python train.py --data-path /data --epochs 100
EOF

# Create VM with startup script
az vm create \
  --resource-group ml-infrastructure-rg \
  --name ml-training-auto \
  --image microsoft-dsvm:ubuntu-1804:1804-gen2:latest \
  --size Standard_NC6s_v3 \
  --custom-data startup.sh \
  --admin-username azureuser \
  --generate-ssh-keys
```

### Spot VM 的检查点机制

```python
import os
import signal
import sys
import torch
from azure.storage.blob import BlobServiceClient

# Azure Blob Storage setup
connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
container_client = blob_service_client.get_container_client("checkpoints")

def save_checkpoint_to_blob(state, filename):
    """Save checkpoint to Azure Blob Storage"""
    local_path = f"/tmp/{filename}"
    torch.save(state, local_path)

    blob_client = container_client.get_blob_client(filename)
    with open(local_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)

    print(f"Checkpoint saved to blob: {filename}")
    os.remove(local_path)

def load_checkpoint_from_blob(filename):
    """Load checkpoint from Azure Blob Storage"""
    local_path = f"/tmp/{filename}"
    blob_client = container_client.get_blob_client(filename)

    if blob_client.exists():
        with open(local_path, "wb") as f:
            blob_data = blob_client.download_blob()
            blob_data.readinto(f)

        checkpoint = torch.load(local_path)
        os.remove(local_path)
        return checkpoint

    return None

def signal_handler(signum, frame):
    """Handle eviction signal"""
    print("Spot VM eviction detected, saving checkpoint...")
    save_checkpoint_to_blob({
        'epoch': current_epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': current_loss,
    }, 'checkpoint_evicted.pth')
    sys.exit(0)

# Register signal handler for Azure Spot VM eviction
signal.signal(signal.SIGTERM, signal_handler)

# Training loop with Azure Blob checkpointing
def train_with_azure_checkpointing(model, train_loader, epochs=10):
    # Try to resume from checkpoint
    checkpoint = load_checkpoint_from_blob("latest.pth")
    start_epoch = 0

    if checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        start_epoch = checkpoint['epoch'] + 1
        print(f"Resumed from epoch {start_epoch}")

    for epoch in range(start_epoch, epochs):
        model.train()

        for batch_idx, (data, target) in enumerate(train_loader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            # Save checkpoint every 100 batches
            if batch_idx % 100 == 0:
                save_checkpoint_to_blob({
                    'epoch': epoch,
                    'batch': batch_idx,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'loss': loss.item(),
                }, "latest.pth")

        print(f"Epoch {epoch} completed")
```

---

## Azure Blob Storage

Azure Blob Storage 是用于非结构化数据的对象存储。

### 存储账号类型

```
┌──────────────────────┬────────────────┬────────────────────────┐
│ Performance Tier     │ Redundancy     │ Use Case               │
├──────────────────────┼────────────────┼────────────────────────┤
│ Standard (HDD)       │ LRS            │ Backup, archival       │
│ Standard (HDD)       │ GRS            │ Geo-redundant backup   │
│ Premium (SSD)        │ LRS            │ High-throughput ML     │
└──────────────────────┴────────────────┴────────────────────────┘

Redundancy Options:
- LRS (Locally Redundant): 3 copies in one datacenter
- ZRS (Zone Redundant): 3 copies across availability zones
- GRS (Geo-Redundant): 6 copies (3 local + 3 remote)
- GZRS (Geo-Zone Redundant): 6 copies across zones and regions
```

### 访问层级与定价

```
┌────────────────┬───────────────┬──────────────────┬────────────────┐
│ Tier           │ Storage Cost  │ Access Cost      │ Use Case       │
├────────────────┼───────────────┼──────────────────┼────────────────┤
│ Hot            │ $0.0184/GB    │ Low              │ Active data    │
│ Cool           │ $0.01/GB      │ Medium           │ <30 days       │
│ Archive        │ $0.00099/GB   │ High             │ >180 days      │
└────────────────┴───────────────┴──────────────────┴────────────────┘
```

### 创建存储账号

```bash
# Create storage account
az storage account create \
  --name mlstorageacct001 \
  --resource-group ml-infrastructure-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name mlstorageacct001 \
  --resource-group ml-infrastructure-rg \
  --output tsv

# Create container
az storage container create \
  --name datasets \
  --account-name mlstorageacct001

az storage container create \
  --name models \
  --account-name mlstorageacct001
```

### 使用 AzCopy 传输大型文件

```bash
# Install AzCopy
wget https://aka.ms/downloadazcopy-v10-linux
tar -xvf downloadazcopy-v10-linux
sudo cp azcopy_linux_amd64_*/azcopy /usr/bin/

# Get SAS token
az storage container generate-sas \
  --account-name mlstorageacct001 \
  --name datasets \
  --permissions acdlrw \
  --expiry 2024-12-31 \
  --output tsv

# Upload file
azcopy copy "model.pth" \
  "https://mlstorageacct001.blob.core.windows.net/models/model.pth?<SAS-token>"

# Upload directory (parallel)
azcopy copy "./datasets" \
  "https://mlstorageacct001.blob.core.windows.net/datasets?<SAS-token>" \
  --recursive

# Download file
azcopy copy \
  "https://mlstorageacct001.blob.core.windows.net/models/model.pth?<SAS-token>" \
  "./model.pth"

# Sync directories (like rsync)
azcopy sync "./local-dir" \
  "https://mlstorageacct001.blob.core.windows.net/datasets?<SAS-token>" \
  --recursive
```

### Python SDK（azure-storage-blob）

```python
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import os

# Initialize client
connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
blob_service_client = BlobServiceClient.from_connection_string(connection_string)

# Create container
container_name = "models"
container_client = blob_service_client.create_container(container_name)

# Upload file
def upload_file_to_blob(local_file, blob_name):
    """Upload file to Azure Blob Storage"""
    blob_client = blob_service_client.get_blob_client(
        container=container_name,
        blob=blob_name
    )

    with open(local_file, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)

    print(f"Uploaded {local_file} to {blob_name}")

# Upload model
upload_file_to_blob("model.pth", "resnet50-v1.pth")

# Download file
def download_file_from_blob(blob_name, local_file):
    """Download file from Azure Blob Storage"""
    blob_client = blob_service_client.get_blob_client(
        container=container_name,
        blob=blob_name
    )

    with open(local_file, "wb") as f:
        blob_data = blob_client.download_blob()
        blob_data.readinto(f)

    print(f"Downloaded {blob_name} to {local_file}")

# Download model
download_file_from_blob("resnet50-v1.pth", "./model.pth")

# List blobs
def list_blobs(container_name, prefix=None):
    """List blobs in container"""
    container_client = blob_service_client.get_container_client(container_name)
    blobs = container_client.list_blobs(name_starts_with=prefix)

    for blob in blobs:
        print(f"Name: {blob.name}, Size: {blob.size} bytes")

# List all models
list_blobs("models", prefix="resnet")

# Generate SAS URL (temporary access)
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta

def generate_sas_url(container_name, blob_name, expiry_hours=24):
    """Generate SAS URL for temporary access"""
    account_name = "mlstorageacct001"
    account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")

    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
    )

    url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
    return url

# Get temporary URL for model
url = generate_sas_url("models", "resnet50-v1.pth", expiry_hours=48)
print(f"Temporary URL (48 hours): {url}")

# Copy blob within Azure
def copy_blob(source_container, source_blob, dest_container, dest_blob):
    """Copy blob within Azure Storage"""
    source_blob_client = blob_service_client.get_blob_client(source_container, source_blob)
    dest_blob_client = blob_service_client.get_blob_client(dest_container, dest_blob)

    dest_blob_client.start_copy_from_url(source_blob_client.url)
    print(f"Copied {source_blob} to {dest_blob}")

# Promote model from staging to production
copy_blob("staging", "resnet50-v2.pth", "production", "resnet50-latest.pth")
```

### 生命周期管理

```bash
# Create lifecycle policy (JSON)
cat > lifecycle-policy.json << EOF
{
  "rules": [
    {
      "enabled": true,
      "name": "move-to-cool",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 30
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 90
            },
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        },
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["datasets/"]
        }
      }
    }
  ]
}
EOF

# Apply lifecycle policy
az storage account management-policy create \
  --account-name mlstorageacct001 \
  --resource-group ml-infrastructure-rg \
  --policy @lifecycle-policy.json
```

---

## Azure Kubernetes Service（AKS）

AKS 是 Azure 用于容器编排的托管 Kubernetes 服务。

### 创建 AKS 集群

```bash
# Create AKS cluster
az aks create \
  --resource-group ml-infrastructure-rg \
  --name ml-aks-cluster \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group ml-infrastructure-rg \
  --name ml-aks-cluster

# Verify
kubectl get nodes
```

### 创建具有 GPU 节点的 AKS 集群

```bash
# Create AKS cluster with GPU node pool
az aks create \
  --resource-group ml-infrastructure-rg \
  --name ml-gpu-aks-cluster \
  --node-count 1 \
  --node-vm-size Standard_D4s_v3 \
  --generate-ssh-keys

# Add GPU node pool
az aks nodepool add \
  --resource-group ml-infrastructure-rg \
  --cluster-name ml-gpu-aks-cluster \
  --name gpupool \
  --node-count 2 \
  --node-vm-size Standard_NC6s_v3 \
  --node-taints sku=gpu:NoSchedule

# Install NVIDIA device plugin
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.0/nvidia-device-plugin.yml

# Verify GPUs
kubectl get nodes -o json | jq '.items[].status.capacity'
```

### 在 AKS 上部署机器学习模型

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-deployment
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
        image: myacr.azurecr.io/ml-model:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          value: "https://mlstorageacct001.blob.core.windows.net/models/model.pth"
        - name: AZURE_STORAGE_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: azure-storage-secret
              key: connection-string
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
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
  - protocol: TCP
    port: 80
    targetPort: 8000
```

部署：

```bash
# Create secret for Azure Storage
kubectl create secret generic azure-storage-secret \
  --from-literal=connection-string="<connection-string>"

# Deploy
kubectl apply -f deployment.yaml

# Check status
kubectl get deployments
kubectl get pods
kubectl get services
```

### AKS 上的 GPU 部署

```yaml
# gpu-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-gpu-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-gpu-model
  template:
    metadata:
      labels:
        app: ml-gpu-model
    spec:
      nodeSelector:
        kubernetes.io/hostname: gpu-node  # Schedule on GPU nodes
      tolerations:
      - key: sku
        operator: Equal
        value: gpu
        effect: NoSchedule
      containers:
      - name: gpu-model-server
        image: myacr.azurecr.io/ml-model-gpu:v1.0
        resources:
          requests:
            nvidia.com/gpu: 1
          limits:
            nvidia.com/gpu: 1
```

### AKS 自动扩缩容

```bash
# Enable cluster autoscaler
az aks update \
  --resource-group ml-infrastructure-rg \
  --name ml-aks-cluster \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 10

# Horizontal Pod Autoscaler (HPA)
kubectl autoscale deployment ml-model-deployment \
  --cpu-percent=70 \
  --min=2 \
  --max=20
```

---

## Azure Machine Learning

Azure Machine Learning 是面向机器学习工作流的完整托管平台。

### 创建 Azure ML Workspace

```bash
# Create ML workspace
az ml workspace create \
  --name ml-workspace \
  --resource-group ml-infrastructure-rg \
  --location eastus

# Get workspace details
az ml workspace show \
  --name ml-workspace \
  --resource-group ml-infrastructure-rg
```

### 使用 Azure ML 训练

```python
from azureml.core import Workspace, Experiment, Environment, ScriptRunConfig
from azureml.core.compute import ComputeTarget, AmlCompute

# Connect to workspace
ws = Workspace.from_config()  # Reads from config.json
# Or:
ws = Workspace.get(
    name='ml-workspace',
    subscription_id='<subscription-id>',
    resource_group='ml-infrastructure-rg'
)

# Create compute cluster
compute_name = "gpu-cluster"
compute_config = AmlCompute.provisioning_configuration(
    vm_size='Standard_NC6s_v3',
    max_nodes=4,
    idle_seconds_before_scaledown=300
)

compute_target = ComputeTarget.create(ws, compute_name, compute_config)
compute_target.wait_for_completion(show_output=True)

# Create environment
env = Environment.from_conda_specification(
    name='pytorch-env',
    file_path='environment.yml'
)

# Or use curated environment
env = Environment.get(ws, name='AzureML-PyTorch-1.13-CUDA11.6')

# Create training script config
config = ScriptRunConfig(
    source_directory='./src',
    script='train.py',
    arguments=[
        '--data-path', ws.datasets['imagenet'].as_mount(),
        '--epochs', 100,
        '--batch-size', 64,
        '--learning-rate', 0.001
    ],
    compute_target=compute_target,
    environment=env
)

# Submit experiment
experiment = Experiment(ws, 'resnet-training')
run = experiment.submit(config)

# Monitor run
run.wait_for_completion(show_output=True)

# Download model
run.download_file(
    name='outputs/model.pth',
    output_file_path='./model.pth'
)
```

### 使用 Azure ML 部署模型

```python
from azureml.core.model import Model, InferenceConfig
from azureml.core.webservice import AciWebservice, AksWebservice

# Register model
model = Model.register(
    workspace=ws,
    model_name='resnet50',
    model_path='./model.pth',
    description='ResNet-50 trained on ImageNet',
    tags={'framework': 'pytorch', 'task': 'classification'}
)

# Create inference config
inference_config = InferenceConfig(
    entry_script='score.py',
    environment=env
)

# Deploy to Azure Container Instances (ACI) - for testing
aci_config = AciWebservice.deploy_configuration(
    cpu_cores=2,
    memory_gb=4,
    auth_enabled=True
)

service = Model.deploy(
    workspace=ws,
    name='resnet50-aci',
    models=[model],
    inference_config=inference_config,
    deployment_config=aci_config
)

service.wait_for_deployment(show_output=True)
print(f"Scoring URI: {service.scoring_uri}")

# Deploy to AKS - for production
aks_target = ComputeTarget(ws, 'ml-aks-cluster')

aks_config = AksWebservice.deploy_configuration(
    autoscale_enabled=True,
    autoscale_min_replicas=2,
    autoscale_max_replicas=10,
    autoscale_target_utilization=70,
    cpu_cores=2,
    memory_gb=4,
    enable_app_insights=True
)

service = Model.deploy(
    workspace=ws,
    name='resnet50-production',
    models=[model],
    inference_config=inference_config,
    deployment_config=aks_config,
    deployment_target=aks_target
)

service.wait_for_deployment(show_output=True)

# Test endpoint
import requests
import json

headers = {'Content-Type': 'application/json'}
headers['Authorization'] = f'Bearer {service.get_keys()[0]}'

data = {'data': [[1, 2, 3, 4, 5]]}
response = requests.post(service.scoring_uri, json=data, headers=headers)
print(response.json())
```

### Azure ML Pipelines

```python
from azureml.pipeline.core import Pipeline, PipelineData
from azureml.pipeline.steps import PythonScriptStep

# Define pipeline data
processed_data = PipelineData('processed', datastore=ws.get_default_datastore())
trained_model = PipelineData('model', datastore=ws.get_default_datastore())

# Data preprocessing step
preprocess_step = PythonScriptStep(
    name='preprocess-data',
    script_name='preprocess.py',
    arguments=['--output', processed_data],
    outputs=[processed_data],
    compute_target=compute_target,
    source_directory='./src'
)

# Training step
train_step = PythonScriptStep(
    name='train-model',
    script_name='train.py',
    arguments=['--input', processed_data, '--output', trained_model],
    inputs=[processed_data],
    outputs=[trained_model],
    compute_target=compute_target,
    source_directory='./src'
)

# Evaluation step
evaluate_step = PythonScriptStep(
    name='evaluate-model',
    script_name='evaluate.py',
    arguments=['--model', trained_model],
    inputs=[trained_model],
    compute_target=compute_target,
    source_directory='./src'
)

# Create pipeline
pipeline = Pipeline(
    workspace=ws,
    steps=[preprocess_step, train_step, evaluate_step]
)

# Submit pipeline
experiment = Experiment(ws, 'ml-pipeline')
pipeline_run = experiment.submit(pipeline)
pipeline_run.wait_for_completion(show_output=True)

# Publish pipeline for reuse
published_pipeline = pipeline.publish(
    name='training-pipeline-v1',
    description='Complete training pipeline'
)
```

---

## Azure OpenAI Service

Azure OpenAI 通过 Azure 提供 OpenAI 模型的访问能力。

### 可用模型（原文所处时期）

- **GPT-4：** 原文所列能力最强的模型，适用于复杂任务。
- **GPT-3.5-Turbo：** 速度快，适合许多成本敏感的任务。
- **GPT-3.5-Turbo-16k：** 扩展上下文窗口（16k token）。
- **DALL-E 3：** 图像生成。
- **Whisper：** 语音转文本。
- **Embeddings：** 用于相似度检索的文本嵌入。

### 创建 Azure OpenAI 资源

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name my-openai-resource \
  --resource-group ml-infrastructure-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Get API key
az cognitiveservices account keys list \
  --name my-openai-resource \
  --resource-group ml-infrastructure-rg
```

### 通过 Python 使用 Azure OpenAI

```python
import openai
import os

# Set up Azure OpenAI
openai.api_type = "azure"
openai.api_base = "https://my-openai-resource.openai.azure.com/"
openai.api_version = "2023-05-15"
openai.api_key = os.getenv("AZURE_OPENAI_API_KEY")

# Chat completion (GPT-4)
response = openai.ChatCompletion.create(
    engine="gpt-4",  # Deployment name in Azure
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Explain machine learning in simple terms"}
    ],
    temperature=0.7,
    max_tokens=500
)

print(response['choices'][0]['message']['content'])

# Embeddings
response = openai.Embedding.create(
    engine="text-embedding-ada-002",
    input="Machine learning is a subset of artificial intelligence"
)

embedding = response['data'][0]['embedding']
print(f"Embedding dimension: {len(embedding)}")

# Image generation (DALL-E)
response = openai.Image.create(
    prompt="A futuristic AI data center with glowing servers",
    n=1,
    size="1024x1024"
)

image_url = response['data'][0]['url']
print(f"Generated image: {image_url}")
```

### 将 Azure OpenAI 集成到机器学习流水线

```python
import openai
from azureml.core import Workspace, Dataset

# Connect to Azure ML workspace
ws = Workspace.from_config()

# Load dataset
dataset = Dataset.get_by_name(ws, 'customer-feedback')
df = dataset.to_pandas_dataframe()

# Analyze sentiments with GPT-4
def analyze_sentiment(text):
    response = openai.ChatCompletion.create(
        engine="gpt-4",
        messages=[
            {"role": "system", "content": "Analyze sentiment: positive, negative, or neutral"},
            {"role": "user", "content": text}
        ],
        temperature=0,
        max_tokens=10
    )
    return response['choices'][0]['message']['content']

# Apply to dataset
df['sentiment'] = df['feedback'].apply(analyze_sentiment)

# Register updated dataset
updated_dataset = Dataset.Tabular.register_pandas_dataframe(
    df,
    target=(ws.get_default_datastore(), 'feedback-with-sentiment'),
    name='customer-feedback-analyzed'
)
```

### Azure OpenAI 定价

```
┌──────────────────────┬────────────────────────────────────────┐
│ Model                │ Price                                  │
├──────────────────────┼────────────────────────────────────────┤
│ GPT-4 (8K context)   │ $0.03/1K prompt + $0.06/1K completion  │
│ GPT-4 (32K context)  │ $0.06/1K prompt + $0.12/1K completion  │
│ GPT-3.5-Turbo        │ $0.0015/1K prompt + $0.002/1K compl    │
│ GPT-3.5-Turbo-16k    │ $0.003/1K prompt + $0.004/1K compl     │
│ Embeddings           │ $0.0001/1K tokens                      │
│ DALL-E 3             │ $0.04-0.12 per image                   │
│ Whisper              │ $0.006/minute                          │
└──────────────────────┴────────────────────────────────────────┘
```

> 译注：此处模型目录与代码为原文历史示例，不是当前可用模型清单。Azure OpenAI 并非访问 GPT-4 等 OpenAI 模型的唯一途径。模型版本、区域、配额、API 及价格可能变更，请在使用前核对官方文档。

---

## Azure 网络

### 虚拟网络（VNet）架构

```
┌──────────────────────────────────────────────────────────────┐
│                   Azure Virtual Network                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Subnet 1: Training (10.0.1.0/24)                           │
│  ├── GPU VM 1                                                │
│  ├── GPU VM 2                                                │
│  └── DSVM                                                    │
│                                                              │
│  Subnet 2: Inference (10.0.2.0/24)                          │
│  ├── AKS Cluster                                             │
│  │   ├── Pod 1                                               │
│  │   ├── Pod 2                                               │
│  │   └── Pod 3                                               │
│  └── Load Balancer                                           │
│                                                              │
│  Subnet 3: Data (10.0.3.0/24)                               │
│  └── Private Endpoint → Blob Storage                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         ▲                               ▲
         │                               │
    Azure Bastion                 Application Gateway
    (Secure SSH)                  (Public HTTPS)
```

### 创建 VNet

```bash
# Create VNet
az network vnet create \
  --resource-group ml-infrastructure-rg \
  --name ml-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name training-subnet \
  --subnet-prefix 10.0.1.0/24

# Add additional subnets
az network vnet subnet create \
  --resource-group ml-infrastructure-rg \
  --vnet-name ml-vnet \
  --name inference-subnet \
  --address-prefix 10.0.2.0/24

az network vnet subnet create \
  --resource-group ml-infrastructure-rg \
  --vnet-name ml-vnet \
  --name data-subnet \
  --address-prefix 10.0.3.0/24
```

### 网络安全组（NSG）

```bash
# Create NSG
az network nsg create \
  --resource-group ml-infrastructure-rg \
  --name ml-training-nsg

# Allow SSH from specific IP
az network nsg rule create \
  --resource-group ml-infrastructure-rg \
  --nsg-name ml-training-nsg \
  --name allow-ssh \
  --priority 100 \
  --source-address-prefixes 1.2.3.4 \
  --destination-port-ranges 22 \
  --protocol Tcp \
  --access Allow

# Allow internal communication
az network nsg rule create \
  --resource-group ml-infrastructure-rg \
  --nsg-name ml-training-nsg \
  --name allow-internal \
  --priority 110 \
  --source-address-prefixes 10.0.0.0/16 \
  --destination-port-ranges "*" \
  --protocol "*" \
  --access Allow
```

### Azure Load Balancer

```bash
# Create public IP
az network public-ip create \
  --resource-group ml-infrastructure-rg \
  --name ml-lb-ip \
  --sku Standard

# Create load balancer
az network lb create \
  --resource-group ml-infrastructure-rg \
  --name ml-load-balancer \
  --sku Standard \
  --public-ip-address ml-lb-ip \
  --frontend-ip-name ml-frontend \
  --backend-pool-name ml-backend-pool

# Create health probe
az network lb probe create \
  --resource-group ml-infrastructure-rg \
  --lb-name ml-load-balancer \
  --name ml-health-probe \
  --protocol http \
  --port 8000 \
  --path /health

# Create load balancing rule
az network lb rule create \
  --resource-group ml-infrastructure-rg \
  --lb-name ml-load-balancer \
  --name ml-http-rule \
  --protocol tcp \
  --frontend-port 80 \
  --backend-port 8000 \
  --frontend-ip-name ml-frontend \
  --backend-pool-name ml-backend-pool \
  --probe-name ml-health-probe
```

---

## 成本优化

### 1. 预留实例

原文示例：一年至三年承诺可节省 **40–60%**。

```
┌─────────────────────┬──────────────┬──────────────┬──────────────┐
│ VM Size             │ Pay-as-you-go│ 1-Year RI    │ 3-Year RI    │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Standard_D4s_v3     │ $0.192/hr    │ $0.131/hr    │ $0.086/hr    │
│ Standard_NC6s_v3    │ $3.06/hr     │ $2.08/hr     │ $1.37/hr     │
└─────────────────────┴──────────────┴──────────────┴──────────────┘

Savings:                 -              32%           55%
```

通过 Azure Portal 购买：Cost Management → Reservations。

### 2. Azure Spot VM

原文示例：节省最高 **90%**。

```bash
# Always use Spot VMs for training
az vm create \
  --priority Spot \
  --max-price 0.5 \
  --eviction-policy Deallocate

# Cost comparison:
# Regular NC6s_v3: $3.06/hour
# Spot NC6s_v3: ~$0.30/hour (90% savings)
```

### 3. 自动关闭 VM

```bash
# Enable auto-shutdown
az vm auto-shutdown \
  --resource-group ml-infrastructure-rg \
  --name ml-training-vm \
  --time 1900 \
  --timezone "Pacific Standard Time"
```

### 4. 存储成本优化

```bash
# Use lifecycle management
# Hot → Cool (30 days) → Archive (90 days) → Delete (365 days)

# Savings example:
# 1 TB for 1 year:
# - All Hot: $221
# - With lifecycle: $78 (65% savings)
```

### 5. Azure Cost Management

```bash
# View current costs
az consumption usage list --output table

# Create budget
az consumption budget create \
  --budget-name ml-monthly-budget \
  --amount 1000 \
  --time-grain Monthly \
  --time-period start-date=2024-01-01 \
  --notifications threshold=50 threshold-type=Actual contact-emails=["admin@example.com"]

# Set up cost alerts (via Portal)
# Cost Management → Budgets → Create budget
# - Set threshold at 50%, 90%, 100%
# - Email notifications
# - Action groups for automation
```

### 成本优化检查清单

- [ ] 使用 Spot VM 进行训练（原文示例节省 90%）。
- [ ] 为生产工作负载购买合适的预留实例（原文示例节省 40–60%）。
- [ ] 启用 VM 自动关闭（晚间、周末）。
- [ ] 使用存储生命周期管理（原文示例节省 65%）。
- [ ] 合理调整 VM 规格，避免过度供应。
- [ ] 删除未使用的资源（磁盘、IP、快照）。
- [ ] 使用 AKS 自动扩缩容（支持的节点池可以缩容至零）。
- [ ] 利用 Azure Hybrid Benefit（如果拥有符合条件的 Windows 许可证）。
- [ ] 设置成本预算与告警。
- [ ] 使用 Cost Management 每周审查成本。

---

## 动手练习

### 练习：在 Azure 上部署完整机器学习系统

**目标：** 使用以下架构部署图像分类模型：

```
User Request
    ↓
Application Gateway (WAF + SSL)
    ↓
AKS Cluster (autoscaling 2-10 pods)
    ↓
Model Server (loads from Blob Storage)
    ↓
Azure Blob Storage (model weights)
```

**要求：**
1. 为 AKS 节点池使用 Spot VM。
2. 启用 AKS 自动扩缩容（CPU 利用率超过 70%）。
3. 实现健康检查。
4. 将模型存储在 Blob Storage 中。
5. 设置 Azure Monitor。
6. 估算月度成本（每月 100 万次请求）。

**步骤：**

1. **创建资源：**
   ```bash
   # Resource group
   az group create --name ml-exercise-rg --location eastus

   # Storage account
   az storage account create --name mlexercisestore --resource-group ml-exercise-rg

   # Upload model
   az storage container create --name models --account-name mlexercisestore
   azcopy copy model.pth "https://mlexercisestore.blob.core.windows.net/models/model.pth?<SAS>"
   ```

2. **创建 AKS 集群：**
   ```bash
   az aks create --resource-group ml-exercise-rg --name ml-aks --node-count 2 --node-vm-size Standard_D4s_v3

   # Add Spot node pool
   az aks nodepool add --resource-group ml-exercise-rg --cluster-name ml-aks --name spotpool --priority Spot --eviction-policy Delete --spot-max-price 0.5 --node-count 2
   ```

3. **部署模型：**
   ```bash
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   kubectl apply -f hpa.yaml
   ```

4. **设置 Application Gateway：**
   ```bash
   # Follow Azure documentation for Application Gateway + AKS integration
   ```

5. **配置监控：**
   ```bash
   # Enable Container Insights
   az aks enable-addons --resource-group ml-exercise-rg --name ml-aks --addons monitoring
   ```

**预计成本（每月 100 万次请求，原文示例）：**
- AKS Spot 节点：2 × 0.04 美元/小时 × 730 小时 = 58 美元。
- Blob Storage：1 GB × 0.0184 美元 = 0.02 美元。
- Application Gateway：约 150 美元/月。
- Monitor：每摄取 GB 2.30 美元（约 10 美元/月）。
- **总计：约 220 美元/月。**

> 译注：原文成本模型仅供练习，可能未计入系统节点池、GPU、集群管理费、网络及日志保留等其他费用。Spot 节点随时可能被回收，生产服务需要适当的按需容量与容错设计。AKS 系统节点池不能缩容至零；需要区分 Pod 的 HPA 与节点池自动扩缩容。

---

## 自我检查问题

1. **用于训练时，Azure VM、AKS 与 Azure ML 有何区别？**
   <details>
   <summary>答案</summary>

   - **Azure VM：** 完整控制、自行管理，适合自定义环境。
   - **AKS：** 容器编排，适合带自动扩缩容的生产服务。
   - **Azure ML：** 托管服务、自动扩缩容，适合端到端机器学习工作流。
   </details>

2. **Azure OpenAI 与 OpenAI API 有什么区别？**
   <details>
   <summary>答案</summary>

   - **企业能力：** SLA、安全与合规。
   - **私有网络：** VNet 集成、私有 Endpoint。
   - **定价：** 不同的定价方案（按 token 等方式计费）。
   - **区域部署：** 数据驻留选项。
   - **Azure 集成：** 与 Azure ML、Key Vault 等服务协作。
   </details>

3. **何时使用 Azure Spot VM？**
   <details>
   <summary>答案</summary>

   使用 Spot VM 的场景：
   - 训练任务（支持检查点）。
   - 批处理。
   - 非关键工作负载。
   - 成本敏感型项目。

   应谨慎或避免使用的场景：
   - 缺少备用容量的生产推理。
   - 对时间敏感的工作负载。
   - 不具备容错能力的工作负载。
   </details>

4. **模型检查点最适合哪种存储层级？**
   <details>
   <summary>答案</summary>

   - **活跃检查点：** Hot 层（0.0184 美元/GB，原文价格示例）。
   - **较旧检查点：** 30 天后转入 Cool 层（0.01 美元/GB）。
   - **归档检查点：** 90 天后转入 Archive 层（0.00099 美元/GB）。
   - 使用生命周期管理实现自动迁移。
   </details>

5. **如何在 AKS 上启用自动扩缩容？**
   <details>
   <summary>答案</summary>

   ```bash
   # Cluster autoscaler (nodes)
   az aks update --enable-cluster-autoscaler --min-count 1 --max-count 10

   # Horizontal Pod Autoscaler (pods)
   kubectl autoscale deployment ml-model --cpu-percent=70 --min=2 --max=20
   ```
   </details>

---

## 补充资源

### 官方文档
- [Azure ML 文档](https://docs.microsoft.com/azure/machine-learning/)
- [Azure OpenAI 文档](https://learn.microsoft.com/azure/cognitive-services/openai/)
- [AKS 文档](https://docs.microsoft.com/azure/aks/)
- [Azure Blob Storage 文档](https://docs.microsoft.com/azure/storage/blobs/)

### 教程
- [Azure ML 教程](https://docs.microsoft.com/azure/machine-learning/tutorial-1st-experiment-sdk-setup)
- [将机器学习模型部署至 AKS](https://docs.microsoft.com/azure/machine-learning/how-to-deploy-azure-kubernetes-service)

### 工具
- [Azure CLI](https://docs.microsoft.com/cli/azure/)
- [Azure Storage Explorer](https://azure.microsoft.com/features/storage-explorer/)
- [Azure ML SDK](https://docs.microsoft.com/python/api/overview/azure/ml/)

### 成本管理
- [Azure 价格计算器](https://azure.microsoft.com/pricing/calculator/)
- [Azure Cost Management](https://azure.microsoft.com/services/cost-management/)

---

## 总结

本课学习了：

- 设置 Azure 账号并正确配置 RBAC。
- 部署具有 GPU 的 VM，用于机器学习训练。
- 使用 Azure Blob Storage 及其生命周期管理。
- 在 AKS 上部署模型并实施自动扩缩容。
- 利用 Azure Machine Learning 执行托管工作流。
- 集成 Azure OpenAI（GPT-4、Embedding 等）。
- 配置 VNet 与负载均衡。
- 通过 Spot VM 和预留实例优化成本。

**核心要点：**
- Azure 在具备较强治理要求的企业机器学习场景中具有优势。
- Azure OpenAI 提供 OpenAI 模型访问能力（原文以 GPT-4 为例）。
- 原文示例中 Spot VM 可节省最高 90% 的训练成本。
- Azure ML 简化端到端机器学习工作流。
- Azure Arc 提供混合云能力。

**后续步骤：**
- 完成动手练习。
- 探索 Azure ML Pipelines。
- 学习用于混合部署的 Azure Arc。
- 进入第 05 课：深入云存储。

---

**预计完成时间：** 6 小时（含动手练习）。
**难度：** 中级。
**下一课：** [05-cloud-storage.md](./05-cloud-storage.md)

> 译注：原文命令、代码块及其中的英文注释和配置均保留，未逐一运行。云产品的接口、定价及合规适用性可能变化；获得认证并不意味着使用该服务的应用自动合规。实验应在授权的沙箱中执行，结束后清理创建的计费资源，停止 VM 不一定会停止磁盘等附属资源的计费。
