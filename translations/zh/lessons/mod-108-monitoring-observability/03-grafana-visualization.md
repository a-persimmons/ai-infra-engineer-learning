# 第 03 课：使用 Grafana 进行可视化

## 学习目标

完成本课后，你将能够：
- 为 AI 基础设施监控安装并配置 Grafana。
- 将 Grafana 连接至 Prometheus 和其他数据源。
- 为 ML 系统监控创建有效的仪表盘。
- 使用适当的可视化方式设计面板。
- 使用 Grafana 变量和模板创建动态仪表盘。
- 设置仪表盘告警与通知。
- 共享仪表盘并进行版本管理。

## 前置条件

- 完成第 02 课（使用 Prometheus 采集指标）。
- 理解 Prometheus 和 PromQL。
- 掌握数据可视化基础概念。
- 熟悉 JSON（有帮助，但不是必需条件）。

## 导论

Grafana 是开源分析与可视化平台，能够将原始指标转化为可指导行动的信息。对于 AI 基础设施工程师，Grafana 是实时展示 GPU 利用率、模型性能、训练进度及基础设施健康状况的重要工具。

### 为什么在 AI 基础设施中使用 Grafana？

1. **多数据源支持：** 可视化来自 Prometheus、Loki、Elasticsearch 等系统的数据。
2. **丰富的可视化方式：** 时间序列、热力图、仪表、表格等，适用于 ML 指标。
3. **动态仪表盘：** 利用变量和模板监控多个模型。
4. **告警：** 集成告警能力，支持多种通知渠道。
5. **共享：** 导出、导入并管理仪表盘版本。
6. **社区：** 提供数千个预构建仪表盘（原文描述）。

---

## 1. 安装 Grafana

### 使用 Docker 安装

**docker-compose.yml（包含 Prometheus）：**
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
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.1.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:3000
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

**启动技术栈：**
```bash
docker-compose up -d

# Access Grafana at http://localhost:3000
# Default credentials: admin / admin123
```

### 使用 Helm 在 Kubernetes 中安装

```bash
# Install Grafana (or use kube-prometheus-stack)
helm install grafana grafana/grafana \
  --namespace monitoring \
  --create-namespace \
  --set persistence.enabled=true \
  --set persistence.size=10Gi \
  --set adminPassword='admin123' \
  --set service.type=LoadBalancer

# Get admin password
kubectl get secret --namespace monitoring grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward to access
kubectl port-forward --namespace monitoring \
  svc/grafana 3000:80
```

### 配置自动供应（Provisioning）

自动配置数据源与仪表盘：

**grafana/provisioning/datasources/prometheus.yml：**
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
    jsonData:
      timeInterval: 15s
      queryTimeout: 60s
      httpMethod: POST

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    editable: false
```

**grafana/provisioning/dashboards/default.yml：**
```yaml
apiVersion: 1

providers:
  - name: 'AI Infrastructure Dashboards'
    orgId: 1
    folder: 'ML Monitoring'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

---

## 2. 连接数据源

### 通过界面添加 Prometheus 数据源

1. **导航：** Configuration → Data Sources → Add data source。
2. **选择：** Prometheus。
3. **配置：**
   - **Name：** Prometheus。
   - **URL：** `http://prometheus:9090`（Docker）或 Kubernetes 服务 URL。
   - **Access：** Server（默认）。
   - **Scrape interval：** 15 秒。
4. **保存并测试（Save & Test）。**

### 高级数据源配置

```yaml
# Custom headers for authentication
httpHeaderName1: Authorization
httpHeaderValue1: Bearer ${PROMETHEUS_TOKEN}

# Query timeout
timeout: 60

# Custom query parameters
customQueryParameters: 'key1=value1&key2=value2'

# TLS settings
tlsAuth: true
tlsAuthWithCACert: true
```

---

## 3. 创建仪表盘

### 仪表盘基础

**仪表盘结构：**
```
Dashboard
├── Variables (filters, selectors)
├── Rows (organizational containers)
│   ├── Panel 1 (visualization)
│   ├── Panel 2 (visualization)
│   └── Panel 3 (visualization)
└── Time Range Picker
```

### 创建第一个仪表盘

**手动创建：**

1. **创建：** Dashboards → New Dashboard → Add visualization。
2. **选择数据源：** Prometheus。
3. **查询：** 输入 PromQL 查询。
4. **可视化：** 选择面板类型（Time series、Gauge 等）。
5. **配置：** 设置标题、单位、阈值。
6. **保存：** 命名并保存仪表盘。

### ML 监控的面板类型

| 面板类型 | 使用场景 | 指标示例 |
|---|---|---|
| **Time Series（时间序列）** | 随时间变化的趋势 | GPU 利用率、延迟 |
| **Gauge（仪表）** | 当前值与阈值比较 | 显存使用率、温度 |
| **Stat（统计值）** | 单个数值及迷你趋势图 | 请求数量、错误率 |
| **Bar Gauge（条形仪表）** | 比较多个数值 | 模型比较 |
| **Heatmap（热力图）** | 随时间变化的分布 | 延迟分布及分位数分析 |
| **Table（表格）** | 结构化数据 | 模型清单 |
| **Pie Chart（饼图）** | 占比 | 按模型划分的请求分布 |
| **Graph（已弃用）** | 旧版时间序列 | 改用 Time Series |

---

## 4. AI 基础设施仪表盘示例

### 示例 1：GPU 监控仪表盘

**JSON 仪表盘配置：**

```json
{
  "dashboard": {
    "title": "GPU Infrastructure Monitoring",
    "tags": ["gpu", "ml", "infrastructure"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "GPU Utilization by Node",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "avg(gpu_utilization) by (node)",
            "legendFormat": "{{node}}",
            "refId": "A"
          }
        ],
        "options": {
          "legend": {"displayMode": "table", "calcs": ["mean", "max"]},
          "tooltip": {"mode": "multi"}
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 70, "color": "yellow"},
                {"value": 90, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "GPU Memory Usage",
        "type": "gauge",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "(sum(gpu_memory_used_bytes) by (node) / sum(gpu_memory_total_bytes) by (node)) * 100",
            "legendFormat": "{{node}}",
            "refId": "A"
          }
        ],
        "options": {
          "showThresholdLabels": true,
          "showThresholdMarkers": true
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 80, "color": "yellow"},
                {"value": 95, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "GPU Temperature",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "gpu_temperature_celsius",
            "legendFormat": "GPU {{gpu_id}} - {{node}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "celsius",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 75, "color": "yellow"},
                {"value": 85, "color": "red"}
              ]
            }
          }
        }
      }
    ]
  }
}
```

### 示例 2：模型服务性能仪表盘

**面板查询：**

**1. 按模型统计请求速率：**
```promql
# Query
sum(rate(model_requests_total[5m])) by (model_name, version)

# Panel: Time Series
# Legend: {{model_name}} v{{version}}
# Y-axis: requests/sec
```

**2. P95 延迟：**
```promql
# Query
histogram_quantile(0.95,
  sum(rate(model_prediction_duration_seconds_bucket[5m])) by (model_name, le)
)

# Panel: Time Series
# Legend: {{model_name}} (P95)
# Y-axis: seconds
# Thresholds: < 0.1s (green), < 0.5s (yellow), >= 0.5s (red)
```

**3. 错误率：**
```promql
# Query
(sum(rate(model_requests_total{status="error"}[5m])) by (model_name) /
 sum(rate(model_requests_total[5m])) by (model_name)) * 100

# Panel: Stat
# Unit: percent (0-100)
# Thresholds: < 1% (green), < 5% (yellow), >= 5% (red)
```

**4. 活跃请求：**
```promql
# Query
sum(active_requests) by (model_name)

# Panel: Bar Gauge
# Orientation: Horizontal
# Display mode: Gradient
```

**5. 预测吞吐量：**
```promql
# Query
sum(rate(model_predictions_total[1m])) by (model_name)

# Panel: Stat
# Unit: predictions/sec
# Color mode: Value
```

### 示例 3：训练作业监控

**面板配置：**

```json
{
  "panels": [
    {
      "title": "Training Loss",
      "type": "timeseries",
      "targets": [{
        "expr": "avg(training_loss) by (job_name, epoch)",
        "legendFormat": "{{job_name}} - Epoch {{epoch}}"
      }],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "lineInterpolation": "smooth",
            "showPoints": "always"
          }
        }
      }
    },
    {
      "title": "Training Throughput (samples/sec)",
      "type": "stat",
      "targets": [{
        "expr": "rate(training_samples_processed[5m])"
      }],
      "options": {
        "graphMode": "area",
        "colorMode": "value"
      }
    },
    {
      "title": "GPU Utilization During Training",
      "type": "heatmap",
      "targets": [{
        "expr": "avg(gpu_utilization{job=\"training\"}) by (gpu_id)",
        "format": "time_series"
      }],
      "dataFormat": "tsbuckets"
    }
  ]
}
```

---

## 5. 仪表盘变量与模板

变量使仪表盘能够动态调整并重复使用。

### 创建变量

**查询变量（模型选择器）：**

1. **导航：** Dashboard Settings → Variables → Add variable。
2. **配置：**
   ```
   Name: model_name
   Type: Query
   Data source: Prometheus
   Query: label_values(model_requests_total, model_name)
   Refresh: On Dashboard Load
   Multi-value: true
   Include All option: true
   ```

3. **在查询中使用：**
   ```promql
   sum(rate(model_requests_total{model_name="$model_name"}[5m]))
   ```

### 常见变量类型

**1. 查询变量（来自 Prometheus 标签）：**
```yaml
Name: node
Query: label_values(gpu_utilization, node)
Usage: gpu_utilization{node="$node"}
```

**2. 自定义变量（固定列表）：**
```yaml
Name: environment
Type: Custom
Values: dev,staging,prod
Usage: model_requests_total{env="$environment"}
```

**3. 时间间隔变量（动态时间范围）：**
```yaml
Name: interval
Type: Interval
Values: 1m,5m,15m,30m,1h
Auto: true
Usage: rate(metric[$interval])
```

**4. 数据源变量：**
```yaml
Name: datasource
Type: Data source
Plugin: Prometheus
Usage: (Select in panel)
```

### 高级变量示例

**链式变量：**

```yaml
# Variable 1: Cluster
Name: cluster
Query: label_values(kube_node_info, cluster)

# Variable 2: Namespace (filtered by cluster)
Name: namespace
Query: label_values(kube_pod_info{cluster="$cluster"}, namespace)

# Variable 3: Pod (filtered by cluster and namespace)
Name: pod
Query: label_values(kube_pod_info{cluster="$cluster", namespace="$namespace"}, pod)
```

**在仪表盘中使用：**
```promql
avg(container_cpu_usage{
  cluster="$cluster",
  namespace="$namespace",
  pod="$pod"
})
```

---

## 6. 转换与计算

Grafana 的 Transformation（转换）功能允许在可视化之前修改查询结果。

### 常见转换操作

**1. 合并多个查询：**
```json
{
  "transformations": [
    {
      "id": "merge",
      "options": {}
    }
  ]
}
```

**2. 按值过滤：**
```json
{
  "transformations": [
    {
      "id": "filterByValue",
      "options": {
        "filters": [
          {
            "fieldName": "gpu_utilization",
            "config": {
              "id": "greater",
              "options": {
                "value": 50
              }
            }
          }
        ]
      }
    }
  ]
}
```

**3. 通过计算添加字段：**
```json
{
  "transformations": [
    {
      "id": "calculateField",
      "options": {
        "mode": "binary",
        "binary": {
          "left": "gpu_memory_used",
          "operator": "/",
          "right": "gpu_memory_total"
        },
        "alias": "memory_utilization_ratio"
      }
    }
  ]
}
```

**4. 整理字段（重命名或隐藏）：**
```json
{
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": {
          "__name__": true,
          "job": true
        },
        "renameByName": {
          "model_name": "Model",
          "version": "Version"
        }
      }
    }
  ]
}
```

---

## 7. Grafana 告警

### 设置告警

**告警规则（GPU 温度过高）：**

```json
{
  "alert": {
    "name": "High GPU Temperature",
    "conditions": [
      {
        "evaluator": {
          "type": "gt",
          "params": [85]
        },
        "operator": {
          "type": "and"
        },
        "query": {
          "params": ["A", "5m", "now"]
        },
        "reducer": {
          "type": "avg"
        },
        "type": "query"
      }
    ],
    "executionErrorState": "alerting",
    "frequency": "1m",
    "handler": 1,
    "message": "GPU temperature exceeded 85°C",
    "name": "High GPU Temperature",
    "noDataState": "no_data",
    "notifications": [
      {
        "uid": "slack-notifications"
      }
    ]
  }
}
```

### 通知渠道

**Slack 集成：**

```yaml
# grafana/provisioning/notifiers/slack.yml
notifiers:
  - name: Slack Alerts
    type: slack
    uid: slack-notifications
    org_id: 1
    is_default: true
    send_reminder: true
    settings:
      url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
      recipient: '#ml-alerts'
      username: Grafana
      icon_emoji: ':grafana:'
      mentionChannel: channel
```

**电子邮件通知：**

```yaml
notifiers:
  - name: Email Alerts
    type: email
    uid: email-notifications
    org_id: 1
    settings:
      addresses: ml-team@company.com;ops@company.com
      singleEmail: false
```

### 告警示例：模型性能退化

**Grafana 界面配置（原文版本）：**

1. **创建告警规则：**
   - 名称：`Model Latency Degradation`。
   - 查询：`histogram_quantile(0.95, sum(rate(model_prediction_duration_seconds_bucket[5m])) by (model_name, le))`。
   - 条件：`WHEN avg() OF query(A, 5m, now) IS ABOVE 1.0`。
   - 状态：`Alerting`。

2. **配置通知：**
   - 通知渠道：Slack、Email。
   - 消息：`Model {{model_name}} P95 latency is {{ value }}s (threshold: 1.0s)`。

3. **告警频率：**
   - 每 `1m` 评估一次。
   - 持续时间：`5m`（条件持续满足后触发告警）。

---

## 8. 最佳实践

### 仪表盘设计

**1. 组织方式：**
- 将相关面板组织到同一行。
- 使用一致的命名规范。
- 为仪表盘添加适当标签。
- 为不同团队或服务创建文件夹。

**2. 视觉层次：**
- 将最重要的指标置于顶部。
- 使用面板大小表达重要程度。
- 使用一致的配色方案。
- 每个仪表盘建议控制在 10–15 个面板（原文经验值）。

**3. 性能：**
- 优化查询（避免开销过大的正则表达式）。
- 对复杂查询使用 Recording Rule。
- 设置合理的刷新间隔。
- 限制高基数数据的查询时间范围。

### 查询优化

**错误做法：**
```promql
# High cardinality, slow
rate(metric{user_id=~".*"}[5m])
```

**正确做法：**
```promql
# Aggregated, fast
sum(rate(metric[5m])) by (service)
```

### 仪表盘命名规范

```
[Team/Service] - [Purpose] - [Environment]

Examples:
- ML Platform - GPU Monitoring - Production
- Model Serving - BERT Performance - Staging
- Data Pipeline - Airflow Metrics - All Envs
```

---

## 9. 共享与版本管理

### 导出仪表盘

**JSON 导出：**
```bash
# Manual: Dashboard → Share → Export → Save to file

# API Export
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  http://localhost:3000/api/dashboards/uid/gpu-monitoring \
  | jq .dashboard > gpu-dashboard.json
```

### 使用 Git 管理版本

**仓库结构：**
```
grafana-dashboards/
├── README.md
├── provisioning/
│   ├── datasources/
│   │   └── prometheus.yml
│   └── dashboards/
│       └── default.yml
├── dashboards/
│   ├── gpu-monitoring.json
│   ├── model-serving.json
│   └── training-jobs.json
└── alerts/
    └── ml-alerts.yml
```

**自动化部署：**

```yaml
# .github/workflows/deploy-dashboards.yml
name: Deploy Grafana Dashboards

on:
  push:
    branches: [main]
    paths:
      - 'dashboards/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Dashboards
        env:
          GRAFANA_URL: ${{ secrets.GRAFANA_URL }}
          GRAFANA_API_KEY: ${{ secrets.GRAFANA_API_KEY }}
        run: |
          for dashboard in dashboards/*.json; do
            curl -X POST \
              -H "Authorization: Bearer $GRAFANA_API_KEY" \
              -H "Content-Type: application/json" \
              -d @$dashboard \
              $GRAFANA_URL/api/dashboards/db
          done
```

---

## 10. 完整仪表盘示例

**ML 平台概览仪表盘（JSON）：**

```json
{
  "dashboard": {
    "title": "ML Platform - Overview",
    "tags": ["ml", "overview", "production"],
    "timezone": "browser",
    "editable": true,
    "graphTooltip": 1,
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "30s",

    "templating": {
      "list": [
        {
          "name": "model_name",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(model_requests_total, model_name)",
          "refresh": 1,
          "multi": true,
          "includeAll": true
        },
        {
          "name": "interval",
          "type": "interval",
          "auto": true,
          "auto_count": 30,
          "options": [
            {"text": "1m", "value": "1m"},
            {"text": "5m", "value": "5m"},
            {"text": "15m", "value": "15m"}
          ]
        }
      ]
    },

    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [{
          "expr": "sum(rate(model_requests_total{model_name=~\"$model_name\"}[$interval])) by (model_name)",
          "legendFormat": "{{model_name}}"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "custom": {
              "drawStyle": "line",
              "fillOpacity": 10
            }
          }
        }
      },
      {
        "id": 2,
        "title": "P95 Latency",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [{
          "expr": "histogram_quantile(0.95, sum(rate(model_prediction_duration_seconds_bucket{model_name=~\"$model_name\"}[$interval])) by (model_name, le))",
          "legendFormat": "{{model_name}}"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 0.5, "color": "yellow"},
                {"value": 1.0, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Error Rate %",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 8},
        "targets": [{
          "expr": "(sum(rate(model_requests_total{model_name=~\"$model_name\", status=\"error\"}[$interval])) / sum(rate(model_requests_total{model_name=~\"$model_name\"}[$interval]))) * 100"
        }],
        "options": {
          "graphMode": "area",
          "colorMode": "value"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 1, "color": "yellow"},
                {"value": 5, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "GPU Utilization",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 8},
        "targets": [{
          "expr": "avg(gpu_utilization)"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        }
      }
    ]
  }
}
```

---

## 总结

本课学习了：

- 为 AI 基础设施安装及配置 Grafana。
- 连接 Prometheus 和其他数据源。
- 使用多种面板类型创建仪表盘。
- 使用变量与模板创建动态仪表盘。
- 设置告警与通知。
- 仪表盘最佳实践与优化。
- 使用 Git 管理仪表盘版本。
- GPU、模型服务及训练监控的完整示例。

## 下一步

- **第 04 课：** 学习使用 ELK Stack 与 Loki 进行日志管理。
- **实践：** 为自己的 ML 基础设施创建仪表盘。
- **练习：** 构建完整的模型服务仪表盘。

## 补充资源

- [Grafana 文档](https://grafana.com/docs/)
- [仪表盘最佳实践](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)
- [Grafana 自动供应配置](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [预构建仪表盘](https://grafana.com/grafana/dashboards/)
- [Grafana 社区](https://community.grafana.com/)

---

**预计时长：** 3–5 小时
**难度：** 中级
**前置条件：** 第 02 课、Prometheus 基础。

> 译注：Grafana 的界面、告警配置和通知模板语法会随版本演进；现代 Grafana Alerting 使用 Contact Point、Notification Policy 等概念，原文配置未必能够直接导入。延迟 Histogram 的分位数查询需要保留适当的 le 标签（经典直方图）及模型维度，不能直接平均各实例的 P95 获得全局 P95。面板数量应依据实际使用者需求决定。全部原始代码块及英文注释保持不变，未实际部署验证。
