# 实验 04：在 Kubernetes 上运行 GPU Pod

**时长：** 60 分钟  **前置条件：** 具有 GPU 节点的 Kubernetes 集群；已安装 NVIDIA device plugin。

## 目标

验证集群中的 GPU 可用性，调度具有 GPU 资源请求的 Pod，并运行一个快速推理任务。

## 步骤

### 1. 验证 GPU 节点
```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.allocatable.nvidia\.com/gpu}{"\n"}{end}'
# expect at least one node with a non-zero GPU count
```

### 2. 安装 NVIDIA device plugin（如果尚未安装）
```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.15.0/nvidia-device-plugin.yml
```
等待 DaemonSet 进入 Ready 状态。

### 3. 单 GPU Pod
```yaml
# gpu-pod.yaml
apiVersion: v1
kind: Pod
metadata: { name: cuda-test }
spec:
  restartPolicy: Never
  containers:
    - name: cuda
      image: nvidia/cuda:12.4.1-base-ubuntu22.04
      command: ["nvidia-smi"]
      resources:
        limits: { nvidia.com/gpu: 1 }
```
```bash
kubectl apply -f gpu-pod.yaml
kubectl logs cuda-test
```

### 4. PyTorch 推理 Job
```yaml
apiVersion: batch/v1
kind: Job
metadata: { name: pt-infer }
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: pt
          image: pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime
          command: ["python", "-c", "import torch; \
              print('cuda available:', torch.cuda.is_available()); \
              print('device:', torch.cuda.get_device_name(0))"]
          resources:
            limits: { nvidia.com/gpu: 1 }
```

### 5. 多 GPU Job
```yaml
resources:
  limits: { nvidia.com/gpu: 2 }
```
随后在容器内执行 `torchrun --standalone --nproc-per-node=2 train_ddp.py`。

### 6. 针对特定 GPU 类型配置节点亲和性
```yaml
spec:
  nodeSelector:
    nvidia.com/gpu.product: NVIDIA-A100-SXM4-40GB
```

### 7. MIG / 时间切片（如果支持）

使用 ConfigMap 为 device plugin 配置 MIG 或时间切片策略，这通常由集群管理员完成。

## 验证

- [ ] `cuda-test` Pod 成功完成，日志显示 GPU 信息。
- [ ] PyTorch Job 输出 CUDA available True。
- [ ] 多 GPU Pod 能看到两块 GPU（`torch.cuda.device_count() == 2`）。

## 清理
```bash
kubectl delete -f gpu-pod.yaml
kubectl delete job pt-infer
```

## 故障排查

- **Pod Pending：`Insufficient nvidia.com/gpu`** — 节点上没有运行 device plugin，或所有 GPU 都已分配。
- **`failed to call CDI driver`** — 容器运行时未配置 NVIDIA 支持。执行 `kubectl describe node | grep nvidia` 验证。
- **`Forbidden: pod requires more nvidia.com/gpu than allowed`** — 命名空间中的 ResourceQuota 或 LimitRange 限制了 GPU 请求。
