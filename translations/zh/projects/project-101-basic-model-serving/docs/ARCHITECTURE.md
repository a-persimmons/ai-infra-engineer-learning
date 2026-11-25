# 项目 01：基础模型服务——架构文档

## 概览

本项目实现具备 REST API、容器化、Kubernetes 部署及全面监控的生产就绪 ML 模型服务系统。

## 架构图

```
                                                    ┌─────────────┐
                                                    │   Grafana   │
                                                    │  Dashboard  │
                                                    └──────┬──────┘
                                                           │
                                                           │ queries
┌──────────┐         ┌──────────────┐         ┌──────────▼──────┐
│  Client  │────────▶│ Load Balancer│────────▶│   Prometheus    │
│ (User)   │  HTTP   │  (Service)   │         │   Monitoring    │
└──────────┘  Req    └──────┬───────┘         └─────────────────┘
                             │                          │
                             │                          │ scrapes metrics
                             ▼                          │
                   ┌─────────────────┐                  │
                   │   FastAPI Pod   │◀─────────────────┘
                   │  (ML Serving)   │
                   │                 │
                   │  ┌───────────┐  │
                   │  │  ML Model │  │
                   │  │ (ResNet18)│  │
                   │  └───────────┘  │
                   │                 │
                   │  /predict       │
                   │  /health        │
                   │  /metrics       │
                   └─────────────────┘
                             │
                             │ autoscale
                             ▼
                   ┌─────────────────┐
                   │ Horizontal Pod  │
                   │   Autoscaler    │
                   └─────────────────┘
```

## 组件

### 1. FastAPI 应用（src/api.py）

**用途：** 模型推理 REST API。

**主要功能：**
- `/health`：健康检查端点。
- `/metrics`：Prometheus 指标。
- `/v1/predict`：图像分类端点。
- 异步请求处理。
- 输入验证。
- 错误处理。

**技术栈：**
- FastAPI（异步 Web 框架）。
- Pydantic（请求验证）。
- Prometheus Client（指标）。

### 2. 模型封装（src/model.py）

**用途：** 加载及管理 ML 模型。

**职责：**
- 启动时加载模型。
- 执行推理。
- 设备管理（CPU/GPU）。
- 预处理与后处理。

**模型：** ResNet18（ImageNet 预训练）。

### 3. 配置（src/config.py）

**用途：** 集中配置管理。

**配置来源：**
1. 环境变量（.env）。
2. 配置文件。
3. 默认值。

**主要设置：**
- 模型路径。
- 设备（CPU/GPU）。
- API 设置。
- 日志级别。

### 4. 工具函数（src/utils.py）

**用途：** 辅助函数。

**功能：**
- 图像下载及验证。
- 日志配置。
- 指标辅助函数。
- 错误处理工具。

## 数据流

### 推理请求流程

```
1. Client sends POST /v1/predict with image
   ↓
2. FastAPI receives request
   ↓
3. Pydantic validates input
   ↓
4. Image downloaded/loaded
   ↓
5. Image preprocessed (resize, normalize)
   ↓
6. Model inference (forward pass)
   ↓
7. Postprocessing (softmax, top-k)
   ↓
8. Response formatted and sent
   ↓
9. Metrics recorded (latency, count)
```

### 健康检查流程

```
1. Kubernetes sends GET /health
   ↓
2. FastAPI checks:
   - Model loaded
   - Service healthy
   ↓
3. Returns 200 OK or 503 Unavailable
```

### 指标采集流程

```
1. Prometheus scrapes GET /metrics every 15s
   ↓
2. FastAPI returns metrics:
   - predictions_total (counter)
   - prediction_duration_seconds (histogram)
   - http_requests_total (counter)
   ↓
3. Prometheus stores time-series data
   ↓
4. Grafana visualizes metrics
```

## 部署架构

### 本地开发

```
docker-compose up
├── api:8000 (ML serving)
├── prometheus:9090 (metrics)
└── grafana:3000 (dashboards)
```

### Kubernetes 生产环境

```
Kubernetes Cluster
├── Namespace: ml-serving
├── Deployment: ml-api
│   ├── Pod 1 (replica)
│   ├── Pod 2 (replica)
│   └── Pod N (auto-scaled)
├── Service: ml-api-service (LoadBalancer)
├── ConfigMap: ml-api-config
├── HPA: ml-api-hpa (auto-scaling rules)
├── Prometheus: monitoring namespace
└── Grafana: monitoring namespace
```

## 扩展策略

### Horizontal Pod Autoscaling（HPA）

**指标：**
- 目标 CPU 利用率：70%。
- 目标内存利用率：80%。
- 自定义指标：每秒请求数。

**配置：**
```yaml
minReplicas: 1
maxReplicas: 5
scaleUp: add pod when CPU > 70% for 30s
scaleDown: remove pod when CPU < 50% for 5min
```

**扩缩容行为：**
```
Low traffic (< 10 req/sec):  1 pod
Medium traffic (10-50 req/sec): 2-3 pods
High traffic (> 50 req/sec): 4-5 pods
```

## 性能特征

### 延迟

| 指标 | 目标 | 实测 |
|---|---|---|
| P50 延迟 | 低于 50ms | TODO：测量 |
| P95 延迟 | 低于 100ms | TODO：测量 |
| P99 延迟 | 低于 200ms | TODO：测量 |

### 吞吐量

| 指标 | 目标 | 实测 |
|---|---|---|
| 每秒请求数（单 Pod） | 20–50 | TODO：测量 |
| 每秒请求数（5 个 Pod） | 100–250 | TODO：测量 |

### 资源用量

| 资源 | 每 Pod | 说明 |
|---|---|---|
| CPU | 500m–1000m | 0.5–1 核 |
| 内存 | 512Mi–1Gi | 模型及运行时 |
| 磁盘 | 1Gi | 模型权重 |

## 监控与可观测性

### 关键指标

**应用指标：**
- `predictions_total`：按状态统计的预测总数。
- `prediction_duration_seconds`：推理延迟直方图。
- `http_requests_total`：HTTP 请求总数。

**系统指标：**
- CPU 利用率。
- 内存使用量。
- 网络 I/O。
- 磁盘 I/O。

**模型指标：**
- 预测分布（类别计数）。
- 置信度（平均值）。
- 错误率。

### 日志

**日志级别：**
- DEBUG：详细调试信息。
- INFO：一般信息。
- WARNING：警告。
- ERROR：错误。
- CRITICAL：严重故障。

**日志格式（JSON）：**
```json
{
  "timestamp": "2025-10-15T12:00:00Z",
  "level": "INFO",
  "message": "Prediction successful",
  "request_id": "uuid-1234",
  "inference_time_ms": 25,
  "class": "cat",
  "probability": 0.95
}
```

## 安全考虑

### 当前实现

- [x] 容器中使用非 root 用户。
- [x] 输入验证（文件大小与格式）。
- [x] 启用 CORS（可配置）。
- [x] 可用性健康检查。

### TODO：生产加固

- [ ] API 鉴权（JWT、API Key）。
- [ ] 按用户/IP 限流。
- [ ] HTTPS/TLS 加密。
- [ ] Kubernetes NetworkPolicy。
- [ ] Secret 管理（用于模型加密）。
- [ ] 输入清理（防止对抗攻击）。

## 灾难恢复

### 故障场景

**Pod 故障：**
- Kubernetes 自动重启失败的 Pod。
- HPA 保持最小副本数。
- Service 将流量路由到健康 Pod。

**节点故障：**
- Pod 重新调度至健康节点。
- PersistentVolume（如使用）重新挂载。

**模型损坏：**
- 保留多个模型版本。
- 加载时验证模型。
- 回滚至上个版本。

### 备份策略

**模型产物：**
- 保存至启用版本管理的 S3/GCS。
- 每次模型更新自动备份。
- 保留 30 天。

**配置：**
- Git 仓库（版本控制）。
- 备份 ConfigMap。

## 成本优化

### 当前配置（估算月费用）

**开发：**
```
1 pod (24/7): ~$30/month
Prometheus: ~$10/month
Grafana: ~$10/month
Storage: ~$5/month
Total: ~$55/month
```

**生产（自动扩缩容）：**
```
Average 3 pods: ~$90/month
Monitoring: ~$30/month
Storage: ~$10/month
Network: ~$20/month
Total: ~$150/month
```

### 优化建议

1. **使用 Spot 实例**（原文估计节省 60%）。
2. **非工作时间缩容至零**（原文估计节省 50%）。
3. **模型压缩**（减少内存、采用较小实例）。
4. **缓存**（减少重复推理）。
5. **批处理**（提高单实例吞吐）。

## 未来增强

### 第一阶段（近期）
- [ ] 模型版本管理和 A/B 测试。
- [ ] 请求批处理。
- [ ] 启动时模型预热。
- [ ] Jaeger 分布式链路追踪。

### 第二阶段（中期）
- [ ] GPU 加速推理。
- [ ] 模型压缩（量化、剪枝）。
- [ ] 多模型服务。
- [ ] 特征存储集成。

### 第三阶段（长期）
- [ ] 自动模型重新训练流水线。
- [ ] 漂移检测与监控。
- [ ] 联邦学习支持。
- [ ] 边缘部署（TensorFlow Lite、ONNX）。

## 参考资料

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [Prometheus 最佳实践](https://prometheus.io/docs/practices/)
- [ML 服务最佳实践](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)

> 译注：原文对当前实现的勾选及性能目标属于项目说明，并非本次翻译实际验证结果。标准 HPA 不一定支持缩至零；需要按实际版本与扩缩容组件配置。安全加固需包含来源 URL 校验、防 SSRF、上传大小限制等。费用及性能需实测。
