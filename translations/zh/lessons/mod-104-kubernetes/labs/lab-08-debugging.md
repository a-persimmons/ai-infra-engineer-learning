# 实验 08：从零排查故障部署

**时长：** 90 分钟  **前置条件：** 任意 Kubernetes 集群。

## 目标

使用三个故意设置故障的工作负载，练习系统化 Kubernetes 调试。不提前查看答案，找出各自的根因并修复。

## 步骤

### 1. 应用包含故障的清单
```yaml
# broken.yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: bug-a }
spec:
  replicas: 1
  selector: { matchLabels: { app: bug-a } }
  template:
    metadata: { labels: { app: bug-a } }
    spec:
      containers:
        - name: app
          image: nginx:badtag           # bug A: nonexistent tag
          ports: [{ containerPort: 80 }]
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: bug-b }
spec:
  replicas: 1
  selector: { matchLabels: { app: bug-b } }
  template:
    metadata: { labels: { app: bug-b } }
    spec:
      containers:
        - name: app
          image: nginx:1.27
          resources:
            requests: { cpu: "200", memory: "100Gi" }    # bug B: impossible requests
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: bug-c }
spec:
  replicas: 1
  selector: { matchLabels: { app: bug-c } }
  template:
    metadata: { labels: { app: bug-c-WRONG } }            # bug C: selector/label mismatch
    spec:
      containers:
        - name: app
          image: nginx:1.27
```
```bash
kubectl apply -f broken.yaml
```

### 2. 调试方法

对每个有故障的 Deployment：

1. `kubectl get pods` → 查看状态阶段和重启次数。
2. `kubectl describe pod <name>` → 底部的 Events 通常会告诉你原因。
3. `kubectl logs <name>` → 查看应用层错误。
4. `kubectl get deploy <name> -o yaml | grep -A 10 status` → 查看控制器层状态。

### 3. 故障 A——ImagePullBackOff
```
Events:
  Failed to pull image "nginx:badtag": ... manifest not found
```
**修复：** 更正镜像标签。

### 4. 故障 B——无法调度
```
Events:
  0/1 nodes are available: 1 Insufficient cpu, 1 Insufficient memory.
```
**修复：** 设置合理的资源请求。

### 5. 故障 C——Deployment 始终无法进入 Ready

`kubectl describe deploy bug-c` 显示副本数为 0，或者部署卡住——选择器为 `bug-c`，但模板标签为 `bug-c-WRONG`。**修复：** 使标签匹配。

### 6. 附加任务：模拟 CrashLoop
```yaml
containers:
  - name: app
    image: busybox
    command: ["sh", "-c", "exit 1"]
```
使用 `kubectl logs --previous` 和 `kubectl describe pod` 调查。

## 验证

- [ ] 三个 Deployment 均达到 1/1 Ready。
- [ ] 不回看前面的步骤，也能清楚阐述每个故障的根因。

## 清理
```bash
kubectl delete -f broken.yaml
```

## 调试快捷命令

- `kubectl get events --sort-by=.metadata.creationTimestamp`
- `kubectl exec -it <pod> -- sh` — 进入 Pod 内部调查。
- `kubectl debug -it <pod> --image=busybox --target=<container>` — 临时调试容器。
- `kubectl get pod <name> -o yaml` — 完整的 spec 与 status。

## 故障排查（针对调试过程本身）

- **`describe` 未显示 Events** — Events 按命名空间划分，约一小时后过期。排查较早的故障时不要仅依赖它们。
- **`logs` 没有任何输出** — 容器从未成功启动。检查 `describe` 中的初始化阶段或镜像拉取失败信息。
