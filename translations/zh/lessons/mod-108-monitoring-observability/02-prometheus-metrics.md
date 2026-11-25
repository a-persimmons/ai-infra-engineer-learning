# 第 02 课：使用 Prometheus 采集指标

## 学习目标

完成本课后，你将能够：
- 理解 Prometheus 架构及数据模型。
- 为 AI 基础设施安装并配置 Prometheus。
- 编写 PromQL 查询以分析指标。
- 使用 Prometheus 客户端库为 Python 应用埋点。
- 配置服务发现与指标抓取。
- 为 ML 系统设计有效的指标采集策略。

## 前置条件

- 完成第 01 课（可观测性导论）。
- 基本理解 HTTP 与时间序列数据。
- 熟悉 YAML 配置。
- 具有 Python 编程经验。

## 导论

Prometheus 是最初由 SoundCloud 开发的开源监控与告警系统。它已经成为云原生环境中指标采集的事实标准之一，尤其是在 Kubernetes 生态中。对于 AI 基础设施工程师，Prometheus 可用于监控 ML 工作负载、GPU 利用率、模型服务延迟及基础设施健康状况。

### 为什么在 AI 基础设施中使用 Prometheus？

1. **基于拉取的架构：** Prometheus 从目标抓取指标，简化动态 ML 环境中的采集流程。
2. **多维数据模型：** 标签允许按模型、版本、GPU、节点等维度分析指标。
3. **强大的查询语言（PromQL）：** 跨维度分析及聚合指标。
4. **与 Kubernetes 集成：** 自动发现 ML 工作负载的服务目标。
5. **告警能力：** 主动检测性能退化。
6. **生态集成：** 与 Grafana、Alertmanager 及 Exporter 协同工作。

---

## 1. Prometheus 架构

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                     Prometheus Server                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Retrieval  │  │   Storage    │  │   HTTP Server   │  │
│  │   (Scraper)  │─>│   (TSDB)     │<─│   (PromQL API)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                                      │            │
└─────────│──────────────────────────────────────│────────────┘
          │                                      │
          │ scrape                               │ query
          ↓                                      ↓
   ┌──────────────┐                      ┌──────────────┐
   │   Targets    │                      │   Grafana    │
   │              │                      │  AlertManager│
   │ • ML Models  │                      │   Clients    │
   │ • GPUs       │                      └──────────────┘
   │ • Services   │
   └──────────────┘
```

**组件：**

1. **Prometheus Server：** 抓取并存储时间序列数据。
2. **时间序列数据库（TSDB）：** 高效存储指标。
3. **Retrieval System：** 发现并抓取目标。
4. **PromQL Engine：** 查询语言处理引擎。
5. **Alertmanager：** 处理 Prometheus 告警规则产生的告警。
6. **Exporter：** 暴露第三方系统的指标。
7. **Pushgateway：** 适用于特定短生命周期作业，例如服务级 ML 批处理任务。

### 数据模型

Prometheus 将所有数据存储为**时间序列**——属于同一指标及同一组标签维度的一系列带时间戳的数值。

**指标结构：**
```
<metric_name>{<label_name>=<label_value>, ...} value timestamp
```

**示例：**
```promql
gpu_utilization{gpu_id="0", node="ml-node-1", model="bert-base"} 87.5 1634567890
```

**指标类型：**

1. **Counter（计数器）：** 单调递增的值，重启等情况下可重置，例如已处理请求数。
2. **Gauge（仪表）：** 可以增加或减少的值，例如 GPU 显存使用量。
3. **Histogram（直方图）：** 将观测值记录在可配置的桶中，例如请求延迟。
4. **Summary（摘要）：** 类似直方图，支持在客户端计算分位数（具体取决于客户端实现）。

---

## 2. 安装 Prometheus

### 使用 Docker 安装

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus_data:

networks:
  monitoring:
    driver: bridge
```

### 使用 Helm 在 Kubernetes 中安装

```bash
# Add Prometheus community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack (includes Grafana, AlertManager)
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi
```

### 基础配置

**prometheus.yml：**
```yaml
global:
  scrape_interval: 15s      # How often to scrape targets
  evaluation_interval: 15s  # How often to evaluate rules
  external_labels:
    cluster: 'ml-production'
    environment: 'prod'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'alertmanager:9093'

# Load rules once and periodically evaluate them
rule_files:
  - "alerts/*.yml"
  - "recording_rules/*.yml"

# Scrape configurations
scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # GPU metrics exporter
  - job_name: 'nvidia-gpu'
    static_configs:
      - targets: ['gpu-node-1:9835', 'gpu-node-2:9835']
        labels:
          node_type: 'gpu'

  # ML model serving
  - job_name: 'ml-models'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - ml-serving
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

---

## 3. Prometheus 查询语言（PromQL）

PromQL 是一种功能强大的函数式查询语言，用于选择与聚合时间序列数据。

### 基础查询

**瞬时向量查询（Instant Vector）：**
```promql
# Current GPU utilization
gpu_utilization

# GPU utilization for specific GPU
gpu_utilization{gpu_id="0"}

# GPU utilization > 80%
gpu_utilization > 80

# Multiple label selectors
model_inference_latency{model="bert", version="v2", env="prod"}
```

**区间向量查询（Range Vector）：**
```promql
# GPU utilization over last 5 minutes
gpu_utilization[5m]

# HTTP request rate over last hour
http_requests_total[1h]
```

### 运算符与函数

**数学运算符：**
```promql
# GPU memory usage percentage
(gpu_memory_used / gpu_memory_total) * 100

# Request rate per second
rate(http_requests_total[5m])

# Average inference latency increase
delta(model_inference_latency_sum[1h]) / delta(model_inference_latency_count[1h])
```

**聚合函数：**
```promql
# Average GPU utilization across all GPUs
avg(gpu_utilization)

# Maximum GPU temperature by node
max(gpu_temperature) by (node)

# Total requests per model
sum(rate(model_requests_total[5m])) by (model_name)

# 95th percentile inference latency
histogram_quantile(0.95, rate(model_inference_duration_bucket[5m]))
```

**常见函数：**

| 函数 | 用途 | 示例 |
|---|---|---|
| `rate()` | 时间窗口内每秒平均增长速率 | `rate(requests_total[5m])` |
| `irate()` | 瞬时增长速率（最后两个采样点） | `irate(requests_total[1m])` |
| `increase()` | 时间窗口内累计增长量 | `increase(errors_total[1h])` |
| `avg_over_time()` | 时间窗口内平均值 | `avg_over_time(cpu_usage[10m])` |
| `predict_linear()` | 线性预测 | `predict_linear(disk_usage[1h], 3600)` |

### AI 基础设施查询示例

**GPU 监控：**
```promql
# GPU utilization by model
avg(gpu_utilization) by (model_name, gpu_id)

# GPU memory saturation
(avg(gpu_memory_used) by (node) / avg(gpu_memory_total) by (node)) * 100

# GPUs running hot
gpu_temperature > 80
```

**模型服务：**
```promql
# Request rate per model
sum(rate(model_requests_total[5m])) by (model_name, version)

# P99 latency per endpoint
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (endpoint, le)
)

# Error rate percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) /
 sum(rate(http_requests_total[5m]))) * 100

# Model prediction throughput
sum(rate(model_predictions_total[1m])) by (model_name)
```

**训练作业：**
```promql
# Training loss over time
avg(training_loss) by (job_name, epoch)

# Training GPU efficiency
rate(training_samples_processed[5m]) * on(node) group_left gpu_utilization

# Batch processing rate
rate(batch_processed_total[5m])
```

---

## 4. 为 Python 应用埋点

### 安装 Prometheus 客户端

```bash
pip install prometheus-client==0.17.1
```

### 基础埋点

**示例：使用 FastAPI 提供 ML 模型服务**

```python
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, Gauge, generate_latest, REGISTRY
from prometheus_client import multiprocess, CollectorRegistry
import time
import logging

# Create FastAPI app
app = FastAPI(title="ML Model Serving")

# Define metrics
REQUEST_COUNT = Counter(
    'model_requests_total',
    'Total number of inference requests',
    ['model_name', 'version', 'status']
)

REQUEST_LATENCY = Histogram(
    'model_inference_duration_seconds',
    'Time spent processing inference request',
    ['model_name', 'version'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0]
)

GPU_UTILIZATION = Gauge(
    'gpu_utilization_percent',
    'Current GPU utilization percentage',
    ['gpu_id', 'model_name']
)

GPU_MEMORY = Gauge(
    'gpu_memory_used_bytes',
    'GPU memory currently in use',
    ['gpu_id']
)

MODEL_LOADED = Gauge(
    'model_loaded',
    'Whether model is currently loaded (1) or not (0)',
    ['model_name', 'version']
)

BATCH_SIZE = Histogram(
    'inference_batch_size',
    'Batch size for inference requests',
    ['model_name'],
    buckets=[1, 2, 4, 8, 16, 32, 64, 128]
)

# Inference endpoint
@app.post("/predict")
async def predict(request: PredictRequest):
    model_name = request.model_name
    version = request.version

    # Track request
    start_time = time.time()

    try:
        # Perform inference
        predictions = await model_inference(request.data, model_name, version)

        # Record metrics
        REQUEST_COUNT.labels(
            model_name=model_name,
            version=version,
            status="success"
        ).inc()

        BATCH_SIZE.labels(model_name=model_name).observe(len(request.data))

        # Update GPU metrics (example)
        update_gpu_metrics(model_name)

        return {"predictions": predictions}

    except Exception as e:
        REQUEST_COUNT.labels(
            model_name=model_name,
            version=version,
            status="error"
        ).inc()
        raise

    finally:
        # Record latency
        duration = time.time() - start_time
        REQUEST_LATENCY.labels(
            model_name=model_name,
            version=version
        ).observe(duration)

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(REGISTRY),
        media_type="text/plain"
    )

def update_gpu_metrics(model_name: str):
    """Update GPU utilization and memory metrics"""
    try:
        import pynvml
        pynvml.nvmlInit()

        device_count = pynvml.nvmlDeviceGetCount()
        for i in range(device_count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)

            # GPU utilization
            util = pynvml.nvmlDeviceGetUtilizationRates(handle)
            GPU_UTILIZATION.labels(
                gpu_id=str(i),
                model_name=model_name
            ).set(util.gpu)

            # GPU memory
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            GPU_MEMORY.labels(gpu_id=str(i)).set(mem_info.used)

    except Exception as e:
        logging.error(f"Failed to update GPU metrics: {e}")
```

### 高级埋点模式

**1. 使用装饰器自动埋点：**

```python
from functools import wraps
from prometheus_client import Counter, Histogram
import time

# Metrics
FUNCTION_CALLS = Counter(
    'function_calls_total',
    'Total function calls',
    ['function_name', 'status']
)

FUNCTION_DURATION = Histogram(
    'function_duration_seconds',
    'Function execution time',
    ['function_name']
)

def monitor_performance(func):
    """Decorator to automatically monitor function performance"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        function_name = func.__name__

        try:
            result = func(*args, **kwargs)
            FUNCTION_CALLS.labels(
                function_name=function_name,
                status='success'
            ).inc()
            return result

        except Exception as e:
            FUNCTION_CALLS.labels(
                function_name=function_name,
                status='error'
            ).inc()
            raise

        finally:
            duration = time.time() - start_time
            FUNCTION_DURATION.labels(
                function_name=function_name
            ).observe(duration)

    return wrapper

# Usage
@monitor_performance
def preprocess_data(data):
    # Data preprocessing logic
    pass

@monitor_performance
def run_inference(model, inputs):
    return model.predict(inputs)
```

**2. 使用上下文管理器追踪资源：**

```python
from contextlib import contextmanager
from prometheus_client import Gauge
import psutil

MEMORY_USAGE = Gauge(
    'process_memory_bytes',
    'Process memory usage',
    ['phase']
)

CPU_USAGE = Gauge(
    'process_cpu_percent',
    'Process CPU usage',
    ['phase']
)

@contextmanager
def track_resources(phase_name: str):
    """Context manager to track resource usage during a phase"""
    process = psutil.Process()

    # Capture initial state
    initial_memory = process.memory_info().rss

    try:
        yield
    finally:
        # Capture final state
        final_memory = process.memory_info().rss
        cpu_percent = process.cpu_percent()

        MEMORY_USAGE.labels(phase=phase_name).set(final_memory)
        CPU_USAGE.labels(phase=phase_name).set(cpu_percent)

# Usage
with track_resources("data_loading"):
    data = load_large_dataset()

with track_resources("model_training"):
    model.fit(data)
```

**3. 为复杂指标创建自定义 Collector：**

```python
from prometheus_client.core import GaugeMetricFamily
from prometheus_client.registry import Collector
import pynvml

class GPUCollector(Collector):
    """Custom collector for detailed GPU metrics"""

    def __init__(self):
        pynvml.nvmlInit()

    def collect(self):
        # GPU utilization metric family
        gpu_util = GaugeMetricFamily(
            'gpu_utilization_percent',
            'GPU utilization percentage',
            labels=['gpu_id', 'gpu_name', 'uuid']
        )

        # GPU memory metric family
        gpu_mem = GaugeMetricFamily(
            'gpu_memory_used_bytes',
            'GPU memory used in bytes',
            labels=['gpu_id', 'gpu_name', 'uuid', 'memory_type']
        )

        # GPU temperature metric family
        gpu_temp = GaugeMetricFamily(
            'gpu_temperature_celsius',
            'GPU temperature in Celsius',
            labels=['gpu_id', 'gpu_name', 'uuid']
        )

        device_count = pynvml.nvmlDeviceGetCount()
        for i in range(device_count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)

            # Device info
            name = pynvml.nvmlDeviceGetName(handle)
            uuid = pynvml.nvmlDeviceGetUUID(handle)

            # Utilization
            util = pynvml.nvmlDeviceGetUtilizationRates(handle)
            gpu_util.add_metric(
                [str(i), name, uuid],
                util.gpu
            )

            # Memory
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            gpu_mem.add_metric(
                [str(i), name, uuid, 'used'],
                mem_info.used
            )
            gpu_mem.add_metric(
                [str(i), name, uuid, 'total'],
                mem_info.total
            )

            # Temperature
            temp = pynvml.nvmlDeviceGetTemperature(
                handle,
                pynvml.NVML_TEMPERATURE_GPU
            )
            gpu_temp.add_metric(
                [str(i), name, uuid],
                temp
            )

        yield gpu_util
        yield gpu_mem
        yield gpu_temp

# Register custom collector
from prometheus_client import REGISTRY
REGISTRY.register(GPUCollector())
```

---

## 5. Exporter 与服务发现

### AI 基础设施常见 Exporter

**1. Node Exporter（系统指标）：**
```yaml
# docker-compose.yml
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
```

**2. NVIDIA GPU Exporter：**
```yaml
services:
  nvidia-gpu-exporter:
    image: nvidia/dcgm-exporter:latest
    container_name: gpu-exporter
    ports:
      - "9400:9400"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped
```

**3. Kubernetes State Metrics：**
```bash
helm install kube-state-metrics prometheus-community/kube-state-metrics \
  --namespace monitoring
```

### Kubernetes 服务发现

Prometheus 可以自动发现 Kubernetes 中的目标：

```yaml
scrape_configs:
  # Discover pods with prometheus.io/scrape annotation
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod

    relabel_configs:
      # Only scrape pods with annotation prometheus.io/scrape=true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

      # Use custom metrics path if specified
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

      # Use custom port if specified
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

      # Add pod labels as metric labels
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)

      # Add namespace label
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace

      # Add pod name label
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name
```

**包含 Annotation 的 Kubernetes Deployment：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bert-model-serving
  namespace: ml-serving
spec:
  replicas: 3
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
      labels:
        app: bert-serving
        model: bert-base
        version: v1.2
    spec:
      containers:
        - name: model-server
          image: ml-registry/bert-serving:v1.2
          ports:
            - containerPort: 8000
              name: http
```

---

## 6. Recording Rule 与聚合

Recording Rule（记录规则）允许预计算开销较大的查询，并将结果存储为新的时间序列。

**recording_rules.yml：**
```yaml
groups:
  - name: ml_infrastructure_rules
    interval: 30s
    rules:
      # GPU utilization aggregations
      - record: node:gpu_utilization:avg
        expr: avg(gpu_utilization) by (node)

      - record: model:gpu_utilization:avg
        expr: avg(gpu_utilization) by (model_name)

      # Request rate aggregations
      - record: model:requests:rate5m
        expr: sum(rate(model_requests_total[5m])) by (model_name, version)

      - record: model:errors:rate5m
        expr: sum(rate(model_requests_total{status="error"}[5m])) by (model_name)

      # Latency percentiles
      - record: model:latency:p50
        expr: |
          histogram_quantile(0.50,
            sum(rate(model_inference_duration_bucket[5m])) by (model_name, le)
          )

      - record: model:latency:p95
        expr: |
          histogram_quantile(0.95,
            sum(rate(model_inference_duration_bucket[5m])) by (model_name, le)
          )

      - record: model:latency:p99
        expr: |
          histogram_quantile(0.99,
            sum(rate(model_inference_duration_bucket[5m])) by (model_name, le)
          )

      # GPU memory saturation
      - record: node:gpu_memory_saturation:ratio
        expr: |
          sum(gpu_memory_used_bytes) by (node) /
          sum(gpu_memory_total_bytes) by (node)

      # Batch processing efficiency
      - record: job:batch_processing_rate:5m
        expr: rate(batch_processed_total[5m])

      # Model prediction throughput
      - record: model:predictions_per_second:5m
        expr: sum(rate(model_predictions_total[5m])) by (model_name, version)
```

---

## 7. 最佳实践

### 指标命名规范

遵循 Prometheus 命名规范：
- 使用 `snake_case`。
- 包含适当的单位或类型后缀：`_bytes`、`_seconds`、`_total`、`_ratio`。
- 格式：`<namespace>_<name>_<unit>`。

**正确示例：**
```
model_inference_duration_seconds
gpu_memory_used_bytes
http_requests_total
cache_hit_ratio
```

**错误示例：**
```
ModelLatency  (not snake_case)
memory  (no unit)
requests  (should be requests_total for counter)
```

### 标签设计

**推荐做法：**
- 为需要聚合或过滤的维度使用标签。
- 将基数控制在合理范围（原文建议每个指标少于 1,000 种唯一标签组合）。
- 在不同指标之间采用一致的标签名称。

**避免的做法：**
- 使用高基数标签（用户 ID、时间戳、UUID）。
- 将频繁变化且取值范围较大的值作为标签。
- 创建过多标签维度。

**示例：**
```python
# Good: Reasonable cardinality
REQUEST_COUNT.labels(
    model_name="bert",      # ~10 models
    version="v1.2",         # ~5 versions per model
    status="success"        # 2-3 statuses
)  # Total: ~150 combinations

# Bad: High cardinality
REQUEST_COUNT.labels(
    user_id="abc123",       # Millions of users
    request_id="xyz789"     # Unique per request
)  # Total: Billions of combinations!
```

### 性能优化

1. **抓取间隔：** 平衡数据新鲜度与系统负载。
   ```yaml
   scrape_interval: 15s  # Default
   scrape_interval: 30s  # For stable metrics
   scrape_interval: 5s   # For critical, fast-changing metrics
   ```

2. **保留策略：** 根据存储容量与实际需求配置。
   ```yaml
   --storage.tsdb.retention.time=30d
   --storage.tsdb.retention.size=50GB
   ```

3. **Recording Rule：** 预计算开销较大的查询。
   ```yaml
   - record: expensive:aggregation:5m
     expr: sum(rate(metric[5m])) by (dimension)
   ```

4. **Metric Relabeling（指标重标记）：** 丢弃不必要的指标或标签。
   ```yaml
   metric_relabel_configs:
     - source_labels: [__name__]
       regex: 'go_.*'  # Drop Go runtime metrics
       action: drop
   ```

### 安全

1. **身份验证：** 使用 Basic Auth 或 OAuth 代理。
2. **TLS：** 为指标端点启用 HTTPS。
3. **网络策略：** 限制 Kubernetes 中的抓取访问范围。
4. **敏感数据：** 绝不在指标或标签中暴露 Secret。

---

## 8. 动手示例：完整的 ML 服务监控

**complete_monitoring_example.py：**

```python
from fastapi import FastAPI, HTTPException
from prometheus_client import (
    Counter, Histogram, Gauge, Summary,
    generate_latest, REGISTRY, CollectorRegistry
)
from pydantic import BaseModel
import time
import numpy as np
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="ML Model Serving with Monitoring")

# ============================================================================
# METRICS DEFINITIONS
# ============================================================================

# Request metrics
HTTP_REQUESTS = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Model inference metrics
PREDICTIONS_TOTAL = Counter(
    'model_predictions_total',
    'Total predictions made',
    ['model_name', 'model_version']
)

PREDICTION_LATENCY = Histogram(
    'model_prediction_duration_seconds',
    'Model prediction latency',
    ['model_name', 'model_version'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

BATCH_SIZE = Histogram(
    'model_batch_size',
    'Batch size for predictions',
    ['model_name'],
    buckets=[1, 2, 4, 8, 16, 32, 64, 128, 256]
)

PREDICTION_ERRORS = Counter(
    'model_prediction_errors_total',
    'Total prediction errors',
    ['model_name', 'error_type']
)

# Model state metrics
MODEL_LOADED = Gauge(
    'model_loaded_info',
    'Model load status (1=loaded, 0=not loaded)',
    ['model_name', 'model_version', 'model_type']
)

MODEL_LOAD_TIME = Gauge(
    'model_load_time_seconds',
    'Time taken to load model',
    ['model_name', 'model_version']
)

# Resource metrics
ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Number of requests currently being processed',
    ['model_name']
)

INPUT_SIZE = Summary(
    'model_input_size_bytes',
    'Size of model input data',
    ['model_name']
)

OUTPUT_SIZE = Summary(
    'model_output_size_bytes',
    'Size of model output data',
    ['model_name']
)

# ============================================================================
# REQUEST MODELS
# ============================================================================

class PredictRequest(BaseModel):
    model_name: str = "bert-base"
    model_version: str = "v1.0"
    inputs: List[List[float]]

class PredictResponse(BaseModel):
    predictions: List[float]
    latency_ms: float
    model_version: str

# ============================================================================
# MIDDLEWARE
# ============================================================================

@app.middleware("http")
async def monitor_requests(request, call_next):
    """Middleware to monitor all HTTP requests"""
    start_time = time.time()
    method = request.method
    endpoint = request.url.path

    # Process request
    response = await call_next(request)

    # Record metrics
    duration = time.time() - start_time
    status = response.status_code

    HTTP_REQUESTS.labels(
        method=method,
        endpoint=endpoint,
        status=status
    ).inc()

    REQUEST_DURATION.labels(
        method=method,
        endpoint=endpoint
    ).observe(duration)

    return response

# ============================================================================
# MOCK MODEL (Replace with real model)
# ============================================================================

class MockModel:
    """Mock model for demonstration"""

    def __init__(self, name: str, version: str):
        self.name = name
        self.version = version
        self.loaded = False

    def load(self):
        """Simulate model loading"""
        start_time = time.time()
        time.sleep(0.1)  # Simulate load time
        self.loaded = True

        load_time = time.time() - start_time
        MODEL_LOAD_TIME.labels(
            model_name=self.name,
            model_version=self.version
        ).set(load_time)

        MODEL_LOADED.labels(
            model_name=self.name,
            model_version=self.version,
            model_type="classifier"
        ).set(1)

        logger.info(f"Model {self.name} v{self.version} loaded in {load_time:.3f}s")

    def predict(self, inputs: np.ndarray) -> np.ndarray:
        """Simulate prediction"""
        if not self.loaded:
            raise RuntimeError("Model not loaded")

        # Simulate inference time based on batch size
        time.sleep(0.001 * len(inputs))

        # Return mock predictions
        return np.random.random(len(inputs))

# Global model registry
MODELS = {
    "bert-base": MockModel("bert-base", "v1.0"),
    "resnet-50": MockModel("resnet-50", "v2.1")
}

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    for model in MODELS.values():
        model.load()

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Perform model inference

    Example:
    ```bash
    curl -X POST http://localhost:8000/predict \
      -H "Content-Type: application/json" \
      -d '{
        "model_name": "bert-base",
        "model_version": "v1.0",
        "inputs": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
      }'
    ```
    """
    model_name = request.model_name
    model_version = request.model_version

    # Get model
    if model_name not in MODELS:
        PREDICTION_ERRORS.labels(
            model_name=model_name,
            error_type="model_not_found"
        ).inc()
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

    model = MODELS[model_name]

    # Track active requests
    ACTIVE_REQUESTS.labels(model_name=model_name).inc()

    start_time = time.time()

    try:
        # Convert to numpy array
        inputs_array = np.array(request.inputs)

        # Track input size
        input_bytes = inputs_array.nbytes
        INPUT_SIZE.labels(model_name=model_name).observe(input_bytes)

        # Track batch size
        batch_size = len(inputs_array)
        BATCH_SIZE.labels(model_name=model_name).observe(batch_size)

        # Perform prediction
        predictions = model.predict(inputs_array)

        # Track output size
        output_bytes = predictions.nbytes
        OUTPUT_SIZE.labels(model_name=model_name).observe(output_bytes)

        # Record success metrics
        PREDICTIONS_TOTAL.labels(
            model_name=model_name,
            model_version=model_version
        ).inc(batch_size)

        latency = time.time() - start_time
        PREDICTION_LATENCY.labels(
            model_name=model_name,
            model_version=model_version
        ).observe(latency)

        return PredictResponse(
            predictions=predictions.tolist(),
            latency_ms=latency * 1000,
            model_version=model_version
        )

    except Exception as e:
        PREDICTION_ERRORS.labels(
            model_name=model_name,
            error_type=type(e).__name__
        ).inc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        ACTIVE_REQUESTS.labels(model_name=model_name).dec()

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": sum(1 for m in MODELS.values() if m.loaded)
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    from starlette.responses import Response
    return Response(
        content=generate_latest(REGISTRY),
        media_type="text/plain"
    )

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**此服务的 Prometheus 配置：**

```yaml
scrape_configs:
  - job_name: 'ml-serving'
    static_configs:
      - targets: ['localhost:8000']
        labels:
          service: 'ml-model-serving'
          env: 'dev'
```

**此服务的查询示例：**

```promql
# Request rate
rate(http_requests_total[5m])

# P95 prediction latency by model
histogram_quantile(0.95,
  sum(rate(model_prediction_duration_seconds_bucket[5m])) by (model_name, le)
)

# Error rate percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) /
 sum(rate(http_requests_total[5m]))) * 100

# Average batch size
avg(model_batch_size) by (model_name)

# Predictions per second
sum(rate(model_predictions_total[1m])) by (model_name)
```

---

## 总结

本课学习了：

- 面向 AI 基础设施的 Prometheus 架构及组件。
- 在 Docker 与 Kubernetes 中安装和配置 Prometheus。
- 编写 PromQL 查询分析指标。
- 使用 prometheus-client 为 Python 应用埋点。
- 使用 Exporter 与服务发现。
- 创建 Recording Rule 提升查询性能。
- 指标设计与标签命名最佳实践。
- 包含监控能力的完整 ML 模型服务示例。

## 下一步

- **第 03 课：** 学习使用 Grafana 可视化 Prometheus 指标。
- **实践：** 使用 Prometheus 为自己的 ML 应用埋点。
- **练习：** 为多模型服务系统搭建 Prometheus。

## 补充资源

- [Prometheus 文档](https://prometheus.io/docs/)
- [Prometheus 最佳实践](https://prometheus.io/docs/practices/)
- [PromQL 基础](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Python 客户端库](https://github.com/prometheus/client_python)
- [通过 DCGM 获取 GPU 指标](https://docs.nvidia.com/datacenter/cloud-native/gpu-telemetry/dcgm-exporter.html)

---

**预计时长：** 4–6 小时
**难度：** 中级
**前置条件：** 第 01 课、Python、DevOps 基础知识。

> 译注：Counter 可能重置，rate 与 increase 会处理计数器重置；Summary 分位数无法像经典 Histogram 桶计数那样跨实例直接聚合。Pushgateway 并非任意短任务的通用推送采集器，还需处理指标生命周期。每个指标 1,000 个标签组合仅为原文经验值，实际应评估全局时间序列数量及标签增长速度。Python 多进程服务需要专门配置指标采集模式。保留原始代码、配置、图示与其中英文注释，未逐项运行验证。
