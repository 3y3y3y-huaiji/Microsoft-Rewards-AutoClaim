# 手机端复活计划（rewrite/mobile）

> 目标：像上游 `spin311/MicrosoftRewardsWebsite` 那样实现**手机自动获积分**，含**移动端 Bing 20 次/60 分**任务（桌面端 30-50 次另计）。  
> 约束：与 `wxt` 插件**无共享代码、独立发布**；遵循 `AGENTS.md §0` 商用红线（clean-room，不复制上游）；仅操作 `rewards-mobile` 工作树。

## 0. 总体原则

- **独立产物**：`microsoft_rewards_app` 与 `wxt/` 版本、分支、CI、商店上架完全独立。`wxt` 的 `siteConfig` / `searchTerms` / `wxt/storage` 不向 App 泄漏；App 的 `word_generator` / `shared_preferences` 也不反向依赖插件。
- **前台优先**：Android 可前台常亮完成 20 次；iOS 仅前台，不承诺后台（见 `audit.md §6`）。
- **合规先行**：先更名去商标、改包名，再谈功能。
- **测试门禁**：阶段3完成前不发商店包；CI 将 Flutter `continue-on-error` 改为必过。

## 1. 阶段划分

### 阶段1 — 基线升级与债务清理（预计 2-3 天）

> 目标：`flutter pub upgrade` 可过，`flutter analyze` 0 告警，`flutter test` 全绿。

#### 1.1 环境

- [ ] `pubspec.yaml:5` `sdk: '>=3.7.0 <4.0.0'` → `'>=3.27.0 <4.0.0'`（或 `>=3.22.0`，与 `pubspec.lock:953` 对齐），本地与 CI 固定 `flutter 3.32.x`（`.github/workflows/ci.yml:19` 同步）
- [ ] `android/app/build.gradle.kts:10` `compileSdk = 36` 回落至 `35`（或安装 36 build-tools），`targetSdk = 35/36` 二选一并经真机验证；`ndkVersion` 保留 `27.x`
- [ ] 新增 `analysis_options.yaml`（`flutter_lints: ^5.0.0` + `strict-casts/strict-raw-types`），`flutter analyze` 纳入门禁

#### 1.2 依赖逐库修 breaking

| 库 | 动作 |
|---|---|
| `bloc: any` | 固定 `bloc: ^9.0.0`，`flutter_bloc: ^9.1.0` 保持，跑 `dart pub outdated` 确认 |
| `flutter_inappwebview: ^6.1.5` | 保持 6.1.5，验证 AGP 8.7+ 编译；若升级 6.2+ 需回归 `CookieManager` / `WebStorageManager` / `InAppWebViewController.dispose` 废弃 |
| `flutter_local_notifications: ^19.2.1` | 保持，补 Android 14+ `SCHEDULE_EXACT_ALARM` 被拒降级（`canScheduleExactAlarms()` 检查） |
| `permission_handler: ^12.0.0+1` | 保持，补 `POST_NOTIFICATIONS` 首次申请时机前移至 `StartupScreen` |
| `flutter_timezone: ^4.1.0` | 加 `try/catch` 包 `getLocalTimezone()`，失败回落 `UTC` 并打点 `debugPrint` |
| `wakelock_plus: ^1.3.2` | 保持，修 `Cancel` 未 `disable()` 漏（见 1.3） |
| `word_generator: ^0.4.6` | 评估替换为本地词库 `assets/search_terms.json`（复刻 `wxt/data/searchTerms.ts` 但 clean-room 重写，避免每次 `new WordGenerator()`） |
| `flutter_launcher_icons: ^0.14.3` | 迁移至 `icons_launcher: ^3.0.0` 或保留但加 `deprecated` 注释，图标去 Microsoft 商标 |
| `shared_preferences: ^2.5.3` | 保持，抽 `PreferencesKeys` 常量集 |
| `get_it: ^8.0.3` / `equatable: ^2.0.5` | 保持，关注 `EquatableMixin` 废弃警告 |

执行顺序：`flutter pub upgrade` → 逐个 `flutter pub upgrade <pkg>` → `dart fix --apply` → `flutter analyze` → `flutter test`。

#### 1.3 代码小修（不含重写）

- [ ] `core/di/injection_container.dart:31` `SearchHelper` 静态方法与实例注册不一致：改为 `registerLazySingleton<SearchHelper>(() => SearchHelper())` 并将 `SearchHelper.launchSearch` 改为实例方法，或反之全静态并移除注册
- [ ] `features/search/presentation/pages/search_screen.dart:186` 移除 ` _webViewController?.dispose()`（新版由 widget 管理）
- [ ] `features/search/presentation/bloc/search_bloc.dart:40 _onCancelSearch` 补 `WakelockPlus.disable()`（与 `search_screen.dart:140` 成功/失败路径对齐）
- [ ] `notifications/notification_service.dart:20/49` 补 `try/catch` + iOS 授权 `requestPermissions(alert: true, badge: true, sound: true)`
- [ ] `test/widget_test.dart:13` 删除 Counter 模板，改为 `MyApp` 启动冒烟（`pumpWidget` + `expect(find.byType(MaterialApp), findsOne)`）
- [ ] `android/app/build.gradle.kts:42-43` 明文 keystore 密码移至 `local.properties` / `keystore.properties`，`.gitignore` 加 `*.jks`
- [ ] `ios/Runner/Info.plist:53-57` `NSAllowsArbitraryLoads=true` → `NSAllowsArbitraryLoadsInWebContent=true`；`CFBundleDisplayName` 去 `Microsoft` 字样
- [ ] 包名/BundleID 更名：`com.spin311.microsoft_automatic_rewards` → `com.<org>.rewardsautomator`（`android/app/build.gradle.kts:25` + `Info.plist:CFBundleIdentifier` + `pubspec.yaml:name` 评估是否同步）

#### 1.4 验收

```bash
cd microsoft_rewards_app
flutter pub get
flutter analyze        # 0 issue
flutter test           # 全部通过（含 login_status_test.dart:5）
flutter build apk --debug   # Android 可出包
flutter build ios --no-codesign  # iOS 可出包（可选）
```

### 阶段2 — 重写 SearchHelper 保活与通知（预计 3-5 天）

> 目标：移动端 20 次/60 分任务在 Android 前台稳定完成，iOS 前台可完成且行为可预期；通知可靠。

#### 2.1 SearchHelper 重写（`core/utils/helpers/search_helper.dart:3`）

- [ ] **移动 UA**：`InAppWebViewSettings.userAgent` 设为移动 UA（如 `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 … Mobile Safari/537.36`），或至少让 `loadUrl` 带 `headers: {'User-Agent': mobileUA}`；`WebUri` 改为 `https://www.bing.com/search?q=$q&qs=n&form=QBRE&sp=-1`（移动 form，A/B 后校准；若 Bing 移动端已统一 `form=QBLH` 则保留但需注释依据）
- [ ] **抖动策略**：`search_repository_impl.dart:38` 从 `delay*1000+rand(1001)` 改为 `delayMs * (0.85 + rand*0.3) + (rand<0.15 ? rand(2000,4000) : 0)`，并将 `delay` 默认从 `20s` 降至 `6-10s`（移动端阈值更低，20s 过长易被系统杀）
- [ ] **onLoadStop 同步**：`SearchHelper.launchSearch` 返回 `Future<void>` 前等待 `controller` 的 `onLoadStop`（或超时 `8s`），而非 fire-and-forget；`SearchRepositoryImpl` 的 `onProgress` 改在 `onLoadStop` 后触发
- [ ] **抢占式取消**：`SearchCancellationToken` 增加 `Completer`/`CancelableOperation`，`Future.delayed` 改为 `Future.any([delayed, token.whenCancelled])`，点 Cancel 立即停
- [ ] **错误重试**：单次 `loadUrl` 失败重试 1 次（指数退避 1s），连续 3 次失败整批终止并 `emit(SearchFailure)`
- [ ] **计数校准**：新增 `lib/core/constants/bing_config.dart` 定义 `mobileSearchCount=20` / `desktopSearchCount=30-35` / `pointsPerMobileSearch≈3`，UI 默认 `22` 改为 `20`，并在 `AppConstants` 暴露

#### 2.2 保活（`search_screen.dart:521/140`）

- [ ] **Android**：保留 `WakelockPlus.enable/disable`，新增：
  - `AndroidManifest` 加 `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_DATA_SYNC`（若引入 `flutter_foreground_task` 则需 `foregroundServiceType`）
  - 可选引入 `flutter_foreground_task: ^8.x` 将搜索提升为前台服务（通知栏常驻“正在执行 12/20”），解决切后台被杀；若不引入则在 UI 明确提示“请保持前台常亮”
  - `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` 白名单引导（`permission_handler` + `openAppSettings()`）
- [ ] **iOS**：不做后台，仅保证前台 `idleTimerDisabled`，并在首次启动弹 `AlertDialog` 说明“iOS 需保持 App 在前台，锁屏/切后台会暂停”
- [ ] **生命周期**：监听 `WidgetsBindingObserver.didChangeAppLifecycleState`，`paused` 时暂停计时器、`resumed` 时继续，避免后台累积 drift

#### 2.3 通知（`notifications/notification_service.dart:9`）

- [ ] `init()` 加 `try/catch` 包 `FlutterTimezone.getLocalTimezone()`，失败回落 `tz.getLocation('UTC')`
- [ ] Android：`scheduleDailyReminder` 前检查 `canScheduleExactAlarms()`，被拒则降级 `AndroidScheduleMode.inexactAllowWhileIdle` 并提示用户
- [ ] iOS：补 `DarwinInitializationSettings` + `requestPermissions(alert:badge:sound:)`，`zonedSchedule` 加 `DarwinNotificationDetails`
- [ ] Boot 恢复：验证 `ScheduledNotificationBootReceiver` 在 Android 13+ 需 `RECEIVE_BOOT_COMPLETED` + `POST_NOTIFICATIONS` 双授权，已有 `AndroidManifest:5` 但需真机重启测试
- [ ] 新增 `cancelAll` / `pendingNotificationRequests()` 调试入口（`SearchScreen` 长按 Help 触发）

#### 2.4 登录态（`login_status.dart:9` / `login_screen.dart:111`）

- [ ] 保持 `isSignedInBingUrl` 现有 8 用例不变，新增 UA 场景用例（移动 UA 下仍判定正确）
- [ ] `LoginScreen` 的 `InAppWebView` 同步移动 UA，确保 `bingSignInUrl` 在移动视图下渲染

#### 2.5 验收

- Android 真机：`20` 次 / `delay 6s` / `keepScreenOn=true` 前台常亮完成，通知栏进度 1/20→20/20，Cancel 立即停，`WakelockPlus` 在结束/Cancel/切后台均释放
- iOS 真机：同上前台完成，切后台 30s 后暂停、回前台继续
- 重启后每日 19:00 提醒仍触发

### 阶段3 — 补移动端 20 次/60 分任务的测试（预计 2-3 天）

> 目标：为“移动端 20 次获 60 分”建立可回归的测试金字塔，CI 必过。

#### 3.1 单元测试

- [ ] `test/search_words_test.dart`：`SearchWordsDataSourceImpl.randomSentence()` 生成 2-4 词、非空、`Uri.encodeComponent` 后可逆
- [ ] `test/search_helper_test.dart`：mock `InAppWebViewController`，断言 `launchSearch` 构造的 `WebUri` 含 `bing.com/search?q=` + `form=QBRE`（或选定 form）+ 编码正确；失败重试 1 次
- [ ] `test/input_validators_test.dart`：`validateSearchCount` 边界 1/50/0/51/空/`"abc"`；`validateDelay` 边界 0.5/0.4/空
- [ ] `test/login_status_test.dart`：已 8 用例，新增移动 UA + `Passport` 大小写变体
- [ ] `test/search_repository_impl_test.dart`：mock `SearchWordsDataSource` + `SearchHelper`，验证 `performSearches(count:20)` 调 20 次、`onProgress` 20 次回调、`delay` 抖动区间、`CancellationToken` 抢占式中断、`ErrorHandler` 包装
- [ ] `test/perform_search_test.dart`：`count<1` / `delay<0` 抛 `ArgumentError`

#### 3.2 Bloc 测试

- [ ] `test/search_bloc_test.dart`（`bloc_test: ^10.0.0`）：
  - `StartSearchEvent(count:20, delay:6)` → `emits [SearchInProgress(0/0), SearchInProgress(1/20)…SearchInProgress(20/20), SearchSuccess]`
  - `Cancel` 在 5/20 时 → `emits [SearchInProgress…5/20, SearchCancelled]` 且不再 `Success`
  - 异常路径 → `SearchFailure` 含 `ErrorHandler` 文案

#### 3.3 Widget / 集成测试

- [ ] `test/search_screen_test.dart`：`pumpWidget` + `enterText` count/delay + `tap Start` → 进度条 0→20；`keepScreenOn` toggle 持久化到 `SharedPreferences`
- [ ] `integration_test/mobile_search_test.dart`（`integration_test` 包）：
  - 启动 → 跳过登录 → 设 `count=5` / `delay=2` → 点 Start → 断言 `InAppWebView` `loadUrl` 5 次（用 `mockito` 注入 fake controller）
  - 每日提醒：`scheduleDailyReminder(hour:19)` → `pendingNotificationRequests()` 含 1 条 `matchDateTimeComponents=time`
- [ ] 性能：20 次搜索内存不泄漏（`flutter test --coverage` + `leak_tracker` 已在 `pubspec.lock:403`）

#### 3.4 CI 门禁

- [ ] `.github/workflows/ci.yml` 将 Flutter job `continue-on-error: true` 改为 `false`，并加：
  ```yaml
  - run: flutter analyze
  - run: flutter test --coverage
  - run: flutter build apk --debug  # 可选
  ```
- [ ] 覆盖率阈值：`search_repository_impl` / `search_helper` / `login_status` ≥ 80%

#### 3.5 验收

```bash
flutter test                          # 全部绿，含新增 20+ 用例
flutter test --coverage               # 覆盖率达标
flutter analyze --fatal-infos         # 0
```

## 2. 非功能清单

- [ ] **更名与合规**：`README` / `store listing` 明确“非 Microsoft 官方，for Microsoft Rewards 合理使用”，`Help` 保留 `https://rewards.bing.com/` 外链（`search_screen.dart:82`）
- [ ] **隐私**：新增 `PRIVACY.md` 说明 WebView Cookie 用途，Play Data Safety / App Privacy 填报
- [ ] **版本**：`pubspec.yaml:2` `1.2.0+14` → `1.3.0+15`（阶段1后），与 `wxt` 的 `manifest.json` 版本独立
- [ ] **文档**：`docs/mobile/` 下 `audit.md` / `revival-plan.md` 随代码演进更新

## 3. 里程碑与依赖

```
阶段1 (2-3d) ──→ 阶段2 (3-5d) ──→ 阶段3 (2-3d) ──→ 商店预审
   │                │                │
   └─ 阻塞：Flutter SDK/AGP 可用性     └─ 阻塞：真机（Android 14+ / iOS 17+） availability
```

- 阶段1 无外部阻塞，可立即开始。
- 阶段2 需 Android 真机 + iOS 真机各一。
- 阶段3 依赖阶段2 的 `SearchHelper` 接口定版。

## 4. 风险与回退

- `compileSdk 36` 若 CI 无镜像，回退至 `35`。
- `flutter_foreground_task` 若引入导致包体积/权限被拒，回退为纯 `WakelockPlus` + 前台提示。
- iOS 若 `exactAllowWhileIdle` 替代方案被拒，降级为普通 `UNCalendarNotificationTrigger`。

## 5. 与 `wxt` 的协作边界

- 代码零共享：不建 `shared/`，不复用 `wxt/utils/search.ts` / `data/searchTerms.ts`，移动端词库独立维护。
- 发布独立：`wxt` 仍按 `npm run build / build:firefox / zip` 走 Chrome/Firefox 商店；App 按 `flutter build apk/ipa` 走 Play/App Store，互不阻塞。
- 文档共享：`docs/mobile/` 仅归属 `rewrite/mobile` 分支，不合并回 `master` 直至 App 达到可发布态。

---
*规划人：OpenCode (Muse Spark) / 基线：`audit.md` / 下一步：执行阶段1 checklist 并提 PR 至 `origin/rewrite/mobile`。*
