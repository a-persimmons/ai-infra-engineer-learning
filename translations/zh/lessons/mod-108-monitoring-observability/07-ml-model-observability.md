# 第 07 课：ML 专用监控与模型可观测性

## 学习目标

完成本课后，你将能够：
- 监控生产环境中的 ML 模型性能。
- 追踪数据漂移与模型性能退化。
- 实现特征存储监控。
- 监控训练管道与实验。
- 设置模型可解释性与公平性监控。
- 构建全面的 ML 可观测性仪表盘。
- 将 ML 监控与现有可观测性技术栈集成。

## 前置条件

- 完成第 01–06 课（可观测性基础）。
- 理解 ML 概念（训练、推理、漂移）。
- 熟悉 Prometheus、Grafana 和 Python。
- 具有 ML 框架使用经验（PyTorch、TensorFlow 或 scikit-learn）。

## 导论

传统基础设施监控关注系统健康状况（CPU、内存、延迟）。ML 可观测性在此基础上进一步追踪**模型行为与性能**，包括：
- 预测质量随时间的变化。
- 输入数据分布变化。
- 特征重要性变化。
- 模型公平性与偏差。
- 实验追踪与比较。

### 为什么需要 ML 专用监控？

1. **模型性能退化：** 与传统软件不同，ML 模型可能在没有明显报错的情况下失效。
2. **数据漂移（Data Drift）：** 输入数据分布发生变化，可能降低模型准确率。
3. **概念漂移（Concept Drift）：** 特征与目标之间的关系发生变化。
4. **训练监控：** 追踪实验、超参数及收敛情况。
5. **合规：** 监控公平性、偏差及可解释性要求。

---

## 1. 模型性能指标

### 分类模型

```python
from prometheus_client import Gauge, Histogram
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)

# Define metrics
MODEL_ACCURACY = Gauge(
    'model_accuracy',
    'Model accuracy score',
    ['model_name', 'model_version', 'dataset']
)

MODEL_PRECISION = Gauge(
    'model_precision',
    'Model precision score',
    ['model_name', 'model_version', 'class']
)

MODEL_RECALL = Gauge(
    'model_recall',
    'Model recall score',
    ['model_name', 'model_version', 'class']
)

MODEL_F1 = Gauge(
    'model_f1_score',
    'Model F1 score',
    ['model_name', 'model_version', 'class']
)

MODEL_AUC = Gauge(
    'model_auc_roc',
    'Model AUC-ROC score',
    ['model_name', 'model_version']
)

CONFUSION_MATRIX = Gauge(
    'model_confusion_matrix',
    'Confusion matrix elements',
    ['model_name', 'model_version', 'true_class', 'predicted_class']
)

def update_classification_metrics(
    y_true, y_pred, y_prob,
    model_name, model_version, class_names
):
    """Update classification metrics"""

    # Overall accuracy
    accuracy = accuracy_score(y_true, y_pred)
    MODEL_ACCURACY.labels(
        model_name=model_name,
        model_version=model_version,
        dataset='production'
    ).set(accuracy)

    # Per-class metrics
    precision = precision_score(y_true, y_pred, average=None)
    recall = recall_score(y_true, y_pred, average=None)
    f1 = f1_score(y_true, y_pred, average=None)

    for i, class_name in enumerate(class_names):
        MODEL_PRECISION.labels(
            model_name=model_name,
            model_version=model_version,
            class_name=class_name
        ).set(precision[i])

        MODEL_RECALL.labels(
            model_name=model_name,
            model_version=model_version,
            class_name=class_name
        ).set(recall[i])

        MODEL_F1.labels(
            model_name=model_name,
            model_version=model_version,
            class_name=class_name
        ).set(f1[i])

    # AUC-ROC (if probabilities available)
    if y_prob is not None:
        auc = roc_auc_score(y_true, y_prob, multi_class='ovr')
        MODEL_AUC.labels(
            model_name=model_name,
            model_version=model_version
        ).set(auc)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    for i, true_class in enumerate(class_names):
        for j, pred_class in enumerate(class_names):
            CONFUSION_MATRIX.labels(
                model_name=model_name,
                model_version=model_version,
                true_class=true_class,
                predicted_class=pred_class
            ).set(cm[i, j])
```

### 回归模型

```python
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error,
    r2_score, mean_absolute_percentage_error
)

# Define metrics
MODEL_RMSE = Gauge(
    'model_rmse',
    'Root Mean Squared Error',
    ['model_name', 'model_version']
)

MODEL_MAE = Gauge(
    'model_mae',
    'Mean Absolute Error',
    ['model_name', 'model_version']
)

MODEL_R2 = Gauge(
    'model_r2_score',
    'R-squared score',
    ['model_name', 'model_version']
)

MODEL_MAPE = Gauge(
    'model_mape',
    'Mean Absolute Percentage Error',
    ['model_name', 'model_version']
)

PREDICTION_ERROR_DISTRIBUTION = Histogram(
    'model_prediction_error',
    'Distribution of prediction errors',
    ['model_name', 'model_version'],
    buckets=[-100, -50, -10, -5, -1, 0, 1, 5, 10, 50, 100]
)

def update_regression_metrics(y_true, y_pred, model_name, model_version):
    """Update regression metrics"""

    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred)

    MODEL_RMSE.labels(
        model_name=model_name,
        model_version=model_version
    ).set(rmse)

    MODEL_MAE.labels(
        model_name=model_name,
        model_version=model_version
    ).set(mae)

    MODEL_R2.labels(
        model_name=model_name,
        model_version=model_version
    ).set(r2)

    MODEL_MAPE.labels(
        model_name=model_name,
        model_version=model_version
    ).set(mape)

    # Error distribution
    errors = y_pred - y_true
    for error in errors:
        PREDICTION_ERROR_DISTRIBUTION.labels(
            model_name=model_name,
            model_version=model_version
        ).observe(error)
```

---

## 2. 数据漂移检测

### 统计漂移检测

```python
from scipy.stats import ks_2samp, chi2_contingency
from prometheus_client import Gauge, Counter
import numpy as np

# Metrics
FEATURE_DRIFT_SCORE = Gauge(
    'feature_drift_score',
    'KS statistic for feature drift',
    ['model_name', 'feature_name']
)

DRIFT_DETECTED = Counter(
    'drift_detected_total',
    'Number of times drift was detected',
    ['model_name', 'feature_name', 'drift_type']
)

class DriftDetector:
    """Detect data drift using statistical tests"""

    def __init__(self, reference_data, model_name, threshold=0.05):
        self.reference_data = reference_data
        self.model_name = model_name
        self.threshold = threshold

    def check_numerical_drift(self, feature_name, current_data):
        """
        Check drift in numerical features using Kolmogorov-Smirnov test
        """
        reference = self.reference_data[feature_name]
        statistic, p_value = ks_2samp(reference, current_data)

        # Update metric
        FEATURE_DRIFT_SCORE.labels(
            model_name=self.model_name,
            feature_name=feature_name
        ).set(statistic)

        # Check for drift
        if p_value < self.threshold:
            DRIFT_DETECTED.labels(
                model_name=self.model_name,
                feature_name=feature_name,
                drift_type='numerical'
            ).inc()

            return True, statistic, p_value

        return False, statistic, p_value

    def check_categorical_drift(self, feature_name, current_data):
        """
        Check drift in categorical features using chi-squared test
        """
        reference = self.reference_data[feature_name]

        # Create contingency table
        ref_counts = reference.value_counts()
        curr_counts = current_data.value_counts()

        # Align indices
        all_categories = set(ref_counts.index) | set(curr_counts.index)
        ref_aligned = [ref_counts.get(cat, 0) for cat in all_categories]
        curr_aligned = [curr_counts.get(cat, 0) for cat in all_categories]

        contingency = np.array([ref_aligned, curr_aligned])
        statistic, p_value, _, _ = chi2_contingency(contingency)

        # Update metric
        FEATURE_DRIFT_SCORE.labels(
            model_name=self.model_name,
            feature_name=feature_name
        ).set(statistic)

        if p_value < self.threshold:
            DRIFT_DETECTED.labels(
                model_name=self.model_name,
                feature_name=feature_name,
                drift_type='categorical'
            ).inc()

            return True, statistic, p_value

        return False, statistic, p_value

# Usage
import pandas as pd

reference_df = pd.read_csv('reference_data.csv')
detector = DriftDetector(reference_df, model_name='fraud-detector')

# Check drift on new data
current_batch = pd.read_csv('current_batch.csv')

for column in reference_df.columns:
    if reference_df[column].dtype in ['float64', 'int64']:
        drift, stat, pval = detector.check_numerical_drift(
            column,
            current_batch[column]
        )
    else:
        drift, stat, pval = detector.check_categorical_drift(
            column,
            current_batch[column]
        )

    if drift:
        print(f"DRIFT DETECTED in {column}: stat={stat:.4f}, p={pval:.4f}")
```

### 群体稳定性指数（Population Stability Index，PSI）

```python
import numpy as np
from prometheus_client import Gauge

PSI_SCORE = Gauge(
    'feature_psi_score',
    'Population Stability Index',
    ['model_name', 'feature_name']
)

def calculate_psi(expected, actual, bins=10):
    """
    Calculate Population Stability Index

    PSI < 0.1: No significant change
    PSI 0.1-0.25: Moderate change
    PSI > 0.25: Significant change
    """
    # Create bins
    breakpoints = np.linspace(
        min(expected.min(), actual.min()),
        max(expected.max(), actual.max()),
        bins + 1
    )

    # Calculate distributions
    expected_percents = np.histogram(expected, breakpoints)[0] / len(expected)
    actual_percents = np.histogram(actual, breakpoints)[0] / len(actual)

    # Avoid division by zero
    expected_percents = np.where(expected_percents == 0, 0.0001, expected_percents)
    actual_percents = np.where(actual_percents == 0, 0.0001, actual_percents)

    # Calculate PSI
    psi = np.sum(
        (actual_percents - expected_percents) *
        np.log(actual_percents / expected_percents)
    )

    return psi

# Usage
for feature in features:
    psi = calculate_psi(
        reference_df[feature],
        current_df[feature]
    )

    PSI_SCORE.labels(
        model_name='fraud-detector',
        feature_name=feature
    ).set(psi)

    if psi > 0.25:
        print(f"Significant drift in {feature}: PSI = {psi:.3f}")
```

---

## 3. 训练管道监控

### 使用 MLflow 进行实验追踪

```python
import mlflow
from prometheus_client import Gauge, Counter
import logging

# Metrics
EXPERIMENT_RUN = Counter(
    'mlflow_experiment_runs_total',
    'Total number of experiment runs',
    ['experiment_name', 'status']
)

TRAINING_METRIC = Gauge(
    'training_metric_value',
    'Training metric value',
    ['experiment_name', 'run_id', 'metric_name']
)

TRAINING_DURATION = Gauge(
    'training_duration_seconds',
    'Training duration in seconds',
    ['experiment_name', 'run_id']
)

class MLflowMonitor:
    """Monitor MLflow experiments"""

    def __init__(self, experiment_name):
        self.experiment_name = experiment_name
        mlflow.set_experiment(experiment_name)
        self.logger = logging.getLogger(__name__)

    def track_training(self, model, train_fn, **params):
        """
        Track training with MLflow and export metrics to Prometheus
        """
        with mlflow.start_run() as run:
            run_id = run.info.run_id

            try:
                # Log parameters
                mlflow.log_params(params)

                # Train model
                import time
                start_time = time.time()

                metrics = train_fn(model, **params)

                duration = time.time() - start_time

                # Log metrics to MLflow
                mlflow.log_metrics(metrics)

                # Export to Prometheus
                for metric_name, value in metrics.items():
                    TRAINING_METRIC.labels(
                        experiment_name=self.experiment_name,
                        run_id=run_id,
                        metric_name=metric_name
                    ).set(value)

                TRAINING_DURATION.labels(
                    experiment_name=self.experiment_name,
                    run_id=run_id
                ).set(duration)

                # Mark as successful
                EXPERIMENT_RUN.labels(
                    experiment_name=self.experiment_name,
                    status='success'
                ).inc()

                self.logger.info(
                    f"Training completed: run_id={run_id}, duration={duration:.2f}s"
                )

                return run_id, metrics

            except Exception as e:
                # Mark as failed
                EXPERIMENT_RUN.labels(
                    experiment_name=self.experiment_name,
                    status='failed'
                ).inc()

                self.logger.error(f"Training failed: {e}", exc_info=True)
                raise

# Usage
monitor = MLflowMonitor('fraud-detection-experiments')

def train_model(model, learning_rate, batch_size, epochs):
    """Training function"""
    # Training logic here
    return {
        'train_loss': 0.123,
        'val_loss': 0.145,
        'train_accuracy': 0.95,
        'val_accuracy': 0.93
    }

run_id, metrics = monitor.track_training(
    model,
    train_model,
    learning_rate=0.001,
    batch_size=32,
    epochs=10
)
```

---

## 4. 模型可解释性监控

### 追踪 SHAP 值

```python
import shap
import numpy as np
from prometheus_client import Gauge, Histogram

FEATURE_IMPORTANCE = Gauge(
    'model_feature_importance',
    'SHAP-based feature importance',
    ['model_name', 'feature_name']
)

SHAP_VALUE_DISTRIBUTION = Histogram(
    'model_shap_values',
    'Distribution of SHAP values',
    ['model_name', 'feature_name'],
    buckets=[-1.0, -0.5, -0.1, 0, 0.1, 0.5, 1.0]
)

def monitor_feature_importance(model, X, feature_names, model_name):
    """Track feature importance using SHAP"""

    # Calculate SHAP values
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)

    # Mean absolute SHAP values (feature importance)
    importance = np.abs(shap_values).mean(axis=0)

    for i, feature in enumerate(feature_names):
        # Feature importance
        FEATURE_IMPORTANCE.labels(
            model_name=model_name,
            feature_name=feature
        ).set(importance[i])

        # SHAP value distribution
        for value in shap_values[:, i]:
            SHAP_VALUE_DISTRIBUTION.labels(
                model_name=model_name,
                feature_name=feature
            ).observe(value)
```

---

## 5. 模型公平性监控

```python
from prometheus_client import Gauge
import numpy as np

FAIRNESS_METRIC = Gauge(
    'model_fairness_metric',
    'Fairness metric value',
    ['model_name', 'protected_attribute', 'metric_type']
)

def calculate_fairness_metrics(
    y_true, y_pred, sensitive_attribute, model_name
):
    """
    Calculate fairness metrics across sensitive attributes
    """
    unique_groups = np.unique(sensitive_attribute)

    # Demographic parity difference
    positive_rates = {}
    for group in unique_groups:
        mask = sensitive_attribute == group
        positive_rate = y_pred[mask].mean()
        positive_rates[group] = positive_rate

    dp_diff = max(positive_rates.values()) - min(positive_rates.values())

    FAIRNESS_METRIC.labels(
        model_name=model_name,
        protected_attribute='all',
        metric_type='demographic_parity_diff'
    ).set(dp_diff)

    # Equal opportunity difference (TPR parity)
    tpr_by_group = {}
    for group in unique_groups:
        mask = (sensitive_attribute == group) & (y_true == 1)
        if mask.sum() > 0:
            tpr = y_pred[mask].mean()
            tpr_by_group[group] = tpr

    if len(tpr_by_group) > 0:
        eo_diff = max(tpr_by_group.values()) - min(tpr_by_group.values())

        FAIRNESS_METRIC.labels(
            model_name=model_name,
            protected_attribute='all',
            metric_type='equal_opportunity_diff'
        ).set(eo_diff)

    return {
        'demographic_parity_diff': dp_diff,
        'equal_opportunity_diff': eo_diff if len(tpr_by_group) > 0 else None
    }
```

---

## 6. 完整的 ML 可观测性仪表盘

**Grafana 仪表盘 JSON（节选）：**

```json
{
  "dashboard": {
    "title": "ML Model Observability",
    "panels": [
      {
        "title": "Model Accuracy Over Time",
        "type": "timeseries",
        "targets": [{
          "expr": "model_accuracy{model_name=\"fraud-detector\"}",
          "legendFormat": "{{ model_version }}"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0,
            "max": 1,
            "thresholds": {
              "steps": [
                {"value": 0, "color": "red"},
                {"value": 0.85, "color": "yellow"},
                {"value": 0.92, "color": "green"}
              ]
            }
          }
        }
      },
      {
        "title": "Feature Drift (PSI)",
        "type": "bargauge",
        "targets": [{
          "expr": "feature_psi_score{model_name=\"fraud-detector\"}"
        }],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 0.1, "color": "yellow"},
                {"value": 0.25, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "title": "Training Loss",
        "type": "timeseries",
        "targets": [{
          "expr": "training_metric_value{metric_name=\"train_loss\"}",
          "legendFormat": "Run {{ run_id }}"
        }]
      },
      {
        "title": "Prediction Distribution",
        "type": "heatmap",
        "targets": [{
          "expr": "rate(model_prediction_value_bucket[5m])"
        }]
      }
    ]
  }
}
```

---

## 总结

本课学习了：

- 监控 ML 模型性能（准确率、精确率、召回率等）。
- 使用统计检验检测数据漂移（KS 检验、PSI、卡方检验）。
- 使用 MLflow 追踪训练管道与实验。
- 使用 SHAP 值监控模型可解释性。
- 根据受保护属性划分群体，衡量模型公平性。
- 构建全面的 ML 可观测性仪表盘。

## 下一步

- **第 08 课：** 最佳实践与可观测性文化。
- **实践：** 为自己的 ML 模型实现漂移检测。
- **练习：** 创建完整的 ML 可观测性管道。

## 补充资源

- [MLflow 文档](https://mlflow.org/docs/latest/index.html)
- [SHAP 文档](https://shap.readthedocs.io/)
- [Evidently AI（漂移检测）](https://docs.evidentlyai.com/)
- [Fairlearn（公平性评估）](https://fairlearn.org/)
- [Alibi（模型可解释性）](https://docs.seldon.io/projects/alibi/en/stable/)

---

**预计时长：** 5–6 小时
**难度：** 高级
**前置条件：** 第 01–06 课、ML 基础、统计学。

> 译注：数据漂移不必然导致准确率下降，概念漂移及模型质量监控通常还需要真实标签。统计检验需要考虑样本量、参考分布、季节性、多重检验及效应大小。PSI 的经验阈值不能直接视为普遍有效的标准。SHAP 值反映特定解释方法及参考数据下的特征贡献，并不直接证明因果关系。公平性指标可能存在冲突，受保护属性的数据采集与使用需要遵守适用的隐私及合规要求。原文学习目标包含特征存储监控，但没有单独的正文小节；译文保留原结构。全部代码块及英文注释保持原样，未逐项执行。
