# 练习 09：GPU 推理优化

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 练习 03 与 08

## 目标

选取训练完成的 ResNet-50（或 BERT-base），依次应用五种推理优化：`torch.compile`、fp16/bf16、int8 量化（`torch.ao.quantization`）、TensorRT 导出和连续批处理。测量每一步的累计加速比与准确率变化。

## 为什么重要

推理是模型在生产环境中实际运行的阶段。合适的推理技术栈可以比基线快 5–20 倍，同时保持较小的准确率损失。掌握整套优化链路有助于消除性能瓶颈。

## 要求

对于 ResNet-50（或 BERT-base），输入为 224×224 图像（或 128 token）：

1. **基线**：`model.train(False)` + `torch.no_grad()`，fp32。
2. **`torch.compile`**：`model_compiled = torch.compile(model, mode="reduce-overhead")`。
3. **bf16 / fp16**：使用低精度运行相同模型。
4. **int8 量化**：`torch.ao.quantization.quantize_dynamic`。
5. **TensorRT**：导出至 ONNX → 导入 TRT → 基准测试。
6. **连续批处理**：实现简单的异步批处理器，在 20ms 窗口内聚合请求。

每步报告：延迟（p50/p95）、吞吐量（并发 32 时的 req/s）、留出验证集准确率。

## 分步操作

### 步骤 1——基线（15 分钟）
```python
import torch, time
from torchvision.models import resnet50, ResNet50_Weights

model = resnet50(weights=ResNet50_Weights.DEFAULT).cuda()
model.train(False)
x = torch.randn(1, 3, 224, 224, device="cuda")

def bench(model, x, iters=100):
    with torch.inference_mode():
        for _ in range(5): model(x); torch.cuda.synchronize()
        t0 = time.perf_counter()
        for _ in range(iters): model(x); torch.cuda.synchronize()
    return (time.perf_counter() - t0) / iters * 1000

print(f"baseline fp32: {bench(model, x):.2f}ms")
```

### 步骤 2——torch.compile（15 分钟）
```python
compiled = torch.compile(model, mode="reduce-overhead")
print(f"compile:        {bench(compiled, x):.2f}ms")
```
首次调用触发编译（较慢）。后续调用预计快 1.5–3 倍。

### 步骤 3——降低精度（30 分钟）
```python
model_bf16 = model.to(torch.bfloat16)
x_bf16 = x.to(torch.bfloat16)
print(f"bf16:           {bench(model_bf16, x_bf16):.2f}ms")

compiled_bf16 = torch.compile(model_bf16, mode="reduce-overhead")
print(f"compile+bf16:   {bench(compiled_bf16, x_bf16):.2f}ms")
```

### 步骤 4——动态 int8 量化（45 分钟）
```python
import torch.ao.quantization as q

model_cpu = resnet50(weights=ResNet50_Weights.DEFAULT).cpu()
model_cpu.train(False)
# Dynamic only quantizes linear layers (CPU-only); for full GPU int8, use TensorRT.
qmodel = q.quantize_dynamic(model_cpu, {torch.nn.Linear}, dtype=torch.qint8)
x_cpu = x.cpu().float()
print(f"int8 dyn (cpu): {bench(qmodel, x_cpu):.2f}ms")
# Note: this is CPU-only. For GPU int8, use TensorRT or vLLM-style quantization.
```

### 步骤 5——TensorRT（60 分钟）
```bash
pip install torch-tensorrt
```
```python
import torch_tensorrt
trt_model = torch_tensorrt.compile(
    model.cuda(),
    inputs=[torch_tensorrt.Input(shape=[1,3,224,224], dtype=torch.float16)],
    enabled_precisions={torch.float16},
)
print(f"TensorRT fp16:  {bench(trt_model, x.half()):.2f}ms")
```

### 步骤 6——连续批处理（45 分钟）
构建一个异步服务器，将传入请求聚合最多 20ms，或直到队列达到 32 个请求：
```python
import asyncio
queue: asyncio.Queue = asyncio.Queue()

async def batcher():
    while True:
        items = [await queue.get()]
        deadline = time.monotonic() + 0.020
        while len(items) < 32:
            timeout = deadline - time.monotonic()
            if timeout <= 0: break
            try: items.append(await asyncio.wait_for(queue.get(), timeout))
            except asyncio.TimeoutError: break
        # batch inference
        xs = torch.stack([item.input for item in items]).cuda()
        with torch.inference_mode():
            preds = model(xs)
        for item, pred in zip(items, preds):
            item.future.set_result(pred)
```

使用 `wrk` 或 `hey` 在并发 64 时进行基准测试。原文预期吞吐量为逐请求推理的 5–10 倍。

### 步骤 7——准确率验证（15 分钟）
针对每种优化方案，在 ImageNet 验证集上测量 Top-1 准确率。报告任何超过 0.5% 的准确率下降。

## 交付物

1. 覆盖六种方案的 `bench_inference.py`。
2. `RESULTS.md`：延迟、吞吐量与准确率表格。
3. `RECOMMENDATIONS.md`：哪些技术值得用于典型机器学习推理服务。
4. （拓展）连续批处理器的实时演示。

## 验证

- [ ] 每种技术均报告测量结果。
- [ ] 基线到完全优化的累计加速比至少为 5 倍。
- [ ] 每种技术在 ImageNet 验证集上的 Top-1 准确率下降不超过 1%。
- [ ] 并发 32 时，批处理器吞吐量至少为逐请求推理的五倍。

## 拓展目标

- 为 Transformer（LLM 服务）添加 **AWQ / GPTQ** 4-bit 量化。
- 使用 **vLLM** 进行 Transformer 基准测试，与 TensorRT 比较。
- 添加 **Kernel 融合**分析：使用 `nvprof` 或 `nsys` 确认 `torch.compile` 减少 Kernel 启动次数。

## 常见陷阱

- **`torch.compile` 首次调用慢**——第一次推理的编译可能超过 30 秒。在服务启动时预编译。
- **TensorRT fp16 引入小幅准确率退化**——通常可以接受，但需在验证集上确认。
- **批处理器受 CPU 限制**——Python 事件循环开销可能掩盖 GPU 收益；批处理吞吐量进入平台期时使用 `py-spy` 分析。
- **`quantize_dynamic` 仅用于 CPU**——GPU int8 使用 TensorRT 或 vLLM。不要混淆 API。

> 译注：本练习的固定窗口聚合更准确地说属于动态批处理，并非 LLM 解码阶段的连续批处理。CPU 动态量化与 GPU 优化应分别比较，不能简单累加加速比。
