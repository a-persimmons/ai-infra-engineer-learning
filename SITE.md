# VitePress reading site / 双语阅读站

Expected URL: https://a-persimmons.github.io/ai-infra-engineer-learning/

The default locale is Simplified Chinese; English is under /en/. English pages are generated from original Markdown. Chinese pages contain localized navigation and study guides; untranslated pages are explicitly labeled. Add a complete Chinese translation under translations/zh/<original-path> and rebuild. Original course files remain unchanged.

## Development

    npm ci
    npm run docs:dev
    npm run docs:build
    npm run docs:preview

GitHub Pages: Settings → Pages → Build and deployment → Source → GitHub Actions. The workflow builds on pushes to main and manual dispatch. Generated Markdown and build output are ignored.

## 中文说明

默认中文，英文原文位于 /en/。中文导读不是逐篇全文翻译。完整译文按原始路径放入 translations/zh/ 后，生成脚本自动接入。原始课程、实验和项目代码保持不变。
