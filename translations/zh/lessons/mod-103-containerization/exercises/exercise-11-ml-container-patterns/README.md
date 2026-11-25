# 练习 11：机器学习专用容器模式

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–09

## 目标

实现通用 Docker 教程通常没有覆盖的四种机器学习容器模式：启动时模型预热、Init Container 预加载模型、基于 Sidecar 的动态批处理，以及支持可配置热切换的只读模型。每种模式都对真实指标产生可测量影响（冷启动延迟、模型切换停机时间、峰值吞吐量）。

## 为什么重要

通用容器模式（多阶段构建、非 Root 用户、健康检查）可以解决大部分问题。剩余部分属于机器学习特有的挑战，也是进一步优化的机会。掌握这些模式的工程师可以交付更快、更可用的模型服务。

## 模式 1——启动时模型预热

**问题：** 部署后首次请求比平时慢十倍，因为 Python/PyTorch JIT、分配器初始化与 CUDA Graph 等操作可能延迟执行。

**方案：** 在 Lifespan 启动阶段通过推理路径发送合成预测请求，提前预热相关组件。

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load(MODEL_PATH)
    # Warmup
    dummy = np.zeros((1, FEATURE_COUNT), dtype=np.float32)
    for _ in range(5):
        app.state.model.predict(dummy)
    log.info("model warmed up")
    yield
```

**验证：** 测量新启动 Pod 的首次请求延迟。应不超过稳态延迟的两倍，而非十倍。

## 模式 2——通过 Init Container 下载模型

**问题：** 容器启动时下载 7GB 模型会使就绪探针数分钟无法通过。

**方案：** 使用 Kubernetes initContainer 将模型下载至共享卷；主容器从本地磁盘快速加载。

```yaml
spec:
  initContainers:
    - name: model-download
      image: curlimages/curl:latest
      command: ["sh", "-c", "curl -fL $MODEL_URL -o /models/current.bin"]
      env: [{ name: MODEL_URL, value: "s3://models/iris/current.bin" }]
      volumeMounts: [{ name: models, mountPath: /models }]
  containers:
    - name: api
      image: iris-api:0.2
      volumeMounts: [{ name: models, mountPath: /models, readOnly: true }]
  volumes:
    - name: models
      emptyDir: { sizeLimit: 10Gi }
```

**验证：** 与此前在主容器内下载模型的行为比较，Pod 在 initContainer 完成后数秒内进入 Ready。

## 模式 3——动态批处理 Sidecar

**问题：** 逐请求推理浪费 GPU，小批次效率较低。

**方案：** Sidecar 容器聚合约 50ms 内的请求，再将其作为一个批次转发给模型。

```yaml
spec:
  containers:
    - name: api            # accepts client requests, forwards to batcher
      image: iris-api-frontend:0.2
      ports: [{ containerPort: 8000 }]
    - name: batcher        # aggregates and calls model
      image: iris-api-batcher:0.2
      ports: [{ containerPort: 9000 }]
    - name: model          # actual inference, GPU-bound
      image: iris-api-model:0.2
      resources: { limits: { nvidia.com/gpu: 1 } }
```

批处理器使用异步队列，具有批大小（32）与时间（50ms）两个触发条件，以先到达者为准。

**验证：** 原文预期 GPU 利用率从逐请求时的约 10% 升至批处理时的约 70%；吞吐量提高 5–10 倍，p99 延迟增加不超过 100ms。

## 模式 4——模型热切换

**问题：** 更新模型需要滚动重启，浪费资源且具有风险。

**方案：** 模型加载器监听带版本的符号链接；变化时并行加载新模型，再原子切换。无需重启 Pod。

```python
import threading, time

_lock = threading.RLock()
_model = None
_loaded_version = None

def loader_thread():
    global _model, _loaded_version
    while True:
        try:
            actual = os.readlink("/models/active.symlink")
            if actual != _loaded_version:
                new = joblib.load(actual)
                with _lock:
                    _model = new
                    _loaded_version = actual
                log.info(f"swapped to model {actual}")
        except Exception as e:
            log.error(f"loader: {e}")
        time.sleep(10)

threading.Thread(target=loader_thread, daemon=True).start()

@app.post("/predict")
def predict(req):
    with _lock:
        m = _model
    return {"prediction": m.predict(req.features), "version": _loaded_version}
```

**验证：** 将符号链接更新为指向新模型文件。约十秒内，预测响应显示新版本。Pod 重启次数为零。

## 分步操作

### 步骤 1——实现每种模式（每种 15–30 分钟）
选择 iris-api 或稍重一些的模型。分别实现并测试每种模式。

### 步骤 2——测量影响（30 分钟）
针对每种模式，采集优化前后的相关指标：
- 模式 1：首次请求延迟。
- 模式 2：Pod 达到 Ready 的时间。
- 模式 3：固定并发量下的 GPU 利用率与吞吐量。
- 模式 4：模型切换停机时间（应接近零）。

### 步骤 3——生产环境完善（30 分钟）
选择一种模式，添加结构化日志、模式自身的指标（预热耗时、批次填充时间、切换事件）以及失败时的错误处理。

### 步骤 4——编写文档（30 分钟）
`PATTERNS.md` 记录每种模式的问题、适用时机、不适用时机、实现概要及实测收益。

## 交付物

1. 全部四种模式的可用实现。
2. 各模式影响的实测数据表。
3. `PATTERNS.md` 参考文档。
4. 每种模式对应的一套 Kubernetes 清单（展示 YAML，而不仅仅是代码）。

## 验证

- [ ] 模式 1：首次请求延迟不超过稳态的两倍。
- [ ] 模式 2：相较原始耗时，基于 initContainer 的 Pod 在目标时间内 Ready（原文目标低于 30 秒）。
- [ ] 模式 3：持续负载下 GPU 利用率至少达到 50%（相较逐请求时的个位数百分比）。
- [ ] 模式 4：演示无需重启 Pod 即完成切换。

## 拓展目标

- 为模式 3 的批处理器添加**优雅排空**：收到 SIGTERM 后，完成正在处理的所有批次再退出。
- 结合模式 2 与 4：initContainer 下载 N 个模型，通过配置选择热切换的目标。
- 使用 `torch.cuda.set_per_process_memory_fraction(0.9)` 限制进程的显存分配比例，使显存预算更可预测。

## 常见陷阱

- **预热发生在线程错误的位置**——异步 Lifespan + 同步模型可能引起阻塞或事件循环问题。根据模型线程安全要求使用 asyncio.to_thread。
- **initContainer 不共享容器文件系统层**——使用 emptyDir 卷共享模型，而非容器镜像层。
- **Sidecar 批处理器成为单点故障**——批处理器崩溃时请求全部失败。配置服务副本与回退至逐请求模式的熔断机制。
- **热切换不具备原子性**——读取过程可能看到部分更新的状态。正确同步读写，避免暴露不完整状态。

> 译注：Init Container 不会消除下载时间，应分别测量整个 Pod 启动时间与主容器就绪时间；热切换需预留同时容纳两个模型的资源，并保证旧请求完成。显存分配比例限制不是显存锁定或预留。上述性能数字是原文目标，需实测。
