# 练习 04：使用自定义指标的 Kubernetes 集群自动扩缩容器

**预计时长：** 35–43 小时
**难度：** 高级
**前置条件：** Kubernetes、Python 3.9+、Helm、Prometheus、Custom Metrics API

## 概览

构建生产级集群自动扩缩容系统，基于自定义指标（GPU 利用率、模型推理队列深度、成本优化）调整 Kubernetes 节点数量。使用 Horizontal Pod Autoscaler（HPA）、Vertical Pod Autoscaler（VPA）、Cluster Autoscaler 与自定义指标提供程序，实现智能扩缩容决策。本练习教授构建成本高效 ML 基础设施所需的高级 Kubernetes 扩缩容模式。

在生产 ML 基础设施中，智能扩缩容对以下方面至关重要：
- **成本优化：** 在低流量期间缩容（原文示例节省 60–70% 计算成本）。
- **性能：** 在队列深度增加之前主动扩容。
- **GPU 效率：** 紧凑放置 GPU 工作负载，提高利用率。
- **SLA 达标：** 在流量突增时维持 P95 延迟低于 100ms。
- **多租户：** 在团队及模型之间公平分配资源。

## 学习目标

完成本练习后，你将能够：

1. **实现基于自定义指标的 HPA**，指标来自 Prometheus。
2. **部署 VPA**，合理调整 Pod 资源请求。
3. **配置 Cluster Autoscaler**，实现节点扩缩容。
4. **构建自定义指标提供程序**，暴露 ML 专用指标。
5. **实现预测式扩缩容**，使用时间序列预测。
6. **优化扩缩容决策**，平衡成本与性能。
7. **处理 GPU 节点扩缩容**及其约束（可用区容量、配额）。

## 业务背景

**实际业务场景（原文案例）：** ML 平台在三个 Kubernetes 集群（开发、预发布、生产）中提供 50 个模型的服务。目前存在以下问题：

- **成本高：** 生产集群全天运行 20 个 GPU 节点（每天 14,400 美元），实际每天只需要 12–16 小时。
- **扩容缓慢：** 流量突增导致 Pod 等待 5 分钟（Cluster Autoscaler 创建节点需要 3–4 分钟）。
- **容量浪费：** Pod 请求 4 CPU/8Gi，实际使用 1.5 CPU/3Gi（约 62% 浪费）。
- **GPU 利用率不足：** 部分 Pod 请求整块 GPU，但仅使用 30%。
- **人工干预：** 运维团队在已知流量高峰（黑色星期五、产品发布）之前手动扩容。

你的任务是构建自动扩缩容器：
- 基于推理队列深度扩缩容（目标：等待请求少于 10 个）。
- 提前 15 分钟预测流量突增，主动扩容。
- 合理调整 Pod 请求，将浪费减少 40% 以上。
- 优先采用适用的 Spot 实例，目标节省 60% 成本。
- 处理 GPU 特有约束（nvidia.com/gpu 污点、配额）。

## 项目结构

```
exercise-04-k8s-cluster-autoscaler/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── pyproject.toml                     # Poetry config
├── helm/
│   └── custom-metrics-adapter/        # Helm chart for metrics adapter
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── apiservice.yaml
│           └── rbac.yaml
├── kubernetes/
│   ├── hpa/
│   │   ├── cpu-based-hpa.yaml         # Standard CPU-based HPA
│   │   ├── custom-metric-hpa.yaml     # HPA using custom metrics
│   │   └── external-metric-hpa.yaml   # HPA using external metrics (SQS queue)
│   ├── vpa/
│   │   ├── vpa-recommender.yaml       # VPA in recommendation mode
│   │   └── vpa-auto.yaml              # VPA in auto mode
│   ├── cluster-autoscaler/
│   │   ├── deployment.yaml            # Cluster Autoscaler deployment
│   │   └── configmap.yaml             # CA configuration
│   └── priorities/
│       ├── priority-classes.yaml      # Pod priority classes
│       └── pod-disruption-budgets.yaml
├── src/
│   └── autoscaler/
│       ├── __init__.py
│       ├── metrics_provider.py        # Custom metrics API provider
│       ├── metrics_collector.py       # Collect metrics from Prometheus
│       ├── predictor.py               # Time-series forecasting
│       ├── optimizer.py               # Scaling decision optimization
│       ├── cost_calculator.py         # Cost-aware scaling
│       ├── gpu_scheduler.py           # GPU-aware scheduling
│       └── cli.py                     # CLI for testing
├── tests/
│   ├── test_metrics_provider.py
│   ├── test_predictor.py
│   ├── test_optimizer.py
│   ├── test_cost_calculator.py
│   └── fixtures/
│       └── sample_metrics.json
├── examples/
│   ├── deploy_ml_service_with_hpa.yaml
│   ├── test_scale_up.sh
│   └── test_scale_down.sh
├── benchmarks/
│   ├── scale_up_latency.sh            # Measure time to scale
│   ├── cost_comparison.py             # Compare costs vs baseline
│   └── load_test.py                   # Generate traffic for testing
└── docs/
    ├── DESIGN.md                      # Architecture decisions
    ├── METRICS.md                     # Custom metrics reference
    └── TROUBLESHOOTING.md             # Common issues
```

## 需求

### 功能需求

扩缩容系统必须支持：

1. **HPA（Horizontal Pod Autoscaler）：**
   - 根据 CPU/内存利用率扩缩容。
   - 根据自定义指标（requests_per_second、queue_depth）扩缩容。
   - 根据外部指标（SQS 队列长度、Pub/Sub 积压量）扩缩容。
   - 遵守最小/最大副本数及扩缩容策略。

2. **VPA（Vertical Pod Autoscaler）：**
   - 根据实际用量推荐资源请求。
   - 自动更新 Pod 资源请求（原文采用重启 Pod 的方式）。
   - 防止过度或不足供应资源。

3. **Cluster Autoscaler：**
   - 当 Pod 因资源不足处于 Pending 时添加节点。
   - 移除利用率不足的节点（原文目标为利用率持续 10 分钟以上低于 50%）。
   - 遵守节点池约束（最小/最大节点数、实例类型）。
   - 处理多个节点池（纯 CPU、GPU、Spot 实例）。

4. **自定义指标提供程序：**
   - 通过 Kubernetes Custom Metrics API 暴露 ML 专用指标。
   - 聚合 Prometheus 指标。
   - 支持 inference_queue_depth、gpu_utilization、model_latency_p95 等指标。

5. **预测式扩缩容：**
   - 使用时间序列模型提前 15 分钟预测流量。
   - 在流量到达之前触发扩容。
   - 处理每日/每周模式。

6. **成本优化：**
   - 在适合的场景优先选择 Spot 实例。
   - 计算单请求成本。
   - 推荐合适的实例类型。

### 非功能需求

- **扩容延迟：** 从指标超限到 Pod 运行低于 90 秒。
- **缩容安全性：** 不过度激进地缩容，避免反复震荡。
- **准确性：** 预测准确率超过 80%。
- **成本节省：** 相较静态供应减少 40–60% 成本。

## 实现任务

### 任务 1：自定义指标提供程序（7–9 小时）

构建向 Kubernetes 暴露自定义指标的提供程序。

```python
# src/autoscaler/metrics_provider.py

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
import prometheus_client
from kubernetes import client, config

@dataclass
class CustomMetric:
    """Represents a custom metric for HPA"""
    name: str  # inference_queue_depth
    namespace: str
    target_name: str  # deployment/model-server
    target_kind: str  # Deployment, StatefulSet
    value: float
    timestamp: datetime

class MetricsProvider:
    """
    Implements Kubernetes Custom Metrics API

    Exposes metrics that HPA can use for scaling decisions.
    Integrates with Prometheus to fetch actual metric values.
    """

    def __init__(self, prometheus_url: str):
        self.prometheus_url = prometheus_url
        config.load_kube_config()
        self.k8s_apps = client.AppsV1Api()
        self.k8s_core = client.CoreV1Api()

    def get_metric(
        self,
        namespace: str,
        metric_name: str,
        target_name: str,
        target_kind: str = "Deployment"
    ) -> Optional[CustomMetric]:
        """
        Get custom metric value for a Kubernetes resource

        Example HPA usage:
        ```yaml
        metrics:
        - type: Object
          object:
            metric:
              name: inference_queue_depth
            describedObject:
              apiVersion: apps/v1
              kind: Deployment
              name: model-server
            target:
              type: Value
              value: "10"  # Scale when queue > 10
        ```

        Implementation:
        1. Fetch metric from Prometheus
        2. Aggregate across all pods in deployment
        3. Return current value
        """
        # TODO: Build Prometheus query
        # Example: avg(inference_queue_depth{namespace="prod", deployment="model-server"})
        query = self._build_prometheus_query(namespace, metric_name, target_name)

        # TODO: Execute query against Prometheus
        result = self._query_prometheus(query)

        # TODO: Parse result and return CustomMetric
        if result:
            return CustomMetric(
                name=metric_name,
                namespace=namespace,
                target_name=target_name,
                target_kind=target_kind,
                value=float(result),
                timestamp=datetime.now()
            )
        return None

    def list_metrics(self, namespace: str) -> List[str]:
        """
        List all available custom metrics in namespace

        Returns metric names that HPA can query
        """
        # TODO: Query Prometheus for available metrics
        # TODO: Filter to metrics relevant for autoscaling
        raise NotImplementedError

    def _build_prometheus_query(
        self,
        namespace: str,
        metric_name: str,
        target_name: str
    ) -> str:
        """
        Build PromQL query for metric

        Example queries:
        - inference_queue_depth: avg(inference_queue_depth{deployment="model-server"})
        - gpu_utilization: avg(DCGM_FI_DEV_GPU_UTIL{pod=~"model-server-.*"})
        - requests_per_second: rate(http_requests_total{deployment="model-server"}[1m])
        """
        # TODO: Construct PromQL query based on metric type
        raise NotImplementedError

    def _query_prometheus(self, query: str) -> Optional[float]:
        """Execute Prometheus query and return scalar result"""
        import requests

        # TODO: Send query to Prometheus HTTP API
        # POST /api/v1/query with query parameter
        response = requests.post(
            f"{self.prometheus_url}/api/v1/query",
            data={"query": query}
        )

        # TODO: Parse JSON response
        # Extract value from result[0].value[1]
        if response.status_code == 200:
            data = response.json()
            if data.get("data", {}).get("result"):
                return float(data["data"]["result"][0]["value"][1])
        return None
```

```python
# src/autoscaler/metrics_collector.py

from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime, timedelta
import requests

@dataclass
class MetricSample:
    """Time-series metric sample"""
    timestamp: datetime
    value: float

class MetricsCollector:
    """Collect and aggregate metrics from Prometheus"""

    def __init__(self, prometheus_url: str):
        self.prometheus_url = prometheus_url

    def get_time_series(
        self,
        metric_name: str,
        labels: Dict[str, str],
        duration: timedelta,
        step: str = "1m"
    ) -> List[MetricSample]:
        """
        Get time-series data for metric

        Args:
            metric_name: Prometheus metric name
            labels: Label filters (e.g., {"deployment": "model-server"})
            duration: How far back to query
            step: Sample interval (1m, 5m, etc.)

        Returns:
            List of samples with timestamps and values
        """
        # TODO: Build Prometheus range query
        # GET /api/v1/query_range?query=...&start=...&end=...&step=...

        end_time = datetime.now()
        start_time = end_time - duration

        label_str = ",".join(f'{k}="{v}"' for k, v in labels.items())
        query = f"{metric_name}{{{label_str}}}"

        # TODO: Execute query
        response = requests.get(
            f"{self.prometheus_url}/api/v1/query_range",
            params={
                "query": query,
                "start": start_time.timestamp(),
                "end": end_time.timestamp(),
                "step": step
            }
        )

        # TODO: Parse results into MetricSample objects
        raise NotImplementedError

    def get_current_pod_metrics(self, namespace: str, deployment: str) -> Dict[str, float]:
        """
        Get current resource metrics for all pods in deployment

        Returns:
            {
                "cpu_usage_cores": 2.5,
                "memory_usage_bytes": 4294967296,
                "gpu_utilization_percent": 85.0,
                "requests_per_second": 450.0
            }
        """
        # TODO: Query Prometheus for pod metrics
        # TODO: Aggregate across all pods
        raise NotImplementedError

    def get_node_metrics(self) -> List[Dict]:
        """
        Get metrics for all nodes

        Returns:
            [
                {
                    "node": "node-1",
                    "cpu_utilization": 0.45,
                    "memory_utilization": 0.62,
                    "gpu_count": 1,
                    "gpu_utilization": 0.85
                }
            ]
        """
        # TODO: Query node-level metrics
        raise NotImplementedError
```

**验收标准：**
- [ ] 通过 Kubernetes API 暴露自定义指标。
- [ ] 从 Prometheus 获取指标。
- [ ] 支持时间序列查询。
- [ ] HPA 可以基于自定义指标扩缩容。
- [ ] 每个 Deployment 支持多个指标。

---

### 任务 2：时间序列预测器（6–8 小时）

使用时间序列预测实现预测式扩缩容。

```python
# src/autoscaler/predictor.py

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression
from .metrics_collector import MetricSample

@dataclass
class Forecast:
    """Predicted metric value"""
    timestamp: datetime
    predicted_value: float
    confidence_interval: tuple  # (lower, upper)
    model_accuracy: float  # R² score

class TimeSeriesPredictor:
    """
    Predict future metric values for proactive scaling

    Strategies:
    1. Simple moving average (baseline)
    2. Linear regression on recent trend
    3. Seasonal decomposition (daily/weekly patterns)
    4. ARIMA model (advanced)
    """

    def __init__(self, lookback_hours: int = 24):
        self.lookback_hours = lookback_hours

    def predict(
        self,
        historical_data: List[MetricSample],
        horizon: timedelta = timedelta(minutes=15)
    ) -> Forecast:
        """
        Predict metric value N minutes into the future

        Args:
            historical_data: Past metric samples
            horizon: How far ahead to predict

        Returns:
            Forecast with predicted value and confidence
        """
        if len(historical_data) < 10:
            raise ValueError("Need at least 10 samples for prediction")

        # TODO: Extract features and target values
        X, y = self._prepare_data(historical_data)

        # TODO: Train regression model
        model = LinearRegression()
        model.fit(X, y)

        # TODO: Predict future value
        future_timestamp = datetime.now() + horizon
        future_features = self._extract_features(future_timestamp)
        predicted_value = model.predict([future_features])[0]

        # TODO: Calculate confidence interval
        # Use residuals to estimate uncertainty
        residuals = y - model.predict(X)
        std_error = np.std(residuals)
        confidence = (
            predicted_value - 2 * std_error,
            predicted_value + 2 * std_error
        )

        # TODO: Calculate model accuracy (R²)
        accuracy = model.score(X, y)

        return Forecast(
            timestamp=future_timestamp,
            predicted_value=max(0, predicted_value),  # Can't be negative
            confidence_interval=confidence,
            model_accuracy=accuracy
        )

    def detect_pattern(self, historical_data: List[MetricSample]) -> str:
        """
        Detect traffic pattern (constant, trending, seasonal)

        Returns: "constant", "increasing", "decreasing", "daily_seasonal", "weekly_seasonal"
        """
        # TODO: Analyze variance, trend, seasonality
        # TODO: Use autocorrelation to detect patterns
        raise NotImplementedError

    def _prepare_data(self, samples: List[MetricSample]) -> tuple:
        """
        Prepare data for training

        Extract features:
        - Hour of day (0-23)
        - Day of week (0-6)
        - Time since start (minutes)
        - Recent trend (slope of last 10 points)

        Target: metric value
        """
        X = []
        y = []

        for i, sample in enumerate(samples):
            features = self._extract_features(sample.timestamp, samples[:i])
            X.append(features)
            y.append(sample.value)

        return np.array(X), np.array(y)

    def _extract_features(
        self,
        timestamp: datetime,
        historical_samples: Optional[List[MetricSample]] = None
    ) -> List[float]:
        """
        Extract features from timestamp

        Features:
        - hour_of_day: 0-23 (capture daily patterns)
        - day_of_week: 0-6 (capture weekly patterns)
        - is_weekend: 0/1
        - minutes_since_midnight: 0-1439
        - recent_trend: slope of last 10 samples (if available)
        """
        features = [
            timestamp.hour,
            timestamp.weekday(),
            1 if timestamp.weekday() >= 5 else 0,  # is_weekend
            timestamp.hour * 60 + timestamp.minute,
        ]

        # Calculate recent trend if historical data available
        if historical_samples and len(historical_samples) >= 10:
            recent = historical_samples[-10:]
            values = [s.value for s in recent]
            trend = (values[-1] - values[0]) / 10  # Avg change per sample
            features.append(trend)
        else:
            features.append(0)

        return features
```

**验收标准：**
- [ ] 提前 15 分钟预测指标值。
- [ ] 检测每日/每周模式。
- [ ] 提供置信区间。
- [ ] 稳定工作负载下预测准确率超过 80%。
- [ ] 妥善应对突发流量。

---

### 任务 3：扩缩容优化器（7–9 小时）

实现智能扩缩容决策逻辑。

```python
# src/autoscaler/optimizer.py

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum

class ScaleDirection(Enum):
    UP = "up"
    DOWN = "down"
    NONE = "none"

@dataclass
class ScalingDecision:
    """Decision to scale pods or nodes"""
    direction: ScaleDirection
    current_replicas: int
    target_replicas: int
    reason: str
    confidence: float  # 0.0-1.0
    estimated_cost_impact: float  # USD per hour
    estimated_latency_impact: float  # milliseconds (p95)

@dataclass
class ScalingPolicy:
    """Rules for scaling behavior"""
    min_replicas: int = 1
    max_replicas: int = 100
    target_metric_value: float = 80.0  # Target utilization %
    scale_up_threshold: float = 0.8  # Scale up if >80% of target
    scale_down_threshold: float = 0.5  # Scale down if <50% of target
    scale_up_cooldown: timedelta = timedelta(minutes=3)
    scale_down_cooldown: timedelta = timedelta(minutes=10)
    scale_up_factor: float = 1.5  # Multiply by 1.5 when scaling up
    scale_down_factor: float = 0.7  # Multiply by 0.7 when scaling down

class ScalingOptimizer:
    """Make intelligent scaling decisions"""

    def __init__(self, policy: ScalingPolicy):
        self.policy = policy
        self.last_scale_up: Optional[datetime] = None
        self.last_scale_down: Optional[datetime] = None

    def decide(
        self,
        current_metric: float,
        predicted_metric: Optional[float],
        current_replicas: int,
        current_latency_p95: float
    ) -> ScalingDecision:
        """
        Decide whether to scale and by how much

        Decision logic:
        1. Check if in cooldown period
        2. Compare current metric vs target
        3. Consider predicted future metric (proactive scaling)
        4. Calculate target replicas
        5. Respect min/max bounds
        6. Estimate cost and latency impact

        Args:
            current_metric: Current metric value (e.g., CPU utilization %)
            predicted_metric: Predicted metric value in 15 minutes
            current_replicas: Current pod count
            current_latency_p95: Current p95 latency in ms

        Returns:
            ScalingDecision
        """
        now = datetime.now()

        # TODO: Check cooldown
        if self._in_cooldown(now, ScaleDirection.UP):
            return ScalingDecision(
                direction=ScaleDirection.NONE,
                current_replicas=current_replicas,
                target_replicas=current_replicas,
                reason="In scale-up cooldown period",
                confidence=1.0,
                estimated_cost_impact=0,
                estimated_latency_impact=0
            )

        # TODO: Determine if scaling needed
        # Use predicted metric if available and higher than current
        metric_to_use = current_metric
        use_prediction = False
        if predicted_metric and predicted_metric > current_metric * 1.2:
            metric_to_use = predicted_metric
            use_prediction = True

        # TODO: Calculate utilization ratio
        utilization_ratio = metric_to_use / self.policy.target_metric_value

        # TODO: Determine direction
        direction = ScaleDirection.NONE
        if utilization_ratio > self.policy.scale_up_threshold:
            direction = ScaleDirection.UP
        elif utilization_ratio < self.policy.scale_down_threshold:
            if not self._in_cooldown(now, ScaleDirection.DOWN):
                direction = ScaleDirection.DOWN

        # TODO: Calculate target replicas
        if direction == ScaleDirection.UP:
            # Scale up by factor or proportionally to utilization
            target_replicas = int(current_replicas * max(
                self.policy.scale_up_factor,
                utilization_ratio
            ))
            target_replicas = min(target_replicas, self.policy.max_replicas)
            self.last_scale_up = now

        elif direction == ScaleDirection.DOWN:
            target_replicas = int(current_replicas * self.policy.scale_down_factor)
            target_replicas = max(target_replicas, self.policy.min_replicas)
            self.last_scale_down = now

        else:
            target_replicas = current_replicas

        # TODO: Estimate impacts
        cost_impact = self._estimate_cost_impact(current_replicas, target_replicas)
        latency_impact = self._estimate_latency_impact(
            current_replicas,
            target_replicas,
            current_latency_p95
        )

        # TODO: Calculate confidence
        confidence = 0.9 if use_prediction else 1.0

        reason = self._generate_reason(
            direction,
            metric_to_use,
            utilization_ratio,
            use_prediction
        )

        return ScalingDecision(
            direction=direction,
            current_replicas=current_replicas,
            target_replicas=target_replicas,
            reason=reason,
            confidence=confidence,
            estimated_cost_impact=cost_impact,
            estimated_latency_impact=latency_impact
        )

    def _in_cooldown(self, now: datetime, direction: ScaleDirection) -> bool:
        """Check if in cooldown period for given direction"""
        if direction == ScaleDirection.UP:
            if self.last_scale_up:
                elapsed = now - self.last_scale_up
                return elapsed < self.policy.scale_up_cooldown
        elif direction == ScaleDirection.DOWN:
            if self.last_scale_down:
                elapsed = now - self.last_scale_down
                return elapsed < self.policy.scale_down_cooldown
        return False

    def _estimate_cost_impact(self, current: int, target: int) -> float:
        """
        Estimate hourly cost change

        Assume: $0.10 per pod per hour (adjust based on instance type)
        """
        pod_cost_per_hour = 0.10
        delta_replicas = target - current
        return delta_replicas * pod_cost_per_hour

    def _estimate_latency_impact(
        self,
        current: int,
        target: int,
        current_latency: float
    ) -> float:
        """
        Estimate latency change

        Simple model: latency inversely proportional to replicas
        latency_new = latency_current * (current_replicas / target_replicas)
        """
        if target == 0:
            return float('inf')
        ratio = current / target
        new_latency = current_latency * ratio
        return new_latency - current_latency

    def _generate_reason(
        self,
        direction: ScaleDirection,
        metric: float,
        ratio: float,
        predicted: bool
    ) -> str:
        """Generate human-readable scaling reason"""
        pred_str = " (predicted)" if predicted else ""
        if direction == ScaleDirection.UP:
            return f"Metric{pred_str} {metric:.1f} exceeds target (utilization: {ratio:.1%})"
        elif direction == ScaleDirection.DOWN:
            return f"Metric{pred_str} {metric:.1f} below target (utilization: {ratio:.1%})"
        else:
            return f"Metric{pred_str} {metric:.1f} within acceptable range"
```

**验收标准：**
- [ ] 基于指标作出扩缩容决策。
- [ ] 遵守冷却时间。
- [ ] 利用预测结果主动扩容。
- [ ] 估算成本及延迟影响。
- [ ] 防止震荡（快速反复扩缩容）。

---

### 任务 4：成本计算器（5–6 小时）

实现支持 Spot 实例的成本感知扩缩容。

```python
# src/autoscaler/cost_calculator.py

from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum

class InstanceType(Enum):
    """Kubernetes node instance types"""
    CPU_SMALL = "t3.large"  # 2 vCPU, 8 GB
    CPU_MEDIUM = "t3.xlarge"  # 4 vCPU, 16 GB
    CPU_LARGE = "t3.2xlarge"  # 8 vCPU, 32 GB
    GPU_T4 = "g4dn.xlarge"  # 4 vCPU, 16 GB, 1x T4
    GPU_V100 = "p3.2xlarge"  # 8 vCPU, 61 GB, 1x V100
    GPU_A10 = "g5.xlarge"  # 4 vCPU, 16 GB, 1x A10

@dataclass
class InstanceCost:
    """Cost information for instance type"""
    instance_type: str
    on_demand_price: float  # USD per hour
    spot_price: float  # USD per hour (average)
    vcpus: int
    memory_gb: float
    gpus: int

@dataclass
class CostOptimizationRecommendation:
    """Recommendation to optimize costs"""
    current_cost_per_hour: float
    optimized_cost_per_hour: float
    savings_per_hour: float
    savings_percent: float
    actions: List[str]  # ["Use spot instances", "Right-size pods", etc.]

class CostCalculator:
    """Calculate and optimize infrastructure costs"""

    # Pricing data (update with actual prices)
    INSTANCE_PRICING: Dict[str, InstanceCost] = {
        "t3.large": InstanceCost("t3.large", 0.0832, 0.025, 2, 8, 0),
        "t3.xlarge": InstanceCost("t3.xlarge", 0.1664, 0.050, 4, 16, 0),
        "t3.2xlarge": InstanceCost("t3.2xlarge", 0.3328, 0.100, 8, 32, 0),
        "g4dn.xlarge": InstanceCost("g4dn.xlarge", 0.526, 0.158, 4, 16, 1),
        "p3.2xlarge": InstanceCost("p3.2xlarge", 3.06, 0.918, 8, 61, 1),
        "g5.xlarge": InstanceCost("g5.xlarge", 1.006, 0.302, 4, 16, 1),
    }

    def calculate_cluster_cost(
        self,
        node_counts: Dict[str, int],
        use_spot: bool = False
    ) -> float:
        """
        Calculate total cluster cost per hour

        Args:
            node_counts: {"t3.xlarge": 5, "g4dn.xlarge": 2}
            use_spot: Use spot instance pricing

        Returns:
            Total cost in USD per hour
        """
        total_cost = 0.0
        for instance_type, count in node_counts.items():
            pricing = self.INSTANCE_PRICING.get(instance_type)
            if not pricing:
                continue

            price = pricing.spot_price if use_spot else pricing.on_demand_price
            total_cost += price * count

        return total_cost

    def recommend_optimization(
        self,
        current_nodes: Dict[str, int],
        pod_requirements: List[Dict],
        allow_spot: bool = True
    ) -> CostOptimizationRecommendation:
        """
        Recommend cost optimizations

        Args:
            current_nodes: Current node counts by type
            pod_requirements: [{"cpu": 2, "memory_gb": 4, "gpu": 0}, ...]
            allow_spot: Allow spot instance recommendations

        Returns:
            Optimization recommendations
        """
        # TODO: Calculate current cost
        current_cost = self.calculate_cluster_cost(current_nodes, use_spot=False)

        # TODO: Calculate optimal node configuration
        # Use bin-packing algorithm to minimize nodes needed
        optimal_nodes = self._bin_pack_pods(pod_requirements)

        # TODO: Calculate optimized cost
        optimized_cost = self.calculate_cluster_cost(optimal_nodes, use_spot=allow_spot)

        # TODO: Generate actionable recommendations
        actions = []
        if allow_spot:
            actions.append("Use spot instances (70% savings)")
        if sum(optimal_nodes.values()) < sum(current_nodes.values()):
            actions.append(f"Reduce nodes from {sum(current_nodes.values())} to {sum(optimal_nodes.values())}")

        return CostOptimizationRecommendation(
            current_cost_per_hour=current_cost,
            optimized_cost_per_hour=optimized_cost,
            savings_per_hour=current_cost - optimized_cost,
            savings_percent=((current_cost - optimized_cost) / current_cost * 100) if current_cost > 0 else 0,
            actions=actions
        )

    def _bin_pack_pods(self, pod_requirements: List[Dict]) -> Dict[str, int]:
        """
        Find optimal node configuration using bin-packing

        Simple greedy algorithm:
        1. Sort pods by resource requirements (largest first)
        2. Try to fit each pod on existing nodes
        3. Add new node if pod doesn't fit

        Returns:
            Optimal node counts by instance type
        """
        # TODO: Implement bin-packing algorithm
        # TODO: Consider CPU, memory, GPU constraints
        # TODO: Return node counts
        raise NotImplementedError

    def estimate_monthly_cost(
        self,
        hourly_cost: float,
        utilization_pattern: Optional[List[float]] = None
    ) -> float:
        """
        Estimate monthly cost with variable utilization

        Args:
            hourly_cost: Cost per hour at full capacity
            utilization_pattern: List of 24 hourly utilization values (0.0-1.0)

        Returns:
            Estimated monthly cost in USD
        """
        if utilization_pattern:
            # Average utilization across day
            avg_utilization = sum(utilization_pattern) / len(utilization_pattern)
            daily_cost = hourly_cost * avg_utilization * 24
        else:
            # Assume constant utilization
            daily_cost = hourly_cost * 24

        monthly_cost = daily_cost * 30
        return monthly_cost
```

**验收标准：**
- [ ] 准确计算集群成本。
- [ ] 推荐成本优化方案。
- [ ] 支持 Spot 实例定价。
- [ ] 实现 Pod 放置的装箱（Bin Packing）策略。
- [ ] 根据利用率模式估算每月成本。

---

### 任务 5：GPU 调度器（4–5 小时）

实现感知 GPU 的调度逻辑。

```python
# src/autoscaler/gpu_scheduler.py

from dataclasses import dataclass
from typing import List, Dict, Optional
from kubernetes import client

@dataclass
class GPUNode:
    """Node with GPU resources"""
    name: str
    gpu_count: int
    gpu_type: str  # "nvidia-tesla-t4", "nvidia-tesla-v100"
    gpus_allocated: int
    gpus_available: int
    is_spot: bool

@dataclass
class GPUPodRequest:
    """Pod requesting GPU resources"""
    pod_name: str
    namespace: str
    gpu_count: int
    gpu_type: Optional[str] = None  # Specific GPU type or None
    cpu_request: float = 1.0
    memory_gb: float = 4.0

class GPUScheduler:
    """Handle GPU-specific scheduling constraints"""

    def __init__(self):
        config.load_kube_config()
        self.k8s_core = client.CoreV1Api()

    def get_gpu_nodes(self) -> List[GPUNode]:
        """
        List all GPU nodes in cluster

        Identifies nodes with nvidia.com/gpu capacity
        """
        # TODO: List nodes
        nodes = self.k8s_core.list_node()

        gpu_nodes = []
        for node in nodes.items:
            # TODO: Check if node has GPUs
            capacity = node.status.capacity
            allocatable = node.status.allocatable

            if "nvidia.com/gpu" in capacity:
                gpu_count = int(capacity["nvidia.com/gpu"])
                gpus_available = int(allocatable["nvidia.com/gpu"])

                # TODO: Determine GPU type from node labels
                gpu_type = node.metadata.labels.get("gpu-type", "unknown")

                # TODO: Check if spot instance
                is_spot = "spot" in node.metadata.labels.get("node-lifecycle", "")

                gpu_nodes.append(GPUNode(
                    name=node.metadata.name,
                    gpu_count=gpu_count,
                    gpu_type=gpu_type,
                    gpus_allocated=gpu_count - gpus_available,
                    gpus_available=gpus_available,
                    is_spot=is_spot
                ))

        return gpu_nodes

    def find_node_for_pod(
        self,
        pod_request: GPUPodRequest,
        prefer_spot: bool = True
    ) -> Optional[GPUNode]:
        """
        Find best node for GPU pod

        Priority:
        1. Node with requested GPU type (if specified)
        2. Node with available GPUs
        3. Spot instances (if prefer_spot)
        4. Node with fewest free GPUs (bin-packing)

        Returns None if no suitable node found
        """
        # TODO: Get all GPU nodes
        gpu_nodes = self.get_gpu_nodes()

        # TODO: Filter by GPU type if specified
        if pod_request.gpu_type:
            gpu_nodes = [n for n in gpu_nodes if n.gpu_type == pod_request.gpu_type]

        # TODO: Filter by available GPUs
        gpu_nodes = [n for n in gpu_nodes if n.gpus_available >= pod_request.gpu_count]

        if not gpu_nodes:
            return None

        # TODO: Sort by preference
        # Prefer spot, then fewest available GPUs (bin-packing)
        gpu_nodes.sort(
            key=lambda n: (
                not n.is_spot if prefer_spot else n.is_spot,
                n.gpus_available
            )
        )

        return gpu_nodes[0]

    def calculate_gpu_utilization(self) -> Dict[str, float]:
        """
        Calculate GPU utilization across cluster

        Returns:
            {
                "node-1": 0.85,  # 85% utilized
                "node-2": 0.50
            }
        """
        # TODO: Get GPU metrics from Prometheus (DCGM_FI_DEV_GPU_UTIL)
        # TODO: Average per node
        raise NotImplementedError

    def should_scale_gpu_nodes(
        self,
        pending_gpu_pods: int,
        average_utilization: float
    ) -> bool:
        """
        Decide if GPU nodes should be added

        Scale up if:
        - Pods are pending due to insufficient GPUs
        - Average GPU utilization > 80%

        Returns:
            True if should add GPU nodes
        """
        return pending_gpu_pods > 0 or average_utilization > 0.80
```

**验收标准：**
- [ ] 列出 GPU 节点及可用容量。
- [ ] 为 GPU Pod 寻找合适节点。
- [ ] 计算 GPU 利用率。
- [ ] 推荐 GPU 节点扩缩容方案。
- [ ] 支持 GPU 类型约束（T4、V100、A10）。

---

### 任务 6：集成与 CLI（6–7 小时）

集成全部组件并构建 CLI。

```python
# src/autoscaler/cli.py

import click
from pathlib import Path
from .metrics_provider import MetricsProvider
from .metrics_collector import MetricsCollector
from .predictor import TimeSeriesPredictor
from .optimizer import ScalingOptimizer, ScalingPolicy
from .cost_calculator import CostCalculator
from .gpu_scheduler import GPUScheduler

@click.group()
def cli():
    """Kubernetes Cluster Autoscaler with Custom Metrics"""
    pass

@cli.command()
@click.option('--prometheus-url', default='http://prometheus:9090')
@click.option('--namespace', default='default')
@click.option('--deployment', required=True)
def analyze(prometheus_url: str, namespace: str, deployment: str):
    """Analyze current metrics and scaling decisions"""
    # TODO: Collect current metrics
    # TODO: Get predictions
    # TODO: Show scaling recommendations
    pass

@cli.command()
@click.option('--prometheus-url', default='http://prometheus:9090')
@click.option('--metric', required=True, help='Metric to forecast')
@click.option('--namespace', default='default')
@click.option('--deployment', required=True)
@click.option('--horizon', default=15, help='Minutes to forecast ahead')
def predict(prometheus_url: str, metric: str, namespace: str, deployment: str, horizon: int):
    """Predict future metric values"""
    # TODO: Collect historical data
    # TODO: Run prediction
    # TODO: Display forecast with confidence interval
    pass

@cli.command()
def cost():
    """Analyze cluster costs and optimization opportunities"""
    # TODO: Get current node counts
    # TODO: Calculate costs
    # TODO: Show optimization recommendations
    pass

@cli.command()
def gpu():
    """Show GPU node status and utilization"""
    # TODO: List GPU nodes
    # TODO: Show utilization
    # TODO: Recommend scaling
    pass

@cli.command()
@click.option('--namespace', default='default')
@click.option('--deployment', required=True)
@click.option('--metric', required=True)
@click.option('--target-value', type=float, required=True)
@click.option('--min-replicas', type=int, default=1)
@click.option('--max-replicas', type=int, default=10)
def create_hpa(namespace: str, deployment: str, metric: str, target_value: float,
               min_replicas: int, max_replicas: int):
    """Create HPA with custom metric"""
    # TODO: Generate HPA YAML
    # TODO: Apply to cluster
    pass

if __name__ == '__main__':
    cli()
```

**验收标准：**
- [ ] CLI 命令端到端正常工作。
- [ ] 集成 Prometheus。
- [ ] 以编程方式创建 HPA。
- [ ] 展示成本分析。
- [ ] 展示 GPU 状态。

---

## 测试要求

### 单元测试

```python
def test_scaling_decision_scale_up():
    """Test scale-up decision logic"""
    policy = ScalingPolicy(
        min_replicas=1,
        max_replicas=10,
        target_metric_value=80.0
    )
    optimizer = ScalingOptimizer(policy)

    decision = optimizer.decide(
        current_metric=95.0,  # Above threshold
        predicted_metric=None,
        current_replicas=3,
        current_latency_p95=50.0
    )

    assert decision.direction == ScaleDirection.UP
    assert decision.target_replicas > 3

def test_cost_calculation():
    """Test cost calculator"""
    calc = CostCalculator()
    cost = calc.calculate_cluster_cost(
        {"t3.xlarge": 5, "g4dn.xlarge": 2},
        use_spot=False
    )
    assert cost > 0
    expected = (0.1664 * 5) + (0.526 * 2)
    assert abs(cost - expected) < 0.01
```

### 集成测试

```bash
# tests/integration/test_autoscaler.sh

#!/bin/bash
set -e

echo "Deploying test workload..."
kubectl apply -f tests/fixtures/test-deployment.yaml

echo "Creating HPA with custom metrics..."
python -m autoscaler.cli create-hpa \
    --deployment test-app \
    --metric requests_per_second \
    --target-value 100 \
    --min-replicas 2 \
    --max-replicas 10

echo "Generating load..."
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://test-app; done"

echo "Verifying scale-up..."
sleep 60
REPLICAS=$(kubectl get deployment test-app -o jsonpath='{.spec.replicas}')
if [ "$REPLICAS" -gt 2 ]; then
    echo "✅ Autoscaling working! Scaled to $REPLICAS replicas"
else
    echo "❌ Autoscaling failed"
    exit 1
fi
```

## 预期结果

| 指标 | 目标 | 实测 |
|---|---|---|
| **扩容延迟** | 低于 90 秒 | ________ 秒 |
| **预测准确率** | 超过 80% | ________% |
| **成本节省** | 40–60% | ________% |
| **震荡事件** | 每天少于 1 次 | ________ |

## 验证

提交：
1. 完整实现（全部 6 项任务）。
2. 覆盖率超过 75% 的测试套件。
3. 性能基准测试。
4. 展示节省情况的成本分析报告。
5. 文档（DESIGN.md、METRICS.md、TROUBLESHOOTING.md）。

## 资源

- [Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Custom Metrics API](https://github.com/kubernetes-sigs/custom-metrics-apiserver)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [Prometheus Adapter](https://github.com/kubernetes-sigs/prometheus-adapter)
- [VPA](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler)

---

**预计完成时长（原文）：** 35–43 小时。

**实践技能：**
- Kubernetes 自动扩缩容（HPA、VPA、CA）。
- Custom Metrics API。
- 时间序列预测。
- 成本优化。
- GPU 调度。

> 译注：Cluster Autoscaler 的节点缩容判断并不只依据实际 CPU/GPU 利用率，还涉及资源请求、Pod 可迁移性、PDB 及配置。HPA 与 VPA 同时基于 CPU/内存资源指标调整同一工作负载可能产生反馈冲突，应协调控制策略。GPU 共享需要设备插件及相应硬件/软件能力。原文案例数值及验收目标未经实测；预测准确率需定义指标和基线，Spot 实例需考虑回收风险。原始代码块及 TODO 保留，未实际运行集群。
