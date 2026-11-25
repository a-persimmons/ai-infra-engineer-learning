# 实验 05：为 FastAPI 服务添加 Prometheus 指标埋点

**时长：** 60 分钟
**难度：** 入门进阶
**前置条件：** 完成实验 04；`iris-api` 服务正在 kind 集群上运行。

## 目标

为实验 04 中的 FastAPI 服务添加 Prometheus 指标，部署本地 Prometheus 来抓取指标，并查询几个有代表性的 PromQL 表达式。完成后，你将在笔记本电脑上实现完整的指标 → 抓取 → 查询闭环。

## 为什么重要

每个生产服务都会产生指标。模块 108（监控与可观测性）将深入讲解；本实验先建立后续模块所依赖的简单结构——“暴露 `/metrics`，让 Prometheus 指向它，查询结果”。

## 前置条件

- 实验 04 已部署且正在提供服务（`curl http://localhost:8080/health` 返回 200）。
- 已安装 Helm 3（`helm version`）。

## 步骤

### 1. 为 FastAPI 应用添加埋点

```bash
cd ~/ai-infra-labs/lab-04-serve
source venv/bin/activate
pip install prometheus-fastapi-instrumentator>=7.0
```

编辑 `app.py`，添加三行代码：

```python
# After: app = FastAPI(...)
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
```

此外，还需要为每个类别的预测添加自定义计数器：

```python
# Near the top, after `log = logging.getLogger(...)`:
from prometheus_client import Counter
PREDICTIONS = Counter(
    "iris_predictions_total",
    "Total predictions by class",
    ["class_name"],
)

# Inside predict(), before returning:
PREDICTIONS.labels(class_name=CLASS_NAMES[class_id]).inc()
```

### 2. 重新构建并加载镜像

```bash
docker build -t iris-api:0.2 .
kind load docker-image iris-api:0.2 --name lab-03

kubectl set image deployment/iris-api api=iris-api:0.2
kubectl rollout status deployment/iris-api
```

### 3. 验证 /metrics 已暴露

```bash
curl -s http://localhost:8080/metrics | head -40
```

预期：大量 `# HELP` / `# TYPE` 块，以及 `iris_predictions_total{class_name="..."} 0` 行。

### 4. 通过 Helm 安装 kube-prometheus-stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
    --namespace monitoring --create-namespace \
    --set grafana.enabled=true \
    --set grafana.adminPassword=admin \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --wait
```

这会安装 Prometheus、Alertmanager 和 Grafana。等待约 2–3 分钟，直到全部 Pod 处于 Ready 状态。

```bash
kubectl get pods -n monitoring
```

### 5. 配置 Prometheus 抓取应用指标

```bash
cat > servicemonitor.yaml <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: iris-api
  labels:
    release: monitoring     # required by the kube-prometheus-stack default selector
spec:
  selector:
    matchLabels: { app: iris-api }
  endpoints:
    - port: web
      path: /metrics
      interval: 15s
EOF
```

但我们的 Service 尚未配置命名端口，需要为其打补丁：

```bash
kubectl patch svc iris-api --type=merge -p '{"spec":{"ports":[{"name":"web","port":80,"targetPort":8000,"nodePort":30080}]}}'
kubectl apply -f servicemonitor.yaml
```

### 6. 产生流量，然后查询 Prometheus

```bash
# Drive traffic
for _ in {1..50}; do
  curl -s -X POST http://localhost:8080/predict -H 'content-type: application/json' \
    -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}' >/dev/null
  curl -s -X POST http://localhost:8080/predict -H 'content-type: application/json' \
    -d '{"sepal_length":6.0,"sepal_width":3.0,"petal_length":5.0,"petal_width":1.5}' >/dev/null
done

# Port-forward Prometheus
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090 &
sleep 2

# Open http://localhost:9090 in browser and run these queries:
#   iris_predictions_total
#   sum by (class_name) (rate(iris_predictions_total[1m]))
#   histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[1m])))
```

### 7.（可选）Grafana 仪表盘

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80 &
# Open http://localhost:3000  user=admin  pass=admin
# Add panels for the three queries above.
```

## 验证

- [ ] `curl /metrics` 列出 `iris_predictions_total` 和 `http_request_duration_seconds_bucket`。
- [ ] Prometheus 的 `Status -> Targets` 页面显示 `iris-api` 目标为 UP。
- [ ] 第六步之后，PromQL `iris_predictions_total` 为每个类别返回一行非零值。
- [ ] PromQL `rate(iris_predictions_total[1m])` 返回每秒速率。

## 清理

```bash
# Stop port-forwards
kill %1 %2 2>/dev/null

# Optional: remove monitoring stack
helm uninstall monitoring -n monitoring
kubectl delete ns monitoring

# Lab artifacts
kubectl delete -f servicemonitor.yaml k8s.yaml
docker rmi iris-api:0.2 iris-api:0.1
kind delete cluster --name lab-03
cd ~ && rm -rf ~/ai-infra-labs/lab-04-serve
```

## 故障排查

- **Prometheus 目标显示 DOWN** — 最常见的原因是 ServiceMonitor 的 `release: monitoring` 标签与 Operator 的选择器不匹配。执行 `kubectl get prometheus -n monitoring -o yaml | grep serviceMonitorSelector -A 5` 验证。
- **`iris_predictions_total` 没有数据** — 尚未产生流量，或抓取尚未完成。等待 30 秒再刷新。
- **histogram_quantile 返回 NaN** — 时间窗口内的样本不足。将窗口增大至 `[5m]` 或产生更多流量。
- **Helm 安装卡住** — 集群 CPU 不足。降低监控栈资源请求：`--set prometheus.prometheusSpec.resources.requests.memory=300Mi`。
- **Grafana 登录失败** — 较新的 Chart 版本可能使用不同默认密码。执行 `kubectl get secret -n monitoring monitoring-grafana -o jsonpath='{.data.admin-password}' | base64 -d`。
