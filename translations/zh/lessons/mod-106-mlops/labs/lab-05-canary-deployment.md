# 实验 05：使用 Argo Rollouts 进行金丝雀部署

**时长：** 75 分钟  **前置条件：** kind 集群。

## 目标

使用 Argo Rollouts 金丝雀发布替代 Deployment，逐步将流量切换为 10% → 25% → 50% → 100%，期间设置暂停、基于真实指标自动分析，并在失败时自动回滚。

## 步骤

### 1. 安装 Argo Rollouts
```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
brew install argoproj/tap/kubectl-argo-rollouts
```

### 2. 定义 Rollout 资源
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: iris }
spec:
  replicas: 4
  selector: { matchLabels: { app: iris } }
  template:
    metadata: { labels: { app: iris } }
    spec:
      containers:
        - name: api
          image: iris-api:0.2
          ports: [{ containerPort: 8000 }]
  strategy:
    canary:
      canaryService: iris-canary
      stableService: iris-stable
      steps:
        - setWeight: 10
        - pause: { duration: 30s }
        - setWeight: 25
        - pause: { duration: 30s }
        - analysis:
            templates:
              - templateName: http-success-rate
        - setWeight: 50
        - pause: { duration: 30s }
        - setWeight: 100
```

另外配置两个 Service，指向具有 stable/canary 子集的同一选择器，并使用通过 Istio/NGINX 拆分流量的 Ingress（不在本实验范围内——原文建议使用默认 ALB 配合 `setWeight`，由 Rollout 控制器处理）。

### 3. AnalysisTemplate
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: http-success-rate }
spec:
  args: [{ name: service-name }]
  metrics:
    - name: success-rate
      interval: 15s
      successCondition: result[0] >= 0.99
      failureLimit: 2
      provider:
        prometheus:
          address: http://monitoring-kube-prometheus-prometheus.monitoring.svc:9090
          query: |
            sum(rate(http_requests_total{job="iris",status=~"2.."}[2m]))
            /
            sum(rate(http_requests_total{job="iris"}[2m]))
```

### 4. 应用
```bash
kubectl apply -f rollout.yaml
kubectl argo rollouts get rollout iris -w
```

### 5. 触发金丝雀发布
```bash
kubectl argo rollouts set image iris api=iris-api:0.3
```
在 CLI 工具中实时观察发布进度。

### 6. 模拟失败

部署返回 500 错误的 `iris-api:0.4`。AnalysisTemplate 检测到成功率下降，并自动回滚。

## 验证

- [ ] 新镜像健康时，Rollout 完成所有权重步骤。
- [ ] AnalysisTemplate 查询在 `kubectl argo rollouts get` 中返回数值。
- [ ] 不良镜像在分析失败后约一分钟内触发自动回滚。

## 清理
```bash
kubectl delete rollout iris
kubectl delete -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
kubectl delete ns argo-rollouts
```

## 故障排查

- **`Rollout stuck at 10%`** — 分析成功但自动晋升未启用；检查 `progressDeadlineSeconds`。
- **AnalysisTemplate 提示 no datapoints** — Prometheus 查询返回空结果。确认 `http_requests_total` 存在且标签匹配。
- **金丝雀与稳定服务未分离流量** — 如果没有流量管理工具（Istio、NGINX），Rollouts 仅调整副本数；HTTP 层流量拆分需要集成相应控制器。
