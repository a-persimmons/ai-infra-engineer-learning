# 第 04 课：深入 Deployment 与 Service

**时长：** 8 小时
**目标：** 掌握面向 ML 工作负载的高级部署策略、服务模式及健康检查。

## 导论

你已经学习了 Deployment 与 Service 的基础。现在探索生产 ML 基础设施中的关键高级模式：滚动更新、蓝绿部署、金丝雀发布及全面的健康检查。

## 高级部署策略

### 1. 滚动更新（默认）

通过逐步替换 Pod 实现**以零停机为目标的部署**。

**配置：**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2          # Max 2 extra pods (20%)
      maxUnavailable: 1    # Max 1 unavailable (10%)
  template:
    spec:
      containers:
      - name: model-server
        image: ml-model:v2
```

**工作方式：**
```
Initial state:     [v1] [v1] [v1] [v1] [v1]
maxSurge +2:       [v1] [v1] [v1] [v1] [v1] [v2] [v2]
maxUnavailable 1:  [v1] [v1] [v1] [v1] [X]  [v2] [v2]
Replace:           [v1] [v1] [v1] [v1] [v2] [v2] [v2]
Continue:          [v2] [v2] [v2] [v2] [v2] [v2] [v2]
```

**ML 模型最佳实践：**
```yaml
# Conservative rollout for critical models
rollingUpdate:
  maxSurge: 1
  maxUnavailable: 0    # No downtime tolerance

# Aggressive for non-critical
rollingUpdate:
  maxSurge: 3
  maxUnavailable: 2
```

### 2. 蓝绿部署

**两个完整环境：** 蓝色（当前版本）与绿色（新版本）。

**通过标签实现：**
```yaml
# Blue deployment (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-model
      version: blue
  template:
    metadata:
      labels:
        app: ml-model
        version: blue
    spec:
      containers:
      - name: model
        image: ml-model:v1

---
# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-model
      version: green
  template:
    metadata:
      labels:
        app: ml-model
        version: green
    spec:
      containers:
      - name: model
        image: ml-model:v2

---
# Service initially points to blue
apiVersion: v1
kind: Service
metadata:
  name: ml-model-service
spec:
  selector:
    app: ml-model
    version: blue  # Switch to 'green' to cutover
  ports:
  - port: 80
    targetPort: 8080
```

**切换过程：**
```bash
# 1. Deploy green alongside blue
kubectl apply -f green-deployment.yaml

# 2. Test green independently
kubectl port-forward deployment/ml-model-green 8080:8080

# 3. Switch service to green (instant cutover)
kubectl patch service ml-model-service -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Monitor for issues

# 5. If OK, delete blue
kubectl delete deployment ml-model-blue

# 6. If issues, rollback to blue
kubectl patch service ml-model-service -p '{"spec":{"selector":{"version":"blue"}}}'
```

**优点：**
- 可以快速切换与回滚。
- 切换之前可以进行完整测试。
- 两个完整的环境。

**缺点：**
- 切换期间需要双倍资源。
- 成本较高。

### 3. 金丝雀部署

**逐步发布：** 将少量流量路由至新版本。

**使用多个 Deployment：**
```yaml
# Stable deployment (90% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: ml-model
      track: stable
  template:
    metadata:
      labels:
        app: ml-model
        track: stable
    spec:
      containers:
      - name: model
        image: ml-model:v1

---
# Canary deployment (10% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ml-model
      track: canary
  template:
    metadata:
      labels:
        app: ml-model
        track: canary
    spec:
      containers:
      - name: model
        image: ml-model:v2

---
# Service balances across both
apiVersion: v1
kind: Service
metadata:
  name: ml-model-service
spec:
  selector:
    app: ml-model  # Matches both stable and canary
  ports:
  - port: 80
    targetPort: 8080
```

**流量分布：**
```
9 stable pods + 1 canary pod = ~10% to canary
```

**逐步发布：**
```bash
# Start: 10% canary
kubectl scale deployment ml-model-stable --replicas=9
kubectl scale deployment ml-model-canary --replicas=1

# If metrics OK: 25% canary
kubectl scale deployment ml-model-stable --replicas=6
kubectl scale deployment ml-model-canary --replicas=2

# If metrics OK: 50% canary
kubectl scale deployment ml-model-stable --replicas=4
kubectl scale deployment ml-model-canary --replicas=4

# If metrics OK: 100% canary
kubectl scale deployment ml-model-stable --replicas=0
kubectl scale deployment ml-model-canary --replicas=8

# Cleanup: rename canary to stable
```

**通过 Flagger 实现高级金丝雀部署（GitOps）：**
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: ml-model
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-model
  service:
    port: 8080
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      threshold: 99
    - name: request-duration
      threshold: 500
```

### 4. Recreate 策略

**先删除所有旧 Pod，再创建新 Pod**——会产生停机时间。

```yaml
strategy:
  type: Recreate
```

**使用场景：**
- 需要停机的数据库迁移。
- 不兼容版本无法共存。
- 资源受限（无法同时运行两个版本）。

**过程：**
```
[v1] [v1] [v1] → (delete all) → [v2] [v2] [v2]
         ↓ Downtime
```

## 高级健康检查

### 全面的健康检查配置

**针对 ML 模型服务：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ml-model-server
spec:
  containers:
  - name: model
    image: ml-model:v1
    ports:
    - containerPort: 8080

    # Startup probe: large model loading (60 seconds)
    startupProbe:
      httpGet:
        path: /startup
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 5
      failureThreshold: 12  # 60 seconds (12 * 5s)

    # Liveness probe: is container alive?
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 60
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3     # Restart after 30s (3 * 10s)
      successThreshold: 1

    # Readiness probe: ready for traffic?
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
      successThreshold: 2  # Must succeed twice
```

### 健康检查实现

**Flask 示例：**
```python
from flask import Flask, jsonify
import time
import threading

app = Flask(__name__)

# State tracking
startup_complete = False
model_loaded = False
healthy = True

def load_model():
    global model_loaded, startup_complete
    time.sleep(30)  # Simulate slow model loading
    model_loaded = True
    startup_complete = True

# Start model loading in background
threading.Thread(target=load_model, daemon=True).start()

@app.route('/startup', methods=['GET'])
def startup():
    """Startup probe: has initial setup completed?"""
    if startup_complete:
        return jsonify({'status': 'ready'}), 200
    return jsonify({'status': 'loading'}), 503

@app.route('/health', methods=['GET'])
def health():
    """Liveness probe: is application alive?"""
    if healthy:
        return jsonify({'status': 'healthy'}), 200
    return jsonify({'status': 'unhealthy'}), 503

@app.route('/ready', methods=['GET'])
def ready():
    """Readiness probe: ready to serve traffic?"""
    if model_loaded and healthy:
        # Additional checks
        if check_dependencies():  # DB, cache, etc.
            return jsonify({'status': 'ready'}), 200
    return jsonify({'status': 'not_ready'}), 503
```

### 自定义探针处理方式

**TCP Socket 探针：**
```yaml
livenessProbe:
  tcpSocket:
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
```

**Exec 命令探针：**
```yaml
livenessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - "curl -f http://localhost:8080/health || exit 1"
  initialDelaySeconds: 30
  periodSeconds: 10
```

**gRPC 探针（原文以 Kubernetes 1.24+ 为例）：**
```yaml
livenessProbe:
  grpc:
    port: 9090
  initialDelaySeconds: 10
```

## Service 模式

### 1. StatefulSet 的 Headless Service

用于需要稳定 DNS 名称的 Pod，例如**分布式 ML 训练**。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-training
spec:
  clusterIP: None  # Headless
  selector:
    app: ml-training
  ports:
  - port: 8080
    name: training

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ml-training
spec:
  serviceName: ml-training  # Links to headless service
  replicas: 3
  selector:
    matchLabels:
      app: ml-training
  template:
    metadata:
      labels:
        app: ml-training
    spec:
      containers:
      - name: trainer
        image: distributed-trainer:v1
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

**DNS 名称：**
```
ml-training-0.ml-training.default.svc.cluster.local
ml-training-1.ml-training.default.svc.cluster.local
ml-training-2.ml-training.default.svc.cluster.local
```

### 2. Session Affinity（会话亲和性/粘性会话）

**将同一客户端的请求尽可能路由至同一个 Pod。**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-model-sticky
spec:
  selector:
    app: ml-model
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 3 hours
  ports:
  - port: 80
    targetPort: 8080
```

**使用场景：**
- 有状态 ML 应用。
- 逐 Pod 模型缓存。
- WebSocket 连接。

### 3. 外部服务

**访问外部数据库/API：**

```yaml
# External service (outside cluster)
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: mysql-instance.cxxxx.us-west-2.rds.amazonaws.com

---
# Or with endpoints for IP-based
apiVersion: v1
kind: Service
metadata:
  name: external-api
spec:
  ports:
  - port: 443
    targetPort: 443

---
apiVersion: v1
kind: Endpoints
metadata:
  name: external-api
subsets:
- addresses:
  - ip: 203.0.113.42
  ports:
  - port: 443
```

### 4. Service 拓扑（局部性）

**优先将流量路由至邻近 Pod**，降低延迟。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-model-local
spec:
  selector:
    app: ml-model
  topologyKeys:
  - "kubernetes.io/hostname"    # Same node
  - "topology.kubernetes.io/zone"  # Same zone
  - "*"                         # Any node
  ports:
  - port: 80
    targetPort: 8080
```

## ML 工作负载的资源管理

### QoS（Quality of Service，服务质量）类别

**1. Guaranteed（通常具有较强驱逐保护）：**
```yaml
resources:
  requests:
    memory: "16Gi"
    cpu: "4"
    nvidia.com/gpu: "1"
  limits:
    memory: "16Gi"
    cpu: "4"
    nvidia.com/gpu: "1"
```

**2. Burstable：**
```yaml
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
# No resources specified
# Evicted first under pressure
```

### 资源配额与限制

**Namespace 级配额：**
```yaml
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
    limits.cpu: "200"
    limits.memory: "400Gi"
    pods: "50"
    services.loadbalancers: "5"
```

**LimitRange（默认限制）：**
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: ml-limits
  namespace: ml-team
spec:
  limits:
  - max:
      cpu: "16"
      memory: "64Gi"
    min:
      cpu: "100m"
      memory: "128Mi"
    default:
      cpu: "1"
      memory: "2Gi"
    defaultRequest:
      cpu: "500m"
      memory: "1Gi"
    type: Container
```

## 动手实践：ML 模型金丝雀部署

**搭建环境：**
```bash
# Create namespace
kubectl create namespace ml-canary

# Deploy stable version
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-stable
  namespace: ml-canary
spec:
  replicas: 9
  selector:
    matchLabels:
      app: ml-model
      track: stable
  template:
    metadata:
      labels:
        app: ml-model
        track: stable
        version: v1
    spec:
      containers:
      - name: model
        image: hashicorp/http-echo:latest
        args:
        - "-text=Model v1 (stable)"
        - "-listen=:8080"
        ports:
        - containerPort: 8080
EOF

# Deploy canary version
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-canary
  namespace: ml-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ml-model
      track: canary
  template:
    metadata:
      labels:
        app: ml-model
        track: canary
        version: v2
    spec:
      containers:
      - name: model
        image: hashicorp/http-echo:latest
        args:
        - "-text=Model v2 (canary)"
        - "-listen=:8080"
        ports:
        - containerPort: 8080
EOF

# Create service
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: ml-model
  namespace: ml-canary
spec:
  selector:
    app: ml-model
  ports:
  - port: 80
    targetPort: 8080
EOF
```

**测试流量分布：**
```bash
# Port forward service
kubectl port-forward -n ml-canary svc/ml-model 8080:80 &

# Send 100 requests and count distribution
for i in {1..100}; do curl -s http://localhost:8080; done | sort | uniq -c

# Expected:
# ~90 Model v1 (stable)
# ~10 Model v2 (canary)
```

**晋升金丝雀版本：**
```bash
# Gradually increase canary traffic
kubectl scale deployment ml-model-stable --replicas=6 -n ml-canary
kubectl scale deployment ml-model-canary --replicas=4 -n ml-canary

# Test again
for i in {1..100}; do curl -s http://localhost:8080; done | sort | uniq -c

# If metrics good, full cutover
kubectl scale deployment ml-model-stable --replicas=0 -n ml-canary
kubectl scale deployment ml-model-canary --replicas=10 -n ml-canary
```

**清理：**
```bash
kubectl delete namespace ml-canary
```

## 生产环境最佳实践

### 1. 始终使用就绪探针

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

没有就绪探针时，Pod 可能在应用真正准备好之前接收流量，导致启动期间发生错误。

### 2. 设置资源请求与限制

```yaml
resources:
  requests:
    memory: "2Gi"
    cpu: "1"
  limits:
    memory: "4Gi"
    cpu: "2"
```

### 3. 使用 Deployment 注解

```yaml
metadata:
  annotations:
    kubernetes.io/change-cause: "Update to model v2.1 with improved accuracy"
```

查看历史：
```bash
kubectl rollout history deployment/ml-model
```

### 4. PodDisruptionBudget（PDB，Pod 中断预算）

**在自愿中断期间保护应用可用性：**

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ml-model-pdb
spec:
  minAvailable: 2  # At least 2 pods always available
  selector:
    matchLabels:
      app: ml-model
```

或者：

```yaml
spec:
  maxUnavailable: 1  # Max 1 pod can be down
```

### 5. 反亲和性规则

**将 Pod 分散至不同节点/可用区：**

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: ml-model
      topologyKey: kubernetes.io/hostname  # Different nodes
```

或者跨可用区：

```yaml
topologyKey: topology.kubernetes.io/zone
```

## 总结

本课掌握了：

- 高级部署策略：滚动更新、蓝绿部署、金丝雀部署。
- 全面的健康检查配置。
- Service 模式：Headless、会话亲和性、外部服务。
- 资源管理与 QoS 类别。
- 面向生产 ML 工作负载的最佳实践。
- 金丝雀部署动手实践。

## 下一步

**第 05 课：网络与 Ingress**——深入 Kubernetes 网络、Ingress Controller 及 TLS 终止。

## 自我检查问题

1. 蓝绿部署与金丝雀部署有什么区别？
2. 何时使用 Headless Service？
3. 每种健康探针的目的是什么？
4. 资源请求如何影响调度？
5. 什么是 PodDisruptionBudget？为什么使用它？

---

**下一课：** [05-networking-ingress.md](./05-networking-ingress.md)

> 译注：使用副本数量控制金丝雀流量比例只是近似方案，连接复用、就绪状态、拓扑和会话亲和性等均会影响实际流量。需要精确权重时应使用支持流量分配的网关或服务网格。PDB 主要约束通过 Eviction API 进行的自愿中断，不会防止节点故障或所有直接删除，也不能单独保证可用性；滚动更新还需 Deployment 自身策略。Session Affinity 通常基于客户端 IP，不能提供应用状态持久化。gRPC 探针的支持阶段随 Kubernetes 版本变化。原始代码块及英文注释保持不变，未逐项运行验证。
