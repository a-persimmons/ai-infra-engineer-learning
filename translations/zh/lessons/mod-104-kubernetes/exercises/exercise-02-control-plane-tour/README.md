# 练习 02：探索 Kubernetes 控制面

**时长：** 2.5 小时
**难度：** 中级
**前置条件：** 练习 01。

## 目标

通过阅读日志、进入 Pod 执行命令，以及触发可观察的效果，探索 Kubernetes 控制面组件（kube-apiserver、etcd、kube-scheduler、kube-controller-manager）。完成后，你将理解从 `kubectl apply` 到 Pod 运行的请求流程。

## 为什么重要

Kubernetes 的魔法并非魔法，而是五个组件分别执行特定工作。理解各组件的工程师，比将 K8s 当成黑盒的工程师诊断得更快（原文举例为 10 倍）。

## 步骤

### 步骤 1——盘点控制面（15 分钟）
```bash
kubectl get pods -n kube-system
# Expect: kube-apiserver, etcd, kube-scheduler, kube-controller-manager, kube-proxy, coredns
```

### 步骤 2——执行 apply 期间阅读 kube-apiserver 日志（30 分钟）
```bash
kubectl logs -n kube-system kube-apiserver-kind-control-plane -f &

# In another terminal:
kubectl apply -f deployment.yaml

# Observe the apiserver logs showing admission, validation, persistence
```

在日志中识别：
- Mutating Admission Webhook。
- 验证步骤。
- 最终写入 etcd 的操作。

### 步骤 3——直接检查 etcd（30 分钟）
```bash
kubectl -n kube-system exec etcd-kind-control-plane -- sh
# Inside:
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  get /registry/deployments/default/iris-api --print-value-only | head -30
```
你可以看到 etcd 实际存储的 Deployment 对象。

### 步骤 4——观察调度器（30 分钟）
```bash
kubectl logs -n kube-system kube-scheduler-kind-control-plane -f &

# Create a pod with unschedulable requirements:
kubectl run busy --image=nginx --requests=cpu=100,memory=1Ti

# Scheduler logs report 0/N nodes available
```
移除不合理的资源请求 → Pod 被调度 → 日志显示结果。

### 步骤 5——观察 Controller Manager 的工作（30 分钟）
```bash
kubectl logs -n kube-system kube-controller-manager-kind-control-plane -f &

# Scale a deployment up:
kubectl scale deploy/iris-api --replicas=10
# Controller logs the ReplicaSet updates and pod creates

# Kill a pod:
kubectl delete pod -l app=iris --random
# Controller immediately creates a replacement (logs show it)
```

### 步骤 6——端到端追踪单次请求（30 分钟）
运行 `kubectl --v=8 get pods` 查看 API 调用。

然后运行 `kubectl get --raw /api/v1/namespaces/default/pods` 发起原始请求。

再在 etcd 中运行 `etcdctl get /registry/pods/default/ --prefix --keys-only`。

现在你已经看到了完整链路：客户端 → apiserver → etcd → 响应。

## 交付物

1. `OBSERVATIONS.md`，记录各组件的职责与日志片段。
2. 所追踪请求流程的示意图。

## 验证

- [ ] 可以用一句话说出每个控制面组件的职责。
- [ ] 已观察 apiserver 处理真实的 apply 请求。
- [ ] 已直接从 etcd 中读取 Kubernetes 对象。
- [ ] 已实时观察调度器与 Controller Manager 对操作的响应。

## 拓展目标

- 临时禁用调度器（原文给出的托管集群示例为 `kubectl -n kube-system scale --replicas=0 deploy/kube-scheduler`；kind 中则重命名 /etc/kubernetes/manifests 内的清单）。尝试调度 Pod，再恢复调度器。仅在可丢弃的实验集群中操作。
- 阅读一个控制器的源代码（例如 kubernetes/kubernetes 中的 Deployment 控制器）。
- 通过审计日志追踪一次 Pod 创建（先启用审计日志）。

## 常见陷阱

- **手动写入造成 etcd 损坏**——绝不要在生产环境中直接写入 etcd。
- **禁用控制器**——在进行变更前，集群可能看似正常。
- **`kubectl --v=8` 输出过多**——仅在调试时使用，而非默认启用。

> 译注：托管集群一般不允许用户直接缩容控制面调度器；具体操作取决于集群部署方式。
