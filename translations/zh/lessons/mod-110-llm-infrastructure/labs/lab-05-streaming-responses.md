# 实验 05：向客户端流式返回响应

**时长：** 60 分钟  **前置条件：** vLLM 正在运行（实验 01）。

## 目标

使用服务器发送事件（Server-Sent Events，SSE）将 vLLM 生成的 token 流式发送至客户端，演示相比阻塞式响应，首 token 延迟（TTFT）如何降低。

## 步骤

### 1. 通过 OpenAI SDK 进行流式输出
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

stream = client.chat.completions.create(
    model="mistralai/Mistral-7B-Instruct-v0.3",
    messages=[{"role":"user","content":"Tell me a story about a debugging session."}],
    max_tokens=400,
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)
print()
```

### 2. 使用 FastAPI 代理封装并向浏览器流式发送
```python
# proxy.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import httpx, json

app = FastAPI()

@app.post("/stream")
async def stream(req: Request):
    body = await req.json()
    async def gen():
        async with httpx.AsyncClient(timeout=None) as c:
            async with c.stream("POST", "http://localhost:8000/v1/chat/completions",
                                json={"model": body["model"],
                                      "messages": body["messages"],
                                      "stream": True}) as r:
                async for line in r.aiter_lines():
                    if line.startswith("data: "):
                        yield f"{line}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
```

### 3. 运行并使用 curl 测试
```bash
uvicorn proxy:app --port 9000 &
curl -N -X POST http://localhost:9000/stream \
  -H 'content-type: application/json' \
  -d '{"model":"mistralai/Mistral-7B-Instruct-v0.3",
       "messages":[{"role":"user","content":"Stream me 200 tokens of poetry."}]}'
```

### 4. 浏览器客户端（HTML）
```html
<!doctype html><html><body><pre id="out"></pre><script>
const resp = await fetch("/stream", { method:"POST", body: JSON.stringify({
  model: "mistralai/Mistral-7B-Instruct-v0.3",
  messages: [{role:"user", content: "Tell me a long story."}]
})});
const r = resp.body.getReader();
const dec = new TextDecoder();
while (true) {
  const { done, value } = await r.read();
  if (done) break;
  for (const line of dec.decode(value).split("\n")) {
    if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
      const j = JSON.parse(line.slice(6));
      document.getElementById("out").textContent += j.choices[0].delta.content || "";
    }
  }
}
</script></body></html>
```

### 5. 测量 TTFT
```python
import time, requests
t0 = time.perf_counter()
r = requests.post("http://localhost:9000/stream", stream=True,
                  json={"model":"mistralai/Mistral-7B-Instruct-v0.3",
                        "messages":[{"role":"user","content":"Write a haiku."}]})
for line in r.iter_lines():
    if line and line.startswith(b"data: ") and b"delta" in line:
        print(f"TTFT: {(time.perf_counter()-t0)*1000:.0f}ms")
        break
```
预期 TTFT 为 100–500ms，而完整响应约需 3–5 秒。

## 验证

- [ ] Token 逐步流式显示于终端/浏览器，而非一次性返回整个文本块。
- [ ] 模型预热后 TTFT 小于 1 秒。
- [ ] 流式输出期间取消请求会停止生成（vLLM 检测客户端断开连接）。

## 清理
```bash
pkill -f uvicorn
```

## 故障排查

- **整个响应一次性到达** — 反向代理正在缓冲。对 SSE 路径禁用缓冲（nginx：`proxy_buffering off;`）。
- **流式输出中途出现 `event: error`** — 检查 vLLM 日志；常见原因为 OOM 或限流。
- **连接在 60 秒后断开** — 默认代理空闲超时。对于长时间生成，将超时提高至数分钟。
