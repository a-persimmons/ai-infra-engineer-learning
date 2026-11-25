# 练习 02：生产级 RAG 系统（检索增强生成）

**预计时长：** 34–42 小时。

## 业务背景

公司拥有十年的专有文档（产品手册、内部 Wiki、客户支持工单），希望构建基于该知识库回答问题的 AI 助手。

**当前情况：**
- 使用 GPT-4 API 构建客户支持聊天机器人。
- **问题：** GPT-4 不了解公司特有产品及流程。
- **结果：** 60% 的回答过于泛化或不正确。
- 客户满意度：3.2/5 星。
- 支持人员需要人工介入 70% 的对话。

**解决方案：** 构建**检索增强生成（RAG）系统**：
1. 将公司全部文档向量化并存储至向量数据库。
2. 针对用户问题检索相关上下文。
3. 利用公司知识生成准确回答。
4. 将幻觉率从 40% 降至 5% 以下。

**业务目标：**
- **提高准确率：** 正确回答比例从 60% 提高至 90%。
- **降低支持成本：** 每年节省 50 万美元（减少人工介入）。
- **提高客户满意度：** 从 3.2/5 提高至 4.5/5 星。
- **数据隐私：** 全部数据保留在公司内部。
- **可扩展性：** 每天处理 10,000 次查询。

## 学习目标

完成本练习后，你将能够：
1. 设计并实现生产级 RAG 架构。
2. 部署及配置向量数据库（Qdrant）。
3. 实现文档切分策略，优化检索效果。
4. 使用 Sentence Transformers 构建 Embedding 管道。
5. 通过重排序及混合检索优化检索质量。
6. 实现 RAG 评估指标。
7. 处理 RAG 挑战：上下文长度、相关性、引用。
8. 构建支持缓存与监控的生产级 RAG API。

## 前置条件

- Module 110 练习 01（LLM 服务）——vLLM 部署。
- 理解向量 Embedding 与相似度搜索。
- Python 编程（高级）。
- Kubernetes 基础。
- NLP 基本概念。

## 问题描述

构建**生产级 RAG 系统**：

1. **文档摄取管道：**
   - 从多个来源加载文档（PDF、HTML、Markdown）。
   - 智能切分文档。
   - 生成 Embedding。
   - 存储至向量数据库。

2. **检索引擎：**
   - 使用 Embedding 进行语义搜索。
   - 混合检索（稠密 + 稀疏）。
   - 按相关性重排序。
   - 返回最相关的 Top-K 片段。

3. **生成层：**
   - LLM 集成（Llama 2、Mistral）。
   - 感知上下文的提示词。
   - 提取引用。
   - 幻觉检测。

4. **生产功能：**
   - 针对常见问题的查询缓存。
   - 实时文档更新。
   - 多用户隔离。
   - 全面监控。

5. **评估框架：**
   - 检索质量指标。
   - 回答准确率评估。
   - A/B 测试基础设施。

### 成功指标

- 检索准确率：90%（正确文档位于 Top-5）。
- 回答准确率：90%（正确且有依据的回答）。
- 查询端到端延迟低于 2 秒。
- 每天处理 10,000 次查询。
- 支持超过 100 万份文档。
- 幻觉率低于 5%（原为 40%）。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│              Production RAG System Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Document Ingestion Pipeline                  │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   Load      │─▶│   Chunk     │─▶│   Embed     │     │  │
│  │  │  Documents  │  │  Splitter   │  │ SentenceT5  │     │  │
│  │  │  (PDF/HTML) │  │  - Overlap  │  │  (384-dim)  │     │  │
│  │  └─────────────┘  │  - Metadata │  └─────────────┘     │  │
│  │                    └─────────────┘          │            │  │
│  │                                              ▼            │  │
│  │                                    ┌─────────────────┐   │  │
│  │                                    │  Qdrant         │   │  │
│  │                                    │  Vector DB      │   │  │
│  │                                    │  - 1M vectors   │   │  │
│  │                                    │  - HNSW index   │   │  │
│  │                                    └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  RAG Query Pipeline                       │  │
│  │                                                           │  │
│  │  User Query: "How do I reset password?"                 │  │
│  │       │                                                   │  │
│  │       ▼                                                   │  │
│  │  ┌─────────────┐                                         │  │
│  │  │  Embed      │  (Convert query to 384-dim vector)     │  │
│  │  │  Query      │                                         │  │
│  │  └─────────────┘                                         │  │
│  │       │                                                   │  │
│  │       ▼                                                   │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │  Retrieval (Hybrid Search)              │            │  │
│  │  │                                          │            │  │
│  │  │  1. Dense Search (Vector Similarity)    │            │  │
│  │  │     - Cosine similarity                 │            │  │
│  │  │     - Retrieve top 20 chunks            │            │  │
│  │  │                                          │            │  │
│  │  │  2. Sparse Search (BM25 Keywords)       │            │  │
│  │  │     - Exact keyword matching            │            │  │
│  │  │     - Retrieve top 20 chunks            │            │  │
│  │  │                                          │            │  │
│  │  │  3. Fusion (Combine Results)            │            │  │
│  │  │     - Reciprocal Rank Fusion            │            │  │
│  │  │     - Top 10 chunks                     │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  │       │                                                   │  │
│  │       ▼                                                   │  │
│  │  ┌─────────────┐                                         │  │
│  │  │  Re-Rank    │  (Cross-encoder for relevance)         │  │
│  │  │  Top 5      │  → [Doc1: 0.95, Doc2: 0.89, ...]      │  │
│  │  └─────────────┘                                         │  │
│  │       │                                                   │  │
│  │       ▼                                                   │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │  LLM Generation                          │            │  │
│  │  │                                          │            │  │
│  │  │  Prompt:                                 │            │  │
│  │  │  "Based on the following context:       │            │  │
│  │  │   [Retrieved chunks]                     │            │  │
│  │  │   Answer: How do I reset password?"     │            │  │
│  │  │                                          │            │  │
│  │  │  Response:                               │            │  │
│  │  │  "To reset your password:               │            │  │
│  │  │   1. Go to Settings > Account           │            │  │
│  │  │   2. Click 'Reset Password'             │            │  │
│  │  │   [Citation: user-guide.pdf, p.12]"     │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Evaluation & Monitoring                      │  │
│  │                                                           │  │
│  │  - Retrieval Precision/Recall                            │  │
│  │  - Answer correctness (vs ground truth)                  │  │
│  │  - Citation accuracy                                      │  │
│  │  - Hallucination detection                               │  │
│  │  - Query latency breakdown                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 实现任务

### 第一部分：文档摄取管道（8–10 小时）

构建加载、切分文档并生成 Embedding 的管道。

#### 1.1 文档加载器

创建 `src/ingestion/document_loader.py`：

```python
"""
TODO: Load documents from various sources.

Supported formats:
- PDF (PyPDF2, pdfplumber)
- HTML (BeautifulSoup)
- Markdown
- Plain text
- DOCX
"""

from typing import List, Dict
from pathlib import Path
from dataclasses import dataclass
import PyPDF2
from bs4 import BeautifulSoup
import markdown

@dataclass
class Document:
    """Document with content and metadata."""
    content: str
    metadata: Dict  # source, title, page, url, etc.
    doc_id: str

class PDFLoader:
    """Load PDF documents."""

    def load(self, file_path: str) -> List[Document]:
        """
        TODO: Extract text from PDF.

        with open(file_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)

            documents = []
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()

                # Create document per page (for better granularity)
                doc = Document(
                    content=text,
                    metadata={
                        'source': file_path,
                        'page': page_num + 1,
                        'total_pages': len(pdf.pages),
                        'type': 'pdf'
                    },
                    doc_id=f"{Path(file_path).stem}_page_{page_num + 1}"
                )
                documents.append(doc)

        return documents
        """
        pass

class HTMLLoader:
    """Load HTML documents."""

    def load(self, file_path: str) -> Document:
        """
        TODO: Parse HTML and extract text.

        with open(file_path, 'r') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

            # Remove script and style tags
            for script in soup(['script', 'style']):
                script.decompose()

            # Extract text
            text = soup.get_text(separator='\n', strip=True)

            # Extract title
            title = soup.find('title')
            title_text = title.string if title else Path(file_path).stem

            return Document(
                content=text,
                metadata={
                    'source': file_path,
                    'title': title_text,
                    'type': 'html'
                },
                doc_id=Path(file_path).stem
            )
        """
        pass

class DocumentLoader:
    """Main document loader - auto-detects format."""

    def __init__(self):
        self.loaders = {
            '.pdf': PDFLoader(),
            '.html': HTMLLoader(),
            '.htm': HTMLLoader(),
            # TODO: Add more loaders
        }

    def load(self, file_path: str) -> List[Document]:
        """
        TODO: Load document based on file extension.

        suffix = Path(file_path).suffix.lower()
        loader = self.loaders.get(suffix)

        if not loader:
            raise ValueError(f"Unsupported file type: {suffix}")

        return loader.load(file_path)
        """
        pass

    def load_directory(self, directory: str) -> List[Document]:
        """
        TODO: Recursively load all documents in directory.

        documents = []
        for file_path in Path(directory).rglob('*'):
            if file_path.is_file() and file_path.suffix in self.loaders:
                try:
                    docs = self.load(str(file_path))
                    documents.extend(docs)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")

        return documents
        """
        pass
```

#### 1.2 智能切分

创建 `src/ingestion/chunker.py`：

```python
"""
TODO: Chunk documents for optimal retrieval.

Chunking strategies:
1. Fixed-size chunks (simple, works well)
2. Sentence-based chunks (preserves meaning)
3. Semantic chunks (split by topic)
4. Recursive chunks (hierarchical)

Key parameters:
- chunk_size: 512 tokens (fits in most embedding models)
- chunk_overlap: 50 tokens (preserves context across chunks)
"""

from typing import List
from dataclasses import dataclass
import tiktoken

@dataclass
class Chunk:
    """Document chunk with metadata."""
    content: str
    metadata: Dict
    chunk_id: str
    embedding: Optional[List[float]] = None

class RecursiveCharacterSplitter:
    """
    Split text recursively by separators.

    Hierarchy:
    1. Try splitting by paragraphs (\n\n)
    2. If too large, split by sentences (. ! ?)
    3. If still too large, split by words
    4. Last resort: split by characters

    This preserves semantic boundaries better than fixed-size splits.
    """

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        separators: List[str] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " ", ""]
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer

    def split(self, text: str, metadata: Dict) -> List[Chunk]:
        """
        TODO: Recursively split text into chunks.

        Algorithm:
        1. Try splitting by first separator (e.g., \n\n)
        2. For each piece:
           a. If piece < chunk_size: Keep as chunk
           b. If piece > chunk_size: Try next separator
           c. If at last separator: Force split at chunk_size
        3. Add overlap between chunks (last N tokens of chunk[i] become
           first N tokens of chunk[i+1])

        Return list of Chunk objects with metadata preserved
        """
        chunks = []

        # TODO: Implement recursive splitting
        # ...

        return chunks

    def _count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken."""
        return len(self.tokenizer.encode(text))

class SemanticChunker:
    """
    Split text based on semantic similarity.

    Uses embeddings to detect topic changes:
    1. Split text into sentences
    2. Embed each sentence
    3. Calculate similarity between adjacent sentences
    4. Split where similarity drops (topic change)

    More sophisticated but slower than recursive splitter.
    """

    def __init__(self, embedding_model, similarity_threshold: float = 0.7):
        self.embedding_model = embedding_model
        self.similarity_threshold = similarity_threshold

    def split(self, text: str, metadata: Dict) -> List[Chunk]:
        """
        TODO: Split based on semantic boundaries.

        1. Split into sentences
        2. Embed all sentences
        3. Calculate cosine similarity between adjacent pairs
        4. Where similarity < threshold: Insert split point
        5. Group sentences into chunks
        """
        pass
```

#### 1.3 Embedding 生成

创建 `src/ingestion/embedder.py`：

```python
"""
TODO: Generate embeddings for chunks.

Embedding models:
- sentence-transformers/all-MiniLM-L6-v2 (384-dim, fast)
- sentence-transformers/all-mpnet-base-v2 (768-dim, quality)
- BAAI/bge-large-en-v1.5 (1024-dim, SOTA)

Choice: all-MiniLM-L6-v2 for speed/quality balance
"""

from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
import torch

class EmbeddingModel:
    """Generate embeddings for text chunks."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ):
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = self.model.get_sentence_embedding_dimension()

    def embed(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        TODO: Generate embeddings for list of texts.

        # Batch encode for efficiency
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True  # L2 normalization for cosine similarity
        )

        return embeddings  # Shape: (len(texts), dimension)
        """
        pass

    def embed_query(self, query: str) -> np.ndarray:
        """
        TODO: Embed single query.

        # Some models have instruction prefixes for queries
        # Example: "Represent this sentence for searching relevant passages:"
        # For all-MiniLM, no prefix needed

        return self.model.encode(
            query,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        """
        pass

class EmbeddingPipeline:
    """Complete embedding pipeline."""

    def __init__(self, embedding_model: EmbeddingModel):
        self.model = embedding_model

    def process_chunks(self, chunks: List[Chunk]) -> List[Chunk]:
        """
        TODO: Add embeddings to chunks.

        # Extract text from chunks
        texts = [chunk.content for chunk in chunks]

        # Generate embeddings
        embeddings = self.model.embed(texts)

        # Add embeddings to chunks
        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding.tolist()

        return chunks
        """
        pass
```

### 第二部分：向量数据库搭建（7–9 小时）

部署并配置 Qdrant 向量数据库。

#### 2.1 Qdrant 部署

创建 `kubernetes/qdrant/deployment.yaml`：

```yaml
# TODO: Deploy Qdrant vector database

apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: qdrant
  namespace: rag-system
spec:
  serviceName: qdrant
  replicas: 3  # HA with replication
  selector:
    matchLabels:
      app: qdrant
  template:
    metadata:
      labels:
        app: qdrant
    spec:
      containers:
        - name: qdrant
          image: qdrant/qdrant:v1.7.4
          ports:
            - containerPort: 6333
              name: http
            - containerPort: 6334
              name: grpc
          env:
            # Cluster configuration
            - name: QDRANT__CLUSTER__ENABLED
              value: "true"
            - name: QDRANT__CLUSTER__P2P__PORT
              value: "6335"
          volumeMounts:
            - name: qdrant-storage
              mountPath: /qdrant/storage
          resources:
            requests:
              memory: "4Gi"
              cpu: "2"
            limits:
              memory: "8Gi"
              cpu: "4"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 6333
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 6333
            initialDelaySeconds: 10
            periodSeconds: 5

  volumeClaimTemplates:
    - metadata:
        name: qdrant-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 100Gi

---
apiVersion: v1
kind: Service
metadata:
  name: qdrant
  namespace: rag-system
spec:
  selector:
    app: qdrant
  ports:
    - port: 6333
      targetPort: 6333
      name: http
    - port: 6334
      targetPort: 6334
      name: grpc
  type: ClusterIP
```

#### 2.2 Qdrant 客户端

创建 `src/vectordb/qdrant_client.py`：

```python
"""
TODO: Qdrant client for vector operations.

Operations:
- Create collection
- Upsert vectors
- Search similar vectors
- Delete vectors
- Manage indexes (HNSW)
"""

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    SearchRequest
)
from typing import List, Dict, Optional
import uuid

class VectorDatabase:
    """Qdrant vector database client."""

    def __init__(self, host: str = "qdrant", port: int = 6333):
        self.client = QdrantClient(host=host, port=port)

    def create_collection(
        self,
        collection_name: str,
        vector_size: int = 384,
        distance: str = "Cosine"
    ):
        """
        TODO: Create vector collection.

        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE  # Cosine similarity
            ),
            # HNSW index configuration
            hnsw_config={
                "m": 16,  # Number of connections per layer
                "ef_construct": 100  # Search quality during build
            }
        )

        # Create payload index for metadata filtering
        self.client.create_payload_index(
            collection_name=collection_name,
            field_name="source",
            field_schema="keyword"
        )
        """
        pass

    def upsert_chunks(
        self,
        collection_name: str,
        chunks: List[Chunk]
    ):
        """
        TODO: Insert/update chunks in vector database.

        points = []
        for chunk in chunks:
            point = PointStruct(
                id=str(uuid.uuid4()),  # Generate unique ID
                vector=chunk.embedding,
                payload={
                    'content': chunk.content,
                    'metadata': chunk.metadata,
                    'chunk_id': chunk.chunk_id
                }
            )
            points.append(point)

        # Batch upsert (efficient for large datasets)
        self.client.upsert(
            collection_name=collection_name,
            points=points
        )
        """
        pass

    def search(
        self,
        collection_name: str,
        query_vector: List[float],
        top_k: int = 10,
        filter_conditions: Optional[Dict] = None
    ) -> List[Dict]:
        """
        TODO: Search for similar vectors.

        # Build filter if provided
        query_filter = None
        if filter_conditions:
            # Example: filter by source
            # filter_conditions = {'source': 'user-guide.pdf'}
            conditions = []
            for key, value in filter_conditions.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
            query_filter = Filter(must=conditions)

        # Execute search
        results = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
            with_vectors=False  # Don't return vectors (save bandwidth)
        )

        # Format results
        return [
            {
                'id': hit.id,
                'score': hit.score,
                'content': hit.payload['content'],
                'metadata': hit.payload['metadata']
            }
            for hit in results
        ]
        """
        pass
```

### 第三部分：带重排序的检索引擎（7–9 小时）

实现混合检索及重排序，改善检索质量。

#### 3.1 混合检索

创建 `src/retrieval/hybrid_search.py`：

```python
"""
TODO: Hybrid search combining dense + sparse retrieval.

Dense (Vector): Semantic similarity
Sparse (BM25): Keyword matching
Fusion: Reciprocal Rank Fusion

Hybrid often outperforms either method alone.
"""

from typing import List, Dict
from rank_bm25 import BM25Okapi
import numpy as np

class HybridRetriever:
    """Combine dense and sparse retrieval."""

    def __init__(
        self,
        vector_db: VectorDatabase,
        embedding_model: EmbeddingModel,
        collection_name: str
    ):
        self.vector_db = vector_db
        self.embedding_model = embedding_model
        self.collection_name = collection_name

        # TODO: Build BM25 index
        self.bm25_index = None
        self.documents = []  # For BM25
        self._build_bm25_index()

    def _build_bm25_index(self):
        """
        TODO: Build BM25 index from all documents.

        # Fetch all documents from vector DB
        # (In production, maintain separate BM25 index)
        self.documents = self._fetch_all_documents()

        # Tokenize documents
        tokenized_docs = [
            doc['content'].lower().split()
            for doc in self.documents
        ]

        # Build BM25 index
        self.bm25_index = BM25Okapi(tokenized_docs)
        """
        pass

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        dense_weight: float = 0.7,
        sparse_weight: float = 0.3
    ) -> List[Dict]:
        """
        TODO: Hybrid retrieval with RRF fusion.

        1. Dense retrieval (vector search):
           query_embedding = self.embedding_model.embed_query(query)
           dense_results = self.vector_db.search(
               collection_name=self.collection_name,
               query_vector=query_embedding,
               top_k=top_k * 2  # Retrieve more for fusion
           )

        2. Sparse retrieval (BM25):
           tokenized_query = query.lower().split()
           bm25_scores = self.bm25_index.get_scores(tokenized_query)
           # Get top_k * 2 documents
           sparse_results = ...

        3. Reciprocal Rank Fusion:
           For each document, calculate fusion score:
           score = dense_weight * (1 / (rank_dense + 60)) +
                   sparse_weight * (1 / (rank_sparse + 60))

           Constant 60 is from RRF paper - prevents division by zero
           and balances contribution of lower-ranked results

        4. Re-rank and return top_k

        Return fused results
        """
        pass

class ReRanker:
    """
    Re-rank retrieved results using cross-encoder.

    Cross-encoder: Jointly encodes query and document
    More accurate than bi-encoder (separate embeddings) but slower

    Use: Retrieve 20 docs with fast bi-encoder,
         Re-rank to top 5 with slow cross-encoder
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        from sentence_transformers import CrossEncoder
        self.model = CrossEncoder(model_name)

    def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 5
    ) -> List[Dict]:
        """
        TODO: Re-rank documents using cross-encoder.

        # Create query-document pairs
        pairs = [[query, doc['content']] for doc in documents]

        # Get relevance scores
        scores = self.model.predict(pairs)

        # Add scores to documents
        for doc, score in zip(documents, scores):
            doc['rerank_score'] = float(score)

        # Sort by score and return top_k
        ranked = sorted(documents, key=lambda x: x['rerank_score'], reverse=True)
        return ranked[:top_k]
        """
        pass
```

### 第四部分：RAG 生成管道（6–8 小时）

构建集成 LLM 的生成管道。

#### 4.1 RAG 管道

创建 `src/rag/rag_pipeline.py`：

```python
"""
TODO: Complete RAG pipeline: Retrieve + Generate.

Flow:
1. Receive query
2. Retrieve relevant context
3. Build prompt with context
4. Generate answer using LLM
5. Extract citations
6. Detect hallucinations
"""

from typing import List, Dict, Optional
import httpx

class RAGPipeline:
    """End-to-end RAG system."""

    def __init__(
        self,
        retriever: HybridRetriever,
        reranker: ReRanker,
        llm_endpoint: str = "http://llama2-7b-service:8000"
    ):
        self.retriever = retriever
        self.reranker = reranker
        self.llm_endpoint = llm_endpoint

    def query(
        self,
        query: str,
        top_k: int = 5,
        include_citations: bool = True
    ) -> Dict:
        """
        TODO: Execute RAG query.

        1. Retrieve relevant chunks
        retrieved_docs = self.retriever.retrieve(query, top_k=20)

        2. Re-rank to top_k
        ranked_docs = self.reranker.rerank(query, retrieved_docs, top_k=top_k)

        3. Build prompt
        prompt = self._build_prompt(query, ranked_docs)

        4. Generate answer
        answer = self._generate(prompt)

        5. Add citations
        if include_citations:
            answer = self._add_citations(answer, ranked_docs)

        6. Check for hallucinations
        hallucination_score = self._detect_hallucination(answer, ranked_docs)

        Return:
        {
            'query': query,
            'answer': answer,
            'citations': [...],
            'context_used': ranked_docs,
            'hallucination_score': hallucination_score
        }
        """
        pass

    def _build_prompt(self, query: str, context_docs: List[Dict]) -> str:
        """
        TODO: Build RAG prompt.

        Prompt template:
        ```
        You are a helpful AI assistant. Answer the question based ONLY on the
        provided context. If the answer is not in the context, say
        "I don't have enough information to answer that."

        Context:
        {context}

        Question: {query}

        Answer:
        ```

        Format context:
        context = "\n\n".join([
            f"[{i+1}] {doc['content']}\nSource: {doc['metadata']['source']}"
            for i, doc in enumerate(context_docs)
        ])
        """
        pass

    async def _generate(self, prompt: str) -> str:
        """
        TODO: Call LLM to generate answer.

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.llm_endpoint}/v1/chat/completions",
                json={
                    "model": "llama2",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,  # Low temperature for factual answers
                    "max_tokens": 512
                },
                timeout=60.0
            )

            result = response.json()
            return result['choices'][0]['message']['content']
        """
        pass

    def _add_citations(self, answer: str, context_docs: List[Dict]) -> str:
        """
        TODO: Add citations to answer.

        Look for sentences in answer that match content from context_docs.
        Append citation: [Source: doc_name, Page: X]

        Example:
        "To reset your password, go to Settings. [1]"
        Where [1] refers to context document 1
        """
        pass

    def _detect_hallucination(
        self,
        answer: str,
        context_docs: List[Dict]
    ) -> float:
        """
        TODO: Detect if answer contains information not in context.

        Simple heuristic:
        1. Extract key facts from answer (using NER or sentence splitting)
        2. Check if each fact appears in context
        3. Hallucination score = (facts_not_in_context / total_facts)

        Advanced: Use NLI (Natural Language Inference) model
        to check entailment between answer and context
        """
        pass
```

### 第五部分：评估与监控（6–8 小时）

实现 RAG 评估指标及监控。

#### 5.1 评估框架

创建 `src/evaluation/rag_eval.py`：

```python
"""
TODO: Evaluate RAG system performance.

Metrics:
1. Retrieval Quality:
   - Precision@K: How many retrieved docs are relevant?
   - Recall@K: What % of relevant docs were retrieved?
   - MRR (Mean Reciprocal Rank): Position of first relevant doc
   - NDCG: Normalized Discounted Cumulative Gain

2. Generation Quality:
   - Correctness: Is answer factually correct?
   - Completeness: Does answer address all aspects of question?
   - Groundedness: Is answer supported by context?
   - Citation accuracy: Are citations correct?

3. End-to-End:
   - Latency: Time from query to answer
   - User satisfaction: Thumbs up/down
"""

from typing import List, Dict
import numpy as np

class RAGEvaluator:
    """Evaluate RAG system performance."""

    def __init__(self, ground_truth_file: str):
        # TODO: Load ground truth Q&A pairs
        # Format: [{"query": "...", "answer": "...", "relevant_docs": [...]}]
        self.ground_truth = self._load_ground_truth(ground_truth_file)

    def evaluate_retrieval(
        self,
        rag_pipeline: RAGPipeline,
        k: int = 5
    ) -> Dict[str, float]:
        """
        TODO: Evaluate retrieval quality.

        For each ground truth query:
        1. Retrieve top-k documents
        2. Compare with ground truth relevant docs
        3. Calculate metrics

        Metrics:
        - Precision@K = (relevant docs in top-k) / k
        - Recall@K = (relevant docs in top-k) / total relevant
        - MRR = 1 / rank_of_first_relevant_doc
        - NDCG@K = normalized discounted cumulative gain

        Return average metrics across all queries
        """
        precisions = []
        recalls = []
        mrrs = []

        for item in self.ground_truth:
            query = item['query']
            relevant_doc_ids = set(item['relevant_docs'])

            # Retrieve docs
            retrieved = rag_pipeline.retriever.retrieve(query, top_k=k)
            retrieved_ids = [doc['id'] for doc in retrieved]

            # Calculate metrics
            relevant_retrieved = set(retrieved_ids) & relevant_doc_ids

            precision = len(relevant_retrieved) / k
            recall = len(relevant_retrieved) / len(relevant_doc_ids) if relevant_doc_ids else 0

            precisions.append(precision)
            recalls.append(recall)

            # MRR: Find position of first relevant doc
            for rank, doc_id in enumerate(retrieved_ids, 1):
                if doc_id in relevant_doc_ids:
                    mrrs.append(1.0 / rank)
                    break
            else:
                mrrs.append(0.0)  # No relevant doc found

        return {
            'precision@k': np.mean(precisions),
            'recall@k': np.mean(recalls),
            'mrr': np.mean(mrrs)
        }

    def evaluate_generation(
        self,
        rag_pipeline: RAGPipeline,
        use_llm_judge: bool = True
    ) -> Dict[str, float]:
        """
        TODO: Evaluate answer quality.

        For each ground truth Q&A:
        1. Generate answer using RAG
        2. Compare with ground truth answer
        3. Score on: correctness, completeness, groundedness

        Scoring methods:
        - Exact match (too strict)
        - Token overlap (F1, ROUGE)
        - Semantic similarity (embedding cosine similarity)
        - LLM-as-judge: Use GPT-4 to evaluate (most accurate)

        Example LLM-as-judge prompt:
        "Rate the following answer on a scale of 1-5 for correctness and completeness.
         Question: {question}
         Reference Answer: {ground_truth}
         Generated Answer: {generated}
         Provide scores and brief explanation."
        """
        pass
```

#### 5.2 监控仪表盘

创建 `dashboards/rag-dashboard.json`：

```json
{
  "dashboard": {
    "title": "RAG System Monitoring",
    "panels": [
      {
        "title": "Query Rate",
        "targets": [{"expr": "rate(rag_queries_total[5m])"}]
      },
      {
        "title": "End-to-End Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(rag_query_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Retrieval Precision@5",
        "targets": [{"expr": "rag_retrieval_precision_at_5"}]
      },
      {
        "title": "Hallucination Rate",
        "targets": [{
          "expr": "rate(rag_hallucinations_total[1h]) / rate(rag_queries_total[1h])"
        }]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{
          "expr": "rate(rag_cache_hits_total[5m]) / rate(rag_queries_total[5m])"
        }]
      }
    ]
  }
}
```

## 验收标准

### 功能需求

- [ ] 文档摄取管道处理 PDF、HTML、Markdown。
- [ ] 智能切分，支持重叠。
- [ ] Qdrant 向量数据库采用高可用部署。
- [ ] 实现混合检索（稠密 + 稀疏）。
- [ ] 使用 Cross-encoder 重排序。
- [ ] 集成 LLM，实现 RAG 生成。
- [ ] 提取引用。
- [ ] 幻觉检测。

### 性能需求

- [ ] 检索 Precision@5 超过 90%。
- [ ] 回答准确率超过 90%。
- [ ] 端到端延迟低于 2 秒。
- [ ] 每天处理 10,000 次查询。
- [ ] 支持超过 100 万份文档。
- [ ] 幻觉率低于 5%。

### 代码质量

- [ ] 全面单元测试（覆盖率超过 80%）。
- [ ] 完整 RAG 管道集成测试。
- [ ] 包含指标的评估框架。
- [ ] 监控仪表盘。

## 测试策略

```bash
# Unit tests
pytest tests/

# Integration tests
pytest tests/integration/ -v

# Evaluation
python src/evaluation/run_eval.py --ground-truth data/eval_set.json

# Load test
python tests/load_test_rag.py --queries-per-second 100
```

## 交付物

1. **源代码**（摄取、检索、生成管道）。
2. **Kubernetes Manifest**（Qdrant 部署）。
3. **评估框架**（指标、真实标注数据集）。
4. **文档**（架构、API 文档、评估结果）。
5. **仪表盘**（Grafana 监控）。

## 额外挑战

1. **多模态 RAG（额外 8 小时）：** 支持文档中的图片与表格。
2. **对话式 RAG（额外 6 小时）：** 利用上下文处理后续问题。
3. **主动学习（额外 6 小时）：** 根据用户反馈改善检索。

## 资源

- [Qdrant 文档](https://qdrant.tech/documentation/)
- [Sentence Transformers](https://www.sbert.net/)
- [RAG 论文](https://arxiv.org/abs/2005.11401)

## 提交

```bash
git add .
git commit -m "Complete Exercise 02: Production RAG System"
git push origin exercise-02-production-rag-system
```

---

**预计时长分解：**
- 第一部分（文档摄取）：8–10 小时。
- 第二部分（向量数据库）：7–9 小时。
- 第三部分（检索引擎）：7–9 小时。
- 第四部分（RAG 生成）：6–8 小时。
- 第五部分（评估）：6–8 小时。
- **合计（原文）：** 34–42 小时。

> 译注：原文的正确文档位于 Top-5 更接近 Hit@5，Precision@5 衡量前五条结果中相关结果的比例，两者不可混用。准确率、幻觉率等必须通过标注评估集验证。文档访问控制应在检索阶段实施，防止跨租户泄漏及间接提示注入；数据更新与删除须同步索引及缓存。原文各任务上限合计为 44 小时。全部代码块及 TODO 保留，未实际部署或评估。
