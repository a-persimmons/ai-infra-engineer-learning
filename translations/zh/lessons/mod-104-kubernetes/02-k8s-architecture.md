# 第 02 课：Kubernetes 架构

**时长：** 8 小时
**目标：** 理解 Kubernetes 架构、控制面组件、节点组件及其协作机制。

## 导论

在第 01 课中，你已将第一个应用部署至 Kubernetes。现在需要理解其内部发生了什么。

Kubernetes 是一个分布式系统，多个组件协同工作以编排容器。理解其架构对于以下工作非常重要：
- **排查**生产环境问题。
- **优化**性能。
- **设计**可扩展的 ML 基础设施。
- **通过** CKA/CKAD 认证。

## 高层架构

Kubernetes 采用原称 Master-Worker、现称 **Control Plane-Worker Nodes（控制面—工作节点）** 的架构：

```
┌─────────────────────────────────────────────────────────────────┐
│                     KUBERNETES CLUSTER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CONTROL PLANE (Master)                      │  │
│  │  ┌────────────┐  ┌─────────┐  ┌───────────┐            │  │
│  │  │ API Server │  │  etcd   │  │ Scheduler │            │  │
│  │  └────────────┘  └─────────┘  └───────────┘            │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐    │  │
│  │  │ Controller Manager   │  │ Cloud Controller     │    │  │
│  │  └──────────────────────┘  └──────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │ (API calls)                      │
│                              │                                  │
│  ┌───────────────┬───────────┴───────────┬───────────────┐    │
│  │  Worker Node 1 │   Worker Node 2      │  Worker Node 3 │    │
│  │ ┌────────────┐ │  ┌────────────┐      │ ┌────────────┐│    │
│  │ │  kubelet   │ │  │  kubelet   │      │ │  kubelet   ││    │
│  │ │ kube-proxy │ │  │ kube-proxy │      │ │ kube-proxy ││    │
│  │ │ Container  │ │  │ Container  │      │ │ Container  ││    │
│  │ │  Runtime   │ │  │  Runtime   │      │ │  Runtime   ││    │
│  │ └────────────┘ │  └────────────┘      │ └────────────┘│    │
│  │  [Pods...]     │   [Pods...]          │  [Pods...]    │    │
│  └───────────────┴───────────────────────┴───────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 关键原则

1. **声明式配置：** 声明期望状态，由 K8s 维持。
2. **控制器模式：** 控制器观察状态并协调差异。
3. **API 驱动：** 核心组件通过 API Server 交换集群状态。
4. **分布式与韧性：** 高可用配置旨在消除单点故障。
5. **可插拔：** 许多组件可以替换（CNI、CSI、CRI）。

## 控制面组件

**控制面（Control Plane）** 对集群作出全局决策，例如调度、响应事件以及维持期望状态。

### 1. API Server（kube-apiserver）

**Kubernetes 的大脑**——中心管理入口。

**用途：**
- 暴露 Kubernetes API（REST API）。
- 作为控制面的前端。
- 提供集群状态管理的统一入口。
- 验证并处理 API 对象的数据。

**主要职责：**
- 身份认证与授权。
- 准入控制（Webhook、策略）。
- API 资源验证。
- 作为访问 etcd 的网关。
- 提供 Watch 机制观察变化。

**工作方式：**
```
kubectl → API Server → etcd (store)
                     ↓
              Controllers watch API
                     ↓
              Take actions
```

**交互示例：**
```bash
# When you run:
kubectl apply -f deployment.yaml

# What happens:
# 1. kubectl sends HTTP POST to API server
# 2. API server authenticates and authorizes request
# 3. API server validates deployment spec
# 4. API server runs admission controllers
# 5. API server writes to etcd
# 6. Deployment controller watches API, sees new deployment
# 7. Controller creates ReplicaSet
# 8. ReplicaSet controller creates Pods
# 9. Scheduler assigns Pods to nodes
# 10. Kubelet on nodes start containers
```

**API Server 成为瓶颈：**
对于大型 ML 平台（原文举例：100 个以上节点、1,000 个以上 Pod）：
- API Server 可能成为瓶颈。
- 水平扩展：运行多个 API Server 实例。
- 使用缓存并减少 API 调用。

**生产配置：**
```yaml
# High-availability API server
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
spec:
  containers:
  - name: kube-apiserver
    command:
    - kube-apiserver
    - --etcd-servers=https://etcd1:2379,https://etcd2:2379,https://etcd3:2379
    - --enable-admission-plugins=NodeRestriction,PodSecurityPolicy
    - --audit-log-path=/var/log/kubernetes/audit.log
    - --audit-log-maxage=30
```

### 2. etcd

**分布式键值存储**——集群数据库。

**用途：**
- 存储集群状态。
- 提供一致性与高可用能力。
- 作为集群状态的事实来源。

**etcd 中存储的内容：**
- 集群配置。
- Pod 规格。
- Secret 与 ConfigMap。
- Service Endpoint。
- 资源配额。
- Kubernetes 持久化 API 对象。

**关键特性：**
- **一致性：** 使用 Raft 共识算法。
- **可靠性：** 高可用部署通常使用三个或五个成员。
- **Watch：** 客户端可以观察变化。
- **性能：** 位于集群操作的关键路径。

**架构：**
```
┌──────────────────────────────────────┐
│         etcd Cluster (HA)            │
│  ┌──────┐    ┌──────┐    ┌──────┐   │
│  │etcd-1│ ←→ │etcd-2│ ←→ │etcd-3│   │
│  └──────┘    └──────┘    └──────┘   │
│     ↑            ↑           ↑       │
└─────┼────────────┼───────────┼───────┘
      └────────────┴───────────┘
               │
         API Server (reads/writes)
```

**备份与灾难恢复：**
```bash
# Backup etcd (CRITICAL for production)
ETCDCTL_API=3 etcdctl snapshot save snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify snapshot
ETCDCTL_API=3 etcdctl snapshot status snapshot.db

# Restore (disaster recovery)
ETCDCTL_API=3 etcdctl snapshot restore snapshot.db \
  --data-dir=/var/lib/etcd-restore
```

**面向 ML 的性能考虑：**
- 原文称 etcd 默认存储限制约为 8GB。
- 大型 ConfigMap（例如存放数据集）可能耗尽 etcd 存储空间。
- 将大型数据存储在外部（S3、NFS）。
- 监控 etcd 大小与性能。

### 3. Scheduler（kube-scheduler）

根据资源需求和约束，**将 Pod 分配给节点**。

**用途：**
- 观察新创建且尚未分配节点的 Pod。
- 为每个 Pod 选择合适的节点。
- 更新 Pod 的节点绑定信息。

**调度流程：**
```
1. Filter: Remove nodes that don't meet requirements
   - Insufficient CPU/memory
   - GPU not available
   - Node selectors don't match
   - Taints/tolerations

2. Score: Rank remaining nodes
   - Resource balance
   - Pod affinity/anti-affinity
   - Spread across zones
   - Custom scoring

3. Bind: Assign pod to highest-scored node
```

**调度因素：**
```yaml
# Example: ML training pod with GPU requirement
apiVersion: v1
kind: Pod
metadata:
  name: training-job
spec:
  # Node selector: only GPU nodes
  nodeSelector:
    accelerator: nvidia-tesla-v100

  # Resource requirements
  containers:
  - name: trainer
    resources:
      requests:
        memory: "32Gi"
        cpu: "8"
        nvidia.com/gpu: "1"
      limits:
        memory: "64Gi"
        cpu: "16"
        nvidia.com/gpu: "1"

  # Affinity: prefer nodes in same zone as data
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values:
            - us-west-1a

  # Toleration: allow scheduling on tainted GPU nodes
  tolerations:
  - key: "nvidia.com/gpu"
    operator: "Exists"
    effect: "NoSchedule"
```

**自定义调度器：**
针对特定 ML 工作负载：
- **Gang Scheduling（成组调度）：** 将分布式训练任务的全部 Pod 作为一组进行调度。
- **Bin Packing（装箱调度）：** 最大化节点利用率。
- **优先级调度：** 高优先级推理优先于批处理训练。

示例：使用自定义调度器。
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-training
spec:
  schedulerName: gpu-aware-scheduler  # Custom scheduler
  containers:
  - name: trainer
    image: training-image:latest
```

### 4. Controller Manager（kube-controller-manager）

**运行控制器进程**，协调集群状态。

**用途：**
- 通过 API Server 观察期望状态。
- 观察当前状态。
- 采取措施，使实际状态趋近期望状态。

**内置控制器：**

**Node Controller：**
- 监控节点健康状态。
- 响应节点故障。
- 对不健康节点上的 Pod 执行驱逐等处理。

**ReplicaSet Controller：**
- 确保 Pod 副本数量符合期望。
- 按需创建或删除 Pod。

**Deployment Controller：**
- 管理滚动更新。
- 处理回滚。

**Job Controller：**
- 为批处理任务创建 Pod。
- 追踪任务完成状态。

**Service Controller：**
- 创建或更新负载均衡器。
- 原文还列举管理 Endpoint 对象。

**Namespace Controller：**
- 删除 Namespace 时清理其中的对象。

**示例：ReplicaSet Controller 逻辑**
```
Loop:
  1. Watch ReplicaSet objects
  2. For each ReplicaSet:
     a. Count current pods with matching labels
     b. Compare to desired replica count
     c. If current < desired: Create pods
     d. If current > desired: Delete extra pods
     e. Update ReplicaSet status
  3. Sleep/wait for changes
```

**ML 自定义控制器：**
```python
# Pseudocode: Model Deployment Controller
while True:
    for model_deployment in watch_model_deployments():
        desired_version = model_deployment.spec.version
        current_version = get_current_version(model_deployment)

        if desired_version != current_version:
            # Rolling update to new model version
            create_new_pods(desired_version)
            wait_for_health_checks()
            delete_old_pods(current_version)
            update_status(model_deployment)
```

### 5. Cloud Controller Manager

**与云服务商 API 集成**（AWS、GCP、Azure）。

**用途：**
- 管理云平台特有资源。
- 路由流量。
- 原文还列举供应存储。
- 管理负载均衡器。

**云平台特有控制器：**

**Node Controller：**
- 检查云端节点是否被删除。
- 获取节点元数据（实例类型、可用区、IP）。

**Route Controller：**
- 在云 VPC 中设置路由。
- 实现跨节点 Pod 间网络通信。

**Service Controller：**
- 为 LoadBalancer 类型的 Service 创建云负载均衡器。
- 更新负载均衡器后端。

**Volume Controller（原文列举）：**
- 创建、附加、挂载云存储卷。
- 处理存储卷快照。

**示例：AWS 集成**
```yaml
# Service creates AWS ELB
apiVersion: v1
kind: Service
metadata:
  name: ml-api
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:..."
spec:
  type: LoadBalancer
  ports:
  - port: 443
    targetPort: 8080
  selector:
    app: ml-api
```

原文示例中，云控制器自动：
1. 在 AWS 创建 Network Load Balancer。
2. 配置 SSL 证书。
3. 使用 Pod IP 更新目标组。
4. 管理健康检查。

> 译注：etcd 的常见默认后端配额为 2GiB，8GiB 是常见建议上限而非统一默认值，需检查实际配置；ConfigMap 单对象也有大小限制。现代云存储供应、挂载与快照通常由 CSI 及其控制器完成。Service 的 EndpointSlice 由相应控制器维护，不应一概归于 Service Controller；AWS 负载均衡行为取决于具体云控制器、AWS Load Balancer Controller、注解及目标类型。

## 工作节点组件

工作节点运行容器化应用。

### 1. kubelet

**主要节点代理**——确保容器按照 Pod 规格运行。

**用途：**
- 向 API Server 注册节点。
- 观察分配至该节点的 Pod。
- 确保 Pod 容器正常运行并符合健康检查要求。
- 报告节点与 Pod 状态。

**主要职责：**
```
1. Pod Lifecycle Management:
   - Pull container images
   - Start containers via CRI
   - Monitor container health
   - Restart failed containers

2. Volume Management:
   - Mount volumes into pods
   - Manage volume lifecycles

3. Health Monitoring:
   - Run liveness probes
   - Run readiness probes
   - Report status to API server

4. Resource Management:
   - Enforce resource limits
   - Monitor resource usage
```

**面向 ML 工作负载的 kubelet 配置：**
```yaml
# /var/lib/kubelet/config.yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration

# Increase image pull timeout for large ML images
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80

# Resource reservation for system
systemReserved:
  cpu: "1000m"
  memory: "2Gi"

# Kubelet resource reservation
kubeReserved:
  cpu: "500m"
  memory: "1Gi"

# Eviction thresholds (prevent OOM)
evictionHard:
  memory.available: "500Mi"
  nodefs.available: "10%"

# GPU support
featureGates:
  DevicePlugins: true
```

**与容器运行时交互：**
```
kubelet → CRI (Container Runtime Interface)
            ↓
      containerd / CRI-O
            ↓
      Container (running app)
```

### 2. kube-proxy

运行于各节点的**网络代理组件**。

**用途：**
- 实现 Kubernetes Service 抽象。
- 维护 Service 转发相关的网络规则。
- 在 Pod 副本之间进行负载均衡。

**Service 工作方式：**
```
Client → Service IP (virtual) → kube-proxy rules → Pod IP (actual)
```

**代理模式：**

**1. iptables 模式（原文称最常见）：**
```bash
# kube-proxy creates iptables rules
# Example: Service at 10.96.0.1:80 → Pods at 10.244.1.5:8080, 10.244.2.6:8080

# iptables rules (simplified):
-A KUBE-SERVICES -d 10.96.0.1/32 -p tcp -m tcp --dport 80 -j KUBE-SVC-XXXXX
-A KUBE-SVC-XXXXX -m statistic --mode random --probability 0.5 -j KUBE-SEP-POD1
-A KUBE-SVC-XXXXX -j KUBE-SEP-POD2
-A KUBE-SEP-POD1 -p tcp -j DNAT --to-destination 10.244.1.5:8080
-A KUBE-SEP-POD2 -p tcp -j DNAT --to-destination 10.244.2.6:8080
```

**2. IPVS 模式（原文评价性能更好）：**
- 使用 Linux IPVS（IP Virtual Server）。
- 原文认为更适合拥有 1,000 个以上 Service 的场景。
- 提供更多负载均衡算法。

**3. userspace 模式（旧版）：**
- kube-proxy 在用户空间代理流量。
- 较慢，但原文称适用范围广。

**面向 ML 的配置：**
```yaml
# kube-proxy config for high-performance ML serving
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: "ipvs"  # Better for many services
ipvs:
  scheduler: "lc"  # Least connection (good for long ML requests)
  minSyncPeriod: 5s
  syncPeriod: 30s
conntrack:
  maxPerCore: 131072  # Increase for high traffic
```

### 3. 容器运行时

在节点上**运行容器**。

**Container Runtime Interface（CRI，容器运行时接口）：**
- kubelet 与运行时之间的标准化接口。
- 可插拔架构。

**常用运行时：**

**containerd（原文称最常见）：**
- CNCF 毕业项目。
- GKE、EKS、AKS 等平台采用。
- 轻量且高效。

**CRI-O：**
- 专门为 Kubernetes 设计。
- 符合 OCI 标准。
- OpenShift 采用。

**Docker（通过 dockershim，已弃用）：**
- Kubernetes 1.24 起移除了内置 dockershim。
- 可以改用 containerd。

**GPU 支持：**
```bash
# NVIDIA Container Runtime integration
# Allows containers to access GPUs

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Configure containerd
sudo nvidia-ctk runtime configure --runtime=containerd
sudo systemctl restart containerd
```

## 附加组件（Add-ons）

为集群提供额外功能的可选组件。

### DNS（CoreDNS）

**用途：**
- 通过 DNS 实现服务发现。
- Pod 可以按名称查找 Service。

**工作方式：**
```bash
# Pod can access service by name
curl http://ml-api-service.default.svc.cluster.local/predict

# DNS resolution:
# ml-api-service → Service IP → Pod IPs
```

**CoreDNS 配置：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        forward . /etc/resolv.conf
        cache 30
        loop
        reload
        loadbalance
    }
```

### Dashboard

用于 Kubernetes 集群的 **Web 界面**。

```bash
# Deploy dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Access dashboard
kubectl proxy
# Visit: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

**替代方案：Lens（桌面应用）**
- 更容易使用。
- 可视化更丰富。
- 支持多集群管理。

### Metrics Server

从 kubelet **采集资源指标**（CPU、内存）。

**用途：**
- 支持 `kubectl top nodes` 与 `kubectl top pods`。
- 为基于 CPU、内存资源指标的 Horizontal Pod Autoscaler（HPA）提供数据。

```bash
# Install metrics server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View node metrics
kubectl top nodes

# View pod metrics
kubectl top pods --all-namespaces

# View pod metrics with containers
kubectl top pods --containers
```

### Ingress Controller

将 **HTTP/HTTPS 流量路由**至 Service。

常见选项：
- **NGINX Ingress：** 原文称最常见。
- **Traefik：** 云原生、自动 HTTPS。
- **Istio：** 具备入口流量管理能力的服务网格。

> 译注：kube-proxy 的模式及支持状态随版本变化，较新版本也支持 nftables，部分 CNI 可替代 kube-proxy。用户空间模式属于历史方案。Pod 基础网络由 CNI 等组件提供，而不是 kube-proxy 单独完成；Metrics Server 并非自定义/外部指标 HPA 的唯一来源。Dashboard、Ingress 等项目的维护状态需按当前版本核对。

## 各组件如何协作

### 示例：部署 ML 模型

**分步流程：**

**1. 你执行：**
```bash
kubectl apply -f ml-deployment.yaml
```

**2. kubectl → API Server：**
- 发送包含 Deployment 规格的 HTTP 请求（原文以 POST 为例）。
- API Server 进行身份认证与授权。

**3. API Server → etcd：**
- 将 Deployment 对象存储至 etcd。

**4. Deployment Controller（观察 API）：**
- 发现新的 Deployment。
- 创建 ReplicaSet 对象。
- 写入 API Server。

**5. ReplicaSet Controller（观察 API）：**
- 发现新的 ReplicaSet。
- 创建三个 Pod 对象（replicas: 3）。
- 写入 API Server。

**6. Scheduler（观察未调度的 Pod）：**
- 发现三个尚未分配节点的 Pod。
- 筛选节点（GPU 是否可用？内存是否充足？）。
- 对剩余节点评分。
- 为每个 Pod 选择合适节点。
- 更新 Pod 的节点绑定。

**7. Node-1 上的 kubelet（观察分配给自身的 Pod）：**
- 发现新分配的 Pod。
- 拉取容器镜像。
- 通知容器运行时启动容器。
- 向 API Server 报告状态。

**8. Node-1 上的 kube-proxy：**
- 观察 Service 与 EndpointSlice 更新，其中包含新的 Pod IP。
- 更新 iptables 规则（以该模式为例）。
- 启用 Service 路由。

**9. Service Controller（如果存在 LoadBalancer 类型的 Service）：**
- 创建云负载均衡器。
- 根据配置使用 Pod IP 或节点配置后端。

**10. CoreDNS：**
- 提供 Service 名称到 Service IP 的映射。

**结果：** ML 模型开始处理流量！

### 示例：Pod 故障与恢复

**1. 容器崩溃：**
```
Application error → Container exits
```

**2. kubelet 检测到：**
- 进程退出或存活探针失败。
- kubelet 根据重启策略重启容器。

**3. 如果反复重启失败：**
- Pod 的容器状态显示 CrashLoopBackOff。
- kubelet 以退避方式延迟重试。

**4. 如果节点故障：**
- Node Controller 检测心跳丢失。
- 将节点标记为 NotReady 等异常状态。
- 超时后驱逐 Pod（原文举例默认五分钟）。

**5. ReplicaSet Controller：**
- 发现有效副本数少于期望数量。
- 创建替代 Pod。

**6. Scheduler：**
- 将新 Pod 分配至健康节点。

**7. 新 Pod 启动：**
- 就绪后被 Service 后端自动包含。
- 流量被路由至健康 Pod。

## 动手实践：探索集群组件

### 查看控制面 Pod

```bash
# List all system pods
kubectl get pods -n kube-system

# Expected output:
# NAME                               READY   STATUS    RESTARTS   AGE
# coredns-xxxxx                      1/1     Running   0          1h
# etcd-minikube                      1/1     Running   0          1h
# kube-apiserver-minikube            1/1     Running   0          1h
# kube-controller-manager-minikube   1/1     Running   0          1h
# kube-proxy-xxxxx                   1/1     Running   0          1h
# kube-scheduler-minikube            1/1     Running   0          1h
# storage-provisioner                1/1     Running   0          1h
```

### 查看组件日志

```bash
# API server logs
kubectl logs -n kube-system kube-apiserver-minikube

# Scheduler logs
kubectl logs -n kube-system kube-scheduler-minikube

# Controller manager logs
kubectl logs -n kube-system kube-controller-manager-minikube

# CoreDNS logs
kubectl logs -n kube-system coredns-xxxxx
```

### 检查组件健康状态

```bash
# Component status (deprecated in newer versions)
kubectl get componentstatuses

# Alternative: check pod health
kubectl get pods -n kube-system

# Check API server health
kubectl get --raw /healthz

# Check API server livez
kubectl get --raw /livez

# Check API server readyz
kubectl get --raw /readyz
```

### 探索节点详情

```bash
# List nodes
kubectl get nodes

# Detailed node information
kubectl describe node minikube

# Key sections:
# - Conditions: Ready, MemoryPressure, DiskPressure
# - Capacity: CPU, memory, pods
# - Allocatable: Available for pods
# - Allocated resources: What's in use
# - Events: Recent node events
```

### 查看集群信息

```bash
# Cluster information
kubectl cluster-info

# Cluster configuration
kubectl config view

# API server address
kubectl cluster-info | grep master

# Kubernetes version
kubectl version
```

## 面向 ML 的架构最佳实践

### 1. 高可用控制面

针对生产 ML 基础设施：
```
- 3 or 5 control plane nodes (odd number for quorum)
- 3 or 5 etcd instances
- Load balancer in front of API servers
- Distributed across availability zones
```

### 2. 专用节点池

```yaml
# Example: Separate node pools for different workloads

# CPU-only inference nodes
- name: cpu-inference
  machineType: n1-standard-8
  taints:
    - key: workload-type
      value: inference
      effect: NoSchedule

# GPU training nodes
- name: gpu-training
  machineType: n1-standard-16
  accelerators:
    - type: nvidia-tesla-v100
      count: 4
  taints:
    - key: workload-type
      value: training
      effect: NoSchedule

# Spot/preemptible nodes for batch jobs
- name: spot-batch
  machineType: n1-standard-16
  spot: true
  taints:
    - key: workload-type
      value: batch
      effect: NoSchedule
```

### 3. 资源配额与限制

```yaml
# Namespace-level quotas for teams
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ml-team-quota
  namespace: ml-team
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "200Gi"
    requests.nvidia.com/gpu: "8"
    pods: "50"
```

### 4. 监控与告警

- 使用 Prometheus 采集指标。
- 使用 Grafana 构建仪表盘。
- 针对控制面健康状态配置告警。
- 针对节点资源压力配置告警。

## 总结

本课学习了：

- Kubernetes 架构（控制面 + 工作节点）。
- 控制面组件：API Server、etcd、Scheduler、Controller。
- 工作节点组件：kubelet、kube-proxy、容器运行时。
- 附加组件：DNS、Metrics Server、Dashboard。
- 各组件如何协作编排容器。
- 面向生产 ML 工作负载的架构模式。

## 下一步

在 **第 03 课：核心资源** 中，你将学习：
- 深入 Pod。
- ReplicaSet 与 Deployment。
- 用于网络的 Service。
- ConfigMap 与 Secret。
- 用于组织资源的 Namespace。

## 自我检查问题

1. API Server 的职责是什么？
2. etcd 存储什么？为什么它至关重要？
3. Scheduler 如何决定 Pod 的放置位置？
4. kubelet 与 kube-proxy 有什么区别？
5. 描述创建 Deployment 时的流程。
6. 为什么控制面的高可用性很重要？

## 补充资源

- [Kubernetes 组件文档](https://kubernetes.io/docs/concepts/overview/components/)
- [深入 Kubernetes 架构](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/architecture/architecture.md)
- [etcd 文档](https://etcd.io/docs/)
- [Raft 共识算法](https://raft.github.io/)

---

**下一课：** [03-core-resources.md](./03-core-resources.md)——Pod、Deployment、Service 与 ConfigMap。

> 译注：上述部署过程是简化示意；实际事件处理异步发生，不保证严格按列出的全局顺序执行。节点故障驱逐时间受污点、容忍、控制器配置等因素影响。代码块及其中英文图示保留原样；etcd 恢复等管理操作只应在授权的实验环境中演练，尚未实际运行验证。
