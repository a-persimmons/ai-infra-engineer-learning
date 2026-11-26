# 为 AI 基础设施工程师学习路线做贡献

感谢你有兴趣参与贡献！本文提供了为本项目做贡献的指南。

## 目录

- [行为准则](#行为准则)
- [我可以怎样贡献？](#我可以怎样贡献)
- [开始贡献](#开始贡献)
- [贡献指南](#贡献指南)
- [风格指南](#风格指南)
- [提交信息指南](#提交信息指南)
- [拉取请求流程](#拉取请求流程)
- [社区](#社区)

---

## 行为准则

本项目遵循所有贡献者都应遵守的行为准则。贡献前请阅读 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

**简而言之：**
- 尊重他人，保持包容
- 欢迎新成员
- 专注于建设性反馈
- 相信他人的善意

---

## 我可以怎样贡献？

### 🐛 报告 Bug

发现 Bug 了吗？帮助我们修复它！

**提交前：**
- 检查该问题是否已经存在
- 确认它不在已知问题列表中
- 使用最新版本测试

**提交 Bug 报告：**
1. 使用 Bug 报告模板
2. 提供清晰的标题与描述
3. 包含复现步骤
4. 添加错误信息或截图
5. 说明你的环境（操作系统、Python 版本等）

### 💡 提出改进建议

有改善课程的想法吗？

**提交改进建议：**
1. 检查是否已有人提出
2. 使用功能请求模板
3. 说明使用场景
4. 描述拟议解决方案
5. 考虑实现复杂度

### 📚 改进文档

我们始终欢迎文档改进！

**可贡献的方面：**
- 修复拼写错误或不清晰的说明
- 添加更多示例
- 改进代码注释
- 翻译为其他语言
- 添加图表或可视化

### 🧪 添加练习

帮助学习者进行更多实践！

**练习指南：**
- 应巩固课程中的概念
- 包含明确的要求
- 提供起始代码
- 在独立分支中添加解决方案
- 标注难度等级

### 🎯 创建项目

提出新的实践项目！

**项目要求：**
- 与课程难度相匹配
- 包含全面的 README
- 提供带有 TODO 注释的代码桩
- 添加测试
- 编写架构文档

### ✅ 审查拉取请求

帮助审查贡献！

**审查指南：**
- 保持建设性和友善
- 在本地测试变更
- 检查清晰度和完整性
- 验证代码质量
- 确保文档已更新

---

## 开始贡献

### 1. Fork 仓库

```bash
# Click "Fork" button on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/ai-infra-engineer-learning.git
cd ai-infra-engineer-learning
```

### 2. 配置开发环境

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies

# Install pre-commit hooks
pre-commit install
```

### 3. 创建分支

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/bug-description
```

### 4. 进行修改

遵循下文的风格指南。

### 5. 测试修改

```bash
# Run tests
pytest

# Check code style
flake8 .
black --check .

# Validate markdown
markdownlint **/*.md
```

### 6. 提交并推送

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add: Feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### 7. 创建拉取请求

- 在 GitHub 上进入你的 Fork
- 点击 “New Pull Request”
- 填写 PR 模板
- 关联相关 Issue
- 请求审查

---

## 贡献指南

### 课程讲义贡献

**结构：**
- 遵循现有讲义格式
- 包含学习目标
- 添加实践练习
- 提供自测问题
- 包含总结部分

**内容：**
- 使用清晰、简洁的语言
- 先解释概念，再展示代码
- 包含真实世界的示例
- 在适当之处添加图表
- 对统计数据或引文注明来源

**代码示例：**
- 应完整且可运行
- 包含必要的导入
- 添加行内注释
- 遵循 Python 最佳实践
- 提交前测试全部代码

### 项目贡献

**要求：**
- 全面的 README，包括：
  - 项目概览
  - 学习目标
  - 前置条件
  - 配置说明
  - 架构图
- 带有 TODO 注释的代码桩
- 测试文件
- 文档模板
- .env.example 文件

**代码质量：**
- 函数签名使用类型提示
- 所有函数和类均提供文档字符串
- 错误处理
- 在适当之处记录日志
- 通过环境变量进行配置

### 文档贡献

**Markdown 风格：**
- 按层级使用标题（# > ## > ###）
- 为长文档添加目录
- 代码块标注语言
- 为图片添加替代文本
- 将每行长度控制在 120 个字符以内

**内容：**
- 面向初学者写作
- 定义技术术语
- 使用主动语态
- 保持简洁
- 包含示例

---

## 风格指南

### Python 代码风格

我们遵循 **PEP 8**，并进行了一些调整：

```python
# Use type hints
def train_model(data: np.ndarray, epochs: int = 10) -> torch.nn.Module:
    """
    Train a machine learning model.

    Args:
        data: Training data as numpy array
        epochs: Number of training epochs (default: 10)

    Returns:
        Trained PyTorch model
    """
    pass

# Use descriptive variable names
model_checkpoint_path = "/data/checkpoints"  # Good
mcp = "/data/checkpoints"  # Bad

# Add docstrings to all public functions
# Use Google-style docstrings
```

**工具：**
- **black**：代码格式化工具（行长度：100）
- **flake8**：代码检查工具
- **mypy**：类型检查工具
- **isort**：导入语句排序工具

### Markdown 风格

```markdown
# Use ATX-style headers

## Add blank lines around headers

Use **bold** for emphasis, *italic* for terms.

\`\`\`python
# Always specify language in code blocks
def example():
    pass
\`\`\`

- Use hyphens for unordered lists
1. Use numbers for ordered lists
```

### 文档风格

**文件命名：**
- 使用小写字母和连字符：`getting-started.md`
- 使用具有描述性的名称：例如 `aws-ml-infrastructure.md`，而不是 `aws.md`

**结构：**
- 以标题和简短说明开头
- 为超过 500 个单词的文档添加目录
- 使用一致的标题层级
- 以“下一步”或“总结”结尾

---

## 提交信息指南

我们遵循 **Conventional Commits（约定式提交）** 规范：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

- **feat**：新功能
- **fix**：Bug 修复
- **docs**：文档变更
- **style**：代码风格变更（格式化，不改变逻辑）
- **refactor**：代码重构
- **test**：添加或更新测试
- **chore**：维护任务

### 示例

```bash
# Feature
git commit -m "feat(module-01): Add Docker basics lesson"

# Bug fix
git commit -m "fix(project-01): Correct FastAPI endpoint validation"

# Documentation
git commit -m "docs(readme): Update installation instructions"

# With body
git commit -m "feat(module-02): Add AWS ML infrastructure lesson

- Add EC2 GPU instance configuration
- Include S3 storage best practices
- Add code examples for SageMaker

Closes #123"
```

### 最佳实践

- 使用祈使语气：使用 “Add feature”，而非 “Added feature”
- 将主题行长度控制在 72 个字符以内
- 主题行首字母大写
- 不在主题末尾添加句号
- 主题与正文之间留一个空行
- 正文每行在 72 个字符处换行
- 在页脚引用相关 Issue

---

## 拉取请求流程

### 提交前

- [ ] 代码遵循风格指南
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 提交信息符合规范
- [ ] 分支与 main 保持同步

### PR 模板

填写所有部分：

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass

## Related Issues
Closes #123
```

### 审查流程

1. **自动检查**：CI/CD 自动运行
   - 测试必须通过
   - 代码检查必须通过
   - 保持代码覆盖率

2. **人工审查**：至少一位维护者进行审查
   - 代码质量
   - 文档
   - 测试覆盖率
   - 设计决策

3. **反馈**：处理审查意见
   - 完成所要求的修改
   - 将更新推送到同一分支
   - 回复评论

4. **合并**：获得批准后
   - 维护者将进行合并
   - 合并后删除你的分支
   - 更新你的 Fork

### 合并后

- 更新你的 Fork：
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

- 删除已合并的分支：
  ```bash
  git branch -d feature/your-feature-name
  git push origin --delete feature/your-feature-name
  ```

---

## 开发环境配置

### 所需工具

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Includes:
# - pytest (testing)
# - black (formatting)
# - flake8 (linting)
# - mypy (type checking)
# - pre-commit (git hooks)
# - markdownlint (markdown linting)
```

### Pre-commit 钩子

我们使用 pre-commit 保证代码质量：

```bash
# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

**钩子包括：**
- trailing-whitespace：移除行尾空白
- end-of-file-fixer：确保文件以换行符结尾
- check-yaml：验证 YAML 文件
- black：格式化 Python 代码
- flake8：检查 Python 代码
- markdownlint：检查 Markdown 文件

### 运行测试

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_module_01.py

# Run with coverage
pytest --cov=src tests/

# Run specific test
pytest tests/test_api.py::test_health_endpoint
```

### 构建文档

```bash
# Preview markdown locally
# Install grip: pip install grip

# Preview README
grip README.md

# Preview in browser
grip README.md --browser
```

---

## 社区

### 获取帮助

- **GitHub Discussions**：提问、分享想法
- **Issue Tracker**：报告 Bug、请求功能

目前没有安排实时聊天或定期答疑活动。如果你希望组织学习小组，请发起 Discussion。

### 表彰贡献

贡献者将获得以下形式的表彰：
- README 的贡献者部分
- 重大贡献将在发布说明中提及
- 重要贡献将进入荣誉榜

### 成为维护者

活跃的贡献者可能受到邀请，成为维护者：

**标准：**
- 持续提供高质量贡献
- 充分理解项目目标
- 在审查与讨论中乐于提供帮助
- 认同并致力于项目价值观

**职责：**
- 审查拉取请求
- 对 Issue 进行分类和处理
- 维护代码质量
- 帮助制定项目发展方向

---

## 有问题？

- 阅读 [FAQ](./resources/faq.md)
- 在 [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions) 中提问
- 创建带有 “question” 标签的 Issue

---

## 许可证

通过参与贡献，你同意你的贡献将采用 MIT 许可证授权。

---

<div align="center">

**感谢你的贡献！🎉**

每一份贡献，无论大小，都能让这份学习资源变得更好，惠及所有学习者。

[返回 README](./README.md)

</div>
