# 实验 04：通过 Kafka 流式传输事件

**时长：** 75 分钟  **前置条件：** Docker。

## 目标

以 KRaft 模式（不使用 Zookeeper）运行 Kafka，在 Python 中生产与消费消息，并观察分区行为。

## 步骤

### 1. compose.yaml
```yaml
services:
  kafka:
    image: bitnami/kafka:3.7
    ports: ["9092:9092"]
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
```
```bash
docker compose up -d
sleep 5
```

### 2. 创建包含三个分区的主题
```bash
docker compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic predictions --partitions 3 --replication-factor 1
docker compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### 3. 生产者（Python）
```python
# producer.py
import json, random, time
from kafka import KafkaProducer

p = KafkaProducer(
    bootstrap_servers=["localhost:9092"],
    value_serializer=lambda v: json.dumps(v).encode(),
    key_serializer=lambda k: k.encode(),
)
for i in range(100):
    user = f"user-{random.randint(1,5)}"          # 5 distinct keys → fewer partitions used
    p.send("predictions", key=user, value={"i": i, "user": user})
p.flush()
```
执行 `pip install kafka-python` 后运行程序。观察 Broker 日志中的传入流量。

### 4. 消费者（单个）
```python
# consumer.py
from kafka import KafkaConsumer
import json

c = KafkaConsumer(
    "predictions",
    bootstrap_servers=["localhost:9092"],
    group_id="lab-04",
    auto_offset_reset="earliest",
    value_deserializer=lambda v: json.loads(v),
)
for msg in c:
    print(f"partition={msg.partition} offset={msg.offset} key={msg.key} value={msg.value}")
```

### 5. 同组多消费者

启动两个具有相同 `group_id` 的消费者。Kafka 会在它们之间分配分区。停止其中一个，另一个会接管其分区。

### 6. 使用 CLI 检查
```bash
docker compose exec kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group lab-04 --describe
```

## 验证

- [ ] 主题 `predictions` 有三个分区。
- [ ] 生产者成功发布消息（无异常）。
- [ ] 消费者读取全部 100 条消息。
- [ ] 同组有两个消费者时，各自收到互不重叠的消息子集。

## 清理
```bash
docker compose down -v
```

## 故障排查

- **`NoBrokersAvailable`** — 从宿主机访问时使用 `localhost:9092`，而非 `kafka:9092`。
- **所有消息都进入同一分区** — 所有键相同，因此哈希结果落在同一分区。增加键的多样性。
- **`OffsetOutOfRange`** — 旧消费者使用过期的偏移量；通过 `--reset-offsets --to-earliest` 重置。
