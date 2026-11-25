# 实验 02：编写你的第一个 DAG

**时长：** 75 分钟  **前置条件：** 完成实验 01；Airflow 正在运行。

## 目标

构建一个模拟真实机器学习流水线的端到端 DAG：下载数据、转换数据、训练小型模型、写回指标。使用 TaskFlow API，演示依赖关系、重试与 XCom。

## 步骤

### 1. 项目 DAG
```python
# dags/iris_pipeline.py
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

from airflow import DAG
from airflow.decorators import task

DEFAULTS = {
    "owner": "ml-platform",
    "retries": 2,
    "retry_delay": timedelta(minutes=1),
    "execution_timeout": timedelta(minutes=15),
}

with DAG(
    dag_id="iris_pipeline",
    description="download → transform → train → report",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",
    catchup=False,
    default_args=DEFAULTS,
    tags=["lab", "iris"],
) as dag:

    @task
    def download() -> str:
        from sklearn.datasets import load_iris
        import pandas as pd
        df = pd.DataFrame(load_iris(as_frame=True).frame)
        out = "/tmp/iris.parquet"
        df.to_parquet(out)
        return out

    @task
    def transform(path: str) -> str:
        import pandas as pd
        df = pd.read_parquet(path)
        df = df[df["sepal length (cm)"] > 4.5]
        out = "/tmp/iris_clean.parquet"
        df.to_parquet(out)
        return out

    @task
    def train(path: str) -> dict:
        import pandas as pd
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import accuracy_score
        from sklearn.model_selection import train_test_split

        df = pd.read_parquet(path)
        X = df.drop(columns=["target"])
        y = df["target"]
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestClassifier(n_estimators=50, random_state=42).fit(X_tr, y_tr)
        return {"accuracy": float(accuracy_score(y_te, model.predict(X_te)))}

    @task
    def report(metrics: dict) -> None:
        print(f"final metrics: {json.dumps(metrics)}")

    report(train(transform(download())))
```

### 2. 放入 dags/ 目录并观察其出现

调度器每 30 秒扫描一次。

### 3. 触发并观察

界面 → iris_pipeline → Trigger DAG，将逻辑日期设为当天。

### 4. 观察 XCom 数据流

点击 `train` 任务 → XCom 标签页 → 查看传递给 `report` 的字典。

### 5. 强制失败以测试重试

修改 `transform`，使其执行 `raise RuntimeError("synthetic")`。触发并观察最终失败之前的两次重试。

### 6. 改用 TaskGroup 提高可读性
```python
from airflow.utils.task_group import TaskGroup
with TaskGroup("data") as data_grp:
    raw = download(); clean = transform(raw)
report(train(clean))
```

## 验证

- [ ] DAG 出现在界面中。
- [ ] 四个任务全部按顺序成功运行。
- [ ] 可看到来自 `train` 的 XCom。
- [ ] 强制失败产生两次重试。

## 清理
```bash
rm ~/airflow/dags/iris_pipeline.py
```

## 故障排查

- **DAG 未出现** — 可能存在语法错误；使用 `airflow dags list-import-errors` 查看。
- **无法识别 `@task`** — Airflow 版本较旧；`from airflow.decorators import task` 要求 2.0+。
- **XCom 过大** — 原文指出默认后端限制为 48KB；使用 S3/GCS 后端，或仅通过 XCom 传递文件路径，将数据写入对象存储。
