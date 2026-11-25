# 第 06 课：Kubernetes 中的存储与持久化

## 学习目标
完成本课后，你将能够：
- 理解 Kubernetes 存储概念（Volume、PersistentVolume、PersistentVolumeClaim）。
- 为 ML 工作负载配置不同类型的数据卷。
- 使用 StatefulSet 实现有状态 ML 应用。
- 为 ML 数据集、模型及检查点设计存储策略。
- 使用 StorageClass 实现动态供应。
- 优化训练及推理的存储性能。
- 处理 ML 数据的备份与灾难恢复。

## 前置条件
- 完成第 01–05 课（Kubernetes 基础与网络）。
- 理解 Linux 文件系统。
- 熟悉云存储（S3、GCS、Azure Blob）。
- 基本理解 ML 训练工作流。

## 导论

存储对 ML 基础设施至关重要：
- **训练数据：** 数据集可能达到 TB 级别。
- **模型检查点：** 训练期间 Pod 重启后仍需保留。
- **模型产物：** 训练完成的模型需要持久存储。
- **日志与指标：** 实验追踪需要持久化存储。
- **推理缓存：** 使用缓存结果加快预测。

**挑战：**
- Pod 具有临时性（Pod 被替换后本地临时数据可能丢失）。
- 多节点集群需要共享存储。
- 性能：缓慢的 I/O 可能成为 GPU 瓶颈。
- 成本：高速存储（NVMe SSD）价格较高。

**实际案例（原文列举，未独立核实）：**
- **OpenAI：** 将训练检查点存储在分布式文件系统上。
- **Uber：** 将持久卷用于 ML 模型注册中心与特征存储。
- **Spotify：** 在 K8s PersistentVolume 中持久化 ML 实验数据。
- **Netflix：** 将推荐模型存储在由 S3 支持的持久存储中。

## 1. Kubernetes 存储概念

### 1.1 Volume 与 PersistentVolume

**Volume（数据卷）：**
- 在 Pod 规格中定义。
- 临时卷的生命周期与 Pod 绑定（随 Pod 删除）。
- 简单，但临时卷不具备持久性。

**PersistentVolume（PV，持久卷）：**
- 集群范围的存储资源。
- 独立的生命周期（删除 Pod 后仍可保留）。
- 可以按照回收策略回收或保留。

**PersistentVolumeClaim（PVC，持久卷声明）：**
- 用户发出的存储请求。
- 为用户抽象底层存储细节。
- 与匹配的 PV 绑定。

**架构：**

```
┌─────────────────────────────────────────────────┐
│                    Cluster                      │
│                                                 │
│  ┌───────────────┐         ┌────────────────┐  │
│  │  User/Pod     │         │ StorageClass   │  │
│  │               │         │ (AWS EBS, etc) │  │
│  └───────┬───────┘         └────────┬───────┘  │
│          │                          │          │
│          │ 1. Request               │ 4. Auto  │
│          │    Storage               │    Provision│
│          ▼                          ▼          │
│  ┌──────────────┐          ┌────────────────┐  │
│  │    PVC       │ 2. Bind  │       PV       │  │
│  │ (100Gi SSD)  │◄─────────┤ (100Gi EBS)    │  │
│  └──────┬───────┘          └────────┬───────┘  │
│         │                           │          │
│         │ 3. Mount                  │ 5. Attach│
│         ▼                           ▼          │
│  ┌──────────────┐          ┌────────────────┐  │
│  │    Pod       │          │  Cloud Storage │  │
│  │ /data → PVC  │          │  (AWS EBS vol) │  │
│  └──────────────┘          └────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 1.2 数据卷类型

**ML 常见数据卷类型：**

| 数据卷类型 | 使用场景 | 性能（原文评价） | 持久性 | 共享访问 |
|---|---|---|---|---|
| emptyDir | 临时工作空间 | 高 | 否 | 同一 Pod |
| hostPath | 访问节点文件系统（开发） | 很高 | 节点级 | 同一节点 |
| PVC（EBS/PD） | 模型检查点、单节点工作负载 | 中 | 是 | 通常 RWO |
| PVC（EFS 等） | 共享数据集、多 Pod | 中 | 是 | 支持 RWX |
| NFS | 传统共享存储 | 中低 | 是 | 支持 RWX |
| CSI（S3/GCS） | 大规模数据集、对象存储 | 不固定 | 是 | 取决于驱动能力 |

## 2. 基本数据卷

### 2.1 emptyDir（临时存储）

**使用场景：** 数据预处理的临时工作空间、临时模型文件。

```yaml
# emptydir-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-with-scratch
spec:
  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    command: ["python", "train.py"]
    volumeMounts:
    - name: scratch
      mountPath: /tmp/scratch  # Fast temporary storage

  volumes:
  - name: scratch
    emptyDir:
      sizeLimit: 50Gi  # Limit size to 50GB
      medium: Memory   # Use RAM instead of disk (faster, but expensive)
```

**特点：**
- Pod 分配至节点时创建。
- **Pod 被移除时删除**（不具备持久性！）。
- 可以使用节点磁盘或 RAM（`medium: Memory`）。
- 适合预处理流水线、临时缓存。

### 2.2 hostPath（节点文件系统）

**使用场景：** 访问 GPU 节点的本地 SSD，实现快速 I/O。

```yaml
# hostpath-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-with-local-ssd
spec:
  nodeSelector:
    storage: local-ssd  # Schedule on nodes with local SSD

  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    volumeMounts:
    - name: local-ssd
      mountPath: /data

  volumes:
  - name: local-ssd
    hostPath:
      path: /mnt/disks/ssd0  # Path on node
      type: Directory
```

**注意：**
- **不可移植**（绑定特定节点）。
- **不保证持久性**（节点故障可能导致数据丢失）。
- **安全风险**（可以访问宿主机文件系统）。
- 仅用于开发，或能够控制 Pod 调度且充分评估风险的环境。

## 3. PersistentVolume 与 PersistentVolumeClaim

### 3.1 静态供应（手动）

**步骤 1：管理员创建 PersistentVolume**

```yaml
# pv-manual.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ml-datasets-pv
spec:
  capacity:
    storage: 500Gi
  accessModes:
  - ReadWriteOnce  # Single pod can mount read-write
  persistentVolumeReclaimPolicy: Retain  # Keep data after PVC deletion
  storageClassName: manual
  hostPath:  # Using hostPath for example (use cloud storage in production)
    path: /mnt/data/ml-datasets
```

**步骤 2：用户创建 PersistentVolumeClaim**

```yaml
# pvc-manual.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ml-datasets-pvc
  namespace: ml-training
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 500Gi
  storageClassName: manual
```

**步骤 3：Pod 使用 PVC**

```yaml
# pod-with-pvc.yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-pod
  namespace: ml-training
spec:
  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    command: ["python", "train.py"]
    args: ["--data-dir=/data/imagenet"]
    volumeMounts:
    - name: datasets
      mountPath: /data

  volumes:
  - name: datasets
    persistentVolumeClaim:
      claimName: ml-datasets-pvc
```

### 3.2 动态供应（自动）

**推荐方法：** 使用 StorageClass 自动供应存储。

**步骤 1：创建 StorageClass（或使用已有的 StorageClass）**

```yaml
# storageclass-aws-ebs.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com  # AWS EBS CSI driver
parameters:
  type: gp3  # General Purpose SSD v3
  iops: "3000"
  throughput: "125"  # MB/s
  encrypted: "true"
allowVolumeExpansion: true  # Allow resizing
reclaimPolicy: Delete  # Delete EBS volume when PVC is deleted
```

**步骤 2：创建 PVC（自动创建 PV）**

```yaml
# pvc-dynamic.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-checkpoints-pvc
  namespace: ml-training
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd  # Use StorageClass
  resources:
    requests:
      storage: 100Gi
```

**结果：**
- Kubernetes 通过供应器自动供应 100Gi gp3 EBS 存储卷。
- 创建 PV 并与 PVC 绑定。
- 删除 PVC 后，EBS 卷依据回收策略 Delete 进行删除。

### 3.3 访问模式

| 访问模式 | 缩写 | 描述 | 使用场景 |
|---|---|---|---|
| ReadWriteOnce | RWO | 单个节点以读写方式挂载 | 训练检查点 |
| ReadOnlyMany | ROX | 多个节点以只读方式挂载 | 共享数据集（读） |
| ReadWriteMany | RWX | 多个节点以读写方式挂载 | 分布式训练日志 |
| ReadWriteOncePod | RWOP | 单个 Pod 独占读写挂载（1.22 起引入） | 需要独占访问的工作负载 |

**示例：共享数据集（所有训练 Pod 只读）**

```yaml
# pvc-shared-dataset.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: imagenet-dataset-pvc
spec:
  accessModes:
  - ReadOnlyMany  # Multiple pods can read
  resources:
    requests:
      storage: 1Ti
  storageClassName: aws-efs  # EFS supports ReadOnlyMany
```

## 4. ML 工作负载的 StorageClass

### 4.1 AWS EBS StorageClass

**通用型（均衡）：**

```yaml
# sc-aws-gp3.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-balanced
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"      # 3000 IOPS baseline
  throughput: "125" # 125 MB/s baseline
  encrypted: "true"
allowVolumeExpansion: true
```

**高性能型（用于 GPU 训练）：**

```yaml
# sc-aws-io2.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: io2-high-performance
provisioner: ebs.csi.aws.com
parameters:
  type: io2
  iops: "64000"     # Up to 64,000 IOPS
  encrypted: "true"
allowVolumeExpansion: true
```

**成本优化型（用于归档）：**

```yaml
# sc-aws-st1.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: st1-throughput-optimized
provisioner: ebs.csi.aws.com
parameters:
  type: st1  # Throughput Optimized HDD (cheap, sequential I/O)
  encrypted: "true"
```

### 4.2 Google Cloud PD StorageClass

```yaml
# sc-gcp-ssd.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd-gcp
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd  # SSD Persistent Disk
  replication-type: regional-pd  # Replicated across zones
allowVolumeExpansion: true
```

### 4.3 共享存储（EFS/GCS/Azure Files）

**AWS EFS（ReadWriteMany）：**

```yaml
# sc-aws-efs.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: aws-efs
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap  # Access Point mode
  fileSystemId: fs-0123456789abcdef  # Your EFS filesystem ID
  directoryPerms: "700"
```

**使用场景：** 多个训练 Pod 同时访问共享数据集。

```yaml
# pvc-efs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-datasets-pvc
spec:
  accessModes:
  - ReadWriteMany  # Multiple pods can read/write
  storageClassName: aws-efs
  resources:
    requests:
      storage: 2Ti
```

## 5. ML 应用中的 StatefulSet

### 5.1 何时使用 StatefulSet

**使用 StatefulSet 的场景：**
- 每个副本需要独立的持久存储（分布式训练）。
- Pod 需要稳定的网络身份（参数服务器）。
- 需要按顺序启动与关闭。

**示例：**
- 使用 Horovod/DeepSpeed 进行分布式训练。
- ML 特征存储（Feast）。
- 具有缓存层的模型服务。
- 实验追踪服务器（MLflow）。

### 5.2 StatefulSet 示例：分布式训练

```yaml
# statefulset-distributed-training.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: distributed-training
  namespace: ml-training
spec:
  serviceName: training-headless  # Headless service for DNS
  replicas: 4  # 4 training workers

  selector:
    matchLabels:
      app: distributed-training

  template:
    metadata:
      labels:
        app: distributed-training
    spec:
      containers:
      - name: training
        image: horovod/horovod:0.28.1-tf2.12.0-torch2.0.0-mxnet1.9.1-py3.10-gpu
        command: ["horovodrun"]
        args:
          - "-np"
          - "4"
          - "python"
          - "train_distributed.py"
          - "--checkpoint-dir=/checkpoints"

        resources:
          limits:
            nvidia.com/gpu: 1

        volumeMounts:
        - name: checkpoints
          mountPath: /checkpoints  # Each pod gets its own storage

        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name

  volumeClaimTemplates:  # Auto-create PVC for each replica
  - metadata:
      name: checkpoints
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
```

**结果：**
- 创建四个 Pod：`distributed-training-0`、`distributed-training-1`、`distributed-training-2`、`distributed-training-3`。
- 创建四个 PVC：`checkpoints-distributed-training-0`、`checkpoints-distributed-training-1` 等。
- 每个 Pod 具有稳定的主机名，例如 `distributed-training-0.training-headless.ml-training.svc.cluster.local`。

**Headless Service（用于 DNS）：**

```yaml
# headless-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: training-headless
  namespace: ml-training
spec:
  clusterIP: None  # Headless service (no cluster IP)
  selector:
    app: distributed-training
  ports:
  - port: 12345
    name: communication
```

## 6. ML 工作流的存储策略

### 6.1 训练数据存储

**策略 1：将数据集预加载到高速 PVC**

```yaml
# dataset-loader-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: load-imagenet-dataset
spec:
  template:
    spec:
      containers:
      - name: downloader
        image: amazon/aws-cli
        command: ["sh", "-c"]
        args:
          - |
            aws s3 sync s3://my-bucket/imagenet/ /data/imagenet/
        volumeMounts:
        - name: dataset
          mountPath: /data
      volumes:
      - name: dataset
        persistentVolumeClaim:
          claimName: imagenet-pvc
      restartPolicy: OnFailure
```

**策略 2：从对象存储（S3/GCS）流式读取**

```yaml
# training-with-s3-streaming.yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-s3-streaming
spec:
  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    command: ["python", "train_with_s3.py"]
    env:
    - name: S3_BUCKET
      value: "s3://my-datasets/imagenet"
    - name: AWS_REGION
      value: "us-west-2"
    # No volume needed - stream directly from S3 in code
```

**取舍：**

| 方案 | 优点 | 缺点 | 适用场景 |
|---|---|---|---|
| 预加载至 PVC | 训练快、I/O 稳定 | 存储费用较高、准备较慢 | 需要高 IOPS |
| 从 S3 流式读取 | 较便宜、无需预加载 | 可能较慢、依赖网络 | 大型数据集、批处理 |

### 6.2 模型检查点存储

**最佳实践：** 为检查点使用独立 PVC。

```yaml
# training-with-checkpoints.yaml
apiVersion: v1
kind: Pod
metadata:
  name: resnet-training
spec:
  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    command: ["python", "train.py"]
    args:
      - "--checkpoint-dir=/checkpoints"
      - "--checkpoint-interval=1000"  # Save every 1000 steps

    volumeMounts:
    - name: datasets
      mountPath: /data
      readOnly: true
    - name: checkpoints
      mountPath: /checkpoints

  volumes:
  - name: datasets
    persistentVolumeClaim:
      claimName: imagenet-pvc  # Read-only dataset
  - name: checkpoints
    persistentVolumeClaim:
      claimName: resnet-checkpoints-pvc  # Writable checkpoint storage
```

**为什么使用独立 PVC？**
- 数据集可以共享（ReadOnlyMany）。
- 检查点按任务划分（ReadWriteOnce）。
- 更容易管理生命周期（删除检查点而保留数据集）。

### 6.3 模型产物存储

**将最终训练完成的模型存入持久化注册中心：**

```yaml
# model-registry-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-registry-pvc
  namespace: ml-platform
spec:
  accessModes:
  - ReadWriteMany  # Multiple pods can read models
  storageClassName: aws-efs  # Shared storage
  resources:
    requests:
      storage: 500Gi
```

**训练任务上传至注册中心：**

```yaml
# training-with-upload.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: train-and-upload
spec:
  template:
    spec:
      containers:
      - name: training
        image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
        command: ["sh", "-c"]
        args:
          - |
            python train.py
            cp /checkpoints/best_model.pth /registry/models/resnet50-v1.2.pth
        volumeMounts:
        - name: checkpoints
          mountPath: /checkpoints
        - name: registry
          mountPath: /registry

      volumes:
      - name: checkpoints
        emptyDir: {}  # Temporary checkpoints
      - name: registry
        persistentVolumeClaim:
          claimName: model-registry-pvc  # Persistent model storage

      restartPolicy: OnFailure
```

## 7. 性能优化

### 7.1 检测 I/O 瓶颈

**症状：** 训练期间 GPU 利用率低于 50%。

**诊断：**

```bash
# Check pod I/O stats
kubectl exec <training-pod> -- iostat -x 1 5

# Output:
# Device  r/s   w/s  rkB/s  wkB/s  %util
# sda     450   120  15000  5000   99%   <-- Disk is saturated!

# Check if data loading is slow
kubectl logs <training-pod> | grep "data loading time"
```

**解决方案：**

1. **使用更快的 StorageClass：**
   ```yaml
   storageClassName: io2-high-performance  # Switch from gp3 to io2
   ```

2. **增加 DataLoader Worker 数量：**
   ```python
   DataLoader(dataset, batch_size=64, num_workers=8)  # More parallel loading
   ```

3. **预取数据至 RAM：**
   ```python
   DataLoader(dataset, batch_size=64, pin_memory=True)  # Pin to GPU memory
   ```

4. **使用本地 SSD 存储数据集：**
   ```yaml
   volumeMounts:
   - name: local-ssd
     mountPath: /data
   volumes:
   - name: local-ssd
     hostPath:
       path: /mnt/disks/ssd0  # Local NVMe SSD
   ```

### 7.2 存储性能层级

**根据工作负载选择（原文规格与价格示例）：**

| 层级 | IOPS | 吞吐量 | 美元/GB/月 | 使用场景 |
|---|---:|---|---:|---|
| AWS io2 | 64,000 | 1,000 MB/s | 0.125 | GPU 训练（高速数据集） |
| AWS gp3 | 16,000 | 1,000 MB/s | 0.08 | 通用 ML 工作负载 |
| AWS EFS | 7,000+ | 3+ GB/s | 0.30 | 共享数据集（RWX） |
| AWS st1（HDD） | 500 | 500 MB/s | 0.045 | 归档、批量推理 |
| 本地 NVMe | 500,000+ | 7,000 MB/s | 不固定 | 极高性能 |

## 8. 备份与灾难恢复

### 8.1 VolumeSnapshot（卷快照）

**创建 PVC 的快照：**

```yaml
# volumesnapshot.yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: resnet-checkpoint-snapshot
  namespace: ml-training
spec:
  volumeSnapshotClassName: csi-aws-vsc  # Snapshot class
  source:
    persistentVolumeClaimName: resnet-checkpoints-pvc
```

**从快照恢复：**

```yaml
# pvc-from-snapshot.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: resnet-checkpoints-restored
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd
  dataSource:
    name: resnet-checkpoint-snapshot  # Restore from snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  resources:
    requests:
      storage: 50Gi
```

### 8.2 备份至对象存储

**定期备份任务：**

```yaml
# backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-model-registry
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: amazon/aws-cli
            command: ["sh", "-c"]
            args:
              - |
                aws s3 sync /registry s3://my-backups/model-registry-$(date +%Y-%m-%d)/
            volumeMounts:
            - name: registry
              mountPath: /registry
              readOnly: true
          volumes:
          - name: registry
            persistentVolumeClaim:
              claimName: model-registry-pvc
          restartPolicy: OnFailure
```

## 9. 动手练习：使用持久化存储进行 ML 训练

**目标：** 部署一个训练任务，满足：
- 将数据集从 S3 加载至 PVC。
- 将检查点保存至独立 PVC。
- 将最终模型上传至模型注册中心。

**步骤 1：创建 PVC**

```yaml
# ml-training-pvcs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: training-dataset-pvc
  namespace: ml-training
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: gp3-balanced
  resources:
    requests:
      storage: 100Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: training-checkpoints-pvc
  namespace: ml-training
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 50Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-registry-pvc
  namespace: ml-training
spec:
  accessModes:
  - ReadWriteMany
  storageClassName: aws-efs
  resources:
    requests:
      storage: 500Gi
```

**步骤 2：加载数据集（一次性任务）**

```yaml
# dataset-loader.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: load-cifar10-dataset
  namespace: ml-training
spec:
  template:
    spec:
      containers:
      - name: downloader
        image: python:3.10
        command: ["sh", "-c"]
        args:
          - |
            pip install torchvision
            python -c "
            from torchvision import datasets
            datasets.CIFAR10(root='/data', train=True, download=True)
            datasets.CIFAR10(root='/data', train=False, download=True)
            "
        volumeMounts:
        - name: dataset
          mountPath: /data
      volumes:
      - name: dataset
        persistentVolumeClaim:
          claimName: training-dataset-pvc
      restartPolicy: Never
```

**步骤 3：训练任务**

```yaml
# training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: cifar10-training
  namespace: ml-training
spec:
  template:
    spec:
      containers:
      - name: training
        image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
        command: ["python", "train_cifar10.py"]
        args:
          - "--data-dir=/data"
          - "--checkpoint-dir=/checkpoints"
          - "--output-dir=/registry/models/cifar10-resnet18-v1.0"
          - "--epochs=100"

        resources:
          limits:
            nvidia.com/gpu: 1

        volumeMounts:
        - name: dataset
          mountPath: /data
          readOnly: true
        - name: checkpoints
          mountPath: /checkpoints
        - name: registry
          mountPath: /registry

      volumes:
      - name: dataset
        persistentVolumeClaim:
          claimName: training-dataset-pvc
      - name: checkpoints
        persistentVolumeClaim:
          claimName: training-checkpoints-pvc
      - name: registry
        persistentVolumeClaim:
          claimName: model-registry-pvc

      restartPolicy: OnFailure
```

**步骤 4：部署并监控**

```bash
kubectl create namespace ml-training

kubectl apply -f ml-training-pvcs.yaml
kubectl apply -f dataset-loader.yaml

# Wait for dataset to load
kubectl wait --for=condition=complete job/load-cifar10-dataset -n ml-training

# Start training
kubectl apply -f training-job.yaml

# Monitor training
kubectl logs -f job/cifar10-training -n ml-training

# Check checkpoints are being saved
kubectl exec deployment/<training-pod> -n ml-training -- ls -lh /checkpoints

# After training completes, verify model is in registry
kubectl exec deployment/<any-pod> -n ml-training -- ls -lh /registry/models/cifar10-resnet18-v1.0
```

## 10. 总结

### 核心要点

**数据卷类型：**
- **emptyDir：** 临时工作空间（随 Pod 删除）。
- **PVC：** 申请持久化存储（删除 Pod 后仍可保留）。
- **hostPath：** 节点本地存储（快但不可移植）。

**PersistentVolume 与 PersistentVolumeClaim：**
- PV：集群级存储资源。
- PVC：用户发出的存储请求。
- StorageClass：自动化 PV 供应。

**访问模式：**
- **RWO：** 单节点读写（训练检查点）。
- **ROX：** 多节点只读（共享数据集）。
- **RWX：** 多节点读写（分布式训练日志）。

**StatefulSet：**
- 用于分布式训练、参数服务器等场景。
- 每个副本获得独立 PVC（使用 volumeClaimTemplates 时）。
- 稳定的网络身份。

**性能：**
- 针对 GPU 工作负载选择快速存储（io2、本地 NVMe）。
- 使用 iostat 监控 I/O 利用率。
- 比较将数据集预加载至高速 PVC 与从 S3 流式读取的取舍。

**最佳实践：**
- 为数据集、检查点和模型设置独立 PVC。
- 使用 VolumeSnapshot 创建备份。
- 实施定期备份至 S3/GCS。

## 自我检查问题

1. Volume 与 PersistentVolume 有什么区别？
2. 何时使用 RWO，何时使用 RWX？
3. StorageClass 的动态供应如何工作？
4. 为什么有时使用 StatefulSet 而非 Deployment 进行分布式训练？
5. GPU 训练任务应选择什么类型的存储？为什么？
6. 如何备份 ML 模型检查点？
7. emptyDir 与 hostPath 有什么区别？
8. 如何排查训练期间数据加载缓慢的问题？

## 补充资源

- [Kubernetes 存储文档](https://kubernetes.io/docs/concepts/storage/)
- [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)
- [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [VolumeSnapshot](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)

---

**下一课：** Helm 包管理器。

> 译注：原文将 RWO 解释为单 Pod，准确语义是单节点读写，同一节点上的多个 Pod 可能共享；需要单 Pod 独占时应使用受支持的 RWOP。访问模式不等于完整权限控制。对象存储 CSI 驱动的文件系统语义与读写能力因实现而异。VolumeSnapshot 需驱动支持，并应考虑应用一致性和异地恢复，不能代替恢复演练。PVC 删除后的行为取决于回收策略及驱动；StatefulSet PVC 也可能在 Pod 删除后保留。原文性能与价格数字未核实当前值，低 GPU 利用率也可能来自 CPU、通信等其他瓶颈。全部原始代码块与英文注释保留，未运行其中的存储供应及删除命令。
