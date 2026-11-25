# 练习 08：策略即代码（OPA + Sentinel）

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 07（OPA 基础）；练习 03（模块）

## 目标

分别为 Terraform（使用 Conftest/Open Policy Agent）和 Kubernetes（使用 Kyverno 或 Gatekeeper）实现策略即代码。涵盖四类策略：安全、成本、命名与合规。

## 为什么重要

没有策略，每个团队都要独自经历相同的安全错误。有了策略，错误可以在 PR 合并前被发现。策略即代码使信息安全从「询问某位同事」扩展为自动化执行。

## 要求

每种类别、每个层级（Terraform 与 Kubernetes）至少编写两条策略。

### 安全

- TF：禁止公开 S3 存储桶，禁止安全组对 `0.0.0.0/0` 开放 22 端口入站访问。
- K8s：禁止特权容器，所有镜像均需签名。

### 成本

- TF：没有合理说明标签时，禁止使用大于 `m6i.4xlarge` 的实例类型。
- K8s：禁止超出 `ResourceQuota` 的部署。

### 命名

- TF：资源必须具有 `team`、`cost_center`、`environment` 标签。
- K8s：所有 Deployment 必须具有 `app`、`version`、`team` 标签。

### 合规

- TF：RDS 必须具有加密与备份。
- K8s：PersistentVolume 必须具有备份注解。

## 分步操作

### 步骤 1——Terraform 的 Conftest（90 分钟）
参照实验 07。编写涵盖上述全部 TF 项目的 Rego 策略。通过 `conftest verify` 测试。按照实验系列的第 05 项将其接入 CI。

### 步骤 2——安装 Kyverno（15 分钟）
```bash
helm install kyverno kyverno/kyverno -n kyverno --create-namespace
```

### 步骤 3——Kyverno 策略 1：禁止特权容器（15 分钟）
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: disallow-privileged }
spec:
  validationFailureAction: Enforce
  rules:
    - name: privileged-not-allowed
      match: { any: [{ resources: { kinds: [Pod] } }] }
      validate:
        message: "Privileged containers are not allowed."
        pattern:
          spec:
            =(securityContext): { =(privileged): "false" }
            containers:
              - =(securityContext): { =(privileged): "false" }
```
测试：创建特权 Pod → 被阻止。

### 步骤 4——Kyverno 策略 2：要求镜像签名（30 分钟）
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: verify-signatures }
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-signed
      match: { any: [{ resources: { kinds: [Pod] } }] }
      verifyImages:
        - imageReferences: ["ghcr.io/me/*"]
          attestors:
            - entries:
                - keyless:
                    subject: "me@example.com"
                    issuer: "https://github.com/login/oauth"
```

### 步骤 5——Kyverno 策略 3：要求标签（15 分钟）
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-labels }
spec:
  validationFailureAction: Enforce
  rules:
    - name: required-labels
      match: { any: [{ resources: { kinds: [Deployment, StatefulSet] } }] }
      validate:
        message: "Required labels: app, version, team."
        pattern:
          metadata:
            labels:
              app: "?*"
              version: "?*"
              team: "?*"
```

### 步骤 6——变更策略 4：自动注入标签（30 分钟）
减少操作阻力：如果 Deployment 位于 `team-a` Namespace，则自动注入 `team: team-a`。
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: auto-inject-team }
spec:
  rules:
    - name: from-namespace
      match: { any: [{ resources: { kinds: [Deployment] } }] }
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              team: "{{request.object.metadata.namespace}}"
```

### 步骤 7——应用前在 CI 中测试（30 分钟）
在本地生成清单，执行 `kyverno apply --policies ./policies --resource ./manifests`。策略失败时阻止 PR。

## 交付物

1. 至少四条 Conftest Rego 策略。
2. 至少四条 Kyverno 策略（混合验证与变更）。
3. 两者均接入 CI。
4. `POLICY_CATALOG.md`，记录每项策略及其理由。
5. 演示：每项策略都能阻止故意设置的违规行为。

## 验证

- [ ] Conftest 阻止违反各项策略的 Terraform plan。
- [ ] Kyverno 阻止违反各项验证策略的 Pod/Deployment。
- [ ] 变更策略自动修正常规遗漏。
- [ ] CI 阻止存在策略违规的 PR。

## 拓展目标

- 将 Kyverno 策略迁移到 **OPA Gatekeeper** 进行比较，为团队选出合适方案。
- 添加 **Falco**，实现运行时策略检测（运行时检测，而不只是在准入阶段）。
- 添加**策略豁免**：通过 CRD 允许具备必要理由的限时例外。

## 常见陷阱

- **生产环境仍使用 `enforcement: Audit`**——仅记录违规，不会阻止。观察一周无异常后再切换至 Enforce。
- **离线镜像签名验证**——可能需要集群访问透明日志。在隔离网络场景中进行测试。
- **变更策略与准入 Webhook 冲突**——顺序很重要，先变更后验证。
- **策略破坏合法工作流**——始终提前由利益相关方审查。
