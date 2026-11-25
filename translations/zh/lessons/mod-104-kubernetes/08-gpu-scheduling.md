# 第 08 课：Kubernetes 中的 GPU 调度

## 学习目标
完成本课后，你将能够：
- 理解 Kubernetes 如何管理 GPU 资源。
- 安装与配置 NVIDIA GPU Operator。
- 将 ML 工作负载调度到支持 GPU 的节点。
- 实现 GPU 资源请求与限制。
- 为 GPU 工作负载使用节点亲和性与污点。
- 理解 GPU 共享策略（时间切片、MIG）。
- 监控 Kubernetes 集群中的 GPU 利用率。
- 排查常见 GPU 调度问题。

## 前置条件
- 完成第 01–04 课（Kubernetes 基础）。
- 理解 GPU 计算基础（原文引用模块 03 第 06 课）。
- 熟悉 Docker GPU 支持。
- 可以访问具有 GPU 节点的集群（或支持 GPU 的 minikube）。

## 导论

GPU 对现代 ML 基础设施十分重要，能够实现：
- **训练加速：** 原文举例深度学习训练比 CPU 快 10–100 倍。
- **推理优化：** 降低生产模型延迟。
- **成本效率：** 提高 ML 工作负载的单位成本吞吐量。
- **规模扩展：** 处理更大的模型与数据集。

然而，在 Kubernetes 中使用 GPU 需要专门配置：
- **设备插件：** 将 GPU 暴露为可调度资源。
- **驱动：** 节点需要安装 NVIDIA/AMD 等对应驱动。
- **资源管理：** 防止超额分配。
- **监控：** 追踪利用率与性能。

**实际案例（原文列举，未独立核实）：**
- **OpenAI：** 在 Kubernetes 上运行大规模 GPU 集群。
- **Spotify：** 为 ML 训练流水线使用 K8s GPU 调度。
- **Uber：** 每天通过 K8s 调度数千个 GPU 任务。
- **Netflix：** 在支持 GPU 的 K8s 上训练推荐模型。

## 1. Kubernetes 的 GPU 支持

### 1.1 Kubernetes 如何发现 GPU

Kubernetes 使用 **Device Plugin Framework（设备插件框架）** 暴露专用硬件：

```yaml
# Device plugins advertise resources to kubelet
# GPUs become schedulable resources like CPU/memory

Node Resources:
  cpu: 32 cores
  memory: 256Gi
  nvidia.com/gpu: 8        # GPUs advertised by device plugin
  nvidia.com/mig-1g.5gb: 56 # MIG instances (if enabled)
```

**架构：**

```
┌─────────────────────────────────────────┐
│           Kubernetes Node               │
│                                         │
│  ┌────────────┐      ┌──────────────┐  │
│  │  kubelet   │◄────►│ Device Plugin│  │
│  │            │      │  (NVIDIA)    │  │
│  └────────────┘      └──────┬───────┘  │
│                             │          │
│                             ▼          │
│                      ┌──────────────┐  │
│                      │ GPU Devices  │  │
│                      │ /dev/nvidia0 │  │
│                      │ /dev/nvidia1 │  │
│                      └──────────────┘  │
└─────────────────────────────────────────┘
```

### 1.2 NVIDIA GPU Operator

**NVIDIA GPU Operator** 自动化 K8s 中的 GPU 管理。

**功能：**
- 在节点上安装 NVIDIA 驱动。
- 部署 NVIDIA 设备插件。
- 配置容器运行时（containerd/Docker）。
- 使用 DCGM（Data Center GPU Manager，数据中心 GPU 管理器）设置 GPU 监控。
- 管理 GPU Feature Discovery（GFD，GPU 特性发现）。

**安装的组件：**
```yaml
Components:
  - NVIDIA Driver Container: Installs drivers on each node
  - NVIDIA Container Toolkit: Enables GPU access in containers
  - NVIDIA Device Plugin: Advertises GPUs to Kubernetes
  - NVIDIA DCGM Exporter: Exports GPU metrics to Prometheus
  - GPU Feature Discovery: Labels nodes with GPU capabilities
  - Node Feature Discovery: Detects node hardware features
```

## 2. 安装 NVIDIA GPU Operator

### 2.1 前置条件

**在 GPU 节点上：**
```bash
# 1. Verify GPU is present
lspci | grep -i nvidia
# Output: 00:1e.0 3D controller: NVIDIA Corporation Tesla V100 (rev a1)

# 2. Check kernel version (must be compatible)
uname -r
# Output: 5.10.0-18-amd64

# 3. Ensure nouveau driver is disabled (conflicts with NVIDIA)
lsmod | grep nouveau
# Should return nothing

# 4. Verify containerd is configured for GPUs
cat /etc/containerd/config.toml | grep nvidia
```

### 2.2 使用 Helm 安装 GPU Operator

```bash
# Add NVIDIA Helm repository
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

# Create namespace
kubectl create namespace gpu-operator

# Install GPU Operator
helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --set driver.enabled=true \
  --set toolkit.enabled=true \
  --set devicePlugin.enabled=true \
  --set dcgmExporter.enabled=true \
  --set gfd.enabled=true

# Watch installation
kubectl get pods -n gpu-operator -w
```

**预期输出：**
```
NAME                                       READY   STATUS    RESTARTS   AGE
gpu-feature-discovery-abcde                1/1     Running   0          2m
gpu-operator-1234567890-xyz                1/1     Running   0          3m
nvidia-container-toolkit-daemonset-fghij   1/1     Running   0          2m
nvidia-dcgm-exporter-klmno                 1/1     Running   0          2m
nvidia-device-plugin-daemonset-pqrst       1/1     Running   0          2m
nvidia-driver-daemonset-uvwxy              1/1     Running   0          5m
```

### 2.3 验证 GPU 节点

```bash
# Check node labels (added by GPU Feature Discovery)
kubectl get nodes --show-labels | grep nvidia

# Check node capacity
kubectl describe node <gpu-node-name> | grep nvidia.com/gpu

# Output:
#  nvidia.com/gpu:     8
#  nvidia.com/gpu:     8  (allocatable)

# View GPU details
kubectl describe node <gpu-node-name>
```

**自动添加的节点标签：**
```yaml
Labels:
  nvidia.com/cuda.driver.major=525
  nvidia.com/cuda.driver.minor=116
  nvidia.com/cuda.driver.rev=04
  nvidia.com/cuda.runtime.major=12
  nvidia.com/cuda.runtime.minor=0
  nvidia.com/gpu.count=8
  nvidia.com/gpu.product=Tesla-V100-SXM2-32GB
  nvidia.com/gpu.memory=32768
  nvidia.com/mig.strategy=single
```

## 3. 调度 GPU 工作负载

### 3.1 基础 GPU Pod

**请求一块 GPU：**

```yaml
# pytorch-training-gpu.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pytorch-training-gpu
spec:
  containers:
  - name: pytorch
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    command: ["python"]
    args: ["-c", "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU count: {torch.cuda.device_count()}')"]
    resources:
      limits:
        nvidia.com/gpu: 1  # Request 1 GPU
      requests:
        nvidia.com/gpu: 1
        memory: "16Gi"
        cpu: "4"
  restartPolicy: OnFailure
```

**部署并验证：**

```bash
kubectl apply -f pytorch-training-gpu.yaml
kubectl logs pytorch-training-gpu

# Output:
# CUDA available: True
# GPU count: 1
```

### 3.2 多 GPU 训练 Job

**为分布式训练请求多块 GPU：**

```yaml
# multi-gpu-training.yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-gpu-training
spec:
  containers:
  - name: distributed-training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    command: ["torchrun"]
    args:
      - "--nproc_per_node=4"  # 4 processes (one per GPU)
      - "train_distributed.py"
    resources:
      limits:
        nvidia.com/gpu: 4  # Request 4 GPUs
      requests:
        nvidia.com/gpu: 4
        memory: "64Gi"
        cpu: "16"
    volumeMounts:
    - name: training-data
      mountPath: /data
    - name: model-output
      mountPath: /output
  volumes:
  - name: training-data
    persistentVolumeClaim:
      claimName: training-data-pvc
  - name: model-output
    persistentVolumeClaim:
      claimName: model-output-pvc
  restartPolicy: OnFailure
```

### 3.3 GPU 推理 Deployment

**使用 GPU 进行生产 ML 推理：**

```yaml
# gpu-inference-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-inference-gpu
spec:
  replicas: 3  # 3 replicas, each gets 1 GPU
  selector:
    matchLabels:
      app: model-inference-gpu
  template:
    metadata:
      labels:
        app: model-inference-gpu
    spec:
      containers:
      - name: inference-server
        image: myregistry.io/bert-inference:v1.0
        ports:
        - containerPort: 8080
        env:
        - name: MODEL_PATH
          value: /models/bert-base
        - name: BATCH_SIZE
          value: "32"
        - name: CUDA_VISIBLE_DEVICES
          value: "0"  # Use first GPU
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "8Gi"
            cpu: "4"
          requests:
            nvidia.com/gpu: 1
            memory: "8Gi"
            cpu: "4"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: model-inference-gpu-service
spec:
  selector:
    app: model-inference-gpu
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

## 4. 节点亲和性与 GPU 调度

### 4.1 GPU 节点的 NodeSelector

**仅调度至支持 GPU 的节点：**

```yaml
# gpu-job-node-selector.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: gpu-job-node-selector
spec:
  template:
    spec:
      nodeSelector:
        nvidia.com/gpu.product: Tesla-V100-SXM2-32GB  # Specific GPU model
      containers:
      - name: training
        image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
        command: ["python", "train.py"]
        resources:
          limits:
            nvidia.com/gpu: 1
      restartPolicy: Never
```

### 4.2 用于高级调度的 NodeAffinity

**优先选择特定 GPU 类型，必要时回退至其他类型：**

```yaml
# gpu-affinity.yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-affinity-pod
spec:
  affinity:
    nodeAffinity:
      # REQUIRED: Must have GPU
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: nvidia.com/gpu.present
            operator: In
            values: ["true"]

      # PREFERRED: Prefer V100, but accept A100 or T4
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
          - key: nvidia.com/gpu.product
            operator: In
            values: ["Tesla-V100-SXM2-32GB"]
      - weight: 80
        preference:
          matchExpressions:
          - key: nvidia.com/gpu.product
            operator: In
            values: ["NVIDIA-A100-SXM4-40GB"]
      - weight: 50
        preference:
          matchExpressions:
          - key: nvidia.com/gpu.product
            operator: In
            values: ["Tesla-T4"]

  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    resources:
      limits:
        nvidia.com/gpu: 1
  restartPolicy: OnFailure
```

### 4.3 GPU 节点的 Taint 与 Toleration（污点与容忍）

**为 GPU 工作负载预留 GPU 节点：**

```bash
# Taint GPU nodes to prevent non-GPU pods from scheduling
kubectl taint nodes <gpu-node-name> nvidia.com/gpu=present:NoSchedule

# Verify taint
kubectl describe node <gpu-node-name> | grep Taints
# Output: Taints: nvidia.com/gpu=present:NoSchedule
```

**在 Pod 规格中容忍 GPU 污点：**

```yaml
# gpu-toleration.yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-toleration-pod
spec:
  tolerations:
  - key: "nvidia.com/gpu"
    operator: "Equal"
    value: "present"
    effect: "NoSchedule"

  containers:
  - name: training
    image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
    resources:
      limits:
        nvidia.com/gpu: 1
  restartPolicy: OnFailure
```

**结果：** 原文预期只有请求 GPU 且具有相应容忍的 Pod 才能调度至 GPU 节点。

> 译注：Taint/Toleration 本身不会强制 Pod 请求 GPU；它只决定 Pod 是否允许通过污点约束。要实现 GPU 节点独占使用，还需配合资源请求、节点选择约束与准入策略等机制。

## 5. GPU 共享策略

### 5.1 GPU 时间切片（Time-Slicing）

**问题：** GPU 价格较高，利用率不足会造成浪费。

**解决方案：** 时间切片允许多个 Pod 共享一块 GPU。

**配置时间切片：**

```yaml
# gpu-time-slicing-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: device-plugin-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    sharing:
      timeSlicing:
        resources:
        - name: nvidia.com/gpu
          replicas: 4  # Each GPU appears as 4 schedulable resources
```

**应用配置：**

```bash
kubectl apply -f gpu-time-slicing-config.yaml

# Restart device plugin to apply changes
kubectl rollout restart daemonset nvidia-device-plugin-daemonset -n gpu-operator

# Verify: each GPU now shows as 4 resources
kubectl describe node <gpu-node> | grep nvidia.com/gpu
# Output:
#  nvidia.com/gpu: 32  (8 GPUs × 4 replicas = 32 schedulable units)
```

**部署四个共享一块 GPU 的 Pod：**

```yaml
# time-sliced-inference.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shared-gpu-inference
spec:
  replicas: 4  # 4 pods share 1 physical GPU
  selector:
    matchLabels:
      app: shared-inference
  template:
    metadata:
      labels:
        app: shared-inference
    spec:
      containers:
      - name: inference
        image: myregistry.io/small-model-inference:v1
        resources:
          limits:
            nvidia.com/gpu: 1  # Each pod requests 1 "slice"
        env:
        - name: CUDA_VISIBLE_DEVICES
          value: "0"
  restartPolicy: Always
```

**注意：**
- 时间切片**不提供 GPU 显存隔离**。
- 单个 Pod 如果使用过多显存，可能影响其他 Pod。
- 适合显存使用可预测的推理工作负载。
- 密切监控 GPU 显存。

### 5.2 MIG（Multi-Instance GPU，多实例 GPU）

**什么是 MIG？**
- NVIDIA A100、A30、H100 等支持该特性的 GPU 可用。
- 将单块 GPU **硬件划分**为相互隔离的实例。
- 每个 MIG 实例拥有专用的显存与计算资源。

**MIG Profile（以 A100 40GB 为例）：**
```
Profile      | Instances | Memory/Instance | Use Case
-------------|-----------|-----------------|---------------------------
1g.5gb       | 7         | 5 GB            | Small inference, dev/test
2g.10gb      | 3         | 10 GB           | Medium models
3g.20gb      | 2         | 20 GB           | Large inference
4g.20gb      | 1         | 20 GB           | Training small models
7g.40gb      | 1         | 40 GB           | Full GPU (no partitioning)
```

**在 GPU 节点启用 MIG：**

```bash
# SSH to GPU node
nvidia-smi -mig 1  # Enable MIG mode

# Create MIG instances (example: 7 × 1g.5gb)
nvidia-smi mig -cgi 19,19,19,19,19,19,19  # Create 7 GPU instances
nvidia-smi mig -cci                        # Create compute instances

# Verify
nvidia-smi -L
# Output:
# GPU 0: NVIDIA A100 (UUID: GPU-xxx)
#   MIG 1g.5gb Device 0: (UUID: MIG-yyy-0)
#   MIG 1g.5gb Device 1: (UUID: MIG-yyy-1)
#   ...
```

**为 MIG 配置 GPU Operator：**

```yaml
# mig-strategy-config.yaml
helm upgrade gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --set mig.strategy=mixed \  # Support both MIG and non-MIG
  --set devicePlugin.enabled=true
```

**将工作负载调度至 MIG 实例：**

```yaml
# mig-inference-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mig-inference
spec:
  containers:
  - name: inference
    image: nvcr.io/nvidia/pytorch:23.01-py3
    resources:
      limits:
        nvidia.com/mig-1g.5gb: 1  # Request 1 MIG instance (1g.5gb profile)
      requests:
        nvidia.com/mig-1g.5gb: 1
        memory: "4Gi"
        cpu: "2"
  restartPolicy: OnFailure
```

**比较：**

| 特性 | 时间切片 | MIG |
|---|---|---|
| 隔离 | 无专用显存隔离（共享显存） | 硬件隔离 |
| 显存安全 | 无独立显存保障 | 专用显存 |
| GPU 支持 | 支持相应机制的 NVIDIA GPU | 支持 MIG 的型号（原文列举 A100、A30、H100） |
| 开销 | 上下文切换 | 硬件划分，无相应时间切片开销 |
| 使用场景 | 开发/测试、小模型 | 生产多租户 |
| 成本考虑 | 提高利用率 | 提高隔离能力 |

## 6. 监控 GPU 利用率

### 6.1 NVIDIA DCGM Exporter（Prometheus 指标）

**安装 DCGM Exporter（GPU Operator 包含该组件）：**

```bash
# Verify DCGM Exporter is running
kubectl get pods -n gpu-operator | grep dcgm

# Check metrics endpoint
kubectl port-forward -n gpu-operator <dcgm-exporter-pod> 9400:9400
curl localhost:9400/metrics | grep DCGM
```

**暴露的关键指标：**

```prometheus
# GPU utilization (0-100%)
DCGM_FI_DEV_GPU_UTIL{gpu="0",UUID="GPU-xxx"} 87

# GPU memory used (MB)
DCGM_FI_DEV_FB_USED{gpu="0",UUID="GPU-xxx"} 28672

# GPU temperature (Celsius)
DCGM_FI_DEV_GPU_TEMP{gpu="0",UUID="GPU-xxx"} 68

# GPU power usage (Watts)
DCGM_FI_DEV_POWER_USAGE{gpu="0",UUID="GPU-xxx"} 245

# GPU memory bandwidth utilization (%)
DCGM_FI_DEV_MEM_COPY_UTIL{gpu="0",UUID="GPU-xxx"} 42

# SM (Streaming Multiprocessor) occupancy
DCGM_FI_DEV_SM_OCCUPANCY{gpu="0",UUID="GPU-xxx"} 0.76
```

### 6.2 GPU 监控的 Grafana 仪表盘

**导入 NVIDIA DCGM 仪表盘：**

```bash
# Dashboard ID: 12239 (NVIDIA DCGM Exporter Dashboard)
# URL: https://grafana.com/grafana/dashboards/12239

# Or use this JSON config
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-gpu-dashboard
  namespace: monitoring
data:
  gpu-dashboard.json: |
    {
      "dashboard": {
        "title": "GPU Cluster Monitoring",
        "panels": [
          {
            "title": "GPU Utilization",
            "targets": [{"expr": "DCGM_FI_DEV_GPU_UTIL"}]
          },
          {
            "title": "GPU Memory Usage",
            "targets": [{"expr": "DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_TOTAL * 100"}]
          },
          {
            "title": "GPU Temperature",
            "targets": [{"expr": "DCGM_FI_DEV_GPU_TEMP"}]
          }
        ]
      }
    }
EOF
```

**针对 GPU 问题的 Prometheus 告警：**

```yaml
# gpu-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-gpu-alerts
  namespace: monitoring
data:
  gpu-alerts.rules: |
    groups:
    - name: gpu-alerts
      interval: 30s
      rules:
      # GPU temperature too high
      - alert: GPUHighTemperature
        expr: DCGM_FI_DEV_GPU_TEMP > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "GPU {{ $labels.gpu }} temperature is high"
          description: "GPU temperature is {{ $value }}°C"

      # GPU memory exhaustion
      - alert: GPUMemoryHigh
        expr: (DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_TOTAL) > 0.95
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "GPU {{ $labels.gpu }} memory is nearly full"
          description: "GPU memory usage is {{ $value | humanizePercentage }}"

      # GPU not being utilized (waste)
      - alert: GPUUnderutilized
        expr: DCGM_FI_DEV_GPU_UTIL < 10
        for: 1h
        labels:
          severity: info
        annotations:
          summary: "GPU {{ $labels.gpu }} is underutilized"
          description: "GPU utilization is only {{ $value }}%"
```

### 6.3 GPU 监控的 kubectl 插件

**安装 kubectl-gpu 插件：**

```bash
# Install krew (kubectl plugin manager)
curl -fsSL https://krew.sh/install | bash

# Install gpu plugin
kubectl krew install resource-capacity

# View GPU allocation across cluster
kubectl resource-capacity --pods --util --sort gpu.nvidia.com
```

**输出示例：**

```
NODE            GPU TOTAL   GPU ALLOCATED   GPU UTILIZATION
gpu-node-1      8           6 (75%)         87%
gpu-node-2      8           8 (100%)        92%
gpu-node-3      8           4 (50%)         45%
```

## 7. GPU 调度最佳实践

### 7.1 资源请求与限制

**GPU 的 requests 与 limits 应相等：**

```yaml
# ✅ GOOD: Request = Limit
resources:
  limits:
    nvidia.com/gpu: 2
  requests:
    nvidia.com/gpu: 2  # Must be equal
```

```yaml
# ❌ BAD: Request ≠ Limit (will cause errors)
resources:
  limits:
    nvidia.com/gpu: 2
  requests:
    nvidia.com/gpu: 1  # ERROR: GPUs are not overcommitable
```

**为什么？** Kubernetes 将 GPU 视为不可超额承诺的扩展资源（Extended Resource）。当同时设置 requests 与 limits 时，两者必须相等；仅设置 limits 时，通常将其作为请求值。

### 7.2 设置合理的 CPU 与内存

GPU 需要充足的 CPU 与内存，以免出现瓶颈：

```yaml
# ✅ GOOD: Balanced resources
resources:
  limits:
    nvidia.com/gpu: 1
    memory: "16Gi"  # Enough for model + batch
    cpu: "8"        # Enough for data preprocessing
  requests:
    nvidia.com/gpu: 1
    memory: "16Gi"
    cpu: "8"
```

```yaml
# ❌ BAD: GPU bottlenecked by CPU/memory
resources:
  limits:
    nvidia.com/gpu: 1
    memory: "2Gi"   # Too little memory
    cpu: "1"        # CPU will starve GPU
```

**经验规则（原文建议）：**
- **训练：** 每块 GPU 配置 8–16 核 CPU、32–64GB RAM。
- **推理：** 每块 GPU 配置 4–8 核 CPU、8–16GB RAM。

### 7.3 为关键工作负载使用 PodDisruptionBudget

保护长期运行的训练任务，减少自愿中断：

```yaml
# pdb-gpu-training.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: gpu-training-pdb
spec:
  minAvailable: 2  # At least 2 pods must remain during disruptions
  selector:
    matchLabels:
      app: distributed-training
```

### 7.4 使用节点池进行 GPU 隔离

**按使用场景分离 GPU 节点池：**

```bash
# Production inference: V100 GPUs
kubectl label nodes gpu-prod-1 gpu-prod-2 gpu-prod-3 \
  workload=inference \
  gpu-type=v100

# Training/experimentation: T4 GPUs
kubectl label nodes gpu-train-1 gpu-train-2 \
  workload=training \
  gpu-type=t4

# Development: Shared A100 with MIG
kubectl label nodes gpu-dev-1 \
  workload=development \
  gpu-type=a100-mig
```

**调度至合适的节点池：**

```yaml
# inference-deployment.yaml
spec:
  template:
    spec:
      nodeSelector:
        workload: inference
        gpu-type: v100
      containers:
      - name: inference
        resources:
          limits:
            nvidia.com/gpu: 1
```

### 7.5 实施资源配额

防止团队耗尽 GPU 资源：

```yaml
# gpu-resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: gpu-quota-team-ml
  namespace: team-ml
spec:
  hard:
    requests.nvidia.com/gpu: "16"  # Max 16 GPUs for team-ml
    limits.nvidia.com/gpu: "16"
    pods: "50"
```

```yaml
# gpu-limit-range.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: gpu-limit-range
  namespace: team-ml
spec:
  limits:
  - max:
      nvidia.com/gpu: "4"  # Max 4 GPUs per pod
    min:
      nvidia.com/gpu: "1"  # Min 1 GPU per pod
    type: Container
```

## 8. 排查 GPU 调度问题

### 8.1 Pod 卡在 Pending 状态

**症状：**

```bash
kubectl get pods
# NAME                READY   STATUS    RESTARTS   AGE
# gpu-training-pod    0/1     Pending   0          10m
```

**诊断：**

```bash
kubectl describe pod gpu-training-pod | grep -A 10 Events

# Common reasons:
# 1. Insufficient GPU resources
#    Warning  FailedScheduling  pod unschedulable: Insufficient nvidia.com/gpu
#
# 2. No nodes with GPUs
#    Warning  FailedScheduling  no nodes available with label nvidia.com/gpu.present=true
#
# 3. Taints not tolerated
#    Warning  FailedScheduling  node(s) had taint {nvidia.com/gpu: present}, that the pod didn't tolerate
```

**解决方案：**

```bash
# 1. Check GPU availability across cluster
kubectl describe nodes | grep -A 5 "nvidia.com/gpu"

# 2. Verify GPU operator is running
kubectl get pods -n gpu-operator

# 3. Check if GPU nodes are cordoned
kubectl get nodes | grep SchedulingDisabled

# 4. Review pod tolerations and node selectors
kubectl get pod gpu-training-pod -o yaml | grep -A 10 tolerations
```

### 8.2 容器中无法检测到 GPU

**症状：**

```python
import torch
print(torch.cuda.is_available())  # False
```

**诊断：**

```bash
# 1. Verify GPU is allocated to pod
kubectl describe pod <pod-name> | grep nvidia.com/gpu
# Should show: nvidia.com/gpu: 1

# 2. Check container runtime configuration
kubectl exec <pod-name> -- nvidia-smi
# Should show GPU details

# 3. Verify NVIDIA container toolkit
kubectl exec <pod-name> -- ls -la /dev/nvidia*
# Should list: /dev/nvidia0, /dev/nvidiactl, /dev/nvidia-uvm
```

**解决方案：**

```bash
# 1. Ensure nvidia-container-toolkit is installed on nodes
ssh <node> "which nvidia-container-toolkit"

# 2. Verify containerd runtime configuration
ssh <node> "cat /etc/containerd/config.toml | grep nvidia"

# 3. Restart device plugin daemonset
kubectl rollout restart daemonset nvidia-device-plugin-daemonset -n gpu-operator

# 4. Check pod spec includes GPU resource request
kubectl get pod <pod-name> -o yaml | grep -A 5 resources
```

### 8.3 GPU 显存不足（OOM）

**症状：**

```bash
kubectl logs <pod-name>
# torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB
```

**诊断：**

```bash
# Check GPU memory usage
kubectl exec <pod-name> -- nvidia-smi

# +-----------------------------------------------------------------------------+
# | Processes:                                                                  |
# |  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
# |        ID   ID                                                   Usage      |
# |=============================================================================|
# |    0   N/A  N/A      1234      C   python                          31000MiB |
# +-----------------------------------------------------------------------------+
```

**解决方案：**

```yaml
# 1. Reduce batch size or model size in code

# 2. Request more GPU memory (use A100 instead of V100)
spec:
  nodeSelector:
    nvidia.com/gpu.product: NVIDIA-A100-SXM4-80GB  # 80GB model
  resources:
    limits:
      nvidia.com/gpu: 1

# 3. Use gradient accumulation (training)
# Accumulate gradients over multiple batches to simulate larger batch sizes

# 4. Use MIG for smaller workloads
resources:
  limits:
    nvidia.com/mig-3g.20gb: 1  # Use 20GB MIG instance instead of full GPU
```

### 8.4 GPU 利用率较低

**症状：**

尽管训练任务正在运行，GPU 利用率仍只有 15–30%。

**诊断：**

```bash
# Check if CPU/memory is bottlenecking
kubectl top pod <pod-name>
# NAME           CPU(cores)   MEMORY(bytes)
# training-pod   7950m        15Gi  # CPU maxed out at 8 cores

# Check I/O wait
kubectl exec <pod-name> -- iostat -x 1 5
```

**解决方案：**

```yaml
# 1. Increase CPU allocation
resources:
  limits:
    nvidia.com/gpu: 1
    cpu: "16"  # Increase from 8 to 16
    memory: "32Gi"

# 2. Use faster storage for data loading
volumeMounts:
- name: training-data
  mountPath: /data
volumes:
- name: training-data
  persistentVolumeClaim:
    claimName: fast-ssd-pvc  # Use SSD instead of HDD

# 3. Optimize data loading in code
# - Use DataLoader with num_workers=4-8
# - Prefetch data to GPU asynchronously
# - Use mixed precision training (FP16)
```

## 9. 动手练习：部署 GPU 加速的 ML 流水线

**目标：** 部署完整的 GPU 加速训练流水线，包含：
- 使用节点亲和性进行 GPU 调度。
- 用于数据集与模型的持久化存储。
- 使用 Prometheus 进行 GPU 监控。
- 资源配额。

**步骤 1：创建具有 GPU 配额的 Namespace**

```bash
kubectl create namespace gpu-training

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: gpu-quota
  namespace: gpu-training
spec:
  hard:
    requests.nvidia.com/gpu: "4"
    limits.nvidia.com/gpu: "4"
EOF
```

**步骤 2：为数据与模型创建 PVC**

```yaml
# training-pvcs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: training-data-pvc
  namespace: gpu-training
spec:
  accessModes:
  - ReadOnlyMany
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-output-pvc
  namespace: gpu-training
spec:
  accessModes:
  - ReadWriteMany
  resources:
    requests:
      storage: 50Gi
  storageClassName: fast-ssd
```

**步骤 3：部署具有 GPU 的训练 Job**

```yaml
# gpu-training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: resnet50-training
  namespace: gpu-training
spec:
  template:
    metadata:
      labels:
        app: resnet50-training
    spec:
      restartPolicy: OnFailure

      # Schedule on V100 GPUs with affinity
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: nvidia.com/gpu.product
                operator: In
                values: ["Tesla-V100-SXM2-32GB"]

      # Tolerate GPU node taints
      tolerations:
      - key: nvidia.com/gpu
        operator: Equal
        value: present
        effect: NoSchedule

      containers:
      - name: pytorch-training
        image: pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
        command: ["python", "train_resnet50.py"]
        args:
          - "--data-dir=/data/imagenet"
          - "--output-dir=/output"
          - "--epochs=90"
          - "--batch-size=256"
          - "--learning-rate=0.1"

        resources:
          limits:
            nvidia.com/gpu: 2  # Use 2 GPUs
            memory: "32Gi"
            cpu: "16"
          requests:
            nvidia.com/gpu: 2
            memory: "32Gi"
            cpu: "16"

        volumeMounts:
        - name: training-data
          mountPath: /data
          readOnly: true
        - name: model-output
          mountPath: /output

        env:
        - name: NCCL_DEBUG
          value: "INFO"  # Enable NCCL debugging for multi-GPU
        - name: CUDA_VISIBLE_DEVICES
          value: "0,1"

      volumes:
      - name: training-data
        persistentVolumeClaim:
          claimName: training-data-pvc
      - name: model-output
        persistentVolumeClaim:
          claimName: model-output-pvc
```

**步骤 4：监控 GPU 使用情况**

```bash
# Apply all resources
kubectl apply -f training-pvcs.yaml
kubectl apply -f gpu-training-job.yaml

# Watch job progress
kubectl get jobs -n gpu-training -w

# Check GPU utilization
kubectl exec -n gpu-training <pod-name> -- nvidia-smi

# View logs
kubectl logs -n gpu-training <pod-name> -f

# Check resource usage
kubectl top pod -n gpu-training

# View Prometheus metrics (if port-forwarded)
curl localhost:9400/metrics | grep "DCGM_FI_DEV_GPU_UTIL.*pod.*resnet50"
```

**预期输出：**

```
GPU utilization: 95-100%
Training speed: ~500 images/second
Memory usage: 28GB / 32GB
Time to complete: ~24 hours
```

## 10. 总结

### 核心要点

**GPU 调度需要专门的组件：**
- NVIDIA GPU Operator 自动化驱动与设备插件安装。
- 设备插件将 GPU 通告为可调度资源。
- 应为 GPU 节点配置合适的标签与污点以实现隔离。

**资源管理：**
- GPU 的 requests 与 limits 必须相等（不可超额承诺）。
- 始终提供充足的 CPU 与内存，避免瓶颈。
- 使用资源配额避免资源耗尽。

**GPU 共享策略：**
- **时间切片：** 共享 GPU，但没有独立显存隔离（开发/测试）。
- **MIG：** 硬件划分的 GPU 实例（生产多租户）。

**监控与故障排查：**
- DCGM Exporter 向 Prometheus 提供详细 GPU 指标。
- 常见问题：资源不足、缺少容忍、OOM 错误。
- 在 Pod 中使用 nvidia-smi 排查 GPU 检测问题。

**生产环境最佳实践：**
- 使用节点亲和性调度到合适的 GPU 型号。
- 为关键工作负载实施 PodDisruptionBudget。
- 为推理和训练创建独立节点池。
- 监控 GPU 利用率以优化成本。

### 实际影响

大规模运行 ML 的企业高度依赖 Kubernetes GPU 调度（原文案例，未独立核实）：

- **OpenAI：** 在 K8s 编排的数千块 GPU 上训练 GPT 模型。
- **Uber：** 每天调度超过 10,000 个 GPU 任务进行 ML 实验。
- **Spotify：** 为个性化模型使用 K8s GPU 调度。
- **NVIDIA：** 推荐在生产 K8s 中使用 GPU Operator。

### 下一步

下一课将介绍 Kubernetes 集群的**监控与故障排查**，包括：
- 高级 kubectl 调试技术。
- 使用 Fluentd/Loki 聚合日志。
- 使用 Prometheus 采集指标。
- ML 服务的分布式链路追踪。
- 常见生产问题及解决方案。

## 自我检查问题

1. NVIDIA GPU Operator 安装哪些组件？
2. 为什么 Kubernetes 中 GPU 的资源请求必须等于限制？
3. GPU 时间切片与 MIG 有什么区别？
4. 如何阻止非 GPU 工作负载被调度至 GPU 节点？
5. GPU 监控最重要的 Prometheus 指标是什么？
6. 如何排查因 GPU 不足而处于 Pending 状态的 Pod？
7. 训练工作负载每块 GPU 推荐分配多少 CPU 和内存？
8. 如何将 Pod 调度至特定 GPU 型号（例如 V100）？

## 补充资源

### 官方文档
- [NVIDIA GPU Operator 文档](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/getting-started.html)
- [Kubernetes 设备插件](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/)
- [NVIDIA MIG](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/)

### 教程与指南
- [在 Kubernetes 上运行 GPU Job](https://cloud.google.com/kubernetes-engine/docs/how-to/gpus)
- [GPU 时间切片配置](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/gpu-sharing.html)
- [DCGM Exporter 指标指南](https://docs.nvidia.com/datacenter/dcgm/latest/dcgm-api/dcgm-api-field-ids.html)

### 工具
- [kubectl-gpu 插件](https://github.com/kubernetes-sigs/kubectl-gpu)
- [NVIDIA DCGM](https://developer.nvidia.com/dcgm)
- [Grafana DCGM 仪表盘](https://grafana.com/grafana/dashboards/12239)

### 社区资源
- [NVIDIA GPU Cloud（NGC）目录](https://catalog.ngc.nvidia.com/)
- [CNCF 博客](https://www.cncf.io/blog/)
- [Kubernetes Slack #sig-scheduling](https://kubernetes.slack.com/)

---

**恭喜！** 你现在已经理解如何在 Kubernetes 中调度及管理 GPU 工作负载，这是 ML 基础设施工程师的重要技能。通过部署 GPU 工作负载并监控其性能，巩固这些概念。

> 译注：原文的硬件支持范围、性能数字及 CPU/RAM 配比是示例，需结合实际型号、驱动、框架与负载验证。设备插件通告的时间切片副本不等于独立物理 GPU，也不保证公平显存分配；MIG 仍存在资源划分及管理取舍。PDB 无法防止节点故障或所有中断，长训练任务仍需要检查点和恢复机制。GPU Operator 的组件启用情况取决于环境配置。全部代码块及其中的英文注释保留，未实际执行集群及 GPU 配置操作。
