# 练习 06：LLM 推理优化

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 练习 03（深入 vLLM）

## 目标

对 70 亿参数模型依次应用并测量一系列推理优化：连续批处理、前缀缓存、KV Cache 压缩、量化（AWQ）、TensorRT-LLM。目标是累计吞吐量提升 5 倍以上。

## 要求

1. 基线：Hugging Face Transformers，batch=1。
2. 分别测量每项优化及其累积效果。
3. 最终技术栈的吞吐量达到基线的至少 5 倍。

## 分步操作

### 步骤 1——基线（15 分钟）
```python
import time, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
tok = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-Instruct-v0.3")
model = AutoModelForCausalLM.from_pretrained("...", torch_dtype=torch.bfloat16, device_map="auto")
model.train(False)

prompts = ["Tell me about Kubernetes."] * 32
t0 = time.perf_counter()
for p in prompts:
    inputs = tok(p, return_tensors="pt").to("cuda")
    out = model.generate(**inputs, max_new_tokens=100)
print(f"baseline: {32/(time.perf_counter()-t0):.2f} req/s")
```

### 步骤 2——vLLM（连续批处理）（15 分钟）
通过 vLLM 提供相同模型服务，施加相同负载。预期比基线提升 3–5 倍。

### 步骤 3——前缀缓存（10 分钟）
`--enable-prefix-caching`。具有共享提示词前缀的工作负载可从中获益。

### 步骤 4——AWQ 量化（30 分钟）
```bash
# Quantize once (offline)
pip install autoawq
python -c "from awq import AutoAWQForCausalLM; m = AutoAWQForCausalLM.from_pretrained('Mistral-7B-Instruct-v0.3'); m.quantize(...); m.save_quantized('./mistral-awq')"

vllm serve ./mistral-awq --quantization awq
```
4-bit 权重 → 大小约为原来的四分之一，速度通常提升 1.5 倍。

### 步骤 5——KV Cache 压缩（15 分钟）
`--kv-cache-dtype fp8` 将 KV 显存占用减少 50%，允许使用更大的批大小。

### 步骤 6——TensorRT-LLM（60 分钟）
导出至 TRT-LLM Engine，通过 Triton Inference Server 提供服务。
```bash
# Compile
trtllm-build --model_config ... --output ./engine
# Serve via Triton
docker run nvcr.io/nvidia/tritonserver:24.05-trtllm-python-py3 ...
```
原文指出 TensorRT-LLM 在相同硬件上通常比 vLLM 快 1.5–2 倍。

### 步骤 7——并发下的连续批处理基准测试（30 分钟）
使用负载测试工具（vegeta、oha、k6）：
```bash
hey -z 60s -c 32 -m POST -T 'application/json' \
  -d '{"model":"...","messages":[...]}' http://localhost:8000/v1/chat/completions
```

### 步骤 8——最终报告（15 分钟）

| 优化措施 | 吞吐量（并发 32 时 req/s） | TTFT p95 | 相较基线加速比 |
|---|---|---|---|
| 基线（HF） | ~1 | ~3000 ms | 1× |
| vLLM | ~5 | ~400 ms | 5× |
| + 前缀缓存 | ~7 | ~200 ms | 7× |
| + AWQ | ~12 | ~250 ms | 12× |
| + KV fp8 | ~14 | ~240 ms | 14× |
| TRT-LLM | ~18 | ~150 ms | 18× |

## 交付物

1. 每项优化对应的可用技术栈。
2. 包含实际测量表格的 `RESULTS.md`。
3. `RECOMMENDATIONS.md`：哪些优化值得承担相应的复杂度。

## 验证

- [ ] 每项优化均产生可测量的改善。
- [ ] 累计加速比 ≥ 5 倍。
- [ ] 每个步骤均保留质量（文本输出连贯性）。

## 常见陷阱

- **量化造成质量退化**——AWQ 通常比较安全，普通 INT4 量化则不一定。始终运行评估集。
- **TRT-LLM 需要按 GPU 类型构建**——Engine 与 GPU 类型相关。
- **TTFT 与吞吐量的取舍**——更大的批大小提高吞吐量，但可能使 TTFT 变差。针对工作负载调优。

> 译注：表格为原文示例数据，不是本次实际测量结果。量化的大小比较也取决于原始精度。
