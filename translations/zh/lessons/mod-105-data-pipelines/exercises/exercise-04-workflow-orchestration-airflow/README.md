# 练习 04：使用 Airflow 编排 ML 工作流

**预计时长：** 32–40 小时
**难度：** 高级
**前置条件：** Python 3.9+、Apache Airflow、Docker、AWS/GCP SDK

## 概览

使用 Apache Airflow 构建生产级 ML 工作流编排。实现用于模型训练、数据验证、特征工程、模型部署及监控的 DAG，处理依赖、重试、告警与动态任务生成。本练习教授规模化机器学习生产落地所需的端到端 ML 管道编排模式。

在生产 ML 平台中，工作流编排对以下方面至关重要：
- **依赖管理：** 确保训练开始前数据就绪。
- **调度：** 每日运行训练，每小时运行特征工程。
- **重试逻辑：** 通过退避策略自动重试失败任务。
- **监控：** 追踪管道健康状态，失败时告警。
- **可复现性：** 统一管理代码、数据及模型版本。

## 学习目标

完成本练习后，你将能够：

1. **设计复杂 ML DAG**，正确配置任务依赖。
2. **实现训练前数据验证。**
3. **构建动态 DAG**（以编程方式生成任务）。
4. **处理故障**，使用重试、告警与回滚。
5. **集成 ML 工具**（MLflow、DVC、特征存储）。
6. **实现 Sensor 模式**，处理外部依赖。
7. **构建自定义 Operator**，执行 ML 专用任务。

## 业务背景

**实际业务场景（原文案例）：** ML 平台每日训练 20 个模型，依赖人工协调。当前问题：

- **人工编排：** 数据科学家通过 SSH 登录服务器，手动运行脚本。
- **缺少依赖追踪：** 特征未就绪就开始训练（30% 的训练失败）。
- **没有重试：** AWS 瞬时错误需要手动重新执行。
- **缺少监控：** 数小时后才发现管道失败。
- **可复现性问题：** 无法重建两周前的模型。
- **资源冲突：** 多个训练任务争用同一 GPU。

你的任务是构建基于 Airflow 的编排系统：
- 自动化端到端 ML 管道（数据 → 特征 → 训练 → 验证 → 部署）。
- 训练前验证数据质量。
- 使用指数退避重试失败任务 3 次。
- 失败后 5 分钟内告警（Slack/PagerDuty）。
- 追踪血缘（哪个数据及代码版本生成了哪个模型）。
- 调度 20 个模型且无资源冲突。

## 项目结构

```
exercise-04-workflow-orchestration-airflow/
├── README.md
├── requirements.txt
├── docker-compose.yaml          # Airflow + Postgres + Redis
├── airflow/
│   ├── airflow.cfg              # Airflow configuration
│   └── dags/
│       ├── ml_training_dag.py           # Main training DAG
│       ├── feature_engineering_dag.py   # Feature pipeline DAG
│       ├── model_deployment_dag.py      # Deployment DAG
│       ├── data_validation_dag.py       # Data quality checks
│       └── monitoring_dag.py            # Model monitoring DAG
├── plugins/
│   ├── operators/
│   │   ├── __init__.py
│   │   ├── data_validation_operator.py
│   │   ├── model_training_operator.py
│   │   ├── model_registry_operator.py
│   │   └── slack_alert_operator.py
│   ├── sensors/
│   │   ├── __init__.py
│   │   ├── s3_data_sensor.py
│   │   └── model_performance_sensor.py
│   └── hooks/
│       ├── __init__.py
│       ├── mlflow_hook.py
│       └── feature_store_hook.py
├── src/
│   └── ml_pipeline/
│       ├── __init__.py
│       ├── data/
│       │   ├── __init__.py
│       │   ├── loader.py             # Data loading
│       │   └── validator.py          # Data validation
│       ├── features/
│       │   ├── __init__.py
│       │   └── engineering.py        # Feature engineering
│       ├── models/
│       │   ├── __init__.py
│       │   ├── trainer.py            # Model training
│       │   └── evaluator.py          # Model evaluation
│       └── deployment/
│           ├── __init__.py
│           └── deployer.py           # Model deployment
├── tests/
│   ├── test_dags.py                  # Test DAG integrity
│   ├── test_operators.py
│   └── test_tasks.py
├── config/
│   ├── model_configs/
│   │   ├── fraud_detection.yaml
│   │   └── recommendation.yaml
│   └── data_validation_rules.yaml
└── docs/
    ├── DESIGN.md
    ├── DAG_REFERENCE.md
    └── TROUBLESHOOTING.md
```

## 需求

### 功能需求

1. **ML 训练 DAG：**
   - 从 S3/GCS 提取数据。
   - 验证数据质量。
   - 特征工程。
   - 训练模型。
   - 评估模型。
   - 注册模型（指标通过时）。
   - 部署模型（成为 Champion 时）。

2. **数据验证：**
   - Schema 验证（列类型、名称）。
   - 统计验证（分布、异常值）。
   - 新鲜度检查（数据不超过 X 小时）。
   - 完整性检查（关键列没有缺失值）。

3. **动态 DAG：**
   - 从配置为每个模型生成 DAG。
   - 参数化训练（超参数来自配置）。
   - 动态任务生成（每个数据分区一个任务）。

4. **故障处理：**
   - 重试失败任务（3 次尝试、指数退避）。
   - 失败时发送告警（Slack、电子邮件）。
   - 部署失败时回滚。
   - 为永久失败的任务设置死信队列。

5. **监控：**
   - 追踪 DAG 运行时长。
   - 监控任务成功率。
   - SLA 违反时告警（DAG 应在 2 小时内完成）。
   - 追踪模型性能漂移。

### 非功能需求

- **可扩展性：** 处理 50 个以上并发 DAG Run。
- **可靠性：** DAG 成功率 99.5%。
- **可观测性：** 详细日志、指标及血缘追踪。
- **性能：** DAG 调度延迟低于 30 秒。

## 实现任务

### 任务 1：Airflow 搭建（5–6 小时）

采用合适配置搭建 Airflow。

```yaml
# docker-compose.yaml

version: '3.8'

x-airflow-common:
  &airflow-common
  image: apache/airflow:2.8.0-python3.9
  environment:
    - AIRFLOW__CORE__EXECUTOR=CeleryExecutor
    - AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres/airflow
    - AIRFLOW__CELERY__RESULT_BACKEND=db+postgresql://airflow:airflow@postgres/airflow
    - AIRFLOW__CELERY__BROKER_URL=redis://:@redis:6379/0
    - AIRFLOW__CORE__FERNET_KEY=${FERNET_KEY}
    - AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION=true
    - AIRFLOW__CORE__LOAD_EXAMPLES=false
    - AIRFLOW__API__AUTH_BACKENDS=airflow.api.auth.backend.basic_auth
    - AIRFLOW__SCHEDULER__DAG_DIR_LIST_INTERVAL=30
  volumes:
    - ./airflow/dags:/opt/airflow/dags
    - ./plugins:/opt/airflow/plugins
    - ./logs:/opt/airflow/logs
    - ./src:/opt/airflow/src
  depends_on:
    - postgres
    - redis

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  airflow-webserver:
    <<: *airflow-common
    command: webserver
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8080/health"]
      interval: 10s
      timeout: 10s
      retries: 5

  airflow-scheduler:
    <<: *airflow-common
    command: scheduler
    healthcheck:
      test: ["CMD-SHELL", 'airflow jobs check --job-type SchedulerJob --hostname "$${HOSTNAME}"']
      interval: 10s
      timeout: 10s
      retries: 5

  airflow-worker:
    <<: *airflow-common
    command: celery worker
    healthcheck:
      test: ["CMD-SHELL", 'celery --app airflow.executors.celery_executor.app inspect ping -d "celery@$${HOSTNAME}"']
      interval: 10s
      timeout: 10s
      retries: 5

  airflow-init:
    <<: *airflow-common
    entrypoint: /bin/bash
    command:
      - -c
      - |
        airflow db init
        airflow users create \
          --username admin \
          --firstname Admin \
          --lastname User \
          --role Admin \
          --email admin@example.com \
          --password admin
    restart: on-failure
```

**验收标准：**
- [ ] Airflow Web 服务可访问。
- [ ] Scheduler 正常运行。
- [ ] Celery Worker 健康。
- [ ] DAG 目录受到监控。

---

### 任务 2：ML 训练 DAG（8–10 小时）

构建端到端训练 DAG。

```python
# airflow/dags/ml_training_dag.py

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.utils.dates import days_ago
from airflow.models import Variable
from datetime import timedelta
import sys
sys.path.append('/opt/airflow/src')

from ml_pipeline.data.loader import load_data
from ml_pipeline.data.validator import validate_data
from ml_pipeline.features.engineering import engineer_features
from ml_pipeline.models.trainer import train_model
from ml_pipeline.models.evaluator import evaluate_model
from ml_pipeline.deployment.deployer import deploy_model

# DAG configuration
default_args = {
    'owner': 'ml-platform',
    'depends_on_past': False,
    'email': ['ml-alerts@example.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
    'execution_timeout': timedelta(hours=2),  # Fail if task runs >2 hours
}

# Model configuration (loaded from Airflow Variables or config file)
MODEL_CONFIG = {
    'model_name': 'fraud_detection',
    'model_type': 'xgboost',
    'data_path': 's3://ml-data/transactions/{{ ds }}/',  # Templated with execution_date
    'model_output_path': 's3://ml-models/fraud_detection/{{ ds }}/',
    'feature_store_table': 'fraud_features',
    'target_metric': 'auc',
    'min_auc_threshold': 0.85,  # Deploy only if AUC >= 0.85
}

with DAG(
    dag_id='ml_training_fraud_detection',
    default_args=default_args,
    description='Train and deploy fraud detection model',
    schedule_interval='0 2 * * *',  # Run daily at 2 AM
    start_date=days_ago(1),
    catchup=False,  # Don't backfill historical runs
    max_active_runs=1,  # Only one run at a time
    tags=['ml', 'training', 'fraud'],
) as dag:

    # Task 1: Wait for upstream feature engineering DAG
    wait_for_features = ExternalTaskSensor(
        task_id='wait_for_features',
        external_dag_id='feature_engineering_fraud',
        external_task_id='write_to_feature_store',
        allowed_states=['success'],
        failed_states=['failed', 'skipped'],
        mode='poke',
        poke_interval=60,  # Check every 60 seconds
        timeout=3600,  # Wait max 1 hour
    )

    # Task 2: Load data from S3
    def load_training_data(**context):
        """
        Load data from S3

        Uses Airflow context to get execution_date for templating
        """
        execution_date = context['ds']  # YYYY-MM-DD format
        data_path = MODEL_CONFIG['data_path'].replace('{{ ds }}', execution_date)

        # TODO: Load data
        df = load_data(data_path)

        # TODO: Push data statistics to XCom
        context['task_instance'].xcom_push(
            key='data_stats',
            value={
                'row_count': len(df),
                'column_count': len(df.columns),
                'fraud_rate': df['is_fraud'].mean()
            }
        )

        # TODO: Save data to temp location for next tasks
        temp_path = f"/tmp/{execution_date}_data.parquet"
        df.to_parquet(temp_path)
        context['task_instance'].xcom_push(key='data_path', value=temp_path)

        return temp_path

    load_data_task = PythonOperator(
        task_id='load_data',
        python_callable=load_training_data,
        provide_context=True
    )

    # Task 3: Validate data quality
    def validate_data_quality(**context):
        """
        Validate data before training

        Checks:
        - Schema matches expected
        - No missing values in critical columns
        - Distributions within expected ranges
        - Sufficient data volume
        """
        data_path = context['task_instance'].xcom_pull(
            task_ids='load_data',
            key='data_path'
        )

        # TODO: Run validation
        validation_result = validate_data(
            data_path,
            schema_path='config/schemas/fraud_detection.json',
            validation_rules='config/data_validation_rules.yaml'
        )

        # TODO: Fail task if validation fails
        if not validation_result['passed']:
            raise ValueError(f"Data validation failed: {validation_result['errors']}")

        print(f"✅ Data validation passed: {validation_result}")
        return validation_result

    validate_data_task = PythonOperator(
        task_id='validate_data',
        python_callable=validate_data_quality,
        provide_context=True
    )

    # Task 4: Engineer features
    def engineer_training_features(**context):
        """
        Feature engineering

        In practice, might use feature store instead of computing here
        """
        data_path = context['task_instance'].xcom_pull(
            task_ids='load_data',
            key='data_path'
        )

        # TODO: Compute features
        features_df = engineer_features(data_path, MODEL_CONFIG)

        # TODO: Save features
        features_path = f"/tmp/{context['ds']}_features.parquet"
        features_df.to_parquet(features_path)
        context['task_instance'].xcom_push(key='features_path', value=features_path)

        return features_path

    engineer_features_task = PythonOperator(
        task_id='engineer_features',
        python_callable=engineer_training_features,
        provide_context=True
    )

    # Task 5: Train model
    def train_ml_model(**context):
        """
        Train ML model

        Logs to MLflow for experiment tracking
        """
        features_path = context['task_instance'].xcom_pull(
            task_ids='engineer_features',
            key='features_path'
        )

        # TODO: Train model
        model, metrics, artifacts = train_model(
            features_path,
            model_config=MODEL_CONFIG,
            mlflow_tracking_uri='http://mlflow:5000',
            experiment_name='fraud_detection'
        )

        # TODO: Save model path to XCom
        model_path = artifacts['model_path']
        context['task_instance'].xcom_push(key='model_path', value=model_path)
        context['task_instance'].xcom_push(key='metrics', value=metrics)

        return model_path

    train_model_task = PythonOperator(
        task_id='train_model',
        python_callable=train_ml_model,
        provide_context=True,
        pool='gpu_pool',  # Limit concurrent GPU tasks
        priority_weight=10  # Higher priority than other tasks
    )

    # Task 6: Evaluate model
    def evaluate_ml_model(**context):
        """
        Evaluate model on hold-out set

        Compare to champion model (current production model)
        """
        model_path = context['task_instance'].xcom_pull(
            task_ids='train_model',
            key='model_path'
        )

        # TODO: Evaluate model
        eval_results = evaluate_model(
            model_path,
            test_data_path=MODEL_CONFIG['data_path'],
            metrics=['auc', 'precision', 'recall', 'f1']
        )

        # TODO: Compare to champion model
        champion_auc = Variable.get('fraud_detection_champion_auc', default_var=0.80)
        challenger_auc = eval_results['auc']

        print(f"Champion AUC: {champion_auc}")
        print(f"Challenger AUC: {challenger_auc}")

        # TODO: Decide if should deploy
        should_deploy = challenger_auc >= MODEL_CONFIG['min_auc_threshold']

        context['task_instance'].xcom_push(key='should_deploy', value=should_deploy)
        context['task_instance'].xcom_push(key='eval_results', value=eval_results)

        return should_deploy

    evaluate_model_task = PythonOperator(
        task_id='evaluate_model',
        python_callable=evaluate_ml_model,
        provide_context=True
    )

    # Task 7: Register model (if evaluation passed)
    def register_ml_model(**context):
        """
        Register model in MLflow Model Registry

        Tag as "staging" for review before production
        """
        should_deploy = context['task_instance'].xcom_pull(
            task_ids='evaluate_model',
            key='should_deploy'
        )

        if not should_deploy:
            print("⚠️ Model did not pass evaluation criteria. Skipping registration.")
            return None

        model_path = context['task_instance'].xcom_pull(
            task_ids='train_model',
            key='model_path'
        )
        metrics = context['task_instance'].xcom_pull(
            task_ids='train_model',
            key='metrics'
        )

        # TODO: Register in MLflow
        from mlflow.tracking import MlflowClient
        client = MlflowClient(tracking_uri='http://mlflow:5000')

        # Create model version
        model_version = client.create_model_version(
            name=MODEL_CONFIG['model_name'],
            source=model_path,
            run_id=context['task_instance'].xcom_pull(task_ids='train_model', key='run_id'),
            tags={
                'execution_date': context['ds'],
                'auc': str(metrics['auc'])
            }
        )

        # Transition to staging
        client.transition_model_version_stage(
            name=MODEL_CONFIG['model_name'],
            version=model_version.version,
            stage='Staging'
        )

        context['task_instance'].xcom_push(key='model_version', value=model_version.version)
        return model_version.version

    register_model_task = PythonOperator(
        task_id='register_model',
        python_callable=register_ml_model,
        provide_context=True
    )

    # Task 8: Send success notification
    send_notification = BashOperator(
        task_id='send_notification',
        bash_command='''
        curl -X POST {{ var.value.slack_webhook_url }} \
        -H 'Content-Type: application/json' \
        -d '{
            "text": "✅ Fraud detection model training completed successfully!\\nAUC: {{ task_instance.xcom_pull(task_ids=\"evaluate_model\", key=\"eval_results\")[\"auc\"] }}\\nModel version: {{ task_instance.xcom_pull(task_ids=\"register_model\", key=\"model_version\") }}"
        }'
        '''
    )

    # Define dependencies
    wait_for_features >> load_data_task >> validate_data_task >> engineer_features_task
    engineer_features_task >> train_model_task >> evaluate_model_task >> register_model_task
    register_model_task >> send_notification
```

**验收标准：**
- [ ] DAG 端到端执行成功。
- [ ] 任务依赖正确。
- [ ] 使用 XCom 传递数据。
- [ ] 重试逻辑正常工作。
- [ ] 失败时告警。

---

### 任务 3：自定义 Operator（6–7 小时）

为 ML 任务构建自定义 Operator。

```python
# plugins/operators/data_validation_operator.py

from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
import pandas as pd
import json
from typing import Dict, List

class DataValidationOperator(BaseOperator):
    """
    Custom operator for data validation

    Validates:
    - Schema (column names, types)
    - Statistical properties (mean, std, percentiles)
    - Data quality (missing values, duplicates)
    - Freshness (timestamp within acceptable range)
    """

    @apply_defaults
    def __init__(
        self,
        data_path: str,
        schema_path: str,
        validation_rules_path: str,
        fail_on_error: bool = True,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.data_path = data_path
        self.schema_path = schema_path
        self.validation_rules_path = validation_rules_path
        self.fail_on_error = fail_on_error

    def execute(self, context):
        """Execute validation"""
        self.log.info(f"Validating data at {self.data_path}")

        # TODO: Load data
        df = pd.read_parquet(self.data_path)

        # TODO: Load expected schema
        with open(self.schema_path) as f:
            expected_schema = json.load(f)

        # TODO: Load validation rules
        with open(self.validation_rules_path) as f:
            import yaml
            rules = yaml.safe_load(f)

        # TODO: Run validations
        errors = []

        # Schema validation
        schema_errors = self._validate_schema(df, expected_schema)
        errors.extend(schema_errors)

        # Statistical validation
        stats_errors = self._validate_statistics(df, rules.get('statistics', {}))
        errors.extend(stats_errors)

        # Quality validation
        quality_errors = self._validate_quality(df, rules.get('quality', {}))
        errors.extend(quality_errors)

        # TODO: Return results
        if errors:
            error_msg = f"Validation failed with {len(errors)} errors: {errors}"
            self.log.error(error_msg)
            if self.fail_on_error:
                raise ValueError(error_msg)

        self.log.info("✅ Data validation passed")
        return {
            'passed': len(errors) == 0,
            'errors': errors,
            'row_count': len(df),
            'column_count': len(df.columns)
        }

    def _validate_schema(self, df: pd.DataFrame, expected_schema: Dict) -> List[str]:
        """Validate schema matches expected"""
        errors = []

        # Check columns exist
        expected_columns = set(expected_schema['columns'].keys())
        actual_columns = set(df.columns)

        missing = expected_columns - actual_columns
        extra = actual_columns - expected_columns

        if missing:
            errors.append(f"Missing columns: {missing}")
        if extra:
            errors.append(f"Extra columns: {extra}")

        # Check data types
        for col, expected_type in expected_schema['columns'].items():
            if col in df.columns:
                actual_type = str(df[col].dtype)
                if actual_type != expected_type:
                    errors.append(f"Column {col}: expected {expected_type}, got {actual_type}")

        return errors

    def _validate_statistics(self, df: pd.DataFrame, rules: Dict) -> List[str]:
        """Validate statistical properties"""
        errors = []

        for col, col_rules in rules.items():
            if col not in df.columns:
                continue

            # Check min/max
            if 'min' in col_rules and df[col].min() < col_rules['min']:
                errors.append(f"{col}: min {df[col].min()} < {col_rules['min']}")
            if 'max' in col_rules and df[col].max() > col_rules['max']:
                errors.append(f"{col}: max {df[col].max()} > {col_rules['max']}")

        return errors

    def _validate_quality(self, df: pd.DataFrame, rules: Dict) -> List[str]:
        """Validate data quality"""
        errors = []

        # Check missing values
        max_missing_pct = rules.get('max_missing_percent', 0.05)
        for col in df.columns:
            missing_pct = df[col].isna().mean()
            if missing_pct > max_missing_pct:
                errors.append(f"{col}: {missing_pct:.2%} missing > {max_missing_pct:.2%}")

        # Check duplicates
        max_duplicate_pct = rules.get('max_duplicate_percent', 0.01)
        duplicate_pct = df.duplicated().mean()
        if duplicate_pct > max_duplicate_pct:
            errors.append(f"Duplicates: {duplicate_pct:.2%} > {max_duplicate_pct:.2%}")

        return errors
```

```python
# plugins/operators/model_training_operator.py

from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
import mlflow
import mlflow.sklearn
from typing import Dict, Any

class ModelTrainingOperator(BaseOperator):
    """
    Custom operator for model training

    Integrates with MLflow for experiment tracking
    """

    @apply_defaults
    def __init__(
        self,
        model_config: Dict[str, Any],
        data_path: str,
        mlflow_tracking_uri: str,
        experiment_name: str,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.model_config = model_config
        self.data_path = data_path
        self.mlflow_tracking_uri = mlflow_tracking_uri
        self.experiment_name = experiment_name

    def execute(self, context):
        """Train model"""
        self.log.info(f"Training {self.model_config['model_type']} model")

        # TODO: Set up MLflow
        mlflow.set_tracking_uri(self.mlflow_tracking_uri)
        mlflow.set_experiment(self.experiment_name)

        with mlflow.start_run(run_name=f"run_{context['ds']}"):
            # TODO: Log parameters
            mlflow.log_params(self.model_config)

            # TODO: Load data and train
            # (Implementation depends on model type)

            # TODO: Log metrics
            metrics = {'auc': 0.87, 'precision': 0.82, 'recall': 0.91}
            mlflow.log_metrics(metrics)

            # TODO: Log model
            # mlflow.sklearn.log_model(model, "model")

            run_id = mlflow.active_run().info.run_id

        self.log.info(f"Training complete. MLflow run: {run_id}")
        return {'run_id': run_id, 'metrics': metrics}
```

**验收标准：**
- [ ] 自定义 Operator 在 DAG 中正常工作。
- [ ] 日志记录正确。
- [ ] 集成 MLflow。
- [ ] 参数可配置。
- [ ] 错误处理。

---

### 任务 4：动态 DAG 生成（5–6 小时）

从配置动态生成 DAG。

```python
# airflow/dags/dynamic_model_dags.py

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
from datetime import timedelta
import yaml
import glob

# Load all model configs
model_configs = []
for config_file in glob.glob('/opt/airflow/config/model_configs/*.yaml'):
    with open(config_file) as f:
        config = yaml.safe_load(f)
        model_configs.append(config)

# Generate one DAG per model
for model_config in model_configs:
    dag_id = f"ml_training_{model_config['model_name']}"

    default_args = {
        'owner': 'ml-platform',
        'retries': model_config.get('retries', 3),
        'retry_delay': timedelta(minutes=5),
    }

    # Create DAG
    dag = DAG(
        dag_id=dag_id,
        default_args=default_args,
        description=f"Train {model_config['model_name']} model",
        schedule_interval=model_config.get('schedule', '0 2 * * *'),
        start_date=days_ago(1),
        catchup=False,
        tags=['ml', 'training', model_config['model_name']],
    )

    # Add tasks (same structure as manual DAG)
    with dag:
        # TODO: Add tasks dynamically
        pass

    # Register DAG in globals (Airflow discovers it)
    globals()[dag_id] = dag
```

**模型配置示例：**

```yaml
# config/model_configs/fraud_detection.yaml

model_name: fraud_detection
model_type: xgboost
schedule: "0 2 * * *"  # Daily at 2 AM
retries: 3

data:
  source: s3://ml-data/transactions/
  target_column: is_fraud
  features:
    - amount
    - merchant_category
    - transaction_count_1h
    - transaction_avg_24h

training:
  hyperparameters:
    max_depth: 6
    learning_rate: 0.1
    n_estimators: 100
  validation_split: 0.2

deployment:
  min_auc_threshold: 0.85
  endpoint_name: fraud-detection-api
```

**验收标准：**
- [ ] 从配置文件生成 DAG。
- [ ] 每个模型一个 DAG。
- [ ] 任务参数化。
- [ ] 配置验证。
- [ ] 易于添加新模型。

---

### 任务 5：Sensor 与 Hook（4–5 小时）

构建用于外部依赖的 Sensor。

```python
# plugins/sensors/s3_data_sensor.py

from airflow.sensors.base import BaseSensorOperator
from airflow.utils.decorators import apply_defaults
import boto3
from datetime import datetime, timedelta

class S3DataSensor(BaseSensorOperator):
    """
    Sensor that waits for data to appear in S3

    Checks for file existence and optionally validates:
    - File size > min_size_mb
    - File modified within last X hours (freshness)
    """

    @apply_defaults
    def __init__(
        self,
        bucket: str,
        key: str,
        min_size_mb: float = 0,
        max_age_hours: int = 24,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.bucket = bucket
        self.key = key
        self.min_size_mb = min_size_mb
        self.max_age_hours = max_age_hours

    def poke(self, context):
        """
        Check if data exists and meets criteria

        Returns True when data ready, False otherwise
        """
        self.log.info(f"Checking for s3://{self.bucket}/{self.key}")

        s3 = boto3.client('s3')

        try:
            # TODO: Check if object exists
            response = s3.head_object(Bucket=self.bucket, Key=self.key)

            # TODO: Validate size
            size_mb = response['ContentLength'] / (1024 * 1024)
            if size_mb < self.min_size_mb:
                self.log.info(f"File too small: {size_mb:.2f} MB < {self.min_size_mb} MB")
                return False

            # TODO: Validate freshness
            last_modified = response['LastModified']
            age = datetime.now(last_modified.tzinfo) - last_modified
            if age > timedelta(hours=self.max_age_hours):
                self.log.warning(f"File too old: {age} > {self.max_age_hours} hours")
                return False

            self.log.info(f"✅ Data ready: {size_mb:.2f} MB, modified {age} ago")
            return True

        except s3.exceptions.NoSuchKey:
            self.log.info("File not found yet")
            return False
```

```python
# plugins/hooks/mlflow_hook.py

from airflow.hooks.base import BaseHook
import mlflow
from mlflow.tracking import MlflowClient

class MLflowHook(BaseHook):
    """
    Hook for MLflow integration

    Provides helper methods for MLflow operations
    """

    def __init__(self, mlflow_conn_id: str = 'mlflow_default'):
        self.conn_id = mlflow_conn_id
        self.connection = self.get_connection(mlflow_conn_id)
        self.tracking_uri = self.connection.host
        self.client = MlflowClient(tracking_uri=self.tracking_uri)

    def get_best_model(self, experiment_name: str, metric: str = 'auc') -> str:
        """Get best model from experiment"""
        experiment = self.client.get_experiment_by_name(experiment_name)
        runs = self.client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=[f"metrics.{metric} DESC"],
            max_results=1
        )

        if runs:
            return runs[0].info.run_id
        return None

    def promote_model(self, model_name: str, version: str, stage: str):
        """Promote model to stage (Staging, Production)"""
        self.client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage=stage
        )
```

**验收标准：**
- [ ] S3 Sensor 等待数据就绪。
- [ ] 验证文件大小与新鲜度。
- [ ] 用于模型操作的 MLflow Hook。
- [ ] 合适的 Poke 间隔。
- [ ] 超时处理。

---

### 任务 6：监控与告警（4–5 小时）

实现监控与告警。

```python
# airflow/dags/monitoring_dag.py

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator
from datetime import timedelta

def check_dag_sla(**context):
    """
    Check if DAGs are meeting SLAs

    Alert if:
    - DAG run duration > 2 hours
    - DAG failure rate > 5%
    - Tasks stuck in queued state > 30 min
    """
    from airflow.models import DagRun, TaskInstance
    from airflow.utils.state import State
    from sqlalchemy import func

    # TODO: Query Airflow metadata database
    # TODO: Calculate SLA violations
    # TODO: Return violations for alerting

    violations = []

    # Check recent DAG runs
    recent_runs = DagRun.find(
        dag_id='ml_training_fraud_detection',
        state=State.SUCCESS,
        execution_start_date=context['execution_date'] - timedelta(days=7)
    )

    for run in recent_runs:
        duration = (run.end_date - run.start_date).total_seconds() / 3600
        if duration > 2:  # SLA: 2 hours
            violations.append(f"DAG {run.dag_id} run {run.execution_date} took {duration:.1f}h")

    return violations

with DAG(
    dag_id='monitoring_ml_pipelines',
    schedule_interval='*/30 * * * *',  # Every 30 minutes
    start_date=days_ago(1),
    catchup=False,
) as dag:

    check_sla_task = PythonOperator(
        task_id='check_sla',
        python_callable=check_dag_sla,
        provide_context=True
    )

    # Send alert if violations found
    send_alert = SlackWebhookOperator(
        task_id='send_slack_alert',
        slack_webhook_conn_id='slack_alerts',
        message="""
        ⚠️ ML Pipeline SLA Violations:
        {{ task_instance.xcom_pull(task_ids='check_sla') }}
        """,
        username='Airflow Monitoring'
    )

    check_sla_task >> send_alert
```

**验收标准：**
- [ ] 监控 DAG SLA。
- [ ] 追踪任务失败率。
- [ ] 违反目标时告警。
- [ ] 集成 Slack。
- [ ] 阈值可配置。

---

## 测试要求

```python
# tests/test_dags.py

from airflow.models import DagBag
import pytest

def test_dag_loaded():
    """Test that DAG loads without errors"""
    dagbag = DagBag(dag_folder='airflow/dags/', include_examples=False)
    assert len(dagbag.import_errors) == 0, f"DAG import errors: {dagbag.import_errors}"

def test_dag_has_tags():
    """Test DAG has proper tags"""
    dagbag = DagBag(dag_folder='airflow/dags/', include_examples=False)
    dag = dagbag.get_dag('ml_training_fraud_detection')
    assert 'ml' in dag.tags
    assert 'training' in dag.tags

def test_task_dependencies():
    """Test task dependencies are correct"""
    dagbag = DagBag(dag_folder='airflow/dags/', include_examples=False)
    dag = dagbag.get_dag('ml_training_fraud_detection')

    # Check load_data -> validate_data dependency
    load_task = dag.get_task('load_data')
    validate_task = dag.get_task('validate_data')
    assert validate_task in load_task.downstream_list
```

## 预期结果

| 指标 | 目标 | 实测 |
|---|---|---|
| **DAG 成功率** | 超过 99% | ________% |
| **调度延迟** | 低于 30 秒 | ________s |
| **SLA 违反比例** | 低于 5% | ________% |
| **告警延迟** | 低于 5 分钟 | ________min |

## 验证

提交：
1. 完整 DAG 实现。
2. 自定义 Operator 和 Sensor。
3. 动态 DAG 生成。
4. 测试套件。
5. 监控仪表盘。
6. 文档。

## 资源

- [Apache Airflow 文档](https://airflow.apache.org/docs/)
- [Airflow 最佳实践](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [MLflow 集成](https://mlflow.org/)
- [Airflow Provider](https://airflow.apache.org/docs/apache-airflow-providers/)

---

**预计完成时长：** 32–40 小时。

**实践技能：**
- 工作流编排。
- Apache Airflow DAG。
- 自定义 Operator。
- 动态 DAG 生成。
- ML 管道自动化。
- 监控与告警。

> 译注：Airflow 的 SLA、调度及 Operator API 随版本演进。XCom 宜传递小型元数据或对象存储引用，而非大型数据集；训练任务应具备幂等性，使用 Pool 等机制控制 GPU 资源。失败重试次数与总尝试次数需区分。原文示例的成功率目标存在不同口径。全部原始代码块与 TODO 保留，未实际运行。
