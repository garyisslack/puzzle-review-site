# 手机休闲益智测评站

公开页面是 Astro 6 静态站，编辑后台是 Payload 3。分数只在 `@puzzle/scoring` 里计算。

```bash
pnpm install
pnpm test
pnpm --filter @puzzle/web build
pnpm dev:web
pnpm dev:cms
```

`DATABASE_URI` 以 `postgres` 开头时，后台连 PostgreSQL。留空则用本地 SQLite，方便开发。品牌名还没定，页面上沿用设计稿里的 SiteName。

设计稿在 `design/review-site-only.pen`，配套图片是同目录的 `generated-22.png` 到 `generated-31.png`。改界面先改这份稿。

用 AI 测游戏并填评测：见 [`docs/ai-auto-testing.md`](docs/ai-auto-testing.md)（会话 `content/sessions/` → 草稿 `content/drafts/` → `pnpm content:validate`）。填稿 Skill：`.cursor/skills/puzzle-content-autofill/`。
