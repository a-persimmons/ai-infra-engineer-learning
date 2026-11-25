# 实验 02：使用 Terraform 创建 EKS 集群

**时长：** 90 分钟  **前置条件：** 实验 01 的 VPC 已运行；Terraform 1.6+；AWS CLI。

## 目标

使用官方 AWS EKS Terraform 模块创建包含托管节点组的 EKS 集群，并使 kubectl 能够访问该集群。

## 步骤

### 1. 添加至项目
```hcl
# eks.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "lab-eks"
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id           # from your VPC module (or output of lab-01)
  subnet_ids = module.vpc.private_subnet_ids
  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    general = {
      desired_size = 2
      min_size     = 2
      max_size     = 5
      instance_types = ["m6i.large"]
    }
  }
}

output "cluster_name"     { value = module.eks.cluster_name }
output "cluster_endpoint" { value = module.eks.cluster_endpoint }
```

### 2. 应用
```bash
terraform init -upgrade
terraform plan -out=plan.tfplan
terraform apply plan.tfplan          # ~15-20 minutes
```

### 3. 配置 kubectl
```bash
aws eks update-kubeconfig --name lab-eks --region us-west-2
kubectl get nodes
kubectl get pods -A
```

### 4. 部署工作负载
```bash
kubectl create deploy nginx --image=nginx:1.27 --replicas=2
kubectl expose deploy nginx --port=80 --type=LoadBalancer
kubectl get svc nginx -w                # wait for EXTERNAL-IP
curl http://<external-ip>
```

### 5. 添加 GPU 节点组（可选）
```hcl
gpu = {
  desired_size = 0
  min_size     = 0
  max_size     = 3
  instance_types = ["g4dn.xlarge"]
  labels = { "node.kubernetes.io/instance-type" = "g4dn.xlarge" }
  taints = [{ key = "nvidia.com/gpu", value = "true", effect = "NO_SCHEDULE" }]
}
```

### 6. 安装 NVIDIA device plugin
```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.15.0/nvidia-device-plugin.yml
```

### 7. 销毁
```bash
kubectl delete svc nginx                     # remove ELB FIRST
terraform destroy -auto-approve
```
删除集群还需要约 10 分钟。

## 验证

- [ ] `kubectl get nodes` 显示两个 Ready 节点。
- [ ] Service 获得外部 ELB DNS 名称。
- [ ] `curl` 返回 nginx 欢迎页面。

## 清理

**务必**在执行 `terraform destroy` 之前执行 `kubectl delete svc <type=LoadBalancer>` 所指的清理操作（使用实际 Service 名称），否则可能遗留 ELB。

## 故障排查

- **`Could not connect to cluster`** — `aws-auth` ConfigMap 未更新；模块 v20+ 会处理此问题，较旧版本需要 `kubectl_provider`。
- **节点未加入集群** — 检查安全组规则（eks-cluster-sg → eks-node-sg，端口 1025–65535）。
- **销毁过程卡在子网** — ELB 仍在使用该子网；在控制台中手动删除负载均衡器。
