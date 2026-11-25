# 实验 03：搭建适用于机器学习的 Azure 环境

**时长：** 90 分钟  **前置条件：** 拥有 Contributor 权限的 Azure 订阅。

## 目标

搭建最小 Azure 机器学习环境：资源组、虚拟网络、用于模型产物的存储账号、Azure Container Registry，以及运行 iris-api 并具有公开入口的 Azure Container App。

## 步骤

### 1. 配置 CLI
```bash
az login
az account set --subscription "<NAME-OR-ID>"
LOC=eastus
RG=ml-lab-rg
az group create -n $RG -l $LOC
```

### 2. 为产物创建存储账号与容器
```bash
SA=mllabsa$RANDOM
az storage account create -n $SA -g $RG -l $LOC --sku Standard_LRS
az storage container create -n artifacts --account-name $SA
az storage blob upload --account-name $SA -c artifacts -n iris/model.joblib -f model.joblib
```

### 3. 创建 Container Registry 并推送镜像
```bash
ACR=mllabacr$RANDOM
az acr create -n $ACR -g $RG --sku Basic --admin-enabled true
az acr login -n $ACR
docker tag iris-api:0.2 $ACR.azurecr.io/iris-api:0.2
docker push $ACR.azurecr.io/iris-api:0.2
```

### 4. 创建 Container Apps 环境与应用
```bash
az extension add -n containerapp --upgrade
az provider register -n Microsoft.App --wait

ENV=ml-lab-env
az containerapp env create -n $ENV -g $RG -l $LOC

APP=iris-api
az containerapp create -n $APP -g $RG --environment $ENV \
  --image $ACR.azurecr.io/iris-api:0.2 \
  --target-port 8000 --ingress external \
  --registry-server $ACR.azurecr.io \
  --query properties.configuration.ingress.fqdn -o tsv
```

### 5. 测试
```bash
FQDN=$(az containerapp show -n $APP -g $RG --query properties.configuration.ingress.fqdn -o tsv)
curl https://$FQDN/health
curl -X POST https://$FQDN/predict -H 'content-type: application/json' \
  -d '{"sepal_length":5.1,"sepal_width":3.5,"petal_length":1.4,"petal_width":0.2}'
```

## 验证

- [ ] HTTPS 端点的 `/health` 返回 200。
- [ ] `/predict` 返回 JSON 预测结果。
- [ ] 存储账号包含 `iris/model.joblib` Blob。
- [ ] ACR 包含 `iris-api:0.2` 镜像。

## 清理
```bash
az group delete -n $RG --yes --no-wait
```

## 故障排查

- **`az containerapp create` 失败，提示资源提供程序未注册** — 执行 `az provider register -n Microsoft.App --wait` 后重试。
- **镜像拉取失败** — Container App 必须具有镜像仓库凭据。ACR 启用管理员时，`--registry-server` 参数也会设置身份凭据。
- **区域不受支持** — Container Apps 已在大部分区域正式可用，但并非全部区域；尝试 `eastus`、`westeurope` 或 `australiaeast`。
