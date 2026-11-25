# 全量中文翻译 / Bulk Chinese translation

本项目保留所有人工译文。批量脚本只翻译缺失的 Markdown 文件，保留代码块、行内代码、链接地址和 Markdown 结构。机器翻译文件带有待校对标记，不代表人工审校。

## 一次性运行

1. 在仓库 Settings → Secrets and variables → Actions 新建 OPENAI_API_KEY Secret（仅使用自己的 API 项目密钥）。
2. 在 Actions → Translate all remaining course documents → Run workflow 中选择可用模型 ID。
3. 工作流依次翻译全部缺失文档、检查覆盖率、构建站点，并在所有步骤通过后统一提交译文和触发 Pages。
4. 模型 API 按用量收费。请先确认项目额度、价格与限额。工作流不会在普通 push 时调用模型。

本地也可执行：

    npm ci
    node scripts/translate-missing.mjs --dry-run
    export OPENAI_API_KEY=...
    export TRANSLATION_MODEL=gpt-6-luna
    node scripts/translate-missing.mjs
    node scripts/translate-missing.mjs --verify
    npm run docs:build

失败时保留已生成的本地译文，下次执行自动跳过。Actions 失败时下载 translation-checkpoint 产物恢复至 translations/zh/，再在本地重试。未通过完整性检查或构建，不自动提交。自动校验不能替代人工审读，也不保证原文中的命令本身正确。

## English

The manual workflow fills missing translations only, preserving existing translations. It checks file coverage and validates the site build before publishing one commit. Machine translations are marked for review. API usage is billed to the configured project. The workflow never runs automatically on ordinary pushes.
