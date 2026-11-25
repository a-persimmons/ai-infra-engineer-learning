# 实验 06：使用 Vault + Terraform 管理密钥

**时长：** 75 分钟  **前置条件：** Docker、Terraform 1.6+。

## 目标

在本地运行 HashiCorp Vault，通过 Terraform 配置 Vault、存储密钥、以编程方式读取密钥，并进行密钥轮换。

## 步骤

### 1. 启动 Vault 开发模式
```bash
docker run -d --name vault -p 8200:8200 --cap-add IPC_LOCK \
  -e VAULT_DEV_ROOT_TOKEN_ID=root \
  -e VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200 \
  hashicorp/vault:1.16
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root
vault status
```

### 2. Terraform 配置 Vault
```hcl
terraform {
  required_providers {
    vault = { source = "hashicorp/vault", version = "~> 4.0" }
  }
}
provider "vault" { address = "http://localhost:8200"; token = "root" }

# KV v2 engine
resource "vault_mount" "kvv2" {
  path = "secret"; type = "kv"; options = { version = "2" }
}

# Policy for the app
resource "vault_policy" "app" {
  name   = "iris-app"
  policy = <<EOT
path "secret/data/iris/*" { capabilities = ["read"] }
EOT
}

# AppRole for the app to authenticate
resource "vault_auth_backend" "approle" { type = "approle" }
resource "vault_approle_auth_backend_role" "app" {
  backend         = vault_auth_backend.approle.path
  role_name       = "iris-app"
  token_policies  = [vault_policy.app.name]
}

# Seed initial secret
resource "vault_kv_secret_v2" "db" {
  mount = vault_mount.kvv2.path
  name  = "iris/db"
  data_json = jsonencode({ username = "iris_app"; password = "initial-pass-rotate-me" })
}
```
```bash
terraform init && terraform apply
```

### 3. 应用通过 AppRole 获取密钥
```python
import hvac
client = hvac.Client(url="http://localhost:8200")
role_id   = "<from-vault-cli>"
secret_id = "<from-vault-cli>"
client.auth.approle.login(role_id=role_id, secret_id=secret_id)
secret = client.secrets.kv.v2.read_secret_version(mount_point="secret", path="iris/db")
print(secret["data"]["data"])
```

获取 ID：
```bash
vault read auth/approle/role/iris-app/role-id
vault write -f auth/approle/role/iris-app/secret-id
```

### 4. 轮换
```hcl
data_json = jsonencode({ username = "iris_app"; password = "new-rotated-pass" })
```
执行 `terraform apply` → 读取操作现在返回新值。旧版本仍然保留（KV v2 保留历史记录）。

### 5. 读取上一个版本
```python
secret = client.secrets.kv.v2.read_secret_version(
    mount_point="secret", path="iris/db", version=1)
```

### 6. 审计日志
```bash
vault audit enable file file_path=/tmp/vault-audit.log
cat /tmp/vault-audit.log | head
```

## 验证

- [ ] AppRole 登录成功。
- [ ] 应用无需使用 root token 即可读取密钥。
- [ ] 轮换产生新版本，旧版本仍可读取。
- [ ] 审计日志记录读取操作。

## 清理
```bash
terraform destroy -auto-approve
docker stop vault && docker rm vault
```

## 故障排查

- **`Vault is sealed`** — 开发模式会自动解封，但若在没有 `-e VAULT_DEV_ROOT_TOKEN_ID` 的情况下重启容器，它会生成新的 token。
- **`permission denied`** — 策略未授权该路径。使用 `vault policy read iris-app` 测试。
- **AppRole secret-id 过期** — 默认 TTL 生效；仅在测试场景中可在角色上设置 `secret_id_ttl=0` 使其不过期。
