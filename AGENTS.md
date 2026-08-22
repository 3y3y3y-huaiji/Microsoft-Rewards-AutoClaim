# AGENTS.md

> 适用于本仓库的 OpenCode 会话。只保留“不写就会踩坑”的信息。

## 0. 商用红线（必读）

- **上游 `spin311/MicrosoftRewardsWebsite` 无 License**（`upstream` remote 已验证可 `git fetch`），代码版权归原作者。**禁止**直接复制上游代码去商用，必须**全新重实现/重构**（clean-room）。
- 本仓库 `origin` 为 `3y3y3y-huaiji/Microsoft-Rewards-AutoSearch`，新增汉化/文档以 `CC BY 4.0` 共享，但这**不覆盖**上游代码的授权缺口。重构后的 Chromium 插件需保留自有版权头与新 License。
- 本次目标产物是 **Chromium MV3 插件**（`wxt`），`microsoft_rewards_app`（Flutter）与历史 `chrome/`/`firefox/` 目录已废弃，重构时**不要**回迁旧代码。

## 1. 仓库现状（2026-08-22）

- 单一有效扩展入口：`wxt/`（WXT 0.20.6 + React 19 + TypeScript 5.8 + Vitest 4）。其余 `chrome/`/`firefox/` 已在 `c78e1bf` 删除，`site/` 已删。
- 双包结构：`wxt/`（插件，重点）与 `microsoft_rewards_app/`（Flutter 3.7+，`1.2.0+14`，与插件无共享代码）。插件改动不要碰 Flutter，反之亦然。
- 工作树极脏：`git status` 显示 300+ 未跟踪文件（`.agents/*` 为历史 AI 流水、`builds/` 为本机构建产物、`wxt/entrypoints/i18n/` 为新增未提交的 i18n 实现、`PROJECT.md`/`ORIGINAL_REQUEST.md` 为临时任务文档）。执行下一步重构前先做**文件夹整理**并把 `.agents/`、`builds/` 加入 `.gitignore`。
- `wxt/dist/`、`.wxt/`、`node_modules/` 已忽略；根 `.gitignore` 尚缺 `.agents/` 与 `builds/`。
- GitHub 连通性：`git fetch origin` / `git fetch upstream` 已验证可用（`2026-08-22` 成功拉取 `upstream/master` 新分支）。`gh` CLI 本机未安装，用 `git` 同步即可。如后续 `fetch` 失败，先告知用户再继续。

## 2. 关键命令（必须在 `wxt/` 下执行）

```bash
cd wxt
npm ci                 # CI 用 npm ci，本地可用 npm install
npm run compile        # tsc --noEmit，零错误才算过
npm run test           # vitest run，含 siteConfig / search / dailyAnchors 等 ~39 用例
npm run build          # Chrome MV3 -> wxt/dist/chrome-mv3
npm run build:firefox  # Firefox MV2 -> wxt/dist/firefox-mv2  (CI 要求两者都过)
npm run zip            # 商店上传包；wxt.config.ts 的 outDir=dist
npm run dev            # Chrome HMR 调试
npm run dev:firefox    # Firefox 调试
```

- Node：本地 `>=18`，CI 固定 `22`（见 `.github/workflows/ci.yml:19`）。
- Flutter（仅改 `microsoft_rewards_app/` 时）：`flutter pub get; flutter analyze; flutter test` — CI 中两者 `continue-on-error: true`。

## 3. 架构与坑位

- **Manifest 不在文件里**：`wxt/wxt.config.ts:7` 以 `defineConfig({ manifest: {...} })` 定义 `name/description/permissions/action/icons/gecko.id`。改名/权限只改此处。
- **别名**：`wxt.config.ts:6` 与 `tsconfig.json:11` 设 `alias: { '@': '.' }` / `paths: { "@/*": ["./*"] }`，导入写 `@/entrypoints/...`。
- **入口**：`wxt/entrypoints/background.ts:1` 为 `defineBackground`，挂 `runtime.onInstalled/onStartup/onMessage/alarms.onAlarm`；逻辑拆在 `background/dailySchedule.ts`、`background/searchRunner.ts`、`background/dailyRewards.ts`。`bingResult.content.ts` / `rewards.content.ts` 为 content scripts。
- **存储**：`entrypoints/hooks/useStorage.ts:10` 与 `utils/settings.ts:DEFAULTS` 用 `wxt/storage`（`storage.getItem("sync:key")`），键前缀来自 `enums/storageValues.ts`（`local/sync/session/managed`）。测试需 `vitest.config.ts:5` 的 `WxtVitest()` + `happy-dom`。
- **URL 集中**：`entrypoints/config/siteConfig.ts:1` 全部指向 `https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite`（M4 已纯 GitHub 化），改外链只改此文件并同步 `siteConfig.test.ts`。
- **搜索核心**：`utils/search.ts:buildSearchQuery/buildSearchUrl/toInt` + `utils/dailyAnchors.ts` + `data/searchTerms.ts`；`helpers.ts:getRndInteger` 控制随机延迟。自动关闭用 `alarms` + `closeTime`。
- **生成文件**：`wxt/.wxt/tsconfig.json` 由 `postinstall: wxt prepare` 生成，勿手改。

## 4. Git 与多进度工作流（用户已要求）

- **Remotes**：`origin`（可推）与 `upstream`（只读上游）。不要把 `upstream` 误推。
- **分支**：`master`（主线）、`safe-zh-cn`（零破坏汉化）、`dev`（WXT 0.21 升级线）、`add-mit-license`。重构新工作应在**新建**分支/工作树上进行。
- **工作树**：已在仓库内 `.worktrees/` 下创建 3 个并行工作树（`git worktree list` 可见）：
  ```bash
  git worktree add .worktrees/rewards-core -b rewrite/clean-core master  # 扩展内核 clean-room
  git worktree add .worktrees/rewards-ui-ads -b feat/ads-optin master    # 广告/汉化
  git worktree add .worktrees/rewards-mobile -b rewrite/mobile master    # Flutter 手机端
  ```
  每个工作树独立 `npm ci`，改动通过 `origin` PR 同步；禁止直接在 `master` 上做重构大改。`.worktrees/` 已加入 `.gitignore`。
- **整理顺序**：先 `git status --short` 确认脏文件 → 归档/删除 `.agents/` 流水、将 `builds/` 移出版本控制 → 补 `.gitignore` → 再建工作树。`PROJECT.md`/`ORIGINAL_REQUEST.md` 为过程文档，重构完成后归档到 `docs/` 或删除。
- 提交前必跑：`npm run compile && npm run test && npm run build && npm run build:firefox`（CI 的 `extension` job 顺序，见 `.github/workflows/ci.yml:22`）。

## 5. 验证与发布

- CI：`.github/workflows/ci.yml` 仅在 `master` 的 `push/PR` 触发，双 job（extension + Flutter）。扩展 job 要求 `compile/test/build/build:firefox` 全绿。
- 本地快速自检：`cd wxt && npm run compile 2>&1 | Out-String` 与 `npm run test 2>&1 | Out-String`（PowerShell 5.1 环境，避免 `&&`，用 `; if ($?) { ... }`）。
- 打包产物：`wxt/dist/chrome-mv3`（`manifest.json` 在此），加载方式 `chrome://extensions` → 开发者模式 → 加载已解压的扩展程序。
