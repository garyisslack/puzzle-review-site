# Agent 指引（puzzle-review-site）

## 交流

仓库根目录 `AGENTS.md` 与 `/Users/gary/AGENTS.md` 一致：与用户用中文；代码与路径保持英文。

## 内容自动填充（AI skill）

当用户要 **AI 自动测试、填评测/攻略、从草稿入库** 时：

1. 先阅读：`docs/ai-auto-testing.md`
2. 再遵循 skill：`.cursor/skills/puzzle-content-autofill/SKILL.md`
3. 实测输入：`content/sessions/*.session.json`；输出：`content/drafts/*.review.json`
4. 合并前 `pnpm content:validate`；合并后 `pnpm test`

字段定义见 `content/schemas/` 与 skill 内的 `reference.md`。完整产品约束见 `docs/tech-design.md`。

## UI

界面改动遵守 `.cursor/rules/pencil-first-ui.mdc`（先改 `design/review-site-only.pen`）。

## 计分

唯一权威逻辑在 `packages/scoring`；CMS 与前台共用，不得在前台或草稿里手写综合分覆盖服务端结果。
