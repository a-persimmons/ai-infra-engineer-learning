# 项目 02：端到端 MLOps 流水线

## 概览

构建完整的 MLOps 流水线，通过自动化训练、实验追踪和持续部署，管理从数据摄取到模型部署的整个机器学习生命周期。

## 学习目标

- 使用 DVC 进行数据版本管理，构建完整机器学习流水线。
- 使用 MLflow 实现实验追踪。
- 使用 Apache Airflow 创建自动训练工作流。
- 实现模型注册中心与版本管理。
- 构建模型部署 CI/CD 流水线。
- 监控生产环境中的模型性能。

## 前置条件

- 完成项目 01。
- 完成模块 01–06（尤其是 mod-105 与 mod-106）。
- 理解机器学习训练工作流。
- 熟悉数据流水线。

## 项目规格

基于 [project-specifications.json 中的 proj-102](../../curriculum/project-specifications.json)。

**时长：** 40 小时

**难度：** 中高级

## 技术

- **数据版本管理：** DVC
- **实验追踪：** MLflow
- **工作流编排：** Apache Airflow
- **CI/CD：** GitHub Actions
- **容器化：** Docker、Kubernetes
- **监控：** Prometheus、Grafana

## 项目结构

```
project-102-mlops-pipeline/
├── README.md (this file)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── dags/                  # Airflow DAGs
│   ├── data_pipeline.py
│   ├── training_pipeline.py
│   └── deployment_pipeline.py
├── src/
│   ├── data/              # Data processing
│   ├── training/          # Model training
│   ├── deployment/        # Deployment scripts
│   └── monitoring/        # Monitoring scripts
├── tests/
│   ├── test_data.py
│   ├── test_training.py
│   └── test_deployment.py
├── data/                  # DVC tracked data
│   ├── .gitkeep
│   └── .dvc
├── models/                # DVC tracked models
├── mlflow/                # MLflow configuration
├── kubernetes/            # K8s manifests
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PIPELINE.md
│   ├── MLFLOW.md
│   └── DEPLOYMENT.md
└── .github/workflows/
    └── mlops-ci-cd.yml
```

## 开始

### TODO：完成实现

本项目目前仅提供骨架。你的任务是按照规格实现完整的 MLOps 流水线。

**实现步骤：**

1. **设置数据流水线**
   - 实现数据摄取。
   - 添加 DVC 进行数据版本管理。
   - 创建数据验证检查。
2. **构建训练流水线**
   - 实现带 MLflow 追踪的训练脚本。
   - 创建用于编排的 Airflow DAG。
   - 添加超参数调优。
3. **设置模型注册中心**
   - 配置 MLflow Model Registry。
   - 实现模型版本管理工作流。
   - 添加模型验证门禁。
4. **实现部署流水线**
   - 实现从注册中心自动部署。
   - 部署至 Kubernetes（扩展项目 01）。
   - 添加回滚能力。
5. **添加监控**
   - 追踪模型性能指标。
   - 实现漂移检测。
   - 设置告警。
6. **CI/CD 集成**
   - 创建 GitHub Actions 工作流。
   - 自动化测试。
   - 自动触发部署。

## 需要实现的关键功能

### 1. 数据流水线（Airflow DAG）

```python
# TODO: Implement data_pipeline.py
# - Data ingestion task
# - Data validation task
# - Data preprocessing task
# - DVC commit task
```

### 2. 训练流水线（Airflow DAG）

```python
# TODO: Implement training_pipeline.py
# - Load versioned data
# - Train model with MLflow tracking
# - Register best model
# - Trigger deployment if model improves
```

### 3. 模型注册中心工作流

```python
# TODO: Implement model registry logic
# - Staging → Production promotion
# - Model versioning
# - A/B testing support
```

### 4. 部署自动化

```python
# TODO: Implement deployment automation
# - Automatic deployment on model promotion
# - Rolling update to Kubernetes
# - Rollback on failure
```

## 成功标准

- [ ] 完整流水线端到端执行成功。
- [ ] MLflow 中追踪至少五次实验及其指标。
- [ ] 使用 DVC 管理数据版本，并且能够检索数据。
- [ ] 模型晋升至 Production 时自动部署。
- [ ] 示例数据集的流水线执行耗时低于 30 分钟。
- [ ] 全部测试通过，覆盖率至少 75%。
- [ ] 文档支持复现流水线。

## 架构图

```
Data Sources → Ingestion (Airflow) → Data Lake (S3 + DVC)
                                            ↓
                                       Processing
                                            ↓
                                       Training (MLflow)
                                            ↓
                                    Model Registry (MLflow)
                                            ↓
                            (Promote to Production trigger)
                                            ↓
                              CI/CD Pipeline (GitHub Actions)
                                            ↓
                            Kubernetes Deployment (from Project 01)
                                            ↓
                                      Monitoring
```

## 参考资料

- [Apache Airflow 文档](https://airflow.apache.org/docs/)
- [MLflow 文档](https://mlflow.org/docs/latest/index.html)
- [DVC 文档](https://dvc.org/doc)
- [MLOps 最佳实践](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)

## 时间安排

- **第 1 周：** 数据流水线与 DVC 配置。
- **第 2 周：** 训练流水线与 MLflow 集成。
- **第 3 周：** 模型注册中心与部署自动化。
- **第 4 周：** 监控、测试与文档。

## 后续步骤

1. 详细阅读项目规格。
2. 设置开发环境。
3. 从数据流水线实现开始。
4. 系统地完成各组件。

---

**注意：** 这是学习项目。重点是深入理解每个组件，而不是仓促完成实现。

**有问题？** 参阅 [CURRICULUM.md](../../CURRICULUM.md)，或发起 GitHub 讨论。
