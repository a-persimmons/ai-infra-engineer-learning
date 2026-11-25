# 练习 04：高级 Python 环境管理器

## 学习目标

完成本练习后，你将能够：
- 构建管理多个 Python 版本的工具。
- 自动创建及管理虚拟环境。
- 实现依赖冲突解析。
- 创建面向生产的 CLI 工具。
- 实践高级 Python 打包概念。

## 概览

在 AI/ML 基础设施中，管理多个 Python 版本与环境至关重要。不同项目需要不同的 Python 版本、依赖及配置。本练习将构建综合性的 Python 环境管理工具。

## 前置条件

- 已安装 Python 3.11+。
- 理解虚拟环境（venv、virtualenv）。
- 掌握依赖管理基础（pip、requirements.txt）。
- 熟悉 subprocess 与 CLI 开发。

## 问题描述

你需要构建 Python 环境管理器 `pyenvman`，具备以下能力：

1. **检测与管理多个 Python 版本**
   - 列出系统中的全部 Python 版本。
   - 下载并安装指定 Python 版本。
   - 为每个项目设置默认 Python 版本。

2. **虚拟环境自动化**
   - 使用指定 Python 版本创建虚拟环境。
   - 激活及退出环境。
   - 克隆现有环境。
   - 导出环境规格。

3. **依赖冲突解析**
   - 检测存在冲突的软件包版本。
   - 建议兼容版本组合。
   - 验证 requirements.txt 文件。
   - 生成锁文件以支持可复现性。

4. **项目脚手架**
   - 使用模板初始化 Python 项目。
   - 配置 pre-commit Hook。
   - 配置测试与静态检查。
   - 生成 CI/CD 配置。

## 需求

### 功能需求

#### FR1：Python 版本管理
- 列出系统安装的全部 Python 版本。
- 下载并安装 Python 版本（3.8 至 3.12+）。
- 从常见位置检测 Python 版本。
- 设置项目级 Python 版本。
- 支持系统 Python、pyenv、conda、asdf。

#### FR2：虚拟环境管理
- 使用指定 Python 版本创建虚拟环境。
- 列出全部虚拟环境。
- 激活环境（生成激活脚本）。
- 经确认后删除环境。
- 克隆环境（复制所有软件包）。
- 将环境导出为 requirements.txt/environment.yml。
- 从环境规格导入环境。

#### FR3：依赖管理
- 解析 requirements.txt 并检测冲突。
- 检查软件包与 Python 版本的兼容性。
- 建议兼容的版本范围。
- 生成 pip-compile 风格的锁文件。
- 将依赖更新至最新兼容版本。
- 对依赖进行安全审计（检查已知漏洞）。

#### FR4：项目初始化
- 从模板创建新项目（基础、FastAPI、ML 等）。
- 初始化 Git 仓库及 .gitignore。
- 安装 pre-commit Hook。
- 生成 README.md 模板。
- 创建采用现代配置的 pyproject.toml。
- 配置 pytest、mypy、black、ruff。

### 非功能需求

#### NFR1：性能
- 列表操作在 1 秒内完成。
- 安装操作显示进度条。
- 支持并发下载软件包。

#### NFR2：易用性
- 清晰、带颜色的 CLI 输出。
- 长时间运行的操作显示进度。
- 有帮助的错误信息及建议。
- 提供合理默认值的交互式提示。
- 支持 --quiet 与 --verbose 模式。

#### NFR3：可靠性
- 原子操作（失败时回滚）。
- 下载后验证软件包完整性。
- 执行破坏性操作前备份。
- 妥善处理网络故障。

#### NFR4：兼容性
- 支持 Linux、macOS、Windows。
- 支持系统 Python、pyenv、conda。
- 与 pip、poetry、pipenv 兼容。

## 实现任务

### 任务 1：Python 版本检测（4–5 小时）

构建检测全部 Python 安装的系统：

```python
# src/python_detector.py

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional
import subprocess

@dataclass
class PythonVersion:
    """Represents a Python installation"""
    version: str  # e.g., "3.11.5"
    path: Path
    manager: str  # "system", "pyenv", "conda", "asdf"
    is_virtual: bool = False

class PythonDetector:
    """Detect Python installations on the system"""

    def detect_all(self) -> List[PythonVersion]:
        """
        Detect all Python installations

        TODO: Implement detection logic:
        1. Search common system paths (/usr/bin, /usr/local/bin)
        2. Check pyenv installations (~/.pyenv/versions)
        3. Check conda environments
        4. Check asdf installations
        5. Deduplicate by version and path
        6. Sort by version (newest first)
        """
        pass

    def detect_system_python(self) -> List[PythonVersion]:
        """TODO: Find system Python installations"""
        pass

    def detect_pyenv(self) -> List[PythonVersion]:
        """TODO: Find pyenv Python installations"""
        pass

    def detect_conda(self) -> List[PythonVersion]:
        """TODO: Find conda Python environments"""
        pass

    def get_version_info(self, python_path: Path) -> Optional[PythonVersion]:
        """
        TODO: Get Python version from executable

        Hint: Run `python --version` and parse output
        """
        pass
```

**验收标准：**
- [ ] 检测 Linux/macOS/Windows 上的系统 Python。
- [ ] 检测 pyenv 安装（如果可用）。
- [ ] 检测 conda 环境（如果可用）。
- [ ] 返回排序后的列表（最新版本优先）。
- [ ] 妥善处理 Python 缺失。
- [ ] 单元测试覆盖率达到 80% 以上。

---

### 任务 2：虚拟环境管理器（5–6 小时）

实现虚拟环境创建与管理：

```python
# src/venv_manager.py

from pathlib import Path
from typing import List, Optional
import venv
import subprocess

class VenvManager:
    """Manage virtual environments"""

    def __init__(self, venv_dir: Path = Path.home() / ".pyenvman" / "venvs"):
        self.venv_dir = venv_dir
        self.venv_dir.mkdir(parents=True, exist_ok=True)

    def create(
        self,
        name: str,
        python_version: str,
        requirements: Optional[Path] = None,
        system_site_packages: bool = False
    ) -> Path:
        """
        Create a new virtual environment

        TODO:
        1. Find Python executable for specified version
        2. Create venv using venv module or virtualenv
        3. Upgrade pip, setuptools, wheel
        4. Install requirements if provided
        5. Create activation helper script
        6. Return path to created venv
        """
        pass

    def list_venvs(self) -> List[dict]:
        """
        TODO: List all virtual environments

        Return format:
        [
            {
                "name": "myproject",
                "path": Path("/home/user/.pyenvman/venvs/myproject"),
                "python_version": "3.11.5",
                "created": datetime(...),
                "size": "150 MB"
            },
            ...
        ]
        """
        pass

    def delete(self, name: str, confirm: bool = True) -> bool:
        """TODO: Delete virtual environment with confirmation"""
        pass

    def clone(self, source: str, target: str) -> Path:
        """
        TODO: Clone existing environment

        Steps:
        1. Export source env to requirements.txt
        2. Create new env with same Python version
        3. Install all packages from source
        """
        pass

    def export_requirements(self, name: str, output: Path) -> None:
        """TODO: Export environment to requirements.txt using pip freeze"""
        pass

    def activate_script(self, name: str) -> str:
        """
        TODO: Generate activation command

        Returns: Shell command to activate environment
        Example: "source /path/to/venv/bin/activate"
        """
        pass
```

**验收标准：**
- [ ] 使用指定 Python 版本创建虚拟环境。
- [ ] 列出全部虚拟环境及元数据。
- [ ] 确认后删除虚拟环境。
- [ ] 克隆虚拟环境并保留软件包。
- [ ] 导出至 requirements.txt。
- [ ] 生成激活脚本。
- [ ] 支持跨平台（Linux/macOS/Windows）。
- [ ] 单元测试覆盖率达到 80% 以上。

---

### 任务 3：依赖冲突解析器（6–7 小时）

构建检测与解析依赖冲突的工具：

```python
# src/dependency_resolver.py

from dataclasses import dataclass
from typing import List, Dict, Set, Optional
from packaging.requirements import Requirement
from packaging.version import Version
import requests

@dataclass
class PackageInfo:
    """Package metadata"""
    name: str
    version: str
    dependencies: List[str]
    python_requires: Optional[str] = None

@dataclass
class Conflict:
    """Dependency conflict"""
    package: str
    required_by: List[str]
    conflicting_versions: List[str]
    suggestion: Optional[str] = None

class DependencyResolver:
    """Resolve dependency conflicts"""

    def __init__(self):
        self.pypi_url = "https://pypi.org/pypi"

    def parse_requirements(self, requirements_file: Path) -> List[Requirement]:
        """
        TODO: Parse requirements.txt

        Handle:
        - Simple packages: "requests==2.31.0"
        - Version ranges: "numpy>=1.20.0,<2.0.0"
        - Git URLs: "git+https://..."
        - Local paths: "-e ./mypackage"
        - Comments and blank lines
        """
        pass

    def detect_conflicts(
        self,
        requirements: List[Requirement],
        python_version: str
    ) -> List[Conflict]:
        """
        TODO: Detect dependency conflicts

        Algorithm:
        1. Build dependency graph for all packages
        2. Check for conflicting version requirements
        3. Verify Python version compatibility
        4. Generate conflict report with suggestions
        """
        pass

    def get_package_info(self, package: str, version: Optional[str] = None) -> PackageInfo:
        """
        TODO: Fetch package info from PyPI

        Endpoint: GET https://pypi.org/pypi/{package}/json
        or: GET https://pypi.org/pypi/{package}/{version}/json
        """
        pass

    def suggest_resolution(self, conflict: Conflict) -> str:
        """
        TODO: Suggest resolution for conflict

        Example output:
        "Try using numpy>=1.21.0,<1.24.0 to satisfy both
         scikit-learn (requires numpy<1.24) and
         pandas (requires numpy>=1.21)"
        """
        pass

    def check_security(self, requirements: List[Requirement]) -> List[dict]:
        """
        TODO: Check for security vulnerabilities

        Use PyPI's safety database or integrate with pip-audit
        Return list of vulnerable packages with severity
        """
        pass

    def generate_lockfile(
        self,
        requirements: List[Requirement],
        python_version: str,
        output: Path
    ) -> None:
        """
        TODO: Generate pip-compile style lockfile

        Output format:
        # This file is autogenerated by pyenvman
        # Requirements:
        #   requests>=2.28.0
        # Generated for Python 3.11

        certifi==2023.7.22
            # via requests
        charset-normalizer==3.2.0
            # via requests
        ...
        """
        pass
```

**验收标准：**
- [ ] 解析复杂的 requirements.txt 文件。
- [ ] 检测版本冲突。
- [ ] 检查 Python 版本兼容性。
- [ ] 从 PyPI 获取软件包信息。
- [ ] 提供冲突解决建议。
- [ ] 检查安全漏洞。
- [ ] 生成包含依赖树的锁文件。
- [ ] 妥善处理网络错误。
- [ ] 使用模拟 PyPI 响应进行单元测试。

---

### 任务 4：项目脚手架（4–5 小时）

实现基于模板的项目初始化：

```python
# src/project_init.py

from pathlib import Path
from typing import Optional
import subprocess

class ProjectInitializer:
    """Initialize new Python projects"""

    TEMPLATES = {
        "basic": "Basic Python project with tests",
        "fastapi": "FastAPI web service",
        "ml": "Machine learning project with MLflow",
        "cli": "CLI application with click/typer",
    }

    def init_project(
        self,
        path: Path,
        template: str,
        python_version: str,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> None:
        """
        TODO: Initialize new project

        Steps:
        1. Create project directory structure
        2. Generate README.md
        3. Create pyproject.toml with modern config
        4. Set up git repository
        5. Add .gitignore
        6. Create virtual environment
        7. Install dev dependencies
        8. Set up pre-commit hooks
        9. Generate initial files from template
        """
        pass

    def create_structure(self, path: Path, template: str) -> None:
        """
        TODO: Create project directory structure

        Basic template:
        project/
        ├── src/
        │   └── __init__.py
        ├── tests/
        │   └── __init__.py
        ├── README.md
        ├── pyproject.toml
        ├── requirements.txt
        ├── requirements-dev.txt
        └── .gitignore

        FastAPI template:
        project/
        ├── app/
        │   ├── __init__.py
        │   ├── main.py
        │   ├── api/
        │   │   └── routes.py
        │   └── models/
        ├── tests/
        ├── Dockerfile
        ├── docker-compose.yml
        └── ...
        """
        pass

    def generate_pyproject_toml(
        self,
        path: Path,
        name: str,
        description: str,
        python_version: str
    ) -> None:
        """
        TODO: Generate modern pyproject.toml

        Include sections for:
        - [project] metadata
        - [build-system] (setuptools, hatchling, or poetry)
        - [tool.pytest.ini_options]
        - [tool.black]
        - [tool.ruff]
        - [tool.mypy]
        - [tool.coverage.run]
        """
        pass

    def setup_git(self, path: Path) -> None:
        """TODO: Initialize git repo with .gitignore"""
        pass

    def setup_precommit(self, path: Path) -> None:
        """
        TODO: Set up pre-commit hooks

        Include hooks for:
        - black (code formatting)
        - ruff (linting)
        - mypy (type checking)
        - pytest (tests must pass)
        """
        pass

    def generate_readme(
        self,
        path: Path,
        name: str,
        description: str
    ) -> None:
        """TODO: Generate README.md template"""
        pass
```

**验收标准：**
- [ ] 从模板创建项目结构。
- [ ] 生成采用现代配置的 pyproject.toml。
- [ ] 初始化 Git 仓库。
- [ ] 配置 pre-commit Hook。
- [ ] 创建完整 README。
- [ ] 支持多种模板（基础、FastAPI、ML、CLI）。
- [ ] 创建虚拟环境。
- [ ] 安装开发依赖。
- [ ] 单元测试覆盖率达到 80% 以上。

---

### 任务 5：CLI 应用（3–4 小时）

构建命令行界面：

```python
# src/cli.py

import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress
from pathlib import Path

console = Console()

@click.group()
@click.version_option()
def cli():
    """
    pyenvman - Advanced Python Environment Manager

    Manage Python versions, virtual environments, and dependencies
    """
    pass

@cli.group()
def python():
    """Manage Python versions"""
    pass

@python.command("list")
def python_list():
    """
    List all Python versions

    TODO:
    1. Use PythonDetector to find all Python installations
    2. Display in rich table with columns:
       - Version
       - Path
       - Manager (system/pyenv/conda)
       - Default (mark current default)
    3. Highlight recommended versions (3.11+)
    """
    pass

@python.command("install")
@click.argument("version")
def python_install(version: str):
    """
    Install Python version

    TODO:
    1. Download Python from python.org or use pyenv
    2. Show progress bar during download
    3. Install to ~/.pyenvman/pythons/{version}
    4. Verify installation
    """
    pass

@cli.group()
def venv():
    """Manage virtual environments"""
    pass

@venv.command("create")
@click.argument("name")
@click.option("--python", "-p", help="Python version")
@click.option("--requirements", "-r", type=click.Path(), help="Install from requirements.txt")
def venv_create(name: str, python: str, requirements: str):
    """
    Create virtual environment

    TODO:
    1. Use VenvManager to create venv
    2. Show progress during creation
    3. Display activation command
    """
    pass

@venv.command("list")
def venv_list():
    """
    List virtual environments

    TODO:
    1. Use VenvManager to list venvs
    2. Display in rich table
    3. Show size, Python version, created date
    """
    pass

@venv.command("delete")
@click.argument("name")
@click.option("--yes", "-y", is_flag=True, help="Skip confirmation")
def venv_delete(name: str, yes: bool):
    """Delete virtual environment"""
    pass

@cli.group()
def deps():
    """Manage dependencies"""
    pass

@deps.command("check")
@click.argument("requirements", type=click.Path(exists=True))
@click.option("--python", "-p", help="Python version")
def deps_check(requirements: str, python: str):
    """
    Check for dependency conflicts

    TODO:
    1. Use DependencyResolver to parse requirements
    2. Detect conflicts
    3. Display conflicts in red
    4. Show suggestions in green
    5. Exit with code 1 if conflicts found
    """
    pass

@deps.command("audit")
@click.argument("requirements", type=click.Path(exists=True))
def deps_audit(requirements: str):
    """
    Security audit dependencies

    TODO:
    1. Check for known vulnerabilities
    2. Display vulnerability report
    3. Show severity levels (critical/high/medium/low)
    4. Suggest safe versions
    """
    pass

@deps.command("lock")
@click.argument("requirements", type=click.Path(exists=True))
@click.option("--output", "-o", default="requirements.lock")
@click.option("--python", "-p", required=True)
def deps_lock(requirements: str, output: str, python: str):
    """Generate lockfile"""
    pass

@cli.group()
def project():
    """Initialize projects"""
    pass

@project.command("init")
@click.argument("path", type=click.Path())
@click.option("--template", "-t", type=click.Choice(["basic", "fastapi", "ml", "cli"]), default="basic")
@click.option("--name", "-n", help="Project name")
@click.option("--python", "-p", default="3.11", help="Python version")
def project_init(path: str, template: str, name: str, python: str):
    """
    Initialize new project

    TODO:
    1. Validate inputs
    2. Use ProjectInitializer to create project
    3. Show progress for each step
    4. Display next steps at completion
    """
    pass

if __name__ == "__main__":
    cli()
```

**验收标准：**
- [ ] 全部命令正常工作。
- [ ] 使用 rich 实现彩色输出。
- [ ] 长时间操作显示进度条。
- [ ] 支持交互式确认。
- [ ] 提供清晰错误信息。
- [ ] 所有命令均提供 --help 文本。
- [ ] 正确使用退出码（0 成功、1 错误）。

---

## 测试要求

### 单元测试

在 `tests/` 中创建全面的单元测试：

```python
# tests/test_python_detector.py
def test_detect_system_python():
    """Test system Python detection"""
    pass

def test_detect_pyenv():
    """Test pyenv detection"""
    pass

# tests/test_venv_manager.py
def test_create_venv():
    """Test venv creation"""
    pass

def test_list_venvs():
    """Test venv listing"""
    pass

def test_clone_venv():
    """Test venv cloning"""
    pass

# tests/test_dependency_resolver.py
def test_parse_requirements():
    """Test requirements.txt parsing"""
    pass

def test_detect_conflicts():
    """Test conflict detection"""
    pass

@pytest.mark.parametrize("package,expected", [
    ("requests", "2.31.0"),
    ("numpy", "1.25.2"),
])
def test_get_latest_version(package, expected):
    """Test fetching latest versions"""
    pass

# tests/test_cli.py
def test_cli_python_list(cli_runner):
    """Test 'python list' command"""
    result = cli_runner.invoke(cli, ["python", "list"])
    assert result.exit_code == 0

def test_cli_venv_create(cli_runner, tmp_path):
    """Test 'venv create' command"""
    pass
```

**测试覆盖率目标：** 80% 以上。

### 集成测试

```python
# tests/integration/test_full_workflow.py

def test_full_workflow(tmp_path):
    """
    Test complete workflow:
    1. Detect Python versions
    2. Create venv
    3. Install packages
    4. Check for conflicts
    5. Generate lockfile
    6. Clone venv
    """
    pass
```

---

## 交付物

1. **源代码**（`src/`）
   - `python_detector.py`——Python 版本检测。
   - `venv_manager.py`——虚拟环境管理。
   - `dependency_resolver.py`——依赖冲突解析。
   - `project_init.py`——项目脚手架。
   - `cli.py`——命令行界面。
   - `__init__.py`——软件包初始化。

2. **测试**（`tests/`）
   - 全部模块的单元测试（覆盖率 80% 以上）。
   - 集成测试。
   - 测试 Fixture 与 Mock。

3. **文档**
   - 包含用法示例的 README.md。
   - API 文档（Docstring）。
   - CONTRIBUTING.md。

4. **配置文件**
   - `pyproject.toml`——项目配置。
   - `requirements.txt`——生产依赖。
   - `requirements-dev.txt`——开发依赖。
   - `.pre-commit-config.yaml`——pre-commit Hook。

5. **CI/CD**
   - `.github/workflows/test.yml`——Push 时运行测试。
   - `.github/workflows/lint.yml`——代码质量检查。

---

## 额外挑战

1. **打包并发布至 PyPI**
   - 创建分发包。
   - 发布至 test.pypi.org。
   - 记录安装流程。

2. **Shell 自动补全**
   - 添加 bash/zsh 补全脚本。
   - 为全部命令支持 Tab 补全。

3. **配置文件支持**
   - 支持使用 `.pyenvman.toml` 设置项目配置。
   - 进入项目目录时自动激活虚拟环境。

4. **GUI/TUI 界面**
   - 使用 textual 构建终端界面。
   - 交互式环境管理。

5. **Docker 集成**
   - 为项目生成 Dockerfile。
   - 在 Docker 镜像中使用检测到的 Python 版本。

---

## 评分标准

| 标准 | 权重 | 描述 |
|---|---|---|
| **功能** | 30% | 全部功能正确工作 |
| **代码质量** | 25% | 代码清晰、结构合理、具备类型标注 |
| **测试** | 20% | 测试全面，覆盖率 80% 以上 |
| **文档** | 15% | 清晰的 README、Docstring 与示例 |
| **用户体验** | 10% | 直观的 CLI、实用的输出 |

**及格分数：** 70%。
**优秀：** 90% 以上。

---

## 资源

### 文档
- [venv 模块](https://docs.python.org/3/library/venv.html)
- [packaging 库](https://packaging.pypa.io/en/stable/)
- [PyPI JSON API](https://warehouse.pypa.io/api-reference/json.html)
- [Click 文档](https://click.palletsprojects.com/)
- [Rich 文档](https://rich.readthedocs.io/)

### 示例项目
- [pyenv](https://github.com/pyenv/pyenv)——Python 版本管理。
- [pipx](https://github.com/pypa/pipx)——安装 Python 应用。
- [poetry](https://github.com/python-poetry/poetry)——依赖管理。

### 工具
- pip-compile（pip-tools）。
- pip-audit（安全扫描）。
- safety（依赖安全）。

---

## 预计时长

- **任务 1**（Python 检测）：4–5 小时。
- **任务 2**（虚拟环境管理）：5–6 小时。
- **任务 3**（依赖解析）：6–7 小时。
- **任务 4**（项目初始化）：4–5 小时。
- **任务 5**（CLI）：3–4 小时。
- **测试：** 6–8 小时。
- **文档：** 2–3 小时。

**合计（原文）：** 30–38 小时。

---

## 提交

1. 将代码推送至 GitHub 仓库。
2. 确保 CI 中所有测试通过。
3. 提供完整 README，其中包含：
   - 安装说明。
   - 用法示例。
   - 截图或演示。
4. 录制 5 分钟演示视频（可选，但推荐）。

---

**祝练习顺利！这是一个值得纳入作品集的项目，可以展示面向生产的 Python 开发能力。**

> 译注：原文各项时长合计为 30–38 小时。虚拟环境通常不可直接跨机器复制，应使用目标解释器及锁定依赖重建；子进程不能直接修改父 Shell 的环境，需要由 Shell 执行生成的激活命令。完整依赖解析需考虑传递依赖、环境标记、平台、Python 版本及哈希等条件，建议复用成熟解析器。删除环境前校验路径并确认，安装包需验证来源。原始代码块与 TODO 保留，尚未实际运行测试。
