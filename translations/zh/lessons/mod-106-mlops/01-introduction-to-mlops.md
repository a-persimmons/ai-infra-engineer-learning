# 第 01 课：MLOps 导论

## 概览

MLOps（Machine Learning Operations，机器学习运维）将 DevOps 的原则和实践引入机器学习系统。本课介绍 MLOps 基础，解释它为何对生产环境中的 ML 至关重要，并提供构建可靠 ML 系统的框架。

**时长：** 4–5 小时
**难度：** 入门至中级
**前置条件：** ML 基础知识、理解 DevOps 概念。

## 学习目标

完成本课后，你将能够：
- 定义 MLOps 并解释其重要性。
- 理解完整的 ML 生命周期。
- 识别生产环境 ML 的常见挑战。
- 评估 ML 系统的成熟度等级。
- 设计 MLOps 架构。
- 为 MLOps 选择合适的工具。

---

## 1. 什么是 MLOps？

### 1.1 定义

**MLOps** 是一组结合机器学习、DevOps 与数据工程的实践，旨在可靠、高效地部署和维护生产环境中的 ML 系统。

```
MLOps = ML + DevOps + Data Engineering

┌─────────────────────────────────────────────┐
│          Machine Learning (ML)              │
│   • Model development                       │
│   • Feature engineering                     │
│   • Hyperparameter tuning                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│             MLOps Practices                 │
│   • Automation                              │
│   • Monitoring                              │
│   • Reproducibility                         │
│   • Collaboration                           │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼─────────┐  ┌────────▼──────────┐
│    DevOps       │  │ Data Engineering  │
│ • CI/CD         │  │ • Data pipelines  │
│ • Infrastructure│  │ • Data quality    │
│ • Monitoring    │  │ • Feature stores  │
└─────────────────┘  └───────────────────┘
```

### 1.2 MLOps 为什么重要

**传统软件与 ML 系统比较：**

| 方面 | 传统软件 | ML 系统 |
|---|---|---|
| 变更内容 | 仅代码 | 代码 + 数据 + 模型 |
| 测试 | 单元测试/集成测试 | 模型验证 + 数据验证 |
| 部署 | 二进制产物 | 模型 + 代码 + 配置 |
| 监控 | 系统指标 | 模型性能 + 数据漂移 |
| 调试 | 堆栈追踪 | 模型行为分析 |
| 更新 | 代码发布 | 重新训练 + 部署 |

**统计数据（原文引述）：**
- 87% 的 ML 项目从未进入生产环境（VentureBeat，2019）。
- 使用 ML 的企业中，仅 22% 成功部署过模型（Gartner，2020）。
- ML 模型部署平均耗时：8–90 天（MLOps Community Survey，2021）。

**MLOps 为何不可或缺：**

1. **可复现性：** 确保实验可以重新执行。
2. **可靠性：** 构建值得信赖的 ML 系统。
3. **可扩展性：** 应对不断增长的模型复杂度和数量。
4. **协作：** 使团队能够高效合作。
5. **合规：** 满足监管与治理要求。
6. **速度：** 加速模型开发及部署。

---

## 2. ML 生命周期

### 2.1 完整的 ML 生命周期

```
┌──────────────────────────────────────────────────────────┐
│                    ML Lifecycle                          │
└──────────────────────────────────────────────────────────┘

1. Business Problem Definition
   ↓
2. Data Collection & Preparation
   ├─ Data ingestion
   ├─ Data validation
   ├─ Data cleaning
   └─ Feature engineering
   ↓
3. Model Development
   ├─ Experiment tracking
   ├─ Model training
   ├─ Hyperparameter tuning
   └─ Model evaluation
   ↓
4. Model Validation
   ├─ Performance metrics
   ├─ Business metrics
   └─ Fairness/bias check
   ↓
5. Model Deployment
   ├─ Model packaging
   ├─ Infrastructure setup
   └─ Release strategy
   ↓
6. Model Monitoring
   ├─ Performance tracking
   ├─ Data drift detection
   └─ Alert management
   ↓
7. Model Maintenance
   ├─ Retraining
   ├─ Version management
   └─ Decommissioning

   (Loop back to step 2 or 3)
```

### 2.2 MLOps 中的持续性流程

```python
# Example: ML Lifecycle Implementation

class MLLifecycle:
    """Orchestrate complete ML lifecycle"""

    def __init__(self):
        self.experiment_tracker = MLflowTracker()
        self.data_validator = DataValidator()
        self.model_registry = ModelRegistry()
        self.monitor = ModelMonitor()

    def execute_lifecycle(self, config):
        """Execute full ML lifecycle"""

        # 1. Data preparation
        raw_data = self.collect_data(config['data_source'])
        self.data_validator.validate(raw_data)
        clean_data = self.prepare_data(raw_data)

        # 2. Feature engineering
        features = self.engineer_features(clean_data)
        self.data_validator.validate_features(features)

        # 3. Model training
        with self.experiment_tracker.start_run():
            model = self.train_model(features, config['model_params'])
            metrics = self.evaluate_model(model, features)

            self.experiment_tracker.log_metrics(metrics)
            self.experiment_tracker.log_model(model)

        # 4. Model validation
        if self.validate_model(model, metrics, config['thresholds']):
            # 5. Model registration
            model_version = self.model_registry.register_model(
                model,
                stage='staging'
            )

            # 6. Deploy to staging
            self.deploy_model(model_version, environment='staging')

            # 7. Monitor performance
            self.monitor.setup_monitoring(model_version)

            return model_version
        else:
            raise ModelValidationError("Model did not meet requirements")
```

---

## 3. MLOps 与 DevOps

### 3.1 主要区别

```
┌─────────────────────────────────────────────────────────┐
│              DevOps         vs        MLOps             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Artifacts:                                             │
│  • Code                      • Code + Data + Models     │
│                                                          │
│  Testing:                                               │
│  • Unit tests                • Unit + Model + Data tests│
│  • Integration tests         • A/B testing              │
│                                                          │
│  Deployment:                                            │
│  • Rolling updates           • Canary + shadow mode     │
│  • Blue-green                • Multi-model serving      │
│                                                          │
│  Monitoring:                                            │
│  • System metrics            • Model performance        │
│  • Error rates               • Data drift               │
│  • Latency                   • Feature distribution     │
│                                                          │
│  Triggers:                                              │
│  • Code changes              • Data changes             │
│                              • Model degradation        │
│                              • Schedule                 │
└─────────────────────────────────────────────────────────┘
```

### 3.2 MLOps 额外的复杂性

```python
# DevOps: Deploy when code changes
def devops_pipeline():
    code = checkout_code()
    run_tests(code)
    build_artifact(code)
    deploy(artifact)

# MLOps: Deploy when code, data, OR model changes
def mlops_pipeline():
    # Multiple triggers
    code = checkout_code()
    data = fetch_latest_data()

    # Validate everything
    run_code_tests(code)
    run_data_tests(data)

    # Train and validate model
    model = train_model(code, data)
    model_metrics = evaluate_model(model)

    # Check if deployment needed
    if should_deploy(model_metrics, data_drift):
        # Package everything
        artifact = package_model(model, code, data_schema)

        # Deploy with monitoring
        deploy(artifact)
        monitor_model_performance(model)

        # Check for drift
        if detect_drift():
            trigger_retraining()
```

---

## 4. 生产环境 ML 的常见挑战

### 4.1 技术挑战

**1. 可复现性**
```python
# Problem: Can't reproduce experiment results

# Bad: Non-reproducible experiment
def train_model():
    data = load_data()  # Which version?
    model = RandomForest()  # What hyperparameters?
    model.fit(data)  # What seed?
    return model  # No tracking

# Good: Reproducible experiment
import mlflow

def train_model(data_version, seed=42, **model_params):
    with mlflow.start_run():
        # Log everything
        mlflow.log_param("data_version", data_version)
        mlflow.log_param("seed", seed)
        mlflow.log_params(model_params)

        # Load versioned data
        data = load_data(version=data_version)

        # Train with fixed seed
        model = RandomForest(random_state=seed, **model_params)
        model.fit(data.X_train, data.y_train)

        # Log model and metrics
        mlflow.sklearn.log_model(model, "model")
        mlflow.log_metrics(evaluate(model, data))

        return model
```

**2. 数据质量问题**
- 生产数据中存在缺失值。
- Schema 变化。
- 数据漂移。
- 标签质量问题。

**3. 模型性能退化**
- 概念漂移。
- 特征分布变化。
- 季节性模式。
- 对抗性输入。

**4. 部署复杂性**
- 多种部署目标（云端、边缘、移动端）。
- 延迟要求。
- 可扩展性需求。
- 资源限制。

### 4.2 组织挑战

**1. 团队壁垒**
```
Data Scientists → Models in notebooks
        ↓ (handoff gap)
ML Engineers → Production systems
        ↓ (handoff gap)
DevOps → Infrastructure management
```

**解决方案：跨职能 MLOps 团队。**
```
┌────────────────────────────────────┐
│      MLOps Team                    │
├────────────────────────────────────┤
│ • Data Scientists                  │
│ • ML Engineers                     │
│ • DevOps Engineers                 │
│ • Data Engineers                   │
│ • Product Managers                 │
└────────────────────────────────────┘
```

**2. 缺少标准**
- 没有统一的模型格式。
- 命名规范不一致。
- 模型缺乏文档。
- 没有审批流程。

**3. 监控不足**
- 无法了解模型性能。
- 问题发现过晚。
- 问题影响不明确。

---

## 5. MLOps 成熟度模型

### 5.1 成熟度等级

```
Level 0: Manual Process
├─ Manual data analysis
├─ Notebook-based development
├─ Manual model deployment
└─ No monitoring

Level 1: DevOps, No MLOps
├─ Automated build & test
├─ Manual model training
├─ Manual deployment
└─ Basic logging

Level 2: Automated Training
├─ Experiment tracking
├─ Automated training pipeline
├─ Model registry
└─ Manual deployment

Level 3: Automated Deployment
├─ CI/CD for ML
├─ Automated model validation
├─ Automated deployment
└─ Basic monitoring

Level 4: Full MLOps Automation
├─ Automated everything
├─ Feature store
├─ A/B testing
├─ Advanced monitoring
└─ Automated retraining
```

### 5.2 评估框架

```python
class MLOpsMaturityAssessment:
    """Assess MLOps maturity level"""

    def __init__(self):
        self.dimensions = {
            'data_management': [
                'Data versioning',
                'Data validation',
                'Feature store',
                'Data lineage'
            ],
            'model_development': [
                'Experiment tracking',
                'Hyperparameter tuning',
                'Model versioning',
                'Reproducibility'
            ],
            'deployment': [
                'Automated deployment',
                'Multiple environments',
                'Rollback capability',
                'A/B testing'
            ],
            'monitoring': [
                'Performance tracking',
                'Data drift detection',
                'Alert system',
                'Automated retraining'
            ],
            'governance': [
                'Model approval workflow',
                'Documentation',
                'Audit trail',
                'Compliance checks'
            ]
        }

    def assess(self, responses: dict) -> dict:
        """
        Assess maturity for each dimension

        Args:
            responses: Dict of {dimension: {capability: score}}

        Returns:
            Maturity report
        """
        results = {}

        for dimension, capabilities in self.dimensions.items():
            scores = [responses.get(dimension, {}).get(cap, 0)
                     for cap in capabilities]

            avg_score = sum(scores) / len(scores)

            results[dimension] = {
                'score': avg_score,
                'level': self._score_to_level(avg_score),
                'capabilities': dict(zip(capabilities, scores))
            }

        overall_score = sum(r['score'] for r in results.values()) / len(results)

        return {
            'overall_level': self._score_to_level(overall_score),
            'overall_score': overall_score,
            'dimensions': results,
            'recommendations': self._get_recommendations(results)
        }

    def _score_to_level(self, score: float) -> int:
        """Convert score (0-1) to maturity level (0-4)"""
        if score < 0.2:
            return 0
        elif score < 0.4:
            return 1
        elif score < 0.6:
            return 2
        elif score < 0.8:
            return 3
        else:
            return 4

    def _get_recommendations(self, results: dict) -> list:
        """Generate improvement recommendations"""
        recommendations = []

        for dimension, data in results.items():
            if data['score'] < 0.6:
                low_caps = [
                    cap for cap, score in data['capabilities'].items()
                    if score < 0.5
                ]
                recommendations.append({
                    'dimension': dimension,
                    'priority': 'high',
                    'improvements': low_caps
                })

        return recommendations

# Usage
assessment = MLOpsMaturityAssessment()

# Score each capability (0 = none, 1 = basic, 2 = intermediate, 3 = advanced)
responses = {
    'data_management': {
        'Data versioning': 2,
        'Data validation': 1,
        'Feature store': 0,
        'Data lineage': 1
    },
    'model_development': {
        'Experiment tracking': 2,
        'Hyperparameter tuning': 2,
        'Model versioning': 1,
        'Reproducibility': 1
    },
    # ... other dimensions
}

report = assessment.assess(responses)
print(f"Overall Maturity Level: {report['overall_level']}")
print(f"Recommendations: {report['recommendations']}")
```

---

## 6. MLOps 架构

### 6.1 参考架构

```
┌────────────────────────────────────────────────────────────┐
│                    MLOps Platform                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  Feature Store   │      │ Experiment       │         │
│  │  - Online store  │      │ Tracking         │         │
│  │  - Offline store │      │ (MLflow)         │         │
│  └──────────────────┘      └──────────────────┘         │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  Model Registry  │      │ Training         │         │
│  │  - Versions      │      │ Pipeline         │         │
│  │  - Metadata      │      │ (Airflow)        │         │
│  └──────────────────┘      └──────────────────┘         │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  Model Serving   │      │ Monitoring       │         │
│  │  - REST API      │      │ - Metrics        │         │
│  │  - Batch         │      │ - Alerts         │         │
│  └──────────────────┘      └──────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
            ↓                           ↓
    ┌──────────────┐          ┌──────────────┐
    │ Data Sources │          │   Consumers  │
    └──────────────┘          └──────────────┘
```

### 6.2 组件选择

```python
# Example: MLOps stack configuration

mlops_stack = {
    'experiment_tracking': {
        'tool': 'MLflow',
        'alternatives': ['W&B', 'Neptune', 'Comet'],
        'reason': 'Open source, mature, good integrations'
    },
    'feature_store': {
        'tool': 'Feast',
        'alternatives': ['Tecton', 'AWS Feature Store', 'Databricks'],
        'reason': 'Open source, flexible, cloud-agnostic'
    },
    'model_registry': {
        'tool': 'MLflow Model Registry',
        'alternatives': ['DVC', 'ModelDB', 'custom'],
        'reason': 'Integrated with experiment tracking'
    },
    'pipeline_orchestration': {
        'tool': 'Airflow',
        'alternatives': ['Kubeflow', 'Prefect', 'Dagster'],
        'reason': 'Mature, scalable, large ecosystem'
    },
    'model_serving': {
        'tool': 'FastAPI + Docker',
        'alternatives': ['TensorFlow Serving', 'Torchserve', 'Seldon'],
        'reason': 'Flexible, lightweight, easy to customize'
    },
    'monitoring': {
        'tool': 'Prometheus + Grafana',
        'alternatives': ['Datadog', 'New Relic', 'Evidently'],
        'reason': 'Industry standard, good for custom metrics'
    }
}
```

---

## 7. MLOps 工具生态

### 7.1 工具分类

```python
mlops_tools = {
    'Experiment Tracking': [
        'MLflow', 'Weights & Biases', 'Neptune.ai',
        'Comet ML', 'TensorBoard'
    ],
    'Data Versioning': [
        'DVC', 'Pachyderm', 'LakeFS', 'Delta Lake'
    ],
    'Feature Stores': [
        'Feast', 'Tecton', 'Hopsworks', 'AWS Feature Store'
    ],
    'Model Serving': [
        'TensorFlow Serving', 'TorchServe', 'Seldon Core',
        'BentoML', 'KServe'
    ],
    'Workflow Orchestration': [
        'Airflow', 'Kubeflow Pipelines', 'Metaflow',
        'Prefect', 'Dagster'
    ],
    'Model Monitoring': [
        'Evidently', 'Fiddler', 'Arize', 'WhyLabs',
        'NannyML'
    ],
    'ML Platforms': [
        'Databricks', 'SageMaker', 'Vertex AI',
        'Azure ML', 'Kubeflow'
    ]
}
```

---

## 8. 开始实施 MLOps

### 8.1 实施路线图

**阶段一：基础建设（第 1–4 周）**
- 搭建实验追踪。
- 实现基础 CI/CD。
- 添加日志与监控。
- 记录现有流程。

**阶段二：自动化（第 5–8 周）**
- 自动化训练管道。
- 添加模型注册中心。
- 实现自动化测试。
- 搭建预发布环境。

**阶段三：生产环境（第 9–12 周）**
- 部署至生产环境。
- 添加监控与告警。
- 实现 A/B 测试。
- 创建运行手册。

**阶段四：优化（持续进行）**
- 持续改进。
- 高级功能（特征存储等）。
- 团队培训。
- 完善流程。

### 8.2 快速入门检查清单

```python
mlops_quickstart = {
    'immediate': [
        '□ Start tracking experiments (MLflow)',
        '□ Version control data (DVC)',
        '□ Document model cards',
        '□ Set up basic monitoring'
    ],
    'short_term': [
        '□ Implement CI/CD for models',
        '□ Create model registry',
        '□ Automate deployment',
        '□ Add data validation'
    ],
    'long_term': [
        '□ Build feature store',
        '□ Implement A/B testing',
        '□ Advanced monitoring',
        '□ Automated retraining'
    ]
}
```

---

## 9. 总结

核心要点：
- MLOps 对生产环境 ML 项目的成功至关重要。
- ML 生命周期比传统软件生命周期更复杂。
- 成熟度模型有助于评估及改进实践。
- 架构应符合组织需求。
- 从简单方案开始，持续迭代改进。
- 重点关注自动化与监控。

**下一课：** [02——MLflow 实验追踪](./02-mlflow-experiment-tracking.md)

> 译注：导论中的行业统计为原文引用的历史数据，未独立核验，不应作为当前行业比例使用。传统软件也可能依赖数据、配置和复杂监控；对照表旨在突出 ML 系统的额外需求。成熟度等级及实施周期并非统一标准，应依据业务风险、团队规模与运维成本选择。原始代码块及其中英文内容保持不变。
