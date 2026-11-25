# 练习 08：GPU 调度模式

**时长：** 3 小时
**难度：** 中级
**前置条件：** 带 GPU 节点的集群；mod-107 的练习 10（共享策略）。

## 目标

实现三种 GPU 调度模式：独占 GPU 的 Pod、MIG 分区 Pod 和时间切片 GPU 共享。添加节点亲和性、污点和 PriorityClass，实现面向生产环境的调度。

## 要求

1. 已部署 NVIDIA Device Plugin。
2. 为 GPU 节点组设置污点（仅允许符合条件的 GPU 工作负载）。
3. 演示三种部署模式。
4. 为推理（高）与训练（低）配置 PriorityClass——推理需要容量时可抢占训练。
5. 使用 PodAntiAffinity 将推理副本分散至不同节点。

## 分步操作

### 步骤 1——验证 GPU 集群（15 分钟）
```bash
kubectl get nodes -L nvidia.com/gpu.product
# expect at least one node with a GPU product label
kubectl describe node <gpu-node> | grep -i nvidia.com/gpu
```

### 步骤 2——为 GPU 节点设置污点（15 分钟）
```bash
kubectl taint node <gpu-node> workload=gpu:NoSchedule
```
现在只有具有匹配容忍度的 Pod 才能调度到这里。

### 步骤 3——模式 1：独占 GPU Pod（30 分钟）
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: llm-serve }
spec:
  replicas: 2
  selector: { matchLabels: { app: llm-serve } }
  template:
    metadata: { labels: { app: llm-serve } }
    spec:
      tolerations:
        - { key: workload, value: gpu, effect: NoSchedule }
      nodeSelector:
        nvidia.com/gpu.product: NVIDIA-L40S
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.5.0
          resources:
            limits: { nvidia.com/gpu: 1, cpu: 8, memory: 32Gi }
          args: ["--model", "mistralai/Mistral-7B-Instruct-v0.3"]
```

### 步骤 4——模式 2：MIG 分区（30 分钟）
使用 MIG 模式与 Device Plugin 配置（见 mod-107 练习 10）：
```yaml
resources:
  limits:
    nvidia.com/mig-1g.5gb: 1
```
每个 Pod 获得一个硬件隔离的分片。根据分片组合，验证一块 A100 可以容纳 4–7 个 Pod。

### 步骤 5——模式 3：时间切片共享（15 分钟）
启用 Device Plugin 时间切片（每块 GPU 四个副本）：
```yaml
resources:
  limits: { nvidia.com/gpu: 1 }   # gets 1/4 of actual GPU
```
四个 Pod 调度到一块 GPU。原文建议仅用于开发环境。

### 步骤 6——PriorityClass 与抢占（30 分钟）
```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: inference-critical }
value: 1000
globalDefault: false
description: "Inference workloads; preempts training"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: training-batch }
value: 100
description: "Training; preemptible by inference"
```
为每个 Deployment 设置 `spec.priorityClassName` 对应的 Pod 模板配置。用训练任务占满 GPU；部署推理任务，观察抢占。

### 步骤 7——跨节点分散（15 分钟）
```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector: { matchLabels: { app: llm-serve } }
```
现在两个推理副本不会同时调度到同一个节点。

## 交付物

1. 三种模式的全部清单。
2. PriorityClass 定义与抢占演示。
3. `GPU_SCHEDULING.md`，记录各种模式的适用时机。

## 验证

- [ ] 独占 GPU Pod 在 GPU 节点上运行，而非其他节点。
- [ ] MIG/时间切片成功将多个 Pod 调度到一块 GPU。
- [ ] 部署推理服务时抢占训练 Pod（通过 `kubectl describe pod` 显示的 `Preempting` 验证）。
- [ ] 两个推理副本落在不同节点上。

## 常见陷阱

- **只有容忍度而没有 nodeSelector**——Pod 可以容忍污点，但不一定优先选择 GPU 节点，可能落在其他节点。
- **MIG 实例不匹配**——请求 `mig-1g.5gb`，但集群只有 `mig-2g.10gb` → 一直无法调度。
- **抢占导致模型加载时 OOM**——原文建议在模型加载成本很高时为推理配置 `preemptionPolicy: Never`。

> 译注：禁止抢占并不能直接解决显存不足问题；还需验证资源分配、进程退出和显存释放情况。
