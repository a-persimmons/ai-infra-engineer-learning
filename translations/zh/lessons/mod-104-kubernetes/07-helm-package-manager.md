# 第 07 课：Helm 包管理器

## 学习目标
完成本课后，你将能够：
- 理解 Helm 的作用及其对 ML 基础设施的价值。
- 安装并配置 Helm 3。
- 使用 Helm Chart 部署应用。
- 为 ML 应用创建自定义 Helm Chart。
- 使用 Helm Values 配置部署。
- 管理 Chart 仓库。
- 实施面向 ML 平台的 Helm 最佳实践。
- 调试与排查 Helm 部署问题。

## 前置条件
- 完成第 01–06 课（Kubernetes 基础）。
- 理解 YAML 与模板概念。
- 熟悉 Kubernetes 资源（Deployment、Service 等）。
- 具备基础命令行技能。

## 导论

**Helm** 是 Kubernetes 的包管理器，类似 Ubuntu 的 apt 与 macOS 的 brew。

**Helm 为什么对 ML 基础设施重要：**
- **可复用性：** 将复杂 ML 技术栈（MLflow、Kubeflow 等）打包，便于部署。
- **配置管理：** 使用一个 Values 文件配置整个 ML 平台。
- **版本管理：** 将 ML 基础设施回滚至此前版本。
- **模板化：** 遵循 DRY（Don't Repeat Yourself，不要重复自己）原则，避免重复 Kubernetes YAML。
- **生态：** 原文列举超过 1,000 个预构建 Chart（Prometheus、Grafana、Airflow 等）。

**实际案例（原文列举，未独立核实）：**
- **Uber：** 使用 Helm 跨 1,000 个以上 K8s 集群部署 ML 平台组件。
- **Spotify：** 通过自定义 Helm Chart 部署个性化 ML 服务。
- **Airbnb：** 使用 Helm 管理实验基础设施。
- **Netflix：** 使用 Helm 部署推荐系统组件。

**不使用 Helm：**
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
# ... 50 more files
# How do you manage versions? How do you configure for dev vs prod?
```

**使用 Helm：**
```bash
helm install ml-platform ./ml-platform-chart --values prod-values.yaml
# Done! All resources deployed, configured, versioned.
```

## 1. Helm 概念

### 1.1 核心组件

**Chart：**
- 包含 Kubernetes 清单的软件包。
- 类似 .deb 或 .rpm 软件包。
- 具有模板和元数据的目录结构。

**Release：**
- Chart 安装到集群后的实例。
- 可以多次安装同一个 Chart（形成不同 Release）。
- 示例：`ml-platform-dev`、`ml-platform-staging`、`ml-platform-prod`。

**Repository（仓库）：**
- Chart 的集合。
- 可以是公共仓库（可通过 Artifact Hub 发现）或私有仓库（ChartMuseum、AWS ECR）。

**Values（配置值）：**
- Chart 的配置参数。
- 覆盖默认设置。
- 开发、预发布和生产环境可以使用不同的 Values。

### 1.2 Helm 架构（Helm 3）

```
┌─────────────────────────────────────────────┐
│           User's Machine                    │
│                                             │
│  ┌────────────┐                             │
│  │ Helm CLI   │                             │
│  └─────┬──────┘                             │
│        │                                    │
│        │ 1. helm install                    │
│        │    --values prod.yaml              │
│        │                                    │
└────────┼────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│         Kubernetes Cluster                  │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │    Kubernetes API Server           │    │
│  │  (Helm stores release info in      │    │
│  │   Secrets/ConfigMaps)              │    │
│  └────────────┬───────────────────────┘    │
│               │                             │
│               │ 2. Create resources         │
│               ▼                             │
│  ┌────────────────────────────────────┐    │
│  │  Deployment, Service, Ingress, ... │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

Note: Helm 3 removed Tiller (server-side component)
All operations are client-side + K8s API
```

## 2. 安装与使用 Helm

### 2.1 安装 Helm 3

```bash
# Install Helm on Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Or via package manager
# macOS
brew install helm

# Verify installation
helm version
# version.BuildInfo{Version:"v3.12.0", ...}

# Add common repositories
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 2.2 安装 Chart

**示例：安装 Prometheus 进行监控**

```bash
# Search for Prometheus charts
helm search repo prometheus

# Install Prometheus
helm install my-prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace

# List installed releases
helm list -n monitoring
# NAME           NAMESPACE  REVISION  STATUS    CHART
# my-prometheus  monitoring 1         deployed  prometheus-15.10.0

# Check deployed resources
kubectl get all -n monitoring
```

### 2.3 使用 Values 进行自定义配置

**查看默认 Values：**

```bash
helm show values prometheus-community/prometheus > prometheus-default-values.yaml
```

**创建自定义 Values 文件：**

```yaml
# prometheus-custom-values.yaml
server:
  persistentVolume:
    enabled: true
    size: 50Gi
    storageClass: gp3-balanced

  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 1000m
      memory: 2Gi

alertmanager:
  enabled: false  # Disable alertmanager

pushgateway:
  enabled: false  # Disable pushgateway
```

**使用自定义 Values 安装：**

```bash
helm install my-prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --values prometheus-custom-values.yaml
```

### 2.4 升级与回滚

**升级 Release：**

```bash
# Modify values file
# ... edit prometheus-custom-values.yaml ...

# Upgrade with new values
helm upgrade my-prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --values prometheus-custom-values.yaml

# View release history
helm history my-prometheus -n monitoring
# REVISION  STATUS     CHART                 DESCRIPTION
# 1         superseded prometheus-15.10.0    Install complete
# 2         deployed   prometheus-15.10.0    Upgrade complete
```

**回滚至此前版本：**

```bash
# Rollback to revision 1
helm rollback my-prometheus 1 -n monitoring

# Verify rollback
helm history my-prometheus -n monitoring
# REVISION  STATUS     CHART                 DESCRIPTION
# 1         superseded prometheus-15.10.0    Install complete
# 2         superseded prometheus-15.10.0    Upgrade complete
# 3         deployed   prometheus-15.10.0    Rollback to 1
```

### 2.5 卸载 Release

```bash
# Uninstall release (deletes all resources)
helm uninstall my-prometheus -n monitoring

# Keep history for potential rollback
helm uninstall my-prometheus -n monitoring --keep-history
```

## 3. 创建自定义 Helm Chart

### 3.1 Chart 结构

```
ml-model-serving/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default configuration values
├── templates/          # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl   # Template helpers
│   └── NOTES.txt      # Post-install notes
├── charts/             # Dependent charts (subcharts)
└── README.md           # Chart documentation
```

### 3.2 为 ML 模型服务创建 Chart

**步骤 1：生成 Chart 骨架**

```bash
helm create ml-model-serving
cd ml-model-serving
```

**步骤 2：定义 Chart.yaml**

```yaml
# Chart.yaml
apiVersion: v2
name: ml-model-serving
description: Helm chart for deploying ML model inference services
type: application
version: 1.0.0  # Chart version
appVersion: "1.0"  # Application version

keywords:
  - ml
  - machine-learning
  - inference
  - model-serving

maintainers:
  - name: ML Platform Team
    email: ml-platform@company.com

dependencies: []  # No subcharts for now
```

**步骤 3：定义默认 values.yaml**

```yaml
# values.yaml
replicaCount: 3

image:
  repository: myregistry.io/bert-inference
  tag: "v1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  host: ml-api.example.com
  path: /bert
  tls:
    enabled: true
    secretName: ml-api-tls

resources:
  limits:
    cpu: 4000m
    memory: 8Gi
    nvidia.com/gpu: 1
  requests:
    cpu: 2000m
    memory: 4Gi
    nvidia.com/gpu: 1

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

model:
  name: "bert-base-uncased"
  path: "/models/bert"
  batchSize: 32

env:
  - name: LOG_LEVEL
    value: "INFO"
  - name: WORKERS
    value: "4"
```

**步骤 4：创建 templates/deployment.yaml**

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "ml-model-serving.fullname" . }}
  labels:
    {{- include "ml-model-serving.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "ml-model-serving.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "ml-model-serving.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP

        env:
        - name: MODEL_NAME
          value: {{ .Values.model.name | quote }}
        - name: MODEL_PATH
          value: {{ .Values.model.path | quote }}
        - name: BATCH_SIZE
          value: {{ .Values.model.batchSize | quote }}
        {{- range .Values.env }}
        - name: {{ .name }}
          value: {{ .value | quote }}
        {{- end }}

        resources:
          {{- toYaml .Values.resources | nindent 12 }}

        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 60
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 30
          periodSeconds: 5
```

**步骤 5：创建 templates/service.yaml**

```yaml
# templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "ml-model-serving.fullname" . }}
  labels:
    {{- include "ml-model-serving.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: http
    protocol: TCP
    name: http
  selector:
    {{- include "ml-model-serving.selectorLabels" . | nindent 4 }}
```

**步骤 6：创建 templates/ingress.yaml**

```yaml
# templates/ingress.yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "ml-model-serving.fullname" . }}
  labels:
    {{- include "ml-model-serving.labels" . | nindent 4 }}
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.tls.enabled }}
  tls:
  - hosts:
    - {{ .Values.ingress.host }}
    secretName: {{ .Values.ingress.tls.secretName }}
  {{- end }}
  rules:
  - host: {{ .Values.ingress.host }}
    http:
      paths:
      - path: {{ .Values.ingress.path }}
        pathType: Prefix
        backend:
          service:
            name: {{ include "ml-model-serving.fullname" . }}
            port:
              number: {{ .Values.service.port }}
{{- end }}
```

**步骤 7：创建 templates/_helpers.tpl**

```yaml
# templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "ml-model-serving.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "ml-model-serving.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "ml-model-serving.labels" -}}
helm.sh/chart: {{ include "ml-model-serving.chart" . }}
{{ include "ml-model-serving.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ml-model-serving.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ml-model-serving.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "ml-model-serving.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
```

### 3.3 测试 Chart

**检查 Chart（Lint）：**

```bash
helm lint ./ml-model-serving
# ==> Linting ./ml-model-serving
# [INFO] Chart.yaml: icon is recommended
# 1 chart(s) linted, 0 chart(s) failed
```

**模拟安装（Dry Run）：**

```bash
helm install bert-model ./ml-model-serving \
  --namespace ml-serving \
  --dry-run --debug
# This will print all rendered YAML without actually installing
```

**渲染模板：**

```bash
# Render templates locally
helm template bert-model ./ml-model-serving \
  --values prod-values.yaml > rendered-manifests.yaml

# Inspect rendered YAML
cat rendered-manifests.yaml
```

**实际安装：**

```bash
helm install bert-model ./ml-model-serving \
  --namespace ml-serving \
  --create-namespace

# Verify installation
helm list -n ml-serving
kubectl get all -n ml-serving
```

## 4. 特定环境的 Values

### 4.1 开发环境

```yaml
# values-dev.yaml
replicaCount: 1

image:
  tag: "latest"  # Use latest for dev

service:
  type: NodePort  # Use NodePort for easy testing

ingress:
  enabled: false  # No Ingress in dev

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
    nvidia.com/gpu: 0  # No GPU in dev
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: false  # No autoscaling in dev

env:
  - name: LOG_LEVEL
    value: "DEBUG"  # Verbose logging in dev
```

**部署至开发环境：**

```bash
helm install bert-dev ./ml-model-serving \
  --namespace ml-dev \
  --values values-dev.yaml
```

### 4.2 生产环境

```yaml
# values-prod.yaml
replicaCount: 5

image:
  repository: myregistry.io/bert-inference
  tag: "v1.2.3"  # Specific version in prod

service:
  type: ClusterIP

ingress:
  enabled: true
  className: nginx
  host: ml-api.company.com
  path: /bert
  tls:
    enabled: true
    secretName: ml-api-prod-tls

resources:
  limits:
    cpu: 4000m
    memory: 8Gi
    nvidia.com/gpu: 1
  requests:
    cpu: 2000m
    memory: 4Gi
    nvidia.com/gpu: 1

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60

env:
  - name: LOG_LEVEL
    value: "WARNING"  # Less verbose in prod
  - name: WORKERS
    value: "8"
```

**部署至生产环境：**

```bash
helm install bert-prod ./ml-model-serving \
  --namespace ml-prod \
  --values values-prod.yaml
```

## 5. Helm 高级功能

### 5.1 Chart 依赖（Subchart，子 Chart）

**示例：包含 MLflow + PostgreSQL 的 ML 平台**

```yaml
# ml-platform/Chart.yaml
apiVersion: v2
name: ml-platform
version: 1.0.0
dependencies:
  - name: postgresql
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
  - name: minio
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
```

**安装依赖：**

```bash
cd ml-platform
helm dependency update
# Downloaded postgresql-12.8.0.tgz
# Downloaded minio-12.6.0.tgz
```

**覆盖子 Chart 的 Values：**

```yaml
# ml-platform/values.yaml
postgresql:
  auth:
    username: mlflow
    password: changeme
    database: mlflow
  primary:
    persistence:
      size: 50Gi

minio:
  auth:
    rootUser: admin
    rootPassword: changeme
  persistence:
    size: 500Gi
```

### 5.2 条件资源

**示例：按条件启用 GPU 支持**

```yaml
# values.yaml
gpu:
  enabled: true
  count: 1
  model: "Tesla-V100"
```

```yaml
# templates/deployment.yaml
spec:
  template:
    spec:
      {{- if .Values.gpu.enabled }}
      nodeSelector:
        nvidia.com/gpu.product: {{ .Values.gpu.model }}
      tolerations:
      - key: nvidia.com/gpu
        operator: Equal
        value: present
        effect: NoSchedule
      {{- end }}

      containers:
      - name: inference
        resources:
          {{- if .Values.gpu.enabled }}
          limits:
            nvidia.com/gpu: {{ .Values.gpu.count }}
          requests:
            nvidia.com/gpu: {{ .Values.gpu.count }}
          {{- end }}
```

### 5.3 Helm Hook（钩子）

**使用 Hook 在安装/升级之前或之后运行 Job：**

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "ml-model-serving.fullname" . }}-pre-install
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
      - name: model-downloader
        image: amazon/aws-cli
        command: ["sh", "-c"]
        args:
          - |
            aws s3 cp s3://my-models/bert-v1.0.pth /models/
        volumeMounts:
        - name: models
          mountPath: /models
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: model-storage-pvc
      restartPolicy: Never
```

**Hook 类型：**
- `pre-install`：安装之前运行。
- `post-install`：安装之后运行。
- `pre-upgrade`：升级之前运行。
- `post-upgrade`：升级之后运行。
- `pre-delete`：卸载之前运行。
- `post-delete`：卸载之后运行。

## 6. 面向 ML 的 Helm 最佳实践

### 6.1 版本管理策略

```yaml
# Use semantic versioning
Chart.yaml:
  version: 1.2.3  # Chart version (increment when chart changes)
  appVersion: "2.0.0"  # Application version (model version)

values.yaml:
  image:
    tag: "v2.0.0"  # Match appVersion
```

**版本管理：**

```bash
# Install specific chart version
helm install bert ./ml-model-serving --version 1.2.3

# Upgrade to specific version
helm upgrade bert ./ml-model-serving --version 1.3.0

# List available versions
helm search repo ml-model-serving --versions
```

### 6.2 Secret 管理

**不要将 Secret 提交至 values.yaml！**

**选项 1：使用独立的加密 Secret 文件**

```yaml
# secrets.yaml (DO NOT COMMIT)
postgresql:
  auth:
    password: "super-secret-password"
```

```bash
# Encrypt with git-crypt or SOPS
# Then install
helm install ml-platform ./ml-platform \
  --values values.yaml \
  --values secrets.yaml  # Encrypted secrets
```

**选项 2：使用外部 Secret 管理**

```yaml
# Use external-secrets operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ml-platform-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: ml-platform-db-password
  data:
  - secretKey: password
    remoteRef:
      key: prod/ml-platform/db-password
```

**选项 3：通过 CLI 传递配置值**

```bash
helm install ml-platform ./ml-platform \
  --set postgresql.auth.password="$(kubectl get secret db-password -o jsonpath='{.data.password}' | base64 -d)"
```

### 6.3 资源命名规范

```yaml
# _helpers.tpl
{{- define "ml-model.fullname" -}}
{{ .Release.Name }}-{{ .Chart.Name }}
{{- end }}

# Results in predictable names:
# bert-prod-ml-model-serving-deployment
# bert-prod-ml-model-serving-service
# bert-prod-ml-model-serving-ingress
```

### 6.4 使用 JSON Schema 进行验证

```yaml
# values.schema.json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["replicaCount", "image"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {"type": "string"},
        "tag": {"type": "string"}
      }
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits": {
          "type": "object",
          "properties": {
            "nvidia.com/gpu": {"type": "integer", "minimum": 0, "maximum": 8}
          }
        }
      }
    }
  }
}
```

**Helm 可以自动根据 Schema 验证 Values！**

## 7. 发布与共享 Chart

### 7.1 打包 Chart

```bash
# Package chart into .tgz archive
helm package ml-model-serving/
# Successfully packaged chart and saved it to: ml-model-serving-1.0.0.tgz
```

### 7.2 在 Chart 仓库中托管 Chart

**选项 1：GitHub Pages（免费托管选项）**

```bash
# Create gh-pages branch
git checkout --orphan gh-pages
git rm -rf .

# Package charts
helm package ../ml-model-serving
helm package ../ml-platform

# Create index
helm repo index . --url https://mycompany.github.io/helm-charts

# Commit and push
git add .
git commit -m "Initial charts"
git push origin gh-pages

# Users can now add your repo
helm repo add mycompany https://mycompany.github.io/helm-charts
helm repo update
helm search repo mycompany
```

**选项 2：ChartMuseum（自托管）**

```bash
# Install ChartMuseum
helm install chartmuseum stable/chartmuseum \
  --set env.open.DISABLE_API=false \
  --set persistence.enabled=true

# Upload chart
curl --data-binary "@ml-model-serving-1.0.0.tgz" \
  http://chartmuseum.example.com/api/charts
```

**选项 3：AWS ECR / GCP Artifact Registry / Azure ACR**

```bash
# AWS ECR example
aws ecr create-repository --repository-name helm-charts
helm push ml-model-serving-1.0.0.tgz oci://123456789.dkr.ecr.us-west-2.amazonaws.com/helm-charts
```

## 8. 排查 Helm 部署问题

### 8.1 常见问题

**问题 1：模板渲染错误**

```bash
helm install bert ./ml-model-serving
# Error: YAML parse error on ml-model-serving/templates/deployment.yaml:
# error converting YAML to JSON: yaml: line 25: mapping values are not allowed in this context

# Debug: Render templates
helm template bert ./ml-model-serving --debug
```

**问题 2：Release 处于失败状态**

```bash
helm list -n ml-serving
# NAME  STATUS  REVISION
# bert  failed  1

# Check release notes
helm get notes bert -n ml-serving

# Get all manifests of release
helm get manifest bert -n ml-serving

# Check values used
helm get values bert -n ml-serving

# Uninstall and reinstall
helm uninstall bert -n ml-serving
helm install bert ./ml-model-serving -n ml-serving
```

**问题 3：升级卡住或失败**

```bash
# Rollback to previous revision
helm rollback bert -n ml-serving

# Force upgrade (dangerous!)
helm upgrade bert ./ml-model-serving -n ml-serving --force

# Delete and reinstall (nuclear option)
helm uninstall bert -n ml-serving
helm install bert ./ml-model-serving -n ml-serving
```

## 9. 动手练习：使用 Helm 部署 ML 平台

**目标：** 创建部署以下组件的 Helm Chart：
- ML 模型推理服务。
- 用于监控的 Prometheus。
- 用于仪表盘的 Grafana。

**步骤 1：创建 Chart 结构**

```bash
mkdir ml-platform-chart
cd ml-platform-chart
helm create .
```

**步骤 2：在 Chart.yaml 中定义依赖**

```yaml
# Chart.yaml
apiVersion: v2
name: ml-platform
version: 1.0.0
dependencies:
  - name: prometheus
    version: 15.x.x
    repository: https://prometheus-community.github.io/helm-charts
  - name: grafana
    version: 6.x.x
    repository: https://grafana.github.io/helm-charts
```

**步骤 3：配置 Values**

```yaml
# values.yaml
mlModel:
  enabled: true
  replicaCount: 3
  image:
    repository: myregistry.io/bert-inference
    tag: v1.0.0

prometheus:
  server:
    persistentVolume:
      size: 50Gi

grafana:
  adminPassword: changeme
  persistence:
    enabled: true
    size: 10Gi
```

**步骤 4：安装依赖**

```bash
helm dependency update
```

**步骤 5：部署**

```bash
helm install ml-platform . \
  --namespace ml-platform \
  --create-namespace \
  --values values.yaml

# Check deployment
helm list -n ml-platform
kubectl get all -n ml-platform
```

## 10. 总结

### 核心要点

**Helm 是 Kubernetes 的包管理器：**
- 软件包称为 Chart。
- 安装实例称为 Release。
- Chart 支持版本管理及复用。

**Helm 简化部署：**
- 使用单条命令部署复杂应用。
- 模板化消除重复 YAML。
- 通过 Values 配置特定环境。

**创建自定义 Chart：**
- 使用 helm create 生成骨架。
- 使用 Go 模板定义资源。
- 使用 values.yaml 管理配置。
- 使用 helm lint 与 helm template 测试。

**最佳实践：**
- 使用语义化版本管理。
- 分离开发、预发布与生产环境 Values。
- 不要将 Secret 提交至 values.yaml。
- 使用 JSON Schema 验证。
- 为复杂技术栈使用 Chart 依赖。

**实际 ML 使用场景：**
- 部署 ML 平台（MLflow、Kubeflow）。
- 打包模型服务应用。
- 管理多环境部署。
- 对 ML 基础设施进行版本管理。

## 自我检查问题

1. Helm Chart 与 Helm Release 有什么区别？
2. 如何覆盖 Chart 的默认 Values？
3. 使用什么命令回滚失败的升级？
4. 如何创建具有依赖的 Chart？
5. templates/_helpers.tpl 的用途是什么？
6. 如何将同一 Chart 部署至开发、预发布和生产环境？
7. 什么是 Helm Hook？何时使用？
8. 如何排查无法安装的 Chart？

## 补充资源

- [Helm 官方文档](https://helm.sh/docs/)
- [Artifact Hub（Chart 发现平台）](https://artifacthub.io/)
- [Helm 最佳实践](https://helm.sh/docs/chart_best_practices/)
- [创建 Chart 指南](https://helm.sh/docs/chart_template_guide/)
- [Helm Chart 测试](https://github.com/helm/chart-testing)

---

**下一课：** Kubernetes 的监控与故障排查。

> 译注：Artifact Hub 主要是软件包发现与索引平台，并非所有 Chart 的实际托管仓库。直接通过 CLI 传递敏感值可能使其出现在 Shell 历史、进程参数与 Helm Release 记录中；应优先使用外部密钥管理方案。Helm 回滚不能自动撤销数据库迁移等外部副作用，Hook 资源也需明确生命周期管理。原文使用 Helm 3，其他版本可能存在差异；代码块及其中英文注释保持原样，未执行部署或升级操作。本仓库下一编号课程实际为第 08 课 GPU 调度。
