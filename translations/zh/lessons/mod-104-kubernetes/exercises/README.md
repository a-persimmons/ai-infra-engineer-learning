# 模块 04：Kubernetes——实践练习

通过这些动手练习，掌握面向 ML 工作负载的 Kubernetes。

## 练习 1：部署第一个 ML 模型

**难度：** 初级
**时长：** 45 分钟

### 目标
将简单的 ML 模型推理服务部署至 Kubernetes。

### 任务
1. 为模型服务器创建 Deployment YAML。
2. 通过 Service 暴露服务。
3. 验证 Pod 正在运行。
4. 测试推理端点。
5. 将 Deployment 扩容至 3 个副本。

### 起始 YAML
```yaml
# exercises/01-model-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-server
spec:
  # TODO: Set replicas
  # TODO: Add labels and selectors
  template:
    spec:
      containers:
      - name: model-server
        # TODO: Set image
        # TODO: Add resource requests/limits
        # TODO: Add ports
        # TODO: Add health checks
---
apiVersion: v1
kind: Service
metadata:
  name: ml-model-service
spec:
  # TODO: Configure service type and ports
  # TODO: Add selector
```

### 待完成命令
```bash
# Apply deployment
kubectl apply -f exercises/01-model-deployment.yaml

# TODO: Verify deployment
# kubectl get ...

# TODO: Test service
# kubectl port-forward ...
# curl ...

# TODO: Scale deployment
# kubectl scale ...
```

### 成功标准
- [ ] 成功创建 Deployment。
- [ ] 所有 Pod 正在运行。
- [ ] Service 可访问。
- [ ] 健康检查通过。
- [ ] 可以扩容与缩容。

---

## 练习 2：ConfigMap 与 Secret

**难度：** 初级
**时长：** 30 分钟

### 目标
管理 ML 应用配置与密钥。

### 任务
1. 创建用于模型配置的 ConfigMap。
2. 创建用于 API Key 的 Secret。
3. 将 ConfigMap 作为数据卷挂载。
4. 将 Secret 注入环境变量。
5. 验证应用使用了配置。

### 起始 YAML
```yaml
# exercises/02-config-secrets.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: model-config
data:
  # TODO: Add model configuration
  model_name: "..."
  batch_size: "..."

---
apiVersion: v1
kind: Secret
metadata:
  name: api-credentials
type: Opaque
stringData:
  # TODO: Add API credentials (base64 encoded)
  api_key: ""
```

### 成功标准
- [ ] 已创建并挂载 ConfigMap。
- [ ] 已创建并注入 Secret。
- [ ] 应用正确读取配置。
- [ ] 日志中不出现密钥。
- [ ] 可以在不重启 Pod 的情况下更新数据卷挂载的配置。

---

## 练习 3：资源管理

**难度：** 中级
**时长：** 45 分钟

### 目标
为 ML 工作负载正确配置资源请求与限制。

### 任务
1. 设置 CPU 与内存 requests。
2. 设置 CPU 与内存 limits。
3. 观察基于资源的 Pod 调度。
4. 在实验环境中通过较低内存限制触发 OOMKill。
5. 为命名空间配置 ResourceQuota。

### 资源配置
```yaml
# exercises/03-resources.yaml
apiVersion: v1
kind: Pod
metadata:
  name: ml-training-pod
spec:
  containers:
  - name: trainer
    image: pytorch/pytorch:latest
    resources:
      requests:
        # TODO: Set appropriate requests
        memory: ""
        cpu: ""
      limits:
        # TODO: Set appropriate limits
        memory: ""
        cpu: ""
```

### 任务
```bash
# TODO: Monitor resource usage
# kubectl top pod ml-training-pod

# TODO: Create ResourceQuota
# Limit namespace to 4 CPU and 8Gi memory
```

### 成功标准
- [ ] 正确请求资源。
- [ ] Pod 成功调度。
- [ ] 资源限制得到执行。
- [ ] ResourceQuota 防止超额分配。
- [ ] 可以通过 `kubectl top` 观察资源使用情况。

---

## 练习 4：GPU 调度

**难度：** 中级
**时长：** 60 分钟

### 目标
在 GPU 节点上调度 ML 训练作业。

### 任务
1. 为 GPU 节点添加标签。
2. 创建请求 GPU 的 Pod。
3. 验证 GPU 已分配。
4. 运行 GPU 工作负载示例。
5. 为 GPU Pod 设置节点亲和性。

### GPU Pod YAML
```yaml
# exercises/04-gpu-scheduling.yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-training-job
spec:
  containers:
  - name: pytorch-trainer
    image: pytorch/pytorch:latest-cuda
    resources:
      limits:
        # TODO: Request GPU
        nvidia.com/gpu: 1
    # TODO: Add node selector for GPU nodes
    # TODO: Add GPU-specific environment variables
```

### 验证
```bash
# TODO: Verify GPU allocation
# kubectl exec gpu-training-job -- nvidia-smi

# TODO: Check node has GPU
# kubectl describe node <node-name> | grep nvidia.com/gpu
```

### 成功标准
- [ ] GPU 节点正确标记。
- [ ] Pod 被调度至 GPU 节点。
- [ ] 容器内可见 GPU。
- [ ] 可以运行 CUDA 代码。
- [ ] 遵守资源限制。

---

## 练习 5：Horizontal Pod Autoscaling（HPA）

**难度：** 中级
**时长：** 60 分钟

### 目标
为 ML 推理服务实现自动扩缩容。

### 任务
1. 部署 metrics-server。
2. 创建以 CPU 使用率为目标的 HPA。
3. 生成负载以触发扩容。
4. 观察 Pod 扩缩容行为。
5. 配置自定义指标（可选）。

### HPA 配置
```yaml
# exercises/05-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-model-hpa
spec:
  scaleTargetRef:
    # TODO: Reference your deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  # TODO: Add custom metrics (requests per second, etc.)
```

### 负载测试
```bash
# TODO: Generate load
# kubectl run -it load-generator --rm --image=busybox -- /bin/sh
# while true; do wget -q -O- http://ml-model-service; done
```

### 成功标准
- [ ] HPA 已创建且处于活动状态。
- [ ] 负载增加时 Pod 扩容。
- [ ] 空闲时 Pod 缩容。
- [ ] 扩缩容遵守最小与最大副本数。
- [ ] 自定义指标正常工作（如果实现）。

---

## 练习 6：用于 ML 实验追踪的 StatefulSet

**难度：** 高级
**时长：** 90 分钟

### 目标
使用 StatefulSet 与持久化存储部署 MLflow 或类似工具。

### 任务
1. 创建 PersistentVolumeClaim。
2. 为 MLflow 部署 StatefulSet。
3. 配置 Pod 亲和性与反亲和性。
4. 设置 Headless Service。
5. 测试 Pod 重启后数据是否仍然存在。

### StatefulSet YAML
```yaml
# exercises/06-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mlflow-server
spec:
  serviceName: mlflow
  replicas: 1
  selector:
    matchLabels:
      app: mlflow
  template:
    spec:
      containers:
      - name: mlflow
        # TODO: Configure MLflow container
        volumeMounts:
        - name: data
          mountPath: /mlflow
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### 成功标准
- [ ] StatefulSet 正常运行。
- [ ] PVC 已绑定及挂载。
- [ ] Pod 重启后数据仍然存在。
- [ ] 网络标识稳定。
- [ ] 可以扩缩容 StatefulSet。

---

## 练习 7：用于训练的 Job 与 CronJob

**难度：** 中级
**时长：** 45 分钟

### 目标
使用 Kubernetes Job 运行批量 ML 训练，并通过 CronJob 定时重新训练。

### 任务
1. 创建用于一次性训练的 Job。
2. 创建用于每日重新训练的 CronJob。
3. 配置并行度。
4. 设置 Job 清理的 TTL。
5. 访问 Job 日志。

### Job 配置
```yaml
# exercises/07-jobs.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: model-training-job
spec:
  # TODO: Configure job
  template:
    spec:
      containers:
      - name: trainer
        # TODO: Configure training container
        # TODO: Mount data and output volumes
      restartPolicy: Never
  backoffLimit: 3
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-retraining
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      # TODO: Configure job template
```

### 成功标准
- [ ] Job 成功完成。
- [ ] CronJob 正确调度。
- [ ] 失败的 Job 按配置重试。
- [ ] 已清理旧 Job。
- [ ] 可以访问 Job 日志。

---

## 练习 8：用于 ML API 的 Ingress

**难度：** 中级
**时长：** 45 分钟

### 目标
使用 Ingress 向外部暴露 ML API。

### 任务
1. 安装 Ingress Controller（原文示例 nginx）。
2. 创建 Ingress 资源。
3. 配置基于路径的路由。
4. 添加 TLS（可选）。
5. 测试外部访问。

### Ingress 配置
```yaml
# exercises/08-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-api-ingress
  annotations:
    # TODO: Add ingress annotations
spec:
  rules:
  - host: ml-api.example.com
    http:
      paths:
      - path: /predict
        pathType: Prefix
        backend:
          service:
            name: ml-model-service
            port:
              number: 80
  # TODO: Configure TLS
```

### 成功标准
- [ ] Ingress Controller 正常运行。
- [ ] Ingress 资源已创建。
- [ ] 可以从外部访问 API。
- [ ] 路径路由正常工作。
- [ ] TLS 已配置（如果尝试）。

---

## 参考答案

原文说明答案位于 `solutions/` 目录。请先独立尝试练习！

## 提示

1. **使用 kubectl explain：** `kubectl explain pod.spec.containers`。
2. **Dry Run：** 使用 `--dry-run=client -o yaml` 测试 YAML。
3. **观察资源：** 使用 `kubectl get pods --watch`。
4. **调试 Pod：** 使用 `kubectl describe` 和 `kubectl logs`。
5. **端口转发：** 在暴露服务之前先在本地测试。

## 补充资源

- [Kubernetes 文档](https://kubernetes.io/docs/)
- [kubectl 速查表](../../../resources/cheat-sheets/kubernetes-cheat-sheet.md)
- [Kubernetes 模式](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/)

---

**需要帮助？** 在 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 提问。

> 译注：这是目录内的独立短练习，与实际编号实践项目不完全对应。ConfigMap 数据卷更新存在传播延迟，subPath 挂载不自动更新，应用还需支持重新加载；GPU 调度需要驱动及设备插件；StatefulSet 扩容本身不保证 MLflow 后端数据一致性。Ingress 控制器应选择受维护的实现，生产外部接口需配置 TLS 与鉴权。原始代码块保留，未实际部署。
