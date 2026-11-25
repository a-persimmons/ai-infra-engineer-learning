# 实验 07：使用 Evidently 监控漂移

**时长：** 60 分钟  **前置条件：** Python 3.11+；已有基准数据集。

## 目标

计算基准（训练）数据集与最近的生产样本之间的特征漂移和预测漂移。生成 HTML 报告及适用于告警的 JSON 摘要。

## 步骤

### 1. 安装
```bash
pip install 'evidently==0.4.30' pandas pyarrow
```

### 2. 两个数据集
```python
import pandas as pd, numpy as np
np.random.seed(42)

ref = pd.DataFrame({
    "feature_1": np.random.normal(0, 1, 5000),
    "feature_2": np.random.exponential(2, 5000),
    "category":  np.random.choice(["a","b","c"], 5000),
    "prediction": np.random.choice([0,1], 5000, p=[0.7,0.3]),
})

prod = pd.DataFrame({
    "feature_1": np.random.normal(0.4, 1.2, 5000),     # shifted
    "feature_2": np.random.exponential(3, 5000),        # scale changed
    "category":  np.random.choice(["a","b","c"], 5000, p=[0.5,0.3,0.2]),
    "prediction": np.random.choice([0,1], 5000, p=[0.6,0.4]),  # class balance shifted
})
```

### 3. 运行漂移报告
```python
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset

rpt = Report(metrics=[DataDriftPreset(), TargetDriftPreset()])
rpt.run(reference_data=ref, current_data=prod, column_mapping=None)
rpt.save_html("drift_report.html")
res = rpt.as_dict()
```

### 4. 打开 HTML
```bash
open drift_report.html
```
查看各特征的漂移分数、分布与总体摘要。

### 5. 将通过/失败结果提取为 JSON
```python
import json
summary = {
    "dataset_drift": res["metrics"][0]["result"]["dataset_drift"],
    "n_drifted":     res["metrics"][0]["result"]["number_of_drifted_columns"],
    "drift_by_column": {
        c["column_name"]: c["drift_score"]
        for c in res["metrics"][0]["result"]["drift_by_columns"].values()
    },
}
json.dump(summary, open("drift_summary.json", "w"), indent=2, default=str)
print(json.dumps(summary, indent=2, default=str))
```

### 6. 调度

将其封装进每日运行的 Airflow DAG；若 `dataset_drift` 连续三天为 True，则发出告警。

## 验证

- [ ] HTML 报告能够打开并展示每个特征的分布叠加图。
- [ ] 使用上面的测试数据时，`n_drifted` ≥ 2。
- [ ] JSON 摘要适合输入告警系统。

## 清理
```bash
rm drift_report.html drift_summary.json
```

## 故障排查

- **`dataset_drift` 始终为 False** — 默认检验（数值型使用 KS，类别型使用卡方检验）需要真正的分布变化；此处的合成数据已调整为能够触发漂移。
- **HTML 报告太大，无法嵌入 Slack** — 使用 JSON 摘要进行告警，附上 HTML 链接用于调查。
- **不关心的特征发生漂移** — 使用 `ColumnMapping` 将其排除。
