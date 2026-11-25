# 练习 06：面向 ML 模型生命周期的 Kubernetes Operator

**预计时长：** 38–46 小时
**难度：** 高级
**前置条件：** Kubernetes、Python 3.9+、Kubernetes Operator 框架（Kopf）、Docker

## 概览

构建生产级 Kubernetes Operator，实现 ML 模型生命周期管理自动化——涵盖部署、自动扩缩容、健康监控、版本管理及自动回滚。为 ModelDeployment 和 ModelServer 资源实现自定义资源定义（CRD）。本练习教授构建平台级 ML 基础设施自动化所需的高级 Kubernetes 模式。

在生产 ML 平台中，Operator 对以下方面至关重要：
- **声明式模型管理：** 使用 YAML 定义模型，由 Operator 负责部署。
- **自动化运维：** 无需人工干预即可执行健康检查、扩缩容与回滚。
- **版本管理：** 部署多个模型版本，支持 A/B 测试。
- **资源优化：** 基于队列深度、GPU 利用率自动扩缩容。
- **自愈：** 重启失败的 Pod，重新部署损坏的模型。

## 学习目标

完成本练习后，你将能够：

1. **设计自定义资源定义（CRD）**，面向 ML 工作负载。
2. **实现 Kubernetes Operator**，使用 Kopf 框架。
3. **处理资源协调循环（Reconciliation Loop）**，使实际状态趋向期望状态。
4. **管理依赖资源**（Deployment、Service、HPA、PVC）。
5. **实现健康检查**与自动修复。
6. **构建状态报告**，使用 Conditions 与 Events。
7. **安全处理升级及回滚。**

## 业务背景

**实际业务场景（原文案例）：** ML 平台拥有 50 名数据科学家，部署超过 200 个模型。目前存在以下问题：

- **手动部署复杂：** 每个模型需要 Deployment、Service、HPA、PVC、ConfigMap YAML（合计超过 100 行）。
- **配置漂移：** 工程师手动编辑资源，导致不一致。
- **缺少自动健康检查：** 模型加载失败可能数小时未被发现。
- **更新风险高：** 模型更新依赖手动 kubectl 命令，容易出错。
- **没有版本历史：** 难以回滚至先前模型版本。

你的任务是构建 Operator：
- 通过简洁的 20 行自定义资源配置部署模型：`kubectl apply -f model.yaml`。
- 自动创建全部依赖资源（Deployment、Service、HPA 等）。
- 监控模型健康状态，失败时自动重启。
- 管理模型版本，支持 A/B 测试。
- 出错时安全回滚。

## 项目结构

```
exercise-06-k8s-operator-framework/
├── README.md
├── requirements.txt
├── Dockerfile
├── helm/
│   └── model-operator/              # Helm chart for operator
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml      # Operator deployment
│           ├── rbac.yaml            # ServiceAccount, Role, RoleBinding
│           └── crd.yaml             # ModelDeployment CRD
├── config/
│   ├── crd.yaml                     # ModelDeployment CRD definition
│   └── rbac.yaml                    # RBAC for operator
├── src/
│   └── model_operator/
│       ├── __init__.py
│       ├── operator.py              # Main operator logic
│       ├── reconciler.py            # Reconciliation loop
│       ├── resource_manager.py      # Manage K8s resources
│       ├── health_checker.py        # Model health monitoring
│       ├── version_manager.py       # Model versioning
│       ├── scaler.py                # Auto-scaling logic
│       └── utils.py                 # Helper functions
├── tests/
│   ├── test_operator.py
│   ├── test_reconciler.py
│   ├── test_resource_manager.py
│   └── fixtures/
│       └── sample_model_deployment.yaml
├── examples/
│   ├── simple-model.yaml            # Basic model deployment
│   ├── multi-version-model.yaml     # A/B testing example
│   └── gpu-model.yaml               # GPU model deployment
└── docs/
    ├── DESIGN.md                    # Architecture
    ├── CRD_REFERENCE.md             # CRD API spec
    └── OPERATIONS.md                # Operator guide
```

## 需求

### 功能需求

1. **ModelDeployment CRD：**
   - 定义模型镜像、资源、副本数。
   - 支持多个版本（A/B 测试）。
   - 配置健康检查端点。
   - 设置自动扩缩容参数。

2. **Operator 能力：**
   - 为模型服务器创建 Deployment。
   - 为模型端点创建 Service。
   - 为自动扩缩容创建 HPA。
   - 根据需要创建用于模型存储的 PVC。
   - 创建用于模型配置的 ConfigMap。

3. **协调逻辑：**
   - 检测自定义资源变更并更新资源。
   - 处理资源删除（垃圾回收）。
   - 持续维持期望状态。
   - 妥善处理冲突。

4. **健康监控：**
   - 每 30 秒检查 /health 端点。
   - 连续失败时重启 Pod。
   - 在自定义资源的 status 字段报告状态。
   - 产生 Kubernetes Event。

5. **版本管理：**
   - 同时部署多个模型版本。
   - 在版本之间拆分流量。
   - 声明式晋升/回滚版本。
   - 追踪版本历史。

### 非功能需求

- **协调速度：** 从自定义资源变更到资源更新低于 5 秒。
- **可靠性：** 处理 API Server 故障，并通过退避重试。
- **可观测性：** 记录全部操作，暴露 Prometheus 指标。
- **安全性：** 未经确认不删除资源。

## 实现任务

### 任务 1：CRD 设计（6–7 小时）

为 ML 模型设计自定义资源定义。

```yaml
# config/crd.yaml

apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: modeldeployments.ml.example.com
spec:
  group: ml.example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              # Model configuration
              modelName:
                type: string
                description: "Name of the ML model"

              framework:
                type: string
                enum: ["tensorflow", "pytorch", "sklearn", "onnx"]
                description: "ML framework"

              # Container image
              image:
                type: string
                description: "Docker image for model server"

              # Model versions (for A/B testing)
              versions:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string  # "v1", "v2", etc.
                    weight:
                      type: integer  # Traffic percentage (0-100)
                      minimum: 0
                      maximum: 100
                    modelPath:
                      type: string  # S3/GCS path to model artifacts

              # Resource requirements
              resources:
                type: object
                properties:
                  requests:
                    type: object
                    properties:
                      cpu:
                        type: string
                      memory:
                        type: string
                      nvidia.com/gpu:
                        type: string
                  limits:
                    type: object
                    properties:
                      cpu:
                        type: string
                      memory:
                        type: string
                      nvidia.com/gpu:
                        type: string

              # Scaling configuration
              scaling:
                type: object
                properties:
                  minReplicas:
                    type: integer
                    minimum: 1
                  maxReplicas:
                    type: integer
                    minimum: 1
                  targetCPUUtilization:
                    type: integer
                    minimum: 1
                    maximum: 100

              # Health check
              healthCheck:
                type: object
                properties:
                  endpoint:
                    type: string  # "/health"
                  intervalSeconds:
                    type: integer
                    default: 30
                  timeoutSeconds:
                    type: integer
                    default: 5
                  failureThreshold:
                    type: integer
                    default: 3

          status:
            type: object
            properties:
              # Overall status
              phase:
                type: string
                enum: ["Pending", "Running", "Failed", "Degraded"]

              # Conditions (Ready, Healthy, Scaled)
              conditions:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                    status:
                      type: string
                      enum: ["True", "False", "Unknown"]
                    lastTransitionTime:
                      type: string
                      format: date-time
                    reason:
                      type: string
                    message:
                      type: string

              # Version status
              activeVersions:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    replicas:
                      type: integer
                    healthyReplicas:
                      type: integer

              # Metrics
              metrics:
                type: object
                properties:
                  requestsPerSecond:
                    type: number
                  averageLatencyMs:
                    type: number
                  errorRate:
                    type: number

    subresources:
      status: {}  # Enable status subresource

    additionalPrinterColumns:
    - name: Framework
      type: string
      jsonPath: .spec.framework
    - name: Phase
      type: string
      jsonPath: .status.phase
    - name: Replicas
      type: integer
      jsonPath: .status.activeVersions[0].replicas
    - name: Age
      type: date
      jsonPath: .metadata.creationTimestamp

  scope: Namespaced
  names:
    plural: modeldeployments
    singular: modeldeployment
    kind: ModelDeployment
    shortNames:
    - md
```

**ModelDeployment 示例：**

```yaml
# examples/simple-model.yaml

apiVersion: ml.example.com/v1
kind: ModelDeployment
metadata:
  name: sentiment-analysis
  namespace: ml-models
spec:
  modelName: sentiment-classifier
  framework: pytorch
  image: my-registry/sentiment-model:v1.0.0

  versions:
  - name: v1
    weight: 100
    modelPath: s3://models/sentiment/v1/model.pt

  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

  scaling:
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilization: 70

  healthCheck:
    endpoint: /health
    intervalSeconds: 30
    failureThreshold: 3
```

**验收标准：**
- [ ] CRD 正确验证全部字段。
- [ ] 支持多个模型版本。
- [ ] 启用 Status 子资源。
- [ ] Additional Printer Columns 正确显示。
- [ ] 短名称 `md` 正常工作。

---

### 任务 2：Operator 框架搭建（7–9 小时）

使用 Kopf 框架实现 Operator。

```python
# src/model_operator/operator.py

import kopf
import kubernetes
from typing import Dict, Any
import logging
from .reconciler import ModelReconciler
from .health_checker import HealthChecker
from .version_manager import VersionManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Kubernetes client
kubernetes.config.load_incluster_config()

# Initialize components
reconciler = ModelReconciler()
health_checker = HealthChecker()
version_manager = VersionManager()

@kopf.on.create('ml.example.com', 'v1', 'modeldeployments')
def create_model_deployment(spec, name, namespace, **kwargs):
    """
    Handle ModelDeployment creation

    Called when: kubectl apply -f model.yaml (first time)

    Tasks:
    1. Validate spec
    2. Create Deployment
    3. Create Service
    4. Create HPA
    5. Update status

    Args:
        spec: ModelDeployment spec
        name: Resource name
        namespace: Namespace
        **kwargs: Additional context (body, meta, status, etc.)
    """
    logger.info(f"Creating ModelDeployment: {namespace}/{name}")

    try:
        # TODO: Validate spec
        _validate_spec(spec)

        # TODO: Create resources
        reconciler.reconcile(name, namespace, spec)

        # TODO: Update status to "Pending"
        _update_status(name, namespace, phase="Pending", message="Resources created")

        logger.info(f"ModelDeployment {namespace}/{name} created successfully")

    except Exception as e:
        logger.error(f"Failed to create ModelDeployment {namespace}/{name}: {e}")
        _update_status(name, namespace, phase="Failed", message=str(e))
        raise

@kopf.on.update('ml.example.com', 'v1', 'modeldeployments')
def update_model_deployment(spec, name, namespace, old, new, diff, **kwargs):
    """
    Handle ModelDeployment updates

    Called when: kubectl apply -f model.yaml (changes detected)

    Tasks:
    1. Detect what changed (image, replicas, versions, etc.)
    2. Update corresponding resources
    3. Handle version changes (A/B testing)

    Args:
        old: Previous spec
        new: New spec
        diff: List of changes
    """
    logger.info(f"Updating ModelDeployment: {namespace}/{name}")
    logger.info(f"Changes: {diff}")

    try:
        # TODO: Reconcile to desired state
        reconciler.reconcile(name, namespace, spec)

        # TODO: Handle version changes
        if _versions_changed(old, new):
            version_manager.update_traffic_split(name, namespace, spec['versions'])

        _update_status(name, namespace, phase="Running", message="Updated successfully")

    except Exception as e:
        logger.error(f"Failed to update ModelDeployment {namespace}/{name}: {e}")
        _update_status(name, namespace, phase="Failed", message=str(e))
        raise

@kopf.on.delete('ml.example.com', 'v1', 'modeldeployments')
def delete_model_deployment(spec, name, namespace, **kwargs):
    """
    Handle ModelDeployment deletion

    Called when: kubectl delete modeldeployment <name>

    Tasks:
    1. Delete Deployment
    2. Delete Service
    3. Delete HPA
    4. Cleanup PVCs (if any)

    Note: Kubernetes handles garbage collection via ownerReferences
    """
    logger.info(f"Deleting ModelDeployment: {namespace}/{name}")

    try:
        # Resources will be auto-deleted via ownerReferences
        # Just log the deletion
        logger.info(f"ModelDeployment {namespace}/{name} deleted")

    except Exception as e:
        logger.error(f"Error during deletion: {e}")
        raise

@kopf.daemon('ml.example.com', 'v1', 'modeldeployments')
async def health_check_daemon(spec, name, namespace, stopped, **kwargs):
    """
    Background daemon for health checking

    Runs continuously while ModelDeployment exists.
    Checks model health every 30 seconds.

    Args:
        stopped: Event that signals daemon should stop
    """
    import asyncio

    interval = spec.get('healthCheck', {}).get('intervalSeconds', 30)

    logger.info(f"Starting health check daemon for {namespace}/{name}")

    while not stopped.is_set():
        try:
            # TODO: Check health
            is_healthy = await health_checker.check_health(name, namespace, spec)

            # TODO: Update status
            if not is_healthy:
                _update_status(
                    name,
                    namespace,
                    phase="Degraded",
                    message="Health check failing"
                )
                # TODO: Trigger remediation (restart pods)
                await health_checker.remediate(name, namespace)

        except Exception as e:
            logger.error(f"Health check error for {namespace}/{name}: {e}")

        # Wait for next check
        await asyncio.sleep(interval)

@kopf.timer('ml.example.com', 'v1', 'modeldeployments', interval=60.0)
def status_update_timer(spec, name, namespace, **kwargs):
    """
    Periodic status update timer

    Runs every 60 seconds to update metrics in status
    """
    try:
        # TODO: Fetch metrics from Prometheus
        metrics = _fetch_metrics(name, namespace)

        # TODO: Update status with metrics
        _update_status(
            name,
            namespace,
            metrics=metrics
        )

    except Exception as e:
        logger.error(f"Failed to update status for {namespace}/{name}: {e}")

def _validate_spec(spec: Dict[str, Any]) -> None:
    """Validate ModelDeployment spec"""
    required_fields = ['modelName', 'framework', 'image', 'versions']
    for field in required_fields:
        if field not in spec:
            raise ValueError(f"Missing required field: {field}")

    # Validate version weights sum to 100
    total_weight = sum(v['weight'] for v in spec['versions'])
    if total_weight != 100:
        raise ValueError(f"Version weights must sum to 100, got {total_weight}")

def _versions_changed(old: Dict, new: Dict) -> bool:
    """Check if versions changed"""
    return old.get('spec', {}).get('versions') != new.get('spec', {}).get('versions')

def _update_status(name: str, namespace: str, phase: str = None, message: str = None, metrics: Dict = None):
    """Update ModelDeployment status"""
    # TODO: Update status subresource via Kubernetes API
    raise NotImplementedError

def _fetch_metrics(name: str, namespace: str) -> Dict:
    """Fetch metrics from Prometheus"""
    # TODO: Query Prometheus for RPS, latency, error rate
    return {
        "requestsPerSecond": 0.0,
        "averageLatencyMs": 0.0,
        "errorRate": 0.0
    }

if __name__ == '__main__':
    kopf.run()
```

**验收标准：**
- [ ] Operator 处理创建/更新/删除事件。
- [ ] 后台健康检查正常工作。
- [ ] 定期更新状态。
- [ ] 正确处理错误与日志。

---

### 任务 3：资源管理器（8–10 小时）

管理依赖的 Kubernetes 资源。

```python
# src/model_operator/resource_manager.py

from kubernetes import client
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ResourceManager:
    """Manage Kubernetes resources for ModelDeployment"""

    def __init__(self):
        self.apps_api = client.AppsV1Api()
        self.core_api = client.CoreV1Api()
        self.autoscaling_api = client.AutoscalingV2Api()

    def create_or_update_deployment(
        self,
        name: str,
        namespace: str,
        spec: Dict[str, Any],
        owner_reference: Dict
    ) -> client.V1Deployment:
        """
        Create or update Deployment for model server

        Deployment spec:
        - Replicas: spec.scaling.minReplicas
        - Container: spec.image
        - Resources: spec.resources
        - Env vars: MODEL_PATH, FRAMEWORK, etc.
        - Volume mounts: For model storage (if using PVC)

        Args:
            owner_reference: For garbage collection
        """
        deployment_name = f"{name}-deployment"

        # TODO: Build Deployment spec
        deployment = client.V1Deployment(
            metadata=client.V1ObjectMeta(
                name=deployment_name,
                namespace=namespace,
                owner_references=[owner_reference],
                labels={
                    "app": name,
                    "managed-by": "model-operator"
                }
            ),
            spec=client.V1DeploymentSpec(
                replicas=spec.get('scaling', {}).get('minReplicas', 1),
                selector=client.V1LabelSelector(
                    match_labels={"app": name}
                ),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(
                        labels={"app": name}
                    ),
                    spec=client.V1PodSpec(
                        containers=[
                            client.V1Container(
                                name="model-server",
                                image=spec['image'],
                                ports=[client.V1ContainerPort(container_port=8080)],
                                env=[
                                    client.V1EnvVar(name="MODEL_NAME", value=spec['modelName']),
                                    client.V1EnvVar(name="MODEL_PATH", value=spec['versions'][0]['modelPath']),
                                    client.V1EnvVar(name="FRAMEWORK", value=spec['framework'])
                                ],
                                resources=self._build_resources(spec.get('resources', {})),
                                liveness_probe=self._build_probe(spec.get('healthCheck', {})),
                                readiness_probe=self._build_probe(spec.get('healthCheck', {}))
                            )
                        ]
                    )
                )
            )
        )

        # TODO: Create or update
        try:
            self.apps_api.read_namespaced_deployment(deployment_name, namespace)
            # Exists, update it
            self.apps_api.patch_namespaced_deployment(deployment_name, namespace, deployment)
            logger.info(f"Updated Deployment {namespace}/{deployment_name}")
        except client.exceptions.ApiException as e:
            if e.status == 404:
                # Doesn't exist, create it
                self.apps_api.create_namespaced_deployment(namespace, deployment)
                logger.info(f"Created Deployment {namespace}/{deployment_name}")
            else:
                raise

        return deployment

    def create_or_update_service(
        self,
        name: str,
        namespace: str,
        spec: Dict[str, Any],
        owner_reference: Dict
    ) -> client.V1Service:
        """
        Create or update Service for model endpoint

        Service spec:
        - Type: ClusterIP
        - Selector: app=<name>
        - Port: 8080
        """
        service_name = f"{name}-service"

        service = client.V1Service(
            metadata=client.V1ObjectMeta(
                name=service_name,
                namespace=namespace,
                owner_references=[owner_reference],
                labels={"app": name}
            ),
            spec=client.V1ServiceSpec(
                selector={"app": name},
                ports=[
                    client.V1ServicePort(
                        name="http",
                        port=8080,
                        target_port=8080,
                        protocol="TCP"
                    )
                ],
                type="ClusterIP"
            )
        )

        # TODO: Create or update
        try:
            self.core_api.read_namespaced_service(service_name, namespace)
            self.core_api.patch_namespaced_service(service_name, namespace, service)
            logger.info(f"Updated Service {namespace}/{service_name}")
        except client.exceptions.ApiException as e:
            if e.status == 404:
                self.core_api.create_namespaced_service(namespace, service)
                logger.info(f"Created Service {namespace}/{service_name}")
            else:
                raise

        return service

    def create_or_update_hpa(
        self,
        name: str,
        namespace: str,
        spec: Dict[str, Any],
        owner_reference: Dict
    ) -> client.V2HorizontalPodAutoscaler:
        """
        Create or update HorizontalPodAutoscaler

        HPA spec:
        - Min/max replicas from spec.scaling
        - Target CPU utilization
        """
        hpa_name = f"{name}-hpa"

        scaling_config = spec.get('scaling', {})

        hpa = client.V2HorizontalPodAutoscaler(
            metadata=client.V1ObjectMeta(
                name=hpa_name,
                namespace=namespace,
                owner_references=[owner_reference],
                labels={"app": name}
            ),
            spec=client.V2HorizontalPodAutoscalerSpec(
                scale_target_ref=client.V2CrossVersionObjectReference(
                    api_version="apps/v1",
                    kind="Deployment",
                    name=f"{name}-deployment"
                ),
                min_replicas=scaling_config.get('minReplicas', 1),
                max_replicas=scaling_config.get('maxReplicas', 10),
                metrics=[
                    client.V2MetricSpec(
                        type="Resource",
                        resource=client.V2ResourceMetricSource(
                            name="cpu",
                            target=client.V2MetricTarget(
                                type="Utilization",
                                average_utilization=scaling_config.get('targetCPUUtilization', 70)
                            )
                        )
                    )
                ]
            )
        )

        # TODO: Create or update
        try:
            self.autoscaling_api.read_namespaced_horizontal_pod_autoscaler(hpa_name, namespace)
            self.autoscaling_api.patch_namespaced_horizontal_pod_autoscaler(hpa_name, namespace, hpa)
            logger.info(f"Updated HPA {namespace}/{hpa_name}")
        except client.exceptions.ApiException as e:
            if e.status == 404:
                self.autoscaling_api.create_namespaced_horizontal_pod_autoscaler(namespace, hpa)
                logger.info(f"Created HPA {namespace}/{hpa_name}")
            else:
                raise

        return hpa

    def _build_resources(self, resources: Dict) -> client.V1ResourceRequirements:
        """Build resource requirements"""
        return client.V1ResourceRequirements(
            requests=resources.get('requests', {}),
            limits=resources.get('limits', {})
        )

    def _build_probe(self, health_check: Dict) -> client.V1Probe:
        """Build liveness/readiness probe"""
        endpoint = health_check.get('endpoint', '/health')
        return client.V1Probe(
            http_get=client.V1HTTPGetAction(
                path=endpoint,
                port=8080
            ),
            initial_delay_seconds=10,
            period_seconds=health_check.get('intervalSeconds', 30),
            timeout_seconds=health_check.get('timeoutSeconds', 5),
            failure_threshold=health_check.get('failureThreshold', 3)
        )
```

**验收标准：**
- [ ] 使用正确的 Spec 创建 Deployment。
- [ ] 创建暴露模型端点的 Service。
- [ ] 创建用于自动扩缩容的 HPA。
- [ ] 设置 ownerReferences，支持垃圾回收。
- [ ] 正确区分创建与更新操作。

---

### 任务 4：协调器（6–7 小时）

实现协调循环。

```python
# src/model_operator/reconciler.py

from .resource_manager import ResourceManager
from kubernetes import client
import logging

logger = logging.getLogger(__name__)

class ModelReconciler:
    """Reconcile desired state (CRD spec) with actual state (K8s resources)"""

    def __init__(self):
        self.resource_manager = ResourceManager()
        self.custom_api = client.CustomObjectsApi()

    def reconcile(self, name: str, namespace: str, spec: dict):
        """
        Reconcile ModelDeployment to desired state

        Steps:
        1. Get owner reference (for garbage collection)
        2. Create/update Deployment
        3. Create/update Service
        4. Create/update HPA
        5. Verify resources are healthy

        Args:
            name: ModelDeployment name
            namespace: Namespace
            spec: ModelDeployment spec
        """
        logger.info(f"Reconciling ModelDeployment {namespace}/{name}")

        # TODO: Get ModelDeployment for owner reference
        model_deployment = self.custom_api.get_namespaced_custom_object(
            group="ml.example.com",
            version="v1",
            namespace=namespace,
            plural="modeldeployments",
            name=name
        )

        owner_reference = {
            "apiVersion": "ml.example.com/v1",
            "kind": "ModelDeployment",
            "name": name,
            "uid": model_deployment['metadata']['uid'],
            "controller": True,
            "blockOwnerDeletion": True
        }

        # TODO: Create/update resources
        try:
            deployment = self.resource_manager.create_or_update_deployment(
                name, namespace, spec, owner_reference
            )

            service = self.resource_manager.create_or_update_service(
                name, namespace, spec, owner_reference
            )

            hpa = self.resource_manager.create_or_update_hpa(
                name, namespace, spec, owner_reference
            )

            logger.info(f"Reconciliation complete for {namespace}/{name}")

        except Exception as e:
            logger.error(f"Reconciliation failed for {namespace}/{name}: {e}")
            raise

    def get_status(self, name: str, namespace: str) -> dict:
        """
        Get current status of ModelDeployment

        Query Deployment, Service, HPA to determine:
        - Phase (Pending, Running, Failed, Degraded)
        - Active replicas
        - Health status
        """
        # TODO: Get Deployment status
        apps_api = client.AppsV1Api()
        deployment_name = f"{name}-deployment"

        try:
            deployment = apps_api.read_namespaced_deployment(deployment_name, namespace)
            replicas = deployment.status.replicas or 0
            ready_replicas = deployment.status.ready_replicas or 0

            if ready_replicas == 0:
                phase = "Pending"
            elif ready_replicas < replicas:
                phase = "Degraded"
            else:
                phase = "Running"

            return {
                "phase": phase,
                "replicas": replicas,
                "readyReplicas": ready_replicas
            }

        except client.exceptions.ApiException as e:
            if e.status == 404:
                return {"phase": "Pending", "replicas": 0, "readyReplicas": 0}
            raise
```

**验收标准：**
- [ ] 协调过程创建全部资源。
- [ ] Spec 变化时协调过程更新资源。
- [ ] 正确设置 Owner Reference。
- [ ] Status 反映实际状态。
- [ ] 妥善处理错误。

---

### 任务 5：健康检查器（4–5 小时）

实现健康监控及修复。

```python
# src/model_operator/health_checker.py

from kubernetes import client
import aiohttp
import logging

logger = logging.getLogger(__name__)

class HealthChecker:
    """Monitor model health and trigger remediation"""

    def __init__(self):
        self.core_api = client.CoreV1Api()
        self.apps_api = client.AppsV1Api()

    async def check_health(self, name: str, namespace: str, spec: dict) -> bool:
        """
        Check health of all model pods

        Calls /health endpoint on each pod
        Returns True if >80% of pods healthy
        """
        # TODO: Get all pods for deployment
        pod_list = self.core_api.list_namespaced_pod(
            namespace=namespace,
            label_selector=f"app={name}"
        )

        if not pod_list.items:
            logger.warning(f"No pods found for {namespace}/{name}")
            return False

        # TODO: Check health of each pod
        healthy_count = 0
        total_count = len(pod_list.items)

        health_endpoint = spec.get('healthCheck', {}).get('endpoint', '/health')

        async with aiohttp.ClientSession() as session:
            for pod in pod_list.items:
                pod_ip = pod.status.pod_ip
                if not pod_ip:
                    continue

                try:
                    async with session.get(
                        f"http://{pod_ip}:8080{health_endpoint}",
                        timeout=aiohttp.ClientTimeout(total=5)
                    ) as response:
                        if response.status == 200:
                            healthy_count += 1
                        else:
                            logger.warning(f"Pod {pod.metadata.name} health check failed: {response.status}")

                except Exception as e:
                    logger.error(f"Health check error for pod {pod.metadata.name}: {e}")

        health_percentage = healthy_count / total_count if total_count > 0 else 0
        is_healthy = health_percentage >= 0.8

        logger.info(f"Health check for {namespace}/{name}: {healthy_count}/{total_count} healthy")

        return is_healthy

    async def remediate(self, name: str, namespace: str):
        """
        Remediate unhealthy deployment

        Strategies:
        1. Delete unhealthy pods (let deployment recreate)
        2. Rollback to previous version (if applicable)
        3. Scale down to min replicas and back up
        """
        logger.info(f"Remediating {namespace}/{name}")

        # TODO: Delete unhealthy pods
        pod_list = self.core_api.list_namespaced_pod(
            namespace=namespace,
            label_selector=f"app={name}"
        )

        deleted_count = 0
        for pod in pod_list.items:
            # TODO: Check if pod is unhealthy
            # For now, just delete pods with restartCount > 5
            if pod.status.container_statuses:
                restart_count = pod.status.container_statuses[0].restart_count
                if restart_count > 5:
                    logger.info(f"Deleting unhealthy pod: {pod.metadata.name}")
                    self.core_api.delete_namespaced_pod(pod.metadata.name, namespace)
                    deleted_count += 1

        logger.info(f"Deleted {deleted_count} unhealthy pods")
```

**验收标准：**
- [ ] 检查健康端点。
- [ ] 计算健康比例。
- [ ] 按策略删除不健康的 Pod。
- [ ] 异步实现。
- [ ] 正确处理错误。

---

### 任务 6：版本管理器（4–5 小时）

实现用于 A/B 测试的版本管理。

```python
# src/model_operator/version_manager.py

from kubernetes import client
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class VersionManager:
    """Manage multiple model versions for A/B testing"""

    def __init__(self):
        self.apps_api = client.AppsV1Api()
        self.custom_api = client.CustomObjectsApi()

    def update_traffic_split(self, name: str, namespace: str, versions: List[Dict]):
        """
        Update traffic split between versions using Istio VirtualService

        Example versions:
        [
            {"name": "v1", "weight": 80, "modelPath": "s3://..."},
            {"name": "v2", "weight": 20, "modelPath": "s3://..."}
        ]

        Creates/updates Istio VirtualService to route traffic
        """
        # TODO: Verify weights sum to 100
        total_weight = sum(v['weight'] for v in versions)
        if total_weight != 100:
            raise ValueError(f"Version weights must sum to 100, got {total_weight}")

        # TODO: Create Deployment for each version
        for version in versions:
            if version['weight'] > 0:
                self._create_version_deployment(name, namespace, version)

        # TODO: Update VirtualService (if using Istio)
        # For simplicity, assuming Istio is available
        try:
            self._update_virtual_service(name, namespace, versions)
        except Exception as e:
            logger.warning(f"Could not update VirtualService: {e}")

        logger.info(f"Updated traffic split for {namespace}/{name}")

    def _create_version_deployment(self, name: str, namespace: str, version: Dict):
        """Create Deployment for specific model version"""
        deployment_name = f"{name}-{version['name']}"

        # TODO: Create Deployment with version-specific config
        # Similar to ResourceManager.create_or_update_deployment
        # but with version-specific labels and env vars

        logger.info(f"Created/updated deployment for version {version['name']}")

    def _update_virtual_service(self, name: str, namespace: str, versions: List[Dict]):
        """Update Istio VirtualService for traffic splitting"""
        vs_name = f"{name}-vs"

        # Build route rules
        routes = []
        for version in versions:
            if version['weight'] > 0:
                routes.append({
                    "destination": {
                        "host": f"{name}-service",
                        "subset": version['name']
                    },
                    "weight": version['weight']
                })

        virtual_service = {
            "apiVersion": "networking.istio.io/v1beta1",
            "kind": "VirtualService",
            "metadata": {
                "name": vs_name,
                "namespace": namespace
            },
            "spec": {
                "hosts": [f"{name}-service"],
                "http": [{"route": routes}]
            }
        }

        # TODO: Create or update VirtualService
        try:
            self.custom_api.patch_namespaced_custom_object(
                group="networking.istio.io",
                version="v1beta1",
                namespace=namespace,
                plural="virtualservices",
                name=vs_name,
                body=virtual_service
            )
        except client.exceptions.ApiException as e:
            if e.status == 404:
                self.custom_api.create_namespaced_custom_object(
                    group="networking.istio.io",
                    version="v1beta1",
                    namespace=namespace,
                    plural="virtualservices",
                    body=virtual_service
                )
```

**验收标准：**
- [ ] 支持多个模型版本。
- [ ] 按权重拆分流量。
- [ ] 为每个版本创建独立 Deployment。
- [ ] 集成 Istio VirtualService。
- [ ] 验证权重之和为 100。

---

### 任务 7：测试与文档（4–5 小时）

```python
# tests/test_operator.py

import pytest
from unittest.mock import Mock, patch
from model_operator.operator import _validate_spec

def test_validate_spec_success():
    """Test valid spec passes validation"""
    spec = {
        "modelName": "test-model",
        "framework": "pytorch",
        "image": "test:v1",
        "versions": [{"name": "v1", "weight": 100, "modelPath": "s3://..."}]
    }
    _validate_spec(spec)  # Should not raise

def test_validate_spec_missing_field():
    """Test missing required field fails"""
    spec = {"modelName": "test-model"}
    with pytest.raises(ValueError, match="Missing required field"):
        _validate_spec(spec)

def test_validate_spec_weights():
    """Test version weights must sum to 100"""
    spec = {
        "modelName": "test-model",
        "framework": "pytorch",
        "image": "test:v1",
        "versions": [
            {"name": "v1", "weight": 60, "modelPath": "s3://..."},
            {"name": "v2", "weight": 30, "modelPath": "s3://..."}
        ]
    }
    with pytest.raises(ValueError, match="weights must sum to 100"):
        _validate_spec(spec)
```

## 预期结果

| 指标 | 目标 | 实测 |
|---|---|---|
| **协调时间** | 低于 5 秒 | ________ 秒 |
| **健康检查间隔** | 30 秒 | ________ 秒 |
| **CRD 验证** | 100% | ________% |

## 验证

提交：
1. 完整的 Operator 实现。
2. 带验证规则的 CRD。
3. 测试套件（覆盖率超过 75%）。
4. ModelDeployment 示例。
5. 文档（DESIGN.md、CRD_REFERENCE.md、OPERATIONS.md）。

## 资源

- [Kubernetes Operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Kopf 框架](https://kopf.readthedocs.io/)
- [Kubebuilder](https://book.kubebuilder.io/)
- [Operator SDK](https://sdk.operatorframework.io/)

---

**预计完成时长（原文）：** 38–46 小时。

**实践技能：**
- Kubernetes Operator。
- 自定义资源定义。
- 协调循环。
- 资源管理。
- 健康监控。
- 版本管理。

> 译注：CRD 定义资源类型，用户部署时提交的是自定义资源实例，而非每个模型都创建 CRD。原文学习范围提到 ModelServer，但主要任务集中于 ModelDeployment。协调过程应具备幂等性，处理资源版本冲突、重试、Finalizer 及最小权限；不要与 HPA 争夺副本数字段的控制权。自动删除不健康 Pod 与非功能需求中的删除确认存在潜在冲突，应明确预授权修复策略、限速及保护条件，并优先利用 Kubernetes 探针。原始代码块及 TODO 保留，未实际运行 Operator。
