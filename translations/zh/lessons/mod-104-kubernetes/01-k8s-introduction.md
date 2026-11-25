# 第 01 课：Kubernetes 导论

**时长：** 6 小时
**目标：** 理解 Kubernetes 为什么对 ML 基础设施至关重要、何时使用它，并部署第一个 K8s 集群。

## 欢迎学习 Kubernetes！

你已经掌握了 Docker，并能够将 ML 应用容器化。现在是时候使用 Kubernetes——业界广泛采用的容器编排平台——大规模编排这些容器了。

本课将介绍 Kubernetes 对 ML 基础设施的重要性，探索 Kubernetes 生态，并动手搭建第一个本地集群。

## 容器编排的挑战

### 问题：大规模管理容器

假设你已经将一个 ML 模型服务应用容器化。但接下来：

**场景 1：扩缩容**
- 流量从每秒 100 次请求激增至 10,000 次。
- 需要手动在十台服务器上额外启动 50 个容器。
- 如何分布这些容器？如何负载均衡？

**场景 2：可靠性**
- 一台服务器崩溃，导致五个容器停止运行。
- 如何检测故障并自动重启容器？
- 如何维持期望状态？

**场景 3：更新**
- 需要部署新版本模型。
- 如何在不停机的情况下部署？
- 出现问题时如何回滚？

**场景 4：资源管理**
- 需要提供 100 个不同 ML 模型的服务。
- 每个模型具有不同的 CPU/GPU/内存需求。
- 如何将容器合理地安排到服务器上？

**没有编排系统时，你需要：**
- 自定义容器管理脚本。
- 人工介入处理故障。
- 复杂的负载均衡配置。
- 自行编写调度逻辑。
- 手动进行容量规划。

**这正是 Kubernetes 擅长的领域。**

## 什么是 Kubernetes？

**Kubernetes（K8s）** 是一种开源容器编排平台，可以自动化部署、扩缩容与管理容器化应用。

### 词源

名称源自希腊语 κυβερνήτης（kubernetes），意为「舵手」或「领航员」。缩写 K8s 用数字 8 替代中间的八个字母 ubernete。

### 由 Google 创建，现归 CNCF

- **起源：** Google 内部系统 Borg（原文称已运行 15 年以上）。
- **开源：** 2014 年。
- **捐赠给 CNCF：** 2015 年（Cloud Native Computing Foundation，云原生计算基金会）。
- **现状：** 容器编排领域的事实标准。

### 核心能力

Kubernetes 提供：

1. **自动部署与扩缩容**——声明期望状态，由 K8s 维持。
2. **自愈**——自动替换并重新调度容器化工作负载。
3. **服务发现与负载均衡**——内置网络机制。
4. **存储编排**——自动挂载存储系统。
5. **自动发布与回滚**——支持安全、以零停机为目标的部署。
6. **Secret 与配置管理**——管理敏感数据和配置。
7. **资源优化**——高效地将工作负载装箱调度到节点。

## 为什么 ML 基础设施需要 Kubernetes？

### ML 专用优势

**1. GPU 调度**
```yaml
# Request GPU in pod specification
resources:
  limits:
    nvidia.com/gpu: 1
```
Kubernetes 自动将 Pod 调度到符合要求的 GPU 节点，并管理 GPU 分配。

**2. 可扩展的模型服务**
- 处理变化的流量模式。
- 从一个副本自动扩展至 100 个以上。
- 在模型实例之间进行负载均衡。
- 通过滚动更新发布新模型版本。

**3. 多模型管理**
- 部署 100 个以上不同模型。
- 每个模型独立扩缩容。
- 模型间资源隔离。
- 针对每个模型设置不同资源需求。

**4. 训练任务编排**
- 运行分布式训练任务。
- 故障时自动重试。
- 基于优先级调度。
- 使用可抢占实例降低成本。

**5. 可复现性**
- 基础设施即代码（YAML 清单）。
- 对部署进行版本管理。
- 保持开发、预发布、生产环境一致。

### Kubernetes 上的真实 ML 基础设施案例

以下为原文列举的案例与数字，未独立核实：

**Uber：Michelangelo ML 平台**
- 在 Kubernetes 上部署 1,000 个以上 ML 模型。
- 根据流量模式自动扩缩容。
- 为训练工作负载调度 GPU。
- 为多个团队提供多租户平台。
- **结果：** 部署时间减少 95%。

**Spotify：ML 特征平台**
- 全球 200 个以上 Kubernetes 集群。
- 每天提供数十亿次预测。
- 高峰时段自动扩容（三倍容量）。
- 通过提高资源利用率降低 70% 成本。

**OpenAI：LLM 基础设施**
- Kubernetes 上的大规模 GPU 集群。
- GPT 模型的分布式训练。
- 每秒数千次请求的推理服务。
- 为研究及生产动态分配资源。

**Airbnb：搜索与推荐**
- Kubernetes 上的 500 个以上微服务。
- 用于搜索排序、定价与推荐的 ML 模型。
- 通过金丝雀部署安全更新模型。
- 在十个以上区域进行全球部署。

## Kubernetes 与替代方案比较

### Docker Compose

**Docker Compose：**
```yaml
# docker-compose.yml
services:
  model-server:
    image: my-ml-model:latest
    ports:
      - "8080:8080"
    deploy:
      replicas: 3
```

**限制：**
- 仅限单宿主机（不能跨多台服务器）。
- 无内置的集群级自愈机制。
- 手动扩缩容。
- 负载均衡能力有限。
- 无内置滚动更新编排。

**何时使用 Docker Compose：**
- 开发与测试。
- 单机部署。
- 简单多容器应用。
- 本地 ML 实验。

### Docker Swarm

**Docker Swarm：**
- 内置于 Docker Engine。
- 比 Kubernetes 简单。
- 多宿主机编排。

**限制：**
- 生态较小。
- 社区支持较少。
- 高级功能较少。
- 不是 ML 领域的主流编排标准。

**市场情况：** 原文估计 Kubernetes 在容器编排领域占约 90% 市场份额。

### 云原生服务（AWS ECS、Google Cloud Run）

**优点：**
- 托管服务（较少运维开销）。
- 深度云集成。
- 基础使用场景更简单。

**缺点：**
- 厂商锁定。
- 自定义能力有限。
- 跨云可移植性较弱。
- 大规模场景可能成本较高。

**何时使用 K8s：**
- 需要多云或云平台可移植性。
- 复杂 ML 工作流。
- 大规模（100 个以上服务）。
- 需要充分控制和自定义。

### 比较矩阵

| 功能 | Docker Compose | Docker Swarm | Kubernetes | 云原生（ECS/Run） |
|---|---|---|---|---|
| 多宿主机 | 否 | 是 | 是 | 是 |
| 自愈 | 无集群级自愈 | 基础 | 高级 | 是 |
| 负载均衡 | 基础 | 是 | 高级 | 是 |
| GPU 支持 | 手动配置 | 手动配置 | 通过设备插件等机制 | 依服务而定 |
| 生态 | 小 | 中等 | 庞大 | 特定云平台 |
| 学习曲线 | 容易 | 中等 | 陡峭 | 容易 |
| ML 使用场景 | 开发/测试 | 小规模生产 | 企业 | 简单生产 |
| 软件或服务费用 | 免费 | 免费 | 自托管软件免费 | 按用量付费 |

## 何时使用 Kubernetes，何时不使用？

### 适合使用 Kubernetes 的场景

**1. 扩展需求**
- 每秒提供 1,000 次以上请求。
- 需要从一个实例扩展至 100 个以上。
- 流量模式多变。

**2. 高可用性需求**
- 可用时间要求达到 99.9% 以上。
- 自动故障转移至关重要。
- 多区域部署。

**3. 复杂基础设施**
- 十个以上微服务。
- 多个 ML 模型。
- 混合训练与服务工作负载。

**4. 团队规模**
- 五名以上能够学习 K8s 的工程师。
- 专门的基础设施团队。
- 组织已决定采用云原生技术。

**5. 多云或可移植性**
- 在多个云上运行。
- 避免厂商锁定。
- 本地与云端混合部署。

**6. 资源优化**
- GPU 成本较高（需要高效调度）。
- 工作负载变化较大。
- 多租户平台。

### 不适合使用 Kubernetes 的场景

**1. 简单应用**
- 单个模型，低流量（每秒不足 100 次请求）。
- 没有扩展需求。
- 原型与实验。

**2. 小团队**
- 一至两人团队。
- 没有时间学习 K8s 的复杂机制。
- 运维资源有限。

**3. 云原生替代方案已足够**
- 使用 AWS Lambda 进行简单推理。
- 使用 Google Cloud Run 运行容器化应用。
- 使用 SageMaker 提供托管 ML。

**4. 无服务器方案可满足需求**
- 事件驱动的工作负载。
- 间歇性使用。
- 可以接受冷启动延迟。

**5. 开发/测试**
- Docker Compose 更简单。
- 本地开发环境。
- 个人实验。

### 决策框架

```
Is your app containerized?
├─ No → Containerize first (Module 03)
└─ Yes
    ├─ Need multi-host orchestration?
    │   ├─ No → Use Docker Compose
    │   └─ Yes
    │       ├─ Simple use case + cloud-native acceptable?
    │       │   ├─ Yes → Consider Cloud Run, ECS, etc.
    │       │   └─ No → Kubernetes
    │       └─ Need multi-cloud or advanced features?
    │           └─ Yes → Kubernetes
```

> 译注：上述请求量、服务数、团队规模和市场份额均为原文经验估计，不是 Kubernetes 的适用门槛。自托管软件免费不意味着集群运行免费；GPU 支持与成本取决于具体服务。应依据实际负载、运维能力、故障域与总拥有成本决策。

## Kubernetes 生态（CNCF Landscape）

Kubernetes 是核心，但其生态非常庞大：

### 核心基础设施
- **Kubernetes：** 编排。
- **containerd/CRI-O：** 容器运行时。
- **etcd：** 分布式键值存储。

### 网络
- **Calico、Cilium、Flannel：** CNI 插件。
- **Istio、Linkerd：** 服务网格。
- **Ingress Nginx、Traefik：** Ingress Controller。

### 存储
- **Rook、Longhorn：** 云原生存储。
- **MinIO：** 对象存储。
- **CSI 驱动：** 云存储集成。

### 可观测性
- **Prometheus：** 指标。
- **Grafana：** 可视化。
- **Jaeger、Zipkin：** 分布式链路追踪。
- **Fluentd、Loki：** 日志聚合。

### CI/CD
- **ArgoCD、Flux：** GitOps。
- **Tekton：** 云原生 CI/CD。
- **Spinnaker：** 多云部署。

### ML 专用工具
- **Kubeflow：** 端到端 ML 平台。
- **KServe：** 模型服务。
- **Seldon Core：** ML 部署。
- **Argo Workflows：** 基于 DAG 的工作流。

### 安全
- **Falco：** 运行时安全。
- **OPA（Open Policy Agent）：** 策略执行。
- **cert-manager：** 证书管理。
- **Vault：** Secret 管理。

## Kubernetes 发行版

不同方案满足不同需求：

### 本地开发
- **minikube：** 用于学习的单节点集群（也支持多节点）。
- **kind（Kubernetes in Docker）：** 在 Docker 中运行多节点集群。
- **k3s：** 轻量级 K8s（适合边缘/物联网）。
- **Docker Desktop：** 内置 K8s（macOS/Windows）。
- **MicroK8s：** 轻量、精简的 K8s。

### 生产环境（云端）
- **GKE（Google Kubernetes Engine）：** Google Cloud。
- **EKS（Elastic Kubernetes Service）：** AWS。
- **AKS（Azure Kubernetes Service）：** Microsoft Azure。
- **DOKS（DigitalOcean Kubernetes）：** DigitalOcean。
- **LKE（Linode Kubernetes Engine）：** Linode。

### 本地部署
- **OpenShift：** Red Hat 企业级 Kubernetes。
- **Rancher：** 多集群管理。
- **Tanzu：** VMware Kubernetes 平台。
- **Charmed Kubernetes：** Canonical 发行版。

### ML 工作负载
- **NVIDIA DGX Cloud：** GPU 优化的基础设施方案。
- **Run:ai：** K8s 上的 GPU 虚拟化与调度。
- **Determined AI：** K8s 上的 ML 训练平台。

## 安装：本地 Kubernetes 集群

学习与开发时，我们将使用 **minikube**（原文推荐）或 **kind**（较快、便于模拟生产结构）。

### 选项 1：Minikube（推荐初学者）

**前置条件：**
- 已安装 Docker。
- 至少两核 CPU、4GB 可用内存。
- 支持虚拟化。

**安装（macOS）：**
```bash
# Install minikube
brew install minikube

# Start cluster
minikube start

# Verify
kubectl cluster-info
kubectl get nodes
```

**安装（Linux）：**
```bash
# Download and install
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start cluster
minikube start

# Verify
kubectl cluster-info
```

**安装（Windows）：**
```powershell
# Using Chocolatey
choco install minikube

# Or download installer from GitHub
# https://github.com/kubernetes/minikube/releases

# Start cluster
minikube start
```

### 选项 2：kind（Kubernetes in Docker）

**前置条件：**
- Docker 已安装并正在运行。
- 已安装 kubectl。

**安装：**
```bash
# macOS
brew install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Windows
choco install kind

# Create cluster
kind create cluster --name ml-learning

# Verify
kubectl cluster-info --context kind-ml-learning
```

### 选项 3：Docker Desktop Kubernetes

**macOS/Windows 用户的简便方式：**

1. 安装 Docker Desktop。
2. Settings → Kubernetes → Enable Kubernetes。
3. Apply & Restart。
4. 验证：`kubectl cluster-info`。

### 验证安装

```bash
# Check kubectl version
kubectl version --client

# Check cluster info
kubectl cluster-info

# Check nodes
kubectl get nodes

# Expected output:
# NAME       STATUS   ROLES           AGE   VERSION
# minikube   Ready    control-plane   1m    v1.28.3
```

## 动手实践：将第一个应用部署到 Kubernetes

下面将一个简单 ML 推理 API 部署至 Kubernetes。

### 步骤 1：创建简单 Flask ML API

**app.py：**
```python
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # Simulate ML prediction
    input_data = np.array(data['features'])
    prediction = float(np.sum(input_data))  # Dummy model

    return jsonify({
        'prediction': prediction,
        'model_version': 'v1.0'
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

**requirements.txt：**
```
flask==3.0.0
numpy==1.26.0
```

**Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8080

CMD ["python", "app.py"]
```

### 步骤 2：构建并推送 Docker 镜像

```bash
# Build image
docker build -t ml-api:v1 .

# Test locally
docker run -p 8080:8080 ml-api:v1

# Test endpoint (in another terminal)
curl -X POST http://localhost:8080/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [1, 2, 3, 4, 5]}'

# Stop container
docker stop $(docker ps -q --filter ancestor=ml-api:v1)

# Load image into minikube (if using minikube)
minikube image load ml-api:v1

# Or for kind
kind load docker-image ml-api:v1 --name ml-learning
```

### 步骤 3：创建 Kubernetes Deployment

**deployment.yaml：**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api
  labels:
    app: ml-api
spec:
  replicas: 3  # Run 3 copies
  selector:
    matchLabels:
      app: ml-api
  template:
    metadata:
      labels:
        app: ml-api
    spec:
      containers:
      - name: ml-api
        image: ml-api:v1
        imagePullPolicy: Never  # Use local image
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

**应用 Deployment：**
```bash
kubectl apply -f deployment.yaml

# Check deployment
kubectl get deployments

# Check pods
kubectl get pods

# Expected output:
# NAME                      READY   STATUS    RESTARTS   AGE
# ml-api-xxxxx-xxxxx        1/1     Running   0          10s
# ml-api-xxxxx-xxxxx        1/1     Running   0          10s
# ml-api-xxxxx-xxxxx        1/1     Running   0          10s
```

### 步骤 4：创建用于负载均衡的 Service

**service.yaml：**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-service
spec:
  type: LoadBalancer  # Expose externally
  selector:
    app: ml-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

**应用 Service：**
```bash
kubectl apply -f service.yaml

# Check service
kubectl get services

# For minikube, expose service
minikube service ml-api-service --url

# For kind, use port-forward
kubectl port-forward service/ml-api-service 8080:80
```

### 步骤 5：测试已部署应用

```bash
# Get service URL (minikube)
URL=$(minikube service ml-api-service --url)

# Test prediction
curl -X POST $URL/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [1, 2, 3, 4, 5]}'

# Expected output:
# {"prediction": 15.0, "model_version": "v1.0"}

# Test health check
curl $URL/health

# Expected output:
# {"status": "healthy"}
```

### 步骤 6：探索与扩缩容

```bash
# View pod details
kubectl describe pod ml-api-xxxxx-xxxxx

# View logs
kubectl logs -f ml-api-xxxxx-xxxxx

# Scale up to 5 replicas
kubectl scale deployment ml-api --replicas=5

# Watch scaling in action
kubectl get pods -w

# Scale back down
kubectl scale deployment ml-api --replicas=3
```

### 步骤 7：更新 Deployment（滚动更新）

更新 **app.py**，修改版本：

```python
return jsonify({
    'prediction': prediction,
    'model_version': 'v2.0'  # Changed
})
```

```bash
# Rebuild image
docker build -t ml-api:v2 .

# Load into cluster
minikube image load ml-api:v2
# or: kind load docker-image ml-api:v2

# Update deployment
kubectl set image deployment/ml-api ml-api=ml-api:v2

# Watch rolling update
kubectl rollout status deployment/ml-api

# Test new version
curl -X POST $URL/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [1, 2, 3]}'

# Rollback if needed
kubectl rollout undo deployment/ml-api
```

### 步骤 8：清理

```bash
# Delete resources
kubectl delete -f deployment.yaml
kubectl delete -f service.yaml

# Or delete everything with label
kubectl delete all -l app=ml-api

# Stop minikube (optional)
minikube stop

# Delete cluster
minikube delete
```

## 已介绍的关键概念

通过本次实践，你接触了以下概念：

1. **Deployment：** 管理具有多个副本的 Pod。
2. **Pod：** 最小可部署单元（包含一个或多个容器）。
3. **Service：** 负载均衡与网络。
4. **ReplicaSet：** 维持期望的 Pod 数量（由 Deployment 管理）。
5. **滚动更新：** 以零停机为目标的部署。
6. **扩缩容：** 通过副本实现水平扩展。
7. **kubectl：** K8s 命令行工具。

后续课程将深入探讨每项内容。

## 常见问题与故障排查

### 问题 1：Pod 无法启动

```bash
# Check pod status
kubectl get pods

# If status is ImagePullBackOff or ErrImagePull
# Solution: Ensure image is loaded into cluster
minikube image load your-image:tag
# or
kind load docker-image your-image:tag

# If status is CrashLoopBackOff
# Check logs
kubectl logs pod-name

# Check events
kubectl describe pod pod-name
```

### 问题 2：Service 无法访问

```bash
# Check service
kubectl get svc

# For minikube, use service URL
minikube service service-name --url

# For kind/other, use port-forward
kubectl port-forward service/service-name local-port:service-port
```

### 问题 3：资源不足

```bash
# Check node resources
kubectl describe node

# Adjust resource requests in deployment
# Lower memory/cpu requests if needed
```

## 总结

本课学习了：

- Kubernetes 为什么对大规模 ML 基础设施重要。
- Kubernetes 与 Docker Compose 等替代方案的比较。
- Kubernetes 的适用场景与不适用场景。
- Kubernetes 生态与 CNCF Landscape。
- 如何安装本地 Kubernetes（minikube/kind）。
- 将第一个 ML 应用部署到 Kubernetes。
- 扩缩容 Deployment 并执行滚动更新。

## 下一步

在 **第 02 课：Kubernetes 架构** 中，你将学习：
- 控制面组件及其工作方式。
- 节点组件与 Pod 生命周期。
- Kubernetes 如何作出调度决策。
- API Server 与 etcd 内部机制。

## 自我检查问题

继续之前，请确保能够回答：

1. Kubernetes 为 ML 基础设施解决了哪些问题？
2. 何时选择 Kubernetes，而非更简单的替代方案？
3. 什么是 Pod？什么是 Deployment？
4. 如何扩缩容 Deployment？
5. 什么是 Service？为什么需要它？
6. 滚动更新如何工作？

## 补充资源

**官方文档：**
- [Kubernetes 概念](https://kubernetes.io/docs/concepts/)
- [kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [交互式教程](https://kubernetes.io/docs/tutorials/kubernetes-basics/)

**教程：**
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)
- [CNCF Kubernetes 基础培训](https://www.cncf.io/certification/training/)

**书籍：**
- Marko Lukša 著《Kubernetes in Action》。
- Bilgin Ibryam 与 Roland Huß 著《Kubernetes Patterns》。

**ML 专用资源：**
- [Kubeflow 文档](https://www.kubeflow.org/docs/)
- [NVIDIA GPU Operator for Kubernetes](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/getting-started.html)

---

**下一课：** [02-k8s-architecture.md](./02-k8s-architecture.md)——理解 Kubernetes 架构与组件。

> 译注：K8s 并不自动保证零停机、高可用性或 Secret 静态加密，需要正确配置探针、副本、故障域、权限与加密等机制。企业案例、产品维护状态与性能数字保留原文，未独立核实。安装命令与示例代码块原样保留，尚未逐项运行验证。
