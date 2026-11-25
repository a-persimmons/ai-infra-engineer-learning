# 练习 01：Kubernetes 基础——构建可运行的服务

**时长：** 3 小时
**难度：** 入门进阶
**前置条件：** kind 集群（实验 01）；kubectl 基础。

## 目标

不使用 Helm，从零开始在 Kubernetes 上端到端部署真实的机器学习服务：Deployment + Service + ConfigMap + Secret + Ingress + HPA。完成后，你将能熟练阅读和编写这些清单。

## 要求

1. 部署此前练习中的 `iris-api`，配置三个副本。
2. 通过 ConfigMap 外部化机器学习配置，通过 Secret 管理凭据。
3. 通过 NGINX Ingress 暴露服务。
4. 添加 HPA，根据 CPU 在 2–10 个副本之间扩缩容。
5. 添加存活和就绪探针。
6. 设置资源请求与限制。
7. 使用 `curl` 和负载测试进行端到端验证。

## 分步操作

### 步骤 1——ConfigMap 与 Secret（15 分钟）
```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: iris-config }
data:
  app.yaml: |
    log_level: INFO
    feature_count: 4
    batch_max: 128
---
apiVersion: v1
kind: Secret
metadata: { name: iris-secrets }
type: Opaque
stringData:
  api_token: "test-token-12345"
```

### 步骤 2——Deployment（30 分钟）
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: iris-api, labels: { app: iris } }
spec:
  replicas: 3
  selector: { matchLabels: { app: iris } }
  template:
    metadata: { labels: { app: iris } }
    spec:
      containers:
        - name: api
          image: iris-api:0.2
          imagePullPolicy: Never
          ports: [{ containerPort: 8000 }]
          env:
            - { name: API_TOKEN, valueFrom: { secretKeyRef: { name: iris-secrets, key: api_token } } }
          volumeMounts:
            - { name: config, mountPath: /etc/app, readOnly: true }
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits:   { cpu: 500m, memory: 512Mi }
          livenessProbe:
            httpGet: { path: /health, port: 8000 }
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /ready, port: 8000 }
            initialDelaySeconds: 5
            periodSeconds: 3
      volumes:
        - name: config
          configMap: { name: iris-config }
```

### 步骤 3——Service 与 Ingress（15 分钟）
```yaml
apiVersion: v1
kind: Service
metadata: { name: iris-api }
spec:
  selector: { app: iris }
  ports: [{ port: 80, targetPort: 8000 }]
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iris-api
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  ingressClassName: nginx
  rules:
    - host: iris.localtest.me
      http:
        paths:
          - path: /(.*)
            pathType: ImplementationSpecific
            backend:
              service: { name: iris-api, port: { number: 80 } }
```

### 步骤 4——HPA（15 分钟）
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: iris-api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: iris-api }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

### 步骤 5——应用与验证（30 分钟）
```bash
kubectl apply -f .
kubectl get pods,svc,ingress,hpa
kubectl rollout status deployment/iris-api

curl http://iris.localtest.me/health
curl -X POST http://iris.localtest.me/v1/predict -H 'content-type: application/json' \
  -d '{"features":[5.1,3.5,1.4,0.2]}'
```

### 步骤 6——产生负载并观察 HPA（45 分钟）
```bash
kubectl run loadgen --rm -it --image=williamyeh/hey --restart=Never -- \
  -z 5m -c 50 -m POST -T 'application/json' \
  -d '{"features":[5.1,3.5,1.4,0.2]}' http://iris-api/v1/predict
watch -n 2 'kubectl get hpa,pods'
```
副本数应从 2 增加至 5 个以上；负载停止后再缩容至 2 个。

### 步骤 7——故意错误配置并修复（30 分钟）
将就绪探针设置为错误路径，重新应用配置。观察 0/3 Ready、Service 没有 Endpoint、请求失败的情况。修复后恢复。

## 交付物

1. 提交全部五份清单。
2. 通过 `curl` 成功访问 Ingress。
3. HPA 扩容演示。
4. `OPERATIONS.md`：如何部署、回滚及调试服务。

## 验证

- [ ] `kubectl get pods -l app=iris` 显示至少两个 Ready Pod。
- [ ] Ingress URL 返回 200。
- [ ] HPA 在负载下扩容，空闲时缩容。
- [ ] 错误的就绪探针 → 0 个 Endpoint → 请求失败。

## 拓展目标

- 添加 NetworkPolicy，仅允许来自 nginx-ingress 命名空间的入站流量。
- 添加 PodDisruptionBudget，确保发布期间至少保留两个副本。
- 为金丝雀子集添加独立 Service。

## 常见陷阱

- **缺少资源请求 → HPA 无法工作**——HPA 需要资源请求才能计算利用率。
- **存活探针过于激进**——在正常启动期间杀死 Pod。应关注 `initialDelaySeconds`。
- **未安装 Ingress 控制器**——先应用适用于 kind 的 NGINX 清单。
