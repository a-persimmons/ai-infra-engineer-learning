# 实验 03：搭建向量数据库（Qdrant）

**时长：** 60 分钟  **前置条件：** Docker。

## 目标

在本地运行 Qdrant，创建 Collection，插入或更新带元数据的向量，并执行带过滤条件的近邻查询。

## 步骤

### 1. 运行 Qdrant
```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:v1.10.0
```
HTTP API 位于 6333 端口，gRPC 位于 6334 端口。仪表盘地址：http://localhost:6333/dashboard 。

### 2. 创建 Collection
```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

client = QdrantClient(host="localhost", port=6333)
client.recreate_collection(
    collection_name="docs",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)
```

### 3. 插入或更新带 Payload 的数据
```python
from qdrant_client.http.models import PointStruct
import numpy as np

points = [
    PointStruct(
        id=i,
        vector=np.random.rand(384).tolist(),
        payload={"category": np.random.choice(["a","b","c"]), "ts": 1717000000 + i*60},
    )
    for i in range(1000)
]
client.upsert(collection_name="docs", points=points)
print(client.count("docs"))
```

### 4. 普通近邻搜索
```python
q = np.random.rand(384).tolist()
hits = client.search(collection_name="docs", query_vector=q, limit=5)
for h in hits:
    print(h.id, h.score, h.payload)
```

### 5. 带过滤条件的搜索
```python
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
hits = client.search(
    collection_name="docs",
    query_vector=q,
    query_filter=Filter(must=[FieldCondition(key="category", match=MatchValue(value="a"))]),
    limit=5,
)
```

### 6. 更新 Payload（无需重新生成嵌入）
```python
client.set_payload(collection_name="docs", payload={"tag": "important"}, points=[1, 2, 3])
```

### 7. 使用快照备份
```python
client.create_snapshot(collection_name="docs")
client.list_snapshots(collection_name="docs")
```

### 8. 与 RAG 流水线结合（实验 02）

使用 Qdrant 替换 FAISS 内存索引。生产环境收益包括持久化、过滤与多个 Collection。

## 验证

- [ ] Qdrant 仪表盘中可以看到包含 1,000 个 Point 的 Collection。
- [ ] 近邻搜索返回按分数排序的五个结果。
- [ ] 带过滤条件的搜索仅返回具有 `category=a` 的 Point。

## 清理
```bash
docker stop qdrant && docker rm qdrant
```

## 故障排查

- **快照失败** — Qdrant 需要可写的数据卷；上面的 Docker 运行命令使用默认临时存储。
- **过滤返回 0 个结果** — 检查字段名拼写；Payload 键区分大小写。
- **`Wrong vector size`** — Collection 配置的大小必须与向量维度完全一致。
