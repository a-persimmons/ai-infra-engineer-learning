# 实验 01：你的第一个 Pod 与 Deployment

**时长：** 60 分钟  **前置条件：** kind/minikube 集群正在运行。

## 目标

运行一个独立的 Pod，再升级为支持副本、滚动更新和回滚的 Deployment。

## 步骤

### 1. 运行独立 Pod
```bash
kubectl run nginx --image=nginx:1.27 --port=80
kubectl get pods
kubectl describe pod nginx | tail -20
kubectl port-forward pod/nginx 8080:80 &
curl http://localhost:8080
kill %1
kubectl delete pod nginx
```
注意：删除后的 Pod 不会重新出现，因为没有控制器负责重新创建它。

### 2. 升级为 Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports: [{ containerPort: 80 }]
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { cpu: 200m, memory: 128Mi }
```
```bash
kubectl apply -f deployment.yaml
kubectl get pods -l app=web
kubectl delete pod -l app=web --field-selector=status.phase=Running --grace-period=0  # delete one
kubectl get pods -l app=web                                                            # replaced
```

### 3. 滚动发布新镜像
```bash
kubectl set image deployment/web nginx=nginx:1.27-alpine
kubectl rollout status deployment/web
kubectl rollout history deployment/web
```

### 4. 回滚
```bash
kubectl rollout undo deployment/web
kubectl rollout history deployment/web
```

### 5. 调整滚动发布策略
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```
重新应用配置，使用新镜像再次部署，观察更严格的滚动发布过程：任何时刻最多 4 个 Pod，至少 3 个 Ready。

## 验证

- [ ] `kubectl get deployment web` 显示 3/3 Ready。
- [ ] 删除一个 Pod 后，几秒钟内出现替代 Pod。
- [ ] `kubectl rollout history` 显示至少三个修订版本。
- [ ] 回滚恢复之前的镜像（使用 `kubectl describe pod -l app=web | grep Image` 验证）。

## 清理
```bash
kubectl delete -f deployment.yaml
```

## 故障排查

- **Pod 一直处于 Pending** — `kubectl describe pod` 显示调度原因（CPU/内存不足、污点等）。
- **滚动发布卡住** — 执行 `kubectl rollout status --timeout=30s`，然后对新 Pod 执行 `kubectl describe`。
