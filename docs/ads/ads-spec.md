# 广告位设计规范（MV3 合规 / 用户 opt-in）

> worktree: `rewards-ui-ads` / 分支 `feat/ads-optin` — 本文档定义插件内广告的合规落地方案。  
> 约束来源：Chrome Web Store 开发者政策（MV3 远程代码禁令、欺骗性体验、隐私披露）、`wxt/wxt.config.ts:7`（manifest 唯一来源）、`wxt/entrypoints/popup/App.tsx:1`（popup 结构）、`wxt/entrypoints/config/siteConfig.ts:1`（外链集中）。

## 1. 目标与合规边界

- 目标：在不影响核心“自动/一键领积分”功能的前提下，探索可持续的捐助/赞助（ads）收入，**默认关闭**，用户显式 opt-in 后才展示。
- 红线：
  - **禁止**向 `bing.com` / `rewards.bing.com` / 任意第三方内容页注入广告 DOM、样式或脚本（content scripts `bingResult.content.ts` / `rewards.content.ts` 保持纯功能）。
  - **禁止**执行远程 JS、动态 `eval`/`new Function`、远程模板拼装、`fetch` 拉取可执行代码并执行。所有展示资源随扩展打包（`wxt/dist/chrome-mv3`）或为静态图片。
  - 不遮挡核心操作、不模拟系统/浏览器 UI、不误导点击（符合“Deceptive behavior”条款）。
  - 隐私：`permissions` 仅 `storage` + `alarms`（`wxt/wxt.config.ts:11`），不新增 `host_permissions`；披露与开关逻辑见 §5。

## 2. 广告位位置

### 2.1 Popup 底部（主位，`slot: "popup-bottom"`）

- 锚点：`wxt/entrypoints/popup/App.tsx:97-107` 的 `footer-links` 容器下方新增一个独立区块 `<section id="ads-slot-popup">`，与现有 GitHub / Rewards / 赞助链接保持视觉分隔。
- 布局：
  - `App.css` 既有 `body { width: 20em; min-height: 13em }`，弹窗宽度受限，广告区限高 **≤ 90px**，超出截断，不导致弹窗滚动跳动。
  - 内容居中、上下 `border-top` 分隔、右上角常驻“广告 · 支持我们”字样 + `ⓧ 关闭`（关闭即写回 `adsEnabled=false`）。
  - 未 opt-in 时该区块不渲染任何占位，保持现有 footer 高度不变，避免 CLS。
- 交互：点击整个卡片跳转外链（`target="_blank" rel="noopener noreferrer"`），不使用 `window.open` 注入脚本。

### 2.2 Options 页可选位（次位，`slot: "options-inline"`）

- 如后续新增 `entrypoints/options/` 页面，在设置表单底部、保存按钮上方插入一条横幅位，复用与 popup 相同的组件与开关状态（同一 `sync:adsEnabled` 键）。
- Options 位默认不启用，仅当 `adsConfig.optionalSlot` 存在且用户已在 popup 完成 opt-in 后才可见；提供独立“在选项页隐藏赞助内容”复选框，写入同一开关（不新增存储键）。

## 3. 形态与技术约束

- **形态**：静态图片（`wxt/public/imgs/ads/*` 打包内）+ 标题/一句话文案 + 外链。图片 `max-width: 100%`、`object-fit: contain`，不使用 `<iframe>`、`<video autoplay>`、闪烁动画。
- **文案**：标题 ≤ 16 字，正文 ≤ 28 字，按钮文案固定为“查看详情 / 去看看”，避免“点击获积分”等与 Rewards 混淆的表述。
- **外链**：URL 必须收敛到 `siteConfig`（见 §6），不得在组件内硬编码域名。点击仅做 `href` 导航，不经 background 转发、不附加搜索参数、不读 `storage` 明文。
- **禁止远程 JS**：
  - 广告组件不得 `import` 任何远程脚本、不得 `fetch` 并 `innerHTML` 注入、不得挂 `MutationObserver` 到 Bing 页面。
  - CSP 沿用 WXT/MV3 默认，不在 `wxt.config.ts:manifest.content_security_policy` 中放宽 `script-src`。
- **性能**：图片预压缩（WebP ≤ 30KB），popup 打开时不做网络请求；外链目标页的加载由浏览器正常导航承担。

## 4. 开关与存储（默认关闭）

- **存储键**：`StorageValues.SYNC:adsEnabled`（`wxt/entrypoints/enums/storageValues.ts:2-5` 的 `SYNC="sync"`，与现有 `useStorage` 约定一致，键形如 `sync:adsEnabled`）。
- **默认值**：`false`。在 `wxt/entrypoints/utils/settings.ts:3` 的 `DEFAULTS` 新增 `adsEnabled: false`（后续实现时补），`adsConfig.ts` 的 `enabled/defaultEnabled` 仅为编译期占位，不替代运行时存储。
- **读写**：
  - 读：`useStorage<boolean>('adsEnabled', DEFAULTS.adsEnabled, StorageValues.SYNC)`（`wxt/entrypoints/hooks/useStorage.ts:10`）。
  - 写：用户在首次披露弹层点“同意展示”或在设置中勾选“显示赞助内容”时 `setAdsEnabled(true)`；点“不再显示/关闭广告”时 `setAdsEnabled(false)`。不提供“永久忽略”以外的隐藏路径。
- **同步**：`sync` 区域自动跨设备同步，不新增 `local` 冗余键；background 不缓存广告开关，popup 每次挂载以 storage 为准。
- **测试**：沿用 `wxt/vitest.config.ts:5` 的 `WxtVitest() + happy-dom`，单测覆盖 `adsEnabled` 默认 `false`、切换后持久化、未 opt-in 时 popup 不渲染广告容器的断言。

## 5. 披露与同意流程

- **首次安装弹层**（`runtime.onInstalled` 触发，仅一次）：
  - 在 popup 顶部以非模态条幅（不遮挡“每日自动搜索”等核心勾选）提示：“本扩展提供可选的赞助展示以支持维护，默认关闭。开启后仅在扩展弹窗/选项页底部展示静态图片赞助，不会向 Bing/Rewards 页面注入任何内容。”
  - 两个按钮：`[开启赞助展示]`（写 `true`）与 `[保持关闭]`（保持 `false` 并记录 `adsDisclosureDismissed=true` 避免重复打扰）。关闭按钮可重复在设置中改回。
- **常驻入口**：
  - Popup 设置区新增一行复选框“显示赞助内容（仅弹窗/选项页）”，`tooltip` 说明同上，受 `adsEnabled` 控制。
  - Footer 保留 `siteConfig.sponsorUrl` 的“赞助”链接（`App.tsx:104`），与广告开关并列但语义区分：前者是捐赠页，后者是广告开关。
- **隐私政策链接**：
  - 弹层与复选框旁均放置“隐私政策”外链，指向 `siteConfig.privacyUrl`（新增，见 §6），页面需声明：不收集浏览历史、不向广告方传输 Rewards 账号/搜索词、开关状态仅存于 `chrome.storage.sync`。
  - 卸载反馈页 `siteConfig.uninstallUrl` 保留，用于回收“因广告卸载”原因。

## 6. siteConfig 新增字段用法

现有 `wxt/entrypoints/config/siteConfig.ts:1-12` 已集中 `sponsorUrl` 等外链。广告相关扩展如下（后续实现时在 `siteConfig.ts` 增量添加，保持 `as const` 与 `siteConfig.test.ts` 同步）：

```ts
export const siteConfig = {
  // ...existing
  sponsorUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite', // 既有：捐赠/赞助
  adsUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite#sponsor', // 新增：广告/赞助详情落地页（静态说明，非广告网络）
  privacyUrl: 'https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite#privacy', // 新增：隐私政策（披露广告与数据）
} as const;
```

- **使用约束**：
  - 广告组件的跳转 `href` 只能取 `siteConfig.adsUrl` 或 `siteConfig.sponsorUrl`，不得接受 props 传入任意 URL。
  - 若未来对接自有赞助页，新增 `adsImageUrl` 仍指向打包内静态资源或 `siteConfig` 白名单域名，不开放运行时配置远程 URL。
  - `sponsorUrl` 继续用于 footer “赞助”文案（`App.tsx:104`），`adsUrl` 专用于广告卡片点击，避免两者混用导致审计歧义。

## 7. adsConfig 占位说明

- 文件：`wxt/entrypoints/config/adsConfig.ts`（本分支已创建最小可编译占位，`export const adsConfig = { enabled: false, slot: "popup-bottom", ... }`，不引入远程代码）。
- 作用：编译期常量，供 popup/options 组件做**静态分支**（`if (!adsConfig.enabled) return null` 的占位，实际是否展示以 `sync:adsEnabled` 为准），确保 `npm run compile`（`tsc --noEmit`）在无广告实现时仍通过。
- 后续可扩展字段（均静态、打包时确定）：`optionalSlot: "options-inline"`、`storageKey: "adsEnabled"`、`storageArea: "sync"`、`requireOptIn: true`、`allowRemoteJs: false`、`disclosureVersion: 1`。新增字段需保持 `allowRemoteJs` 恒为 `false` 的字面量约束。

## 8. 禁止事项（审核必查）

- 不在 `manifest.json`（`wxt.config.ts:manifest`）新增 `host_permissions` 去匹配 `*://*.bing.com/*` 以注入广告；content scripts 保持 `matches` 仅用于现有积分/搜索功能。
- 不使用 `chrome.scripting.executeScript` / `tabs.insertCSS` 向任意页面注入广告。
- 不引入第三方广告 SDK（AdSense / Taboola 等远程脚本），如需变现仅使用静态赞助位 + 自有落地页，否则将触发 MV3 远程代码审核失败。
- 不将 `adsEnabled` 与 `active/autoDaily` 等功能开关耦合，关闭广告不得影响自动搜索与日常任务。

## 9. 后续实现清单（不在本分支做，仅记录）

- [ ] `utils/settings.ts:DEFAULTS` 新增 `adsEnabled: false`
- [ ] `siteConfig.ts` 新增 `adsUrl` / `privacyUrl` 并更新 `siteConfig.test.ts`
- [ ] `entrypoints/components/AdsSlot.tsx`（纯展示组件，props 仅 `enabled: boolean`）
- [ ] `popup/App.tsx` 接入 `useStorage('adsEnabled', ...)` 与披露条幅
- [ ] 选项页（如有）复用同一开关
- [ ] 单测：默认关闭、opt-in 持久化、未 opt-in 不渲染

## 10. 审核自检

- `cd wxt && npm run compile` 通过（本分支验证项）
- `npm run build && npm run build:firefox` 产物中无远程脚本、`manifest.json` 无新增 host 权限
- 商店上架描述与隐私政策中如实披露“可选赞助展示、默认关闭、仅在扩展 UI 内展示”

