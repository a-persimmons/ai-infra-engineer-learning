# 第 06 课：告警策略与告警管理

## 学习目标

完成本课后，你将能够：
- 为 AI 基础设施设计有效的告警策略。
- 配置 Prometheus Alertmanager，实现告警路由。
- 为 ML 系统创建有意义的告警规则。
- 实现告警路由、分组与去重。
- 设置多种通知渠道（Slack、PagerDuty、电子邮件）。
- 使用合理的阈值与严重级别减少告警疲劳。
- 构建值班工作流及运行手册。

## 前置条件

- 完成第 01–05 课（可观测性基础）。
- 理解 Prometheus 与 PromQL。
- 熟悉事故管理概念。

## 导论

告警是系统偏离预期行为时自动触发的通知。对于 AI 基础设施，有效的告警机制十分重要，可以：
- 在用户察觉之前检测模型性能退化。
- 识别 GPU 故障与资源耗尽。
- 尽早发现数据管道问题。
- 防止 ML 服务中的级联故障。

然而，**糟糕的告警甚至可能比没有告警更糟糕**。过多误报导致的告警疲劳，会使团队忽视真正关键的告警。

### 良好告警的原则

1. **针对症状，而非原因告警：** 用户受到影响时发出告警。
2. **确保告警可行动：** 每条告警都应具有明确的响应措施。
3. **避免告警疲劳：** 仅针对重要问题发出告警。
4. **按严重程度分类：** Critical、Warning、Informational 等。
5. **包含上下文：** 在告警中提供调试信息。
6. **测试告警：** 验证告警能否按预期触发。

---

## 1. 告警策略

### ML 系统的四大黄金信号（Four Golden Signals）

**1. 延迟（Latency）：** 推理需要多长时间？
```promql
histogram_quantile(0.99,
  rate(model_inference_duration_seconds_bucket[5m])
) > 1.0
```

**2. 流量（Traffic）：** 正在处理多少请求？
```promql
sum(rate(model_requests_total[5m])) < 10
```

**3. 错误（Errors）：** 失败请求占多大比例？
```promql
(sum(rate(model_requests_total{status="error"}[5m])) /
 sum(rate(model_requests_total[5m]))) > 0.05
```

**4. 饱和度（Saturation）：** 资源使用情况有多接近容量上限？
```promql
avg(gpu_utilization) > 95
avg(gpu_memory_utilization) > 90
```

### 告警严重级别

| 严重级别 | 使用时机 | 响应时间 | 示例 |
|---|---|---|---|
| **Critical/Page（紧急呼叫）** | 已对用户产生影响 | 立即（分钟级） | 所有模型不可用、错误率超过 50% |
| **Error/High（高严重度）** | 可能影响用户 | 小时级 | 单个模型性能退化、GPU 故障 |
| **Warning（警告）** | 需要调查 | 天级 | 延迟升高、资源饱和 |
| **Info（信息）** | 仅供知悉，无需行动 | 不适用 | 部署完成、扩缩容事件 |

### 告警与监控

**监控（不必发出告警）：**
- 成功请求。
- 正常资源使用。
- 常规维护。
- 信息性事件。

**告警（需要紧急程度判断）：**
- 服务不可用。
- 错误率突增。
- 关键资源耗尽。
- 数据质量问题。

---

## 2. Prometheus Alertmanager

Alertmanager 处理由 Prometheus 发送的告警，提供路由、分组、抑制与静默功能。

### 架构

```
┌───────────────┐
│  Prometheus   │
│  (Evaluates   │
│    Rules)     │
└───────┬───────┘
        │ Alerts
        ↓
┌───────────────┐
│ Alertmanager  │
│  - Route      │
│  - Group      │
│  - Dedupe     │
│  - Silence    │
└───────┬───────┘
        │
        ├─────> Slack
        ├─────> PagerDuty
        ├─────> Email
        └─────> Webhook
```

### 安装 Alertmanager

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    networks:
      - monitoring

  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts:/etc/prometheus/alerts
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring
    depends_on:
      - alertmanager

volumes:
  alertmanager_data:
  prometheus_data:

networks:
  monitoring:
    driver: bridge
```

### Alertmanager 配置

**alertmanager.yml：**

```yaml
global:
  # Default notification settings
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

# Templates for notifications
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Alert routing tree
route:
  # Default receiver if no match
  receiver: 'default'

  # Group alerts by these labels
  group_by: ['alertname', 'cluster', 'service']

  # How long to wait before sending initial notification
  group_wait: 10s

  # How long to wait before sending notification about new alerts
  # added to a group
  group_interval: 10s

  # How often to re-send notifications for unresolved alerts
  repeat_interval: 12h

  # Child routes (evaluated in order)
  routes:
    # Critical alerts go to PagerDuty and Slack
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true  # Also match other routes

    - match:
        severity: critical
      receiver: 'slack-critical'

    # ML-specific alerts
    - match:
        team: ml-platform
      receiver: 'slack-ml-team'
      group_by: ['alertname', 'model_name']
      routes:
        # GPU alerts need immediate attention
        - match_re:
            alertname: '^GPU.*'
          receiver: 'slack-ml-team-urgent'
          repeat_interval: 4h

    # Data pipeline alerts
    - match:
        team: data-engineering
      receiver: 'slack-data-team'

    # Warning alerts (non-critical)
    - match:
        severity: warning
      receiver: 'slack-warnings'
      repeat_interval: 24h

# Inhibition rules (suppress alerts based on other alerts)
inhibit_rules:
  # Inhibit warnings if critical alert is firing
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: ['alertname', 'cluster', 'service']

  # If entire service is down, don't alert on individual instances
  - source_match:
      alertname: ServiceDown
    target_match_re:
      alertname: '^(HighLatency|HighErrorRate)$'
    equal: ['service']

# Notification receivers
receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'

  - name: 'slack-critical'
    slack_configs:
      - channel: '#ml-critical-alerts'
        username: 'Alertmanager'
        icon_emoji: ':rotating_light:'
        color: 'danger'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Labels.alertname }}
          *Severity:* {{ .Labels.severity }}
          *Summary:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Runbook:* {{ .Annotations.runbook_url }}
          {{ end }}
        send_resolved: true

  - name: 'slack-ml-team'
    slack_configs:
      - channel: '#ml-platform-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'slack-ml-team-urgent'
    slack_configs:
      - channel: '#ml-platform-urgent'
        color: 'warning'
        title: 'GPU ALERT: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *Model:* {{ .Labels.model_name }}
          *GPU:* {{ .Labels.gpu_id }}
          *Node:* {{ .Labels.node }}
          *Issue:* {{ .Annotations.description }}
          {{ end }}

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#monitoring-warnings'
        color: 'warning'
        send_resolved: true

  - name: 'slack-data-team'
    slack_configs:
      - channel: '#data-platform-alerts'
```

---

## 3. 告警规则

### Prometheus 告警规则

**alerts/ml-platform-alerts.yml：**

```yaml
groups:
  - name: ml_infrastructure
    interval: 30s
    rules:
      # ========== SERVICE AVAILABILITY ==========

      - alert: ModelServingDown
        expr: up{job="ml-serving"} == 0
        for: 1m
        labels:
          severity: critical
          team: ml-platform
        annotations:
          summary: "Model serving instance is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
          runbook_url: "https://runbooks.company.com/ModelServingDown"

      - alert: HighModelErrorRate
        expr: |
          (sum(rate(model_requests_total{status="error"}[5m])) by (model_name) /
           sum(rate(model_requests_total[5m])) by (model_name)) > 0.05
        for: 5m
        labels:
          severity: critical
          team: ml-platform
        annotations:
          summary: "High error rate for model {{ $labels.model_name }}"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
          runbook_url: "https://runbooks.company.com/HighErrorRate"

      # ========== LATENCY ==========

      - alert: HighInferenceLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(model_inference_duration_seconds_bucket[5m])) by (model_name, le)
          ) > 1.0
        for: 10m
        labels:
          severity: warning
          team: ml-platform
        annotations:
          summary: "High P99 latency for {{ $labels.model_name }}"
          description: "P99 latency is {{ $value }}s (threshold: 1.0s)"
          runbook_url: "https://runbooks.company.com/HighLatency"

      - alert: CriticalInferenceLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(model_inference_duration_seconds_bucket[5m])) by (model_name, le)
          ) > 5.0
        for: 5m
        labels:
          severity: critical
          team: ml-platform
        annotations:
          summary: "CRITICAL: P99 latency for {{ $labels.model_name }}"
          description: "P99 latency is {{ $value }}s (threshold: 5.0s)"

      # ========== GPU RESOURCES ==========

      - alert: GPUHighTemperature
        expr: gpu_temperature_celsius > 85
        for: 5m
        labels:
          severity: warning
          team: ml-platform
        annotations:
          summary: "GPU temperature high on {{ $labels.node }}"
          description: "GPU {{ $labels.gpu_id }} temperature is {{ $value }}°C"

      - alert: GPUCriticalTemperature
        expr: gpu_temperature_celsius > 90
        for: 2m
        labels:
          severity: critical
          team: ml-platform
        annotations:
          summary: "CRITICAL: GPU overheating on {{ $labels.node }}"
          description: "GPU {{ $labels.gpu_id }} at {{ $value }}°C - risk of shutdown"
          runbook_url: "https://runbooks.company.com/GPUOverheating"

      - alert: GPUMemoryExhaustion
        expr: |
          (gpu_memory_used_bytes / gpu_memory_total_bytes) > 0.95
        for: 10m
        labels:
          severity: warning
          team: ml-platform
        annotations:
          summary: "GPU memory near capacity on {{ $labels.node }}"
          description: "GPU {{ $labels.gpu_id }} memory at {{ $value | humanizePercentage }}"

      - alert: GPUUtilizationLow
        expr: avg(gpu_utilization) by (node, gpu_id) < 20
        for: 30m
        labels:
          severity: info
          team: ml-platform
        annotations:
          summary: "Low GPU utilization on {{ $labels.node }}"
          description: "GPU {{ $labels.gpu_id }} utilization at {{ $value }}% for 30min"

      # ========== TRAINING JOBS ==========

      - alert: TrainingJobStalled
        expr: |
          increase(training_samples_processed[10m]) == 0
        for: 10m
        labels:
          severity: warning
          team: ml-platform
        annotations:
          summary: "Training job {{ $labels.job_name }} appears stalled"
          description: "No progress in 10 minutes"

      - alert: TrainingLossDivergence
        expr: training_loss > 1000
        for: 5m
        labels:
          severity: warning
          team: ml-platform
        annotations:
          summary: "Training loss diverging for {{ $labels.job_name }}"
          description: "Loss value: {{ $value }}"

      # ========== DATA PIPELINES ==========

      - alert: DataPipelineFailed
        expr: airflow_dag_status{status="failed"} == 1
        for: 5m
        labels:
          severity: critical
          team: data-engineering
        annotations:
          summary: "Airflow DAG {{ $labels.dag_id }} failed"
          description: "Pipeline has been in failed state for 5 minutes"

      - alert: DataQualityCheckFailed
        expr: data_quality_check_passed == 0
        for: 1m
        labels:
          severity: critical
          team: data-engineering
        annotations:
          summary: "Data quality check failed: {{ $labels.check_name }}"
          description: "Dataset: {{ $labels.dataset }}"

      # ========== RESOURCE SATURATION ==========

      - alert: HighCPUUsage
        expr: |
          100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance) * 100) > 90
        for: 15m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage at {{ $value }}%"

      - alert: HighMemoryUsage
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) /
          node_memory_MemTotal_bytes > 0.90
        for: 10m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage at {{ $value | humanizePercentage }}"

      # ========== DISK SPACE ==========

      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
        for: 10m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Only {{ $value | humanizePercentage }} available on {{ $labels.mountpoint }}"

      - alert: DiskSpaceCritical
        expr: |
          (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.05
        for: 5m
        labels:
          severity: critical
          team: infrastructure
        annotations:
          summary: "CRITICAL: Disk space critically low on {{ $labels.instance }}"
          description: "Only {{ $value | humanizePercentage }} available on {{ $labels.mountpoint }}"
```

---

## 4. 通知模板

**alertmanager/templates/slack.tmpl：**

```
{{ define "slack.default.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.SortedPairs.Values | join " " }}
{{ end }}

{{ define "slack.default.text" }}
{{ range .Alerts }}
*Alert:* {{ .Labels.alertname }}
*Severity:* {{ .Labels.severity }}
*Summary:* {{ .Annotations.summary }}
*Description:* {{ .Annotations.description }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
*Labels:*
{{ range .Labels.SortedPairs }} • {{ .Name }}: `{{ .Value }}`
{{ end }}
{{ end }}
{{ end }}
```

---

## 5. 最佳实践

### 1. 确保告警可行动

**不良告警：**
```yaml
- alert: SomethingWrong
  expr: metric > threshold
  annotations:
    summary: "Metric is high"
```

**良好告警：**
```yaml
- alert: HighModelLatency
  expr: histogram_quantile(0.99, rate(latency_bucket[5m])) > 1.0
  annotations:
    summary: "Model {{ $labels.model_name }} P99 latency > 1s"
    description: |
      Current P99 latency: {{ $value }}s
      Check:
      1. GPU utilization and memory
      2. Batch size and concurrency
      3. Recent deployments
    runbook_url: "https://runbooks.company.com/HighLatency"
    dashboard_url: "https://grafana.company.com/d/model-perf"
```

### 2. 使用适当的阈值

```yaml
# Too sensitive - alert fatigue
- alert: AnyError
  expr: errors > 0
  for: 1m

# Better - tolerate occasional errors
- alert: HighErrorRate
  expr: (errors / requests) > 0.05
  for: 5m
```

### 3. 对相关告警进行分组

```yaml
route:
  group_by: ['alertname', 'model_name', 'cluster']
  group_wait: 30s
  group_interval: 5m
```

### 4. 避免告警风暴

使用抑制规则：

```yaml
inhibit_rules:
  - source_match:
      alertname: DatacenterDown
    target_match_re:
      alertname: '.*'
    equal: ['datacenter']
```

---

## 6. 值班工作流

### 运行手册示例

**运行手册：HighModelLatency**

```markdown
# High Model Latency Runbook

## Severity
Warning / Critical (depending on latency)

## Impact
Users experiencing slow inference responses

## Diagnosis

1. Check GPU utilization:
   ```
   avg(gpu_utilization{model="$MODEL"}) by (node, gpu_id)
   ```

2. Check batch sizes:
   ```
   histogram_quantile(0.95, rate(batch_size_bucket[5m]))
   ```

3. Check recent deployments:
   ```bash
   kubectl get events --namespace ml-serving
   ```

4. Check model health:
   ```
   curl http://model-serving/health
   ```

## Common Causes

1. **GPU saturation**: Utilization > 95%
2. **Large batch sizes**: Batch > optimal size
3. **Memory pressure**: GPU memory > 90%
4. **Network issues**: Cross-AZ latency
5. **Model version issue**: Recent deployment

## Resolution

1. **Immediate**:
   - Scale up replicas if traffic spike
   - Reduce batch size if GPU saturated
   - Rollback if recent deployment

2. **Short-term**:
   - Add GPU nodes if sustained high load
   - Optimize model if consistently slow

3. **Long-term**:
   - Consider model quantization
   - Implement request batching
   - Add caching layer

## Escalation

- L1: ML Platform team (@ml-oncall)
- L2: ML Infrastructure lead (@ml-lead)
- L3: VP Engineering (@vp-eng)
```

---

## 总结

本课学习了：

- 设计有效的告警策略（四大黄金信号）。
- 配置 Prometheus Alertmanager，实现告警路由与去重。
- 为 ML 基础设施创建有意义的告警规则。
- 设置通知渠道（Slack、PagerDuty、电子邮件）。
- 使用合适的阈值及分组减少告警疲劳。
- 构建值班工作流与运行手册。

## 下一步

- **第 07 课：** ML 专用监控与模型可观测性。
- **实践：** 为自己的 ML 基础设施创建告警规则。
- **练习：** 设计完整的告警策略。

## 补充资源

- [Prometheus 告警文档](https://prometheus.io/docs/alerting/latest/)
- [Alertmanager 配置](https://prometheus.io/docs/alerting/latest/configuration/)
- [SRE 手册：监控分布式系统](https://sre.google/sre-book/monitoring-distributed-systems/)
- [减少告警疲劳指南](https://grafana.com/blog/2022/02/14/how-to-reduce-alert-fatigue/)

---

**预计时长：** 3–4 小时
**难度：** 中级
**前置条件：** 第 01–05 课、Prometheus 基础。

> 译注：严重级别、响应时间与阈值属于原文示例，不是通用生产标准。实际值班策略应根据 SLO、错误预算消耗速率、业务影响及恢复时间制定；对资源故障和数据质量问题，也可在用户受影响之前设置必要的预警。告警规则需覆盖低流量、缺失时间序列及监控系统自身故障等情况。配置通知渠道时应保护 Webhook 和其他凭据。所有原始代码块及其中的英文注释保留原样，未实际发送测试告警。
