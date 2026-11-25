# 第 04 课：机器学习框架基础

**时长：** 6 小时
**目标：** 从基础设施工程师的角度理解 PyTorch 与 TensorFlow。

## 导论

作为机器学习基础设施工程师，你不必成为模型训练专家，但需要充分理解机器学习框架，以便：

- 有效部署模型。
- 排查框架相关问题。
- 优化推理性能。
- 选择合适的模型服务策略。
- 与数据科学家沟通。

本课从**基础设施视角**介绍 PyTorch 与 TensorFlow，聚焦构建和维护机器学习基础设施所需的知识。

## PyTorch 与 TensorFlow：概览

### PyTorch
**开发者：** Meta（Facebook）AI Research。
**发布：** 2016 年。
**理念：** 动态计算图、符合 Python 使用习惯、对研究友好。

**优势：**
- 容易学习与调试。
- 动态计算图提供灵活性。
- 在研究社区中广泛使用。
- 强大的生态系统（Hugging Face、Lightning）。
- 适合实验。

**使用场景：**
- 研究项目。
- 自然语言处理（Transformer、LLM）。
- 计算机视觉研究。
- 快速原型开发。

### TensorFlow
**开发者：** Google Brain。
**发布：** 2015 年。
**理念：** 静态计算图（TF 1.x），针对生产环境优化。

**优势：**
- 成熟的生产工具（TF Serving）。
- 移动端与边缘部署（TF Lite）。
- 广泛的企业采用。
- 完整的生态系统。
- 适合大规模生产应用。

**使用场景：**
- 生产机器学习系统。
- 移动端与边缘 AI。
- 大规模分布式训练。
- 企业部署。

### 市场份额（2025 年，原文估计）
- **研究论文：** PyTorch 约 70%，TensorFlow 约 30%。
- **生产部署：** PyTorch 与 TensorFlow 各约 50%。
- **趋势：** PyTorch 在生产环境中持续增长，TensorFlow 在移动端与边缘场景具有优势。

> 译注：以上比例为原文估计，未提供统计口径或来源，不宜作为市场调查结论。TensorFlow 2 默认支持 Eager Execution，PyTorch 也支持编译与图优化；两者并非严格的动静态二分。

## 面向基础设施工程师的 PyTorch 基础

### 1. 理解 PyTorch 模型

**模型组件：**
```python
import torch
import torch.nn as nn

# Basic model structure
class SimpleModel(nn.Module):
    def __init__(self):
        super(SimpleModel, self).__init__()
        self.layer1 = nn.Linear(10, 50)
        self.layer2 = nn.Linear(50, 1)

    def forward(self, x):
        x = torch.relu(self.layer1(x))
        x = self.layer2(x)
        return x

# Create model
model = SimpleModel()

# Model has parameters (weights)
print(f"Parameters: {sum(p.numel() for p in model.parameters())}")
```

**基础设施工程师需要知道：**
- 模型是 Python 对象（nn.Module）。
- 模型具有状态（参数/权重）。
- forward() 定义推理逻辑。
- 提供服务前必须加载参数。

### 2. 模型序列化（保存与加载）

**两种保存模型的方法：**

```python
# Method 1: Save entire model (easier but less flexible)
torch.save(model, 'model_complete.pth')
loaded_model = torch.load('model_complete.pth')

# Method 2: Save state dict (recommended for production)
torch.save(model.state_dict(), 'model_weights.pth')

# To load:
model = SimpleModel()  # Must recreate architecture
model.load_state_dict(torch.load('model_weights.pth'))
model.eval()  # Set to evaluation mode!
```

**对基础设施的影响：**
- 原文称 State Dict 体积约小 50%（不包含架构代码）。
- State Dict 在不同 PyTorch 版本之间通常更易移植。
- 加载 State Dict 时必须具备模型架构代码。
- 提供推理服务前始终调用 .eval()！

> 译注：State Dict 与完整模型的大小差异取决于实际对象内容，通常由权重主导，并无固定的 50% 比例。加载不可信序列化对象存在安全风险，应优先使用可信来源、受限加载方式或 safetensors。

### 3. 推理模式

```python
# WRONG - Training mode (uses dropout, batch norm training behavior)
output = model(input_data)

# CORRECT - Evaluation mode
model.eval()
with torch.no_grad():  # Disable gradient computation
    output = model(input_data)
```

**为什么重要：**
- .eval() 改变某些层的行为（Dropout、Batch Normalization）。
- torch.no_grad() 减少显存占用并加快推理。
- 忘记设置这些模式可能导致预测不正确或不必要的资源开销！

### 4. 设备管理（CPU 与 GPU）

```python
# Check if GPU is available
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Move model to device
model = model.to(device)

# Move input to same device
input_tensor = input_tensor.to(device)

# Inference
with torch.no_grad():
    output = model(input_tensor)

# Move output back to CPU for processing
output = output.cpu().numpy()
```

**基础设施考虑因素：**
- 模型与输入必须位于兼容的设备上。
- 原文认为大型模型的 GPU 推理可比 CPU 快 10–100 倍。
- 在 CPU/GPU 间移动数据会增加延迟（原文示例约 1–10ms）。
- 不使用模型并行时，一个模型通常可以在单块 GPU 上运行（前提是能够容纳）。

### 5. 批量推理

```python
# Single inference (inefficient)
for image in images:
    output = model(image.unsqueeze(0))  # Add batch dimension

# Batch inference (much better!)
batch = torch.stack(images)  # Stack into batch
outputs = model(batch)  # Process all at once
```

**性能影响：**
- 批量推理吞吐量可能比逐条推理高 3–10 倍。
- 批处理显著改善 GPU 利用率。
- 取舍：等待批次形成会增加请求延迟。

### 6. 推理模型优化

```python
# 1. TorchScript - Compile model for faster inference
scripted_model = torch.jit.script(model)
scripted_model.save("model_scripted.pt")

# Load and use
scripted_model = torch.jit.load("model_scripted.pt")
output = scripted_model(input_tensor)

# 2. Quantization - Reduce model size and increase speed
import torch.quantization
quantized_model = torch.quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)
```

**优化收益（原文示例）：**
- **TorchScript：** 推理加速 10–30%。
- **量化：** 模型缩小至约四分之一，推理加速 2–4 倍。
- 两者可以组合。

## 面向基础设施工程师的 TensorFlow 基础

### 1. 理解 TensorFlow 模型

**TensorFlow 2.x 使用 Keras API：**

```python
import tensorflow as tf
from tensorflow import keras

# Create model
model = keras.Sequential([
    keras.layers.Dense(50, activation='relu', input_shape=(10,)),
    keras.layers.Dense(1)
])

# Model must be compiled
model.compile(optimizer='adam', loss='mse')

# Model summary
model.summary()
```

**与 PyTorch 的主要区别：**
- 模型采用更高层级的抽象。
- 训练前通常需要编译配置。
- 静态计算图可在图创建时优化。

> 译注：Keras 模型仅进行前向推理时通常不需要 compile()；TensorFlow 2 支持 Eager Execution 与 tf.function 图执行。

### 2. 模型序列化（保存与加载）

```python
# Method 1: SavedModel format (recommended for production)
model.save('my_model')  # Creates directory with model

# Load
loaded_model = keras.models.load_model('my_model')

# Method 2: HDF5 format (older, single file)
model.save('model.h5')
loaded_model = keras.models.load_model('model.h5')
```

**对基础设施的影响：**
- SavedModel 是 TensorFlow Serving 使用的标准格式。
- 包含计算图、权重及相关配置。
- 体积可能较大（数百 MB 至数 GB）。
- 版本管理至关重要。

### 3. 使用 TensorFlow 推理

```python
# Inference
predictions = model.predict(input_data)

# For better performance, use call directly
predictions = model(input_data, training=False)
```

**性能提示：**
- 对小批次，直接调用 model() 通常比 model.predict() 更快。
- training=False 禁用训练专用行为。
- 批量推理对 GPU 利用率至关重要。

### 4. TensorFlow Serving 格式

```python
# Save for TensorFlow Serving
import tensorflow as tf

# Save with version number (important!)
export_path = './serving_model/1'  # Version 1
model.save(export_path)

# Directory structure:
# serving_model/
#   1/
#     saved_model.pb
#     variables/
#       variables.data-00000-of-00001
#       variables.index
```

**对模型服务的影响：**
- 版本号支持安全更新。
- TF Serving 可以加载多个版本。
- 目录结构标准化。

### 5. GPU 配置

```python
# List available GPUs
gpus = tf.config.list_physical_devices('GPU')
print(f"GPUs available: {len(gpus)}")

# Limit GPU memory growth (prevents OOM on shared GPUs)
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)

# Use specific GPU
with tf.device('/GPU:0'):
    predictions = model(input_data)
```

## 模型格式与转换

### ONNX（Open Neural Network Exchange，开放神经网络交换）

**ONNX 为什么重要：**
- 通用模型交换格式。
- 支持框架之间的模型转换。
- 使用 ONNX Runtime 部署（可获得较高性能）。

```python
# PyTorch to ONNX
import torch.onnx

dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    export_params=True,
    opset_version=12,
    input_names=['input'],
    output_names=['output']
)

# TensorFlow to ONNX (requires tf2onnx)
import tf2onnx

spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)
model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec)
with open("model.onnx", "wb") as f:
    f.write(model_proto.SerializeToString())
```

**基础设施收益：**
- 与框架解耦的模型服务。
- 在许多场景下推理比原生框架更快。
- 更小的部署资源占用。

### 模型大小比较

| 模型类型 | PyTorch | TensorFlow | ONNX | TorchScript | 量化后 |
|---|---|---|---|---|---|
| ResNet-50 | 98 MB | 99 MB | 97 MB | 98 MB | 25 MB |
| BERT Base | 440 MB | 438 MB | 438 MB | 440 MB | 110 MB |
| GPT-2 Small | 548 MB | 550 MB | 548 MB | 548 MB | 137 MB |

## 框架生态系统

### PyTorch 生态系统

**Hugging Face Transformers**（自然语言处理/LLM）
```python
from transformers import AutoModel, AutoTokenizer

# Load pre-trained model
model = AutoModel.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
```

**PyTorch Lightning**（训练框架）
- 简化训练代码。
- 内置多 GPU 支持。
- 有助于理解训练基础设施。

**TorchServe**（模型服务）
- PyTorch 生态中的模型服务方案。
- 后续课程将使用该工具。

### TensorFlow 生态系统

**TensorFlow Hub**（预训练模型）
```python
import tensorflow_hub as hub

# Load model from TF Hub
model = hub.load("https://tfhub.dev/google/imagenet/resnet_v2_50/classification/5")
```

**TF Lite**（移动端/边缘）
- 部署到移动设备。
- 针对边缘推理优化。
- 对移动机器学习应用具有重要意义。

**TensorFlow Serving**（生产服务）
- 行业常用模型服务方案。
- 高性能 gRPC 与 REST API。

## 不同框架的基础设施考虑因素

### 内存管理

**PyTorch：**
- 动态内存分配。
- 如果管理不当，可能发生 OOM。
- 使用 torch.cuda.empty_cache() 释放未使用的缓存显存。

**TensorFlow：**
- 自动内存管理。
- 可以使用 set_memory_growth() 控制显存按需增长。
- 原文认为更适合长期运行的服务。

### 多 GPU 服务

**PyTorch：**
```python
# Multiple models on different GPUs
models = []
for i in range(num_gpus):
    model = create_model()
    model.to(f'cuda:{i}')
    models.append(model)

# Route requests to appropriate GPU
def predict(input_data, gpu_id):
    with torch.cuda.device(gpu_id):
        return models[gpu_id](input_data)
```

**TensorFlow：**
```python
# TensorFlow has built-in multi-GPU support
strategy = tf.distribute.MirroredStrategy()
with strategy.scope():
    model = create_model()
```

### 预热要求

两种框架都能从预热中受益：

```python
# PyTorch warm-up
model.eval()
dummy_input = torch.randn(1, 3, 224, 224).to(device)
with torch.no_grad():
    for _ in range(10):  # Run 10 times to warm up
        _ = model(dummy_input)

# TensorFlow warm-up
dummy_input = tf.random.normal((1, 224, 224, 3))
for _ in range(10):
    _ = model(dummy_input, training=False)
```

**为什么需要预热：**
- 首次推理可能慢 10–100 倍（例如 JIT 编译）。
- CUDA Kernel 需要初始化。
- 第一次运行时可能进行内存分配。
- 预热对于准确的稳态延迟测试至关重要。

## 为基础设施选择框架

### 何时选择 PyTorch
- 使用自然语言处理/LLM（Hugging Face 生态）。
- 研究导向的环境。
- 需要灵活性与易调试性。
- 可以采用以 Python 为主的部署方式。
- 使用学术研究代码。

### 何时选择 TensorFlow
- 需要移动端/边缘部署（TF Lite）。
- 大规模生产部署（TF Serving）。
- 关注稳定性的企业环境。
- 需要 Google Cloud Platform 集成。
- 需要 JavaScript 部署（TensorFlow.js）。

### 与框架无关的方法
- 转换至 ONNX。
- 使用 ONNX Runtime 提供服务。
- 在许多场景中可以获得良好的性能。
- 减少对训练框架的依赖。

## 常见基础设施问题

### 问题 1：OOM（内存不足）

**症状：**
- CUDA out of memory 错误。
- Python 进程被终止。

**解决方案：**
```python
# Reduce batch size
batch_size = 16  # Try 8, 4, 2, 1

# Use gradient checkpointing (training)
# Use mixed precision (FP16 instead of FP32)
# Clear cache between batches
torch.cuda.empty_cache()

# Monitor memory
print(f"Allocated: {torch.cuda.memory_allocated() / 1e9} GB")
print(f"Cached: {torch.cuda.memory_reserved() / 1e9} GB")
```

### 问题 2：首次推理缓慢

**原因：** 模型编译、CUDA 初始化。

**解决方案：** 始终进行预热！

### 问题 3：模型与输入形状不匹配

**症状：**
- 关于张量形状的运行时错误。

**解决方案：**
```python
# Always verify input shape
expected_shape = (1, 3, 224, 224)
assert input_tensor.shape == expected_shape, f"Expected {expected_shape}, got {input_tensor.shape}"
```

### 问题 4：CPU 与 GPU 不匹配

**症状：**
- Expected tensor on cuda:0 but got tensor on cpu。

**解决方案：**
```python
# Ensure consistent device
device = next(model.parameters()).device
input_tensor = input_tensor.to(device)
```

## 实践练习

创建简单的推理基准测试：

```python
import time
import torch
import torchvision.models as models

# Load model
model = models.resnet18(pretrained=True)
model.eval()

# Create dummy input
dummy_input = torch.randn(1, 3, 224, 224)

# Warm up
for _ in range(10):
    with torch.no_grad():
        _ = model(dummy_input)

# Benchmark
num_runs = 100
start = time.time()
with torch.no_grad():
    for _ in range(num_runs):
        _ = model(dummy_input)
end = time.time()

avg_time = (end - start) / num_runs
print(f"Average inference time: {avg_time*1000:.2f} ms")
print(f"Throughput: {1/avg_time:.2f} inferences/sec")
```

**任务：**
1. 在 CPU 与 GPU（如果可用）上运行。
2. 比较不同批大小（1、8、16、32）。
3. 分别测试预热与不预热的情况。
4. 尝试不同模型（ResNet-18 与 ResNet-50）。

## 核心要点

1. **框架选择很重要**——原文建议 PyTorch 用于研究/NLP，TensorFlow 用于生产/移动端。
2. **始终使用评估模式**——model.eval() 和 torch.no_grad()。
3. **预热至关重要**——首次推理可能慢得多。
4. **批量推理通常具有更高吞吐量**——特别是在 GPU 上。
5. **内存管理很重要**——GPU OOM 是常见问题。
6. **可以进一步优化**——TorchScript、量化、ONNX。
7. **保持设备一致性**——让模型与输入位于兼容设备上。

## 自我检查问题

1. PyTorch 与 TensorFlow 的计算图有何区别？
2. 为什么推理前需要调用 model.eval()？
3. 保存 PyTorch 模型的两种方式是什么？分别何时使用？
4. 什么是 TorchScript？如何改善推理性能？
5. 什么是 ONNX？为什么对基础设施有用？
6. 如何预热模型？为什么需要预热？
7. 批量推理与单条推理有何区别？

## 补充资源

- [PyTorch 文档](https://pytorch.org/docs/)
- [TensorFlow 文档](https://www.tensorflow.org/guide)
- [ONNX Runtime](https://onnxruntime.ai/)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [TorchServe 文档](https://pytorch.org/serve/)
- [TensorFlow Serving](https://www.tensorflow.org/tfx/guide/serving)

---

**下一课：** [05-cloud-intro.md](./05-cloud-intro.md)——机器学习基础设施的云平台。

> 译注：保留原文框架与工具示例。TorchScript、TorchServe、Keras 保存格式等工具的维护状态和接口可能随版本变化；新项目应核对当前支持的导出与服务方案。empty_cache() 不会释放仍被张量占用的显存。设备、模型、精度与负载都会影响性能，表中大小与加速数字仅为示例。
