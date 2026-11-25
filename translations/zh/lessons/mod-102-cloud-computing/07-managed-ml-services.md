# 第 07 课：托管机器学习服务比较

**时长：** 6 小时
**难度：** 中级
**前置条件：** 第 02–04 课（AWS、GCP、Azure 机器学习基础设施）

## 学习目标

完成本课后，你将能够：

1. **比较托管机器学习平台**（SageMaker、Vertex AI、Azure ML）。
2. 为自己的使用场景**选择合适的平台**。
3. 在托管服务上**部署端到端机器学习工作流**。
4. **评估不同平台的成本与性能取舍**。
5. 利用托管服务**实施 MLOps 最佳实践**。
6. 必要时**在平台之间迁移**。
7. 有效利用**平台特有功能**。
8. 根据充分的信息**决定自建还是购买托管服务**。

---

## 目录

1. [托管机器学习平台概览](#托管机器学习平台概览)
2. [深入 AWS SageMaker](#深入-aws-sagemaker)
3. [深入 Google Vertex AI](#深入-google-vertex-ai)
4. [深入 Azure Machine Learning](#深入-azure-machine-learning)
5. [功能比较矩阵](#功能比较矩阵)
6. [成本比较](#成本比较)
7. [迁移策略](#迁移策略)
8. [自建与采购的决策框架](#自建与采购的决策框架)
9. [最佳实践](#最佳实践)
10. [动手练习](#动手练习)

---

## 托管机器学习平台概览

托管机器学习平台提供贯穿机器学习生命周期的端到端能力。

### 托管平台提供的功能

```
┌────────────────────────────────────────────────────────────────┐
│              Managed ML Platform Capabilities                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Data Preparation          Model Training         Deployment   │
│  ─────────────────          ──────────────        ──────────   │
│  • Data labeling            • Distributed         • Endpoints  │
│  • Feature engineering      • AutoML              • Batch      │
│  • Feature stores           • Hyperparameter      • Edge       │
│  • Data validation          • Experiments         • A/B test   │
│                                                                │
│  Model Management          Monitoring             MLOps        │
│  ─────────────────         ──────────             ──────       │
│  • Model registry           • Drift detection     • Pipelines  │
│  • Versioning               • Performance         • CI/CD      │
│  • Lineage                  • Explainability      • GitOps     │
│  • Governance               • Alerts              • Automation │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 平台定位

```
┌─────────────────┬──────────────────┬───────────────────┬─────────────────┐
│ Platform        │ Strength         │ Best For          │ Ideal Customer  │
├─────────────────┼──────────────────┼───────────────────┼─────────────────┤
│ AWS SageMaker   │ Ecosystem        │ AWS-native orgs   │ Enterprises     │
│                 │ Breadth          │ Full ML lifecycle │ AWS users       │
│                 │ Integrations     │ Production scale  │                 │
│                                                                           │
│ Google Vertex AI│ AutoML           │ TensorFlow users  │ Startups        │
│                 │ TPU access       │ Quick prototyping │ AI-first cos    │
│                 │ BigQuery ML      │ Data-heavy ML     │                 │
│                                                                           │
│ Azure ML        │ Enterprise       │ Microsoft shops   │ Enterprises     │
│                 │ OpenAI           │ MLOps at scale    │ Azure users     │
│                 │ Compliance       │ Regulated         │                 │
└─────────────────┴──────────────────┴───────────────────┴─────────────────┘
```

---

## 深入 AWS SageMaker

SageMaker 是 AWS 的综合托管机器学习平台。

### SageMaker 架构

```
┌────────────────────────────────────────────────────────────────┐
│                    AWS SageMaker Components                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SageMaker Studio (IDE)                                        │
│  ├── Notebooks (Jupyter)                                       │
│  ├── Experiments                                               │
│  ├── Model Registry                                            │
│  └── Pipelines (Orchestration)                                 │
│                                                                │
│  Training & Tuning                                             │
│  ├── Training Jobs (single/distributed)                        │
│  ├── Hyperparameter Tuning                                     │
│  ├── Automatic Model Tuning                                    │
│  └── Distributed Training (data/model parallelism)             │
│                                                                │
│  Deployment                                                    │
│  ├── Real-time Endpoints                                       │
│  ├── Batch Transform                                           │
│  ├── Serverless Inference                                      │
│  ├── Asynchronous Inference                                    │
│  └── Multi-Model Endpoints                                     │
│                                                                │
│  Data & Features                                               │
│  ├── Ground Truth (labeling)                                   │
│  ├── Feature Store                                             │
│  ├── Data Wrangler                                             │
│  └── Processing Jobs                                           │
│                                                                │
│  MLOps                                                         │
│  ├── Model Monitor                                             │
│  ├── Clarify (bias/explainability)                             │
│  ├── Pipelines (CI/CD)                                         │
│  └── Model Cards                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 使用 SageMaker 训练

```python
import sagemaker
from sagemaker.pytorch import PyTorch
from sagemaker import get_execution_role

# Initialize SageMaker session
sagemaker_session = sagemaker.Session()
role = get_execution_role()
bucket = sagemaker_session.default_bucket()

# Define training job
estimator = PyTorch(
    entry_point='train.py',
    source_dir='./src',
    role=role,
    instance_type='ml.p3.2xlarge',
    instance_count=1,
    framework_version='2.0.0',
    py_version='py310',
    hyperparameters={
        'epochs': 10,
        'batch-size': 32,
        'learning-rate': 0.001
    },
    output_path=f's3://{bucket}/models',
    code_location=f's3://{bucket}/code',
    metric_definitions=[
        {'Name': 'train:loss', 'Regex': 'Train Loss: ([0-9.]+)'},
        {'Name': 'validation:accuracy', 'Regex': 'Val Accuracy: ([0-9.]+)'}
    ],
    enable_sagemaker_metrics=True,
    debugger_hook_config=False  # Optional: disable debugger for cost
)

# Train model
estimator.fit({
    'training': f's3://{bucket}/data/train',
    'validation': f's3://{bucket}/data/val'
})

print(f"Model artifacts: {estimator.model_data}")
```

### 使用 SageMaker 部署

```python
from sagemaker.pytorch import PyTorchModel

# Create model
model = PyTorchModel(
    model_data=estimator.model_data,
    role=role,
    entry_point='inference.py',
    source_dir='./src',
    framework_version='2.0.0',
    py_version='py310'
)

# Deploy to real-time endpoint
predictor = model.deploy(
    instance_type='ml.g4dn.xlarge',
    initial_instance_count=2,
    endpoint_name='resnet50-endpoint'
)

# Make prediction
result = predictor.predict(data={'image': image_bytes})
print(result)

# Auto-scaling
import boto3

client = boto3.client('application-autoscaling')

# Register scalable target
client.register_scalable_target(
    ServiceNamespace='sagemaker',
    ResourceId=f'endpoint/{predictor.endpoint_name}/variant/AllTraffic',
    ScalableDimension='sagemaker:variant:DesiredInstanceCount',
    MinCapacity=2,
    MaxCapacity=10
)

# Create scaling policy
client.put_scaling_policy(
    PolicyName='sagemaker-autoscale',
    ServiceNamespace='sagemaker',
    ResourceId=f'endpoint/{predictor.endpoint_name}/variant/AllTraffic',
    ScalableDimension='sagemaker:variant:DesiredInstanceCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'TargetValue': 70.0,
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'SageMakerVariantInvocationsPerInstance'
        },
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60
    }
)
```

### SageMaker Pipelines（MLOps）

```python
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.steps import ProcessingStep, TrainingStep
from sagemaker.workflow.parameters import ParameterInteger, ParameterString

# Define parameters
instance_count = ParameterInteger(name="InstanceCount", default_value=1)
model_approval_status = ParameterString(name="ModelApprovalStatus", default_value="PendingManualApproval")

# Data processing step
from sagemaker.processing import ScriptProcessor

processor = ScriptProcessor(
    role=role,
    image_uri='763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-training:2.0.0-cpu-py310',
    instance_type='ml.m5.xlarge',
    instance_count=1,
    command=['python3']
)

processing_step = ProcessingStep(
    name='PreprocessData',
    processor=processor,
    inputs=[
        ProcessingInput(source=f's3://{bucket}/raw-data/', destination='/opt/ml/processing/input')
    ],
    outputs=[
        ProcessingOutput(output_name='train', source='/opt/ml/processing/output/train'),
        ProcessingOutput(output_name='val', source='/opt/ml/processing/output/val')
    ],
    code='preprocessing.py'
)

# Training step
training_step = TrainingStep(
    name='TrainModel',
    estimator=estimator,
    inputs={
        'training': training_input,
        'validation': validation_input
    }
)

# Model evaluation step
from sagemaker.workflow.steps import ProcessingStep
from sagemaker.processing import ScriptProcessor

evaluation_processor = ScriptProcessor(
    role=role,
    image_uri='763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-training:2.0.0-cpu-py310',
    instance_type='ml.m5.xlarge',
    instance_count=1,
    command=['python3']
)

evaluation_step = ProcessingStep(
    name='EvaluateModel',
    processor=evaluation_processor,
    inputs=[
        ProcessingInput(
            source=training_step.properties.ModelArtifacts.S3ModelArtifacts,
            destination='/opt/ml/processing/model'
        ),
        ProcessingInput(
            source=f's3://{bucket}/data/test',
            destination='/opt/ml/processing/test'
        )
    ],
    outputs=[
        ProcessingOutput(output_name='evaluation', source='/opt/ml/processing/evaluation')
    ],
    code='evaluation.py'
)

# Create pipeline
pipeline = Pipeline(
    name='MLPipeline',
    parameters=[instance_count, model_approval_status],
    steps=[processing_step, training_step, evaluation_step]
)

# Execute pipeline
pipeline.upsert(role_arn=role)
execution = pipeline.start()
execution.wait()
```

### SageMaker Feature Store

```python
from sagemaker.feature_store.feature_group import FeatureGroup
import pandas as pd

# Create feature group
feature_group = FeatureGroup(
    name='user-features',
    sagemaker_session=sagemaker_session
)

# Define schema
feature_group.load_feature_definitions(data_frame=features_df)

# Create feature group
feature_group.create(
    s3_uri=f's3://{bucket}/feature-store',
    record_identifier_name='user_id',
    event_time_feature_name='timestamp',
    role_arn=role,
    enable_online_store=True
)

# Ingest features
feature_group.ingest(data_frame=features_df, max_workers=3, wait=True)

# Query features (online)
record = feature_group.get_record(record_identifier_value_as_string='user_123')

# Query features (offline, for training)
query = feature_group.athena_query()
query.run(
    query_string='''
        SELECT * FROM "user-features"
        WHERE timestamp > timestamp '2024-01-01 00:00:00'
    ''',
    output_location=f's3://{bucket}/queries/'
)
query.wait()
df = query.as_dataframe()
```

---

## 深入 Google Vertex AI

Vertex AI 是 Google Cloud 的统一机器学习平台。

### Vertex AI 架构

```
┌────────────────────────────────────────────────────────────────┐
│                  Google Vertex AI Components                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Vertex AI Workbench (Notebooks)                               │
│  ├── Managed Notebooks                                         │
│  ├── User-Managed Notebooks                                    │
│  └── Colab Enterprise                                          │
│                                                                │
│  Training                                                      │
│  ├── Custom Training                                           │
│  ├── AutoML                                                    │
│  ├── Hyperparameter Tuning                                     │
│  └── Training Pipelines                                        │
│                                                                │
│  Prediction                                                    │
│  ├── Online Prediction (endpoints)                             │
│  ├── Batch Prediction                                          │
│  └── Model Monitoring                                          │
│                                                                │
│  Feature Store                                                 │
│  ├── Online serving                                            │
│  ├── Offline serving                                           │
│  └── Feature registry                                          │
│                                                                │
│  ML Metadata                                                   │
│  ├── Model Registry                                            │
│  ├── Experiment Tracking                                       │
│  ├── Artifact Lineage                                          │
│  └── Model Evaluation                                          │
│                                                                │
│  Pipelines (Kubeflow/TFX)                                      │
│  ├── Pipeline Orchestration                                    │
│  ├── Components                                                │
│  └── Scheduling                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 使用 Vertex AI 训练

```python
from google.cloud import aiplatform

aiplatform.init(
    project='my-project-id',
    location='us-central1',
    staging_bucket='gs://my-bucket'
)

# Custom training job
job = aiplatform.CustomTrainingJob(
    display_name='resnet50-training',
    script_path='train.py',
    container_uri='gcr.io/cloud-aiplatform/training/pytorch-gpu.1-13:latest',
    requirements=['torchvision', 'wandb'],
    model_serving_container_image_uri='gcr.io/cloud-aiplatform/prediction/pytorch-gpu.1-13:latest'
)

# Run training
model = job.run(
    dataset=dataset,
    replica_count=1,
    machine_type='n1-standard-8',
    accelerator_type='NVIDIA_TESLA_V100',
    accelerator_count=1,
    args=[
        '--epochs', '100',
        '--batch-size', '64',
        '--learning-rate', '0.001'
    ],
    environment_variables={
        'WANDB_API_KEY': 'xxx'
    },
    model_display_name='resnet50-v1'
)

print(f"Model resource name: {model.resource_name}")
```

### Vertex AI AutoML

```python
# Create dataset
dataset = aiplatform.ImageDataset.create(
    display_name='my-image-dataset',
    gcs_source='gs://my-bucket/dataset.csv',
    import_schema_uri=aiplatform.schema.dataset.ioformat.image.single_label_classification
)

# Train AutoML model
job = aiplatform.AutoMLImageTrainingJob(
    display_name='automl-image-classification',
    prediction_type='classification'
)

model = job.run(
    dataset=dataset,
    model_display_name='automl-resnet',
    training_fraction_split=0.8,
    validation_fraction_split=0.1,
    test_fraction_split=0.1,
    budget_milli_node_hours=8000,  # 8 node hours
    disable_early_stopping=False
)

# Evaluate
eval_metrics = model.evaluate()
print(f"AutoML Accuracy: {eval_metrics['auPrc']}")
```

### 使用 Vertex AI 部署

```python
# Deploy model to endpoint
endpoint = model.deploy(
    machine_type='n1-standard-4',
    min_replica_count=2,
    max_replica_count=10,
    accelerator_type='NVIDIA_TESLA_T4',
    accelerator_count=1,
    traffic_split={'0': 100},
    deployed_model_display_name='resnet50-v1'
)

# Make prediction
instances = [{'image_bytes': {'b64': base64_encoded_image}}]
prediction = endpoint.predict(instances=instances)
print(prediction.predictions)

# Update traffic split (A/B testing)
endpoint.update(
    traffic_split={
        'model-v1': 90,
        'model-v2': 10
    }
)
```

### Vertex AI Pipelines

```python
from kfp.v2 import dsl
from kfp.v2.dsl import component, Output, Dataset, Model

@component(
    base_image='python:3.9',
    packages_to_install=['pandas', 'scikit-learn']
)
def preprocess_data(
    input_data: str,
    output_data: Output[Dataset]
):
    import pandas as pd

    # Load and preprocess
    df = pd.read_csv(input_data)
    # ... preprocessing logic ...

    # Save
    df.to_csv(output_data.path, index=False)

@component(
    base_image='gcr.io/cloud-aiplatform/training/pytorch-gpu.1-13:latest'
)
def train_model(
    training_data: Dataset,
    model_output: Output[Model],
    epochs: int = 10
):
    import torch
    # ... training logic ...
    torch.save(model, model_output.path)

@dsl.pipeline(
    name='ml-training-pipeline',
    description='Complete ML training pipeline'
)
def ml_pipeline(
    data_uri: str,
    epochs: int = 10
):
    preprocess_task = preprocess_data(input_data=data_uri)

    train_task = train_model(
        training_data=preprocess_task.outputs['output_data'],
        epochs=epochs
    )

# Compile and run
from kfp.v2 import compiler

compiler.Compiler().compile(
    pipeline_func=ml_pipeline,
    package_path='pipeline.json'
)

# Submit to Vertex AI
job = aiplatform.PipelineJob(
    display_name='ml-pipeline-run',
    template_path='pipeline.json',
    parameter_values={
        'data_uri': 'gs://my-bucket/data.csv',
        'epochs': 20
    }
)

job.run()
```

---

## 深入 Azure Machine Learning

Azure ML 是 Microsoft 的企业机器学习平台。

### Azure ML 架构

```
┌────────────────────────────────────────────────────────────────┐
│               Azure Machine Learning Components                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Azure ML Studio (Web UI)                                      │
│  ├── Designer (drag-and-drop)                                  │
│  ├── Automated ML                                              │
│  ├── Notebooks                                                 │
│  └── Data Labeling                                             │
│                                                                │
│  Compute                                                       │
│  ├── Compute Instances (dev/test)                              │
│  ├── Compute Clusters (training)                               │
│  ├── Inference Clusters (AKS)                                  │
│  └── Attached Compute (Databricks, Synapse)                    │
│                                                                │
│  Assets                                                        │
│  ├── Datasets                                                  │
│  ├── Models                                                    │
│  ├── Environments                                              │
│  └── Components                                                │
│                                                                │
│  Endpoints                                                     │
│  ├── Real-time (managed/AKS)                                   │
│  ├── Batch                                                     │
│  └── Pipeline endpoints                                        │
│                                                                │
│  MLOps                                                         │
│  ├── Pipelines                                                 │
│  ├── Experiments                                               │
│  ├── Model Registry                                            │
│  └── Responsible AI Dashboard                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 使用 Azure ML 训练

```python
from azureml.core import Workspace, Experiment, ScriptRunConfig, Environment
from azureml.core.compute import ComputeTarget, AmlCompute

# Connect to workspace
ws = Workspace.from_config()

# Create compute cluster
compute_name = 'gpu-cluster'
compute_config = AmlCompute.provisioning_configuration(
    vm_size='Standard_NC6s_v3',
    max_nodes=4,
    idle_seconds_before_scaledown=300
)
compute_target = ComputeTarget.create(ws, compute_name, compute_config)
compute_target.wait_for_completion(show_output=True)

# Create environment
env = Environment.from_conda_specification(
    name='pytorch-env',
    file_path='environment.yml'
)

# Configure training
config = ScriptRunConfig(
    source_directory='./src',
    script='train.py',
    arguments=[
        '--data-path', ws.datasets['imagenet'].as_mount(),
        '--epochs', 100,
        '--batch-size', 64
    ],
    compute_target=compute_target,
    environment=env
)

# Submit experiment
experiment = Experiment(ws, 'resnet-training')
run = experiment.submit(config)
run.wait_for_completion(show_output=True)

# Register model
model = run.register_model(
    model_name='resnet50',
    model_path='outputs/model.pth',
    description='ResNet-50 trained on ImageNet',
    tags={'framework': 'pytorch', 'task': 'classification'}
)
```

### 使用 Azure ML 部署

```python
from azureml.core.model import InferenceConfig, Model
from azureml.core.webservice import AciWebservice, AksWebservice

# Create inference config
inference_config = InferenceConfig(
    entry_script='score.py',
    environment=env
)

# Deploy to ACI (testing)
aci_config = AciWebservice.deploy_configuration(
    cpu_cores=2,
    memory_gb=4,
    auth_enabled=True
)

service = Model.deploy(
    workspace=ws,
    name='resnet50-aci',
    models=[model],
    inference_config=inference_config,
    deployment_config=aci_config
)

service.wait_for_deployment(show_output=True)

# Deploy to AKS (production)
aks_target = ComputeTarget(ws, 'aks-cluster')

aks_config = AksWebservice.deploy_configuration(
    autoscale_enabled=True,
    autoscale_min_replicas=2,
    autoscale_max_replicas=10,
    autoscale_target_utilization=70,
    cpu_cores=2,
    memory_gb=4,
    enable_app_insights=True,
    collect_model_data=True
)

service = Model.deploy(
    workspace=ws,
    name='resnet50-production',
    models=[model],
    inference_config=inference_config,
    deployment_config=aks_config,
    deployment_target=aks_target
)

service.wait_for_deployment(show_output=True)

# Test endpoint
import requests
import json

headers = {'Content-Type': 'application/json'}
headers['Authorization'] = f'Bearer {service.get_keys()[0]}'

data = {'data': [[1, 2, 3, 4, 5]]}
response = requests.post(service.scoring_uri, json=data, headers=headers)
print(response.json())
```

### Azure ML Pipelines

```python
from azureml.pipeline.core import Pipeline, PipelineData
from azureml.pipeline.steps import PythonScriptStep

# Define pipeline data
processed_data = PipelineData('processed', datastore=ws.get_default_datastore())
trained_model = PipelineData('model', datastore=ws.get_default_datastore())

# Data processing step
preprocess_step = PythonScriptStep(
    name='preprocess',
    script_name='preprocess.py',
    arguments=['--output', processed_data],
    outputs=[processed_data],
    compute_target=compute_target,
    source_directory='./src'
)

# Training step
train_step = PythonScriptStep(
    name='train',
    script_name='train.py',
    arguments=[
        '--input', processed_data,
        '--output', trained_model
    ],
    inputs=[processed_data],
    outputs=[trained_model],
    compute_target=compute_target,
    source_directory='./src'
)

# Create and publish pipeline
pipeline = Pipeline(workspace=ws, steps=[preprocess_step, train_step])
published_pipeline = pipeline.publish(name='training-pipeline-v1')

# Run pipeline
from azureml.pipeline.core import PipelineEndpoint

pipeline_endpoint = PipelineEndpoint.publish(
    workspace=ws,
    name='training-endpoint',
    pipeline=pipeline,
    description='Training pipeline endpoint'
)

# Trigger pipeline
pipeline_run = pipeline_endpoint.submit(experiment_name='pipeline-run')
```

---

## 功能比较矩阵

```
┌─────────────────────────┬────────────────┬────────────────┬────────────────┐
│ Feature                 │ SageMaker      │ Vertex AI      │ Azure ML       │
├─────────────────────────┼────────────────┼────────────────┼────────────────┤
│ Notebooks               │ Studio         │ Workbench      │ Compute Inst   │
│ Rating                  │ ★★★★★          │ ★★★★☆          │ ★★★★☆          │
│                         │                │                │                │
│ AutoML                  │ Autopilot      │ AutoML (best)  │ Automated ML   │
│ Rating                  │ ★★★★☆          │ ★★★★★          │ ★★★★☆          │
│                         │                │                │                │
│ Distributed Training    │ Native         │ Native         │ Native         │
│ Rating                  │ ★★★★★          │ ★★★★☆          │ ★★★★☆          │
│                         │                │                │                │
│ Model Registry          │ Yes            │ Yes            │ Yes            │
│ Rating                  │ ★★★★★          │ ★★★★☆          │ ★★★★★          │
│                         │                │                │                │
│ Feature Store           │ Yes            │ Yes            │ Limited        │
│ Rating                  │ ★★★★★          │ ★★★★★          │ ★★★☆☆          │
│                         │                │                │                │
│ Pipelines/MLOps         │ Pipelines      │ Kubeflow/TFX   │ Pipelines      │
│ Rating                  │ ★★★★★          │ ★★★★☆          │ ★★★★★          │
│                         │                │                │                │
│ Real-time Inference     │ Endpoints      │ Endpoints      │ Endpoints      │
│ Rating                  │ ★★★★★          │ ★★★★☆          │ ★★★★★          │
│                         │                │                │                │
│ Batch Inference         │ Transform      │ Batch Pred     │ Batch Endp     │
│ Rating                  │ ★★★★★          │ ★★★★★          │ ★★★★☆          │
│                         │                │                │                │
│ Model Monitoring        │ Model Monitor  │ Model Monitor  │ Data Drift     │
│ Rating                  │ ★★★★★          │ ★★★★☆          │ ★★★★☆          │
│                         │                │                │                │
│ Explainability          │ Clarify        │ Explainable AI │ Responsible AI │
│ Rating                  │ ★★★★★          │ ★★★★★          │ ★★★★★          │
│                         │                │                │                │
│ Edge Deployment         │ IoT Greengrass │ Limited        │ IoT Edge       │
│ Rating                  │ ★★★★★          │ ★★★☆☆          │ ★★★★★          │
│                         │                │                │                │
│ Enterprise Features     │ Strong         │ Good           │ Strongest      │
│ (Compliance, Gov)       │ ★★★★☆          │ ★★★☆☆          │ ★★★★★          │
│                         │                │                │                │
│ Open Source Integration │ Good           │ Best           │ Good           │
│ Rating                  │ ★★★★☆          │ ★★★★★          │ ★★★★☆          │
└─────────────────────────┴────────────────┴────────────────┴────────────────┘
```

---

## 成本比较

### 训练成本（GPU 上运行 100 小时）

```
Scenario: Train ResNet-50 for 100 hours on V100 GPU

┌──────────────────┬─────────────────────┬──────────────────────┐
│ Platform         │ Instance Type       │ Total Cost           │
├──────────────────┼─────────────────────┼──────────────────────┤
│ AWS SageMaker    │ ml.p3.2xlarge       │ $382.50              │
│                  │ (1x V100, $3.825/hr)│ (includes mgmt fee)  │
│                                                                │
│ Google Vertex AI │ n1-standard-8 + V100│ $306.00              │
│                  │ ($3.06/hr)          │ (no mgmt fee)        │
│                                                                │
│ Azure ML         │ Standard_NC6s_v3    │ $306.00              │
│                  │ (1x V100, $3.06/hr) │ (no mgmt fee)        │
│                                                                │
│ DIY (EC2)        │ p3.2xlarge          │ $306.00              │
│                  │ ($3.06/hr)          │ (no management)      │
└──────────────────┴─────────────────────┴──────────────────────┘

Winner: Vertex AI / Azure ML (tied, $306)
Note: SageMaker adds ~25% premium for managed service
```

### 推理成本（每月 100 万次请求）

```
Scenario: Serve model with 1M requests/month, 50ms avg latency

┌──────────────────┬─────────────────────┬──────────────────────┐
│ Platform         │ Configuration       │ Monthly Cost         │
├──────────────────┼─────────────────────┼──────────────────────┤
│ AWS SageMaker    │ 2x ml.m5.xlarge     │ $350/month           │
│                  │ ($0.24/hr each)     │ + $0.00001/request   │
│                  │                     │ = $350 + $10 = $360  │
│                                                                │
│ Google Vertex AI │ 2x n1-standard-4    │ $278/month           │
│                  │ ($0.19/hr each)     │ + $0.000005/pred     │
│                  │                     │ = $278 + $5 = $283   │
│                                                                │
│ Azure ML         │ 2x Standard_D4s_v3  │ $281/month           │
│                  │ ($0.192/hr each)    │ + $0.000001/txn      │
│                  │                     │ = $281 + $1 = $282   │
│                                                                │
│ DIY (AKS/EKS)    │ 2x m5.xlarge        │ $280/month           │
│                  │ ($0.192/hr each)    │ (no per-request fee) │
└──────────────────┴─────────────────────┴──────────────────────┘

Winner: Azure ML ($282)
Note: At higher volumes, DIY becomes more cost-effective
```

### 存储成本（1TB 数据及模型）

```
┌──────────────────┬─────────────────────┬──────────────────────┐
│ Platform         │ Storage Type        │ Monthly Cost         │
├──────────────────┼─────────────────────┼──────────────────────┤
│ AWS SageMaker    │ S3 Standard         │ $23/month            │
│                  │ ($0.023/GB)         │                      │
│                                                                │
│ Google Vertex AI │ GCS Standard        │ $20/month            │
│                  │ ($0.020/GB)         │                      │
│                                                                │
│ Azure ML         │ Blob Hot            │ $18.40/month         │
│                  │ ($0.0184/GB)        │                      │
└──────────────────┴─────────────────────┴──────────────────────┘

Winner: Azure Blob Storage ($18.40)
```

---

## 迁移策略

### 从 SageMaker 迁移至 Vertex AI

```python
"""
Migration Checklist: SageMaker → Vertex AI

1. Training Code
   - Change: sagemaker.pytorch.PyTorch → aiplatform.CustomTrainingJob
   - Environment variables: SM_* → AIP_*
   - Model output: /opt/ml/model → /gcs/bucket/

2. Data
   - S3 → GCS (use gsutil or Transfer Service)
   - SageMaker datasets → Vertex AI datasets

3. Models
   - Download from S3, upload to GCS
   - Re-register in Vertex AI Model Registry

4. Endpoints
   - SageMaker endpoint → Vertex AI endpoint
   - Update inference code (boto3 → aiplatform)

5. Pipelines
   - SageMaker Pipelines → Kubeflow Pipelines
   - Significant rewrite required

Estimated effort: 2-4 weeks for medium project
"""

# Example: Unified inference client
class UnifiedMLClient:
    def __init__(self, platform='sagemaker'):
        self.platform = platform

        if platform == 'sagemaker':
            import boto3
            self.client = boto3.client('sagemaker-runtime')
        elif platform == 'vertex':
            from google.cloud import aiplatform
            aiplatform.init(project='my-project')
            self.endpoint = aiplatform.Endpoint('projects/123/endpoints/456')
        elif platform == 'azure':
            from azureml.core import Workspace
            ws = Workspace.from_config()
            self.service = ws.webservices['resnet50']

    def predict(self, data):
        if self.platform == 'sagemaker':
            response = self.client.invoke_endpoint(
                EndpointName='my-endpoint',
                Body=json.dumps(data),
                ContentType='application/json'
            )
            return json.loads(response['Body'].read())

        elif self.platform == 'vertex':
            instances = [{'data': data}]
            return self.endpoint.predict(instances=instances).predictions

        elif self.platform == 'azure':
            import requests
            headers = {'Content-Type': 'application/json'}
            response = requests.post(
                self.service.scoring_uri,
                json={'data': data},
                headers=headers
            )
            return response.json()

# Usage
client = UnifiedMLClient(platform='sagemaker')
prediction = client.predict([1, 2, 3, 4, 5])
```

---

## 自建与采购的决策框架

### 决策矩阵

```
┌───────────────────────────┬──────────────┬──────────────────┐
│ Factor                    │ Use Managed  │ Build Custom     │
├───────────────────────────┼──────────────┼──────────────────┤
│ Team Size                 │ <10 people   │ >20 people       │
│ ML Maturity               │ Early stage  │ Advanced         │
│ Deployment Frequency      │ Monthly      │ Daily/hourly     │
│ Custom Requirements       │ Low          │ High             │
│ Budget                    │ Flexible     │ Cost-sensitive   │
│ Time to Market            │ Fast (weeks) │ Flexible (months)│
│ Compliance Needs          │ Standard     │ Custom           │
│ Scale (requests/day)      │ <10M         │ >100M            │
│ Multi-cloud Strategy      │ No           │ Yes              │
│ Special Hardware (TPU)    │ Need TPU     │ Standard GPU     │
└───────────────────────────┴──────────────┴──────────────────┘
```

### 成本盈亏平衡分析

```python
"""
Break-even analysis: Managed vs DIY

Assumptions:
- Managed: $360/month for inference (2 instances)
- DIY: $280/month for instances + $5,000 upfront (setup) + $2,000/month (maintenance)

Break-even point:
  Managed total: $360 * N months
  DIY total: $5,000 + ($280 + $2,000) * N months = $5,000 + $2,280 * N

  Break-even: $360 * N = $5,000 + $2,280 * N
              -$1,920 * N = $5,000
              N = -2.6 months (Managed is always cheaper!)

Conclusion: For this scale, managed is more cost-effective.

When DIY makes sense:
- Very high scale (>10M requests/day)
- Special hardware requirements
- Multi-cloud portability critical
- Long-term commitment (>3 years)
"""
```

---

## 最佳实践

### 平台选型检查清单

```markdown
## Choosing the Right Managed ML Platform

### Choose AWS SageMaker if:
- [x] Already on AWS ecosystem
- [x] Need comprehensive MLOps features
- [x] Want end-to-end managed experience
- [x] Enterprise compliance requirements
- [x] Edge deployment needed (Greengrass)

### Choose Google Vertex AI if:
- [x] Using TensorFlow extensively
- [x] Need TPU access
- [x] Want best AutoML capabilities
- [x] Heavy BigQuery usage
- [x] Open-source preferences (Kubeflow)

### Choose Azure ML if:
- [x] Microsoft-centric organization
- [x] Need Azure OpenAI integration
- [x] Strong governance requirements
- [x] Azure ecosystem (Office 365, Teams)
- [x] Enterprise MLOps at scale

### Build Custom if:
- [x] Very high scale (>100M req/day)
- [x] Multi-cloud portability critical
- [x] Custom hardware requirements
- [x] Deep ML expertise in-house
- [x] Long-term cost optimization focus
```

---

## 动手练习

> 译注：原文目录列有「Hands-on Exercise」，但正文未提供单独的练习章节。可结合本模块练习 06（托管机器学习服务比较）进行实践。

---

## 总结

本课学习了：

- 比较 SageMaker、Vertex AI 与 Azure ML。
- 在各平台上实现训练与部署。
- 构建 MLOps 流水线（SageMaker Pipelines、Kubeflow、Azure ML Pipelines）。
- 使用特征存储与模型注册中心。
- 评估成本与性能之间的取舍。
- 在不同平台之间迁移。
- 根据充分的信息作出自建与采购决策。

**核心要点（原文评价与估算）：**
- **SageMaker：** AWS 集成能力突出，功能全面（原文估计成本溢价 25%）。
- **Vertex AI：** AutoML 能力突出，可使用 TPU，原文认为训练成本效益较高。
- **Azure ML：** 企业功能突出，支持 OpenAI 集成。
- **盈亏平衡：** 原文认为每天请求量低于 1,000 万时，托管服务往往比自建便宜。

**决策框架（原文经验建议）：**
- 小型团队（少于 10 人）：使用托管平台。
- 大规模场景（每天超过 1 亿次请求）：考虑自建。
- 多云场景：构建可移植的抽象层。

**后续步骤：**
- 完成动手练习。
- 为自己的场景选择平台。
- 实现端到端工作流。
- 进入第 08 课：多云与成本优化。

---

**预计完成时间：** 6 小时（含动手练习）。
**难度：** 中级。
**下一课：** [08-multi-cloud-cost-optimization.md](./08-multi-cloud-cost-optimization.md)

> 译注：上述平台排名、成本溢价与请求量阈值属于原文示例，不能直接用作通用选型结论。实际决策需比较相同模型、服务等级、负载及硬件下的总拥有成本（TCO），包括工程人员、维护、安全、容量闲置、数据迁移与网络费用。所有原始代码块及其英文注释和表格保持不变，未逐项运行或核实当前价格与产品版本。
