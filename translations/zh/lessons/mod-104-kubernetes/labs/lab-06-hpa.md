# 实验 06：负载下的 Pod 水平自动扩缩容（HPA）

**时长：** 60 分钟  **前置条件：** 实验 05 的 Chart 已部署；已安装 metrics-server。

## 目标

配置基于 CPU 和自定义指标的 HPA，产生负载，并观察扩容与缩容行为。

## 步骤

### 1. 安装 metrics-server（kind 需要 `--kubelet-insecure-tls`）
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl top nodes
```

### 2. 基于 CPU 的 HPA
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: iris }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: iris }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 50 } }
```
```bash
kubectl apply -f hpa.yaml
kubectl get hpa iris -w
```

### 3. 产生负载
```bash
kubectl run loadgen --rm -it --image=williamyeh/hey --restart=Never -- \
  -z 3m -c 50 -m POST -T 'application/json' \
  -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}' \
  http://iris-iris-chart/predict
```

### 4. 观察扩容
```bash
watch -n 2 'kubectl get hpa,deploy,pods -l app=iris-chart'
```
预期副本数在约 30–60 秒内从 2 逐步增加至接近 10。

### 5. 停止负载并观察缩容

负载结束后，经过稳定窗口（默认 300 秒），副本数应回到 2。

### 6. 调整 HPA 行为
```yaml
spec:
  behavior:
    scaleUp:   { stabilizationWindowSeconds: 30 }
    scaleDown: { stabilizationWindowSeconds: 120 }
```

### 7. 自定义指标（Prometheus Adapter 示意）

安装 `prometheus-adapter`，从应用暴露 `iris_predictions_per_second`，并在 HPA 中编写 `Pods` 类型的指标。改用每秒请求数而非 CPU 作为扩缩容依据。

## 验证

- [ ] `kubectl top pods` 显示实际 CPU 使用情况。
- [ ] 在负载期间，Pod 数量至少扩容至 replicaCount × 2。
- [ ] 负载结束后，Pod 在稳定窗口内缩容。
- [ ] `kubectl describe hpa iris` 显示当前利用率与目标利用率。

## 清理
```bash
kubectl delete hpa iris
helm uninstall iris 2>/dev/null
```

## 故障排查

- **HPA 显示 `unknown / 50%`** — metrics-server 未运行或未获得授权。先检查 `kubectl top pods`。
- **HPA 始终不扩容** — Deployment 未设置资源请求；HPA 需要资源请求才能计算利用率。
- **扩容但不缩容** — 稳定窗口（默认 5 分钟）尚未结束，这是有意设置的防抖机制。
