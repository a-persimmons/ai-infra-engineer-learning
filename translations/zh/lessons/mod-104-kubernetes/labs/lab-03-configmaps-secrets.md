# 实验 03：ConfigMap 与 Secret

**时长：** 60 分钟  **前置条件：** 完成实验 02。

## 目标

使用 ConfigMap 和 Secret 将应用配置外部化，分别通过环境变量和文件挂载注入配置，并在无需重启时实现配置轮换。

## 步骤

### 1. 从字面值与文件创建 ConfigMap
```bash
echo "log_level: info" > app.conf
kubectl create configmap app-config --from-literal=APP_ENV=staging --from-file=app.conf=app.conf
kubectl get cm app-config -o yaml
```

### 2. 作为环境变量注入
```yaml
spec:
  containers:
    - name: api
      envFrom:
        - configMapRef: { name: app-config }
```

### 3. 将文件挂载至 /etc/app/
```yaml
      volumeMounts:
        - name: cfg
          mountPath: /etc/app
  volumes:
    - name: cfg
      configMap: { name: app-config }
```

### 4. 创建 Secret
```bash
kubectl create secret generic db-creds \
  --from-literal=username=app \
  --from-literal=password='s3cr3t!'
kubectl get secret db-creds -o yaml      # base64-encoded
```

### 5. 将 Secret 的键映射为环境变量
```yaml
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef: { name: db-creds, key: username }
        - name: DB_PASS
          valueFrom:
            secretKeyRef: { name: db-creds, key: password }
```

### 6. 无需重启地轮换 Secret（仅限文件挂载）
```bash
kubectl create secret generic db-creds --from-literal=password='n3wp4ss' --dry-run=client -o yaml \
  | kubectl apply -f -
```
文件挂载大约在 60 秒内更新（kubelet 同步）。通过环境变量注入的值则需要重启 Pod。

### 7. 加密的 Secret——SealedSecrets 或 External Secrets

示意：
```bash
helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system
echo -n 'mypass' | kubectl create secret generic test --dry-run=client --from-file=password=/dev/stdin -o yaml \
  | kubeseal --format yaml > sealed-secret.yaml      # safe to commit
```

## 验证

- [ ] `kubectl exec pod -- env | grep APP_ENV` 显示 `staging`。
- [ ] `kubectl exec pod -- cat /etc/app/app.conf` 显示你的文件。
- [ ] 轮换 Secret 值后，无需重启 Pod，文件挂载内容在 60 秒内反映新值。
- [ ] 使用 `kubectl get secret db-creds -o yaml` 查看 Secret 时，显示 base64 编码内容（而非明文）。

## 清理
```bash
kubectl delete cm app-config secret db-creds
```

## 故障排查

- **环境变量变更后 Pod 未重启** — 环境变量在启动时注入。手动重启：`kubectl rollout restart deployment/...`。
- **Secret 看起来已加密但实际没有** — Base64 是编码，不是加密。使用 SealedSecrets 或 External Secrets 管理静态存储的密钥安全。
- **文件挂载没有更新** — 检查 kubelet 同步间隔；kind 默认约为 60 秒。

> 译注：Secret 在 Kubernetes 中的实际静态加密仍需配置相应的存储加密机制；base64 本身不提供保密性。
