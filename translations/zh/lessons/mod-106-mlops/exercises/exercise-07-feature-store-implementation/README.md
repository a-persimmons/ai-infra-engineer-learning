# 练习 07：实现特征存储

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 03（Feast 概览）

## 目标

搭建接近生产形态的特征存储：离线存储（S3 上的 Parquet）、在线存储（Redis）、注册中心、特征定义、物化作业，以及用于训练的时间点正确历史检索。使用它训练模型并提供预测服务。

## 为什么重要

特征存储旨在解决训练与服务偏差（Training/Serving Skew）——机器学习生产环境中隐性故障的常见原因。由于计算方式不同，训练特征与服务时的特征不一致。特征存储帮助团队统一定义与计算口径。

## 要求

1. 通过代码定义特征（Feast 或同类工具）。
2. 从数据仓库（DuckDB / PostgreSQL）向 Redis 物化数据的作业。
3. 用于训练的**时间点正确（Point-in-time Correct）**历史检索。
4. 在线检索 p99 低于 10ms。
5. 涵盖两条流水线的测试。
6. `feature_store.yaml` 注册中心配置，涉及两个实体、至少五个特征。

## 分步操作

### 步骤 1——配置（15 分钟）
```bash
pip install 'feast[redis]' pandas duckdb
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 步骤 2——示例数据仓库（30 分钟）
```python
import duckdb, pandas as pd, numpy as np
np.random.seed(42)

con = duckdb.connect("warehouse.duckdb")
# users table
users = pd.DataFrame({"user_id": range(1000), "country": np.random.choice(["US","UK"], 1000),
                       "signup_date": pd.date_range("2024-01-01", periods=1000)})
con.execute("CREATE OR REPLACE TABLE users AS SELECT * FROM users")

# transactions over time
rows = []
for u in range(1000):
    for d in range(30):
        rows.append({"user_id": u, "ts": pd.Timestamp("2026-05-01") + pd.Timedelta(days=d),
                     "amount": np.random.gamma(2, 50)})
tx = pd.DataFrame(rows)
con.execute("CREATE OR REPLACE TABLE transactions AS SELECT * FROM tx")
con.execute("INSERT INTO transactions SELECT * FROM tx")
```

### 步骤 3——Feast 项目（30 分钟）
```bash
feast init my_store && cd my_store/feature_repo
```

在 `features.py` 中定义实体与 Feature View：
```python
from datetime import timedelta
from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64, String

user = Entity(name="user", join_keys=["user_id"])

users_source = FileSource(
    name="users_src",
    path="../../data/users.parquet",
    timestamp_field="signup_date",
)
users_fv = FeatureView(
    name="user_dim",
    entities=[user],
    ttl=timedelta(days=365),
    schema=[Field(name="country", dtype=String)],
    source=users_source,
)

tx_source = FileSource(
    name="tx_src",
    path="../../data/transactions.parquet",
    timestamp_field="ts",
)
tx_features = FeatureView(
    name="user_transactions",
    entities=[user],
    ttl=timedelta(days=30),
    schema=[
        Field(name="amount", dtype=Float32),
    ],
    source=tx_source,
)
```

### 步骤 4——配置 Redis（15 分钟）
```yaml
# feature_store.yaml
project: my_store
provider: local
registry: data/registry.db
online_store:
    type: redis
    connection_string: localhost:6379
offline_store: { type: file }
entity_key_serialization_version: 2
```

### 步骤 5——应用与物化（15 分钟）
```bash
feast apply
# Export warehouse tables to parquet for Feast's file source
python -c "import duckdb; con=duckdb.connect('../../warehouse.duckdb'); \
  con.execute('COPY users TO ../../data/users.parquet'); \
  con.execute('COPY transactions TO ../../data/transactions.parquet')"

feast materialize-incremental $(date -u +%Y-%m-%dT%H:%M:%S)
```

### 步骤 6——在线检索（15 分钟）
```python
from feast import FeatureStore
store = FeatureStore(repo_path=".")

# Benchmark
import time
t0 = time.perf_counter()
for _ in range(1000):
    store.get_online_features(
        features=["user_dim:country", "user_transactions:amount"],
        entity_rows=[{"user_id": 1}],
    ).to_dict()
ms = (time.perf_counter()-t0) / 1000 * 1000
print(f"avg: {ms:.2f}ms")
```
目标耗时低于 10ms。

### 步骤 7——用于训练的时间点正确历史检索（45 分钟）
```python
import pandas as pd
# For each (user, label_timestamp) pair, fetch features as they were at that time
entity_df = pd.DataFrame({
    "user_id":         [1, 1, 2, 2],
    "event_timestamp": [pd.Timestamp("2026-05-15"), pd.Timestamp("2026-05-25"),
                         pd.Timestamp("2026-05-15"), pd.Timestamp("2026-05-25")],
})

training_df = store.get_historical_features(
    entity_df=entity_df,
    features=["user_dim:country", "user_transactions:amount"],
).to_df()
print(training_df)
```
每行特征反映实体在 `event_timestamp` 时刻的状态，不泄露未来数据。

### 步骤 8——测试（15 分钟）
```python
def test_online_returns_value():
    f = store.get_online_features(features=["user_dim:country"], entity_rows=[{"user_id": 1}]).to_dict()
    assert f["country"][0] in {"US","UK"}

def test_historical_excludes_future():
    df = store.get_historical_features(entity_df=..., features=["user_transactions:amount"]).to_df()
    # All amounts must have ts <= event_timestamp; verify by setting up a known case
    assert df["amount"].isnull().sum() == 0
```

## 交付物

1. 至少包含两个 Feature View 的 Feast 仓库。
2. 可用的物化作业。
3. 在线检索低于 10ms 的基准测试。
4. 生成时间点正确训练数据的历史检索。
5. `TRAINING_SERVING_SKEW.md`：说明该特征存储如何消除训练与服务偏差。

## 验证

- [ ] `feast apply` 成功且无错误。
- [ ] 在线检索 p99 低于 10ms。
- [ ] 历史检索正确执行时间点语义。
- [ ] 测试通过。

## 拓展目标

- 将离线存储迁移至 **BigQuery** 或 **Snowflake**，支持生产规模。
- 添加**流式特征**（通过流式摄取更新在线存储）。
- 添加**特征血缘**：哪些模型使用哪些特征（用于影响分析）。

## 常见陷阱

- **TTL 过短**——特征在查询之前已经从 Redis 过期。根据访问模式调优。
- **没有物化调度**——在线特征逐渐过期。每 N 分钟调度一次 materialize-incremental。
- **时间点错误**——未设置 `timestamp_field` 可能导致特征泄露。始终设置并进行测试。
- **Redis 基数膨胀**——每个实体与 Feature View 的组合可能产生大量键；上线前估算规模。

> 译注：统一特征定义不自动保证训练与服务完全一致，仍须验证时间窗口、数据新鲜度、缺失值处理以及离线与在线转换逻辑。
