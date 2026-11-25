# 第 06 课：面向机器学习的云网络

**时长：** 6 小时
**难度：** 中级
**前置条件：** 第 01–05 课（云服务商与存储）

## 学习目标

完成本课后，你将能够：

1. 为机器学习基础设施**设计 VPC 网络**。
2. 为大规模模型服务**配置负载均衡器**。
3. **实现 CDN**，支持全球模型服务交付。
4. 使用防火墙与安全组**保护机器学习系统**。
5. **设置 VPN 与混合连接**，实现本地基础设施集成。
6. 针对训练及推理**优化网络性能**。
7. 为微服务架构**实现服务网格**。
8. **监控与排查**网络问题。

---

## 目录

1. [面向机器学习的网络基础](#面向机器学习的网络基础)
2. [虚拟私有云（VPC）](#虚拟私有云-vpc)
3. [负载均衡](#负载均衡)
4. [内容分发网络（CDN）](#内容分发网络-cdn)
5. [网络安全](#网络安全)
6. [混合云与多云网络](#混合云与多云网络)
7. [服务网格](#服务网格)
8. [网络性能优化](#网络性能优化)
9. [监控与故障排查](#监控与故障排查)
10. [动手练习](#动手练习)

---

## 面向机器学习的网络基础

与传统应用相比，机器学习工作负载具有独特的网络要求。

### 机器学习网络流量模式

```
┌────────────────────────────────────────────────────────────────┐
│                    ML Network Architecture                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Training Phase                                                │
│  ──────────────                                                │
│  Data Storage (S3)  ──→  Training Cluster  ──→  Model Storage │
│     1-10 GB/s             (GPU instances)         100 MB/s    │
│     High bandwidth        Low latency             Medium       │
│                                                                │
│  Inference Phase                                               │
│  ───────────────                                               │
│  User Request  ──→  Load Balancer  ──→  Model Server ──→ DB  │
│     1-10 KB          100K+ requests     <50ms latency   <10ms │
│     Low bandwidth    High availability   Low latency   Cache  │
│                                                                │
│  Distributed Training                                          │
│  ────────────────────                                          │
│  Node 1  ←─────→  Node 2  ←─────→  Node 3  ←─────→  Node 4  │
│    ↓                ↓                ↓                ↓       │
│  All-reduce communication (parameter synchronization)         │
│  Requirement: Low latency (<10ms), High bandwidth (25+ Gbps)  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 不同工作负载的网络要求

```
┌──────────────────────┬──────────────┬──────────────┬─────────────┐
│ Workload             │ Bandwidth    │ Latency      │ Reliability │
├──────────────────────┼──────────────┼──────────────┼─────────────┤
│ Data Loading         │ Very High    │ Medium       │ Medium      │
│ (Training)           │ 1-10 GB/s    │ 100-500ms    │ 99%         │
│                      │              │              │             │
│ Model Inference      │ Low          │ Very Low     │ Very High   │
│ (Real-time)          │ 1-10 KB      │ <50ms        │ 99.99%      │
│                      │              │              │             │
│ Batch Inference      │ High         │ Medium       │ High        │
│                      │ 100 MB-1GB/s │ <1s          │ 99.9%       │
│                      │              │              │             │
│ Distributed Training │ Very High    │ Very Low     │ High        │
│ (Multi-GPU)          │ 10-100 GB/s  │ <10ms        │ 99.9%       │
│                      │              │              │             │
│ Model Upload/Download│ Medium       │ Low          │ Medium      │
│                      │ 10-100 MB/s  │ <5s          │ 99%         │
└──────────────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 虚拟私有云（VPC）

VPC 为机器学习基础设施提供隔离的网络环境。

### 面向机器学习的 VPC 设计模式

#### 模式 1：简单 VPC（开发环境）

```
┌─────────────────────────────────────────────────────────┐
│              VPC: 10.0.0.0/16                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Public Subnet: 10.0.1.0/24                             │
│  ├── Bastion Host (SSH gateway)                         │
│  ├── NAT Gateway                                        │
│  └── Load Balancer                                      │
│                                                         │
│  Private Subnet: 10.0.2.0/24                            │
│  ├── ML Training VMs (GPU instances)                    │
│  ├── Jupyter Notebooks                                  │
│  └── Development servers                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 模式 2：多层 VPC（生产环境）

```
┌──────────────────────────────────────────────────────────────┐
│              VPC: 10.0.0.0/16 (Multi-AZ)                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Availability Zone 1           Availability Zone 2          │
│  ────────────────────           ────────────────────        │
│                                                              │
│  Public Subnet A: 10.0.1.0/24   Public Subnet B: 10.0.2.0/24│
│  ├── Load Balancer              ├── Load Balancer           │
│  └── NAT Gateway                └── NAT Gateway             │
│                                                              │
│  App Subnet A: 10.0.11.0/24     App Subnet B: 10.0.12.0/24 │
│  ├── Model Servers (AKS)        ├── Model Servers (AKS)    │
│  └── API Gateway                └── API Gateway            │
│                                                              │
│  Data Subnet A: 10.0.21.0/24    Data Subnet B: 10.0.22.0/24│
│  ├── Redis Cache                ├── Redis Cache            │
│  ├── Database                   ├── Database (replica)     │
│  └── Feature Store              └── Feature Store          │
│                                                              │
│  Training Subnet: 10.0.31.0/24  (Single AZ - cost savings) │
│  ├── GPU Training Instances                                 │
│  ├── Distributed Training Cluster                           │
│  └── Data Processing Pipeline                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 创建面向机器学习的 VPC（AWS）

```python
import boto3

ec2_client = boto3.client('ec2')

def create_ml_vpc():
    """
    Create VPC for ML infrastructure

    Returns:
        VPC ID and subnet IDs
    """
    # Create VPC
    vpc_response = ec2_client.create_vpc(
        CidrBlock='10.0.0.0/16',
        TagSpecifications=[
            {
                'ResourceType': 'vpc',
                'Tags': [
                    {'Key': 'Name', 'Value': 'ml-vpc'},
                    {'Key': 'Environment', 'Value': 'production'}
                ]
            }
        ]
    )
    vpc_id = vpc_response['Vpc']['VpcId']
    print(f"Created VPC: {vpc_id}")

    # Enable DNS hostnames
    ec2_client.modify_vpc_attribute(
        VpcId=vpc_id,
        EnableDnsHostnames={'Value': True}
    )

    # Create Internet Gateway
    igw_response = ec2_client.create_internet_gateway(
        TagSpecifications=[
            {
                'ResourceType': 'internet-gateway',
                'Tags': [{'Key': 'Name', 'Value': 'ml-igw'}]
            }
        ]
    )
    igw_id = igw_response['InternetGateway']['InternetGatewayId']

    # Attach IGW to VPC
    ec2_client.attach_internet_gateway(
        InternetGatewayId=igw_id,
        VpcId=vpc_id
    )

    # Create Public Subnet (for load balancers, NAT)
    public_subnet_response = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.1.0/24',
        AvailabilityZone='us-east-1a',
        TagSpecifications=[
            {
                'ResourceType': 'subnet',
                'Tags': [
                    {'Key': 'Name', 'Value': 'ml-public-subnet'},
                    {'Key': 'Type', 'Value': 'public'}
                ]
            }
        ]
    )
    public_subnet_id = public_subnet_response['Subnet']['SubnetId']

    # Create Private Subnet (for training instances)
    private_subnet_response = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.2.0/24',
        AvailabilityZone='us-east-1a',
        TagSpecifications=[
            {
                'ResourceType': 'subnet',
                'Tags': [
                    {'Key': 'Name', 'Value': 'ml-training-subnet'},
                    {'Key': 'Type', 'Value': 'private'}
                ]
            }
        ]
    )
    private_subnet_id = private_subnet_response['Subnet']['SubnetId']

    # Create App Subnet (for model servers)
    app_subnet_response = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.0.11.0/24',
        AvailabilityZone='us-east-1a',
        TagSpecifications=[
            {
                'ResourceType': 'subnet',
                'Tags': [
                    {'Key': 'Name', 'Value': 'ml-app-subnet'},
                    {'Key': 'Type', 'Value': 'private'}
                ]
            }
        ]
    )
    app_subnet_id = app_subnet_response['Subnet']['SubnetId']

    # Create NAT Gateway for private subnets
    # First, allocate Elastic IP
    eip_response = ec2_client.allocate_address(Domain='vpc')
    eip_allocation_id = eip_response['AllocationId']

    nat_response = ec2_client.create_nat_gateway(
        SubnetId=public_subnet_id,
        AllocationId=eip_allocation_id,
        TagSpecifications=[
            {
                'ResourceType': 'natgateway',
                'Tags': [{'Key': 'Name', 'Value': 'ml-nat-gateway'}]
            }
        ]
    )
    nat_gateway_id = nat_response['NatGateway']['NatGatewayId']

    # Wait for NAT Gateway to be available
    waiter = ec2_client.get_waiter('nat_gateway_available')
    waiter.wait(NatGatewayIds=[nat_gateway_id])

    # Create Route Tables
    # Public route table
    public_rt_response = ec2_client.create_route_table(
        VpcId=vpc_id,
        TagSpecifications=[
            {
                'ResourceType': 'route-table',
                'Tags': [{'Key': 'Name', 'Value': 'ml-public-rt'}]
            }
        ]
    )
    public_rt_id = public_rt_response['RouteTable']['RouteTableId']

    # Add route to IGW
    ec2_client.create_route(
        RouteTableId=public_rt_id,
        DestinationCidrBlock='0.0.0.0/0',
        GatewayId=igw_id
    )

    # Associate public subnet with public route table
    ec2_client.associate_route_table(
        SubnetId=public_subnet_id,
        RouteTableId=public_rt_id
    )

    # Private route table
    private_rt_response = ec2_client.create_route_table(
        VpcId=vpc_id,
        TagSpecifications=[
            {
                'ResourceType': 'route-table',
                'Tags': [{'Key': 'Name', 'Value': 'ml-private-rt'}]
            }
        ]
    )
    private_rt_id = private_rt_response['RouteTable']['RouteTableId']

    # Add route to NAT Gateway
    ec2_client.create_route(
        RouteTableId=private_rt_id,
        DestinationCidrBlock='0.0.0.0/0',
        NatGatewayId=nat_gateway_id
    )

    # Associate private subnets with private route table
    ec2_client.associate_route_table(
        SubnetId=private_subnet_id,
        RouteTableId=private_rt_id
    )
    ec2_client.associate_route_table(
        SubnetId=app_subnet_id,
        RouteTableId=private_rt_id
    )

    print(f"VPC setup complete!")
    return {
        'vpc_id': vpc_id,
        'public_subnet_id': public_subnet_id,
        'private_subnet_id': private_subnet_id,
        'app_subnet_id': app_subnet_id,
        'nat_gateway_id': nat_gateway_id
    }

# Create ML VPC
vpc_config = create_ml_vpc()
print(vpc_config)
```

### 用于多区域训练的 VPC 对等连接

```python
def create_vpc_peering(vpc_id_1, vpc_id_2, region_1='us-east-1', region_2='us-west-2'):
    """
    Create VPC peering connection between regions

    Use case: Distributed training across regions
    """
    ec2_client_1 = boto3.client('ec2', region_name=region_1)
    ec2_client_2 = boto3.client('ec2', region_name=region_2)

    # Create peering connection
    response = ec2_client_1.create_vpc_peering_connection(
        VpcId=vpc_id_1,
        PeerVpcId=vpc_id_2,
        PeerRegion=region_2,
        TagSpecifications=[
            {
                'ResourceType': 'vpc-peering-connection',
                'Tags': [{'Key': 'Name', 'Value': 'ml-multi-region-peering'}]
            }
        ]
    )

    peering_id = response['VpcPeeringConnection']['VpcPeeringConnectionId']
    print(f"Created VPC peering: {peering_id}")

    # Accept peering connection in peer region
    ec2_client_2.accept_vpc_peering_connection(
        VpcPeeringConnectionId=peering_id
    )

    print(f"VPC peering accepted")
    return peering_id
```

---

## 负载均衡

负载均衡器将流量分配至多台模型服务器，以实现可扩展性与可靠性。

### 负载均衡器类型

```
┌──────────────────────┬───────────────────┬─────────────────────┐
│ Type                 │ Use Case          │ Performance         │
├──────────────────────┼───────────────────┼─────────────────────┤
│ Application LB (L7)  │ HTTP/HTTPS APIs   │ 100K requests/sec   │
│ - Path-based routing │ Model serving     │ <100ms latency      │
│ - WebSocket support  │ A/B testing       │                     │
│                      │                   │                     │
│ Network LB (L4)      │ TCP/UDP traffic   │ Millions req/sec    │
│ - Ultra-low latency  │ gRPC inference    │ <10ms latency       │
│ - Static IP          │ Batch processing  │                     │
│                      │                   │                     │
│ Gateway LB           │ Security/Firewall │ High throughput     │
│ - Inline inspection  │ Traffic analysis  │                     │
└──────────────────────┴───────────────────┴─────────────────────┘
```

### 用于机器学习 API 的 Application Load Balancer

```python
import boto3

elbv2_client = boto3.client('elbv2')
ec2_client = boto3.client('ec2')

def create_ml_load_balancer(vpc_id, public_subnet_ids):
    """
    Create Application Load Balancer for ML model serving

    Args:
        vpc_id: VPC ID
        public_subnet_ids: List of public subnet IDs

    Returns:
        Load balancer ARN
    """
    # Create security group for load balancer
    sg_response = ec2_client.create_security_group(
        GroupName='ml-alb-sg',
        Description='Security group for ML ALB',
        VpcId=vpc_id
    )
    sg_id = sg_response['GroupId']

    # Allow HTTP/HTTPS from internet
    ec2_client.authorize_security_group_ingress(
        GroupId=sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            },
            {
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }
        ]
    )

    # Create load balancer
    lb_response = elbv2_client.create_load_balancer(
        Name='ml-model-alb',
        Subnets=public_subnet_ids,
        SecurityGroups=[sg_id],
        Scheme='internet-facing',
        Type='application',
        IpAddressType='ipv4',
        Tags=[
            {'Key': 'Name', 'Value': 'ml-model-alb'},
            {'Key': 'Environment', 'Value': 'production'}
        ]
    )

    lb_arn = lb_response['LoadBalancers'][0]['LoadBalancerArn']
    lb_dns = lb_response['LoadBalancers'][0]['DNSName']
    print(f"Created ALB: {lb_dns}")

    # Create target group
    tg_response = elbv2_client.create_target_group(
        Name='ml-model-tg',
        Protocol='HTTP',
        Port=8000,
        VpcId=vpc_id,
        HealthCheckEnabled=True,
        HealthCheckProtocol='HTTP',
        HealthCheckPath='/health',
        HealthCheckIntervalSeconds=30,
        HealthCheckTimeoutSeconds=5,
        HealthyThresholdCount=2,
        UnhealthyThresholdCount=3,
        Matcher={'HttpCode': '200'},
        TargetType='instance'
    )

    tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
    print(f"Created target group: {tg_arn}")

    # Create listener
    listener_response = elbv2_client.create_listener(
        LoadBalancerArn=lb_arn,
        Protocol='HTTP',
        Port=80,
        DefaultActions=[
            {
                'Type': 'forward',
                'TargetGroupArn': tg_arn
            }
        ]
    )

    listener_arn = listener_response['Listeners'][0]['ListenerArn']
    print(f"Created listener: {listener_arn}")

    return {
        'lb_arn': lb_arn,
        'lb_dns': lb_dns,
        'tg_arn': tg_arn,
        'listener_arn': listener_arn
    }

# Usage
lb_config = create_ml_load_balancer(
    vpc_id='vpc-12345678',
    public_subnet_ids=['subnet-1234', 'subnet-5678']
)
```

### 用于 A/B 测试的高级路由

```python
def configure_ab_testing(listener_arn, model_v1_tg_arn, model_v2_tg_arn):
    """
    Configure A/B testing with weighted target groups

    90% traffic to v1 (stable)
    10% traffic to v2 (canary)
    """
    elbv2_client = boto3.client('elbv2')

    # Modify listener to use weighted routing
    elbv2_client.modify_listener(
        ListenerArn=listener_arn,
        DefaultActions=[
            {
                'Type': 'forward',
                'ForwardConfig': {
                    'TargetGroups': [
                        {
                            'TargetGroupArn': model_v1_tg_arn,
                            'Weight': 90
                        },
                        {
                            'TargetGroupArn': model_v2_tg_arn,
                            'Weight': 10
                        }
                    ],
                    'TargetGroupStickinessConfig': {
                        'Enabled': True,
                        'DurationSeconds': 3600  # Sticky for 1 hour
                    }
                }
            }
        ]
    )

    print("Configured A/B testing: 90% v1, 10% v2")

# Gradually shift traffic
def shift_traffic(listener_arn, model_v1_tg_arn, model_v2_tg_arn, v2_percentage):
    """
    Gradually shift traffic to new model version
    """
    elbv2_client = boto3.client('elbv2')

    v1_percentage = 100 - v2_percentage

    elbv2_client.modify_listener(
        ListenerArn=listener_arn,
        DefaultActions=[
            {
                'Type': 'forward',
                'ForwardConfig': {
                    'TargetGroups': [
                        {
                            'TargetGroupArn': model_v1_tg_arn,
                            'Weight': v1_percentage
                        },
                        {
                            'TargetGroupArn': model_v2_tg_arn,
                            'Weight': v2_percentage
                        }
                    ]
                }
            }
        ]
    )

    print(f"Traffic split: {v1_percentage}% v1, {v2_percentage}% v2")

# Canary deployment example
# Day 1: 10% traffic to v2
shift_traffic(listener_arn, tg_v1, tg_v2, v2_percentage=10)

# Day 2: If metrics look good, 50%
shift_traffic(listener_arn, tg_v1, tg_v2, v2_percentage=50)

# Day 3: Full rollout
shift_traffic(listener_arn, tg_v1, tg_v2, v2_percentage=100)
```

---

## 内容分发网络（CDN）

CDN 可以在全球范围内缓存符合缓存条件的模型响应及静态资源，实现低延迟交付。

### 面向机器学习的 CDN 架构

```
┌────────────────────────────────────────────────────────────┐
│                    CDN for ML Serving                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  User (US)         User (Europe)       User (Asia)        │
│     ↓                  ↓                   ↓              │
│  Edge Location     Edge Location     Edge Location        │
│  (California)      (Frankfurt)       (Singapore)          │
│     ↓                  ↓                   ↓              │
│     └──────────────────┴───────────────────┘              │
│                        ↓                                   │
│                  Origin Server                             │
│              (Load Balancer + Model Servers)               │
│                                                            │
│  Benefits:                                                 │
│  - Latency: 200ms → 50ms (75% reduction)                  │
│  - Origin load: Reduced by 80% (caching)                  │
│  - Availability: 99.99% (distributed)                     │
│  - Cost: Reduced bandwidth costs                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 机器学习 API 的 CloudFront 配置

```python
import boto3

cloudfront_client = boto3.client('cloudfront')

def create_ml_cdn(origin_domain, origin_path='/predict'):
    """
    Create CloudFront distribution for ML model serving

    Args:
        origin_domain: Load balancer DNS name
        origin_path: API endpoint path

    Returns:
        CloudFront domain name
    """
    import uuid

    # Create distribution configuration
    config = {
        'CallerReference': str(uuid.uuid4()),
        'Comment': 'CDN for ML model serving',
        'Enabled': True,
        'Origins': {
            'Quantity': 1,
            'Items': [
                {
                    'Id': 'ml-origin',
                    'DomainName': origin_domain,
                    'CustomOriginConfig': {
                        'HTTPPort': 80,
                        'HTTPSPort': 443,
                        'OriginProtocolPolicy': 'http-only',
                        'OriginSslProtocols': {
                            'Quantity': 1,
                            'Items': ['TLSv1.2']
                        },
                        'OriginReadTimeout': 30,
                        'OriginKeepaliveTimeout': 5
                    }
                }
            ]
        },
        'DefaultCacheBehavior': {
            'TargetOriginId': 'ml-origin',
            'ViewerProtocolPolicy': 'redirect-to-https',
            'AllowedMethods': {
                'Quantity': 7,
                'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
                'CachedMethods': {
                    'Quantity': 2,
                    'Items': ['GET', 'HEAD']
                }
            },
            'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',  # CachingDisabled (for POST requests)
            'Compress': True,
            'MinTTL': 0,
            'DefaultTTL': 0,
            'MaxTTL': 0
        },
        'CacheBehaviors': {
            'Quantity': 1,
            'Items': [
                {
                    'PathPattern': '/predict',
                    'TargetOriginId': 'ml-origin',
                    'ViewerProtocolPolicy': 'https-only',
                    'AllowedMethods': {
                        'Quantity': 3,
                        'Items': ['GET', 'HEAD', 'POST'],
                        'CachedMethods': {
                            'Quantity': 2,
                            'Items': ['GET', 'HEAD']
                        }
                    },
                    'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
                    'Compress': True,
                    'MinTTL': 0
                }
            ]
        },
        'PriceClass': 'PriceClass_All',  # All edge locations
        'ViewerCertificate': {
            'CloudFrontDefaultCertificate': True
        }
    }

    # Create distribution
    response = cloudfront_client.create_distribution(
        DistributionConfig=config
    )

    distribution_id = response['Distribution']['Id']
    domain_name = response['Distribution']['DomainName']

    print(f"Created CloudFront distribution: {domain_name}")
    print(f"Distribution ID: {distribution_id}")

    return {
        'distribution_id': distribution_id,
        'domain_name': domain_name
    }

# Usage
cdn_config = create_ml_cdn('ml-alb-123456.us-east-1.elb.amazonaws.com')
print(f"Access your model at: https://{cdn_config['domain_name']}/predict")
```

### 机器学习 CDN 缓存策略

```python
"""
CDN Caching Strategy for Different ML Use Cases
"""

# Use Case 1: Static Model Metadata (Cache aggressively)
model_info_cache = {
    'path': '/models/info',
    'cache_ttl': 86400,  # 24 hours
    'cache_key': 'model_id',
    'rationale': 'Model metadata rarely changes'
}

# Use Case 2: Feature Embeddings (Cache for logged-in users)
embeddings_cache = {
    'path': '/embeddings/*',
    'cache_ttl': 3600,  # 1 hour
    'cache_key': 'user_id + resource_id',
    'rationale': 'Embeddings are expensive to compute, safe to cache per user'
}

# Use Case 3: Real-time Predictions (No caching)
prediction_no_cache = {
    'path': '/predict',
    'cache_ttl': 0,  # No caching
    'rationale': 'Predictions must be fresh for each request'
}

# Use Case 4: Batch Inference Results (Short cache)
batch_results_cache = {
    'path': '/batch/results/*',
    'cache_ttl': 300,  # 5 minutes
    'cache_key': 'batch_id',
    'rationale': 'Results don\'t change, safe to cache briefly'
}
```

---

## 网络安全

保护机器学习基础设施需要多层网络安全措施。

### 安全组架构

```
┌────────────────────────────────────────────────────────────┐
│                  Security Group Layers                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Layer 1: Load Balancer SG                                 │
│  ──────────────────────                                    │
│  Inbound:  0.0.0.0/0:80,443 (Public internet)             │
│  Outbound: App Server SG:8000                              │
│                                                            │
│  Layer 2: Application Server SG                            │
│  ───────────────────────────                               │
│  Inbound:  Load Balancer SG:8000                           │
│  Outbound: Database SG:5432, Redis SG:6379, S3 endpoint   │
│                                                            │
│  Layer 3: Database SG                                      │
│  ─────────────────────                                     │
│  Inbound:  App Server SG:5432                              │
│  Outbound: None (no outbound required)                     │
│                                                            │
│  Layer 4: Training Instance SG                             │
│  ──────────────────────────                                │
│  Inbound:  Bastion SG:22 (SSH)                             │
│  Outbound: S3 endpoint, ECR (pull images), Internet (pip) │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 创建安全组

```python
import boto3

ec2_client = boto3.client('ec2')

def create_ml_security_groups(vpc_id):
    """
    Create layered security groups for ML infrastructure

    Returns:
        Dictionary of security group IDs
    """
    # 1. Bastion SG (SSH access)
    bastion_sg = ec2_client.create_security_group(
        GroupName='ml-bastion-sg',
        Description='Bastion host security group',
        VpcId=vpc_id
    )
    bastion_sg_id = bastion_sg['GroupId']

    # Allow SSH from specific IP (your office/home)
    ec2_client.authorize_security_group_ingress(
        GroupId=bastion_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '1.2.3.4/32', 'Description': 'Office IP'}]
            }
        ]
    )

    # 2. Load Balancer SG
    lb_sg = ec2_client.create_security_group(
        GroupName='ml-lb-sg',
        Description='Load balancer security group',
        VpcId=vpc_id
    )
    lb_sg_id = lb_sg['GroupId']

    # Allow HTTP/HTTPS from internet
    ec2_client.authorize_security_group_ingress(
        GroupId=lb_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            },
            {
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }
        ]
    )

    # 3. Application Server SG
    app_sg = ec2_client.create_security_group(
        GroupName='ml-app-sg',
        Description='ML application server security group',
        VpcId=vpc_id
    )
    app_sg_id = app_sg['GroupId']

    # Allow traffic from load balancer
    ec2_client.authorize_security_group_ingress(
        GroupId=app_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 8000,
                'ToPort': 8000,
                'UserIdGroupPairs': [{'GroupId': lb_sg_id}]
            }
        ]
    )

    # 4. Database SG
    db_sg = ec2_client.create_security_group(
        GroupName='ml-db-sg',
        Description='Database security group',
        VpcId=vpc_id
    )
    db_sg_id = db_sg['GroupId']

    # Allow traffic from app servers
    ec2_client.authorize_security_group_ingress(
        GroupId=db_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 5432,
                'ToPort': 5432,
                'UserIdGroupPairs': [{'GroupId': app_sg_id}]
            }
        ]
    )

    # 5. Training Instance SG
    training_sg = ec2_client.create_security_group(
        GroupName='ml-training-sg',
        Description='ML training instance security group',
        VpcId=vpc_id
    )
    training_sg_id = training_sg['GroupId']

    # Allow SSH from bastion
    ec2_client.authorize_security_group_ingress(
        GroupId=training_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'UserIdGroupPairs': [{'GroupId': bastion_sg_id}]
            }
        ]
    )

    # Allow outbound HTTPS (for pip, downloads)
    ec2_client.authorize_security_group_egress(
        GroupId=training_sg_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }
        ]
    )

    print("Created all security groups")

    return {
        'bastion_sg_id': bastion_sg_id,
        'lb_sg_id': lb_sg_id,
        'app_sg_id': app_sg_id,
        'db_sg_id': db_sg_id,
        'training_sg_id': training_sg_id
    }

# Usage
sg_config = create_ml_security_groups('vpc-12345678')
```

### 网络 ACL（额外安全层）

```python
def create_network_acl(vpc_id, subnet_id):
    """
    Create Network ACL for additional subnet-level security

    Use case: Block specific IP ranges, DDoS protection
    """
    ec2_client = boto3.client('ec2')

    # Create NACL
    nacl_response = ec2_client.create_network_acl(
        VpcId=vpc_id,
        TagSpecifications=[
            {
                'ResourceType': 'network-acl',
                'Tags': [{'Key': 'Name', 'Value': 'ml-subnet-nacl'}]
            }
        ]
    )
    nacl_id = nacl_response['NetworkAcl']['NetworkAclId']

    # Allow inbound HTTP/HTTPS
    ec2_client.create_network_acl_entry(
        NetworkAclId=nacl_id,
        RuleNumber=100,
        Protocol='6',  # TCP
        RuleAction='allow',
        Egress=False,
        CidrBlock='0.0.0.0/0',
        PortRange={'From': 80, 'To': 80}
    )

    ec2_client.create_network_acl_entry(
        NetworkAclId=nacl_id,
        RuleNumber=110,
        Protocol='6',
        RuleAction='allow',
        Egress=False,
        CidrBlock='0.0.0.0/0',
        PortRange={'From': 443, 'To': 443}
    )

    # Deny specific IP range (example: block malicious traffic)
    ec2_client.create_network_acl_entry(
        NetworkAclId=nacl_id,
        RuleNumber=50,
        Protocol='-1',  # All protocols
        RuleAction='deny',
        Egress=False,
        CidrBlock='192.0.2.0/24'  # Example blocked range
    )

    # Allow all outbound
    ec2_client.create_network_acl_entry(
        NetworkAclId=nacl_id,
        RuleNumber=100,
        Protocol='-1',
        RuleAction='allow',
        Egress=True,
        CidrBlock='0.0.0.0/0'
    )

    # Associate with subnet
    ec2_client.replace_network_acl_association(
        AssociationId=subnet_id,
        NetworkAclId=nacl_id
    )

    print(f"Created NACL: {nacl_id}")
```

---

## 混合云与多云网络

将本地基础设施与云端连接，支持混合机器学习工作流。

### 用于安全访问的 VPN 配置

```python
import boto3

ec2_client = boto3.client('ec2')

def create_vpn_connection(vpc_id, customer_gateway_ip):
    """
    Create VPN connection to on-premises datacenter

    Args:
        vpc_id: VPC ID
        customer_gateway_ip: Public IP of on-premises VPN device

    Returns:
        VPN connection ID
    """
    # Create Virtual Private Gateway
    vpg_response = ec2_client.create_vpn_gateway(
        Type='ipsec.1',
        TagSpecifications=[
            {
                'ResourceType': 'vpn-gateway',
                'Tags': [{'Key': 'Name', 'Value': 'ml-vpn-gateway'}]
            }
        ]
    )
    vpg_id = vpg_response['VpnGateway']['VpnGatewayId']

    # Attach to VPC
    ec2_client.attach_vpn_gateway(
        VpcId=vpc_id,
        VpnGatewayId=vpg_id
    )

    # Create Customer Gateway
    cgw_response = ec2_client.create_customer_gateway(
        Type='ipsec.1',
        PublicIp=customer_gateway_ip,
        BgpAsn=65000,
        TagSpecifications=[
            {
                'ResourceType': 'customer-gateway',
                'Tags': [{'Key': 'Name', 'Value': 'onprem-gateway'}]
            }
        ]
    )
    cgw_id = cgw_response['CustomerGateway']['CustomerGatewayId']

    # Create VPN Connection
    vpn_response = ec2_client.create_vpn_connection(
        Type='ipsec.1',
        CustomerGatewayId=cgw_id,
        VpnGatewayId=vpg_id,
        Options={
            'StaticRoutesOnly': False,  # Use BGP
            'TunnelOptions': [
                {
                    'TunnelInsideCidr': '169.254.10.0/30',
                    'PreSharedKey': 'your-pre-shared-key-here'
                },
                {
                    'TunnelInsideCidr': '169.254.11.0/30',
                    'PreSharedKey': 'your-pre-shared-key-here'
                }
            ]
        },
        TagSpecifications=[
            {
                'ResourceType': 'vpn-connection',
                'Tags': [{'Key': 'Name', 'Value': 'ml-vpn'}]
            }
        ]
    )

    vpn_id = vpn_response['VpnConnection']['VpnConnectionId']

    print(f"Created VPN connection: {vpn_id}")
    print(f"Configure your on-premises device with the provided config")

    return {
        'vpn_id': vpn_id,
        'vpg_id': vpg_id,
        'cgw_id': cgw_id
    }
```

### 用于高带宽连接的 AWS Direct Connect

```python
"""
AWS Direct Connect for ML Workloads

Use cases:
- High-bandwidth data transfer (1-100 Gbps)
- Low-latency training data access from on-prem storage
- Hybrid training (on-prem + cloud)

Benefits:
- Consistent network performance
- Reduced bandwidth costs
- Private connectivity (not over internet)

Setup:
1. Order Direct Connect connection (AWS Console)
2. Configure Virtual Interface
3. Set up BGP routing
4. Connect to your datacenter

Cost:
- Port hour: $0.30/hour (1 Gbps) to $2.25/hour (10 Gbps)
- Data transfer: $0.02/GB (outbound)
"""
```

---

## 服务网格

服务网格为基于微服务的机器学习系统提供高级流量管理能力。

### 用于机器学习微服务的 Istio

```yaml
# ML Inference Service Mesh with Istio

# Virtual Service for Traffic Management
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ml-model-service
spec:
  hosts:
  - ml-model.prod.svc.cluster.local
  http:
  - match:
    - headers:
        version:
          exact: v2
    route:
    - destination:
        host: ml-model.prod.svc.cluster.local
        subset: v2
  - route:  # Default route
    - destination:
        host: ml-model.prod.svc.cluster.local
        subset: v1
      weight: 90
    - destination:
        host: ml-model.prod.svc.cluster.local
        subset: v2
      weight: 10
---
# Destination Rule
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ml-model-dest-rule
spec:
  host: ml-model.prod.svc.cluster.local
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

---

## 网络性能优化

### 用于分布式训练的置放群组（Placement Groups）

```python
def create_cluster_placement_group(name='ml-training-cluster'):
    """
    Create placement group for low-latency distributed training

    Use case: Multi-GPU training with AllReduce
    """
    ec2_client = boto3.client('ec2')

    response = ec2_client.create_placement_group(
        GroupName=name,
        Strategy='cluster',  # Low-latency, high-bandwidth
        TagSpecifications=[
            {
                'ResourceType': 'placement-group',
                'Tags': [{'Key': 'Purpose', 'Value': 'distributed-training'}]
            }
        ]
    )

    print(f"Created placement group: {name}")
    print("Launch instances with: --placement-group {name}")
    return name

# Launch instances in placement group
def launch_training_cluster(placement_group, num_instances=4):
    """Launch GPU instances in placement group"""
    ec2_client = boto3.client('ec2')

    response = ec2_client.run_instances(
        ImageId='ami-12345678',
        InstanceType='p3.8xlarge',  # 4x V100 GPUs
        MinCount=num_instances,
        MaxCount=num_instances,
        Placement={
            'GroupName': placement_group
        },
        NetworkInterfaces=[
            {
                'DeviceIndex': 0,
                'AssociatePublicIpAddress': False,
                'SubnetId': 'subnet-12345678',
                'Groups': ['sg-training']
            }
        ]
    )

    instance_ids = [i['InstanceId'] for i in response['Instances']]
    print(f"Launched {num_instances} instances in placement group")
    return instance_ids
```

### 增强网络（ENA）

```python
"""
Enhanced Networking for ML Workloads

Benefits:
- Higher bandwidth (up to 100 Gbps)
- Higher packet per second (PPS) performance
- Lower latency
- Lower jitter

Supported instances:
- GPU: p3, p4, g4, g5
- Compute: c5, c6i, m5, m6i

Enable ENA:
- Automatically enabled on supported instances
- Verify: ethtool -i eth0 | grep ena

Performance:
- Standard: 5-10 Gbps
- ENA: 25-100 Gbps
"""
```

---

## 监控与故障排查

### 使用 CloudWatch 监控网络

```python
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')

def get_network_metrics(instance_id, hours=1):
    """
    Get network performance metrics for instance

    Returns:
        Network statistics
    """
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)

    # Network In
    network_in = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='NetworkIn',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start_time,
        EndTime=end_time,
        Period=300,  # 5 minutes
        Statistics=['Average', 'Maximum']
    )

    # Network Out
    network_out = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='NetworkOut',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start_time,
        EndTime=end_time,
        Period=300,
        Statistics=['Average', 'Maximum']
    )

    avg_in = sum(d['Average'] for d in network_in['Datapoints']) / len(network_in['Datapoints']) if network_in['Datapoints'] else 0
    avg_out = sum(d['Average'] for d in network_out['Datapoints']) / len(network_out['Datapoints']) if network_out['Datapoints'] else 0

    return {
        'avg_network_in_mbps': avg_in / 1024 / 1024 * 8,
        'avg_network_out_mbps': avg_out / 1024 / 1024 * 8,
        'max_network_in_mbps': max((d['Maximum'] for d in network_in['Datapoints']), default=0) / 1024 / 1024 * 8,
        'max_network_out_mbps': max((d['Maximum'] for d in network_out['Datapoints']), default=0) / 1024 / 1024 * 8
    }

# Usage
metrics = get_network_metrics('i-1234567890abcdef0')
print(f"Average network in: {metrics['avg_network_in_mbps']:.2f} Mbps")
print(f"Average network out: {metrics['avg_network_out_mbps']:.2f} Mbps")
```

### 排查网络问题

```python
"""
Common Network Issues and Solutions

1. High Latency (>100ms)
   - Check: Placement groups, instance type, region
   - Solution: Use placement groups, enable ENA, choose closer region

2. Low Bandwidth (<1 Gbps)
   - Check: Instance type bandwidth limits, security groups
   - Solution: Upgrade instance type, check for throttling

3. Connection Timeouts
   - Check: Security groups, NACLs, route tables
   - Solution: Verify SG rules, check NAT gateway, validate routes

4. Intermittent Failures
   - Check: Load balancer health checks, target health
   - Solution: Adjust health check settings, increase timeout

5. Cross-Region Latency
   - Check: Inter-region latency (50-200ms is normal)
   - Solution: Use CloudFront/CDN, consider data locality
"""
```

---

## 动手练习

### 练习：构建安全的多层机器学习网络

**目标：** 部署包含以下组件的面向生产环境的机器学习系统：
- 多可用区 VPC。
- 分层安全组。
- Application Load Balancer。
- NAT Gateway。
- 用于访问训练实例的 VPN。
- CloudWatch 监控。

**要求：**
1. 高可用性（99.9% 以上）。
2. 安全访问（训练资源不直接暴露在互联网中）。
3. 经过负载均衡的推理 API。
4. API 延迟低于 100ms。
5. 每月成本低于 500 美元。

**预期架构：**
- 两个可用区。
- 六个子网（每个可用区包含公共、应用及训练子网）。
- 五个安全组。
- 一个 Application Load Balancer。
- 两个 NAT Gateway（高可用）。
- 三台模型服务器（自动扩缩容）。

---

## 总结

本课学习了：

- 为机器学习基础设施设计 VPC。
- 为模型服务配置负载均衡器。
- 实现用于全球交付的 CDN。
- 通过分层安全组保护网络。
- 设置 VPN 与 Direct Connect。
- 优化网络性能（ENA、置放群组）。
- 为微服务实现服务网格。
- 监控与排查网络问题。

**核心要点：**
- VPC 设计影响安全性、性能及成本。
- 负载均衡器支持 A/B 测试与逐步发布。
- 原文示例：CDN 为全球用户降低 75% 延迟。
- 分层安全（安全组 + 网络 ACL）提供纵深防御。
- 原文示例：置放群组使训练时间缩短 30%。

**后续步骤：**
- 完成动手练习。
- 为自己的项目实现 VPC。
- 配置支持 A/B 测试的负载均衡器。
- 进入第 07 课：托管机器学习服务。

---

**预计完成时间：** 6 小时（含动手练习）。
**难度：** 中级。
**下一课：** [07-managed-ml-services.md](./07-managed-ml-services.md)

> 译注：跨区域分布式训练可能受网络延迟和带宽限制；VPC 对等连接只解决连通性，并不保证高性能互连。CDN 缓存应验证请求方法、缓存键、授权与租户隔离，禁止泄露个性化预测。安全组具有状态，网络 ACL 通常无状态，需要为返回流量正确配置规则。ENA、置放群组等优化能力与实际收益取决于实例规格、可用区和通信模式。原文的价格与性能目标尚未实测验证。原始代码、配置及其中的英文说明均保留；实验仅在授权沙箱执行，结束后清理相关计费资源。
