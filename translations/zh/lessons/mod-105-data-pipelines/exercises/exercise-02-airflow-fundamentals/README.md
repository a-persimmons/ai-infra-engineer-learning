# 练习 02：Airflow 基础——构建真实 DAG

**时长：** 3 小时
**难度：** 入门进阶
**前置条件：** 练习 01 与实验 01（Airflow 已在本地运行）

## 目标

构建执行端到端机器学习训练管道的 Airflow DAG：从 S3 摄取数据、验证、转换、训练、评估及条件部署。涵盖 TaskFlow API、XCom、分支、错误处理、重试、SLA 与动态任务映射。

## 为什么重要

Airflow 是机器学习基础设施中使用广泛的工作流引擎。熟练掌握其惯用模式（TaskFlow 与 PythonOperator 的区别、XCom 限制、分支技巧），能够构建其他工程师无需重写即可扩展的管道。

## 要求

构建 `recs_training_dag.py`，包含：

1. 通过 TaskFlow API（`@task` 装饰器）实现至少六个任务。
2. 基于数据质量结果的**条件分支**（部署或跳过）。
3. **动态任务映射**：按商品类别并行执行特征工程作业。
4. 通过 **XCom** 传递中间产物（文件路径而非数据本身）。
5. 对不稳定步骤采用指数退避**重试**。
6. 每次 DAG 运行的 **SLA** 为四小时；违反 SLA 时通知 Slack。
7. 使用**任务组**组织可视化结构。
8. 使用 **Sensor** 等待上游数据投递至 S3。

## 分步操作

### 步骤 1——骨架（15 分钟）
```python
# dags/recs_training.py
from __future__ import annotations
from datetime import datetime, timedelta
from airflow import DAG
from airflow.decorators import task, task_group
from airflow.utils.trigger_rule import TriggerRule
from airflow.sensors.s3 import S3KeySensor

DEFAULT_ARGS = {
    "owner": "recs-team",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=30),
    "sla": timedelta(hours=4),
    "email_on_failure": False,
    "on_failure_callback": notify_slack,
    "on_sla_miss_callback": notify_slack_sla,
}

with DAG(
    "recs_training",
    start_date=datetime(2026, 1, 1),
    schedule="0 2 * * *",
    catchup=False,
    default_args=DEFAULT_ARGS,
    tags=["ml", "recs"],
) as dag:
    ...
```

### 步骤 2——等待上游数据（15 分钟）
```python
wait_events = S3KeySensor(
    task_id="wait_events",
    bucket_key="events/{{ ds }}/_SUCCESS",
    bucket_name="recs-raw",
    poke_interval=300,
    timeout=3600,
    mode="reschedule",      # frees worker between pokes
)
```

### 步骤 3——摄取与验证（30 分钟）
```python
@task
def ingest(date: str) -> str:
    import pandas as pd
    df = pd.read_parquet(f"s3://recs-raw/events/{date}/")
    out = f"/tmp/events_{date}.parquet"
    df.to_parquet(out)
    return out

@task
def validate(path: str) -> dict:
    # Quick checks; return summary
    import pandas as pd
    df = pd.read_parquet(path)
    return {
        "rows": len(df),
        "schema_ok": set(df.columns) >= {"user_id","item_id","ts","event_type"},
        "freshness_ok": pd.Timestamp.utcnow() - df["ts"].max() < pd.Timedelta("3h"),
    }
```

### 步骤 4——根据验证结果分支（20 分钟）
```python
@task.branch
def decide(validation: dict) -> str:
    if not (validation["schema_ok"] and validation["freshness_ok"] and validation["rows"] > 10_000):
        return "skip"
    return "transform"

@task
def skip() -> None:
    print("data quality insufficient — skipping training")
```

### 步骤 5——用于特征工程的动态任务映射（30 分钟）
```python
@task
def list_categories(path: str) -> list[str]:
    import pandas as pd
    return list(pd.read_parquet(path)["category"].unique())

@task
def features_for_category(category: str, events_path: str) -> str:
    # produce per-category feature parquet
    ...
    return f"/tmp/features_{category}.parquet"

# Dynamic mapping:
categories = list_categories(events_path)
features = features_for_category.partial(events_path=events_path).expand(category=categories)
```

### 步骤 6——训练与评估（30 分钟）
```python
@task
def train(feature_paths: list[str]) -> str:
    import joblib
    # combine, train
    model_path = f"/tmp/model_{ds}.joblib"
    joblib.dump(model, model_path)
    return model_path

@task
def evaluate(model_path: str) -> dict:
    return {"auc": 0.85, "ndcg": 0.42}
```

### 步骤 7——条件部署（15 分钟）
```python
@task.branch
def deploy_decision(metrics: dict) -> str:
    return "deploy" if metrics["auc"] >= 0.80 else "alert_regression"

@task
def deploy(model_path: str) -> None: ...

@task(trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS)
def alert_regression() -> None: ...
```

### 步骤 8——任务组（10 分钟）
```python
@task_group(group_id="quality_gate")
def quality_gate(events_path):
    v = validate(events_path)
    return decide(v)
```

### 步骤 9——连接全部任务（15 分钟）
```python
events = ingest(date="{{ ds }}")
decision = quality_gate(events)
features = features_for_category.partial(events_path=events).expand(category=list_categories(events))
model = train(features) >> decision
metrics = evaluate(model)
deploy_decision(metrics) >> [deploy(model), alert_regression()]
```

## 交付物

1. `recs_training.py` DAG。
2. 通过 `airflow dags trigger recs_training` 成功运行。
3. Graph 视图、Gantt 视图及动态任务映射展开的截图。
4. `RUNBOOK.md`：如何回填、清除失败运行状态，以及解读 SLA 违规。

## 验证

- [ ] DAG 在界面中出现且没有导入错误。
- [ ] 手动触发后端到端执行成功。
- [ ] 特征工程按每个类别生成一个任务（在 Graph 视图验证动态映射）。
- [ ] 故意使验证步骤失败时，路由至 `skip` 而非 `transform`。
- [ ] 回填五天产生五次成功运行。

## 拓展目标

- 添加 **Datasets**，使 DAG 在上游事件数据到达时触发（事件驱动，而非时间驱动）。
- 添加 **DAG 级测试**：使用 `pytest` 导入 DAG、验证结构并试运行。
- 添加**任务级埋点**：每个任务通过 `prometheus_client.start_http_server` 暴露 Prometheus 指标。

## 常见陷阱

- **使用 XCom 传递大量数据**——XCom 后端（通常是数据库）限制载荷大小。传递文件路径或 S3 URI。
- **Sensor 使用 `mode="poke"`**——整个等待过程占用 Worker 槽位。使用 `mode="reschedule"`，在两次检查之间释放槽位。
- **`task.branch` 返回错误任务 ID**——必须完全匹配，拼写错误会破坏分支。
- **回填产生大量运行**——通过 `catchup=False` 和 `max_active_runs=1` 控制自动补跑及并发。

> 译注：本练习主要采用 Airflow 2.x 的术语与 API；新版 Airflow 的 SLA、资产调度、命令及界面可能存在差异。
