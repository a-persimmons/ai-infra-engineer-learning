# 练习 03：面向 ML 的 Kubernetes 部署

**时长：** 3–4 小时
**难度：** 高级
**前置条件：** 第 07、08 课及练习 02（Docker）

## 学习目标

完成本练习后，你将能够：
- 将 ML 应用部署至 Kubernetes。
- 创建并管理 Deployment、Service 和 ConfigMap。
- 实现健康检查与就绪探针。
- 使用 HPA 配置自动扩缩容。
- 管理应用配置。
- 监控已部署的应用。
- 执行滚动更新及回滚。

---

## 前置环境配置

### 安装所需工具

**kubectl：**
```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

**minikube（本地 Kubernetes）：**
```bash
# macOS
brew install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start minikube
minikube start --cpus=2 --memory=4096

# Verify
kubectl get nodes
```

---

## 第一部分：基础部署（45 分钟）

### 任务 1.1：创建简单的 Deployment

创建 `deployment.yaml`：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api
  labels:
    app: ml-api

spec:
  replicas: 2  # Start with 2 pods for HA

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
        image: ml-app:v2  # From Exercise 02
        ports:
        - containerPort: 8000
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
```

**你的任务：**
1. 将 Docker 镜像加载至 minikube：
```bash
# Build image if not already done
docker build -t ml-app:v2 .

# Load into minikube
minikube image load ml-app:v2
```

2. 应用 Deployment：
```bash
kubectl apply -f deployment.yaml
```

3. 检查 Deployment 状态：
```bash
kubectl get deployments
kubectl get pods
kubectl describe deployment ml-api
```

4. 查看 Pod 日志：
```bash
# Get pod name
kubectl get pods

# View logs
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>
```

**预期结果：**
- 成功创建 Deployment。
- 两个 Pod 正在运行。
- Pod 显示 Running 状态。

**问题：**
1. `replicas: 2` 表示什么？
2. 为什么需要设置资源 requests 与 limits？
3. 删除一个 Pod 后会发生什么？

---

### 任务 1.2：创建 Service

创建 `service.yaml`：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-service
  labels:
    app: ml-api

spec:
  type: LoadBalancer  # For minikube, use NodePort or LoadBalancer

  selector:
    app: ml-api  # Must match deployment labels

  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
```

**你的任务：**
1. 应用 Service：
```bash
kubectl apply -f service.yaml
```

2. 获取 Service 详细信息：
```bash
kubectl get services
kubectl describe service ml-api-service
```

3. 访问 Service：
```bash
# For minikube
minikube service ml-api-service --url

# Or use port forwarding
kubectl port-forward service/ml-api-service 8000:80

# Test
curl http://localhost:8000/health
```

**预期结果：**
- 成功创建 Service。
- Service 具有后端端点。
- 可以访问 /health 端点。

---

## 第二部分：配置管理（45 分钟）

### 任务 2.1：创建 ConfigMap

创建 `configmap.yaml`：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-api-config

data:
  # Model configuration
  model_name: "resnet18"
  device: "cpu"

  # Server configuration
  port: "8000"
  log_level: "info"
  workers: "1"

  # Feature flags
  enable_metrics: "true"
  enable_cache: "false"

  # Inference settings
  default_top_k: "5"
  max_batch_size: "32"
```

**你的任务：**
1. 应用 ConfigMap：
```bash
kubectl apply -f configmap.yaml
```

2. 查看 ConfigMap：
```bash
kubectl get configmap ml-api-config
kubectl describe configmap ml-api-config
```

3. 更新 Deployment，使其使用 ConfigMap。

修改 `deployment.yaml`：
```yaml
spec:
  template:
    spec:
      containers:
      - name: ml-api
        # ... existing config ...

        # Add environment variables from ConfigMap
        env:
        - name: MODEL_NAME
          valueFrom:
            configMapKeyRef:
              name: ml-api-config
              key: model_name
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: ml-api-config
              key: log_level
        - name: DEVICE
          valueFrom:
            configMapKeyRef:
              name: ml-api-config
              key: device

        # Or use envFrom to import all keys
        envFrom:
        - configMapRef:
            name: ml-api-config
```

4. 应用更新后的 Deployment：
```bash
kubectl apply -f deployment.yaml
```

5. 验证环境变量：
```bash
kubectl exec <pod-name> -- env | grep MODEL
```

**预期结果：**
- ConfigMap 已创建。
- Pod 包含来自 ConfigMap 的环境变量。
- 应用正确读取配置。

---

### 任务 2.2：更新配置

**你的任务：**
1. 更新 ConfigMap（将 `log_level` 修改为 `debug`）：
```bash
kubectl edit configmap ml-api-config
# Or edit configmap.yaml and reapply
```

2. 重启 Pod 以获取新配置：
```bash
kubectl rollout restart deployment ml-api
```

3. 验证新配置：
```bash
kubectl exec <pod-name> -- env | grep LOG_LEVEL
```

**问题：**
1. 为什么需要重启 Pod？
2. 如何实现配置更新自动化？

---

## 第三部分：健康检查与探针（30 分钟）

### 任务 3.1：添加健康探针

更新 `deployment.yaml`，添加存活探针（Liveness Probe）与就绪探针（Readiness Probe）：

```yaml
spec:
  template:
    spec:
      containers:
      - name: ml-api
        # ... existing config ...

        # Liveness probe: Restart pod if unhealthy
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60  # Wait for model to load
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe: Remove from service if not ready
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

**你的任务：**
1. 应用更新后的 Deployment。
2. 观察 Pod 状态：
```bash
kubectl get pods -w
```

3. 检查探针状态：
```bash
kubectl describe pod <pod-name>
```

4. 测试故障场景：
   - 修改应用，使 /health 返回 500。
   - 重新构建并加载镜像。
   - 观察 Pod 中容器的重启。

**预期结果：**
- 通过就绪检查时，Pod 显示 READY 1/1。
- 存活探针持续失败会触发容器重启。
- 就绪探针失败时，Pod 不再作为正常 Service 流量的就绪后端。

**问题：**
1. 存活探针与就绪探针有什么区别？
2. 何时应增大 initialDelaySeconds？

---

## 第四部分：自动扩缩容（45 分钟）

### 任务 4.1：安装 Metrics Server

```bash
# Install metrics server (required for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For minikube, you may need to disable TLS
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Verify metrics server
kubectl top nodes
kubectl top pods
```

---

### 任务 4.2：创建 HPA

创建 `hpa.yaml`：
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-api-hpa

spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-api

  minReplicas: 2
  maxReplicas: 10

  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60
```

**你的任务：**
1. 应用 HPA：
```bash
kubectl apply -f hpa.yaml
```

2. 检查 HPA 状态：
```bash
kubectl get hpa
kubectl describe hpa ml-api-hpa
```

3. 生成负载以测试扩缩容：
```bash
# Get service URL
SERVICE_URL=$(minikube service ml-api-service --url)

# Install Apache Bench (if not installed)
# macOS: brew install apache-bench
# Linux: sudo apt-get install apache2-utils

# Generate load
ab -n 10000 -c 50 $SERVICE_URL/info
```

4. 观察扩缩容：
```bash
# Terminal 1: Watch HPA
kubectl get hpa -w

# Terminal 2: Watch pods
kubectl get pods -w

# Terminal 3: Watch metrics
watch kubectl top pods
```

**预期结果（原文示例）：**
- 负载增加时 CPU 使用率上升。
- HPA 增加 Pod 副本数（2 → 4 → 6 → …）。
- 负载停止后，HPA 缩容（原文示例等待约 5 分钟）。

**问题：**
1. 扩容需要多长时间？
2. 为什么缩容时间更长？
3. 达到 maxReplicas 时会发生什么？

---

## 第五部分：滚动更新与回滚（30 分钟）

### 任务 5.1：执行滚动更新

接下来将应用更新至新版本。

**你的任务：**
1. 修改 `src/app.py`（更改一条消息）：
```python
@app.get("/")
def root():
    return {"message": "ML Model API v2.0", "model": "ResNet-18"}
```

2. 构建新镜像：
```bash
docker build -t ml-app:v3 .
minikube image load ml-app:v3
```

3. 更新 Deployment：
```bash
kubectl set image deployment/ml-api ml-api=ml-app:v3
```

4. 观察发布过程：
```bash
kubectl rollout status deployment/ml-api

# See rollout history
kubectl rollout history deployment/ml-api
```

5. 验证更新：
```bash
curl $(minikube service ml-api-service --url)/
```

**预期结果：**
- 旧 Pod 逐步终止。
- 新 Pod 逐步启动。
- 更新过程中以无停机为目标。
- 新版本正在运行。

---

### 任务 5.2：回滚 Deployment

**你的任务：**
1. 检查发布历史：
```bash
kubectl rollout history deployment/ml-api
```

2. 回滚至上一版本：
```bash
kubectl rollout undo deployment/ml-api
```

3. 验证回滚：
```bash
kubectl rollout status deployment/ml-api
curl $(minikube service ml-api-service --url)/
```

4. 回滚至特定修订版本：
```bash
kubectl rollout undo deployment/ml-api --to-revision=1
```

**预期结果：**
- 成功完成回滚。
- 上一版本正在运行。
- 以无停机为目标。

---

## 第六部分：监控与调试（45 分钟）

### 任务 6.1：查看日志

**你的任务：**
1. 查看所有相关 Pod 的日志：
```bash
kubectl logs -l app=ml-api
```

2. 持续查看指定 Pod 的日志：
```bash
kubectl logs -f <pod-name>
```

3. 查看上一个容器实例的日志（如果发生崩溃）：
```bash
kubectl logs <pod-name> --previous
```

4. 流式查看多个 Pod 的日志：
```bash
kubectl logs -f -l app=ml-api --all-containers=true
```

---

### 任务 6.2：调试 Pod

**你的任务：**
1. 获取 Pod 详细信息：
```bash
kubectl describe pod <pod-name>
```

2. 在 Pod 的容器中执行命令：
```bash
# Interactive shell
kubectl exec -it <pod-name> -- /bin/bash

# Single command
kubectl exec <pod-name> -- env
kubectl exec <pod-name> -- ps aux
kubectl exec <pod-name> -- curl localhost:8000/health
```

3. 检查事件：
```bash
kubectl get events --sort-by='.lastTimestamp'
```

4. 通过端口转发进行调试：
```bash
kubectl port-forward <pod-name> 8000:8000
```

---

### 任务 6.3：资源使用

**你的任务：**
1. 查看当前资源使用：
```bash
kubectl top nodes
kubectl top pods
kubectl top pods -l app=ml-api
```

2. 检查资源 requests 与 limits：
```bash
kubectl describe nodes
```

3. 识别资源消耗较大的 Pod：
```bash
kubectl top pods --sort-by=cpu
kubectl top pods --sort-by=memory
```

---

## 第七部分：挑战任务（可选，1–2 小时）

### 挑战 1：多环境配置

为开发、预发布及生产环境创建独立配置：

```bash
# Create namespaces
kubectl create namespace development
kubectl create namespace production

# Deploy to different namespaces
kubectl apply -f deployment.yaml -n development
kubectl apply -f deployment.yaml -n production

# Different configs per environment
kubectl apply -f configmap-dev.yaml -n development
kubectl apply -f configmap-prod.yaml -n production
```

### 挑战 2：实现蓝绿部署

```yaml
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-api
      version: blue
  template:
    metadata:
      labels:
        app: ml-api
        version: blue
    spec:
      containers:
      - name: ml-api
        image: ml-app:v2

---
# Green deployment (new)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-api
      version: green
  template:
    metadata:
      labels:
        app: ml-api
        version: green
    spec:
      containers:
      - name: ml-api
        image: ml-app:v3

---
# Service (switch between blue and green)
apiVersion: v1
kind: Service
metadata:
  name: ml-api-service
spec:
  selector:
    app: ml-api
    version: blue  # Change to 'green' to switch
  ports:
  - port: 80
    targetPort: 8000
```

### 挑战 3：添加 PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ml-api-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: ml-api
```

这可以在节点维护、集群升级等自愿中断场景中，限制同时被驱逐的 Pod 数量，以至少保留一个可用 Pod 为目标。

### 挑战 4：实现金丝雀部署

将新版本部署至约 10% 的 Pod，逐步提高比例：

```yaml
# Stable deployment (90%)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api-stable
spec:
  replicas: 9
  template:
    spec:
      containers:
      - name: ml-api
        image: ml-app:v2

---
# Canary deployment (10%)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api-canary
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: ml-api
        image: ml-app:v3
```

---

## 验证检查清单

完成本练习后，你应能够：

- [ ] 将应用部署至 Kubernetes。
- [ ] 创建并管理 Deployment。
- [ ] 创建并管理 Service（ClusterIP、NodePort、LoadBalancer）。
- [ ] 使用 ConfigMap 进行配置管理。
- [ ] 实现健康检查（存活、就绪探针）。
- [ ] 使用 HPA 配置自动扩缩容。
- [ ] 执行滚动更新。
- [ ] 回滚失败的部署。
- [ ] 查看及分析日志。
- [ ] 调试 Pod 问题。
- [ ] 监控资源使用。
- [ ] 理解 Pod 生命周期。

---

## 清理

完成后，清理实验资源：

```bash
# Delete all resources
kubectl delete deployment ml-api
kubectl delete service ml-api-service
kubectl delete configmap ml-api-config
kubectl delete hpa ml-api-hpa

# Or delete everything in namespace
kubectl delete all --all

# Stop minikube
minikube stop

# Delete minikube cluster
minikube delete
```

---

## 提交（如果作为课程作业）

创建包含以下内容的 ZIP 文件：
1. 所有 YAML 文件（deployment、service、configmap、hpa）。
2. Pod 运行截图。
3. HPA 扩缩容截图。
4. 滚动更新截图。
5. 练习中所有问题的答案。
6. `kubectl get all` 的输出。

---

## 补充资源

- [Kubernetes 文档](https://kubernetes.io/docs/)
- [Kubernetes 模式](https://k8spatterns.io/)
- [生产最佳实践](https://kubernetes.io/docs/setup/best-practices/)
- [kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

---

**下一步：** 完成 [项目 101](../../../projects/project-101-basic-model-serving/)，构建完整的 ML 服务系统！

> 译注：HPA 扩缩容行为取决于指标、容差、稳定窗口、资源配置及实际负载。镜像更新应使用唯一版本标签，避免本地镜像缓存导致旧版本继续运行。滚动更新不保证绝对零停机；PDB 仅限制受其约束的自愿驱逐，不能保证应对节点故障等非自愿中断。按 Pod 数量划分金丝雀比例不一定等于真实流量比例。清理前确认 kubectl 当前上下文和命名空间。原始代码块及 TODO 保留，未实际部署。
