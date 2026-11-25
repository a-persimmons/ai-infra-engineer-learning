# 实验 05：使用 Helm 打包应用

**时长：** 75 分钟  **前置条件：** 已安装 Helm 3；拥有 kind 集群。

## 目标

将实验 04 的模型服务清单转换为参数化的 Helm Chart，安装它，为不同环境覆盖配置值，并执行回滚。

## 步骤

### 1. 生成脚手架
```bash
helm create iris-chart
ls iris-chart/
# Chart.yaml  values.yaml  templates/  charts/  .helmignore
```

### 2. 替换默认模板

去掉生成的样板内容，编写最小化模板：
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "iris-chart.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector: { matchLabels: { app: {{ include "iris-chart.name" . }} } }
  template:
    metadata: { labels: { app: {{ include "iris-chart.name" . }} } }
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.repo }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports: [{ containerPort: 8000 }]
```

### 3. values.yaml
```yaml
replicaCount: 2
image:
  repo: iris-api
  tag: "0.2"
  pullPolicy: Never
service:
  port: 80
  nodePort: 30080
```

### 4. 渲染与规范检查
```bash
helm lint iris-chart
helm template demo iris-chart           # render to stdout
helm template demo iris-chart -f values-prod.yaml
```

### 5. 安装
```bash
helm install iris ./iris-chart
helm list
kubectl get all -l app=iris-chart
```

### 6. 升级
```bash
helm upgrade iris ./iris-chart --set replicaCount=4
helm history iris
```

### 7. 回滚
```bash
helm rollback iris 1
helm history iris
```

### 8. 卸载
```bash
helm uninstall iris
```

## 验证

- [ ] `helm lint` 返回 0 个错误。
- [ ] `helm template` 渲染所有清单并完成值替换。
- [ ] 使用 `--set replicaCount=4` 后，集群显示 4 个 Pod。
- [ ] `helm rollback` 将副本数恢复为 2。

## 清理
```bash
helm uninstall iris 2>/dev/null
rm -rf iris-chart
```

## 故障排查

- **模板渲染错误** — `helm template --debug` 即使输出无效也会展示渲染结果。检查缺失的 `.Values.x.y` 引用。
- **安装一直处于 waiting** — 使用 `--timeout 1m --atomic`，使失败时自动回滚。
- **`Error: release iris failed: cannot re-use a name`** — 先前失败的安装留下了记录。先执行 `helm uninstall iris`。
