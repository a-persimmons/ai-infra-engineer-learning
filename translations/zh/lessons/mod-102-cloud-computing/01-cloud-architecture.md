# 第 01 课：面向机器学习的云架构

**时长：** 6 小时
**目标：** 理解机器学习系统的云架构模式与设计原则。

## 导论

在云上设计机器学习系统，需要理解通用云架构原则及机器学习特有的考虑因素。本课介绍影响机器学习基础设施的基本云架构模式、组件和设计决策。

## 云架构基础

### 云架构的三大支柱

```
┌─────────────────────────────────────────────────────────┐
│           Cloud Architecture Pillars                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. COMPUTE                2. STORAGE        3. NETWORK │
│  ┌──────────┐             ┌──────────┐     ┌─────────┐ │
│  │   VMs    │             │  Object  │     │   VPC   │ │
│  │ Containers│            │  Block   │     │  Subnet │ │
│  │Serverless│             │   File   │     │   LB    │ │
│  └──────────┘             └──────────┘     └─────────┘ │
│       ↓                        ↓                 ↓      │
│  Run ML code           Store data/models    Connect it  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1. 计算资源

**虚拟机（VM）**
- 完整控制操作系统与软件。
- 适合复杂机器学习流水线。
- 可以全天候运行，也可以按需运行。
- 示例：AWS EC2、GCP Compute Engine、Azure VM。

**容器**
- 可移植且一致的运行环境。
- 通常比虚拟机启动更快。
- 适合机器学习模型服务。
- 示例：AWS ECS/EKS、GCP GKE、Azure AKS。

**无服务器计算（Serverless）**
- 无需管理服务器。
- 自动扩缩容。
- 按执行量付费。
- 示例：AWS Lambda、GCP Cloud Functions、Azure Functions。

**何时使用各类计算资源：**
```
VMs:           Long-running training jobs, complex dependencies
Containers:    Model serving, microservices, portability
Serverless:    Lightweight inference, event-driven processing
```

### 2. 存储资源

**对象存储**
- 具有高度可扩展性。
- 存储数据集、模型及日志。
- 通过 HTTP/S 访问。
- 示例：AWS S3、GCP Cloud Storage、Azure Blob Storage。
- 成本：约 0.02 美元/GB/月。

**块存储**
- 附加至计算实例。
- 低延迟、高 IOPS。
- 用于数据库及应用数据。
- 示例：AWS EBS、GCP Persistent Disk、Azure Managed Disks。
- 成本：约 0.10 美元/GB/月。

**文件存储**
- 共享文件系统。
- NFS 协议。
- 多实例访问。
- 示例：AWS EFS、GCP Filestore、Azure Files。
- 成本：约 0.30 美元/GB/月。

**何时使用各类存储资源：**
```
Object Storage:  Datasets, trained models, backups, logs
Block Storage:   Databases, training data cache, checkpoints
File Storage:    Shared training data, home directories
```

### 3. 网络资源

**虚拟私有云（VPC）**
- 隔离的网络环境。
- 定义 IP 地址范围与子网。
- 控制流量路径。

**负载均衡器**
- 将流量分配至多个实例。
- 健康检查。
- SSL/TLS 终止。

**内容分发网络（CDN）**
- 缓存适合缓存的模型预测结果。
- 降低用户访问延迟。
- 示例：AWS CloudFront、GCP Cloud CDN、Azure CDN。

## 机器学习专用架构模式

### 模式 1：训练架构

```
┌──────────────────────────────────────────────────────────┐
│              ML Training Architecture                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Data Storage          Compute              Output       │
│  ┌──────────┐         ┌────────┐         ┌──────────┐   │
│  │ S3/GCS   │ ──────► │  GPU   │ ──────► │  Model   │   │
│  │ Dataset  │         │Instance│         │  Storage │   │
│  │  (1TB)   │         │Training│         │  (S3/GCS)│   │
│  └──────────┘         └────────┘         └──────────┘   │
│       │                    │                   │         │
│       │                    ↓                   │         │
│       │              ┌────────┐                │         │
│       │              │Metrics │                │         │
│       │              │Tracking│                │         │
│       │              │(MLflow)│                │         │
│       │              └────────┘                │         │
│       │                                        │         │
│       └────────────── Clean up ───────────────┘         │
│                                                           │
└──────────────────────────────────────────────────────────┘

Components:
1. Data Storage: S3/GCS bucket with versioned datasets
2. Training Instance: GPU instance (p3.2xlarge, n1-highmem-8)
3. Experiment Tracking: MLflow on separate instance
4. Model Registry: Versioned models in object storage
5. Monitoring: CloudWatch/Stackdriver for GPU utilization
```

**关键考虑因素：**
- 使用 Spot 实例降低成本（原文示例最高可节省 90%）。
- 实现检查点机制以支持容错。
- 训练完成后自动关闭资源。
- 对数据集及模型进行版本管理。
- 使用 MLflow/W&B 追踪实验。

**成本估算：**
```
Training Job (ResNet-50 on ImageNet):
- GPU Instance (p3.2xlarge): $3.06/hour
- Training Time: 24 hours
- Storage (1TB dataset): $20/month
- Data Transfer: $50
──────────────────────────────────────
Total: ~$150 per training run
```

### 模式 2：推理架构

```
┌──────────────────────────────────────────────────────────┐
│             ML Inference Architecture                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────┐       ┌──────────┐       ┌────────────┐     │
│  │  CDN   │       │   Load   │       │  Inference │     │
│  │ Cache  │ ◄───  │ Balancer │  ───► │  Instances │     │
│  └────────┘       └──────────┘       │  (Auto-    │     │
│                         │             │   scaled)  │     │
│                         │             └────────────┘     │
│                         │                   │            │
│                         ↓                   ↓            │
│                   ┌──────────┐       ┌────────────┐     │
│                   │  Metrics │       │   Model    │     │
│                   │ (Prom/   │       │  Storage   │     │
│                   │  Stack)  │       │  (S3/GCS)  │     │
│                   └──────────┘       └────────────┘     │
│                                                           │
└──────────────────────────────────────────────────────────┘

Components:
1. CDN: Cache responses at edge locations
2. Load Balancer: Distribute traffic, SSL termination
3. Auto-Scaling Group: 2-10 instances based on load
4. Model Storage: Versioned models in S3/GCS
5. Monitoring: Prometheus + Grafana or CloudWatch
6. Caching: Redis for frequent predictions
```

**关键考虑因素：**
- 使用自动扩缩容应对变化的负载。
- 实现多级缓存。
- 使用 CDN 分发静态资源。
- 监控延迟（p50、p95、p99）。
- 实现熔断机制。

**成本估算：**
```
Inference Service (1M requests/month):
- Load Balancer: $18/month
- Compute (3x t3.medium): $90/month
- Data Transfer: $80/month
- CDN: $40/month
──────────────────────────────────────
Total: ~$230/month
```

### 模式 3：数据流水线架构

```
┌──────────────────────────────────────────────────────────┐
│              Data Pipeline Architecture                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Ingestion         Processing        Storage             │
│  ┌─────────┐       ┌─────────┐     ┌─────────┐          │
│  │ API/    │ ───► │ Spark/  │ ──► │  Data   │          │
│  │ Stream  │       │ Airflow │     │  Lake   │          │
│  └─────────┘       └─────────┘     │ (S3/GCS)│          │
│       │                 │           └─────────┘          │
│       │                 │                 │              │
│       │                 ↓                 ↓              │
│       │           ┌─────────┐       ┌─────────┐         │
│       │           │Transform│       │ Feature │         │
│       │           │  Jobs   │       │  Store  │         │
│       │           └─────────┘       └─────────┘         │
│       │                                   │              │
│       └──────────────────────────────────┘              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 架构设计原则

### 1. 高可用性

**定义：** 即使部分组件发生故障，系统仍能保持运行。

**策略：**
- **多可用区部署：** 将资源分布到不同可用区。
- **负载均衡：** 将流量分发给多个实例。
- **健康检查：** 自动将流量切换到健康实例。
- **冗余：** 为关键组件配置多个实例。

**示例：**
```
Single AZ (99.5% uptime):
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
   ┌───┴───────┐
   │  2 VMs    │  (Single point of failure: AZ outage)
   │ (Same AZ) │
   └───────────┘

Multi-AZ (99.99% uptime):
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
   ┌───┴────────────────┐
   │                    │
┌──┴────┐          ┌────┴──┐
│ AZ-1  │          │ AZ-2  │
│ 2 VMs │          │ 2 VMs │
└───────┘          └───────┘
```

### 2. 可扩展性

**垂直扩展（Scale Up）**
- 提高实例规格（更多 CPU、内存或 GPU）。
- 较简单，但存在上限。
- 通常需要重启。

**水平扩展（Scale Out）**
- 增加实例数量。
- 具有很大的扩展潜力。
- 正确设计时可实现不停机扩展。

**自动扩缩容示例：**
```yaml
# AWS Auto Scaling Configuration
MinSize: 2              # Minimum instances
MaxSize: 10             # Maximum instances
DesiredCapacity: 3      # Initial instances
TargetCPU: 70%          # Scale when CPU > 70%

Scaling Policies:
- Scale Up: Add 2 instances when CPU > 70% for 5 minutes
- Scale Down: Remove 1 instance when CPU < 30% for 10 minutes
```

### 3. 成本优化

**合理调整资源规格（Right-Sizing）**
- 从小规格开始，按需扩容。
- 监控实际使用量。
- 避免过度供应。

**预留实例（原文估计）**
- 一年期：约节省 40%。
- 三年期：约节省 60%。
- 适合稳定工作负载。

**Spot 实例**
- 原文估计节省 70–90%。
- 可能在收到两分钟中断通知后被回收。
- 适合具备容错能力的训练与批处理。

**成本优化层级：**
```
1. Spot Instances (Training, Batch)       90% savings
2. Reserved Instances (Production)        60% savings
3. Auto-Scaling (Variable load)           40% savings
4. Right-Sizing (Match actual needs)      30% savings
5. Storage Lifecycle (Archive old data)   50% savings
6. Data Transfer Optimization             20% savings
```

### 4. 安全

**纵深防御：**
```
┌────────────────────────────────────────────────┐
│ Layer 1: Network (VPC, Subnets, Firewalls)    │
│ Layer 2: Access (IAM, RBAC, MFA)              │
│ Layer 3: Data (Encryption at rest & transit)  │
│ Layer 4: Application (Input validation)       │
│ Layer 5: Monitoring (Logs, alerts, audit)     │
└────────────────────────────────────────────────┘
```

**最佳实践：**
- 最小权限原则。
- 对静态数据和传输中的数据加密。
- 网络隔离（私有子网）。
- 定期安全审计。
- 自动化补丁管理。

### 5. 可观测性

**三大支柱：**
1. **指标（Metrics）：** 定量测量（CPU、延迟、错误）。
2. **日志（Logs）：** 用于调试的事件记录。
3. **链路追踪（Traces）：** 请求在系统中的流转路径。

**监控技术栈：**
```
Application ──► Metrics   ──► Prometheus ──► Grafana
            │
            ├─► Logs      ──► ELK Stack  ──► Kibana
            │
            └─► Traces    ──► Jaeger     ──► UI
```

## 面向机器学习工作负载设计架构

### 训练架构与推理架构

| 方面 | 训练 | 推理 |
|---|---|---|
| **计算** | GPU 密集型、Spot 实例 | CPU、自动扩缩容 |
| **存储** | 高吞吐量（EBS/Persistent SSD） | 低延迟（缓存） |
| **网络** | 内部网络 | 面向用户、CDN |
| **成本模式** | 临时性（数小时或数天） | 持续性（全天候） |
| **优化目标** | 吞吐量 | 延迟 |
| **扩展** | 垂直扩展（更大的 GPU） | 水平扩展（更多实例） |

> 译注：这张表描述典型场景，不是固定规则。大型模型推理也可能高度依赖 GPU 与高速互连，训练也广泛采用分布式水平扩展。网络访问应按实际安全边界设计。

### 数据流架构

```
Data Ingestion → Preprocessing → Training → Evaluation → Deployment → Monitoring
       ↓              ↓              ↓           ↓            ↓           ↓
   S3/GCS        Spark/EMR      GPU VMs     MLflow      K8s/ECS    Prometheus
   Kinesis       Airflow        Spot         W&B         ECS         CloudWatch
   Kafka         Glue           Reserved     TensorB     Fargate     Grafana
```

## 实践练习：设计机器学习架构

### 场景

为图像分类服务设计云架构。

**需求：**
- 每天 100 万次预测。
- 99.9% 可用性。
- p95 延迟低于 500ms。
- 全球用户。
- 每月 500 美元预算。
- 支持不停机更新模型。

### 你的任务

1. **选择计算资源：**
   - 需要多少实例？
   - 使用哪些实例类型？
   - 采用什么自动扩缩容策略？

2. **设计存储：**
   - 在哪里存储模型？
   - 如何进行版本管理？
   - 使用什么缓存策略？

3. **规划网络：**
   - 如何配置负载均衡器？
   - 如何使用 CDN？
   - 是否采用多区域部署？

4. **估算成本：**
   - 计算成本。
   - 存储成本。
   - 网络成本。
   - 月度总成本。

5. **规划高可用性：**
   - 是否采用多可用区部署？
   - 如何进行健康检查？
   - 使用什么故障转移策略？

### 示例方案

**架构：**
```
Global Users
     │
     ↓
┌────────────┐
│ CloudFront │ (CDN, caching)
│   (CDN)    │
└─────┬──────┘
      │
      ↓
┌─────────────┐
│ Application │ (SSL termination, routing)
│Load Balancer│
└─────┬───────┘
      │
   ┌──┴──────────┐
   │             │
┌──┴───┐    ┌───┴──┐
│ AZ-1 │    │ AZ-2 │
│ 2x   │    │ 2x   │
│ t3.  │    │ t3.  │
│medium│    │medium│
└──┬───┘    └───┬──┘
   │            │
   └─────┬──────┘
         │
    ┌────┴────┐
    │ S3/GCS  │ (Model storage)
    │ (Models)│
    └─────────┘
```

**成本明细：**
```
Load Balancer:           $18/month
CloudFront (CDN):        $50/month (1M requests)
Compute (4x t3.medium):  $120/month
S3 Storage (10GB):       $0.23/month
Data Transfer:           $80/month
Monitoring:              $30/month
────────────────────────────────────
Total:                   ~$298/month (Under budget!)
```

**扩缩容策略：**
```
Normal Load (0-6am):    2 instances
Peak Load (12-8pm):     4-6 instances
High Load (events):     8-10 instances
```

## 关键架构决策

### 1. 区域选择

**考虑因素：**
- 用户所在地区（延迟）。
- 数据驻留要求。
- 服务可用性。
- 成本（不同区域存在差异）。

**示例：**
```
US Users:      us-east-1 (Virginia) or us-west-2 (Oregon)
EU Users:      eu-west-1 (Ireland) or eu-central-1 (Frankfurt)
Asia Users:    ap-southeast-1 (Singapore) or ap-northeast-1 (Tokyo)
```

### 2. 实例选择

**基于 CPU（模型服务）：**
- 小模型：t3.medium（2 vCPU、4GB）。
- 中型模型：c5.xlarge（4 vCPU、8GB）。
- 大模型：c5.4xlarge（16 vCPU、32GB）。

**基于 GPU（训练）：**
- 小模型：g4dn.xlarge（1 块 T4、4 vCPU）。
- 中型模型：p3.2xlarge（1 块 V100、8 vCPU）。
- 大模型：p3.8xlarge（4 块 V100、32 vCPU）。

### 3. 存储策略

**热数据**（频繁访问）：
- 标准 S3/GCS。
- SSD 块存储。
- 内存缓存（Redis）。

**温数据**（偶尔访问）：
- 低频访问存储类别。
- 标准块存储。

**冷数据**（归档）：
- Glacier/Archive 存储。
- 生命周期策略。

## 常见架构模式

### 模式：Lambda 架构

```
Real-time Layer:    Stream processing → Serving Layer
                    (Kafka/Kinesis)
                           │
Batch Layer:        ─────────► Model Training
                    Historical Data
```

适用于：实时预测与定期重新训练。

### 模式：微服务

```
API Gateway
    │
    ├─► Preprocessing Service
    ├─► Model Service A (v1)
    ├─► Model Service B (v2)
    └─► Post-processing Service
```

适用于：多模型、独立扩展。

### 模式：单体架构

```
Single Application
├─ API endpoints
├─ Model inference
├─ Pre/post processing
└─ Monitoring
```

适用于：简单场景、初期建设。

## 核心要点

1. **三大支柱：** 计算、存储、网络。
2. **训练不等于推理：** 不同工作负载需要不同架构。
3. **高可用性：** 多可用区、负载均衡、健康检查。
4. **成本优化：** Spot 实例、自动扩缩容、合理调整规格。
5. **安全：** 纵深防御、最小权限原则。
6. **可观测性：** 指标、日志、链路追踪。
7. **面向故障设计：** 假设组件一定会发生故障。
8. **从简单方案开始：** 按需增加复杂度。

## 自我检查问题

1. 云架构的三大支柱是什么？
2. 何时使用对象存储，何时使用块存储？
3. 垂直扩展与水平扩展有什么区别？
4. 为什么训练适合 Spot 实例，而在线服务通常需要更谨慎？
5. 可观测性的三大支柱是什么？
6. 多可用区部署如何提高可用性？
7. 预留实例与按需实例的成本有何区别？

## 补充资源

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Google Cloud 架构中心](https://cloud.google.com/architecture)
- [Azure 架构中心](https://docs.microsoft.com/azure/architecture/)
- [Martin Fowler 的架构模式](https://martinfowler.com/)
- [《Cloud Architecture Patterns》](https://www.oreilly.com/library/view/cloud-architecture-patterns/9781449357979/)

---

**下一课：** [02-aws-ml-infrastructure.md](./02-aws-ml-infrastructure.md)——深入 AWS。

> 译注：价格、折扣、实例规格及容量数字为原文示例，未经当前报价核验。Spot 通知并非所有中断方式都保证两分钟；水平扩展也受配额、数据一致性与下游瓶颈约束。缓存预测时需要考虑模型版本、访问授权、用户隔离及敏感数据，避免将个性化预测错误地作为公共 CDN 缓存内容。实践练习的预算与 SLO 需要实际负载测试验证。
