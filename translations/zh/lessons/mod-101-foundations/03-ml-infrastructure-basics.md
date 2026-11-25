# 第 03 课：机器学习基础设施基础

**时长：** 4 小时
**目标：** 理解机器学习生命周期以及各阶段的基础设施要求。

## 导论

机器学习基础设施用于支撑完整的机器学习生命周期，从数据收集到模型部署与监控。理解这一生命周期及每个阶段的基础设施要求，是成为高效机器学习基础设施工程师的基础。

## 机器学习生命周期

机器学习生命周期包含多个相互连接的阶段，形成持续循环：

```
┌──────────────────────────────────────────────────────────────────┐
│                     ML Lifecycle                                 │
└──────────────────────────────────────────────────────────────────┘

  ┌─────────────┐
  │   1. DATA   │
  │ Collection  │
  │ Preparation │
  │  Labeling   │
  └──────┬──────┘
         │
         ↓
  ┌─────────────┐
  │ 2. TRAINING │
  │Experiment   │
  │Development  │
  │Validation   │
  └──────┬──────┘
         │
         ↓
  ┌─────────────┐
  │3. EVALUATION│
  │   Testing   │
  │ Validation  │
  │   Metrics   │
  └──────┬──────┘
         │
         ↓
  ┌─────────────┐
  │4. DEPLOYMENT│
  │  Serving    │
  │Integration  │
  │   Scaling   │
  └──────┬──────┘
         │
         ↓
  ┌─────────────┐
  │5. MONITORING│
  │Performance  │
  │  Metrics    │
  │ Drift Det.  │
  └──────┬──────┘
         │
         ↓
  ┌─────────────┐
  │6. RETRAINING│
  │Update Model │
  │  New Data   │
  │   Deploy    │
  └──────┬──────┘
         │
         └────────────┐
                      │
                      └────> (Loop back to Data)
```

## 阶段 1：数据收集与准备

### 发生了什么
- 从多种来源（数据库、API、传感器、日志）收集原始数据。
- 清洗、验证并转换数据。
- 根据原始数据进行特征工程。
- 标注数据（用于监督学习）。
- 对数据集进行版本管理与存储。

### 基础设施要求

**存储：**
- 用于大规模数据集的**对象存储**（S3、GCS、Azure Blob）。
- 用于原始非结构化数据的**数据湖**。
- 用于结构化、已处理数据的**数据仓库**。
- **数据版本管理**（DVC、Delta Lake）。

**计算：**
- 用于大规模转换的**数据处理集群**（Spark、Dask）。
- 用于移动和转换数据的 **ETL/ELT 流水线**。
- 用于并行处理的**分布式计算**。

**工具：**
- **Apache Airflow**——工作流编排。
- **Apache Kafka**——实时数据流。
- **DVC**——数据版本控制。
- **Great Expectations**——数据验证。

### 基础设施示例

```python
# Data pipeline orchestration with Airflow
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

def collect_data():
    # Collect from API
    pass

def validate_data():
    # Check data quality
    pass

def transform_data():
    # Feature engineering
    pass

dag = DAG('data_pipeline', start_date=datetime(2025, 1, 1))

collect = PythonOperator(task_id='collect', python_callable=collect_data, dag=dag)
validate = PythonOperator(task_id='validate', python_callable=validate_data, dag=dag)
transform = PythonOperator(task_id='transform', python_callable=transform_data, dag=dag)

collect >> validate >> transform
```

## 阶段 2：模型训练与实验

### 发生了什么
- 数据科学家尝试不同算法。
- 使用准备好的数据集训练模型。
- 调优超参数。
- 运行并追踪多次实验。
- 根据验证指标选择最佳模型。

### 基础设施要求

**计算：**
- 用于深度学习训练的 **GPU 集群**。
- 跨多个 GPU/节点的**分布式训练**。
- **资源调度**（Kubernetes、SLURM）。
- 用于成本优化的 **Spot 实例**。

**实验追踪：**
- **MLflow**——实验追踪与模型注册中心。
- **Weights & Biases**——实验可视化。
- **TensorBoard**——训练指标可视化。

**存储：**
- 用于训练完成的模型版本管理的**模型注册中心**。
- 用于模型文件与检查点的**产物存储**。
- 用于实验参数的**元数据存储**。

### 基础设施示例

```python
# Experiment tracking with MLflow
import mlflow
import torch

mlflow.start_run()

# Log parameters
mlflow.log_param("learning_rate", 0.001)
mlflow.log_param("batch_size", 32)

# Training loop
for epoch in range(num_epochs):
    loss = train_epoch(model, data_loader)

    # Log metrics
    mlflow.log_metric("loss", loss, step=epoch)
    mlflow.log_metric("accuracy", accuracy, step=epoch)

# Save model
mlflow.pytorch.log_model(model, "model")

mlflow.end_run()
```

### 资源要求

| 模型类型 | GPU 显存 | 训练时间 | 存储 |
|---|---|---|---|
| 小型 CNN | 4–8 GB | 数小时 | 低于 1 GB |
| 大型 CNN（ResNet-152） | 12–16 GB | 数天 | 5–10 GB |
| BERT Base | 16–24 GB | 数天 | 500 MB |
| GPT-3 规模 | 80 GB 以上（多卡） | 数周 | 数百 GB |
| LLM（70 亿参数） | 28 GB 以上 | 数天至数周 | 14–28 GB |

> 译注：表格为原文示例，不是模型固定的硬件需求。训练显存、耗时及存储受数据量、精度、批大小、优化器状态、训练方式和硬件影响；权重大小不等于完整训练显存。

## 阶段 3：模型评估与验证

### 发生了什么
- 在测试数据集上评估模型。
- 计算性能指标。
- 分析模型行为（混淆矩阵、错误分析）。
- 识别边界情况及故障模式。
- 评估模型公平性与偏差。

### 基础设施要求

**计算：**
- 用于批量评估的推理基础设施。
- A/B 测试框架。

**工具：**
- **模型评估框架**（scikit-learn 指标、自定义评估器）。
- **偏差检测工具**（Fairlearn、AI Fairness 360）。
- **模型可解释性**（SHAP、LIME）。

### 需要追踪的关键指标

**分类：**
- 准确率（Accuracy）、精确率（Precision）、召回率（Recall）、F1 分数。
- ROC AUC、Precision-Recall AUC。
- 混淆矩阵。

**回归：**
- MSE、RMSE、MAE。
- R² 分数。
- 残差图。

**排序：**
- NDCG（归一化折损累计增益）。
- MAP（平均精确率均值）。

**业务指标：**
- 收入影响。
- 用户参与度。
- 转化率。

## 阶段 4：模型部署

### 发生了什么
- 将模型打包用于生产环境。
- 将模型部署到服务基础设施。
- 创建用于推理的 API 端点。
- 配置负载均衡与扩缩容。
- 逐步发布（金丝雀部署）。

### 基础设施要求

**模型服务：**
- **模型服务框架**（TorchServe、TensorFlow Serving、FastAPI）。
- **容器编排**（Kubernetes）。
- 用于流量分发的**负载均衡器**。
- 用于请求路由的 **API 网关**。

**部署策略：**

1. **蓝绿部署**
   - 运行两个相同规格的生产环境。
   - 将流量从旧版本（蓝）切换至新版本（绿）。
   - 出现问题时快速回滚。

2. **金丝雀部署**
   - 逐步将流量路由到新版本。
   - 密切监控指标。
   - 检测到退化时回滚。

3. **影子部署**
   - 将流量发送至旧模型，并复制至新模型。
   - 在不改变用户响应的情况下比较预测结果。
   - 全量部署前进行验证。

### 部署架构示例

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ↓              ↓              ↓
         ┌────────┐     ┌────────┐     ┌────────┐
         │ Model  │     │ Model  │     │ Model  │
         │ Pod 1  │     │ Pod 2  │     │ Pod 3  │
         │ (v1.2) │     │ (v1.2) │     │ (v1.2) │
         └────────┘     └────────┘     └────────┘
```

## 阶段 5：监控与可观测性

### 发生了什么
- 监控推理延迟与吞吐量。
- 追踪预测分布。
- 检测模型性能退化。
- 收集系统健康指标。
- 异常时触发告警。

### 基础设施要求

**监控技术栈：**
- **Prometheus**——指标采集。
- **Grafana**——仪表盘与可视化。
- **ELK Stack**（Elasticsearch、Logstash、Kibana）——日志聚合。
- **Jaeger/Zipkin**——分布式链路追踪。

**需要监控的关键指标：**

**系统指标：**
- 请求速率（每秒请求数）。
- 延迟（p50、p95、p99）。
- 错误率。
- CPU/GPU 利用率。
- 内存使用量。

**模型指标：**
- 预测分布。
- 置信度分数。
- 特征分布。
- 数据漂移。
- 概念漂移。

**业务指标：**
- 转化率。
- 每次预测产生的收入。
- 用户满意度。

### 监控配置示例

```python
from prometheus_client import Counter, Histogram

# Define metrics
prediction_counter = Counter(
    'model_predictions_total',
    'Total predictions made',
    ['model_version', 'outcome']
)

inference_duration = Histogram(
    'model_inference_duration_seconds',
    'Model inference duration'
)

# Track metrics
with inference_duration.time():
    prediction = model.predict(input_data)

prediction_counter.labels(
    model_version='v1.2',
    outcome='success'
).inc()
```

## 阶段 6：模型重新训练与更新

### 发生了什么
- 检测到性能退化。
- 收集新数据。
- 使用更新的数据重新训练模型。
- 评估重新训练的模型。
- 通过 CI/CD 部署新模型。

### 基础设施要求

**自动化：**
- **定期重新训练**——周期性更新模型。
- **触发式重新训练**——检测到漂移或出现新数据时触发。
- **CI/CD 流水线**——自动化测试与部署。

**持续训练：**
```
Data → Validate → Train → Evaluate → Deploy
  ↑                                     │
  └─────────────────────────────────────┘
         (Continuous Loop)
```

## 机器学习中的基础设施挑战

### 1. 数据量与数据产生速度
**挑战：** 机器学习需要大量数据，且数据持续增长。

**解决方案：**
- 分布式存储（HDFS、S3）。
- 流式处理（Kafka、Flink）。
- 数据压缩与高效格式（Parquet、ORC）。

### 2. 高计算强度
**挑战：** 训练大型模型需要大量计算资源。

**解决方案：**
- GPU 集群。
- 分布式训练（数据并行、模型并行）。
- 云弹性（按需扩缩容）。
- 使用 Spot 实例优化成本。

### 3. 模型版本管理
**挑战：** 需要同时追踪模型、数据与代码。

**解决方案：**
- 模型注册中心（MLflow、DVC）。
- 使用 Git 管理代码。
- 数据版本管理工具。
- 可复现的实验。

### 4. 服务延迟
**挑战：** 实时预测必须足够快（原文目标低于 100ms）。

**解决方案：**
- 模型优化（量化、剪枝）。
- 缓存。
- 批量推理。
- GPU 加速。
- 边缘部署。

### 5. 监控复杂度
**挑战：** 需要同时监控系统及模型性能。

**解决方案：**
- 完整的可观测性技术栈。
- 机器学习自定义指标。
- 自动化告警。
- 漂移检测。

## 应避免的基础设施反模式

### 1. 手动部署
**问题：** 容易出错、速度慢、无法复现。

**解决方案：** 使用 CI/CD 流水线自动化。

### 2. 没有模型版本管理
**问题：** 无法回滚，无法复现结果。

**解决方案：** 使用模型注册中心，为所有相关内容管理版本。

### 3. 在生产服务环境中训练
**问题：** 不稳定、资源竞争、安全风险。

**解决方案：** 隔离训练与服务环境。

### 4. 忽略数据质量
**问题：** 垃圾输入导致垃圾输出——模型可能静默失效。

**解决方案：** 数据验证、质量检查、监控。

### 5. 没有监控
**问题：** 不知道模型何时发生退化。

**解决方案：** 全面监控与告警。

## 机器学习基础设施工程师的职责

在生命周期的各个阶段，机器学习基础设施工程师负责：

**数据阶段：**
- 构建及维护数据流水线。
- 实现数据版本管理。
- 保障数据质量。

**训练阶段：**
- 供应 GPU 集群。
- 设置实验追踪。
- 优化训练性能。

**评估阶段：**
- 创建评估框架。
- 实现偏差检测。
- 构建验证流水线。

**部署阶段：**
- 构建服务基础设施。
- 实现部署策略。
- 管理容器编排。

**监控阶段：**
- 设置可观测性技术栈。
- 定义告警及 SLO。
- 构建仪表盘。

**重新训练阶段：**
- 自动化重新训练流水线。
- 实现机器学习 CI/CD。
- 管理模型生命周期。

## 真实场景示例：推荐系统

沿机器学习生命周期梳理一个推荐系统：

**1. 数据收集：**
- 用户交互记录至 Kafka。
- 批处理作业每日处理日志。
- 特征保存至特征存储。

**2. 训练：**
- 每晚在 GPU 集群训练。
- 使用 MLflow 追踪实验。
- 注册最佳模型。

**3. 评估：**
- 离线指标（AUC、NDCG）。
- 准备好 A/B 测试框架。

**4. 部署：**
- 金丝雀部署（5% 流量）。
- 监控指标 24 小时。
- 成功后全量发布。

**5. 监控：**
- 延迟仪表盘（目标低于 50ms）。
- 追踪点击率。
- 模型漂移检测。

**6. 重新训练：**
- 每周使用新数据重新训练。
- 自动化评估流水线。
- 指标改善且满足部署门禁时自动部署。

## 核心要点

1. **机器学习生命周期是持续的**——并非一次性过程。
2. **基础设施支撑每个阶段**——各阶段具有不同的要求。
3. **自动化至关重要**——手动流程难以扩展。
4. **监控不可或缺**——模型可能静默失效。
5. **所有相关内容都应管理版本**——数据、代码、模型、配置。
6. **生产环境不同于开发环境**——需要健壮的基础设施。

## 实践练习

思考一个简单的机器学习用例（例如垃圾邮件检测）：

1. **列出数据需求**——需要哪些数据？数据来自哪里？
2. **识别计算需求**——训练与服务分别需要什么资源？
3. **定义成功指标**——如何衡量模型是否有效？
4. **规划监控**——在生产环境追踪哪些内容？
5. **考虑故障模式**——各阶段可能出现什么问题？

写下答案，与本课讨论的模式进行比较。

## 自我检查问题

1. 机器学习生命周期的六个阶段是什么？
2. 为什么模型版本管理重要？
3. 系统指标与模型指标有何区别？
4. 机器学习模型的三种部署策略是什么？
5. 为什么监控对于生产机器学习系统至关重要？
6. 训练阶段需要哪些基础设施？
7. 什么是数据漂移？它为什么重要？

## 补充资源

- [Google MLOps 白皮书](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
- [Microsoft MLOps 成熟度模型](https://learn.microsoft.com/en-us/azure/architecture/example-scenario/mlops/mlops-maturity-model)
- [Uber Michelangelo 平台](https://www.uber.com/blog/michelangelo-machine-learning-platform/)
- [Andriy Burkov 的《Machine Learning Engineering》](http://www.mlebook.com/)

---

**下一课：** [04-ml-frameworks.md](./04-ml-frameworks.md)——基础设施工程师如何使用 PyTorch 与 TensorFlow。
