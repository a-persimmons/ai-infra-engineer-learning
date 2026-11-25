# 实验 01：可复现的 Python 开发环境

**时长：** 45 分钟
**难度：** 入门
**前置条件：** macOS、Linux 或 Windows 上的 WSL2

## 目标

完成本实验后，你将拥有通过虚拟环境隔离的 Python 3.11+ 开发环境，其中包含代码规范检查、格式化、类型检查，以及每次提交时运行上述检查的 pre-commit 钩子。这是后续所有实验和项目所依赖的基础。

## 为什么重要

如果生产级 ML 平台唯一的验收标准是“在我的电脑上能运行”，就可能出现难以察觉的故障。建立与 CI 使用相同规范检查器、格式化工具和类型检查的可复现本地环境，可以消除一整类日常错误。

## 前置条件

- Python **3.11 或 3.12**（截至 2026 年，3.13 对某些 ML 库仍存在兼容性缺口）。
- 已安装并配置 Git（`git config user.email` 返回你的邮箱）。
- 可用的终端（macOS 上的 zsh、Linux 上的 bash）。

验证：

```bash
python3 --version    # expect Python 3.11.x or 3.12.x
git --version        # any 2.x is fine
```

## 步骤

### 1. 创建项目骨架

```bash
mkdir -p ~/ai-infra-labs/lab-01-env && cd ~/ai-infra-labs/lab-01-env
git init -q
echo "venv/" > .gitignore
echo "__pycache__/" >> .gitignore
echo ".ruff_cache/" >> .gitignore
echo ".mypy_cache/" >> .gitignore
```

### 2. 创建并激活虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate
# On Windows PowerShell: .\venv\Scripts\Activate.ps1

python --version   # should now be your project Python, isolated from system
which python       # expect a path inside venv/
```

### 3. 安装开发依赖

```bash
cat > requirements-dev.txt <<'EOF'
ruff>=0.5
mypy>=1.10
pre-commit>=3.7
pytest>=8.0
EOF

pip install --upgrade pip
pip install -r requirements-dev.txt
```

### 4. 添加一个真实的 Python 模块

```bash
mkdir -p src/labenv tests
cat > src/labenv/greet.py <<'EOF'
"""Tiny module to demonstrate the dev tooling."""
def hello(name: str) -> str:
    return f"hello, {name}"
EOF

cat > tests/test_greet.py <<'EOF'
from labenv.greet import hello

def test_hello_returns_personalized_message():
    assert hello("alice") == "hello, alice"
EOF

cat > pyproject.toml <<'EOF'
[project]
name = "labenv"
version = "0.0.1"
requires-python = ">=3.11"

[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E","F","W","I","UP","B","SIM"]

[tool.mypy]
strict = true

[tool.pytest.ini_options]
addopts = "-ra -q"
pythonpath = ["src"]
testpaths = ["tests"]
EOF
```

### 5. 手动运行工具链

```bash
ruff format src tests
ruff check src tests
mypy src
pytest
```

四项操作都应成功（格式化工具无输出表示成功；mypy 输出 `Success: no issues found`；pytest 输出 `1 passed`）。

### 6. 配置 pre-commit

```bash
cat > .pre-commit-config.yaml <<'EOF'
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.6
    hooks:
      - id: ruff-format
      - id: ruff
        args: [--fix]
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: []
        args: [--strict, --no-namespace-packages]
EOF

pre-commit install
git add -A
git commit -m "init: reproducible python dev environment"
```

提交操作应触发 ruff 和 mypy。若任何检查失败，修复后重新提交。

## 验证

正常工作的环境应满足以下全部条件：

- [ ] `python --version` 显示虚拟环境中的 Python，而不是系统 Python。
- [ ] `ruff format --check src tests` 返回 0。
- [ ] `mypy src` 返回 `Success: no issues found`。
- [ ] `pytest` 返回 1 passed。
- [ ] 在 `src/labenv/greet.py` 中制造语法错误并尝试提交时，pre-commit 钩子失败并阻止提交。

请明确测试最后一项：破坏文件，执行 `git add` 和 `git commit`，观察失败，然后修复并重新提交。

## 清理

```bash
deactivate
cd ~ && rm -rf ~/ai-infra-labs/lab-01-env
```

## 故障排查

- **`command not found: python3`** — macOS 上通过 `brew install python@3.11` 安装；Linux 上执行 `sudo apt install python3.11 python3.11-venv`。
- **`pre-commit install` 失败，提示找不到 .pre-commit-config.yaml** — 你在编写配置之前运行了安装命令。注意操作顺序。
- **mypy 提示 `--no-namespace-packages` 有问题** — 较旧的 mypy 版本不支持此参数；升级到 ≥1.10 或移除此参数。
- **测试找不到 `labenv` 包** — `pyproject.toml` 必须包含 `[tool.pytest.ini_options] pythonpath = ["src"]`。重新检查配置。
