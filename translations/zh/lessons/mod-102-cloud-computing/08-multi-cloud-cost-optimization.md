# 第 08 课：多云与成本优化

**时长：** 6 小时
**难度：** 高级
**前置条件：** 第 01–07 课（完整的云计算模块）

## 学习目标

完成本课后，你将能够：

1. 为机器学习基础设施**设计多云策略**。
2. 跨云平台**实施成本监控与追踪**。
3. 通过合理调整资源规格和购买预留实例**优化云支出**。
4. 在训练中有效使用 **Spot/可抢占实例**。
5. 为机器学习团队**实施 FinOps 实践**。
6. 在云服务商之间**迁移工作负载**。
7. 构建**与云平台无关的机器学习流水线**。
8. 准确地**预测云成本与编制预算**。

---

## 目录

1. [多云策略](#多云策略)
2. [成本监控与追踪](#成本监控与追踪)
3. [成本优化技术](#成本优化技术)
4. [Spot 与可抢占实例](#spot-与可抢占实例)
5. [面向机器学习团队的 FinOps](#面向机器学习团队的-finops)
6. [与云平台无关的架构](#与云平台无关的架构)
7. [云平台之间的迁移](#云平台之间的迁移)
8. [预算与预测](#预算与预测)
9. [最佳实践](#最佳实践)
10. [动手练习](#动手练习)

---

## 多云策略

了解组织为何采用多云，以及如何针对机器学习工作负载采用多云。

### 多云模式

```
┌────────────────────────────────────────────────────────────────┐
│                 Multi-Cloud Strategy Patterns                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pattern 1: Active-Passive (Disaster Recovery)                 │
│  ─────────────────────────────────────────                     │
│  AWS (Primary)           Azure (Backup)                        │
│  ├── Training            ├── Cold standby                      │
│  ├── Inference           ├── Data replication                  │
│  └── Data storage        └── DR only                           │
│                                                                │
│  Use case: Risk mitigation, compliance                         │
│  Complexity: Low                                               │
│  Cost: +10-20% overhead                                        │
│                                                                │
│  Pattern 2: Best-of-Breed (Specialized)                        │
│  ──────────────────────────────────────                        │
│  AWS                     GCP                    Azure          │
│  ├── Data lake (S3)      ├── Training (TPU)    ├── Enterprise │
│  ├── General compute     ├── AutoML            ├── OpenAI     │
│  └── Edge (Greengrass)   └── BigQuery ML       └── Compliance │
│                                                                │
│  Use case: Leverage unique strengths                           │
│  Complexity: High                                              │
│  Cost: Optimized per workload                                  │
│                                                                │
│  Pattern 3: Geographic Distribution                            │
│  ──────────────────────────────────                            │
│  AWS (US)                GCP (Europe)          Azure (Asia)    │
│  ├── US customers        ├── EU customers      ├── APAC       │
│  └── Data residency      └── GDPR compliance   └── Latency    │
│                                                                │
│  Use case: Global reach, data sovereignty                      │
│  Complexity: Medium                                            │
│  Cost: Higher (multi-region data transfer)                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 决策矩阵

```
┌──────────────────────────┬────────────────┬─────────────────────┐
│ Scenario                 │ Recommended    │ Reasoning           │
├──────────────────────────┼────────────────┼─────────────────────┤
│ Startup (<50 people)     │ Single cloud   │ Reduce complexity   │
│ Growth (50-200)          │ Single + DR    │ Risk mitigation     │
│ Enterprise (>200)        │ Multi-cloud    │ Avoid vendor lock-in│
│ AI-First Company         │ GCP + AWS      │ TPU + ecosystem     │
│ Microsoft Shop           │ Azure + backup │ Enterprise features │
│ Global Company           │ Multi-cloud    │ Data residency      │
│ Cost-Sensitive           │ Multi-cloud    │ Arbitrage           │
│ High Compliance          │ Multi-cloud    │ Redundancy          │
└──────────────────────────┴────────────────┴─────────────────────┘
```

---

## 成本监控与追踪

有效的成本管理始于费用可见性。

### 成本分摊策略

```python
"""
Tag Strategy for ML Cost Tracking

Mandatory tags:
- Environment: dev, staging, production
- Team: data-science, ml-engineering, research
- Project: project-name
- CostCenter: engineering, research, operations
- Owner: email@company.com

Optional tags:
- Experiment: experiment-id
- Model: model-name
- Stage: training, inference, experimentation
"""

import boto3

def tag_ml_resources(resource_arn, tags):
    """
    Apply consistent tagging to ML resources

    Args:
        resource_arn: ARN of resource
        tags: Dictionary of tags
    """
    required_tags = ['Environment', 'Team', 'Project', 'CostCenter', 'Owner']

    # Validate required tags
    for tag in required_tags:
        if tag not in tags:
            raise ValueError(f"Missing required tag: {tag}")

    # Convert to AWS tag format
    aws_tags = [{'Key': k, 'Value': v} for k, v in tags.items()]

    # Apply tags (example for S3)
    s3_client = boto3.client('s3')
    if 's3' in resource_arn:
        bucket_name = resource_arn.split(':::')[-1]
        s3_client.put_bucket_tagging(
            Bucket=bucket_name,
            Tagging={'TagSet': aws_tags}
        )

# Usage
tag_ml_resources(
    resource_arn='arn:aws:s3:::ml-training-data',
    tags={
        'Environment': 'production',
        'Team': 'ml-engineering',
        'Project': 'image-classification',
        'CostCenter': 'engineering',
        'Owner': 'ml-team@company.com',
        'Stage': 'training'
    }
)
```

### 多云成本仪表盘

```python
import boto3
import google.cloud.billing_v1 as gcpbilling
from azure.mgmt.costmanagement import CostManagementClient
from datetime import datetime, timedelta
import pandas as pd

class MultiCloudCostTracker:
    """
    Track costs across AWS, GCP, and Azure

    Usage:
        tracker = MultiCloudCostTracker()
        costs = tracker.get_monthly_costs()
        print(costs)
    """

    def __init__(self):
        self.aws_client = boto3.client('ce')  # Cost Explorer
        # GCP and Azure clients initialized elsewhere

    def get_aws_costs(self, days=30):
        """Get AWS costs for last N days"""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        response = self.aws_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {'Type': 'TAG', 'Key': 'Project'},
                {'Type': 'TAG', 'Key': 'Team'}
            ],
            Filter={
                'Tags': {
                    'Key': 'Environment',
                    'Values': ['production']
                }
            }
        )

        costs = []
        for result in response['ResultsByTime']:
            date = result['TimePeriod']['Start']
            for group in result['Groups']:
                costs.append({
                    'date': date,
                    'cloud': 'AWS',
                    'project': group['Keys'][0],
                    'team': group['Keys'][1],
                    'cost': float(group['Metrics']['UnblendedCost']['Amount'])
                })

        return pd.DataFrame(costs)

    def get_gcp_costs(self, days=30):
        """Get GCP costs for last N days"""
        # Similar implementation using GCP Billing API
        # Placeholder
        return pd.DataFrame()

    def get_azure_costs(self, days=30):
        """Get Azure costs for last N days"""
        # Similar implementation using Azure Cost Management API
        # Placeholder
        return pd.DataFrame()

    def get_total_costs(self, days=30):
        """Aggregate costs from all clouds"""
        aws_costs = self.get_aws_costs(days)
        gcp_costs = self.get_gcp_costs(days)
        azure_costs = self.get_azure_costs(days)

        all_costs = pd.concat([aws_costs, gcp_costs, azure_costs], ignore_index=True)

        # Group by project
        summary = all_costs.groupby('project')['cost'].sum().sort_values(ascending=False)

        return {
            'total': all_costs['cost'].sum(),
            'by_project': summary.to_dict(),
            'by_cloud': all_costs.groupby('cloud')['cost'].sum().to_dict(),
            'details': all_costs
        }

# Usage
tracker = MultiCloudCostTracker()
costs = tracker.get_total_costs(days=30)

print(f"Total monthly cost: ${costs['total']:.2f}")
print(f"\nBy cloud:")
for cloud, cost in costs['by_cloud'].items():
    print(f"  {cloud}: ${cost:.2f}")

print(f"\nTop 5 projects by cost:")
for project, cost in list(costs['by_project'].items())[:5]:
    print(f"  {project}: ${cost:.2f}")
```

---

## 成本优化技术

用于降低机器学习基础设施成本的成熟策略。

### 1. 合理调整实例规格（Right-Sizing）

```python
import boto3
from datetime import datetime, timedelta

class InstanceRightSizer:
    """
    Analyze CloudWatch metrics to recommend right-sizing

    Identifies over-provisioned instances (CPU < 30%, Memory < 50%)
    """

    def __init__(self):
        self.ec2_client = boto3.client('ec2')
        self.cloudwatch = boto3.client('cloudwatch')

    def analyze_instance(self, instance_id, days=7):
        """
        Analyze instance utilization

        Returns:
            Recommendation dict with suggested instance type
        """
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)

        # Get CPU utilization
        cpu_stats = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,  # 1 hour
            Statistics=['Average', 'Maximum']
        )

        if not cpu_stats['Datapoints']:
            return {'recommendation': 'Insufficient data'}

        avg_cpu = sum(d['Average'] for d in cpu_stats['Datapoints']) / len(cpu_stats['Datapoints'])
        max_cpu = max(d['Maximum'] for d in cpu_stats['Datapoints'])

        # Get instance details
        instance = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        current_type = instance['Reservations'][0]['Instances'][0]['InstanceType']

        # Recommendation logic
        if avg_cpu < 30 and max_cpu < 60:
            recommendation = 'DOWNSIZE'
            suggested_action = 'Consider smaller instance type'
            potential_savings = 0.4  # 40% savings
        elif avg_cpu > 80 or max_cpu > 95:
            recommendation = 'UPSIZE'
            suggested_action = 'Consider larger instance type'
            potential_savings = 0  # No savings, avoid throttling
        else:
            recommendation = 'OPTIMIZED'
            suggested_action = 'Instance is appropriately sized'
            potential_savings = 0

        return {
            'instance_id': instance_id,
            'current_type': current_type,
            'avg_cpu': avg_cpu,
            'max_cpu': max_cpu,
            'recommendation': recommendation,
            'suggested_action': suggested_action,
            'potential_savings_pct': potential_savings * 100
        }

# Usage
rightsizer = InstanceRightSizer()
recommendation = rightsizer.analyze_instance('i-1234567890abcdef0')
print(f"Instance: {recommendation['current_type']}")
print(f"Avg CPU: {recommendation['avg_cpu']:.1f}%")
print(f"Recommendation: {recommendation['recommendation']}")
print(f"Potential savings: {recommendation['potential_savings_pct']:.0f}%")
```

### 2. 预留实例 / Savings Plans

```python
"""
Reserved Instances vs Savings Plans Comparison

Reserved Instances (RI):
- Commitment: 1 or 3 years
- Savings: 40-60%
- Flexibility: Low (specific instance type)
- Best for: Steady-state workloads

Savings Plans:
- Commitment: 1 or 3 years
- Savings: 40-60%
- Flexibility: High (any instance in family)
- Best for: Dynamic workloads

Recommendation Matrix:
┌──────────────────────────┬─────────────────┬────────────────────┐
│ Workload Type            │ Recommended     │ Reasoning          │
├──────────────────────────┼─────────────────┼────────────────────┤
│ Inference (stable)       │ Reserved Inst   │ Predictable        │
│ Training (varied)        │ Savings Plan    │ Flexibility        │
│ Experimentation          │ On-demand/Spot  │ Variable usage     │
│ Batch processing         │ Spot instances  │ Interruptible      │
└──────────────────────────┴─────────────────┴────────────────────┘
"""

def calculate_ri_savings(instance_type, hours_per_month, months=36):
    """
    Calculate savings with Reserved Instances

    Example: p3.2xlarge (1x V100)
    - On-demand: $3.06/hour
    - 1-year RI: $2.08/hour (32% savings)
    - 3-year RI: $1.37/hour (55% savings)
    """
    pricing = {
        'p3.2xlarge': {
            'on_demand': 3.06,
            'ri_1yr': 2.08,
            'ri_3yr': 1.37
        },
        'p3.8xlarge': {
            'on_demand': 12.24,
            'ri_1yr': 8.32,
            'ri_3yr': 5.48
        }
    }

    if instance_type not in pricing:
        return None

    prices = pricing[instance_type]
    total_hours = hours_per_month * months

    on_demand_cost = prices['on_demand'] * total_hours

    if months <= 12:
        ri_cost = prices['ri_1yr'] * total_hours
        savings_pct = (1 - prices['ri_1yr'] / prices['on_demand']) * 100
    else:
        ri_cost = prices['ri_3yr'] * total_hours
        savings_pct = (1 - prices['ri_3yr'] / prices['on_demand']) * 100

    return {
        'instance_type': instance_type,
        'on_demand_cost': on_demand_cost,
        'ri_cost': ri_cost,
        'savings': on_demand_cost - ri_cost,
        'savings_pct': savings_pct,
        'payback_months': 0  # Immediate with no upfront RI
    }

# Example: Inference server running 24/7
result = calculate_ri_savings('p3.2xlarge', hours_per_month=730, months=36)
print(f"Savings over 3 years: ${result['savings']:,.0f} ({result['savings_pct']:.0f}%)")
```

### 3. 自动关闭策略

```python
import boto3
from datetime import datetime, time

class AutoShutdownManager:
    """
    Automatically stop instances during off-hours

    Use case: Development/training instances that don't need 24/7 runtime
    Savings: 50-75% (if only running 8-12 hours/day)
    """

    def __init__(self):
        self.ec2_client = boto3.client('ec2')

    def configure_shutdown_schedule(self, instance_ids, shutdown_time='19:00',
                                     startup_time='08:00', timezone='America/Los_Angeles'):
        """
        Configure auto-shutdown/startup schedule

        Args:
            instance_ids: List of instance IDs
            shutdown_time: Time to shutdown (HH:MM)
            startup_time: Time to start (HH:MM)
            timezone: Timezone for schedule
        """
        # Use AWS Instance Scheduler or Lambda
        # This is a simplified example

        # Tag instances for shutdown
        for instance_id in instance_ids:
            self.ec2_client.create_tags(
                Resources=[instance_id],
                Tags=[
                    {'Key': 'AutoShutdown', 'Value': 'true'},
                    {'Key': 'ShutdownTime', 'Value': shutdown_time},
                    {'Key': 'StartupTime', 'Value': startup_time},
                    {'Key': 'Timezone', 'Value': timezone}
                ]
            )

        print(f"Configured auto-shutdown for {len(instance_ids)} instances")
        print(f"Shutdown: {shutdown_time}, Startup: {startup_time} ({timezone})")

    def estimate_savings(self, instance_type, hourly_rate, hours_saved_per_day):
        """
        Estimate savings from auto-shutdown

        Example: Development instance running 12hr/day instead of 24hr/day
        """
        monthly_hours_saved = hours_saved_per_day * 30
        monthly_savings = hourly_rate * monthly_hours_saved
        annual_savings = monthly_savings * 12

        savings_pct = (hours_saved_per_day / 24) * 100

        return {
            'instance_type': instance_type,
            'hourly_rate': hourly_rate,
            'monthly_savings': monthly_savings,
            'annual_savings': annual_savings,
            'savings_pct': savings_pct
        }

# Example: p3.2xlarge running 12hr/day instead of 24hr/day
manager = AutoShutdownManager()
savings = manager.estimate_savings('p3.2xlarge', 3.06, hours_saved_per_day=12)
print(f"Annual savings: ${savings['annual_savings']:,.0f} ({savings['savings_pct']:.0f}%)")
# Output: Annual savings: $13,391 (50%)
```

---

## Spot 与可抢占实例

利用闲置计算容量，大幅降低训练工作负载的成本。

### Spot 实例策略

```python
"""
Spot Instance Best Practices for ML Training

Savings: 60-90% vs on-demand
Availability: 70-95% (varies by region/instance type)
Interruption: 2-minute warning

Best practices:
1. Checkpointing (save every epoch)
2. Flexible instance types
3. Multiple AZs
4. Spot Fleet with fallback
"""

import boto3

class SpotTrainingCluster:
    """
    Manage spot instances for distributed training

    Features:
    - Automatic checkpointing
    - Fallback to on-demand if spot unavailable
    - Multi-AZ for higher availability
    """

    def __init__(self):
        self.ec2_client = boto3.client('ec2')

    def create_spot_training_cluster(self, target_capacity=4, max_price=0.5):
        """
        Create spot fleet for training

        Args:
            target_capacity: Number of instances
            max_price: Max price per hour ($ per instance)

        Returns:
            Spot fleet request ID
        """
        # Spot fleet configuration
        spot_fleet_config = {
            'IamFleetRole': 'arn:aws:iam::123456789012:role/aws-ec2-spot-fleet-role',
            'AllocationStrategy': 'lowestPrice',
            'TargetCapacity': target_capacity,
            'SpotPrice': str(max_price),
            'LaunchSpecifications': [
                # Multiple instance types for flexibility
                {
                    'ImageId': 'ami-12345678',
                    'InstanceType': 'p3.2xlarge',
                    'KeyName': 'my-key',
                    'SpotPrice': str(max_price),
                    'SubnetId': 'subnet-1,subnet-2,subnet-3',  # Multi-AZ
                    'UserData': self._get_user_data_script(),
                    'TagSpecifications': [
                        {
                            'ResourceType': 'instance',
                            'Tags': [
                                {'Key': 'Name', 'Value': 'spot-training'},
                                {'Key': 'Workload', 'Value': 'training'},
                                {'Key': 'SpotFleet', 'Value': 'true'}
                            ]
                        }
                    ]
                },
                # Fallback to smaller instance if p3 unavailable
                {
                    'ImageId': 'ami-12345678',
                    'InstanceType': 'p2.xlarge',
                    'KeyName': 'my-key',
                    'SpotPrice': str(max_price * 0.7),
                    'SubnetId': 'subnet-1,subnet-2,subnet-3',
                    'UserData': self._get_user_data_script()
                }
            ],
            'Type': 'maintain',  # Maintain target capacity
            'ReplaceUnhealthyInstances': True,
            'TerminateInstancesWithExpiration': True,
            'InstanceInterruptionBehavior': 'terminate'
        }

        # Request spot fleet
        response = self.ec2_client.request_spot_fleet(
            SpotFleetRequestConfig=spot_fleet_config
        )

        fleet_id = response['SpotFleetRequestId']
        print(f"Created spot fleet: {fleet_id}")

        return fleet_id

    def _get_user_data_script(self):
        """
        User data script with checkpointing and spot handling

        Monitors spot interruption warnings and saves checkpoint
        """
        script = """#!/bin/bash
# Setup training environment
cd /home/ubuntu/training

# Monitor spot interruption
(
  while true; do
    HTTP_CODE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s -w %{http_code} -o /dev/null http://169.254.169.254/latest/meta-data/spot/instance-action)
    if [[ "$HTTP_CODE" -eq 200 ]]; then
      echo "Spot interruption detected, saving checkpoint..."
      touch /tmp/SPOT_INTERRUPTION
      # Training script will detect this and save checkpoint
      break
    fi
    sleep 5
  done
) &

# Start training with checkpointing
python train.py \\
  --checkpoint-dir s3://my-bucket/checkpoints \\
  --checkpoint-frequency 100 \\
  --resume-from-checkpoint latest
"""
        import base64
        return base64.b64encode(script.encode()).decode()

# Usage
cluster = SpotTrainingCluster()
fleet_id = cluster.create_spot_training_cluster(target_capacity=4, max_price=0.5)
```

### 检查点管理

```python
import torch
import os
from pathlib import Path

class CheckpointManager:
    """
    Robust checkpointing for spot instance training

    Features:
    - Automatic save on spot interruption
    - Resume from latest checkpoint
    - Save to S3 for durability
    """

    def __init__(self, checkpoint_dir, save_frequency=100):
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.save_frequency = save_frequency

    def save_checkpoint(self, epoch, model, optimizer, loss, filename='checkpoint.pth'):
        """Save training checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': loss,
        }

        local_path = self.checkpoint_dir / filename
        torch.save(checkpoint, local_path)

        # Upload to S3
        self._upload_to_s3(local_path, f's3://my-bucket/checkpoints/{filename}')

        print(f"Checkpoint saved: epoch {epoch}, loss {loss:.4f}")

    def load_checkpoint(self, model, optimizer, filename='checkpoint.pth'):
        """Load latest checkpoint"""
        # Download from S3
        local_path = self.checkpoint_dir / filename
        self._download_from_s3(f's3://my-bucket/checkpoints/{filename}', local_path)

        if not local_path.exists():
            print("No checkpoint found, starting from scratch")
            return 0

        checkpoint = torch.load(local_path)
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        epoch = checkpoint['epoch']

        print(f"Resumed from checkpoint: epoch {epoch}")
        return epoch

    def _upload_to_s3(self, local_path, s3_uri):
        """Upload file to S3"""
        import boto3
        s3_client = boto3.client('s3')
        bucket, key = s3_uri.replace('s3://', '').split('/', 1)
        s3_client.upload_file(str(local_path), bucket, key)

    def _download_from_s3(self, s3_uri, local_path):
        """Download file from S3"""
        import boto3
        s3_client = boto3.client('s3')
        bucket, key = s3_uri.replace('s3://', '').split('/', 1)
        try:
            s3_client.download_file(bucket, key, str(local_path))
        except:
            pass  # File doesn't exist yet

# Training loop with checkpointing
def train_with_spot(model, train_loader, epochs=100):
    checkpoint_mgr = CheckpointManager('/data/checkpoints', save_frequency=100)

    # Resume from checkpoint
    start_epoch = checkpoint_mgr.load_checkpoint(model, optimizer)

    for epoch in range(start_epoch, epochs):
        model.train()

        for batch_idx, (data, target) in enumerate(train_loader):
            # Training step
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            # Check for spot interruption
            if os.path.exists('/tmp/SPOT_INTERRUPTION'):
                print("Spot interruption detected, saving final checkpoint...")
                checkpoint_mgr.save_checkpoint(epoch, model, optimizer, loss.item())
                return

            # Periodic checkpoint
            if batch_idx % checkpoint_mgr.save_frequency == 0:
                checkpoint_mgr.save_checkpoint(epoch, model, optimizer, loss.item())

        print(f"Epoch {epoch} completed")
```

---

## 面向机器学习团队的 FinOps

针对机器学习基础设施实施云财务运营（Financial Operations，FinOps）实践。

### 成本分摊与费用展示（Showback）

```python
"""
FinOps Maturity Model for ML Teams

Level 1: Crawl (Basic Visibility)
- Cost tracking by team/project
- Monthly reports
- Basic tagging

Level 2: Walk (Active Management)
- Real-time dashboards
- Budget alerts
- Showback to teams
- Basic optimization (right-sizing)

Level 3: Run (Optimization)
- Automated cost optimization
- Chargeback to teams
- Forecasting
- Reserved instance management
- Continuous optimization
"""

class MLFinOpsManager:
    """
    FinOps management for ML teams

    Features:
    - Cost allocation by team/project
    - Budget tracking and alerts
    - Showback reports
    - Optimization recommendations
    """

    def __init__(self):
        self.cost_tracker = MultiCloudCostTracker()

    def generate_team_report(self, team_name, month):
        """
        Generate monthly cost report for team

        Returns:
            Cost breakdown and recommendations
        """
        costs = self.cost_tracker.get_total_costs(days=30)
        team_costs = costs['details'][costs['details']['team'] == team_name]

        total_cost = team_costs['cost'].sum()

        # Breakdown by workload type
        training_cost = team_costs[team_costs['workload'] == 'training']['cost'].sum()
        inference_cost = team_costs[team_costs['workload'] == 'inference']['cost'].sum()
        storage_cost = team_costs[team_costs['workload'] == 'storage']['cost'].sum()

        report = {
            'team': team_name,
            'month': month,
            'total_cost': total_cost,
            'breakdown': {
                'training': training_cost,
                'inference': inference_cost,
                'storage': storage_cost
            },
            'per_project': team_costs.groupby('project')['cost'].sum().to_dict(),
            'recommendations': self._generate_recommendations(team_costs)
        }

        return report

    def _generate_recommendations(self, costs_df):
        """Generate cost optimization recommendations"""
        recommendations = []

        # Check for underutilized resources
        if costs_df['utilization'].mean() < 0.5:
            recommendations.append({
                'type': 'RIGHT_SIZE',
                'priority': 'HIGH',
                'message': 'Average utilization <50%, consider downsizing instances',
                'potential_savings': costs_df['cost'].sum() * 0.3
            })

        # Check for non-spot training
        training_costs = costs_df[costs_df['workload'] == 'training']
        if not training_costs.empty and (training_costs['spot'] == False).sum() > 0:
            recommendations.append({
                'type': 'USE_SPOT',
                'priority': 'MEDIUM',
                'message': 'Use spot instances for training workloads',
                'potential_savings': training_costs['cost'].sum() * 0.7
            })

        return recommendations

    def set_budget_alert(self, team_name, monthly_budget, threshold_pct=80):
        """
        Set budget alert for team

        Triggers alert when spending exceeds threshold
        """
        # Use CloudWatch or similar for monitoring
        print(f"Budget alert set for {team_name}: ${monthly_budget} ({threshold_pct}%)")

# Usage
finops = MLFinOpsManager()
report = finops.generate_team_report('ml-engineering', '2024-01')

print(f"Team: {report['team']}")
print(f"Total cost: ${report['total_cost']:,.2f}")
print(f"\nBreakdown:")
for workload, cost in report['breakdown'].items():
    print(f"  {workload}: ${cost:,.2f}")

print(f"\nRecommendations:")
for rec in report['recommendations']:
    print(f"  [{rec['priority']}] {rec['message']}")
    print(f"    Potential savings: ${rec['potential_savings']:,.2f}")
```

---

## 与云平台无关的架构

跨云构建可移植的机器学习基础设施。

### 抽象层模式

```python
"""
Cloud-Agnostic ML Infrastructure

Goals:
- Portability across AWS, GCP, Azure
- Minimize vendor lock-in
- Consistent APIs

Approach:
- Abstraction layers for compute, storage, ML services
- Infrastructure as Code (Terraform)
- Containerization (Docker/Kubernetes)
- Standard ML frameworks (PyTorch, TensorFlow)
"""

from abc import ABC, abstractmethod

class CloudStorageProvider(ABC):
    """Abstract interface for cloud storage"""

    @abstractmethod
    def upload_file(self, local_path, remote_path):
        pass

    @abstractmethod
    def download_file(self, remote_path, local_path):
        pass

    @abstractmethod
    def list_files(self, prefix):
        pass

class AWSStorage(CloudStorageProvider):
    """AWS S3 implementation"""

    def __init__(self):
        import boto3
        self.s3_client = boto3.client('s3')

    def upload_file(self, local_path, remote_path):
        bucket, key = self._parse_path(remote_path)
        self.s3_client.upload_file(local_path, bucket, key)

    def download_file(self, remote_path, local_path):
        bucket, key = self._parse_path(remote_path)
        self.s3_client.download_file(bucket, key, local_path)

    def list_files(self, prefix):
        bucket, key = self._parse_path(prefix)
        response = self.s3_client.list_objects_v2(Bucket=bucket, Prefix=key)
        return [obj['Key'] for obj in response.get('Contents', [])]

    def _parse_path(self, path):
        """Parse s3://bucket/key format"""
        path = path.replace('s3://', '')
        parts = path.split('/', 1)
        return parts[0], parts[1] if len(parts) > 1 else ''

class GCPStorage(CloudStorageProvider):
    """GCP Cloud Storage implementation"""

    def __init__(self):
        from google.cloud import storage
        self.client = storage.Client()

    def upload_file(self, local_path, remote_path):
        bucket_name, blob_name = self._parse_path(remote_path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(local_path)

    def download_file(self, remote_path, local_path):
        bucket_name, blob_name = self._parse_path(remote_path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.download_to_filename(local_path)

    def list_files(self, prefix):
        bucket_name, prefix_path = self._parse_path(prefix)
        bucket = self.client.bucket(bucket_name)
        blobs = bucket.list_blobs(prefix=prefix_path)
        return [blob.name for blob in blobs]

    def _parse_path(self, path):
        """Parse gs://bucket/key format"""
        path = path.replace('gs://', '')
        parts = path.split('/', 1)
        return parts[0], parts[1] if len(parts) > 1 else ''

class AzureStorage(CloudStorageProvider):
    """Azure Blob Storage implementation"""

    def __init__(self):
        from azure.storage.blob import BlobServiceClient
        self.client = BlobServiceClient.from_connection_string(
            os.getenv('AZURE_STORAGE_CONNECTION_STRING')
        )

    def upload_file(self, local_path, remote_path):
        container, blob_name = self._parse_path(remote_path)
        blob_client = self.client.get_blob_client(container, blob_name)
        with open(local_path, 'rb') as data:
            blob_client.upload_blob(data, overwrite=True)

    def download_file(self, remote_path, local_path):
        container, blob_name = self._parse_path(remote_path)
        blob_client = self.client.get_blob_client(container, blob_name)
        with open(local_path, 'wb') as f:
            blob_client.download_blob().readinto(f)

    def list_files(self, prefix):
        container, prefix_path = self._parse_path(prefix)
        container_client = self.client.get_container_client(container)
        blobs = container_client.list_blobs(name_starts_with=prefix_path)
        return [blob.name for blob in blobs]

    def _parse_path(self, path):
        """Parse azure://container/blob format"""
        path = path.replace('azure://', '').replace('https://', '')
        parts = path.split('/', 1)
        return parts[0], parts[1] if len(parts) > 1 else ''

# Factory pattern for cloud-agnostic code
class StorageFactory:
    """Create storage provider based on URI scheme"""

    @staticmethod
    def create(uri):
        if uri.startswith('s3://'):
            return AWSStorage()
        elif uri.startswith('gs://'):
            return GCPStorage()
        elif uri.startswith('azure://'):
            return AzureStorage()
        else:
            raise ValueError(f"Unsupported storage URI: {uri}")

# Usage: Cloud-agnostic code
def upload_model(local_path, remote_path):
    """Upload model to any cloud provider"""
    storage = StorageFactory.create(remote_path)
    storage.upload_file(local_path, remote_path)
    print(f"Uploaded {local_path} to {remote_path}")

# Works with any cloud
upload_model('./model.pth', 's3://my-bucket/models/model.pth')      # AWS
upload_model('./model.pth', 'gs://my-bucket/models/model.pth')      # GCP
upload_model('./model.pth', 'azure://container/models/model.pth')   # Azure
```

---

## 云平台之间的迁移

在不同云服务商之间迁移机器学习工作负载的策略。

### 迁移检查清单

```markdown
## Cloud Migration Checklist

### Phase 1: Assessment (1-2 weeks)
- [ ] Inventory current resources
- [ ] Document dependencies
- [ ] Identify data volumes
- [ ] Estimate migration costs
- [ ] Define success criteria

### Phase 2: Planning (2-4 weeks)
- [ ] Choose migration strategy (lift-shift, refactor, rebuild)
- [ ] Design target architecture
- [ ] Plan data migration approach
- [ ] Identify risks and mitigation
- [ ] Create rollback plan

### Phase 3: Data Migration (Varies)
- [ ] Set up data transfer (AWS DataSync, Transfer Appliance)
- [ ] Migrate datasets incrementally
- [ ] Validate data integrity
- [ ] Replicate data for cutover

### Phase 4: Application Migration (2-6 weeks)
- [ ] Containerize applications
- [ ] Update cloud-specific code
- [ ] Migrate models to new registry
- [ ] Update endpoints
- [ ] Test thoroughly

### Phase 5: Cutover (1 week)
- [ ] Final data sync
- [ ] DNS/traffic cutover
- [ ] Monitor closely
- [ ] Validate functionality
- [ ] Decommission old infrastructure

Estimated timeline: 2-3 months for medium-sized ML platform
```

---

## 预算与预测

> 译注：原文目录包含本节，但正文未提供独立内容。

## 最佳实践

> 译注：原文目录包含本节，但正文未提供独立内容。相关实践分布于此前章节。

## 动手练习

> 译注：原文未提供独立动手练习。可结合本模块练习 08（FinOps 自动化）进行实践。

---

## 总结

本课学习了：

- 设计多云策略（主备模式、最佳组合模式、地理分布模式）。
- 跨云实施成本监控（标签、仪表盘）。
- 优化成本（原文示例：合理调整规格节省 40%、预留实例节省 55%、自动关闭节省 50%）。
- 使用 Spot 实例（原文示例：结合检查点节省 60–90%）。
- 应用 FinOps 实践（费用展示、预算、优化建议）。
- 构建与云平台无关的架构（抽象层）。
- 在云平台之间迁移工作负载。
- 准确地进行费用预测及预算编制。

**核心要点（原文估算）：**
- **合理调整资源规格：** 节省 30–40% 的计算成本。
- **预留实例：** 针对稳定工作负载节省 40–60%。
- **Spot 实例：** 配合检查点机制，训练成本节省 60–90%。
- **自动关闭：** 开发实例成本节省 50–75%。
- **综合**优化可能使成本降低 **70–80%**。

**成本优化投资回报率（ROI）：**

```
Before optimization: $10,000/month
After optimization:
- Right-sizing: -$3,000 (30%)
- Reserved Instances: -$2,000 (20%)
- Spot instances: -$1,500 (15%)
- Auto-shutdown: -$500 (5%)
Total savings: $7,000/month → $3,000/month (70% reduction!)
```

**后续步骤：**
- 完成动手练习。
- 为自己的项目实现成本追踪。
- 应用优化技术。
- **恭喜！模块 02 完成！**

---

**预计完成时间：** 6 小时（含动手练习）。
**难度：** 高级。
**模块完成：** 原文称可以进入 Module 03：深入 Kubernetes。

---

## 模块 02 已完成！

你已掌握：

- 云架构模式。
- AWS、GCP 与 Azure 机器学习基础设施。
- 云存储策略。
- 云网络。
- 托管机器学习服务。
- 多云及成本优化。

**模块总时长（原文统计）：** 50 小时。
**已完成项目：** 1 个（基础模型服务）。
**测验：** 1 份（30 道题）。
**练习：** 3 个（环境、Docker、Kubernetes）。

> 译注：原文结尾的模块顺序和练习数量与本仓库当前课程结构存在差异。按照本仓库目录，下一模块为 [Module 103：容器化](../mod-103-containerization/)，随后是 Module 104：Kubernetes。各项节省比例是原文示例，不能直接相加；实际收益取决于使用率、计费方式、中断重试成本、承诺用量和网络费用。多云并不天然降低成本，也可能增加运维、数据迁移与合规复杂度。原始代码块保持不变，未执行其中的云资源操作。
