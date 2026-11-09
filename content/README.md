# 内容草稿（AI / 编辑协作）

本目录供 **Agent Skill `puzzle-content-autofill`** 使用：先把结构化草稿放在这里，校验通过后再合并进 `apps/web/src/data/catalog.ts` 或 CMS。

**AI 自动测试全流程说明：** [`docs/ai-auto-testing.md`](../docs/ai-auto-testing.md)（先写 `sessions/`，再生成 `drafts/`）。

```
content/
├── sessions/         # 第一手实测记录 *.session.json（AI 填稿输入）
├── schemas/          # JSON Schema（session / review / guide）
├── drafts/           # 待合并的 *.review.json / *.guide.json
└── validate-review-draft.ts
```

## 命令

```bash
pnpm content:validate content/drafts/your-game.review.json
```

## 草稿命名

- 评测：`{slug}.review.json`
- 攻略：`{gameSlug}.{guide-slug}.guide.json`

合并前务必运行 `pnpm test`。
