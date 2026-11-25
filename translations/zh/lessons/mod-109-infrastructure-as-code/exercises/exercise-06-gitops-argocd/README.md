# 练习 06：使用 ArgoCD 实现 GitOps

**时长：** 3 小时
**难度：** 中级
**前置条件：** Kubernetes 集群

## 目标

使用 ArgoCD 实现 GitOps：集群清单保存在 Git 中，ArgoCD 持续协调集群状态，使其与 Git 一致。添加用于多集群、多环境部署的 ApplicationSet、App-of-Apps 模式与渐进式同步波次（Sync Wave）。

## 为什么重要

GitOps 反转了部署范式：不再将变更直接推送至集群，而是推送至 Git，再由集群拉取。这使审计变得简单，回滚可以使用 `git revert`，灾难恢复可以使用新集群与 `argocd app sync`。

## 要求

1. 安装 ArgoCD。
2. 通过 ArgoCD 部署单集群应用。
3. 通过 App-of-Apps 模式管理至少五个应用。
4. ApplicationSet 从 Git 目录生成应用。
5. 通过 ApplicationSet 矩阵生成器支持多环境。
6. 同步波次保证先部署 CRD，再部署使用它的资源。

## 分步操作

### 步骤 1——安装 ArgoCD（15 分钟）
```bash
kubectl create ns argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl port-forward -n argocd svc/argocd-server 8080:443 &
# Get initial admin password:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
# Login at https://localhost:8080
```

### 步骤 2——单个 Application（30 分钟）
创建包含清单的 Git 仓库 `argocd-apps/`：
```
argocd-apps/
└── iris-api/
    ├── deployment.yaml
    └── service.yaml
```
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: iris-api, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/me/argocd-apps
    targetRevision: HEAD
    path: iris-api
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated: { prune: true, selfHeal: true }
```
```bash
kubectl apply -f apps/iris-api.yaml
argocd app sync iris-api
argocd app get iris-api
```
在 Git 中编辑清单 → 推送 → 观察 ArgoCD 自动同步。

### 步骤 3——App-of-Apps（45 分钟）
一个 Application 指向包含多个 Application 的目录：
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: root, namespace: argocd }
spec:
  source:
    repoURL: https://github.com/me/argocd-apps
    path: bootstrap   # contains other Application manifests
  destination: { server: https://kubernetes.default.svc, namespace: argocd }
  syncPolicy: { automated: { prune: true, selfHeal: true } }
```

`bootstrap/` 包含 iris-api、监控、Ingress 等 Application。只需应用一次根 Application，ArgoCD 即可初始化其余内容。

### 步骤 4——从目录创建 ApplicationSet（45 分钟）
每个目录生成一个 Application：
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: services, namespace: argocd }
spec:
  generators:
    - git:
        repoURL: https://github.com/me/argocd-apps
        revision: HEAD
        directories:
          - path: services/*
  template:
    metadata: { name: '{{path.basename}}' }
    spec:
      project: default
      source:
        repoURL: https://github.com/me/argocd-apps
        path: '{{path}}'
      destination: { server: https://kubernetes.default.svc, namespace: '{{path.basename}}' }
      syncPolicy: { automated: { prune: true, selfHeal: true } }
```

添加 `services/<name>/` 目录 → ApplicationSet 自动创建 Application。

### 步骤 5——使用矩阵生成器支持多环境（30 分钟）
```yaml
generators:
  - matrix:
      generators:
        - list:
            elements:
              - { cluster: dev,     url: https://dev-cluster.api }
              - { cluster: staging, url: https://stg-cluster.api }
              - { cluster: prod,    url: https://prod-cluster.api }
        - git:
            directories: [{ path: services/* }]
template:
  metadata: { name: '{{path.basename}}-{{cluster}}' }
  spec:
    source:
      path: '{{path}}'
      helm: { valueFiles: [values-{{cluster}}.yaml] }
    destination: { server: '{{url}}', namespace: '{{path.basename}}' }
```

### 步骤 6——同步波次（15 分钟）
```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"   # CRDs deploy first
```
CRD 位于波次 -1，Namespace 与 RBAC 位于波次 0，Deployment 位于波次 1。

### 步骤 7——漂移检测演示（15 分钟）
手动执行 `kubectl edit deploy iris-api`。ArgoCD 检测漂移，显示 OutOfSync，并自动修复。

## 交付物

1. 正在运行的 ArgoCD。
2. 包含清单的 Git 仓库。
3. 管理至少五个 Application 的 App-of-Apps。
4. 从目录生成应用的 ApplicationSet。
5. 至少支持两个环境的多环境 ApplicationSet。
6. `GITOPS_PHILOSOPHY.md`：团队为什么使用 GitOps，以及何时不应使用。

## 验证

- [ ] 推送至 Git 后三分钟内触发同步。
- [ ] 手动修改资源会被自愈机制恢复。
- [ ] 添加服务目录自动创建新的 Application。
- [ ] 同步波次保证顺序（CRD 优先）。

## 拓展目标

- 添加 **Argo Rollouts**，通过相同 Git 工作流实现渐进式交付。
- 实现**基于 PR 的环境**：创建 PR 时，ApplicationSet 创建临时 Namespace。
- 将 **OPA Gatekeeper** 纳入 GitOps 流水线。

## 常见陷阱

- **未启用自愈**——忘记设置 `selfHeal: true`。手动变更持续存在，违背 GitOps 目标。
- **没有同步波次**——部分资源因前置条件尚未应用而失败。
- **Git 中存在 Secret**——使用 Sealed Secrets、External Secrets 或 SOPS；绝不要提交明文。
- **没有漂移告警**——漂移无人察觉，自愈机制还会撤销用户尝试进行的紧急修复。
