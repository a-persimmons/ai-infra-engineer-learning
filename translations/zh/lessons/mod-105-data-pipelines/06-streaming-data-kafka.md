# 第 06 课：使用 Apache Kafka 处理流数据

## 概览

Apache Kafka 是分布式事件流平台，是实时 ML 基础设施的常用组件。它支持持续的数据摄取、实时特征计算及在线模型服务。本课介绍 Kafka 基础以及与 ML 管道的集成。

**时长：** 6–8 小时
**难度：** 中级
**前置条件：** Python、分布式系统基础、理解消息队列。

## 学习目标

完成本课后，你将能够：
- 理解 Kafka 架构和核心概念。
- 使用 Python 生产及消费消息。
- 为 ML 数据流设计 Topic。
- 将 Kafka 集成至 ML 训练与推理管道。
- 实现实时特征工程。
- 监控与排查 Kafka 部署。

---

## 1. Apache Kafka 简介

### 1.1 什么是 Kafka？

Apache Kafka 是一个分布式流平台，可以：
- 发布与订阅记录流（类似消息队列）。
- 持久、可靠地存储记录流。
- 在记录产生时对流数据进行处理。

**关键特点：**
- **高吞吐量：** 每秒可处理数百万条消息（原文举例）。
- **可扩展性：** 集群内水平扩展。
- **持久性：** 具有副本机制的持久化存储。
- **低延迟：** 原文举例可实现亚毫秒级消息交付。
- **容错：** 自动故障转移与恢复。

### 1.2 ML 基础设施中的 Kafka

```
┌─────────────────────────────────────────────────────────────┐
│                     ML Infrastructure                        │
│                                                              │
│  Data Sources          Kafka Cluster         ML Systems     │
│  ┌───────────┐      ┌──────────────┐      ┌─────────────┐  │
│  │Web Logs   │─────▶│              │─────▶│Feature      │  │
│  │API Events │─────▶│   Topics     │─────▶│Engineering  │  │
│  │IoT Data   │─────▶│              │─────▶│             │  │
│  │Sensors    │─────▶│ ┌──────────┐ │      └─────────────┘  │
│  └───────────┘      │ │Partition1│ │              │         │
│                     │ │Partition2│ │              ▼         │
│  ┌───────────┐      │ │Partition3│ │      ┌─────────────┐  │
│  │Model      │◀─────│ └──────────┘ │◀─────│Model        │  │
│  │Predictions│      │              │      │Training     │  │
│  └───────────┘      └──────────────┘      └─────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**使用场景：**
- 为在线学习实时摄取特征。
- 将模型预测结果以流式方式发送至下游系统。
- 通过事件触发模型重新训练。
- A/B 测试事件流。
- 模型监控与漂移检测。

### 1.3 核心概念

**Topic（主题）：** 消息类别，例如 `user-events`、`model-predictions`。

**Partition（分区）：** Topic 中用于实现扩展的并行单元。
```
Topic: user-events
├── Partition 0: [msg1, msg4, msg7, ...]
├── Partition 1: [msg2, msg5, msg8, ...]
└── Partition 2: [msg3, msg6, msg9, ...]
```

**Producer（生产者）：** 向 Topic 发布消息的应用。

**Consumer（消费者）：** 订阅 Topic 并处理消息的应用。

**Consumer Group（消费者组）：** 在多个消费者之间分配负载。

**Broker：** 存储数据并为客户端提供服务的 Kafka 服务器。

**ZooKeeper/KRaft：** 集群协调与元数据管理机制。

---

## 2. 配置 Kafka

### 2.1 本地开发环境配置

```bash
# Using Docker Compose
cat > docker-compose.yml <<EOF
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
EOF

# Start Kafka cluster
docker-compose up -d

# Verify setup
docker-compose ps
```

### 2.2 安装 Python 客户端

```bash
# Install kafka-python
pip install kafka-python==2.0.2

# Install confluent-kafka (higher performance)
pip install confluent-kafka==2.3.0

# For Avro serialization
pip install confluent-kafka[avro]==2.3.0
```

---

## 3. 生产消息

### 3.1 基础 Producer

```python
from kafka import KafkaProducer
import json
from datetime import datetime

# Create producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8') if k else None,
    acks='all',  # Wait for all replicas
    retries=3,
    max_in_flight_requests_per_connection=1
)

# Send a message
user_event = {
    'user_id': 'user_123',
    'event_type': 'click',
    'product_id': 'prod_456',
    'timestamp': datetime.utcnow().isoformat()
}

future = producer.send(
    topic='user-events',
    key='user_123',
    value=user_event
)

# Wait for confirmation
try:
    record_metadata = future.get(timeout=10)
    print(f"Message sent to {record_metadata.topic}")
    print(f"Partition: {record_metadata.partition}")
    print(f"Offset: {record_metadata.offset}")
except Exception as e:
    print(f"Error sending message: {e}")
finally:
    producer.flush()
    producer.close()
```

### 3.2 面向生产环境的 Producer

```python
from kafka import KafkaProducer
from kafka.errors import KafkaError
import logging
from typing import Dict, Any, Optional
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLEventProducer:
    """Production-grade Kafka producer for ML events"""

    def __init__(self, bootstrap_servers: list, topic: str):
        self.topic = topic
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',
            retries=5,
            max_in_flight_requests_per_connection=5,
            compression_type='gzip',
            linger_ms=10,  # Batch messages for 10ms
            batch_size=32768,  # 32KB batches
            buffer_memory=67108864,  # 64MB buffer
            request_timeout_ms=30000,
            api_version=(2, 8, 0)
        )

        # Metrics
        self.messages_sent = 0
        self.messages_failed = 0

    def send_event(
        self,
        key: str,
        value: Dict[Any, Any],
        headers: Optional[Dict[str, str]] = None
    ) -> bool:
        """Send event with error handling and metrics"""
        try:
            # Add metadata
            value['_timestamp'] = time.time()
            value['_producer_id'] = 'ml-producer-1'

            # Prepare headers
            kafka_headers = []
            if headers:
                kafka_headers = [
                    (k, v.encode('utf-8'))
                    for k, v in headers.items()
                ]

            # Send async
            future = self.producer.send(
                topic=self.topic,
                key=key,
                value=value,
                headers=kafka_headers
            )

            # Register callback
            future.add_callback(self._on_success)
            future.add_errback(self._on_error)

            self.messages_sent += 1
            return True

        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            self.messages_failed += 1
            return False

    def _on_success(self, metadata):
        """Success callback"""
        logger.debug(
            f"Message delivered to {metadata.topic}[{metadata.partition}] "
            f"at offset {metadata.offset}"
        )

    def _on_error(self, exc):
        """Error callback"""
        logger.error(f"Message delivery failed: {exc}")
        self.messages_failed += 1

    def flush(self):
        """Flush pending messages"""
        self.producer.flush()

    def close(self):
        """Close producer gracefully"""
        logger.info(
            f"Closing producer. Sent: {self.messages_sent}, "
            f"Failed: {self.messages_failed}"
        )
        self.producer.flush()
        self.producer.close()

    def get_metrics(self) -> Dict[str, int]:
        """Get producer metrics"""
        return {
            'messages_sent': self.messages_sent,
            'messages_failed': self.messages_failed,
            'buffer_available_bytes':
                self.producer._accumulator.available()
        }

# Usage
producer = MLEventProducer(
    bootstrap_servers=['localhost:9092'],
    topic='ml-training-events'
)

# Send training data
for i in range(1000):
    event = {
        'user_id': f'user_{i}',
        'feature_vector': [0.1, 0.2, 0.3],
        'label': 1
    }
    producer.send_event(
        key=f'user_{i}',
        value=event,
        headers={'source': 'training-pipeline'}
    )

producer.flush()
print(producer.get_metrics())
producer.close()
```

### 3.3 分区策略

```python
from kafka.partitioner import Murmur2Partitioner, RoundRobinPartitioner

# Custom partitioner for ML workloads
class ModelPartitioner:
    """Partition by model_id for co-location"""

    def __call__(self, key, all_partitions, available_partitions):
        if key is None:
            return available_partitions[0]

        # Hash model_id to partition
        model_id = key.split('_')[0]
        idx = hash(model_id) % len(available_partitions)
        return available_partitions[idx]

# Use custom partitioner
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    partitioner=ModelPartitioner()
)

# Messages with same model_id go to same partition
producer.send('model-predictions', key='model1_user123', value=b'...')
producer.send('model-predictions', key='model1_user456', value=b'...')
```

---

## 4. 消费消息

### 4.1 基础 Consumer

```python
from kafka import KafkaConsumer
import json

# Create consumer
consumer = KafkaConsumer(
    'user-events',
    bootstrap_servers=['localhost:9092'],
    auto_offset_reset='earliest',  # Start from beginning
    enable_auto_commit=True,
    group_id='ml-feature-processor',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

# Consume messages
for message in consumer:
    print(f"Topic: {message.topic}")
    print(f"Partition: {message.partition}")
    print(f"Offset: {message.offset}")
    print(f"Key: {message.key}")
    print(f"Value: {message.value}")
    print(f"Timestamp: {message.timestamp}")
    print("---")
```

### 4.2 面向生产环境的 Consumer

```python
from kafka import KafkaConsumer, TopicPartition
from kafka.errors import KafkaError
import logging
import signal
import sys

logger = logging.getLogger(__name__)

class MLEventConsumer:
    """Production-grade Kafka consumer for ML events"""

    def __init__(
        self,
        bootstrap_servers: list,
        topics: list,
        group_id: str,
        auto_commit: bool = False
    ):
        self.topics = topics
        self.running = True

        # Handle shutdown gracefully
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

        self.consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            auto_offset_reset='earliest',
            enable_auto_commit=auto_commit,
            max_poll_records=500,
            max_poll_interval_ms=300000,  # 5 minutes
            session_timeout_ms=10000,
            heartbeat_interval_ms=3000,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            key_deserializer=lambda k: k.decode('utf-8') if k else None
        )

        # Metrics
        self.messages_processed = 0
        self.messages_failed = 0

    def _shutdown(self, signum, frame):
        """Handle graceful shutdown"""
        logger.info("Shutting down consumer...")
        self.running = False

    def process_message(self, message):
        """Process individual message (override in subclass)"""
        raise NotImplementedError("Subclass must implement process_message")

    def run(self):
        """Main consumer loop"""
        logger.info(f"Starting consumer for topics: {self.topics}")

        try:
            while self.running:
                # Poll for messages
                records = self.consumer.poll(timeout_ms=1000)

                for topic_partition, messages in records.items():
                    for message in messages:
                        try:
                            # Process message
                            self.process_message(message)
                            self.messages_processed += 1

                            # Manual commit after successful processing
                            self.consumer.commit()

                        except Exception as e:
                            logger.error(
                                f"Error processing message at "
                                f"offset {message.offset}: {e}"
                            )
                            self.messages_failed += 1

                            # Optionally: send to dead letter queue
                            # self.send_to_dlq(message, e)

        finally:
            logger.info(
                f"Consumer stopped. Processed: {self.messages_processed}, "
                f"Failed: {self.messages_failed}"
            )
            self.consumer.close()

    def seek_to_timestamp(self, timestamp_ms: int):
        """Seek to specific timestamp across all partitions"""
        partitions = self.consumer.assignment()
        timestamp_dict = {p: timestamp_ms for p in partitions}
        offset_dict = self.consumer.offsets_for_times(timestamp_dict)

        for partition, offset_ts in offset_dict.items():
            if offset_ts:
                self.consumer.seek(partition, offset_ts.offset)

# Implement specific consumer
class FeatureEngineeringConsumer(MLEventConsumer):
    """Consumer that computes real-time features"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.feature_cache = {}

    def process_message(self, message):
        """Compute features from event"""
        event = message.value
        user_id = event['user_id']

        # Update rolling features
        if user_id not in self.feature_cache:
            self.feature_cache[user_id] = {
                'event_count': 0,
                'total_spend': 0.0,
                'last_event_time': 0
            }

        cache = self.feature_cache[user_id]
        cache['event_count'] += 1
        cache['total_spend'] += event.get('amount', 0.0)
        cache['last_event_time'] = event['timestamp']

        # Compute derived features
        features = {
            'user_id': user_id,
            'event_count': cache['event_count'],
            'avg_spend': cache['total_spend'] / cache['event_count'],
            'recency': time.time() - cache['last_event_time']
        }

        logger.info(f"Computed features for {user_id}: {features}")

# Usage
consumer = FeatureEngineeringConsumer(
    bootstrap_servers=['localhost:9092'],
    topics=['user-events'],
    group_id='feature-processor-group'
)

consumer.run()
```

### 4.3 消费者组管理

```python
# Multiple consumers in same group for load balancing
import multiprocessing

def start_consumer(consumer_id):
    """Start individual consumer instance"""
    consumer = FeatureEngineeringConsumer(
        bootstrap_servers=['localhost:9092'],
        topics=['user-events'],
        group_id='feature-processor-group'  # Same group
    )
    consumer.run()

# Start consumer pool
if __name__ == '__main__':
    num_consumers = 3
    processes = []

    for i in range(num_consumers):
        p = multiprocessing.Process(target=start_consumer, args=(i,))
        p.start()
        processes.append(p)

    for p in processes:
        p.join()
```

---

## 5. 实时 ML 管道

### 5.1 实时特征工程

```python
from kafka import KafkaConsumer, KafkaProducer
import json
from collections import defaultdict, deque
from datetime import datetime, timedelta

class RealtimeFeatureEngineer:
    """Real-time feature computation from event streams"""

    def __init__(self, input_topic: str, output_topic: str):
        self.consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=['localhost:9092'],
            group_id='feature-engineer',
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )

        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

        # Windowed state (in-memory)
        self.user_windows = defaultdict(lambda: deque(maxlen=100))
        self.user_aggregates = defaultdict(lambda: {
            'count_1h': 0,
            'sum_1h': 0.0,
            'count_24h': 0,
            'sum_24h': 0.0
        })

    def compute_features(self, event: dict) -> dict:
        """Compute real-time features from event"""
        user_id = event['user_id']
        timestamp = datetime.fromisoformat(event['timestamp'])
        amount = event.get('amount', 0.0)

        # Add to window
        self.user_windows[user_id].append({
            'timestamp': timestamp,
            'amount': amount
        })

        # Compute windowed aggregations
        now = datetime.utcnow()
        window_1h = now - timedelta(hours=1)
        window_24h = now - timedelta(hours=24)

        count_1h = sum_1h = count_24h = sum_24h = 0

        for item in self.user_windows[user_id]:
            if item['timestamp'] >= window_1h:
                count_1h += 1
                sum_1h += item['amount']
            if item['timestamp'] >= window_24h:
                count_24h += 1
                sum_24h += item['amount']

        # Compute features
        features = {
            'user_id': user_id,
            'timestamp': now.isoformat(),
            'event_count_1h': count_1h,
            'total_amount_1h': sum_1h,
            'avg_amount_1h': sum_1h / max(count_1h, 1),
            'event_count_24h': count_24h,
            'total_amount_24h': sum_24h,
            'avg_amount_24h': sum_24h / max(count_24h, 1),
            'velocity': count_1h / max(count_24h, 1)
        }

        return features

    def run(self):
        """Process events and emit features"""
        for message in self.consumer:
            try:
                event = message.value
                features = self.compute_features(event)

                # Emit features to output topic
                self.producer.send(
                    'realtime-features',
                    key=features['user_id'].encode('utf-8'),
                    value=features
                )

            except Exception as e:
                logger.error(f"Error processing event: {e}")

# Run feature engineer
engineer = RealtimeFeatureEngineer(
    input_topic='user-events',
    output_topic='realtime-features'
)
engineer.run()
```

### 5.2 在线模型服务

```python
from kafka import KafkaConsumer, KafkaProducer
import joblib
import numpy as np

class OnlineModelServer:
    """Serve ML model predictions from Kafka streams"""

    def __init__(self, model_path: str, input_topic: str, output_topic: str):
        # Load model
        self.model = joblib.load(model_path)

        self.consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=['localhost:9092'],
            group_id='model-server',
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )

        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

        self.prediction_count = 0

    def extract_features(self, event: dict) -> np.ndarray:
        """Extract feature vector from event"""
        features = [
            event['event_count_1h'],
            event['avg_amount_1h'],
            event['event_count_24h'],
            event['avg_amount_24h'],
            event['velocity']
        ]
        return np.array(features).reshape(1, -1)

    def predict(self, features: np.ndarray) -> dict:
        """Generate prediction"""
        prediction = self.model.predict(features)[0]
        probability = self.model.predict_proba(features)[0]

        return {
            'prediction': int(prediction),
            'probability': float(probability[1]),
            'model_version': '1.0.0'
        }

    def run(self):
        """Process features and emit predictions"""
        logger.info("Starting online model server...")

        for message in self.consumer:
            try:
                event = message.value

                # Extract features
                features = self.extract_features(event)

                # Predict
                prediction = self.predict(features)

                # Emit prediction
                result = {
                    'user_id': event['user_id'],
                    'timestamp': datetime.utcnow().isoformat(),
                    **prediction,
                    'latency_ms': 10  # Track inference latency
                }

                self.producer.send(
                    'model-predictions',
                    key=event['user_id'].encode('utf-8'),
                    value=result
                )

                self.prediction_count += 1

                if self.prediction_count % 1000 == 0:
                    logger.info(f"Processed {self.prediction_count} predictions")

            except Exception as e:
                logger.error(f"Prediction error: {e}")

# Run model server
server = OnlineModelServer(
    model_path='/models/fraud_detector.pkl',
    input_topic='realtime-features',
    output_topic='model-predictions'
)
server.run()
```

---

## 6. 使用 Kafka Streams 进行流处理

### 6.1 Kafka Streams 概念

Kafka Streams 是用于构建流处理应用的 Java 库，支持：
- 有状态及无状态操作。
- 窗口与聚合。
- 流之间的 Join。
- Exactly-once（恰好一次）语义。

### 6.2 Faust——Python 替代方案

```python
import faust
from datetime import timedelta

# Define data models
class UserEvent(faust.Record, serializer='json'):
    user_id: str
    event_type: str
    amount: float
    timestamp: str

class UserFeatures(faust.Record, serializer='json'):
    user_id: str
    event_count: int
    total_amount: float
    avg_amount: float

# Create Faust app
app = faust.App(
    'feature-processor',
    broker='kafka://localhost:9092',
    value_serializer='json'
)

# Define topics
user_events_topic = app.topic('user-events', value_type=UserEvent)
user_features_topic = app.topic('user-features', value_type=UserFeatures)

# Create table for aggregations
user_stats = app.Table('user_stats', default=lambda: {'count': 0, 'sum': 0.0})

# Stream processor
@app.agent(user_events_topic)
async def process_events(events):
    """Process event stream and compute features"""
    async for event in events:
        # Update aggregates
        stats = user_stats[event.user_id]
        stats['count'] += 1
        stats['sum'] += event.amount
        user_stats[event.user_id] = stats

        # Emit features
        features = UserFeatures(
            user_id=event.user_id,
            event_count=stats['count'],
            total_amount=stats['sum'],
            avg_amount=stats['sum'] / stats['count']
        )

        await user_features_topic.send(key=event.user_id, value=features)

# Windowed aggregations
@app.agent(user_events_topic)
async def windowed_features(events):
    """Compute features over time windows"""
    async for window in events.tumbling(timedelta(minutes=5)):
        async for event in window:
            # Process windowed events
            pass

if __name__ == '__main__':
    app.main()
```

---

## 7. 监控与运维

### 7.1 消费者滞后量（Consumer Lag）监控

```python
from kafka import KafkaAdminClient, KafkaConsumer

def monitor_consumer_lag(group_id: str):
    """Monitor consumer group lag"""
    admin = KafkaAdminClient(bootstrap_servers=['localhost:9092'])
    consumer = KafkaConsumer(bootstrap_servers=['localhost:9092'])

    # Get group offsets
    group_offsets = admin.list_consumer_group_offsets(group_id)

    for topic_partition, offset_meta in group_offsets.items():
        # Get latest offset
        consumer.assign([topic_partition])
        consumer.seek_to_end(topic_partition)
        latest_offset = consumer.position(topic_partition)

        # Calculate lag
        current_offset = offset_meta.offset
        lag = latest_offset - current_offset

        print(f"{topic_partition.topic}[{topic_partition.partition}]")
        print(f"  Current: {current_offset}")
        print(f"  Latest: {latest_offset}")
        print(f"  Lag: {lag}")

monitor_consumer_lag('feature-processor-group')
```

### 7.2 性能指标

```python
import time
from prometheus_client import Counter, Histogram, start_http_server

# Define metrics
messages_processed = Counter(
    'kafka_messages_processed_total',
    'Total messages processed',
    ['topic', 'consumer_group']
)

processing_latency = Histogram(
    'kafka_message_processing_seconds',
    'Message processing latency',
    ['topic']
)

class InstrumentedConsumer(MLEventConsumer):
    """Consumer with Prometheus metrics"""

    def process_message(self, message):
        start_time = time.time()

        try:
            # Process message
            super().process_message(message)

            # Record metrics
            messages_processed.labels(
                topic=message.topic,
                consumer_group=self.group_id
            ).inc()

        finally:
            latency = time.time() - start_time
            processing_latency.labels(topic=message.topic).observe(latency)

# Start metrics server
start_http_server(8000)
```

---

## 8. 最佳实践

### 8.1 Topic 设计

**推荐做法：**
- 使用具有描述性的 Topic 名称（例如 `ml-training-data`，而非 `data`）。
- 按 Key 分区，提供分区内的顺序保证。
- 设置合适的数据保留策略。
- 为不同数据类型使用独立 Topic。

**避免的做法：**
- 创建过多 Topic（增加运维开销）。
- 为高流量 Topic 仅设置一个分区。
- 存储过大的消息（原文以大于 1MB 为例）。
- 在同一 Topic 中混合不兼容的 Schema。

### 8.2 Producer 优化

```python
# Optimized producer config
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    acks='all',  # Durability
    compression_type='snappy',  # or 'lz4', 'gzip'
    linger_ms=10,  # Batching delay
    batch_size=32768,  # 32KB batches
    buffer_memory=67108864,  # 64MB buffer
    max_in_flight_requests_per_connection=5
)
```

### 8.3 Consumer 优化

```python
# Optimized consumer config
consumer = KafkaConsumer(
    bootstrap_servers=['localhost:9092'],
    max_poll_records=500,  # Fetch more records
    max_partition_fetch_bytes=1048576,  # 1MB per partition
    fetch_min_bytes=1024,  # Wait for more data
    fetch_max_wait_ms=500,  # Max wait time
    auto_commit_interval_ms=5000
)
```

---

## 9. 动手练习

### 练习：构建实时欺诈检测管道

**目标：** 使用 Kafka 创建流式欺诈检测系统。

**组件：**
1. 交易事件 Producer。
2. 实时特征工程 Consumer。
3. ML 模型服务 Consumer。
4. 用于欺诈交易的告警 Producer。

**要求：**
- 每秒处理 1,000 笔交易。
- 使用 1 小时与 24 小时窗口计算特征。
- 欺诈检测延迟低于 100ms。
- 将告警发布到独立 Topic。
- 监控消费者滞后量。

**起始代码：** [ai-infra-engineer-solutions/modules/mod-105-data-pipelines/exercise-03-streaming-pipeline-kafka/](https://github.com/ai-infra-curriculum/ai-infra-engineer-solutions/tree/main/modules/mod-105-data-pipelines/exercise-03-streaming-pipeline-kafka)

---

## 10. 总结

核心要点：
- Kafka 支持实时 ML 管道。
- Producer 与 Consumer 构成基础。
- 消费者组实现可扩展性。
- 流处理支持复杂数据转换。
- 监控对于生产系统至关重要。

**下一课：** [07——数据质量与验证](./07-data-quality-validation.md)

> 译注：吞吐量与延迟数字是原文示例，受消息大小、副本确认策略、批处理、硬件及网络影响。Kafka 4.x 已移除 ZooKeeper 模式，新部署应使用 KRaft；Faust 相关生态也需核对维护状态。Kafka Streams 的 Exactly-once 保证有适用范围，并不自动覆盖外部数据库、HTTP 调用等副作用；端到端仍需事务、幂等写入或相应的连接器保证。窗口计算需处理迟到事件、事件时间与状态恢复。全部原始代码块保持不变，未逐项运行。
