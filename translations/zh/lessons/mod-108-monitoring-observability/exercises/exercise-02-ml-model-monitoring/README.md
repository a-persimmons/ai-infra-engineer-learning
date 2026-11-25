# 练习 02：ML 模型监控与漂移检测

**预计时长：** 30–38 小时。

## 业务背景

公司在生产环境运营 15 个 ML 模型，每天提供 500 万次预测。近期事故暴露了关键监控缺口：

**事故 1——静默模型退化：**
- 欺诈检测模型准确率在三个月内从 94% 下降至 76%。
- 耗时两个月才发现（直到季度审查）。
- 费用：未检测到的欺诈造成 230 万美元损失。
- 根因：数据漂移（疫情后客户行为发生变化）。

**事故 2——特征存储中断：**
- 特征存储缓存故障导致延迟从 500ms 激增至 5 秒。
- 违反 P95 延迟 SLO（目标 500ms）。
- 45 分钟后才检测到问题（客户投诉）。
- 影响：12,000 次请求失败，引起客户不满。

**事故 3——模型版本发布缺陷：**
- 新模型版本（v3.2）对某些人口群体存在预测偏差。
- 耗时一周才通过人工审查发现。
- 影响：监管调查与公关危机。

ML 副总裁要求建立**综合 ML 模型监控系统**：

1. **自动检测数据漂移：** 24 小时内。
2. **实时追踪模型性能：** 准确率、精确率、召回率。
3. **监控预测质量：** 分布、异常值、偏差。
4. **在影响客户之前告警：** 检测性能退化。
5. **支持快速回滚：** 5 分钟内恢复至此前模型版本。

## 学习目标

完成本练习后，你将能够：

1. 实现全面的 ML 模型性能监控。
2. 使用统计检验检测数据漂移（KS 检验、PSI、Jensen-Shannon 散度）。
3. 追踪预测分布并检测异常。
4. 监控特征重要性并检测特征漂移。
5. 实现用于模型比较的 A/B 测试基础设施。
6. 根据性能退化构建自动化模型回滚。
7. 创建 ML 专用仪表盘及告警。

## 前置条件

- Module 106 练习 05（模型监控与漂移）——概念。
- Module 108 练习 01（可观测性技术栈）——基础设施。
- 理解 ML 模型评估指标。
- Python 编程（中级至高级）。
- 基础统计学知识。

## 问题描述

构建 **ML 模型监控系统**：

1. 持续**追踪模型性能**（准确率、延迟、吞吐量）。
2. 使用统计检验**检测输入特征的数据漂移**。
3. **监控预测分布**，发现异常。
4. **实现 A/B 测试**，支持安全模型发布。
5. 性能退化时**自动回滚**。
6. 通过仪表盘及告警**提供可见性**。

### 成功指标

- 24 小时内检测数据漂移（原基线为两个月）。
- 实时追踪模型性能（延迟低于 1 分钟）。
- 性能退化后 5 分钟内自动回滚。
- 零静默模型故障（检测率 100%）。
- A/B 测试基础设施支持超过 10 个并发测试。
- ML 监控仪表盘加载时间低于 3 秒。

## 架构概览

```
┌────────────────────────────────────────────────────────────────┐
│              ML Model Monitoring System                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Prediction      │    │  Reference       │                 │
│  │  Service         │───▶│  Data Store      │                 │
│  │  (ML Model)      │    │  (PostgreSQL)    │                 │
│  └──────────────────┘    └──────────────────┘                 │
│           │                        │                            │
│           │ Predictions            │ Baseline stats             │
│           ▼                        ▼                            │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Drift Detector  │◀───│  Statistical     │                 │
│  │  - KS test       │    │  Tests           │                 │
│  │  - PSI           │    │  - Compare       │                 │
│  │  - JS divergence │    │    distributions │                 │
│  └──────────────────┘    └──────────────────┘                 │
│           │                                                     │
│           │ Drift alerts                                        │
│           ▼                                                     │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Performance     │    │  A/B Test        │                 │
│  │  Tracker         │◀───│  Controller      │                 │
│  │  - Accuracy      │    │  - Traffic split │                 │
│  │  - Precision     │    │  - Metrics       │                 │
│  │  - Recall        │    │    comparison    │                 │
│  └──────────────────┘    └──────────────────┘                 │
│           │                        │                            │
│           │                        │                            │
│           ▼                        ▼                            │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Auto Rollback   │    │  Prometheus      │                 │
│  │  Engine          │◀───│  (Metrics)       │                 │
│  │  - Detect degr.  │    │                  │                 │
│  │  - Rollback v.   │    └──────────────────┘                 │
│  └──────────────────┘             │                            │
│           │                        │                            │
│           │                        ▼                            │
│           │               ┌──────────────────┐                 │
│           └──────────────▶│  Grafana         │                 │
│                           │  ML Dashboards   │                 │
│                           └──────────────────┘                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 实现任务

### 第一部分：数据漂移检测（8–10 小时）

实现统计检验，检测输入数据分布的变化。

#### 1.1 漂移检测器

创建 `src/drift_detection/drift_detector.py`：

```python
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

class DriftSeverity(Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class DriftResult:
    feature_name: str
    drift_detected: bool
    severity: DriftSeverity
    test_statistic: float
    p_value: float
    threshold: float
    description: str

class KolmogorovSmirnovTest:
    """
    Kolmogorov-Smirnov test for continuous feature drift.

    Compares two distributions (reference vs current) to detect drift.

    Good for:
    - Continuous numerical features
    - Detecting any distribution change

    Not good for:
    - Categorical features
    - Small sample sizes (<100 samples)
    """

    def __init__(self, significance_level: float = 0.05):
        self.significance_level = significance_level

    def detect_drift(
        self,
        reference_data: np.ndarray,
        current_data: np.ndarray,
        feature_name: str
    ) -> DriftResult:
        """
        TODO: Perform KS test to detect drift

        # Kolmogorov-Smirnov test
        statistic, p_value = stats.ks_2samp(reference_data, current_data)

        # Interpretation:
        # - p_value < 0.05: Distributions are different (drift detected)
        # - p_value >= 0.05: No significant drift

        # Severity based on p-value:
        # - p < 0.001: CRITICAL
        # - p < 0.01: HIGH
        # - p < 0.05: MEDIUM
        # - p >= 0.05: NONE

        Return DriftResult with test results
        """
        pass

class PopulationStabilityIndex:
    """
    Population Stability Index (PSI) for categorical and continuous features.

    PSI measures how much the distribution has shifted.

    PSI Interpretation:
    - PSI < 0.1: No significant change
    - 0.1 <= PSI < 0.2: Moderate drift (investigate)
    - PSI >= 0.2: Significant drift (action required)

    Good for:
    - Both categorical and continuous features
    - Easy to interpret (single number)
    - Industry standard in credit risk

    Formula:
    PSI = Σ (actual% - expected%) × ln(actual% / expected%)
    """

    THRESHOLDS = {
        'low': 0.1,
        'medium': 0.15,
        'high': 0.2
    }

    def calculate_psi(
        self,
        reference_data: np.ndarray,
        current_data: np.ndarray,
        num_bins: int = 10
    ) -> float:
        """
        TODO: Calculate Population Stability Index

        Steps:
        1. Create bins from reference data:
           bins = np.percentile(reference_data, np.linspace(0, 100, num_bins + 1))

        2. Calculate % of samples in each bin for reference and current:
           ref_percents = histogram of reference data
           cur_percents = histogram of current data

        3. Calculate PSI:
           psi = 0
           for i in range(num_bins):
               psi += (cur_percents[i] - ref_percents[i]) * np.log(cur_percents[i] / ref_percents[i])

        Handle edge cases:
        - If bin has 0 samples, add small epsilon (1e-6) to avoid log(0)

        Return PSI value
        """
        pass

    def detect_drift(
        self,
        reference_data: np.ndarray,
        current_data: np.ndarray,
        feature_name: str
    ) -> DriftResult:
        """
        TODO: Detect drift using PSI

        psi = self.calculate_psi(reference_data, current_data)

        # Determine severity
        if psi < self.THRESHOLDS['low']:
            severity = DriftSeverity.NONE
        elif psi < self.THRESHOLDS['medium']:
            severity = DriftSeverity.LOW
        elif psi < self.THRESHOLDS['high']:
            severity = DriftSeverity.MEDIUM
        else:
            severity = DriftSeverity.CRITICAL

        Return DriftResult
        """
        pass

class JensenShannonDivergence:
    """
    Jensen-Shannon Divergence for distribution comparison.

    Symmetric version of KL divergence.
    Bounded: 0 <= JS <= 1

    Good for:
    - Comparing probability distributions
    - More stable than KL divergence
    - Works for categorical and continuous features

    JSD Interpretation:
    - JSD < 0.1: Distributions very similar
    - 0.1 <= JSD < 0.3: Moderate difference
    - JSD >= 0.3: Significant difference
    """

    def calculate_jsd(
        self,
        reference_data: np.ndarray,
        current_data: np.ndarray,
        num_bins: int = 50
    ) -> float:
        """
        TODO: Calculate Jensen-Shannon Divergence

        Steps:
        1. Create histograms (probability distributions):
           bins = np.linspace(min(both), max(both), num_bins)
           p, _ = np.histogram(reference_data, bins=bins, density=True)
           q, _ = np.histogram(current_data, bins=bins, density=True)

           # Normalize to probabilities
           p = p / np.sum(p)
           q = q / np.sum(q)

        2. Calculate JSD:
           m = 0.5 * (p + q)
           jsd = 0.5 * kl_divergence(p, m) + 0.5 * kl_divergence(q, m)

           where kl_divergence(a, b) = Σ a[i] × log(a[i] / b[i])

        3. Add epsilon to avoid log(0)

        Return JSD value
        """
        pass

class DriftDetector:
    """Main drift detection coordinator."""

    def __init__(self):
        self.ks_test = KolmogorovSmirnovTest()
        self.psi_test = PopulationStabilityIndex()
        self.jsd_test = JensenShannonDivergence()

    def detect_multivariate_drift(
        self,
        reference_df: pd.DataFrame,
        current_df: pd.DataFrame,
        features: List[str]
    ) -> Dict[str, DriftResult]:
        """
        TODO: Detect drift across multiple features

        For each feature:
        1. Extract reference and current data
        2. Run multiple drift tests:
           - KS test (continuous features)
           - PSI (all features)
           - JSD (all features)

        3. Aggregate results (drift detected if ANY test shows drift)

        Return dict: feature_name -> DriftResult
        """
        results = {}

        for feature in features:
            ref_data = reference_df[feature].values
            cur_data = current_df[feature].values

            # TODO: Run tests
            ks_result = self.ks_test.detect_drift(ref_data, cur_data, feature)
            psi_result = self.psi_test.detect_drift(ref_data, cur_data, feature)
            jsd_result = self.jsd_test.detect_drift(ref_data, cur_data, feature)

            # TODO: Aggregate (use most severe result)
            # ...

            results[feature] = ...

        return results

    def generate_drift_report(self, drift_results: Dict[str, DriftResult]) -> str:
        """
        TODO: Generate human-readable drift report

        Example:
        === Data Drift Detection Report ===
        Date: 2023-10-25 14:30:00 UTC

        CRITICAL Drift Detected (3 features):
        1. transaction_amount: PSI=0.45 (threshold: 0.2)
           - Distribution has shifted significantly
           - Recommend: Retrain model or investigate data source

        2. merchant_category: KS test p-value=0.001
           - Category distribution changed
           - Recommend: Check for new merchant categories

        MEDIUM Drift (2 features):
        ...

        NO Drift (10 features):
        ...

        Overall Status: ACTION REQUIRED
        Recommended Action: Retrain model within 7 days
        """
        pass
```

#### 1.2 持续监控

创建 `src/drift_detection/drift_monitor.py`：

```python
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict
import pandas as pd

class ContinuousDriftMonitor:
    """
    Continuously monitor for data drift.

    Runs drift detection every N hours and alerts on drift.
    """

    def __init__(
        self,
        drift_detector: DriftDetector,
        reference_data_path: str,
        check_interval_hours: int = 6
    ):
        self.drift_detector = drift_detector
        self.reference_data = pd.read_parquet(reference_data_path)
        self.check_interval_hours = check_interval_hours

    def fetch_recent_predictions(
        self,
        hours: int = 24
    ) -> pd.DataFrame:
        """
        TODO: Fetch recent prediction data from database

        Query PostgreSQL for predictions from last N hours:

        SELECT
            feature_1,
            feature_2,
            ...
            prediction,
            prediction_timestamp
        FROM predictions
        WHERE prediction_timestamp > NOW() - INTERVAL '{hours} hours'
        LIMIT 10000  -- Sufficient sample size for statistical tests

        Return DataFrame with same schema as reference_data
        """
        pass

    def run_drift_check(self):
        """
        TODO: Run drift detection check

        1. Fetch recent predictions
        2. Run drift detector
        3. If drift detected:
           - Log to Prometheus metrics
           - Send alert to Slack/PagerDuty
           - Store drift report
        4. Update drift status dashboard
        """
        print(f"[{datetime.now()}] Running drift detection check...")

        # TODO: Fetch data
        current_data = self.fetch_recent_predictions(hours=24)

        if len(current_data) < 1000:
            print(f"Insufficient data: {len(current_data)} samples (need 1000+)")
            return

        # TODO: Run drift detection
        features = [col for col in current_data.columns if col not in ['prediction', 'timestamp']]
        drift_results = self.drift_detector.detect_multivariate_drift(
            self.reference_data,
            current_data,
            features
        )

        # TODO: Check for critical drift
        critical_drifts = [
            feature for feature, result in drift_results.items()
            if result.severity in [DriftSeverity.CRITICAL, DriftSeverity.HIGH]
        ]

        if critical_drifts:
            self._alert_drift_detected(critical_drifts, drift_results)

        # TODO: Log metrics to Prometheus
        self._log_drift_metrics(drift_results)

    def _alert_drift_detected(
        self,
        drifted_features: List[str],
        drift_results: Dict[str, DriftResult]
    ):
        """
        TODO: Send alerts on drift detection

        Send to:
        1. Prometheus (increment drift_detected counter)
        2. Slack (#ml-alerts channel)
        3. PagerDuty (if CRITICAL severity)

        Include:
        - Which features drifted
        - Severity
        - Recommended action
        """
        pass

    def _log_drift_metrics(self, drift_results: Dict[str, DriftResult]):
        """
        TODO: Log drift metrics to Prometheus

        Metrics:
        - drift_detected{feature="amount", severity="high"} = 1
        - psi_score{feature="amount"} = 0.25
        - ks_statistic{feature="amount"} = 0.15
        """
        pass

    def start(self):
        """
        TODO: Start continuous monitoring

        schedule.every(self.check_interval_hours).hours.do(self.run_drift_check)

        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute for scheduled jobs
        """
        pass
```

### 第二部分：模型性能追踪（7–9 小时）

实时追踪模型准确率、精确率及召回率。

#### 2.1 性能指标计算器

创建 `src/performance/metrics_tracker.py`：

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from typing import Dict, List
import numpy as np
from dataclasses import dataclass

@dataclass
class ModelPerformance:
    timestamp: datetime
    model_name: str
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: np.ndarray
    sample_size: int

class PerformanceTracker:
    """
    Track model performance metrics in real-time.

    Challenge: In production, we don't always have ground truth labels immediately.

    Solutions:
    1. Delayed labels: Wait for labels (e.g., fraud confirmed after 24 hours)
    2. Proxy metrics: Use click-through rate as proxy for relevance
    3. Human labeling: Sample and label subset for evaluation
    """

    def __init__(self, model_name: str, model_version: str):
        self.model_name = model_name
        self.model_version = model_version

    def calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: Optional[np.ndarray] = None
    ) -> ModelPerformance:
        """
        TODO: Calculate all performance metrics

        # Classification metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, average='binary')
        recall = recall_score(y_true, y_pred, average='binary')
        f1 = f1_score(y_true, y_pred, average='binary')

        # ROC AUC (requires probabilities)
        if y_pred_proba is not None:
            roc_auc = roc_auc_score(y_true, y_pred_proba)
        else:
            roc_auc = None

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)

        Return ModelPerformance object
        """
        pass

    def track_performance_over_time(
        self,
        performance_history: List[ModelPerformance],
        window_days: int = 30
    ) -> Dict:
        """
        TODO: Analyze performance trends

        Calculate:
        1. Current metrics vs 30-day average
        2. Performance degradation rate (slope of accuracy over time)
        3. Statistical significance of degradation (t-test)

        Return:
        {
            'current_accuracy': 0.92,
            'avg_accuracy_30d': 0.94,
            'degradation_rate': -0.001,  # Accuracy dropping 0.1% per day
            'degradation_significant': True,
            'days_until_slo_violation': 15  # At current rate, SLO violated in 15 days
        }
        """
        pass

    def detect_performance_degradation(
        self,
        current_performance: ModelPerformance,
        baseline_performance: ModelPerformance,
        threshold: float = 0.02  # 2% degradation
    ) -> bool:
        """
        TODO: Detect if performance has degraded significantly

        Check if any metric has decreased by more than threshold:
        - Accuracy drop > 2%
        - Precision drop > 2%
        - Recall drop > 2%

        Return True if degradation detected
        """
        pass

class PerformanceMonitor:
    """Continuous performance monitoring with alerting."""

    def __init__(self, tracker: PerformanceTracker):
        self.tracker = tracker
        self.performance_history: List[ModelPerformance] = []

    def fetch_ground_truth_labels(
        self,
        prediction_ids: List[str]
    ) -> Dict[str, int]:
        """
        TODO: Fetch ground truth labels for predictions

        In production, labels may arrive with delay:
        - Fraud detection: Label arrives when fraud confirmed (24-72 hours)
        - Recommendations: Click/no-click label arrives immediately
        - Credit risk: Default/no-default label arrives after 30-90 days

        Query database:
        SELECT prediction_id, ground_truth_label, label_timestamp
        FROM prediction_labels
        WHERE prediction_id IN (...)
        AND label_timestamp IS NOT NULL

        Return dict: prediction_id -> label
        """
        pass

    def evaluate_recent_predictions(self, hours: int = 24):
        """
        TODO: Evaluate predictions from last N hours

        1. Fetch predictions with ground truth labels
        2. Calculate performance metrics
        3. Compare to baseline
        4. Alert if degradation detected
        5. Log metrics to Prometheus
        """
        pass
```

### 第三部分：预测分布监控（6–8 小时）

监控预测输出以发现异常。

#### 3.1 预测分析器

创建 `src/prediction/prediction_analyzer.py`：

```python
class PredictionDistributionMonitor:
    """
    Monitor distribution of model predictions for anomalies.

    Unusual prediction patterns can indicate:
    - Model bug (always predicting same class)
    - Data drift (input distribution changed)
    - Feature pipeline bug (features corrupted)
    """

    def __init__(self, model_name: str):
        self.model_name = model_name
        self.baseline_distribution = None

    def analyze_prediction_distribution(
        self,
        predictions: np.ndarray,
        prediction_probabilities: Optional[np.ndarray] = None
    ) -> Dict:
        """
        TODO: Analyze prediction distribution for anomalies

        For classification:
        1. Class balance:
           - Is model predicting mostly one class?
           - Expected: fraud_rate ~5%, if predicting 50%, something wrong

        2. Confidence distribution:
           - Are predictions confident (prob near 0 or 1)?
           - Or uncertain (prob near 0.5)?
           - Low confidence may indicate out-of-distribution inputs

        3. Prediction rate over time:
           - Sudden spike in positive predictions?
           - Could indicate data shift or model bug

        For regression:
        1. Prediction range:
           - Are predictions within expected range?
           - Outliers? (predictions > 3 std dev from mean)

        2. Distribution shape:
           - Has distribution changed? (should be similar to training)

        Return analysis results
        """
        pass

    def detect_prediction_anomalies(
        self,
        current_predictions: np.ndarray,
        baseline_predictions: np.ndarray
    ) -> List[str]:
        """
        TODO: Detect anomalies in prediction distribution

        Anomalies to check:
        1. Class imbalance shift:
           - Baseline: 5% positive, Current: 20% positive → ALERT

        2. Confidence collapse:
           - All predictions near 0.5 (model uncertain) → ALERT

        3. Prediction spike:
           - Sudden 10× increase in positive predictions → ALERT

        4. Out-of-range predictions:
           - Regression model predicting negative when only positive valid → ALERT

        Return list of detected anomalies
        """
        anomalies = []

        # TODO: Implement checks

        return anomalies
```

### 第四部分：A/B 测试基础设施（5–7 小时）

构建用于安全模型发布的基础设施。

#### 4.1 A/B 测试控制器

创建 `src/ab_testing/ab_controller.py`：

```python
from dataclasses import dataclass
from typing import Dict, Optional
from enum import Enum
import random

class TrafficSplitStrategy(Enum):
    RANDOM = "random"  # Randomly assign to A or B
    HASH_BASED = "hash_based"  # Consistent assignment based on user_id
    GRADUAL_ROLLOUT = "gradual_rollout"  # Gradually increase B traffic

@dataclass
class ABTestConfig:
    name: str
    model_a_version: str  # Control (baseline)
    model_b_version: str  # Treatment (new version)
    traffic_split_percent_b: float  # % of traffic to model B (0-100)
    strategy: TrafficSplitStrategy
    success_metric: str  # 'accuracy', 'precision', 'roc_auc'
    minimum_sample_size: int = 1000
    statistical_significance_threshold: float = 0.05

class ABTestController:
    """
    A/B testing for model rollouts.

    Safely test new model versions by:
    1. Routing % of traffic to new model
    2. Comparing performance metrics
    3. Auto-promote if better, rollback if worse
    """

    def __init__(self):
        self.active_tests: Dict[str, ABTestConfig] = {}

    def create_ab_test(self, config: ABTestConfig):
        """
        TODO: Create new A/B test

        1. Validate config
        2. Deploy both model versions
        3. Start routing traffic
        4. Initialize metrics collection

        self.active_tests[config.name] = config
        """
        pass

    def route_prediction_request(
        self,
        test_name: str,
        user_id: str
    ) -> str:
        """
        TODO: Route request to model A or B based on strategy

        If strategy == RANDOM:
            if random.random() < (traffic_split / 100):
                return model_b_version
            else:
                return model_a_version

        If strategy == HASH_BASED:
            # Consistent assignment (same user always gets same model)
            hash_value = hash(user_id) % 100
            if hash_value < traffic_split:
                return model_b_version
            else:
                return model_a_version

        If strategy == GRADUAL_ROLLOUT:
            # Increase traffic_split over time (e.g., 1%, 5%, 25%, 50%, 100%)
            # See gradual_rollout() method

        Return model_version to use
        """
        pass

    def collect_ab_test_metrics(
        self,
        test_name: str,
        model_version: str,
        prediction: int,
        ground_truth: Optional[int] = None
    ):
        """
        TODO: Collect metrics for A/B test comparison

        Store in database:
        - test_name
        - model_version (A or B)
        - prediction
        - ground_truth (if available)
        - timestamp

        This data will be used to calculate statistical significance
        """
        pass

    def analyze_ab_test_results(self, test_name: str) -> Dict:
        """
        TODO: Analyze A/B test results

        1. Fetch metrics for model A and model B
        2. Calculate success metric (accuracy, precision, etc.)
        3. Perform statistical significance test:
           - Z-test for proportions (accuracy, precision)
           - T-test for continuous metrics

        4. Determine winner:
           - If B significantly better (p < 0.05): B wins
           - If A significantly better: A wins (rollback B)
           - If no significant difference: Inconclusive

        Return:
        {
            'model_a_metric': 0.92,
            'model_b_metric': 0.94,
            'improvement': 0.02,  # +2%
            'p_value': 0.001,
            'statistically_significant': True,
            'winner': 'model_b',
            'recommendation': 'Promote model B to 100% traffic'
        }
        """
        pass

    def auto_promote_or_rollback(self, test_name: str):
        """
        TODO: Automatically promote winner or rollback loser

        1. Analyze test results
        2. If model B wins:
           - Gradually increase traffic to 100%
           - Mark model B as production
           - End test

        3. If model A wins (B is worse):
           - Rollback: Route all traffic to model A
           - Alert team about failed rollout
           - End test

        4. If inconclusive:
           - Continue test (need more data)
        """
        pass

    def gradual_rollout(
        self,
        test_name: str,
        rollout_schedule: List[Tuple[int, float]]
    ):
        """
        TODO: Gradually increase traffic to new model

        rollout_schedule = [
            (60, 1),      # 1% traffic for 60 minutes
            (120, 5),     # 5% traffic for 120 minutes
            (240, 25),    # 25% traffic for 240 minutes
            (480, 50),    # 50% traffic for 480 minutes
            (0, 100),     # 100% traffic (full rollout)
        ]

        At each stage:
        - Update traffic split
        - Monitor for performance degradation
        - If degradation: rollback to previous stage
        - If OK: proceed to next stage
        """
        pass
```

### 第五部分：自动化回滚（4–6 小时）

性能退化时实现自动回滚。

#### 5.1 回滚引擎

创建 `src/rollback/auto_rollback.py`：

```python
class AutoRollbackEngine:
    """
    Automatically rollback model deployments on performance degradation.

    Triggers:
    1. Accuracy drops >2% from baseline
    2. Error rate >1%
    3. Latency P95 >500ms
    4. Critical drift detected
    """

    def __init__(self, performance_tracker: PerformanceTracker):
        self.performance_tracker = performance_tracker
        self.rollback_history: List[Dict] = []

    def monitor_and_rollback(self):
        """
        TODO: Continuously monitor performance and rollback if needed

        Run every 5 minutes:
        1. Fetch recent performance metrics
        2. Check rollback triggers
        3. If trigger activated:
           - Execute rollback
           - Alert team
           - Log incident

        schedule.every(5).minutes.do(self._check_performance)
        """
        pass

    def _check_performance(self):
        """
        TODO: Check if rollback needed

        Fetch current performance:
        - Accuracy, precision, recall
        - Error rate
        - Latency P95

        Compare to baseline (last stable version):
        - If accuracy drop >2%: ROLLBACK
        - If error rate >1%: ROLLBACK
        - If latency >500ms: ROLLBACK

        If multiple models degraded:
        - Rollback most critical first
        """
        pass

    def execute_rollback(
        self,
        model_name: str,
        current_version: str,
        rollback_to_version: str,
        reason: str
    ):
        """
        TODO: Execute model rollback

        Steps:
        1. Validate rollback_to_version exists and is healthy
        2. Update model routing config:
           - Route 100% traffic to rollback_to_version
           - Keep current_version deployed for debugging

        3. Verify rollback success:
           - Wait 2 minutes
           - Check metrics improved
           - If not improved: escalate to on-call

        4. Log rollback:
           - Store in rollback_history
           - Send alert to Slack/PagerDuty
           - Create incident ticket

        5. Post-rollback:
           - Analyze root cause
           - Fix issue in current_version
           - Re-deploy with A/B test
        """
        print(f"🚨 ROLLBACK: {model_name} {current_version} → {rollback_to_version}")
        print(f"Reason: {reason}")

        # TODO: Implement rollback logic

        # Log rollback
        self.rollback_history.append({
            'timestamp': datetime.now(),
            'model_name': model_name,
            'from_version': current_version,
            'to_version': rollback_to_version,
            'reason': reason
        })
```

## 验收标准

### 功能需求

- [ ] 实现数据漂移检测（KS 检验、PSI、JSD）。
- [ ] 漂移监控每 6 小时自动运行。
- [ ] 追踪模型性能（准确率、精确率、召回率、ROC-AUC）。
- [ ] 预测分布监控可以检测异常。
- [ ] A/B 测试基础设施支持 10 个以上并发测试。
- [ ] 性能退化时触发自动回滚。
- [ ] ML 监控仪表盘展示全部指标。

### 性能需求

- [ ] 对 1 万个样本的漂移检测在 2 分钟内完成。
- [ ] 实时更新性能指标（延迟低于 1 分钟）。
- [ ] A/B 测试分析在 5 秒内完成。
- [ ] 回滚在 5 分钟内执行完成。
- [ ] 仪表盘加载时间低于 3 秒。

### 运维需求

- [ ] 24 小时内检测数据漂移（检测率 100%）。
- [ ] 零静默模型故障（检测全部退化）。
- [ ] 自动回滚成功率超过 95%。
- [ ] 告警误报率低于 5%。

### 代码质量

- [ ] 全部漂移检测算法均具有单元测试。
- [ ] 使用已知数据集验证统计检验。
- [ ] 全面日志记录及错误处理。
- [ ] 文档包含使用示例。

## 测试策略

### 单元测试

```python
# tests/test_drift_detection.py
def test_ks_test_detects_drift():
    """Verify KS test detects distribution shift."""
    # TODO: Create reference and shifted distributions
    # Verify drift detected
```

### 集成测试

```python
# tests/test_ab_testing.py
def test_ab_test_workflow():
    """Test complete A/B test workflow."""
    # 1. Create test
    # 2. Route traffic
    # 3. Collect metrics
    # 4. Analyze results
    # 5. Verify promotion/rollback
```

## 交付物

1. **源代码**（`src/`）：
   - `drift_detection/`——漂移检测器、持续监控器。
   - `performance/`——性能追踪器、指标计算器。
   - `prediction/`——预测分布分析器。
   - `ab_testing/`——A/B 测试控制器。
   - `rollback/`——自动回滚引擎。

2. **仪表盘**（`dashboards/`）：
   - ML 模型性能仪表盘（Grafana JSON）。
   - 数据漂移仪表盘。
   - A/B 测试比较仪表盘。

3. **文档**（`docs/`）：
   - `ML_MONITORING_GUIDE.md`——完整指南。
   - `DRIFT_DETECTION.md`——漂移检测算法。
   - `AB_TESTING.md`——A/B 测试最佳实践。
   - `ROLLBACK_PROCEDURES.md`——回滚流程。

4. **部署**（`kubernetes/`）：
   - 漂移监控器部署。
   - 性能追踪器部署。
   - A/B 测试控制器部署。

## 额外挑战

1. **特征重要性追踪（额外 6 小时）：**
   - 监控特征重要性随时间的变化。
   - 重要特征失去相关性时告警。
   - 检测特征泄漏。

2. **偏差检测（额外 8 小时）：**
   - 监控不同人口群体的预测偏差。
   - 实现公平性指标（Demographic Parity、Equalized Odds）。
   - 偏差增加时告警。

3. **可解释性监控（额外 6 小时）：**
   - 追踪预测的 SHAP 值。
   - 检测模型解释的变化。
   - 监控模型信任分数。

## 资源

### 文档

- [Evidently AI——ML 监控](https://docs.evidentlyai.com/)
- [Alibi Detect——漂移检测](https://docs.seldon.io/projects/alibi-detect/)
- [scikit-learn 指标](https://scikit-learn.org/stable/modules/model_evaluation.html)

### 研究论文

- [显式失败：数据集偏移检测方法的实证研究](https://arxiv.org/abs/1810.11953)
- [概念漂移适应综述](https://dl.acm.org/doi/10.1145/2523813)

## 提交

通过 Git 提交实现：

```bash
git add .
git commit -m "Complete Exercise 02: ML Model Monitoring"
git push origin exercise-02-ml-model-monitoring
```

确保提交包含：
- 完整漂移检测实现。
- 性能追踪系统。
- A/B 测试基础设施。
- 自动回滚引擎。
- 仪表盘及文档。

---

**预计时长分解：**
- 第一部分（漂移检测）：8–10 小时。
- 第二部分（性能追踪）：7–9 小时。
- 第三部分（预测监控）：6–8 小时。
- 第四部分（A/B 测试）：5–7 小时。
- 第五部分（自动回滚）：4–6 小时。
- **合计（原文）：** 30–38 小时。

> 译注：案例数字及 100% 检测率属于原文场景或验收目标，不应视为实际能力保证。实时准确率等监督指标取决于真实标签的到达时间。偏差与可解释性评估需结合隐私、群体定义和业务风险。回滚还需验证旧模型对当前数据的适用性。原始代码块及 TODO 保留，未实际运行。
