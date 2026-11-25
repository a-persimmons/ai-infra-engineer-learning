# 实验 04：有状态工作负载的持久卷

**时长：** 75 分钟  **前置条件：** 完成实验 03。

## 目标

通过 PersistentVolumeClaim 申请存储，部署 StatefulSet（Postgres），并验证 Pod 重启后数据仍然存在。

## 步骤

### 1. 检查 StorageClass
```bash
kubectl get storageclass
```
kind 自带 `standard`（local-path 供应器）。

### 2. 静态 PVC 与 Pod
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: data }
spec:
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 1Gi } }
  storageClassName: standard
---
apiVersion: v1
kind: Pod
metadata: { name: writer }
spec:
  containers:
    - name: write
      image: busybox
      command: ["sh", "-c", "echo hello > /data/hello.txt; sleep 3600"]
      volumeMounts: [{ name: data, mountPath: /data }]
  volumes:
    - name: data
      persistentVolumeClaim: { claimName: data }
```
```bash
kubectl apply -f pvc.yaml
kubectl get pvc                 # Bound
kubectl exec writer -- cat /data/hello.txt   # hello
kubectl delete pod writer
kubectl apply -f pvc.yaml       # re-creates writer (different pod, same PVC)
kubectl exec writer -- cat /data/hello.txt   # hello — persisted
```

### 3. 为 Postgres 创建 StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: pg }
spec:
  serviceName: pg
  replicas: 1
  selector: { matchLabels: { app: pg } }
  template:
    metadata: { labels: { app: pg } }
    spec:
      containers:
        - name: pg
          image: postgres:15
          env:
            - { name: POSTGRES_PASSWORD, value: app }
          ports: [{ containerPort: 5432 }]
          volumeMounts: [{ name: data, mountPath: /var/lib/postgresql/data, subPath: pgdata }]
  volumeClaimTemplates:
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        resources: { requests: { storage: 5Gi } }
---
apiVersion: v1
kind: Service
metadata: { name: pg }
spec:
  clusterIP: None
  selector: { app: pg }
  ports: [{ port: 5432 }]
```
```bash
kubectl apply -f pg.yaml
kubectl get pvc                 # data-pg-0 Bound
kubectl exec -it pg-0 -- psql -U postgres -c "CREATE TABLE t (x int); INSERT INTO t VALUES (42);"
kubectl delete pod pg-0
sleep 5
kubectl exec -it pg-0 -- psql -U postgres -c "SELECT * FROM t;"  # 42 — survived
```

## 验证

- [ ] PVC 在几秒钟内完成绑定。
- [ ] 删除 Pod 后数据仍然存在（写入 Pod 与 StatefulSet Pod 都需要验证）。
- [ ] StatefulSet Pod 名为 `pg-0`（名称可预测，带有序号）。

## 清理
```bash
kubectl delete sts pg svc pg
kubectl delete pvc data-pg-0 data
```

## 故障排查

- **PVC 一直处于 Pending** — 没有具备可用容量的 StorageClass。在 kind 上确认 local-path 供应器正在运行：`kubectl get pods -n local-path-storage`。
- **Pod 重启后数据丢失** — 可能误用了 `emptyDir` 数据卷。重新检查清单。
- **StatefulSet Pod 未获得稳定主机名** — 缺少 Headless Service。Service 必须设置 `clusterIP: None`。
