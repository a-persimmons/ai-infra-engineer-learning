# 第 04 课：特征存储与特征工程

## 概览

特征存储（Feature Store）是生产 ML 系统的重要组件，用于解决在训练与推理之间一致地管理、共享及提供特征的问题。本课介绍特征存储概念、实现方式与最佳实践。

**时长：** 3–4 小时
**前置条件：** 理解 ML 管道、数据工程基础、Python。
**学习目标：**
- 理解特征存储的概念及其必要性。
- 学习特征工程模式与最佳实践。
- 使用 Feast（开源特征存储）实现特征。
- 处理在线及离线特征服务。
- 管理特征版本及监控。

---

## 1. 特征存储简介

### 1.1 什么是特征存储？

**特征存储**是用于集中存储、管理与提供 ML 特征的仓库。它作为原始数据源与 ML 模型之间的数据层。

**核心能力：**
```
┌─────────────────────────────────────────────────────────┐
│                    Feature Store                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Feature   │  │   Feature    │  │   Feature    │  │
│  │  Registry   │  │ Computation  │  │   Serving    │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Feature   │  │   Feature    │  │  Monitoring  │  │
│  │  Versioning │  │  Validation  │  │  & Alerts    │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                   │                   │
    Raw Data           Training Pipeline    Inference
```

### 1.2 特征存储解决的问题

#### 训练与服务偏差（Training-Serving Skew）

```python
# Training code (Python)
def get_user_features(user_id):
    df = spark.sql(f"""
        SELECT
            user_id,
            COUNT(*) as purchase_count,
            AVG(amount) as avg_purchase
        FROM purchases
        WHERE user_id = {user_id}
        GROUP BY user_id
    """)
    return df

# Serving code (Different language/framework)
# ❌ Inconsistent logic leads to skew
def get_user_features(user_id):
    # Different aggregation logic
    # Different time windows
    # Different data sources
    pass
```

**特征存储解决方案：**
```python
# Define once, use everywhere
@feast.entity
class User:
    user_id: str

@feast.feature_view
class UserPurchaseFeatures:
    """Consistent feature definition"""
    purchase_count: int
    avg_purchase: float

    # Same logic for training and serving
    source = PurchaseDataSource
    ttl = timedelta(days=30)
```

#### 特征复用

```python
# Without Feature Store - Duplicate feature engineering
# Team A
def calculate_user_ltv(user_data):
    # Complex LTV calculation
    pass

# Team B
def calculate_user_ltv(user_data):
    # Reimplemented, possibly different
    pass

# With Feature Store - Share features
feature_store.get_feature("user_ltv")  # Reuse across teams
```

#### 时间点正确性（Point-in-Time Correctness）

```python
# ❌ Without Feature Store - Data leakage risk
training_data = db.query("""
    SELECT features, label
    FROM features JOIN labels
    ON features.user_id = labels.user_id
""")  # Uses latest features, not point-in-time!

# ✅ With Feature Store - Point-in-time joins
training_data = feature_store.get_historical_features(
    entity_df=labels_df,  # Contains event timestamps
    features=[
        "user_features:purchase_count",
        "user_features:avg_purchase"
    ]
)  # Automatically handles point-in-time correctness
```

---

## 2. 特征存储架构

### 2.1 核心组件

```
┌──────────────────────────────────────────────────────────┐
│                     Feature Store                         │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │          Feature Registry (Metadata)                │  │
│  │  - Feature definitions                              │  │
│  │  - Schemas & types                                  │  │
│  │  - Data sources                                     │  │
│  │  - Ownership & lineage                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  Offline Store       │  │   Online Store           │  │
│  │  (Batch Features)    │  │   (Real-time Features)   │  │
│  │                      │  │                          │  │
│  │  - Data Warehouse    │  │   - Redis                │  │
│  │  - Data Lake         │  │   - DynamoDB             │  │
│  │  - Historical data   │  │   - Low latency (<10ms)  │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │          Feature Transformation Layer               │  │
│  │  - Batch transformations (Spark, Beam)              │  │
│  │  - Stream transformations (Flink, Spark Streaming)  │  │
│  │  - On-demand transformations                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
    Training Pipeline              Inference Service
```

### 2.2 离线存储与在线存储

| 方面 | 离线存储 | 在线存储 |
|---|---|---|
| **用途** | 训练、批量评分 | 实时推理 |
| **延迟** | 数分钟至数小时 | 毫秒级 |
| **数据量** | TB 级以上 | 每个 Key 为 MB 级（原文示例） |
| **技术** | BigQuery、Snowflake、S3 | Redis、DynamoDB、Cassandra |
| **查询模式** | 批量查询、时间范围 | 按单个 Key 查询 |
| **成本** | 针对存储优化 | 针对速度优化 |

---

## 3. 常用特征存储解决方案

### 3.1 开源方案（原文分类）

#### Feast（Feature Store）

```yaml
# Feast architecture
Registry: PostgreSQL / GCS / S3
Offline Store: BigQuery / Snowflake / Parquet
Online Store: Redis / DynamoDB / Datastore

Pros:
- Cloud agnostic
- Large community
- Good documentation

Cons:
- Limited transformation support
- Manual materialization jobs
```

#### Tecton

```yaml
# Managed service built on Feast

Pros:
- Fully managed
- Real-time feature computation
- Built-in monitoring

Cons:
- Commercial (expensive)
- Vendor lock-in
```

#### Hopsworks

```yaml
# Complete MLOps platform with feature store

Pros:
- Feature validation
- Feature monitoring
- Integrated with ML training

Cons:
- Complex setup
- Heavier than pure feature stores
```

### 3.2 云服务商解决方案

```python
# AWS SageMaker Feature Store
import sagemaker
from sagemaker.feature_store.feature_group import FeatureGroup

feature_group = FeatureGroup(
    name="user-features",
    sagemaker_session=sagemaker.Session()
)

# GCP Vertex AI Feature Store
from google.cloud import aiplatform

feature_store = aiplatform.Featurestore(
    featurestore_name="user_features"
)

# Azure ML Feature Store
from azureml.featurestore import FeatureStore

fs = FeatureStore(
    name="user_features",
    workspace=workspace
)
```

---

## 4. 使用 Feast 实现特征

### 4.1 安装与配置

```bash
# Install Feast
pip install feast

# Initialize Feast project
feast init feature_repo
cd feature_repo

# Project structure
feature_repo/
├── feature_store.yaml      # Configuration
├── features.py             # Feature definitions
└── data/                   # Sample data
```

### 4.2 特征存储配置

```yaml
# feature_store.yaml
project: ml_project
registry: data/registry.db
provider: local
online_store:
  type: redis
  connection_string: "localhost:6379"
offline_store:
  type: file  # Use parquet files for local development
entity_key_serialization_version: 2
```

### 4.3 定义实体（Entity）

```python
# features.py
from feast import Entity, ValueType

# Define entities (primary keys for features)
user = Entity(
    name="user_id",
    value_type=ValueType.STRING,
    description="User identifier"
)

product = Entity(
    name="product_id",
    value_type=ValueType.STRING,
    description="Product identifier"
)

transaction = Entity(
    name="transaction_id",
    value_type=ValueType.STRING,
    description="Transaction identifier"
)
```

### 4.4 定义特征视图（Feature View）

```python
from datetime import timedelta
from feast import FeatureView, Field, FileSource
from feast.types import Float32, Int64, String

# Define data source
user_stats_source = FileSource(
    path="data/user_statistics.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp",
)

# Define feature view
user_statistics = FeatureView(
    name="user_statistics",
    entities=[user],
    ttl=timedelta(days=30),
    schema=[
        Field(name="total_purchases", dtype=Int64),
        Field(name="avg_purchase_amount", dtype=Float32),
        Field(name="last_purchase_days_ago", dtype=Int64),
        Field(name="favorite_category", dtype=String),
        Field(name="loyalty_tier", dtype=String),
    ],
    source=user_stats_source,
    tags={"team": "recommendations", "version": "v1"},
)

# Stream feature view (for real-time features)
from feast import StreamFeatureView, PushSource

user_activity_source = PushSource(
    name="user_activity_push_source",
    batch_source=FileSource(path="data/user_activity.parquet"),
)

user_realtime_activity = StreamFeatureView(
    name="user_realtime_activity",
    entities=[user],
    ttl=timedelta(hours=1),
    schema=[
        Field(name="page_views_last_hour", dtype=Int64),
        Field(name="clicks_last_hour", dtype=Int64),
        Field(name="session_duration_seconds", dtype=Int64),
    ],
    source=user_activity_source,
)
```

### 4.5 应用特征定义

```bash
# Apply feature definitions to registry
feast apply

# Output:
# Registered entity user_id
# Registered entity product_id
# Registered feature view user_statistics
# Registered feature view user_realtime_activity

# View registered features
feast feature-views list
feast entities list
```

---

## 5. 特征工程模式

### 5.1 基于时间的聚合

```python
# Aggregation feature view
from feast import FeatureView, Field
from feast.types import Float32, Int64
import pandas as pd

def create_user_aggregations(transactions_df):
    """Calculate time-windowed aggregations"""

    features = transactions_df.groupby('user_id').agg({
        # Count aggregations
        'transaction_id': [
            ('purchases_7d', lambda x: x[x.index >= pd.Timestamp.now() - pd.Timedelta(days=7)].count()),
            ('purchases_30d', lambda x: x[x.index >= pd.Timestamp.now() - pd.Timedelta(days=30)].count()),
        ],

        # Sum aggregations
        'amount': [
            ('revenue_7d', lambda x: x[x.index >= pd.Timestamp.now() - pd.Timedelta(days=7)].sum()),
            ('revenue_30d', lambda x: x[x.index >= pd.Timestamp.now() - pd.Timedelta(days=30)].sum()),
        ],

        # Average aggregations
        'amount': [
            ('avg_amount_7d', lambda x: x[x.index >= pd.Timestamp.now() - pd.Timedelta(days=7)].mean()),
            ('avg_amount_30d', lambda x: x[x.index >= pd.Timestamp.now() - pd.Timedelta(days=30)].mean()),
        ]
    })

    return features

# Define as feature view
user_time_aggregations = FeatureView(
    name="user_time_aggregations",
    entities=[user],
    ttl=timedelta(days=1),
    schema=[
        Field(name="purchases_7d", dtype=Int64),
        Field(name="purchases_30d", dtype=Int64),
        Field(name="revenue_7d", dtype=Float32),
        Field(name="revenue_30d", dtype=Float32),
        Field(name="avg_amount_7d", dtype=Float32),
        Field(name="avg_amount_30d", dtype=Float32),
    ],
    source=FileSource(path="data/user_aggregations.parquet"),
)
```

### 5.2 按需特征（On-Demand Features）

```python
from feast import on_demand_feature_view, RequestSource
from feast.types import Float64

# Input sources
user_stats_source = FeatureView(...)  # Existing feature view
request_source = RequestSource(
    name="request_data",
    schema=[
        Field(name="current_cart_value", dtype=Float32),
        Field(name="current_hour", dtype=Int64),
    ]
)

# On-demand transformation
@on_demand_feature_view(
    sources=[user_statistics, request_source],
    schema=[
        Field(name="cart_value_vs_avg", dtype=Float32),
        Field(name="is_peak_hour", dtype=Int64),
        Field(name="discount_eligibility", dtype=Float32),
    ]
)
def user_derived_features(inputs: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate features on-demand during inference
    Use case: Features that require request context
    """
    output = pd.DataFrame()

    # Compare current cart to historical average
    output["cart_value_vs_avg"] = (
        inputs["current_cart_value"] / inputs["avg_purchase_amount"]
    )

    # Check if peak shopping hour (6-9 PM)
    output["is_peak_hour"] = (
        (inputs["current_hour"] >= 18) & (inputs["current_hour"] <= 21)
    ).astype(int)

    # Calculate discount eligibility
    output["discount_eligibility"] = (
        (inputs["loyalty_tier"] == "gold").astype(float) * 0.3 +
        (inputs["loyalty_tier"] == "silver").astype(float) * 0.2 +
        (output["cart_value_vs_avg"] > 1.5).astype(float) * 0.1
    )

    return output
```

### 5.3 跨实体特征

```python
# Multi-entity feature view
from feast import FeatureView

user_product_interactions = FeatureView(
    name="user_product_interactions",
    entities=[user, product],  # Multiple entities
    ttl=timedelta(days=90),
    schema=[
        Field(name="view_count", dtype=Int64),
        Field(name="purchase_count", dtype=Int64),
        Field(name="last_interaction_days", dtype=Int64),
        Field(name="avg_rating", dtype=Float32),
        Field(name="add_to_cart_count", dtype=Int64),
    ],
    source=FileSource(path="data/user_product_features.parquet"),
)

# Retrieval example
features = feature_store.get_online_features(
    features=[
        "user_statistics:total_purchases",
        "user_product_interactions:purchase_count",
        "product_features:popularity_score",
    ],
    entity_rows=[
        {
            "user_id": "user_123",
            "product_id": "prod_456",
        }
    ],
).to_dict()
```

---

## 6. 特征服务

### 6.1 离线特征（训练）

```python
from feast import FeatureStore
from datetime import datetime
import pandas as pd

# Initialize feature store
fs = FeatureStore(repo_path=".")

# Create entity dataframe with timestamps
entity_df = pd.DataFrame({
    "user_id": ["user_1", "user_2", "user_3"],
    "event_timestamp": [
        datetime(2024, 1, 15, 10, 0),
        datetime(2024, 1, 15, 11, 0),
        datetime(2024, 1, 15, 12, 0),
    ]
})

# Get historical features (point-in-time correct)
training_data = fs.get_historical_features(
    entity_df=entity_df,
    features=[
        "user_statistics:total_purchases",
        "user_statistics:avg_purchase_amount",
        "user_time_aggregations:purchases_7d",
        "user_time_aggregations:revenue_30d",
    ],
).to_df()

print(training_data)
#   user_id  event_timestamp  total_purchases  avg_purchase_amount  purchases_7d  revenue_30d
# 0 user_1   2024-01-15 10:00  15              75.50                3             1250.00
# 1 user_2   2024-01-15 11:00  8               120.00               1             980.00
# 2 user_3   2024-01-15 12:00  25              45.25                5             2100.00
```

### 6.2 在线特征（推理）

```python
# First, materialize features to online store
from datetime import datetime, timedelta

# Materialize historical features to online store
fs.materialize_incremental(
    end_date=datetime.now(),
    feature_views=["user_statistics", "user_time_aggregations"]
)

# Materialize specific date range
fs.materialize(
    start_date=datetime.now() - timedelta(days=7),
    end_date=datetime.now(),
    feature_views=["user_statistics"]
)

# Get online features (low latency)
online_features = fs.get_online_features(
    features=[
        "user_statistics:total_purchases",
        "user_statistics:loyalty_tier",
        "user_time_aggregations:purchases_7d",
    ],
    entity_rows=[
        {"user_id": "user_123"},
        {"user_id": "user_456"},
    ]
).to_dict()

print(online_features)
# {
#     'user_id': ['user_123', 'user_456'],
#     'total_purchases': [15, 8],
#     'loyalty_tier': ['gold', 'silver'],
#     'purchases_7d': [3, 1]
# }
```

### 6.3 实时特征更新

```python
from feast import FeatureStore
import pandas as pd

fs = FeatureStore(repo_path=".")

# Push real-time features
fs.push(
    push_source_name="user_activity_push_source",
    df=pd.DataFrame({
        "user_id": ["user_123"],
        "page_views_last_hour": [15],
        "clicks_last_hour": [8],
        "session_duration_seconds": [450],
        "event_timestamp": [datetime.now()],
    })
)

# Retrieve immediately
features = fs.get_online_features(
    features=["user_realtime_activity:page_views_last_hour"],
    entity_rows=[{"user_id": "user_123"}]
).to_dict()
```

---

## 7. 特征版本与管理

### 7.1 特征版本管理

```python
# Version 1: Original features
user_features_v1 = FeatureView(
    name="user_features_v1",
    entities=[user],
    schema=[
        Field(name="purchase_count", dtype=Int64),
        Field(name="avg_amount", dtype=Float32),
    ],
    tags={"version": "v1", "deprecated": "false"},
    source=user_source_v1,
)

# Version 2: Improved features
user_features_v2 = FeatureView(
    name="user_features_v2",
    entities=[user],
    schema=[
        Field(name="purchase_count_7d", dtype=Int64),    # More specific
        Field(name="purchase_count_30d", dtype=Int64),   # New
        Field(name="avg_amount_7d", dtype=Float32),      # More specific
        Field(name="ltv_score", dtype=Float32),          # New calculated field
    ],
    tags={"version": "v2", "deprecated": "false"},
    source=user_source_v2,
)

# Gradual migration strategy
# 1. Deploy v2 alongside v1
# 2. A/B test model performance
# 3. Gradually shift traffic
# 4. Deprecate v1 after validation
```

### 7.2 特征元数据与文档

```python
from feast import FeatureView, Field
from feast.types import Float32

user_ltv_features = FeatureView(
    name="user_ltv_features",
    entities=[user],
    schema=[
        Field(
            name="ltv_30d",
            dtype=Float32,
            description="Predicted customer lifetime value over 30 days",
            tags={
                "owner": "data-science-team",
                "pii": "false",
                "business_critical": "true",
                "calculation_method": "xgboost_model_v3",
            }
        ),
        Field(
            name="ltv_90d",
            dtype=Float32,
            description="Predicted customer lifetime value over 90 days",
            tags={
                "owner": "data-science-team",
                "pii": "false",
                "business_critical": "true",
            }
        ),
    ],
    tags={
        "team": "growth",
        "use_case": "customer_retention",
        "sla": "99.9",
        "update_frequency": "hourly",
    },
    online=True,
    source=ltv_source,
)
```

---

## 8. 特征监控

### 8.1 特征漂移检测

```python
import pandas as pd
from scipy import stats

def detect_feature_drift(
    historical_features: pd.DataFrame,
    current_features: pd.DataFrame,
    threshold: float = 0.05
):
    """
    Detect if feature distributions have drifted
    """
    drift_report = {}

    for column in historical_features.columns:
        if column in current_features.columns:
            # Kolmogorov-Smirnov test
            statistic, p_value = stats.ks_2samp(
                historical_features[column].dropna(),
                current_features[column].dropna()
            )

            drift_report[column] = {
                "statistic": statistic,
                "p_value": p_value,
                "drifted": p_value < threshold,
                "drift_severity": statistic
            }

    return drift_report

# Example usage
historical = fs.get_historical_features(
    entity_df=training_entities,
    features=["user_statistics:avg_purchase_amount"]
).to_df()

current = fs.get_online_features(
    features=["user_statistics:avg_purchase_amount"],
    entity_rows=current_entities
).to_df()

drift_report = detect_feature_drift(historical, current)
```

### 8.2 特征质量指标

```python
def monitor_feature_quality(features_df: pd.DataFrame) -> dict:
    """
    Monitor feature quality metrics
    """
    quality_metrics = {}

    for column in features_df.columns:
        quality_metrics[column] = {
            # Completeness
            "null_percentage": features_df[column].isnull().sum() / len(features_df) * 100,

            # Distribution metrics
            "mean": features_df[column].mean(),
            "std": features_df[column].std(),
            "min": features_df[column].min(),
            "max": features_df[column].max(),

            # Outliers (beyond 3 std devs)
            "outlier_percentage": (
                (features_df[column] - features_df[column].mean()).abs() >
                3 * features_df[column].std()
            ).sum() / len(features_df) * 100,

            # Cardinality
            "unique_values": features_df[column].nunique(),
        }

    return quality_metrics

# Set up alerting
def check_feature_alerts(quality_metrics: dict):
    alerts = []

    for feature, metrics in quality_metrics.items():
        # Alert on high null percentage
        if metrics["null_percentage"] > 10:
            alerts.append(f"⚠️ {feature}: High null rate ({metrics['null_percentage']:.1f}%)")

        # Alert on high outlier percentage
        if metrics["outlier_percentage"] > 5:
            alerts.append(f"⚠️ {feature}: High outlier rate ({metrics['outlier_percentage']:.1f}%)")

    return alerts
```

---

## 9. 最佳实践

### 9.1 特征设计原则

```python
# ✅ DO: Use descriptive names
"user_purchases_30d"         # Clear time window
"product_avg_rating"         # Clear aggregation
"user_ltv_predicted"         # Clear this is predicted

# ❌ DON'T: Use ambiguous names
"user_count"                 # Count of what? Over what time?
"score"                      # What kind of score?
"value"                      # Too generic

# ✅ DO: Include units in feature names
"session_duration_seconds"
"distance_kilometers"
"price_usd"

# ❌ DON'T: Leave units ambiguous
"session_duration"           # Seconds? Minutes?
"distance"                   # Meters? Miles?

# ✅ DO: Make time windows explicit
"revenue_7d"
"pageviews_last_hour"

# ❌ DON'T: Use implicit time windows
"revenue"
"pageviews"
```

### 9.2 特征存储组织

```python
# Organize by domain
feature_repo/
├── features/
│   ├── user_features.py          # User domain
│   ├── product_features.py       # Product domain
│   ├── transaction_features.py   # Transaction domain
│   └── realtime_features.py      # Real-time features
├── data_sources/
│   ├── warehouse_sources.py      # Data warehouse sources
│   └── stream_sources.py         # Stream sources
├── feature_services/
│   ├── recommendation_service.py # Feature bundles
│   └── fraud_detection_service.py
└── feature_store.yaml
```

### 9.3 性能优化

```python
# Use feature services for bundling
from feast import FeatureService

recommendation_features = FeatureService(
    name="recommendation_features",
    features=[
        user_statistics,
        user_product_interactions,
        product_features,
    ],
    tags={"use_case": "product_recommendations"}
)

# Retrieve all features in one call
features = fs.get_online_features(
    feature_service="recommendation_features",
    entity_rows=[{"user_id": "user_123", "product_id": "prod_456"}]
)

# Cache frequently accessed features
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_user_features(user_id: str):
    return fs.get_online_features(
        features=["user_statistics:total_purchases"],
        entity_rows=[{"user_id": user_id}]
    ).to_dict()
```

---

## 10. 动手练习

### 练习：构建用户推荐特征存储

**目标：** 为推荐系统创建包含用户、商品和交互特征的特征存储。

**要求：**
1. 定义实体：用户、商品。
2. 创建特征视图：
   - 用户人口统计特征。
   - 用户行为（购买、浏览）。
   - 商品属性。
   - 用户与商品的交互。
3. 实现按需特征。
4. 设置在线与离线特征服务。
5. 添加特征监控。

**起始代码：**
```python
# TODO: Complete this implementation

from feast import Entity, FeatureView, Field, FeatureService
from feast.types import Float32, Int64, String
from datetime import timedelta

# Step 1: Define entities
user = Entity(
    name="user_id",
    # TODO: Add value_type and description
)

# Step 2: Define feature views
user_features = FeatureView(
    # TODO: Define user demographic and behavioral features
)

# Step 3: Create on-demand features
@on_demand_feature_view(
    # TODO: Calculate personalization score
)
def personalization_features(inputs):
    # TODO: Implement feature transformations
    pass

# Step 4: Create feature service
recommendation_service = FeatureService(
    # TODO: Bundle features for recommendation model
)
```

---

## 总结

本课学习了：

**特征存储概念：**
- 集中式特征管理。
- 训练与服务的一致性。
- 时间点正确性。

**Feast 实现：**
- 特征定义与实体。
- 离线与在线服务。
- 实时特征更新。

**特征工程：**
- 基于时间的聚合。
- 按需转换。
- 跨实体特征。

**生产环境实践：**
- 特征版本管理。
- 监控与告警。
- 性能优化。

---

## 补充资源

- [Feast 文档](https://docs.feast.dev/)
- [Google 的 ML 特征存储](https://cloud.google.com/architecture/ml-feature-store)
- [Uber Michelangelo 特征存储](https://www.uber.com/blog/michelangelo-machine-learning-platform/)
- [Airbnb Zipline 特征存储](https://www.youtube.com/watch?v=qJezpxcdoOg)

---

## 下一课

**第 05 课：ML 模型的 CI/CD**——学习如何为机器学习模型构建持续集成与部署管道。

> 译注：Tecton 是商业特征平台，不应直接归类为开源特征存储；产品能力和许可应以官方说明为准。在线存储通常保存每个实体的最新特征值，单 Key 容量并无固定 MB 级要求。特征存储也不能自动消除训练与服务偏差：应确保时间点正确的历史 Join、特征转换一致、数据新鲜度及版本兼容。Feast 的接口与实时更新能力随版本及后端而异。代码块与其中英文注释保持原样。
