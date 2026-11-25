# 第 01 课：面向 ML 的数据管道架构

## 学习目标

完成本课后，你将能够：
- 理解 ML 数据管道的组件与模式。
- 设计可扩展的数据管道架构。
- 在批处理与流处理之间作出选择。
- 应用数据管道设计原则及最佳实践。
- 识别常见反模式与陷阱。
- 为 ML 项目规划数据管道基础设施。

## 前置条件

- 理解 Python 与 SQL。
- 具备数据库与数据存储基础知识。
- 熟悉 ML 训练工作流。
- 已完成模块 01–04。

## 导论

**数据管道为什么对 ML 重要：**
- **数据是基础：** 模型质量取决于训练数据质量。
- **自动化：** 手动准备数据难以扩展。
- **可复现性：** 管道确保数据转换过程一致。
- **监控：** 追踪数据质量，尽早发现问题。
- **效率：** 编排后的管道节省时间并减少错误。

**实际行业应用（原文案例与统计）：**
- **Uber：** 每天通过数据管道处理 PB 级数据，为定价、路径规划、欺诈检测模型提供支持。
- **Netflix：** 数据管道为推荐模型提供每天超过两亿次用户交互的训练数据。
- **Spotify：** 数据管道以近实时方式生成个性化模型特征。
- **Airbnb：** 超过 1,000 个 Airflow DAG 编排定价、搜索和推荐的数据管道。

## 1. ML 数据管道组件

### 1.1 管道阶段

**典型 ML 数据管道：**

```
┌─────────────┐
│ Data Sources│
│ APIs, DBs,  │
│ Files, etc  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Ingestion  │  ← Collect raw data
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validation  │  ← Check data quality
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Transformation│  ← Clean, normalize, transform
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Feature Eng. │  ← Generate ML features
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Storage    │  ← Store for training
│ (S3, DB)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ML Training  │  ← Train models
│             │
└─────────────┘
```

### 1.2 组件分解

**1. 数据源**

ML 数据管道的常见来源：
- **数据库：** PostgreSQL、MySQL、MongoDB（用户数据、交易）。
- **API：** REST/GraphQL 端点（外部数据、实时数据源）。
- **对象存储：** S3、GCS、Azure Blob（大型数据集、日志、图像）。
- **流数据：** Kafka、Kinesis（实时事件、点击流）。
- **文件：** CSV、Parquet、JSON（批量上传、导出）。

**2. 数据摄取**

从数据源提取数据：
```python
# Example: Ingest from multiple sources
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
import requests

# Database ingestion
def ingest_from_db():
    hook = PostgresHook(postgres_conn_id='analytics_db')
    df = hook.get_pandas_df("SELECT * FROM user_events WHERE date >= %(start_date)s")
    return df

# API ingestion
def ingest_from_api():
    response = requests.get("https://api.example.com/data", headers={"Authorization": f"Bearer {token}"})
    return response.json()

# S3 ingestion
def ingest_from_s3(bucket, key):
    hook = S3Hook(aws_conn_id='aws_default')
    obj = hook.read_key(key, bucket)
    return pd.read_parquet(BytesIO(obj))
```

**3. 数据验证**

处理前检查数据质量：
```python
import great_expectations as ge

def validate_data(df):
    """Validate data quality with Great Expectations"""
    # Convert to GE DataFrame
    ge_df = ge.from_pandas(df)

    # Define expectations
    ge_df.expect_column_to_exist("user_id")
    ge_df.expect_column_values_to_not_be_null("user_id")
    ge_df.expect_column_values_to_be_unique("user_id")
    ge_df.expect_column_values_to_be_between("age", min_value=0, max_value=120)
    ge_df.expect_column_values_to_be_in_set("country", ["US", "UK", "CA", "AU"])

    # Run validation
    result = ge_df.validate()

    if not result["success"]:
        raise ValueError(f"Data validation failed: {result}")

    return df
```

**4. 数据转换**

清洗并转换数据：
```python
def transform_data(df):
    """Apply transformations"""
    # Remove duplicates
    df = df.drop_duplicates(subset=['user_id', 'timestamp'])

    # Handle missing values
    df['age'].fillna(df['age'].median(), inplace=True)

    # Normalize text
    df['name'] = df['name'].str.lower().str.strip()

    # Convert types
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Filter outliers
    df = df[df['purchase_amount'] < df['purchase_amount'].quantile(0.99)]

    return df
```

**5. 特征工程**

生成 ML 特征：
```python
def engineer_features(df):
    """Create features for ML model"""
    # Time-based features
    df['hour_of_day'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6])

    # Aggregation features
    user_stats = df.groupby('user_id').agg({
        'purchase_amount': ['sum', 'mean', 'count'],
        'timestamp': 'max'
    })
    df = df.merge(user_stats, on='user_id', how='left')

    # Categorical encoding
    df = pd.get_dummies(df, columns=['country', 'device_type'])

    # Feature scaling (for specific columns)
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    df[['purchase_amount', 'user_lifetime_value']] = scaler.fit_transform(
        df[['purchase_amount', 'user_lifetime_value']]
    )

    return df
```

**6. 存储**

存储处理后的数据：
```python
def store_data(df, output_path):
    """Store data in partitioned Parquet format"""
    # Partition by date for efficient querying
    df['date'] = df['timestamp'].dt.date

    # Write to S3 in Parquet format (compressed, columnar)
    df.to_parquet(
        output_path,
        engine='pyarrow',
        compression='snappy',
        partition_cols=['date'],
        index=False
    )
```

## 2. 数据管道模式

### 2.1 批处理

**特点：**
- 按计划分批处理数据（每小时、每天、每周）。
- 高吞吐量、较高延迟。
- 适合历史分析与模型训练。

**使用场景示例：** 每天使用前一天的数据重新训练模型。

```python
# Airflow DAG for batch processing
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'daily_model_training_pipeline',
    default_args=default_args,
    description='Daily batch pipeline for model training',
    schedule_interval='0 2 * * *',  # 2 AM daily
    start_date=datetime(2023, 1, 1),
    catchup=False,
)

ingest_task = PythonOperator(
    task_id='ingest_data',
    python_callable=ingest_from_db,
    op_kwargs={'date': '{{ ds }}'},  # Airflow execution date
    dag=dag,
)

validate_task = PythonOperator(
    task_id='validate_data',
    python_callable=validate_data,
    dag=dag,
)

transform_task = PythonOperator(
    task_id='transform_data',
    python_callable=transform_data,
    dag=dag,
)

feature_eng_task = PythonOperator(
    task_id='feature_engineering',
    python_callable=engineer_features,
    dag=dag,
)

store_task = PythonOperator(
    task_id='store_data',
    python_callable=store_data,
    op_kwargs={'output_path': 's3://ml-data/processed/{{ ds }}/'},
    dag=dag,
)

# Define dependencies
ingest_task >> validate_task >> transform_task >> feature_eng_task >> store_task
```

### 2.2 流处理

**特点：**
- 实时或近实时处理数据。
- 低延迟，逐事件处理的吞吐量相对受限（原文描述）。
- 适合实时特征与在线学习。

**使用场景示例：** 实时欺诈检测特征。

```python
# Kafka consumer for streaming processing
from kafka import KafkaConsumer
from json import loads
import pandas as pd

consumer = KafkaConsumer(
    'user_transactions',
    bootstrap_servers=['localhost:9092'],
    auto_offset_reset='latest',
    enable_auto_commit=True,
    group_id='ml-feature-engineering',
    value_deserializer=lambda x: loads(x.decode('utf-8'))
)

def process_stream():
    """Process streaming transactions in micro-batches"""
    batch = []
    batch_size = 100

    for message in consumer:
        transaction = message.value

        # Add to batch
        batch.append(transaction)

        # Process micro-batch
        if len(batch) >= batch_size:
            df = pd.DataFrame(batch)

            # Validate
            validated_df = validate_data(df)

            # Transform
            transformed_df = transform_data(validated_df)

            # Engineer features
            features_df = engineer_features(transformed_df)

            # Write to feature store (Redis, for real-time serving)
            write_to_feature_store(features_df)

            # Clear batch
            batch = []
```

### 2.3 Lambda 架构

**结合批处理与流处理：**

```
        ┌─────────────────┐
        │   Data Source   │
        └────────┬────────┘
                 │
         ┌───────┴───────┐
         │               │
    ┌────▼────┐    ┌────▼────┐
    │ Batch   │    │ Stream  │  ← Speed layer
    │ Layer   │    │ Layer   │
    └────┬────┘    └────┬────┘
         │               │
         │         ┌─────▼─────┐
         │         │Real-time  │
         │         │Views      │
    ┌────▼─────────▼──────────┐
    │    Serving Layer         │
    │ (Combines batch + stream)│
    └──────────────────────────┘
```

**适用时机：**
- 同时需要历史分析（批处理）与实时特征（流处理）。
- 例如推荐系统：批处理用户历史记录，流处理当前会话。

## 3. 数据管道设计原则

### 3.1 幂等性

**原则：** 多次执行同一个数据管道产生相同的结果。

**为什么重要：**
- 失败时可以安全重试。
- 支持历史数据回填（Backfill）。
- 防止重复数据。

**示例（非幂等）：**

```python
# ❌ BAD: Appends data, not idempotent
def save_data(df):
    df.to_csv('output.csv', mode='append')  # Duplicates if re-run!
```

**示例（幂等）：**

```python
# ✅ GOOD: Overwrites partition, idempotent
def save_data(df, date):
    df.to_parquet(f's3://ml-data/processed/date={date}/data.parquet', mode='overwrite')
```

### 3.2 增量处理

**原则：** 只处理新增或变化的数据，而非整个数据集。

**为什么重要：**
- 减少处理时间与成本。
- 加快管道运行。
- 适应大型数据集。

**示例：**

```python
def incremental_pipeline(execution_date):
    """Process only data for execution_date"""
    # Read only new data
    df = read_data(start_date=execution_date, end_date=execution_date + timedelta(days=1))

    # Process
    df = transform_data(df)

    # Write to date-partitioned storage
    df.to_parquet(f's3://ml-data/processed/date={execution_date}/data.parquet')
```

### 3.3 数据分区

**原则：** 将数据组织为逻辑分区，提高查询效率。

**常见分区策略：**
- **基于时间：** `date=2023-10-15/`（ML 中最常见）。
- **基于类别：** `country=US/`、`model_version=v1.2/`。
- **基于哈希：** `user_id_hash=abc123/`（用于分布式处理）。

**示例：**

```python
# Write partitioned data
df.to_parquet(
    's3://ml-data/training/',
    partition_cols=['date', 'model_version'],  # Creates date=.../model_version=.../
    engine='pyarrow'
)

# Read specific partition (much faster than scanning all data)
df = pd.read_parquet('s3://ml-data/training/date=2023-10-15/model_version=v1.2/')
```

### 3.4 Schema 演进

**原则：** 妥善处理 Schema 变化，避免破坏数据管道。

**策略：**

```python
# Strategy 1: Default values for new columns
def read_data_with_defaults(path):
    df = pd.read_parquet(path)

    # Add new column if it doesn't exist
    if 'new_feature' not in df.columns:
        df['new_feature'] = None  # Or default value

    return df

# Strategy 2: Schema validation and versioning
from pandera import DataFrameSchema, Column, Check

schema_v1 = DataFrameSchema({
    "user_id": Column(int),
    "purchase_amount": Column(float, Check.greater_than(0)),
})

schema_v2 = schema_v1.add_columns({
    "loyalty_tier": Column(str, nullable=True)
})

def validate_with_schema_version(df, version='v2'):
    schemas = {'v1': schema_v1, 'v2': schema_v2}
    return schemas[version].validate(df)
```

### 3.5 错误处理与重试

**原则：** 妥善处理暂时性故障；数据存在问题时快速失败。

```python
from airflow.operators.python import PythonOperator
from airflow.exceptions import AirflowSkipException

def process_with_error_handling(**context):
    """Process data with proper error handling"""
    try:
        # Attempt processing
        df = ingest_data()
        df = validate_data(df)
        df = transform_data(df)
        store_data(df)

    except ValidationError as e:
        # Data quality issue - don't retry, alert immediately
        send_alert(f"Data validation failed: {e}")
        raise  # Fail the task

    except ConnectionError as e:
        # Transient network issue - retry (Airflow will handle)
        raise

    except EmptyDataError as e:
        # Expected scenario - skip this run
        raise AirflowSkipException("No data available for this date")

task = PythonOperator(
    task_id='process_data',
    python_callable=process_with_error_handling,
    retries=3,  # Retry on failure
    retry_delay=timedelta(minutes=5),
    retry_exponential_backoff=True,  # 5min, 10min, 20min
)
```

## 4. 数据管道架构模式

### 4.1 ETL 与 ELT

**ETL（Extract, Transform, Load，提取、转换、加载）：**
```
Extract → Transform → Load
```
- 加载到数据仓库之前转换数据。
- 适合存储受限、需要在存储前清洗数据的场景。
- 工具：Airflow、Luigi。

**ELT（Extract, Load, Transform，提取、加载、转换）：**
```
Extract → Load → Transform
```
- 加载原始数据，在数据仓库内部进行转换。
- 适合低成本存储、具有强大计算能力的数据仓库（Snowflake、BigQuery）。
- 工具：dbt、Airflow + BigQuery。

**ETL 示例：**
```python
# ETL: Transform in pipeline before loading
df = extract_from_api()
df = transform_data(df)  # Clean, normalize
df = engineer_features(df)  # Feature engineering
load_to_warehouse(df)  # Load clean data
```

**ELT 示例：**
```python
# ELT: Load raw data, transform in warehouse
df = extract_from_api()
load_to_data_lake(df)  # Load raw data to S3

# Transform with SQL in BigQuery
query = """
  CREATE OR REPLACE TABLE ml_features AS
  SELECT
    user_id,
    EXTRACT(HOUR FROM timestamp) as hour_of_day,
    AVG(purchase_amount) OVER (PARTITION BY user_id) as avg_purchase
  FROM raw_data.transactions
  WHERE date = CURRENT_DATE()
"""
run_bigquery_transform(query)
```

### 4.2 Medallion 架构（青铜层/白银层/黄金层）

**分层数据处理：**

```
┌───────────┐
│  Bronze   │  ← Raw data (as-is from source)
│ (Raw Lake)│
└─────┬─────┘
      │
      ▼
┌───────────┐
│  Silver   │  ← Cleaned, validated data
│ (Curated) │
└─────┬─────┘
      │
      ▼
┌───────────┐
│   Gold    │  ← Business-level aggregates, ML features
│ (Refined) │
└───────────┘
```

**实现：**

```python
# Bronze layer: Ingest raw data
def bronze_layer(execution_date):
    raw_df = extract_from_source()
    raw_df.to_parquet(f's3://ml-data/bronze/date={execution_date}/')

# Silver layer: Clean and validate
def silver_layer(execution_date):
    raw_df = pd.read_parquet(f's3://ml-data/bronze/date={execution_date}/')
    clean_df = validate_data(raw_df)
    clean_df = transform_data(clean_df)
    clean_df.to_parquet(f's3://ml-data/silver/date={execution_date}/')

# Gold layer: ML features
def gold_layer(execution_date):
    clean_df = pd.read_parquet(f's3://ml-data/silver/date={execution_date}/')
    features_df = engineer_features(clean_df)
    features_df.to_parquet(f's3://ml-data/gold/date={execution_date}/')
```

**优势：**
- 清晰的关注点分离。
- 必要时可以从青铜层重新执行转换。
- 便于调试（检查各层的数据）。

### 4.3 微服务数据管道架构

**将各管道阶段解耦为独立服务：**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Ingestion   │      │ Transformation│     │   Storage    │
│  Service     │─────▶│   Service     │────▶│   Service    │
│ (REST API)   │      │ (Kafka Stream)│     │  (S3 Writer) │
└──────────────┘      └──────────────┘      └──────────────┘
```

**优势：**
- 独立扩缩容。
- 灵活选择语言（Python、Scala、Go）。
- 故障隔离。

**示例：**

```python
# Ingestion microservice (FastAPI)
from fastapi import FastAPI

app = FastAPI()

@app.post("/ingest")
async def ingest_data(data: dict):
    # Validate input
    validated = validate_schema(data)

    # Publish to Kafka
    producer.send('raw-data-topic', value=validated)

    return {"status": "ingested", "id": data['id']}

# Transformation microservice (Kafka Streams consumer)
from kafka import KafkaConsumer, KafkaProducer

consumer = KafkaConsumer('raw-data-topic', ...)
producer = KafkaProducer('transformed-data-topic', ...)

for message in consumer:
    raw_data = message.value
    transformed = transform_data(raw_data)
    producer.send('transformed-data-topic', value=transformed)
```

## 5. 应避免的反模式

### 5.1 紧耦合的数据管道

**错误做法：单体管道（全部成功或全部失败）。**

```python
def monolithic_pipeline():
    """If any step fails, entire pipeline fails"""
    data1 = fetch_from_source_1()  # If this fails, everything fails
    data2 = fetch_from_source_2()
    data3 = fetch_from_source_3()

    combined = merge_all_data(data1, data2, data3)
    train_model(combined)
```

**正确做法：解耦、独立的任务。**

```python
# Each source is independent task
task_source_1 = ingest_source_1()
task_source_2 = ingest_source_2()
task_source_3 = ingest_source_3()

# Merge only if all succeeded
merge_task = merge_data([task_source_1, task_source_2, task_source_3])
```

### 5.2 没有数据版本管理

**错误做法：覆盖数据而不管理版本。**

```python
df.to_csv('training_data.csv')  # Lost previous version!
```

**正确做法：通过时间戳或哈希管理数据版本。**

```python
import hashlib

# Version by date
df.to_parquet(f's3://ml-data/training/date={today}/data.parquet')

# Version by content hash (for reproducibility)
data_hash = hashlib.md5(df.to_csv().encode()).hexdigest()
df.to_parquet(f's3://ml-data/training/hash={data_hash}/data.parquet')
```

### 5.3 忽视数据质量

**错误做法：没有验证，垃圾输入导致垃圾输出。**

```python
df = fetch_data()
train_model(df)  # Hope it's good data!
```

**正确做法：处理前验证数据。**

```python
df = fetch_data()

# Check for nulls
if df.isnull().sum().sum() > len(df) * 0.1:  # > 10% nulls
    raise ValueError("Too many nulls in data")

# Check for schema drift
expected_columns = ['user_id', 'purchase_amount', 'timestamp']
if not set(expected_columns).issubset(df.columns):
    raise ValueError(f"Missing columns: {set(expected_columns) - set(df.columns)}")

# Validate ranges
assert df['purchase_amount'].min() >= 0, "Negative purchase amount detected"

train_model(df)
```

### 5.4 不监控数据管道

**错误做法：无法了解管道的健康状况。**

**正确做法：监控管道指标。**

```python
from prometheus_client import Counter, Histogram

# Metrics
rows_processed = Counter('pipeline_rows_processed_total', 'Rows processed')
processing_duration = Histogram('pipeline_duration_seconds', 'Pipeline duration')

@processing_duration.time()
def run_pipeline():
    df = fetch_data()
    df = transform_data(df)

    rows_processed.inc(len(df))

    store_data(df)

# Alert on metrics
# - Row count drop > 20% from historical average
# - Processing duration > 2x normal
# - Error rate > 1%
```

## 6. 总结

### 核心要点

**ML 数据管道包含六个核心阶段：**
- 摄取 → 验证 → 转换 → 特征工程 → 存储 → 训练。

**管道模式：**
- **批处理：** 高吞吐量、定期处理。
- **流处理：** 实时、低延迟。
- **Lambda：** 结合批处理与流处理。

**设计原则：**
- **幂等性：** 可以安全地重新执行。
- **增量处理：** 只处理新数据。
- **分区：** 提高查询效率。
- **错误处理：** 重试暂时性故障，数据问题快速失败。

**架构模式：**
- **ETL 与 ELT：** 在加载之前或之后转换数据。
- **Medallion（青铜/白银/黄金）：** 分层精炼数据。
- **微服务：** 解耦且可扩展的服务。

**避免反模式：**
- 紧耦合数据管道。
- 没有数据版本管理。
- 没有数据质量检查。
- 没有监控。

### 实际行业应用

采用成熟数据管道实践的企业（原文统计）：
- **Uber：** 超过 10 万张表，每天处理超过 10PB 数据。
- **Airbnb：** 超过 1,000 个 Airflow DAG，支撑搜索与定价。
- **Spotify：** 为超过四亿用户提供近实时特征。
- **Netflix：** 每天处理超过 5,000 亿个事件，用于推荐。

## 自我检查问题

1. ML 数据管道的六个核心阶段是什么？
2. 批处理与流处理有什么区别？
3. 为什么幂等性对于数据管道很重要？
4. 什么是 Medallion 架构（青铜层/白银层/黄金层）？
5. ETL 与 ELT 有什么区别？
6. 如何处理生产管道中的 Schema 演进？
7. 应监控哪些数据管道指标？
8. 何时使用 Lambda 架构？

## 补充资源

- [数据工程设计模式](https://www.dedp.online/)
- [The Data Engineering Cookbook](https://github.com/andkret/Cookbook)
- [Airflow 最佳实践](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [AWS 数据管道模式](https://aws.amazon.com/blogs/big-data/)

---

**下一课：** Apache Airflow 基础——学习使用行业常用编排工具实现这些模式！

> 译注：企业规模数字为原文统计，未独立核验。流处理也可以实现高吞吐量；选择批处理或流处理应依据延迟目标、状态管理、数据一致性及成本。幂等性需要稳定业务键、确定性的输入范围及适当的提交机制，仅有重试并不能确保幂等。原始代码块与图示保留。
