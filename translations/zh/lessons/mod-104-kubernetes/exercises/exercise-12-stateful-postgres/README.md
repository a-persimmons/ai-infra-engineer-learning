# 练习 12：Kubernetes 上的有状态 PostgreSQL

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 实验 04（持久卷）。

## 目标

使用 CloudNative-PG Operator 在 K8s 上部署接近生产形态的 PostgreSQL：三实例集群，具备流式复制、自动备份到 S3、时间点恢复及监控。

## 要求

1. 安装 CloudNative-PG Operator。
2. 集群包含一个主实例与两个副本。
3. 将 WAL 持续归档到 S3（实验使用 MinIO）。
4. 每日自动备份。
5. 测试 PITR：恢复至特定时间点。
6. 从 PostgreSQL Exporter 获取 Prometheus 指标。

## 分步操作

### 步骤 1——安装 Operator（15 分钟）
```bash
kubectl apply --server-side -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.23/releases/cnpg-1.23.1.yaml
kubectl rollout status -n cnpg-system deployment/cnpg-controller-manager
```

### 步骤 2——运行 MinIO，提供兼容 S3 的存储（15 分钟）
```bash
helm install minio bitnami/minio --set auth.rootUser=minio --set auth.rootPassword=minio123
```

### 步骤 3——集群定义（45 分钟）
```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: pg }
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised

  bootstrap:
    initdb:
      database: app
      owner: app

  storage:
    size: 10Gi
    storageClass: standard

  monitoring:
    enablePodMonitor: true

  backup:
    barmanObjectStore:
      destinationPath: "s3://backups/pg"
      endpointURL: "http://minio:9000"
      s3Credentials:
        accessKeyId: { name: minio-creds, key: ACCESS_KEY_ID }
        secretAccessKey: { name: minio-creds, key: SECRET_ACCESS_KEY }
      wal:
        compression: gzip
      data:
        compression: gzip
    retentionPolicy: "30d"

  resources:
    requests: { memory: 1Gi, cpu: 500m }
    limits:   { memory: 2Gi, cpu: 1 }
```

### 步骤 4——定时备份（15 分钟）
```yaml
apiVersion: postgresql.cnpg.io/v1
kind: ScheduledBackup
metadata: { name: pg-daily }
spec:
  schedule: "0 2 * * *"
  cluster: { name: pg }
  backupOwnerReference: cluster
```

### 步骤 5——验证（30 分钟）
```bash
kubectl get cluster pg          # status Ready
kubectl get pods -l postgresql=pg

# Primary + 2 replicas
kubectl exec -it pg-1 -- psql -U app -d app -c "INSERT INTO test VALUES (1,'hello');"

# Verify replication
kubectl exec -it pg-2 -- psql -U app -d app -c "SELECT * FROM test;"
```

### 步骤 6——手动备份与恢复（30 分钟）
```bash
kubectl create -f - <<EOF
apiVersion: postgresql.cnpg.io/v1
kind: Backup
metadata: { name: manual-1 }
spec: { cluster: { name: pg } }
EOF

# Wait until status: completed
# Now simulate disaster:
kubectl delete cluster pg

# Restore to a new cluster from backup
kubectl apply -f - <<EOF
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: pg-restored }
spec:
  instances: 1
  bootstrap:
    recovery:
      backup: { name: manual-1 }
  ...rest as original
EOF
```

### 步骤 7——时间点恢复（30 分钟）
```yaml
bootstrap:
  recovery:
    backup: { name: manual-1 }
    recoveryTarget:
      targetTime: "2026-05-22 15:30:00.000000+00"
```

### 步骤 8——监控（15 分钟）
自动创建 PodMonitor。添加 Grafana 仪表盘：
```bash
helm install grafana grafana/grafana --set adminPassword=admin
# Import dashboard 9628 (PostgreSQL Database)
```

## 交付物

1. Cluster 与 ScheduledBackup 清单。
2. 自动与手动备份演示。
3. 成功执行 PITR。
4. 展示 PostgreSQL 指标的 Grafana 仪表盘。

## 验证

- [ ] 三个 Pod Ready，复制延迟接近零。
- [ ] MinIO 存储桶中存在备份文件。
- [ ] 恢复后的集群具有相同数据，并且支持 PITR。
- [ ] Grafana 中可以看到指标。

## 常见陷阱

- **CNPG 与 PG 版本不匹配**——Operator 版本必须支持 PostgreSQL 主版本。
- **WAL 归档滞后**——S3 端点缓慢时，WAL 会积压，可能造成磁盘耗尽与数据库不可写。
- **恢复到相同集群名称**——发生冲突；使用新名称恢复，仅在验证后执行重命名等切换操作。
- **忘记指定 `recoveryTarget` 的精确目标**——如果没有它，将恢复至 WAL 末尾，而非指定时间点。
