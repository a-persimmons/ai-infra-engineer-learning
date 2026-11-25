# 练习 10：多集群联邦

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 两个 K8s 集群（使用两个 kind 集群，或一个真实集群与一个 kind 集群）。

## 目标

连接两个 Kubernetes 集群以实现工作负载可移植性：通过服务网格（Istio multi-primary、Linkerd 或 Cilium Cluster Mesh）实现跨集群服务发现，并使用 ArgoCD 管理跨集群部署。

## 要求

1. 两个集群支持双向服务发现。
2. 集群 A 中的服务可通过名称调用集群 B 中的服务。
3. 在中心集群（Hub）安装 ArgoCD，管理两个集群的部署。
4. 故障转移：一个集群发生故障时重新路由流量。

## 分步操作

### 步骤 1——两个 kind 集群（15 分钟）
```bash
kind create cluster --name a --config a.yaml
kind create cluster --name b --config b.yaml
```
使用不同的 Pod/Service CIDR，避免地址冲突。

### 步骤 2——安装 Cilium Cluster Mesh（45 分钟）
适合 kind 的方案：
```bash
cilium install --context kind-a --cluster-name a --cluster-id 1
cilium install --context kind-b --cluster-name b --cluster-id 2
cilium clustermesh enable --context kind-a
cilium clustermesh enable --context kind-b
cilium clustermesh connect --context kind-a --destination-context kind-b
```

### 步骤 3——部署跨集群服务（30 分钟）
在集群 A 中部署前端。

在集群 B 中部署后端，并添加注解 `service.cilium.io/global: "true"`。

A 中的前端调用 `backend.default.svc.cluster.local`，将解析至 B。

### 步骤 4——配置 ArgoCD（45 分钟）
```bash
kubectl --context kind-a create ns argocd
kubectl --context kind-a apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Add cluster B as a target
argocd cluster add kind-b
argocd app create iris-on-b --repo <git> --path ./manifests --dest-server <kind-b-api> --dest-namespace default
```

### 步骤 5——故障转移演示（30 分钟）
- 暂停集群 B，前端对后端的健康检查失败。
- 使用 ArgoCD ApplicationSet 将后端也部署到 A；服务网格执行负载均衡。
- 恢复 B；ApplicationSet 使两个集群保持同步。

## 交付物

1. 两个通过网格连接的集群。
2. 跨集群服务调用演示。
3. 管理两个集群的 ArgoCD。
4. `FEDERATION_TRADEOFFS.md`：集群网格与单集群多 Namespace 之间的取舍。

## 验证

- [ ] A 中的服务通过 DNS 名称访问 B 中的服务。
- [ ] ArgoCD 显示两个集群同步且健康。
- [ ] 关闭集群 B 不会破坏 A 的前端（因为 A 中也存在 B 的后端 Pod）。

## 常见陷阱

- **CIDR 重叠**——如果 Pod/Service 地址范围重叠，集群无法建立网格。
- **双向控制面访问**——每个集群需要通过网络访问对方的 API server。
- **联邦复杂性**——通常属于过度设计；单集群内多个 Namespace 已足够。
