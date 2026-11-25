# 练习 15：Kubernetes 集群成本优化

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 14 与 mod-102 练习 08。

## 目标

审计集群中的成本浪费，应用五种优化技术（资源规格调整、Spot 实例、集群自动扩缩容、排查闲置资源、存储类别分层），并测量节省的成本。

## 要求

1. 建立基线成本（或模拟成本）。
2. 应用五种技术。
3. 测量结果。
4. 建立季度审查流程。

## 分步操作

### 步骤 1——盘点（30 分钟）
- CPU 与内存的总请求量与可用量对比。
- 总成本（使用 AWS/GCP 成本 API，或依据实例类型估算）。
- 按 Namespace 拆分成本。

```bash
kubectl top nodes
kubectl top pods -A --containers
```

计算利用率：实际使用量 / 请求容量。低于 30% 表明可能存在浪费。

### 步骤 2——资源规格调整（45 分钟）
对于每个过度申请资源的 Deployment：
```bash
kubectl get deploy -A -o json | jq -r '.items[] | "\(.metadata.namespace)/\(.metadata.name) \(.spec.template.spec.containers[0].resources.requests)"'
```
与过去七天实际使用量比较。当实际使用量远低于请求量时，降低请求值。

工具：**Goldilocks** 提供资源规格调整建议：
```bash
helm install goldilocks fairwinds-stable/goldilocks -n goldilocks --create-namespace
kubectl label ns team-a goldilocks.fairwinds.com/enabled=true
```

### 步骤 3——Spot 实例（45 分钟）
添加 Spot 节点池（按云平台选择）：
```yaml
# Karpenter NodePool example
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata: { name: spot }
spec:
  template:
    spec:
      requirements:
        - { key: karpenter.sh/capacity-type, operator: In, values: [spot] }
        - { key: kubernetes.io/arch, operator: In, values: [amd64] }
```
标记批处理工作负载，使其优先选择 Spot：
```yaml
nodeSelector: { karpenter.sh/capacity-type: spot }
tolerations: [{ key: spot, operator: Exists }]
```

### 步骤 4——Cluster Autoscaler / Karpenter（30 分钟）
没有自动扩缩容器时，你需要全天候为最大容量付费。使用 Karpenter 后，节点按需创建，并在空闲时回收。

按照云平台文档安装。设置 ttlSecondsAfterEmpty，使空节点在 60 秒后回收（原文参数，具体配置取决于版本）。

测试：缩容所有工作负载，节点数量应在数分钟内下降。

### 步骤 5——排查闲置资源（30 分钟）
查找：
- 重启次数超过 100 的 Pod（可能处于崩溃循环，应修复或移除）。
- 缩容至 0 的 Deployment（可能是旧项目遗留）。
- 未挂载的 PV/PVC。
- 没有流量的 LoadBalancer。
- 未使用的 Namespace。

```bash
kubectl get pvc -A | awk '$3 == ""'
kubectl get svc -A --field-selector spec.type=LoadBalancer
```

### 步骤 6——存储类别分层（15 分钟）
- 热数据（数据库）：SSD / gp3。
- 冷数据（日志、备份）：HDD / sc1 / S3。

将冷数据 PVC 迁移至更便宜的类别。

### 步骤 7——构建成本报告（30 分钟）
安装 **OpenCost**（Kubecost 开源相关项目）或 **Kubecost**：
```bash
helm install opencost opencost/opencost -n opencost --create-namespace
```
提供按 Namespace、Pod、Deployment 拆分的成本。

设置每周 Slack 摘要，展示开支最高的前十项。

## 交付物

1. `COST_AUDIT.md`，包含优化前后数据。
2. 已应用 Goldilocks 建议。
3. 已配置 Spot 节点池。
4. Karpenter（或 CA）按需创建节点。
5. 已配置每周摘要。

## 验证

- [ ] 集群利用率提升（实际使用量/请求量提高至少 20 个百分点）。
- [ ] 总月度成本降低至少 30%。
- [ ] 生产工作负载未受影响（验证 SLO）。
- [ ] 每周摘要发送至 Slack。

## 拓展目标

- 添加**成本感知自动扩缩容**：HPA 扩容时优先选择 Spot，不可用时回退至按需实例。
- 实现**作为成本预算的配额**：ResourceQuota → 等价的每月美元费用。
- 添加**按租户分摊成本**：各团队看到自己的费用明细。

## 常见陷阱

- **资源规格调整过于激进**——Pod 在负载下 OOM。使用 p99 利用率而非平均值。
- **生产环境全部使用 Spot**——预测期间 Spot 中断会导致用户请求失败。与按需实例混合使用，或仅对批处理使用 Spot。
- **Karpenter 未启用合并整理**——不会合并利用率低的节点。
- **清理闲置资源时误删正在使用的对象**——删除前确认所有者，始终保留七天宽限期。
