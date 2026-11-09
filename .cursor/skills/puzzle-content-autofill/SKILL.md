---
name: puzzle-content-autofill
description: >-
  为 puzzle-review-site 生成或补全评测/攻略草稿（JSON），校验计分与薄页规则，合并进 catalog 或
  Payload CMS。在用户提到 AI 填内容、自动填充、批量写评测/攻略、content draft 时使用。
---

# 测评站内容自动填充

## 何时用

- 新增或更新 `apps/web/src/data/catalog.ts` 里的评测、攻略
- 为 `apps/cms` 的 `reviewVersions` / `guides` 准备字段草稿（CMS 尚未承载全文时仍以 catalog 为准）
- 用户明确点名本 skill 或「AI 自动填充内容」

## 必读

1. **AI 自动测试流程：** `docs/ai-auto-testing.md`（会话记录 → 草稿 → 校验）
2. 产品与技术约束：`docs/tech-design.md`（薄页闸门、计分、AI 披露）
3. 字段与枚举：`reference.md`
4. JSON Schema：`content/schemas/test-session.schema.json`、`content/schemas/catalog-review.schema.json`、`content/schemas/guide.schema.json`

## 工作流

### 1. 收集输入

优先读取 **`content/sessions/<slug>.session.json`**（格式见 `docs/ai-auto-testing.md`）。若无会话文件，再向用户确认：

- 游戏名、`slug`、平台（`ios` | `android`）
- `reviewType`：`initial`（初测，无综合分）或 `full`
- 实测依据：版本、关卡范围、广告/IAP/离线观察（禁止臆造）
- 是否 AI 辅助撰写（需在稿件元数据里标 `aiAssisted: true`，正文须可被人工复核）

无第一手依据时：**只生成骨架**（`dims` 全 `null`、`status: draft`），并列出待测清单，不得编造分数或广告行为。

### 2. 写出 JSON 草稿

路径：`content/drafts/<slug>.review.json` 或 `content/drafts/<gameSlug>-<guide-slug>.guide.json`

- 语言：前台文案 **美式英语**（与现有 catalog 一致）
- 维度分：整数 **0–100 十分位**（8.0 → `80`）；任一维缺证据则该维 `null`
- `initial`：可有部分维度分，**不得**暗示综合分；`full` 发布前五维应齐全（除非刻意保持草稿）
- 标签：`no_forced_ads` 为 `yes` 时 **`verifiedOnline` 必须为 `true`**
- 赞助：`sponsored: true` 的评测不进任何榜单（见 `site.test.ts`）

示例骨架见 `content/drafts/_example.review.json`。

### 3. 校验

```bash
pnpm content:validate content/drafts/<file>.review.json
```

失败则修正 JSON，不得跳过规则。

### 4. 合并入库

| 目标 | 操作 |
|------|------|
| 静态站（当前主路径） | 将校验通过的字段写入 `apps/web/src/data/catalog.ts` 的 `reviews` / `guides`，保持与现有对象形状一致；`authorSlug` 须存在于 `authors` |
| CMS（记分字段） | 可选：同步 `dimG`…`dimU`、`testingBoundaries`、`storeUrl` 到 `reviewVersions`；**综合分仅由服务端 `applyServerScore` 计算**，不要手写 `compositeTenths` |
| UI 改版 | 遵循 `.cursor/rules/pencil-first-ui.mdc`：先改 `design/review-site-only.pen` |

### 5. 验收

```bash
pnpm test
pnpm --filter @puzzle/web build
```

## 禁止

- 缺维时把分当成 0 或满分凑综合分
- 无实测写具体广告频次、关卡解法、商店价格
- 批量生成雷同 `rationales` / `faqs` 填量
- 把 AI 草稿当 `published` 且不披露 `aiAssisted`

## 延伸阅读

- 维度含义与权重：`packages/scoring/src/composite.ts` 的 `DIMENSIONS`、`WEIGHTS_V1`
- 合并示例：对照 `apps/web/src/data/catalog.ts` 中 `sample-initial-entry`、`sponsored-sort-deluxe`
