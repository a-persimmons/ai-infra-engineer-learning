# 实验 07：使用 NetworkPolicy 实现东西向流量隔离

**时长：** 60 分钟  **前置条件：** 使用支持 NetworkPolicy 的 CNI（Calico、Cilium）的集群；kind 用户需安装 Calico。

## 目标

默认拒绝所有 Pod 间流量，再显式允许应用所需的连接。验证允许的连接能够访问，而拒绝的连接访问失败。

## 步骤

### 1. 在 kind 上安装 Calico
```bash
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml
kubectl rollout status -n kube-system ds/calico-node
```

### 2. 三个测试工作负载
```bash
kubectl create deploy front --image=nginx
kubectl create deploy api   --image=hashicorp/http-echo --port=5678 -- -text="api"
kubectl create deploy db    --image=postgres -- POSTGRES_PASSWORD=app
kubectl expose deploy front --port=80
kubectl expose deploy api   --port=80 --target-port=5678
kubectl expose deploy db    --port=5432
```

### 3. 基准状态——所有工作负载均能互相访问
```bash
kubectl run probe --rm -it --image=curlimages/curl --restart=Never -- sh
# Inside probe:
curl -s --max-time 3 front  # ok
curl -s --max-time 3 api    # ok
nc -zv db 5432              # ok
exit
```

### 4. 默认拒绝入口与出口流量
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-all }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```
重新运行探测，全部访问超时。

### 5. 允许 DNS（几乎所有服务都需要）
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-dns }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { k8s-app: kube-dns } }
      ports:
        - { protocol: UDP, port: 53 }
        - { protocol: TCP, port: 53 }
```

### 6. 允许 front → api
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-front-to-api }
spec:
  podSelector: { matchLabels: { app: api } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: front } }
      ports: [{ protocol: TCP, port: 5678 }]
---
# Also allow front's egress to api
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-front-egress }
spec:
  podSelector: { matchLabels: { app: front } }
  policyTypes: [Egress]
  egress:
    - to: [{ podSelector: { matchLabels: { app: api } } }]
      ports: [{ protocol: TCP, port: 5678 }]
```

### 7. 重新测试

从 front Pod 执行 `curl api` 可以成功，而从其他任意 Pod 执行则失败。

## 验证

- [ ] 应用策略前：所有探测成功。
- [ ] 应用 default-deny + allow-dns 后：只有 DNS 可用。
- [ ] 应用 allow-front-to-api 后：只有 front Pod 能访问 api。
- [ ] `db` 仍然处于隔离状态。

## 清理
```bash
kubectl delete netpol --all
kubectl delete deploy,svc front api db
```

## 故障排查

- **策略无效** — CNI 未实施 NetworkPolicy（例如 flannel）。改用 Calico 或 Cilium。
- **默认拒绝后 DNS 导致所有服务失败** — 忘记添加 `allow-dns` 策略。务必先添加它。
- **`namespaceSelector` 不匹配** — kube-system 需要标签 `kubernetes.io/metadata.name: kube-system`（K8s 1.21+ 默认提供）。
