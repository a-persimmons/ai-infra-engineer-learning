# 第 03 课：RAG 系统（检索增强生成）

## 目录
1. [RAG 简介](#rag-简介)
2. [RAG 架构与组件](#rag-架构与组件)
3. [向量数据库概览](#向量数据库概览)
4. [Embedding 模型](#embedding-模型)
5. [文档处理与切分](#文档处理与切分)
6. [构建完整 RAG 系统](#构建完整-rag-系统)
7. [检索技术](#检索技术)
8. [重排序策略](#重排序策略)
9. [RAG 评估](#rag-评估)
10. [生产环境 RAG 管道](#生产环境-rag-管道)
11. [高级 RAG 模式](#高级-rag-模式)
12. [总结](#总结)

## RAG 简介

检索增强生成（Retrieval-Augmented Generation，RAG）是一种通过从外部知识库检索相关上下文来增强 LLM 的技术。RAG 针对 LLM 的基本局限之一：幻觉以及缺乏最新知识或领域专用知识。

### RAG 范式

**传统 LLM 方法：**
```
User Query → LLM → Response (based only on training data)
```

问题：
- 可能产生事实性幻觉。
- 不了解训练完成后的近期事件。
- 无法直接访问私有或领域专用数据。
- 知识主要来源于训练数据。

**RAG 方法：**
```
User Query → Retrieve Relevant Docs → LLM (with context) → Grounded Response
```

收益：
- 以实际文档作为响应依据。
- 能够使用私有或专有数据。
- 在文档及时更新的情况下获取最新信息。
- 提供可引用的信息来源，便于事实核查。
- 减少幻觉。

### 学习目标

完成本课后，你将能够：
- 理解 RAG 架构及适用时机。
- 根据使用场景选择合适的向量数据库。
- 选择并部署 Embedding 模型。
- 实现文档切分策略。
- 从零构建完整 RAG 管道。
- 优化检索质量及性能。
- 评估 RAG 系统的有效性。
- 部署面向生产环境的 RAG 系统。
- 实现高级 RAG 模式（HyDE、多跳检索等）。

### 何时使用 RAG

**RAG 适合以下场景：**
- 文档问答（法律、医疗、技术）。
- 基于知识库的客户支持。
- 代码搜索与文档。
- 研究及分析工具。
- 需要事实准确性的聊天机器人。
- 需要审计记录的应用。

**以下情况下可以考虑微调：**
- 需要改变模型行为或风格。
- 需要领域专用语言表达。
- 可以接受有限的上下文。
- 检索开销过大。

## RAG 架构与组件

### 高层架构

```
┌──────────────────────────────────────────────────────────┐
│                    RAG System Architecture                │
└──────────────────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────────────────────────────┐
│   Document  │────▶│  Indexing Pipeline                   │
│   Corpus    │     │  1. Parse documents                  │
└─────────────┘     │  2. Chunk text                       │
                    │  3. Generate embeddings              │
                    │  4. Store in vector DB               │
                    └──────────────────────────────────────┘
                                     │
                                     ▼
                    ┌──────────────────────────────────────┐
                    │      Vector Database                 │
                    │  (Qdrant, Weaviate, Pinecone, etc.) │
                    └──────────────────────────────────────┘
                                     │
┌─────────────┐                      │
│ User Query  │                      │
└──────┬──────┘                      │
       │                             │
       ▼                             │
┌─────────────────┐                  │
│  Embed Query    │                  │
└────────┬────────┘                  │
         │                           │
         ▼                           │
┌─────────────────┐                  │
│ Search Vector DB│◀─────────────────┘
│ (Similarity)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retrieved Docs  │
│ (Top-K)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Optional:       │
│ Re-rank Results │
└────────┬────────┘
         │
         ▼
┌─────────────────┐         ┌──────────────┐
│ Build Prompt    │────────▶│     LLM      │
│ (Query + Docs)  │         │   (vLLM)     │
└─────────────────┘         └──────┬───────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │  Response   │
                            └─────────────┘
```

### 核心组件

#### 1. 文档摄取管道
```python
class DocumentIngestionPipeline:
    """
    Load → Parse → Chunk → Embed → Index
    """
    def __init__(self, embedding_model, vector_db):
        self.embedding_model = embedding_model
        self.vector_db = vector_db

    def ingest(self, documents):
        """Process and index documents"""
        for doc in documents:
            # Parse
            text = self.parse(doc)

            # Chunk
            chunks = self.chunk(text)

            # Embed
            embeddings = self.embed(chunks)

            # Index
            self.vector_db.add(chunks, embeddings)
```

#### 2. 查询处理
```python
class QueryProcessor:
    """
    Query → Embed → Search → Retrieve
    """
    def process_query(self, query):
        # Embed query
        query_embedding = self.embedding_model.encode(query)

        # Search vector DB
        results = self.vector_db.search(query_embedding, top_k=5)

        return results
```

#### 3. 上下文组装
```python
class ContextAssembler:
    """
    Retrieved Docs → Format → Context String
    """
    def assemble_context(self, retrieved_docs, max_tokens=2000):
        context = []
        token_count = 0

        for doc in retrieved_docs:
            doc_tokens = count_tokens(doc.text)
            if token_count + doc_tokens > max_tokens:
                break
            context.append(doc.text)
            token_count += doc_tokens

        return "\n\n".join(context)
```

#### 4. 生成
```python
class ResponseGenerator:
    """
    Query + Context → LLM → Response
    """
    def generate(self, query, context):
        prompt = self.build_prompt(query, context)
        response = self.llm.generate(prompt)
        return response
```

## 向量数据库概览

向量数据库是针对高维向量（Embedding）的存储及搜索进行优化的数据库。

### 常用向量数据库

| 数据库 | 类型 | 适用场景 | 优势（原文评价） |
|---|---|---|---|
| **Pinecone** | 托管 | 生产、规模化 | 全托管、容易配置、快速 |
| **Weaviate** | 开源/托管 | 混合检索 | GraphQL、混合检索、灵活 |
| **Qdrant** | 开源/托管 | 性能 | 基于 Rust、快速、过滤 |
| **Chroma** | 开源 | 开发 | 轻量、可嵌入、简单 |
| **Milvus** | 开源 | 大规模 | 分布式、企业级功能 |
| **FAISS** | 库 | 研究 | Facebook AI 开发、高性能、内存索引 |

### 快速比较

```python
# Qdrant - High performance, production-ready
from qdrant_client import QdrantClient
client = QdrantClient(host="localhost", port=6333)

# Chroma - Simple, embeddable
import chromadb
client = chromadb.Client()

# Pinecone - Managed, scalable
import pinecone
pinecone.init(api_key="your-key", environment="us-west1-gcp")

# Weaviate - Hybrid search capable
import weaviate
client = weaviate.Client("http://localhost:8080")
```

### 向量数据库选型标准

**以下情况下考虑 Qdrant：**
- 需要高性能。
- 希望支持自托管。
- 需要复杂过滤。
- 面向生产部署。

**以下情况下考虑 Chroma：**
- 快速原型开发。
- 小型至中型数据集。
- 希望使用嵌入式数据库。
- 开发及测试。

**以下情况下考虑 Pinecone：**
- 希望使用全托管方案。
- 不希望自行管理基础设施。
- 需要企业级支持。
- 预算允许（原文示例每月 70 美元以上）。

**以下情况下考虑 Weaviate：**
- 需要混合检索（向量 + 关键词）。
- 希望使用 GraphQL API。
- 需要多模态检索。
- 需要复杂 Schema。

## Embedding 模型

Embedding 模型将文本转换为捕获语义信息的稠密向量表示。

### 常用 Embedding 模型

```python
# embedding_models.py

class EmbeddingModelComparison:
    """Comparison of popular embedding models"""

    models = {
        "openai_ada_002": {
            "dimensions": 1536,
            "max_tokens": 8191,
            "cost_per_1k": 0.0001,
            "performance": "excellent",
            "use_case": "General purpose, high quality"
        },
        "sentence_transformers_mini": {
            "dimensions": 384,
            "max_tokens": 256,
            "cost_per_1k": 0,  # Free, self-hosted
            "performance": "good",
            "use_case": "Fast, resource-constrained"
        },
        "sentence_transformers_mpnet": {
            "dimensions": 768,
            "max_tokens": 384,
            "cost_per_1k": 0,
            "performance": "excellent",
            "use_case": "Best open-source option"
        },
        "instructor_xl": {
            "dimensions": 768,
            "max_tokens": 512,
            "cost_per_1k": 0,
            "performance": "excellent",
            "use_case": "Task-specific instructions"
        },
        "bge_large": {
            "dimensions": 1024,
            "max_tokens": 512,
            "cost_per_1k": 0,
            "performance": "excellent",
            "use_case": "SOTA open-source"
        }
    }
```

### 使用不同的 Embedding 模型

#### OpenAI Embeddings

```python
# openai_embeddings.py
import openai
import os

class OpenAIEmbeddings:
    """OpenAI embedding model wrapper"""

    def __init__(self, model="text-embedding-ada-002"):
        self.model = model
        openai.api_key = os.getenv("OPENAI_API_KEY")

    def encode(self, texts):
        """Generate embeddings for texts"""
        if isinstance(texts, str):
            texts = [texts]

        response = openai.Embedding.create(
            model=self.model,
            input=texts
        )

        embeddings = [item["embedding"] for item in response["data"]]
        return embeddings if len(embeddings) > 1 else embeddings[0]

    def encode_batch(self, texts, batch_size=100):
        """Encode large batches efficiently"""
        embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_embeddings = self.encode(batch)
            embeddings.extend(batch_embeddings)

        return embeddings

# Usage
embedder = OpenAIEmbeddings()
embedding = embedder.encode("What is machine learning?")
print(f"Embedding dimension: {len(embedding)}")
```

#### Sentence Transformers（开源）

```python
# sentence_transformers_embeddings.py
from sentence_transformers import SentenceTransformer
import numpy as np

class SentenceTransformerEmbeddings:
    """Open-source embedding models"""

    def __init__(self, model_name="all-mpnet-base-v2"):
        """
        Popular models:
        - all-MiniLM-L6-v2: Fast, 384 dimensions
        - all-mpnet-base-v2: Balanced, 768 dimensions
        - all-MiniLM-L12-v2: Good performance, 384 dimensions
        """
        self.model = SentenceTransformer(model_name)

    def encode(self, texts, normalize=True):
        """Generate embeddings"""
        if isinstance(texts, str):
            texts = [texts]

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=normalize,
            show_progress_bar=len(texts) > 100
        )

        return embeddings if len(embeddings) > 1 else embeddings[0]

    def encode_batch(self, texts, batch_size=32):
        """Efficient batch encoding"""
        return self.model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=True
        )

# Usage
embedder = SentenceTransformerEmbeddings("all-mpnet-base-v2")

# Single text
embedding = embedder.encode("What is machine learning?")

# Batch
texts = ["Text 1", "Text 2", "Text 3"]
embeddings = embedder.encode_batch(texts)

print(f"Shape: {embeddings.shape}")  # (3, 768)
```

#### BGE Embeddings（原文所处时期的先进模型）

```python
# bge_embeddings.py
from sentence_transformers import SentenceTransformer

class BGEEmbeddings:
    """BGE (BAAI General Embedding) models - current SOTA"""

    def __init__(self, model_name="BAAI/bge-large-en-v1.5"):
        """
        Available models:
        - BAAI/bge-small-en-v1.5: 384 dimensions, fast
        - BAAI/bge-base-en-v1.5: 768 dimensions, balanced
        - BAAI/bge-large-en-v1.5: 1024 dimensions, best quality
        """
        self.model = SentenceTransformer(model_name)

        # BGE instruction for queries (important!)
        self.query_instruction = "Represent this sentence for searching relevant passages:"

    def encode_queries(self, queries):
        """Encode queries (with instruction prefix)"""
        if isinstance(queries, str):
            queries = [queries]

        # Add instruction to queries
        instructed_queries = [
            f"{self.query_instruction} {q}" for q in queries
        ]

        embeddings = self.model.encode(
            instructed_queries,
            normalize_embeddings=True
        )

        return embeddings

    def encode_documents(self, documents):
        """Encode documents (no instruction needed)"""
        if isinstance(documents, str):
            documents = [documents]

        embeddings = self.model.encode(
            documents,
            normalize_embeddings=True
        )

        return embeddings

# Usage
embedder = BGEEmbeddings()

# Encode query
query_embedding = embedder.encode_queries("What is Python?")

# Encode documents
doc_embeddings = embedder.encode_documents([
    "Python is a programming language.",
    "Java is also a programming language."
])
```

## 文档处理与切分

有效的文档切分（Chunking）对于 RAG 系统性能十分重要。

### 切分为何重要

**问题：** 文档通常过长，难以：
- 完整放入 LLM 上下文窗口。
- 精确检索相关信息。
- 生成具有充分语义表达能力的 Embedding。

**解决方案：** 将文档拆分为满足以下条件的片段：
- 保留连贯的概念。
- 适合上下文窗口。
- 具有良好的向量表示。

### 切分策略

```python
# chunking_strategies.py
from typing import List
import re

class DocumentChunker:
    """Various document chunking strategies"""

    @staticmethod
    def fixed_size_chunks(text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
        """
        Simple fixed-size chunking with overlap

        Pros: Simple, predictable size
        Cons: May split sentences/paragraphs awkwardly
        """
        words = text.split()
        chunks = []

        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)

        return chunks

    @staticmethod
    def sentence_chunks(text: str, sentences_per_chunk: int = 5) -> List[str]:
        """
        Chunk by sentences

        Pros: Preserves sentence boundaries
        Cons: Variable chunk sizes
        """
        # Simple sentence splitting (use spacy/nltk for better results)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

        chunks = []
        for i in range(0, len(sentences), sentences_per_chunk):
            chunk = ". ".join(sentences[i:i + sentences_per_chunk]) + "."
            chunks.append(chunk)

        return chunks

    @staticmethod
    def paragraph_chunks(text: str, max_chunk_size: int = 1000) -> List[str]:
        """
        Chunk by paragraphs, combining small ones

        Pros: Preserves logical structure
        Cons: Variable sizes, may need combining
        """
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) < max_chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    @staticmethod
    def semantic_chunks(text: str, model, similarity_threshold: float = 0.7) -> List[str]:
        """
        Semantic chunking based on embedding similarity

        Pros: Semantically coherent chunks
        Cons: More computationally expensive
        """
        from sentence_transformers import SentenceTransformer

        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

        # Embed sentences
        embeddings = model.encode(sentences)

        # Group by similarity
        chunks = []
        current_chunk = [sentences[0]]

        for i in range(1, len(sentences)):
            # Cosine similarity between consecutive sentences
            similarity = cosine_similarity(
                embeddings[i-1].reshape(1, -1),
                embeddings[i].reshape(1, -1)
            )[0][0]

            if similarity > similarity_threshold:
                current_chunk.append(sentences[i])
            else:
                chunks.append(". ".join(current_chunk) + ".")
                current_chunk = [sentences[i]]

        if current_chunk:
            chunks.append(". ".join(current_chunk) + ".")

        return chunks

# Example usage
text = """
Machine learning is a subset of artificial intelligence. It focuses on
building systems that learn from data. Deep learning is a subset of machine
learning that uses neural networks.

Python is widely used for machine learning. Libraries like TensorFlow and
PyTorch make it easy to build models. These frameworks provide high-level
APIs for common tasks.
"""

chunker = DocumentChunker()

print("Fixed Size Chunks:")
print(chunker.fixed_size_chunks(text, chunk_size=20, overlap=5))

print("\nSentence Chunks:")
print(chunker.sentence_chunks(text, sentences_per_chunk=2))

print("\nParagraph Chunks:")
print(chunker.paragraph_chunks(text))
```

### 使用 LangChain 实现高级切分

```python
# langchain_chunking.py
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    TokenTextSplitter,
    MarkdownTextSplitter
)

class AdvancedChunker:
    """Advanced chunking using LangChain"""

    @staticmethod
    def recursive_character_split(text: str, chunk_size: int = 512, chunk_overlap: int = 50):
        """
        Intelligent recursive splitting

        Tries to split on: \n\n, then \n, then spaces
        """
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

        chunks = splitter.split_text(text)
        return chunks

    @staticmethod
    def token_based_split(text: str, chunk_size: int = 512, chunk_overlap: int = 50):
        """
        Split by tokens (more accurate for LLM context)
        """
        splitter = TokenTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        chunks = splitter.split_text(text)
        return chunks

    @staticmethod
    def markdown_split(markdown_text: str):
        """
        Split markdown preserving structure
        """
        splitter = MarkdownTextSplitter(
            chunk_size=512,
            chunk_overlap=50
        )

        chunks = splitter.split_text(markdown_text)
        return chunks

# Usage
chunker = AdvancedChunker()

text = "Your long document here..."

chunks = chunker.recursive_character_split(
    text,
    chunk_size=512,
    chunk_overlap=50
)

print(f"Created {len(chunks)} chunks")
for i, chunk in enumerate(chunks[:3]):
    print(f"\nChunk {i+1}:")
    print(chunk[:200] + "...")
```

### 切分最佳实践

```python
class ChunkingBestPractices:
    """
    Guidelines for effective chunking
    """

    recommendations = {
        "chunk_size": {
            "small_models": "256-512 tokens",
            "large_models": "512-1024 tokens",
            "rationale": "Balance between context and precision"
        },
        "overlap": {
            "recommended": "10-20% of chunk size",
            "rationale": "Prevents loss of context at boundaries"
        },
        "method": {
            "structured_docs": "Paragraph or section-based",
            "unstructured_docs": "Sentence or semantic-based",
            "code": "Function or class-based",
            "rationale": "Match structure to content type"
        },
        "metadata": {
            "include": [
                "source document",
                "chunk index",
                "section/heading",
                "timestamp"
            ],
            "rationale": "Enables filtering and attribution"
        }
    }
```

## 构建完整 RAG 系统

从零构建一个面向生产的 RAG 系统。

### 完整 RAG 实现

```python
# rag_system.py
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from vllm import LLM, SamplingParams
from typing import List, Dict
import uuid
from dataclasses import dataclass

@dataclass
class Document:
    """Document structure"""
    id: str
    text: str
    metadata: Dict

class RAGSystem:
    """Complete RAG system implementation"""

    def __init__(
        self,
        embedding_model_name: str = "BAAI/bge-large-en-v1.5",
        llm_model_name: str = "meta-llama/Llama-2-7b-chat-hf",
        vector_db_url: str = "http://localhost:6333",
        collection_name: str = "documents"
    ):
        # Initialize components
        print("Initializing RAG system...")

        # Embedding model
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()

        # Vector database
        self.vector_client = QdrantClient(url=vector_db_url)
        self.collection_name = collection_name
        self._init_collection()

        # LLM
        self.llm = LLM(model=llm_model_name)

        print("RAG system initialized!")

    def _init_collection(self):
        """Initialize vector database collection"""
        # Create collection if it doesn't exist
        collections = self.vector_client.get_collections().collections
        collection_names = [c.name for c in collections]

        if self.collection_name not in collection_names:
            self.vector_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE
                )
            )
            print(f"Created collection: {self.collection_name}")

    def chunk_document(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
        """Chunk document into smaller pieces"""
        words = text.split()
        chunks = []

        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)

        return chunks

    def ingest_document(self, document_text: str, metadata: Dict = None):
        """Ingest a document into the RAG system"""
        # Chunk document
        chunks = self.chunk_document(document_text)
        print(f"Created {len(chunks)} chunks")

        # Generate embeddings
        embeddings = self.embedding_model.encode(chunks, show_progress_bar=True)

        # Create points for vector DB
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            point = PointStruct(
                id=point_id,
                vector=embedding.tolist(),
                payload={
                    "text": chunk,
                    "chunk_index": i,
                    "metadata": metadata or {}
                }
            )
            points.append(point)

        # Upload to vector DB
        self.vector_client.upsert(
            collection_name=self.collection_name,
            points=points
        )

        print(f"Ingested {len(chunks)} chunks into vector database")

    def ingest_documents(self, documents: List[Dict]):
        """Ingest multiple documents"""
        for doc in documents:
            self.ingest_document(
                document_text=doc["text"],
                metadata=doc.get("metadata", {})
            )

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve relevant documents for a query"""
        # Embed query
        query_embedding = self.embedding_model.encode(query)

        # Search vector DB
        results = self.vector_client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding.tolist(),
            limit=top_k
        )

        # Format results
        documents = []
        for result in results:
            documents.append({
                "text": result.payload["text"],
                "score": result.score,
                "metadata": result.payload.get("metadata", {})
            })

        return documents

    def build_prompt(self, query: str, context_docs: List[Dict]) -> str:
        """Build prompt with retrieved context"""
        # Format context
        context = "\n\n".join([
            f"[Document {i+1}]\n{doc['text']}"
            for i, doc in enumerate(context_docs)
        ])

        # Build prompt (Llama 2 format)
        prompt = f"""<s>[INST] <<SYS>>
You are a helpful assistant. Answer the question based on the provided context.
If the context doesn't contain enough information to answer the question, say so.
Always cite which document you're referencing.
<</SYS>>

Context:
{context}

Question: {query}
[/INST]"""

        return prompt

    def generate_response(
        self,
        query: str,
        top_k: int = 5,
        temperature: float = 0.3,
        max_tokens: int = 512
    ) -> Dict:
        """
        Complete RAG pipeline: retrieve + generate
        """
        # Retrieve relevant documents
        retrieved_docs = self.retrieve(query, top_k=top_k)

        if not retrieved_docs:
            return {
                "query": query,
                "response": "I couldn't find any relevant information to answer your question.",
                "sources": []
            }

        # Build prompt with context
        prompt = self.build_prompt(query, retrieved_docs)

        # Generate response
        sampling_params = SamplingParams(
            temperature=temperature,
            max_tokens=max_tokens,
            stop=["</s>"]
        )

        outputs = self.llm.generate([prompt], sampling_params)
        response = outputs[0].outputs[0].text.strip()

        # Return response with sources
        return {
            "query": query,
            "response": response,
            "sources": retrieved_docs,
            "num_sources": len(retrieved_docs)
        }

    def query(self, question: str) -> str:
        """Simple query interface"""
        result = self.generate_response(question)
        return result["response"]

# Example usage
if __name__ == "__main__":
    # Initialize RAG system
    rag = RAGSystem()

    # Example documents
    documents = [
        {
            "text": """
            Machine learning is a subset of artificial intelligence that focuses on
            building systems that learn from data. The main types of machine learning
            are supervised learning, unsupervised learning, and reinforcement learning.
            Supervised learning uses labeled data to train models, unsupervised learning
            finds patterns in unlabeled data, and reinforcement learning learns through
            interaction with an environment.
            """,
            "metadata": {"source": "ml_intro.txt", "topic": "machine_learning"}
        },
        {
            "text": """
            Deep learning is a subset of machine learning that uses neural networks
            with multiple layers. Deep learning has achieved remarkable results in
            computer vision, natural language processing, and speech recognition.
            Popular deep learning frameworks include TensorFlow, PyTorch, and JAX.
            """,
            "metadata": {"source": "deep_learning.txt", "topic": "deep_learning"}
        },
        {
            "text": """
            Natural language processing (NLP) is a field that focuses on enabling
            computers to understand and generate human language. Key NLP tasks include
            text classification, named entity recognition, machine translation, and
            question answering. Transformers have revolutionized NLP since their
            introduction in 2017.
            """,
            "metadata": {"source": "nlp_overview.txt", "topic": "nlp"}
        }
    ]

    # Ingest documents
    rag.ingest_documents(documents)

    # Query the system
    questions = [
        "What is machine learning?",
        "What are deep learning frameworks?",
        "What is NLP used for?"
    ]

    for question in questions:
        print(f"\nQuestion: {question}")
        result = rag.generate_response(question)
        print(f"Response: {result['response']}")
        print(f"Sources: {result['num_sources']} documents")
```

### 运行 RAG 系统

```python
# run_rag.py

# 1. Start Qdrant (Docker)
"""
docker run -p 6333:6333 qdrant/qdrant
"""

# 2. Initialize and use RAG system
from rag_system import RAGSystem

rag = RAGSystem(
    embedding_model_name="BAAI/bge-base-en-v1.5",
    llm_model_name="meta-llama/Llama-2-7b-chat-hf",
    vector_db_url="http://localhost:6333"
)

# Ingest your documents
rag.ingest_document(
    document_text=open("your_document.txt").read(),
    metadata={"source": "your_document.txt"}
)

# Query
response = rag.query("What is the main topic of the document?")
print(response)
```

## 检索技术

### 基础相似度搜索

```python
def basic_similarity_search(query_embedding, top_k=5):
    """Simple cosine similarity search"""
    results = vector_client.search(
        collection_name="documents",
        query_vector=query_embedding,
        limit=top_k
    )
    return results
```

### 带过滤条件的搜索

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

def filtered_search(query_embedding, filters, top_k=5):
    """Search with metadata filters"""

    # Example: Only search documents from specific source
    search_filter = Filter(
        must=[
            FieldCondition(
                key="metadata.source",
                match=MatchValue(value="specific_source.pdf")
            )
        ]
    )

    results = vector_client.search(
        collection_name="documents",
        query_vector=query_embedding,
        query_filter=search_filter,
        limit=top_k
    )

    return results
```

### 混合检索（向量 + 关键词）

```python
class HybridSearch:
    """Combine vector and keyword search"""

    def __init__(self, vector_client, embedding_model):
        self.vector_client = vector_client
        self.embedding_model = embedding_model

    def search(self, query, top_k=10, alpha=0.7):
        """
        Hybrid search: alpha * vector_score + (1-alpha) * keyword_score
        """
        # Vector search
        query_embedding = self.embedding_model.encode(query)
        vector_results = self.vector_client.search(
            collection_name="documents",
            query_vector=query_embedding,
            limit=top_k
        )

        # Keyword search (BM25 or simple matching)
        keyword_results = self.keyword_search(query, top_k)

        # Combine scores
        combined = self._combine_results(
            vector_results,
            keyword_results,
            alpha
        )

        return combined

    def keyword_search(self, query, top_k):
        """Simple keyword search implementation"""
        # Implementation depends on your text search index
        pass

    def _combine_results(self, vector_results, keyword_results, alpha):
        """Combine and re-rank results"""
        # Normalize and combine scores
        pass
```

## 重排序策略

重排序（Re-ranking）通过重新排列初始检索结果，提高检索质量。

```python
# reranking.py
from sentence_transformers import CrossEncoder

class Reranker:
    """Re-rank retrieved documents"""

    def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Cross-encoder models for re-ranking:
        - cross-encoder/ms-marco-MiniLM-L-6-v2: Fast, good quality
        - cross-encoder/ms-marco-MiniLM-L-12-v2: Better quality
        """
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, documents: List[str], top_k: int = 5):
        """Re-rank documents for query"""

        # Create query-document pairs
        pairs = [[query, doc] for doc in documents]

        # Score pairs
        scores = self.model.predict(pairs)

        # Sort by score
        ranked_indices = scores.argsort()[::-1][:top_k]

        # Return ranked documents
        ranked_docs = [(documents[i], scores[i]) for i in ranked_indices]

        return ranked_docs

# Usage with RAG
class RAGWithReranking(RAGSystem):
    """RAG system with re-ranking"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.reranker = Reranker()

    def retrieve(self, query: str, top_k: int = 5, rerank_top_k: int = 20):
        """Retrieve with re-ranking"""

        # Initial retrieval (get more candidates)
        initial_docs = super().retrieve(query, top_k=rerank_top_k)

        # Extract texts
        texts = [doc["text"] for doc in initial_docs]

        # Re-rank
        reranked = self.reranker.rerank(query, texts, top_k=top_k)

        # Format results
        results = []
        for text, score in reranked:
            # Find original document for metadata
            orig_doc = next(d for d in initial_docs if d["text"] == text)
            results.append({
                "text": text,
                "score": float(score),
                "metadata": orig_doc["metadata"]
            })

        return results
```

## RAG 评估

评估 RAG 系统对于生产部署至关重要。

```python
# rag_evaluation.py
from typing import List, Dict
import numpy as np

class RAGEvaluator:
    """Evaluate RAG system performance"""

    def __init__(self, rag_system):
        self.rag = rag_system

    def evaluate_retrieval(
        self,
        test_queries: List[Dict]  # {"query": str, "relevant_docs": List[str]}
    ):
        """
        Evaluate retrieval quality

        Metrics:
        - Precision@K
        - Recall@K
        - MRR (Mean Reciprocal Rank)
        - NDCG (Normalized Discounted Cumulative Gain)
        """
        precisions = []
        recalls = []
        mrrs = []

        for item in test_queries:
            query = item["query"]
            relevant_docs = set(item["relevant_docs"])

            # Retrieve
            retrieved = self.rag.retrieve(query, top_k=10)
            retrieved_ids = [doc["metadata"].get("id") for doc in retrieved]

            # Calculate metrics
            relevant_retrieved = set(retrieved_ids) & relevant_docs

            # Precision@K
            precision = len(relevant_retrieved) / len(retrieved_ids) if retrieved_ids else 0
            precisions.append(precision)

            # Recall@K
            recall = len(relevant_retrieved) / len(relevant_docs) if relevant_docs else 0
            recalls.append(recall)

            # MRR
            for i, doc_id in enumerate(retrieved_ids):
                if doc_id in relevant_docs:
                    mrrs.append(1 / (i + 1))
                    break
            else:
                mrrs.append(0)

        return {
            "precision@10": np.mean(precisions),
            "recall@10": np.mean(recalls),
            "mrr": np.mean(mrrs)
        }

    def evaluate_generation(
        self,
        test_queries: List[Dict]  # {"query": str, "expected_answer": str}
    ):
        """
        Evaluate generation quality

        Note: This requires human evaluation or LLM-as-judge
        """
        results = []

        for item in test_queries:
            query = item["query"]
            expected = item["expected_answer"]

            # Generate
            response = self.rag.generate_response(query)
            generated = response["response"]

            # Store for evaluation
            results.append({
                "query": query,
                "expected": expected,
                "generated": generated
            })

        return results

    def evaluate_faithfulness(
        self,
        test_queries: List[str]
    ):
        """
        Check if responses are grounded in retrieved documents

        Requires LLM-as-judge or NLI model
        """
        pass

# Usage
evaluator = RAGEvaluator(rag_system)

test_set = [
    {
        "query": "What is machine learning?",
        "relevant_docs": ["doc_1", "doc_5"],
        "expected_answer": "Machine learning is..."
    }
]

retrieval_metrics = evaluator.evaluate_retrieval(test_set)
print(f"Retrieval Metrics: {retrieval_metrics}")
```

## 生产环境 RAG 管道

### 生产架构

```python
# production_rag.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio

app = FastAPI(title="Production RAG API")

# Request/Response models
class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    temperature: float = 0.3
    max_tokens: int = 512

class QueryResponse(BaseModel):
    query: str
    response: str
    sources: List[Dict]
    processing_time_ms: float

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[Dict] = None

# Initialize RAG system
rag = RAGSystem()

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Query endpoint"""
    import time

    start_time = time.time()

    try:
        result = rag.generate_response(
            query=request.query,
            top_k=request.top_k,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        processing_time = (time.time() - start_time) * 1000

        return QueryResponse(
            query=result["query"],
            response=result["response"],
            sources=result["sources"],
            processing_time_ms=processing_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest(request: IngestRequest):
    """Ingest document endpoint"""
    try:
        rag.ingest_document(
            document_text=request.text,
            metadata=request.metadata
        )
        return {"status": "success", "message": "Document ingested"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 部署配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  rag-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - VECTOR_DB_URL=http://qdrant:6333
      - LLM_MODEL=meta-llama/Llama-2-7b-chat-hf
    depends_on:
      - qdrant
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  qdrant_data:
```

## 高级 RAG 模式

### HyDE（Hypothetical Document Embeddings，假设文档嵌入）

```python
class HyDERAG(RAGSystem):
    """RAG with Hypothetical Document Embeddings"""

    def retrieve_with_hyde(self, query: str, top_k: int = 5):
        """
        Generate hypothetical answer, embed it, use for retrieval
        """
        # Generate hypothetical answer
        hyde_prompt = f"Generate a detailed answer to: {query}"
        sampling_params = SamplingParams(temperature=0.7, max_tokens=256)
        outputs = self.llm.generate([hyde_prompt], sampling_params)
        hypothetical_answer = outputs[0].outputs[0].text

        # Embed hypothetical answer
        hyde_embedding = self.embedding_model.encode(hypothetical_answer)

        # Search with hypothetical embedding
        results = self.vector_client.search(
            collection_name=self.collection_name,
            query_vector=hyde_embedding.tolist(),
            limit=top_k
        )

        return results
```

### 多跳检索（Multi-Hop Retrieval）

```python
class MultiHopRAG(RAGSystem):
    """Multi-hop retrieval for complex questions"""

    def multi_hop_retrieve(self, query: str, max_hops: int = 3):
        """
        Iteratively retrieve and refine
        """
        all_docs = []
        current_query = query

        for hop in range(max_hops):
            # Retrieve for current query
            docs = self.retrieve(current_query, top_k=3)
            all_docs.extend(docs)

            # Generate follow-up query
            follow_up = self.generate_follow_up_query(query, docs)
            if not follow_up:
                break

            current_query = follow_up

        # Deduplicate and return
        return self.deduplicate_docs(all_docs)

    def generate_follow_up_query(self, original_query, retrieved_docs):
        """Generate follow-up query based on retrieved docs"""
        # Use LLM to generate follow-up
        pass
```

## 总结

本课全面介绍了 RAG 系统。

### 核心要点

1. **RAG 利用外部知识增强 LLM**，有助于减少幻觉。
2. **核心组件：** Embedding、向量数据库、切分、检索、生成。
3. **向量数据库**提供高效语义搜索。
4. **切分策略**显著影响 RAG 质量。
5. **重排序**有助于提高检索精度。
6. **评估**对于生产系统至关重要。
7. **高级模式**（HyDE、多跳检索）用于处理复杂场景。

### 下一步

下一课深入向量数据库，比较不同方案并实现生产部署。

---

**下一课：** [04-vector-databases.md](./04-vector-databases.md)

> 译注：RAG 与微调可以组合使用，并非互斥。RAG 不能保证事实准确，仍需评估检索召回、上下文相关性、回答忠实度和引用准确性。生产环境还需在检索阶段实施文档级访问控制、租户隔离、更新与删除机制，并将检索文档视为不可信数据，防止间接提示注入。模型排名、数据库价格及接口均为原文所处时期的示例，未核验当前状态。原始代码块及其中英文注释保留，未实际运行。
