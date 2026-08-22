# Microsoft Rewards 自动搜索助手 — 核心行为规格（Clean-Room 提炼）

> **性质**：本文件为行为规格（specification），仅描述“插件对外表现做什么”，不复制任何上游实现代码。所有措辞为全新撰写，用于指导后续 clean-room 重实现。  
> **商用红线**：上游 `spin311/MicrosoftRewardsWebsite` 无 License，禁止复制其代码；本规格仅做功能抽象。  
> **基准版本**：`wxt/` @ `master`（WXT 0.20.6 / React 19 / MV3），`wxt.config.ts` / `background.ts` / `background/*` / `utils/search.ts` / `utils/settings.ts` / `enums/storageValues.ts` / `config/siteConfig.ts` 的可观察行为。

---

## 1. 产品形态与运行边界

- **产物**：Chromium MV3 扩展，构建工具为 WXT。开发与构建均在 `wxt/` 目录下执行，输出 `dist/chrome-mv3`（Chrome）与 `dist/firefox-mv2`（Firefox MV2 兼容构建）。
- **Manifest 来源**：不在静态 `manifest.json`，由 `wxt.config.ts` 以 `defineConfig({ manifest })` 声明。当前声明的权限仅 `storage` 与 `alarms`；入口包含 `action`（工具栏按钮）、图标组、`gecko.id`。
- **别名约定**：源码中 `@/` 指向 `wxt/` 根（`wxt.config.ts: alias` 与 `tsconfig.json: paths` 同步），后续重实现需保留该约定或等价迁移。
- **双包隔离**：`microsoft_rewards_app`（Flutter）与扩展无共享代码，重构不得跨包引入依赖。

## 2. 后台生命周期（Background）

后台模块以 `defineBackground` 注册，挂载四类事件：

| 触发源 | 行为义务 |
|---|---|
| `runtime.onInstalled`（`reason === "install"`） | 以 `DEFAULTS` 播种全部同步存储键，初始 `isSearching=false, currentSearch=0`，设置卸载反馈页 URL，延迟 1s 打开官网/GitHub 页。`reason === "update"` 时在工具栏徽标显示更新提示。 |
| `runtime.onStartup` | 视为“搜索会话不跨重启”：先清空所有 alarms、重置 `isSearching/currentSearch`、清徽标，再读取 `active/autoDaily` 决定是否执行“今日是否已跑”检查。 |
| `runtime.onMessage` | 接收 `action === "popup"` 触发一轮完整奖励流程；`action === "stop"` 立即终止搜索。 |
| `alarms.onAlarm` | 仅响应内部约定的搜索闹钟名，其余闹钟忽略。 |

额外义务：监听 `storage` 中 `sync:active` 键，一旦被置为 `false`（含其他设备同步过来），立即终止进行中的搜索并清闹钟，避免“后台仍在开页而弹窗显示已停止”的不一致。

## 3. 存储模型

### 3.1 命名空间

`enums/storageValues.ts` 定义四段前缀：`local / sync / session / managed`，实际键形如 `sync:active`。扩展内约定：

- **同步配置**（`sync`）：所有用户可调开关与计数均落 `sync`，以便跨设备同步。
- **本地/会话**：预留，未在当前核心流程中使用。

封装层 `hooks/useStorage.ts` 提供：React Hook `useStorage`（读写同步到 `storage`）、`getStorageItem/setStorageItem`、`getStorageItems/setStorageItems`（批量）、`mergeIntoStorageItem`。实现细节不赘述，规格要求：键必须带前缀、批量读写需做短键还原（`sync:xxx` → `xxx`）。

### 3.2 配置键与默认值（`utils/settings.ts: DEFAULTS`）

| 键 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `active` | boolean | `true` | 是否启用每日自动搜索 |
| `autoDaily` | boolean | `true` | 是否自动打开每日任务（Daily Set） |
| `accountLevel` | `"member" \| "silver" \| "gold"` | `"member"` | 账号等级，影响推荐搜索次数 |
| `timeout` | number (秒) | `60` | 两次搜索之间的基准间隔 |
| `searches` | number | `5` | 每日搜索次数上限 |
| `closeTime` | number (秒) | `5` | 单个搜索标签页存活时长 |
| `openFirstResult` | boolean | `true` | 搜索页是否自动打开首条自然结果 |
| `isSearching` | boolean | `false` | 运行态标记（进行中为 true） |
| `currentSearch` | number | `0` | 本轮已打开搜索页计数 |
| `lastOpened` | string (locale date) | — | 上次执行奖励流程的本地日期字符串 |

等级映射 `LEVEL_SEARCHES`：`member→5, silver→10, gold→20`，仅作为 UI 选择等级时的“建议值”，用户可手动覆盖 `searches`。

### 3.3 读写容错

所有从存储读取的数值型配置（`searches/timeout/closeTime/currentSearch`）需做稳健解析：非数字或缺失时回落到 `DEFAULTS` 对应值。`active` 缺失时亦回落到默认启用。

## 4. 搜索流程（Search Runner）

### 4.1 触发与调度

- **入口**：`dailySchedule.runRewards()` 统一编排；或由 `startSearches(timeout, searches, closeTime)` 直接启动。
- **首个标签页**：立即打开（不经闹钟），并将 `currentSearch` 记为 1。
- **后续标签页**：若 `opened < searches`，创建名为 `openTabAlarm` 的闹钟，延迟为 `nextDelayMinutes(timeout)`；否则立即结束。
- **闹钟步进**（`handleAlarmStep`）：每次触发时重新从 `sync` 读取最新配置与 `currentSearch/active`，做两重检查：① 若 `active` 已关闭或 ② 已达 `searches` 上限，则终止；否则再开一页、`currentSearch+1`、按需续建下一闹钟。
- **终止**（`stopSearches`）：置 `isSearching=false`、清徽标、清空所有 alarms。此操作需同时作为“关闭每日搜索开关”的副作用立即执行。

### 4.2 标签页生命周期与关闭

- 每个搜索页以 `tabs.create({ url, active: false })` 在后台打开，不抢焦点。
- 监听 `tabs.onUpdated` 等待 `status === "complete"` 后再进入关闭计时，避免在页面未加载完成时关闭导致积分未计入（content 脚本也依赖加载完成）。
- 关闭延迟 = `closeTime * 1000 ms` + 0–1000 ms 随机抖动；若 `closeTime ≤ 0` 则按 500 ms 兜底。
- 实际关闭时刻再叠加一次“提前 500 ms 补偿 + 0–1000 ms 抖动”的调度（即 `max(timeout-500,0)+rand`），以分散关闭时序。关闭前需 `tabs.get(id)` 校验标签页仍存在。

### 4.3 随机延迟策略

- **搜索间隔**：以用户配置 `timeout`（秒）为基准，叠加 ±75% 的对称随机散布（例如 60s 配置下散布约 ±45s），换算为分钟后设为闹钟 `delayInMinutes`，下限 0.1 分钟（防止 0 值；打包后浏览器仍可能将亚分钟闹钟钳制为 1 分钟）。
- **标签关闭抖动**：见 4.2，0–1000 ms。
- **首结果点击延迟**：见 6.1，1500 ms + 0–4000 ms。

目标：避免固定间隔与瞬时跳转的“机器人”特征；所有随机均基于 `getRndInteger(min,max)` 的均匀整数分布。

### 4.4 查询构造

- **词库**：`data/searchTerms.ts` 提供三组词：`SEARCH_LEAD_INS`（前缀，如 best/reviews of/指南）、`SEARCH_TOPICS`（主题，如 coffee/gardening/咖啡/园艺）、`SEARCH_TAILS`（后缀，如 for beginners/技巧/价格）。均为自然语言词汇，中英混合。
- **组句规则**：随机二选一 → `"<leadIn> <topic>"` 或 `"<topic> <tail>"`，使查询读起来像真人搜索（例：`best headphones`、`gardening for beginners`），禁止随机字符或无意义拼接。
- **URL**：`https://www.bing.com/search?q=<encodeURIComponent(query)>&qs=n&form=QBLH&sp=-1&pq=`。若用户开启 `openFirstResult`，追加 `&marAuto=1` 标记，供内容脚本识别。
- **进度与徽标**：每打开一页后，持久化 `currentSearch` 与 `isSearching=true`，并在工具栏徽标以单数字显示已完成数（徽标仅容纳 4 字符，完整 `3/5` 在弹窗中展示）。

## 5. 每日任务（Daily Rewards / Daily Set）

### 5.1 总体流程

`dailyRewards.openDailyRewards()` 负责：

1. 记录当前活动标签页 ID（用于结束后恢复焦点）。
2. 以 `active: true` 打开 `https://rewards.bing.com/dashboard` 仪表盘（必须前台打开：后台隐藏标签页会被浏览器暂停渲染，仪表盘 SPA 不会渲染每日任务网格，内容脚本也无法持续点击）。
3. 监听 `tabs.onCreated`：若新标签页的 `openerTabId` 为仪表盘，则视为“每日任务点击产生的搜索页”，立即将焦点切回仪表盘（保持其渲染），并为该子页安排“加载后随机 2–5s 关闭，硬上限 20s”。
4. 向仪表盘内容脚本发送 `openDaily` 指令，等待其完成全部卡片点击后回传 `dailyDone`，或超时 90s 兜底关闭仪表盘。
5. 结束时移除所有监听，关闭仪表盘，尝试恢复到步骤 1 记录的原活动页。

### 5.2 仪表盘内容脚本（`rewards.content.ts`）

- 匹配 `https://rewards.bing.com/*`，每页仅执行一次（`oncePerPageRun` 去重）。
- 收到 `openDaily` 后，等待每日任务锚点出现（轮询 + `MutationObserver`），锚点判定见 5.3。
- 依次 `anchor.click()`（必须走点击事件，让仪表盘自身处理器计分；直接打开 `href` 不计分），每次点击间隔 `1000 ms + 0–1000 ms` 随机延迟。
- 全部点击后发送 `dailyDone`。

### 5.3 每日锚点判定（`utils/dailyAnchors.ts`）

- 候选：`div.grid > a` 下的所有锚点。
- 过滤：仅保留 URL 查询串含 `form` 或 `FORM` 参数的锚点（Bing 对每日任务卡片的追踪码），排除导航类链接（redeem/homepage 等）。该规则不假设卡片数量固定，且在卡片渲染前返回空集以便调用方继续等待。

### 5.4 时序与容错

| 计时器 | 时长 | 作用 |
|---|---|---|
| 仪表盘最大存活 | 90s | 即使内容脚本未回 `dailyDone`（页面渲染失败、消息丢失等）也强制关闭 |
| 仪表盘加载后指令延迟 | 300 ms | 等待 SPA 完成首轮渲染再发 `openDaily` |
| 每日任务子页 linger | 2000–5000 ms（随机） | 加载完成后等待再关闭，确保搜索计入 |
| 每日任务子页硬关闭 | 20000 ms | 即使未触发 `complete` 也关闭 |

## 6. 内容脚本 — Bing 搜索结果页（`bingResult.content.ts`）

- 匹配 `https://www.bing.com/search*`，仅当 URL 含 `marAuto=1` 时生效（即扩展打开的搜索页）；手动搜索无标记，不干预。
- 每页仅执行一次（`oncePerPageRun`）。
- 等待首条自然结果出现：选择器 `#b_results li.b_algo h2 a`，通过即时查询 + `MutationObserver` 等待，上限 8s，超时则放弃并打印警告。
- 命中后等待 `1500 ms + 0–4000 ms` 随机延迟，再以 `location.assign(href)` 在当前后台标签页内导航（不使用 `anchor.click()`，避免新标签或抢焦点，保持用户当前焦点不变）。
- 导航后该标签页仍受 `searchRunner` 的 `closeTime` 关闭计时管辖。

## 7. 外链与站点配置（`config/siteConfig.ts`）

M4 已“纯 GitHub 化”：所有对外页面、帮助、联系、赞助、卸载反馈等 URL 均指向 `https://github.com/3y3y3y-huaiji/MicrosoftRewardsWebsite`（含 `issues` 与 `issues/new?title=[卸载反馈]`）。`rewardsDashboard` 指向 `https://rewards.bing.com/`，`rewardsAbout` 指向 `.../about?section=benefits`。后续重实现如需改外链，只改此单一配置源并同步测试。

## 8. 非功能约束

- **权限最小化**：仅 `storage` 与 `alarms`，不得新增 `tabs` 以外的高敏权限除非规格明确要求。
- **跨浏览器**：Chrome MV3 为主，Firefox MV2 需同构（`manifest.browser_specific_settings.gecko`、`action` vs `browserAction` 的徽标 API 兼容）。
- **可测试性**：`vitest + WxtVitest() + happy-dom`，测试文件位于 `entrypoints/**/*.{test,spec}.ts`，现有约 39 用例覆盖 `siteConfig/search/dailyAnchors/helpers/progress/searchRunner/useStorage` 等。
- **构建校验**：提交前必须 `npm run compile`（`tsc --noEmit` 零错误）、`npm run test`（vitest 全绿）、`npm run build` 与 `npm run build:firefox` 均成功（CI `extension` job 顺序）。

---

## 附：术语表

- **Daily Set / 每日任务**：Bing Rewards 仪表盘上的每日可点击卡片，完成可获积分。
- **marAuto**：扩展自定的 URL 标记参数，用于区分“自动搜索页”与“用户手动搜索页”。
- **closeTime**：单个搜索页在后台的存活时长，到期自动关闭。
- **oncePerPageRun**：每页仅执行一次的防护，避免内容脚本重复触发。

> 本规格未包含任何上游代码片段，亦未描述具体函数实现；后续 clean-room 实现需基于本规格独立设计与编码，并在文件头标注自有版权与新 License。
