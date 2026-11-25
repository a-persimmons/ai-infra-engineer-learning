# 第 05 课：Kubernetes 网络与 Ingress

## 学习目标
完成本课后，你将能够：
- 理解 Kubernetes 网络模型。
- 配置不同的 Service 类型（ClusterIP、NodePort、LoadBalancer）。
- 使用 Ingress Controller 实现 HTTP/HTTPS 路由。
- 为 ML API 配置 TLS/SSL 终止。
- 设置 NetworkPolicy，保障网络安全。
- 通过 Ingress 规则将流量路由至多个 ML 模型。
- 排查常见网络问题。

## 前置条件
- 完成第 01–04 课（Kubernetes 基础）。
- 理解基本网络概念（IP、DNS、端口）。
- 熟悉 HTTP/HTTPS 协议。
- 理解 Service 与 Deployment。

## 导论

网络对 ML 基础设施至关重要：
- **模型服务：** 客户端必须能够访问 ML API。
- **微服务：** ML 流水线通常由多个服务组成。
- **安全：** 必须保护模型与数据。
- **负载均衡：** 在模型副本间分配流量。
- **TLS 终止：** 使用 HTTPS 保护通信。

**实际案例（原文列举，未经独立核实）：**
- **Uber：** 通过 K8s Ingress 将数百万请求路由至 ML 预测服务。
- **Netflix：** 使用 Ingress 为超过两亿用户提供推荐 API。
- **Spotify：** 在 K8s 集群间负载均衡音乐推荐请求。
- **Airbnb：** 通过 Kubernetes Service 暴露定价与搜索 ML 模型。

## 1. Kubernetes 网络模型

### 1.1 核心网络原则

Kubernetes 遵循以下网络要求：

1. **每个 Pod 拥有自己的 IP 地址**
   - 同一节点上的 Pod 之间无需 NAT。
   - Pod 可以直接相互通信。

2. **所有 Pod 都能够与其他 Pod 通信**
   - 跨节点无需 NAT。
   - 扁平的网络地址空间。

3. **所有节点都能够与所有 Pod 通信**
   - 无需 NAT。
   - 节点可以直接访问 Pod。

**网络架构：**

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                   │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   Node 1         │         │   Node 2         │    │
│  │  10.100.1.0/24   │         │  10.100.2.0/24   │    │
│  │                  │         │                  │    │
│  │  ┌────────────┐  │         │  ┌────────────┐  │    │
│  │  │ Pod A      │  │         │  │ Pod C      │  │    │
│  │  │ 10.244.1.2 │◄─┼─────────┼─►│ 10.244.2.3 │  │    │
│  │  └────────────┘  │         │  └────────────┘  │    │
│  │                  │         │                  │    │
│  │  ┌────────────┐  │         │  ┌────────────┐  │    │
│  │  │ Pod B      │  │         │  │ Pod D      │  │    │
│  │  │ 10.244.1.5 │  │         │  │ 10.244.2.8 │  │    │
│  │  └────────────┘  │         │  └────────────┘  │    │
│  │                  │         │                  │    │
│  └──────────────────┘         └──────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Pod A (10.244.1.2) can directly reach Pod C (10.244.2.3)
No NAT, no port mapping, direct IP communication
```

### 1.2 容器网络接口（CNI）

CNI 插件实现 Kubernetes 网络模型。

**常用 CNI 插件：**

| 插件 | 网络类型 | 性能（原文评价） | 特性 | 适用场景 |
|---|---|---|---|---|
| Calico | Overlay/BGP | 高 | 网络策略、加密 | 生产、安全 |
| Flannel | Overlay | 中 | 简单、易于设置 | 开发、小型集群 |
| Cilium | eBPF | 很高 | 高级策略、可观测性 | 高性能 ML |
| Weave Net | Overlay | 中 | 易于设置、加密 | 快速搭建 |
| AWS VPC CNI | 原生网络 | 很高 | AWS 原生网络 | AWS EKS |

**安装 Calico（示例）：**

```bash
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# Verify installation
kubectl get pods -n kube-system | grep calico
# calico-node-xxxxx                1/1     Running
# calico-kube-controllers-xxxxx    1/1     Running
```

### 1.3 Kubernetes 中的 DNS

每个 Service 自动获得 DNS 名称。

**DNS 格式：**
```
<service-name>.<namespace>.svc.cluster.local
```

**示例：**

```yaml
# Service in namespace "ml-serving"
apiVersion: v1
kind: Service
metadata:
  name: bert-inference
  namespace: ml-serving
spec:
  selector:
    app: bert
  ports:
  - port: 8080
```

**创建的 DNS 名称：**
- `bert-inference.ml-serving.svc.cluster.local`（FQDN，完全限定域名）。
- `bert-inference.ml-serving`（跨 Namespace）。
- `bert-inference`（同一 Namespace）。

**测试 DNS 解析：**

```bash
kubectl run -it --rm debug --image=busybox --restart=Never -- sh

# Inside the pod:
nslookup bert-inference.ml-serving
# Output:
# Server:    10.96.0.10
# Address:   10.96.0.10:53
# Name:      bert-inference.ml-serving.svc.cluster.local
# Address:   10.100.200.50
```

## 2. Kubernetes Service

### 2.1 ClusterIP（默认）

**仅内部访问**——Service 默认仅在集群内部可访问。

```yaml
# clusterip-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: model-inference-internal
  namespace: ml-serving
spec:
  type: ClusterIP  # Default type
  selector:
    app: model-inference
  ports:
  - name: http
    protocol: TCP
    port: 80        # Service port
    targetPort: 8080 # Container port
```

**使用场景：** 内部微服务、由其他服务调用的后端 ML 模型。

**访问：**

```bash
# From another pod in the cluster
curl http://model-inference-internal.ml-serving/predict

# From outside cluster: NOT accessible (internal only)
```

### 2.2 NodePort

**通过节点 IP 进行外部访问**——使用固定端口在节点 IP 上暴露 Service。

```yaml
# nodeport-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: model-inference-nodeport
  namespace: ml-serving
spec:
  type: NodePort
  selector:
    app: model-inference
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 8080
    nodePort: 30080  # External port on nodes (30000-32767)
```

**访问：**

```bash
# Get node IP
kubectl get nodes -o wide
# NAME      STATUS   INTERNAL-IP   EXTERNAL-IP
# node-1    Ready    10.0.1.5      203.0.113.10

# Access via any node IP + nodePort
curl http://203.0.113.10:30080/predict
curl http://<any-node-ip>:30080/predict
```

**优点：**
- 简单，不需要额外组件。
- 适用于多数环境。

**缺点：**
- 非标准端口（默认 30000–32767）。
- 需要管理防火墙规则。
- 不提供内置 SSL 终止。

**使用场景：** 开发、测试、裸金属集群。

### 2.3 LoadBalancer

**云负载均衡器**——在支持的环境中供应外部负载均衡器（AWS ELB、GCP LB、Azure LB）。

```yaml
# loadbalancer-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: model-inference-lb
  namespace: ml-serving
  annotations:
    # AWS-specific annotations
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"  # Network Load Balancer
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:us-west-2:123456789:certificate/abc123"
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
spec:
  type: LoadBalancer
  selector:
    app: model-inference
  ports:
  - name: https
    protocol: TCP
    port: 443       # External port (internet-facing)
    targetPort: 8080 # Pod port
```

**部署并获取外部 IP：**

```bash
kubectl apply -f loadbalancer-service.yaml

# Wait for external IP (can take 1-3 minutes)
kubectl get service model-inference-lb -n ml-serving --watch

# Output:
# NAME                  TYPE           CLUSTER-IP      EXTERNAL-IP                                     PORT(S)
# model-inference-lb    LoadBalancer   10.100.200.50   a1b2c3-123456.us-west-2.elb.amazonaws.com       443:32567/TCP

# Access via external IP/hostname
curl https://a1b2c3-123456.us-west-2.elb.amazonaws.com/predict
```

**优点：**
- 面向生产，支持高可用。
- 自动健康检查。
- 支持时可通过注解进行 SSL 终止。
- 标准端口（80、443）。

**缺点：**
- 成本较高（通常每个 Service 一个负载均衡器）。
- 与云平台有关（裸金属环境需要 MetalLB 等实现）。

**使用场景：** 生产 ML API、关键服务、面向公众的模型。

### 2.4 ML 使用场景的 Service 比较

| Service 类型 | 使用场景 | 成本（相对） | 复杂度 | 外部访问 |
|---|---|---|---|---|
| ClusterIP | 内部模型间通信 | 无额外 LB 费用 | 低 | 否 |
| NodePort | 开发、测试、演示 | 无额外 LB 费用 | 低 | 是（通过节点） |
| LoadBalancer | 生产推理 API | 高 | 中 | 是（通过 LB） |
| Ingress | 多 ML 模型、路由、SSL | 中 | 中 | 是（通过 Ingress） |

## 3. Ingress Controller

### 3.1 什么是 Ingress？

**Ingress** 根据 URL 路径或主机名将 HTTP/HTTPS 流量路由至 Service。

**为什么使用 Ingress 而非多个 LoadBalancer？**

```
Without Ingress (expensive):
- Model A → LoadBalancer 1 → $$$
- Model B → LoadBalancer 2 → $$$
- Model C → LoadBalancer 3 → $$$

With Ingress (cost-effective):
- Ingress Controller → Single LoadBalancer → $
  - /model-a → Model A Service
  - /model-b → Model B Service
  - /model-c → Model C Service
```

**Ingress 架构：**

```
                        Internet
                           │
                           ▼
                ┌──────────────────┐
                │  LoadBalancer    │
                │  (Single)        │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Ingress Controller│
                │  (Nginx/Traefik) │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │Service A│     │Service B│     │Service C│
   │(ClusterIP)│  │(ClusterIP)│  │(ClusterIP)│
   └─────────┘     └─────────┘     └─────────┘
```

### 3.2 安装 Ingress-Nginx Controller

**原文将 Nginx 列为最常用的 Ingress Controller：**

```bash
# Install ingress-nginx via Helm
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Wait for external IP
kubectl get service ingress-nginx-controller -n ingress-nginx --watch

# Output:
# NAME                       TYPE           EXTERNAL-IP                        PORT(S)
# ingress-nginx-controller   LoadBalancer   a1b2c3.us-west-2.elb.amazonaws.com  80:31234/TCP,443:31567/TCP
```

### 3.3 为 ML 模型创建 Ingress 规则

**场景：** 通过单个 IP 使用基于路径的路由暴露三个 ML 模型。

```yaml
# ml-models-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-models-ingress
  namespace: ml-serving
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2  # Rewrite /bert/predict to /predict
    nginx.ingress.kubernetes.io/ssl-redirect: "true"  # Force HTTPS
spec:
  ingressClassName: nginx
  rules:
  - host: ml-api.example.com
    http:
      paths:
      # Route /bert/* to bert-service
      - path: /bert(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: bert-inference
            port:
              number: 80

      # Route /gpt/* to gpt-service
      - path: /gpt(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: gpt-inference
            port:
              number: 80

      # Route /resnet/* to resnet-service
      - path: /resnet(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: resnet-inference
            port:
              number: 80
```

**创建后端 Service：**

```yaml
# ml-services.yaml
apiVersion: v1
kind: Service
metadata:
  name: bert-inference
  namespace: ml-serving
spec:
  type: ClusterIP
  selector:
    app: bert
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: gpt-inference
  namespace: ml-serving
spec:
  type: ClusterIP
  selector:
    app: gpt
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: resnet-inference
  namespace: ml-serving
spec:
  type: ClusterIP
  selector:
    app: resnet
  ports:
  - port: 80
    targetPort: 8080
```

**访问模型：**

```bash
# Point DNS ml-api.example.com to Ingress LoadBalancer IP

# Call BERT model
curl https://ml-api.example.com/bert/predict -d '{"text": "Hello world"}'

# Call GPT model
curl https://ml-api.example.com/gpt/predict -d '{"prompt": "Once upon a time"}'

# Call ResNet model
curl https://ml-api.example.com/resnet/predict -F "image=@cat.jpg"
```

### 3.4 TLS/SSL 终止

**创建 TLS 证书 Secret：**

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=ml-api.example.com/O=MyOrg"

# Create Kubernetes secret
kubectl create secret tls ml-api-tls \
  --namespace ml-serving \
  --cert=tls.crt \
  --key=tls.key

# For production: use cert-manager for automatic Let's Encrypt certificates
```

**为 Ingress 添加 TLS：**

```yaml
# ml-models-ingress-tls.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-models-ingress
  namespace: ml-serving
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # Auto TLS with cert-manager
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ml-api.example.com
    secretName: ml-api-tls  # TLS certificate secret

  rules:
  - host: ml-api.example.com
    http:
      paths:
      - path: /bert
        pathType: Prefix
        backend:
          service:
            name: bert-inference
            port:
              number: 80
```

**安装 cert-manager，实现自动化 TLS（生产环境）：**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Certificates will be auto-generated and renewed!
```

## 4. NetworkPolicy（网络策略）

### 4.1 什么是网络策略？

**NetworkPolicy** 控制 Pod 间的流量，类似防火墙规则。

**使用场景：**
- 隔离敏感 ML 模型。
- 仅允许前端调用后端。
- 阻止训练 Pod 访问公共互联网。

### 4.2 示例：隔离 ML 推理服务

**场景：** 只允许前端服务调用 ML 模型后端。

```yaml
# network-policy-ml-isolation.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ml-model-isolation
  namespace: ml-serving
spec:
  podSelector:
    matchLabels:
      app: bert-inference  # Apply to BERT pods

  policyTypes:
  - Ingress
  - Egress

  ingress:
  # Allow traffic ONLY from frontend pods
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080

  egress:
  # Allow DNS queries
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53

  # Allow access to model storage (S3)
  - to:
    - podSelector:
        matchLabels:
          app: s3-gateway
    ports:
    - protocol: TCP
      port: 443
```

**结果（按示例配置预期）：**
- BERT Pod 只能接收前端 Pod 的入站流量。
- 其他未被允许的流量被阻止。
- BERT Pod 可以查询 DNS 并访问 S3。

### 4.3 默认拒绝所有流量

**最佳实践：** 从全部拒绝开始，再显式允许必要的流量。

```yaml
# default-deny-all.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ml-serving
spec:
  podSelector: {}  # Apply to ALL pods in namespace
  policyTypes:
  - Ingress
  - Egress
  # No ingress/egress rules = deny all
```

**随后允许特定流量：**

```yaml
# allow-frontend-to-backend.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: ml-serving
spec:
  podSelector:
    matchLabels:
      tier: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - protocol: TCP
      port: 8080
```

## 5. 高级 Ingress 功能

### 5.1 限流

**防止 ML API 被滥用：**

```yaml
# rate-limiting-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-models-ingress
  namespace: ml-serving
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"  # 100 req/min per IP
    nginx.ingress.kubernetes.io/limit-rps: "10"    # 10 req/sec per IP
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"  # Allow bursts up to 50 req/sec
spec:
  ingressClassName: nginx
  rules:
  - host: ml-api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bert-inference
            port:
              number: 80
```

### 5.2 请求/响应大小限制

**防止大型上传使 ML 模型不堪重负：**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-models-ingress
  namespace: ml-serving
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"  # Max 10MB request body
    nginx.ingress.kubernetes.io/client-body-buffer-size: "1m"
spec:
  # ... (same as above)
```

### 5.3 自定义请求头与 CORS

**为基于浏览器的 ML API 启用 CORS：**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-models-ingress
  namespace: ml-serving
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://myapp.com, https://dashboard.myapp.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization"
spec:
  # ... (same as above)
```

### 5.4 使用 Ingress 实现金丝雀部署

**将 10% 的流量路由至新模型版本：**

```yaml
# canary-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bert-inference-canary
  namespace: ml-serving
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10% traffic to canary
spec:
  ingressClassName: nginx
  rules:
  - host: ml-api.example.com
    http:
      paths:
      - path: /bert
        pathType: Prefix
        backend:
          service:
            name: bert-inference-v2  # New version
            port:
              number: 80
```

**主 Ingress（90% 流量）：**

```yaml
# main-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bert-inference-main
  namespace: ml-serving
spec:
  ingressClassName: nginx
  rules:
  - host: ml-api.example.com
    http:
      paths:
      - path: /bert
        pathType: Prefix
        backend:
          service:
            name: bert-inference-v1  # Stable version
            port:
              number: 80
```

## 6. 排查网络问题

### 6.1 Service 无法访问

**症状：** `curl: (7) Failed to connect to service`。

**诊断：**

```bash
# 1. Check service exists
kubectl get service <service-name> -n <namespace>

# 2. Check service endpoints (are pods healthy?)
kubectl get endpoints <service-name> -n <namespace>
# If ENDPOINTS column is <none>, no healthy pods are backing the service

# 3. Verify pod selector matches pod labels
kubectl get service <service-name> -n <namespace> -o yaml | grep selector
kubectl get pods -n <namespace> --show-labels

# 4. Check pod port matches service targetPort
kubectl get service <service-name> -n <namespace> -o yaml | grep targetPort
kubectl describe pod <pod-name> -n <namespace> | grep Port
```

**解决方案：**

```bash
# Fix label mismatch
kubectl label pod <pod-name> app=correct-label

# Restart unhealthy pods
kubectl rollout restart deployment <deployment-name> -n <namespace>

# Fix port mismatch in service
kubectl edit service <service-name> -n <namespace>
```

### 6.2 Ingress 无法正常工作

**症状：** `404 Not Found` 或 `502 Bad Gateway`。

**诊断：**

```bash
# 1. Check Ingress resource
kubectl describe ingress <ingress-name> -n <namespace>

# Look for:
# - Address: should have external IP
# - Backend: should show service:port
# - Events: check for errors

# 2. Check Ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# 3. Verify backend service is healthy
kubectl get service <backend-service> -n <namespace>
kubectl get endpoints <backend-service> -n <namespace>

# 4. Test service directly (bypass Ingress)
kubectl port-forward service/<backend-service> 8080:80 -n <namespace>
curl localhost:8080/health
```

**常见问题：**

```yaml
# ❌ WRONG: Missing ingressClassName
spec:
  # No ingressClassName specified (won't work)
  rules: ...

# ✅ CORRECT:
spec:
  ingressClassName: nginx
  rules: ...
```

### 6.3 NetworkPolicy 阻止流量

**症状：** 应用 NetworkPolicy 后连接超时。

**诊断：**

```bash
# 1. List all network policies
kubectl get networkpolicy -n <namespace>

# 2. Check if policy is too restrictive
kubectl describe networkpolicy <policy-name> -n <namespace>

# 3. Temporarily delete policy to test
kubectl delete networkpolicy <policy-name> -n <namespace>
# If traffic works now, policy was the issue

# 4. Check pod labels match policy selectors
kubectl get pods -n <namespace> --show-labels
```

**使用临时调试容器排查：**

```bash
# Start debug pod in same namespace
kubectl run debug-pod --image=nicolaka/netshoot -n <namespace> -- sleep 3600

# Test connectivity
kubectl exec -it debug-pod -n <namespace> -- curl http://<service-name>/health

# Test DNS resolution
kubectl exec -it debug-pod -n <namespace> -- nslookup <service-name>
```

## 7. 动手练习：使用 Ingress 部署多模型 ML API

**目标：** 部署两个 ML 模型，配置 Ingress 路由、TLS 与限流。

**步骤 1：为两个模型创建 Deployment**

```yaml
# sentiment-model.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sentiment-model
  namespace: ml-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sentiment
  template:
    metadata:
      labels:
        app: sentiment
    spec:
      containers:
      - name: sentiment
        image: huggingface/transformers:latest
        ports:
        - containerPort: 8080
        env:
        - name: MODEL_NAME
          value: "distilbert-base-uncased-finetuned-sst-2-english"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: translation-model
  namespace: ml-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: translation
  template:
    metadata:
      labels:
        app: translation
    spec:
      containers:
      - name: translation
        image: huggingface/transformers:latest
        ports:
        - containerPort: 8080
        env:
        - name: MODEL_NAME
          value: "Helsinki-NLP/opus-mt-en-de"
```

**步骤 2：创建 ClusterIP Service**

```yaml
# ml-services.yaml
apiVersion: v1
kind: Service
metadata:
  name: sentiment-service
  namespace: ml-api
spec:
  type: ClusterIP
  selector:
    app: sentiment
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: translation-service
  namespace: ml-api
spec:
  type: ClusterIP
  selector:
    app: translation
  ports:
  - port: 80
    targetPort: 8080
```

**步骤 3：创建具有 TLS 与限流功能的 Ingress**

```yaml
# ml-api-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-api-ingress
  namespace: ml-api
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "5m"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ml-api.yourcompany.com
    secretName: ml-api-tls

  rules:
  - host: ml-api.yourcompany.com
    http:
      paths:
      - path: /sentiment
        pathType: Prefix
        backend:
          service:
            name: sentiment-service
            port:
              number: 80
      - path: /translate
        pathType: Prefix
        backend:
          service:
            name: translation-service
            port:
              number: 80
```

**步骤 4：部署并测试**

```bash
# Create namespace
kubectl create namespace ml-api

# Deploy all resources
kubectl apply -f sentiment-model.yaml
kubectl apply -f ml-services.yaml
kubectl apply -f ml-api-ingress.yaml

# Wait for deployments
kubectl rollout status deployment/sentiment-model -n ml-api
kubectl rollout status deployment/translation-model -n ml-api

# Check Ingress
kubectl get ingress -n ml-api
kubectl describe ingress ml-api-ingress -n ml-api

# Point DNS ml-api.yourcompany.com to Ingress external IP

# Test sentiment API
curl https://ml-api.yourcompany.com/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product!"}'

# Test translation API
curl https://ml-api.yourcompany.com/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "target_lang": "de"}'
```

## 8. 总结

### 核心要点

**Kubernetes 网络模型：**
- 每个 Pod 拥有自己的 IP。
- Pod 之间无需 NAT 即可直接通信。
- CNI 插件（Calico、Cilium）实现网络。

**Service 类型：**
- **ClusterIP：** 默认仅内部访问。
- **NodePort：** 通过节点 IP + 端口（默认 30000–32767）进行外部访问。
- **LoadBalancer：** 云负载均衡器（生产环境）。

**Ingress 用于 HTTP/HTTPS 路由：**
- 多个 Service 共用一个负载均衡器。
- 基于路径路由（/model-a、/model-b）。
- TLS/SSL 终止。
- 限流、CORS、金丝雀部署。

**网络策略：**
- 控制 Pod 之间的流量（类似防火墙规则）。
- 最佳实践：默认拒绝，再显式允许。
- 用于多租户与安全隔离。

**生产环境最佳实践：**
- 使用 Ingress 替代多个 LoadBalancer（节省成本）。
- 使用 cert-manager 实现 TLS 证书自动续期。
- 应用限流以保护 ML API。
- 使用网络策略实现隔离。

### 实际影响

企业依靠 Kubernetes 网络实现大规模 ML（原文案例及数字）：
- **Uber：** 每天通过 Ingress 路由超过一亿次预测请求。
- **Netflix：** 使用 K8s Service 与 Ingress 为两亿用户提供服务。
- **Spotify：** 在 1,000 个以上 Pod 之间负载均衡个性化 API。
- **Airbnb：** 使用 NetworkPolicy 构建多租户 ML 平台。

## 自我检查问题

1. Kubernetes 网络模型的三项核心原则是什么？
2. 何时使用 ClusterIP、LoadBalancer 或 Ingress？
3. 相比多个 LoadBalancer Service，Ingress 如何节省成本？
4. Kubernetes Service 的 DNS 名称格式是什么？
5. 如何强制只有前端 Pod 可以调用后端 Pod？
6. 哪些注解可以在 nginx-ingress 中启用限流？
7. 如何排查 Ingress 返回的 502 错误？
8. Prefix 与 Exact 路径类型有什么区别？

## 补充资源

- [Kubernetes 网络模型](https://kubernetes.io/docs/concepts/cluster-administration/networking/)
- [Ingress-Nginx 文档](https://kubernetes.github.io/ingress-nginx/)
- [用于 TLS 的 cert-manager](https://cert-manager.io/docs/)
- [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Calico CNI](https://docs.tigera.io/calico/latest/about/)

---

**下一课：** Kubernetes 中的存储与持久化。

> 译注：网络模型描述的是基础可达性，实际访问受 NetworkPolicy、防火墙等限制；NetworkPolicy 需要 CNI 支持，标准策略不直接按域名允许 S3 流量。Ingress 资源与具体控制器不同，限流、CORS、金丝雀等功能往往是控制器特有的扩展。原文使用 ingress-nginx 与部分较旧工具，实施前应核对其维护状态与当前受支持的替代方案（例如支持 Gateway API 的实现）。DNS 集群域不一定为 cluster.local。案例、性能评价与费用未独立核实。代码块和其中英文注释原样保留，未逐项执行验证。
