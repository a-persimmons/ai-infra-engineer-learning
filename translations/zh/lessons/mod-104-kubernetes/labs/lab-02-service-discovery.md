# 实验 02：服务发现——ClusterIP、NodePort、LoadBalancer

**时长：** 45 分钟  **前置条件：** 完成实验 01。

## 目标

理解 Service 如何将流量路由到 Pod、ClusterIP/NodePort/LoadBalancer 的区别，以及集群内部 DNS 的工作方式。

## 步骤

### 1. ClusterIP（默认）
```yaml
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 80 }]
```
```bash
kubectl apply -f svc.yaml
kubectl get svc web
```

### 2. 从集群内部访问
```bash
kubectl run probe --rm -it --image=curlimages/curl --restart=Never -- sh
# Inside the probe container:
curl http://web                       # by short name (same namespace)
curl http://web.default.svc.cluster.local
nslookup web                          # resolves to ClusterIP
exit
```

### 3. NodePort——在每个节点上暴露端口
```yaml
spec:
  type: NodePort
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
```
```bash
kubectl apply -f svc.yaml
curl http://localhost:8080            # via kind port-mapping
```

### 4. LoadBalancer（云端）或通过 metallb（本地）

在云集群中，`type: LoadBalancer` 会分配外部 IP。在 kind 上安装 metallb 可以获得相同的使用体验：
```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml
# Then configure an address pool (see metallb docs).
```

### 5. 检查端点
```bash
kubectl get endpoints web              # one IP per Ready pod
kubectl describe svc web | head -20
```

### 6. Service 与标签选择器不匹配

将 Deployment 的 Pod 标签改为 `app: web-v2`，但 Service 的选择器仍是 `app: web`。观察端点变为空：
```bash
kubectl get endpoints web -w
```

## 验证

- [ ] 集群内部 DNS 将 `web` 解析为 ClusterIP。
- [ ] `kubectl get endpoints web` 为每个 Ready Pod 列出一个 IP。
- [ ] 破坏标签选择器 → 端点为空 → 外部流量访问失败。

## 清理
```bash
kubectl delete svc web
```

## 故障排查

- **`Service has no endpoints`** — 标签选择器没有匹配任何 Ready Pod。检查 `kubectl get pods --show-labels`。
- **宿主机无法访问 NodePort** — kind 的端口映射必须包含 nodePort（参见 mod-101 实验 03 的 kind-config.yaml）。
- **集群内部 DNS 解析失败** — CoreDNS Pod 不健康。执行 `kubectl get pods -n kube-system | grep dns`。
