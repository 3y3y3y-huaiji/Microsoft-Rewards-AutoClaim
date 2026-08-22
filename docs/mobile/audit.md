# 手机端现状审计（microsoft_rewards_app）

> worktree: `rewards-mobile` / 分支 `rewrite/mobile` / 审计基准 commit `2ce0264` / 日期 2026-08-22  
> 范围：`microsoft_rewards_app/` 全量（Clean + BLoC + InAppWebView），不含 `wxt/` 插件侧。

## 1. 总览结论

| 维度 | 结论 |
|---|---|
| 可用性 | 当前代码可 `flutter run`（Android 真机验证过历史构建），但属于**半废弃**状态：SDK 下限过旧、依赖未跟进 2026 年 Flutter 3.2x 生态、无 CI 强制门禁（`ci.yml` 对 Flutter job 为 `continue-on-error: true`） |
| 与 `wxt` 关系 | **零共享代码**：`wxt/` 用 WXT+TS+`wxt/storage`，App 用 Dart+`shared_preferences`+`flutter_inappwebview`。两产物独立版本、独立发布、独立商店审核。此为既定架构，复活时必须保持 |
| 风险等级 | **Android 中等、iOS 高、商店上架高**。不建议直接基于当前依赖发新版，需先完成阶段1升级 |

## 2. 基线信息

- `pubspec.yaml:1-5`：`name: microsoft_automatic_rewards` / `version: 1.2.0+14` / `environment: sdk: '>=3.7.0 <4.0.0'`
- `pubspec.lock:953-954`：`sdks: dart ">=3.10.0-0 <4.0.0"` / `flutter ">=3.27.0"` — 锁文件已是 Flutter 3.27 基线，但 `pubspec.yaml` 下限仍声明 `3.7.0`，会导致新同事用旧 SDK 遇到隐性编译失败
- `android/app/build.gradle.kts:10-11,29`：`compileSdk = 36` / `targetSdk = 36` / `ndkVersion = 27.0.12077973` / `minSdk = flutter.minSdkVersion`（当前 Flutter 3.27 默认为 21-23）。`compileSdk 36` 已超前（2026-08 Android 16），本地无对应 build-tools 会失败
- `android/app/src/main/AndroidManifest.xml:1-7`：`package="com.spin311.microsoft_automatic_rewards"` 仍为上游包名，`POST_NOTIFICATIONS` / `SCHEDULE_EXACT_ALARM` / `RECEIVE_BOOT_COMPLETED` 已声明，但缺少 `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` / `FOREGROUND_SERVICE`（见 §5）
- `ios/Runner/Info.plist:1-62`：`CFBundleDisplayName: Microsoft Automatic Rewards`（直接含 Microsoft 商标）、`NSAllowsArbitraryLoads=true` 全局明文流量、`LSApplicationQueriesSchemes: https`，无 `UIBackgroundModes`

## 3. 架构速览（已读源码）

```
lib/
  main.dart                          # WidgetsFlutterBinding + init() + NotificationService.init() + BlocObserver
  app.dart:9                         # MyApp -> MaterialApp -> BlocProvider<SearchBloc> -> StartupScreen
  core/
    constants/app_constants.dart:6   # maxSearches=50 / minSearches=1 / debounce 500ms
    constants/strings.dart
    di/injection_container.dart:12   # GetIt: SearchBloc(factory) / PerformSearch/singleton / SearchRepository/singleton / SearchWordsDataSource / SearchHelper
    di/SearchCancellationToken.dart:1 # 简单 bool 取消令牌，无 Stream/Completer
    utils/helpers/search_helper.dart:3 # 静态 launchSearch(controller, query) -> WebUri('https://www.bing.com/search?q=...&qs=n&form=QBLH&sp=-1&pq=')
    utils/validators/input_validators.dart:5 # 搜索次数 1-50 / delay >=0.5s
    utils/error_handler.dart:6       # SocketException/Timeout/Format 映射
  features/search/
    data/dataSources/search_words.dart:9 # SearchWordsDataSourceImpl.randomSentence() -> WordGenerator().randomSentence(2+rand(3))
    domain/repositories/search_repository.dart:4 # 抽象 performSearches
    domain/repositories/search_repository_impl.dart:10 # 循环 for i<count → onProgress → launchSearch → delay*1000+rand(1001)
    domain/useCases/perform_search.dart:6 # 校验 count>=1 / delay>=0 后透传
    domain/login_status.dart:9       # bingSignInUrl + isSignedInBingUrl()（已修复 Passport 误判）
    presentation/bloc/search_bloc.dart:9 # StartSearchEvent(count,delay,controller)/CancelSearchEvent ; SearchInitial/InProgress/Success/Failure/Cancelled
    presentation/pages/
      startup_screen.dart:10         # SharedPreferences.loggedIn -> SearchScreen / LoginScreen
      login_screen.dart:17           # 2阶段：介绍卡片 -> InAppWebView(bingSignInUrl) 监听 onLoadStop isSignedInBingUrl
      search_screen.dart:24          # 核心页面（571行）：count/delay 表单 + reminder/keepScreenOn + WebView(https://www.bing.com) + 进度条 + WakelockPlus + CookieManager 登出
  notifications/notification_service.dart:9 # flutter_local_notifications + flutter_timezone + timezone，exactAllowWhileIdle 每日提醒
```

### 关键调用链

`SearchFormState._startSearch:519` → `SearchBloc StartSearchEvent` → `PerformSearch.call` → `SearchRepositoryImpl.performSearches:29` → 循环内 `SearchHelper.launchSearch:11`（`controller.loadUrl(WebUri)`）→ `Future.delayed(delay*1000+rand≤1000ms)`。

取消：`SearchBloc._onCancelSearch:40` 发 `SearchCancelled` 并 `token.cancel()`，循环在下次迭代头 `if (isCancelled) break` 才生效（非抢占式）。

## 4. 依赖审计（需升级项）

| 包 | 当前 | 最新(2026-08) | 风险/备注 |
|---|---|---|---|
| `sdk: '>=3.7.0 <4.0.0'` | 3.7 下限 | Flutter Stable 已 3.32+ / Dart 3.8+ | `pubspec.lock` 实际需 Dart >=3.10。应升至 `>=3.22.0` 或 `>=3.27.0`，并在 CI 固定 `flutter 3.32.x` |
| `flutter_inappwebview: ^6.1.5` | 6.1.5 (2024) | 6.1.5 仍是最新但 6.1.x 在 AGP 8.7+ / compileSdk 35+ 有兼容补丁需跟进；Android 15+ 需测 `WebViewAssetLoader` 变化 | 核心依赖，任何升级必须回归 `loadUrl` / `CookieManager` / `WebStorageManager` |
| `flutter_local_notifications: ^19.2.1` | 19.2.1 | 19.x 仍主流，但 Android 14+ `SCHEDULE_EXACT_ALARM` 已为特殊权限，`exactAllowWhileIdle` 在部分 ROM 被降级为 `inexact` | `notification_service.dart:77` 依赖 `AndroidScheduleMode.exactAllowWhileIdle`，需加权限被拒降级路径 |
| `permission_handler: ^12.0.0+1` | 12.0.0+1 | 12.x 最新，但 `requestNotificationsPermission()` 在 Android 13+ 需配合 `POST_NOTIFICATIONS` 运行时申请，当前仅在 `scheduleDailyReminder` 时才申请 |  |
| `flutter_timezone: ^4.1.0` | 4.1.0 | 已归档边缘，替代为 `flutter_timezone` 仍可用但在 Android 15 上 `getLocalTimezone()` 偶发 `PlatformException` | `notification_service.dart:20` 未 catch 异常，会导致 `init()` 整体失败 |
| `wakelock_plus: ^1.3.2` | 1.3.2 | 1.3.x 最新 | 依赖 `keepScreenOn` 开关，`search_screen.dart:521` 在 `_startSearch` 时 `enable()`，成功/失败时 `disable()`，但 `Cancel` 路径未 `disable()`（漏） |
| `shared_preferences: ^2.5.3` | 2.5.3 | 2.5.x 最新 | 键名硬编码：`loggedIn` / `search_count` / `search_delay` / `send_daily_reminder` / `keep_screen_on` / `reminder_hour/minute` / `last_opened_date`，无迁移层 |
| `word_generator: ^0.4.6` | 0.4.6 | 0.4.x 停更 2 年 | 仅生成 2-4 词英文随机句，Bing 移动端对此类无意义 query 的计数策略可能收紧；且每次 `randomSentence` 新建 `WordGenerator()` 有 GC 抖动 |
| `get_it: ^8.0.3` / `flutter_bloc: ^9.1.0` / `bloc: any` | 8.0.3 / 9.1.0 / any | `bloc: any` 是隐患（会拉到 9.x 但未锁定） | 应固定 `bloc: ^9.0.0` |
| `flutter_launcher_icons: ^0.14.3` | 0.14.3 | 已废弃，迁移到 `icons_launcher: ^3.0.0` 或 `flutter_launcher_icons` 0.14 仍可用但 Flutter 3.32 警告 |  |
| `bloc_test: ^10.0.0` | 10.0.0 | 10.x 最新 | 仅测试 `login_status_test.dart:5`，`widget_test.dart` 为无效的 Counter 模板 |

### 其它隐性债

- `bloc: any` + `flutter_bloc 9.1.0` 在 `dart >=3.7` 下会触发 `equatable 2.0.7` 的 `Props` 变更警告（`EquatableMixin` 已废弃部分用法）。
- `android/build.gradle.kts:40-53` 的 `signingConfigs.create("release")` 明文 `storePassword="microsoft"` / `keyPassword="microsoft"`，密钥随仓提交风险（若 `upload-keystore.jks` 被误提交）。
- `analysis_options.yaml` 缺失（未找到），`flutter analyze` 使用默认 lint，无法捕捉 `SearchHelper` 被注册为实例却全为静态方法的不一致（`injection_container.dart:31 sl.registerLazySingleton(() => SearchHelper())` 但 `search_repository_impl.dart:35` 调 `SearchHelper.launchSearch` 静态）。

## 5. WebView 循环搜索逻辑审计

- 目标 URL：`search_helper.dart:8` `https://www.bing.com/search?q=$encodedQuery&qs=n&form=QBLH&sp=-1&pq=`。固定 `form=QBLH` 为桌面端参数，**移动端 Bing 任务**按上游要求应模拟移动 UA / `m.bing.com` 或 `www.bing.com` + 移动 `form`（如 `form=QBLH` 在移动端可能被计为桌面搜索，不计入 20 次/60 分的移动端配额）。
- 延迟：`search_repository_impl.dart:38` `delay*1000 + random.nextInt(1001)`，即用户填 20s 时实际 20.0-21.0s。随机 0-1s 在移动端过于规律，风控易识别；建议改为 `±15%` 抖动 + 偶发 `2-4s` 额外停顿。
- 进度回调：`onProgress(i+1, count)` 在 `loadUrl` 前触发，UI 进度与网络实际 `onLoadStop` 脱节；弱网下用户看到 20/20 但实际最后几次未加载完成。
- 取消语义：`SearchCancellationToken` 仅在循环头检查，`Future.delayed` 期间无法中断；用户点 Cancel 后最长仍需等待 `delay` 才停。
- 登录态：`login_screen.dart:111` 监听 `onLoadStop` + `isSignedInBingUrl` 判断成功，但 `search_screen.dart:491` 的 `InAppWebView(initialUrlRequest: https://www.bing.com)` 未注入 UA/cookie 同步，冷启动时 `bing.com` 可能先 302 到 consent 页导致误判未登录。
- 资源：`search_screen.dart:186 _webViewController?.dispose()` 在 `dispose()` 中调用，但 `InAppWebViewController.dispose()` 在新版 `flutter_inappwebview` 已废弃（由 widget 生命周期管理），会抛 `NoSuchMethodError`。

## 6. 保活与通知审计

### Android（可保活，但需补权限与前台服务）

- 现状可行：`WakelockPlus.enable()` + `keep_screen_on=true` 默认开启，可在 20 次 × 20s ≈ 6-7 分钟内保持屏幕常亮完成任务。`AndroidManifest` 已有 `SCHEDULE_EXACT_ALARM` / `RECEIVE_BOOT_COMPLETED`，`NotificationService.scheduleDailyReminder:61` 用 `zonedSchedule(matchDateTimeComponents: time, androidScheduleMode: exactAllowWhileIdle)` 可在 Doze 下触发。
- 风险：
  1. Android 14+ `SCHEDULE_EXACT_ALARM` 默认为拒绝，需引导用户到 `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM`，当前仅 `requestNotificationsPermission()` 未覆盖。
  2. 无 `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_TYPE`，若未来将搜索移至后台（用户切前台做别的事），`InAppWebView` 会被 `Activity` 销毁。当前设计强制前台常亮，算**可接受**但需在文档中明确告知用户“搜索期间不要切后台/锁屏”。
  3. `WakelockPlus` 在部分厂商 ROM（小米/华为）需额外 `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` 白名单，否则 5 分钟后仍被杀。
  4. `NotificationService.init:20 FlutterTimezone.getLocalTimezone()` 未做 `try/catch`，在无 SIM/飞行模式下抛异常会导致整个 `main()` 无法 `runApp`。

### iOS（会被挂起，不可后台自动搜）

- 现状不可后台：`Info.plist` 无 `UIBackgroundModes`（`fetch`/`processing`/`background-app-refresh`），`InAppWebView` 在 App 进入后台 ~30s 后被 `WebKit` 暂停，`performSearches` 的 `Future.delayed` 链随 `Isolate` 挂起，**无法像 Android 那样持续 20 次**。
- 额外问题：
  1. `flutter_local_notifications` 在 iOS 上 `zonedSchedule` 需用户授权 `UNUserNotificationCenter`，当前 `notification_service.dart:49 _requestNotificationPermissions` 仅处理 Android，iOS 侧永远不弹授权。
  2. `wakelock_plus` 在 iOS 仅是 `UIApplication.idleTimerDisabled = true`，锁屏仍会挂起。
  3. `NSAllowsArbitraryLoads=true` 会被 App Review 质疑，需改为 `NSAllowsArbitraryLoadsInWebContent=true` 或域名白名单。
- 结论：**iOS 仅能做前台手动触发的 20 次搜索**，不可承诺“像上游那样后台自动获积分”。需在 UI 文案中明确 iOS 限制，避免审核被拒时用户投诉。

## 7. 商店上架风险（Play Store vs App Store）

| 风险 | Play Store | App Store | 缓解 |
|---|---|---|---|
| 商标 | `CFBundleDisplayName` / `android:label` 含 `Microsoft` / `Bing`，Play 对商标投诉较宽松但仍可能被 Microsoft 投诉下架 | App Review 对 `Microsoft` 商标零容忍，**必拒** | 更名为 `Reward Search Automator` / `Search Automator for Rewards`，描述中用 `for Microsoft Rewards` 合理使用 |
| 自动化/欺骗 | Play `Deceptive Behavior` 政策：自动化点击/搜索若伪装人工可能被认定欺骗；但同类“auto search”应用历史上架过，只要声明“需用户登录且手动触发”可过 | App Store 4.0 设计 / 5.2.2 欺骗：自动化 Bing 搜索被视为“操纵奖励系统”，**高拒** | 上架版必须：① 默认不自动、需用户点 Start；② 明确“非 Microsoft 官方”；③ 提供 `Help` 链接到 rewards.bing.com 说明规则 |
| 权限 | `SCHEDULE_EXACT_ALARM` 自 Android 14 起被 Play 列为受限权限，需在 Play Console 声明用途（提醒） | iOS 无此问题 | 在 `store listing` 中说明 exact alarm 仅用于每日提醒 |
| 隐私 | `flutter_inappwebview` 加载 `bing.com` 会传递 Cookie，需在 Data Safety 声明“收集浏览数据” | App Privacy 需声明 `Web Browsing` | 补充 `privacy_policy` 链接 |
| 包名 | `com.spin311.microsoft_automatic_rewards` 与上游一致，Play 要求包名全局唯一，fork 后应改为 `com.<your>.rewardsautomator` | 同理 Bundle ID 需唯一 | 复活时必须改包名/ID（否则无法上架且与上游冲突） |

## 8. 测试与质量缺口

- `test/login_status_test.dart:5` 覆盖 `isSignedInBingUrl` 8 用例，**是唯一有效测试**。
- `test/widget_test.dart:13` 为 Flutter 模板 Counter 测试，`expect(find.text('0'))` 在 `MyApp` 下永远失败（`flutter test` 必红，但 CI 因 `continue-on-error: true` 被掩盖）。
- 无 `search_repository_impl_test` / `perform_search_test` / `search_bloc_test` / `search_helper_test` / `notification_service_test`。
- 无移动端 20 次/60 分的端到端断言（见 `revival-plan.md` 阶段3）。

## 9. 与 `wxt` 插件的边界

- 零共享：无 `shared/` 目录，无 `siteConfig` / `searchTerms` 复用。移动端 `word_generator` 与插件 `data/searchTerms.ts` 词库完全不同，属正常（平台隔离）。
- 发布独立：`wxt` 走 Chrome Web Store / Firefox Add-ons，App 走 Play/App Store，版本号、更新节奏、隐私政策均独立。
- 唯一交集是文档与品牌：`docs/` 中需明确两者为同一组织下的两产物，但代码不耦合。

## 10. 建议优先级（供 revival-plan 引用）

1. P0：升 SDK/依赖并修 `bloc: any` / `SearchHelper` 静态不一致 / `widget_test.dart` / `NSAllowsArbitraryLoads` / 包名商标。
2. P1：重写 `SearchHelper` + `SearchRepositoryImpl`（移动 UA、抖动、`onLoadStop` 同步、抢占式取消）与 `NotificationService`（Android exact alarm 降级 + iOS 授权 + timezone 容错）。
3. P1：补 Android 前台服务或至少文档化“前台常亮”约束；iOS 明确不支持后台。
4. P2：补测试金字塔（单元→Bloc→Widget→集成）与 Play/App Store 合规更名。

---
*审计人：OpenCode (Muse Spark) / 审计方式：静态读码 + pubspec/manifest 配置审查，未执行真机 `flutter run`。*
