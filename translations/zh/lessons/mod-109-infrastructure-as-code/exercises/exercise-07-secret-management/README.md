# 练习 07：跨 IaC 与运行时的密钥管理

**时长：** 3 小时
**难度：** 中级
**前置条件：** Vault 基础（实验 06）

## 目标

实现端到端密钥管理工作流：HashiCorp Vault 作为唯一可信数据源，Terraform 在资源供应时获取密钥，Kubernetes 应用通过 External Secrets Operator（ESO）获取密钥。任何 Git 仓库中都不应存在明文密钥。

## 为什么重要

密钥放在 Git 中 → 轮换凭据需要修改仓库 → 增加阻力 → 密钥长期不轮换。使用 Vault + ESO，可以自动轮换并记录审计日志。工程师能够部署基础设施，而无需直接看到凭据。

## 要求

1. Vault 以接近生产的模式运行，而非开发模式。
2. Terraform 从 Vault 读取 Provider 凭据。
3. 通过 ESO 从 Vault 生成 K8s Secret。
4. 至少一个密钥实现每 30 天自动轮换。
5. 审计日志可查询。

## 分步操作

### 步骤 1——接近生产形态的 Vault 配置（45 分钟）
不要使用开发模式。接近生产的配置：
```yaml
# vault-helm-values.yaml
server:
  ha:
    enabled: true
    replicas: 3
    raft:
      enabled: true
  dataStorage:
    enabled: true
    size: 10Gi
  auditStorage:
    enabled: true
    size: 5Gi
```
```bash
helm install vault hashicorp/vault -n vault --create-namespace -f vault-helm-values.yaml
# Initialize + unseal (5 keys, 3 needed)
kubectl exec -n vault vault-0 -- vault operator init
# Distribute keys to 5 trusted humans in different time zones.
```

### 步骤 2——启用 Secrets Engine（15 分钟）
```bash
vault secrets enable -path=ml -version=2 kv
vault kv put ml/iris/db username=app password=initial-pass
vault kv put ml/iris/api-token value=abc123
```

### 步骤 3——Terraform 从 Vault 读取（45 分钟）
```hcl
data "vault_kv_secret_v2" "db" {
  mount = "ml"
  name  = "iris/db"
}

resource "aws_db_instance" "iris" {
  username = data.vault_kv_secret_v2.db.data["username"]
  password = data.vault_kv_secret_v2.db.data["password"]
  ...
}
```
不要把密码写入 Terraform 变量或可从状态读取的输入；使用 `sensitive = true` 标记敏感值。

> 译注：sensitive 标记只能隐藏常规输出，不能确保秘密不会写入状态。还需使用受保护的远程状态、最小权限及适用的临时凭据或 write-only 参数。

### 步骤 4——External Secrets Operator（30 分钟）
```bash
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

### 步骤 5——SecretStore 与 ExternalSecret（30 分钟）
```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata: { name: vault, namespace: iris }
spec:
  provider:
    vault:
      server: "http://vault.vault:8200"
      path: "ml"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "iris"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: iris-db, namespace: iris }
spec:
  refreshInterval: "1h"
  secretStoreRef: { name: vault, kind: SecretStore }
  target: { name: iris-db, creationPolicy: Owner }
  data:
    - secretKey: username
      remoteRef: { key: iris/db, property: username }
    - secretKey: password
      remoteRef: { key: iris/db, property: password }
```

K8s Secret `iris-db` 从 Vault 同步生成。Pod 通过 `secretKeyRef` 使用它，与其他 Secret 相同。

### 步骤 6——轮换（30 分钟）
手动：
```bash
NEW=$(openssl rand -base64 32)
vault kv put ml/iris/db username=app password="$NEW"
# ESO refreshes within 1h (or trigger manually: kubectl annotate externalsecret iris-db force-sync=$(date +%s))
# Pod env vars use the new password on next restart (or use fsync for live reload)
```

自动轮换：Vault Database Secrets Engine 生成短生命周期（1 小时 TTL）的数据库凭据，无需修改应用代码即可轮换（应用仍须支持凭据刷新）。

### 步骤 7——审计日志（15 分钟）
```bash
vault audit enable file file_path=/vault/audit/audit.log
# Every Vault operation logged with actor + secret path
```
查询：`tail -f /vault/audit/audit.log | jq 'select(.request.path | startswith("ml/iris"))'`

## 交付物

1. 已安装高可用 Vault。
2. Terraform 从 Vault 获取密钥。
3. ESO 将至少两个密钥同步至 K8s。
4. 端到端轮换演示（Vault 更新 → K8s Secret 一小时内更新）。
5. `SECRET_LIFECYCLE.md`：如何添加、轮换及停用密钥。

## 验证

- [ ] 所有 Git 仓库均不存在明文密钥。
- [ ] 工程师无需看到密码即可执行 Terraform apply。
- [ ] ExternalSecret 在刷新间隔内反映 Vault 变更。
- [ ] 审计日志记录每次访问。

## 拓展目标

- 使用 **Vault Database Secrets Engine** 生成动态短期数据库凭据。
- 通过 Vault 生成 **AWS IAM 凭据**，不使用静态 AWS Key。
- 实现 **PKI**（通过 Vault 签发用于 mTLS 的证书）。

## 常见陷阱

- **Terraform 状态包含密钥**——将其标记为 `sensitive = true`，并对静态状态加密及限制访问。
- **ESO 刷新间隔过长**——轮换存在较长延迟。应在刷新频率与 Vault 负载间权衡。
- **Helm Chart 中存在明文回退值**——valuesFile 含有默认密钥值。运行时始终要求通过安全机制注入密钥。
- **审计日志位于本地磁盘**——如果 Vault Pod 被重建，日志可能丢失。将其发送至 S3 或 SIEM。
