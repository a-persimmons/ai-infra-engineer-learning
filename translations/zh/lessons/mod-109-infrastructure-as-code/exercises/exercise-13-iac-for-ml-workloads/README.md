# 练习 13：面向 AI/ML 工作负载的 IaC

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** mod-109 的全部前置练习

## 目标

为机器学习工作负载构建完整的 IaC 项目，整合此前所有内容：VPC、带 GPU 节点的 EKS、用于存储产物的 S3 存储桶、通过 IRSA 实现 IAM、用于管理密钥的 Vault，以及 ArgoCD 初始化。最终状态：执行 `terraform apply` 与 `argocd app sync` 后得到可用的机器学习服务集群。

## 要求

1. Terraform 创建：VPC、EKS（CPU 与 GPU 节点池）、S3 存储桶、IAM 角色、IRSA 绑定、ECR 仓库。
2. ArgoCD 初始化安装：ingress-nginx、cert-manager、external-secrets、NVIDIA Device Plugin、kube-prometheus-stack。
3. 应用清单部署：iris-api、vLLM 服务、监控仪表盘。
4. 编写从零到模型 API 运行的 `ramp_up.md`。

## 分步操作

### 步骤 1——规划拓扑（15 分钟）

```
ml-platform/
├── terraform/
│   ├── modules/        (vpc, eks, s3, irsa from earlier exercises)
│   └── envs/{dev,staging,prod}/
└── manifests/
    ├── bootstrap/      (Apps for ingress, cert-manager, ESO, device plugin, monitoring)
    ├── services/
    │   ├── iris-api/
    │   └── vllm/
    └── monitoring/
```

### 步骤 2——Terraform 组合（60 分钟）
```hcl
# envs/dev/main.tf
module "vpc" {
  source = "../../modules/vpc"
  name   = "ml-dev"
  cidr_block = "10.20.0.0/16"
  azs        = ["us-west-2a", "us-west-2b"]
}

module "eks" {
  source = "../../modules/eks"
  cluster_name = "ml-dev"
  kubernetes_version = "1.30"
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  
  node_groups = {
    general = { instance_types = ["m6i.large"], desired_size = 2, min_size = 2, max_size = 6 }
    gpu = {
      instance_types = ["g5.xlarge"]
      desired_size = 0     # scaled by Karpenter
      min_size = 0
      max_size = 4
      labels = { "nvidia.com/gpu.present" = "true" }
      taints = [{ key = "nvidia.com/gpu", value = "present", effect = "NO_SCHEDULE" }]
    }
  }
}

module "s3_artifacts" {
  source = "../../modules/s3"
  bucket_name = "ml-dev-artifacts"
  versioning  = true
  encryption  = true
}

module "iris_irsa" {
  source = "../../modules/irsa"
  role_name = "iris-api-${terraform.workspace}"
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_issuer_url   = module.eks.oidc_issuer_url
  namespace            = "iris"
  service_account_name = "iris-api"
  managed_policy_arns = []
  inline_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["s3:GetObject"]
      Resource = "${module.s3_artifacts.arn}/*"
    }]
  })
}
```

### 步骤 3——ArgoCD 初始化（45 分钟）
执行 `terraform apply` 后：
```bash
aws eks update-kubeconfig --name ml-dev
kubectl create ns argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply root app — points at manifests/bootstrap which contains Applications for everything else
kubectl apply -f manifests/argocd/root-bootstrap.yaml
```

`manifests/bootstrap/` 包含以下 Application 清单：

- ingress-nginx
- cert-manager
- external-secrets-operator
- nvidia-device-plugin
- kube-prometheus-stack
- karpenter

ArgoCD 安装上述全部组件。

### 步骤 4——服务清单（30 分钟）

`manifests/services/iris-api/`：

- Deployment，配置 `nodeSelector: kubernetes.io/arch=amd64`（CPU）。
- Service。
- Ingress（cert-manager 自动签发 TLS 证书）。
- 从 Vault 获取数据库凭据的 ExternalSecret。

`manifests/services/vllm/`：

- Deployment，配置 `nodeSelector: nvidia.com/gpu.present=true`，并设置对应污点的容忍度。
- Service。
- 用于 Prometheus 的 ServiceMonitor。

### 步骤 5——监控（15 分钟）
`manifests/monitoring/grafana-dashboards/`——通过自动发现 Sidecar 将 ConfigMap 加载到 Grafana 中。

### 步骤 6——端到端启动（15 分钟）

`ramp_up.md`：

1. `cd terraform/envs/dev && terraform init && terraform apply`
2. `aws eks update-kubeconfig --name ml-dev`
3. `kubectl apply -f manifests/argocd/root-bootstrap.yaml`
4. 等待全部 Application 变为绿色：`argocd app list`（约 10 分钟）
5. `curl https://iris-dev.example.com/health` → 200

总计：原文预计从零到上线约 30 分钟。

## 交付物

1. 可用的 Terraform 与清单仓库。
2. 在 dev 中成功启动。
3. 分步操作文档 `ramp_up.md`。
4. 包含架构图和说明的 `ARCHITECTURE.md`。

## 验证

- [ ] `terraform apply` 成功。
- [ ] 所有 ArgoCD Application 均达到 Synced + Healthy。
- [ ] iris-api 端点返回预测结果。
- [ ] vLLM 端点提供 LLM 补全。
- [ ] Grafana 显示来自两个服务的指标。

## 拓展目标

- 根据练习 10 添加**多环境晋升**。
- 根据练习 08 添加**策略即代码**，对 Terraform plan 和 Kubernetes 清单实施门禁。
- 根据练习 11 添加**成本仪表盘**。

## 常见陷阱

- **GPU 节点调度过晚**——Karpenter 必须先供应节点；首个 GPU Pod 可能需要约五分钟。
- **TLS 证书一直处于 Pending**——cert-manager 验证前必须设置域名的 DNS A 记录（具体取决于验证方式）。
- **缺少 IRSA OIDC 信任**——每个集群需执行一次配置；上述模块负责处理，但仍应验证。
- **组件众多**——先在全新的 kind 集群中测试初始化流程，迭代完成后再部署到云端。

> 译注：amd64 标签只代表 CPU 架构，并不能单独排除 GPU 节点；实际部署时需要相应节点池标签与污点策略。部署耗时应以实际测量为准。
