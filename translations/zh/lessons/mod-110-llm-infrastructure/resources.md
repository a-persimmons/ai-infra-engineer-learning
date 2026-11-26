# 模块 10：LLM 基础设施 — 学习资源

## 官方文档

### vLLM
- **主要文档:** https://docs.vllm.ai/
- **GitHub 仓库:** https://github.com/vllm-project/vllm
- **性能基准测试:** https://blog.vllm.ai/
- **模型支持:** https://docs.vllm.ai/en/latest/models/supported_models.html
- **API 参考:** https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html
- **性能调优:** https://docs.vllm.ai/en/latest/serving/performance.html

### LLM 框架与程序库

**LangChain**
- **文档:** https://python.langchain.com/docs/
- **RAG 教程:** https://python.langchain.com/docs/use_cases/question_answering/
- **GitHub:** https://github.com/langchain-ai/langchain
- **社区:** https://discord.gg/langchain

**LlamaIndex (GPT Index)**
- **文档:** https://docs.llamaindex.ai/
- **RAG 指南:** https://docs.llamaindex.ai/en/stable/understanding/
- **GitHub:** https://github.com/run-llama/llama_index
- **示例:** https://docs.llamaindex.ai/en/stable/examples/

**Hugging Face**
- **Transformers:** https://huggingface.co/docs/transformers/
- **PEFT (LoRA):** https://huggingface.co/docs/peft/
- **TRL（微调）:** https://huggingface.co/docs/trl/
- **Text Generation Inference:** https://huggingface.co/docs/text-generation-inference/
- **模型中心:** https://huggingface.co/models

### 向量数据库

**Qdrant**
- **文档:** https://qdrant.tech/documentation/
- **快速入门:** https://qdrant.tech/documentation/quick-start/
- **API 参考:** https://qdrant.tech/documentation/interfaces/
- **性能调优:** https://qdrant.tech/documentation/guides/optimization/
- **GitHub:** https://github.com/qdrant/qdrant

**Weaviate**
- **文档:** https://weaviate.io/developers/weaviate
- **快速入门:** https://weaviate.io/developers/weaviate/quickstart
- **Python 客户端:** https://weaviate.io/developers/weaviate/client-libraries/python
- **GitHub:** https://github.com/weaviate/weaviate

**Pinecone**
- **文档:** https://docs.pinecone.io/
- **指南:** https://docs.pinecone.io/guides/
- **Python SDK:** https://docs.pinecone.io/reference/python-sdk

**Chroma**
- **文档:** https://docs.trychroma.com/
- **快速开始:** https://docs.trychroma.com/getting-started
- **GitHub:** https://github.com/chroma-core/chroma

**Milvus**
- **文档:** https://milvus.io/docs
- **Python SDK:** https://milvus.io/docs/install-pymilvus.md
- **GitHub:** https://github.com/milvus-io/milvus

### 嵌入模型

**Sentence Transformers**
- **文档:** https://www.sbert.net/
- **预训练模型:** https://www.sbert.net/docs/pretrained_models.html
- **GitHub:** https://github.com/UKPLab/sentence-transformers

**OpenAI Embeddings**
- **文档:** https://platform.openai.com/docs/guides/embeddings
- **最佳实践:** https://platform.openai.com/docs/guides/embeddings/best-practices

**Instructor Embeddings**
- **GitHub:** https://github.com/xlang-ai/instructor-embedding
- **论文:** https://arxiv.org/abs/2212.09741

### 模型优化

**bitsandbytes（量化）**
- **GitHub:** https://github.com/TimDettmers/bitsandbytes
- **8 位优化:** https://huggingface.co/blog/hf-bitsandbytes-integration

**GPTQ**
- **GitHub:** https://github.com/IST-DASLab/gptq
- **AutoGPTQ:** https://github.com/PanQiWei/AutoGPTQ
- **论文:** https://arxiv.org/abs/2210.17323

**AWQ（激活感知权重量化）**
- **GitHub:** https://github.com/mit-han-lab/llm-awq
- **论文:** https://arxiv.org/abs/2306.00978

**GGUF/llama.cpp**
- **llama.cpp:** https://github.com/ggerganov/llama.cpp
- **GGUF 格式:** https://github.com/ggerganov/ggml/blob/master/docs/gguf.md

---

## 书籍

### 大语言模型与自然语言处理

1. **《Build a Large Language Model (From Scratch)》（从零构建大语言模型），作者：Sebastian Raschka**
   - 出版社: Manning (2024)
   - 重点: 理解 LLM 内部机制并从零构建
   - 难度: 中级至高级
   - 链接: https://www.manning.com/books/build-a-large-language-model-from-scratch

2. **《Natural Language Processing with Transformers》（基于 Transformer 的自然语言处理），作者：Lewis Tunstall、Leandro von Werra、Thomas Wolf**
   - 出版社: O'Reilly (2022)
   - 重点: Hugging Face 生态及 Transformer 模型
   - 难度: 中级
   - 链接: https://www.oreilly.com/library/view/natural-language-processing/9781098136789/

3. **《Generative AI with LangChain》（使用 LangChain 开发生成式 AI），作者：Ben Auffarth**
   - 出版社: Packt (2024)
   - 重点: 使用 LangChain 构建 LLM 应用
   - 难度: 初级至中级
   - 链接: https://www.packtpub.com/product/generative-ai-with-langchain/

### AI 基础设施与 MLOps

4. **《Designing Machine Learning Systems》（设计机器学习系统），作者：Chip Huyen**
   - 出版社: O'Reilly (2022)
   - 重点: 机器学习系统设计与生产部署
   - 难度: 中级至高级
   - 链接: https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/
   - 重点章节: 模型部署、服务基础设施

5. **《Machine Learning Engineering》（机器学习工程），作者：Andriy Burkov**
   - 出版社: True Positive Inc (2020)
   - 重点: 端到端机器学习工程
   - 难度: 中级
   - 免费: http://www.mlebook.com/

### GPU 计算与性能

6. **《Programming Massively Parallel Processors》（大规模并行处理器编程），作者：David Kirk、Wen-mei Hwu**
   - 出版社: Morgan Kaufmann（第 4 版，2022 年）
   - 重点: CUDA 编程与 GPU 架构
   - 难度: 高级
   - 链接: https://www.elsevier.com/books/programming-massively-parallel-processors/kirk/978-0-323-91231-0

---

## 在线课程

### 免费课程

1. **《大语言模型导论》（Google Cloud）**
   - 平台: Google Cloud Skills Boost
   - 链接: https://www.cloudskillsboost.google/paths/118
   - 时长: 3–4 小时
   - 难度: 初级
   - 主题: LLM 基础、提示词工程、部署

2. **《使用 LangChain 开发 LLM 应用》（DeepLearning.AI）**
   - 平台: DeepLearning.AI
   - 链接: https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/
   - 时长: 1–2 小时
   - 难度: 初级
   - 主题: LangChain 基础、RAG、Agent

3. **《向量数据库：从嵌入到应用》（DeepLearning.AI）**
   - 平台: DeepLearning.AI
   - 链接: https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/
   - 时长: 1–2 小时
   - 难度: 初级
   - 主题: 嵌入、向量搜索、Weaviate

4. **《使用向量数据库构建应用》（Pinecone）**
   - 平台: Pinecone Learn
   - 链接: https://www.pinecone.io/learn/
   - 时长: 自主安排进度
   - 难度: 初级至中级
   - 主题: 向量搜索、RAG、语义搜索

5. **《Hugging Face 课程》（Hugging Face）**
   - 平台: Hugging Face
   - 链接: https://huggingface.co/learn/nlp-course/
   - 时长: 自主安排进度（20 多小时）
   - 难度: 初级至高级
   - 主题: Transformer、微调、部署

### 付费课程

6. **《LLM 工程：生产级 RAG 应用》（Udemy）**
   - 平台: Udemy
   - 时长: 8–10 小时
   - 难度: 中级
   - 主题: RAG 系统、向量数据库、生产部署

7. **《用于扩展 LLM 和生成式 AI 的 MLOps》（Coursera）**
   - 平台: Coursera (Duke University)
   - 时长: 4 周
   - 难度: 中级
   - 主题: LLM 部署、扩展、监控

8. **《面向开发者的生成式 AI》（A Cloud Guru）**
   - 平台: A Cloud Guru
   - 时长: 6–8 小时
   - 难度: 中级
   - 主题: LLM 应用、在 AWS/GCP/Azure 上部署

---

## 交互式学习与在线沙盒

### 动手实践平台

1. **Hugging Face Spaces**
   - 链接: https://huggingface.co/spaces
   - 说明: LLM 及其应用的交互式演示
   - 用途: 部署前探索模型

2. **Replicate**
   - 链接: https://replicate.com/
   - 说明: 通过 API 运行开源模型
   - 用途: 无需基础设施即可测试模型

3. **Modal Labs 在线沙盒**
   - 链接: https://modal.com/
   - 说明: 无服务器 GPU 计算
   - 用途: 无需管理基础设施即可部署 LLM

4. **Google Colab**
   - 链接: https://colab.research.google.com/
   - 说明: 带 GPU 的免费 Jupyter Notebook
   - 用途: 进行模型实验（免费层仅限较小模型）

5. **Kaggle Notebooks**
   - 链接: https://www.kaggle.com/code
   - 说明: 免费 GPU Notebook（每周 30 小时）
   - 用途: 训练和微调模型

### LLM 排行榜与基准测试

6. **开放 LLM 排行榜（Hugging Face）**
   - 链接: https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard
   - 用途: 比较模型性能

7. **LMSys Chatbot Arena**
   - 链接: https://chat.lmsys.org/
   - 用途: 交互式比较 LLM，查看 Elo 评分

8. **Artificial Analysis**
   - 链接: https://artificialanalysis.ai/
   - 用途: 比较 LLM API 价格、性能和质量

---

## 工具与程序库

### 用于 LLM 开发的 Python 程序库

```bash
# Core LLM frameworks
pip install transformers         # Hugging Face Transformers
pip install vllm                  # vLLM serving
pip install torch                 # PyTorch

# RAG and LLM applications
pip install langchain            # LangChain framework
pip install llama-index          # LlamaIndex (GPT Index)
pip install haystack-ai          # Haystack NLP

# Vector databases
pip install qdrant-client        # Qdrant
pip install weaviate-client      # Weaviate
pip install chromadb             # Chroma
pip install pinecone-client      # Pinecone
pip install pymilvus             # Milvus

# Embeddings
pip install sentence-transformers  # Sentence embeddings
pip install openai               # OpenAI API (embeddings, ChatGPT)
pip install cohere               # Cohere embeddings

# Fine-tuning
pip install peft                 # Parameter-efficient fine-tuning (LoRA)
pip install bitsandbytes         # 8-bit quantization
pip install trl                  # Transformer Reinforcement Learning
pip install datasets             # Hugging Face datasets

# Optimization
pip install auto-gptq            # GPTQ quantization
pip install autoawq              # AWQ quantization
pip install optimum              # Optimum (ONNX, quantization)

# Monitoring & Observability
pip install opentelemetry-api    # OpenTelemetry
pip install prometheus-client    # Prometheus metrics
pip install langsmith            # LangSmith (LangChain monitoring)

# Evaluation
pip install ragas                # RAG evaluation
pip install deepeval             # LLM evaluation
pip install rouge-score          # ROUGE metrics
pip install bert-score           # BERTScore
```

### 服务框架

- **vLLM:** https://github.com/vllm-project/vllm (生产级服务、PagedAttention)
- **Text Generation Inference (TGI):** https://github.com/huggingface/text-generation-inference (Hugging Face)
- **Ray Serve:** https://docs.ray.io/en/latest/serve/ (分布式服务)
- **TensorRT-LLM:** https://github.com/NVIDIA/TensorRT-LLM (NVIDIA 优化)
- **OpenLLM:** https://github.com/bentoml/OpenLLM (BentoML)
- **Triton Inference Server:** https://github.com/triton-inference-server/server (NVIDIA)

### 微调框架

- **Axolotl:** https://github.com/OpenAccess-AI-Collective/axolotl (统一微调)
- **FastChat:** https://github.com/lm-sys/FastChat (训练与服务)
- **LLaMA Factory:** https://github.com/hiyouga/LLaMA-Factory (便捷微调)
- **Alpaca LoRA:** https://github.com/tloen/alpaca-lora (LoRA 微调)

### 评估工具

- **RAGAS:** https://github.com/explodinggradients/ragas (RAG 评估)
- **DeepEval:** https://github.com/confident-ai/deepeval (LLM 评估)
- **LangSmith:** https://docs.smith.langchain.com/ (LangChain 监控)
- **Phoenix:** https://github.com/Arize-ai/phoenix (LLM 可观测性)
- **PromptTools:** https://github.com/hegelai/prompttools (提示词测试)

### GPU 管理

- **NVIDIA DCGM:** https://github.com/NVIDIA/dcgm-exporter (GPU 监控)
- **nvitop:** https://github.com/XuehaiPan/nvitop (GPU 进程监控)
- **gpustat:** https://github.com/wookayin/gpustat (GPU 状态)

---

## GitHub 仓库与示例

### 示例项目

1. **vLLM 示例**
   - 链接: https://github.com/vllm-project/vllm/tree/main/examples
   - 说明: vLLM 官方示例

2. **LangChain 模板**
   - 链接: https://github.com/langchain-ai/langchain/tree/master/templates
   - 说明: 生产就绪的 LangChain 模板

3. **RAG 技术**
   - 链接: https://github.com/NirDiamant/RAG_Techniques
   - 说明: 全面的 RAG 实现模式

4. **Awesome LLM**
   - 链接: https://github.com/Hannibal046/Awesome-LLM
   - 说明: 精选 LLM 资源列表

5. **Awesome LLMOps**
   - 链接: https://github.com/tensorchord/Awesome-LLMOps
   - 说明: LLM 运维与基础设施工具

6. **Private GPT**
   - 链接: https://github.com/imartinez/privateGPT
   - 说明: 针对私有文档的 RAG 系统

7. **LocalGPT**
   - 链接: https://github.com/PromtEngineer/localGPT
   - 说明: 使用 LLM 实现本地文档问答

### 生产就绪示例

8. **FastChat**
   - 链接: https://github.com/lm-sys/FastChat
   - 说明: 完整的 LLM 服务平台（为 Chatbot Arena 提供支持）

9. **BentoML LLM 示例**
   - 链接: https://github.com/bentoml/BentoML/tree/main/examples
   - 说明: 生产级 LLM 部署

10. **Hugging Face 推理示例**
    - 链接: https://github.com/huggingface/text-generation-inference/tree/main/examples
    - 说明: TGI 部署示例

### 微调示例

11. **Stanford Alpaca**
    - 链接: https://github.com/tatsu-lab/stanford_alpaca
    - 说明: 指令微调数据集与方法

12. **QLoRA 示例**
    - 链接: https://github.com/artidoro/qlora
    - 说明: 使用 QLoRA 高效微调

13. **LLaMA Recipes**
    - 链接: https://github.com/facebookresearch/llama-recipes
    - 说明: Llama 微调与部署实践方案

---

## 视频内容

### YouTube 频道

1. **AI Makerspace**
   - 链接: https://www.youtube.com/@AIMakerspace
   - 主题: RAG 系统、LLM 应用、实时构建演示
   - 难度: 中级

2. **Sam Witteveen（RAG 与 LangChain）**
   - 链接: https://www.youtube.com/@samwitteveenai
   - 主题: LangChain、RAG、向量数据库
   - 难度: 初级至中级

3. **1littlecoder（Llama.cpp 与本地 LLM）**
   - 链接: https://www.youtube.com/@1littlecoder
   - 主题: 本地运行 LLM、优化
   - 难度: 初级至中级

4. **Weights & Biases**
   - 链接: https://www.youtube.com/@WeightsBiases
   - 主题: LLM 训练、微调、MLOps
   - 难度: 中级至高级

5. **Andrej Karpathy**
   - 链接: https://www.youtube.com/@AndrejKarpathy
   - 主题: 神经网络、从零构建 LLM
   - 难度: 中级至高级

### 必看视频

6. **《大语言模型导论》— Andrej Karpathy**
   - 链接: https://www.youtube.com/watch?v=zjkBMFhNj_g
   - 时长: 1 小时
   - 难度: 初级
   - 主题: LLM 概览、规模定律、安全

7. **《GPT 现状》— Andrej Karpathy**
   - 链接: https://www.youtube.com/watch?v=bZQun8Y4L2A
   - 时长: 45 分钟
   - 难度: 中级
   - 主题: GPT 训练、微调、部署

8. **《面向黑客的语言模型指南》— Jeremy Howard**
   - 链接: https://www.youtube.com/watch?v=jkrNMKz9pWU
   - 时长: 1.5 小时
   - 难度: 中级
   - 主题: LLM 内部机制、微调、代码生成

9. **《构建生产就绪的 RAG 应用》— Jerry Liu**
   - 链接: 在 YouTube 上搜索
   - 主题: 高级 RAG 技术、LlamaIndex

10. **《vLLM：简单、快速、低成本的 LLM 服务》**
    - 链接: https://www.youtube.com/results?search_query=vllm+serving
    - 主题: vLLM 架构、部署

---

## 博客与文章

### 技术博客

1. **Hugging Face 博客**
   - 链接: https://huggingface.co/blog
   - 主题: 模型发布、优化技术、教程
   - 频率: 每周

2. **vLLM 博客**
   - 链接: https://blog.vllm.ai/
   - 主题: 性能基准测试、新功能
   - 频率: 每月

3. **LangChain 博客**
   - 链接: https://blog.langchain.dev/
   - 主题: RAG 技术、LangChain 更新、案例研究
   - 频率: 每周

4. **Simon Willison 的博客**
   - 链接: https://simonwillison.net/
   - 主题: LLM 工具、提示词编写、应用
   - 频率: 每日

5. **Jay Alammar 的博客**
   - 链接: https://jalammar.github.io/
   - 主题: Transformer 与 LLM 的可视化讲解
   - 强烈推荐: 《图解 Transformer》

### 企业工程博客

6. **OpenAI 研究**
   - 链接: https://openai.com/research/
   - 主题: GPT 更新、研究论文

7. **Anthropic 研究**
   - 链接: https://www.anthropic.com/research
   - 主题: Claude 更新、安全研究

8. **Google AI 博客**
   - 链接: https://ai.googleblog.com/
   - 主题: PaLM、Gemini、基础设施

9. **Meta AI 博客**
   - 链接: https://ai.meta.com/blog/
   - 主题: Llama 发布、研究

10. **NVIDIA 开发者博客**
    - 链接: https://developer.nvidia.com/blog/
    - 主题: GPU 优化、TensorRT、Triton

### 重点文章

11. **《图解 Transformer》— Jay Alammar**
    - 链接: https://jalammar.github.io/illustrated-transformer/
    - 主题: Transformer 架构可视化指南

12. **《使用 LLM 构建应用一年后的经验总结》— Chip Huyen 等**
    - 链接: https://www.oreilly.com/radar/what-we-learned-from-a-year-of-building-with-llms/
    - 主题: 生产级 LLM 最佳实践

13. **《构建基于 LLM 的系统与产品的模式》— Eugene Yan**
    - 链接: https://eugeneyan.com/writing/llm-patterns/
    - 主题: LLM 系统设计模式

14. **《最大化 LLM 性能的技术综述》— OpenAI**
    - 链接: https://platform.openai.com/docs/guides/prompt-engineering
    - 主题: 提示词工程、RAG、微调

15. **《构建基于 RAG 的生产级 LLM 应用》— Anyscale**
    - 链接: https://www.anyscale.com/blog/a-comprehensive-guide-for-building-rag-based-llm-applications-part-1
    - 主题: 生产级 RAG 系统

---

## 研究论文

### 必读论文

1. **《Attention Is All You Need》（Transformer 架构）**
   - 链接: https://arxiv.org/abs/1706.03762
   - 年份: 2017
   - 影响: 现代 LLM 的基础

2. **《使用 PagedAttention 实现大语言模型服务的高效内存管理》（vLLM）**
   - 链接: https://arxiv.org/abs/2309.06180
   - 年份: 2023
   - 影响: 实现高效 LLM 服务

3. **《LoRA：大语言模型的低秩适配》**
   - 链接: https://arxiv.org/abs/2106.09685
   - 年份: 2021
   - 影响: 参数高效微调

4. **《QLoRA：量化 LLM 的高效微调》**
   - 链接: https://arxiv.org/abs/2305.14314
   - 年份: 2023
   - 影响: 在消费级 GPU 上微调大模型

5. **《面向知识密集型 NLP 任务的检索增强生成》**
   - 链接: https://arxiv.org/abs/2005.11401
   - 年份: 2020
   - 影响: RAG 系统的基础

6. **《LLM.int8()：大规模 Transformer 的 8 位矩阵乘法》**
   - 链接: https://arxiv.org/abs/2208.07339
   - 年份: 2022
   - 影响: 高效量化

7. **《Flash Attention：快速且内存高效的精确注意力》**
   - 链接: https://arxiv.org/abs/2205.14135
   - 年份: 2022
   - 影响: 更快的注意力计算

8. **《GPTQ：生成式预训练 Transformer 的精确训练后量化》**
   - 链接: https://arxiv.org/abs/2210.17323
   - 年份: 2022
   - 影响: LLM 的 4 位量化

### 论文仓库

9. **Papers with Code (LLMs)**
   - 链接: https://paperswithcode.com/methods/area/natural-language-processing
   - 说明: 附带实现代码的论文

10. **Hugging Face 论文**
    - 链接: https://huggingface.co/papers
    - 说明: 每日精选 ML 论文

---

## 播客

1. **Practical AI**
   - 链接: https://changelog.com/practicalai
   - 主题: 应用 AI、LLM、基础设施
   - 频率: 每周

2. **The TWIML AI Podcast**
   - 链接: https://twimlai.com/
   - 主题: ML 研究、生产系统
   - 频率: 每周

3. **Latent Space**
   - 链接: https://www.latent.space/podcast
   - 主题: LLM、AI 工程、基础设施
   - 频率: 每周

4. **The Gradient Podcast**
   - 链接: https://thegradientpub.substack.com/
   - 主题: AI 研究与访谈
   - 频率: 每两周

---

## 社区与论坛

### Discord 社区

1. **Hugging Face Discord**
   - 链接: https://hf.co/join/discord
   - 主题: 模型、Transformer、部署
   - 活跃度: 非常活跃

2. **LangChain Discord**
   - 链接: https://discord.gg/langchain
   - 主题: RAG、LangChain 开发
   - 活跃度: 非常活跃

3. **vLLM Discord**
   - 链接: https://discord.gg/vllm
   - 主题: vLLM 部署、优化
   - 活跃度: 活跃

4. **Qdrant Discord**
   - 链接: https://qdrant.to/discord
   - 主题: 向量搜索、RAG
   - 活跃度: 活跃

5. **LocalLLaMA Discord/Reddit**
   - Reddit: https://www.reddit.com/r/LocalLLaMA/
   - 主题: 本地运行 LLM、优化
   - 活跃度: 非常活跃

### 论坛与讨论

6. **Hugging Face 论坛**
   - 链接: https://discuss.huggingface.co/
   - 主题: 模型问题、部署帮助

7. **r/MachineLearning (Reddit)**
   - 链接: https://www.reddit.com/r/MachineLearning/
   - 主题: ML 研究、论文、讨论

8. **r/LLMDevs (Reddit)**
   - 链接: https://www.reddit.com/r/LLMDevs/
   - 主题: LLM 开发与应用

9. **AI Stack Exchange**
   - 链接: https://ai.stackexchange.com/
   - 主题: AI 问答

### 专业社群

10. **MLOPS Community**
    - 链接: https://mlops.community/
    - Slack: https://mlops-community.slack.com/
    - 主题: MLOps、生产级 ML

11. **LLM Ops Community**
    - 链接: https://llmops.space/
    - 主题: LLM 运维、基础设施

---

## 新闻简报

1. **The Batch (DeepLearning.AI)**
   - 链接: https://www.deeplearning.ai/the-batch/
   - 频率: 每周
   - 主题: AI 新闻、研究、教程

2. **AI Weekly**
   - 链接: https://aiweekly.co/
   - 频率: 每周三次
   - 主题: AI 专家在模型、Agent、研究、融资与政策方面阅读和分享的内容

3. **Import AI**
   - 链接: https://importai.substack.com/
   - 频率: 每周
   - 主题: AI 研究、论文、政策

4. **TLDR AI**
   - 链接: https://tldr.tech/ai
   - 频率: 每日
   - 主题: AI 新闻、快速更新

5. **The Gradient**
   - 链接: https://thegradient.pub/
   - 频率: 每两周
   - 主题: AI 长篇文章

6. **LangChain 简报**
   - 链接: https://blog.langchain.dev/
   - 频率: 每周
   - 主题: LangChain 更新、RAG 技术

7. **Superhuman AI**
   - 链接: https://www.superhuman.ai/
   - 频率: 每周
   - 主题: AI 工具、生产力、LLM

---

## 云平台与 GPU 服务商

### 主要云服务商

1. **AWS**
   - 配备 GPU 的 EC2（G5、P4、P5 实例）
   - 使用 SageMaker 进行托管部署
   - 使用 Bedrock 托管 LLM
   - 链接: https://aws.amazon.com/machine-learning/

2. **Google Cloud Platform**
   - 配备 GPU 的 Compute Engine（A100、H100）
   - 使用 Vertex AI 实现托管 ML
   - 链接: https://cloud.google.com/vertex-ai

3. **Microsoft Azure**
   - 使用带 GPU 实例的 Azure ML
   - Azure OpenAI Service
   - 链接: https://azure.microsoft.com/en-us/products/machine-learning/

### GPU 云服务商（成本效益更高）

4. **Lambda Labs**
   - 链接: https://lambdalabs.com/service/gpu-cloud
   - 价格: 比 AWS 便宜约 50%
   - GPUs: A100, H100

5. **RunPod**
   - 链接: https://www.runpod.io/
   - 功能: 竞价实例、无服务器 GPU
   - GPUs: 多种型号（RTX 4090、A100、H100）

6. **Vast.ai**
   - 链接: https://vast.ai/
   - 功能: 点对点 GPU 市场
   - 价格: 很有竞争力

7. **Paperspace**
   - 链接: https://www.paperspace.com/
   - 功能: Gradient Notebook、托管部署
   - GPUs: V100, A100

8. **CoreWeave**
   - 链接: https://www.coreweave.com/
   - 功能: Kubernetes 原生、规模扩展
   - GPUs: A40, A100, H100

9. **Together.ai**
   - 链接: https://www.together.ai/
   - 功能: 无服务器推理、微调
   - 重点: 开源模型

### 无服务器 LLM 平台

10. **Modal**
    - 链接: https://modal.com/
    - 功能: 无服务器 GPU 计算、自动扩缩容

11. **Banana.dev**
    - 链接: https://www.banana.dev/
    - 功能: 无服务器 ML 推理

12. **Replicate**
    - 链接: https://replicate.com/
    - 功能: 通过 API 运行模型，按使用量付费

---

## 认证

### 相关认证

1. **AWS 机器学习专项认证**
   - 认证机构: Amazon Web Services
   - 链接: https://aws.amazon.com/certification/certified-machine-learning-specialty/
   - 主题: 包含部署与运维

2. **Google 专业机器学习工程师认证**
   - 认证机构: Google Cloud
   - 链接: https://cloud.google.com/learn/certification/machine-learning-engineer
   - 主题: GCP 上的 ML 基础设施

3. **Microsoft 认证：Azure AI 工程师助理级**
   - 认证机构: Microsoft
   - 链接: https://learn.microsoft.com/en-us/certifications/azure-ai-engineer/
   - 主题: Azure 上的 AI 服务

4. **认证 Kubernetes 管理员（CKA）**
   - 认证机构: CNCF/Linux Foundation
   - 链接: https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/
   - 相关性: 对 Kubernetes 上的 LLM 部署至关重要

5. **NVIDIA 深度学习学院认证**
   - 认证机构: NVIDIA
   - 链接: https://www.nvidia.com/en-us/training/
   - 主题: GPU 编程、LLM 部署

---

## 跟进最新进展

### 如何持续学习

1. **在 Twitter/X 上关注核心研究者：**
   - Andrej Karpathy (@karpathy)
   - Harrison Chase (@hwchase17) - LangChain
   - Simon Willison (@simonw)
   - Jeremy Howard (@jeremyphoward)
   - Chip Huyen (@chipro)

2. **订阅发布说明：**
   - vLLM 版本发布: https://github.com/vllm-project/vllm/releases
   - Hugging Face Transformers: https://github.com/huggingface/transformers/releases
   - LangChain 版本发布: https://github.com/langchain-ai/langchain/releases

3. **参加会议（线上或线下）：**
   - NeurIPS（神经信息处理系统大会）
   - ICML（国际机器学习大会）
   - ACL（计算语言学协会）
   - MLOps World
   - AI Engineer Summit

4. **参加网络研讨会：**
   - Hugging Face 活动: https://huggingface.co/events
   - NVIDIA GTC: https://www.nvidia.com/gtc/
   - AWS re:Invent 的 ML 专场

5. **参与开源贡献：**
   - vLLM、LangChain、向量数据库
   - 记录学习心得
   - 在社区帮助他人

---

## 实践项目

### 初级项目

1. **使用 vLLM 部署第一个 LLM**
   - 使用 Llama 2 7B
   - 在单 GPU 上部署
   - 创建兼容 OpenAI 的 API

2. **构建简单的 RAG 系统**
   - 为小型文档集建立索引（例如你的笔记）
   - 使用 Chroma 或 Qdrant
   - 使用 LangChain 查询

3. **使用 llama.cpp 在本地运行 LLM**
   - 下载 GGUF 模型
   - 在 CPU 或消费级 GPU 上运行
   - 创建简单聊天界面

### 中级项目

4. **生产级 RAG 系统**
   - 支持多文档
   - 高级分块与检索
   - 重排序与评估
   - 在 Kubernetes 上部署

5. **微调 LLM**
   - 使用 LoRA 或 QLoRA
   - 使用领域特定数据微调 Llama 2 7B
   - 评估质量提升
   - 部署微调后的模型

6. **LLM 监控仪表盘**
   - 使用 Prometheus 采集指标
   - 创建 Grafana 仪表盘
   - 添加分布式链路追踪
   - 实现告警

### 高级项目

7. **多模型 LLM 平台**
   - 部署多个模型（7B、13B、70B）
   - 实现智能路由
   - 添加语义缓存
   - 成本与性能优化

8. **领域专用 AI 助手**
   - 结合 RAG 与微调
   - 使用 Agent 进行多步推理
   - 带监控的生产部署
   - 成本优化的基础设施

9. **Kubernetes 上的 LLM 基础设施**
   - 多 GPU 部署
   - 基于队列深度自动扩缩容
   - 蓝绿部署
   - 完整可观测性技术栈

---

## 成本优化资源

### 价格对比

1. **Artificial Analysis — LLM API 定价**
   - 链接: https://artificialanalysis.ai/models
   - 比较: OpenAI、Anthropic、开源模型托管成本

2. **GPU 价格对比**
   - 创建电子表格，比较 AWS、GCP、Azure、Lambda、RunPod、Vast.ai
   - 考虑因素: 每小时成本、承诺用量折扣、竞价定价

### 成本计算器

3. **AWS 价格计算器**
   - 链接: https://calculator.aws/
   - 用途: EC2 GPU 实例、SageMaker

4. **GCP 价格计算器**
   - 链接: https://cloud.google.com/products/calculator
   - 用途: 带 GPU 的 Compute Engine

---

## 每周学习路线

### 第 1 周：基础
- **阅读课程:** 第 01–02 课
- **视频:** Andrej Karpathy 的《LLM 导论》
- **动手实践:** 练习 01 — 使用 vLLM 部署 Llama 2
- **阅读资料:** vLLM 文档

### 第 2 周：RAG 与向量数据库
- **阅读课程:** 第 03–04 课
- **课程:** DeepLearning.AI 的《向量数据库》课程
- **动手实践:** 练习 02–03
- **阅读资料:** LangChain RAG 教程

### 第 3 周：微调
- **阅读课程:** 第 05 课
- **视频:** QLoRA 论文讲解
- **动手实践:** 练习 04 — 使用 LoRA 微调
- **阅读资料:** Hugging Face PEFT 文档

### 第 4 周：优化
- **阅读课程:** 第 06 课
- **文章:** Flash Attention、量化技术
- **动手实践:** 练习 05 — 优化推理
- **基准测试:** 比较量化与全精度

### 第 5 周：平台与生产环境
- **阅读课程:** 第 07–08 课
- **案例研究:** 生产级 LLM 架构
- **动手实践:** 练习 06–08
- **复习:** 测验与场景题

---

## 额外资源

### 微调数据集

1. **Hugging Face Datasets**
   - 链接: https://huggingface.co/datasets
   - 热门: Alpaca, Dolly, OpenOrca

2. **指令微调数据集**
   - Alpaca: https://github.com/tatsu-lab/stanford_alpaca
   - Dolly: https://huggingface.co/datasets/databricks/databricks-dolly-15k
   - FLAN: https://github.com/google-research/FLAN

### 模型注册中心

3. **Hugging Face 模型中心**
   - 链接: https://huggingface.co/models
   - 筛选: 任务、规模、许可证

4. **Ollama 模型库**
   - 链接: https://ollama.ai/library
   - 重点: 用于本地部署的模型

---

## 持续学习与构建！

LLM 基础设施领域发展迅速。跟进最新进展的最佳方式：

1. **构建项目** - 应用所学知识
2. **分享成果** - 博客文章、GitHub 仓库
3. **参与社区** - Discord、论坛、会议
4. **阅读论文** - 掌握研究前沿
5. **参与贡献** - 开源项目、文档

**现在你已拥有一份全面的 LLM 基础设施资源清单。学习愉快！**
