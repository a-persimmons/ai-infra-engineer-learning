# 练习 01：多云成本分析器

## 学习目标

完成本练习后，你将能够：
- 比较 AWS、GCP 与 Azure 的成本。
- 理解云平台定价模式及账单 API。
- 构建自动化成本分析工具。
- 实现成本优化建议。
- 创建交互式成本仪表盘。

## 概览

云成本是 AI/ML 基础设施团队的重要关注点。本练习将构建综合成本分析工具，比较 AWS、GCP 和 Azure 的定价，帮助团队作出有依据的决策并优化支出。

## 前置条件

- Python 3.11+，安装云平台 SDK（boto3、google-cloud、azure-sdk）。
- 有效的 AWS、GCP、Azure 账号（原文认为免费层足够）。
- 理解云服务（计算、存储、网络）。
- 掌握云账单基本概念。

## 问题描述

构建多云成本分析器 `cloudcost`，具备以下能力：

1. **获取定价数据：** 从 AWS、GCP 和 Azure API 获取数据。
2. **比较成本：** 比较不同云平台的等效服务。
3. **分析实际用量：** 识别支出模式。
4. **推荐优化方案：** 预留实例、Spot 实例、合理调整规格。
5. **生成报告：** 包含可视化与可执行的建议。

## 需求

### 功能需求

#### FR1：定价数据采集
- 从云服务商 API 获取定价数据：
  - AWS：Pricing API、Cost Explorer API。
  - GCP：Cloud Billing API、Pricing API。
  - Azure：Retail Prices API、Cost Management API。
- 在本地缓存定价数据（每日更新）。
- 支持多个区域。
- 处理以下服务的定价：
  - 计算（VM、GPU）。
  - 存储（S3、GCS、Blob）。
  - 网络（数据传输）。
  - 托管服务（RDS、Cloud SQL 等）。

#### FR2：成本比较
- 比较等效实例类型：
  - AWS EC2、GCP Compute Engine、Azure VM。
  - 不同云平台的 GPU 实例。
  - 存储成本（每 GB/月）。
  - 网络出站流量成本。
- 计算总拥有成本（TCO）。
- 支持按需、预留及 Spot 定价。
- 考虑 GCP 持续使用折扣。
- 计入承诺使用折扣。

#### FR3：用量分析
- 连接云账单 API。
- 获取历史支出数据。
- 分析用量模式：
  - 高峰与低峰用量。
  - 利用率不足的资源。
  - 成本随时间变化的趋势。
- 识别费用异常及突增。

#### FR4：成本优化
- 推荐优化方案：
  - 合理调整规格（减小实例规格）。
  - 预留实例与按需实例比较。
  - Spot/Preemptible 实例。
  - 存储类别优化。
  - 区域选择。
- 计算潜在节省金额。
- 按影响程度确定建议优先级。

#### FR5：报告
- 生成交互式仪表盘。
- 导出报告（PDF、HTML、JSON、CSV）。
- 可视化：
  - 成本趋势。
  - 跨云比较。
  - 节省机会。
  - 预算与实际支出比较。

### 非功能需求

#### NFR1：准确性
- 定价数据与服务商 API 一致。
- 计算结果与云账单一致。
- 计入全部容易被忽略的费用（数据传输、API 调用）。

#### NFR2：性能
- 缓存定价数据，减少 API 调用。
- 异步获取数据。
- 高效处理大型账单数据集。

#### NFR3：安全
- 绝不在代码中保存云凭据。
- 使用 IAM 角色及服务账号。
- 支持凭据轮换。
- 对全部操作记录审计日志。

## 实现任务

### 任务 1：云服务商抽象（5–6 小时）

为全部云服务商构建统一接口：

```python
# src/cloud_providers/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum

class InstanceFamily(Enum):
    """Instance family types"""
    GENERAL_PURPOSE = "general_purpose"
    COMPUTE_OPTIMIZED = "compute_optimized"
    MEMORY_OPTIMIZED = "memory_optimized"
    GPU = "gpu"
    STORAGE_OPTIMIZED = "storage_optimized"

class PricingModel(Enum):
    """Pricing models"""
    ON_DEMAND = "on_demand"
    RESERVED_1Y = "reserved_1y"
    RESERVED_3Y = "reserved_3y"
    SPOT = "spot"
    PREEMPTIBLE = "preemptible"

@dataclass
class InstanceSpec:
    """Cloud instance specification"""
    provider: str  # "aws", "gcp", "azure"
    instance_type: str  # e.g., "n1-standard-4"
    vcpus: int
    memory_gb: float
    gpu_count: int = 0
    gpu_type: Optional[str] = None
    family: InstanceFamily = InstanceFamily.GENERAL_PURPOSE
    region: str = "us-east-1"

@dataclass
class PricingInfo:
    """Instance pricing information"""
    instance_spec: InstanceSpec
    pricing_model: PricingModel
    price_per_hour: float
    price_per_month: float  # 730 hours
    currency: str = "USD"
    effective_date: datetime = None

@dataclass
class StoragePricing:
    """Storage pricing"""
    provider: str
    storage_class: str  # "standard", "nearline", "coldline", etc.
    region: str
    price_per_gb_month: float
    retrieval_fee_per_gb: Optional[float] = None

class CloudProvider(ABC):
    """Abstract base class for cloud providers"""

    def __init__(self, region: str = None):
        self.region = region
        self.pricing_cache = {}

    @abstractmethod
    def get_instance_pricing(
        self,
        instance_type: str,
        pricing_model: PricingModel = PricingModel.ON_DEMAND,
        region: Optional[str] = None
    ) -> PricingInfo:
        """
        Get pricing for specific instance type

        TODO: Implement for each cloud provider
        - Query pricing API
        - Parse response
        - Cache results
        - Handle API errors
        """
        pass

    @abstractmethod
    def list_instance_types(
        self,
        family: Optional[InstanceFamily] = None,
        min_vcpus: Optional[int] = None,
        min_memory_gb: Optional[float] = None,
        gpu_required: bool = False
    ) -> List[InstanceSpec]:
        """
        TODO: List available instance types matching criteria
        """
        pass

    @abstractmethod
    def get_storage_pricing(
        self,
        storage_class: str,
        region: Optional[str] = None
    ) -> StoragePricing:
        """TODO: Get storage pricing"""
        pass

    @abstractmethod
    def get_network_pricing(
        self,
        from_region: str,
        to_region: Optional[str] = None,
        to_internet: bool = False
    ) -> Dict[str, float]:
        """
        TODO: Get network/egress pricing

        Returns:
            {
                "inter_region_per_gb": 0.02,
                "internet_egress_per_gb": 0.09
            }
        """
        pass

    @abstractmethod
    def get_actual_costs(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        TODO: Get actual spending from billing API

        Args:
            start_date: Start of date range
            end_date: End of date range
            group_by: Group costs by service, region, tag, etc.

        Returns:
            Cost breakdown dict
        """
        pass

    def find_equivalent_instance(
        self,
        target_spec: InstanceSpec
    ) -> Optional[InstanceSpec]:
        """
        TODO: Find equivalent instance on this cloud

        Match by:
        - Similar vCPU count (±25%)
        - Similar memory (±25%)
        - Same GPU type/count if applicable
        """
        pass
```

**验收标准：**
- [ ] 抽象接口覆盖全部服务商。
- [ ] 不同实现的 API 保持一致。
- [ ] 正确处理错误。
- [ ] 已实现缓存。

---

### 任务 2：AWS 实现（4–5 小时）

```python
# src/cloud_providers/aws.py

import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json

class AWSProvider(CloudProvider):
    """AWS pricing and billing"""

    def __init__(self, region: str = "us-east-1"):
        super().__init__(region)
        self.pricing_client = boto3.client('pricing', region_name='us-east-1')
        self.ce_client = boto3.client('ce', region_name='us-east-1')
        self.ec2_client = boto3.client('ec2', region_name=region)

    def get_instance_pricing(
        self,
        instance_type: str,
        pricing_model: PricingModel = PricingModel.ON_DEMAND,
        region: Optional[str] = None
    ) -> PricingInfo:
        """
        TODO: Get EC2 instance pricing

        ```python
        region = region or self.region

        # Check cache
        cache_key = f"{instance_type}_{pricing_model.value}_{region}"
        if cache_key in self.pricing_cache:
            return self.pricing_cache[cache_key]

        # Query AWS Pricing API
        filters = [
            {'Type': 'TERM_MATCH', 'Field': 'instanceType', 'Value': instance_type},
            {'Type': 'TERM_MATCH', 'Field': 'location', 'Value': self._get_location_name(region)},
            {'Type': 'TERM_MATCH', 'Field': 'operatingSystem', 'Value': 'Linux'},
            {'Type': 'TERM_MATCH', 'Field': 'preInstalledSw', 'Value': 'NA'},
            {'Type': 'TERM_MATCH', 'Field': 'tenancy', 'Value': 'Shared'},
            {'Type': 'TERM_MATCH', 'Field': 'capacitystatus', 'Value': 'Used'}
        ]

        response = self.pricing_client.get_products(
            ServiceCode='AmazonEC2',
            Filters=filters
        )

        # Parse response and extract pricing
        for price_item in response['PriceList']:
            price_data = json.loads(price_item)
            # Extract on-demand or reserved pricing
            # ...

        # Get instance specs
        spec = self._get_instance_specs(instance_type, region)

        pricing = PricingInfo(
            instance_spec=spec,
            pricing_model=pricing_model,
            price_per_hour=price_per_hour,
            price_per_month=price_per_hour * 730,
            currency="USD",
            effective_date=datetime.now()
        )

        self.pricing_cache[cache_key] = pricing
        return pricing
        ```
        """
        pass

    def list_instance_types(
        self,
        family: Optional[InstanceFamily] = None,
        min_vcpus: Optional[int] = None,
        min_memory_gb: Optional[float] = None,
        gpu_required: bool = False
    ) -> List[InstanceSpec]:
        """
        TODO: List EC2 instance types

        ```python
        response = self.ec2_client.describe_instance_types()

        instances = []
        for instance_type in response['InstanceTypes']:
            spec = InstanceSpec(
                provider="aws",
                instance_type=instance_type['InstanceType'],
                vcpus=instance_type['VCpuInfo']['DefaultVCpus'],
                memory_gb=instance_type['MemoryInfo']['SizeInMiB'] / 1024,
                region=self.region
            )

            # Check GPU
            if 'GpuInfo' in instance_type:
                spec.gpu_count = instance_type['GpuInfo']['Gpus'][0]['Count']
                spec.gpu_type = instance_type['GpuInfo']['Gpus'][0]['Name']
                spec.family = InstanceFamily.GPU

            # Filter by criteria
            if min_vcpus and spec.vcpus < min_vcpus:
                continue
            if min_memory_gb and spec.memory_gb < min_memory_gb:
                continue
            if gpu_required and spec.gpu_count == 0:
                continue

            instances.append(spec)

        return instances
        ```
        """
        pass

    def get_storage_pricing(
        self,
        storage_class: str,
        region: Optional[str] = None
    ) -> StoragePricing:
        """
        TODO: Get S3 storage pricing

        Storage classes:
        - STANDARD
        - STANDARD_IA (Infrequent Access)
        - INTELLIGENT_TIERING
        - GLACIER
        - GLACIER_DEEP_ARCHIVE
        """
        pass

    def get_network_pricing(
        self,
        from_region: str,
        to_region: Optional[str] = None,
        to_internet: bool = False
    ) -> Dict[str, float]:
        """TODO: Get data transfer pricing"""
        pass

    def get_actual_costs(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        TODO: Get actual costs from AWS Cost Explorer

        ```python
        group_by = group_by or ['SERVICE']

        response = self.ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[{'Type': 'DIMENSION', 'Key': key} for key in group_by]
        )

        costs = {}
        for result in response['ResultsByTime']:
            for group in result['Groups']:
                key = '_'.join(group['Keys'])
                amount = float(group['Metrics']['UnblendedCost']['Amount'])
                costs[key] = costs.get(key, 0) + amount

        return costs
        ```
        """
        pass

    def _get_location_name(self, region: str) -> str:
        """
        TODO: Convert region code to location name

        Example: us-east-1 -> US East (N. Virginia)
        """
        pass

    def _get_instance_specs(self, instance_type: str, region: str) -> InstanceSpec:
        """TODO: Get instance specifications"""
        pass

    def get_spot_pricing(
        self,
        instance_type: str,
        region: Optional[str] = None
    ) -> float:
        """
        TODO: Get current spot instance pricing

        ```python
        response = self.ec2_client.describe_spot_price_history(
            InstanceTypes=[instance_type],
            MaxResults=1,
            ProductDescriptions=['Linux/UNIX']
        )

        if response['SpotPriceHistory']:
            return float(response['SpotPriceHistory'][0]['SpotPrice'])
        return None
        ```
        """
        pass
```

**验收标准：**
- [ ] 从 AWS Pricing API 获取 EC2 定价。
- [ ] 从 Cost Explorer 获取实际费用。
- [ ] 支持按需、预留及 Spot 定价。
- [ ] 处理分页及错误。
- [ ] 缓存定价数据。

---

### 任务 3：GCP 实现（4–5 小时）

```python
# src/cloud_providers/gcp.py

from google.cloud import billing_v1
from google.cloud import compute_v1
from typing import List, Dict, Optional
from datetime import datetime
import requests

class GCPProvider(CloudProvider):
    """GCP pricing and billing"""

    def __init__(self, region: str = "us-east1", project_id: Optional[str] = None):
        super().__init__(region)
        self.project_id = project_id
        self.compute_client = compute_v1.InstancesClient()
        self.pricing_url = "https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus"

    def get_instance_pricing(
        self,
        instance_type: str,
        pricing_model: PricingModel = PricingModel.ON_DEMAND,
        region: Optional[str] = None
    ) -> PricingInfo:
        """
        TODO: Get Compute Engine pricing

        ```python
        # GCP pricing is via Cloud Billing API
        # Example: n1-standard-4 in us-east1

        # Fetch pricing from Billing API
        response = requests.get(
            self.pricing_url,
            params={'currencyCode': 'USD'}
        )

        skus = response.json().get('skus', [])

        # Find SKU for this instance type and region
        for sku in skus:
            if instance_type in sku['description'].lower():
                if region in sku['serviceRegions']:
                    # Extract pricing from SKU
                    pricing_info = sku['pricingInfo'][0]
                    price_per_hour = self._parse_pricing(pricing_info)

                    spec = self._get_instance_specs(instance_type, region)

                    # GCP has sustained use discounts (automatic)
                    # Adjust pricing based on expected usage
                    sustained_discount = 0.7  # 30% discount for full month
                    price_per_month = price_per_hour * 730 * sustained_discount

                    return PricingInfo(
                        instance_spec=spec,
                        pricing_model=pricing_model,
                        price_per_hour=price_per_hour,
                        price_per_month=price_per_month,
                        currency="USD"
                    )
        ```
        """
        pass

    def list_instance_types(
        self,
        family: Optional[InstanceFamily] = None,
        min_vcpus: Optional[int] = None,
        min_memory_gb: Optional[float] = None,
        gpu_required: bool = False
    ) -> List[InstanceSpec]:
        """
        TODO: List GCP machine types

        GCP families:
        - n1-standard-* (general purpose)
        - n1-highmem-* (memory optimized)
        - n1-highcpu-* (compute optimized)
        - n2-* (newer generation)
        - c2-* (compute optimized)
        - m1-*, m2-* (memory optimized)
        - a2-* (GPU instances)
        """
        pass

    def get_storage_pricing(
        self,
        storage_class: str,
        region: Optional[str] = None
    ) -> StoragePricing:
        """
        TODO: Get Cloud Storage pricing

        Classes:
        - STANDARD
        - NEARLINE (30-day minimum)
        - COLDLINE (90-day minimum)
        - ARCHIVE (365-day minimum)
        """
        pass

    def get_actual_costs(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        TODO: Get actual costs from Cloud Billing

        Requires:
        - Billing account ID
        - BigQuery export enabled
        - Query billing data from BigQuery
        """
        pass

    def get_preemptible_pricing(
        self,
        instance_type: str,
        region: Optional[str] = None
    ) -> float:
        """
        TODO: Get preemptible instance pricing

        Preemptible = ~80% discount from on-demand
        """
        pass
```

**验收标准：**
- [ ] 从 Cloud Billing API 获取 GCP 定价。
- [ ] 考虑持续使用折扣。
- [ ] 支持 Preemptible 实例。
- [ ] 从 BigQuery 账单导出获取实际费用。

---

### 任务 4：Azure 实现（4–5 小时）

```python
# src/cloud_providers/azure.py

from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.costmanagement import CostManagementClient
from azure.identity import DefaultAzureCredential
from typing import List, Dict, Optional
from datetime import datetime
import requests

class AzureProvider(CloudProvider):
    """Azure pricing and billing"""

    def __init__(self, region: str = "eastus", subscription_id: Optional[str] = None):
        super().__init__(region)
        self.subscription_id = subscription_id
        self.credential = DefaultAzureCredential()

        if subscription_id:
            self.compute_client = ComputeManagementClient(
                self.credential,
                subscription_id
            )
            self.cost_client = CostManagementClient(self.credential)

        self.retail_pricing_url = "https://prices.azure.com/api/retail/prices"

    def get_instance_pricing(
        self,
        instance_type: str,
        pricing_model: PricingModel = PricingModel.ON_DEMAND,
        region: Optional[str] = None
    ) -> PricingInfo:
        """
        TODO: Get Azure VM pricing

        Use Azure Retail Prices API:
        https://prices.azure.com/api/retail/prices

        ```python
        region = region or self.region

        # Query retail prices API
        filter_query = (
            f"serviceName eq 'Virtual Machines' "
            f"and armSkuName eq '{instance_type}' "
            f"and armRegionName eq '{region}' "
            f"and priceType eq 'Consumption'"
        )

        response = requests.get(
            self.retail_pricing_url,
            params={'$filter': filter_query}
        )

        items = response.json().get('Items', [])

        for item in items:
            price_per_hour = item['retailPrice']

            spec = self._get_instance_specs(instance_type, region)

            return PricingInfo(
                instance_spec=spec,
                pricing_model=pricing_model,
                price_per_hour=price_per_hour,
                price_per_month=price_per_hour * 730,
                currency=item['currencyCode']
            )
        ```
        """
        pass

    def list_instance_types(
        self,
        family: Optional[InstanceFamily] = None,
        min_vcpus: Optional[int] = None,
        min_memory_gb: Optional[float] = None,
        gpu_required: bool = False
    ) -> List[InstanceSpec]:
        """
        TODO: List Azure VM sizes

        Families:
        - Standard_D* (general purpose)
        - Standard_E* (memory optimized)
        - Standard_F* (compute optimized)
        - Standard_NC*, Standard_ND* (GPU)
        """
        pass

    def get_storage_pricing(
        self,
        storage_class: str,
        region: Optional[str] = None
    ) -> StoragePricing:
        """
        TODO: Get Blob Storage pricing

        Tiers:
        - Hot
        - Cool
        - Archive
        """
        pass

    def get_actual_costs(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        TODO: Get actual costs from Cost Management API

        ```python
        scope = f"/subscriptions/{self.subscription_id}"

        query = {
            "type": "ActualCost",
            "timeframe": "Custom",
            "timePeriod": {
                "from": start_date.strftime('%Y-%m-%dT00:00:00Z'),
                "to": end_date.strftime('%Y-%m-%dT00:00:00Z')
            },
            "dataset": {
                "granularity": "Daily",
                "aggregation": {
                    "totalCost": {
                        "name": "Cost",
                        "function": "Sum"
                    }
                },
                "grouping": [
                    {"type": "Dimension", "name": group}
                    for group in (group_by or ["ServiceName"])
                ]
            }
        }

        result = self.cost_client.query.usage(scope, query)

        # Parse result
        costs = {}
        for row in result.rows:
            # Extract cost data
            pass

        return costs
        ```
        """
        pass

    def get_spot_pricing(
        self,
        instance_type: str,
        region: Optional[str] = None
    ) -> float:
        """TODO: Get Azure Spot VM pricing"""
        pass
```

**验收标准：**
- [ ] 从 Retail Prices API 获取 Azure 定价。
- [ ] 从 Cost Management API 获取实际费用。
- [ ] 支持 Spot VM 定价。
- [ ] 处理 Azure 特有的定价模式。

---

### 任务 5：成本比较引擎（5–6 小时）

```python
# src/cost_comparator.py

from typing import List, Dict, Optional
from dataclasses import dataclass
import pandas as pd

from .cloud_providers.base import (
    CloudProvider, InstanceSpec, PricingInfo, PricingModel
)
from .cloud_providers.aws import AWSProvider
from .cloud_providers.gcp import GCPProvider
from .cloud_providers.azure import AzureProvider

@dataclass
class ComparisonResult:
    """Cross-cloud comparison result"""
    aws_instance: Optional[InstanceSpec] = None
    gcp_instance: Optional[InstanceSpec] = None
    azure_instance: Optional[InstanceSpec] = None

    aws_pricing: Optional[PricingInfo] = None
    gcp_pricing: Optional[PricingInfo] = None
    azure_pricing: Optional[PricingInfo] = None

    cheapest_provider: str = None
    max_savings_percent: float = 0.0
    max_savings_monthly: float = 0.0

class CostComparator:
    """Compare costs across cloud providers"""

    def __init__(self):
        self.providers = {
            'aws': AWSProvider(),
            'gcp': GCPProvider(),
            'azure': AzureProvider()
        }

    def compare_instance(
        self,
        vcpus: int,
        memory_gb: float,
        gpu_count: int = 0,
        region: str = "us-east",
        pricing_model: PricingModel = PricingModel.ON_DEMAND
    ) -> ComparisonResult:
        """
        TODO: Compare equivalent instance across clouds

        Algorithm:
        1. Find equivalent instance on each cloud
           - Match vCPU count (±25%)
           - Match memory (±25%)
           - Match GPU if required
        2. Get pricing for each
        3. Calculate cheapest option
        4. Calculate savings

        ```python
        target_spec = InstanceSpec(
            provider="target",
            instance_type="target",
            vcpus=vcpus,
            memory_gb=memory_gb,
            gpu_count=gpu_count
        )

        result = ComparisonResult()

        # Find equivalent on each cloud
        for provider_name, provider in self.providers.items():
            equivalent = provider.find_equivalent_instance(target_spec)
            if equivalent:
                pricing = provider.get_instance_pricing(
                    equivalent.instance_type,
                    pricing_model
                )

                setattr(result, f"{provider_name}_instance", equivalent)
                setattr(result, f"{provider_name}_pricing", pricing)

        # Determine cheapest
        prices = {}
        for provider in ['aws', 'gcp', 'azure']:
            pricing = getattr(result, f"{provider}_pricing")
            if pricing:
                prices[provider] = pricing.price_per_month

        if prices:
            result.cheapest_provider = min(prices, key=prices.get)
            cheapest_price = prices[result.cheapest_provider]
            most_expensive = max(prices.values())

            result.max_savings_monthly = most_expensive - cheapest_price
            result.max_savings_percent = (
                (most_expensive - cheapest_price) / most_expensive * 100
            )

        return result
        ```
        """
        pass

    def compare_workload(
        self,
        workload_config: Dict[str, any]
    ) -> pd.DataFrame:
        """
        TODO: Compare cost for complete workload

        workload_config example:
        {
            "compute": [
                {"vcpus": 4, "memory_gb": 16, "count": 10},
                {"vcpus": 8, "memory_gb": 32, "gpu_count": 1, "count": 2}
            ],
            "storage": [
                {"type": "standard", "size_gb": 1000},
                {"type": "archive", "size_gb": 10000}
            ],
            "network": {
                "egress_gb_month": 5000
            },
            "duration_months": 12
        }

        Calculate total TCO for each cloud
        """
        pass

    def generate_comparison_table(
        self,
        results: List[ComparisonResult]
    ) -> pd.DataFrame:
        """
        TODO: Generate comparison table

        Columns:
        - Spec (vCPU/Memory/GPU)
        - AWS Instance
        - AWS Price/month
        - GCP Instance
        - GCP Price/month
        - Azure Instance
        - Azure Price/month
        - Cheapest
        - Savings %
        """
        pass

    def recommend_cloud(
        self,
        workload_config: Dict,
        priorities: List[str] = None
    ) -> Dict[str, any]:
        """
        TODO: Recommend cloud provider

        Consider:
        - Cost (primary)
        - Performance requirements
        - Existing cloud presence
        - Geographic requirements
        - Compliance needs

        priorities example: ["cost", "gpu_availability", "region_coverage"]
        """
        pass
```

**验收标准：**
- [ ] 准确比较等效实例。
- [ ] 计算工作负载总成本。
- [ ] 生成比较表格。
- [ ] 提供云平台选型建议。
- [ ] 妥善处理数据缺失。

---

### 任务 6：成本优化建议（4–5 小时）

```python
# src/optimizer.py

from typing import List, Dict
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Optimization:
    """Cost optimization recommendation"""
    resource_id: str
    resource_type: str  # "instance", "storage", "network"
    current_cost_monthly: float
    optimized_cost_monthly: float
    savings_monthly: float
    savings_percent: float
    recommendation: str
    effort: str  # "low", "medium", "high"
    risk: str  # "low", "medium", "high"
    priority: int  # 1-10, higher = more important

class CostOptimizer:
    """Generate cost optimization recommendations"""

    def analyze_usage(
        self,
        provider: CloudProvider,
        start_date: datetime,
        end_date: datetime
    ) -> List[Optimization]:
        """
        TODO: Analyze usage and generate recommendations

        Analyze:
        1. Underutilized instances (< 40% CPU for 7 days)
        2. Stopped instances still incurring costs
        3. Unattached volumes
        4. Old snapshots
        5. On-demand vs reserved opportunities
        6. Spot instance opportunities
        7. Storage class optimization
        8. Over-provisioned instances
        """
        pass

    def recommend_rightsizing(
        self,
        instance_id: str,
        current_type: str,
        avg_cpu_percent: float,
        avg_memory_percent: float,
        provider: CloudProvider
    ) -> Optional[Optimization]:
        """
        TODO: Recommend instance right-sizing

        If CPU < 40% and Memory < 50% for 7+ days:
        - Recommend smaller instance
        - Calculate savings
        - Estimate migration effort
        """
        pass

    def recommend_reserved_instances(
        self,
        usage_history: Dict,
        provider: CloudProvider
    ) -> List[Optimization]:
        """
        TODO: Recommend reserved instances

        If instance runs > 70% of time for 30+ days:
        - Calculate RI savings (up to 72%)
        - Recommend 1-year or 3-year commitment
        - Break-even analysis
        """
        pass

    def recommend_spot_instances(
        self,
        workload_type: str,
        current_instances: List[Dict],
        provider: CloudProvider
    ) -> List[Optimization]:
        """
        TODO: Recommend spot/preemptible instances

        For fault-tolerant workloads:
        - Calculate spot savings (up to 90%)
        - Risk assessment (interruption frequency)
        - Fallback strategy
        """
        pass

    def recommend_storage_optimization(
        self,
        storage_analysis: Dict,
        provider: CloudProvider
    ) -> List[Optimization]:
        """
        TODO: Recommend storage optimizations

        - Move infrequently accessed data to cheaper tiers
        - Delete old snapshots
        - Compress or deduplicate data
        - Lifecycle policies
        """
        pass

    def prioritize_recommendations(
        self,
        recommendations: List[Optimization]
    ) -> List[Optimization]:
        """
        TODO: Prioritize recommendations

        Score based on:
        - Potential savings (50%)
        - Implementation effort (30%)
        - Risk level (20%)

        Return sorted by priority
        """
        pass
```

**验收标准：**
- [ ] 识别利用率不足的资源。
- [ ] 推荐合理调整规格的机会。
- [ ] 建议购买预留实例。
- [ ] 推荐使用 Spot 实例。
- [ ] 根据投资回报率及实施工作量排序。

---

### 任务 7：报告与可视化（5–6 小时）

```python
# src/reporter.py

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
from pathlib import Path
from typing import List, Dict
from jinja2 import Template

class CostReporter:
    """Generate cost reports and visualizations"""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def plot_cost_comparison(
        self,
        comparison_df: pd.DataFrame,
        output: str = "cost_comparison.html"
    ) -> None:
        """
        TODO: Plot cross-cloud cost comparison

        ```python
        fig = go.Figure()

        # Add bars for each cloud
        fig.add_trace(go.Bar(
            name='AWS',
            x=comparison_df.index,
            y=comparison_df['aws_price_monthly'],
            marker_color='#FF9900'
        ))

        fig.add_trace(go.Bar(
            name='GCP',
            x=comparison_df.index,
            y=comparison_df['gcp_price_monthly'],
            marker_color='#4285F4'
        ))

        fig.add_trace(go.Bar(
            name='Azure',
            x=comparison_df.index,
            y=comparison_df['azure_price_monthly'],
            marker_color='#00A4EF'
        ))

        fig.update_layout(
            title='Instance Cost Comparison Across Clouds',
            xaxis_title='Instance Configuration',
            yaxis_title='Cost per Month (USD)',
            barmode='group'
        )

        fig.write_html(self.output_dir / output)
        ```
        """
        pass

    def plot_cost_trends(
        self,
        cost_history: pd.DataFrame,
        output: str = "cost_trends.html"
    ) -> None:
        """
        TODO: Plot cost trends over time

        Line chart showing daily/weekly/monthly costs
        """
        pass

    def plot_savings_opportunities(
        self,
        optimizations: List[Optimization],
        output: str = "savings_opportunities.html"
    ) -> None:
        """
        TODO: Plot savings opportunities

        Waterfall chart or bar chart showing potential savings
        """
        pass

    def plot_cost_breakdown(
        self,
        costs_by_service: Dict[str, float],
        output: str = "cost_breakdown.html"
    ) -> None:
        """
        TODO: Plot cost breakdown by service

        Pie chart or treemap
        """
        pass

    def generate_html_report(
        self,
        comparison_results: List,
        optimizations: List[Optimization],
        cost_history: pd.DataFrame
    ) -> None:
        """
        TODO: Generate comprehensive HTML report

        Include:
        - Executive summary
        - Cost comparison tables and charts
        - Optimization recommendations (prioritized)
        - Cost trends
        - Action items
        """
        pass

    def export_csv(
        self,
        comparison_df: pd.DataFrame,
        output: str = "cost_comparison.csv"
    ) -> None:
        """TODO: Export comparison to CSV"""
        pass

    def export_json(
        self,
        data: Dict,
        output: str = "analysis.json"
    ) -> None:
        """TODO: Export analysis to JSON"""
        pass
```

**验收标准：**
- [ ] 使用 Plotly 生成交互式图表。
- [ ] 创建全面的 HTML 报告。
- [ ] 以多种格式导出数据。
- [ ] 可视化达到可发表的质量。

---

## CLI 界面

```bash
# Compare instance pricing
cloudcost compare --vcpus 4 --memory 16 --region us-east

# Compare specific instances
cloudcost compare --aws m5.xlarge --gcp n1-standard-4 --azure Standard_D4s_v3

# Analyze current spending
cloudcost analyze --provider aws --days 30

# Get optimization recommendations
cloudcost optimize --provider aws --min-savings 100

# Generate full report
cloudcost report --config workload.yaml --output report/

# Compare complete workload
cloudcost workload --config workload.yaml
```

---

## 交付物

1. **源代码**
   - 云服务商实现（AWS、GCP、Azure）。
   - 成本比较引擎。
   - 优化建议模块。
   - 报告与可视化模块。
   - CLI 应用。

2. **配置**
   - 工作负载配置示例。
   - 定价缓存设置。

3. **测试**
   - 使用模拟 API 的单元测试。
   - 集成测试（可选，需要凭据）。

4. **文档**
   - 包含配置及用法的 README。
   - API 凭据配置指南。
   - 示例报告。

---

## 评分标准

| 标准 | 权重 |
|---|---|
| **准确性** | 30% |
| **完整性** | 25% |
| **优化质量** | 20% |
| **报告** | 15% |
| **代码质量** | 10% |

**及格：** 70% 以上。
**优秀：** 90% 以上。

---

## 预计时长

- 任务 1：5–6 小时。
- 任务 2：4–5 小时。
- 任务 3：4–5 小时。
- 任务 4：4–5 小时。
- 任务 5：5–6 小时。
- 任务 6：4–5 小时。
- 任务 7：5–6 小时。
- 测试：4–5 小时。
- 文档：2–3 小时。

**合计：** 37–46 小时。

---

**本练习培养 AI/ML 基础设施岗位所需的云成本管理关键技能。**

> 译注：公开目录价格不等同于实际账单，需要考虑区域、币种、计量单位、合同折扣、税费及账单延迟。不同云平台的实例规格不能只按 CPU 和内存等价比较，还需考虑实际吞吐量与性能。免费层和 API 使用费用需自行核实；预留容量或承诺使用可能带来长期合同义务。原始代码块及 TODO 保留，未调用云账单 API。
