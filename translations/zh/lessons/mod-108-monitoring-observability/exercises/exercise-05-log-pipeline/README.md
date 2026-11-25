# 练习 05：结构化日志管道（Loki + Vector）

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–02

## 目标

构建完整日志管道：Python 服务产生结构化 JSON 日志，由 Vector 采集，由 Loki 索引，并通过 Grafana 查询。添加链路追踪关联（日志链接到 Tempo 中的 Trace）与基数控制。

## 为什么重要

日志是使用最多、也容易被滥用的基础设施信号。操作不当可能每月花费三万美元存储无人阅读的日志；正确使用则可能使事故处理从五小时缩短到五分钟。

## 要求

1. Python 服务将**结构化 JSON** 日志输出至 stdout。
2. 每行包含：timestamp、level、service、trace_id、span_id、message、附加上下文。
3. **Vector**（或 Fluent Bit）从容器 stdout 采集日志。
4. **Loki** 使用精心选择的低基数标签索引日志。
5. **Grafana** 提供日志浏览器，并通过 trace_id 深度链接至 Tempo。
6. **Promtail/Vector 转换**解析 JSON 并提取 trace_id 进行关联。
7. **保留策略**：INFO 七天、WARN/ERROR 30 天。
8. **基数预算**：活跃流数量低于一万。

## 分步操作

### 步骤 1——Python 结构化日志（30 分钟）
```python
# app.py
import logging, json, time, uuid
from pythonjsonlogger import jsonlogger

class TraceJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["service"] = "iris-api"
        log_record["timestamp"] = time.time()
        # trace_id injected by OpenTelemetry middleware (Exercise 06)
        log_record.setdefault("trace_id", getattr(record, "trace_id", ""))

handler = logging.StreamHandler()
handler.setFormatter(TraceJsonFormatter())
root = logging.getLogger()
root.addHandler(handler)
root.setLevel(logging.INFO)

log = logging.getLogger("predict")
log.info("prediction made", extra={"model_version": "v3", "latency_ms": 42, "user": "alice"})
```

示例输出：
```json
{"timestamp":1717000000,"level":"INFO","service":"iris-api","trace_id":"","message":"prediction made","model_version":"v3","latency_ms":42,"user":"alice"}
```

### 步骤 2——Vector 配置（30 分钟）
```yaml
# vector.yaml
sources:
  containers:
    type: kubernetes_logs
    extra_label_selector: app=iris-api

transforms:
  parse_json:
    type: remap
    inputs: [containers]
    source: |
      structured, err = parse_json(.message)
      if err == null {
        . = merge(., structured)
      }

  add_labels:
    type: remap
    inputs: [parse_json]
    source: |
      .labels.service = .service
      .labels.level   = .level
      .labels.namespace = .kubernetes.namespace_name

sinks:
  loki:
    type: loki
    inputs: [add_labels]
    endpoint: http://loki:3100
    labels:
      service: "{{ labels.service }}"
      level: "{{ labels.level }}"
      namespace: "{{ labels.namespace }}"
    encoding:
      codec: json
```

### 步骤 3——Loki 配置（15 分钟）
通过 Docker Compose 或 Helm 运行：
```yaml
services:
  loki:
    image: grafana/loki:3.0.0
    ports: ["3100:3100"]
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
```

保留配置：
```yaml
limits_config:
  retention_period: 168h        # 7d default
table_manager:
  retention_deletes_enabled: true
  retention_period: 168h
```

### 步骤 4——Grafana Loki 数据源（15 分钟）
添加 Loki 数据源。测试查询：
- `{service="iris-api"}`
- `{service="iris-api"} | json | latency_ms > 100`
- `count_over_time({service="iris-api", level="ERROR"}[5m])`

### 步骤 5——链路追踪关联（30 分钟）
在仪表盘数据源中配置派生字段：
- 名称：`TraceID`
- 正则表达式：`"trace_id":"(\w+)"`
- URL：`https://grafana/explore?left={...tempo query for ${__value.raw}...}`

现在每行包含 trace_id 的日志都具有可点击的 Tempo 链接。

### 步骤 6——基数控制（30 分钟）
流数量 = 标签的唯一组合数量。使用 service × level × namespace 标签：约五个服务 × 三个级别 × 三个命名空间 = 45 个流，较安全。

但如果将 `user` 添加为标签：再乘以一万名用户 = 45 万个流，可能压垮 Loki。

**原文经验规则：** 不要将具有超过 100 个唯一值的字段作为标签，改用日志行字段。

### 步骤 7——逐级别保留（15 分钟）
为不同保留层级运行独立 Loki 实例，或使用 Loki 多租户功能，为不同租户配置不同限制（例如 errors 租户 30 天、default 租户七天）。Vector 路由：
```yaml
sinks:
  loki_default:
    type: loki
    inputs: [add_labels]
    endpoint: http://loki:3100
    tenant_id: "default"
  loki_errors:
    type: loki
    inputs: [add_labels]
    endpoint: http://loki:3100
    tenant_id: "errors"
    condition: '.level == "ERROR" || .level == "WARN"'
```

## 交付物

1. 输出结构化日志的 Python 服务（`app.py`）。
2. Vector 配置（`vector.yaml`）。
3. Loki + Vector Docker Compose。
4. Grafana 派生字段配置（截图或导出）。
5. `OPERATIONS.md`：基数预算、保留策略、日志成本激增时的升级处理流程。

## 验证

- [ ] 日志输出后约十秒内在 Grafana 可见。
- [ ] LogQL `| json | latency_ms > 100` 正确提取并过滤。
- [ ] 点击 Trace_id 打开 Tempo 查询（或妥善显示「没有 Trace」）。
- [ ] 测试技术栈的活跃流数量低于 50。

## 拓展目标

- 在 PR 阶段添加**结构化日志验证**：检查所有日志调用均使用 JSON Formatter，消息中不使用 f-string。
- 在 Vector 添加 **PII 脱敏**过滤器，遮蔽邮箱与电话号码。
- 设置**基于日志的指标**：统计每个服务每分钟 ERROR 行数 → 向 Prometheus 暴露指标。

## 常见陷阱

- **多行异常堆栈**——Vector 默认可能将每行视为一条日志；配置以行首空白为依据的 multiline Parser。
- **逐请求 ID 导致高基数**——不要将 request_id、user_id、trace_id 作为 Loki 标签。放入日志行，通过 `|=` 或 `|~` 查询。
- **日志写入容器内磁盘**——不会出现在 stdout 中；重定向至 stdout 或让 Vector 追踪日志文件。
- **JSON 解析静默失败**——增加回退逻辑：解析失败时将原始行保留为 message，并标记 parse_error=true。

> 译注：标签阈值是经验值，应按组合基数、流量与容量决定；Loki 也支持按流配置保留期限。Promtail 属于原文所用时期的工具，应优先核对仍受支持的采集器。
