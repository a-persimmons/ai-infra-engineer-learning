# 技术版本 — 工程师学习路线

**最后更新**：2025 年 1 月

本文列出了 AI 基础设施工程师课程所用全部技术的推荐版本和已测试版本。

## 核心语言与运行时

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Python** | 3.11+ | 生产环境推荐 3.11 或 3.12 |
| **Go** | 1.21+ | 用于高性能服务 |
| **Bash** | 5.0+ | Shell 脚本编写 |
| **Node.js** | 20 LTS | 用于工具开发和监控仪表盘 |

## 高级机器学习框架

### 训练框架
| 软件包 | 版本 | 用途 |
|---------|---------|---------|
| **PyTorch** | 2.1.0+ | 主要训练框架 |
| **PyTorch Lightning** | 2.1.0+ | 训练编排 |
| **TensorFlow** | 2.15.0+ | 备选框架 |
| **JAX** | 0.4.20+ | 高性能研究 |
| **DeepSpeed** | 0.12+ | 大规模分布式训练 |

### LLM 基础设施
| 软件包 | 版本 | 用途 |
|---------|---------|---------|
| **transformers** | 4.35.0+ | Hugging Face 模型 |
| **vLLM** | 0.2.6+ | 高吞吐量 LLM 服务 |
| **TGI (Text Generation Inference)** | 1.3+ | Hugging Face 模型服务 |
| **TensorRT-LLM** | 0.6+ | NVIDIA 优化的 LLM 推理 |
| **llama.cpp** | 最新版 | CPU 或低资源环境中的 LLM 推理 |

### 模型优化
| 软件包 | 版本 | 用途 |
|---------|---------|---------|
| **ONNX** | 1.15.0+ | 模型格式转换 |
| **TensorRT** | 8.6+ | NVIDIA 推理优化 |
| **OpenVINO** | 2023.2+ | Intel 推理优化 |
| **bitsandbytes** | 0.41+ | 量化库 |

## MLOps 与工作流编排

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Apache Airflow** | 2.7+ | 工作流编排 |
| **Kubeflow** | 1.8+ | 基于 Kubernetes 的 ML 平台 |
| **MLflow** | 2.9+ | 实验追踪与模型注册中心 |
| **DVC** | 3.30+ | 数据版本控制 |
| **Great Expectations** | 0.18+ | 数据验证 |

### 特征存储
| 技术 | 版本 | 用途 |
|------------|---------|---------|
| **Feast** | 0.35+ | 特征存储 |
| **Tecton** | 最新版 | 企业级特征平台 |

## Kubernetes 生态系统

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Kubernetes** | 1.28+ | 生产集群 |
| **kubectl** | 1.28+ | 与集群版本匹配 |
| **Helm** | 3.13+ | 包管理器 |
| **Kustomize** | 5.2+ | 配置管理 |
| **ArgoCD** | 2.9+ | GitOps 持续交付 |
| **Flux** | 2.2+ | 备选 GitOps 工具 |

### Kubernetes Operator
| Operator | 版本 | 用途 |
|----------|---------|---------|
| **Training Operator** | 1.7+ | 分布式训练（PyTorch、TF） |
| **KServe** | 0.12+ | 模型服务 |
| **Volcano** | 1.8+ | 批处理作业调度器 |
| **Ray Operator** | 1.0+ | 分布式计算 |

### 服务网格
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Istio** | 1.20+ | 服务网格 |
| **Linkerd** | 2.14+ | 轻量级服务网格 |

## 云原生存储

| 技术 | 版本 | 用途 |
|------------|---------|---------|
| **Rook-Ceph** | 1.13+ | 分布式存储 Operator |
| **MinIO** | RELEASE.2024-01 | 兼容 S3 的对象存储 |
| **JuiceFS** | 1.1+ | 分布式 POSIX 文件系统 |

## 容器技术

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Docker** | 24.0+ | 容器运行时 |
| **containerd** | 1.7+ | 生产级容器运行时 |
| **CRI-O** | 1.28+ | 轻量级容器运行时 |
| **Buildah** | 1.33+ | 容器镜像构建工具 |
| **Podman** | 4.8+ | 无守护进程的容器 |

### GPU 容器支持
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **NVIDIA Container Toolkit** | 1.14+ | Docker GPU 支持 |
| **NVIDIA Device Plugin** | 0.14+ | Kubernetes GPU 支持 |
| **MIG Manager** | 0.6+ | 多实例 GPU |

## 云平台 — 进阶

### AWS 服务
| 服务 | 推荐版本 | 说明 |
|---------|-------------------|-------|
| **EKS** | 1.28 | 托管 Kubernetes |
| **SageMaker** | 最新版 | 托管 ML 平台 |
| **EMR** | 6.15+ | 大数据处理 |
| **Batch** | 最新版 | 批量计算 |
| **Step Functions** | 最新版 | 工作流编排 |

### GCP 服务
| 服务 | 推荐版本 | 说明 |
|---------|-------------------|-------|
| **GKE** | 1.28 | 托管 Kubernetes |
| **Vertex AI** | 最新版 | 托管 ML 平台 |
| **Dataflow** | 最新版 | 流式及批量处理 |
| **TPU** | v5e | 张量处理单元 |

### Azure 服务
| 服务 | 推荐版本 | 说明 |
|---------|-------------------|-------|
| **AKS** | 1.28 | 托管 Kubernetes |
| **Azure ML** | 最新版 | 托管 ML 平台 |
| **Azure Batch** | 最新版 | 批量计算 |

## 生产级可观测性技术栈

### 指标与监控
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Prometheus** | 2.48+ | 指标采集 |
| **Thanos** | 0.33+ | Prometheus 长期存储 |
| **VictoriaMetrics** | 1.95+ | 高性能指标数据库 |
| **Grafana** | 10.2+ | 可视化 |
| **Grafana Loki** | 2.9+ | 日志聚合 |
| **Grafana Tempo** | 2.3+ | 分布式链路追踪 |

### APM 与链路追踪
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Jaeger** | 1.52+ | 分布式链路追踪 |
| **OpenTelemetry** | 1.21+ | 可观测性框架 |
| **Datadog Agent** | 7.50+ | 商业 APM |
| **New Relic** | 最新版 | 商业 APM |

### 日志
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Elasticsearch** | 8.11+ | 日志存储与搜索 |
| **OpenSearch** | 2.11+ | Elasticsearch 分支 |
| **Fluentd** | 1.16+ | 日志采集器 |
| **Vector** | 0.34+ | 高性能日志采集器 |

## 基础设施即代码

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Terraform** | 1.6+ | 多云 IaC |
| **Pulumi** | 3.95+ | 使用通用编程语言的现代 IaC |
| **Crossplane** | 1.14+ | Kubernetes 原生 IaC |
| **Ansible** | 2.16+ | 配置管理 |

### Terraform Provider
| Provider | 版本 | 说明 |
|----------|---------|-------|
| `hashicorp/aws` | ~> 5.0 | AWS 资源 |
| `hashicorp/google` | ~> 5.0 | GCP 资源 |
| `hashicorp/azurerm` | ~> 3.0 | Azure 资源 |
| `hashicorp/kubernetes` | ~> 2.24 | Kubernetes 资源 |
| `hashicorp/helm` | ~> 2.12 | Helm 发布 |

## 数据处理

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Apache Spark** | 3.5+ | 分布式数据处理 |
| **Apache Kafka** | 3.6+ | 事件流 |
| **Apache Flink** | 1.18+ | 流处理 |
| **Dask** | 2023.12+ | Python 并行计算 |
| **Ray** | 2.9+ | Python 分布式计算 |

## 生产级数据库技术

### 关系型数据库
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **PostgreSQL** | 16+ | 生产数据库 |
| **MySQL** | 8.2+ | 备选关系型数据库 |
| **CockroachDB** | 23.2+ | 分布式 SQL |

### NoSQL
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Redis** | 7.2+ | 内存缓存与存储 |
| **MongoDB** | 7.0+ | 文档数据库 |
| **Cassandra** | 4.1+ | 宽列存储 |
| **ScyllaDB** | 5.4+ | 高性能 Cassandra 替代方案 |

### 向量数据库
| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Pinecone** | 最新版 | 托管向量数据库 |
| **Weaviate** | 1.23+ | 开源向量数据库 |
| **Milvus** | 2.3+ | 向量相似度搜索 |
| **Qdrant** | 1.7+ | 向量搜索引擎 |
| **ChromaDB** | 0.4+ | 嵌入向量数据库 |

## CI/CD

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **GitHub Actions** | 最新版 | CI/CD 平台 |
| **GitLab CI** | 16.7+ | 备选 CI/CD 工具 |
| **Jenkins** | 2.426+ | 传统 CI/CD |
| **Tekton** | 0.54+ | Kubernetes 原生 CI/CD |
| **Argo Workflows** | 3.5+ | Kubernetes 工作流 |

## 安全与密钥管理

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **HashiCorp Vault** | 1.15+ | 密钥管理 |
| **Sealed Secrets** | 0.24+ | Kubernetes Secret 加密 |
| **External Secrets** | 0.9+ | 将密钥同步至 Kubernetes |
| **SOPS** | 3.8+ | 加密文件管理 |
| **cert-manager** | 1.13+ | TLS 证书管理 |

## GPU 与加速器支持

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **CUDA** | 12.2+ | NVIDIA GPU 编程 |
| **cuDNN** | 8.9+ | 深度学习基础算子 |
| **NCCL** | 2.19+ | 多 GPU 通信 |
| **NVIDIA Driver** | 535+ | GPU 驱动程序 |
| **ROCm** | 5.7+ | AMD GPU 支持 |

### GPU 监控
| 技术 | 版本 | 用途 |
|------------|---------|---------|
| **DCGM** | 3.3+ | NVIDIA 数据中心 GPU 监控 |
| **dcgm-exporter** | 3.3+ | Prometheus DCGM 指标导出器 |

## 性能与成本优化

| 技术 | 版本 | 用途 |
|------------|---------|---------|
| **Karpenter** | 0.32+ | Kubernetes 自动扩缩容 |
| **Cluster Autoscaler** | 1.28+ | 传统 K8s 自动扩缩容 |
| **KEDA** | 2.12+ | 事件驱动的自动扩缩容 |
| **Kubecost** | 1.108+ | 成本监控 |

## 服务发现与配置

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **Consul** | 1.17+ | 服务网格与发现 |
| **etcd** | 3.5+ | 分布式键值存储 |
| **CoreDNS** | 1.11+ | DNS 服务器 |

## 消息队列

| 技术 | 版本 | 说明 |
|------------|---------|-------|
| **RabbitMQ** | 3.12+ | 消息代理 |
| **NATS** | 2.10+ | 云原生消息传递 |
| **Pulsar** | 3.1+ | 分布式消息传递 |

## 测试与质量

| 技术 | 版本 | 用途 |
|------------|---------|---------|
| **pytest** | 7.4+ | Python 测试 |
| **locust** | 2.18+ | 负载测试 |
| **k6** | 0.48+ | 负载测试 |
| **Chaos Mesh** | 2.6+ | 混沌工程 |
| **Litmus** | 3.8+ | 混沌工程 |

## Python 软件包 — 进阶

### 分布式计算
| 软件包 | 版本 | 用途 |
|---------|---------|---------|
| **ray[default]** | 2.9+ | 分布式计算 |
| **dask[complete]** | 2023.12+ | 并行计算 |
| **horovod** | 0.28+ | 分布式深度学习 |

### 性能
| 软件包 | 版本 | 用途 |
|---------|---------|---------|
| **numba** | 0.58+ | 即时编译 |
| **cython** | 3.0+ | Python 的 C 扩展 |
| **pyarrow** | 14.0+ | Python 版 Apache Arrow |

## 版本兼容性矩阵

### Kubernetes + CUDA + PyTorch
| Kubernetes | CUDA | PyTorch | 状态 |
|-----------|------|---------|--------|
| 1.28 | 12.2 | 2.1+ | ✅ 推荐 |
| 1.28 | 12.1 | 2.1+ | ✅ 支持 |
| 1.27 | 12.2 | 2.1+ | ⚠️  仅维护 |

### 云服务商的 Kubernetes 版本
| Provider | 支持版本 | 推荐版本 |
|----------|-------------------|-------------|
| AWS EKS | 1.26, 1.27, 1.28 | 1.28 |
| GCP GKE | 1.26, 1.27, 1.28, 1.29 | 1.28 |
| Azure AKS | 1.26, 1.27, 1.28 | 1.28 |

## 已弃用技术

| 技术 | 弃用版本 | 停止支持时间 | 迁移路径 |
|------------|-------------------|----------------|----------------|
| Python | < 3.10 | 已停止支持 | 升级至 3.11+ |
| Kubernetes | < 1.26 | 2024 年 12 月 | 升级至 1.28+ |
| TensorFlow | 1.x | 已停止支持 | 使用 TensorFlow 2.15+ |
| Docker Swarm | 全部 | 视为已弃用 | 迁移至 Kubernetes |

## 安装命令速查

### MLOps 工具
```bash
# MLflow
pip install mlflow==2.9.2

# DVC
pip install dvc[all]==3.30.0

# Kubeflow Pipelines SDK
pip install kfp==2.5.0
```

### Kubernetes 工具
```bash
# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# ArgoCD CLI
brew install argocd  # macOS
# Or download binary from releases

# K9s (cluster management)
brew install k9s
```

### 基础设施即代码
```bash
# Terraform
brew install terraform

# Pulumi
curl -fsSL https://get.pulumi.com | sh

# Crossplane CLI
curl -sL https://raw.githubusercontent.com/crossplane/crossplane/master/install.sh | sh
```

## 性能基准测试（参考）

### LLM 推理吞吐量（token/秒）
| 模型规模 | CPU | T4 GPU | A10G | A100 |
|-----------|-----|---------|------|------|
| 70 亿参数 | ~1 | ~20 | ~50 | ~100 |
| 130 亿参数 | ~0.5 | ~10 | ~25 | ~50 |
| 700 亿参数 | 不适用 | 不适用 | ~5 | ~15 |

*使用 vLLM，采用 FP16 精度，批大小为 1*

## 支持与更新

- **更新频率**：每季度（1 月、4 月、7 月、10 月）
- **安全补丁**：发布时更新
- **破坏性变更**：至少提前 30 天通知
- **版本支持**：最新的两个主版本

## 生产环境就绪检查清单

部署到生产环境前，请确保：

- [ ] 使用 LTS 或稳定版本（而非最前沿版本）
- [ ] 已应用安全补丁
- [ ] 已在预发布环境验证兼容性
- [ ] 已配置监控
- [ ] 已测试备份与灾难恢复
- [ ] 已更新文档
- [ ] 团队已接受新版本培训

---

**维护方**：AI 基础设施工程团队
**联系方式**：版本相关问题请参见仓库 Issues
