# 实验 03：搭建 Feast 特征存储

**时长：** 75 分钟  **前置条件：** Python 3.11+、Redis。

## 目标

在 Feast 中定义特征视图，将 Parquet 来源的数据物化到在线 Redis 存储，并分别执行在线（低延迟）与离线（训练）特征检索。

## 步骤

### 1. 安装 Feast
```bash
python -m venv venv && source venv/bin/activate
pip install 'feast[redis]' pandas
```

### 2. 初始化仓库
```bash
feast init my_store
cd my_store/feature_repo
```

### 3. 生成示例数据
```python
# data/driver_stats.parquet generation
import pandas as pd, numpy as np, pyarrow.parquet as pq
ids = list(range(1000, 1005))
ts = pd.date_range("2026-05-01", periods=24, freq="H")
rows = []
for d in ids:
    for t in ts:
        rows.append({"driver_id": d, "event_timestamp": t,
                     "trips_today": int(np.random.poisson(8)),
                     "avg_rating":  float(np.round(np.random.normal(4.7, 0.2), 2))})
pd.DataFrame(rows).to_parquet("data/driver_stats.parquet")
```

### 4. 特征定义
```python
# features.py
from datetime import timedelta
from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64

driver = Entity(name="driver_id", join_keys=["driver_id"])

src = FileSource(
    name="driver_stats_src",
    path="data/driver_stats.parquet",
    timestamp_field="event_timestamp",
)

driver_stats = FeatureView(
    name="driver_stats",
    entities=[driver],
    ttl=timedelta(days=1),
    schema=[
        Field(name="trips_today", dtype=Int64),
        Field(name="avg_rating",  dtype=Float32),
    ],
    source=src,
    online=True,
)
```

### 5. 配置 Redis 在线存储
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

启动 Redis：`docker run -d -p 6379:6379 redis:7-alpine`。

### 6. 应用配置并物化
```bash
feast apply
feast materialize-incremental $(date -u +%Y-%m-%dT%H:%M:%S)
```

### 7. 在线检索
```python
from feast import FeatureStore
store = FeatureStore(repo_path=".")
print(store.get_online_features(
    features=["driver_stats:trips_today", "driver_stats:avg_rating"],
    entity_rows=[{"driver_id": 1000}, {"driver_id": 1003}],
).to_dict())
```

### 8. 离线检索（训练集）
```python
import pandas as pd
entity_df = pd.DataFrame({"driver_id": [1000,1001], "event_timestamp": [pd.Timestamp("2026-05-01 10:00"), pd.Timestamp("2026-05-01 12:00")]})
print(store.get_historical_features(entity_df=entity_df,
        features=["driver_stats:trips_today","driver_stats:avg_rating"]).to_df())
```

## 验证

- [ ] `feast apply` 不返回错误。
- [ ] 在线检索返回两个实体行的特征值。
- [ ] 离线检索返回历史值（时间点正确）。

## 清理
```bash
docker stop $(docker ps -q --filter ancestor=redis:7-alpine)
deactivate && rm -rf my_store venv
```

## 故障排查

- **`Online store is empty`** — 跳过了 `feast materialize-incremental`。在线存储通过显式物化填充，而不是通过 `apply` 填充。
- **`Could not connect to redis`** — `feature_store.yaml` 中的主机错误。从笔记本电脑访问时应为 `localhost:6379`。
- **Schema 不匹配** — `Field` 中的 dtype 必须与 Parquet 列类型匹配。
