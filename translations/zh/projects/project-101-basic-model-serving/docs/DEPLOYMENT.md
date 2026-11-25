# 部署指南——项目 01：基础模型服务

## 前置条件

- 已安装 Docker。
- Kubernetes 集群（minikube、kind 或云集群）。
- 已配置 kubectl。
- Python 3.11+。

## 部署方式

1. [本地开发（Docker Compose）](#方式-1-本地开发-docker-compose)
2. [Kubernetes（Minikube）](#方式-2-kubernetes-本地-minikube)
3. [云 Kubernetes（GKE/EKS/AKS）](#方式-3-云-kubernetes-生产环境)

---

## 方式 1：本地开发（Docker Compose）

### 步骤 1：克隆并设置

```bash
cd projects/project-101-basic-model-serving

# Create .env file
cp .env.example .env
# Edit .env as needed

# Download pre-trained model (or use model download script)
mkdir -p models
# TODO: Add model download script
```

### 步骤 2：构建与运行

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Verify services
curl http://localhost:8000/health
curl http://localhost:9090  # Prometheus
open http://localhost:3000  # Grafana (admin/admin)
```

### 步骤 3：测试 API

```bash
# Test prediction
curl -X POST "http://localhost:8000/v1/predict" \
  -F "file=@test_image.jpg"

# Check metrics
curl http://localhost:8000/metrics
```

### 步骤 4：停止服务

```bash
docker-compose down
# Or keep data: docker-compose down --volumes
```

---

## 方式 2：Kubernetes（本地 Minikube）

### 步骤 1：启动 Minikube

```bash
# Start minikube with enough resources
minikube start --cpus=4 --memory=8192

# Enable addons
minikube addons enable metrics-server
minikube addons enable ingress

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

### 步骤 2：构建 Docker 镜像

```bash
# Build image
docker build -t ml-api:v1 .

# Load image into minikube
minikube image load ml-api:v1

# Verify
minikube image ls | grep ml-api
```

### 步骤 3：部署至 Kubernetes

```bash
# Create namespace
kubectl create namespace ml-serving

# Apply ConfigMap
kubectl apply -f kubernetes/configmap.yaml -n ml-serving

# Deploy application
kubectl apply -f kubernetes/deployment.yaml -n ml-serving

# Expose service
kubectl apply -f kubernetes/service.yaml -n ml-serving

# Setup autoscaling
kubectl apply -f kubernetes/hpa.yaml -n ml-serving
```

### 步骤 4：验证部署

```bash
# Check pods
kubectl get pods -n ml-serving
kubectl describe pod <pod-name> -n ml-serving

# Check service
kubectl get svc -n ml-serving

# Check HPA
kubectl get hpa -n ml-serving

# View logs
kubectl logs -f deployment/ml-api -n ml-serving
```

### 步骤 5：访问 API

```bash
# Get service URL
minikube service ml-api-service -n ml-serving --url

# Or use port-forward
kubectl port-forward -n ml-serving svc/ml-api-service 8000:80

# Test
curl http://localhost:8000/health
```

### 步骤 6：部署监控

```bash
# Install Prometheus (using Helm)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Login: admin / prom-operator
```

### 步骤 7：清理

```bash
kubectl delete namespace ml-serving
helm uninstall prometheus -n monitoring
minikube stop
# Or: minikube delete
```

---

## 方式 3：云 Kubernetes（生产环境）

### 步骤 3a：Google Kubernetes Engine（GKE）

```bash
# Set project
export PROJECT_ID=your-project-id
export CLUSTER_NAME=ml-cluster
export REGION=us-central1

gcloud config set project $PROJECT_ID

# Create GKE cluster
gcloud container clusters create $CLUSTER_NAME \
  --region=$REGION \
  --machine-type=n1-standard-2 \
  --num-nodes=2 \
  --enable-autoscaling --min-nodes=1 --max-nodes=5 \
  --enable-stackdriver-kubernetes

# Get credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# Verify
kubectl get nodes
```

**构建并推送镜像：**
```bash
# Build for GCP
docker build -t gcr.io/$PROJECT_ID/ml-api:v1 .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/ml-api:v1

# Update deployment.yaml to use gcr.io image
```

**部署：**
```bash
kubectl apply -f kubernetes/ -n ml-serving
kubectl get svc -n ml-serving  # Get external IP
```

**清理：**
```bash
gcloud container clusters delete $CLUSTER_NAME --region=$REGION
```

### 步骤 3b：Amazon EKS（AWS）

```bash
# Install eksctl
# See: https://eksctl.io/installation/

# Create cluster
eksctl create cluster \
  --name ml-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 5 \
  --managed

# Get credentials (automatic with eksctl)
kubectl get nodes
```

**构建并推送镜像：**
```bash
# Create ECR repository
aws ecr create-repository --repository-name ml-api --region us-east-1

# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/ml-api:v1 .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ml-api:v1
```

**部署：**
```bash
kubectl apply -f kubernetes/ -n ml-serving
kubectl get svc -n ml-serving  # Get LoadBalancer DNS
```

**清理：**
```bash
eksctl delete cluster --name ml-cluster --region us-east-1
```

### 步骤 3c：Azure Kubernetes Service（AKS）

```bash
# Create resource group
az group create --name ml-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group ml-rg \
  --name ml-cluster \
  --node-count 2 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group ml-rg --name ml-cluster
kubectl get nodes
```

**构建并推送镜像：**
```bash
# Create ACR
az acr create --resource-group ml-rg --name mlacr --sku Basic

# Build and push
az acr build --registry mlacr --image ml-api:v1 .
```

**部署：**
```bash
kubectl apply -f kubernetes/ -n ml-serving
kubectl get svc -n ml-serving
```

**清理：**
```bash
az group delete --name ml-rg --yes --no-wait
```

---

## 故障排查

### Pod 未启动

```bash
# Check pod status
kubectl get pods -n ml-serving
kubectl describe pod <pod-name> -n ml-serving

# Common issues:
# 1. Image pull error: Check image name and registry access
# 2. CrashLoopBackOff: Check logs for errors
# 3. Insufficient resources: Check node resources
```

### 无法访问服务

```bash
# Check service
kubectl get svc -n ml-serving
kubectl describe svc ml-api-service -n ml-serving

# Check endpoints
kubectl get endpoints -n ml-serving

# For LoadBalancer, ensure cloud provider supports it
# Or use NodePort/port-forward for testing
```

### 内存使用量高

```bash
# Check resource usage
kubectl top pods -n ml-serving

# Adjust resource limits in deployment.yaml
# Optimize model loading (lazy loading, model quantization)
```

### 推理缓慢

```bash
# Check logs for inference time
kubectl logs -n ml-serving deployment/ml-api | grep inference_time

# Optimize:
# 1. Use GPU instances
# 2. Enable model caching
# 3. Implement request batching
# 4. Use model optimization (ONNX, TensorRT)
```

---

## 监控与日志

### 查看日志

```bash
# Real-time logs
kubectl logs -f deployment/ml-api -n ml-serving

# Logs from specific pod
kubectl logs <pod-name> -n ml-serving

# Logs from previous crashed container
kubectl logs <pod-name> -n ml-serving --previous
```

### 检查指标

```bash
# Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Visit: http://localhost:9090/targets

# Query metrics
# predictions_total
# prediction_duration_seconds
```

### 访问 Grafana

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Visit: http://localhost:3000
# Import dashboard from monitoring/grafana/dashboards/
```

---

## CI/CD 集成

### GitHub Actions（参见 .github/workflows/ci-cd.yaml）

自动执行：
1. PR 时运行测试。
2. 合并到 main 时构建 Docker 镜像。
3. 推送至容器镜像仓库。
4. 部署至预发布/生产环境。

**设置：**
```bash
# Add secrets to GitHub repo
# - DOCKER_USERNAME
# - DOCKER_PASSWORD
# - KUBE_CONFIG (base64 encoded)
```

---

## 生产检查清单

部署至生产前：

- [ ] 配置资源限制（CPU、内存）。
- [ ] 配置健康检查（Liveness、Readiness）。
- [ ] 设置监控与告警。
- [ ] 配置日志聚合。
- [ ] 测试自动扩缩容规则。
- [ ] 记录灾难恢复方案。
- [ ] 安全加固（非 root 用户、网络策略）。
- [ ] 启用成本监控。
- [ ] 更新文档。
- [ ] 完成负载测试。
- [ ] 测试回滚流程。

---

## 下一步

1. 本地部署与测试。
2. 部署至 Kubernetes 并验证。
3. 搭建监控与告警。
4. 运行负载测试。
5. 记录问题与优化。

如有疑问，参见[故障排查指南](./TROUBLESHOOTING.md)。

> 译注：云部署可能产生费用，执行创建或删除命令前确认账号、集群、命名空间与资源归属。原始代码保留，未实际部署。
