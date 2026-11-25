# 第 04 课：向量数据库

## 目录
1. [导论](#导论)
2. [向量数据库基础](#向量数据库基础)
3. [详细比较](#详细比较)
4. [深入 Qdrant](#深入-qdrant)
5. [深入 Weaviate](#深入-weaviate)
6. [深入 Chroma](#深入-chroma)
7. [深入 Pinecone](#深入-pinecone)
8. [Milvus 与 FAISS](#milvus-与-faiss)
9. [部署策略](#部署策略)
10. [向量索引](#向量索引)
11. [扩展策略](#扩展策略)
12. [Kubernetes 部署](#kubernetes-部署-qdrant)
13. [监控与性能](#监控与性能)
14. [成本优化](#成本优化)
15. [总结](#总结)

## 导论

向量数据库是针对高维向量（Embedding）的存储、索引及搜索进行优化的数据库。它们是 RAG、语义搜索、推荐引擎及其他 AI 应用的重要基础设施。

### 学习目标

- 理解向量数据库架构与索引。
- 比较主流向量数据库方案。
- 在生产环境中部署向量数据库。
- 优化性能及成本。
- 实现适当的监控与扩展。
- 根据使用场景选择合适的向量数据库。

## 向量数据库基础

### 什么是向量数据库？

向量数据库专门用于：
- 存储高维向量（Embedding）。
- 高效相似度搜索（ANN，近似最近邻）。
- 将元数据过滤与向量搜索结合。
- 水平扩展至数十亿向量（取决于实现及资源）。
- 实时更新与查询。

### 核心概念

**Embedding（嵌入）：** 数据的稠密向量表示。
```python
text = "Machine learning is amazing"
embedding = [0.12, -0.45, 0.78, ..., 0.23]  # 768 dimensions
```

**相似度度量：**
- **余弦相似度（Cosine Similarity）：** 衡量向量夹角相关的相似性。
- **欧氏距离（Euclidean Distance）：** 两点之间的直线距离。
- **点积（Dot Product）：** 向量的内积。

**索引算法：**
- **HNSW（Hierarchical Navigable Small World，分层可导航小世界图）：** 速度快，内存需求较高。
- **IVF（Inverted File Index，倒排文件索引）：** 在性能与资源消耗之间取得平衡。
- **LSH（Locality Sensitive Hashing，局部敏感哈希）：** 快速近似搜索。
- **ANNOY：** 基于树结构，具有较好的内存效率。

## 详细比较

### 功能比较矩阵（原文所处时期的评价）

| 特性 | Qdrant | Weaviate | Chroma | Pinecone | Milvus |
|---|---|---|---|---|---|
| **开源** | 是 | 是 | 是 | 否 | 是 |
| **托管云服务** | 是 | 是 | 否 | 是 | 是 |
| **语言** | Rust | Go | Python | 专有实现 | C++/Python |
| **过滤能力** | 优秀 | 优秀 | 基础 | 良好 | 优秀 |
| **性能** | 优秀 | 很好 | 良好 | 优秀 | 优秀 |
| **易用性** | 很好 | 良好 | 优秀 | 优秀 | 中等 |
| **混合检索** | 是 | 是 | 否 | 否 | 是 |
| **多租户** | 是 | 是 | 否 | 是 | 是 |
| **GraphQL** | 否 | 是 | 否 | 否 | 否 |

### 各方案的适用时机

**Qdrant：**
```python
# High performance, complex filtering, self-hosted
use_cases = [
    "Production RAG systems",
    "High-throughput applications",
    "Complex metadata filtering",
    "Cost-conscious deployments"
]
```

**Weaviate：**
```python
# Hybrid search, GraphQL, knowledge graphs
use_cases = [
    "Hybrid vector + keyword search",
    "GraphQL API requirements",
    "Multi-modal search (text, images)",
    "Knowledge graph applications"
]
```

**Chroma：**
```python
# Development, prototyping, embedded
use_cases = [
    "Rapid prototyping",
    "Small to medium datasets",
    "Embedded in applications",
    "Development and testing"
]
```

**Pinecone：**
```python
# Fully managed, enterprise, scale
use_cases = [
    "Fully managed solution needed",
    "Enterprise support required",
    "Massive scale (billions of vectors)",
    "Don't want to manage infrastructure"
]
```

## 深入 Qdrant

### 架构

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import numpy as np

# Initialize client
client = QdrantClient(host="localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="my_collection",
    vectors_config=VectorParams(
        size=768,  # Embedding dimension
        distance=Distance.COSINE
    )
)

# Insert vectors
points = [
    PointStruct(
        id=1,
        vector=np.random.rand(768).tolist(),
        payload={"text": "Sample document", "category": "tech"}
    )
    for i in range(1000)
]

client.upsert(
    collection_name="my_collection",
    points=points
)

# Search
results = client.search(
    collection_name="my_collection",
    query_vector=np.random.rand(768).tolist(),
    limit=10
)
```

### 高级功能

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Filtered search
results = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    query_filter=Filter(
        must=[
            FieldCondition(
                key="category",
                match=MatchValue(value="tech")
            )
        ]
    ),
    limit=10
)

# Scroll through all vectors
records, next_offset = client.scroll(
    collection_name="my_collection",
    limit=100,
    with_payload=True,
    with_vectors=False
)

# Batch operations
client.upsert(
    collection_name="my_collection",
    points=points,
    wait=True  # Wait for operation to complete
)
```

### Qdrant 生产部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"  # gRPC port
    volumes:
      - ./qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: always
```

```python
# Production configuration
client = QdrantClient(
    host="localhost",
    port=6333,
    grpc_port=6334,
    prefer_grpc=True,  # Use gRPC for better performance
    timeout=60
)

# Optimize for performance
client.create_collection(
    collection_name="production",
    vectors_config=VectorParams(
        size=768,
        distance=Distance.COSINE
    ),
    optimizers_config={
        "memmap_threshold": 20000,  # Use memory-mapped files
        "indexing_threshold": 10000
    },
    quantization_config={
        "scalar": {
            "type": "int8",
            "quantile": 0.99,
            "always_ram": True
        }
    }
)
```

## 深入 Weaviate

### 配置与基础使用

```python
import weaviate

# Initialize client
client = weaviate.Client("http://localhost:8080")

# Create schema
schema = {
    "class": "Document",
    "vectorizer": "text2vec-transformers",
    "moduleConfig": {
        "text2vec-transformers": {
            "model": "sentence-transformers/all-MiniLM-L6-v2"
        }
    },
    "properties": [
        {
            "name": "content",
            "dataType": ["text"]
        },
        {
            "name": "category",
            "dataType": ["string"]
        }
    ]
}

client.schema.create_class(schema)

# Insert data (automatic vectorization)
client.data_object.create(
    {
        "content": "Machine learning is a subset of AI",
        "category": "technology"
    },
    "Document"
)

# Search
result = client.query.get(
    "Document",
    ["content", "category"]
).with_near_text({
    "concepts": ["artificial intelligence"]
}).with_limit(10).do()
```

### 混合检索

```python
# Combine vector and keyword search
result = client.query.get(
    "Document",
    ["content", "category"]
).with_hybrid(
    query="machine learning",
    alpha=0.5  # 0=keyword only, 1=vector only
).with_limit(10).do()
```

### Weaviate 部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-transformers'
      ENABLE_MODULES: 'text2vec-transformers'
      TRANSFORMERS_INFERENCE_API: 'http://t2v-transformers:8080'
    volumes:
      - ./weaviate_data:/var/lib/weaviate

  t2v-transformers:
    image: semitechnologies/transformers-inference:sentence-transformers-all-MiniLM-L6-v2
    environment:
      ENABLE_CUDA: '0'
```

## 深入 Chroma

### 配置与使用

```python
import chromadb
from chromadb.config import Settings

# Persistent client
client = chromadb.PersistentClient(path="./chroma_db")

# Create collection
collection = client.create_collection(
    name="my_collection",
    metadata={"hnsw:space": "cosine"}
)

# Add documents (automatic embedding with default model)
collection.add(
    documents=[
        "This is a document about machine learning",
        "This document is about natural language processing"
    ],
    metadatas=[
        {"category": "ML"},
        {"category": "NLP"}
    ],
    ids=["doc1", "doc2"]
)

# Query
results = collection.query(
    query_texts=["What is machine learning?"],
    n_results=10
)

print(results)
```

### 自定义 Embedding 函数

```python
from chromadb.utils import embedding_functions

# Use custom embedding function
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-mpnet-base-v2"
)

collection = client.create_collection(
    name="custom_embeddings",
    embedding_function=sentence_transformer_ef
)

# Or use OpenAI
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-ada-002"
)
```

## 深入 Pinecone

### 配置与使用

```python
import pinecone

# Initialize
pinecone.init(
    api_key="your-api-key",
    environment="us-west1-gcp"
)

# Create index
pinecone.create_index(
    "my-index",
    dimension=768,
    metric="cosine",
    pods=1,
    replicas=1,
    pod_type="p1.x1"
)

# Connect to index
index = pinecone.Index("my-index")

# Upsert vectors
vectors = [
    ("id1", [0.1] * 768, {"text": "Document 1"}),
    ("id2", [0.2] * 768, {"text": "Document 2"})
]

index.upsert(vectors=vectors)

# Query
results = index.query(
    vector=[0.15] * 768,
    top_k=10,
    include_metadata=True
)
```

### Pinecone Namespace（命名空间）

```python
# Use namespaces for multi-tenancy
index.upsert(
    vectors=vectors,
    namespace="user_123"
)

# Query specific namespace
results = index.query(
    vector=query_vector,
    top_k=10,
    namespace="user_123"
)
```

## Milvus 与 FAISS

> 译注：原文目录列有本节，但正文未提供独立的 Milvus 与 FAISS 详解。前面的比较矩阵及上一课包含相关介绍。

## 部署策略

### 自托管与托管服务

```python
deployment_decision_matrix = {
    "self_hosted": {
        "pros": [
            "Full control",
            "Lower long-term costs",
            "Data privacy",
            "Custom optimizations"
        ],
        "cons": [
            "Operations overhead",
            "Scaling complexity",
            "Maintenance burden"
        ],
        "recommended_for": [
            "Qdrant",
            "Weaviate",
            "Milvus",
            "Chroma"
        ]
    },
    "managed": {
        "pros": [
            "No operations overhead",
            "Automatic scaling",
            "Enterprise support",
            "Managed backups"
        ],
        "cons": [
            "Higher costs",
            "Less control",
            "Vendor lock-in"
        ],
        "recommended_for": [
            "Pinecone",
            "Weaviate Cloud",
            "Qdrant Cloud"
        ]
    }
}
```

### Kubernetes 部署（Qdrant）

```yaml
# qdrant-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: qdrant
spec:
  serviceName: qdrant
  replicas: 3
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
        image: qdrant/qdrant:latest
        ports:
        - containerPort: 6333
          name: http
        - containerPort: 6334
          name: grpc
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
  volumeClaimTemplates:
  - metadata:
      name: qdrant-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: qdrant
spec:
  clusterIP: None
  selector:
    app: qdrant
  ports:
  - port: 6333
    name: http
  - port: 6334
    name: grpc
```

## 向量索引

### HNSW（分层可导航小世界图）

```python
# HNSW is the most popular indexing algorithm

# Qdrant HNSW configuration
client.create_collection(
    collection_name="hnsw_collection",
    vectors_config=VectorParams(
        size=768,
        distance=Distance.COSINE
    ),
    hnsw_config={
        "m": 16,  # Number of connections per layer
        "ef_construct": 100,  # Size of dynamic candidate list
        "full_scan_threshold": 10000
    }
)

# Tuning parameters:
# m: Higher = better recall, more memory
# ef_construct: Higher = better index quality, slower indexing
# ef (search-time): Higher = better recall, slower search
```

### IVF（倒排文件索引）

```python
# Common in FAISS and Milvus
import faiss

# Create IVF index
dimension = 768
nlist = 100  # Number of clusters

quantizer = faiss.IndexFlatL2(dimension)
index = faiss.IndexIVFFlat(quantizer, dimension, nlist)

# Train index
index.train(training_vectors)

# Add vectors
index.add(vectors)

# Search
index.nprobe = 10  # Number of clusters to search
distances, indices = index.search(query_vectors, k=10)
```

## 扩展策略

### 水平扩展

```python
class VectorDBScaling:
    """Scaling strategies for vector databases"""

    @staticmethod
    def sharding_strategy():
        """
        Split data across multiple nodes
        """
        strategies = {
            "by_tenant": "Shard by user/tenant ID",
            "by_category": "Shard by metadata category",
            "by_hash": "Hash-based sharding",
            "by_time": "Time-based partitioning"
        }
        return strategies

    @staticmethod
    def replication_strategy():
        """
        Replicate data for high availability
        """
        configs = {
            "qdrant": {
                "replication_factor": 2,
                "write_consistency_factor": 1
            },
            "weaviate": {
                "replicationFactor": 2
            }
        }
        return configs
```

### 性能优化

```python
optimization_techniques = {
    "indexing": {
        "hnsw_tuning": "Adjust m and ef_construct",
        "quantization": "Use scalar or product quantization",
        "filtering": "Use payload indexes for metadata"
    },
    "search": {
        "batch_queries": "Process multiple queries together",
        "ef_tuning": "Adjust search-time ef parameter",
        "result_caching": "Cache frequent queries"
    },
    "storage": {
        "quantization": "Reduce memory footprint",
        "mmap": "Use memory-mapped files",
        "compression": "Compress stored data"
    }
}
```

## 监控与性能

### 需要追踪的指标

```python
from prometheus_client import Counter, Histogram, Gauge

# Vector database metrics
VECTOR_DB_QUERIES = Counter(
    'vector_db_queries_total',
    'Total vector DB queries',
    ['collection', 'status']
)

VECTOR_DB_LATENCY = Histogram(
    'vector_db_query_duration_seconds',
    'Query duration',
    ['collection']
)

VECTOR_DB_SIZE = Gauge(
    'vector_db_collection_size',
    'Number of vectors in collection',
    ['collection']
)

INDEX_QUALITY = Gauge(
    'vector_db_index_quality',
    'Index quality metrics',
    ['collection', 'metric']
)
```

### Qdrant 监控

```python
# Get collection info
info = client.get_collection("my_collection")

metrics = {
    "vectors_count": info.vectors_count,
    "indexed_vectors_count": info.indexed_vectors_count,
    "points_count": info.points_count,
    "segments_count": len(info.segments),
    "status": info.status
}

# Monitor index quality
for segment in info.segments:
    print(f"Segment: {segment.segment_id}")
    print(f"  Vectors: {segment.num_vectors}")
    print(f"  Deleted: {segment.num_deleted_vectors}")
```

## 成本优化

### 策略

```python
class CostOptimization:
    """Cost optimization for vector databases"""

    @staticmethod
    def quantization():
        """
        Reduce memory and storage costs
        """
        return {
            "scalar_quantization": "4-8x reduction, minimal quality loss",
            "product_quantization": "16-64x reduction, moderate quality loss",
            "binary_quantization": "32x reduction, significant quality loss"
        }

    @staticmethod
    def rightsizing():
        """
        Choose appropriate instance sizes
        """
        guidelines = {
            "development": "Small instances, Chroma or single Qdrant",
            "production_small": "1-2 nodes, moderate resources",
            "production_large": "3+ nodes, high resources, replication"
        }
        return guidelines

    @staticmethod
    def caching():
        """
        Reduce query costs
        """
        return {
            "query_caching": "Cache frequent queries",
            "result_caching": "Cache search results",
            "embedding_caching": "Cache embeddings"
        }
```

### 成本比较

```python
monthly_cost_estimates = {
    "qdrant_cloud": {
        "starter": 25,  # 1GB
        "standard": 100,  # 4GB
        "business": 500   # 32GB
    },
    "pinecone": {
        "starter": 70,   # 1 pod
        "standard": 140,  # 2 pods
        "enterprise": 500  # Custom
    },
    "self_hosted_qdrant": {
        "small": 30,  # 4GB RAM instance
        "medium": 100,  # 16GB RAM instance
        "large": 300   # 64GB RAM instance
    },
    "weaviate_cloud": {
        "sandbox": 0,    # Free tier
        "standard": 100,  # Production
        "enterprise": 500  # Custom
    }
}
```

## 总结

向量数据库是 LLM 应用的重要基础设施。核心要点：

1. **根据需求选择：** 原文推荐 Qdrant 用于性能场景，Weaviate 用于混合检索，Chroma 用于开发，Pinecone 用于托管场景。
2. **索引很重要：** HNSW 适用于许多场景，需要针对工作负载调优参数。
3. **适当扩展：** 大规模部署可使用分片与复制。
4. **主动监控：** 追踪查询延迟、索引质量及费用。
5. **优化成本：** 通过量化、缓存及合理调整资源规格节约费用。

---

**下一课：** [05-llm-fine-tuning-infrastructure.md](./05-llm-fine-tuning-infrastructure.md)

> 译注：比较矩阵为原文历史描述，不代表当前产品能力。例如 Pinecone 支持稠密与稀疏向量结合的混合检索，Chroma 也有托管及租户相关能力；具体接口与功能需核对对应版本。FAISS 是向量相似度搜索库，并非完整数据库。索引选型应基于实际数据规模、过滤条件、更新频率、召回率、尾延迟和资源消耗进行测试。分片与复制分别服务于容量扩展和可用性等目标，不能简单互相替代。原始代码块与英文注释保持不变，未执行基准测试。
