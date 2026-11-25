# 练习 14：资源配额与多租户

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 03（核心资源）。

## 目标

让单个集群安全托管三个团队的工作负载：每个团队一个 Namespace，并配置 ResourceQuota + LimitRange + NetworkPolicy + RBAC。演示团队 A 无法意外耗尽团队 B 的容量，或者读取团队 B 的 Secret。

## 要求

1. 三个 Namespace（`team-a`、`team-b`、`team-c`）。
2. 每个 Namespace 的 ResourceQuota（CPU、内存、Pod 数量、PVC 数量）。
3. LimitRange 强制执行每个 Pod 的默认值与最大值。
4. NetworkPolicy 默认拒绝跨 Namespace 流量。
5. RBAC：各团队管理员权限限制在自己的 Namespace 内，禁止跨团队访问。
6. 各等级的 PriorityClass（金级抢占银级，银级抢占铜级）。

## 分步操作

### 步骤 1——Namespace（15 分钟）
```bash
for ns in team-a team-b team-c; do
  kubectl create ns $ns
  kubectl label ns $ns tier=silver
done
```

### 步骤 2——ResourceQuota（30 分钟）
```yaml
apiVersion: v1
kind: ResourceQuota
metadata: { name: team-quota, namespace: team-a }
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "30"
    persistentvolumeclaims: "10"
    services.loadbalancers: "1"
```

### 步骤 3——LimitRange（15 分钟）
```yaml
apiVersion: v1
kind: LimitRange
metadata: { name: defaults, namespace: team-a }
spec:
  limits:
    - type: Container
      default:        { cpu: 500m, memory: 256Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }
      max:            { cpu: "4", memory: 8Gi }
```

### 步骤 4——默认拒绝 NetworkPolicy 与允许同 Namespace 流量（30 分钟）
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: team-a }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-same-namespace, namespace: team-a }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  ingress: [{ from: [{ podSelector: {} }] }]
  egress:  [{ to: [{ podSelector: {} }] }]
---
# Plus allow DNS (per mod-104 lab 07)
```

### 步骤 5——RBAC（30 分钟）
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: team-admin, namespace: team-a }
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: team-a-admin, namespace: team-a }
subjects: [{ kind: User, name: alice }]
roleRef: { kind: Role, name: team-admin, apiGroup: rbac.authorization.k8s.io }
```

### 步骤 6——PriorityClass（15 分钟）
```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: gold }
value: 1000
description: Critical workload
---
kind: PriorityClass
metadata: { name: silver }
value: 500
---
kind: PriorityClass
metadata: { name: bronze }
value: 100
```

### 步骤 7——验证隔离（45 分钟）
```bash
# Team A user tries to read team B secret → forbidden
kubectl --as=alice get secret -n team-b
# error: User "alice" cannot list resource "secrets" in namespace "team-b"

# Team A pod tries to reach team B pod → blocked by NetworkPolicy
kubectl exec -n team-a pod-a -- curl team-b-service.team-b -m 3
# timeout

# Team A overspends quota → admission denied
kubectl create deploy big -n team-a --image=nginx --replicas=100
# Error from server (Forbidden): ... exceeded quota
```

### 步骤 8——抢占演示（15 分钟）
使用团队 A 的铜级工作负载填满集群。调度团队 B 的金级工作负载，观察团队 A 的 Pod 被抢占以释放空间。

## 交付物

1. 三个团队的全部配置均以清单形式提交。
2. `MULTITENANCY.md`，记录隔离保证及其边界。
3. 证明隔离有效的验证脚本（可在 CI 中运行）。

## 验证

- [ ] 团队 A 用户无法读取团队 B 的 Secret。
- [ ] 团队 A Pod 无法访问团队 B 的 Pod。
- [ ] 配额阻止过量资源申请。
- [ ] 跨优先级类别的抢占有效。

## 拓展目标

- 添加**层级命名空间（HNC）**，支持嵌套团队结构。
- 添加 **OPA Gatekeeper**，实施组织范围的策略（例如「所有镜像必须来自批准的镜像仓库」）。
- 添加 **vCluster**，实现更强的隔离（每个租户获得虚拟控制面）。

## 常见陷阱

- **NetworkPolicy 缺少 CNI 支持**——Flannel 不负责实施策略；使用 Calico 或 Cilium。
- **配额要求每个容器具有限制与请求**——缺少这些配置的 Pod 无法通过准入；使用 LimitRange 默认值。
- **跨 Namespace 的 Service 引用**——不要忘记 FQDN：`svc.namespace.svc.cluster.local`。
- **默认拒绝策略破坏 DNS**——先允许到 kube-system 的 DNS 出站流量。
