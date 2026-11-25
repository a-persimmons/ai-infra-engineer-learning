# 练习 03：掌握 Kubernetes 核心资源

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01。

## 目标

动手实践每种核心资源：Pod、ReplicaSet、Deployment、StatefulSet、DaemonSet、Job、CronJob、ConfigMap、Secret、PersistentVolume、PersistentVolumeClaim、Service、Ingress、ServiceAccount、Role、RoleBinding。通过真实使用场景演示每一种资源。

## 要求

针对原文所列的 15 类资源，分别编写清单、应用清单，并记录一种工作中的实际使用场景。

## 分步操作

### 步骤 1——独立 Pod（10 分钟）
```yaml
apiVersion: v1
kind: Pod
metadata: { name: standalone }
spec:
  containers: [{ name: app, image: nginx }]
```
使用场景：**调试镜像**——通过 `kubectl run` 快速执行一次性测试。

### 步骤 2——ReplicaSet（跳过；很少直接编写，由 Deployment 管理）（5 分钟）
只需观察 Deployment 创建的 ReplicaSet。

### 步骤 3——Deployment（练习 01 已涵盖）

### 步骤 4——StatefulSet（实验 04 已涵盖）

### 步骤 5——DaemonSet（15 分钟）
在每个节点运行一个 Pod：
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata: { name: node-exporter }
spec:
  selector: { matchLabels: { app: node-exporter } }
  template:
    metadata: { labels: { app: node-exporter } }
    spec:
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          ports: [{ containerPort: 9100, hostPort: 9100 }]
      hostNetwork: true
```
使用场景：节点级代理（日志、监控、网络）。

### 步骤 6——Job（15 分钟）
```yaml
apiVersion: batch/v1
kind: Job
metadata: { name: train-model }
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - { name: train, image: my-trainer:latest }
  backoffLimit: 2
```
使用场景：模型训练、数据迁移。

### 步骤 7——CronJob（15 分钟）
```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-retrain }
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers: [{ name: train, image: my-trainer:latest }]
```
使用场景：定期重新训练、清理任务。

### 步骤 8——ConfigMap 与 Secret（练习 01 和实验 03 已涵盖）

### 步骤 9——PV 与 PVC（实验 04 已涵盖）

### 步骤 10——Service 类型（30 分钟）
ClusterIP、NodePort、LoadBalancer、ExternalName、Headless。分别编写一份清单。使用场景：

- ClusterIP：内部访问。
- NodePort：实验与开发环境的对外暴露。
- LoadBalancer：生产环境的外部访问。
- ExternalName：外部服务的别名（DNS）。
- Headless：为 StatefulSet 提供 Pod 级 DNS。

### 步骤 11——带 TLS 的 Ingress（30 分钟）
添加 cert-manager 与 Let's Encrypt，或使用自签名证书：
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iris-tls
  annotations: { cert-manager.io/cluster-issuer: letsencrypt-prod }
spec:
  ingressClassName: nginx
  tls: [{ hosts: [iris.example.com], secretName: iris-tls }]
  rules:
    - host: iris.example.com
      http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: iris-api, port: { number: 80 } } } }] }
```

### 步骤 12——ServiceAccount、Role 与 RoleBinding（30 分钟）
允许某个 Pod 读取其所在命名空间内的 Pod：
```yaml
apiVersion: v1
kind: ServiceAccount
metadata: { name: pod-reader }
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: pod-reader }
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: pod-reader }
subjects:
  - kind: ServiceAccount
    name: pod-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
```

测试：
```bash
kubectl run probe --rm -it --image=bitnami/kubectl --serviceaccount=pod-reader -- get pods
```

### 步骤 13——Namespace 与 ResourceQuota（30 分钟）
```yaml
apiVersion: v1
kind: Namespace
metadata: { name: tenant-a }
---
apiVersion: v1
kind: ResourceQuota
metadata: { name: tenant-a-quota, namespace: tenant-a }
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    pods: "30"
```

## 交付物

1. 每种资源的清单（每种资源一个文件）。
2. `USE_CASES.md`：每种资源对应一个实际使用场景。
3. `RBAC_DIAGRAM.md`：展示 ServiceAccount、Role 和 Binding 的关系。

## 验证

- [ ] 每种资源类型均成功应用。
- [ ] DaemonSet 在每个符合调度条件的节点上有一个 Pod。
- [ ] CronJob 在计划时间创建 Job。
- [ ] 基于 ServiceAccount 的访问有效（没有绑定时被拒绝）。
- [ ] 配额阻止租户命名空间超出限制。

## 拓展目标

- 添加 **LimitRange**，设置默认资源请求与限制。
- 添加 **PriorityClass**，影响 Pod 调度顺序。
- 对每种资源使用 **kubectl explain**，记录其 spec。

## 常见陷阱

- **在带污点的节点上运行 DaemonSet**——需要显式配置相应的容忍度。
- **Job 始终无法完成**——检查是否遗漏 `restartPolicy: Never` 或 `OnFailure`，并检查任务退出行为。
- **跨命名空间 RoleBinding**——Role 属于命名空间；可使用 ClusterRole 与目标命名空间中的 RoleBinding 授权。
- **ResourceQuota 同时要求 requests 和 limits**——未设置对应配置的 Pod 将无法通过准入。

> 译注：原文列举了 16 种核心资源，但要求部分写为 15 类，保留其原有练习安排。
