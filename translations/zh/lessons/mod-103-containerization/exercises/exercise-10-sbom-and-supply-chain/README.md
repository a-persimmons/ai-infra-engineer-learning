# 练习 10：SBOM 与容器软件供应链

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01–08；已安装 cosign

## 目标

为 iris-api 镜像生成软件物料清单（SBOM），使用 cosign 签名镜像，附加 SLSA 来源证明（Provenance Attestation），并使用要求镜像已签名和扫描的 Kyverno 策略控制 Kubernetes 部署。原文目标是端到端实现 SLSA Level 2 签名工作流。

## 为什么重要

软件供应链攻击（SolarWinds、Codecov、npm 仿冒拼写包）是工程组织的重要安全风险。云原生团队需要可验证的链路：镜像来自哪个提交、由哪个流水线构建、使用了哪些依赖，以及能够拒绝不符合要求镜像的部署集群。SLSA 提供了规范这一过程的框架。

## 要求

1. 使用 syft **生成 CycloneDX 格式 SBOM**。
2. 使用 grype **扫描 SBOM** 中的漏洞。
3. 使用 cosign 的 **Keyless（Sigstore）签名**为镜像签名。
4. **将 SBOM 作为 Attestation 附加**至已签名镜像。
5. **附加 SLSA 来源证明**，记录镜像构建方式。
6. 部署 **Kyverno 策略**：
   - 要求镜像由允许的身份签名。
   - 要求 SBOM Attestation。
   - 当运行时路径中存在 HIGH/CRITICAL CVE 时阻止部署。

## 分步操作

### 步骤 1——安装工具（15 分钟）
```bash
brew install syft grype cosign
cosign version
```

### 步骤 2——生成 SBOM（15 分钟）
```bash
syft ghcr.io/me/iris-api:0.2 -o cyclonedx-json > sbom.cdx.json
syft ghcr.io/me/iris-api:0.2 -o spdx-json     > sbom.spdx.json
jq '.components | length' sbom.cdx.json     # count
```

### 步骤 3——扫描 SBOM（15 分钟）
```bash
grype sbom:sbom.cdx.json --fail-on high
```
注意：grype 首次运行可能失败，这正是练习的目的。修复 Dockerfile 中的一两个 HIGH CVE（通常通过更换基础镜像或固定更新的版本）。

### 步骤 4——Keyless 签名（30 分钟）
```bash
COSIGN_EXPERIMENTAL=1 cosign sign ghcr.io/me/iris-api:0.2
```
按照 OIDC 流程操作（浏览器打开，使用 GitHub 登录）。签名与镜像一起存储在镜像仓库中。

验证：
```bash
cosign verify ghcr.io/me/iris-api:0.2 \
  --certificate-identity-regexp '.*me@example.com' \
  --certificate-oidc-issuer https://github.com/login/oauth
```

### 步骤 5——附加 SBOM Attestation（30 分钟）
```bash
COSIGN_EXPERIMENTAL=1 cosign attest \
  --predicate sbom.cdx.json \
  --type cyclonedx \
  ghcr.io/me/iris-api:0.2

# Verify the attestation
cosign verify-attestation \
  --type cyclonedx \
  --certificate-identity-regexp '.*me@example.com' \
  --certificate-oidc-issuer https://github.com/login/oauth \
  ghcr.io/me/iris-api:0.2
```

### 步骤 6——CI 生成 SLSA 来源证明（45 分钟）
GitHub Actions 通过 slsa-github-generator 生成 SLSA 来源证明：
```yaml
jobs:
  build:
    permissions:
      contents: read
      packages: write
      id-token: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0
    with:
      image: ghcr.io/${{ github.repository }}/iris-api
      digest: ${{ needs.docker.outputs.digest }}
      registry-username: ${{ github.actor }}
    secrets:
      registry-password: ${{ secrets.GITHUB_TOKEN }}
```
CI 运行后：
```bash
cosign verify-attestation --type slsaprovenance ghcr.io/me/iris-api:0.2
```

### 步骤 7——集群中的 Kyverno 策略（45 分钟）
安装 Kyverno：`helm install kyverno kyverno/kyverno -n kyverno --create-namespace`。

策略：
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: verify-signed-and-scanned }
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-signed
      match:
        any: [{ resources: { kinds: [Pod] } }]
      verifyImages:
        - imageReferences: ["ghcr.io/me/iris-api:*"]
          attestors:
            - entries:
                - keyless:
                    subject: "me@example.com"
                    issuer: "https://github.com/login/oauth"
    - name: require-sbom
      match:
        any: [{ resources: { kinds: [Pod] } }]
      verifyImages:
        - imageReferences: ["ghcr.io/me/iris-api:*"]
          attestations:
            - type: cyclonedx
              attestors:
                - entries:
                    - keyless: { subject: "me@example.com", issuer: "https://github.com/login/oauth" }
```

部署未签名镜像 → Kyverno 阻止并提供明确错误。部署已签名且符合策略的镜像 → 通过。

## 交付物

1. 仓库中的 SBOM 文件（sbom.cdx.json）。
2. 镜像仓库中带 Attestation 的已签名镜像。
3. 集群中可用的 Kyverno 策略，并演示阻止未签名镜像、允许合规镜像。
4. 自动生成签名镜像与来源证明的 CI 工作流。
5. `SUPPLY_CHAIN.md`，描述团队的策略及例外处理流程。

## 验证

- [ ] syft 与 grype 生成有效输出，且扫描结果满足策略。
- [ ] cosign verify 使用你的身份验证镜像成功。
- [ ] 部署未签名镜像时，Kyverno 阻止部署并显示策略违规消息。
- [ ] 部署已签名且满足全部策略的镜像时通过。
- [ ] CI 在每次推送时生成全部产物。

## 拓展目标

- 添加 **CVE 触发重建**自动化：每日扫描已签名镜像，当 CVE 超出阈值时创建升级基础镜像的 PR。
- 实现 **Sigstore Rekor** 查询脚本：给定镜像 SHA，获取关于签名者的审计记录。
- 添加**透明日志监控**：当非 CI 服务账号的身份为你的仓库签名时告警。

## 常见陷阱

- **Cosign 缺少 OIDC**——Keyless 模式要求 CI 具有 ID Token 权限；本地交互流程需要浏览器。验证 CI 权限包含 id-token: write。
- **有密钥签名与 Keyless 签名**——前者要求管理和轮换密钥。Keyless 更简单，但通常依赖 Sigstore 的相关服务（如 Rekor）。
- **SBOM 包含仅构建时使用的依赖**——对运行时镜像而非 Builder 阶段使用 syft，否则会报告未随镜像交付的构建工具漏洞。
- **Kyverno failure-action：Audit 与 Enforce**——Audit 仅记录违规；Enforce 阻止违规。新集群先以 Audit 验证，观察一周后再切换至 Enforce。

> 译注：SBOM 是组件清单，不一定包含漏洞扫描结果；应通过可信扫描证明或外部扫描策略判断 CVE，并验证证明的签名、来源与镜像 Digest。仅签名镜像不等于满足 SLSA Build Level 2，仍需验证构建平台及来源证明符合相应要求。原文工具版本和命令保持不变。
