# 练习 03：使用 Kafka 构建实时 ML 特征管道

**预计时长：** 36–44 小时
**难度：** 高级
**前置条件：** Python 3.9+、Apache Kafka、Flink、Redis、PostgreSQL

## 概览

使用 Apache Kafka、Flink 与特征存储构建生产级实时特征工程管道。处理流式事件（用户点击、交易），以低于 100ms 的延迟为 ML 模型计算特征。实现恰好一次（Exactly-once）语义，回填历史特征，并以个位数毫秒级延迟为在线推理提供特征。

在生产 ML 系统中，实时特征管道对以下方面至关重要：
- **低延迟推理：** 欺诈检测（低于 50ms）、推荐（低于 100ms）。
- **特征新鲜度：** 利用最近 5 分钟的事件进行预测。
- **一致性：** 训练与服务使用相同特征（避免训练/服务偏差）。
- **规模：** 通过自动扩缩容处理每秒 10 万以上事件。
- **可靠性：** 恰好一次处理，不重复、不丢失事件。

## 学习目标

完成本练习后，你将能够：

1. **构建流式管道**，使用 Kafka 与 Flink。
2. **实现流式数据特征工程。**
3. **管理特征存储**（在线与离线）。
4. **处理迟到及乱序事件**，使用 Watermark。
5. **实现恰好一次语义**，使用 Kafka 事务。
6. **构建历史特征回填管道。**
7. **监控管道健康状态**，使用指标与告警。

## 业务背景

**实际业务场景（原文案例）：** 电商平台需要实时交易欺诈检测。目前批处理管道存在以下问题：

- **特征过时：** 批量 ETL 每 6 小时运行一次。
- **欺诈损失高：** 检测延迟导致 2.5% 欺诈率（每月损失 50 万美元）。
- **缺少实时信号：** 无法使用「最近 10 分钟内 5 笔交易」等特征。
- **训练/服务偏差：** 训练使用 Spark，服务使用 Python，逻辑不同。
- **规模问题：** 黑色星期五峰值达每秒 5 万笔交易，批处理管道无法跟上。

你的任务是构建流式管道：
- 事件到达后 50ms 内计算特征。
- 保持特征一致性（训练/服务使用相同代码）。
- 通过水平扩展处理每秒 10 万事件。
- 保证恰好一次处理（无重复特征）。
- 回填历史特征，用于模型训练。

## 项目结构

```
exercise-03-streaming-pipeline-kafka/
├── README.md
├── requirements.txt
├── docker-compose.yaml              # Kafka, Flink, Redis, Postgres
├── config/
│   ├── kafka-topics.yaml            # Topic configurations
│   ├── flink-config.yaml            # Flink job config
│   └── feature-definitions.yaml     # Feature schemas
├── src/
│   └── feature_pipeline/
│       ├── __init__.py
│       ├── producers/
│       │   ├── __init__.py
│       │   ├── transaction_producer.py  # Generate sample events
│       │   └── clickstream_producer.py
│       ├── processors/
│       │   ├── __init__.py
│       │   ├── flink_processor.py       # Flink feature computation
│       │   ├── aggregations.py          # Time-window aggregations
│       │   └── transformations.py       # Feature transformations
│       ├── stores/
│       │   ├── __init__.py
│       │   ├── online_store.py          # Redis for online serving
│       │   ├── offline_store.py         # Postgres for training
│       │   └── feature_registry.py      # Feature metadata
│       ├── backfill/
│       │   ├── __init__.py
│       │   └── historical_loader.py     # Backfill historical features
│       ├── serving/
│       │   ├── __init__.py
│       │   └── feature_server.py        # FastAPI feature serving
│       └── monitoring/
│           ├── __init__.py
│           └── metrics.py               # Pipeline metrics
├── flink_jobs/
│   ├── fraud_features.py            # Flink job for fraud features
│   └── user_features.py             # Flink job for user features
├── tests/
│   ├── test_processors.py
│   ├── test_stores.py
│   ├── test_serving.py
│   └── fixtures/
│       └── sample_events.json
├── examples/
│   ├── produce_events.py
│   ├── consume_features.py
│   └── backfill_example.py
└── docs/
    ├── DESIGN.md
    ├── FEATURES.md                  # Feature catalog
    └── OPERATIONS.md
```

## 需求

### 功能需求

1. **事件摄取：**
   - 消费 Kafka Topic 中的事件（交易、点击）。
   - 处理每秒 10 万以上事件。
   - 解析并验证事件 Schema。
   - 妥善处理格式错误的事件。

2. **特征工程：**
   - 计算聚合值（时间窗口内的计数、求和、均值）。
   - 时间特征（hour_of_day、day_of_week）。
   - 比率特征（transaction_amount / avg_user_transaction）。
   - 类别编码（One-hot、Target Encoding）。

3. **特征存储：**
   - 在线存储（Redis）：服务读取延迟低于 5ms。
   - 离线存储（Postgres）：用于训练的历史特征。
   - 特征注册中心：元数据、版本、血缘。

4. **特征服务：**
   - REST API：`GET /features/{entity_id}?features=f1,f2,f3`。
   - 批量检索：单次请求检索多个实体。
   - 训练时保证时间点正确性（Point-in-time Correctness）。

5. **回填：**
   - 根据批量数据计算历史特征。
   - 填充离线存储，用于模型训练。
   - 验证流式与批量特征的一致性。

### 非功能需求

- **延迟：** P95 特征计算低于 100ms。
- **吞吐量：** 每秒 10 万事件。
- **可用性：** 99.9% 正常运行时间。
- **一致性：** 恰好一次语义。
- **新鲜度：** 事件发生后 1 秒内更新特征。

## 实现任务

### 任务 1：Kafka 搭建与事件生产者（6–7 小时）

搭建 Kafka 基础设施及事件生产者。

```yaml
# docker-compose.yaml

version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: features
      POSTGRES_USER: features
      POSTGRES_PASSWORD: features123
    ports:
      - "5432:5432"

  flink-jobmanager:
    image: flink:1.18
    ports:
      - "8081:8081"
    command: jobmanager
    environment:
      - JOB_MANAGER_RPC_ADDRESS=flink-jobmanager

  flink-taskmanager:
    image: flink:1.18
    depends_on:
      - flink-jobmanager
    command: taskmanager
    environment:
      - JOB_MANAGER_RPC_ADDRESS=flink-jobmanager
```

```python
# src/feature_pipeline/producers/transaction_producer.py

from kafka import KafkaProducer
from dataclasses import dataclass, asdict
from datetime import datetime
import json
import random
import time
from typing import Dict

@dataclass
class Transaction:
    """Transaction event schema"""
    transaction_id: str
    user_id: str
    merchant_id: str
    amount: float
    currency: str
    timestamp: str
    location: Dict[str, float]  # {"lat": 37.7, "lon": -122.4}
    device_type: str  # "mobile", "web", "pos"
    is_fraud: bool = False  # Ground truth label

class TransactionProducer:
    """Produce transaction events to Kafka"""

    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            # Enable idempotence for exactly-once semantics
            enable_idempotence=True,
            acks='all',
            retries=3
        )
        self.topic = "transactions"

    def generate_transaction(self, user_id: str = None) -> Transaction:
        """
        Generate realistic transaction event

        TODO: Implement realistic data generation
        - Normal transactions: $10-500, low fraud rate
        - Fraud patterns: Multiple small transactions, unusual locations
        """
        user_id = user_id or f"user_{random.randint(1, 10000)}"

        # TODO: Generate realistic amount distribution
        # Normal: log-normal distribution around $50
        # Fraud: Often multiple small transactions
        is_fraud = random.random() < 0.025  # 2.5% fraud rate
        if is_fraud:
            amount = random.uniform(5, 50)  # Smaller amounts
        else:
            amount = random.lognormvariate(3.5, 1.0)  # ~$50 mean

        return Transaction(
            transaction_id=f"txn_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
            user_id=user_id,
            merchant_id=f"merchant_{random.randint(1, 1000)}",
            amount=round(amount, 2),
            currency="USD",
            timestamp=datetime.utcnow().isoformat(),
            location={
                "lat": random.uniform(25, 50),
                "lon": random.uniform(-125, -65)
            },
            device_type=random.choice(["mobile", "web", "pos"]),
            is_fraud=is_fraud
        )

    def produce(self, transaction: Transaction):
        """
        Produce transaction to Kafka

        Use user_id as key for partitioning (all events for same user go to same partition)
        """
        # TODO: Send to Kafka
        future = self.producer.send(
            topic=self.topic,
            key=transaction.user_id,
            value=asdict(transaction)
        )

        # TODO: Handle delivery confirmation
        try:
            record_metadata = future.get(timeout=10)
            return record_metadata
        except Exception as e:
            print(f"Failed to produce transaction: {e}")
            raise

    def produce_stream(self, events_per_second: int = 100, duration_seconds: int = 60):
        """
        Produce continuous stream of transactions

        Args:
            events_per_second: Target throughput
            duration_seconds: How long to produce
        """
        interval = 1.0 / events_per_second
        start_time = time.time()

        produced = 0
        while (time.time() - start_time) < duration_seconds:
            transaction = self.generate_transaction()
            self.produce(transaction)
            produced += 1

            if produced % 1000 == 0:
                print(f"Produced {produced} transactions")

            time.sleep(interval)

        self.producer.flush()
        print(f"Produced {produced} transactions in {duration_seconds}s")

    def close(self):
        """Close producer"""
        self.producer.close()
```

**验收标准：**
- [ ] Kafka 集群正常运行。
- [ ] 生成符合 Schema 的事件。
- [ ] 可配置吞吐量（事件/秒）。
- [ ] 实现生产者恰好一次语义。
- [ ] 数据分布符合实际场景。

---

### 任务 2：Flink 特征处理器（9–11 小时）

使用 Flink 实现流式特征计算。

```python
# flink_jobs/fraud_features.py

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import KafkaSource, KafkaOffsetResetStrategy, KafkaSink
from pyflink.common import SimpleStringSchema, Types
from pyflink.datastream.window import TumblingEventTimeWindows, SlidingEventTimeWindows
from pyflink.common.watermark_strategy import WatermarkStrategy
from pyflink.common.time import Time
import json
from datetime import datetime, timedelta

class FraudFeatureProcessor:
    """
    Flink job to compute fraud detection features

    Features:
    1. transaction_count_1h: Count of transactions in last 1 hour
    2. transaction_sum_1h: Sum of transaction amounts in last 1 hour
    3. transaction_avg_1h: Average transaction amount in last 1 hour
    4. unique_merchants_1h: Count of unique merchants in last 1 hour
    5. transaction_velocity: Transactions per minute in last 10 minutes
    6. amount_deviation: (current_amount - avg_amount) / std_amount
    """

    def __init__(self):
        self.env = StreamExecutionEnvironment.get_execution_environment()
        self.env.set_parallelism(4)

        # Enable checkpointing for fault tolerance
        self.env.enable_checkpointing(60000)  # Checkpoint every 60s

    def run(self):
        """Execute Flink streaming job"""

        # TODO: Configure Kafka source
        kafka_source = KafkaSource.builder() \
            .set_bootstrap_servers("localhost:9092") \
            .set_topics("transactions") \
            .set_group_id("fraud-feature-processor") \
            .set_starting_offsets(KafkaOffsetResetStrategy.LATEST) \
            .set_value_only_deserializer(SimpleStringSchema()) \
            .build()

        # TODO: Create watermark strategy for event time processing
        watermark_strategy = WatermarkStrategy \
            .for_bounded_out_of_orderness(timedelta(seconds=10)) \
            .with_timestamp_assigner(lambda event: self._extract_timestamp(event))

        # TODO: Create data stream
        stream = self.env.from_source(
            kafka_source,
            watermark_strategy,
            "Kafka Source"
        )

        # TODO: Parse JSON events
        parsed_stream = stream.map(
            lambda x: json.loads(x),
            output_type=Types.MAP(Types.STRING(), Types.STRING())
        )

        # TODO: Key by user_id
        keyed_stream = parsed_stream.key_by(lambda event: event['user_id'])

        # TODO: Compute windowed aggregations
        # 1-hour tumbling window for transaction counts/sums
        hourly_features = keyed_stream \
            .window(TumblingEventTimeWindows.of(Time.hours(1))) \
            .process(HourlyAggregationFunction())

        # 10-minute sliding window for velocity
        velocity_features = keyed_stream \
            .window(SlidingEventTimeWindows.of(Time.minutes(10), Time.minutes(1))) \
            .process(VelocityFunction())

        # TODO: Compute stateful features (running statistics)
        deviation_features = keyed_stream.process(DeviationFunction())

        # TODO: Merge feature streams
        all_features = hourly_features.union(velocity_features).union(deviation_features)

        # TODO: Write to online store (Redis) via Kafka
        kafka_sink = KafkaSink.builder() \
            .set_bootstrap_servers("localhost:9092") \
            .set_record_serializer(...) \
            .build()

        all_features.sink_to(kafka_sink)

        # TODO: Execute job
        self.env.execute("Fraud Feature Processor")

    def _extract_timestamp(self, event_json: str) -> int:
        """Extract timestamp from event for watermarking"""
        event = json.loads(event_json)
        dt = datetime.fromisoformat(event['timestamp'])
        return int(dt.timestamp() * 1000)  # milliseconds

class HourlyAggregationFunction:
    """
    Window function to compute hourly aggregations

    Output features:
    - transaction_count_1h
    - transaction_sum_1h
    - transaction_avg_1h
    - unique_merchants_1h
    """

    def process(self, key, context, elements):
        """
        Process window of transactions

        Args:
            key: user_id
            context: Window context
            elements: Iterable of transactions in window
        """
        # TODO: Aggregate transactions
        transactions = list(elements)
        count = len(transactions)
        amounts = [float(t['amount']) for t in transactions]
        merchants = set(t['merchant_id'] for t in transactions)

        # TODO: Compute features
        features = {
            "user_id": key,
            "timestamp": context.window().max_timestamp(),
            "transaction_count_1h": count,
            "transaction_sum_1h": sum(amounts),
            "transaction_avg_1h": sum(amounts) / count if count > 0 else 0,
            "unique_merchants_1h": len(merchants)
        }

        yield json.dumps(features)

class VelocityFunction:
    """Compute transaction velocity (transactions per minute)"""

    def process(self, key, context, elements):
        transactions = list(elements)
        window_duration_minutes = 10

        velocity = len(transactions) / window_duration_minutes

        features = {
            "user_id": key,
            "timestamp": context.window().max_timestamp(),
            "transaction_velocity": velocity
        }

        yield json.dumps(features)

class DeviationFunction:
    """
    Compute amount deviation using running statistics

    Maintains running mean and std for each user
    """

    def __init__(self):
        # TODO: Initialize state
        # Use Flink's ValueState to maintain per-user statistics
        pass

    def process_element(self, transaction, ctx):
        """
        Process single transaction

        Update running statistics and compute deviation
        """
        # TODO: Get current statistics from state
        # TODO: Update with new transaction amount
        # TODO: Compute deviation: (amount - mean) / std
        # TODO: Emit feature
        raise NotImplementedError
```

**验收标准：**
- [ ] Flink 作业处理 Kafka 事件。
- [ ] 计算时间窗口聚合值。
- [ ] 使用 Watermark 处理迟到数据。
- [ ] 维护运行统计量的状态。
- [ ] 将特征发送到输出 Topic。

---

### 任务 3：特征存储（8–10 小时）

实现在线和离线特征存储。

```python
# src/feature_pipeline/stores/online_store.py

import redis
from typing import List, Dict, Optional
import json
from datetime import datetime, timedelta

class OnlineFeatureStore:
    """
    Online feature store using Redis

    Design:
    - Key: feature:{entity_type}:{entity_id}:{feature_name}
    - Value: JSON {"value": 123.45, "timestamp": "2024-01-25T10:00:00Z"}
    - TTL: 7 days (features auto-expire)
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.client = redis.from_url(redis_url)
        self.default_ttl = timedelta(days=7)

    def write_feature(
        self,
        entity_type: str,
        entity_id: str,
        feature_name: str,
        value: float,
        timestamp: Optional[datetime] = None
    ):
        """
        Write feature to online store

        Args:
            entity_type: "user", "transaction", etc.
            entity_id: Specific entity ID
            feature_name: Name of feature
            value: Feature value
            timestamp: Event timestamp
        """
        key = self._build_key(entity_type, entity_id, feature_name)

        feature_data = {
            "value": value,
            "timestamp": (timestamp or datetime.utcnow()).isoformat()
        }

        # TODO: Write to Redis with TTL
        self.client.setex(
            key,
            self.default_ttl,
            json.dumps(feature_data)
        )

    def write_features_batch(
        self,
        entity_type: str,
        entity_id: str,
        features: Dict[str, float],
        timestamp: Optional[datetime] = None
    ):
        """
        Write multiple features for entity in single operation

        Use Redis pipeline for atomic batch write
        """
        pipeline = self.client.pipeline()

        for feature_name, value in features.items():
            key = self._build_key(entity_type, entity_id, feature_name)
            feature_data = {
                "value": value,
                "timestamp": (timestamp or datetime.utcnow()).isoformat()
            }
            pipeline.setex(key, self.default_ttl, json.dumps(feature_data))

        # TODO: Execute pipeline
        pipeline.execute()

    def get_features(
        self,
        entity_type: str,
        entity_id: str,
        feature_names: List[str]
    ) -> Dict[str, Optional[float]]:
        """
        Get multiple features for entity

        Returns:
            {"feature1": 123.45, "feature2": 67.89, "feature3": None}
        """
        # TODO: Use Redis MGET for batch retrieval
        keys = [self._build_key(entity_type, entity_id, f) for f in feature_names]
        values = self.client.mget(keys)

        # TODO: Parse results
        result = {}
        for feature_name, value_json in zip(feature_names, values):
            if value_json:
                data = json.loads(value_json)
                result[feature_name] = data['value']
            else:
                result[feature_name] = None

        return result

    def _build_key(self, entity_type: str, entity_id: str, feature_name: str) -> str:
        """Build Redis key"""
        return f"feature:{entity_type}:{entity_id}:{feature_name}"
```

```python
# src/feature_pipeline/stores/offline_store.py

import psycopg2
from psycopg2.extras import execute_batch
from typing import List, Dict, Optional
from datetime import datetime
import pandas as pd

class OfflineFeatureStore:
    """
    Offline feature store using PostgreSQL

    Schema:
    - features table: entity_type, entity_id, feature_name, value, event_timestamp, ingestion_timestamp
    - Optimized for point-in-time queries for training

    Index on (entity_type, entity_id, feature_name, event_timestamp)
    """

    def __init__(self, connection_string: str = "postgresql://features:features123@localhost/features"):
        self.conn = psycopg2.connect(connection_string)
        self._initialize_schema()

    def _initialize_schema(self):
        """Create tables and indexes"""
        with self.conn.cursor() as cur:
            # TODO: Create features table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS features (
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id VARCHAR(100) NOT NULL,
                    feature_name VARCHAR(100) NOT NULL,
                    value DOUBLE PRECISION,
                    event_timestamp TIMESTAMP NOT NULL,
                    ingestion_timestamp TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (entity_type, entity_id, feature_name, event_timestamp)
                )
            """)

            # TODO: Create index for point-in-time queries
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_features_pit
                ON features (entity_type, entity_id, feature_name, event_timestamp DESC)
            """)

            self.conn.commit()

    def write_features(
        self,
        entity_type: str,
        entity_id: str,
        features: Dict[str, float],
        event_timestamp: datetime
    ):
        """
        Write features to offline store

        Args:
            features: {"feature1": 123.45, "feature2": 67.89}
        """
        with self.conn.cursor() as cur:
            rows = [
                (entity_type, entity_id, feature_name, value, event_timestamp)
                for feature_name, value in features.items()
            ]

            # TODO: Batch insert
            execute_batch(
                cur,
                """
                INSERT INTO features (entity_type, entity_id, feature_name, value, event_timestamp)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (entity_type, entity_id, feature_name, event_timestamp)
                DO UPDATE SET value = EXCLUDED.value
                """,
                rows
            )

            self.conn.commit()

    def get_features_point_in_time(
        self,
        entity_type: str,
        entity_ids: List[str],
        feature_names: List[str],
        event_timestamp: datetime
    ) -> pd.DataFrame:
        """
        Get features as of specific timestamp (point-in-time correctness)

        For each entity and feature, returns the latest value BEFORE event_timestamp.
        Critical for training to avoid label leakage.

        Returns:
            DataFrame with columns: entity_id, feature_name, value, event_timestamp
        """
        with self.conn.cursor() as cur:
            # TODO: Query latest features before timestamp
            query = """
                SELECT DISTINCT ON (entity_id, feature_name)
                    entity_id,
                    feature_name,
                    value,
                    event_timestamp
                FROM features
                WHERE entity_type = %s
                  AND entity_id = ANY(%s)
                  AND feature_name = ANY(%s)
                  AND event_timestamp <= %s
                ORDER BY entity_id, feature_name, event_timestamp DESC
            """

            cur.execute(query, (entity_type, entity_ids, feature_names, event_timestamp))

            # TODO: Convert to DataFrame
            rows = cur.fetchall()
            return pd.DataFrame(
                rows,
                columns=['entity_id', 'feature_name', 'value', 'event_timestamp']
            )

    def get_feature_range(
        self,
        entity_type: str,
        entity_id: str,
        feature_name: str,
        start_time: datetime,
        end_time: datetime
    ) -> pd.DataFrame:
        """
        Get time series of feature values

        Useful for debugging and analysis
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT event_timestamp, value
                FROM features
                WHERE entity_type = %s
                  AND entity_id = %s
                  AND feature_name = %s
                  AND event_timestamp BETWEEN %s AND %s
                ORDER BY event_timestamp
            """, (entity_type, entity_id, feature_name, start_time, end_time))

            rows = cur.fetchall()
            return pd.DataFrame(rows, columns=['event_timestamp', 'value'])
```

**验收标准：**
- [ ] 在线存储读取延迟低于 5ms。
- [ ] 离线存储支持时间点查询。
- [ ] 批量写入。
- [ ] 采用适当索引优化性能。
- [ ] 在线特征具备 TTL。

---

### 任务 4：特征服务 API（5–6 小时）

构建特征服务 REST API。

```python
# src/feature_pipeline/serving/feature_server.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from ..stores.online_store import OnlineFeatureStore
from ..stores.offline_store import OfflineFeatureStore

app = FastAPI(title="Feature Serving API")

# Initialize stores
online_store = OnlineFeatureStore()
offline_store = OfflineFeatureStore()

class FeatureRequest(BaseModel):
    """Request model for feature retrieval"""
    entity_type: str
    entity_id: str
    feature_names: List[str]

class BatchFeatureRequest(BaseModel):
    """Request model for batch feature retrieval"""
    entity_type: str
    entity_ids: List[str]
    feature_names: List[str]

class FeatureResponse(BaseModel):
    """Response model"""
    entity_id: str
    features: Dict[str, Optional[float]]
    timestamp: str

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/features/online", response_model=FeatureResponse)
def get_online_features(request: FeatureRequest):
    """
    Get features from online store (for inference)

    Example:
    POST /features/online
    {
        "entity_type": "user",
        "entity_id": "user_12345",
        "feature_names": ["transaction_count_1h", "transaction_avg_1h"]
    }

    Response:
    {
        "entity_id": "user_12345",
        "features": {
            "transaction_count_1h": 5.0,
            "transaction_avg_1h": 127.50
        },
        "timestamp": "2024-01-25T10:00:00Z"
    }
    """
    try:
        # TODO: Fetch from online store
        features = online_store.get_features(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            feature_names=request.feature_names
        )

        return FeatureResponse(
            entity_id=request.entity_id,
            features=features,
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/features/batch", response_model=List[FeatureResponse])
def get_batch_features(request: BatchFeatureRequest):
    """
    Get features for multiple entities

    Used for batch inference
    """
    try:
        results = []
        for entity_id in request.entity_ids:
            features = online_store.get_features(
                entity_type=request.entity_type,
                entity_id=entity_id,
                feature_names=request.feature_names
            )
            results.append(FeatureResponse(
                entity_id=entity_id,
                features=features,
                timestamp=datetime.utcnow().isoformat()
            ))

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/features/offline/{entity_type}/{entity_id}")
def get_offline_features(
    entity_type: str,
    entity_id: str,
    feature_names: str,  # Comma-separated
    event_timestamp: str  # ISO format
):
    """
    Get features from offline store (for training)

    Point-in-time query to avoid label leakage
    """
    try:
        features_list = feature_names.split(',')
        timestamp = datetime.fromisoformat(event_timestamp)

        df = offline_store.get_features_point_in_time(
            entity_type=entity_type,
            entity_ids=[entity_id],
            feature_names=features_list,
            event_timestamp=timestamp
        )

        # TODO: Pivot DataFrame to feature dict
        features = {}
        for _, row in df.iterrows():
            features[row['feature_name']] = row['value']

        return {
            "entity_id": entity_id,
            "features": features,
            "event_timestamp": event_timestamp
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
def get_metrics():
    """
    Expose metrics for monitoring

    Returns:
    - Cache hit rate
    - Request latency
    - Feature freshness
    """
    # TODO: Implement metrics collection
    return {
        "requests_total": 1000,
        "cache_hit_rate": 0.95,
        "avg_latency_ms": 3.2
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**验收标准：**
- [ ] 在线特征 REST API。
- [ ] 批量特征检索。
- [ ] 离线时间点查询。
- [ ] 在线 P95 延迟低于 5ms。
- [ ] 指标端点。

---

### 任务 5：历史回填（5–6 小时）

实现历史特征回填。

```python
# src/feature_pipeline/backfill/historical_loader.py

from typing import List, Dict
from datetime import datetime, timedelta
import pandas as pd
from ..stores.offline_store import OfflineFeatureStore
from ..processors.aggregations import compute_hourly_features

class HistoricalBackfill:
    """
    Backfill historical features from batch data

    Use case: Train model on last 90 days of features
    """

    def __init__(self, offline_store: OfflineFeatureStore):
        self.offline_store = offline_store

    def backfill_from_dataframe(
        self,
        transactions_df: pd.DataFrame,
        start_date: datetime,
        end_date: datetime
    ):
        """
        Compute features from historical transaction data

        Args:
            transactions_df: Historical transactions with columns:
                - transaction_id, user_id, amount, timestamp, etc.
            start_date: Backfill start date
            end_date: Backfill end date
        """
        # TODO: Filter to date range
        df = transactions_df[
            (transactions_df['timestamp'] >= start_date) &
            (transactions_df['timestamp'] <= end_date)
        ].copy()

        # TODO: Compute features using same logic as streaming
        # Critical: Use SAME feature computation code to avoid train/serve skew

        # Group by user and compute aggregations
        for user_id in df['user_id'].unique():
            user_transactions = df[df['user_id'] == user_id].sort_values('timestamp')

            # TODO: Compute time-window features for each transaction
            for idx, row in user_transactions.iterrows():
                event_time = row['timestamp']

                # Get transactions in 1-hour window before this one
                window_start = event_time - timedelta(hours=1)
                window_txns = user_transactions[
                    (user_transactions['timestamp'] >= window_start) &
                    (user_transactions['timestamp'] < event_time)
                ]

                # Compute features
                features = compute_hourly_features(window_txns)

                # Write to offline store
                self.offline_store.write_features(
                    entity_type="user",
                    entity_id=user_id,
                    features=features,
                    event_timestamp=event_time
                )

        print(f"Backfilled features for {df['user_id'].nunique()} users")

    def validate_consistency(
        self,
        entity_type: str,
        entity_id: str,
        feature_name: str,
        timestamp: datetime
    ) -> Dict:
        """
        Validate feature consistency between streaming and batch

        Compare feature values computed by:
        1. Streaming pipeline (in offline store)
        2. Batch backfill

        Should be identical (or within tolerance for floating point)
        """
        # TODO: Get streaming value
        streaming_df = self.offline_store.get_feature_range(
            entity_type, entity_id, feature_name,
            timestamp - timedelta(minutes=1),
            timestamp + timedelta(minutes=1)
        )

        # TODO: Get batch value (would need separate backfill run)
        # TODO: Compare values
        # TODO: Return validation result

        return {
            "feature": feature_name,
            "streaming_value": 0.0,
            "batch_value": 0.0,
            "difference": 0.0,
            "consistent": True
        }
```

**验收标准：**
- [ ] 从历史数据回填。
- [ ] 使用与流式处理相同的特征逻辑。
- [ ] 验证流式与批量处理的一致性。
- [ ] 高效处理大型数据集。
- [ ] 写入离线存储。

---

### 任务 6：监控与指标（3–4 小时）

实现管道监控。

```python
# src/feature_pipeline/monitoring/metrics.py

from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps

# Define metrics
feature_compute_duration = Histogram(
    'feature_compute_duration_seconds',
    'Time to compute features',
    ['feature_name']
)

feature_freshness = Gauge(
    'feature_freshness_seconds',
    'Age of feature value',
    ['entity_type', 'feature_name']
)

events_processed = Counter(
    'events_processed_total',
    'Total events processed',
    ['source']
)

feature_store_latency = Histogram(
    'feature_store_latency_seconds',
    'Feature store operation latency',
    ['operation', 'store_type']
)

def track_duration(metric_name: str):
    """Decorator to track function duration"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start
            feature_compute_duration.labels(feature_name=metric_name).observe(duration)
            return result
        return wrapper
    return decorator

class PipelineMonitor:
    """Monitor pipeline health"""

    def __init__(self):
        self.alerts = []

    def check_feature_freshness(
        self,
        online_store,
        entity_type: str,
        entity_id: str,
        feature_name: str,
        max_age_seconds: int = 300
    ) -> bool:
        """
        Check if feature is fresh enough

        Alert if feature value is >5 minutes old
        """
        # TODO: Get feature with timestamp
        # TODO: Calculate age
        # TODO: Update gauge
        # TODO: Alert if stale
        pass

    def check_kafka_lag(self, consumer_group: str, topic: str) -> int:
        """
        Check Kafka consumer lag

        Alert if lag >100K messages
        """
        # TODO: Query Kafka for consumer lag
        # TODO: Alert if high lag
        pass
```

**验收标准：**
- [ ] 暴露 Prometheus 指标。
- [ ] 追踪计算时长。
- [ ] 监控特征新鲜度。
- [ ] 检查 Kafka 消费积压。
- [ ] 异常告警。

---

## 测试要求

```python
def test_feature_computation():
    """Test feature computation logic"""
    transactions = [
        {"amount": 100, "merchant_id": "m1"},
        {"amount": 200, "merchant_id": "m2"},
        {"amount": 150, "merchant_id": "m1"}
    ]

    features = compute_hourly_features(transactions)

    assert features['transaction_count_1h'] == 3
    assert features['transaction_sum_1h'] == 450
    assert features['transaction_avg_1h'] == 150
    assert features['unique_merchants_1h'] == 2

def test_point_in_time_correctness():
    """Test point-in-time feature retrieval"""
    # Ensure no label leakage
    # Features at time T should only use data before T
    pass
```

## 预期结果

| 指标 | 目标 | 实测 |
|---|---|---|
| **特征延迟（P95）** | 低于 100ms | ________ms |
| **吞吐量** | 每秒 10 万事件 | ________ |
| **在线存储延迟** | 低于 5ms | ________ms |
| **特征新鲜度** | 低于 1 秒 | ________s |

## 验证

提交：
1. 完整实现。
2. 处理事件的 Flink 作业。
3. 特征存储（在线 + 离线）。
4. 特征服务 API。
5. 回填管道。
6. 测试套件。
7. 文档。

## 资源

- [Apache Kafka](https://kafka.apache.org/documentation/)
- [Apache Flink](https://flink.apache.org/)
- [Feast 特征存储](https://feast.dev/)
- [面向 ML 的特征存储](https://www.featurestore.org/)

---

**预计完成时长：** 36–44 小时。

**实践技能：**
- 流式数据管道。
- Apache Kafka、Flink。
- 特征工程。
- 在线/离线存储。
- 恰好一次语义。
- 时间点正确性。

> 译注：Kafka 事务不能单独保证包含 Redis、PostgreSQL 在内的全链路恰好一次语义，需要结合 Checkpoint、幂等写入或事务型 Sink。时间点正确性要求避免未来数据泄漏。案例及延迟、吞吐量均为原文目标，未实测；代码块及 TODO 保留。
