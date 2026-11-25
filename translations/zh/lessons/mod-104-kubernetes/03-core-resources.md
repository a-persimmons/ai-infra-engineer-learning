# 第 03 课：Kubernetes 核心资源

**时长：** 7 小时
**目标：** 掌握 Pod、ReplicaSet、Deployment、Service、ConfigMap、Secret 与 Namespace。

## 导论

此前课程介绍了 Kubernetes 架构。现在开始直接使用构成 Kubernetes 应用的核心资源。

本课涵盖 ML 基础设施工程师日常使用的基本构件。

## Pod：原子单元

**Pod 是 Kubernetes 中最小的可部署单元**，封装一个或多个容器。

### 什么是 Pod？

```
┌─────────────────────────────────────┐
│            POD                      │
│  ┌──────────────┐  ┌────────────┐  │
│  │ Container 1  │  │Container 2 │  │
│  │ (ML Model)   │  │ (Sidecar)  │  │
│  └──────────────┘  └────────────┘  │
│                                     │
│  Shared:                            │
│  - Network namespace (IP address)   │
│  - IPC namespace                    │
│  - Volumes                          │
│  - Lifecycle                        │
└─────────────────────────────────────┘
```

### Pod 的特点

1. **共享网络：** 所有容器共享 IP 地址和端口空间。
2. **共享存储：** 容器可以共享数据卷。
3. **原子调度：** 一个 Pod 中的容器被整体调度。
4. **临时性：** Pod 可被删除和替换。

### 基本 Pod 清单

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ml-inference-pod
  labels:
    app: ml-api
    version: v1
spec:
  containers:
  - name: model-server
    image: tensorflow/serving:latest
    ports:
    - containerPort: 8501
    env:
    - name: MODEL_NAME
      value: "resnet"
```

### 多容器 Pod

**ML 工作负载的常见模式：**

**1. Sidecar（边车）模式：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ml-with-logging
spec:
  containers:
  # Main container: ML model
  - name: model-server
    image: my-ml-model:v1
    ports:
    - containerPort: 8080
    volumeMounts:
    - name: logs
      mountPath: /var/log/ml

  # Sidecar: Log collector
  - name: log-collector
    image: fluent/fluentd:latest
    volumeMounts:
    - name: logs
      mountPath: /var/log/ml

  volumes:
  - name: logs
    emptyDir: {}
```

**2. Ambassador（大使）模式：**
```yaml
# ML model + proxy for metrics/auth
spec:
  containers:
  - name: model-server
    image: my-ml-model:v1

  - name: envoy-proxy
    image: envoyproxy/envoy:latest
    # Handles authentication, rate limiting, metrics
```

**3. Adapter（适配器）模式：**
```yaml
# ML model + format converter
spec:
  containers:
  - name: model-server
    image: pytorch-model:v1
    # Outputs custom format

  - name: format-adapter
    image: output-converter:v1
    # Converts to standard API format
```

### Init Container（初始化容器）

**在主应用容器之前运行**，适合执行初始化任务。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ml-model-with-init
spec:
  # Init containers run sequentially before main containers
  initContainers:
  - name: download-model
    image: google/cloud-sdk:latest
    command:
    - gsutil
    - cp
    - gs://my-models/resnet-v1.pb
    - /models/
    volumeMounts:
    - name: model-storage
      mountPath: /models

  - name: validate-model
    image: model-validator:v1
    command: ["python", "validate.py", "/models/resnet-v1.pb"]
    volumeMounts:
    - name: model-storage
      mountPath: /models

  # Main container starts after init containers succeed
  containers:
  - name: model-server
    image: tensorflow/serving:latest
    volumeMounts:
    - name: model-storage
      mountPath: /models

  volumes:
  - name: model-storage
    emptyDir: {}
```

### Pod 生命周期阶段

```
Pending → ContainerCreating → Running → Succeeded/Failed
                                    ↓
                              CrashLoopBackOff
```

**阶段及常见状态：**
- **Pending：** 已被集群接受，但尚未完成调度或容器准备。
- **ContainerCreating：** 正在拉取镜像或启动容器（常见等待原因，不是 Pod phase）。
- **Running：** Pod 已绑定节点，所有容器已创建，至少一个容器正在运行、启动或重启。
- **Succeeded：** 所有容器成功终止，不再重启。
- **Failed：** 所有容器均已终止，且至少一个容器失败。
- **Unknown：** 无法确定状态。

### 资源请求与限制

对于 ML 工作负载，防止资源争用**至关重要**。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ml-training-pod
spec:
  containers:
  - name: trainer
    image: pytorch-trainer:v1
    resources:
      # Requests: Guaranteed resources for scheduling
      requests:
        memory: "16Gi"    # Minimum memory
        cpu: "4"          # Minimum CPUs (4 cores)
      # Limits: Maximum resources allowed
      limits:
        memory: "32Gi"    # Pod killed if exceeds
        cpu: "8"          # Throttled if exceeds
```

**QoS 类别：**

**1. Guaranteed（通常具有较强的驱逐保护）：**
```yaml
# Requests == Limits
resources:
  requests:
    memory: "16Gi"
    cpu: "4"
  limits:
    memory: "16Gi"
    cpu: "4"
```

**2. Burstable：**
```yaml
# Requests < Limits
resources:
  requests:
    memory: "8Gi"
    cpu: "2"
  limits:
    memory: "16Gi"
    cpu: "4"
```

**3. BestEffort（通常较容易被驱逐）：**
```yaml
# No requests or limits
# Pod evicted first under pressure
```

### 健康探针

**Kubernetes 使用探针检查容器健康状态。**

**1. Liveness Probe（存活探针）：容器是否存活？**
```yaml
spec:
  containers:
  - name: model-server
    image: ml-api:v1
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30  # Wait before first check
      periodSeconds: 10        # Check every 10s
      timeoutSeconds: 5        # Timeout after 5s
      failureThreshold: 3      # Restart after 3 failures
```

**2. Readiness Probe（就绪探针）：容器是否可以接收流量？**
```yaml
spec:
  containers:
  - name: model-server
    image: ml-api:v1
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      successThreshold: 1      # Consider ready after 1 success
```

**3. Startup Probe（启动探针）：容器是否已启动？（原文称在 1.16 引入）**
```yaml
# For slow-starting applications (large ML models)
spec:
  containers:
  - name: llm-server
    image: llama-70b:v1
    startupProbe:
      httpGet:
        path: /startup
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 10
      failureThreshold: 30      # 5 minutes (30 * 10s)
```

**探针类型：**
```yaml
# HTTP GET
livenessProbe:
  httpGet:
    path: /health
    port: 8080

# TCP Socket
livenessProbe:
  tcpSocket:
    port: 8080

# Command Execution
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
```

## ReplicaSet

**确保维持指定数量的 Pod 副本。**

### ReplicaSet 清单

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: ml-api-replicaset
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-api
  template:
    metadata:
      labels:
        app: ml-api
    spec:
      containers:
      - name: model-server
        image: ml-api:v1
        ports:
        - containerPort: 8080
```

**ReplicaSet 如何工作：**
```
1. ReplicaSet controller watches API server
2. Counts pods matching selector
3. If count < replicas: Create pods
4. If count > replicas: Delete extra pods
5. Updates status
```

**标签选择器：**
```yaml
# matchLabels (AND logic)
selector:
  matchLabels:
    app: ml-api
    env: production

# matchExpressions (more flexible)
selector:
  matchExpressions:
  - key: app
    operator: In
    values: [ml-api, ml-api-v2]
  - key: env
    operator: NotIn
    values: [dev, test]
```

**注意：** 通常无需直接创建 ReplicaSet，由 Deployment 管理。

## Deployment

**在 Kubernetes 中部署应用的标准方式。**

### 为什么使用 Deployment？

Deployment 提供：
- 针对 Pod 与 ReplicaSet 的**声明式更新**。
- **发布历史**与版本管理。
- **回滚**至此前版本。
- **扩缩容**。
- **暂停与恢复**发布。

### Deployment 清单

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api-deployment
  labels:
    app: ml-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max extra pods during update
      maxUnavailable: 0  # Max unavailable pods
  selector:
    matchLabels:
      app: ml-api
  template:
    metadata:
      labels:
        app: ml-api
        version: v1
    spec:
      containers:
      - name: model-server
        image: ml-api:v1
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Deployment 策略

**1. RollingUpdate（默认滚动更新）：**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # Create 1 extra pod
    maxUnavailable: 0  # No downtime
```

过程：
```
Initial: [v1] [v1] [v1]
Step 1:  [v1] [v1] [v1] [v2]  (maxSurge: +1)
Step 2:  [v1] [v1] [v2] [v2]  (delete old, create new)
Step 3:  [v1] [v2] [v2] [v2]
Final:   [v2] [v2] [v2]
```

**2. Recreate（重新创建）：**
```yaml
strategy:
  type: Recreate
```

过程：
```
Initial: [v1] [v1] [v1]
Step 1:  (delete all)
Step 2:  [v2] [v2] [v2]  (create new)
# Downtime during transition
```

### Deployment 操作

**创建 Deployment：**
```bash
kubectl apply -f deployment.yaml

# Or imperative
kubectl create deployment ml-api --image=ml-api:v1 --replicas=3
```

**更新 Deployment（新模型版本）：**
```bash
# Update image
kubectl set image deployment/ml-api-deployment model-server=ml-api:v2

# Or edit directly
kubectl edit deployment ml-api-deployment

# Or apply updated YAML
kubectl apply -f deployment.yaml
```

**观察发布过程：**
```bash
kubectl rollout status deployment/ml-api-deployment

# Output:
# Waiting for deployment "ml-api-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
# Waiting for deployment "ml-api-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
# deployment "ml-api-deployment" successfully rolled out
```

**发布历史：**
```bash
kubectl rollout history deployment/ml-api-deployment

# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         kubectl set image deployment/ml-api-deployment model-server=ml-api:v2
# 3         kubectl set image deployment/ml-api-deployment model-server=ml-api:v3
```

**回滚：**
```bash
# Rollback to previous version
kubectl rollout undo deployment/ml-api-deployment

# Rollback to specific revision
kubectl rollout undo deployment/ml-api-deployment --to-revision=2
```

**暂停/恢复：**
```bash
# Pause rollout (for canary testing)
kubectl rollout pause deployment/ml-api-deployment

# Make changes
kubectl set image deployment/ml-api-deployment model-server=ml-api:v4

# Resume rollout
kubectl rollout resume deployment/ml-api-deployment
```

**扩缩容：**
```bash
# Imperative scaling
kubectl scale deployment/ml-api-deployment --replicas=5

# Declarative scaling
kubectl patch deployment ml-api-deployment -p '{"spec":{"replicas":5}}'
```

## Service

用于访问 Pod 的**稳定网络抽象**。

### 为什么需要 Service？

**问题：Pod 是临时性的。**
- Pod 被替换时 IP 地址可能变化。
- 多个 Pod 副本具有不同 IP 地址。
- 客户端如何查找并连接它们？

**解决方案：Service 提供：**
- 稳定虚拟 IP（ClusterIP）。
- DNS 名称。
- Pod 之间的负载均衡。

### Service 类型

**1. ClusterIP（默认）：**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-service
spec:
  type: ClusterIP
  selector:
    app: ml-api
  ports:
  - protocol: TCP
    port: 80        # Service port
    targetPort: 8080  # Container port
```

默认仅在集群内部访问：
```bash
curl http://ml-api-service.default.svc.cluster.local/predict
```

**2. NodePort：**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-nodeport
spec:
  type: NodePort
  selector:
    app: ml-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
    nodePort: 30080  # Exposed on all nodes (30000-32767)
```

通过节点访问：
```bash
curl http://<node-ip>:30080/predict
```

**3. LoadBalancer：**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-lb
spec:
  type: LoadBalancer
  selector:
    app: ml-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

在支持的环境中创建云负载均衡器（ELB、GCE LB、Azure LB）：
```bash
kubectl get svc ml-api-lb
# EXTERNAL-IP: 203.0.113.42

curl http://203.0.113.42/predict
```

**4. ExternalName：**
```yaml
# Map to external service
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: my-database.cxxxxxxxxxxxx.us-west-2.rds.amazonaws.com
```

### 服务发现

**1. 环境变量：**
```bash
# Kubernetes injects service info
ML_API_SERVICE_HOST=10.96.0.42
ML_API_SERVICE_PORT=80
```

**2. DNS（优先推荐）：**
```bash
# Format: <service-name>.<namespace>.svc.cluster.local

# Same namespace
curl http://ml-api-service/predict

# Different namespace
curl http://ml-api-service.production.svc.cluster.local/predict

# Fully qualified
curl http://ml-api-service.production.svc.cluster.local/predict
```

### Endpoint

Service 将流量路由到 **Endpoint（端点，例如 Pod IP）**。

```bash
# View service endpoints
kubectl get endpoints ml-api-service

# NAME             ENDPOINTS                           AGE
# ml-api-service   10.244.1.5:8080,10.244.2.6:8080    5m

# If no endpoints, service selector doesn't match any pods
```

### Headless Service（无头服务）

**不分配 ClusterIP，直接通过 DNS 返回后端地址。**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-training-headless
spec:
  clusterIP: None  # Headless
  selector:
    app: ml-training
  ports:
  - port: 8080
```

DNS 返回符合条件的 Pod IP：

```bash
nslookup ml-training-headless.default.svc.cluster.local

# Returns:
# 10.244.1.5
# 10.244.1.6
# 10.244.1.7
```

**使用场景：** 分布式训练，Worker 需要直接通信。

## ConfigMap

将**非敏感配置**与代码分离存储。

### 创建 ConfigMap

**通过字面值：**
```bash
kubectl create configmap ml-config \
  --from-literal=MODEL_NAME=resnet \
  --from-literal=BATCH_SIZE=32
```

**通过文件：**
```bash
# config.properties
MODEL_NAME=resnet
BATCH_SIZE=32
NUM_WORKERS=4

kubectl create configmap ml-config --from-file=config.properties
```

**通过 YAML：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-config
data:
  MODEL_NAME: "resnet"
  BATCH_SIZE: "32"
  config.yaml: |
    model:
      name: resnet
      version: v1
      batch_size: 32
    inference:
      timeout: 30
      max_concurrent: 100
```

### 使用 ConfigMap

**1. 环境变量：**
```yaml
spec:
  containers:
  - name: model-server
    image: ml-api:v1
    env:
    - name: MODEL_NAME
      valueFrom:
        configMapKeyRef:
          name: ml-config
          key: MODEL_NAME

    # Or all keys as env vars
    envFrom:
    - configMapRef:
        name: ml-config
```

**2. 数据卷挂载：**
```yaml
spec:
  containers:
  - name: model-server
    image: ml-api:v1
    volumeMounts:
    - name: config
      mountPath: /etc/config
      readOnly: true
  volumes:
  - name: config
    configMap:
      name: ml-config
```

创建的文件：

```
/etc/config/MODEL_NAME (contains: resnet)
/etc/config/BATCH_SIZE (contains: 32)
/etc/config/config.yaml (contains: full YAML)
```

## Secret

**存储敏感数据**（密码、Token、密钥）。

### 创建 Secret

**通过字面值：**
```bash
kubectl create secret generic ml-api-secret \
  --from-literal=API_KEY=sk-1234567890abcdef \
  --from-literal=DB_PASSWORD=my-secure-password
```

**通过文件：**
```bash
kubectl create secret generic tls-secret \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key
```

**通过 YAML：**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ml-api-secret
type: Opaque
data:
  # Base64 encoded values
  API_KEY: c2stMTIzNDU2Nzg5MGFiY2RlZg==
  DB_PASSWORD: bXktc2VjdXJlLXBhc3N3b3Jk
```

**编码/解码：**
```bash
# Encode
echo -n "my-password" | base64
# bXktcGFzc3dvcmQ=

# Decode
echo "bXktcGFzc3dvcmQ=" | base64 --decode
# my-password
```

### 使用 Secret

**1. 环境变量：**
```yaml
spec:
  containers:
  - name: model-server
    env:
    - name: API_KEY
      valueFrom:
        secretKeyRef:
          name: ml-api-secret
          key: API_KEY
```

**2. 数据卷挂载：**
```yaml
spec:
  containers:
  - name: model-server
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secrets
    secret:
      secretName: ml-api-secret
```

### Secret 类型

```yaml
# Generic (Opaque)
type: Opaque

# Docker registry credentials
type: kubernetes.io/dockerconfigjson

# TLS certificate
type: kubernetes.io/tls

# Service account token
type: kubernetes.io/service-account-token
```

**Docker 镜像仓库 Secret：**
```bash
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.azurecr.io \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=myemail@example.com
```

**在 Pod 中使用：**
```yaml
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: model-server
    image: myregistry.azurecr.io/ml-api:v1
```

## Namespace

集群内部的**逻辑隔离与资源组织机制**。

### 默认 Namespace

```bash
# List namespaces
kubectl get namespaces

# NAME              STATUS   AGE
# default           Active   10d
# kube-system       Active   10d (system components)
# kube-public       Active   10d (publicly readable)
# kube-node-lease   Active   10d (node heartbeats)
```

### 创建 Namespace

```bash
# Imperative
kubectl create namespace ml-team-a

# Declarative
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ml-team-b
EOF
```

### 使用 Namespace

```bash
# Deploy to namespace
kubectl apply -f deployment.yaml -n ml-team-a

# Set default namespace
kubectl config set-context --current --namespace=ml-team-a

# View resources in namespace
kubectl get pods -n ml-team-a

# View all namespaces
kubectl get pods --all-namespaces
```

### Namespace 使用场景

**1. 多租户：**
```
- namespace: team-a
- namespace: team-b
- namespace: team-c
```

**2. 环境分离：**
```
- namespace: dev
- namespace: staging
- namespace: production
```

**3. 资源隔离：**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ml-team-quota
  namespace: ml-team-a
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "200Gi"
    requests.nvidia.com/gpu: "4"
    pods: "50"
```

**4. 网络策略：**
```yaml
# Only allow traffic within namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-external
  namespace: ml-team-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}
```

## 标签与选择器

**标签（Label）组织资源**，选择器（Selector）查询资源。

### 标签

```yaml
metadata:
  labels:
    app: ml-api
    version: v1
    env: production
    team: ml-platform
    cost-center: engineering
```

### 标签操作

```bash
# Add label
kubectl label pod my-pod version=v2

# Update label
kubectl label pod my-pod version=v3 --overwrite

# Remove label
kubectl label pod my-pod version-

# View labels
kubectl get pods --show-labels

# Filter by label
kubectl get pods -l app=ml-api
kubectl get pods -l app=ml-api,version=v1
kubectl get pods -l 'app in (ml-api, ml-batch)'
kubectl get pods -l 'version!=v1'
```

### 资源中的标签选择器

```yaml
# Service selects pods
spec:
  selector:
    app: ml-api
    version: v1

# Deployment manages pods
spec:
  selector:
    matchLabels:
      app: ml-api
  template:
    metadata:
      labels:
        app: ml-api  # Must match selector
```

## 动手实践：使用 ConfigMap 部署 ML API

**步骤 1：创建 ConfigMap**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-config
data:
  MODEL_NAME: "resnet50"
  BATCH_SIZE: "32"
  LOG_LEVEL: "INFO"
EOF
```

**步骤 2：创建 Secret**

```bash
kubectl create secret generic ml-secret \
  --from-literal=API_KEY=sk-test-key-12345
```

**步骤 3：创建 Deployment**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-api
  template:
    metadata:
      labels:
        app: ml-api
        version: v1
    spec:
      containers:
      - name: model-server
        image: ml-api:v1
        ports:
        - containerPort: 8080
        env:
        - name: MODEL_NAME
          valueFrom:
            configMapKeyRef:
              name: ml-config
              key: MODEL_NAME
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: ml-secret
              key: API_KEY
        envFrom:
        - configMapRef:
            name: ml-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

**步骤 4：创建 Service**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-service
spec:
  type: LoadBalancer
  selector:
    app: ml-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

**步骤 5：测试**

```bash
# Get service URL (minikube)
URL=$(minikube service ml-api-service --url)

# Test endpoint
curl $URL/predict

# View logs
kubectl logs -l app=ml-api --tail=20

# Exec into pod
kubectl exec -it $(kubectl get pod -l app=ml-api -o name | head -1) -- /bin/bash

# Inside pod, check environment
echo $MODEL_NAME
echo $BATCH_SIZE
```

## 总结

本课掌握了：

- Pod：原子单元、多容器模式、初始化容器。
- ML 工作负载的资源请求与限制。
- 健康探针：存活、就绪与启动探针。
- ReplicaSet：维持期望副本数。
- Deployment：声明式更新、滚动更新、回滚。
- Service：稳定网络及类型（ClusterIP、NodePort、LoadBalancer）。
- ConfigMap：非敏感配置。
- Secret：敏感数据管理。
- Namespace：逻辑隔离及多租户。
- 标签与选择器：资源组织。

## 下一步

在 **第 04 课：Deployment 与 Service** 中，你将学习：
- 高级部署策略。
- 蓝绿部署与金丝雀部署。
- 服务网格简介。
- 高级健康检查。

## 自我检查问题

1. Pod 与容器有什么区别？
2. 何时使用多容器 Pod？
3. requests 与 limits 有什么区别？
4. 滚动更新如何工作？
5. Service 有哪些类型？何时使用各类型？
6. ConfigMap 与 Secret 有什么区别？

## 补充资源

- [Pod 生命周期](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Secret](https://kubernetes.io/docs/concepts/configuration/secret/)

---

**下一课：** [04-deployments-services.md](./04-deployments-services.md)——高级部署策略与 Service 模式。

> 译注：原文将 ContainerCreating 与 Pod phase 混列，并简化了 Running、Pending 等定义，此处按实际语义区分。QoS 不等同于调度优先级；驱逐还受资源用量、Priority 等因素影响。Secret 的 Base64 编码不是加密，需配置静态加密、最小权限与密钥管理；Namespace 本身也不提供完整安全隔离。生产环境应考虑 EndpointSlice API、探针配置与网络策略。全部原始代码块保持不变，未逐项执行验证。
