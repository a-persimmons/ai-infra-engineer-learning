# 练习 12：通过 IaC 实现灾难恢复

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 练习 03、04、10

## 目标

设计并演练灾难恢复（DR）流程，通过 IaC、S3 中的状态备份、Vault 和 S3 中的模型产物，重建完整集群及其依赖。目标：RTO 小于 4 小时，RPO 小于 1 小时。

## 为什么重要

没有经过演练的灾难恢复计划只是一种设想。IaC 与定期恢复演练，可以将耗时三天的紧急救火转变为四小时内可控的恢复操作。

## 要求

1. 记录哪些内容需要恢复，以及各自的恢复来源。
2. 演练：故意销毁沙箱环境，再从备份恢复。
3. 测量实际 RTO（恢复时间）和 RPO（数据丢失时间窗口）。
4. 记录经验教训。

## 分步操作

### 步骤 1——资产盘点（30 分钟）
哪些组件必须恢复？从哪里恢复？

| 组件 | 可信数据源 | 备份机制 |
|---|---|---|
| 集群（EKS） | Terraform 模块 | S3 状态文件（启用版本管理） |
| 集群应用（清单） | Git（ArgoCD） | Git clone |
| Vault | Vault 数据 | 每日将 Vault 快照保存至 S3 |
| PostgreSQL 数据 | CloudNativePG 集群 | 持续将 WAL 归档至 S3 |
| 对象存储数据 | S3 | 跨区域复制 |
| 容器镜像 | ECR / GHCR | 复制至备用镜像仓库 |
| 密钥 | Vault | Vault 快照包含密钥 |
| 模型产物 | S3 | S3 版本管理与跨区域复制 |

### 步骤 2——恢复脚本（45 分钟）
```bash
#!/usr/bin/env bash
set -euo pipefail
ENV=${1:?usage: restore.sh <env>}
REGION=${2:-us-west-2}

# 1. Restore Terraform state (if lost)
aws s3 cp s3://company-tfstate-backup-${ENV}/latest.tfstate ./envs/${ENV}/terraform.tfstate

# 2. Provision infrastructure
cd envs/${ENV}
terraform init -reconfigure
terraform apply -auto-approve

# 3. Wait for cluster ready
aws eks update-kubeconfig --name ml-${ENV} --region ${REGION}
kubectl wait --for=condition=Ready node --all --timeout=10m

# 4. Bootstrap ArgoCD (if not running)
kubectl apply -n argocd -f manifests/argocd/install.yaml
kubectl wait --for=condition=Available deploy/argocd-server -n argocd --timeout=10m

# 5. Apply root Application — pulls all app manifests
kubectl apply -f manifests/argocd/root-app-${ENV}.yaml

# 6. Restore Vault from snapshot
kubectl exec -n vault vault-0 -- vault operator raft snapshot restore /backup/latest.snap
# Unseal Vault (manual; humans hold keys)

# 7. Restore Postgres (CNPG auto-recovers from WAL archive)
# Verify with: kubectl get cluster pg -n iris

# 8. Smoke test
./scripts/smoke-test.sh ${ENV}
```

### 步骤 3——执行演练（60 分钟）
选择沙箱环境，记录开始时间。销毁：
```bash
cd envs/sandbox
terraform destroy -auto-approve
# Also delete the state file from S3 to simulate full disaster:
aws s3 rm s3://company-tfstate-prod/sandbox/terraform.tfstate
```

恢复：
```bash
./restore.sh sandbox
```

记录耗时，以及哪些操作失败、哪些说明不清楚、哪些内容缺失。

### 步骤 4——经验教训（30 分钟）
在 `DR_LESSONS.md` 中记录：

- 流程在哪些方面偏离计划？
- 实际 RTO 与目标相比如何？
- 实际 RPO 与目标相比如何？
- 发现了哪些缺口？
- 后续工作是什么？

### 步骤 5——更新运行手册（15 分钟）
修改运行手册，解决每个发现的问题。下一次演练应更加顺畅。

## 交付物

1. 资产盘点文档。
2. `restore.sh` 脚本。
3. 带时间记录的演练日志。
4. `DR_LESSONS.md`。
5. 更新后的运行手册。

## 验证

- [ ] 恢复在 RTO 目标内完成（小于 4 小时）。
- [ ] 数据丢失在 RPO 目标内（小于 1 小时）。
- [ ] 恢复后冒烟测试通过。
- [ ] 运行手册已根据经验教训更新。

## 拓展目标

- **跨区域故障转移**：恢复到不同区域。
- **双活灾难恢复**：流量自动故障转移至次要区域。
- **混沌工程**：在沙箱中每季度安排随机销毁演练。

## 常见陷阱

- **状态文件与基础设施位于同一个账号**——丢失账号即可能丢失状态。跨账号存储状态。
- **Vault 密钥丢失**——无法解封。使用 Shamir 秘密共享，将密钥份额分配给不同人员。
- **从未测试过备份**——没有恢复验证的备份只是一种希望。
- **文档漂移**——你熟悉流程，但值班工程师无法执行。请其他人员实际运行流程进行测试。

> 译注：只在明确隔离的可销毁沙箱中演练；每日快照本身不能保证小于一小时的 RPO，需要根据实际备份频率和持续复制能力验证。
