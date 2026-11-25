# Kubernetes 速查表

常用 kubectl 命令和 Kubernetes 模式的快速参考。

---

## 基础 kubectl 命令

### 集群信息
```bash
# View cluster info
kubectl cluster-info

# View nodes
kubectl get nodes

# Describe node
kubectl describe node <node-name>

# Get cluster version
kubectl version

# View cluster contexts
kubectl config get-contexts

# Switch context
kubectl config use-context <context-name>

# Set default namespace
kubectl config set-context --current --namespace=<namespace>
```

### 命名空间
```bash
# List namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace <name>

# Delete namespace
kubectl delete namespace <name>

# Set default namespace for current context
kubectl config set-context --current --namespace=<namespace>
```

---

## 操作资源

### Pod
```bash
# List pods
kubectl get pods

# List pods in all namespaces
kubectl get pods --all-namespaces
kubectl get pods -A

# List pods with more details
kubectl get pods -o wide

# Describe pod
kubectl describe pod <pod-name>

# View pod logs
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>

# Logs from specific container in pod
kubectl logs <pod-name> -c <container-name>

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/bash

# Execute in specific container
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash

# Delete pod
kubectl delete pod <pod-name>

# Force delete pod
kubectl delete pod <pod-name> --grace-period=0 --force

# Port forward to pod
kubectl port-forward <pod-name> 8080:80

# Copy files to pod
kubectl cp /local/path <pod-name>:/remote/path

# Copy files from pod
kubectl cp <pod-name>:/remote/path /local/path
```

### Deployment
```bash
# List deployments
kubectl get deployments

# Create deployment
kubectl create deployment <name> --image=<image>

# Describe deployment
kubectl describe deployment <name>

# Edit deployment
kubectl edit deployment <name>

# Delete deployment
kubectl delete deployment <name>

# Scale deployment
kubectl scale deployment <name> --replicas=3

# Update image
kubectl set image deployment/<name> <container>=<new-image>

# Rollout status
kubectl rollout status deployment/<name>

# Rollout history
kubectl rollout history deployment/<name>

# Undo rollout
kubectl rollout undo deployment/<name>

# Undo to specific revision
kubectl rollout undo deployment/<name> --to-revision=2

# Pause rollout
kubectl rollout pause deployment/<name>

# Resume rollout
kubectl rollout resume deployment/<name>

# Restart deployment (rolling restart)
kubectl rollout restart deployment/<name>
```

### Service
```bash
# List services
kubectl get services
kubectl get svc

# Describe service
kubectl describe service <name>

# Create service
kubectl expose deployment <name> --port=80 --target-port=8080

# Delete service
kubectl delete service <name>

# Get service endpoints
kubectl get endpoints <service-name>
```

### ConfigMap
```bash
# List configmaps
kubectl get configmaps
kubectl get cm

# Create from literal
kubectl create configmap <name> --from-literal=key=value

# Create from file
kubectl create configmap <name> --from-file=path/to/file

# Create from directory
kubectl create configmap <name> --from-file=path/to/directory/

# Describe configmap
kubectl describe configmap <name>

# View configmap data
kubectl get configmap <name> -o yaml

# Delete configmap
kubectl delete configmap <name>
```

### Secret
```bash
# List secrets
kubectl get secrets

# Create from literal
kubectl create secret generic <name> --from-literal=key=value

# Create from file
kubectl create secret generic <name> --from-file=path/to/file

# Create TLS secret
kubectl create secret tls <name> --cert=path/to/cert --key=path/to/key

# Describe secret
kubectl describe secret <name>

# View secret data (base64 encoded)
kubectl get secret <name> -o yaml

# Decode secret value
kubectl get secret <name> -o jsonpath='{.data.key}' | base64 --decode

# Delete secret
kubectl delete secret <name>
```

---

## 资源管理

### Apply 与 Create
```bash
# Apply configuration from file
kubectl apply -f <file>.yaml

# Apply from directory
kubectl apply -f ./configs/

# Apply from URL
kubectl apply -f https://example.com/config.yaml

# Create resource from file
kubectl create -f <file>.yaml

# Delete resources from file
kubectl delete -f <file>.yaml

# Replace resource
kubectl replace -f <file>.yaml

# Dry run (see what would be created)
kubectl apply -f <file>.yaml --dry-run=client -o yaml

# Server-side dry run
kubectl apply -f <file>.yaml --dry-run=server
```

### 标签与选择器
```bash
# Show labels
kubectl get pods --show-labels

# Add label
kubectl label pod <pod-name> env=prod

# Remove label
kubectl label pod <pod-name> env-

# Select by label
kubectl get pods -l env=prod

# Select by multiple labels
kubectl get pods -l env=prod,tier=frontend

# Select by label with values
kubectl get pods -l 'env in (prod,staging)'
```

### 注解
```bash
# Add annotation
kubectl annotate pod <pod-name> description="My pod"

# Remove annotation
kubectl annotate pod <pod-name> description-

# View annotations
kubectl describe pod <pod-name>
```

---

## 调试与故障排查

### 事件
```bash
# View events
kubectl get events

# Watch events
kubectl get events --watch

# Sort events by timestamp
kubectl get events --sort-by='.metadata.creationTimestamp'

# Events for specific resource
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### 日志
```bash
# View logs
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>

# Last N lines
kubectl logs --tail=100 <pod-name>

# Logs from previous instance
kubectl logs <pod-name> --previous

# Logs from all containers in pod
kubectl logs <pod-name> --all-containers=true

# Logs with timestamps
kubectl logs <pod-name> --timestamps
```

### 资源使用量
```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods

# Pod usage in all namespaces
kubectl top pods --all-namespaces

# Container usage within pod
kubectl top pod <pod-name> --containers
```

### 调试 Pod
```bash
# Run debug container
kubectl run -it debug --image=busybox --rm --restart=Never -- sh

# Run debug container with network tools
kubectl run -it debug --image=nicolaka/netshoot --rm --restart=Never -- sh

# Debug pod with specific node
kubectl run -it debug --image=busybox --rm --restart=Never --overrides='{"spec":{"nodeName":"node-1"}}' -- sh

# Attach to running pod
kubectl attach <pod-name> -it

# Get pod YAML
kubectl get pod <pod-name> -o yaml

# Get pod JSON
kubectl get pod <pod-name> -o json

# Check pod's service account
kubectl get pod <pod-name> -o jsonpath='{.spec.serviceAccountName}'
```

---

## 高级操作

### JSONPath
```bash
# Get pod IP addresses
kubectl get pods -o jsonpath='{.items[*].status.podIP}'

# Get container images
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}'

# Get pod names
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,STATUS:.status.phase
```

### Watch 与 Wait
```bash
# Watch resource changes
kubectl get pods --watch

# Wait for condition
kubectl wait --for=condition=ready pod/<pod-name>

# Wait for deletion
kubectl wait --for=delete pod/<pod-name> --timeout=60s
```

### 资源清理
```bash
# Delete completed pods
kubectl delete pods --field-selector=status.phase=Succeeded

# Delete evicted pods
kubectl delete pods --field-selector=status.phase=Failed

# Delete all pods in namespace
kubectl delete pods --all -n <namespace>

# Delete resources by label
kubectl delete pods -l app=myapp
```

---

## RBAC 与安全

```bash
# List service accounts
kubectl get serviceaccounts

# Create service account
kubectl create serviceaccount <name>

# List roles
kubectl get roles

# List cluster roles
kubectl get clusterroles

# List role bindings
kubectl get rolebindings

# Create role binding
kubectl create rolebinding <name> --role=<role> --serviceaccount=<namespace>:<sa-name>

# Check permissions
kubectl auth can-i create pods
kubectl auth can-i create pods --as=<user>

# View who can perform action
kubectl auth can-i --list
```

---

## 常见资源定义

### Deployment 示例
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        env:
        - name: ENV_VAR
          value: "value"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service 示例
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  type: ClusterIP  # or LoadBalancer, NodePort
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

### HorizontalPodAutoscaler 示例
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## GPU 调度

```yaml
# Pod with GPU request
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
  - name: cuda-container
    image: nvidia/cuda:11.8.0-base-ubuntu22.04
    resources:
      limits:
        nvidia.com/gpu: 1  # Request 1 GPU
```

```bash
# List nodes with GPUs
kubectl get nodes -l nvidia.com/gpu.present=true

# Check GPU capacity
kubectl describe node <node-name> | grep nvidia.com/gpu
```

---

## 实用单行命令

```bash
# Get all resources in namespace
kubectl get all -n <namespace>

# Delete all evicted pods
kubectl get pods | grep Evicted | awk '{print $1}' | xargs kubectl delete pod

# Get pod restart count
kubectl get pods --sort-by='.status.containerStatuses[0].restartCount'

# Find pods not in Running state
kubectl get pods --field-selector=status.phase!=Running

# Get images of all running pods
kubectl get pods -o jsonpath="{.items[*].spec.containers[*].image}" | tr -s '[[:space:]]' '\n' | sort | uniq

# Force delete all pods in namespace
kubectl delete pods --all --grace-period=0 --force -n <namespace>

# Get pod IPs
kubectl get pods -o wide --no-headers | awk '{print $6}'

# Restart all pods in deployment
kubectl rollout restart deployment/<name>

# Get pods sorted by memory usage
kubectl top pods --sort-by=memory

# Get pods sorted by CPU usage
kubectl top pods --sort-by=cpu
```

---

## Helm 命令

```bash
# Add repo
helm repo add <name> <url>

# Update repos
helm repo update

# Search charts
helm search repo <chart-name>

# Install chart
helm install <release-name> <chart-name>

# Install with custom values
helm install <release-name> <chart-name> -f values.yaml

# List releases
helm list

# Upgrade release
helm upgrade <release-name> <chart-name>

# Rollback release
helm rollback <release-name> <revision>

# Uninstall release
helm uninstall <release-name>

# Get release status
helm status <release-name>

# Get release values
helm get values <release-name>
```

---

## 实用技巧

1. **使用别名** — `alias k=kubectl` 可节省大量输入。
2. **使用 kubectl 补全** — `source <(kubectl completion bash)`。
3. **设置默认命名空间** — 避免重复输入 `-n <namespace>`。
4. **使用 -o yaml** — 适合调试和理解资源。
5. **Dry run** — 先用 `--dry-run=client` 测试。
6. **标签** — 使用一致的标签便于管理。
7. **资源限制** — 设置 requests 和 limits。
8. **健康检查** — 添加存活探针和就绪探针。
9. **使用 context** — 方便切换集群。
10. **kubectl explain** — `kubectl explain pod.spec` 获取内联文档。

---

**另见：**
- [Docker 速查表](./docker-cheat-sheet.md)
- [Git 速查表](./git-cheat-sheet.md)
- [Linux 命令速查表](./linux-cheat-sheet.md)

> 译注：在生产环境执行资源删除前，确认当前 context、namespace 和选择器；客户端 dry run 不等于服务器端准入校验。
