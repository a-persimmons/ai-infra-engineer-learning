# 练习 07：使用 Great Expectations 进行数据质量验证

**时长：** 3 小时
**难度：** 中级
**前置条件：** Python、实验 06（GE 概览）

## 目标

针对驱动机器学习训练管道的真实数据集，构建 Great Expectations 规则集合，捕获下游模型真正关心的数据质量问题。将其作为管道门禁，失败时通知 Slack，并产出数据质量仪表盘。

## 为什么重要

输入质量退化时，模型可能悄然退化。坏数据会缓慢产生成本，例如准确率下降 0.5 个百分点，持续一个季度才被发现。在摄取阶段捕获问题成本最低；将测试视为数据契约是关键实践。

## 要求

1. **Expectation Suite** 至少包含 15 条期望规则，覆盖四类：
   - Schema（列存在、类型正确）。
   - 逐列值规则（范围、允许集合、空值容忍度）。
   - 跨列规则（外键、业务不变量）。
   - 分布规则（与基线比较，检测漂移）。
2. **Checkpoint** 可通过 `great_expectations checkpoint run training_data` 执行。
3. **管道集成**：验证失败时阻止训练阶段。
4. 失败时发送 **Slack 通知**，包含数据文档链接。
5. 自动生成且可访问的**数据文档**（S3 存储桶或本地 HTTP）。

## 分步操作

### 步骤 1——环境配置（15 分钟）
```bash
mkdir ge-quality && cd ge-quality
python -m venv venv && source venv/bin/activate
pip install 'great-expectations==0.18.16' pandas pyarrow

great_expectations init
# Choose: pandas, file-system data source, base dir ./data
```

### 步骤 2——生成示例数据（15 分钟）
```python
# create_data.py
import pandas as pd, numpy as np
np.random.seed(42)
df = pd.DataFrame({
    "transaction_id": range(10_000),
    "user_id":        np.random.randint(1, 1000, 10_000),
    "amount":         np.random.gamma(2, 50, 10_000),
    "currency":       np.random.choice(["USD","EUR","GBP","JPY"], 10_000),
    "country":        np.random.choice(["US","UK","DE","FR","JP"], 10_000),
    "is_fraud":       np.random.choice([0,1], 10_000, p=[0.97,0.03]),
})
df.to_parquet("data/transactions.parquet")
```

### 步骤 3——构建期望规则集合（60 分钟）
通过界面或编程方式创建：
```python
# build_suite.py
import great_expectations as gx

ctx = gx.get_context()
batch_request = ctx.get_datasource("default").get_asset("transactions").build_batch_request()
validator = ctx.get_validator(batch_request=batch_request, expectation_suite_name="training_data")

# Schema
validator.expect_table_columns_to_match_ordered_list([
    "transaction_id","user_id","amount","currency","country","is_fraud"
])

# Row count + uniqueness
validator.expect_table_row_count_to_be_between(min_value=1000, max_value=10_000_000)
validator.expect_column_values_to_be_unique("transaction_id")
validator.expect_column_values_to_not_be_null("transaction_id")

# Value ranges + allowed sets
validator.expect_column_values_to_be_between("amount", min_value=0, max_value=1_000_000, mostly=0.999)
validator.expect_column_values_to_be_in_set("currency", ["USD","EUR","GBP","JPY","AUD","CAD"])
validator.expect_column_values_to_be_in_set("is_fraud", [0,1])

# Class balance (catches schema/labeling bugs)
validator.expect_column_mean_to_be_between("is_fraud", min_value=0.005, max_value=0.10)

# Cross-column / business invariants
# (custom: "USD txn from JP user is suspicious; allow only if amount > 1000")
validator.expect_compound_columns_to_be_unique(["transaction_id"])

# Distribution drift (catches upstream pipeline changes)
validator.expect_column_kl_divergence_to_be_less_than(
    "amount", partition_object={"bins":[0,10,50,100,500,1e6],"weights":[0.2,0.4,0.2,0.15,0.05]},
    threshold=0.5,
)

validator.save_expectation_suite()
```

### 步骤 4——Checkpoint（15 分钟）
```bash
great_expectations checkpoint new training_data
# Wire to the asset + the suite; save
```

### 步骤 5——运行并观察（10 分钟）
```bash
great_expectations checkpoint run training_data
# Exit 0: passed. Non-zero: failed.

great_expectations docs build
open great_expectations/uncommitted/data_docs/local_site/index.html
```

### 步骤 6——故意制造失败（15 分钟）
破坏数据：将五行的 `is_fraud` 设置为 2（无效值）。重新运行，观察失败及触发失败的期望规则。

### 步骤 7——Airflow 集成（30 分钟）
```python
from airflow.operators.bash import BashOperator
from airflow.exceptions import AirflowFailException

validate = BashOperator(
    task_id="validate_training_data",
    bash_command="great_expectations checkpoint run training_data || exit 1",
)
# downstream train task only runs if validate succeeds
validate >> train
```

### 步骤 8——失败时通知 Slack 并附数据文档链接（30 分钟）
向 Checkpoint 配置添加 `SlackAction`：
```yaml
action_list:
  - name: store_validation_result
    action: { class_name: StoreValidationResultAction }
  - name: notify_slack
    action:
      class_name: SlackNotificationAction
      slack_webhook: https://hooks.slack.com/services/...
      notify_on: failure
      renderer:
        module_name: great_expectations.render.renderer.slack_renderer
        class_name: SlackRenderer
```

补充渲染后的 HTML 数据文档链接（生产环境托管于 S3）。

## 交付物

1. 期望规则集合（`great_expectations/expectations/training_data.json`）。
2. Checkpoint 配置（`great_expectations/checkpoints/training_data.yml`）。
3. Airflow DAG（或 DVC 管道），将验证作为训练前的门禁。
4. Slack Webhook 配置及实际失败通知截图。
5. `DATA_QUALITY_PLAYBOOK.md`：何时添加新期望规则，如何排查失败。

## 验证

- [ ] Checkpoint 对干净数据验证通过。
- [ ] Checkpoint 对损坏数据验证失败，并提供准确提示。
- [ ] 管道 DAG / DVC 阶段在失败时拒绝继续执行。
- [ ] Slack 通知在 30 秒内送达。
- [ ] 数据文档可访问，并显示通过与失败历史。

## 拓展目标

- 添加**分群期望规则**（例如 country=JP 的行具有不同金额分布）。
- 添加**数据剖析**：由 GE 根据「已知良好」基线自动建议期望规则。
- 迁移至 GE 的 **Fluent API**（较新的简洁接口），进行比较。

## 常见陷阱

- **规则集合过于严格**——捕获的是噪声而非信号。对软约束使用 `mostly=0.99`。
- **对不断变化的目标设置漂移规则**——真实季节性变化后，相对固定基线的 KL 散度可能持续告警。定期刷新基线。
- **`notify_on: any`**——成功时也向 Slack 发送大量通知；改用 `notify_on: failure`。
- **验证结果存储过大**——GE 不断累积结果。在对象存储中设置保留策略。

> 译注：代码与 CLI 保留原文所用版本的接口；新版 Great Expectations（GX Core）配置方式可能不同。
