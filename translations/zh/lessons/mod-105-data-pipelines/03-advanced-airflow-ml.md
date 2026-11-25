# 第 03 课：面向 ML 的高级 Airflow

## 学习目标

完成本课后，你将能够：
- 为 ML 工作流实现复杂 DAG 模式。
- 创建以编程方式生成任务的动态 DAG。
- 有效使用 TaskFlow API 传递数据。
- 针对大规模 ML 数据管道优化 Airflow 性能。
- 在 DAG 中实现分支与条件逻辑。
- 使用 Airflow 构建分布式训练管道。
- 应用面向生产环境的模式，避免反模式。

## 前置条件

- 完成第 02 课（Airflow 基础）。
- Python 编程（装饰器、推导式）。
- 理解 ML 训练工作流。
- 熟悉 Kubernetes。

## 导论

本课介绍专门面向 ML 基础设施的高级 Airflow 模式：
- **动态 DAG：** 为多个模型或实验生成任务。
- **复杂依赖：** Fan-out/Fan-in（扇出/扇入）、条件分支。
- **分布式训练：** 编排多 GPU、多节点训练。
- **性能优化：** 处理超过 100 个并发 DAG（原文目标）。

**实际应用（原文案例）：**
- **Uber：** 使用动态 DAG，每天训练超过 100 个 ML 模型。
- **Lyft：** 使用分支 DAG 对不同模型变体进行 A/B 测试。
- **Netflix：** 使用 Fan-out 模式为超过 190 个国家提供个性化服务。

## 1. 动态 DAG

### 1.1 为什么使用动态 DAG？

**问题：** 需要通过类似管道训练 50 个模型。

**错误方案：** 复制粘贴 50 份 DAG 文件。

**正确方案：** 以编程方式生成 DAG。

### 1.2 通过循环生成动态 DAG

```python
# dags/dynamic_model_training.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

# List of models to train
MODELS = ['bert', 'gpt2', 'roberta', 'albert', 'xlnet']

def train_model(model_name, **context):
    """Train a specific model"""
    print(f"Training {model_name} for {context['ds']}")
    # Training logic here
    return f"{model_name}_trained"

# Generate one DAG per model
for model in MODELS:
    dag_id = f'train_{model}_daily'

    dag = DAG(
        dag_id,
        schedule_interval='@daily',
        start_date=datetime(2023, 1, 1),
        catchup=False,
        tags=['ml', 'training', model],
    )

    train_task = PythonOperator(
        task_id='train_model',
        python_callable=train_model,
        op_kwargs={'model_name': model},
        dag=dag,
    )

    # Register DAG in globals() so Airflow can find it
    globals()[dag_id] = dag

# Result: 5 DAGs created (train_bert_daily, train_gpt2_daily, etc.)
```

### 1.3 从配置文件生成动态 DAG

**更易维护的方式：通过 YAML 定义模型。**

```yaml
# config/models.yaml
models:
  - name: sentiment_classifier
    architecture: bert
    dataset: imdb
    epochs: 10
    gpu_count: 2

  - name: ner_model
    architecture: roberta
    dataset: conll2003
    epochs: 20
    gpu_count: 4

  - name: qa_model
    architecture: albert
    dataset: squad
    epochs: 15
    gpu_count: 2
```

```python
# dags/dynamic_from_config.py
import yaml
from airflow import DAG
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator
from datetime import datetime
from kubernetes.client import models as k8s

# Load config
with open('/opt/airflow/config/models.yaml', 'r') as f:
    config = yaml.safe_load(f)

def create_training_dag(model_config):
    """Create DAG for a model"""
    model_name = model_config['name']

    dag = DAG(
        f'train_{model_name}',
        schedule_interval='@daily',
        start_date=datetime(2023, 1, 1),
        catchup=False,
        tags=['ml', 'dynamic', model_config['architecture']],
    )

    train_task = KubernetesPodOperator(
        task_id='train_model',
        name=f'{model_name}-training',
        namespace='ml-jobs',
        image=f'myregistry.io/{model_config["architecture"]}:latest',
        cmds=["python", "train.py"],
        arguments=[
            "--model-name", model_name,
            "--dataset", model_config['dataset'],
            "--epochs", str(model_config['epochs']),
        ],
        resources={
            'limit_nvidia.com/gpu': str(model_config['gpu_count']),
            'limit_memory': '32Gi',
            'limit_cpu': '16',
        },
        dag=dag,
    )

    return dag

# Generate DAGs from config
for model in config['models']:
    dag_id = f"train_{model['name']}"
    globals()[dag_id] = create_training_dag(model)

# Result: 3 DAGs created from config
```

### 1.4 DAG 内部的动态任务

**Fan-out 模式：并行处理多个条目。**

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG('dynamic_tasks', start_date=datetime(2023, 1, 1), schedule_interval=None)

# Generate tasks dynamically
COUNTRIES = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP']

def process_country(country, **context):
    print(f"Processing data for {country}")
    # Country-specific logic

# Create one task per country (fan-out)
country_tasks = []
for country in COUNTRIES:
    task = PythonOperator(
        task_id=f'process_{country.lower()}',
        python_callable=process_country,
        op_kwargs={'country': country},
        dag=dag,
    )
    country_tasks.append(task)

# Aggregate results (fan-in)
def aggregate_results(**context):
    print("Aggregating results from all countries")

aggregate_task = PythonOperator(
    task_id='aggregate_results',
    python_callable=aggregate_results,
    dag=dag,
)

# Dependencies: all country tasks → aggregate
for task in country_tasks:
    task >> aggregate_task
```

## 2. 复杂 DAG 模式

### 2.1 分支（条件执行）

**根据条件执行不同任务：**

```python
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator
from datetime import datetime

dag = DAG('branching_example', start_date=datetime(2023, 1, 1), schedule_interval=None)

def check_data_quality(**context):
    """Decide which branch to take based on data quality"""
    # Check data quality
    data_quality_score = 0.95  # Example: compute actual score

    if data_quality_score >= 0.9:
        return 'high_quality_pipeline'  # Task ID to execute
    elif data_quality_score >= 0.7:
        return 'medium_quality_pipeline'
    else:
        return 'low_quality_pipeline'

branch_task = BranchPythonOperator(
    task_id='check_quality',
    python_callable=check_data_quality,
    dag=dag,
)

# Branch 1: High quality data
high_quality_task = PythonOperator(
    task_id='high_quality_pipeline',
    python_callable=lambda: print("Running high-quality pipeline"),
    dag=dag,
)

# Branch 2: Medium quality data
medium_quality_task = PythonOperator(
    task_id='medium_quality_pipeline',
    python_callable=lambda: print("Running medium-quality pipeline with extra validation"),
    dag=dag,
)

# Branch 3: Low quality data
low_quality_task = PythonOperator(
    task_id='low_quality_pipeline',
    python_callable=lambda: print("Alerting team about low quality data"),
    dag=dag,
)

# Join point (runs after any branch)
join_task = EmptyOperator(
    task_id='join',
    trigger_rule='none_failed_min_one_success',  # Run if at least one branch succeeded
    dag=dag,
)

# Dependencies
branch_task >> [high_quality_task, medium_quality_task, low_quality_task]
[high_quality_task, medium_quality_task, low_quality_task] >> join_task
```

### 2.2 SubDAG（已弃用，改用 TaskGroup）

**TaskGroup：以可视化方式组织任务。**

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.task_group import TaskGroup
from datetime import datetime

dag = DAG('taskgroup_example', start_date=datetime(2023, 1, 1), schedule_interval=None)

# TaskGroup for data preprocessing
with TaskGroup('preprocessing', tooltip='Data preprocessing tasks', dag=dag) as preprocessing_group:
    extract_task = PythonOperator(
        task_id='extract',
        python_callable=lambda: print("Extracting data"),
    )

    validate_task = PythonOperator(
        task_id='validate',
        python_callable=lambda: print("Validating data"),
    )

    transform_task = PythonOperator(
        task_id='transform',
        python_callable=lambda: print("Transforming data"),
    )

    extract_task >> validate_task >> transform_task

# TaskGroup for model training
with TaskGroup('training', tooltip='Model training tasks', dag=dag) as training_group:
    train_task = PythonOperator(
        task_id='train',
        python_callable=lambda: print("Training model"),
    )

    evaluate_task = PythonOperator(
        task_id='evaluate',
        python_callable=lambda: print("Evaluating model"),
    )

    train_task >> evaluate_task

# Dependencies between groups
preprocessing_group >> training_group
```

### 2.3 触发规则（Trigger Rules）

**根据上游任务状态控制任务何时运行：**

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG('trigger_rules', start_date=datetime(2023, 1, 1), schedule_interval=None)

task_a = PythonOperator(task_id='task_a', python_callable=lambda: print("A"), dag=dag)
task_b = PythonOperator(task_id='task_b', python_callable=lambda: print("B"), dag=dag)
task_c = PythonOperator(task_id='task_c', python_callable=lambda: print("C"), dag=dag)

# Task D runs only if ALL upstream tasks succeed (default)
task_d = PythonOperator(
    task_id='task_d_all_success',
    python_callable=lambda: print("D: All succeeded"),
    trigger_rule='all_success',  # Default
    dag=dag,
)

# Task E runs if AT LEAST ONE upstream task succeeds
task_e = PythonOperator(
    task_id='task_e_one_success',
    python_callable=lambda: print("E: At least one succeeded"),
    trigger_rule='one_success',
    dag=dag,
)

# Task F runs if ALL upstream tasks are done (regardless of success/failure)
task_f = PythonOperator(
    task_id='task_f_all_done',
    python_callable=lambda: print("F: All done"),
    trigger_rule='all_done',
    dag=dag,
)

# Task G runs if AT LEAST ONE upstream task failed
task_g = PythonOperator(
    task_id='task_g_one_failed',
    python_callable=lambda: print("G: Cleanup after failure"),
    trigger_rule='one_failed',
    dag=dag,
)

[task_a, task_b, task_c] >> task_d
[task_a, task_b, task_c] >> task_e
[task_a, task_b, task_c] >> task_f
[task_a, task_b, task_c] >> task_g
```

**常见触发规则：**
- `all_success`（默认）：所有上游任务成功。
- `all_failed`：所有上游任务失败。
- `all_done`：所有上游任务均已结束（包括成功或失败等终态）。
- `one_success`：至少一个上游任务成功。
- `one_failed`：至少一个上游任务失败。
- `none_failed`：没有上游任务失败（部分可能被跳过）。
- `none_failed_min_one_success`：没有失败，且至少一个任务成功。
- `none_skipped`：没有上游任务被跳过。
- `always`：始终运行（不考虑上游状态）。

## 3. 分布式训练编排

### 3.1 单节点多 GPU 训练

```python
from airflow import DAG
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator
from datetime import datetime
from kubernetes.client import models as k8s

dag = DAG('distributed_training_single_node', start_date=datetime(2023, 1, 1), schedule_interval='@daily')

train_task = KubernetesPodOperator(
    task_id='train_multi_gpu',
    name='multi-gpu-training',
    namespace='ml-jobs',
    image='pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime',
    cmds=["torchrun"],
    arguments=[
        "--nproc_per_node=4",  # 4 GPUs on this node
        "train_distributed.py",
        "--data-dir=/data",
        "--epochs=100",
    ],

    # Request 4 GPUs
    resources={
        'limit_nvidia.com/gpu': '4',
        'limit_memory': '64Gi',
        'limit_cpu': '32',
        'request_nvidia.com/gpu': '4',
        'request_memory': '64Gi',
        'request_cpu': '32',
    },

    # Mount data volume
    volumes=[
        k8s.V1Volume(
            name='training-data',
            persistent_volume_claim=k8s.V1PersistentVolumeClaimVolumeSource(
                claim_name='imagenet-pvc'
            ),
        ),
    ],
    volume_mounts=[
        k8s.V1VolumeMount(name='training-data', mount_path='/data', read_only=True),
    ],

    dag=dag,
)
```

### 3.2 多节点分布式训练

**使用 PyTorchJob（Kubeflow Training Operator）：**

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
from kubernetes import client, config
import yaml

dag = DAG('distributed_training_multi_node', start_date=datetime(2023, 1, 1), schedule_interval='@daily')

def submit_pytorch_job(**context):
    """Submit PyTorchJob for distributed training"""
    config.load_incluster_config()  # Load K8s config from pod

    pytorch_job_manifest = {
        'apiVersion': 'kubeflow.org/v1',
        'kind': 'PyTorchJob',
        'metadata': {
            'name': f"resnet-training-{context['ds'].replace('-', '')}",
            'namespace': 'ml-jobs',
        },
        'spec': {
            'pytorchReplicaSpecs': {
                # Master replica
                'Master': {
                    'replicas': 1,
                    'restartPolicy': 'OnFailure',
                    'template': {
                        'spec': {
                            'containers': [{
                                'name': 'pytorch',
                                'image': 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime',
                                'command': ['python', 'train_distributed.py'],
                                'args': ['--backend=nccl', '--epochs=100'],
                                'resources': {
                                    'limits': {'nvidia.com/gpu': '2'},
                                },
                            }],
                        },
                    },
                },
                # Worker replicas
                'Worker': {
                    'replicas': 3,  # 3 worker nodes
                    'restartPolicy': 'OnFailure',
                    'template': {
                        'spec': {
                            'containers': [{
                                'name': 'pytorch',
                                'image': 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime',
                                'command': ['python', 'train_distributed.py'],
                                'args': ['--backend=nccl', '--epochs=100'],
                                'resources': {
                                    'limits': {'nvidia.com/gpu': '2'},
                                },
                            }],
                        },
                    },
                },
            },
        },
    }

    # Create PyTorchJob
    api = client.CustomObjectsApi()
    api.create_namespaced_custom_object(
        group='kubeflow.org',
        version='v1',
        namespace='ml-jobs',
        plural='pytorchjobs',
        body=pytorch_job_manifest,
    )

    print(f"Submitted PyTorchJob: {pytorch_job_manifest['metadata']['name']}")

submit_task = PythonOperator(
    task_id='submit_distributed_training',
    python_callable=submit_pytorch_job,
    dag=dag,
)
```

### 3.3 并行训练实现超参数调优

**并行训练多个模型变体：**

```python
from airflow import DAG
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator
from airflow.operators.python import PythonOperator
from datetime import datetime
import itertools

dag = DAG('hyperparameter_tuning', start_date=datetime(2023, 1, 1), schedule_interval=None)

# Define hyperparameter grid
learning_rates = [0.001, 0.01, 0.1]
batch_sizes = [32, 64, 128]
optimizers = ['adam', 'sgd']

# Generate all combinations
hyperparam_combinations = list(itertools.product(learning_rates, batch_sizes, optimizers))

training_tasks = []

for lr, batch_size, optimizer in hyperparam_combinations:
    task_id = f'train_lr{lr}_bs{batch_size}_{optimizer}'.replace('.', '_')

    train_task = KubernetesPodOperator(
        task_id=task_id,
        name=f'hp-tuning-{task_id}',
        namespace='ml-jobs',
        image='myregistry.io/model-training:v1.0',
        cmds=["python", "train.py"],
        arguments=[
            "--lr", str(lr),
            "--batch-size", str(batch_size),
            "--optimizer", optimizer,
            "--output-dir", f"s3://ml-experiments/{{ ds }}/{task_id}/",
        ],
        resources={'limit_nvidia.com/gpu': '1'},
        dag=dag,
    )

    training_tasks.append(train_task)

# Aggregate results and select best model
def select_best_model(**context):
    """Compare all experiment results and select best model"""
    print("Selecting best model from hyperparameter tuning...")
    # Logic to compare metrics from S3 and select winner

select_task = PythonOperator(
    task_id='select_best_model',
    python_callable=select_best_model,
    dag=dag,
)

# All training tasks run in parallel, then select best
training_tasks >> select_task

# Result: 18 parallel training tasks (3 LRs × 3 batch sizes × 2 optimizers)
```

## 4. TaskFlow API 高级模式

### 4.1 多个输出

```python
from airflow.decorators import dag, task
from datetime import datetime
from typing import Dict

@dag(schedule_interval='@daily', start_date=datetime(2023, 1, 1), catchup=False)
def ml_pipeline_taskflow():

    @task(multiple_outputs=True)
    def extract_and_validate() -> Dict[str, any]:
        """Extract data and return multiple outputs"""
        return {
            'data_path': 's3://ml-data/processed/2023-10-15/data.parquet',
            'row_count': 1000000,
            'quality_score': 0.95,
        }

    @task
    def train_model(data_path: str, row_count: int):
        print(f"Training on {data_path} with {row_count} rows")
        return {'model_path': 's3://models/model.pth', 'accuracy': 0.92}

    @task
    def deploy_model(model_path: str, accuracy: float):
        if accuracy >= 0.9:
            print(f"Deploying model from {model_path}")
        else:
            print("Model accuracy too low, not deploying")

    # Unpack multiple outputs
    extraction = extract_and_validate()
    training = train_model(
        data_path=extraction['data_path'],
        row_count=extraction['row_count']
    )
    deploy_model(model_path=training['model_path'], accuracy=training['accuracy'])

ml_pipeline_taskflow_dag = ml_pipeline_taskflow()
```

### 4.2 任务映射（Airflow 2.3+）

**使用动态任务映射进行并行处理：**

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule_interval='@daily', start_date=datetime(2023, 1, 1), catchup=False)
def dynamic_task_mapping():

    @task
    def get_countries():
        """Return list of countries to process"""
        return ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'IN', 'BR', 'CN']

    @task
    def process_country(country: str):
        """Process data for a single country"""
        print(f"Processing {country}")
        return {'country': country, 'rows': 10000}

    @task
    def aggregate_results(results: list):
        """Aggregate results from all countries"""
        total_rows = sum(r['rows'] for r in results)
        print(f"Processed {total_rows} total rows across {len(results)} countries")

    # Dynamic mapping: creates one process_country task per country
    countries = get_countries()
    results = process_country.expand(country=countries)  # Magic happens here!
    aggregate_results(results)

dynamic_task_mapping_dag = dynamic_task_mapping()
```

## 5. 性能优化

### 5.1 减少 DAG 解析时间

**问题：** DAG 中的重量级导入操作会拖慢调度器。

**错误做法：**
```python
import pandas as pd  # Heavy import
import tensorflow as tf  # Very heavy!

dag = DAG('slow_dag', ...)
```

**正确做法：**
```python
dag = DAG('fast_dag', ...)

def train_model(**context):
    import tensorflow as tf  # Import only when task runs
    # Training logic
```

### 5.2 Pool 管理

**限制并发任务数，避免资源耗尽：**

```bash
# Create pool via UI: Admin → Pools → Create
# Or via CLI:
airflow pools set ml_training_pool 10 "Pool for ML training tasks (max 10 concurrent)"
```

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG('pooled_tasks', start_date=datetime(2023, 1, 1))

# Tasks will use pool (max 10 concurrent across all DAGs)
for i in range(50):
    task = PythonOperator(
        task_id=f'train_model_{i}',
        python_callable=lambda: print("Training model"),
        pool='ml_training_pool',  # Use pool
        pool_slots=1,  # Takes 1 slot
        dag=dag,
    )
```

### 5.3 Smart Sensor（Airflow 2.2+，原文版本）

**降低 Sensor 给调度器带来的负载：**

```python
from airflow.sensors.s3 import S3KeySensor

# ✅ Smart sensor: offloads to separate sensor worker
sensor = S3KeySensor(
    task_id='wait_for_data',
    bucket_key='data/{{ ds }}/file.parquet',
    aws_conn_id='aws_default',
    timeout=3600,
    poke_interval=60,
    mode='reschedule',  # Important for smart sensors
    deferrable=True,  # Enable smart sensor (Airflow 2.2+)
    dag=dag,
)
```

### 5.4 并行度配置

**调优 Airflow，实现高吞吐量：**

```yaml
# airflow.cfg or Helm values
core:
  parallelism: 128  # Max tasks across all DAGs
  dag_concurrency: 32  # Max tasks per DAG
  max_active_runs_per_dag: 4  # Max concurrent DAG runs

scheduler:
  max_dagruns_per_loop_to_schedule: 10
  scheduler_heartbeat_sec: 5

kubernetes_executor:
  worker_pods_creation_batch_size: 8  # Create 8 pods at a time
```

## 6. 生产环境反模式

### 6.1 将大型数据存储在 XCom 中

```python
# ❌ BAD: XCom for large datasets
def extract_data():
    df = pd.read_csv('large_file.csv')  # 10 GB
    return df  # Stored in XCom (database) - WILL FAIL!

# ✅ GOOD: Store in S3, pass path via XCom
def extract_data():
    df = pd.read_csv('large_file.csv')
    s3_path = 's3://bucket/data.parquet'
    df.to_parquet(s3_path)
    return s3_path  # Small string, safe for XCom
```

### 6.2 未设置 execution_timeout

```python
# ❌ BAD: Task runs forever if stuck
task = PythonOperator(
    task_id='train',
    python_callable=train_model,
)

# ✅ GOOD: Kill if exceeds timeout
task = PythonOperator(
    task_id='train',
    python_callable=train_model,
    execution_timeout=timedelta(hours=6),  # Kill after 6 hours
)
```

### 6.3 任务过于细碎

```python
# ❌ BAD: 1000 tasks for 1000 rows (scheduler overhead!)
for row in range(1000):
    task = PythonOperator(task_id=f'process_row_{row}', ...)

# ✅ GOOD: Batch into fewer tasks
for batch in range(10):  # 10 tasks processing 100 rows each
    task = PythonOperator(
        task_id=f'process_batch_{batch}',
        op_kwargs={'start_row': batch*100, 'end_row': (batch+1)*100},
        ...
    )
```

### 6.4 DAG 之间紧耦合

```python
# ❌ BAD: DAG B depends on specific task in DAG A
# If DAG A changes structure, DAG B breaks

# ✅ GOOD: Use TriggerDagRunOperator or Datasets (Airflow 2.4+)
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

trigger = TriggerDagRunOperator(
    task_id='trigger_model_deployment',
    trigger_dag_id='deploy_model',
    conf={'model_version': '{{ ti.xcom_pull("train_model") }}'},
)
```

## 7. 总结

### 核心要点

**动态 DAG：**
- 从配置文件（YAML/JSON）生成 DAG。
- 使用循环创建多个相似 DAG。
- 使用动态任务实现 Fan-out/Fan-in 模式。

**高级模式：**
- 使用分支实现条件执行。
- 使用 TaskGroup 组织任务。
- 使用触发规则处理复杂依赖关系。

**分布式训练：**
- KubernetesPodOperator 用于多 GPU。
- PyTorchJob 用于多节点训练。
- 并行超参数调优。

**TaskFlow API：**
- 使用装饰器实现更简洁的语法。
- 多个输出与任务映射。
- 更好的类型表达能力。

**性能：**
- 在 DAG 文件中延迟导入。
- 使用 Pool 限制并发。
- 使用 Smart Sensor 等机制减少负载。
- 调整并行度设置。

**避免反模式：**
- 不使用 XCom 传递大型数据。
- 始终设置合适的 execution_timeout。
- 将小任务适当合并。
- 解耦 DAG。

## 自我检查问题

1. 如何通过配置文件创建多个 DAG？
2. Fan-out 与 Fan-in 模式有什么区别？
3. 何时使用 BranchPythonOperator？
4. 哪个触发规则能在至少一个上游任务成功时运行任务？
5. 如何将并发训练任务限制为 10 个？
6. 为什么不应在 XCom 中存储大型数据集？
7. 如何使用 Airflow 实现超参数调优？
8. Deferrable Sensor（可延迟 Sensor）有什么好处？

## 补充资源

- [动态 DAG](https://www.astronomer.io/guides/dynamically-generating-dags/)
- [TaskFlow API 指南](https://airflow.apache.org/docs/apache-airflow/stable/tutorial_taskflow_api.html)
- [Kubeflow Training Operator](https://www.kubeflow.org/docs/components/training/)
- [Airflow 性能调优](https://www.astronomer.io/guides/airflow-scaling-workers/)

---

**下一课：** 使用 DVC 管理数据版本——像追踪代码一样追踪数据集！

> 译注：Smart Sensor 已属于历史功能，现代 Airflow 通常采用 deferrable 或 reschedule 模式。Airflow 2.x 与 3.x 的导入路径、配置及 API 不完全相同，Kubeflow Training Operator 亦有版本差异。Pool 只能限制 Airflow 任务槽位，不直接等于 GPU 容量控制；需配合 Kubernetes 资源请求、配额及训练调度器。TaskFlow 类型注解并不自动提供完整的运行时类型验证。原文企业统计未独立核验，全部代码块及其英文注释保留原样。
