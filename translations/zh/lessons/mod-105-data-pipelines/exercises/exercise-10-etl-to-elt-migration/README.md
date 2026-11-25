# 练习 10：使用 dbt 从 ETL 迁移至 ELT

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 02（Airflow）、SQL 基础

## 目标

使用 dbt 将 Python/Spark ETL 作业迁移为 ELT 模式：先将原始数据加载至数据仓库（本地使用 DuckDB，生产使用 BigQuery/Snowflake），再通过 dbt 模型以 SQL 执行所有转换，添加测试与文档，并使用 Airflow 编排。

## 为什么重要

ETL（Extract-Transform-Load，提取—转换—加载）将业务逻辑放入 Python/Spark 代码；ELT（Extract-Load-Transform，提取—加载—转换）将其迁移到数据仓库中的 SQL。ELT 是现代分析工作负载的常见默认模式（原文估计约 80%），具有更好的血缘、治理能力，并且分析人员更容易使用。能够灵活选择两种模式的工程师，可以更清晰地扩展机器学习平台。

## 要求

1. 从既有 Spark/Python ETL 作业开始（使用练习 05 的作业）。
2. 使用 **dbt 模型**（SQL）替换转换逻辑。
3. 添加 **dbt 测试**（唯一性、非空、允许值）。
4. 生成带血缘图的 **dbt 文档**。
5. **源数据新鲜度检查**。
6. 通过 **Airflow** 调用 `dbt build` 进行编排。

## 分步操作

### 步骤 1——选择数据仓库并安装（15 分钟）
```bash
pip install 'dbt-duckdb==1.7.4'      # local DuckDB
# or: dbt-bigquery, dbt-snowflake, dbt-postgres
```

### 步骤 2——初始化 dbt 项目（15 分钟）
```bash
dbt init recs_dbt
cd recs_dbt
# Configure ~/.dbt/profiles.yml:
#   recs_dbt:
#     target: dev
#     outputs:
#       dev:
#         type: duckdb
#         path: ./recs.duckdb
```

### 步骤 3——将原始数据加载至数据仓库（30 分钟）
使用 Python 的「EL」步骤（仅提取和加载）：
```python
# load.py
import duckdb, pandas as pd
con = duckdb.connect("recs.duckdb")
con.execute("CREATE SCHEMA IF NOT EXISTS raw")
df = pd.read_parquet("s3://.../events.parquet")
con.register("df", df)
con.execute("CREATE OR REPLACE TABLE raw.events AS SELECT * FROM df")
```

### 步骤 4——数据源声明（15 分钟）
```yaml
# models/sources.yml
version: 2
sources:
  - name: raw
    schema: raw
    tables:
      - name: events
        loaded_at_field: created_at
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 24, period: hour }
      - name: products
      - name: users
```

### 步骤 5——Staging 模型（45 分钟）
```sql
-- models/staging/stg_events.sql
{{ config(materialized='view') }}
SELECT
    event_id,
    user_id,
    product_id,
    event_type,
    CAST(ts AS TIMESTAMP) AS event_at,
    DATE(ts) AS event_date,
    LOWER(country) AS country
FROM {{ source('raw', 'events') }}
WHERE event_type IN ('view','click','purchase')
```

对商品和用户数据重复执行。

### 步骤 6——数据集市（Marts）（45 分钟）
```sql
-- models/marts/dim_users.sql
{{ config(materialized='table') }}
SELECT user_id, country, tier, signup_date
FROM {{ ref('stg_users') }}

-- models/marts/fct_user_daily_activity.sql
{{ config(materialized='incremental', incremental_strategy='delete+insert', unique_key=['user_id','event_date']) }}
SELECT
    user_id,
    event_date,
    COUNT(*) FILTER (WHERE event_type = 'view') AS views,
    COUNT(*) FILTER (WHERE event_type = 'click') AS clicks,
    COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchases,
    SUM(amount) FILTER (WHERE event_type = 'purchase') AS revenue
FROM {{ ref('stg_events') }}
{% if is_incremental() %}
  WHERE event_date >= (SELECT MAX(event_date) FROM {{ this }})
{% endif %}
GROUP BY 1, 2
```

### 步骤 7——测试（30 分钟）
```yaml
# models/schema.yml
version: 2
models:
  - name: dim_users
    columns:
      - name: user_id
        tests: [unique, not_null]
      - name: country
        tests:
          - accepted_values: { values: ["US","UK","DE","FR","JP"] }
  - name: fct_user_daily_activity
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns: [user_id, event_date]
```
运行：
```bash
dbt deps
dbt test
```

### 步骤 8——端到端运行（15 分钟）
```bash
dbt source freshness   # warns if raw is stale
dbt build              # run models + tests in correct order
dbt docs generate && dbt docs serve   # http://localhost:8080
```

### 步骤 9——Airflow 编排（30 分钟）
```python
from airflow.providers.dbt.cloud.operators.dbt import DbtCloudRunJobOperator
# or just BashOperator:
from airflow.operators.bash import BashOperator

with DAG("dbt_daily", schedule="0 4 * * *", ...) as dag:
    load_raw = PythonOperator(task_id="load_raw", python_callable=load_raw_data)
    dbt = BashOperator(task_id="dbt_build", bash_command="cd /opt/dbt && dbt build --target prod")
    load_raw >> dbt
```

## 交付物

1. 包含 Staging 和 Marts 模型的 dbt 项目。
2. 涵盖 unique、not_null、accepted_values 的测试。
3. 生成的 dbt 文档站点。
4. 编排 `dbt build` 的 Airflow DAG。
5. `MIGRATION_NOTES.md`：记录哪些逻辑从 Python/Spark 迁移至 dbt，以及原因。

## 验证

- [ ] `dbt build` 成功且没有测试失败。
- [ ] `dbt docs serve` 显示 raw → staging → marts 的血缘图。
- [ ] 人为使原始表数据过期时，源数据新鲜度检查发出警告。
- [ ] 增量模型 `fct_user_daily_activity` 在重新运行时只处理新分区。

## 拓展目标

- 添加 **dbt-expectations** 包，获得更丰富的数据测试（类似 dbt 中的 Great Expectations）。
- 添加**快照（Snapshots）**，追踪缓慢变化的维度。
- 实现 **dbt Cloud 风格 CI**：PR 检查在沙箱数据库中执行 `dbt build --select state:modified+`。

## 常见陷阱

- **源数据新鲜度使用数据仓库时间戳**——确保 `loaded_at_field` 有实际意义，而非 dbt 上一次写入的时间。
- **增量模型不具备幂等性**——`unique_key` + `merge` 通常更安全；`append` 可能导致重复数据。
- **每次构建都在生产运行全部测试**——成本高。为测试添加标签，每次构建运行轻量测试，夜间运行重型测试。
- **dbt 依赖数据仓库算力**——设计不当的模型可能消耗大量额度。为连接设置查询超时。
