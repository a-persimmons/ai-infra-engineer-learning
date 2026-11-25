# 实验 06：使用 Great Expectations 验证数据

**时长：** 60 分钟  **前置条件：** Python 3.11+。

## 目标

为机器学习训练数据集构建 Great Expectations 期望规则集合，通过 Checkpoint 执行验证，在违反质量规则时明确报错，并将验证集成到 Airflow DAG。

## 步骤

### 1. 安装
```bash
python -m venv venv && source venv/bin/activate
pip install 'great-expectations==0.18.16' pandas pyarrow
```

### 2. 初始化项目
```bash
great_expectations init
# Choose: PandasExecutionEngine, InferredAsset filesystem connector, base dir ./data
```

### 3. 创建小型数据集
```python
# create_data.py
import pandas as pd, numpy as np
df = pd.DataFrame({
    "user_id": np.arange(1000),
    "amount": np.random.gamma(2, 10, 1000),
    "country": np.random.choice(["US","UK","DE","JP"], 1000),
    "label":  np.random.choice([0,1], 1000, p=[0.97,0.03]),
})
df.to_parquet("data/train.parquet")
```
运行该程序。

### 4. 构建规则集合
```bash
great_expectations suite new
# Pick the train.parquet asset, name suite "training_data_suite", choose "Profile data".
```

这会打开一个包含自动生成期望规则的 Jupyter Notebook。检查、精简并保存。

### 5. 手动添加关键期望规则
```python
# in the notebook
validator.expect_column_values_to_not_be_null("user_id")
validator.expect_column_values_to_be_in_set("label", [0, 1])
validator.expect_column_mean_to_be_between("label", min_value=0.01, max_value=0.10)
validator.expect_column_values_to_be_between("amount", min_value=0, max_value=10_000)
validator.save_expectation_suite(discard_failed_expectations=False)
```

### 6. 创建 Checkpoint 并运行
```bash
great_expectations checkpoint new training_data_checkpoint
# Wire it to the suite and data asset
great_expectations checkpoint run training_data_checkpoint
```
退出码：通过时为 0，失败时为非零。

### 7. 破坏数据
```python
# corrupt some labels
df.loc[df.index[:5], "label"] = 2
df.to_parquet("data/train.parquet")
```
重新运行 Checkpoint，预期在 `expect_column_values_to_be_in_set` 规则处失败。

### 8. 在 Airflow 中使用
```python
from airflow.operators.bash import BashOperator
validate = BashOperator(
    task_id="validate_training_data",
    bash_command="cd /opt/airflow/ge && great_expectations checkpoint run training_data_checkpoint",
)
```
验证任务失败 → 下游 `train` 不执行。这正是质量门禁的目的。

## 验证

- [ ] Checkpoint 对干净的数据验证通过。
- [ ] Checkpoint 对损坏的数据验证失败（退出码非 0）。
- [ ] `uncommitted/data_docs/local_site/` 中的 HTML 数据文档显示通过与失败历史。

## 清理
```bash
deactivate && rm -rf venv data great_expectations
```

## 故障排查

- **Checkpoint 能运行但从不失败** — `expect_column_mean_to_be_between` 的上下界过宽，将其收紧。
- **Notebook 找不到 Jupyter** — 执行 `pip install jupyterlab`。
- **新版 GE 找不到 `PandasExecutionEngine`** — 新版本使用 Fluent API；旧版 DataContext 方式在 0.18 中仍然可用。
