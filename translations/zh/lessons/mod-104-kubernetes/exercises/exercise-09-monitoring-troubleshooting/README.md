# 练习 09：掌握 Kubernetes 监控与故障排查

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 05 的监控技术栈；实验 08 的调试方法。

## 目标

安装 kube-prometheus-stack 与 Pixie（或类似工具），并用它们诊断五类事故：网络、资源、调度、配置与状态。

## 要求

1. 完整监控技术栈已安装且健康。
2. 注入五个刻意设置的故障，每个在 10 分钟内完成诊断。
3. 记录每个事故的诊断路径。
4. 构建个人 `K8S_DEBUG_PLAYBOOK.md`。

## 分步操作

### 步骤 1——安装（30 分钟）
按照 mod-101 实验 05 操作。验证 Prometheus、Grafana 与 kube-state-metrics 均在运行。

### 步骤 2——添加 Pixie 进行实时集群检查（30 分钟）
```bash
bash -c "$(curl -fsSL https://withpixie.ai/install.sh)"
px deploy
```
Pixie 无需修改代码即可自动埋点，提供实时 Pod 级指标及网络流量信息。

### 步骤 3——事故 1：Pod 无法访问外部 API（20 分钟）
```bash
kubectl apply -f incident-1-egress-blocked.yaml
# (NetworkPolicy denies all egress)
```
诊断工具：`kubectl describe netpol`、`kubectl exec pod -- curl -v https://example.com`、Pixie 网络流量。

### 步骤 4——事故 2：Pod 被 OOMKilled（20 分钟）
```bash
kubectl apply -f incident-2-low-memory.yaml
# (memory limit 64Mi but app needs 200Mi)
```
诊断工具：`kubectl describe pod`（lastState 中出现 OOMKilled）、`kubectl top pod`、Grafana cgroup 内存图表。

### 步骤 5——事故 3：Pod 一直处于 Pending（20 分钟）
```bash
kubectl apply -f incident-3-unschedulable.yaml
# (requests > any node capacity)
```
诊断：`kubectl describe pod`（底部 Events）、`kubectl get nodes -o wide`、`kubectl top nodes`。

### 步骤 6——事故 4：配置漂移（20 分钟）
```bash
kubectl apply -f incident-4-bad-config.yaml
# (ConfigMap has invalid JSON → app crashes on read)
```
诊断：`kubectl logs pod`、`kubectl exec -- cat /etc/config/...`，再执行 `kubectl describe cm`。

### 步骤 7——事故 5：Service 没有 Endpoint（20 分钟）
```bash
kubectl apply -f incident-5-selector-mismatch.yaml
# (Service selector wrong)
```
诊断：`kubectl get endpoints svc`、`kubectl get pods --show-labels`，与选择器比较。

### 步骤 8——汇总排查手册（30 分钟）
对每类事故记录三步诊断流程：
- 症状 → 用于确认的命令 → 修复

## 交付物

1. 可用的监控系统与 Pixie。
2. 五个事故均已复现、诊断与修复。
3. `K8S_DEBUG_PLAYBOOK.md`。

## 验证

- [ ] 每次诊断耗时低于 10 分钟。
- [ ] 已应用修复，且每次修复后集群健康。
- [ ] 排查手册包含全部五类事故及具体命令。

## 常见陷阱

- **不阅读 Events**——始终从 `kubectl describe` 开始。
- **仅依赖 `kubectl logs`**——有时问题位于 kubelet，而非应用。
- **忘记 `--previous`**——对于 CrashLoopBackOff，需要查看前一个容器实例的日志。
