# 故障排查指南——ML 模型服务

## 常见问题及解决方案

### 1. Docker 构建问题

#### 问题：“Docker build 失败，提示 no space left on device”

**症状：**
```
ERROR: failed to solve: write /var/lib/docker/...: no space left on device
```

**解决方案：**
```bash
# Clean up Docker
docker system prune -a --volumes
docker builder prune

# Check disk space
df -h
```

#### 问题：“镜像构建很慢”

**症状：** 构建超过 10 分钟。

**解决方案：**
1. 按变更频率排列 Dockerfile 层。
2. 使用 .dockerignore 排除不必要文件。
3. 使用多阶段构建。
4. 启用 BuildKit：
   ```bash
   export DOCKER_BUILDKIT=1
   docker build -t ml-api:v1 .
   ```

---

### 2. 容器运行时问题

#### 问题：“容器立即退出”

**症状：**
```bash
docker run ml-api:v1
# Container exits with code 1
```

**调试：**
```bash
# Check logs
docker logs <container-id>

# Run interactively
docker run -it ml-api:v1 /bin/bash

# Check if model file exists
docker run ml-api:v1 ls -la /app/models/
```

**常见原因：**
- 找不到模型文件。
- 权限问题。
- 缺少依赖。

#### 问题：“模型无法加载”

**症状：**
```
ERROR: Failed to load model from /app/models/resnet18.pth
FileNotFoundError: [Errno 2] No such file or directory
```

**解决方案：**
```bash
# Ensure model file exists
ls -la models/

# Check volume mount
docker run -v $(pwd)/models:/app/models ml-api:v1 ls /app/models/

# Download model if missing
# TODO: Add model download script
```

---

### 3. Kubernetes 部署问题

#### 问题：“Pod 卡在 Pending 状态”

**症状：**
```bash
kubectl get pods -n ml-serving
NAME                      READY   STATUS    RESTARTS   AGE
ml-api-xxxxxxxxx-xxxxx   0/1     Pending   0          5m
```

**调试：**
```bash
kubectl describe pod ml-api-xxxxxxxxx-xxxxx -n ml-serving

# Common reasons:
# 1. Insufficient resources
# 2. Image pull issues
# 3. Volume mount issues
```

**解决方案：**
```bash
# Check node resources
kubectl top nodes

# Check events
kubectl get events -n ml-serving --sort-by='.lastTimestamp'

# Reduce resource requests in deployment.yaml if needed
```

#### 问题：“ImagePullBackOff”

**症状：**
```
Events:
  Warning  Failed     5m    kubelet  Failed to pull image "ml-api:v1"
  Warning  BackOff    2m    kubelet  Back-off pulling image "ml-api:v1"
```

**解决方案：**
```bash
# For local Kubernetes (minikube/kind):
minikube image load ml-api:v1
# or
kind load docker-image ml-api:v1

# For cloud Kubernetes:
# Push image to container registry (GCR, ECR, ACR)
docker push gcr.io/project/ml-api:v1

# Update deployment.yaml with full image path
image: gcr.io/project/ml-api:v1
```

#### 问题：“CrashLoopBackOff”

**症状：**
```
NAME                      READY   STATUS             RESTARTS   AGE
ml-api-xxxxxxxxx-xxxxx   0/1     CrashLoopBackOff   5          5m
```

**调试：**
```bash
# Check logs
kubectl logs ml-api-xxxxxxxxx-xxxxx -n ml-serving

# Check previous container logs
kubectl logs ml-api-xxxxxxxxx-xxxxx -n ml-serving --previous

# Common causes:
# - Application crashes on startup
# - Health check failing
# - Out of memory (OOM)
```

**解决方案：**
```bash
# If OOM, increase memory limit
resources:
  limits:
    memory: "2Gi"  # Increase from 1Gi

# If health check failing, adjust timing
livenessProbe:
  initialDelaySeconds: 60  # Increase if model loading is slow
  periodSeconds: 30
  timeoutSeconds: 10
```

---

### 4. API 问题

#### 问题：“API 返回 503 Service Unavailable”

**症状：**
```bash
curl http://localhost:8000/health
{"detail": "Service unavailable"}
```

**原因：**
- 模型未加载。
- 应用未启动。
- 健康检查失败。

**解决方案：**
```bash
# Check logs
docker logs <container-id>
# or
kubectl logs deployment/ml-api -n ml-serving

# Verify model file exists
# Increase startup timeout
# Check resource availability (memory, CPU)
```

#### 问题：“推理缓慢（超过 1 秒）”

**症状：**
- 预测耗时数秒。
- 超时。

**调试：**
```python
# Add timing in code
import time
start = time.time()
result = model(input)
print(f"Inference time: {time.time() - start:.3f}s")
```

**解决方案：**
1. **使用 GPU：** 为容器增加 GPU 支持。
2. **模型优化：** 使用 ONNX、TensorRT 或量化。
3. **批量推理：** 一起处理多个图像。
4. **模型缓存：** 确保模型预加载，而非每次请求加载。
5. **减小图像：** 对输入图像降采样。

**CPU 与 GPU 对比：**
```
CPU inference: 100-500ms
GPU inference: 5-50ms (10-100x faster)
```

#### 问题：“推理期间内存不足（OOM）”

**症状：**
```
torch.cuda.OutOfMemoryError: CUDA out of memory
```

**解决方案：**
```python
# 1. Reduce batch size
batch_size = 1  # or smaller

# 2. Use model with smaller memory footprint
model = models.resnet18(pretrained=True)  # instead of resnet152

# 3. Clear GPU cache
import torch
torch.cuda.empty_cache()

# 4. Use CPU instead of GPU for small workloads
device = torch.device("cpu")
```

---

### 5. 监控问题

#### 问题：“Prometheus 未抓取指标”

**症状：**
- Prometheus 中没有指标。
- Target 显示为 Down。

**调试：**
```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit: http://localhost:9090/targets

# Check if metrics endpoint is accessible
curl http://localhost:8000/metrics
```

**解决方案：**
```bash
# 1. Verify Prometheus configuration
kubectl get configmap prometheus-config -n monitoring -o yaml

# 2. Check service discovery
kubectl get servicemonitor -n ml-serving

# 3. Verify network connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://ml-api-service.ml-serving.svc.cluster.local:80/metrics
```

#### 问题：“Grafana 仪表盘没有数据”

**解决方案：**
```bash
# 1. Check Prometheus datasource
# Grafana → Configuration → Data Sources → Prometheus

# 2. Verify metrics exist in Prometheus
# Query: predictions_total

# 3. Check time range (last 5 minutes)

# 4. Verify dashboard queries match metric names
```

---

### 6. 性能问题

#### 问题：“延迟过高（P99 超过 500ms）”

**性能分析：**
```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Your inference code
result = model(input)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumtime')
stats.print_stats(10)  # Top 10 functions
```

**常见瓶颈（原文示例）：**
1. **图像预处理：** 20–50ms。
   - 方案：优化 Resize/Normalize 操作。
2. **模型推理：** 50–200ms（CPU）、5–50ms（GPU）。
   - 方案：使用 GPU、优化模型。
3. **后处理：** 5–10ms。
   - 方案：向量化操作。

#### 问题：“吞吐低（每秒不足 10 个请求）”

**解决方案：**
1. **水平扩展：** 添加 Pod。
2. **异步处理：** 使用 FastAPI async。
3. **请求批处理：** 一起处理多个请求。
4. **连接池：** 复用连接。
5. **缓存：** 缓存常见预测。

---

### 7. 扩缩容问题

#### 问题：“HPA 未扩容”

**症状：**
- CPU/内存超过目标，但未创建新 Pod。

**调试：**
```bash
# Check HPA status
kubectl get hpa -n ml-serving
kubectl describe hpa ml-api-hpa -n ml-serving

# Check metrics-server
kubectl top pods -n ml-serving
```

**解决方案：**
```bash
# 1. Ensure metrics-server is installed
kubectl get deployment metrics-server -n kube-system

# 2. Verify resource requests are set
# HPA requires resource requests to be defined

# 3. Check HPA configuration
kubectl edit hpa ml-api-hpa -n ml-serving
```

---

## 调试命令速查

### Docker

```bash
# View container logs
docker logs <container-id>
docker logs -f <container-id>  # Follow logs

# Execute command in running container
docker exec -it <container-id> /bin/bash

# Inspect container
docker inspect <container-id>

# Check resource usage
docker stats
```

### Kubernetes

```bash
# Pod status
kubectl get pods -n ml-serving
kubectl describe pod <pod-name> -n ml-serving

# Logs
kubectl logs <pod-name> -n ml-serving
kubectl logs -f deployment/ml-api -n ml-serving

# Execute command in pod
kubectl exec -it <pod-name> -n ml-serving -- /bin/bash

# Port forward
kubectl port-forward <pod-name> 8000:8000 -n ml-serving

# Resource usage
kubectl top pods -n ml-serving
kubectl top nodes

# Events
kubectl get events -n ml-serving --sort-by='.lastTimestamp'
```

---

## 寻求帮助

若问题未在此覆盖：
1. 检查应用日志。
2. 搜索 GitHub Issues。
3. 在 Discussions 提问。
4. 创建新 Issue，包含：
   - 错误信息。
   - 复现步骤。
   - 环境（Docker、K8s 版本等）。
   - 日志。

---

## 补充资源

- [Docker 故障排查](https://docs.docker.com/config/containers/troubleshoot/)
- [Kubernetes 故障排查](https://kubernetes.io/docs/tasks/debug/)
- [FastAPI 调试](https://fastapi.tiangolo.com/tutorial/debugging/)

> 译注：异步 I/O 不会自动加速 CPU 密集推理；需评估执行器、并发限制、模型线程安全与批处理等待时间。清理 Docker 或 Kubernetes 资源前先检查是否仍被使用。所有原始代码块保留，未实际运行。
