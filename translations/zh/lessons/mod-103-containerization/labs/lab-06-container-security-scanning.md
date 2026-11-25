# 实验 06：使用 Trivy 对镜像进行安全扫描

**时长：** 45 分钟  **前置条件：** 已安装 Docker 和 Trivy。

## 目标

扫描真实 Docker 镜像中的操作系统、编程语言依赖以及密钥相关的漏洞；生成报告；配置 CI 门禁，在发现 HIGH/CRITICAL 级别问题时使构建失败。

## 步骤

### 1. 安装 Trivy
```bash
brew install trivy                # macOS
# Linux: see https://aquasecurity.github.io/trivy/latest/getting-started/installation/

trivy --version
```

### 2. 扫描镜像
```bash
docker pull python:3.11             # known to have some old vulns
trivy image --severity HIGH,CRITICAL --format table python:3.11
```

### 3. 为工具生成 JSON 输出
```bash
trivy image --format json --output trivy-report.json python:3.11
jq '.Results[].Vulnerabilities | length' trivy-report.json
```

### 4. 扫描文件系统中的密钥
```bash
trivy fs --scanners secret --severity HIGH,CRITICAL .
```

### 5. 扫描 IaC 和 Dockerfile
```bash
trivy config Dockerfile
trivy config terraform/
```

### 6. CI 门禁
GitHub Actions 步骤：
```yaml
- name: Trivy scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/${{ github.repository }}/iris-api:${{ github.sha }}
    severity: 'HIGH,CRITICAL'
    exit-code: '1'           # fail the build on any HIGH/CRITICAL
    ignore-unfixed: true
    format: 'sarif'
    output: 'trivy.sarif'

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with: { sarif_file: 'trivy.sarif' }
```

### 7. 忽略已接受的风险
创建 `.trivyignore`：
```
CVE-2023-12345  # accepted: only affects build tools not present at runtime
```

## 验证
- [ ] `trivy image python:3.11` 报告至少一个 HIGH 或 CRITICAL 级别 CVE。
- [ ] 对精简的 `python:3.11-slim-bookworm` 执行相同扫描时，报告数量更少。
- [ ] CI 工作流在故意选用存在漏洞的镜像时失败。

## 清理
```bash
rm -f trivy-report.json trivy.sarif .trivyignore
docker rmi python:3.11
```

## 故障排查
- **Trivy 首次运行较慢** — 正在下载漏洞数据库，之后的扫描会使用缓存。
- **出现误报** — 使用 `.trivyignore`，或使用 `--ignore-unfixed` 跳过尚无上游修复的 CVE。
- **不同运行的严重级别统计不同** — 数据库每日更新；在 CI 中固定数据库版本以获得可复现的结果（`trivy image --db-repository ...` 或将数据库纳入项目管理）。
