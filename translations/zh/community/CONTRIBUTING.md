# 为 AI 基础设施工程师学习课程作出贡献

感谢你有兴趣参与贡献！本文提供课程贡献指南。

## 贡献方式

### 1. 报告问题
- 文档拼写错误或其他错误。
- 代码 Bug 或其他问题。
- 失效链接。
- 过时信息。
- 难以理解的解释。

### 2. 提出改进建议
- 补充练习。
- 更好的示例。
- 新资源。
- 更新最佳实践。
- 替代方案。

### 3. 添加内容
- 新练习及解答。
- 补充示例。
- 测验题目。
- 项目创意。
- 文档改进。

### 4. 分享项目
- 你对项目的实现。
- 创意变体。
- 生产部署。
- 案例研究。

## 贡献流程

### 快速修复（拼写错误、链接等）

1. **Fork 仓库**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/ai-infra-engineer-learning.git
   cd ai-infra-engineer-learning
   ```

2. **创建分支**
   ```bash
   git checkout -b fix/typo-in-module-01
   ```

3. **进行修改**
   - 修复问题。
   - 在适用情况下进行测试。

4. **提交并推送**
   ```bash
   git add .
   git commit -m "Fix typo in Module 01 README"
   git push origin fix/typo-in-module-01
   ```

5. **创建 Pull Request**
   - 在 GitHub 上创建 PR。
   - 描述你的修改。
   - 如有相关 Issue，请附上链接。

### 较大贡献（新内容）

1. **先讨论**——创建 Issue，讨论你的想法。
2. **获取反馈**——确保符合课程目标。
3. **遵循格式**——与现有结构和风格保持一致。
4. **包含测试**——如果添加代码，应包含测试。
5. **更新文档**——更新相关文档。
6. **提交 PR**——创建描述清晰的 Pull Request。

## 风格指南

### 文档

- **使用清晰、简洁的语言。**
- 为复杂概念**提供示例**。
- **添加代码注释**，解释为什么这么做，而不仅仅解释做了什么。
- **遵循 Markdown 最佳实践。**
- **使用正确的标题层级。**

### 代码

```python
# ✅ Good: Clear, commented, follows TODO pattern
def train_model(config: ModelConfig) -> TrainedModel:
    """
    Train ML model with given configuration.

    Args:
        config: Model configuration object

    Returns:
        Trained model ready for evaluation

    TODO:
    1. Load training data
    2. Initialize model architecture
    3. Set up optimizer and loss function
    4. Train for specified epochs
    5. Save checkpoints
    6. Return trained model
    """
    # TODO: Implement training logic
    pass


# ❌ Avoid: No docs, no guidance
def train(c):
    pass
```

### 文件组织

```
# For new exercises:
lessons/XX-module-name/
├── exercises/
│   ├── exercise-01-name.md      # Problem statement
│   ├── exercise-01-starter.py   # Starter code with TODOs
│   └── solutions/
│       └── exercise-01-solution.py  # Full solution

# For new documentation:
- Use clear, descriptive filenames
- Keep related content together
- Update parent README to link to new content
```

## 测试贡献内容

提交之前：

1. **测试代码修改**
   ```bash
   # If you added/modified code:
   pytest tests/
   ```

2. **验证链接**
   - 检查全部链接正常工作。
   - 验证代码示例能够运行。
   - 测试所有 Shell 命令。

3. **检查格式**
   ```bash
   # Python code
   black src/
   flake8 src/
   ```

## Pull Request 模板

创建 PR 时，包含以下内容：

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Example/exercise addition

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Links verified

## Related Issues
Closes #123
```

## 表彰

贡献者将：
- 被列入 CONTRIBUTORS.md。
- 在发布说明中得到提及。
- 在修改的文件中得到署名。

## 不接受的内容

- **计分考核的答案**——希望学习者独立解决这些问题。
- **未经授权的版权材料**——仅接受原创或具有适当许可的材料。
- **与主题无关的内容**——必须与 AI 基础设施工程相关。
- **营销或推广内容**——不接受垃圾信息或自我推广。

## 贡献者资源

### 课程标准

- **学习目标**——每课、每个项目均应具有明确目标。
- **难度递进**——建立在此前内容之上。
- **现实相关性**——联系行业实践。
- **实践导向**——强调动手实现。

### 内容模板

练习、项目及文档的内容模板尚在规划中。目前新增内容可参考现有高质量示例：

- 新练习：复制 `lessons/mod-101-foundations/exercises/exercise-01-environment-setup.md` 的结构。
- 新项目：参考 `projects/project-101-basic-model-serving/README.md`。
- 新讲义：参考 `lessons/mod-1*-*/lecture-notes/` 下任意文件。

### 风格指南

- [Python 风格指南](https://peps.python.org/pep-0008/)
- [Markdown 风格指南](https://www.markdownguide.org/basic-syntax/)
- [文档最佳实践](https://www.writethedocs.org/guide/)

## 有问题？

- **一般问题：** [GitHub Discussions](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)
- **贡献相关问题：** 创建标题以 Question: 开头的 Issue。
- **电子邮件：** ai-infra-curriculum@joshua-ferguson.com

## 感谢

每一项贡献，无论大小，都能够帮助所有人获得更好的课程。感谢你投入的时间与精力。

---

**准备好贡献了吗？** [创建 Issue](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/issues/new)，或[发起讨论](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning/discussions)。

> 译注：内容模板中的 exercise-01-environment-setup.md 是原文所列路径，本仓库对应练习实际为 exercise-01-environment.md。
