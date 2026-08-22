# Clean-Room 重构实施计划

> **目标**：在 `rewrite/clean-core` 分支上，以 `docs/rewrite/spec.md` 为唯一功能依据，对 Chromium MV3 插件做全新重实现（clean-room），达成商用合法化。  
> **红线重申**：上游 `spin311/MicrosoftRewardsWebsite` 无 License，严禁复制其代码、注释、变量名、文件结构；所有新文件必须标注自有版权头与新 License（本仓库新增文档为 CC BY 4.0，重构后插件代码需自有版权头）。  
> **工作树约束**：仅操作 `C:\Users\安卓人\Documents\antigravity\rewards-core`（分支 `rewrite/clean-core`），不改动主工作树。

---

## 0. 前置整理（本计划执行前已完成或需复核）

- [ ] `git status --short` 确认工作树干净（除本计划新增的 `docs/rewrite/*`）
- [ ] `.gitignore` 已补 `.agents/`、`builds/`（`2ce0264` 已完成），`wxt/dist/`、`.wxt/`、`node_modules/` 已忽略
- [ ] `git fetch origin / upstream` 连通性已验证（`2026-08-22` 成功）
- [ ] 本计划两份文档 `spec.md` / `clean-room-plan.md` 已提交并推送到 `origin/rewrite/clean-core`

---

## 1. 模块拆分与重实现清单

每个模块均为 **全新实现**，不得复制上游或现有 `wxt/` 代码；允许参考 `spec.md` 的行为描述与公开 API 文档（如 WXT、WebExtensions）。

### 1.1 构建与清单（Manifest）— `wxt.config.ts` / `package.json` / `tsconfig.json`

- **范围**：`defineConfig({ manifest })` 中的 `name/description/permissions/action/icons/gecko.id`、`outDir`、`alias`、`modules`。
- **全新实现要求**：
  - 文件头：`// Copyright (c) 2026 3y3y3y-huaiji — CC BY 4.0 / 自有 License`（以最终选定 License 为准，禁止沿用无 License 代码头）
  - 保持 `permissions: ["storage","alarms"]` 最小集，`outDir: "dist"`，`alias: { "@": "." }` 与 `tsconfig paths` 同步
- **验收**：
  - `npm run compile` 零错误
  - `npm run build` 产物 `dist/chrome-mv3/manifest.json` 与 `dist/firefox-mv2/manifest.json` 均包含正确 `name/permissions/gecko.id`
  - 不引入未在 `spec.md` 声明的新权限

### 1.2 存储封装 — `entrypoints/enums/storageValues.ts` + `entrypoints/hooks/useStorage.ts` + `entrypoints/utils/settings.ts`

- **范围**：存储前缀枚举、React Hook 与异步读写 helpers、默认值 `DEFAULTS` 与等级映射 `LEVEL_SEARCHES`。
- **全新实现要求**：
  - 枚举值限定 `local/sync/session/managed`，键形如 `` `${prefix}:${key}` ``，批量接口需做短键还原
  - `DEFAULTS` 取值与 `spec.md §3.2` 完全一致；`LEVEL_SEARCHES` 为 `member:5, silver:10, gold:20`
  - 数值读取需做 `NaN` 防御（`Number.isNaN` 回落），不得直接 `??` 依赖
  - 文件头同 1.1 版权头
- **验收**：
  - `entrypoints/hooks/useStorage.test.ts` 全绿（`storage.getItem/setItem/getItems/setItems` 行为）
  - 新增边界用例：`undefined/"abc"` 回落、批量短键还原、跨 `sync` 前缀隔离
  - `npm run test` 通过

### 1.3 搜索核心 — `entrypoints/utils/search.ts` + `entrypoints/utils/helpers.ts` + `entrypoints/data/searchTerms.ts`

- **范围**：`toInt`、`buildSearchQuery`、`buildSearchUrl`、`nextDelayMinutes`、`shouldOpenMore`、`getRndInteger/wait`、三组词库。
- **全新实现要求**：
  - 词库为全新选词（不得复制原词表），保持“前缀-主题-后缀”自然语句结构，中英混合、量级相当（前缀 ~20、主题 ~80、后缀 ~15）
  - `BING_SEARCH_URL` 与 `BING_SEARCH_PARAMS` 常量值与 `spec.md §4.4` 一致，查询需 `encodeURIComponent`
  - `nextDelayMinutes` 实现 ±75% 对称抖动、下限 0.1 分钟；`closeTime` 与 `waitAndClose` 的双重抖动按 `spec.md §4.2–4.3` 重述逻辑独立编码
  - 版权头同 1.1
- **验收**：
  - `entrypoints/utils/search.test.ts`、`helpers.test.ts` 全绿
  - 额外断言：抖动区间统计（多次采样均值≈基准、极值在 ±75% 内）、`shouldOpenMore` 边界（`opened === searches` 为 false）、`toInt` 容错

### 1.4 后台闹钟与搜索调度 — `entrypoints/background.ts` + `background/searchRunner.ts` + `background/dailySchedule.ts`

- **范围**：`onInstalled/onStartup/onMessage/alarms.onAlarm` 挂载、`startSearches/handleAlarmStep/stopSearches/watchSearchesToggle`、`runRewards/checkLastOpened/handleInstallOrUpdate/handleStartup`。
- **全新实现要求**：
  - 闹钟名常量全新命名或保留语义但独立定义（如 `openTabAlarm` 可保留语义，禁止复制原文件结构与注释）
  - `startSearches` 立即开首页+记 1，`handleAlarmStep` 每步重读存储并校验 `active` 与 `shouldOpenMore`，`stopSearches` 清 `isSearching`、清徽标、清所有闹钟
  - `watchSearchesToggle` 监听 `sync:active === false` 立即终止
  - `dailySchedule` 的 `runRewards` 先开每日任务再按 `searches>0` 启动搜索；`handleStartup` 先清状态再判 `checkLastOpened`（避免重启后旧闹钟继续开页且标志被覆盖）
  - 文案、注释、日志均为全新撰写
  - 版权头同 1.1
- **验收**：
  - `entrypoints/background/searchRunner.test.ts` 全绿（含“关闭开关后不续开”、“已达上限不再建闹钟”、“闹钟名不匹配忽略”等）
  - 手动验证：`active` 同步关闭、浏览器重启后不残留闹钟（`browser.alarms.clearAll` 在 startup 首行）
  - `npm run compile` / `test` / `build` / `build:firefox` 全绿

### 1.5 每日任务 — `background/dailyRewards.ts` + `entrypoints/utils/dailyAnchors.ts`

- **范围**：`openDailyRewards`（仪表盘前台打开、子页焦点管理、90s/300ms/2–5s/20s 计时）、`matchDailyAnchors`（`div.grid > a` + `form/FORM` 过滤）。
- **全新实现要求**：
  - 选择器与过滤条件可与规格一致（属于行为描述），但实现函数需独立编写，变量/函数名不得照搬
  - 超时与 linger 时长按 `spec.md §5.4` 表格实现，硬编码常量需全新命名并附全新注释
  - 版权头同 1.1
- **验收**：
  - `entrypoints/utils/dailyAnchors.test.ts` 全绿
  - 新增用例：无 `form` 链接被过滤、大小写 `FORM` 均命中、`div.grid` 外链接不计入、空集时调用方继续等待
  - 人工走查：仪表盘前台打开、子页不抢焦点、90s 兜底关闭

### 1.6 内容脚本 — `entrypoints/bingResult.content.ts` + `entrypoints/rewards.content.ts` + `entrypoints/utils/oncePerPageRun.ts` + `entrypoints/utils/browserAction.ts`

- **范围**：Bing 结果页首条跳转（`marAuto` 标记、`#b_results li.b_algo h2 a`、8s 等待、1.5–5.5s 随机后 `location.assign`）、仪表盘点击分发（`openDaily`→`anchor.click()`→`dailyDone`）、每页一次防护、徽标 API 兼容（`action` vs `browserAction`）。
- **全新实现要求**：
  - 选择器与 URL 标记值与规格一致（行为必需），其余逻辑（等待、延迟、去重、徽标颜色 `#2282ad`）独立编码
  - `oncePerPageRun` 全新实现（可用 `window` 属性或 `Set` 去重，禁止复制原实现）
  - 版权头同 1.1
- **验收**：
  - `bingResult` 在无 `marAuto` 时不动作、有标记时仅跳转一次
  - `rewards` 收到 `openDaily` 后依次点击、间隔 1–2s、完成后发送 `dailyDone`
  - 徽标在 MV3/MV2 下均可用（`browser.action` / `browser.browserAction` 兼容）

### 1.7 站点配置 — `entrypoints/config/siteConfig.ts`

- **范围**：`pagesBase/githubRepo/officialWebsite/helpUrl/mobileUrl/contactUrl/sponsorUrl/uninstallUrl/rewardsDashboard/rewardsAbout`。
- **全新实现要求**：
  - 保持 M4“纯 GitHub 化”：除 `rewardsDashboard/rewardsAbout` 指向 `rewards.bing.com` 外，其余均指向 `https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite`（含 `issues` 与卸载反馈模板）
  - 文件头同 1.1
- **验收**：
  - `entrypoints/config/siteConfig.test.ts` 全绿（断言所有 URL 前缀）
  - 改动此单一文件即可切换全部外链

### 1.8 测试与工具 — `vitest.config.ts` / `entrypoints/**/*.{test,spec}.ts` / `.github/workflows/ci.yml`

- **范围**：`WxtVitest() + happy-dom` 配置、现有 7 组测试文件、CI 双 job（extension + Flutter）。
- **全新实现要求**：
  - 测试用例为行为驱动，断言 `spec.md` 而非实现细节；新增用例需覆盖 1.2–1.7 的边界
  - CI 保持 `compile → test → build → build:firefox` 顺序
- **验收**：
  - `npm run test` 全绿且用例数 ≥ 现有（~39）
  - `npm run compile` 零错误

---

## 2. 版权头与 License 要求（每文件必备）

```ts
/**
 * Copyright (c) 2026 3y3y3y-huaiji
 * SPDX-License-Identifier: LicenseRef-Proprietary
 *  — Clean-room reimplementation. No code copied from spin311/MicrosoftRewardsWebsite.
 *  — Spec: docs/rewrite/spec.md
 */
```

- 每个新建/重写源码文件头部均须包含上述或等价版权头（License 标识以最终法务选定为准，可能是 `MIT`/`Apache-2.0`/`Proprietary`，但必须明确且与上游无冲突）
- 文档类（`docs/rewrite/*`）沿用 `CC BY 4.0`，在文件首部声明
- 禁止保留上游作者信息、禁止出现 `spin311` 代码片段或注释原文

---

## 3. 实施顺序（建议分 4 个 PR）

1. **PR-1 存储与配置**：1.1 + 1.2 + 1.7，先让 `compile/test` 绿
2. **PR-2 搜索核心**：1.3，补词库与单测
3. **PR-3 后台与每日任务**：1.4 + 1.5，需联调 `alarms/tabs/storage` 的 fake timers
4. **PR-4 内容脚本与收尾**：1.6 + 1.8，全量 `build/build:firefox` 校验，更新 `docs/ecc/*` 架构图

每个 PR 均需在 `rewards-core` 工作树内完成，推送到 `origin/rewrite/clean-core` 后提 PR 到 `master`。

---

## 4. 验收总门槛（CI 与人工）

- [ ] `cd wxt && npm run compile` — `tsc --noEmit` 零错误
- [ ] `npm run test` — `vitest run` 全绿（含新增边界用例）
- [ ] `npm run build` — `dist/chrome-mv3/manifest.json` 可被 `chrome://extensions` 加载
- [ ] `npm run build:firefox` — `dist/firefox-mv2/manifest.json` 含 `gecko.id`，可被 `about:debugging` 加载
- [ ] `grep -R "spin311" wxt/` 无命中（除 `docs/rewrite/*` 对上游的说明性提及）
- [ ] `npx jscpd` 或人工抽查：无与上游文件的连续 6 行以上雷同
- [ ] `git log --oneline -3` 显示本规格提交，`git status --short` 无未跟踪的业务代码（仅允许 `dist/.wxt/node_modules` 等已忽略项）

---

## 5. 风险与对策

| 风险 | 对策 |
|---|---|
| 误复制上游代码（变量名/注释/结构） | 以 `spec.md` 为唯一输入，关闭上游仓库标签页；CR 时用 `diff` 对照上游 `upstream/master` |
| 词库被判定为“复制” | 全新选词并记录选词依据（日常搜索高频词），附脚本证明随机采样 |
| 闹钟在打包后被钳制为 1 分钟 | 保留 `0.1` 下限但接受浏览器钳制，测试中使用 fake timers 不依赖真实闹钟精度 |
| 仪表盘 SPA 渲染时序不稳定 | 保留 `MutationObserver` 等待与 90s 兜底，测试中 mock `tabs.onUpdated` |

---

## 6. 验证指令（PowerShell 5.1，注意避免 `&&`）

```powershell
cd wxt
npm run compile 2>&1 | Out-String
if ($?) { npm run test 2>&1 | Out-String }
if ($?) { npm run build 2>&1 | Out-String }
if ($?) { npm run build:firefox 2>&1 | Out-String }
```

工作树校验：

```powershell
git log --oneline -3 | Out-String
git status --short | Out-String
```

---

*本计划仅描述“做什么与何时算完成”，不包含任何上游代码；执行时每个模块需独立设计、独立命名、独立注释。*
