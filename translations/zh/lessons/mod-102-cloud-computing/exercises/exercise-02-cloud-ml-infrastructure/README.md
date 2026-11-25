# 练习 02：云端 ML 基础设施部署

## 学习目标

完成本练习后，你将能够：
- 在 AWS、GCP 和 Azure 部署功能等效的 ML 基础设施。
- 使用基础设施即代码（Terraform）实现多云部署。
- 实现云原生 ML 服务。
- 比较不同云平台的性能与成本。
- 构建可移植的 ML 基础设施。

## 概览

现代 ML 团队经常因为冗余、成本优化或客户需求而需要跨云部署。本练习将使用 Terraform 构建完整的 ML 基础设施技术栈，使其能够以等效方式部署至 AWS、GCP 与 Azure。

## 前置条件

- Terraform 1.5+。
- 有效的云平台账号（AWS、GCP、Azure）。
- 理解云服务（计算、存储、网络）。
- 掌握 ML 模型服务基础概念。
- Python 3.11+。

## 问题描述

编写基础设施代码，将完整的 ML 服务技术栈部署到三大云平台：

1. **Kubernetes 集群：** 支持 GPU。
2. **对象存储：** 保存模型及数据。
3. **托管数据库：** PostgreSQL，用于元数据。
4. **托管缓存：** Redis，用于预测结果。
5. **负载均衡器：** 支持 SSL/TLS 终止。
6. **监控：** Prometheus + Grafana。
7. **网络：** VPC、子网、防火墙规则。

在 AWS、GCP 和 Azure 上实现功能等效的部署。

## 需求

### 功能需求

#### FR1：Kubernetes 集群
- **AWS：** EKS（Elastic Kubernetes Service）。
- **GCP：** GKE（Google Kubernetes Engine）。
- **Azure：** AKS（Azure Kubernetes Service）。

特性：
- 3–5 个工作节点。
- GPU 节点池（可选）。
- 启用自动扩缩容。
- 网络策略。
- 配置 RBAC。

#### FR2：对象存储
- **AWS：** S3 存储桶。
- **GCP：** Cloud Storage 存储桶。
- **Azure：** Blob Storage 容器。

特性：
- 启用版本管理。
- 生命周期策略。
- 静态加密。
- 访问日志。

#### FR3：托管数据库
- **AWS：** RDS PostgreSQL。
- **GCP：** Cloud SQL PostgreSQL。
- **Azure：** Azure Database for PostgreSQL。

特性：
- 多可用区/高可用配置。
- 自动备份。
- 加密。
- 只读副本（可选）。

#### FR4：托管缓存
- **AWS：** ElastiCache Redis。
- **GCP：** Memorystore Redis。
- **Azure：** Azure Cache for Redis。

特性：
- 高可用配置。
- 启用持久化。
- 传输加密。

#### FR5：网络
- **AWS：** 包含公共与私有子网的 VPC。
- **GCP：** 包含子网的 VPC。
- **Azure：** 包含子网的 Virtual Network。

特性：
- 用于私有子网的 NAT Gateway。
- 安全组/防火墙规则。
- 网络对等连接（可选）。

#### FR6：监控
- 使用 Prometheus 采集指标。
- 使用 Grafana 创建仪表盘。
- 集成云原生监控。
- 配置告警。

### 非功能需求

#### NFR1：可移植性
- Terraform 模块能够跨云复用。
- 将云平台专用配置外部化。
- 易于切换云平台。

#### NFR2：安全
- 遵循最小权限原则。
- 安全管理密钥。
- 网络隔离。
- 全面加密。

#### NFR3：成本优化
- 合理配置资源规格。
- 配置自动扩缩容。
- 在适合的场景采用 Spot/Preemptible 实例。
- 设置预算告警。

## 实现任务

### 任务 1：Terraform 项目结构（3–4 小时）

搭建多云 Terraform 项目：

```hcl
# Project structure
terraform/
├── modules/
│   ├── kubernetes/
│   │   ├── aws/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── gcp/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── azure/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── storage/
│   ├── database/
│   ├── cache/
│   └── networking/
├── environments/
│   ├── dev/
│   │   ├── aws/
│   │   ├── gcp/
│   │   └── azure/
│   └── prod/
│       ├── aws/
│       ├── gcp/
│       └── azure/
└── global/
    ├── variables.tf
    └── versions.tf
```

```hcl
# global/versions.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}
```

```hcl
# global/variables.tf

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ml-infrastructure"
}

variable "region" {
  description = "Primary deployment region"
  type        = string
}

variable "enable_gpu" {
  description = "Enable GPU node pools"
  type        = bool
  default     = false
}

variable "cluster_size" {
  description = "Kubernetes cluster size"
  type        = string
  default     = "small"
  validation {
    condition     = contains(["small", "medium", "large"], var.cluster_size)
    error_message = "Cluster size must be small, medium, or large"
  }
}

locals {
  # Cluster sizing
  cluster_configs = {
    small = {
      min_nodes     = 2
      max_nodes     = 5
      instance_type = "medium"
    }
    medium = {
      min_nodes     = 3
      max_nodes     = 10
      instance_type = "large"
    }
    large = {
      min_nodes     = 5
      max_nodes     = 20
      instance_type = "xlarge"
    }
  }

  # Resource tags
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedDate = timestamp()
  }
}
```

**验收标准：**
- [ ] 模块结构清晰。
- [ ] 可跨云复用。
- [ ] 具备环境专用配置。
- [ ] 已定义公共变量。

---

### 任务 2：AWS EKS 模块（5–6 小时）

```hcl
# modules/kubernetes/aws/main.tf

# TODO: Implement AWS EKS cluster

# VPC for EKS
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = true
  enable_vpn_gateway = false
  single_nat_gateway = var.environment == "dev" ? true : false

  enable_dns_hostnames = true
  enable_dns_support   = true

  # Kubernetes tags for subnet discovery
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = var.tags
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = var.kubernetes_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Cluster endpoint access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # OIDC Provider for IRSA (IAM Roles for Service Accounts)
  enable_irsa = true

  # Cluster addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # Node groups
  eks_managed_node_groups = {
    # General purpose nodes
    general = {
      name           = "general-${var.environment}"
      instance_types = [var.instance_type]

      min_size     = var.min_nodes
      max_size     = var.max_nodes
      desired_size = var.min_nodes

      labels = {
        workload = "general"
      }

      # Use spot instances for dev
      capacity_type = var.environment == "dev" ? "SPOT" : "ON_DEMAND"

      # Enable autoscaling
      enable_monitoring = true

      tags = merge(
        var.tags,
        {
          NodeGroup = "general"
        }
      )
    }

    # GPU nodes (if enabled)
    gpu = var.enable_gpu ? {
      name           = "gpu-${var.environment}"
      instance_types = ["g4dn.xlarge"]

      min_size     = 0
      max_size     = 3
      desired_size = 0

      labels = {
        workload    = "gpu"
        nvidia.com/gpu = "true"
      }

      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]

      tags = merge(
        var.tags,
        {
          NodeGroup = "gpu"
        }
      )
    } : {}
  }

  # Cluster security group rules
  cluster_security_group_additional_rules = {
    ingress_nodes_ephemeral_ports_tcp = {
      description                = "Nodes on ephemeral ports"
      protocol                   = "tcp"
      from_port                  = 1025
      to_port                    = 65535
      type                       = "ingress"
      source_node_security_group = true
    }
  }

  tags = var.tags
}

# Install AWS Load Balancer Controller
resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.6.0"

  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  depends_on = [module.eks]
}

# Install Cluster Autoscaler
resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"
  version    = "9.29.0"

  set {
    name  = "autoDiscovery.clusterName"
    value = module.eks.cluster_name
  }

  set {
    name  = "awsRegion"
    value = var.region
  }

  depends_on = [module.eks]
}
```

```hcl
# modules/kubernetes/aws/variables.tf

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "instance_type" {
  description = "EC2 instance type for nodes"
  type        = string
  default     = "t3.medium"
}

variable "min_nodes" {
  description = "Minimum number of nodes"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of nodes"
  type        = number
  default     = 5
}

variable "enable_gpu" {
  description = "Enable GPU node group"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
```

```hcl
# modules/kubernetes/aws/outputs.tf

output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Cluster CA certificate"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}
```

**验收标准：**
- [ ] 成功部署 EKS 集群。
- [ ] 配置具有公共及私有子网的 VPC。
- [ ] 节点组具备自动扩缩容能力。
- [ ] GPU 节点（可选）。
- [ ] 已安装 AWS Load Balancer Controller。
- [ ] 已配置 Cluster Autoscaler。

---

### 任务 3：GCP GKE 模块（5–6 小时）

```hcl
# modules/kubernetes/gcp/main.tf

# TODO: Implement GCP GKE cluster

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "${var.project_name}-${var.environment}-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "${var.project_name}-${var.environment}-subnet"
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc.id
  project       = var.project_id

  # Enable private IP Google access
  private_ip_google_access = true

  # Secondary IP ranges for pods and services
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }
}

# Cloud NAT for private nodes
resource "google_compute_router" "router" {
  name    = "${var.project_name}-${var.environment}-router"
  region  = var.region
  network = google_compute_network.vpc.id
  project = var.project_id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.project_name}-${var.environment}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  project                            = var.project_id
}

# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = "${var.project_name}-${var.environment}"
  location = var.region
  project  = var.project_id

  # Regional cluster for HA
  node_locations = var.node_zones

  # We can't create a cluster with no node pool
  # So we create smallest possible default pool and immediately delete it
  remove_default_node_pool = true
  initial_node_count       = 1

  # Kubernetes version
  min_master_version = var.kubernetes_version

  # Network configuration
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  # IP allocation for pods and services
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = var.master_cidr
  }

  # Master authorized networks
  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.master_authorized_networks
      content {
        cidr_block   = cidr_blocks.value.cidr_block
        display_name = cidr_blocks.value.display_name
      }
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Cluster addons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = false
    }
    gcp_filestore_csi_driver_config {
      enabled = true
    }
  }

  # Network policy
  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # Maintenance window
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }

  # Monitoring and logging (Cloud Operations)
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  # Cluster autoscaling
  cluster_autoscaling {
    enabled = true
    resource_limits {
      resource_type = "cpu"
      minimum       = var.min_nodes * 2
      maximum       = var.max_nodes * 4
    }
    resource_limits {
      resource_type = "memory"
      minimum       = var.min_nodes * 4
      maximum       = var.max_nodes * 16
    }
  }
}

# General purpose node pool
resource "google_container_node_pool" "general" {
  name       = "general-${var.environment}"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  project    = var.project_id
  node_count = var.min_nodes

  # Autoscaling
  autoscaling {
    min_node_count = var.min_nodes
    max_node_count = var.max_nodes
  }

  # Node configuration
  node_config {
    machine_type = var.machine_type
    disk_size_gb = 100
    disk_type    = "pd-standard"

    # Use preemptible VMs for dev
    preemptible = var.environment == "dev" ? true : false

    # OAuth scopes
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      workload = "general"
    }

    tags = ["gke-node", "${var.project_name}-${var.environment}"]

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  # Node pool management
  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

# GPU node pool (if enabled)
resource "google_container_node_pool" "gpu" {
  count = var.enable_gpu ? 1 : 0

  name       = "gpu-${var.environment}"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  project    = var.project_id
  node_count = 0

  autoscaling {
    min_node_count = 0
    max_node_count = 3
  }

  node_config {
    machine_type = "n1-standard-4"

    # GPU accelerator
    guest_accelerator {
      type  = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "DEFAULT"
      }
    }

    disk_size_gb = 100
    disk_type    = "pd-standard"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      workload = "gpu"
    }

    taint {
      key    = "nvidia.com/gpu"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    tags = ["gke-gpu-node", "${var.project_name}-${var.environment}"]

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```

**验收标准：**
- [ ] 成功部署 GKE 集群。
- [ ] 配置具有私有集群的 VPC。
- [ ] 节点池具备自动扩缩容能力。
- [ ] GPU 节点（可选）。
- [ ] 启用 Workload Identity。
- [ ] 集成 Cloud Operations（日志/监控）。

---

### 任务 4：Azure AKS 模块（5–6 小时）

```hcl
# modules/kubernetes/azure/main.tf

# TODO: Implement Azure AKS cluster

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.region
  tags     = var.tags
}

# Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "${var.project_name}-${var.environment}-vnet"
  address_space       = [var.vnet_cidr]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tags                = var.tags
}

# Subnet for AKS
resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.aks_subnet_cidr]
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "${var.project_name}-${var.environment}"

  kubernetes_version = var.kubernetes_version

  # Default node pool
  default_node_pool {
    name                = "general"
    node_count          = var.min_nodes
    vm_size             = var.vm_size
    vnet_subnet_id      = azurerm_subnet.aks.id
    enable_auto_scaling = true
    min_count           = var.min_nodes
    max_count           = var.max_nodes
    os_disk_size_gb     = 100

    # Use spot instances for dev
    priority        = var.environment == "dev" ? "Spot" : "Regular"
    eviction_policy = var.environment == "dev" ? "Delete" : null
    spot_max_price  = var.environment == "dev" ? -1 : null

    node_labels = {
      workload = "general"
    }

    tags = var.tags
  }

  # Managed Identity
  identity {
    type = "SystemAssigned"
  }

  # Network profile
  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    outbound_type     = "loadBalancer"
  }

  # Azure Active Directory integration
  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = var.admin_group_ids
  }

  # Monitoring
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  }

  # Auto-scaler profile
  auto_scaler_profile {
    balance_similar_node_groups      = true
    expander                          = "least-waste"
    max_graceful_termination_sec      = 600
    max_node_provision_time           = "15m"
    scale_down_delay_after_add        = "10m"
    scale_down_unneeded               = "10m"
    scale_down_unready                = "20m"
    scale_down_utilization_threshold  = 0.5
    scan_interval                     = "10s"
    skip_nodes_with_local_storage     = false
    skip_nodes_with_system_pods       = true
  }

  tags = var.tags
}

# GPU Node Pool (if enabled)
resource "azurerm_kubernetes_cluster_node_pool" "gpu" {
  count = var.enable_gpu ? 1 : 0

  name                  = "gpu"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks.id
  vm_size               = "Standard_NC6s_v3"  # Tesla V100
  node_count            = 0

  enable_auto_scaling = true
  min_count           = 0
  max_count           = 3

  os_disk_size_gb = 100
  vnet_subnet_id  = azurerm_subnet.aks.id

  node_labels = {
    workload = "gpu"
  }

  node_taints = [
    "nvidia.com/gpu=true:NoSchedule"
  ]

  tags = var.tags
}

# Log Analytics Workspace for monitoring
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "${var.project_name}-${var.environment}-logs"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.tags
}
```

**验收标准：**
- [ ] 成功部署 AKS 集群。
- [ ] 配置具有子网的 VNet。
- [ ] 节点池具备自动扩缩容能力。
- [ ] GPU 节点（可选）。
- [ ] Azure AD RBAC。
- [ ] 集成 Log Analytics。

---

### 任务 5：存储、数据库、缓存模块（6–7 小时）

为每个云平台创建存储、数据库与缓存模块（简化示例）：

```hcl
# modules/storage/aws/main.tf

resource "aws_s3_bucket" "ml_data" {
  bucket = "${var.project_name}-${var.environment}-ml-data"
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "ml_data" {
  bucket = aws_s3_bucket.ml_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ml_data" {
  bucket = aws_s3_bucket.ml_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

```hcl
# modules/database/aws/main.tf

resource "aws_db_instance" "metadata" {
  identifier = "${var.project_name}-${var.environment}"

  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.instance_class

  allocated_storage     = var.storage_size
  max_allocated_storage = var.storage_size * 2

  db_name  = "mlmetadata"
  username = var.db_username
  password = var.db_password

  # Multi-AZ for prod
  multi_az               = var.environment == "prod"
  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.db.name

  # Backups
  backup_retention_period = var.environment == "prod" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  # Encryption
  storage_encrypted = true

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  tags = var.tags
}
```

为 GCP 和 Azure 创建类似的模块……

**验收标准：**
- [ ] 已创建存储桶/容器。
- [ ] 已部署托管数据库。
- [ ] 已部署 Redis 缓存实例。
- [ ] 全部组件按需求配置加密及高可用性。

---

### 任务 6：部署脚本与测试（4–5 小时）

```python
# deploy.py

import click
import subprocess
import json
from pathlib import Path
from typing import Dict, List

class MultiCloudDeployer:
    """Deploy ML infrastructure across clouds"""

    def __init__(self, environment: str):
        self.environment = environment
        self.terraform_dir = Path("terraform")

    def deploy(
        self,
        clouds: List[str],
        auto_approve: bool = False
    ) -> Dict[str, bool]:
        """
        TODO: Deploy to selected clouds

        ```python
        results = {}

        for cloud in clouds:
            click.echo(f"Deploying to {cloud}...")

            # Initialize Terraform
            self._terraform_init(cloud)

            # Plan
            self._terraform_plan(cloud)

            # Apply
            if auto_approve or click.confirm(f"Apply changes to {cloud}?"):
                success = self._terraform_apply(cloud, auto_approve)
                results[cloud] = success
            else:
                results[cloud] = False

        return results
        ```
        """
        pass

    def destroy(
        self,
        clouds: List[str],
        auto_approve: bool = False
    ) -> Dict[str, bool]:
        """TODO: Destroy infrastructure"""
        pass

    def output(self, cloud: str) -> Dict:
        """TODO: Get Terraform outputs"""
        pass

    def _terraform_init(self, cloud: str) -> None:
        """TODO: Run terraform init"""
        pass

    def _terraform_plan(self, cloud: str) -> None:
        """TODO: Run terraform plan"""
        pass

    def _terraform_apply(self, cloud: str, auto_approve: bool) -> bool:
        """TODO: Run terraform apply"""
        pass

@click.group()
def cli():
    """Multi-cloud ML infrastructure deployment"""
    pass

@cli.command()
@click.option('--clouds', '-c', multiple=True, type=click.Choice(['aws', 'gcp', 'azure']))
@click.option('--environment', '-e', default='dev')
@click.option('--auto-approve', is_flag=True)
def deploy(clouds, environment, auto_approve):
    """Deploy infrastructure to clouds"""
    deployer = MultiCloudDeployer(environment)
    results = deployer.deploy(list(clouds) or ['aws', 'gcp', 'azure'], auto_approve)

    click.echo("\nDeployment Results:")
    for cloud, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        click.echo(f"{cloud}: {status}")

if __name__ == "__main__":
    cli()
```

**验收标准：**
- [ ] 部署脚本自动执行 Terraform。
- [ ] 支持多云部署。
- [ ] 验证部署结果。
- [ ] 错误处理清晰。

---

## 交付物

1. **Terraform 模块**
   - Kubernetes（AWS/GCP/Azure）。
   - 存储（AWS/GCP/Azure）。
   - 数据库（AWS/GCP/Azure）。
   - 缓存（AWS/GCP/Azure）。
   - 网络（AWS/GCP/Azure）。

2. **部署工具**
   - Python 部署脚本。
   - 配置文件。
   - 文档。

3. **测试**
   - Terraform 验证测试。
   - 集成测试。

4. **文档**
   - 配置指南。
   - 架构图。
   - 成本估算。

---

## 评分标准

| 标准 | 权重 |
|---|---|
| **完整性** | 30% |
| **代码质量** | 25% |
| **安全** | 20% |
| **文档** | 15% |
| **测试** | 10% |

**及格：** 70% 以上。
**优秀：** 90% 以上。

---

## 预计时长

- 任务 1：3–4 小时。
- 任务 2：5–6 小时。
- 任务 3：5–6 小时。
- 任务 4：5–6 小时。
- 任务 5：6–7 小时。
- 任务 6：4–5 小时。
- 测试：4–5 小时。
- 文档：3–4 小时。

**合计：** 35–43 小时。

---

**本练习通过 IaC 最佳实践教授面向生产的多云基础设施部署。**

> 译注：各云平台的 Provider、网络及托管服务接口并不相同，通常需要公共抽象加独立实现，而非完全相同的资源定义。原文列出的 Azure AD 等名称及托管缓存产品可能随时间演进，应核对实际版本。托管 Kubernetes、NAT Gateway、数据库及 GPU 可能产生显著费用。预算告警不是费用硬上限；部署前应审查 Plan、账号、区域、权限、预算及清理策略。原始代码块及 TODO 保留，未实际供应云资源。
