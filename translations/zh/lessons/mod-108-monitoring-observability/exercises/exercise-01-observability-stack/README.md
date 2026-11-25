# 练习 01：生产级可观测性技术栈（Prometheus + Grafana + Loki）

**预计时长：** 28–36 小时。

## 业务背景

AI 基础设施团队维护 50 个以上微服务，每天处理 1,000 万次 ML 模型推理 API 请求。当前情况较为混乱：

- **没有集中式指标：** 各团队使用不同监控工具（CloudWatch、Datadog、自定义脚本）。
- **告警疲劳：** 每天超过 200 条告警，95% 为误报。
- **事故解决缓慢：** 平均发现问题耗时 45 分钟，平均解决问题耗时 4 小时。
- **费用较高：** 分散的监控工具每月花费 15,000 美元。
- **可见性差：** 无法跨服务关联指标、日志与 Trace。

近期一次生产中断（停机 3 小时，收入损失 50 万美元）暴露出严重可观测性缺口。CTO 要求建立**统一可观测性平台**：

1. 为全部服务实现**集中式指标采集**（Prometheus）。
2. 提供**丰富的可视化**仪表盘（Grafana）。
3. **集中式日志**（Loki/Grafana Loki）。
4. **智能告警**（每天少于 10 条告警，超过 95% 可执行）。
5. **成本效率**（在相同覆盖范围下每月费用低于 5,000 美元）。

## 学习目标

完成本练习后，你将能够：

1. 在 Kubernetes 部署生产级 Prometheus + Grafana + Loki 技术栈。
2. 全面采集基础设施、应用程序及 ML 模型的指标。
3. 遵循最佳实践设计有效的 Grafana 仪表盘。
4. 配置智能告警规则，尽量减少误报。
5. 使用结构化日志与日志聚合搭建集中式日志系统。
6. 实现 SLI（服务级别指标）及 SLO（服务级别目标）追踪。
7. 优化监控费用及数据保留策略。

## 前置条件

- Module 104（Kubernetes 基础）。
- Module 103（容器最佳实践）。
- 基本理解指标、日志及告警。
- 熟练使用 Linux 命令行。
- Python 编程。

## 问题描述

构建**生产级可观测性技术栈**：

1. **采集指标：** Kubernetes、应用程序及 ML 模型。
2. **聚合日志：** 对全部服务采用结构化日志。
3. **可视化：** 通过直观仪表盘展示系统健康状态。
4. **告警：** 针对关键问题发出告警，尽量减少误报。
5. **追踪 SLO** 与错误预算。
6. 通过智能数据保留策略**优化成本**。

### 成功指标

- 全部服务（50 个以上）具有指标及日志埋点。
- 告警数量从每天 200 条减少至不足 10 条。
- 告警准确率超过 95%（可执行告警）。
- 平均发现时间（MTTD）低于 5 分钟。
- 平均解决时间（MTTR）低于 30 分钟。
- 总费用每月低于 5,000 美元（降低约 70%）。
- 查询 30 天数据时仪表盘加载时间低于 2 秒。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│              Production Observability Stack                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Prometheus  │    │ Grafana Loki │    │   Grafana    │  │
│  │  (Metrics)   │◀───│   (Logs)     │◀───│ (Visualize)  │  │
│  │  TSDB        │    │  LogQL       │    │  Dashboards  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ▲                    ▲                    │          │
│         │                    │                    │          │
│         │                    │                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Exporters   │    │   Promtail   │    │ AlertManager │  │
│  │  - Node      │    │ (Log Agent)  │    │  (Alerts)    │  │
│  │  - Kube State│    │  - Scrape    │    │  - PagerDuty │  │
│  │  - cAdvisor  │    │  - Parse     │    │  - Slack     │  │
│  │  - Custom    │    │  - Forward   │    │  - Email     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ▲                    ▲                              │
│         │                    │                              │
│         └────────────────────┴──────────────┐               │
│                                              │               │
│  ┌──────────────────────────────────────────┼─────────────┐ │
│  │         Kubernetes Cluster               │             │ │
│  │                                           │             │ │
│  │  ┌──────────────┐    ┌──────────────┐   │             │ │
│  │  │  ML Model    │    │  API Gateway │   │             │ │
│  │  │  Inference   │───▶│   (FastAPI)  │───┘             │ │
│  │  │  (PyTorch)   │    │              │                 │ │
│  │  └──────────────┘    └──────────────┘                 │ │
│  │         │                    │                         │ │
│  │         └────────────────────┴─────────────┐           │ │
│  │                                             ▼           │ │
│  │                                     ┌──────────────┐    │ │
│  │                                     │ Feature      │    │ │
│  │                                     │ Store        │    │ │
│  │                                     │ (Redis)      │    │ │
│  │                                     └──────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 实现任务

### 第一部分：在 Kubernetes 部署 Prometheus 技术栈（7–9 小时）

部署具有高可用性及持久化存储的 Prometheus。

#### 1.1 Prometheus 部署

创建 `kubernetes/prometheus/deployment.yaml`：

```yaml
# TODO: Deploy Prometheus with persistent volume

apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s  # How often to scrape targets
      evaluation_interval: 15s  # How often to evaluate rules
      external_labels:
        cluster: 'production'
        region: 'us-west-2'

    # Alertmanager configuration
    alerting:
      alertmanagers:
        - static_configs:
            - targets: ['alertmanager:9093']

    # Load alerting rules
    rule_files:
      - '/etc/prometheus/rules/*.yml'

    scrape_configs:
      # Scrape Prometheus itself
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']

      # TODO: Scrape Kubernetes API server metrics
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https

      # TODO: Scrape Kubernetes nodes (kubelet)
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)

      # TODO: Scrape Kubernetes pods with prometheus.io/scrape annotation
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          # Only scrape pods with prometheus.io/scrape: "true"
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          # Use custom port if specified
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            target_label: __address__
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
          # Add pod labels as metric labels
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: kubernetes_pod_name

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: prometheus
  namespace: monitoring
spec:
  serviceName: prometheus
  replicas: 2  # High availability
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
        - name: prometheus
          image: prom/prometheus:v2.45.0
          args:
            - '--config.file=/etc/prometheus/prometheus.yml'
            - '--storage.tsdb.path=/prometheus'
            - '--storage.tsdb.retention.time=30d'  # Keep 30 days of data
            - '--storage.tsdb.retention.size=50GB'  # Max 50GB per replica
            - '--web.enable-lifecycle'  # Allow reloading config via API
            - '--web.enable-admin-api'  # Enable admin APIs for debugging
          ports:
            - containerPort: 9090
              name: http
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
            - name: storage
              mountPath: /prometheus
            - name: rules
              mountPath: /etc/prometheus/rules
          resources:
            requests:
              memory: "4Gi"
              cpu: "1000m"
            limits:
              memory: "8Gi"
              cpu: "2000m"
          # TODO: Implement readiness and liveness probes
          readinessProbe:
            httpGet:
              path: /-/ready
              port: 9090
            initialDelaySeconds: 30
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /-/healthy
              port: 9090
            initialDelaySeconds: 30
            periodSeconds: 15
      volumes:
        - name: config
          configMap:
            name: prometheus-config
        - name: rules
          configMap:
            name: prometheus-rules
  volumeClaimTemplates:
    - metadata:
        name: storage
      spec:
        accessModes: ['ReadWriteOnce']
        storageClassName: fast-ssd  # Use SSD for better query performance
        resources:
          requests:
            storage: 100Gi

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: ClusterIP
```

#### 1.2 用于全面采集指标的 Exporter

创建 `kubernetes/prometheus/exporters.yaml`：

```yaml
# TODO: Deploy Node Exporter (hardware/OS metrics)

apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true  # Access host network stats
      hostPID: true      # Access host processes
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.6.0
          args:
            - '--path.procfs=/host/proc'
            - '--path.sysfs=/host/sys'
            - '--path.rootfs=/host/root'
            - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
          ports:
            - containerPort: 9100
              name: metrics
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
            - name: root
              mountPath: /host/root
              readOnly: true
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
        - name: root
          hostPath:
            path: /

---
# TODO: Deploy Kube State Metrics (Kubernetes object state)

apiVersion: apps/v1
kind: Deployment
metadata:
  name: kube-state-metrics
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-state-metrics
  template:
    metadata:
      labels:
        app: kube-state-metrics
    spec:
      serviceAccountName: kube-state-metrics
      containers:
        - name: kube-state-metrics
          image: registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.9.2
          ports:
            - containerPort: 8080
              name: http-metrics
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"

# TODO: Add service and RBAC permissions for kube-state-metrics
```

#### 1.3 自定义应用程序指标

创建 `src/instrumentation/prometheus_metrics.py`：

```python
from prometheus_client import Counter, Histogram, Gauge, Summary
from prometheus_client import start_http_server, REGISTRY
from functools import wraps
import time
from typing import Callable

class PrometheusInstrumentation:
    """
    Instrumentation for ML inference service.

    Expose metrics on /metrics endpoint for Prometheus scraping.
    """

    def __init__(self, service_name: str, port: int = 8000):
        self.service_name = service_name

        # TODO: Define request metrics
        self.request_count = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status']
        )

        self.request_duration = Histogram(
            'http_request_duration_seconds',
            'HTTP request latency',
            ['method', 'endpoint'],
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0]  # SLO-aligned buckets
        )

        # TODO: Define ML-specific metrics
        self.prediction_count = Counter(
            'ml_predictions_total',
            'Total ML predictions made',
            ['model_name', 'model_version']
        )

        self.prediction_latency = Histogram(
            'ml_prediction_duration_seconds',
            'ML prediction latency',
            ['model_name', 'model_version'],
            buckets=[0.001, 0.01, 0.05, 0.1, 0.5, 1.0]  # Most predictions <100ms
        )

        self.model_load_time = Gauge(
            'ml_model_load_time_seconds',
            'Time to load model',
            ['model_name', 'model_version']
        )

        self.active_models = Gauge(
            'ml_active_models',
            'Number of models currently loaded',
            ['model_name']
        )

        # TODO: Feature store metrics
        self.feature_fetch_duration = Histogram(
            'feature_fetch_duration_seconds',
            'Time to fetch features',
            ['feature_store'],
            buckets=[0.001, 0.005, 0.01, 0.05, 0.1]
        )

        self.cache_hit_ratio = Gauge(
            'cache_hit_ratio',
            'Feature cache hit ratio',
            ['cache_type']
        )

        # TODO: Resource metrics
        self.gpu_utilization = Gauge(
            'gpu_utilization_percent',
            'GPU utilization percentage',
            ['gpu_id']
        )

        self.gpu_memory_used = Gauge(
            'gpu_memory_used_bytes',
            'GPU memory used',
            ['gpu_id']
        )

    def track_request(self, method: str, endpoint: str):
        """
        TODO: Decorator to track HTTP request metrics

        Usage:
        @instrumentor.track_request('POST', '/predict')
        async def predict(request):
            ...

        Tracks:
        - Request count
        - Request duration
        - Error rate (5xx responses)
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()

                try:
                    result = await func(*args, **kwargs)
                    status = getattr(result, 'status_code', 200)
                    return result
                except Exception as e:
                    status = 500
                    raise
                finally:
                    duration = time.time() - start_time

                    # TODO: Record metrics
                    self.request_count.labels(
                        method=method,
                        endpoint=endpoint,
                        status=status
                    ).inc()

                    self.request_duration.labels(
                        method=method,
                        endpoint=endpoint
                    ).observe(duration)

            return wrapper
        return decorator

    def track_prediction(self, model_name: str, model_version: str):
        """
        TODO: Decorator to track ML prediction metrics

        Usage:
        @instrumentor.track_prediction('fraud-detector', 'v2.1')
        async def predict(features):
            ...

        Tracks:
        - Prediction count
        - Prediction latency
        - Model version usage
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                result = await func(*args, **kwargs)
                duration = time.time() - start_time

                # TODO: Record metrics
                self.prediction_count.labels(
                    model_name=model_name,
                    model_version=model_version
                ).inc()

                self.prediction_latency.labels(
                    model_name=model_name,
                    model_version=model_version
                ).observe(duration)

                return result
            return wrapper
        return decorator

    def update_gpu_metrics(self):
        """
        TODO: Update GPU utilization metrics (called periodically)

        Use pynvml to query NVIDIA GPU stats:
        import pynvml

        pynvml.nvmlInit()
        device_count = pynvml.nvmlDeviceGetCount()

        for i in range(device_count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
            util = pynvml.nvmlDeviceGetUtilizationRates(handle)
            memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)

            self.gpu_utilization.labels(gpu_id=str(i)).set(util.gpu)
            self.gpu_memory_used.labels(gpu_id=str(i)).set(memory_info.used)

        pynvml.nvmlShutdown()
        """
        pass

    def start_metrics_server(self, port: int = 9090):
        """
        TODO: Start Prometheus metrics HTTP server

        start_http_server(port)

        Exposes /metrics endpoint for Prometheus to scrape
        """
        pass
```

### 第二部分：部署 Grafana + Loki 日志系统（6–8 小时）

使用 Grafana Loki 搭建集中式日志与日志可视化系统。

#### 2.1 Loki 部署

创建 `kubernetes/loki/deployment.yaml`：

```yaml
# TODO: Deploy Loki for log aggregation

apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-config
  namespace: monitoring
data:
  loki.yaml: |
    auth_enabled: false

    server:
      http_listen_port: 3100

    ingester:
      lifecycler:
        ring:
          kvstore:
            store: inmemory
          replication_factor: 1
      chunk_idle_period: 5m
      chunk_retain_period: 30s
      max_chunk_age: 1h
      max_transfer_retries: 0

    schema_config:
      configs:
        - from: 2023-01-01
          store: boltdb-shipper
          object_store: filesystem
          schema: v11
          index:
            prefix: index_
            period: 24h

    storage_config:
      boltdb_shipper:
        active_index_directory: /loki/boltdb-shipper-active
        cache_location: /loki/boltdb-shipper-cache
        shared_store: filesystem
      filesystem:
        directory: /loki/chunks

    limits_config:
      enforce_metric_name: false
      reject_old_samples: true
      reject_old_samples_max_age: 168h  # 7 days
      ingestion_rate_mb: 10
      ingestion_burst_size_mb: 20

    chunk_store_config:
      max_look_back_period: 744h  # 31 days

    table_manager:
      retention_deletes_enabled: true
      retention_period: 744h  # 31 days

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki
  namespace: monitoring
spec:
  serviceName: loki
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
    spec:
      containers:
        - name: loki
          image: grafana/loki:2.8.0
          args:
            - '-config.file=/etc/loki/loki.yaml'
          ports:
            - containerPort: 3100
              name: http
          volumeMounts:
            - name: config
              mountPath: /etc/loki
            - name: storage
              mountPath: /loki
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
      volumes:
        - name: config
          configMap:
            name: loki-config
  volumeClaimTemplates:
    - metadata:
        name: storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 50Gi
```

#### 2.2 Promtail 日志采集

创建 `kubernetes/loki/promtail.yaml`：

```yaml
# TODO: Deploy Promtail to scrape logs from all pods

apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: monitoring
data:
  promtail.yaml: |
    server:
      http_listen_port: 9080
      grpc_listen_port: 0

    positions:
      filename: /tmp/positions.yaml

    clients:
      - url: http://loki:3100/loki/api/v1/push

    scrape_configs:
      # Scrape all pod logs
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          # Add namespace label
          - source_labels: [__meta_kubernetes_pod_namespace]
            target_label: namespace
          # Add pod name label
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: pod
          # Add container name label
          - source_labels: [__meta_kubernetes_pod_container_name]
            target_label: container
          # Add all pod labels as labels
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
        pipeline_stages:
          # Parse JSON logs
          - json:
              expressions:
                timestamp: timestamp
                level: level
                message: message
                trace_id: trace_id
          # Extract timestamp
          - timestamp:
              source: timestamp
              format: RFC3339
          # Set log level as label
          - labels:
              level: level

---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: promtail
  template:
    metadata:
      labels:
        app: promtail
    spec:
      serviceAccountName: promtail
      containers:
        - name: promtail
          image: grafana/promtail:2.8.0
          args:
            - '-config.file=/etc/promtail/promtail.yaml'
          volumeMounts:
            - name: config
              mountPath: /etc/promtail
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
      volumes:
        - name: config
          configMap:
            name: promtail-config
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

#### 2.3 结构化日志

创建 `src/logging/structured_logger.py`：

```python
import logging
import json
from pythonjsonlogger import jsonlogger
from typing import Dict, Any, Optional
import traceback
from contextvars import ContextVar

# Context variable for trace ID (propagated across async calls)
trace_id_var: ContextVar[Optional[str]] = ContextVar('trace_id', default=None)

class StructuredLogger:
    """
    Structured JSON logger for centralized log aggregation.

    All logs are JSON-formatted for easy parsing by Loki/Elasticsearch.
    """

    def __init__(self, service_name: str, level: str = 'INFO'):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(getattr(logging, level.upper()))

        # TODO: Configure JSON formatter
        json_handler = logging.StreamHandler()
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s %(trace_id)s %(service)s'
        )
        json_handler.setFormatter(formatter)
        self.logger.addHandler(json_handler)

    def _add_context(self, extra: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO: Add standard context to all log entries

        - timestamp (ISO 8601)
        - service name
        - trace_id (for distributed tracing correlation)
        - environment (dev/staging/prod)
        """
        from datetime import datetime

        context = {
            'timestamp': datetime.utcnow().isoformat(),
            'service': self.service_name,
            'trace_id': trace_id_var.get(),
            **extra
        }

        return context

    def info(self, message: str, **kwargs):
        """
        TODO: Log info message with structured context

        Usage:
        logger.info(
            "Model prediction completed",
            model_name="fraud-detector",
            model_version="v2.1",
            latency_ms=45.2,
            prediction="fraud"
        )

        Output:
        {
            "timestamp": "2023-10-25T10:30:45.123Z",
            "level": "INFO",
            "service": "ml-inference",
            "message": "Model prediction completed",
            "trace_id": "abc-123-def",
            "model_name": "fraud-detector",
            "model_version": "v2.1",
            "latency_ms": 45.2,
            "prediction": "fraud"
        }
        """
        extra = self._add_context(kwargs)
        self.logger.info(message, extra=extra)

    def error(self, message: str, exc_info: Optional[Exception] = None, **kwargs):
        """
        TODO: Log error with exception traceback

        Include full exception details for debugging
        """
        extra = self._add_context(kwargs)

        if exc_info:
            extra['exception_type'] = type(exc_info).__name__
            extra['exception_message'] = str(exc_info)
            extra['traceback'] = traceback.format_exc()

        self.logger.error(message, extra=extra, exc_info=exc_info)

    def warn(self, message: str, **kwargs):
        """TODO: Log warning message"""
        extra = self._add_context(kwargs)
        self.logger.warning(message, extra=extra)

    def set_trace_id(self, trace_id: str):
        """Set trace ID for correlation with distributed tracing."""
        trace_id_var.set(trace_id)

# Usage example:
logger = StructuredLogger('ml-inference')
logger.set_trace_id('request-123-abc')
logger.info(
    "Processing prediction request",
    model_name="fraud-detector",
    input_features=["amount", "merchant", "location"]
)
```

### 第三部分：Grafana 仪表盘（7–9 小时）

创建全面的仪表盘，提供系统可见性。

#### 3.1 Grafana 部署

创建 `kubernetes/grafana/deployment.yaml`：

```yaml
# TODO: Deploy Grafana with Prometheus and Loki data sources

apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prometheus:9090
        isDefault: true
        jsonData:
          timeInterval: 15s

      - name: Loki
        type: loki
        access: proxy
        url: http://loki:3100

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.0.0
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-credentials
                  key: admin-password
            - name: GF_INSTALL_PLUGINS
              value: "grafana-piechart-panel,grafana-clock-panel"
          volumeMounts:
            - name: datasources
              mountPath: /etc/grafana/provisioning/datasources
            - name: dashboards-config
              mountPath: /etc/grafana/provisioning/dashboards
            - name: dashboards
              mountPath: /var/lib/grafana/dashboards
            - name: storage
              mountPath: /var/lib/grafana
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
      volumes:
        - name: datasources
          configMap:
            name: grafana-datasources
        - name: dashboards-config
          configMap:
            name: grafana-dashboard-config
        - name: dashboards
          configMap:
            name: grafana-dashboards
        - name: storage
          emptyDir: {}
```

#### 3.2 仪表盘即代码（Dashboard-as-Code）

创建 `src/dashboards/ml_inference_dashboard.py`：

```python
from grafanalib.core import (
    Dashboard, TimeSeries, Target, GridPos,
    RowPanel, single_y_axis, Alert, AlertCondition
)

def create_ml_inference_dashboard():
    """
    TODO: Create ML inference dashboard using grafanalib

    Dashboard sections:
    1. Overview: Request rate, error rate, latency
    2. Model Performance: Predictions/sec, latency by model
    3. Resource Usage: CPU, memory, GPU utilization
    4. Feature Store: Cache hit rate, fetch latency
    5. SLO Tracking: Error budget, uptime

    This is "dashboard as code" for version control and automation
    """

    # TODO: Panel 1 - Request Rate
    request_rate_panel = TimeSeries(
        title='Request Rate (req/s)',
        dataSource='Prometheus',
        targets=[
            Target(
                expr='rate(http_requests_total{job="ml-inference"}[5m])',
                legendFormat='{{endpoint}}',
            ),
        ],
        gridPos=GridPos(h=8, w=12, x=0, y=0),
        yAxes=single_y_axis(format='reqps'),
    )

    # TODO: Panel 2 - Error Rate
    error_rate_panel = TimeSeries(
        title='Error Rate (%)',
        dataSource='Prometheus',
        targets=[
            Target(
                expr='rate(http_requests_total{job="ml-inference",status=~"5.."}[5m]) / rate(http_requests_total{job="ml-inference"}[5m]) * 100',
                legendFormat='Error Rate',
            ),
        ],
        gridPos=GridPos(h=8, w=12, x=12, y=0),
        yAxes=single_y_axis(format='percent'),
        alert=Alert(
            name='High Error Rate',
            message='Error rate above 1%',
            conditions=[
                AlertCondition(
                    evaluator={'params': [1], 'type': 'gt'},
                    operator={'type': 'and'},
                    query={'params': ['A', '5m', 'now']},
                    reducer={'params': [], 'type': 'avg'},
                    type='query',
                ),
            ],
        ),
    )

    # TODO: Panel 3 - P95 Latency
    latency_panel = TimeSeries(
        title='P95 Latency (ms)',
        dataSource='Prometheus',
        targets=[
            Target(
                expr='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="ml-inference"}[5m])) * 1000',
                legendFormat='{{endpoint}}',
            ),
        ],
        gridPos=GridPos(h=8, w=12, x=0, y=8),
        yAxes=single_y_axis(format='ms'),
    )

    # TODO: Panel 4 - Predictions per Model
    predictions_panel = TimeSeries(
        title='Predictions/sec by Model',
        dataSource='Prometheus',
        targets=[
            Target(
                expr='rate(ml_predictions_total[5m])',
                legendFormat='{{model_name}} ({{model_version}})',
            ),
        ],
        gridPos=GridPos(h=8, w=12, x=12, y=8),
    )

    # TODO: Panel 5 - GPU Utilization
    gpu_util_panel = TimeSeries(
        title='GPU Utilization (%)',
        dataSource='Prometheus',
        targets=[
            Target(
                expr='gpu_utilization_percent',
                legendFormat='GPU {{gpu_id}}',
            ),
        ],
        gridPos=GridPos(h=8, w=12, x=0, y=16),
        yAxes=single_y_axis(format='percent', max=100),
    )

    # TODO: Create dashboard
    dashboard = Dashboard(
        title='ML Inference Service',
        description='Monitoring for ML inference service',
        tags=['ml', 'inference', 'production'],
        timezone='UTC',
        panels=[
            RowPanel(gridPos=GridPos(h=1, w=24, x=0, y=0), title='Overview'),
            request_rate_panel,
            error_rate_panel,
            latency_panel,
            predictions_panel,
            gpu_util_panel,
        ],
        refresh='30s',
    ).auto_panel_ids()

    return dashboard

# TODO: Export dashboard to JSON
if __name__ == '__main__':
    import json
    from grafanalib._gen import DashboardEncoder

    dashboard = create_ml_inference_dashboard()
    print(json.dumps(dashboard.to_json_data(), cls=DashboardEncoder, indent=2))
```

### 第四部分：智能告警（4–6 小时）

配置 Alertmanager，支持智能路由与去重。

#### 4.1 告警规则

创建 `kubernetes/prometheus/alert-rules.yaml`：

```yaml
# TODO: Define comprehensive alerting rules

apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  alerts.yml: |
    groups:
      # TODO: Infrastructure alerts
      - name: infrastructure
        interval: 30s
        rules:
          - alert: HighCPUUsage
            expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
            for: 5m
            labels:
              severity: warning
              team: platform
            annotations:
              summary: "High CPU usage on {{ $labels.instance }}"
              description: "CPU usage is above 80% (current: {{ $value }}%)"

          - alert: HighMemoryUsage
            expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
            for: 5m
            labels:
              severity: warning
              team: platform
            annotations:
              summary: "High memory usage on {{ $labels.instance }}"
              description: "Memory usage is above 85% (current: {{ $value }}%)"

          - alert: DiskSpaceLow
            expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
            for: 5m
            labels:
              severity: critical
              team: platform
            annotations:
              summary: "Disk space low on {{ $labels.instance }}"
              description: "Disk space is below 15% (current: {{ $value }}%)"

      # TODO: ML service alerts
      - name: ml_service
        interval: 30s
        rules:
          - alert: HighErrorRate
            expr: |
              rate(http_requests_total{job="ml-inference",status=~"5.."}[5m])
              /
              rate(http_requests_total{job="ml-inference"}[5m])
              * 100 > 1
            for: 5m
            labels:
              severity: critical
              team: ml-platform
            annotations:
              summary: "High error rate in ML inference service"
              description: "Error rate is above 1% (current: {{ $value }}%)"

          - alert: HighLatency
            expr: |
              histogram_quantile(0.95,
                rate(http_request_duration_seconds_bucket{job="ml-inference"}[5m])
              ) * 1000 > 500
            for: 5m
            labels:
              severity: warning
              team: ml-platform
            annotations:
              summary: "High P95 latency in ML inference"
              description: "P95 latency is above 500ms (current: {{ $value }}ms)"

          - alert: ModelPredictionFailure
            expr: rate(ml_predictions_total{status="failure"}[5m]) > 10
            for: 2m
            labels:
              severity: critical
              team: ml-platform
            annotations:
              summary: "ML model prediction failures detected"
              description: "Prediction failure rate: {{ $value }}/sec for {{ $labels.model_name }}"

          - alert: GPUUtilizationLow
            expr: avg(gpu_utilization_percent) < 20
            for: 15m
            labels:
              severity: info
              team: ml-platform
            annotations:
              summary: "Low GPU utilization"
              description: "GPU utilization is below 20% (current: {{ $value }}%). Consider scaling down."

      # TODO: SLO alerts (error budget)
      - name: slo
        interval: 1m
        rules:
          - alert: ErrorBudgetBurnRateCritical
            expr: |
              (
                1 - (
                  sum(rate(http_requests_total{job="ml-inference",status!~"5.."}[1h]))
                  /
                  sum(rate(http_requests_total{job="ml-inference"}[1h]))
                )
              ) / (1 - 0.999) > 14.4  # Burn rate for 99.9% SLO
            for: 2m
            labels:
              severity: critical
              team: ml-platform
            annotations:
              summary: "Critical error budget burn rate"
              description: "At this rate, entire monthly error budget will be exhausted in 2 days"

          - alert: ErrorBudgetExhausted
            expr: |
              (
                1 - (
                  sum(rate(http_requests_total{job="ml-inference",status!~"5.."}[30d]))
                  /
                  sum(rate(http_requests_total{job="ml-inference"}[30d]))
                )
              ) >= (1 - 0.999)
            for: 5m
            labels:
              severity: critical
              team: ml-platform
            annotations:
              summary: "Monthly error budget exhausted"
              description: "99.9% SLO violated - error budget for the month is fully consumed"
```

#### 4.2 Alertmanager 配置

创建 `kubernetes/alertmanager/config.yaml`：

```yaml
# TODO: Configure AlertManager for intelligent routing

apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

    # TODO: Route alerts based on severity and team
    route:
      receiver: 'default'
      group_by: ['alertname', 'severity']
      group_wait: 10s  # Wait before sending first notification
      group_interval: 5m  # Wait before sending updates for grouped alerts
      repeat_interval: 4h  # Resend alerts every 4 hours if still firing

      routes:
        # Critical alerts -> PagerDuty (24/7 on-call)
        - match:
            severity: critical
          receiver: 'pagerduty'
          continue: true  # Also send to Slack

        # Warning alerts -> Slack (business hours)
        - match:
            severity: warning
          receiver: 'slack-warnings'

        # Info alerts -> Slack (no page)
        - match:
            severity: info
          receiver: 'slack-info'

        # Team-specific routing
        - match:
            team: ml-platform
          receiver: 'slack-ml-team'

    # TODO: Configure notification receivers
    receivers:
      - name: 'default'
        slack_configs:
          - channel: '#alerts'
            title: 'Alert: {{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

      - name: 'pagerduty'
        pagerduty_configs:
          - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
            description: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'

      - name: 'slack-warnings'
        slack_configs:
          - channel: '#alerts-warnings'
            color: 'warning'
            title: 'Warning: {{ .GroupLabels.alertname }}'

      - name: 'slack-info'
        slack_configs:
          - channel: '#alerts-info'
            color: 'good'

      - name: 'slack-ml-team'
        slack_configs:
          - channel: '#ml-platform-alerts'

    # TODO: Inhibition rules (suppress related alerts)
    inhibit_rules:
      # If node is down, suppress all other alerts from that node
      - source_match:
          alertname: 'NodeDown'
        target_match_re:
          instance: '.*'
        equal: ['instance']

      # If service is down, suppress high latency alerts
      - source_match:
          alertname: 'ServiceDown'
        target_match:
          alertname: 'HighLatency'
        equal: ['job']
```

### 第五部分：SLO 追踪与成本优化（4–6 小时）

实现 SLO 追踪并优化监控成本。

#### 5.1 SLO 计算器

创建 `src/slo/slo_tracker.py`：

```python
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime, timedelta
import requests

@dataclass
class SLO:
    name: str
    target: float  # e.g., 0.999 for 99.9% availability
    window: timedelta  # e.g., 30 days

@dataclass
class ErrorBudget:
    slo: SLO
    total_requests: int
    failed_requests: int
    success_rate: float
    error_budget_remaining: float  # 0-1, where 1 = 100% budget remaining
    burn_rate: float  # How fast error budget is being consumed

class SLOTracker:
    """
    Track SLOs and error budgets using Prometheus metrics.

    SLI (Service Level Indicator): Actual measured performance
    SLO (Service Level Objective): Target performance
    Error Budget: Allowed failure (100% - SLO target)
    """

    def __init__(self, prometheus_url: str):
        self.prometheus_url = prometheus_url

    def calculate_error_budget(self, slo: SLO) -> ErrorBudget:
        """
        TODO: Calculate current error budget for SLO

        Steps:
        1. Query Prometheus for total requests in SLO window
        2. Query for failed requests (5xx errors)
        3. Calculate success rate = (total - failed) / total
        4. Calculate error budget remaining:
           allowed_failures = total * (1 - slo.target)
           error_budget_remaining = (allowed_failures - failed) / allowed_failures

        5. Calculate burn rate (how fast budget is being consumed):
           recent_failure_rate = failed_last_hour / total_last_hour
           burn_rate = recent_failure_rate / (1 - slo.target)
           - burn_rate = 1: Consuming budget at expected rate
           - burn_rate > 1: Consuming budget too fast
           - burn_rate < 1: Below error rate, building buffer

        Return ErrorBudget with all calculated values
        """
        pass

    def _query_prometheus(self, query: str) -> float:
        """
        TODO: Query Prometheus and return result

        response = requests.get(
            f"{self.prometheus_url}/api/v1/query",
            params={'query': query}
        )
        result = response.json()
        return float(result['data']['result'][0]['value'][1])
        """
        pass

    def get_slo_dashboard_metrics(self, slo_name: str) -> Dict:
        """
        TODO: Get metrics for SLO dashboard

        Return:
        {
            'slo_target': 99.9,
            'current_availability': 99.95,
            'error_budget_remaining_percent': 50.0,
            'estimated_budget_exhaustion_date': '2023-11-15',
            'burn_rate': 0.8,
            'requests_last_30d': 10_000_000,
            'errors_last_30d': 5000
        }
        """
        pass

    def check_slo_compliance(self, slo: SLO) -> bool:
        """
        TODO: Check if currently meeting SLO

        error_budget = self.calculate_error_budget(slo)
        return error_budget.success_rate >= slo.target
        """
        pass
```

#### 5.2 成本优化

创建 `src/optimization/metrics_optimizer.py`：

```python
class MetricsOptimizer:
    """
    Optimize Prometheus storage costs through:
    1. Metric cardinality reduction
    2. Intelligent downsampling
    3. Retention policy optimization
    """

    def analyze_cardinality(self, prometheus_url: str) -> Dict:
        """
        TODO: Analyze metric cardinality (number of unique time series)

        High cardinality = expensive storage and slow queries

        Query for cardinality per metric:
        count by (__name__) ({__name__=~".+"})

        Identify high-cardinality metrics (>10,000 series):
        - user_id labels: DON'T use user_id as label (millions of users)
        - request_id labels: DON'T use request_id as label
        - IP addresses: DON'T use IP as label

        Solution: Use aggregated metrics or sample subset
        """
        pass

    def recommend_retention_policy(
        self,
        metrics: List[str],
        query_patterns: Dict[str, int]  # metric -> days_queried_back
    ) -> Dict[str, int]:
        """
        TODO: Recommend retention based on actual query patterns

        Analyze:
        - Which metrics are queried frequently vs rarely
        - How far back queries typically go

        Recommendations:
        - Critical SLO metrics: 90 days
        - Debugging metrics: 30 days
        - Rarely queried metrics: 7 days
        - Very high cardinality: 1 day

        This can reduce storage by 50-70%
        """
        pass

    def calculate_storage_cost(
        self,
        num_metrics: int,
        cardinality: int,
        scrape_interval_seconds: int,
        retention_days: int,
        bytes_per_sample: int = 2
    ) -> Dict:
        """
        TODO: Estimate Prometheus storage requirements

        Formula:
        samples_per_day = cardinality * (86400 / scrape_interval_seconds)
        total_samples = samples_per_day * retention_days
        storage_bytes = total_samples * bytes_per_sample

        Also calculate query performance impact:
        - High cardinality + long retention = slow queries

        Return:
        {
            'storage_gb': 150.5,
            'estimated_monthly_cost': 45.15,  # AWS EBS: $0.10/GB-month
            'query_performance': 'good/moderate/poor'
        }
        """
        pass
```

## 验收标准

### 功能需求

- [ ] Prometheus 采用 HA 部署（2 个副本），保留数据 30 天。
- [ ] 全部服务（50 个以上）实现指标埋点（/metrics 端点）。
- [ ] 部署 Loki + Promtail，实现集中式日志。
- [ ] 全部服务使用结构化 JSON 日志。
- [ ] 部署 Grafana 并配置 Prometheus 与 Loki 数据源。
- [ ] 创建至少 5 个仪表盘（基础设施、ML 服务、SLO、成本）。
- [ ] 配置 Alertmanager，集成 PagerDuty 与 Slack。
- [ ] 15 条以上告警规则覆盖关键场景。
- [ ] 为关键服务实现 SLO 追踪。

### 性能需求

- [ ] 查询 30 天数据时，仪表盘加载时间低于 2 秒。
- [ ] Prometheus 查询响应时间 P95 低于 1 秒。
- [ ] 日志摄取速率超过每秒 10,000 条。
- [ ] 从事故发生到告警通知低于 30 秒。

### 运维需求

- [ ] 每天告警少于 10 条，超过 95% 可执行。
- [ ] MTTD（平均发现时间）低于 5 分钟。
- [ ] 每月监控总费用低于 5,000 美元。
- [ ] 每个 Prometheus 副本存储低于 100GB。
- [ ] 日志保留 30 天，存储低于 50GB。

### 代码质量

- [ ] 全部仪表盘以代码定义（grafanalib）。
- [ ] 全面的告警规则文档。
- [ ] 全部关键告警均具备运行手册。
- [ ] 自定义指标埋点具备测试。

## 测试策略

### 单元测试

```python
# tests/test_metrics.py
def test_prometheus_instrumentation():
    """Test that metrics are correctly incremented."""
    instrumentor = PrometheusInstrumentation('test-service')
    # TODO: Verify metrics work correctly
```

### 集成测试

```python
# tests/test_observability_stack.py
def test_end_to_end_observability():
    """Test complete flow: app logs -> Loki -> Grafana query."""
    # 1. Generate test log
    # 2. Wait for Promtail to scrape
    # 3. Query Loki via Grafana API
    # 4. Verify log appears
```

## 交付物

1. **Kubernetes Manifest**（`kubernetes/`）：
   - `prometheus/`——Prometheus、Exporter、告警规则。
   - `loki/`——Loki、Promtail 配置。
   - `grafana/`——Grafana 部署、数据源。
   - `alertmanager/`——Alertmanager 配置。

2. **源代码**（`src/`）：
   - `instrumentation/prometheus_metrics.py`——指标埋点。
   - `logging/structured_logger.py`——结构化日志。
   - `dashboards/`——仪表盘即代码定义。
   - `slo/slo_tracker.py`——SLO 追踪及错误预算。
   - `optimization/metrics_optimizer.py`——成本优化。

3. **文档**（`docs/`）：
   - `OBSERVABILITY_GUIDE.md`——完整搭建指南。
   - `DASHBOARD_GUIDE.md`——仪表盘使用。
   - `RUNBOOKS.md`——告警运行手册。
   - `SLO_DEFINITIONS.md`——SLO 目标与计算。

4. **仪表盘**（`dashboards/`）：
   - ML 推理仪表盘 JSON。
   - 基础设施仪表盘 JSON。
   - SLO 仪表盘 JSON。
   - 成本优化仪表盘 JSON。

## 额外挑战

1. **分布式链路追踪集成（额外 8 小时）：**
   - 部署 Jaeger/Tempo。
   - 使用 OpenTelemetry 为服务埋点。
   - 关联 Trace、日志与指标。
   - 创建基于 Trace 的告警。

2. **异常检测（额外 6 小时）：**
   - 对指标实现基于 ML 的异常检测。
   - 使用 Prophet 或 ARIMA 预测。
   - 针对异常而不只是阈值告警。

3. **多集群可观测性（额外 6 小时）：**
   - 在多个集群间实现 Prometheus 联邦。
   - 使用集中式 Grafana 展示全部集群。
   - 跨集群告警。

## 资源

### 官方文档

- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana Loki](https://grafana.com/docs/loki/)
- [Grafana 仪表盘](https://grafana.com/docs/grafana/)
- [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)

### 最佳实践

- [Google SRE 手册——监控](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Prometheus 最佳实践](https://prometheus.io/docs/practices/)
- [RED 方法](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)

## 提交

通过 Git 提交实现：

```bash
git add .
git commit -m "Complete Exercise 01: Production Observability Stack"
git push origin exercise-01-observability-stack
```

确保提交包含：
- 全部 Kubernetes Manifest。
- 埋点代码。
- 仪表盘（代码与 JSON）。
- 告警规则及运行手册。
- 文档。

---

**预计时长分解：**
- 第一部分（Prometheus 技术栈）：7–9 小时。
- 第二部分（Loki 日志）：6–8 小时。
- 第三部分（Grafana 仪表盘）：7–9 小时。
- 第四部分（告警）：4–6 小时。
- 第五部分（SLO 与优化）：4–6 小时。
- **合计（原文）：** 28–36 小时。

> 译注：原文案例和指标为练习目标，不是经过验证的实际运行结果。持续每秒摄取 1 万条日志与 30 天仅占用 50GB 的目标需要结合平均事件大小、压缩率和实际流量重新核算。Promtail 为原文使用的旧采集组件，新建系统应评估 Grafana Alloy。原始代码块和 TODO 保留，未实际部署。
