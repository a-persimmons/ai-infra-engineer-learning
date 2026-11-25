# MLflow 配置与使用指南

## 概览

本项目使用 MLflow 进行实验追踪、模型版本管理和模型注册。

## 配置

### 本地开发

TODO：记录 MLflow 配置步骤：
1. 安装 MLflow。
2. 启动实验追踪服务器。
3. 配置后端存储。
4. 配置产物存储。

```bash
# TODO: Add actual commands
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost/mlflow \
  --default-artifact-root s3://mlflow-artifacts/ \
  --host 0.0.0.0 \
  --port 5000
```

### 生产环境配置

TODO：记录生产级 MLflow 部署：
- 数据库后端（PostgreSQL）
- 产物存储（S3/MinIO）
- 身份验证
- 高可用性

## 使用方法

### 实验追踪

TODO：记录如何：
- 创建实验
- 记录参数
- 记录指标
- 记录产物
- 比较运行记录

示例：
```python
# TODO: Add complete examples
import mlflow

with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_metric("accuracy", 0.95)
    mlflow.log_artifact("model.pkl")
```

### 模型注册中心

TODO：记录：
- 注册模型
- 模型阶段（None、Staging、Production、Archived）
- 转换模型阶段
- 模型版本管理
- 模型元数据

示例：
```python
# TODO: Add complete examples
mlflow.register_model("runs:/run-id/model", "model-name")
```

### MLflow 界面

TODO：记录：
- 访问界面
- 浏览实验
- 比较运行记录
- 晋升模型
- 下载产物

## 与流水线集成

TODO：记录 MLflow 如何与以下流水线集成：
- 训练流水线
- 部署流水线
- CI/CD 流水线

## 最佳实践

TODO：记录：
- 命名规范
- 组织实验
- 标签策略
- 模型文档
- 产物组织

## 故障排查

TODO：记录常见问题：
- 连接错误
- 产物上传失败
- 模型注册问题
- 性能优化
