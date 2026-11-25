# 练习 03：深入 vLLM

**时长：** 3 小时
**难度：** 中级以上
**前置条件：** 实验 01（vLLM 基础）

## 目标

掌握 vLLM 的生产级功能：张量并行、前缀缓存、结构化输出（引导式解码）、推测解码、LoRA 热切换和请求优先级。分别进行基准测试。

## 为什么重要

vLLM 的默认配置已经十分优秀，进一步调优可以再获得 2–3 倍吞吐量。了解配置参数的工程师能够更充分地利用每一美元 GPU 开支。

## 要求

针对每种功能，展示可用配置及优化前后的基准测试结果。

## 分步操作

### 步骤 1——跨两块 GPU 的张量并行（30 分钟）
```bash
docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest \
  --model meta-llama/Llama-3-8B-Instruct \
  --tensor-parallel-size 2
```
与单 GPU 的吞吐量比较。

### 步骤 2——前缀缓存（30 分钟）
```bash
--enable-prefix-caching
```
对具有共享提示词前缀的工作负载（系统提示词、RAG 上下文），测量延迟改善情况。首 token 延迟（TTFT）通常可降低 30–60%。

### 步骤 3——引导式解码（45 分钟）
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

# JSON-constrained output
r = client.chat.completions.create(
    model="...",
    messages=[{"role":"user","content":"Extract person from: Alice is 30 years old."}],
    extra_body={"guided_json": {"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer"}}}},
)
```
与自由形式生成加 JSON 解析的方案比较正确性和延迟。

### 步骤 4——推测解码（45 分钟）
```bash
--speculative-model meta-llama/Llama-3.2-1B-Instruct --num-speculative-tokens 5
```
小型草稿模型提出 token，大模型进行验证。文本生成速度通常可提升 1.5–2 倍。

### 步骤 5——LoRA 热切换（30 分钟）
```bash
--enable-lora --lora-modules sql-lora=/path/to/sql-adapter chat-lora=/path/to/chat-adapter
```
```python
r = client.chat.completions.create(model="sql-lora", messages=[...])
r = client.chat.completions.create(model="chat-lora", messages=[...])
```
在一个基础模型上提供多个 LoRA Adapter 的服务，无需为每个 Adapter 重复占用基础模型显存。

### 步骤 6——请求优先级（15 分钟）
```python
extra_body={"priority": 1}    # higher = served first
```
付费高级用户与交互式界面请求优先于后台批处理。

### 步骤 7——基准测试矩阵（30 分钟）
针对每种功能记录：
- 吞吐量（并发 32 时的 tokens/s）
- TTFT（首 token 延迟 p50/p95）
- 每百万 token 成本
- 显存使用量

## 交付物

1. 每种功能的可用配置。
2. 包含比较矩阵的 `BENCHMARKS.md`。
3. `RECOMMENDATIONS.md`：针对不同工作负载应选用哪些功能。

## 验证

- [ ] 每种功能均产生可测量的改善。
- [ ] 张量并行在两块 GPU 上实现近似线性扩展。
- [ ] 前缀缓存降低共享前缀的 TTFT。
- [ ] 引导式 JSON 输出始终有效。

## 常见陷阱

- **缺少高带宽互连的张量并行**——仅使用 PCIe 连接的两块 A100 会产生约 30% 的张量并行开销。良好的张量并行性能需要 NVLink。
- **推测解码的草稿模型质量不佳**——接受率低于 50% 时没有加速收益。
- **每次请求都加载 LoRA**——热切换很快，但初始加载慢；预加载常用 Adapter。

> 译注：加速比及互连要求为原文示例，实际结果依赖模型、硬件与工作负载。
