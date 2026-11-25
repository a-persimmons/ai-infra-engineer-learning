# 部署指南

## 前置条件

1. 支持 GPU 的 Kubernetes 集群。
2. 已配置 kubectl。
3. 具有 Docker 镜像仓库访问权限。
4. 已安装 GPU 驱动。

TODO：补充详细前置条件。

## 部署步骤

### 1. 构建 Docker 镜像

```bash
# TODO: Add build commands
docker build -t llm-server:latest .
```

### 2. 推送至镜像仓库

```bash
# TODO: Add push commands
```

### 3. 部署至 Kubernetes

```bash
# TODO: Add kubectl commands
kubectl apply -f kubernetes/
```

### 4. 验证部署

```bash
# TODO: Add verification commands
```

## 配置

TODO：记录配置选项。

## 监控

TODO：记录监控设置。

## 故障排查

TODO：补充常见问题及解决方法。
