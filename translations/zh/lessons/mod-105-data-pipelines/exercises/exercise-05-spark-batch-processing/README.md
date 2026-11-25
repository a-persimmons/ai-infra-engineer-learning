# 练习 05：面向机器学习的 Spark 批处理

**时长：** 3 小时
**难度：** 中级
**前置条件：** 已安装 Java 与 PySpark（mod-105 实验 03）

## 目标

构建端到端处理真实规模数据集（1–10 GB）的 PySpark 作业：读取分区 Parquet、使用 SQL 与 DataFrame API 转换、通过广播 Join 连接维度表、写回分区且分桶的 Parquet，并进行性能调优。

## 为什么重要

当数据量超出 pandas 的处理能力，但尚不需要完整数据仓库时，Spark 是常用工具。能够编写高性能 PySpark 的工程师懂得正确分区、选择广播 Join 或 Shuffle Join，并避免不必要的 Shuffle 开销，使作业从数小时缩短到数分钟。

## 要求

1. 处理 1–10 GB Parquet 数据集（纽约出租车或合成数据）。
2. 同时使用 **SQL** 与 **DataFrame** API。
3. 至少执行一次**广播 Join**（小型维度表）。
4. 至少执行一次带显式分区的 **Shuffle Join**。
5. 输出按日期分区、按用户分桶。
6. 根据数据规模调优 `spark.sql.shuffle.partitions`。
7. 生成 `BENCHMARK.md`，比较不同调优配置的运行结果。

## 分步操作

### 步骤 1——获取数据与搭建环境（20 分钟）
```bash
mkdir spark-batch && cd spark-batch
python -m venv venv && source venv/bin/activate
pip install 'pyspark==3.5.1' pyarrow

# 6 months of NYC taxi data ≈ 4 GB
for m in 01 02 03 04 05 06; do
  curl -LfO "https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_2024-$m.parquet" \
    -o "data/tripdata_2024_$m.parquet"
done
```

### 步骤 2——作业骨架（15 分钟）
```python
# job.py
from pyspark.sql import SparkSession, functions as F, Window

spark = (
    SparkSession.builder
    .appName("trip-features")
    .config("spark.driver.memory", "4g")
    .config("spark.executor.memory", "4g")
    .config("spark.sql.shuffle.partitions", "16")
    .config("spark.sql.adaptive.enabled", "true")
    .getOrCreate()
)
```

### 步骤 3——读取与清洗（30 分钟）
```python
df = spark.read.parquet("data/")
print("rows:", df.count())

clean = (df
    .filter((F.col("trip_distance") > 0) & (F.col("fare_amount") > 0))
    .filter(F.col("tpep_pickup_datetime") < F.col("tpep_dropoff_datetime"))
    .withColumn("date", F.to_date("tpep_pickup_datetime"))
    .withColumn("hour", F.hour("tpep_pickup_datetime"))
    .withColumn("trip_minutes",
        (F.unix_timestamp("tpep_dropoff_datetime") - F.unix_timestamp("tpep_pickup_datetime"))/60))
```

### 步骤 4——SQL API（15 分钟）
```python
clean.createOrReplaceTempView("trips")
agg = spark.sql("""
    SELECT date, PULocationID,
           COUNT(*) AS trips,
           AVG(fare_amount) AS avg_fare,
           AVG(trip_minutes) AS avg_min
    FROM trips
    GROUP BY date, PULocationID
""")
```

### 步骤 5——广播 Join（30 分钟）
读取小型区域维度表（约 250 行），执行广播 Join：
```python
zones = spark.read.csv("zones.csv", header=True, inferSchema=True)   # ~250 rows
joined = agg.join(F.broadcast(zones), agg.PULocationID == zones.LocationID)
```
与未显式广播的版本比较执行计划，观察 BroadcastHashJoin 与 SortMergeJoin 的区别。

### 步骤 6——Shuffle Join（30 分钟）
对行程数据执行带偏移量的自连接（例如同一出租车的上一段行程），演示真实 Shuffle：
```python
w = Window.partitionBy("VendorID").orderBy("tpep_pickup_datetime")
with_prev = clean.withColumn("prev_fare", F.lag("fare_amount").over(w))
```

### 步骤 7——写入分区及分桶数据（15 分钟）
```python
(agg
    .repartition("date")     # one file per date partition
    .write.mode("overwrite")
    .partitionBy("date")
    .bucketBy(8, "PULocationID")
    .sortBy("PULocationID")
    .saveAsTable("trip_aggregates")
)
```

### 步骤 8——调优与基准测试（45 分钟）
运行三个版本：
- 默认 `spark.sql.shuffle.partitions=200`（对于笔记本上的 4GB 数据通常太多）。
- 调优值：16。
- 启用 AQE。

在 `BENCHMARK.md` 中比较实际运行时间。

## 交付物

1. 可端到端运行的 `job.py`。
2. 按日期分区、按 PULocationID 分桶的输出 Parquet。
3. `BENCHMARK.md`，包含三种调优配置与实测时间。
4. `EXPLAIN_NOTES.md`，记录广播 Join 的 `df.explain()` 输出。

## 验证

- [ ] 4GB 输入在笔记本电脑上五分钟内处理完成。
- [ ] 输出存在且分区结构正确（通过 `ls data/output/date=2024-01-15/` 验证）。
- [ ] 广播 Join 的 EXPLAIN 显示 `BroadcastHashJoin`。
- [ ] 启用 AQE 后的运行比默认运行产生更少输出文件。

## 拓展目标

- 在 **AWS EMR Serverless** 或 **Databricks** 上使用十倍数据量运行，观察相同模式。
- 使用 **Spark UI** 分析性能，识别最慢阶段并说明原因。
- 添加支持 merge/upsert 的 **Delta Lake** Sink。

## 常见陷阱

- **笔记本使用 `spark.sql.shuffle.partitions=200`**——默认值可能产生 200 个小文件，带来大量开销。可从接近 CPU 核数的值开始调优。
- **`groupBy` 后执行 `count`**——可能触发 Shuffle；如果只需要适用的全局统计，可优先考虑读取 `_metadata`。
- **对实际上不小的表使用 `broadcast()`**——可能导致 Driver OOM。默认自动广播阈值通常为 10MB，应注意其大小。
- **`partitionBy` 的分区过多**——可能产生大量小文件；应调整分区数量和写入策略。

> 译注：输出文件数并非必然等于逻辑分区数；实际数量受写入任务、分桶、AQE 和数据分布影响。AQE 也不保证每次都减少文件数。
