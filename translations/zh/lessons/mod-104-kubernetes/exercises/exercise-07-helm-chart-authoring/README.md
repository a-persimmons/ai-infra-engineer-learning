# 练习 07：编写生产级 Helm Chart

**时长：** 3 小时
**难度：** 中级
**前置条件：** 实验 05（Helm 基础）。

## 目标

为 iris-api 服务编写功能完备、面向生产环境的 Helm Chart，包含模板、values 覆盖、依赖项、测试、NOTES.txt 及验证它的 CI 工作流。

## 要求

1. Chart 至少包含 10 个模板。
2. `values.yaml` 涵盖镜像、副本、资源、Ingress、自动扩缩容、监控、安全上下文。
3. 为 dev/staging/prod 提供多个 `values-<env>.yaml`。
4. 子 Chart 依赖（例如用于元数据的 postgresql）。
5. 使用 `helm test` Hook 验证部署可用。
6. `NOTES.txt` 提供实用的安装后操作说明。
7. CI 执行 `helm lint`、`helm template` 及 `kubeval`/`kubeconform`。

## 分步操作

### 步骤 1——生成脚手架（10 分钟）
```bash
helm create iris-api
cd iris-api
```

### 步骤 2——精简并重写（45 分钟）
删除样板内容，编写精简但完整的模板：
- `templates/_helpers.tpl`——名称与标签辅助函数。
- `templates/deployment.yaml`
- `templates/service.yaml`
- `templates/ingress.yaml`（取决于 `.Values.ingress.enabled`）
- `templates/hpa.yaml`（条件式）
- `templates/configmap.yaml`
- `templates/secret.yaml`
- `templates/serviceaccount.yaml`
- `templates/servicemonitor.yaml`（取决于 `.Values.monitoring.enabled`）
- `templates/networkpolicy.yaml`（条件式）
- `templates/tests/test-connection.yaml`——`helm test` Hook。

### 步骤 3——values.yaml（30 分钟）
```yaml
replicaCount: 2
image:
  repository: iris-api
  tag: ""        # default to chart appVersion
  pullPolicy: IfNotPresent

ingress:
  enabled: false
  className: nginx
  hosts:
    - host: iris.local
      paths: [{ path: /, pathType: Prefix }]

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

resources:
  requests: { cpu: 100m, memory: 256Mi }
  limits:   { cpu: 500m, memory: 512Mi }

monitoring:
  enabled: false
  serviceMonitor:
    interval: 30s

postgresql:
  enabled: false       # use sub-chart for metadata storage
  auth: { username: iris, database: iris }
```

### 步骤 4——子 Chart 依赖（30 分钟）
```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: 15.5.0
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```
```bash
helm dependency update
```

### 步骤 5——测试 Hook（15 分钟）
```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "iris-api.fullname" . }}-test-connection"
  annotations: { "helm.sh/hook": test }
spec:
  restartPolicy: Never
  containers:
    - name: wget
      image: busybox
      command: ["wget"]
      args: ["{{ include "iris-api.fullname" . }}:{{ .Values.service.port }}/health"]
```

### 步骤 6——NOTES.txt（15 分钟）
```
Thank you for installing iris-api!

To get started:
{{- if .Values.ingress.enabled }}
  Visit: http://{{ (index .Values.ingress.hosts 0).host }}
{{- else }}
  kubectl port-forward svc/{{ include "iris-api.fullname" . }} 8080:80
  Then: curl http://localhost:8080/health
{{- end }}

Run tests:
  helm test {{ .Release.Name }}
```

### 步骤 7——各环境 values（15 分钟）
- `values-dev.yaml`：一个副本、无 Ingress、最小资源。
- `values-staging.yaml`：两个副本、使用预发布证书的 Ingress。
- `values-prod.yaml`：启用 HPA、监控、使用生产证书的 Ingress，以及 NetworkPolicy。

### 步骤 8——安装并验证（15 分钟）
```bash
helm install iris ./iris-api -f values-dev.yaml
helm test iris
helm upgrade iris ./iris-api -f values-staging.yaml --atomic
helm history iris
helm rollback iris 1
```

### 步骤 9——CI 工作流（15 分钟）
```yaml
on: pull_request
jobs:
  lint-and-template:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-helm@v4
      - run: helm lint iris-api/
      - run: helm dependency update iris-api/
      - run: helm template test iris-api/ -f iris-api/values-prod.yaml | kubeconform -strict -
```

## 交付物

1. 包含至少 10 个模板的完整 Chart。
2. 三份各环境 values 文件。
3. `helm test` Hook。
4. CI 工作流。
5. `CHART_README.md`，记录全部 values。

## 验证

- [ ] `helm lint` 通过。
- [ ] `helm template` 为三个环境均生成有效 YAML。
- [ ] `helm install` 与 `helm test` 成功。
- [ ] `helm upgrade` 以原子方式更新 values（需按实际配置启用相关选项）。
- [ ] `helm rollback` 能够回滚。
- [ ] CI 在每个 PR 上执行验证。

## 拓展目标

- 添加**库 Chart（Library Chart）**，供多个服务 Chart 共享模板辅助函数。
- 通过 `helm-unittest` 添加**单元测试**。
- 将 Chart 发布到 **Helm 仓库**（ChartMuseum、OCI 镜像仓库）。
