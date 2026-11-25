# 提示词模板——项目 103

本目录包含 LLM 部署项目中可复用的提示词模板。模板存储在 `templates.yaml` 中，由 `../src/` 下的模型服务代码使用。

## 为什么使用独立的提示词目录

提示词是基础设施，而非内联字符串。将提示词作为有版本管理的产物，可以获得：

- **可复现性**——模型与提示词的组合才是真正决定行为的单元。仅固定模型只解决了一半问题。
- **可审计性**——输出发生回归时，需要知道是模型变了、提示词变了，还是两者都变了。
- **迭代速度**——非工程人员（产品经理、应用科学家）能够通过 PR 编辑 YAML，而不需要修改 Python。
- **多租户隔离**——不同租户获得不同系统提示词，无需为每个租户设置独立代码路径。

## 文件布局

```text
prompts/
├── README.md           ← this file
└── templates.yaml      ← all prompt templates, keyed by id
```

## 模板格式

`templates.yaml` 采用以下结构：

```yaml
templates:
  - id: chat-system-default
    description: Default system prompt for chat completions.
    version: 1.2.0
    audience: end-user
    model_compat: [llama-3.1-8b-instruct, llama-3.1-70b-instruct, mistral-7b-instruct]
    body: |
      You are a helpful, accurate assistant. If you don't know something,
      say so plainly. Decline requests that are harmful or illegal. Prefer
      concise answers; expand only when the user explicitly asks for depth.

  - id: rag-answer
    description: Answer a user question using only the provided context.
    version: 1.0.0
    audience: end-user
    model_compat: [llama-3.1-8b-instruct, llama-3.1-70b-instruct]
    variables:
      - name: question
        required: true
      - name: context_chunks
        required: true
        type: list[str]
    body: |
      You are answering a user's question using ONLY the context provided.
      If the answer is not in the context, say "I don't have enough
      information to answer that."

      Context:
      {context_chunks_joined}

      Question: {question}

      Answer:
```

## 命名规范

- `id`：使用 kebab-case，以使用场景为前缀（`chat-`、`rag-`、`summarize-`、`extract-`、`classify-`）。
- `version`：语义化版本。发生不向后兼容的语义变更时，提高主版本号。
- `model_compat`：已使用该提示词评估的模型 ID 列表。不要将模板发布到未经测试的模型上。
- `variables`：显式变量列表。模板引擎（`../src/prompt_loader.py` 中的实现）验证所有必需变量均已传入。

## 添加新模板

1. 编辑 `templates.yaml`。
2. 提高版本号（如果是全新模板，则分配新 ID）。
3. 在 `../tests/test_prompts.py` 中添加评估运行，至少覆盖一个模型上的该模板。
4. 根据评估结果更新 `model_compat`。
5. 创建 PR——CI 评估套件将在小型金丝雀测试集上运行。

## 应避免的反模式

- **Python 中的内联提示词字符串**：使提示词变更在代码审查中难以察觉，也无法进行 A/B 测试。
- **在提示词中嵌入业务逻辑**：「始终用包含以下七个键的 JSON 回复」在一次性脚本中可能有效，但规模化时容易失败。改用结构化输出（Function Calling / JSON Mode）。
- **无约束地拼接用户输入**：如果用户消息可以直接拼入系统提示词位置，就存在提示词注入漏洞。始终对用户输入进行封装并明确标记。
- **新模板版本跳过评估**：提示词变更就是模型行为变更，应以同等严谨程度对待。

## 另请参阅

- `../docs/OPTIMIZATION.md`——提示词性能与延迟方面的考虑因素。
- `../docs/RAG.md`——检索模式以及用于生成有依据回答的提示词构造。
- `../src/prompt_loader.py`——模型服务代码使用的模板加载器及验证器。

> 译注：封装和标记用户输入本身并不是可靠的安全边界。
