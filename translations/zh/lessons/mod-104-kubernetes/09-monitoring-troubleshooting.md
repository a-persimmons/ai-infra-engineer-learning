# 第 09 课：Kubernetes 监控与故障排查

## 学习目标
完成本课后，你将能够：
- 使用 kubectl 命令进行调试与故障排查。
- 为 ML 工作负载实施完整的日志策略。
- 使用 Prometheus 与 Grafana 设置监控。
- 针对关键 ML 基础设施问题创建告警。
- 排查生产环境中常见的 Kubernetes 问题。
- 理解 ML 服务的分布式链路追踪。
- 应用生产 ML 可观测性最佳实践。

## 前置条件
- 完成第 01–08 课（Kubernetes 基础）。
- 基本理解指标、日志与链路追踪。
- 熟悉 ML 训练与推理工作流。
- 具备 YAML 与命令行工具使用经验。

## 导论

**监控与可观测性为什么对 ML 基础设施重要：**
- **训练失败：** GPU 显存不足、数据加载瓶颈。
- **推理延迟：** 模型响应时间、队列深度。
- **资源利用率：** GPU/CPU/内存使用效率。
- **成本优化：** 识别利用率不足的资源。
- **SLA 履约：** 追踪可用时间、错误率及延迟分位数。

**可观测性的三大支柱：**
1. **指标（Metrics）：** 数值型时间序列数据（CPU 使用率、延迟、吞吐量）。
2. **日志（Logs）：** 事件文本记录（错误、警告、调试信息）。
3. **链路追踪（Traces）：** 请求在分布式系统中的流转路径。

**实际案例（原文列举，未独立核实）：**
- **Uber：** 每天监控超过 10,000 个 ML 任务，GPU 利用率不足时告警。
- **Netflix：** 追踪模型推理延迟，以维持 99.99% 的 SLA。
- **Spotify：** 监控特征存储延迟与数据新鲜度。
- **OpenAI：** 使用分布式链路追踪排查多模型编排问题。

## 1. kubectl 调试命令

### 1.1 必备 kubectl 命令

**检查集群健康状态：**

```bash
# View cluster nodes
kubectl get nodes
kubectl describe node <node-name>

# Check system pods
kubectl get pods -n kube-system

# View cluster events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Check API server health
kubectl get --raw /healthz
kubectl get --raw /livez
kubectl get --raw /readyz
```

**检查 Pod：**

```bash
# List pods with detailed info
kubectl get pods -n ml-serving -o wide

# Describe pod (shows events, volumes, status)
kubectl describe pod <pod-name> -n ml-serving

# Get pod YAML
kubectl get pod <pod-name> -n ml-serving -o yaml

# Watch pod status
kubectl get pods -n ml-serving --watch
```

**查看日志：**

```bash
# Get logs from pod
kubectl logs <pod-name> -n ml-serving

# Follow logs in real-time
kubectl logs -f <pod-name> -n ml-serving

# Get logs from previous container instance (if pod restarted)
kubectl logs <pod-name> -n ml-serving --previous

# Logs from specific container in multi-container pod
kubectl logs <pod-name> -c <container-name> -n ml-serving

# Last 100 lines
kubectl logs <pod-name> -n ml-serving --tail=100

# Logs since timestamp
kubectl logs <pod-name> -n ml-serving --since=1h
kubectl logs <pod-name> -n ml-serving --since-time=2023-10-15T10:00:00Z
```

**在 Pod 中执行命令：**

```bash
# Interactive shell
kubectl exec -it <pod-name> -n ml-serving -- /bin/bash

# Run single command
kubectl exec <pod-name> -n ml-serving -- nvidia-smi
kubectl exec <pod-name> -n ml-serving -- ps aux
kubectl exec <pod-name> -n ml-serving -- df -h

# Test network connectivity
kubectl exec <pod-name> -n ml-serving -- curl http://another-service/health
```

**端口转发：**

```bash
# Forward local port to pod
kubectl port-forward <pod-name> 8080:8080 -n ml-serving

# Access at http://localhost:8080

# Forward to service
kubectl port-forward service/<service-name> 8080:80 -n ml-serving

# Forward to deployment (any pod)
kubectl port-forward deployment/<deployment-name> 8080:8080 -n ml-serving
```

**资源使用情况：**

```bash
# Top nodes (CPU, memory usage)
kubectl top nodes

# Top pods
kubectl top pods -n ml-serving

# Sort by CPU
kubectl top pods -n ml-serving --sort-by=cpu

# Sort by memory
kubectl top pods -n ml-serving --sort-by=memory

# Show containers
kubectl top pods -n ml-serving --containers
```

### 1.2 调试 ML 训练任务

**场景：训练 Job 卡在 Pending 状态**

```bash
# 1. Check job status
kubectl get job training-job -n ml-training

# 2. Check pod status
kubectl get pods -l job-name=training-job -n ml-training

# 3. Describe pod to see why it's pending
kubectl describe pod <pod-name> -n ml-training

# Common reasons:
# - Insufficient GPU resources
# - Insufficient CPU/memory
# - Node selector doesn't match any nodes
# - Taints not tolerated
# - PVC not bound

# 4. Check events
kubectl get events -n ml-training --sort-by='.lastTimestamp'

# Example event:
# Warning  FailedScheduling  pod/training-job-xyz  0/3 nodes available: insufficient nvidia.com/gpu
```

**解决方案：检查 GPU 可用性**

```bash
# View GPU capacity across nodes
kubectl describe nodes | grep -A 10 "Allocated resources"

# Or install kubectl-gpu plugin
kubectl resource-capacity --pods --util --sort gpu.nvidia.com
```

**场景：训练任务反复崩溃（CrashLoopBackOff）**

```bash
# 1. Check pod status
kubectl get pods -n ml-training

# NAME               READY   STATUS             RESTARTS   AGE
# training-job-xyz   0/1     CrashLoopBackOff   5          10m

# 2. View logs from crashed container
kubectl logs training-job-xyz -n ml-training --previous

# Example error:
# torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB

# 3. Check resource limits
kubectl describe pod training-job-xyz -n ml-training | grep -A 10 Resources

# 4. Check if volume mounts are correct
kubectl describe pod training-job-xyz -n ml-training | grep -A 10 Mounts
```

**解决方案示例：**

```bash
# Reduce batch size (if OOM error)
kubectl set env deployment/training-job BATCH_SIZE=16 -n ml-training

# Increase memory limit
kubectl patch deployment training-job -n ml-training -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"training","resources":{"limits":{"memory":"32Gi"}}}]}}}}'

# Or edit directly
kubectl edit deployment training-job -n ml-training
```

### 1.3 调试 ML 推理服务

**场景：推理 API 返回 502 Bad Gateway**

```bash
# 1. Check service and endpoints
kubectl get service bert-inference -n ml-serving
kubectl get endpoints bert-inference -n ml-serving

# If endpoints is <none>, no healthy pods are backing the service

# 2. Check pod health
kubectl get pods -l app=bert-inference -n ml-serving

# 3. Check readiness probes
kubectl describe pod <pod-name> -n ml-serving | grep -A 5 Readiness

# 4. Test endpoint directly
kubectl exec <pod-name> -n ml-serving -- curl http://localhost:8080/health
kubectl exec <pod-name> -n ml-serving -- curl http://localhost:8080/ready

# 5. Check logs for errors
kubectl logs <pod-name> -n ml-serving | grep -i error
```

**场景：推理延迟较高**

```bash
# 1. Check resource utilization
kubectl top pods -n ml-serving

# 2. Check GPU utilization (if GPU-based)
kubectl exec <pod-name> -n ml-serving -- nvidia-smi

# 3. Check HPA status (if autoscaling enabled)
kubectl get hpa -n ml-serving
kubectl describe hpa bert-inference-hpa -n ml-serving

# 4. Check for CPU throttling
kubectl exec <pod-name> -n ml-serving -- cat /sys/fs/cgroup/cpu/cpu.stat

# 5. Review application logs for slow requests
kubectl logs <pod-name> -n ml-serving | grep "request_duration"
```

## 2. 日志策略

### 2.1 应用日志最佳实践

**结构化日志（JSON 格式）：**

```python
# train.py
import logging
import json

logger = logging.getLogger(__name__)

# Configure JSON logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "job_name": os.environ.get("JOB_NAME"),
            "epoch": getattr(record, 'epoch', None),
            "loss": getattr(record, 'loss', None),
        }
        return json.dumps(log_obj)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info("Training started")
logger.info("Epoch complete", extra={"epoch": 1, "loss": 0.123})
```

**输出：**
```json
{"timestamp": "2023-10-15 10:30:00", "level": "INFO", "message": "Training started", "job_name": "resnet-training"}
{"timestamp": "2023-10-15 10:35:00", "level": "INFO", "message": "Epoch complete", "job_name": "resnet-training", "epoch": 1, "loss": 0.123}
```

**优点：**
- 更容易解析和查询。
- 可以按照字段过滤（epoch、loss 等）。
- 便于与日志聚合系统集成（Loki、Elasticsearch）。

### 2.2 使用 Loki 聚合日志

**安装 Loki 技术栈（Loki + Promtail + Grafana）：**

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install loki-stack grafana/loki-stack \
  --namespace logging \
  --create-namespace \
  --set grafana.enabled=true \
  --set prometheus.enabled=true \
  --set promtail.enabled=true
```

**Promtail 配置（原文示例自动安装）：**

Promtail 以 DaemonSet 形式运行在各节点，采集以下路径的日志：
- `/var/log/pods/**/*.log`（Pod 日志）。

**在 Grafana 中查询日志：**

```bash
# Port-forward to Grafana
kubectl port-forward service/loki-stack-grafana 3000:80 -n logging

# Get admin password
kubectl get secret loki-stack-grafana -n logging -o jsonpath="{.data.admin-password}" | base64 -d
```

**LogQL 查询（Loki Query Language，Loki 查询语言）：**

```logql
# All logs from namespace
{namespace="ml-training"}

# Logs from specific job
{namespace="ml-training", job_name="resnet-training"}

# Error logs only
{namespace="ml-training"} |= "ERROR"

# Training metrics
{namespace="ml-training"} | json | loss > 1.0

# Count errors per minute
rate({namespace="ml-training"} |= "ERROR" [1m])
```

### 2.3 使用 Fluentd 实现高级日志聚合

**安装 Fluentd DaemonSet：**

```yaml
# fluentd-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      serviceAccountName: fluentd
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

**过滤日志并补充字段：**

```ruby
# fluentd.conf
<filter kubernetes.**>
  @type kubernetes_metadata
</filter>

<filter kubernetes.var.log.containers.training-**.log>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<match kubernetes.var.log.containers.training-**.log>
  @type elasticsearch
  host elasticsearch.logging.svc.cluster.local
  port 9200
  logstash_format true
  logstash_prefix ml-training
</match>
```

## 3. 使用 Prometheus 实现指标采集与监控

### 3.1 安装 Prometheus 技术栈

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi
```

**安装内容：**
- Prometheus（指标采集）。
- Grafana（可视化）。
- Alertmanager（告警）。
- Node Exporter（节点指标）。
- kube-state-metrics（K8s 对象状态指标）。
- 预配置的仪表盘与告警。

### 3.2 为 ML 应用添加监控埋点

**Python（Prometheus 客户端库）：**

```python
# inference_server.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Metrics
prediction_counter = Counter('model_predictions_total', 'Total predictions', ['model_name', 'status'])
prediction_latency = Histogram('model_prediction_duration_seconds', 'Prediction latency', ['model_name'])
gpu_memory_usage = Gauge('gpu_memory_usage_bytes', 'GPU memory usage', ['gpu_id'])
queue_depth = Gauge('prediction_queue_depth', 'Number of requests in queue')

# Expose metrics endpoint on port 8000
start_http_server(8000)

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()

    try:
        # Run inference
        result = model.predict(request.data)

        # Record success
        prediction_counter.labels(model_name='bert', status='success').inc()

        return jsonify(result)

    except Exception as e:
        # Record failure
        prediction_counter.labels(model_name='bert', status='error').inc()
        raise

    finally:
        # Record latency
        duration = time.time() - start_time
        prediction_latency.labels(model_name='bert').observe(duration)
```

**在 Kubernetes 中暴露指标端点：**

```yaml
# service-with-metrics.yaml
apiVersion: v1
kind: Service
metadata:
  name: bert-inference
  namespace: ml-serving
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
    prometheus.io/path: "/metrics"
spec:
  selector:
    app: bert
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 8000
    targetPort: 8000
```

**ServiceMonitor（用于 Prometheus Operator）：**

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: bert-inference-metrics
  namespace: ml-serving
spec:
  selector:
    matchLabels:
      app: bert
  endpoints:
  - port: metrics
    interval: 30s
```

### 3.3 需要监控的关键指标

**ML 训练指标：**

```promql
# Training throughput (samples/sec)
rate(training_samples_total[5m])

# Training loss (latest value)
training_loss

# GPU utilization
DCGM_FI_DEV_GPU_UTIL{namespace="ml-training"}

# GPU memory usage
DCGM_FI_DEV_FB_USED{namespace="ml-training"} / DCGM_FI_DEV_FB_TOTAL{namespace="ml-training"} * 100

# Data loading time
rate(data_loading_duration_seconds_sum[5m]) / rate(data_loading_duration_seconds_count[5m])
```

**ML 推理指标：**

```promql
# Request rate (req/sec)
rate(model_predictions_total[5m])

# Error rate
rate(model_predictions_total{status="error"}[5m]) / rate(model_predictions_total[5m]) * 100

# P50, P95, P99 latency
histogram_quantile(0.50, rate(model_prediction_duration_seconds_bucket[5m]))
histogram_quantile(0.95, rate(model_prediction_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(model_prediction_duration_seconds_bucket[5m]))

# Queue depth
prediction_queue_depth

# Replica count
kube_deployment_status_replicas{namespace="ml-serving", deployment="bert-inference"}
```

**基础设施指标：**

```promql
# Node CPU usage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node memory usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total{namespace="ml-serving"}[5m])) by (pod)

# Pod memory usage
sum(container_memory_working_set_bytes{namespace="ml-serving"}) by (pod)

# PVC usage
kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes * 100
```

### 3.4 Grafana 仪表盘

**访问 Grafana：**

```bash
kubectl port-forward service/prometheus-grafana 3000:80 -n monitoring

# Get admin password
kubectl get secret prometheus-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 -d
```

**导入预构建仪表盘：**

1. 前往 Dashboards → Import。
2. 输入仪表盘 ID：
   - **6417**：Kubernetes Cluster Monitoring（集群监控）。
   - **7249**：Kubernetes Cluster（集群）。
   - **12239**：NVIDIA DCGM Exporter Dashboard（GPU 监控）。
   - **13770**：Kubernetes / Views / Pods（Pod 视图）。

**为 ML 推理创建自定义仪表盘：**

```json
{
  "dashboard": {
    "title": "ML Inference Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {"expr": "sum(rate(model_predictions_total[5m]))"}
        ]
      },
      {
        "title": "Error Rate %",
        "targets": [
          {"expr": "sum(rate(model_predictions_total{status='error'}[5m])) / sum(rate(model_predictions_total[5m])) * 100"}
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {"expr": "histogram_quantile(0.95, rate(model_prediction_duration_seconds_bucket[5m]))"}
        ]
      },
      {
        "title": "GPU Utilization",
        "targets": [
          {"expr": "DCGM_FI_DEV_GPU_UTIL{namespace='ml-serving'}"}
        ]
      }
    ]
  }
}
```

## 4. 告警

### 4.1 Prometheus Alertmanager

**配置告警规则：**

```yaml
# prometheus-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ml-inference-alerts
  namespace: monitoring
spec:
  groups:
  - name: ml-inference
    interval: 30s
    rules:
    # High error rate
    - alert: HighErrorRate
      expr: |
        sum(rate(model_predictions_total{status="error"}[5m])) /
        sum(rate(model_predictions_total[5m])) * 100 > 5
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate in ML inference"
        description: "Error rate is {{ $value }}% (threshold: 5%)"

    # High latency
    - alert: HighInferenceLatency
      expr: |
        histogram_quantile(0.95,
          rate(model_prediction_duration_seconds_bucket[5m])
        ) > 1.0
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High inference latency"
        description: "P95 latency is {{ $value }}s (threshold: 1s)"

    # GPU OOM risk
    - alert: GPUMemoryHigh
      expr: |
        DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_TOTAL * 100 > 95
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "GPU memory nearly full"
        description: "GPU {{ $labels.gpu }} memory usage is {{ $value }}%"

    # Training job stuck
    - alert: TrainingJobStuck
      expr: |
        time() - training_last_update_timestamp_seconds > 600
      for: 10m
      labels:
        severity: critical
      annotations:
        summary: "Training job appears stuck"
        description: "No updates for {{ $value }}s"

    # Pod CrashLooping
    - alert: PodCrashLooping
      expr: |
        rate(kube_pod_container_status_restarts_total{namespace="ml-serving"}[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Restart count increased in last 15 minutes"
```

**配置 Alertmanager：**

```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-prometheus-kube-prometheus-alertmanager
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m

    route:
      group_by: ['alertname', 'severity']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack-notifications'
      routes:
      - match:
          severity: critical
        receiver: 'pagerduty'

    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#ml-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

    - name: 'pagerduty'
      pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

## 5. 分布式链路追踪

### 5.1 用于 ML 流水线的 OpenTelemetry

**安装 OpenTelemetry：**

```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace tracing \
  --create-namespace
```

**为 Python 应用添加链路追踪埋点：**

```python
# inference_server.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

otlp_exporter = OTLPSpanExporter(endpoint="http://opentelemetry-collector:4317")
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Trace inference request
@app.route('/predict', methods=['POST'])
def predict():
    with tracer.start_as_current_span("model_inference") as span:
        span.set_attribute("model.name", "bert")

        # Preprocessing
        with tracer.start_as_current_span("preprocess"):
            input_data = preprocess(request.data)

        # Inference
        with tracer.start_as_current_span("inference"):
            result = model.predict(input_data)

        # Postprocessing
        with tracer.start_as_current_span("postprocess"):
            output = postprocess(result)

        span.set_attribute("prediction.result", output)
        return jsonify(output)
```

**在 Jaeger 中查看 Trace：**

```bash
helm install jaeger jaegertracing/jaeger \
  --namespace tracing \
  --set collector.service.otlp.grpc.enabled=true

kubectl port-forward service/jaeger-query 16686:16686 -n tracing
# Access at http://localhost:16686
```

## 6. 生产环境最佳实践

### 6.1 可观测性检查清单

**针对 ML 训练：**
- [ ] 记录训练进度（Epoch、Loss、指标）。
- [ ] 追踪 GPU 利用率与显存。
- [ ] 监控数据加载时间。
- [ ] 任务失败或卡住时告警。
- [ ] 导出带版本标签的检查点。

**针对 ML 推理：**
- [ ] 追踪请求速率、错误与延迟（RED 指标）。
- [ ] 监控队列深度与并发量。
- [ ] 追踪当前提供服务的模型版本。
- [ ] 实现健康检查与就绪探针。
- [ ] 对 SLA 违规告警（例如 p99 延迟超过阈值）。

### 6.2 调试运行手册（Runbook）

**问题：Pod 卡在 Pending 状态**
1. 执行 kubectl describe pod → 查看 Events。
2. 排查：资源不足、PVC 未绑定、节点选择器不匹配。
3. 解决：扩容集群、修复 PVC、调整选择器。

**问题：Pod 出现 CrashLoopBackOff**
1. 执行 kubectl logs --previous → 查看此前崩溃容器的日志。
2. 常见原因：OOM、缺少依赖、命令错误。
3. 解决：在确认内存瓶颈后调整内存、修复 Dockerfile、纠正入口命令。

**问题：Service 无法访问**
1. 执行 kubectl get endpoints → 检查 Service 是否具有后端端点。
2. 执行 kubectl describe service → 检查选择器是否匹配 Pod 标签。
3. 直接测试 Pod：`kubectl exec ... -- curl localhost:8080`。

**问题：延迟较高**
1. 检查 kubectl top pods → 是否存在 CPU/内存瓶颈？
2. 检查 GPU 利用率 → nvidia-smi。
3. 检查 HPA → 自动扩缩容是否正常？
4. 检查应用日志 → 是否存在慢查询或缓慢的外部 API 调用？

## 7. 总结

### 核心要点

**kubectl 调试：**
- kubectl describe：查看事件与状态。
- kubectl logs：查看应用日志。
- kubectl exec：交互式调试。
- kubectl top：查看资源使用情况。

**日志：**
- 使用结构化日志（JSON），便于解析。
- 使用 Loki 或 Fluentd 进行日志聚合。
- 使用 LogQL 或 Elasticsearch 查询日志。

**指标：**
- 使用 Prometheus 客户端为应用添加埋点。
- 监控 RED 指标（Rate、Errors、Duration，即请求速率、错误、耗时）。
- 追踪 ML 专用指标（GPU、Loss、吞吐量）。
- 创建自定义 Grafana 仪表盘。

**告警：**
- 针对关键问题定义告警（高错误率、OOM、崩溃）。
- 使用 Alertmanager 进行通知路由（Slack、PagerDuty）。
- 设置合理阈值及持续时间（for）。

**分布式链路追踪：**
- 使用 OpenTelemetry 追踪 ML 流水线。
- 使用 Jaeger 或 Zipkin 可视化。
- 识别多步骤工作流中的瓶颈。

## 自我检查问题

1. 如何检查 Pod 为什么卡在 Pending 状态？
2. 什么命令可以获取此前崩溃的容器日志？
3. 可观测性的三大支柱是什么？
4. 如何从 Python 应用暴露自定义指标？
5. Prometheus 中哪种查询可以显示 p95 延迟？
6. 如何针对 GPU 显存使用率过高进行告警？
7. 存活探针与就绪探针有什么区别？
8. 如何调试 Kubernetes Service 相关的 502 错误？

## 补充资源

- [kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Prometheus 查询示例](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Grafana 仪表盘](https://grafana.com/grafana/dashboards/)
- [OpenTelemetry 文档](https://opentelemetry.io/docs/)
- [Loki LogQL](https://grafana.com/docs/loki/latest/logql/)

---

**恭喜！** 你已完成模块 04：Kubernetes 基础。现在具备在 Kubernetes 上部署、管理、监控及排查 ML 工作负载的基础技能。

> 译注：Promtail 属于原文所用时期的日志采集器，新部署应核对当前支持的采集方案，例如 Grafana Alloy。Fluentd 是日志采集与转发组件，并不独立提供完整的日志查询存储。kubectl top 主要展示资源用量，并不直接揭示所有瓶颈；排查时还需结合限流、调度、队列与依赖指标。Service 后端宜同时检查 EndpointSlice 及就绪状态。训练任务的失败与重试行为受 Job 和 Pod 重启策略影响，并非都会呈现 CrashLoopBackOff。示例监控与告警配置、仪表盘 ID 和企业数据未逐项核验；原始代码块及其中英文注释保持不变。
