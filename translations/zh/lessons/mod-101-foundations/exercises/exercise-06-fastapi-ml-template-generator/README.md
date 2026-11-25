# 练习 06：FastAPI ML 服务模板生成器

## 学习目标

完成本练习后，你将能够：
- 构建 ML API 服务的代码生成器。
- 实现面向生产的 FastAPI 最佳实践。
- 自动创建 OpenAPI 文档。
- 生成全面的测试框架。
- 理解生产环境 ML API 的常用模式。

## 概览

生产 ML 服务通常遵循共同的模式。本练习将构建一个模板生成器，用于创建面向生产的 FastAPI 模型服务，将项目初始化时间从数天缩短至数分钟。

## 前置条件

- Python 3.11+，熟悉 FastAPI、Pydantic。
- 理解 REST API 与 OpenAPI。
- 掌握 ML 模型服务基础概念。
- 了解测试框架（pytest）。

## 问题描述

构建模板生成器 `mlapi-gen`，用于创建：

1. **FastAPI 应用结构：** 遵循最佳实践。
2. **模型服务端点：** 包含输入输出验证。
3. **自动生成的 OpenAPI 文档：** 包含示例。
4. **全面的测试套件：** 包含 Fixture。
5. **Docker 部署：** 配置文件。
6. **CI/CD 流水线：** 支持测试及部署。

## 需求

### 功能需求

#### FR1：项目模板
支持多种 ML API 模板：
- **图像分类 API：** 上传图片，返回预测结果。
- **文本分类 API：** 输入文本，返回类别预测。
- **目标检测 API：** 输入图片，输出边界框。
- **时间序列预测 API：** 输入历史数据，返回未来预测。
- **通用 ML API：** 可定制输入与输出。

#### FR2：代码生成
生成完整、可运行的代码：
- 结构合理的 FastAPI 应用。
- 用于请求与响应验证的 Pydantic 模型。
- 模型加载与推理逻辑。
- 错误处理及日志。
- 健康检查及监控端点。
- 限流与身份验证（可选）。

#### FR3：OpenAPI 文档
自动生成全面的 API 文档：
- 包含示例的请求与响应 Schema。
- 错误响应文档。
- 每个端点的 cURL 示例。
- 身份验证文档。
- 性能特征。

#### FR4：测试基础设施
生成完整测试套件：
- 每个端点的单元测试。
- 完整工作流的集成测试。
- 性能与负载测试。
- 用于模拟模型的 Fixture。
- CI/CD 流水线配置。

#### FR5：部署配置
生成部署文件：
- 采用多阶段构建的 Dockerfile。
- 用于本地开发的 docker-compose.yml。
- Kubernetes Manifest（可选）。
- GitHub Actions 工作流。

### 非功能需求

#### NFR1：代码质量
- 生成的代码遵循 PEP 8。
- 全面使用类型标注。
- 提供完整的 Docstring。
- 不存在安全漏洞（原文目标）。

#### NFR2：可定制性
- 为项目名称及模型信息提供模板变量。
- 可插拔组件（身份验证、监控）。
- 易于扩展新模板。

#### NFR3：开发者体验
- 一条命令生成项目。
- 清晰的 README，包含配置说明。
- 请求与响应示例。
- 故障排查指南。

## 实现任务

### 任务 1：模板引擎（4–5 小时）

构建核心模板生成引擎：

```python
# src/template_engine.py

from pathlib import Path
from typing import Dict, Any, List
from jinja2 import Environment, FileSystemLoader, Template
from dataclasses import dataclass
import black
import isort

@dataclass
class ProjectConfig:
    """Project configuration"""
    name: str
    description: str
    template_type: str  # "image_classification", "text_classification", etc.
    model_path: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    python_version: str = "3.11"
    with_auth: bool = False
    with_rate_limiting: bool = False
    with_monitoring: bool = True

class TemplateEngine:
    """Generate ML API projects from templates"""

    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.env = Environment(
            loader=FileSystemLoader(templates_dir),
            trim_blocks=True,
            lstrip_blocks=True
        )

    def generate_project(
        self,
        config: ProjectConfig,
        output_dir: Path
    ) -> None:
        """
        TODO: Generate complete project

        Steps:
        1. Create directory structure
        2. Generate main application file
        3. Generate model files
        4. Generate test files
        5. Generate config files (Docker, CI/CD)
        6. Generate documentation
        7. Format all Python files with black + isort
        """
        pass

    def create_directory_structure(
        self,
        output_dir: Path,
        template_type: str
    ) -> None:
        """
        TODO: Create project directories

        Structure:
        project/
        ├── app/
        │   ├── __init__.py
        │   ├── main.py
        │   ├── api/
        │   │   ├── __init__.py
        │   │   └── endpoints.py
        │   ├── models/
        │   │   ├── __init__.py
        │   │   ├── schemas.py     # Pydantic models
        │   │   └── ml_model.py    # ML model wrapper
        │   ├── core/
        │   │   ├── __init__.py
        │   │   ├── config.py
        │   │   └── logging.py
        │   └── utils/
        │       └── __init__.py
        ├── tests/
        │   ├── __init__.py
        │   ├── test_api.py
        │   ├── test_model.py
        │   └── conftest.py
        ├── models/
        │   └── .gitkeep
        ├── Dockerfile
        ├── docker-compose.yml
        ├── requirements.txt
        ├── requirements-dev.txt
        ├── pyproject.toml
        ├── README.md
        └── .github/
            └── workflows/
                └── test.yml
        """
        pass

    def render_template(
        self,
        template_name: str,
        context: Dict[str, Any]
    ) -> str:
        """
        TODO: Render Jinja2 template

        ```python
        template = self.env.get_template(template_name)
        rendered = template.render(**context)

        # Format Python files
        if template_name.endswith('.py.j2'):
            rendered = black.format_str(rendered, mode=black.Mode())
            rendered = isort.code(rendered)

        return rendered
        ```
        """
        pass

    def generate_file(
        self,
        template_name: str,
        output_path: Path,
        context: Dict[str, Any]
    ) -> None:
        """TODO: Generate single file from template"""
        pass

    def validate_config(self, config: ProjectConfig) -> List[str]:
        """
        TODO: Validate project configuration

        Check:
        - Name is valid Python package name
        - Template type exists
        - Schemas are valid
        - Model path exists (if provided)

        Return list of validation errors
        """
        pass
```

**验收标准：**
- [ ] 创建完整目录结构。
- [ ] 正确渲染 Jinja2 模板。
- [ ] 使用 black 与 isort 格式化 Python 代码。
- [ ] 验证配置。
- [ ] 妥善处理模板错误。

---

### 任务 2：FastAPI 应用模板（6–7 小时）

为 FastAPI 应用创建 Jinja2 模板：

```python
# templates/app/main.py.j2

"""
{{ project_name }} - {{ project_description }}

Auto-generated FastAPI ML service
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
{% if with_monitoring %}
from prometheus_fastapi_instrumentator import Instrumentator
{% endif %}
{% if with_rate_limiting %}
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
{% endif %}

from app.api import endpoints
from app.core.config import settings
from app.core.logging import setup_logging

# Set up logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title="{{ project_name }}",
    description="{{ project_description }}",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

{% if with_rate_limiting %}
# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
{% endif %}

{% if with_monitoring %}
# Prometheus metrics
Instrumentator().instrument(app).expose(app)
{% endif %}

# Include routers
app.include_router(
    endpoints.router,
    prefix="/api/v1",
    tags=["predictions"]
)

@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint

    Returns:
        dict: Service health status
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "model_loaded": endpoints.model_loaded
    }

@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "{{ project_name }}",
        "description": "{{ project_description }}",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

```python
# templates/app/api/endpoints.py.j2

"""
API endpoints for {{ project_name }}
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
{% if with_rate_limiting %}
from slowapi import Limiter
from slowapi.util import get_remote_address
{% endif %}
from typing import List
import logging

from app.models.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse
)
from app.models.ml_model import MLModel

logger = logging.getLogger(__name__)

router = APIRouter()
{% if with_rate_limiting %}
limiter = Limiter(key_func=get_remote_address)
{% endif %}

# Load model on startup
model = MLModel.load("{{ model_path }}")
model_loaded = model is not None

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=200,
    summary="Make a prediction",
    description="Submit input data and receive model predictions"
)
{% if with_rate_limiting %}
@limiter.limit("10/minute")
{% endif %}
async def predict(request: PredictionRequest):
    """
    Make a single prediction

    TODO: Implement prediction logic
    - Validate input
    - Run model inference
    - Format output
    - Handle errors
    """
    try:
        if not model_loaded:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded"
            )

        # Run prediction
        result = model.predict(request.dict())

        return PredictionResponse(
            prediction=result["prediction"],
            confidence=result.get("confidence"),
            metadata=result.get("metadata")
        )

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch predictions",
    description="Submit multiple inputs for batch prediction"
)
async def predict_batch(request: BatchPredictionRequest):
    """
    TODO: Implement batch prediction

    - Process multiple inputs efficiently
    - Return predictions for all inputs
    """
    pass

{% if template_type == "image_classification" %}
@router.post(
    "/predict/image",
    response_model=PredictionResponse,
    summary="Image classification",
    description="Upload image for classification"
)
async def predict_image(file: UploadFile = File(...)):
    """
    TODO: Implement image prediction

    - Validate image format
    - Preprocess image
    - Run inference
    - Return top-K predictions
    """
    pass
{% endif %}

{% if template_type == "object_detection" %}
@router.post(
    "/predict/detect",
    summary="Object detection",
    description="Detect objects in image"
)
async def detect_objects(file: UploadFile = File(...)):
    """
    TODO: Implement object detection

    - Load image
    - Run detection
    - Return bounding boxes, labels, scores
    """
    pass
{% endif %}
```

```python
# templates/app/models/schemas.py.j2

"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, Field, validator
from typing import Any, Dict, List, Optional
{% if template_type == "image_classification" %}
from enum import Enum
{% endif %}

class PredictionRequest(BaseModel):
    """
    Prediction request schema

    TODO: Customize based on your model's input
    """
    {% for field_name, field_config in input_schema.items() %}
    {{ field_name }}: {{ field_config.type }} = Field(
        ...,
        description="{{ field_config.description }}",
        example={{ field_config.example }}
    )
    {% endfor %}

    class Config:
        schema_extra = {
            "example": {{ input_example | tojson }}
        }

class PredictionResponse(BaseModel):
    """
    Prediction response schema
    """
    prediction: Any = Field(..., description="Model prediction")
    confidence: Optional[float] = Field(None, description="Prediction confidence")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    class Config:
        schema_extra = {
            "example": {
                "prediction": "cat",
                "confidence": 0.95,
                "metadata": {
                    "model_version": "1.0.0",
                    "inference_time_ms": 45
                }
            }
        }

class BatchPredictionRequest(BaseModel):
    """Batch prediction request"""
    inputs: List[PredictionRequest] = Field(
        ...,
        description="List of inputs for batch prediction",
        min_items=1,
        max_items=100
    )

class BatchPredictionResponse(BaseModel):
    """Batch prediction response"""
    predictions: List[PredictionResponse]
    batch_size: int
    total_time_ms: float
```

```python
# templates/app/models/ml_model.py.j2

"""
ML Model wrapper for {{ project_name }}
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional
import numpy as np
{% if template_type == "image_classification" %}
from PIL import Image
import torchvision.transforms as transforms
{% endif %}

logger = logging.getLogger(__name__)

class MLModel:
    """
    ML Model wrapper

    TODO: Implement model loading and inference
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path
        self.model = None
        self.loaded = False

    @classmethod
    def load(cls, model_path: str) -> "MLModel":
        """
        TODO: Load model from disk

        ```python
        instance = cls(Path(model_path))

        # Load model based on framework
        # PyTorch:
        # instance.model = torch.load(model_path)

        # TensorFlow:
        # instance.model = tf.keras.models.load_model(model_path)

        # ONNX:
        # instance.model = onnxruntime.InferenceSession(model_path)

        instance.loaded = True
        logger.info(f"Model loaded from {model_path}")
        return instance
        ```
        """
        pass

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO: Run inference

        ```python
        if not self.loaded:
            raise RuntimeError("Model not loaded")

        # Preprocess input
        processed_input = self._preprocess(input_data)

        # Run inference
        with torch.no_grad():  # or equivalent
            output = self.model(processed_input)

        # Postprocess output
        result = self._postprocess(output)

        return result
        ```
        """
        pass

    def _preprocess(self, input_data: Dict[str, Any]) -> Any:
        """
        TODO: Preprocess input data

        - Normalize
        - Resize
        - Convert types
        - Validate shape
        """
        pass

    def _postprocess(self, model_output: Any) -> Dict[str, Any]:
        """
        TODO: Postprocess model output

        - Apply softmax/sigmoid
        - Get top-K predictions
        - Format as dict
        """
        pass

{% if template_type == "image_classification" %}
    def _load_image(self, image_bytes: bytes) -> Image.Image:
        """TODO: Load and validate image"""
        pass

    def _transform_image(self, image: Image.Image) -> Any:
        """
        TODO: Transform image for model

        ```python
        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        return transform(image)
        ```
        """
        pass
{% endif %}
```

**验收标准：**
- [ ] FastAPI 应用模板完整。
- [ ] 端点具备恰当的验证。
- [ ] 自动生成带示例的 OpenAPI 文档。
- [ ] 错误处理全面。
- [ ] 代码遵循最佳实践。

---

### 任务 3：测试生成（5–6 小时）

生成全面的测试套件：

```python
# templates/tests/test_api.py.j2

"""
API endpoint tests for {{ project_name }}
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "name" in response.json()

def test_predict_valid_input():
    """
    TODO: Test prediction with valid input

    ```python
    response = client.post(
        "/api/v1/predict",
        json={
            # Valid input based on schema
        }
    )
    assert response.status_code == 200
    result = response.json()
    assert "prediction" in result
    assert "confidence" in result
    ```
    """
    pass

def test_predict_invalid_input():
    """
    TODO: Test prediction with invalid input

    Should return 422 Unprocessable Entity
    """
    pass

def test_predict_batch():
    """TODO: Test batch prediction"""
    pass

{% if template_type == "image_classification" %}
def test_predict_image(sample_image):
    """TODO: Test image prediction with fixture"""
    pass
{% endif %}

def test_rate_limiting():
    """
    TODO: Test rate limiting (if enabled)

    Make multiple requests and verify rate limit is enforced
    """
    pass

@pytest.mark.performance
def test_prediction_latency():
    """
    TODO: Test prediction latency

    Assert prediction completes in < 100ms (adjust based on model)
    """
    pass
```

```python
# templates/tests/conftest.py.j2

"""
Pytest fixtures for {{ project_name }}
"""

import pytest
from pathlib import Path
import numpy as np
{% if template_type == "image_classification" %}
from PIL import Image
from io import BytesIO
{% endif %}

@pytest.fixture
def sample_input():
    """
    TODO: Sample input fixture

    ```python
    return {
        # Sample valid input
    }
    ```
    """
    pass

@pytest.fixture
def mock_model(monkeypatch):
    """
    TODO: Mock ML model for testing

    ```python
    class MockModel:
        def predict(self, input_data):
            return {
                "prediction": "mock_class",
                "confidence": 0.95
            }

    # Patch model loading
    monkeypatch.setattr(
        "app.models.ml_model.MLModel.load",
        lambda path: MockModel()
    )
    ```
    """
    pass

{% if template_type == "image_classification" %}
@pytest.fixture
def sample_image():
    """
    TODO: Generate sample image

    ```python
    # Create sample RGB image
    img = Image.new('RGB', (224, 224), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes
    ```
    """
    pass
{% endif %}
```

**验收标准：**
- [ ] 测试套件覆盖全部端点。
- [ ] 提供用于模拟模型的 Fixture。
- [ ] 包含性能测试。
- [ ] 生成的代码通过测试。

---

### 任务 4：部署配置（3–4 小时）

生成 Docker 与 CI/CD 配置：

```dockerfile
# templates/Dockerfile.j2

# Multi-stage build for {{ project_name }}

# Stage 1: Builder
FROM python:{{ python_version }}-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:{{ python_version }}-slim

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Add user for running app
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# Copy application code
COPY --chown=appuser:appuser app/ /app/app/
COPY --chown=appuser:appuser models/ /app/models/

# Switch to non-root user
USER appuser

# Update PATH
ENV PATH=/root/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# templates/docker-compose.yml.j2

version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: {{ project_name }}_api
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=info
      - MODEL_PATH=/app/models/model.pt
    volumes:
      - ./models:/app/models:ro
      - ./app:/app/app:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

{% if with_monitoring %}
  prometheus:
    image: prom/prometheus:latest
    container_name: {{ project_name }}_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: {{ project_name }}_grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
{% endif %}

{% if with_monitoring %}
volumes:
  grafana_data:
{% endif %}
```

```yaml
# templates/.github/workflows/test.yml.j2

name: Test {{ project_name }}

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '{{ python_version }}'

    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('requirements*.txt') }}

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install -r requirements-dev.txt

    - name: Lint with ruff
      run: ruff check app/ tests/

    - name: Type check with mypy
      run: mypy app/

    - name: Test with pytest
      run: pytest tests/ -v --cov=app --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage.xml

  docker:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Build Docker image
      run: docker build -t {{ project_name }}:test .

    - name: Test Docker image
      run: |
        docker run -d -p 8000:8000 --name test_api {{ project_name }}:test
        sleep 10
        curl -f http://localhost:8000/health || exit 1
        docker stop test_api
```

**验收标准：**
- [ ] Dockerfile 成功构建。
- [ ] 多阶段构建减少镜像体积。
- [ ] docker-compose.yml 在本地正常工作。
- [ ] CI/CD 流水线运行全部测试。
- [ ] 已配置健康检查。

---

### 任务 5：CLI 与文档（3–4 小时）

构建 CLI 并生成文档：

```python
# src/cli.py

import click
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt, Confirm

from .template_engine import TemplateEngine, ProjectConfig

console = Console()

@click.group()
def cli():
    """mlapi-gen - FastAPI ML Service Generator"""
    pass

@cli.command()
@click.argument("name")
@click.option("--template", "-t", type=click.Choice([
    "image_classification",
    "text_classification",
    "object_detection",
    "time_series",
    "generic"
]), default="generic")
@click.option("--output", "-o", type=click.Path(), default=".")
@click.option("--interactive", "-i", is_flag=True, help="Interactive mode")
def generate(name, template, output, interactive):
    """
    Generate ML API project

    TODO: Implement generation logic
    - Prompt for configuration if interactive
    - Validate inputs
    - Generate project
    - Display next steps
    """
    pass

@cli.command()
def list_templates():
    """List available templates"""
    console.print("[bold]Available Templates:[/bold]")
    templates = {
        "image_classification": "Image classification API (CNN models)",
        "text_classification": "Text classification API (BERT, transformers)",
        "object_detection": "Object detection API (YOLO, Faster R-CNN)",
        "time_series": "Time series prediction API",
        "generic": "Generic ML API (customizable)"
    }
    for name, desc in templates.items():
        console.print(f"  [cyan]{name}[/cyan]: {desc}")
```

````markdown
# templates/README.md.j2

# {{ project_name }}

{{ project_description }}

Auto-generated FastAPI ML service by mlapi-gen.

## Features

- ✅ FastAPI application with async support
- ✅ Pydantic validation for request/response
- ✅ Auto-generated OpenAPI documentation
- ✅ Comprehensive test suite
- ✅ Docker containerization
- ✅ CI/CD with GitHub Actions
{% if with_monitoring %}
- ✅ Prometheus metrics + Grafana dashboards
{% endif %}
{% if with_rate_limiting %}
- ✅ Rate limiting
{% endif %}
{% if with_auth %}
- ✅ JWT authentication
{% endif %}

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Place your model**:
   ```bash
   cp your_model.pt models/model.pt
   ```

3. **Run the API**:
   ```bash
   uvicorn app.main:app --reload
   ```

4. **Open API docs**: http://localhost:8000/docs

### Docker

```bash
# Build image
docker build -t {{ project_name }} .

# Run container
docker run -p 8000:8000 {{ project_name }}
```

### Docker Compose

```bash
docker-compose up
```

## API Endpoints

### POST /api/v1/predict

Make a prediction.

**Request**:
```json
{{ request_example | tojson(indent=2) }}
```

**Response**:
```json
{
  "prediction": "cat",
  "confidence": 0.95,
  "metadata": {
    "model_version": "1.0.0",
    "inference_time_ms": 45
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{{ request_example | tojson }}'
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Performance tests
pytest tests/ -m performance
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

## Monitoring

{% if with_monitoring %}
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
{% endif %}

## License

MIT
````

**验收标准：**
- [ ] CLI 以交互方式生成项目。
- [ ] README 内容全面。
- [ ] 文档包含示例。
- [ ] 后续步骤清晰。

---

## 交付物

1. **源代码**（`src/`）
   - 模板引擎。
   - Jinja2 模板。
   - CLI 应用。

2. **模板**（`templates/`）
   - FastAPI 应用模板。
   - 测试模板。
   - Docker 模板。
   - CI/CD 模板。
   - 文档模板。

3. **测试**（`tests/`）
   - 模板引擎的单元测试。
   - 生成项目的集成测试。

4. **文档**
   - 包含使用指南的 README。
   - 模板定制指南。
   - 生成项目的示例。

---

## 评分标准

| 标准 | 权重 |
|---|---|
| **生成代码质量** | 30% |
| **模板完整性** | 25% |
| **文档** | 20% |
| **测试** | 15% |
| **用户体验** | 10% |

**及格：** 70% 以上。
**优秀：** 90% 以上。

---

## 预计时长

- **任务 1：** 4–5 小时。
- **任务 2：** 6–7 小时。
- **任务 3：** 5–6 小时。
- **任务 4：** 3–4 小时。
- **任务 5：** 3–4 小时。
- **测试：** 4–5 小时。
- **文档：** 2–3 小时。

**合计：** 27–34 小时。

---

**这是一个实用、值得纳入作品集的项目，能够展示面向生产的 FastAPI 与代码生成能力。**

> 译注：原文 README.j2 示例的外层 Markdown 围栏与内部围栏冲突，中文版本将外层调整为四个反引号，内部模板内容原样保留。生成代码需要额外进行安全审计，不能仅凭模板保证无漏洞；应验证输入长度、文件大小、模型来源、认证授权、配置及模板变量，并避免路径穿越。原始代码与 TODO 保留，未实际执行生成器或部署测试。
