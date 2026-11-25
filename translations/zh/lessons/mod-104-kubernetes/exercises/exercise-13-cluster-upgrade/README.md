# 练习 13：集群升级流程

**时长：** 3 小时
**难度：** 中级
**前置条件：** kind 集群。

## 目标

规划并执行 Kubernetes 集群从 1.29 到 1.30 的升级，验证 API 兼容性，逐一排空节点，并验证应用不受影响。

## 为什么重要

集群升级是 SRE 日常操作中风险较高的工作。经过演练的流程能使升级平稳可控；临时拼凑的操作则可能造成中断。

## 要求

1. 升级前审计：弃用 API、自定义控制器、插件。
2. 工作负载能够容忍单个节点退出（PDB、副本数大于 1）。
3. 控制面升级。
4. 逐步排空节点并升级节点池。
5. 升级后验证：所有应用健康，无需回滚。

## 分步操作

### 步骤 1——从 1.29 集群开始（10 分钟）
```bash
kind create cluster --image kindest/node:v1.29.4 --name upgrade-lab
```

### 步骤 2——部署多样化工作负载（30 分钟）
- iris-api Deployment（四个副本，PDB minAvailable=2）
- pg 集群（三个副本）
- 一个 Job
- 一个 CronJob
- ingress-nginx

### 步骤 3——升级前审计（30 分钟）
```bash
# Deprecated APIs check
kubectl get -A --all-resources | grep -E "extensions/v1beta1|apps/v1beta1"
pluto detect-files -d .              # https://github.com/FairwindsOps/pluto

# Workloads without PDBs
kubectl get pdb -A
kubectl get deploy -A -o json | jq '.items[] | select(.spec.replicas > 1) | .metadata' 
# (cross-reference with PDBs)
```
列出所有可能阻碍升级的事项。

### 步骤 4——工作负载就绪检查（15 分钟）
对于每个 `replicas > 1` 的 Deployment，确保：
- 有 PDB 保护。
- PodDisruptionBudget 允许节点排空。
- 应用能够容忍重启。

### 步骤 5——先在复制集群中测试（实际环境）；实验中跳过。

### 步骤 6——升级控制面（30 分钟）
对于 kind：
```bash
# Stop cluster
kind delete cluster --name upgrade-lab
# Recreate at new version
kind create cluster --image kindest/node:v1.30.0 --name upgrade-lab
# (For real clusters: kubeadm upgrade plan / apply; cloud providers have their own commands)
```

验证：
```bash
kubectl version
kubectl get nodes      # all Ready, v1.30.0
```

### 步骤 7——重新部署工作负载（15 分钟）
应用相同清单，验证全部 Ready。

### 步骤 8——验证无 API 漂移（30 分钟）
```bash
# Any deprecated API warnings in apiserver logs?
kubectl logs -n kube-system kube-apiserver-... | grep -i deprecated

# Run pluto again
pluto detect-files -d . --target-versions=k8s=v1.30.0
```

### 步骤 9——性能与功能验证（15 分钟）
对每个应用执行冒烟测试，验证仍满足 SLO。

### 步骤 10——升级后文档（15 分钟）
`UPGRADE_RUNBOOK.md` 记录：
- 升级前检查
- 操作顺序
- 验证
- 回滚计划（基于快照）

## 交付物

1. 已升级的集群。
2. 升级后所有工作负载健康。
3. `UPGRADE_RUNBOOK.md`。
4. 已发现并修复的弃用 API 清单。

## 验证

- [ ] `kubectl get nodes` 显示新版本。
- [ ] 升级期间没有 5xx（在 cordon/drain 期间通过循环 curl 验证）。
- [ ] 所有工作负载恢复 Ready 状态。
- [ ] pluto 报告未发现问题。

## 拓展目标

- 实现**零停机升级**：实际验证升级窗口期间 p95 延迟没有变化。
- 在 EKS/GKE/AKS 上实践，其升级体验存在明显差异。
- 添加**金丝雀集群**升级模式：先升级预发布环境，观察两周，再升级生产环境。

## 常见陷阱

- **跳过升级前检查**——升级失败后才发现弃用 API。
- **关键应用没有 PDB**——排空节点时驱逐全部副本，造成短暂中断。
- **跨越一个以上次版本升级**——不支持一次跨越多个次版本；逐个升级至 n+1。
- **忘记插件**——Calico/Cilium/CoreDNS 版本可能也需要升级。

> 译注：kind 中的重建模拟不等同于真实生产集群的原地滚动升级，不能据此宣称零停机。
