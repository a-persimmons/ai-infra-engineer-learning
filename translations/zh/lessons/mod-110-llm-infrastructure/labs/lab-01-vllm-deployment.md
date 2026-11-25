# 实验 01：使用 vLLM 部署 LLM

**时长：** 75 分钟  **前置条件：** 显存 ≥12GB 的 GPU；Docker 与 NVIDIA Container Toolkit。

## 目标

通过 vLLM 的 OpenAI 兼容服务器运行一个约 70 亿参数的 LLM（Mistral-7B 或 Llama-3-8B-Instruct），对比 Hugging Face 基线的吞吐量，并利用 PagedAttention 的 KV Cache 容纳更多并发请求。

## 步骤

### 1. 拉取并启动 vLLM
```bash
docker run -d --gpus all --name vllm \
  -p 8000:8000 \
  -v $HOME/.cache/huggingface:/root/.cache/huggingface \
  -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  vllm/vllm-openai:v0.5.0 \
  --model mistralai/Mistral-7B-Instruct-v0.3 \
  --max-model-len 4096 \
  --dtype bfloat16
```
下载和加载约需 5–10 分钟。

### 2. 验证
```bash
curl http://localhost:8000/v1/models
```

### 3. 单次补全请求（兼容 OpenAI）
```bash
curl http://localhost:8000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [{"role": "user", "content": "Explain async I/O in 3 sentences."}],
    "max_tokens": 200
  }' | jq .
```

### 4. 吞吐量基准测试
```bash
pip install openai
python - <<'PY'
import asyncio, time
from openai import AsyncOpenAI
client = AsyncOpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

async def one():
    await client.chat.completions.create(
        model="mistralai/Mistral-7B-Instruct-v0.3",
        messages=[{"role":"user","content":"Write a haiku about Kubernetes."}],
        max_tokens=64,
    )

async def bench(n=64, concurrency=16):
    sem = asyncio.Semaphore(concurrency)
    async def go():
        async with sem: await one()
    t0 = time.perf_counter()
    await asyncio.gather(*(go() for _ in range(n)))
    print(f"{n} reqs / {time.perf_counter()-t0:.1f}s = {n/(time.perf_counter()-t0):.1f} req/s")

asyncio.run(bench())
PY
```

### 5. 与 Hugging Face Transformers 基线比较
```python
from transformers import pipeline
import time
pipe = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.3", device=0)
t0=time.perf_counter()
for _ in range(8): pipe("Write a haiku about Kubernetes.", max_new_tokens=64)
print(f"hf: {8/(time.perf_counter()-t0):.1f} req/s")
```
原文预期在相同并发量下，vLLM 的每秒请求数（RPS）高 5–10 倍。

### 6. 使用 vLLM 指标监控

vLLM 暴露 `/metrics`（Prometheus）。抓取该端点；关键指标：`vllm:num_requests_running`、`vllm:gpu_cache_usage_perc`。

## 验证

- [ ] `/v1/models` 列出正在提供服务的模型。
- [ ] 单次补全请求返回合理文本。
- [ ] 在单块 24GB GPU 上，并发量为 16 时，基准测试显示 ≥10 req/s。
- [ ] `gpu_cache_usage_perc` 在负载下增加。

## 清理
```bash
docker stop vllm && docker rm vllm
```

## 故障排查

- **加载时 OOM** — 降低 `--max-model-len`，或使用量化版本（`--quantization awq`）。
- **`Cannot find HF token`** — 若所选模型要求 Hugging Face 身份验证，设置 `HF_TOKEN`，并通过 `-e` 传入。
- **第一次请求非常慢** — CUDA Graph 正在编译；后续请求会更快。

> 译注：实际所需显存和吞吐量取决于模型精度、上下文长度、硬件及并发配置；未量化的 7B/8B 模型通常需要超过 12GB 显存。
