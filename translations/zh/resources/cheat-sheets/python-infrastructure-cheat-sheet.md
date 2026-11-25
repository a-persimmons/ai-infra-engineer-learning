# 面向基础设施的 Python 速查表

基础设施工程中常用的 Python 编程模式和库的快速参考。

---

## 基础设施 Python 基础

### 环境管理
```bash
# Create virtual environment
python3 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Deactivate
deactivate

# Install requirements
pip install -r requirements.txt

# Freeze dependencies
pip freeze > requirements.txt

# Using poetry (alternative)
poetry init
poetry add <package>
poetry install
```

### 项目结构
```
project/
├── src/
│   ├── __init__.py
│   ├── main.py
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
├── tests/
│   ├── __init__.py
│   └── test_main.py
├── requirements.txt
├── setup.py
├── .env
└── README.md
```

---

## 常用基础设施库

### 文件与系统操作
```python
import os
import sys
import shutil
from pathlib import Path

# Environment variables
api_key = os.getenv('API_KEY', 'default_value')
os.environ['NEW_VAR'] = 'value'

# Path operations (pathlib - recommended)
path = Path('/path/to/file.txt')
path.exists()
path.is_file()
path.is_dir()
path.mkdir(parents=True, exist_ok=True)
path.read_text()
path.write_text('content')

# File operations
with open('file.txt', 'r') as f:
    content = f.read()

with open('file.txt', 'w') as f:
    f.write('content')

# Directory operations
shutil.copytree('src', 'dest')
shutil.rmtree('directory')
shutil.copy2('file.txt', 'dest/')

# Execute commands
import subprocess
result = subprocess.run(['ls', '-la'], capture_output=True, text=True)
print(result.stdout)
print(result.returncode)
```

### 日志
```python
import logging

# Basic configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usage
logger.debug('Debug message')
logger.info('Info message')
logger.warning('Warning message')
logger.error('Error message')
logger.critical('Critical message')

# Structured logging (using structlog)
import structlog

log = structlog.get_logger()
log.info('event', user='john', action='login')
```

### 配置管理
```python
# Using environment variables with python-decouple
from decouple import config

DATABASE_URL = config('DATABASE_URL')
DEBUG = config('DEBUG', default=False, cast=bool)
PORT = config('PORT', default=8000, cast=int)

# Using pydantic for settings
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_key: str
    debug: bool = False

    class Config:
        env_file = '.env'

settings = Settings()

# Using YAML config
import yaml

with open('config.yaml') as f:
    config = yaml.safe_load(f)
```

---

## API 与 Web 框架

### FastAPI
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}

@app.post("/items/")
async def create_item(item: Item):
    return item

# Run with: uvicorn main:app --reload
```

### Flask（轻量替代方案）
```python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Hello World"})

@app.route('/api/data', methods=['GET', 'POST'])
def handle_data():
    if request.method == 'POST':
        data = request.get_json()
        return jsonify({"received": data}), 201
    return jsonify({"data": []})

if __name__ == '__main__':
    app.run(debug=True)
```

### HTTP 请求
```python
import requests

# GET request
response = requests.get('https://api.example.com/data')
data = response.json()

# POST request
payload = {'key': 'value'}
response = requests.post('https://api.example.com/data', json=payload)

# With headers and auth
headers = {'Authorization': 'Bearer token'}
response = requests.get('https://api.example.com/data', headers=headers)

# Error handling
try:
    response = requests.get('https://api.example.com/data', timeout=5)
    response.raise_for_status()  # Raises HTTPError for bad responses
except requests.exceptions.RequestException as e:
    logger.error(f"Request failed: {e}")
```

---

## 数据库操作

### PostgreSQL（使用 psycopg2）
```python
import psycopg2

# Connect
conn = psycopg2.connect(
    host="localhost",
    database="mydb",
    user="user",
    password="password"
)

# Execute query
with conn.cursor() as cur:
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    result = cur.fetchone()

# Insert data
with conn.cursor() as cur:
    cur.execute(
        "INSERT INTO users (name, email) VALUES (%s, %s)",
        ("John", "john@example.com")
    )
    conn.commit()

conn.close()
```

### SQLAlchemy（ORM）
```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)

# Create engine and session
engine = create_engine('postgresql://user:pass@localhost/mydb')
Session = sessionmaker(bind=engine)
session = Session()

# Query
users = session.query(User).filter(User.name == 'John').all()

# Insert
new_user = User(name='Jane', email='jane@example.com')
session.add(new_user)
session.commit()
```

---

## 云平台 SDK

### AWS（boto3）
```python
import boto3

# S3 operations
s3 = boto3.client('s3')

# Upload file
s3.upload_file('local_file.txt', 'bucket-name', 'remote_file.txt')

# Download file
s3.download_file('bucket-name', 'remote_file.txt', 'local_file.txt')

# List objects
response = s3.list_objects_v2(Bucket='bucket-name')
for obj in response.get('Contents', []):
    print(obj['Key'])

# EC2 operations
ec2 = boto3.resource('ec2')

# List instances
for instance in ec2.instances.all():
    print(instance.id, instance.state)

# Create instance
instance = ec2.create_instances(
    ImageId='ami-12345678',
    MinCount=1,
    MaxCount=1,
    InstanceType='t2.micro'
)
```

### GCP
```python
from google.cloud import storage

# Storage client
client = storage.Client()

# Upload file
bucket = client.get_bucket('bucket-name')
blob = bucket.blob('remote_file.txt')
blob.upload_from_filename('local_file.txt')

# Download file
blob.download_to_filename('local_file.txt')

# List blobs
blobs = client.list_blobs('bucket-name')
for blob in blobs:
    print(blob.name)
```

---

## 容器管理

### Docker SDK
```python
import docker

client = docker.from_env()

# List containers
for container in client.containers.list():
    print(container.name, container.status)

# Run container
container = client.containers.run(
    'nginx:latest',
    detach=True,
    ports={'80/tcp': 8080},
    environment={'ENV_VAR': 'value'}
)

# Stop and remove
container.stop()
container.remove()

# Build image
image, logs = client.images.build(
    path='.',
    tag='myimage:latest'
)

# Execute command in container
result = container.exec_run('ls -la')
print(result.output.decode())
```

### Kubernetes 客户端
```python
from kubernetes import client, config

# Load config
config.load_kube_config()

v1 = client.CoreV1Api()

# List pods
pods = v1.list_namespaced_pod('default')
for pod in pods.items:
    print(pod.metadata.name, pod.status.phase)

# Create pod
pod = client.V1Pod(
    metadata=client.V1ObjectMeta(name='my-pod'),
    spec=client.V1PodSpec(
        containers=[
            client.V1Container(
                name='nginx',
                image='nginx:latest',
                ports=[client.V1ContainerPort(container_port=80)]
            )
        ]
    )
)
v1.create_namespaced_pod('default', pod)

# Delete pod
v1.delete_namespaced_pod('my-pod', 'default')
```

---

## 数据处理

### Pandas
```python
import pandas as pd

# Read data
df = pd.read_csv('data.csv')
df = pd.read_json('data.json')

# Basic operations
df.head()
df.info()
df.describe()

# Filter
filtered = df[df['age'] > 30]

# Group by
grouped = df.groupby('category')['value'].sum()

# Write data
df.to_csv('output.csv', index=False)
df.to_json('output.json')
```

### 数据验证
```python
from pydantic import BaseModel, validator

class User(BaseModel):
    name: str
    age: int
    email: str

    @validator('age')
    def age_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Age must be positive')
        return v

# Use
user = User(name='John', age=30, email='john@example.com')
```

---

## 异步操作

### Asyncio
```python
import asyncio

async def fetch_data(url):
    # Simulate async operation
    await asyncio.sleep(1)
    return f"Data from {url}"

async def main():
    # Run sequentially
    result1 = await fetch_data('url1')
    result2 = await fetch_data('url2')

    # Run concurrently
    results = await asyncio.gather(
        fetch_data('url1'),
        fetch_data('url2'),
        fetch_data('url3')
    )

# Run
asyncio.run(main())
```

### 使用 aiohttp 异步发送 HTTP 请求
```python
import aiohttp
import asyncio

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    async with aiohttp.ClientSession() as session:
        result = await fetch(session, 'https://api.example.com/data')

        # Concurrent requests
        tasks = [
            fetch(session, 'https://api.example.com/1'),
            fetch(session, 'https://api.example.com/2'),
            fetch(session, 'https://api.example.com/3')
        ]
        results = await asyncio.gather(*tasks)

asyncio.run(main())
```

---

## 测试

### Pytest
```python
import pytest

# Simple test
def test_addition():
    assert 1 + 1 == 2

# Test with fixture
@pytest.fixture
def sample_data():
    return {'key': 'value'}

def test_with_fixture(sample_data):
    assert sample_data['key'] == 'value'

# Parametrized test
@pytest.mark.parametrize('input,expected', [
    (1, 2),
    (2, 4),
    (3, 6)
])
def test_double(input, expected):
    assert input * 2 == expected

# Test exceptions
def test_exception():
    with pytest.raises(ValueError):
        raise ValueError("Error")

# Mock example
from unittest.mock import Mock, patch

def test_with_mock():
    mock_func = Mock(return_value=42)
    assert mock_func() == 42
    mock_func.assert_called_once()
```

---

## 监控与指标

### Prometheus 客户端
```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Define metrics
requests_total = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')
active_users = Gauge('active_users', 'Active users')

# Use metrics
requests_total.inc()
active_users.set(100)

with request_duration.time():
    # Your code here
    time.sleep(0.1)

# Start metrics server
start_http_server(8000)
```

### 带上下文的日志
```python
import logging
from contextlib import contextmanager

@contextmanager
def log_context(**kwargs):
    extra = kwargs
    try:
        yield logging.LoggerAdapter(logger, extra)
    finally:
        pass

# Usage
with log_context(user_id=123, request_id='abc') as log:
    log.info('Processing request')
```

---

## 最佳实践

### 错误处理
```python
from typing import Optional

def safe_operation(param: str) -> Optional[dict]:
    """
    Perform operation with proper error handling.
    """
    try:
        result = risky_operation(param)
        return result
    except ValueError as e:
        logger.error(f"Value error: {e}")
        return None
    except Exception as e:
        logger.exception("Unexpected error occurred")
        raise
    finally:
        cleanup()

# Custom exceptions
class InfrastructureError(Exception):
    """Base exception for infrastructure errors"""
    pass

class DeploymentError(InfrastructureError):
    """Raised when deployment fails"""
    pass
```

### 类型注解
```python
from typing import List, Dict, Optional, Union

def process_data(
    items: List[str],
    config: Dict[str, any],
    timeout: Optional[int] = None
) -> Union[Dict, None]:
    """
    Process data with type hints for better IDE support.
    """
    result = {}
    for item in items:
        result[item] = process_item(item, config)
    return result
```

### 上下文管理器
```python
from contextlib import contextmanager

@contextmanager
def temporary_file(filename):
    """Create and cleanup temporary file"""
    f = open(filename, 'w')
    try:
        yield f
    finally:
        f.close()
        os.remove(filename)

# Usage
with temporary_file('temp.txt') as f:
    f.write('data')
```

---

## 实用工具

### 重试装饰器
```python
import time
from functools import wraps

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def unreliable_api_call():
    # Your code here
    pass
```

### 配置 Dataclass
```python
from dataclasses import dataclass, field
from typing import List

@dataclass
class AppConfig:
    host: str = 'localhost'
    port: int = 8000
    workers: int = 4
    allowed_hosts: List[str] = field(default_factory=list)
    debug: bool = False

config = AppConfig(host='0.0.0.0', workers=8)
```

---

**另见：**
- [Docker 速查表](./docker-cheat-sheet.md)
- [Kubernetes 速查表](./kubernetes-cheat-sheet.md)
- [Git 速查表](./git-cheat-sheet.md)
- [Linux 命令速查表](./linux-cheat-sheet.md)

> 译注：示例 API 可能随依赖版本变化。不要将实际数据库密码和云平台凭据写入源代码。
