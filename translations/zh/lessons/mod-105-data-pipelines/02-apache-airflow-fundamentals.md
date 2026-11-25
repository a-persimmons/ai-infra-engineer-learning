# 第 02 课：Apache Airflow 基础

## 学习目标

完成本课后，你将能够：
- 理解 Airflow 架构与核心概念。
- 在 Kubernetes 上安装并配置 Airflow。
- 编写并部署 DAG（有向无环图）。
- 使用 Airflow Operator 执行常见任务。
- 调度并触发工作流。
- 监控 DAG 执行并调试故障。
- 将 Airflow 最佳实践应用于 ML 数据管道。

## 前置条件

- 完成第 01 课（数据管道架构）。
- Python 编程技能。
- 理解 Kubernetes 基础知识。
- 熟悉 SQL 与数据库。

## 导论

**Apache Airflow** 是数据管道领域广泛使用的工作流编排平台。

**Airflow 为什么对 ML 重要：**
- **工作流编排：** 管理具有依赖关系的复杂 DAG。
- **调度：** 按计划或触发条件运行管道。
- **监控：** 内置界面，用于追踪管道执行。
- **可扩展性：** 通过 Kubernetes 实现分布式执行。
- **可扩展功能：** 超过 100 个内置 Operator 及自定义 Operator（原文描述）。

**实际应用（原文案例）：**
- **Airbnb：** 创建了 Airflow，运行超过 1,000 个数据管道 DAG。
- **Uber：** 超过 1,800 个 DAG，每天处理超过 10PB 数据。
- **Lyft：** 使用 Airflow 编排 ML 训练管道。
- **Twitter：** 使用 Airflow 进行批量数据处理。
- **Spotify：** 超过 5,000 个 DAG，用于个性化与推荐。

## 1. Airflow 架构

### 1.1 核心组件

```
┌─────────────────────────────────────────────────────┐
│                  Airflow Architecture               │
│                                                     │
│  ┌──────────────┐         ┌──────────────┐        │
│  │   Web Server │◄────────┤   Scheduler  │        │
│  │   (Flask)    │         │  (DAG Parser)│        │
│  └──────┬───────┘         └──────┬───────┘        │
│         │                        │                │
│         │                        │ Creates tasks  │
│         ▼                        ▼                │
│  ┌──────────────────────────────────────┐        │
│  │         Metadata Database            │        │
│  │         (PostgreSQL/MySQL)           │        │
│  └──────────────┬───────────────────────┘        │
│                 │                                 │
│                 │ Reads task queue                │
│                 ▼                                 │
│  ┌──────────────────────────────────────┐        │
│  │           Executor                   │        │
│  │  (Kubernetes/Celery/Local)           │        │
│  └──────────────┬───────────────────────┘        │
│                 │                                 │
│                 │ Spawns workers                  │
│                 ▼                                 │
│  ┌──────────────────────────────────────┐        │
│  │          Workers                     │        │
│  │  (Execute tasks in pods/processes)   │        │
│  └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

**组件职责：**

1. **Web Server：** 用于监控和管理 DAG 的用户界面。
2. **Scheduler：** 解析 DAG、调度任务并监控执行。
3. **Metadata Database：** 存储 DAG 相关元数据、任务状态与日志相关信息。
4. **Executor：** 决定任务如何执行（Kubernetes Pod、Celery Worker 等）。
5. **Worker：** 实际执行任务。

### 1.2 DAG（Directed Acyclic Graph，有向无环图）

**DAG 结构：**

```
       ┌─────────────┐
       │  ingest_data│
       └──────┬──────┘
              │
              ▼
       ┌──────────────┐
       │validate_data │
       └──────┬───────┘
              │
         ┌────┴────┐
         ▼         ▼
   ┌─────────┐ ┌─────────┐
   │transform│ │ feature │
   │  _data  │ │   _eng  │
   └────┬────┘ └────┬────┘
        │           │
        └─────┬─────┘
              ▼
        ┌──────────┐
        │store_data│
        └──────────┘
```

**关键属性：**
- **有向：** 任务具有确定的依赖顺序（A → B → C）。
- **无环：** 不存在循环（不能 A → B → A）。
- **图：** 具有依赖关系的任务网络。

## 2. 在 Kubernetes 上安装 Airflow

### 2.1 使用 Helm 安装

**添加 Airflow Helm 仓库：**

```bash
helm repo add apache-airflow https://airflow.apache.org
helm repo update
```

**为生产环境创建 values 文件：**

```yaml
# airflow-values.yaml
# Executor: KubernetesExecutor (scales automatically)
executor: "KubernetesExecutor"

# Airflow version
defaultAirflowTag: "2.7.2-python3.10"

# Database (PostgreSQL)
postgresql:
  enabled: true
  auth:
    username: airflow
    password: airflow
    database: airflow
  primary:
    persistence:
      size: 50Gi

# Redis (for CeleryExecutor, optional)
redis:
  enabled: false  # Not needed for KubernetesExecutor

# Webserver configuration
webserver:
  replicas: 2
  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 1000m
      memory: 2Gi

# Scheduler configuration
scheduler:
  replicas: 2  # HA setup
  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 1000m
      memory: 2Gi

# DAGs configuration
dags:
  persistence:
    enabled: true
    size: 10Gi
    storageClassName: gp3-balanced

# Logs persistence
logs:
  persistence:
    enabled: true
    size: 50Gi

# Git-sync for DAG deployment (recommended)
gitSync:
  enabled: true
  repo: https://github.com/ai-infra-curriculum/airflow-dags.git
  branch: main
  rev: HEAD
  depth: 1
  maxFailures: 3
  subPath: "dags"
  wait: 60  # Sync every 60 seconds
  credentialsSecret: git-credentials

# Environment variables
env:
  - name: AIRFLOW__CORE__LOAD_EXAMPLES
    value: "False"
  - name: AIRFLOW__WEBSERVER__EXPOSE_CONFIG
    value: "True"
  - name: AIRFLOW__SCHEDULER__DAG_DIR_LIST_INTERVAL
    value: "60"

# Service (LoadBalancer for external access)
service:
  type: LoadBalancer
```

**安装 Airflow：**

```bash
# Create namespace
kubectl create namespace airflow

# Install with Helm
helm install airflow apache-airflow/airflow \
  --namespace airflow \
  --values airflow-values.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=airflow -n airflow --timeout=600s

# Get webserver URL
kubectl get service airflow-webserver -n airflow
```

**访问 Airflow 界面：**

```bash
# Port-forward to access locally
kubectl port-forward svc/airflow-webserver 8080:8080 -n airflow

# Open browser: http://localhost:8080
# Default credentials: admin / admin
```

### 2.2 配置 Connections

**Airflow Connections** 存储外部系统（数据库、API、云存储）的连接凭据。

**通过界面添加连接：**
1. 进入 Admin → Connections。
2. 点击「+」添加新连接。

**ML 常用连接：**

```python
# AWS S3 connection
Conn Id: aws_default
Conn Type: Amazon Web Services
AWS Access Key ID: <your-key>
AWS Secret Access Key: <your-secret>
Extra: {"region_name": "us-west-2"}

# PostgreSQL connection
Conn Id: analytics_db
Conn Type: Postgres
Host: analytics.db.company.com
Schema: ml_data
Login: airflow
Password: <password>
Port: 5432

# Kubernetes connection (for KubernetesPodOperator)
Conn Id: kubernetes_default
Conn Type: Kubernetes
In Cluster Configuration: True  # If running in K8s
```

**通过 CLI 添加连接：**

```bash
kubectl exec -it airflow-scheduler-0 -n airflow -- \
  airflow connections add 'aws_default' \
    --conn-type 'aws' \
    --conn-extra '{"region_name": "us-west-2", "aws_access_key_id": "xxx", "aws_secret_access_key": "xxx"}'
```

## 3. 编写第一个 DAG

### 3.1 基础 DAG 结构

```python
# dags/my_first_dag.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

# Default arguments for all tasks
default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,  # Don't wait for previous run to complete
    'email': ['ml-team@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),  # Kill task if runs too long
}

# Define the DAG
dag = DAG(
    'my_first_ml_pipeline',
    default_args=default_args,
    description='A simple ML data pipeline',
    schedule_interval='0 2 * * *',  # Cron: 2 AM daily
    start_date=datetime(2023, 1, 1),
    catchup=False,  # Don't backfill historical runs
    tags=['ml', 'training'],
)

# Task 1: Extract data
def extract_data(**context):
    """Extract data from source"""
    print(f"Extracting data for {context['ds']}")  # ds = execution date
    # Your extraction logic here
    return {'rows_extracted': 1000}

extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_data,
    dag=dag,
)

# Task 2: Validate data
def validate_data(**context):
    """Validate extracted data"""
    print("Validating data...")
    # Your validation logic
    return True

validate_task = PythonOperator(
    task_id='validate_data',
    python_callable=validate_data,
    dag=dag,
)

# Task 3: Transform data (using Bash)
transform_task = BashOperator(
    task_id='transform_data',
    bash_command='python /opt/scripts/transform.py --date {{ ds }}',
    dag=dag,
)

# Task 4: Train model
def train_model(**context):
    """Train ML model"""
    print("Training model...")
    # Your training logic
    return {'accuracy': 0.95}

train_task = PythonOperator(
    task_id='train_model',
    python_callable=train_model,
    dag=dag,
)

# Define task dependencies
extract_task >> validate_task >> transform_task >> train_task
```

**部署 DAG：**

```bash
# Copy DAG to Airflow DAGs folder
kubectl cp my_first_dag.py airflow-scheduler-0:/opt/airflow/dags/ -n airflow

# Or commit to Git (if using git-sync)
git add dags/my_first_dag.py
git commit -m "Add first ML pipeline DAG"
git push origin main

# DAG will appear in UI within ~60 seconds (git-sync interval)
```

### 3.2 带 XCom（Cross-Communication，跨任务通信）的 DAG

**XCom** 允许任务共享数据。

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG('xcom_example', start_date=datetime(2023, 1, 1), schedule_interval=None)

def extract_data(**context):
    """Extract data and push to XCom"""
    data = {'users': 1000, 'purchases': 5000}
    # Push to XCom
    context['task_instance'].xcom_push(key='data_stats', value=data)
    return data  # Also automatically pushed to XCom with key 'return_value'

def process_data(**context):
    """Pull data from XCom"""
    # Pull from XCom
    data_stats = context['task_instance'].xcom_pull(task_ids='extract_data', key='data_stats')
    print(f"Processing {data_stats['users']} users and {data_stats['purchases']} purchases")

extract_task = PythonOperator(task_id='extract_data', python_callable=extract_data, dag=dag)
process_task = PythonOperator(task_id='process_data', python_callable=process_data, dag=dag)

extract_task >> process_task
```

**XCom 的限制：**
- 默认存储在元数据库中（原文举例约 48KB，具体取决于后端）。
- 不要用于传输大型数据集！使用 S3/GCS 等存储。

**处理大型数据的更好方式：**

```python
import boto3

def extract_data(**context):
    """Save large data to S3, pass S3 path via XCom"""
    df = fetch_large_dataset()  # 10GB dataset

    # Save to S3
    s3_path = f"s3://ml-data/processed/{context['ds']}/data.parquet"
    df.to_parquet(s3_path)

    # Push S3 path (small) to XCom
    return s3_path

def process_data(**context):
    """Load data from S3 using path from XCom"""
    s3_path = context['task_instance'].xcom_pull(task_ids='extract_data')
    df = pd.read_parquet(s3_path)
    # Process df...
```

## 4. 常见 Airflow Operator

### 4.1 PythonOperator

**执行 Python 函数：**

```python
from airflow.operators.python import PythonOperator

def my_function(param1, param2, **context):
    print(f"Param1: {param1}, Param2: {param2}")
    print(f"Execution date: {context['ds']}")
    return "success"

task = PythonOperator(
    task_id='run_python_function',
    python_callable=my_function,
    op_kwargs={'param1': 'value1', 'param2': 'value2'},
    dag=dag,
)
```

### 4.2 BashOperator

**执行 Bash 命令：**

```python
from airflow.operators.bash import BashOperator

task = BashOperator(
    task_id='run_bash_script',
    bash_command='python /opt/scripts/train.py --date {{ ds }}',
    env={'MODEL_VERSION': 'v1.2'},  # Environment variables
    dag=dag,
)
```

### 4.3 KubernetesPodOperator

**在 Kubernetes Pod 中运行任务（原文推荐用于 ML）：**

```python
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator

train_task = KubernetesPodOperator(
    task_id='train_model_gpu',
    name='model-training-pod',
    namespace='ml-jobs',
    image='myregistry.io/ml-training:v1.0',
    cmds=["python", "train.py"],
    arguments=["--data-dir=/data", "--epochs=100"],

    # GPU resources
    resources={
        'request_memory': '16Gi',
        'request_cpu': '8',
        'limit_memory': '16Gi',
        'limit_cpu': '8',
        'limit_nvidia.com/gpu': '1',
    },

    # Volumes
    volumes=[
        k8s.V1Volume(
            name='training-data',
            persistent_volume_claim=k8s.V1PersistentVolumeClaimVolumeSource(
                claim_name='ml-training-data-pvc'
            ),
        ),
    ],
    volume_mounts=[
        k8s.V1VolumeMount(
            name='training-data',
            mount_path='/data',
            read_only=True,
        ),
    ],

    # Auto-delete pod after completion
    is_delete_operator_pod=True,
    get_logs=True,

    dag=dag,
)
```

### 4.4 S3Operator

**操作 S3：**

```python
from airflow.providers.amazon.aws.operators.s3 import S3CopyObjectOperator, S3DeleteObjectsOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor

# Wait for file to appear in S3
wait_for_data = S3KeySensor(
    task_id='wait_for_new_data',
    bucket_name='ml-data',
    bucket_key='raw/{{ ds }}/data.parquet',
    aws_conn_id='aws_default',
    timeout=3600,  # Wait up to 1 hour
    poke_interval=60,  # Check every 60 seconds
    dag=dag,
)

# Copy object
copy_data = S3CopyObjectOperator(
    task_id='copy_data_to_processed',
    source_bucket_name='ml-data',
    source_bucket_key='raw/{{ ds }}/data.parquet',
    dest_bucket_name='ml-data',
    dest_bucket_key='processed/{{ ds }}/data.parquet',
    aws_conn_id='aws_default',
    dag=dag,
)

wait_for_data >> copy_data
```

### 4.5 SQLOperator

**执行 SQL 查询：**

```python
from airflow.providers.postgres.operators.postgres import PostgresOperator

create_table_task = PostgresOperator(
    task_id='create_features_table',
    postgres_conn_id='analytics_db',
    sql="""
        CREATE TABLE IF NOT EXISTS ml_features (
            user_id BIGINT,
            feature_1 FLOAT,
            feature_2 FLOAT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """,
    dag=dag,
)

insert_data_task = PostgresOperator(
    task_id='insert_features',
    postgres_conn_id='analytics_db',
    sql="""
        INSERT INTO ml_features (user_id, feature_1, feature_2)
        SELECT user_id, AVG(purchase_amount), COUNT(*)
        FROM transactions
        WHERE date = '{{ ds }}'
        GROUP BY user_id;
    """,
    dag=dag,
)

create_table_task >> insert_data_task
```

## 5. 调度与触发

### 5.1 调度周期

**Cron 表达式：**

```python
# Every day at 2 AM
schedule_interval='0 2 * * *'

# Every hour
schedule_interval='0 * * * *'

# Every Monday at 3 AM
schedule_interval='0 3 * * 1'

# First day of month at midnight
schedule_interval='0 0 1 * *'

# Or use Airflow presets
from airflow.timetables.datasets import DatasetOrTimeSchedule
schedule_interval='@daily'   # Midnight daily
schedule_interval='@hourly'  # Top of every hour
schedule_interval='@weekly'  # Sunday midnight
schedule_interval='@monthly' # First of month midnight

# Manual trigger only (no schedule)
schedule_interval=None
```

### 5.2 历史回填（Backfill）

**运行历史时间区间的 DAG：**

```bash
# Backfill DAG for date range
airflow dags backfill \
  --start-date 2023-10-01 \
  --end-date 2023-10-15 \
  my_ml_pipeline

# Backfill specific task
airflow tasks run my_ml_pipeline extract_data 2023-10-15
```

### 5.3 触发 DAG

**通过界面触发：**
- 点击 DAG → 点击 Trigger DAG 按钮。
- 可以通过界面传递参数。

**通过 CLI 触发：**

```bash
kubectl exec -it airflow-scheduler-0 -n airflow -- \
  airflow dags trigger my_ml_pipeline --conf '{"model_version": "v2.0"}'
```

**通过 API 触发：**

```python
import requests

response = requests.post(
    'http://airflow-webserver:8080/api/v1/dags/my_ml_pipeline/dagRuns',
    json={"conf": {"model_version": "v2.0"}},
    auth=('admin', 'admin')
)
```

**从另一个 DAG 触发：**

```python
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

trigger_task = TriggerDagRunOperator(
    task_id='trigger_training_dag',
    trigger_dag_id='model_training_pipeline',
    conf={"model_version": "v2.0"},
    wait_for_completion=True,  # Wait for triggered DAG to complete
    dag=dag,
)
```

## 6. 监控与调试

### 6.1 Airflow 界面

**主要视图（原文版本）：**
1. **DAGs 视图：** 展示全部 DAG、状态和最近一次运行。
2. **Graph 视图：** 可视化 DAG 结构及任务状态。
3. **Tree 视图：** 历史运行时间线。
4. **Gantt 视图：** 任务持续时间及重叠情况。
5. **Task logs：** 任务执行的 stdout/stderr。

**任务状态：**
- **None：** 尚未调度。
- **Scheduled：** 已被调度，等待后续执行。
- **Running：** 正在执行。
- **Success：** 成功完成。
- **Failed：** 任务失败。
- **Skipped：** 任务被跳过。
- **Up for retry：** 延迟后重试。
- **Upstream failed：** 上游任务失败。

### 6.2 调试失败任务

**查看日志：**

```bash
# Via UI: Click task → View Logs

# Via CLI:
kubectl exec -it airflow-scheduler-0 -n airflow -- \
  airflow tasks logs my_ml_pipeline extract_data 2023-10-15
```

**常见失败原因：**

1. **导入错误**（找不到 Python 模块）。
   ```
   Solution: Add to requirements.txt, rebuild image
   ```

2. **连接失败**（无法访问数据库/API）。
   ```
   Solution: Check connection in Admin → Connections
   ```

3. **超时**（任务运行时间过长）。
   ```
   Solution: Increase execution_timeout in task
   ```

4. **内存不足。**
   ```
   Solution: Increase resources in KubernetesPodOperator
   ```

### 6.3 清除任务状态与重试

**清除任务状态（重新运行）：**

```bash
# Via UI: Click task → Clear

# Via CLI:
airflow tasks clear my_ml_pipeline extract_data --start-date 2023-10-15
```

**将任务标记为成功（跳过重新运行）：**

```bash
airflow tasks state my_ml_pipeline extract_data 2023-10-15 --state success
```

## 7. ML 数据管道最佳实践

### 7.1 幂等任务

**确保任务能够安全地重复执行：**

```python
def process_data(**context):
    """Idempotent task - safe to re-run"""
    date = context['ds']

    # Overwrite output (not append)
    output_path = f's3://ml-data/processed/date={date}/data.parquet'
    df.to_parquet(output_path, mode='overwrite')  # ✅ Idempotent

    # Don't append to tables (creates duplicates if re-run)
    # df.to_sql('features', con=engine, if_exists='append')  # ❌ Not idempotent

    # Instead, use upsert or truncate-insert
    df.to_sql('features', con=engine, if_exists='replace')  # ✅ Idempotent
```

### 7.2 使用 TaskFlow API（Airflow 2.0+）

**更简洁的 DAG 语法：**

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule_interval='@daily', start_date=datetime(2023, 1, 1), catchup=False)
def ml_pipeline():
    @task
    def extract_data():
        return {'rows': 1000}

    @task
    def transform_data(data):
        rows = data['rows']
        return {'rows': rows, 'transformed': True}

    @task
    def load_data(data):
        print(f"Loading {data['rows']} rows")

    # Automatically creates dependencies
    data = extract_data()
    transformed = transform_data(data)
    load_data(transformed)

ml_pipeline_dag = ml_pipeline()
```

### 7.3 参数化 DAG

**使 DAG 可配置：**

```python
from airflow.models import Variable

# Store config in Airflow Variables (Admin → Variables)
MODEL_VERSION = Variable.get("model_version", default_var="v1.0")
BATCH_SIZE = Variable.get("batch_size", default_var=32, deserialize_json=False)

# Or pass via DAG config when triggering
def train_model(**context):
    config = context['dag_run'].conf or {}
    model_version = config.get('model_version', 'v1.0')
    print(f"Training model {model_version}")
```

### 7.4 关注点分离

**不要将复杂、耗时的业务逻辑放入 DAG 文件：**

```python
# ❌ BAD: All logic in DAG file
def train_model(**context):
    # 1000 lines of training logic here...
    df = pd.read_csv(...)
    model = RandomForest(...)
    model.fit(...)
    # ...

# ✅ GOOD: Import from separate module
from ml.training import train_model as train_fn

train_task = PythonOperator(
    task_id='train_model',
    python_callable=train_fn,
    dag=dag,
)
```

### 7.5 合理使用 Sensor

**传统 poke 模式的 Sensor 在等待时占用 Worker Slot：**

```python
# ✅ GOOD: Use mode='reschedule' to free worker slot
sensor = S3KeySensor(
    task_id='wait_for_data',
    bucket_key='data.csv',
    mode='reschedule',  # Free worker slot while waiting
    poke_interval=300,  # Check every 5 minutes
    timeout=3600,
    dag=dag,
)

# ❌ BAD: mode='poke' blocks worker
sensor = S3KeySensor(
    task_id='wait_for_data',
    bucket_key='data.csv',
    mode='poke',  # Blocks worker slot!
    dag=dag,
)
```

## 8. 总结

### 核心要点

**Airflow 是 ML 数据管道常用编排工具。**
- Airbnb、Uber、Lyft、Netflix、Spotify 等企业使用过相关技术（原文举例）。

**核心概念：**
- **DAG：** 任务的有向无环图。
- **Operator：** Python、Bash、Kubernetes、SQL 等。
- **XCom：** 在任务之间共享少量数据。
- **Connection：** 存储连接凭据。

**最佳实践：**
- 使任务具有幂等性。
- 使用 KubernetesPodOperator 执行 ML 作业。
- 将复杂业务逻辑与 DAG 文件分离。
- 使用 TaskFlow API 编写更简洁的代码。
- 使用 Airflow 界面监控工作流。

**部署：**
- 使用 Helm 在 Kubernetes 上安装 Airflow。
- 使用 GitSync 部署 DAG。
- 使用 KubernetesExecutor 按任务需求创建执行 Pod。

## 自我检查问题

1. Airflow 架构的五个核心组件是什么？
2. DAG 是什么的缩写？有哪些关键属性？
3. 如何在 Airflow 任务之间共享数据？
4. PythonOperator 与 KubernetesPodOperator 有什么区别？
5. 如何调度 DAG 在每天凌晨 3 点执行？
6. DAG 定义中的 `catchup=False` 有什么作用？
7. 为什么任务应具有幂等性？
8. 何时应为 Sensor 使用 `mode='reschedule'`？

## 补充资源

- [Airflow 文档](https://airflow.apache.org/docs/)
- [Airflow 最佳实践](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Astronomer 指南](https://www.astronomer.io/guides/)
- [Airflow Summit 视频](https://airflowsummit.org/)

---

**下一课：** 面向 ML 的高级 Airflow——复杂 DAG 模式、动态 DAG 与生产优化！

> 译注：本课主要采用 Airflow 2.x 的术语、界面与接口；Airflow 3.x 的组件、导入路径、CLI 与 API 等存在变化。任务日志通常保存在文件或配置的远程日志后端，并非全部存入元数据库。XCom 没有适用于所有后端的统一 48KB 限额；Scheduled 与 Queued 是不同状态。Sensor 的 reschedule 或 deferrable 模式可减少长期占用 Worker 的情况。企业统计未独立核验，所有代码块及命令保留原文，未逐项执行。
