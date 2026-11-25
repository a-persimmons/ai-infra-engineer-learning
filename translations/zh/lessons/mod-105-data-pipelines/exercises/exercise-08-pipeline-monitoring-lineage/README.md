# 练习 08：管道监控与数据血缘

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 02 与 07

## 目标

为多阶段管道添加埋点，以回答：「管道是否健康？」「哪个上游产生了这个数据集？」「如果修改这一列，会影响哪些下游使用者？」使用 OpenLineage 管理血缘，使用 Prometheus 采集运行时指标。

## 为什么重要

数据工程师花费大量时间回答「这个数字来自哪里？」和「如果我修改这里，什么会损坏？」。血缘自动化可以回答这两类问题，是数据平台团队提升效率的重要手段。

## 要求

1. **逐阶段指标**：延迟、输入/输出行数、新鲜度、成功/失败次数。
2. 每个 Airflow 任务和 dbt 运行均发出 **OpenLineage 事件**。
3. 使用 **Marquez** 作为血缘后端。
4. **血缘查询**：给定某一列，列出全部上游来源与下游使用者。
5. 每个数据集的**新鲜度 SLO**：距上次更新超过 N 小时时告警。
6. 展示管道健康状态的 **Grafana 仪表盘**。

## 分步操作

### 步骤 1——配置 Marquez（15 分钟）
```bash
git clone https://github.com/MarquezProject/marquez && cd marquez
./docker/up.sh
# UI at http://localhost:3000
```

### 步骤 2——OpenLineage 与 Airflow 集成（30 分钟）
```bash
pip install openlineage-airflow
```
在 `airflow.cfg` 或环境变量中配置：
```ini
AIRFLOW__OPENLINEAGE__TRANSPORT={"type":"http","url":"http://localhost:5000"}
AIRFLOW__OPENLINEAGE__NAMESPACE=ml-platform
```
重启 Airflow 后，每次 DAG 运行发出包含数据集 URI 的开始/完成事件。

### 步骤 3——运行 DAG（15 分钟）
使用练习 02 的 `recs_training` DAG。在 Marquez 界面观察作业、数据集以及它们之间的边。

### 步骤 4——逐阶段 Prometheus 指标（45 分钟）
```python
from airflow.decorators import task
from prometheus_client import Counter, Histogram, Gauge, push_to_gateway, CollectorRegistry

@task
def ingest(date: str) -> str:
    registry = CollectorRegistry()
    rows = Counter("pipeline_rows_processed", "Rows", ["stage","dataset"], registry=registry)
    latency = Histogram("pipeline_stage_seconds", "Latency", ["stage"], registry=registry)
    with latency.labels("ingest").time():
        df = ...
        rows.labels("ingest","events").inc(len(df))
    push_to_gateway("pushgateway:9091", job="recs_training", registry=registry)
    return path
```

### 步骤 5——新鲜度追踪（30 分钟）
对每个数据集，将 `last_updated_at` 记录到键值存储（Redis）：
```python
import redis
r = redis.Redis()
r.set(f"freshness:{dataset_uri}", time.time())
```
Prometheus 查询：`time() - dataset_last_updated`。
「热」数据集距上次更新超过四小时时发出告警（查询值为秒，应转换阈值）。

### 步骤 6——血缘查询（30 分钟）
Marquez 暴露 REST API：
```bash
# Upstream of a dataset
curl "http://localhost:5000/api/v1/lineage?nodeId=dataset:my-namespace:training_data&depth=10" | jq

# All consumers of a column (column-level lineage)
curl "http://localhost:5000/api/v1/column-lineage?nodeId=column:..." | jq
```

构建 CLI：
```bash
lineage upstream events.click
lineage downstream training_data
lineage impact-of column-name
```

### 步骤 7——Grafana 仪表盘（30 分钟）
面板：
- 逐阶段运行时间趋势（折线图）。
- 逐阶段输入/输出行数（柱状图）。
- 数据集新鲜度（每个数据集一个 Gauge）。
- 近期失败（表格）。
- 血缘深度（统计值：「你依赖的数据集」/「依赖你的数据集」）。

## 交付物

1. 运行中的 Marquez，至少包含来自真实 DAG 运行的五个数据集和三个作业。
2. 用于查询的 `lineage` CLI。
3. Grafana 仪表盘 JSON。
4. `FRESHNESS_SLO.md`，记录逐数据集 SLO。
5. 演示：将下游指标追溯至其来源数据集与代码。

## 验证

- [ ] 运行 DAG 后生成 Marquez 中可见的血缘边。
- [ ] `lineage upstream <dataset>` 返回生成该数据集的作业。
- [ ] Prometheus 抓取逐阶段指标。
- [ ] 人为将某数据集最后更新时间设为更早时间时，触发新鲜度告警。

## 拓展目标

- 通过 sqllineage 或 sqlfluff 解析 SQL，添加**列级血缘**。
- 添加**破坏性变更检测器**：如果某列被重命名而下游使用者未更新，则 PR 检查失败。
- 集成 **dbt** 的 OpenLineage 适配器，用于 SQL 转换。

## 常见陷阱

- **Airflow 崩溃时丢失 OpenLineage 事件**——传输层可能存在缓冲；使用 HTTP 与重试，并检查可靠投递机制。
- **血缘噪声过多**——合成/调试 DAG 淹没 Marquez。添加环境标签并过滤。
- **基于事件时间还是摄取时间计算新鲜度**——选择并明确一种口径。混用是容易引起混淆的事故来源。
- **每个任务都向 Prometheus Pushgateway 推送**——Pushgateway 用于特定批处理场景；可以用于终止阶段，而非长 DAG 中的每个任务（开销会累积）。

> 译注：列级血缘需要上游发出对应字段血缘信息，仅有数据集级血缘并不能自动回答任意列的依赖问题。
