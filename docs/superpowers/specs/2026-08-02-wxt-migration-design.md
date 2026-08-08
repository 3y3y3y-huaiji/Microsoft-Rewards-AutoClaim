# WXT Migration — Design Spec

**Date:** 2026-08-02
**Status:** Approved (design), pending implementation plan

## Goal

Refactor the Microsoft Automatic Rewards browser extension from its current
hand-maintained, per-browser TypeScript build (separate `chrome/` and `firefox/`
trees compiled by raw `tsc`) into a single **WXT** project that builds both
Chrome (MV3) and Firefox (MV2) from one codebase. The new implementation lives in
a top-level `wxt/` folder. Reusable helpers are ported from the sibling project
`../epic-free-games-claim/wxt-dev-wxt`.

## Why WXT / single codebase

The current `chrome/src/*.ts` and `firefox/src/*.ts` are near-duplicates that have
already **drifted**: Firefox carries an alarm-delay floor (`Math.max(…, 0.1)`), a
`rewards.bing.com//dashboard` double-slash typo, a different content selector
(`div.grid.gap-3 > a` vs `div.grid > a`), a 2–4 vs 3–5 search-word count, and a
version skew (2.2.8 vs 2.2.9). One WXT codebase using the `browser` namespace
eliminates this class of drift; WXT generates the correct per-browser manifest.

**Rejected alternatives:**
- *Per-browser entrypoint variants in WXT* — WXT already handles browser
  differences via config + `import.meta.env.BROWSER`; separate trees would just
  reintroduce drift.
- *Vanilla popup* — chose React 19 + the reference's `useStorage` hook for clean
  state management and maximal reuse of the reference helpers.

## Layout

Mirror the reference project exactly: non-entrypoint code nested under
`entrypoints/`, with `@` aliased to the project root, so reused helper files copy
over with their `@/entrypoints/...` imports unchanged.

```
wxt/
  wxt.config.ts          manifest, permissions, gecko id, browser targets
  package.json           wxt + react + vitest scripts (from reference)
  tsconfig.json          extends .wxt/tsconfig, @/* alias
  vitest.config.ts       WxtVitest
  public/imgs/           logos + png/svg assets (copied from prod)
  entrypoints/
    background.ts               wires listeners only (onInstalled/onStartup/onMessage/onAlarm)
    background/
      searchRunner.ts           createTabs / openTab / openAndClose / waitAndClose / alarm step
      dailyRewards.ts           openDailyRewards (opens dashboard tab, messages content script)
      dailySchedule.ts          checkLastOpened / install+update setup
    rewards.content.ts          injected on rewards.bing.com, clicks daily-set anchors
    popup/  index.html · main.tsx · App.tsx · App.css
    components/  Checkbox.tsx · NumberInput.tsx · SearchModeToggle.tsx · ManualClaimButton.tsx
    hooks/useStorage.ts         REUSED from reference (sync-aware)
    enums/storageValues.ts      REUSED
    types/messageRequest.ts     REUSED
    utils/
      helpers.ts                REUSED (trimmed: getRndInteger, wait, waitForElement, realClick)
      search.ts                 NEW pure logic: buildSearchQuery, toInt, scheduling math
      oncePerPageRun.ts         REUSED (content-script guard)
    data/searchWords.ts         NEW: the ~250-word array extracted from background
    settings.ts                 NEW: setting keys + defaults, one source of truth
```

Splitting the ~230-line background into `searchRunner` / `dailyRewards` /
`dailySchedule` keeps each file focused and makes the scheduling math
unit-testable in isolation.

## Behavior (preserved from current extension)

- **Popup** (React) reads/writes settings via `useStorage(..., SYNC)`. The
  "Get rewards" button sends `{action:"popup"}` to background and flips to
  "Stop searches" (sends `{action:"stop"}`). Background replies
  `{action:"searchEnded"}` to re-enable the button.
- **Background** on `popup` / daily-check: optionally opens the daily-rewards
  dashboard tab, then runs N throttled Bing-search tabs via `alarms`, closing
  each after `closeTime`. On install it seeds default settings, sets the
  uninstall URL, and opens the website tab; on update it badges "New".
- **Content script** on `rewards.bing.com` waits (MutationObserver) for daily-set
  anchors whose href includes `www.bing.com/search?q=` and clicks them on
  `{action:"openDaily"}`.

## Storage

Settings (`active, autoDaily, timeout, searches, closeTime, useWords,
isSearching, currentSearch, lastOpened`) stay on **`storage.sync`** to preserve
cross-device sync; `referralClicked` stays **local**. Storage type is passed
explicitly to the reused `useStorage` / `getStorageItem` helpers (which default
to local).

## wxt.config.ts

- name `Microsoft automatic rewards`, unified version **2.2.9**.
- `permissions: ['storage', 'alarms']` — matches current **Chrome** prod. Do
  **not** add `'tabs'` (triggers a "read browsing history" warning; not needed
  for `tabs.create/remove` or messaging an injected content script). Confirmed as
  a build/load gate.
- content script match `https://rewards.bing.com/*`.
- `browser_specific_settings.gecko`: id `microsoft_automatic_rewards@example.com`,
  `strict_min_version 91.0` — **preserved** so existing Firefox installs update in
  place.

## Behavior fixes (all approved; each enumerated in the plan before applying)

1. `parseInt(x) ?? DEFAULT` never falls back (`NaN` passes `??`). Replace with a
   `toInt(value, default)` helper across background/popup.
2. Firefox's `rewards.bing.com//dashboard` double-slash typo → single slash.
3. Content selector drift → standardize on `div.grid > a` + the
   `www.bing.com/search?q=` href filter (broader, resilient).
4. Word-count drift → standardize on **3–5** words.
5. Alarm `delayInMinutes` floor (`Math.max(…, 0.1)`) applied consistently. Note:
   Chrome clamps sub-minute alarms regardless of our value.
6. `currentSearch` off-by-one currently opens `searches + 1` tabs → fix to open
   **exactly `searches`** tabs.

## Testing (Vitest + WxtVitest)

Pure-logic units targeted for ≥80% coverage:
- `buildSearchQuery` — words vs letters mode, random-char prefix, count range.
- `toInt` — parses ints, falls back on `NaN`/`null`/`undefined`.
- scheduling math — `nextDelayMinutes`, `shouldContinue` (drives the off-by-one fix).
- daily-anchor matcher — jsdom fixture of the rewards grid.
- reused `useStorage` roundtrip test (from reference).

DOM/browser-API glue is thin and verified by manually loading the built
extension in both browsers.

## Out of scope

Existing `chrome/`, `firefox/`, `chrome/legacy/`, the Flutter app
(`microsoft_rewards_app/`), and prod zips are left untouched — `wxt/` supersedes
the build; retiring the old folders is a later cleanup. No CI changes unless
requested.

## Verification gates

`npm run compile` (tsc `--noEmit`, 0 errors) · `npm test` (Vitest green) ·
`npm run build` and `npm run build:firefox` (wxt build succeeds, both manifests
valid) · manual load in Chrome + Firefox.
