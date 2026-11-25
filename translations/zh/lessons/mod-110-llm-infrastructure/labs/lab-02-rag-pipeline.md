# 实验 02：端到端构建 RAG 流水线

**时长：** 90 分钟  **前置条件：** 实验 01 的 vLLM 正在运行；Qdrant（实验 03）或内存中的 FAISS。

## 目标

摄取小型文档语料库，生成嵌入向量并存入向量数据库，针对用户查询检索 top-k 结果，再通过提示词模板将其传给 LLM。测量检索精确率与端到端延迟。

## 步骤

### 1. 示例语料库

使用 Python 文档的目录，或任意一组小型 Markdown 文件。
```bash
mkdir corpus && cd corpus
curl -L https://raw.githubusercontent.com/python/cpython/main/Doc/tutorial/introduction.rst -o intro.rst
curl -L https://raw.githubusercontent.com/python/cpython/main/Doc/tutorial/controlflow.rst -o controlflow.rst
curl -L https://raw.githubusercontent.com/python/cpython/main/Doc/tutorial/datastructures.rst -o datastructures.rst
```

### 2. 文档切片
```python
# chunk.py
from pathlib import Path
def chunk(text, size=500, overlap=50):
    chunks=[]; i=0
    while i < len(text):
        chunks.append(text[i:i+size])
        i += size - overlap
    return chunks

docs = []
for p in Path("corpus").glob("*.rst"):
    for j, c in enumerate(chunk(p.read_text())):
        docs.append({"id": f"{p.stem}-{j}", "source": p.name, "text": c})
print(f"{len(docs)} chunks")
```

### 3. 生成嵌入
```python
from sentence_transformers import SentenceTransformer
emb = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
vectors = emb.encode([d["text"] for d in docs], normalize_embeddings=True)
```

### 4. 在 FAISS 中建立索引（内存中；生产环境按实验 03 使用 Qdrant）
```python
import faiss, numpy as np
index = faiss.IndexFlatIP(vectors.shape[1])    # cosine via normalized inner product
index.add(np.asarray(vectors, dtype="float32"))
```

### 5. 检索
```python
def retrieve(query, k=4):
    q = emb.encode([query], normalize_embeddings=True).astype("float32")
    D, I = index.search(q, k)
    return [(docs[i], float(D[0][j])) for j, i in enumerate(I[0])]

print(retrieve("how do for loops work in python"))
```

### 6. 组装提示词并调用 LLM
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

def answer(question):
    hits = retrieve(question, k=4)
    context = "\n\n".join(f"[{h[0]['source']}#{h[0]['id']}]\n{h[0]['text']}" for h in hits)
    prompt = f"""You are answering questions strictly using the provided context.
If the answer is not in the context, say "I don't know".

Context:
{context}

Question: {question}

Answer (cite sources by id):"""
    r = client.chat.completions.create(
        model="mistralai/Mistral-7B-Instruct-v0.3",
        messages=[{"role":"user","content":prompt}],
        max_tokens=300, temperature=0.2,
    )
    return r.choices[0].message.content

print(answer("How do I write a for loop iterating over a list?"))
```

### 7. 评估框架
```python
test_set = [
    ("How do for loops work in python", ["controlflow"]),
    ("What is a dictionary in python", ["datastructures"]),
]
for q, expected_sources in test_set:
    hits = retrieve(q, k=4)
    sources = {h[0]["source"].replace(".rst","") for h in hits}
    print(q, "->", "PASS" if any(e in sources for e in expected_sources) else "FAIL", sources)
```

## 验证

- [ ] 对已知查询，检索返回相关切片。
- [ ] 上下文充分时，回答引用来源 ID。
- [ ] 上下文不包含答案时，回答表示“不知道”（通过询问 Rust 相关问题来测试）。

## 清理
```bash
cd .. && rm -rf corpus
```

## 故障排查

- **回答产生幻觉** — 降低 temperature；强化“不知道”的指令；验证检索到的切片确实包含答案。
- **检索到错误来源** — 切片过小或过大。对于普通文本，300–800 字符是一个可尝试的范围；对于代码可以更小。
- **首次生成嵌入缓慢** — 首次运行需要下载模型；缓存位于 `~/.cache/torch/sentence_transformers/`。
