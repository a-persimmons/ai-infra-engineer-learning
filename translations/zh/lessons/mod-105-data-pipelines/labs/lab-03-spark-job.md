# 实验 03：在本地运行 Spark 批处理作业

**时长：** 60 分钟  **前置条件：** Java 11+、Python 3.11+。

## 目标

在本地运行 PySpark，处理具有实际意义的数据集（纽约市出租车行程样本），并按日期分区写出 Parquet 文件。

## 步骤

### 1. 安装 PySpark
```bash
python -m venv venv && source venv/bin/activate
pip install 'pyspark==3.5.1' pyarrow
```

### 2. 获取示例数据
```bash
mkdir -p data
curl -LfO https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_2024-01.parquet
mv yellow_tripdata_2024-01.parquet data/
```

### 3. 编写 Spark 作业
```python
# job.py
from pyspark.sql import SparkSession, functions as F

spark = (
    SparkSession.builder
    .appName("taxi-trip-aggregation")
    .config("spark.sql.shuffle.partitions", "8")
    .getOrCreate()
)

df = spark.read.parquet("data/yellow_tripdata_2024-01.parquet")
print(f"rows: {df.count():,}")

agg = (
    df
    .withColumn("date", F.to_date("tpep_pickup_datetime"))
    .filter(F.col("date").between("2024-01-01", "2024-01-31"))
    .groupBy("date", "PULocationID")
    .agg(
        F.count("*").alias("trips"),
        F.avg("fare_amount").alias("avg_fare"),
        F.avg("trip_distance").alias("avg_distance"),
    )
)

(
    agg
    .repartition("date")
    .write.mode("overwrite")
    .partitionBy("date")
    .parquet("data/trips_by_pickup")
)

print("done")
spark.stop()
```

### 4. 运行作业
```bash
python job.py
ls data/trips_by_pickup/
```

### 5. 读回数据以确认结果
```python
import pyspark
spark = pyspark.sql.SparkSession.builder.getOrCreate()
out = spark.read.parquet("data/trips_by_pickup")
out.show(10)
out.filter("date = '2024-01-15'").orderBy(F.desc("trips")).show(5)
```

### 6. 针对笔记本电脑进行调优
```python
.config("spark.driver.memory", "4g")
.config("spark.sql.shuffle.partitions", "4")    # default 200, way too many for laptop
```

## 验证

- [ ] 作业在 2 分钟内完成。
- [ ] 输出目录包含 `date=2024-01-01/`、`date=2024-01-02/` 等目录。
- [ ] 重新读取后获得预期的聚合结果行。

## 清理
```bash
rm -rf data/
```

## 故障排查

- **`Java HotSpot Memory error`** — 降低 `spark.driver.memory` 或减少处理天数。
- **`Permission denied: jps`** — Java 不在 PATH 中；执行 `brew install openjdk@17 && export JAVA_HOME=...`。
- **输出文件过多** — 在 `partitionBy` 之前使用 `repartition("date")`，使每个日期分区保留一个文件。
