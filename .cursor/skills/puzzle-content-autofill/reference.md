# 内容字段速查

## CatalogReview（`apps/web/src/data/catalog.ts`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `gameId` | string | 游戏逻辑 ID，跨平台可相同 |
| `slug` | string | URL `/reviews/{slug}/`，全局唯一 |
| `name` | string | 显示名 |
| `developer` | string | 开发商 |
| `mechanicFamily` | string | 如 `color-sort`，与榜单定义一致 |
| `platform` | `ios` \| `android` | 分平台计分，不合并 |
| `reviewType` | `initial` \| `full` | 仅 `full` 可有公开展示综合分 |
| `status` | `draft` \| `published` \| … | 草稿勿标 `published` 除非已满足薄页规则 |
| `sponsored` | boolean | true → 排除榜单与 Review JSON-LD |
| `appVersion`, `osVersion` | string | 实测环境 |
| `testedFrom`, `testedTo`, `publishedOn` | ISO 日期 | `YYYY-MM-DD` |
| `testerRegion`, `storeLocale` | string | 如 `US`, `en-US` |
| `dims` | `G,A,F,C,U` | 各 `number \| null`，十分位整数 |
| `rationales` | 部分 Record | **有分的维必须有非空理由** |
| `testingBoundaries` | string | 关卡范围、是否内购、网络条件 |
| `storeUrl` | string | 官方商店链接 |
| `priceUsd` | number | 免费为 `0` |
| `authorSlug` | string | 须在 `authors` 中 |
| `publicEvidenceCount` | number | 可公开证据数量 |
| `tags` | 见下 | 三态标签 |
| `verifiedOnline` | boolean | `no_forced_ads=yes` 时必 `true` |
| `summary`, `verdict` | string | 首屏结论块 |
| `familyNotes` | string[] | 家长须知事实句 |
| `faqs` | `{q,a}[]` | 简短 FAQ |
| `aiAssisted` | boolean（草稿 JSON） | AI 辅助撰写时 true；合并时若前台暂无字段，记在 PR/提交说明，待 CMS 同步 |

### 标签键（`tags`）

`no_forced_ads`, `plays_offline`, `one_handed`, `short_rounds`, `no_timers` → 值均为 `yes` \| `no` \| `unknown`。

### 五维（计分）

| 键 | 权重 | 问题 |
|----|------|------|
| G | 30 | Gameplay |
| A | 20 | Ads |
| F | 20 | Fairness |
| C | 15 | Content |
| U | 15 | Stability |

服务端展示分：`displayedTenths = floor((raw + 50) / 100)`，`raw = Σ weight × dimTenths`。用 `pnpm content:validate` 与 `@puzzle/scoring` 校验，勿手算后硬编码到 CMS 只读字段。

## Guide（catalog `guides` 数组）

| 字段 | 说明 |
|------|------|
| `slug`, `gameSlug`, `title` | `gameSlug` 须已有评测或建档 |
| `platform`, `levelRange` | 如 `Levels 1-20` |
| `body` | 美式英语步骤文，禁止外链 HTML |
| `verifiedOnVersion`, `verifiedBy` | 编辑核实信息 |
| `contributorName`, `piiCleared` | 社区来源时笔名；发布前清 PII |
| `status` | `verified` 才应合并为可构建条目 |
| `publishedOn`, `modifiedOn` | ISO 日期 |

投稿队列字段对齐 `guideSubmissions`：`aiAssisted` 与 CMS 一致。

## Payload CMS（当前实现子集）

`reviewVersions`：`gameSlug`, `platform`, `reviewType`, `status`, `dimG`…`dimU`, `testingBoundaries`, `storeUrl`（综合分只读）

`guides` / `guideSubmissions`：见 `apps/cms/src/collections/*.ts`

完整实体见 `docs/tech-design.md` 第 4 章（尚未全部落地）。
