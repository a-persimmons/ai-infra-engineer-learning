# 练习 02：使用 Pulumi 构建多云 ML 基础设施

**预计时长：** 28–36 小时。

## 业务背景

公司采用**多云战略**，以避免厂商锁定，并利用各云平台的优势服务：

- **AWS：** 通用计算、存储（S3）与成熟 ML 服务。
- **GCP：** 原文认为其 TPU 适合 ML 训练，BigQuery 适合分析。
- **Azure：** 企业集成、混合云能力。

**当前挑战：** 使用 Terraform HCL 管理多个云平台的基础设施较为复杂：
- Provider 的语法与模式不同。
- 难以在不同 Provider 之间共享逻辑（复制粘贴代码）。
- 抽象能力相对受限。
- 原文认为缺少类型安全或 IDE 支持。

**解决方案：** CTO 希望探索 **Pulumi**——使用通用编程语言（Python、TypeScript、Go）实现基础设施即软件。

**Pulumi 的优势：**
1. **通用编程语言：** 使用 Python 及其库、逻辑与工具。
2. **类型安全：** 在部署前发现错误。
3. **更灵活的抽象：** 使用类和函数创建可复用组件。
4. **多云模式：** 跨 AWS、GCP、Azure 共享逻辑。
5. **测试：** 像应用代码一样对基础设施代码进行单元测试。

**你的任务：** 构建**多云 ML 训练平台**：
- 使用 **GCP TPU** 训练模型（原文认为其 LLM 性价比最佳）。
- 使用 **AWS S3** 保存数据（原文认为存储成本最低）。
- 使用 **AWS EKS** 提供模型服务（已有 Kubernetes 专业能力）。
- 使用 **Azure Monitor** 进行监控（企业需求）。

全部通过 **Pulumi Python** 代码管理。

## 学习目标

完成本练习后，你将能够：

1. 使用 Python 与 Pulumi 构建基础设施。
2. 管理多云部署（AWS、GCP、Azure）。
3. 使用 Python 类创建可复用基础设施组件。
4. 使用条件、循环与函数实现复杂逻辑。
5. 对基础设施代码进行单元测试。
6. 与现有 Python ML 管道集成。
7. 比较 Pulumi 与 Terraform 的取舍。

## 前置条件

- Module 109 练习 01（Terraform）——用于比较。
- Python 编程（中级）。
- AWS、GCP 和 Azure 账号（原文认为试用账号足够）。
- 已安装 Pulumi CLI。
- 云服务商 CLI（aws、gcloud、az）。

## 问题描述

使用 Pulumi 构建**多云 ML 训练平台**：

1. **数据层（AWS）：**
   - 用于数据集及模型的 S3 存储桶。
   - 用于元数据的 DynamoDB。
   - 用于模型分发的 CloudFront CDN。

2. **训练层（GCP）：**
   - 用于大型模型训练的 TPU VM。
   - 用于训练产物的 GCS 存储桶。
   - 用于实验追踪的 Vertex AI。

3. **服务层（AWS）：**
   - 用于模型推理的 EKS 集群。
   - Application Load Balancer。
   - 根据流量自动扩缩容。

4. **监控层（Azure）：**
   - 用于统一可观测性的 Azure Monitor。
   - Log Analytics Workspace。
   - Application Insights。

5. **跨云连接：**
   - VPC 对等连接/VPN 连接。
   - 共享密钥管理。
   - 统一 IAM/RBAC。

### 成功指标

- 使用单条命令将基础设施部署到三个云平台。
- 跨云服务商代码复用率超过 60%。
- 类型安全在部署前捕获全部配置错误（原文目标 100%）。
- 基础设施代码可使用 pytest 测试。
- 完整技术栈部署时间低于 20 分钟。
- 成本优化：为每个工作负载选择最便宜的云平台。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│         Multi-Cloud ML Platform (Pulumi + Python)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    AWS (Data + Serving)                   │  │
│  │                                                           │  │
│  │  ┌─────────────────┐         ┌─────────────────┐        │  │
│  │  │  S3 Buckets     │         │  EKS Cluster    │        │  │
│  │  │  - Datasets     │────────▶│  - Inference    │        │  │
│  │  │  - Models       │         │  - Autoscaling  │        │  │
│  │  │  - Artifacts    │         │  - ALB          │        │  │
│  │  └─────────────────┘         └─────────────────┘        │  │
│  │          │                            │                   │  │
│  │          │                            │                   │  │
│  │          ▼                            ▼                   │  │
│  │  ┌─────────────────┐         ┌─────────────────┐        │  │
│  │  │  DynamoDB       │         │  CloudFront CDN │        │  │
│  │  │  - Metadata     │         │  - Model Dist.  │        │  │
│  │  └─────────────────┘         └─────────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                               │                                 │
│                               │ Cross-Cloud VPN                 │
│                               ▼                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    GCP (Training)                         │  │
│  │                                                           │  │
│  │  ┌─────────────────┐         ┌─────────────────┐        │  │
│  │  │  TPU VMs        │────────▶│  GCS Buckets    │        │  │
│  │  │  - v4-8 (8 chip)│         │  - Checkpoints  │        │  │
│  │  │  - Preemptible  │         │  - Logs         │        │  │
│  │  └─────────────────┘         └─────────────────┘        │  │
│  │          │                                                │  │
│  │          ▼                                                │  │
│  │  ┌─────────────────┐                                     │  │
│  │  │  Vertex AI      │                                     │  │
│  │  │  - Experiments  │                                     │  │
│  │  │  - Metadata     │                                     │  │
│  │  └─────────────────┘                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                               │                                 │
│                               │ Metrics & Logs                  │
│                               ▼                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Azure (Monitoring)                        │  │
│  │                                                           │  │
│  │  ┌─────────────────┐         ┌─────────────────┐        │  │
│  │  │  Azure Monitor  │◀────────│  Log Analytics  │        │  │
│  │  │  - Dashboards   │         │  - Query Engine │        │  │
│  │  │  - Alerts       │         └─────────────────┘        │  │
│  │  └─────────────────┘                                     │  │
│  │          ▲                                                │  │
│  │          │                                                │  │
│  │  ┌───────┴──────────┐                                    │  │
│  │  │ App Insights     │                                    │  │
│  │  │ - Distributed    │                                    │  │
│  │  │   tracing        │                                    │  │
│  │  └──────────────────┘                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 实现任务

### 第一部分：Pulumi 项目搭建（5–7 小时）

使用 Python 搭建 Pulumi 项目并配置 Provider。

#### 1.1 初始化 Pulumi 项目

```bash
# Create project directory
mkdir pulumi-multicloud-ml
cd pulumi-multicloud-ml

# Initialize Pulumi project with Python
pulumi new python --name multicloud-ml-platform

# Install cloud provider SDKs
pip install pulumi-aws pulumi-gcp pulumi-azure pulumi-kubernetes
```

#### 1.2 项目结构

创建目录结构：

```
pulumi-multicloud-ml/
├── Pulumi.yaml              # Pulumi project configuration
├── Pulumi.dev.yaml          # Dev stack configuration
├── Pulumi.prod.yaml         # Production stack configuration
├── requirements.txt         # Python dependencies
├── __main__.py              # Entry point
│
├── components/              # Reusable components
│   ├── __init__.py
│   ├── aws/
│   │   ├── __init__.py
│   │   ├── data_storage.py      # S3, DynamoDB
│   │   ├── ml_serving.py        # EKS cluster
│   │   └── cdn.py               # CloudFront
│   ├── gcp/
│   │   ├── __init__.py
│   │   ├── tpu_training.py      # TPU VMs
│   │   └── vertex_ai.py         # Vertex AI
│   ├── azure/
│   │   ├── __init__.py
│   │   └── monitoring.py        # Azure Monitor
│   └── shared/
│       ├── __init__.py
│       ├── networking.py        # Cross-cloud VPN
│       └── secrets.py           # Unified secrets
│
├── config/
│   ├── __init__.py
│   ├── dev.py                   # Dev environment config
│   └── prod.py                  # Production config
│
├── tests/
│   ├── __init__.py
│   ├── test_aws_components.py
│   ├── test_gcp_components.py
│   └── test_integration.py
│
└── scripts/
    ├── deploy.sh
    └── destroy.sh
```

#### 1.3 主配置

创建 `__main__.py`：

```python
"""
TODO: Main Pulumi program - multi-cloud ML infrastructure.

This demonstrates Pulumi's power:
- Real Python code (not HCL)
- Type safety with IDE autocomplete
- Reusable components
- Complex logic (loops, conditionals)
"""

import pulumi
import pulumi_aws as aws
import pulumi_gcp as gcp
import pulumi_azure as azure

from components.aws.data_storage import DataStorageStack
from components.aws.ml_serving import MLServingStack
from components.gcp.tpu_training import TPUTrainingStack
from components.azure.monitoring import MonitoringStack
from components.shared.networking import CrossCloudVPN

# Get configuration
config = pulumi.Config()
environment = pulumi.get_stack()
project_name = pulumi.get_project()

# Configuration values (with defaults)
aws_region = config.get("aws_region") or "us-west-2"
gcp_region = config.get("gcp_region") or "us-central1"
azure_region = config.get("azure_region") or "eastus"

enable_tpu_training = config.get_bool("enable_tpu_training") or False
enable_monitoring = config.get_bool("enable_monitoring") or True

# TODO: AWS Data Layer
aws_data = DataStorageStack(
    f"{project_name}-data",
    environment=environment,
    region=aws_region,
    enable_versioning=environment == "prod",  # Versioning only in prod
    enable_cdn=environment == "prod"
)

# TODO: GCP Training Layer (optional, expensive)
if enable_tpu_training:
    gcp_training = TPUTrainingStack(
        f"{project_name}-training",
        environment=environment,
        region=gcp_region,
        tpu_type="v4-8",  # 8-chip TPU pod
        preemptible=environment != "prod"  # Use spot instances in dev
    )

# TODO: AWS Serving Layer
aws_serving = MLServingStack(
    f"{project_name}-serving",
    environment=environment,
    region=aws_region,
    model_bucket=aws_data.models_bucket.id,
    cluster_version="1.28",
    node_instance_types=["t3.xlarge"] if environment == "dev" else ["m5.2xlarge"]
)

# TODO: Azure Monitoring (if enabled)
if enable_monitoring:
    azure_monitoring = MonitoringStack(
        f"{project_name}-monitoring",
        environment=environment,
        region=azure_region
    )

# TODO: Cross-cloud VPN (connect AWS and GCP)
if enable_tpu_training:
    vpn = CrossCloudVPN(
        f"{project_name}-vpn",
        aws_vpc_id=aws_serving.vpc_id,
        gcp_vpc_name=gcp_training.vpc_name,
        aws_region=aws_region,
        gcp_region=gcp_region
    )

# Exports (outputs)
pulumi.export("aws_datasets_bucket", aws_data.datasets_bucket.bucket)
pulumi.export("aws_models_bucket", aws_data.models_bucket.bucket)
pulumi.export("eks_cluster_name", aws_serving.cluster_name)
pulumi.export("eks_cluster_endpoint", aws_serving.cluster_endpoint)

if enable_tpu_training:
    pulumi.export("gcp_tpu_name", gcp_training.tpu_vm_name)
    pulumi.export("gcp_tpu_ip", gcp_training.tpu_internal_ip)

if enable_monitoring:
    pulumi.export("azure_workspace_id", azure_monitoring.workspace_id)
```

创建 `Pulumi.yaml`：

```yaml
# TODO: Pulumi project configuration

name: multicloud-ml-platform
description: Multi-cloud ML infrastructure with AWS, GCP, and Azure
runtime: python

# Configuration schema (validates stack configs)
config:
  aws_region:
    type: string
    description: AWS region for data and serving layers
    default: us-west-2

  gcp_region:
    type: string
    description: GCP region for TPU training
    default: us-central1

  azure_region:
    type: string
    description: Azure region for monitoring
    default: eastus

  enable_tpu_training:
    type: boolean
    description: Enable expensive GCP TPU training resources
    default: false

  enable_monitoring:
    type: boolean
    description: Enable Azure Monitor integration
    default: true
```

创建 `Pulumi.dev.yaml`：

```yaml
# TODO: Development stack configuration

config:
  multicloud-ml-platform:aws_region: us-west-2
  multicloud-ml-platform:gcp_region: us-central1
  multicloud-ml-platform:azure_region: eastus
  multicloud-ml-platform:enable_tpu_training: false  # Expensive, disable in dev
  multicloud-ml-platform:enable_monitoring: false    # Save costs in dev
```

### 第二部分：AWS 组件（7–9 小时）

为数据存储与 ML 服务构建可复用 AWS 组件。

#### 2.1 数据存储组件

创建 `components/aws/data_storage.py`：

```python
"""
TODO: AWS data storage component.

Demonstrates Pulumi Python features:
- Component resources (grouping related resources)
- Type hints
- Python classes for encapsulation
"""

import pulumi
import pulumi_aws as aws
from typing import Optional

class DataStorageStack(pulumi.ComponentResource):
    """
    AWS data storage for ML datasets and models.

    Includes:
    - S3 buckets (datasets, models, artifacts)
    - DynamoDB for metadata
    - CloudFront CDN (optional)
    """

    def __init__(
        self,
        name: str,
        environment: str,
        region: str,
        enable_versioning: bool = False,
        enable_cdn: bool = False,
        opts: Optional[pulumi.ResourceOptions] = None
    ):
        super().__init__("custom:aws:DataStorageStack", name, {}, opts)

        # Child resource options (make this component the parent)
        child_opts = pulumi.ResourceOptions(parent=self)

        # TODO: Create S3 bucket for datasets
        self.datasets_bucket = aws.s3.Bucket(
            f"{name}-datasets",
            bucket=f"{name}-datasets-{environment}",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=enable_versioning
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=90,
                            storage_class="INTELLIGENT_TIERING"
                        ),
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=365,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            tags={
                "Environment": environment,
                "Purpose": "ML Datasets",
                "ManagedBy": "Pulumi"
            },
            opts=child_opts
        )

        # TODO: Create S3 bucket for trained models
        self.models_bucket = aws.s3.Bucket(
            f"{name}-models",
            bucket=f"{name}-models-{environment}",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True  # Always version models
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={
                "Environment": environment,
                "Purpose": "ML Models",
                "ManagedBy": "Pulumi"
            },
            opts=child_opts
        )

        # TODO: Create DynamoDB table for metadata
        self.metadata_table = aws.dynamodb.Table(
            f"{name}-metadata",
            name=f"{name}-metadata-{environment}",
            billing_mode="PAY_PER_REQUEST",  # Auto-scaling, no capacity planning
            hash_key="model_id",
            range_key="version",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="model_id",
                    type="S"  # String
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="version",
                    type="N"  # Number
                )
            ],
            tags={
                "Environment": environment,
                "Purpose": "Model Metadata",
                "ManagedBy": "Pulumi"
            },
            opts=child_opts
        )

        # TODO: Create CloudFront distribution (if enabled)
        if enable_cdn:
            self.cdn = aws.cloudfront.Distribution(
                f"{name}-cdn",
                enabled=True,
                default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                    target_origin_id=self.models_bucket.arn,
                    viewer_protocol_policy="redirect-to-https",
                    allowed_methods=["GET", "HEAD"],
                    cached_methods=["GET", "HEAD"],
                    forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                        query_string=False,
                        cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                            forward="none"
                        )
                    ),
                    min_ttl=0,
                    default_ttl=3600,
                    max_ttl=86400
                ),
                origins=[
                    aws.cloudfront.DistributionOriginArgs(
                        origin_id=self.models_bucket.arn,
                        domain_name=self.models_bucket.bucket_regional_domain_name,
                        s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                            origin_access_identity=""
                        )
                    )
                ],
                restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                    geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                        restriction_type="none"
                    )
                ),
                viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                    cloudfront_default_certificate=True
                ),
                tags={
                    "Environment": environment,
                    "ManagedBy": "Pulumi"
                },
                opts=child_opts
            )

        # Register outputs
        self.register_outputs({
            "datasets_bucket": self.datasets_bucket.id,
            "models_bucket": self.models_bucket.id,
            "metadata_table": self.metadata_table.id
        })
```

#### 2.2 ML 服务组件

创建 `components/aws/ml_serving.py`：

```python
"""
TODO: AWS ML serving component (EKS cluster).

Demonstrates:
- Complex resource dependencies
- Using outputs from other resources
- Kubernetes provider configuration
"""

import pulumi
import pulumi_aws as aws
import pulumi_eks as eks
from typing import List, Optional

class MLServingStack(pulumi.ComponentResource):
    """
    EKS cluster for ML model serving.

    Includes:
    - EKS cluster
    - Node groups (CPU and optional GPU)
    - Application Load Balancer
    - Auto-scaling configuration
    """

    def __init__(
        self,
        name: str,
        environment: str,
        region: str,
        model_bucket: pulumi.Output[str],
        cluster_version: str = "1.28",
        node_instance_types: List[str] = None,
        opts: Optional[pulumi.ResourceOptions] = None
    ):
        super().__init__("custom:aws:MLServingStack", name, {}, opts)

        child_opts = pulumi.ResourceOptions(parent=self)

        if node_instance_types is None:
            node_instance_types = ["t3.xlarge"]

        # TODO: Create EKS cluster using eks.Cluster (simplified)
        self.cluster = eks.Cluster(
            f"{name}-eks",
            version=cluster_version,
            instance_type=node_instance_types[0],
            desired_capacity=2 if environment == "prod" else 1,
            min_size=1,
            max_size=5 if environment == "prod" else 2,
            create_oidc_provider=True,  # For IAM roles for service accounts
            tags={
                "Environment": environment,
                "Purpose": "ML Inference",
                "ManagedBy": "Pulumi"
            },
            opts=child_opts
        )

        # TODO: Create IAM role for model access
        # EKS pods need to read from S3 models bucket
        model_access_policy = aws.iam.Policy(
            f"{name}-model-access",
            policy=pulumi.Output.all(model_bucket).apply(
                lambda args: pulumi.Output.json_dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{args[0]}",
                            f"arn:aws:s3:::{args[0]}/*"
                        ]
                    }]
                })
            ),
            opts=child_opts
        )

        # Store cluster details
        self.cluster_name = self.cluster.eks_cluster.name
        self.cluster_endpoint = self.cluster.eks_cluster.endpoint
        self.vpc_id = self.cluster.eks_cluster.vpc_config.vpc_id

        # Register outputs
        self.register_outputs({
            "cluster_name": self.cluster_name,
            "cluster_endpoint": self.cluster_endpoint,
            "vpc_id": self.vpc_id
        })
```

### 第三部分：GCP TPU 训练组件（6–8 小时）

创建 GCP TPU 训练基础设施。

创建 `components/gcp/tpu_training.py`：

```python
"""
TODO: GCP TPU training component.

Demonstrates:
- Multi-cloud patterns
- Conditional resource creation
- Integration with Python ML libraries
"""

import pulumi
import pulumi_gcp as gcp
from typing import Optional

class TPUTrainingStack(pulumi.ComponentResource):
    """
    GCP TPU VMs for large model training.

    TPU benefits:
    - 10× faster than GPUs for large models
    - Better cost/performance for transformers
    - Optimized for TensorFlow and JAX
    """

    def __init__(
        self,
        name: str,
        environment: str,
        region: str,
        tpu_type: str = "v4-8",  # 8-chip TPU pod
        preemptible: bool = False,  # Spot instances (70% cheaper)
        opts: Optional[pulumi.ResourceOptions] = None
    ):
        super().__init__("custom:gcp:TPUTrainingStack", name, {}, opts)

        child_opts = pulumi.ResourceOptions(parent=self)

        # TODO: Create VPC for TPU VMs
        self.vpc = gcp.compute.Network(
            f"{name}-vpc",
            auto_create_subnetworks=False,
            opts=child_opts
        )

        # TODO: Create subnet
        self.subnet = gcp.compute.Subnetwork(
            f"{name}-subnet",
            network=self.vpc.id,
            ip_cidr_range="10.1.0.0/24",
            region=region,
            opts=child_opts
        )

        # TODO: Create firewall rules (allow internal + SSH)
        self.firewall_internal = gcp.compute.Firewall(
            f"{name}-allow-internal",
            network=self.vpc.self_link,
            allows=[
                gcp.compute.FirewallAllowArgs(
                    protocol="tcp",
                    ports=["0-65535"]
                ),
                gcp.compute.FirewallAllowArgs(
                    protocol="udp",
                    ports=["0-65535"]
                ),
                gcp.compute.FirewallAllowArgs(
                    protocol="icmp"
                )
            ],
            source_ranges=["10.1.0.0/24"],
            opts=child_opts
        )

        # TODO: Create TPU VM
        self.tpu_vm = gcp.tpu.V2Vm(
            f"{name}-tpu",
            zone=f"{region}-a",
            runtime_version="tpu-vm-tf-2.14.0",  # TensorFlow 2.14
            accelerator_config=gcp.tpu.V2VmAcceleratorConfigArgs(
                type=tpu_type,
                topology="2x2x1" if tpu_type == "v4-8" else "2x2x2"
            ),
            network_config=gcp.tpu.V2VmNetworkConfigArgs(
                network=self.vpc.self_link,
                subnetwork=self.subnet.self_link,
                enable_external_ips=True
            ),
            scheduling_config=gcp.tpu.V2VmSchedulingConfigArgs(
                preemptible=preemptible
            ),
            tags={
                "environment": environment,
                "purpose": "ml-training",
                "managed-by": "pulumi"
            },
            opts=child_opts
        )

        # TODO: Create GCS bucket for training artifacts
        self.training_bucket = gcp.storage.Bucket(
            f"{name}-training",
            location=region,
            uniform_bucket_level_access=True,
            versioning=gcp.storage.BucketVersioningArgs(
                enabled=True
            ),
            lifecycle_rules=[
                gcp.storage.BucketLifecycleRuleArgs(
                    action=gcp.storage.BucketLifecycleRuleActionArgs(
                        type="Delete"
                    ),
                    condition=gcp.storage.BucketLifecycleRuleConditionArgs(
                        age=30  # Delete after 30 days
                    )
                )
            ],
            opts=child_opts
        )

        # Store TPU details
        self.tpu_vm_name = self.tpu_vm.name
        self.tpu_internal_ip = self.tpu_vm.network_endpoints.apply(
            lambda endpoints: endpoints[0].ip_address if endpoints else None
        )
        self.vpc_name = self.vpc.name

        # Register outputs
        self.register_outputs({
            "tpu_vm_name": self.tpu_vm_name,
            "tpu_internal_ip": self.tpu_internal_ip,
            "vpc_name": self.vpc_name,
            "training_bucket": self.training_bucket.name
        })
```

### 第四部分：Azure 监控组件（4–6 小时）

创建 Azure 监控基础设施。

创建 `components/azure/monitoring.py`：

```python
"""
TODO: Azure monitoring component.

Demonstrates:
- Third cloud provider integration
- Unified observability across clouds
"""

import pulumi
import pulumi_azure as azure
from typing import Optional

class MonitoringStack(pulumi.ComponentResource):
    """
    Azure Monitor for unified observability.

    Collects metrics and logs from:
    - AWS EKS (via Azure Monitor agent)
    - GCP TPU VMs (via custom exporters)
    - All application telemetry
    """

    def __init__(
        self,
        name: str,
        environment: str,
        region: str,
        opts: Optional[pulumi.ResourceOptions] = None
    ):
        super().__init__("custom:azure:MonitoringStack", name, {}, opts)

        child_opts = pulumi.ResourceOptions(parent=self)

        # TODO: Create Resource Group
        self.resource_group = azure.core.ResourceGroup(
            f"{name}-rg",
            location=region,
            tags={
                "environment": environment,
                "purpose": "monitoring",
                "managed-by": "pulumi"
            },
            opts=child_opts
        )

        # TODO: Create Log Analytics Workspace
        self.workspace = azure.operationalinsights.Workspace(
            f"{name}-workspace",
            resource_group_name=self.resource_group.name,
            location=self.resource_group.location,
            sku="PerGB2018",  # Pay-per-GB pricing
            retention_in_days=30 if environment == "dev" else 90,
            tags={
                "environment": environment,
                "purpose": "ml-logs"
            },
            opts=child_opts
        )

        # TODO: Create Application Insights
        self.app_insights = azure.appinsights.Insights(
            f"{name}-appinsights",
            resource_group_name=self.resource_group.name,
            location=self.resource_group.location,
            application_type="web",
            workspace_id=self.workspace.id,
            tags={
                "environment": environment,
                "purpose": "ml-telemetry"
            },
            opts=child_opts
        )

        # Store monitoring details
        self.workspace_id = self.workspace.id
        self.instrumentation_key = self.app_insights.instrumentation_key

        # Register outputs
        self.register_outputs({
            "workspace_id": self.workspace_id,
            "instrumentation_key": self.instrumentation_key
        })
```

### 第五部分：测试与部署（6–8 小时）

实现单元测试与部署自动化。

#### 5.1 单元测试

创建 `tests/test_aws_components.py`：

```python
"""
TODO: Unit tests for AWS components.

Pulumi allows testing infrastructure code with pytest!
"""

import unittest
import pulumi

class TestDataStorage(unittest.TestCase):
    """Test AWS data storage component."""

    @pulumi.runtime.test
    def test_s3_bucket_encryption(self):
        """Verify S3 buckets have encryption enabled."""

        # TODO: Import component and test
        from components.aws.data_storage import DataStorageStack

        def check_encryption(args):
            bucket, encryption = args
            # Verify encryption is enabled
            self.assertEqual(encryption["rule"]["apply_server_side_encryption_by_default"]["sse_algorithm"], "AES256")

        # Create component
        stack = DataStorageStack(
            "test-storage",
            environment="test",
            region="us-west-2",
            enable_versioning=True
        )

        # Test encryption configuration
        pulumi.Output.all(
            stack.datasets_bucket,
            stack.datasets_bucket.server_side_encryption_configuration
        ).apply(check_encryption)

    @pulumi.runtime.test
    def test_versioning_enabled_prod(self):
        """Verify versioning enabled in production."""

        from components.aws.data_storage import DataStorageStack

        stack = DataStorageStack(
            "test-storage-prod",
            environment="prod",
            region="us-west-2",
            enable_versioning=True
        )

        def check_versioning(versioning):
            self.assertTrue(versioning["enabled"])

        stack.models_bucket.versioning.apply(check_versioning)
```

#### 5.2 部署脚本

创建 `scripts/deploy.sh`：

```bash
#!/bin/bash
# TODO: Deploy multi-cloud infrastructure

set -e

STACK=${1:-dev}

echo "Deploying to stack: ${STACK}"

# Select stack
pulumi stack select ${STACK} || pulumi stack init ${STACK}

# Preview changes
pulumi preview --stack ${STACK}

# Ask for confirmation
read -p "Deploy these changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Deploy
    pulumi up --stack ${STACK} --yes

    # Show outputs
    pulumi stack output --stack ${STACK}
fi
```

## 验收标准

### 功能需求

- [ ] 通过 Pulumi 部署多云基础设施（AWS + GCP + Azure）。
- [ ] 全部组件实现为可复用 Python 类。
- [ ] 强制类型安全（类型标注、IDE 自动补全）。
- [ ] 全部组件具有单元测试，覆盖率超过 80%。
- [ ] 开发/生产 Stack 的配置管理。
- [ ] 跨云连接（AWS 与 GCP 之间的 VPN）。

### 性能需求

- [ ] 基础设施部署在 20 分钟内完成。
- [ ] Pulumi Preview 在 30 秒内完成。
- [ ] 跨云服务商代码复用率超过 60%。

### 代码质量

- [ ] 全部 Python 代码通过类型检查（mypy）。
- [ ] 使用 black 格式化代码。
- [ ] 全面文档与示例。
- [ ] 使用 pytest 进行单元测试。

## 测试策略

```bash
# Type checking
mypy components/

# Unit tests
pytest tests/ -v

# Preview changes
pulumi preview

# Deploy to dev
./scripts/deploy.sh dev
```

## 交付物

1. **Pulumi 代码**（Python 组件及主程序）。
2. **测试**（使用 pytest 的单元测试）。
3. **文档**（架构指南、与 Terraform 的比较）。
4. **部署脚本。**

## 额外挑战

1. **策略即代码（额外 4 小时）：** 添加 Pulumi Policy Pack。
2. **自定义组件（额外 6 小时）：** 将组件打包为可复用库。
3. **集成测试（额外 6 小时）：** 测试真实云部署。

## 资源

- [Pulumi 文档](https://www.pulumi.com/docs/)
- [Pulumi AWS](https://www.pulumi.com/registry/packages/aws/)
- [Pulumi GCP](https://www.pulumi.com/registry/packages/gcp/)
- [Pulumi Azure](https://www.pulumi.com/registry/packages/azure/)

## 提交

```bash
git add .
git commit -m "Complete Exercise 02: Pulumi Multi-Cloud ML"
git push origin exercise-02-pulumi-multicloud-ml
```

---

**预计时长分解：**
- 第一部分（搭建）：5–7 小时。
- 第二部分（AWS 组件）：7–9 小时。
- 第三部分（GCP 组件）：6–8 小时。
- 第四部分（Azure 组件）：4–6 小时。
- 第五部分（测试与部署）：6–8 小时。
- **合计（原文）：** 28–36 小时。

> 译注：Terraform 具备类型约束及 IDE 支持，Python 类型标注也不能保证发现全部配置错误。跨云方案需额外考虑出站流量、网络延迟、身份联邦、数据驻留与运维复杂度，不能仅按各服务单价选择。跨云 VPC 连接通常需要 VPN、专线或第三方网络服务。各部分时间上限合计为 38 小时。试用账号不保证覆盖 TPU、EKS 等资源费用。原始代码块及 TODO 保留，未实际执行部署。
