# 第 04 课：使用 ELK Stack 与 Loki 管理日志

## 学习目标

完成本课后，你将能够：
- 理解集中式日志对 AI 基础设施的重要性。
- 搭建并配置 ELK Stack（Elasticsearch、Logstash、Kibana）。
- 部署并使用 Grafana Loki 聚合日志。
- 在 Python 应用中实现结构化日志。
- 高效查询与分析日志。
- 设计日志保留及归档策略。
- 将日志与指标结合，实现全面的可观测性。

## 前置条件

- 完成第 01–03 课（可观测性、Prometheus、Grafana）。
- 理解 Docker 与 Kubernetes。
- 具有 Python 编程经验。
- 具备 Linux 命令行基础知识。

## 导论

日志是系统中事件的详细记录。对于 AI 基础设施，日志对调试模型故障、追踪数据管道问题、理解 GPU 错误及审计 ML 实验十分重要。与指标（聚合数值）和链路追踪（追踪请求）不同，日志提供带时间戳的详细事件记录。

### 为什么 ML 系统需要集中式日志？

1. **调试：** 追踪训练作业、推理管道及数据处理中的错误。
2. **审计追踪：** 追踪谁部署了哪个模型、数据访问模式及实验参数。
3. **性能分析：** 识别缓慢操作、资源竞争和 I/O 瓶颈。
4. **合规：** 保留数据治理及模型可解释性所需的记录。
5. **关联分析：** 将日志与指标、链路追踪关联，用于根因分析。

---

## 1. 日志基础

### 日志级别

标准日志级别（从严重程度最高到最低）：

| 级别 | 用途 | 示例 |
|---|---|---|
| **FATAL/CRITICAL** | 系统不可用 | GPU 驱动崩溃、OOM Killer |
| **ERROR** | 操作失败 | 模型加载失败、推理错误 |
| **WARN** | 潜在问题 | GPU 温度过高、慢查询 |
| **INFO** | 一般信息 | 模型已部署、批处理完成 |
| **DEBUG** | 详细诊断信息 | 函数参数、中间值 |
| **TRACE** | 非常详细的信息 | 循环迭代、所有函数调用 |

### 结构化日志与非结构化日志

**非结构化（纯文本）：**
```
2025-10-15 10:23:45 Model bert-base processed 1000 requests in 5.2 seconds
```
- 易于人类阅读。
- 难以解析与查询。
- 难以聚合。

**结构化（JSON）：**
```json
{
  "timestamp": "2025-10-15T10:23:45Z",
  "level": "INFO",
  "model_name": "bert-base",
  "model_version": "v1.2",
  "requests_processed": 1000,
  "duration_seconds": 5.2,
  "gpu_id": 0,
  "message": "Batch processing completed"
}
```
- 可以由机器解析。
- 易于查询和过滤。
- 支持聚合与分析。

### 日志最佳实践

1. **使用结构化日志**（JSON 格式）。
2. **包含上下文**（请求 ID、经过适当保护的用户标识、模型名称等）。
3. **使用适当的日志级别**（不要将所有内容都记录为 INFO）。
4. **避免记录敏感数据**（密码、个人身份信息、API Key）。
5. **使用关联 ID（Correlation ID）** 跨服务追踪请求。
6. **包含时间信息**，便于性能分析。
7. **记录错误及堆栈追踪**，注意敏感信息脱敏。

---

## 2. ELK Stack（Elasticsearch、Logstash、Kibana）

ELK Stack 是用于日志聚合、处理、存储及可视化的强大工具套件。

### 架构

```
┌─────────────┐
│ Application │
│   (Logs)    │
└──────┬──────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐      ┌───────────┐
│  Filebeat/  │─────>│   Logstash   │─────>│Elasticsearch│
│  Fluentd    │      │  (Process &  │      │  (Store &  │
│  (Collect)  │      │   Transform) │      │   Index)   │
└─────────────┘      └──────────────┘      └─────┬──────┘
                                                  │
                                                  ↓
                                           ┌──────────┐
                                           │  Kibana  │
                                           │(Visualize│
                                           │  Query)  │
                                           └──────────┘
```

**组件：**
- **Elasticsearch：** 分布式搜索与分析引擎（存储）。
- **Logstash：** 数据处理管道（摄取及转换）。
- **Kibana：** 可视化及查询界面。
- **Filebeat/Fluentd：** 日志采集与转发工具。

### 安装 ELK Stack

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms2g -Xmx2g
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - elk
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200"]
      interval: 30s
      timeout: 10s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    container_name: logstash
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000/tcp"  # Logstash TCP input
      - "5000:5000/udp"  # Logstash UDP input
      - "9600:9600"      # Logstash monitoring
    environment:
      - LS_JAVA_OPTS=-Xmx1g -Xms1g
    networks:
      - elk
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - elk
    depends_on:
      elasticsearch:
        condition: service_healthy

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.10.0
    container_name: filebeat
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: filebeat -e -strict.perms=false
    networks:
      - elk
    depends_on:
      - elasticsearch
      - logstash

volumes:
  elasticsearch_data:

networks:
  elk:
    driver: bridge
```

### Logstash 配置

**logstash/pipeline/ml-logs.conf：**

```ruby
input {
  # TCP input for structured logs
  tcp {
    port => 5000
    codec => json_lines
    tags => ["tcp"]
  }

  # Filebeat input
  beats {
    port => 5044
    tags => ["beats"]
  }
}

filter {
  # Parse JSON logs
  if [message] =~ /^{.*}$/ {
    json {
      source => "message"
    }
  }

  # Add timestamp if missing
  if ![timestamp] {
    ruby {
      code => "event.set('timestamp', Time.now.utc.iso8601)"
    }
  }

  # Parse log level
  if [level] {
    mutate {
      uppercase => ["level"]
    }
  }

  # Extract model information
  if [model_name] {
    mutate {
      add_field => {
        "[@metadata][index_prefix]" => "ml-logs-models"
      }
    }
  }

  # Parse GPU logs
  if [gpu_id] {
    mutate {
      convert => {
        "gpu_id" => "integer"
      }
      add_field => {
        "[@metadata][index_prefix]" => "ml-logs-gpu"
      }
    }
  }

  # Parse training job logs
  if [job_type] == "training" {
    mutate {
      add_field => {
        "[@metadata][index_prefix]" => "ml-logs-training"
      }
    }

    # Extract epoch and loss if present
    grok {
      match => {
        "message" => "Epoch %{NUMBER:epoch:int}.*loss[:=]\s*%{NUMBER:loss:float}"
      }
      tag_on_failure => []
    }
  }

  # Add environment tags
  mutate {
    add_field => {
      "environment" => "${ENV:dev}"
      "cluster" => "${CLUSTER:local}"
    }
  }

  # Remove unnecessary fields
  mutate {
    remove_field => ["@version", "host"]
  }
}

output {
  # Output to Elasticsearch
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_prefix]:ml-logs}-%{+YYYY.MM.dd}"
  }

  # Debug output (optional)
  # stdout {
  #   codec => rubydebug
  # }
}
```

### Filebeat 配置

**filebeat/filebeat.yml：**

```yaml
filebeat.inputs:
  # Container logs
  - type: container
    paths:
      - '/var/lib/docker/containers/*/*.log'
    processors:
      - add_docker_metadata:
          host: "unix:///var/run/docker.sock"
      - decode_json_fields:
          fields: ["message"]
          target: ""
          overwrite_keys: true

  # Application logs from file
  - type: log
    enabled: true
    paths:
      - /var/log/ml-platform/*.log
    fields:
      service: ml-platform
    json.keys_under_root: true
    json.add_error_key: true

output.logstash:
  hosts: ["logstash:5044"]
  compression_level: 3

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

---

## 3. Grafana Loki

Loki 是受 Prometheus 启发设计的日志聚合系统，旨在降低成本并简化运维。

### Loki 与 ELK 比较

| 特性 | Loki | ELK |
|---|---|---|
| **存储** | 对象存储（S3、GCS） | Elasticsearch |
| **索引** | 主要索引标签（类似 Prometheus） | 全文索引 |
| **查询语言** | LogQL（类似 PromQL） | Elasticsearch DSL |
| **成本** | 通常较低（索引较少） | 可能较高（全文索引） |
| **配置复杂度** | 相对简单 | 相对复杂 |
| **搜索性能** | 未索引字段查询可能较慢 | 全文搜索通常较快 |
| **集成** | 原生 Grafana 集成 | 独立的 Kibana 界面 |

### 使用 Promtail 安装 Loki

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.9.0
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/config.yml
      - loki_data:/loki
    command: -config.file=/etc/loki/config.yml
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:2.9.0
    container_name: promtail
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:10.1.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
    networks:
      - monitoring
    depends_on:
      - loki

volumes:
  loki_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

### Loki 配置

**loki-config.yml：**

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2023-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h  # 7 days
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
  per_stream_rate_limit: 5MB
  per_stream_rate_limit_burst: 20MB

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 30d

compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
```

### Promtail 配置

**promtail-config.yml：**

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker container logs
  - job_name: containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
            model_name: model_name
            gpu_id: gpu_id
      - labels:
          level:
          model_name:
          gpu_id:
      - timestamp:
          source: timestamp
          format: RFC3339

  # ML platform logs
  - job_name: ml-platform
    static_configs:
      - targets:
          - localhost
        labels:
          job: ml-platform
          __path__: /var/log/ml-platform/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            msg: message
            model: model_name
            version: model_version
      - labels:
          level:
          model:
          version:

  # Training job logs
  - job_name: training-jobs
    static_configs:
      - targets:
          - localhost
        labels:
          job: training
          __path__: /var/log/training/*.log
    pipeline_stages:
      - regex:
          expression: '^.*Epoch (?P<epoch>\d+).*loss[:=]\s*(?P<loss>[\d.]+)'
      - labels:
          epoch:
      - metrics:
          training_loss:
            type: Gauge
            description: "Training loss"
            source: loss
            config:
              action: set
```

---

## 4. Python 中的结构化日志

### 使用 Python logging 模块

**基础结构化日志：**

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Custom formatter for JSON logs"""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        # Add extra fields
        if hasattr(record, 'model_name'):
            log_data['model_name'] = record.model_name
        if hasattr(record, 'model_version'):
            log_data['model_version'] = record.model_version
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Configure logging
def setup_logging(log_file='app.log', log_level=logging.INFO):
    """Configure structured logging"""

    # Create logger
    logger = logging.getLogger()
    logger.setLevel(log_level)

    # File handler with JSON formatting
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(JSONFormatter())
    logger.addHandler(file_handler)

    # Console handler (human-readable for development)
    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    return logger

# Usage
logger = setup_logging()

logger.info(
    "Model inference completed",
    extra={
        'model_name': 'bert-base',
        'model_version': 'v1.2',
        'batch_size': 32,
        'latency_ms': 45.2
    }
)
```

### 使用 python-json-logger

```bash
pip install python-json-logger
```

```python
from pythonjsonlogger import jsonlogger
import logging

# Setup
logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Usage with extra fields
logger.info(
    "Processing batch",
    extra={
        'model_name': 'resnet50',
        'batch_size': 64,
        'gpu_id': 0
    }
)
```

### 使用 structlog 实现高级日志

```bash
pip install structlog
```

```python
import structlog

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Bind context that persists across log calls
logger = logger.bind(
    model_name="bert-base",
    model_version="v1.2",
    environment="production"
)

# Log with additional context
logger.info("inference_started", batch_size=32, request_id="abc123")
logger.info("inference_completed", latency_ms=45.2, predictions_count=32)
logger.error("inference_failed", error="OOM", gpu_id=0)
```

### 完整的 ML 应用日志示例

```python
import structlog
from fastapi import FastAPI, Request
from contextvars import ContextVar
import uuid
import time

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
)

# Context variable for request ID
request_id_ctx = ContextVar("request_id", default=None)

app = FastAPI()
logger = structlog.get_logger()

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add request ID to all logs"""
    request_id = str(uuid.uuid4())
    request_id_ctx.set(request_id)

    # Bind request ID to context
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host
    )

    start_time = time.time()

    logger.info("request_started")

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration_seconds=duration
        )

        return response

    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            "request_failed",
            error=str(e),
            error_type=type(e).__name__,
            duration_seconds=duration
        )
        raise

@app.post("/predict")
async def predict(data: dict):
    """ML inference endpoint with comprehensive logging"""

    logger.info(
        "inference_started",
        model_name=data.get("model"),
        batch_size=len(data.get("inputs", []))
    )

    try:
        # Simulate inference
        time.sleep(0.1)

        logger.info(
            "inference_completed",
            predictions_count=len(data.get("inputs", [])),
            model_name=data.get("model")
        )

        return {"predictions": [0.95, 0.87]}

    except Exception as e:
        logger.error(
            "inference_error",
            error=str(e),
            error_type=type(e).__name__,
            model_name=data.get("model")
        )
        raise
```

---

## 5. 查询日志

### LogQL（Loki）

LogQL 是一种类似 PromQL 的日志查询语言。

**基础查询：**

```logql
# All logs from ml-serving service
{service="ml-serving"}

# ERROR level logs
{service="ml-serving"} |= "ERROR"
{service="ml-serving"} | json | level="ERROR"

# Logs for specific model
{service="ml-serving"} | json | model_name="bert-base"

# Logs with latency > 1 second
{service="ml-serving"} | json | latency_ms > 1000

# Count error logs per minute
rate({service="ml-serving"} | json | level="ERROR"[1m])

# Extract and aggregate numeric fields
sum by (model_name) (
  rate({service="ml-serving"} | json | unwrap latency_ms [5m])
)
```

**高级 LogQL：**

```logql
# Regex pattern matching
{service="training"} |~ "Epoch \\d+ .*loss"

# Multiple conditions
{service="ml-serving", environment="prod"}
  | json
  | model_name=~"bert.*"
  | latency_ms > 500

# Aggregate by label
sum by (model_name, model_version) (
  count_over_time({service="ml-serving"} | json [5m])
)

# Calculate percentiles
quantile_over_time(0.95,
  {service="ml-serving"}
    | json
    | unwrap latency_ms [5m]
) by (model_name)
```

### Elasticsearch Query DSL

**基础查询（Kibana Discover）：**

```json
# Simple text search
{
  "query": {
    "match": {
      "message": "error"
    }
  }
}

# Filtered search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "ERROR" } },
        { "match": { "model_name": "bert-base" } }
      ],
      "filter": [
        {
          "range": {
            "@timestamp": {
              "gte": "now-1h"
            }
          }
        }
      ]
    }
  }
}

# Aggregation (count by model)
{
  "size": 0,
  "aggs": {
    "models": {
      "terms": {
        "field": "model_name.keyword",
        "size": 10
      }
    }
  }
}
```

---

## 6. 日志保留与归档

### Loki 保留策略

```yaml
# loki-config.yml
limits_config:
  retention_period: 30d  # Keep logs for 30 days

compactor:
  working_directory: /loki/compactor
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
```

### Elasticsearch 索引生命周期管理（ILM）

```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "1d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

---

## 总结

本课学习了：

- 集中式日志对于 AI 基础设施的重要性。
- 搭建 ELK Stack（Elasticsearch、Logstash、Kibana）。
- 部署 Grafana Loki，实现成本高效的日志聚合。
- 在 Python 应用中实现结构化日志。
- 使用 LogQL 和 Elasticsearch DSL 查询日志。
- 设计日志保留及归档策略。
- ML 系统的日志最佳实践。

## 下一步

- **第 05 课：** 学习使用 Jaeger 与 Tempo 进行分布式链路追踪。
- **实践：** 在自己的 ML 应用中实现结构化日志。
- **练习：** 为多服务 ML 平台搭建集中式日志系统。

## 补充资源

- [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Grafana Loki 文档](https://grafana.com/docs/loki/latest/)
- [LogQL 指南](https://grafana.com/docs/loki/latest/logql/)
- [Structlog 文档](https://www.structlog.org/)

---

**预计时长：** 4–6 小时
**难度：** 中级
**前置条件：** 第 01–03 课、Python、Docker。

> 译注：Promtail 属于旧版采集方案，新部署应评估 Grafana Alloy 等受支持的替代工具；本课保留原文配置。Loki 不宜将请求 ID、用户 ID 等高基数字段用作索引标签，可使用结构化元数据或日志正文。Python 标准 logging 并不内置 TRACE 级别。日志平台成本取决于摄取量、保留周期、复制、索引和查询负载，不能仅凭产品类型判断。生产部署应启用身份验证、TLS、最小权限与敏感数据过滤。全部原始代码块保留，未逐项运行。
