# 练习 11：Lambda 架构——批处理与流处理混合模式

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 练习 02、05 与实验 04（Kafka）

## 目标

实现混合管道，将批处理（每天重新处理历史数据）与流处理（实时更新）结合，为统一的特征存储提供服务。完成后，你将理解 Lambda 与 Kappa 架构的取舍，并获得两个处理层的可用代码。

## 为什么重要

许多真实生产机器学习平台采用混合模式：通过流处理获取低延迟特征，通过批处理计算流处理遗漏的准确历史聚合。将两者正确连接是一项重要技能；最常见的问题是「流式特征反映当前分钟的数据，而批量特征仍停留在昨天」，关键在于如何协调两者。

## 背景——Lambda 与 Kappa

**Lambda 架构：**
- 批处理层：可信数据源，每天重新处理所有数据，准确率高。
- 流处理层：实时近似计算，延迟低，可能存在轻微滞后或误差。
- 服务层：将两层结果结合为一个答案。

**Kappa 架构：**
- 仅使用流处理；通过 Kafka 日志重放实现回填。
- 更简单，但要求数据流可重放（原文举例 Kafka 无限保留）。
- 流处理足够成熟、能够完全取代批处理时更适用。

本练习构建 Lambda 架构；拓展任务为迁移至 Kappa。

## 要求

1. **批处理层**（Airflow + Spark）计算每个用户「过去 30 天的购买次数」，每晚运行。
2. **流处理层**（Kafka + Python Consumer）持续累加每个用户「自上一次批处理以来的购买次数」。
3. **服务层**：读取两者，返回 `batch_value + streaming_increment`。
4. **协调**：每晚的批处理运行重置每个用户的流式计数器。
5. **迟到事件处理**：迟到超过一小时的事件写入「late」分区，由下一次批处理处理。
6. **端到端测试**：生成事件、查询特征存储并验证正确性。

## 分步操作

### 步骤 1——启动 Kafka 与 Redis（15 分钟）
使用此前实验的 Compose 配置。

### 步骤 2——事件 Producer（15 分钟）
```python
# producer.py — simulates real-time purchase events
import json, time, random, uuid
from kafka import KafkaProducer

p = KafkaProducer(bootstrap_servers=["localhost:9092"], value_serializer=lambda v: json.dumps(v).encode())
while True:
    p.send("purchases", {
        "user_id": f"u{random.randint(1,100)}",
        "amount": round(random.uniform(5, 200), 2),
        "ts": int(time.time()),
        "event_id": str(uuid.uuid4()),
    })
    time.sleep(0.1)
```

### 步骤 3——流处理 Consumer（30 分钟）
```python
# stream_consumer.py
import json, redis
from kafka import KafkaConsumer

r = redis.Redis(decode_responses=True)
c = KafkaConsumer("purchases", bootstrap_servers=["localhost:9092"],
                  value_deserializer=lambda v: json.loads(v),
                  group_id="features-streaming")

for msg in c:
    e = msg.value
    # increment streaming counter
    r.hincrby(f"features:{e['user_id']}", "purchases_streaming", 1)
    r.hincrbyfloat(f"features:{e['user_id']}", "amount_streaming", e["amount"])
    # also write to a durable log for batch later
    r.xadd(f"audit:purchases:{e['user_id']}", {"data": json.dumps(e)})
```

### 步骤 4——批处理层（45 分钟）
```python
# batch_aggregate.py — Airflow PythonOperator
import duckdb, redis
con = duckdb.connect("warehouse.duckdb")
r = redis.Redis(decode_responses=True)

# Read everything in the last 30 days from the source-of-truth (warehouse table loaded by another pipeline)
agg = con.execute("""
    SELECT user_id,
           COUNT(*) AS purchases_30d,
           SUM(amount) AS amount_30d
    FROM purchases_warehouse
    WHERE ts >= NOW() - INTERVAL 30 DAY
    GROUP BY user_id
""").fetchdf()

# Write to Redis batch keys, AND reset streaming counters atomically
pipe = r.pipeline()
for _, row in agg.iterrows():
    pipe.hset(f"features:{row.user_id}",
              mapping={"purchases_batch": int(row.purchases_30d), "amount_batch": float(row.amount_30d)})
    pipe.hset(f"features:{row.user_id}", "purchases_streaming", 0)
    pipe.hset(f"features:{row.user_id}", "amount_streaming", 0)
pipe.execute()
```

### 步骤 5——服务层（15 分钟）
```python
def get_features(user_id):
    f = r.hgetall(f"features:{user_id}")
    return {
        "purchases_30d": int(f.get("purchases_batch", 0)) + int(f.get("purchases_streaming", 0)),
        "amount_30d":   float(f.get("amount_batch", 0)) + float(f.get("amount_streaming", 0)),
    }
```

### 步骤 6——迟到事件处理器（30 分钟）
Producer 模拟迟到事件：
```python
# Once in a while, send an event with ts in the past
if random.random() < 0.05:
    e["ts"] = int(time.time()) - random.randint(3600, 86400*2)
```
流处理 Consumer 将迟到事件路由至独立 Kafka Topic `purchases.late`。批处理层在下一次运行时读取 `purchases_warehouse` 与 `purchases.late` 的归档数据。

### 步骤 7——端到端测试（30 分钟）
```python
# integration_test.py
producer = ...
# Send 100 events for user u1
for _ in range(100): producer.send("purchases", {...user_id: "u1", amount: 10})
time.sleep(2)
# Query features
assert get_features("u1") == {"purchases_30d": 100, "amount_30d": 1000.0}

# Run batch aggregation
batch_aggregate()
# Streaming counters reset; batch reflects all 100 events
assert get_features("u1") == {"purchases_30d": 100, "amount_30d": 1000.0}

# More streaming events
for _ in range(10): producer.send("purchases", {...user_id: "u1", amount: 10})
time.sleep(1)
assert get_features("u1") == {"purchases_30d": 110, "amount_30d": 1100.0}
```

## 交付物

1. Producer、流处理 Consumer、批处理 DAG 与服务函数。
2. 展示跨层边界正确性的集成测试。
3. `ARCHITECTURE.md`：描述 Lambda 架构及协调逻辑。
4. `TRADEOFFS.md`：针对具体工作负载何时选择 Lambda 或 Kappa。

## 验证

- [ ] 实时事件在一秒内反映到特征中。
- [ ] 批量聚合与流处理增量、批处理重置后的状态保持一致。
- [ ] 迟到事件出现在后续批处理运行中。
- [ ] 集成测试通过。

## 拓展目标

- 迁移至 **Kappa**：完全移除批处理层，通过 Kafka 日志重放回填。
- 添加**逐特征陈旧度**：服务层表明每个特征的数据滞后程度。
- 添加**金丝雀发布**：将特征变更写入影子键空间，与生产数据比较 N 小时后再晋升。

## 常见陷阱

- **重置间隙**——批处理读写之间重置流计数器会丢失期间到达的事件。使用 Redis 事务或 `last_batch_ts` 标记进行去重。
- **重复计数**——流式事件同时出现在批处理运行中。为每个事件设置 `event_id` 并去重。
- **Schema 分歧**——批处理与流处理使用不同方式计算同一个特征。使用具有已知答案的合成数据集测试。
- **回填导致服务结果错误**——回填期间服务层可能读取不一致状态。使用功能开关，将读取切换至「冻结」快照。

> 译注：跨层协调需要一致的事件时间边界、持久化偏移量及幂等处理；仅使用事务或时间戳并不能保证任意场景下的正确性。滚动 30 天窗口还需要处理过期事件。
