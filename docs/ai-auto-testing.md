# AI 辅助游戏测试说明

本文说明如何在本仓库里用 **AI + 结构化实测记录** 完成「测 → 写稿 → 校验 → 入库」，供 Cursor Agent、后续自动化脚本和编辑共用。

| 项 | 内容 |
|---|---|
| 相关文档 | `docs/tech-design.md`（计分、薄页闸门、SEO/COPPA） |
| 填稿 Skill | `.cursor/skills/puzzle-content-autofill/SKILL.md` |
| 输出格式 | `content/schemas/catalog-review.schema.json` |
| 校验 | `pnpm content:validate content/drafts/<slug>.review.json` |

---

## 1. 目标与边界

### 1.1 AI 负责什么

- 按 **实测会话记录**（session log）整理五维分、标签、英文正文、FAQ
- 生成 `content/drafts/*.review.json`，运行 `pnpm content:validate`
- 对照 `pnpm test` / 构建闸门，提示缺项
- 合并进 `apps/web/src/data/catalog.ts`（或同步 CMS 记分字段）
- 标注 `aiAssisted: true`，并输出 **待人工复核清单**

### 1.2 AI 不能做什么（必须人做或真机实测）

- **不能**在没有玩过的前提下填写广告行为、关卡难度、崩溃、内购是否必需等结论
- **不能**用 0 或满分填补缺失维度来「凑」综合分（缺证据 → 该维 `null`）
- **不能**把商店描述、其他评测站、AI 概览当作「第一手测试」
- **不能**替代编辑对 `full` + `published` 的发布决定

真机测试仍是源头。AI 是 **记录结构化、写稿、校验** 的加速器，不是代玩工具。

### 1.3 评测类型

| 类型 | 代号 | 综合分 | 典型用途 |
|------|------|--------|----------|
| 初测 | `initial` | 不对外展示 | 短会话、只填部分维，标缺口 |
| 完整评测 | `full` | 五维齐全时可展示 | 进榜单、比较页、需求榜 |

---

## 2. 参与角色

| 角色 | 职责 |
|------|------|
| 测试者（人） | 在真机上按测试计划玩；录屏/截图；填写会话记录 |
| AI Agent | 读会话记录 → 产 JSON 草稿 → 校验 → 提议合并 diff |
| 编辑 / Reviewer | 核对证据与分数；决定 `published`；拒绝 AI 臆造 |

可选：测试者用语音/随手笔记，由 AI 先整理成 `content/sessions/*.session.json` 再填稿。

---

## 3. 测试前准备

### 3.1 每款游戏固定信息（建档）

- 游戏名、开发商、`mechanicFamily`（如 `color-sort`）
- 平台：`ios` 或 `android`（**分平台两条评测，不合并**）
- 拟定 `slug`（全局唯一，URL 用）
- 官方 `storeUrl`；iOS 可用 iTunes Lookup 核对版本（技术方案 §5.3）

### 3.2 设备与环境（写入 `testingBoundaries`）

- 机型、OS 版本 `osVersion`
- 应用版本 `appVersion`（以测试开始时商店/关于页为准）
- 地区：`testerRegion`、`storeLocale`（默认 US / en-US）
- 网络：Wi‑Fi / 蜂窝 / 飞行模式（测离线时写明）
- 是否购买内购：**默认不购**；若购了必须单独记录

### 3.3 测试计划（建议默认）

**完整评测（`full`）最低建议：**

- 连续关卡 band：**1–60**（或该品类常用 band，与站内现有评测一致）
- **广告**：至少观察 10 次关卡切换；记录全屏/激励出现位置、是否强制、能否跳过
- **离线**：在 band 内至少一次开飞行模式续玩（若声称离线）
- **稳定性**：至少一次切后台再返回，看棋盘/进度是否保留
- **内购**：记录商店入口与是否阻碍进度（不购也要看 UI）
- **证据**：≥ 1 张可公开截图（无个人账号、好友码、未打码聊天）

**初测（`initial`）可缩短：**

- 20–30 分钟或 10–20 关
- 只对有观察的维打分；其余 `null`
- `summary` 必须写明「非完整评测、无综合分」

---

## 4. 实测会话记录（给 AI 的输入）

AI **只应**在存在会话记录（或等价素材）时生成有分的草稿。推荐格式：

**路径：** `content/sessions/<slug>.session.json`  
**示例：** `content/sessions/_example.session.json`  
**Schema：** `content/schemas/test-session.schema.json`

### 4.1 会话里必须有什么

1. **元数据**：`gameName`、`slug`、`platform`、版本、日期、测试者代号  
2. **边界**：关卡范围、是否内购、网络条件  
3. **观察条目** `observations[]`：每条带 `type`、时间或关卡、`note`（英文或中文均可，出稿转美式英语）  
   - 建议 `type`：`play` | `ad` | `iap` | `crash` | `offline` | `resume` | `other`  
4. **证据** `evidence[]`：文件路径或描述（截图日期、关卡）  
5. **维度草稿（可选）**：测试者主观分，AI 可改但须写理由  
6. **`gaps[]`**：还没测到的项（AI 不得对这些项填 `yes` 或具体分）

### 4.2 观察写法示例（给人看）

```text
[ad] L12→L13: full-screen interstitial after level complete, ~5s skip, board unchanged after return
[offline] L20-25: airplane mode, levels still load (Wi‑Fi first launch at L1)
[resume] L30: home button 30s, app resume, state OK
```

---

## 5. AI 执行流程（Agent 逐步清单）

对 Cursor / 其他 Agent，按顺序执行：

```
1. 读 docs/ai-auto-testing.md（本文）+ puzzle-content-autofill skill
2. 读 content/sessions/<slug>.session.json（若无 → 只产出骨架 + gaps，停止打分）
3. 对照 packages/scoring 的 DIMENSIONS，仅为有观察支撑的维提议分数
4. 填写 rationales（有分必有理由，引用观察条目）
5. 填 tags（无观察 → unknown；no_forced_ads=yes 仅当会话含在线广告验证且 verifiedOnline 可 true）
6. 写 summary / verdict / familyNotes / faqs（美式英语，与证据一致）
7. 写出 content/drafts/<slug>.review.json，aiAssisted: true，status: draft
8. 运行 pnpm content:validate content/drafts/<slug>.review.json
9. 输出「人工复核清单」（见 §7）
10. 仅在用户确认后合并 catalog.ts，并 pnpm test
```

**合并 Skill：** `.cursor/skills/puzzle-content-autofill/SKILL.md`  
**字段表：** `.cursor/skills/puzzle-content-autofill/reference.md`

---

## 6. 五维与标签：从观察到字段

| 维 | 问题 | 观察来源 |
|----|------|----------|
| G | 好不好玩 | 操作手感、教学、难度曲线、`play` 笔记 |
| A | 广告烦不烦 | `ad` 笔记：频次、时机、是否打断操作 |
| F | 不付钱能否玩 | `iap` + `play`：卡点、体力、道具强推 |
| C | 内容多不多 | 关卡数、机制变化、后期 variety |
| U | 稳不稳 | `crash` / `resume` / 卡顿 |

| 标签 | 为 `yes` 的条件 |
|------|----------------|
| `no_forced_ads` | 实测 band 内无强制全屏/不可关闭广告；且 **在线验证** → `verifiedOnline: true` |
| `plays_offline` | `offline` 观察支持 |
| `one_handed` | 竖屏、按钮可达性等 `play` 笔记 |
| `short_rounds` | 单关时长记录 |
| `no_timers` | band 内无倒计时压力 |

任一条件不充分 → `unknown`，不得为了 SEO 填 `yes`。

---

## 7. 人工发布前复核清单

编辑在 `status: published` 前逐项勾：

- [ ] 会话记录与 JSON 版本号、关卡范围一致  
- [ ] 每个非空维度都有 rationale，且与观察一致  
- [ ] `testingBoundaries` 与 `storeUrl` 完整  
- [ ] `full` 评测：五维齐全、`publicEvidenceCount ≥ 1`（与证据文件对应）  
- [ ] `no_forced_ads=yes` 时 `verifiedOnline === true`  
- [ ] 赞助/开发关系已披露（`sponsored`）  
- [ ] 英文正文无抄袭、无未核实商店星级当本站分  
- [ ] `pnpm content:validate` 与 `pnpm test` 通过  
- [ ] AI 辅助已在 `aiAssisted` 或发布说明中披露  

---

## 8. 命令速查

```bash
# 校验评测 JSON 草稿
pnpm content:validate content/drafts/my-game.review.json

# 全仓库单测（含榜单、初测、赞助排除等）
pnpm test

# 前台构建（薄页闸门在 build 脚本里）
pnpm --filter @puzzle/web build
```

---

## 9. 自动化扩展（后续可做，非 MVP 必需）

| 方向 | 说明 |
|------|------|
| 会话 → 草稿 CLI | `pnpm content:draft-from-session content/sessions/foo.session.json` |
| iOS 元数据 | 脚本调 iTunes Lookup 预填版本/图标（仍要人测玩法） |
| 截图 OCR / 视觉 | 辅助读关卡号、广告 UI，**结论仍要人确认** |
| Computer Use | 仅适合商店页、官网；**不能**代替 App 内真机操作 |

新增自动化时保持：**会话记录为单一事实来源**，校验仍走 `@puzzle/scoring`。

---

## 10. 与 Google / 本站政策的对应

- 缺维不凑分 → `docs/tech-design.md` §5.1、§6.3  
- 第一手证据 → 完整评测警告「至少五维理由 + 1 张可公开图」  
- AI 内容 → 须人工价值与核实；`aiAssisted` 披露  
- 儿童与隐私 → 截图去 EXIF/PII；攻略与投稿见技术方案第 9 章  

---

## 附录 A：产出物一览

| 阶段 | 文件 |
|------|------|
| 实测 | `content/sessions/<slug>.session.json`、证据图（建议 `content/evidence/<slug>/`，勿提交含隐私原图时可仅本地保存） |
| AI 草稿 | `content/drafts/<slug>.review.json` |
| 上线数据 | `apps/web/src/data/catalog.ts`（当前）/ 未来 Payload 集合 |
| CMS 记分 | `apps/cms` → `reviewVersions` 的 `dimG`…`dimU` 等 |

## 附录 B：对用户对话的触发语

在 Cursor 中可直接说：

- 「按 `docs/ai-auto-testing.md` 和 session 文件生成评测草稿」  
- 「用 puzzle-content-autofill 把 `content/sessions/xxx.session.json` 填进 drafts」  
- 「只根据 session 填骨架，不要编造广告」
