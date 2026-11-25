# 模块 08：监控与可观测性——实践练习

这些动手练习帮助你掌握 ML 基础设施的监控与可观测性。

## 练习 1：配置 Prometheus 指标

**难度：** 初级
**时长：** 30 分钟

### 目标
为 Python 应用设置基础 Prometheus 指标。

### 任务
1. 安装 prometheus-client 库。
2. 创建 Counter、Gauge 与 Histogram 指标。
3. 在 /metrics 暴露指标端点。
4. 使用 Prometheus 抓取指标。
5. 在 Prometheus 界面查看指标。

### 起始代码
```python
# exercises/01-prometheus-metrics.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time
import random

# TODO: Define metrics
# requests_total = Counter(...)
# request_duration = Histogram(...)
# active_users = Gauge(...)

def process_request():
    """Simulate request processing"""
    # TODO: Increment counter
    # TODO: Record duration
    # TODO: Update gauge
    time.sleep(random.uniform(0.1, 0.5))

if __name__ == '__main__':
    # TODO: Start metrics server
    # TODO: Process some requests
    pass
```

### 成功标准
- [ ] 指标端点返回有效的 Prometheus 格式。
- [ ] Counter 正确递增。
- [ ] Histogram 记录延迟。
- [ ] Gauge 实时更新。
- [ ] Prometheus 成功抓取指标。

---

## 练习 2：创建 Grafana 仪表盘

**难度：** 中级
**时长：** 45 分钟

### 目标
创建用于 ML 模型监控的综合 Grafana 仪表盘。

### 任务
1. 将 Grafana 连接至 Prometheus。
2. 创建包含以下面板的仪表盘：
   - 请求速率（查询/秒）。
   - 错误率（%）。
   - P95/P99 延迟。
   - 模型准确率随时间的变化。
   - 资源利用率（CPU、内存）。
3. 添加告警规则。
4. 将仪表盘导出为 JSON。

### 仪表盘要求
- 至少 6 个面板。
- 使用合适的可视化类型。
- 包含用于过滤的变量。
- 配置至少 2 条告警。

### 成功标准
- [ ] 仪表盘显示实时指标。
- [ ] 面板自动更新。
- [ ] 超过阈值时触发告警。
- [ ] 可通过 JSON 共享仪表盘。

---

## 练习 3：使用 Jaeger 实现分布式链路追踪

**难度：** 中级
**时长：** 60 分钟

### 目标
为 ML 推理管道实现分布式链路追踪。

### 任务
1. 安装 OpenTelemetry SDK。
2. 在代码中添加 Trace 和 Span 埋点。
3. 将 Trace 导出至 Jaeger。
4. 在 Jaeger 界面可视化 Trace。
5. 识别性能瓶颈。

### 起始代码
```python
# exercises/03-distributed-tracing.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
# TODO: Import Jaeger exporter

# TODO: Configure tracer
# provider = TracerProvider()
# jaeger_exporter = ...
# provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))

tracer = trace.get_tracer(__name__)

def preprocess_data(data):
    # TODO: Create span for preprocessing
    with tracer.start_as_current_span("preprocess"):
        # TODO: Add span attributes
        # Process data
        pass

def run_inference(data):
    # TODO: Create span for inference
    # TODO: Link to preprocessing span
    pass

def ml_pipeline(input_data):
    # TODO: Create parent span
    # TODO: Call preprocessing and inference
    pass
```

### 成功标准
- [ ] 在 Jaeger 界面可查看 Trace。
- [ ] Span 正确嵌套。
- [ ] Span 属性提供上下文。
- [ ] 可以识别最慢的操作。
- [ ] Trace 关联端到端请求。

---

## 练习 4：日志聚合与分析

**难度：** 中级
**时长：** 45 分钟

### 目标
配置结构化日志，并聚合日志进行分析。

### 任务
1. 使用 Python logging 实现结构化日志。
2. 添加上下文（user_id、request_id 等）。
3. 将日志发送至集中位置。
4. 解析及查询日志。
5. 创建基于日志的告警。

### 起始代码
```python
# exercises/04-log-aggregation.py
import logging
import structlog

# TODO: Configure structured logging
# log = structlog.get_logger()

def process_ml_request(user_id, model_id, request_data):
    # TODO: Log with context
    # log.info("processing_request",
    #          user_id=user_id,
    #          model_id=model_id)

    try:
        # Process request
        pass
    except Exception as e:
        # TODO: Log error with context
        pass
```

### 成功标准
- [ ] 日志采用结构化格式（JSON）。
- [ ] 所有相关日志包含链路追踪上下文。
- [ ] 可以按字段查询日志。
- [ ] 错误包含堆栈追踪。
- [ ] 日志量合理。

---

## 练习 5：模型性能监控

**难度：** 高级
**时长：** 90 分钟

### 目标
实现全面的模型性能监控。

### 任务
1. 追踪模型预测指标。
2. 检测模型漂移。
3. 监控数据质量。
4. 为性能退化设置告警。
5. 创建漂移检测仪表盘。

### 需要追踪的指标
- 预测延迟（P50、P95、P99）。
- 预测结果分布。
- 输入特征分布。
- 模型置信度分数。
- 按类别划分的错误率。

### 成功标准
- [ ] 所有指标均在 Prometheus 中追踪。
- [ ] 已实现漂移检测。
- [ ] 仪表盘展示漂移指标。
- [ ] 检测到漂移时触发告警。
- [ ] 保留历史数据。

---

## 练习 6：SLO/SLA 实现

**难度：** 高级
**时长：** 60 分钟

### 目标
为 ML 服务定义并监控 SLO（服务级别目标）。

### 任务
1. 定义 SLI（服务级别指标）。
2. 设置 SLO 目标（例如 99.9% 可用率）。
3. 计算错误预算。
4. 监控 SLO 达标情况。
5. 创建 SLO 仪表盘。

### SLO 示例
- **可用性：** 99.9% 正常运行时间。
- **延迟：** 95% 的请求低于 200ms。
- **错误率：** 低于 0.1%。

### 起始代码
```python
# exercises/06-slo-monitoring.py

class SLOMonitor:
    def __init__(self, target_availability=0.999):
        self.target_availability = target_availability
        # TODO: Initialize metrics

    def record_request(self, success: bool, latency_ms: float):
        # TODO: Record request outcome
        # TODO: Update availability calculation
        # TODO: Update latency percentiles
        pass

    def check_slo_compliance(self) -> dict:
        # TODO: Calculate current SLO compliance
        # TODO: Calculate error budget remaining
        # TODO: Return compliance status
        pass
```

### 成功标准
- [ ] SLO 定义清晰。
- [ ] 实时追踪 SLO 达标情况。
- [ ] 错误预算计算正确。
- [ ] 仪表盘展示错误预算消耗速率。
- [ ] SLO 面临风险时触发告警。

---

## 参考答案

原文说明参考答案位于 `solutions/` 目录。请先独立尝试完成练习，再查看参考答案。

## 补充资源

- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 教程](https://grafana.com/tutorials/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [SRE 手册——监控](https://sre.google/sre-book/monitoring-distributed-systems/)

---

**需要帮助？** 在 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 提问。

> 译注：这是原文目录内的独立短练习，与仓库中的编号实践项目不完全对应。日志中的用户标识应遵循隐私与脱敏要求，避免将高基数 ID 作为普通 Prometheus 标签；漂移告警不等同于模型质量下降。原始代码块保留，未运行监控环境。
