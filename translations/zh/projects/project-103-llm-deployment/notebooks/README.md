# 用于 LLM 实验的 Jupyter Notebook

本目录包含用于实验和评估 LLM 部署平台各组件的 Jupyter Notebook。

## 📓 可用 Notebook

### 1. `01-llm-generation-testing.ipynb`
测试 LLM 文本生成能力：
- 基础文本补全
- 参数调优（temperature、top_p、top_k）
- token 生成优化
- 流式与批处理推理对比
- 性能基准测试

### 2. `02-rag-experimentation.ipynb`
开展 RAG（检索增强生成）实验：
- 文档摄取与切片
- 生成嵌入向量
- 向量相似度搜索
- 检索质量评估
- RAG 与基线对比

### 3. `03-embedding-evaluation.ipynb`
评估并比较嵌入模型：
- 语义相似度测试
- 嵌入可视化（t-SNE、UMAP）
- 聚类分析
- 嵌入模型比较
- 性能与质量的取舍

### 4. `04-prompt-engineering.ipynb`
提示词工程实验：
- 提示词模板测试
- Few-shot 学习示例
- 思维链提示
- 系统消息优化
- 输出格式化技术

## 🚀 快速开始

### 前置条件
```bash
# Install Jupyter and dependencies
pip install jupyter ipykernel ipywidgets

# Install notebook requirements
pip install -r ../requirements.txt

# Register kernel
python -m ipykernel install --user --name=llm-deployment
```

### 运行 Notebook
```bash
# Start Jupyter Lab
jupyter lab

# Or Jupyter Notebook
jupyter notebook
```

### 环境配置
确保 `.env` 文件已配置：
- `OPENAI_API_KEY` 或模型端点
- `VECTOR_DB_URL`（Pinecone、Weaviate 或 Milvus）
- `EMBEDDING_MODEL` 路径或名称
- `LLM_MODEL` 路径或名称

## 📊 示例工作流

### 测试基础生成
```python
from notebooks.utils import test_llm_generation

result = test_llm_generation(
    prompt="Explain machine learning in simple terms",
    temperature=0.7,
    max_tokens=200
)
print(result['text'])
print(f"Latency: {result['latency_ms']}ms")
```

### 测试 RAG 流水线
```python
from notebooks.utils import test_rag_pipeline

result = test_rag_pipeline(
    query="What is the capital of France?",
    top_k=3
)
print(f"Answer: {result['answer']}")
print(f"Sources: {result['sources']}")
```

## 🔧 实用工具

`utils.py` 文件提供以下辅助函数：
- 加载并测试模型
- 性能基准测试
- 结果可视化
- 比较输出

## 📈 需要追踪的指标

实验时追踪以下指标：
- **延迟**：首 token 延迟、总生成时间。
- **质量**：BLEU、ROUGE、人工评估分数。
- **成本**：token 用量、API 成本、GPU 利用率。
- **相关性**：对于 RAG，追踪检索精确率与回答准确性。

## 💡 建议

1. **从小规模开始**：扩展之前先使用小型数据集测试。
2. **缓存结果**：保存昂贵 API 调用的结果及嵌入向量。
3. **管理实验版本**：使用 MLflow 追踪实验。
4. **系统化比较**：测试时保持其他变量不变。
5. **记录发现**：添加包含实验洞察的 Markdown 单元格。

## 📚 参考资料

- [LLM 微调指南](../docs/OPTIMIZATION.md)
- [RAG 最佳实践](../docs/RAG.md)
- [成本优化](../docs/COST.md)
- [提示词工程指南](../prompts/README.md)

---

**注意：** 这些 Notebook 用于实验和开发。生产使用时，应将实验成果落实到主要代码库中。
