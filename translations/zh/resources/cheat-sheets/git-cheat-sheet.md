# Git 速查表

常用 Git 命令与工作流快速参考。

---

## 入门

### 配置
```bash
# Set user name
git config --global user.name "Your Name"

# Set email
git config --global user.email "your.email@example.com"

# Set default editor
git config --global core.editor "vim"

# View configuration
git config --list

# View specific config
git config user.name

# Set default branch name
git config --global init.defaultBranch main
```

### 初始化仓库
```bash
# Initialize new repo
git init

# Clone existing repo
git clone <url>

# Clone to specific directory
git clone <url> <directory-name>

# Clone specific branch
git clone -b <branch-name> <url>

# Shallow clone (faster, less history)
git clone --depth 1 <url>
```

---

## 基础命令

### 状态与信息
```bash
# View status
git status

# Short status
git status -s

# View commit history
git log

# One line per commit
git log --oneline

# Graph view
git log --graph --oneline --all

# Show last N commits
git log -n 5

# Show commits by author
git log --author="Name"

# Show commits with diff
git log -p

# Show specific file history
git log -- <file-path>
```

### 暂存与提交
```bash
# Stage file
git add <file>

# Stage all changes
git add .
git add -A

# Stage specific pattern
git add *.py

# Interactive staging
git add -i

# Stage parts of file
git add -p <file>

# Commit staged changes
git commit -m "Commit message"

# Commit with detailed message
git commit

# Stage and commit in one
git commit -am "Message"

# Amend last commit
git commit --amend

# Amend without changing message
git commit --amend --no-edit
```

---

## 分支

### 创建与切换
```bash
# List branches
git branch

# List all branches (including remote)
git branch -a

# Create branch
git branch <branch-name>

# Create and switch to branch
git checkout -b <branch-name>
git switch -c <branch-name>  # Newer syntax

# Switch branch
git checkout <branch-name>
git switch <branch-name>  # Newer syntax

# Delete branch
git branch -d <branch-name>

# Force delete branch
git branch -D <branch-name>

# Rename current branch
git branch -m <new-name>

# Rename specific branch
git branch -m <old-name> <new-name>
```

### 合并
```bash
# Merge branch into current
git merge <branch-name>

# Merge with commit even if fast-forward
git merge --no-ff <branch-name>

# Abort merge
git merge --abort

# Squash merge
git merge --squash <branch-name>
```

---

## 远程操作

### 远程仓库
```bash
# View remotes
git remote -v

# Add remote
git remote add <name> <url>

# Remove remote
git remote remove <name>

# Rename remote
git remote rename <old-name> <new-name>

# Change remote URL
git remote set-url <name> <new-url>
```

### Fetch、Pull 与 Push
```bash
# Fetch from remote
git fetch origin

# Fetch all remotes
git fetch --all

# Pull (fetch + merge)
git pull

# Pull with rebase
git pull --rebase

# Pull specific branch
git pull origin <branch-name>

# Push to remote
git push origin <branch-name>

# Push all branches
git push --all

# Push tags
git push --tags

# Force push (dangerous!)
git push --force

# Safer force push
git push --force-with-lease

# Set upstream and push
git push -u origin <branch-name>

# Delete remote branch
git push origin --delete <branch-name>
```

---

## 查看变更

### Diff
```bash
# View unstaged changes
git diff

# View staged changes
git diff --staged
git diff --cached

# View changes between commits
git diff <commit1> <commit2>

# View changes in specific file
git diff <file>

# View stat summary
git diff --stat

# View changes between branches
git diff <branch1>..<branch2>
```

### Show
```bash
# Show commit details
git show <commit>

# Show specific file from commit
git show <commit>:<file>

# Show files in commit
git show --name-only <commit>
```

---

## 撤销变更

### Reset
```bash
# Unstage file
git reset <file>

# Unstage all
git reset

# Reset to specific commit (keep changes)
git reset --soft <commit>

# Reset to specific commit (discard staged changes)
git reset --mixed <commit>

# Reset to specific commit (discard all changes)
git reset --hard <commit>

# Reset to last commit
git reset --hard HEAD

# Reset to remote state
git reset --hard origin/main
```

### Revert
```bash
# Revert specific commit (creates new commit)
git revert <commit>

# Revert without committing
git revert -n <commit>

# Revert merge commit
git revert -m 1 <merge-commit>
```

### Checkout
```bash
# Discard changes in file
git checkout -- <file>

# Discard all changes
git checkout -- .

# Checkout file from specific commit
git checkout <commit> -- <file>
```

### Clean
```bash
# Remove untracked files (dry run)
git clean -n

# Remove untracked files
git clean -f

# Remove untracked directories
git clean -fd

# Remove untracked and ignored files
git clean -fdx
```

---

## Tag 管理
```bash
# List tags
git tag

# Create lightweight tag
git tag <tag-name>

# Create annotated tag
git tag -a <tag-name> -m "Tag message"

# Tag specific commit
git tag <tag-name> <commit>

# Show tag details
git show <tag-name>

# Delete tag
git tag -d <tag-name>

# Delete remote tag
git push origin --delete <tag-name>

# Push tag to remote
git push origin <tag-name>

# Push all tags
git push --tags
```

---

## 高级操作

### Stash
```bash
# Stash changes
git stash

# Stash with message
git stash save "Work in progress"

# List stashes
git stash list

# Apply latest stash
git stash apply

# Apply specific stash
git stash apply stash@{2}

# Apply and drop stash
git stash pop

# Drop stash
git stash drop stash@{0}

# Clear all stashes
git stash clear

# Show stash contents
git stash show -p stash@{0}
```

### Rebase
```bash
# Rebase current branch
git rebase <branch-name>

# Interactive rebase last N commits
git rebase -i HEAD~3

# Continue after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort

# Skip commit during rebase
git rebase --skip
```

### Cherry-pick
```bash
# Apply commit to current branch
git cherry-pick <commit>

# Cherry-pick without committing
git cherry-pick -n <commit>

# Cherry-pick range of commits
git cherry-pick <commit1>..<commit2>
```

---

## 搜索
```bash
# Search in files
git grep "search term"

# Search in specific file type
git grep "search term" -- '*.py'

# Show line numbers
git grep -n "search term"

# Search in history
git log -S "search term"

# Search commit messages
git log --grep="search term"
```

---

## 实用工作流

### 功能分支工作流
```bash
# Start new feature
git checkout -b feature/my-feature

# Work on feature
git add .
git commit -m "Add feature"

# Update with main
git checkout main
git pull
git checkout feature/my-feature
git rebase main

# Finish feature
git checkout main
git merge --no-ff feature/my-feature
git push origin main
git branch -d feature/my-feature
```

### 紧急修复工作流
```bash
# Create hotfix branch from main
git checkout -b hotfix/critical-bug main

# Fix bug
git add .
git commit -m "Fix critical bug"

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix release"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug

# Clean up
git branch -d hotfix/critical-bug
```

---

## 实用单行命令
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Delete all merged branches
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# View commits not yet pushed
git log origin/main..HEAD

# View commits by date range
git log --since="2 weeks ago"

# Count commits by author
git shortlog -sn

# Find which commit introduced a bug (binary search)
git bisect start
git bisect bad  # Current version is bad
git bisect good <commit>  # Known good commit

# Show files changed in commit
git diff-tree --no-commit-id --name-only -r <commit>

# Pretty log format
git log --pretty=format:"%h %an %ar - %s"

# View who changed what in file
git blame <file>

# Show commits that changed a specific line
git log -L 15,23:<file>
```

---

## 故障排查

### 常见问题
```bash
# Resolve merge conflicts
# 1. View conflicts
git status

# 2. Edit conflicted files
# 3. Mark as resolved
git add <file>

# 4. Complete merge
git commit

# Fix detached HEAD
git checkout <branch-name>

# Recover deleted branch
git reflog
git checkout -b <branch-name> <commit>

# Undo force push (if reflog still exists)
git reflog
git reset --hard <commit>

# Fix diverged branches
git pull --rebase origin main
```

---

## 实用技巧

### 别名
添加至 `~/.gitconfig`：
```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    lg = log --graph --oneline --all
    amend = commit --amend --no-edit
```

### .gitignore 常见规则
```
# Python
__pycache__/
*.py[cod]
*.so
.Python
venv/
.env

# Node
node_modules/
npm-debug.log

# IDEs
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Build artifacts
dist/
build/
*.egg-info/
```

### 最佳实践
1. **经常提交**：小而逻辑完整的提交。
2. **编写清晰提交信息**：解释为什么，而不只是什么。
3. **使用分支**：保持 main/develop 整洁。
4. **Push 前 Pull**：避免冲突。
5. **提交前审查**：使用 git diff --staged。
6. **不要提交密钥**：使用 .gitignore。
7. **发布打 Tag**：采用语义化版本管理。
8. **Rebase 功能分支**：保持历史清晰。
9. **签名提交**：使用 GPG 签名进行验证。
10. **使用 .gitattributes**：统一换行符。

---

**另见：**
- [Docker 速查表](./docker-cheat-sheet.md)
- [Kubernetes 速查表](./kubernetes-cheat-sheet.md)
- [Linux 命令速查表](./linux-cheat-sheet.md)

> 译注：原始命令及英文注释保留。reset --hard、clean、强制推送等可能丢失本地或共享历史，执行前确认并备份。不要随意 Rebase 已共享的分支；.gitignore 不会自动移除已提交的密钥，泄露后应撤销并轮换密钥。
