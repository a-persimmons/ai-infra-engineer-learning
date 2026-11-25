# 第 03 课：面向机器学习基础设施的 Google Cloud Platform

**时长：** 7 小时
**难度：** 中级
**前置条件：** 第 01 课（云架构）、第 02 课（AWS 机器学习基础设施）

## 学习目标

完成本课后，你将能够：

1. **设置并保护** Google Cloud Platform 账号，正确配置 IAM。
2. **部署与管理**面向机器学习工作负载的 Compute Engine 实例。
3. **使用 Cloud Storage** 存储数据集与模型，并实施生命周期管理。
4. **使用 TPU** 加速深度学习训练。
5. 在 Google Kubernetes Engine（GKE）上**部署机器学习模型**。
6. **使用 Vertex AI** 实现托管机器学习训练与部署。
7. **配置 VPC 网络**，构建安全的机器学习基础设施。
8. 利用 GCP 定价模式与最佳实践**优化成本**。

---

## 目录

1. [面向机器学习的 GCP 简介](#面向机器学习的-gcp-简介)
2. [GCP 账号配置与 IAM](#gcp-账号配置与-iam)
3. [面向机器学习的 Compute Engine](#面向机器学习的-compute-engine)
4. [用于数据与模型的 Cloud Storage](#用于数据与模型的-cloud-storage)
5. [张量处理单元（TPU）](#张量处理单元-tpu)
6. [Google Kubernetes Engine（GKE）](#google-kubernetes-engine-gke)
7. [Vertex AI 平台](#vertex-ai-平台)
8. [面向机器学习的 GCP 网络](#面向机器学习的-gcp-网络)
9. [成本优化策略](#成本优化策略)
10. [动手练习](#动手练习)

---

## 面向机器学习的 GCP 简介

Google Cloud Platform（GCP）特别适合机器学习工作负载，原因包括：

- **原生机器学习积累：** 由 TensorFlow 的创建者开发。
- **TPU 访问：** 提供 Google 专用的张量处理单元。
- **BigQuery ML：** 直接在数据仓库中运行机器学习模型。
- **Vertex AI：** 完整的托管机器学习平台。
- **强大的开源集成：** TensorFlow、Kubeflow、Ray。
- **具有竞争力的定价：** 持续使用折扣、可抢占 VM。

### GCP 机器学习生态

```
┌─────────────────────────────────────────────────────────────────┐
│                       GCP ML Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Data Ingestion       Processing           Training/Serving    │
│  ──────────────       ──────────           ────────────────    │
│  Cloud Storage   →    Dataflow        →    Vertex AI          │
│  BigQuery        →    Dataproc        →    GKE                │
│  Pub/Sub         →    AI Platform     →    Cloud Run          │
│                                                                 │
│  Infrastructure       Networking           Monitoring          │
│  ──────────────       ──────────           ──────────          │
│  Compute Engine       VPC                  Cloud Monitoring   │
│  GKE                  Cloud Load          Cloud Logging       │
│  Cloud Run            Balancing           Cloud Trace         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 何时为机器学习选择 GCP

**在以下情况下选择 GCP：**
- 已经大量使用 TensorFlow。
- 需要 TPU 开展大规模训练。
- 希望与 BigQuery 深度集成。
- 偏好 Google 的托管服务。
- 需要良好的开源 Kubernetes 支持。

**在以下情况下考虑替代方案：**
- 团队已采用 AWS/Azure。
- 需要更丰富的 GPU 类型。
- 需要覆盖更多区域。
- 需要特定的企业集成功能。

---

## GCP 账号配置与 IAM

### 创建 GCP 账号

1. **注册 GCP：**
   - 访问：https://cloud.google.com/free
   - 原文所述试用权益为 **300 美元免费额度**，有效期 90 天。
   - 原文称试用结束后不会自动收费。
   - 需要信用卡进行验证。

2. **免费层（Always Free）：**
   ```
   Compute Engine:
   - 1 f1-micro instance (US regions only)
   - 30 GB standard persistent disk
   - 1 GB snapshot storage

   Cloud Storage:
   - 5 GB standard storage
   - 1 GB network egress (North America)

   BigQuery:
   - 1 TB queries/month
   - 10 GB storage

   Cloud Functions:
   - 2 million invocations/month
   ```

3. **创建项目：**
   ```bash
   # Install gcloud CLI
   # macOS
   brew install google-cloud-sdk

   # Linux
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL

   # Initialize gcloud
   gcloud init

   # Create a new project
   gcloud projects create ml-infrastructure-project --name="ML Infrastructure"

   # Set as default project
   gcloud config set project ml-infrastructure-project

   # Enable required APIs
   gcloud services enable compute.googleapis.com
   gcloud services enable container.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable aiplatform.googleapis.com
   ```

### IAM 最佳实践

GCP 使用具备细粒度权限模型的**身份与访问管理（IAM）**。

#### 关键概念

1. **主体（Principal）：** 谁（用户、服务账号、群组）。
2. **角色（Role）：** 具有什么权限（预定义或自定义）。
3. **资源（Resource）：** 作用在哪里（项目、文件夹、组织）。

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Principal   │────▶│     Role     │────▶│  Resource    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ - User       │     │ - Primitive  │     │ - Project    │
│ - SA         │     │ - Predefined │     │ - Bucket     │
│ - Group      │     │ - Custom     │     │ - VM         │
└──────────────┘     └──────────────┘     └──────────────┘
```

#### 创建服务账号

服务账号用于应用之间的身份验证。

```bash
# Create a service account for ML training
gcloud iam service-accounts create ml-training-sa \
  --display-name="ML Training Service Account" \
  --description="Service account for ML training jobs"

# Grant necessary permissions
gcloud projects add-iam-policy-binding ml-infrastructure-project \
  --member="serviceAccount:ml-training-sa@ml-infrastructure-project.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding ml-infrastructure-project \
  --member="serviceAccount:ml-training-sa@ml-infrastructure-project.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Create and download key
gcloud iam service-accounts keys create ~/ml-training-key.json \
  --iam-account=ml-training-sa@ml-infrastructure-project.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/ml-training-key.json
```

#### 常见机器学习角色

```
┌─────────────────────────────────┬──────────────────────────────────────┐
│ Role                            │ Use Case                             │
├─────────────────────────────────┼──────────────────────────────────────┤
│ roles/aiplatform.user           │ Run Vertex AI training jobs          │
│ roles/storage.objectAdmin       │ Read/write Cloud Storage             │
│ roles/compute.instanceAdmin     │ Manage Compute Engine VMs            │
│ roles/container.admin           │ Manage GKE clusters                  │
│ roles/monitoring.metricWriter   │ Write custom metrics                 │
│ roles/logging.logWriter         │ Write application logs               │
└─────────────────────────────────┴──────────────────────────────────────┘
```

#### 安全最佳实践

1. **最小权限原则：** 只授予必要权限。
2. **使用服务账号：** 不要在代码中使用个人凭据。
3. **定期轮换密钥：** 设置密钥轮换策略（原文示例为 90 天）。
4. **启用审计日志：** 追踪所有 IAM 变更。
5. **使用组织策略：** 强制执行安全约束。

```bash
# Enable audit logs
gcloud logging sinks create ml-audit-sink \
  storage.googleapis.com/ml-audit-logs-bucket \
  --log-filter='protoPayload.methodName:"iam.googleapis.com"'

# Set key expiration reminder (via monitoring)
gcloud alpha iam service-accounts keys list \
  --iam-account=ml-training-sa@ml-infrastructure-project.iam.gserviceaccount.com \
  --format="table(name,validAfterTime,validBeforeTime)"
```

> 译注：免费权益与资格以当前账号及官方条款为准。生产环境优先采用附加服务账号、Workload Identity Federation 等无长期密钥的身份验证方式；仅在确有必要时创建密钥，并妥善管理。

---

## 面向机器学习的 Compute Engine

Compute Engine 提供灵活配置的虚拟机，适用于机器学习工作负载。

### 面向机器学习的实例类型

#### 通用型（N 系列）

适用于：开发、小模型、CPU 推理。

```
┌──────────────┬─────────┬────────────┬──────────┬───────────────┐
│ Machine Type │ vCPUs   │ Memory     │ Network  │ Cost/hour     │
├──────────────┼─────────┼────────────┼──────────┼───────────────┤
│ n1-standard-4│ 4       │ 15 GB      │ 10 Gbps  │ $0.190        │
│ n2-standard-8│ 8       │ 32 GB      │ 32 Gbps  │ $0.389        │
│ n2d-highmem-16│16      │ 128 GB     │ 32 Gbps  │ $0.777        │
└──────────────┴─────────┴────────────┴──────────┴───────────────┘
```

#### GPU 实例（加速器优化型）

适用于：训练、GPU 推理。

```
┌──────────────┬──────────────┬─────────────┬─────────┬──────────────┐
│ Machine Type │ GPU          │ GPU Memory  │ vCPUs   │ Cost/hour    │
├──────────────┼──────────────┼─────────────┼─────────┼──────────────┤
│ n1 + T4      │ 1x NVIDIA T4 │ 16 GB       │ 4       │ $0.35        │
│ n1 + V100    │ 1x NVIDIA V100│16 GB       │ 8       │ $2.48        │
│ n1 + A100    │ 1x NVIDIA A100│40 GB       │ 12      │ $3.67        │
│ a2 + A100    │ 8x NVIDIA A100│320 GB      │ 96      │ $29.39       │
└──────────────┴──────────────┴─────────────┴─────────┴──────────────┘
```

#### TPU 实例

适用于：大规模 TensorFlow 训练。

```
┌──────────────┬──────────────┬─────────────┬──────────────┐
│ TPU Type     │ Cores        │ Memory      │ Cost/hour    │
├──────────────┼──────────────┼─────────────┼──────────────┤
│ v2-8         │ 8            │ 64 GB HBM   │ $4.50        │
│ v3-8         │ 8            │ 128 GB HBM  │ $8.00        │
│ v4-8         │ 8            │ 32 GB HBM2e │ $3.67        │
│ v4-32        │ 32           │ 128 GB HBM2e│ $14.69       │
└──────────────┴──────────────┴─────────────┴──────────────┘
```

### 创建 GPU 实例

```bash
# List available GPU types in region
gcloud compute accelerator-types list --filter="zone:us-central1-a"

# Create instance with T4 GPU
gcloud compute instances create ml-training-gpu \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release \
  --boot-disk-size=100GB \
  --boot-disk-type=pd-ssd \
  --maintenance-policy=TERMINATE \
  --metadata="install-nvidia-driver=True"

# SSH into instance
gcloud compute ssh ml-training-gpu --zone=us-central1-a

# Verify GPU
nvidia-smi
```

### Deep Learning VM 镜像

GCP 提供预先配置机器学习框架的镜像：

```bash
# List available images
gcloud compute images list \
  --project deeplearning-platform-release \
  --no-standard-images

# Create instance with PyTorch
gcloud compute instances create ml-pytorch \
  --zone=us-central1-a \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release \
  --metadata="install-nvidia-driver=True,proxy-mode=project_editors"

# Create instance with TensorFlow
gcloud compute instances create ml-tensorflow \
  --zone=us-central1-a \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=tf-latest-gpu \
  --image-project=deeplearning-platform-release \
  --metadata="install-nvidia-driver=True"
```

### 可抢占 VM（Spot 实例）

使用可抢占 VM，原文示例可节省最高 **80%** 的计算成本。

```bash
# Create preemptible instance
gcloud compute instances create ml-training-preemptible \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --preemptible \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release \
  --metadata="install-nvidia-driver=True"

# Cost comparison
# Regular: $0.35/hour
# Preemptible: $0.07/hour (80% savings)
```

**重要考虑因素：**
- 最长运行时间：24 小时（传统 Preemptible VM）。
- 可能随时被回收，关闭通知时间约 30 秒。
- 不一定始终可用（取决于容量）。
- 适合具有容错能力的工作负载。

### 可抢占 VM 的检查点机制

```python
import os
import signal
import sys
import torch

def signal_handler(signum, frame):
    """Handle preemption signal"""
    print("Received preemption signal, saving checkpoint...")
    save_checkpoint({
        'epoch': current_epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': current_loss,
    }, 'checkpoint_preempted.pth')
    sys.exit(0)

# Register signal handler
signal.signal(signal.SIGTERM, signal_handler)

# Training loop with checkpointing
def train_with_checkpointing(model, train_loader, epochs=10):
    checkpoint_dir = "/mnt/disks/data/checkpoints"
    os.makedirs(checkpoint_dir, exist_ok=True)

    # Resume from latest checkpoint
    start_epoch = 0
    checkpoint_path = os.path.join(checkpoint_dir, "latest.pth")

    if os.path.exists(checkpoint_path):
        print(f"Resuming from checkpoint: {checkpoint_path}")
        checkpoint = torch.load(checkpoint_path)
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        start_epoch = checkpoint['epoch'] + 1
        print(f"Resuming from epoch {start_epoch}")

    for epoch in range(start_epoch, epochs):
        model.train()

        for batch_idx, (data, target) in enumerate(train_loader):
            # Training step
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            # Save checkpoint every 100 batches
            if batch_idx % 100 == 0:
                save_checkpoint({
                    'epoch': epoch,
                    'batch': batch_idx,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'loss': loss.item(),
                }, checkpoint_path)

        # Save checkpoint after each epoch
        save_checkpoint({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': loss.item(),
        }, checkpoint_path)

        print(f"Epoch {epoch} completed, checkpoint saved")

def save_checkpoint(state, filename):
    """Save checkpoint to file"""
    torch.save(state, filename)
    print(f"Checkpoint saved: {filename}")
```

### 启动脚本

使用启动脚本自动化环境设置：

```bash
# Create startup script
cat > startup.sh << 'EOF'
#!/bin/bash

# Update system
apt-get update

# Install Python packages
pip install torch torchvision wandb

# Download dataset
mkdir -p /data
gsutil -m rsync -r gs://my-bucket/datasets/imagenet /data/imagenet

# Clone training code
cd /home
git clone https://github.com/myorg/ml-training.git

# Start training
cd ml-training
python train.py --data-path /data/imagenet --epochs 100 --checkpoint-dir /data/checkpoints
EOF

# Create instance with startup script
gcloud compute instances create ml-training \
  --zone=us-central1-a \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --preemptible \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release \
  --metadata-from-file=startup-script=startup.sh \
  --scopes=storage-rw,logging-write
```

> 译注：传统 Preemptible VM 与 Spot VM 不完全相同，Spot VM 不具有传统可抢占实例固定的 24 小时运行上限。中断通知与实际关机时间不能视为保证。

---

## 用于数据与模型的 Cloud Storage

Cloud Storage 是 GCP 的对象存储服务，类似 AWS S3。

### 存储类别

```
┌────────────────────┬────────────────┬─────────────────┬────────────────┐
│ Storage Class      │ Cost/GB/month  │ Retrieval Cost  │ Use Case       │
├────────────────────┼────────────────┼─────────────────┼────────────────┤
│ Standard           │ $0.020         │ Free            │ Active data    │
│ Nearline           │ $0.010         │ $0.01/GB        │ <1/month access│
│ Coldline           │ $0.004         │ $0.02/GB        │ <1/quarter     │
│ Archive            │ $0.0012        │ $0.05/GB        │ <1/year        │
└────────────────────┴────────────────┴─────────────────┴────────────────┘
```

### 创建与管理存储桶

```bash
# Create a bucket
gsutil mb -l us-central1 -c STANDARD gs://my-ml-data-bucket

# Upload files
gsutil cp model.pth gs://my-ml-data-bucket/models/

# Upload directory (parallel)
gsutil -m cp -r ./datasets gs://my-ml-data-bucket/

# Download files
gsutil cp gs://my-ml-data-bucket/models/model.pth ./

# Sync directories (like rsync)
gsutil -m rsync -r ./local-dir gs://my-ml-data-bucket/remote-dir

# List files
gsutil ls gs://my-ml-data-bucket/models/

# Delete files
gsutil rm gs://my-ml-data-bucket/models/old-model.pth

# Get bucket info
gsutil du -sh gs://my-ml-data-bucket
```

### 版本管理与生命周期管理

```bash
# Enable versioning
gsutil versioning set on gs://my-ml-data-bucket

# Create lifecycle policy
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {
          "age": 30,
          "matchesStorageClass": ["STANDARD"]
        }
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
        "condition": {
          "age": 90,
          "matchesStorageClass": ["NEARLINE"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 365,
          "matchesStorageClass": ["COLDLINE"]
        }
      }
    ]
  }
}
EOF

# Apply lifecycle policy
gsutil lifecycle set lifecycle.json gs://my-ml-data-bucket

# View lifecycle policy
gsutil lifecycle get gs://my-ml-data-bucket
```

### Python SDK（google-cloud-storage）

```python
from google.cloud import storage
import os

# Initialize client
client = storage.Client()

# Create bucket
bucket = client.create_bucket("my-ml-data-bucket", location="us-central1")

# Upload file
def upload_file(bucket_name, source_file, destination_blob):
    """Upload file to Cloud Storage"""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob)

    blob.upload_from_filename(source_file)
    print(f"File {source_file} uploaded to {destination_blob}")

# Upload model
upload_file("my-ml-data-bucket", "model.pth", "models/resnet50-v1.pth")

# Download file
def download_file(bucket_name, source_blob, destination_file):
    """Download file from Cloud Storage"""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(source_blob)

    blob.download_to_filename(destination_file)
    print(f"File {source_blob} downloaded to {destination_file}")

# Download model
download_file("my-ml-data-bucket", "models/resnet50-v1.pth", "./model.pth")

# List files with prefix
def list_files(bucket_name, prefix):
    """List files in bucket with prefix"""
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=prefix)

    for blob in blobs:
        print(blob.name)

# List all models
list_files("my-ml-data-bucket", "models/")

# Generate signed URL (temporary access)
def generate_signed_url(bucket_name, blob_name, expiration_minutes=60):
    """Generate signed URL for temporary access"""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        expiration=timedelta(minutes=expiration_minutes),
        method='GET'
    )

    return url

# Get temporary URL for model
url = generate_signed_url("my-ml-data-bucket", "models/resnet50-v1.pth", 120)
print(f"Temporary URL (valid for 2 hours): {url}")

# Stream large files
def download_large_file_in_chunks(bucket_name, source_blob, destination_file):
    """Download large file in chunks"""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(source_blob)

    with open(destination_file, 'wb') as f:
        blob.download_to_file(f)

    print(f"Large file downloaded: {destination_file}")

# Copy file within Cloud Storage
def copy_blob(bucket_name, source_blob, destination_bucket, destination_blob):
    """Copy file within Cloud Storage"""
    source_bucket = client.bucket(bucket_name)
    source = source_bucket.blob(source_blob)
    destination_bucket = client.bucket(destination_bucket)

    source_bucket.copy_blob(source, destination_bucket, destination_blob)
    print(f"Copied {source_blob} to {destination_blob}")

# Promote model from staging to production
copy_blob(
    "ml-staging-bucket", "models/resnet50-v2.pth",
    "ml-production-bucket", "models/resnet50-latest.pth"
)
```

### 机器学习数据存储最佳实践

1. **按照生命周期组织数据：**
   ```
   gs://my-ml-bucket/
   ├── raw-data/           # Standard storage
   ├── processed-data/     # Standard → Nearline after 30 days
   ├── models/
   │   ├── staging/        # Standard
   │   ├── production/     # Standard
   │   └── archived/       # Coldline
   └── experiments/        # Delete after 90 days
   ```

2. **使用区域级存储桶：** 让数据靠近计算资源，以降低延迟。

3. **启用版本管理：** 防止意外删除造成数据丢失。

4. **设置通知：** 新数据到达时触发 Cloud Functions。

5. **使用 Requester Pays：** 对公开数据集，可由使用者承担适用的请求及出站流量费用。

---

## 张量处理单元（TPU）

TPU 是 Google 为加速机器学习工作负载专门设计的 ASIC。

### TPU 与 GPU 比较

```
┌─────────────────┬───────────────────┬────────────────────┐
│ Aspect          │ GPU               │ TPU                │
├─────────────────┼───────────────────┼────────────────────┤
│ Architecture    │ General purpose   │ ML-specific        │
│ Precision       │ FP32, FP16, INT8  │ BFloat16 optimized │
│ Framework       │ Any framework     │ TensorFlow, JAX    │
│ Memory          │ 16-80 GB HBM      │ 8-32 GB HBM        │
│ Performance     │ High              │ Very High (TF)     │
│ Cost            │ Medium            │ Medium-Low         │
│ Flexibility     │ Very flexible     │ Less flexible      │
│ Best for        │ Any ML/DL task    │ Large TF models    │
└─────────────────┴───────────────────┴────────────────────┘
```

### 何时使用 TPU

**在以下情况下使用 TPU：**
- 训练大型 TensorFlow 模型（Transformer、大型 CNN）。
- 使用混合精度训练（bfloat16）。
- 长时间训练（可能具有成本优势）。
- 需要高吞吐量推理。

**在以下情况下使用 GPU：**
- 使用 PyTorch 作为主要框架。
- 原型开发与实验。
- 需要较高的灵活性。
- 训练具有复杂自定义算子的模型。

### 创建 TPU VM

```bash
# Create TPU v2-8 (8 cores)
gcloud compute tpus tpu-vm create ml-tpu-v2 \
  --zone=us-central1-a \
  --accelerator-type=v2-8 \
  --version=tpu-vm-tf-2.13.0

# Create TPU v3-8 (more memory)
gcloud compute tpus tpu-vm create ml-tpu-v3 \
  --zone=us-central1-a \
  --accelerator-type=v3-8 \
  --version=tpu-vm-tf-2.13.0

# SSH into TPU VM
gcloud compute tpus tpu-vm ssh ml-tpu-v2 --zone=us-central1-a

# List TPUs
gcloud compute tpus tpu-vm list

# Delete TPU
gcloud compute tpus tpu-vm delete ml-tpu-v2 --zone=us-central1-a
```

### 使用 TensorFlow 在 TPU 上训练

```python
import tensorflow as tf
import os

# Initialize TPU
resolver = tf.distribute.cluster_resolver.TPUClusterResolver()
tf.config.experimental_connect_to_cluster(resolver)
tf.tpu.experimental.initialize_tpu_system(resolver)

# Create TPU strategy
strategy = tf.distribute.TPUStrategy(resolver)

print(f"Number of TPU cores: {strategy.num_replicas_in_sync}")

# Define model inside strategy scope
with strategy.scope():
    # Create model
    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(32, 3, activation='relu', input_shape=(224, 224, 3)),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(64, 3, activation='relu'),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dense(1000, activation='softmax')
    ])

    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

# Load dataset
def load_dataset():
    # Load from Cloud Storage
    dataset = tf.data.TFRecordDataset(
        'gs://my-ml-bucket/datasets/imagenet/train-*.tfrecord'
    )

    # Parse and preprocess
    def parse_example(example):
        features = tf.io.parse_single_example(example, {
            'image': tf.io.FixedLenFeature([], tf.string),
            'label': tf.io.FixedLenFeature([], tf.int64),
        })
        image = tf.io.decode_jpeg(features['image'], channels=3)
        image = tf.image.resize(image, [224, 224])
        image = tf.cast(image, tf.float32) / 255.0
        return image, features['label']

    dataset = dataset.map(parse_example)
    dataset = dataset.batch(128)  # Global batch size
    dataset = dataset.prefetch(tf.data.AUTOTUNE)

    return dataset

train_dataset = load_dataset()

# Train on TPU
model.fit(
    train_dataset,
    epochs=10,
    steps_per_epoch=1000
)

# Save model
model.save('gs://my-ml-bucket/models/resnet-tpu-trained')
```

### TPU Pod（多 TPU 训练）

对于非常大的模型，使用 TPU Pod（互连的多个 TPU）：

```bash
# Create TPU Pod (v3-32 = 4 TPU v3-8 chips)
gcloud compute tpus tpu-vm create ml-tpu-pod \
  --zone=us-central1-a \
  --accelerator-type=v3-32 \
  --version=tpu-vm-tf-2.13.0

# Cost: v3-32 = $32/hour (4x the cost of v3-8)
```

### TPU 最佳实践

1. **使用 bfloat16 训练：** TPU 针对 bfloat16 进行优化。
   ```python
   policy = tf.keras.mixed_precision.Policy('mixed_bfloat16')
   tf.keras.mixed_precision.set_global_policy(policy)
   ```

2. **批大小：** 使用较大的批次（128、256、512）。

3. **数据流水线：** 在 CPU 上预处理数据，使用 tf.data.Dataset。

4. **检查点：** 保存至 Cloud Storage，而不是本地磁盘。

5. **可抢占 TPU：** 原文示例称使用可抢占 TPU 可节省 70% 成本（类似可抢占 VM）。

> 译注：TPU 也支持 PyTorch/XLA、JAX 等技术栈。硬件与框架选择应依据算子支持、模型规模、通信效率及实测成本。

---

## Google Kubernetes Engine（GKE）

GKE 是 Google 用于容器编排的托管 Kubernetes 服务。

### 创建 GKE 集群

```bash
# Create standard cluster
gcloud container clusters create ml-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=n1-standard-4 \
  --disk-size=100GB \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10

# Create cluster with GPU nodes
gcloud container clusters create ml-gpu-cluster \
  --zone=us-central1-a \
  --num-nodes=2 \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --addons=GcePersistentDiskCsiDriver \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=5

# Install NVIDIA device plugin (for GPU support)
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/container-engine-accelerators/master/nvidia-driver-installer/cos/daemonset-preloaded.yaml

# Get cluster credentials
gcloud container clusters get-credentials ml-gpu-cluster --zone=us-central1-a

# Verify nodes
kubectl get nodes
```

### 在 GKE 上部署机器学习模型

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-server
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
        image: gcr.io/my-project/ml-model:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          value: "gs://my-ml-bucket/models/resnet50-latest.pth"
        - name: WORKERS
          value: "4"
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
# Apply deployment
kubectl apply -f deployment.yaml

# Check status
kubectl get deployments
kubectl get pods
kubectl get services

# Get external IP
kubectl get service ml-model-service
```

### GKE 上的 GPU 部署

```yaml
# gpu-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-gpu-inference
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
      containers:
      - name: gpu-model-server
        image: gcr.io/my-project/ml-model-gpu:v1.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            nvidia.com/gpu: 1
          limits:
            nvidia.com/gpu: 1
        env:
        - name: CUDA_VISIBLE_DEVICES
          value: "0"
```

### GKE 自动扩缩容

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-model-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-model-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### GKE Autopilot

GKE Autopilot 是一种由 Google 负责集群基础设施管理的托管模式：

```bash
# Create Autopilot cluster
gcloud container clusters create-auto ml-autopilot-cluster \
  --region=us-central1

# Benefits:
# - No node management
# - Pay per pod (not per node)
# - Automatic scaling
# - Security hardening
# - Lower operational overhead
```

---

## Vertex AI 平台

Vertex AI 是 GCP 用于构建、训练与部署模型的统一机器学习平台。

### Vertex AI 组件

```
┌──────────────────────────────────────────────────────────────┐
│                      Vertex AI Platform                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Workbench         Training          Prediction             │
│  ──────────        ────────          ──────────             │
│  - Notebooks       - Custom          - Online               │
│  - Managed         - AutoML          - Batch                │
│  - Git integration - Hyperparameter  - Edge                 │
│                      tuning                                  │
│                                                              │
│  Feature Store     Model Registry    Pipelines              │
│  ─────────────     ──────────────    ─────────              │
│  - Feature mgmt    - Versioning      - Kubeflow             │
│  - Serving         - Lineage         - TFX                  │
│  - Monitoring      - Evaluation      - Orchestration        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 在 Vertex AI 上训练模型

```python
from google.cloud import aiplatform

# Initialize Vertex AI
aiplatform.init(
    project='my-project-id',
    location='us-central1',
    staging_bucket='gs://my-ml-bucket/staging'
)

# Create custom training job
job = aiplatform.CustomTrainingJob(
    display_name='resnet-training',
    script_path='train.py',
    container_uri='gcr.io/cloud-aiplatform/training/pytorch-gpu.1-13:latest',
    requirements=['torchvision', 'wandb'],
)

# Run training job
model = job.run(
    replica_count=1,
    machine_type='n1-standard-8',
    accelerator_type='NVIDIA_TESLA_T4',
    accelerator_count=1,
    args=[
        '--epochs', '100',
        '--batch-size', '64',
        '--learning-rate', '0.001',
    ],
    environment_variables={
        'MODEL_NAME': 'resnet50',
        'DATA_PATH': 'gs://my-ml-bucket/datasets/imagenet',
    },
)

print(f"Training job completed: {model.resource_name}")
```

### 将模型部署至 Vertex AI Endpoint

```python
# Upload model
model = aiplatform.Model.upload(
    display_name='resnet50-v1',
    artifact_uri='gs://my-ml-bucket/models/resnet50/',
    serving_container_image_uri='gcr.io/my-project/model-server:latest',
)

# Create endpoint
endpoint = aiplatform.Endpoint.create(
    display_name='resnet50-endpoint',
)

# Deploy model to endpoint
endpoint.deploy(
    model=model,
    deployed_model_display_name='resnet50-v1',
    machine_type='n1-standard-4',
    min_replica_count=1,
    max_replica_count=10,
    accelerator_type='NVIDIA_TESLA_T4',
    accelerator_count=1,
)

print(f"Model deployed to endpoint: {endpoint.resource_name}")

# Make prediction
instances = [
    {'image_bytes': base64.b64encode(open('cat.jpg', 'rb').read()).decode()}
]

prediction = endpoint.predict(instances=instances)
print(f"Prediction: {prediction.predictions}")
```

### Vertex AI 上的 AutoML

用于不编写自定义训练代码的快速原型开发：

```python
# Create AutoML image classification model
dataset = aiplatform.ImageDataset.create(
    display_name='my-image-dataset',
    gcs_source='gs://my-ml-bucket/datasets/images.csv',
)

job = aiplatform.AutoMLImageTrainingJob(
    display_name='automl-image-classification',
    prediction_type='classification',
    multi_label=False,
)

model = job.run(
    dataset=dataset,
    model_display_name='automl-resnet-v1',
    training_fraction_split=0.8,
    validation_fraction_split=0.1,
    test_fraction_split=0.1,
    budget_milli_node_hours=8000,  # 8 hours
)
```

### Vertex AI 定价

```
Training:
- n1-standard-4: $0.190/hour
- n1-standard-4 + T4: $0.526/hour
- n1-standard-8 + V100: $2.67/hour

Prediction (Hosting):
- n1-standard-2: $0.095/hour
- n1-standard-4 + T4: $0.526/hour

AutoML:
- Training: $3.15/hour
- Prediction: $1.25/hour + $0.10/1000 predictions
```

---

## 面向机器学习的 GCP 网络

### VPC 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    VPC Network (Global)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  us-central1                      us-east1                 │
│  ────────────                     ────────                 │
│  ┌─────────────────┐             ┌──────────────────┐     │
│  │ Subnet: 10.0.1.0/24│         │ Subnet: 10.0.2.0/24│   │
│  │                 │             │                  │     │
│  │ ML Training     │             │ ML Inference     │     │
│  │ Instances       │             │ Instances        │     │
│  │ (GPU VMs)       │             │ (GKE Cluster)    │     │
│  └─────────────────┘             └──────────────────┘     │
│                                                             │
│  Cloud Storage                   Cloud SQL                 │
│  (Private endpoint)              (Private IP)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ▲                               ▲
         │                               │
    Cloud NAT                    Cloud Load Balancer
    (Outbound)                   (Inbound - Public)
```

### 创建 VPC 网络

```bash
# Create VPC network
gcloud compute networks create ml-vpc \
  --subnet-mode=custom

# Create subnet for training (us-central1)
gcloud compute networks subnets create ml-training-subnet \
  --network=ml-vpc \
  --region=us-central1 \
  --range=10.0.1.0/24

# Create subnet for inference (us-east1)
gcloud compute networks subnets create ml-inference-subnet \
  --network=ml-vpc \
  --region=us-east1 \
  --range=10.0.2.0/24

# Create firewall rule (allow SSH)
gcloud compute firewall-rules create ml-allow-ssh \
  --network=ml-vpc \
  --allow=tcp:22 \
  --source-ranges=0.0.0.0/0

# Create firewall rule (allow internal)
gcloud compute firewall-rules create ml-allow-internal \
  --network=ml-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/16
```

### Cloud Load Balancing

```bash
# Create instance group
gcloud compute instance-groups managed create ml-inference-group \
  --base-instance-name=ml-inference \
  --template=ml-inference-template \
  --size=3 \
  --zone=us-central1-a

# Create health check
gcloud compute health-checks create http ml-health-check \
  --port=8000 \
  --request-path=/health

# Create backend service
gcloud compute backend-services create ml-backend-service \
  --protocol=HTTP \
  --health-checks=ml-health-check \
  --global

# Add instance group to backend
gcloud compute backend-services add-backend ml-backend-service \
  --instance-group=ml-inference-group \
  --instance-group-zone=us-central1-a \
  --global

# Create URL map
gcloud compute url-maps create ml-load-balancer \
  --default-service=ml-backend-service

# Create target HTTP proxy
gcloud compute target-http-proxies create ml-http-proxy \
  --url-map=ml-load-balancer

# Create forwarding rule (public IP)
gcloud compute forwarding-rules create ml-forwarding-rule \
  --global \
  --target-http-proxy=ml-http-proxy \
  --ports=80

# Get public IP
gcloud compute forwarding-rules describe ml-forwarding-rule --global
```

### Cloud CDN

为适合缓存的模型服务启用 Cloud CDN：

```bash
# Enable Cloud CDN on backend service
gcloud compute backend-services update ml-backend-service \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --global
```

---

## 成本优化策略

### 1. 承诺用量折扣（CUD）

原文示例：三年期承诺可节省 **57%**。

```
┌────────────────────┬──────────────┬──────────────┬──────────────┐
│ Resource           │ On-Demand    │ 1-Year CUD   │ 3-Year CUD   │
├────────────────────┼──────────────┼──────────────┼──────────────┤
│ n1-standard-4      │ $0.190/hr    │ $0.128/hr    │ $0.082/hr    │
│ n1-standard-8      │ $0.380/hr    │ $0.256/hr    │ $0.164/hr    │
│ T4 GPU             │ $0.35/hr     │ $0.244/hr    │ $0.158/hr    │
└────────────────────┴──────────────┴──────────────┴──────────────┘

Savings:           -              33%           57%
```

购买：

```bash
# Purchase CUD (via console or API)
# Console: Billing → Commitments → Purchase commitment
```

### 2. 持续使用折扣

对适用的持续使用资源自动提供折扣（不需要承诺）：

```
Running time per month: Discount
- 25% of month: 0%
- 50% of month: 10%
- 75% of month: 20%
- 100% of month: 30%
```

### 3. 可抢占 VM 与 Spot VM

原文示例：节省 **60–91%** 的计算成本。

```bash
# Preemptible VM (can be terminated anytime)
gcloud compute instances create ml-training \
  --preemptible \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1

# Spot VM (successor to preemptible, with more features)
gcloud compute instances create ml-training-spot \
  --provisioning-model=SPOT \
  --instance-termination-action=STOP \
  --machine-type=n1-standard-8
```

### 4. 自动扩缩容

未使用时缩减资源：

```bash
# GKE cluster autoscaling
gcloud container clusters update ml-cluster \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=10 \
  --zone=us-central1-a

# Instance group autoscaling
gcloud compute instance-groups managed set-autoscaling ml-inference-group \
  --max-num-replicas=10 \
  --min-num-replicas=1 \
  --target-cpu-utilization=0.7 \
  --zone=us-central1-a
```

### 5. 存储生命周期管理

自动将数据迁移到更便宜的存储类别：

```bash
# Lifecycle policy (from earlier)
# Standard → Nearline (30 days) → Coldline (90 days) → Delete (365 days)

# Savings example:
# 1 TB for 1 year:
# - All Standard: $240
# - With lifecycle: $80 (67% savings)
```

### 6. 预算告警

设置账单告警：

```bash
# Create budget (via console)
# Billing → Budgets & alerts → Create budget

# Set thresholds:
# - 50% of budget: Email alert
# - 90% of budget: Email alert + Pub/Sub notification
# - 100% of budget: Emergency notification
```

### 7. 成本监控

```bash
# Install cost management tool
pip install google-cloud-billing

# View current costs
gcloud billing accounts list
gcloud billing projects describe my-project-id

# Export billing data to BigQuery for analysis
gcloud alpha billing accounts describe ACCOUNT_ID \
  --format="value(billingAccountName)"
```

### 成本优化检查清单

- [ ] 使用可抢占/Spot VM 训练（原文示例节省 60–91%）。
- [ ] 购买一年期或三年期 CUD（原文示例节省 33–57%）。
- [ ] 启用自动扩缩容（支持时，闲置缩容至零）。
- [ ] 使用存储生命周期策略（原文示例旧数据节省 67%）。
- [ ] 合理调整实例规格，避免过度供应。
- [ ] 删除不再需要的资源（快照、磁盘、IP）。
- [ ] 使用区域级资源（原文认为比多区域资源更便宜）。
- [ ] 利用免费层（符合条件的长期免费资源）。
- [ ] 设置预算告警，尽早发现意外账单。
- [ ] 每周审查成本，尽早发现浪费。

---

## 动手练习

### 练习：在 GCP 上部署完整机器学习系统

**目标：** 使用以下架构部署图像分类模型：

```
User Request
    ↓
Cloud Load Balancer (with Cloud CDN)
    ↓
GKE Cluster (autoscaling 1-10 pods)
    ↓
Model Server (T4 GPU, loads model from Cloud Storage)
    ↓
Cloud Storage (model weights)
```

**要求：**
1. 使用可抢占 GKE 节点。
2. 启用自动扩缩容（CPU 利用率超过 70%）。
3. 实现健康检查。
4. 启用 Cloud CDN 进行缓存。
5. 使用 Cloud Monitoring 设置监控。
6. 估算月度成本（假设每月 100 万次请求）。

**步骤：**

1. **创建 Cloud Storage 存储桶并上传模型：**
   ```bash
   gsutil mb -l us-central1 gs://my-ml-exercise-bucket
   gsutil cp model.pth gs://my-ml-exercise-bucket/models/
   ```

2. **构建并推送 Docker 镜像：**
   ```bash
   # Build image
   docker build -t gcr.io/my-project/ml-model:v1 .

   # Push to Google Container Registry
   docker push gcr.io/my-project/ml-model:v1
   ```

3. **创建具有 GPU 节点的 GKE 集群：**
   ```bash
   gcloud container clusters create ml-exercise-cluster \
     --zone=us-central1-a \
     --machine-type=n1-standard-4 \
     --accelerator=type=nvidia-tesla-t4,count=1 \
     --num-nodes=2 \
     --enable-autoscaling \
     --min-nodes=1 \
     --max-nodes=10 \
     --preemptible
   ```

4. **将模型部署至 GKE：**
   ```bash
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   kubectl apply -f hpa.yaml
   ```

5. **设置负载均衡器与 Cloud CDN：**
   ```bash
   # Follow load balancer setup from earlier
   # Enable Cloud CDN
   ```

6. **配置监控：**
   ```bash
   # Set up Cloud Monitoring dashboard
   # Create alerts for high CPU, errors, latency
   ```

7. **测试并计算成本：**
   ```bash
   # Load test
   ab -n 10000 -c 50 http://LOAD_BALANCER_IP/predict

   # Calculate costs:
   # - GKE: 2 preemptible n1-standard-4 + T4
   # - Cloud Storage: 1 GB
   # - Load Balancer: 1M requests
   # - Cloud CDN: 500 GB egress
   # - Cloud Monitoring: Basic tier
   ```

**预计成本（每月 100 万次请求，原文示例）：**
- GKE 节点（可抢占）：2 × 0.07 美元/小时 × 730 小时 = 102 美元。
- Cloud Storage：1 GB × 0.020 美元 = 0.02 美元。
- 负载均衡器：100 万次请求 × 0.008 美元/千次 = 8 美元。
- Cloud CDN：500 GB × 0.08 美元/GB = 40 美元。
- **总计：约 150 美元/月。**

**额外挑战：**
- 添加 Cloud Armor（DDoS 防护）。
- 实现 A/B 测试（在模型版本之间分配流量）。
- 使用 Cloud Build 设置 CI/CD。
- 使用 Cloud Trace 添加分布式链路追踪。

> 译注：该成本示例未必包含 GPU 附加费用、集群管理费、负载均衡器固定费用及其他网络费用，不能作为实际部署报价。CDN 对 POST 推理请求一般不能直接按普通静态资源方式缓存，需明确可缓存的请求类型与授权边界。预算告警不等同于费用硬上限。

---

## 自我检查问题

1. **用于模型训练时，Compute Engine、GKE 与 Vertex AI 有何区别？**
   <details>
   <summary>答案</summary>

   - **Compute Engine：** 完整控制、自行管理，适合自定义环境。
   - **GKE：** 容器编排、自动扩缩容，适合生产模型服务。
   - **Vertex AI：** 托管服务、自动扩缩容，适合快速部署。
   </details>

2. **何时选择 TPU 而不是 GPU？**
   <details>
   <summary>答案</summary>

   选择 TPU 的场景：
   - 训练大型 TensorFlow 模型。
   - 使用 bfloat16 精度。
   - 长时间训练（具有潜在成本优势）。
   - 需要高矩阵乘法吞吐量。

   选择 GPU 的场景：
   - 使用 PyTorch。
   - 需要自定义运算的灵活性。
   - 原型开发与实验。
   </details>

3. **如何节省 80% 的计算成本？**
   <details>
   <summary>答案</summary>

   - 使用可抢占/Spot VM（原文示例节省 60–91%）。
   - 实现检查点以支持容错。
   - 使用自动扩缩容（支持时闲置缩容至零）。
   - 购买承诺用量折扣（原文示例节省 33–57%）。
   </details>

4. **归档模型检查点最适合使用哪种存储类别？**
   <details>
   <summary>答案</summary>

   **Coldline** 或 **Archive** 存储：
   - Coldline：0.004 美元/GB/月（访问频率低于每季度一次）。
   - Archive：0.0012 美元/GB/月（访问频率低于每年一次）。
   - 使用生命周期策略自动转换存储类别。
   </details>

5. **如何在 GKE 上启用自动扩缩容？**
   <details>
   <summary>答案</summary>

   ```bash
   # Cluster autoscaler (nodes)
   gcloud container clusters update ml-cluster \
     --enable-autoscaling --min-nodes=1 --max-nodes=10

   # Horizontal Pod Autoscaler (pods)
   kubectl autoscale deployment ml-model \
     --cpu-percent=70 --min=2 --max=20
   ```
   </details>

---

## 补充资源

### 官方文档
- [GCP 机器学习文档](https://cloud.google.com/products/ai)
- [Vertex AI 文档](https://cloud.google.com/vertex-ai/docs)
- [GKE 文档](https://cloud.google.com/kubernetes-engine/docs)
- [TPU 文档](https://cloud.google.com/tpu/docs)

### 教程
- [GCP 机器学习速成课程](https://developers.google.com/machine-learning/crash-course)
- [Vertex AI 教程](https://cloud.google.com/vertex-ai/docs/tutorials)
- [GKE 机器学习服务指南](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)

### 工具
- [gcloud CLI](https://cloud.google.com/sdk/gcloud)
- [gsutil](https://cloud.google.com/storage/docs/gsutil)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)

### 成本管理
- [GCP 价格计算器](https://cloud.google.com/products/calculator)
- [成本管理工具](https://cloud.google.com/cost-management)
- [免费层详情](https://cloud.google.com/free)

### 社区
- [GCP 社区](https://cloud.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- [Reddit：r/googlecloud](https://www.reddit.com/r/googlecloud/)

---

## 总结

本课学习了：

- 正确设置 GCP 账号及 IAM 安全。
- 部署具有 GPU 的 Compute Engine 实例，用于机器学习训练。
- 使用 Cloud Storage 存储数据集及模型，并进行生命周期管理。
- 使用 TPU 加速 TensorFlow 训练。
- 在 GKE 上部署模型并实施自动扩缩容。
- 使用 Vertex AI 托管训练与服务。
- 配置 VPC 网络及负载均衡。
- 使用可抢占 VM、CUD 与生命周期策略优化成本。

**核心要点：**
- GCP 在 TensorFlow 工作负载与 TPU 访问方面具有优势。
- 原文示例中可抢占 VM 可节省 60–91% 的计算成本。
- 使用 GKE 实现自动扩缩容的生产模型服务。
- Vertex AI 简化机器学习工作流管理。
- 原文示例中 Cloud Storage 生命周期策略可为旧数据节省 67% 的存储成本。

**后续步骤：**
- 完成动手练习。
- 探索面向 MLOps 的 Vertex AI Pipelines。
- 学习 GKE 上的 Kubeflow。
- 进入第 04 课：面向机器学习基础设施的 Azure。

---

**预计完成时间：** 7 小时（含动手练习）。
**难度：** 中级。
**下一课：** [04-azure-ml-infrastructure.md](./04-azure-ml-infrastructure.md)

> 译注：本课命令、代码块、配置及其中英文注释全部保留原文，未逐一运行测试。价格、优惠幅度、产品版本及可用性需以实际区域的当前官方信息为准。完成实验后应清理创建的集群、实例、Endpoint、负载均衡及其他计费资源。
