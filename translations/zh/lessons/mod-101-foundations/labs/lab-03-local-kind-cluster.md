# 实验 03：使用 kind 搭建本地 Kubernetes 集群

**时长：** 60 分钟
**难度：** 入门进阶
**前置条件：** 完成实验 02；Docker 已安装并正在运行。

## 目标

使用 **kind**（Kubernetes-in-Docker）创建本地 Kubernetes 集群，将实验 02 中的 Flask 服务部署到集群，通过 Service 暴露服务，并在笔记本电脑上访问。完成后，你将能在几分钟内启动、使用和拆除一个真实的 Kubernetes 集群。

## 为什么重要

模块 104（Kubernetes 基础）假定你至少做过一次这样的操作。云 Kubernetes（EKS、GKE、AKS）使用相同的 API，但控制面不同；掌握本地 kind 可大幅降低学习云端 K8s 的成本。

## 前置条件

```bash
# kind: install per https://kind.sigs.k8s.io/
brew install kind kubectl    # macOS via Homebrew
# Linux: see kind's release page for binary download

kind version                  # expect kind 0.23.x or newer
kubectl version --client      # any 1.28+ works
```

## 步骤

### 1. 创建带端口映射的 kind 集群

```bash
mkdir -p ~/ai-infra-labs/lab-03-kind && cd ~/ai-infra-labs/lab-03-kind

cat > kind-config.yaml <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: lab-03
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 8080
        protocol: TCP
EOF

kind create cluster --config kind-config.yaml
```

大约需要 30 秒。完成后：

```bash
kubectl cluster-info --context kind-lab-03
kubectl get nodes
# Expect one node: lab-03-control-plane, status Ready
```

### 2. 将实验 02 的镜像加载到集群

你在实验 02 构建的 Flask 镜像不在任何镜像仓库中，需要显式导入 kind。

```bash
docker tag hello-flask:0.1 hello-flask:0.1     # ensure it's still there
kind load docker-image hello-flask:0.1 --name lab-03
```

如果你已清理实验 02 的镜像，先重新构建。

### 3. 编写 Kubernetes 清单

```bash
cat > deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-flask
  labels: { app: hello-flask }
spec:
  replicas: 2
  selector:
    matchLabels: { app: hello-flask }
  template:
    metadata:
      labels: { app: hello-flask }
    spec:
      containers:
        - name: app
          image: hello-flask:0.1
          imagePullPolicy: Never           # use local image only
          ports:
            - containerPort: 8000
          readinessProbe:
            httpGet: { path: /health, port: 8000 }
            initialDelaySeconds: 2
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 256Mi }
EOF

cat > service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: hello-flask
spec:
  type: NodePort
  selector: { app: hello-flask }
  ports:
    - port: 80
      targetPort: 8000
      nodePort: 30080
EOF
```

### 4. 应用清单并观察

```bash
kubectl apply -f deployment.yaml -f service.yaml
kubectl get pods -w                       # Ctrl-C once both pods are Running and Ready 2/2
```

### 5. 从笔记本电脑访问服务

```bash
curl -s http://localhost:8080/health
# Expect: {"host":"hello-flask-...","python":"3.11.x","status":"ok"}

# Repeat several times — the host changes as you hit different pods (load balancing).
for i in $(seq 1 10); do curl -s http://localhost:8080/health | jq -r .host; done | sort -u
# Expect 2 unique pod names.
```

### 6. 扩缩容与滚动发布

```bash
kubectl scale deployment/hello-flask --replicas=4
kubectl rollout status deployment/hello-flask

# Bump image tag → no real change but triggers a rollout
kubectl set image deployment/hello-flask app=hello-flask:0.1 --record
kubectl rollout history deployment/hello-flask
```

## 验证

- [ ] `kubectl get nodes` 显示一个 Ready 节点。
- [ ] 扩容后，`kubectl get pods` 显示 4 个 Running 状态且 1/1 Ready 的 hello-flask Pod。
- [ ] `curl http://localhost:8080/health` 每次返回 200 OK。
- [ ] 发送 10 次以上请求时，轮流访问到 4 个不同 Pod 主机名。
- [ ] `kubectl rollout history deployment/hello-flask` 至少显示两个修订版本。

## 清理

```bash
kind delete cluster --name lab-03
docker images hello-flask                  # still available locally if you want
cd ~ && rm -rf ~/ai-infra-labs/lab-03-kind
```

## 故障排查

- **`ErrImagePull` / `ImagePullBackOff`** — 忘记执行 `kind load docker-image`。运行该命令，再执行 `kubectl rollout restart deployment/hello-flask`。
- **Pod 一直处于 `Pending`** — 节点资源不足，降低资源请求。
- **`curl localhost:8080` 连接被拒绝** — Service NodePort 或 kind 端口映射配置错误。检查 `kubectl get svc hello-flask`，确认 `nodePort: 30080` 与 kind-config.yaml 中的 `containerPort: 30080` 一致。
- **全部请求命中同一个 Pod** — `kube-proxy` 使用 iptables，不保证严格轮询；预期应存在变化，但并非完全均匀。
- **kind 集群未出现** — Docker 未运行，或 `--name foo` 参数前后不一致。执行 kind 命令时始终传入 `--name lab-03`。
