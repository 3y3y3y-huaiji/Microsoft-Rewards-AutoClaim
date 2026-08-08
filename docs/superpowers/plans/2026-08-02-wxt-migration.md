# WXT Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Microsoft Automatic Rewards extension as a single WXT project in `wxt/` that builds both Chrome (MV3) and Firefox (MV2) from one codebase.

**Architecture:** One WXT project using the `browser` namespace; WXT generates each browser's manifest. Background logic is split into `searchRunner` / `dailyRewards` / `dailySchedule`; all math/query pure functions live in `utils/search.ts` and are unit-tested. Popup is React 19 reusing the sibling project's `useStorage` hook. Assets and the 423-line popup CSS are copied verbatim.

**Tech Stack:** WXT 0.20, React 19, TypeScript 5.8, Vitest 4 (WxtVitest + happy-dom).

## Global Constraints

- New code lives under `wxt/`. Reference project (for copied helpers): `../epic-free-games-claim/wxt-dev-wxt/`.
- Extension name: `Microsoft automatic rewards`. Version: `2.2.9`.
- Manifest `permissions`: exactly `['storage', 'alarms']` — do NOT add `tabs` (browsing-history warning; unneeded).
- Firefox `browser_specific_settings.gecko`: id `microsoft_automatic_rewards@example.com`, `strict_min_version` `91.0` — preserve verbatim.
- Content-script match: `https://rewards.bing.com/*`.
- Settings keys use `storage.sync`. Pass `StorageValues.SYNC` explicitly (helpers default to local).
- Setting defaults (single source, `settings.ts`): `active:true, autoDaily:false, timeout:60, searches:12, closeTime:5, useWords:true`.
- Path alias: import via `@/entrypoints/...` (`@` → `wxt/`).
- Use the `browser` namespace, never raw `chrome`.
- Immutability: return new objects/state, never mutate.
- Commits: Conventional Commits. All commands run from inside `wxt/` unless noted.

---

### Task 1: Scaffold WXT project, port reused helpers, copy assets

**Files:**
- Create: `wxt/package.json`, `wxt/wxt.config.ts`, `wxt/tsconfig.json`, `wxt/vitest.config.ts`, `wxt/.gitignore`
- Create: `wxt/entrypoints/enums/storageValues.ts`, `wxt/entrypoints/types/storageItem.ts`, `wxt/entrypoints/types/global.ts`
- Create: `wxt/entrypoints/hooks/useStorage.ts`, `wxt/entrypoints/utils/oncePerPageRun.ts`, `wxt/entrypoints/utils/helpers.ts`
- Test: `wxt/entrypoints/hooks/useStorage.test.ts`, `wxt/entrypoints/utils/helpers.test.ts`
- Assets: `wxt/public/imgs/*` (copied from `chrome/prod/imgs/`)

**Interfaces:**
- Produces: `StorageValues` enum (`LOCAL/SESSION/SYNC/MANAGED`); `useStorage<T>(key, default, storageType?)`; `getStorageItem<T>(key, storageType?)`, `setStorageItem(key, value, storageType?)`, `getStorageItems(keys[], storageType?)`, `setStorageItems(record, storageType?)`, `mergeIntoStorageItem<T>(key, value, storageType?)`; `getRndInteger(min,max)`, `wait(ms)`; `oncePerPageRun(key: keyof Window): boolean`.

- [ ] **Step 1: Create `wxt/package.json`**

```json
{
  "name": "microsoft-automatic-rewards",
  "description": "Script that gives you maximum amount of microsoft rewards points every day automatically or by a click of a button.",
  "private": true,
  "version": "2.2.9",
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "compile": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "postinstall": "wxt prepare"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.3",
    "@wxt-dev/module-react": "^1.1.3",
    "happy-dom": "^20.10.6",
    "typescript": "^5.8.3",
    "vitest": "^4.1.10",
    "wxt": "^0.20.6"
  }
}
```

- [ ] **Step 2: Create `wxt/wxt.config.ts`**

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  alias: { '@': '.' },
  manifest: {
    name: 'Microsoft automatic rewards',
    description:
      'Script that gives you maximum amount of microsoft rewards points every day automatically or by a click of a button.',
    permissions: ['storage', 'alarms'],
    icons: { 16: 'imgs/logo.png', 32: 'imgs/logo2.png', 48: 'imgs/logo2.png', 128: 'imgs/logo3.png' },
    action: {
      default_icon: { 16: 'imgs/logo.png', 32: 'imgs/logo2.png', 48: 'imgs/logo2.png', 128: 'imgs/logo3.png' },
      default_title: 'Microsoft automatic rewards',
    },
    browser_specific_settings: {
      gecko: { id: 'microsoft_automatic_rewards@example.com', strict_min_version: '91.0' },
    },
  },
});
```

- [ ] **Step 3: Create `wxt/tsconfig.json`**

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "module": "esnext",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

- [ ] **Step 4: Create `wxt/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: 'happy-dom',
    include: ['entrypoints/**/*.{test,spec}.ts'],
  },
});
```

- [ ] **Step 5: Create `wxt/.gitignore`**

```
node_modules
.wxt
dist
.output
stats.html
*.zip
```

- [ ] **Step 6: Install deps (runs `wxt prepare`, generates `.wxt/`)**

Run (from `wxt/`): `npm install`
Expected: install completes; `.wxt/tsconfig.json` now exists.

- [ ] **Step 7: Copy assets from the current Chrome build**

Run (from repo root):
```bash
mkdir -p wxt/public/imgs/svgs
cp chrome/prod/imgs/*.png wxt/public/imgs/
cp chrome/prod/imgs/svgs/*.svg wxt/public/imgs/svgs/
```
Expected: `wxt/public/imgs/` contains `logo.png logo2.png logo3.png free-games.png github.png justAGirlSmol.png mar-phone.png` and `svgs/qr-code-app.svg svgs/mobile-phone.svg`.

- [ ] **Step 8: Create `wxt/entrypoints/enums/storageValues.ts`**

```ts
export enum StorageValues {
    LOCAL = "local",
    SESSION = "session",
    SYNC = "sync",
    MANAGED = "managed"
}
```

- [ ] **Step 9: Create `wxt/entrypoints/types/storageItem.ts`**

```ts
export type StorageItem = {
    key: string;
    value: any;
}
```

- [ ] **Step 10: Create `wxt/entrypoints/types/global.ts`**

```ts
declare global {
    interface Window {
        _marContentScriptInjected?: boolean;
    }
}
export {};
```

- [ ] **Step 11: Create `wxt/entrypoints/hooks/useStorage.ts`** (copied from reference, verbatim)

```ts
import {useState, useEffect} from "react";
import {StorageValues} from "@/entrypoints/enums/storageValues.ts"
import { storage } from '#imports';
import {StorageItem} from "@/entrypoints/types/storageItem.ts";

// Matches WXT's branded storage-key type. StorageValues values are exactly
// local/session/sync/managed, so the runtime string always satisfies this shape.
type StorageItemKey = `local:${string}` | `session:${string}` | `sync:${string}` | `managed:${string}`;

export function useStorage<T>(key: string, defaultValue: T, storageType: StorageValues = StorageValues.LOCAL) {
    const storageKey = `${storageType}:${key}` as StorageItemKey;
    const [value, setValue] = useState<T>(defaultValue);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        storage.getItem(storageKey).then((stored: any) => {
            setValue(stored ?? defaultValue);
            setIsInitialized(true);
        });
    }, [storageKey]);

    useEffect(() => {
        if (isInitialized) {
            void storage.setItem(storageKey, value);
        }
    }, [storageKey, value, isInitialized]);

    return [value, setValue] as const;
}

export async function getStorageItem<T = any>(key: string, storageType: StorageValues = StorageValues.LOCAL): Promise<T | null> {
    const storageKey = `${storageType}:${key}` as StorageItemKey;
    return await storage.getItem<T>(storageKey);
}

export async function setStorageItem(key: string, value: any, storageType: StorageValues = StorageValues.LOCAL) {
    const storageKey = `${storageType}:${key}` as StorageItemKey;
    await storage.setItem(storageKey, value);
}

export async function setStorageItems(items: Record<string, any>, storageType: StorageValues = StorageValues.LOCAL) {
    const storageItems = Object.entries(items).map(([key, value]) => ({
        key: `${storageType}:${key}` as StorageItemKey,
        value
    }));
    await storage.setItems(storageItems);
}

export async function getStorageItems(keys: string[], storageType: StorageValues = StorageValues.LOCAL) {
    const storageKeys: StorageItemKey[] = keys.map((key: string) => `${storageType}:${key}` as StorageItemKey);
    const items = await storage.getItems(storageKeys);
    return items.reduce((acc: { [x: string]: any; }, item: StorageItem) => {
        const shortKey = item.key.split(":")[1];
        acc[shortKey] = item.value;
        return acc;
    }, {});
}

function asAppendItems<T>(v: T | T[]): T[] {
    return Array.isArray(v) ? v : [v];
}

export async function mergeIntoStorageItem<T>(
    key: string,
    newValue: T | T[],
    storageType: StorageValues = StorageValues.LOCAL
) {
    const storageKey = `${storageType}:${key}` as StorageItemKey;
    const existingValue = await storage.getItem(storageKey);

    let updatedValue: unknown;

    if (existingValue == null) {
        updatedValue = asAppendItems(newValue);
    } else if (Array.isArray(existingValue)) {
        updatedValue = existingValue.concat(asAppendItems(newValue));
    } else if (typeof existingValue === 'string') {
        updatedValue = existingValue + String(newValue);
    } else if (typeof existingValue === 'number') {
        updatedValue = (existingValue as number) + (newValue as any);
    } else {
        throw new Error('mergeIntoStorageItem: Unsupported data type for appending.');
    }

    await storage.setItem(storageKey, updatedValue);
}
```

- [ ] **Step 12: Create `wxt/entrypoints/utils/oncePerPageRun.ts`** (copied from reference, verbatim)

```ts
export function oncePerPageRun(key: keyof Window): boolean {
    if (window[key]) return false;
    window[key] = true as never;
    return true;
}
```

- [ ] **Step 13: Create `wxt/entrypoints/utils/helpers.ts`** (trimmed to what this project uses)

```ts
export function getRndInteger(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
```

- [ ] **Step 14: Create `wxt/entrypoints/utils/helpers.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { getRndInteger } from './helpers';

describe('getRndInteger', () => {
  it('returns a value within [min, max] inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const n = getRndInteger(5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('returns exactly the value when min === max', () => {
    expect(getRndInteger(7, 7)).toBe(7);
  });
});
```

- [ ] **Step 15: Create `wxt/entrypoints/hooks/useStorage.test.ts`** (copied from reference, verbatim)

```ts
// @vitest-environment node
// Storage helpers need no DOM. Running under node avoids the esbuild/jsdom
// TextEncoder invariant clash that WXT's `#imports` transform triggers in jsdom.
import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getStorageItem,
  setStorageItem,
  getStorageItems,
  setStorageItems,
  mergeIntoStorageItem,
} from './useStorage';

describe('useStorage helpers', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe('getStorageItem', () => {
    it('returns null for a key that was never set', async () => {
      expect(await getStorageItem('missing')).toBeNull();
    });

    it('round-trips a value through setStorageItem', async () => {
      await setStorageItem('counter', 3);
      expect(await getStorageItem<number>('counter')).toBe(3);
    });

    it('stores and returns arrays intact', async () => {
      const items = [{ title: 'A' }, { title: 'B' }];
      await setStorageItem('items', items);
      expect(await getStorageItem('items')).toEqual(items);
    });
  });

  describe('getStorageItems / setStorageItems', () => {
    it('writes and reads multiple keys by short name', async () => {
      await setStorageItems({ active: true, useWords: false });
      const result = await getStorageItems(['active', 'useWords']);
      expect(result).toEqual({ active: true, useWords: false });
    });

    it('returns null for keys that are unset', async () => {
      const result = await getStorageItems(['active']);
      expect(result.active).toBeNull();
    });
  });

  describe('mergeIntoStorageItem', () => {
    it('creates an array from a single value when nothing is stored', async () => {
      await mergeIntoStorageItem('list', 'a');
      expect(await getStorageItem('list')).toEqual(['a']);
    });

    it('appends to an existing array', async () => {
      await setStorageItem('list', ['a']);
      await mergeIntoStorageItem('list', ['b', 'c']);
      expect(await getStorageItem('list')).toEqual(['a', 'b', 'c']);
    });

    it('increments an existing number', async () => {
      await setStorageItem('counter', 5);
      await mergeIntoStorageItem('counter', 2);
      expect(await getStorageItem<number>('counter')).toBe(7);
    });
  });
});
```

- [ ] **Step 16: Type-check**

Run (from `wxt/`): `npm run compile`
Expected: 0 errors.

- [ ] **Step 17: Run tests**

Run (from `wxt/`): `npm test`
Expected: helpers + useStorage suites PASS.

- [ ] **Step 18: Commit**

```bash
git add wxt/package.json wxt/package-lock.json wxt/wxt.config.ts wxt/tsconfig.json wxt/vitest.config.ts wxt/.gitignore wxt/entrypoints wxt/public
git commit -m "chore: scaffold WXT project with reused storage/helpers and assets"
```

---

### Task 2: Settings defaults + search/scheduling pure logic

**Files:**
- Create: `wxt/entrypoints/settings.ts`, `wxt/entrypoints/data/searchWords.ts`, `wxt/entrypoints/utils/search.ts`, `wxt/entrypoints/utils/browserAction.ts`
- Test: `wxt/entrypoints/utils/search.test.ts`

**Interfaces:**
- Consumes: `getRndInteger` from `utils/helpers`.
- Produces: `DEFAULTS` (`{active, autoDaily, timeout, searches, closeTime, useWords}`); `SEARCH_WORDS: string[]`; `toInt(value, fallback): number`; `buildSearchQuery(useWords, words): string`; `buildSearchUrl(query): string`; `nextDelayMinutes(timeoutSeconds, jitterMs?): number`; `shouldOpenMore(opened, searches): boolean`; `setBadgeText(text): void`.

- [ ] **Step 1: Create `wxt/entrypoints/settings.ts`**

```ts
// Single source of truth for setting defaults, used by install seeding,
// background reads (fallbacks), and the popup's useStorage defaults.
export const DEFAULTS = {
    active: true,
    autoDaily: false,
    timeout: 60,
    searches: 12,
    closeTime: 5,
    useWords: true,
} as const;
```

- [ ] **Step 2: Create `wxt/entrypoints/data/searchWords.ts`** (the word list, extracted from the current source)

Run (from `wxt/`):
```bash
printf 'export const SEARCH_WORDS: string[] = [\n' > entrypoints/data/searchWords.ts
sed -n '12,47p' ../chrome/src/background.ts >> entrypoints/data/searchWords.ts
printf '];\n' >> entrypoints/data/searchWords.ts
```
Expected: `entrypoints/data/searchWords.ts` exports the ~250-word array. Verify with `head -3 entrypoints/data/searchWords.ts` (first line is the `export const` line, second begins `"food", "drink", ...`).

- [ ] **Step 3: Write the failing test `wxt/entrypoints/utils/search.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { toInt, buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore } from './search';

describe('toInt', () => {
  it('parses integer strings', () => {
    expect(toInt('5', 9)).toBe(5);
  });
  it('falls back on NaN / null / undefined (the parseInt ?? bug)', () => {
    expect(toInt('abc', 9)).toBe(9);
    expect(toInt(undefined, 9)).toBe(9);
    expect(toInt(null, 9)).toBe(9);
  });
  it('passes through numbers', () => {
    expect(toInt(7, 9)).toBe(7);
  });
});

describe('buildSearchQuery', () => {
  const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];

  it('produces 3-5 space-separated words in words mode', () => {
    for (let i = 0; i < 100; i++) {
      const q = buildSearchQuery(true, words);
      const tokens = q.trim().split(/\s+/);
      expect(tokens.length).toBeGreaterThanOrEqual(3);
      expect(tokens.length).toBeLessThanOrEqual(5);
    }
  });

  it('produces a single alphanumeric token in letters mode', () => {
    for (let i = 0; i < 100; i++) {
      const q = buildSearchQuery(false, words);
      expect(q).toMatch(/^[a-z0-9]+$/);
      expect(q).not.toContain(' ');
    }
  });
});

describe('buildSearchUrl', () => {
  it('wraps the query with the Bing search URL and params', () => {
    expect(buildSearchUrl('xhello')).toBe(
      'https://www.bing.com/search?q=xhello&qs=n&form=QBLH&sp=-1&pq='
    );
  });
});

describe('nextDelayMinutes', () => {
  it('computes (timeout-1)s in minutes with jitter', () => {
    expect(nextDelayMinutes(60, 0)).toBeCloseTo(59000 / 60000, 5);
  });
  it('floors at 0.1 for very small timeouts', () => {
    expect(nextDelayMinutes(0, 0)).toBe(0.1);
    expect(nextDelayMinutes(1, 0)).toBe(0.1);
  });
});

describe('shouldOpenMore', () => {
  it('is true while fewer than `searches` tabs have opened', () => {
    expect(shouldOpenMore(1, 12)).toBe(true);
  });
  it('is false once `searches` tabs have opened (exact-count fix)', () => {
    expect(shouldOpenMore(12, 12)).toBe(false);
    expect(shouldOpenMore(1, 1)).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run (from `wxt/`): `npx vitest run entrypoints/utils/search.test.ts`
Expected: FAIL — `./search` has no such exports.

- [ ] **Step 5: Create `wxt/entrypoints/utils/search.ts`**

```ts
import { getRndInteger } from '@/entrypoints/utils/helpers';

const BING_SEARCH_URL = 'https://www.bing.com/search?q=';
const BING_SEARCH_PARAMS = '&qs=n&form=QBLH&sp=-1&pq=';

// parseInt(undefined)/parseInt('abc') is NaN, and `NaN ?? x` keeps NaN
// (?? only catches null/undefined). This guards that original bug.
export function toInt(value: unknown, fallback: number): number {
    const n = parseInt(String(value), 10);
    return Number.isNaN(n) ? fallback : n;
}

export function buildSearchQuery(useWords: boolean, words: string[]): string {
    let body = '';
    if (useWords) {
        const count = getRndInteger(3, 5);
        for (let i = 0; i < count; i++) {
            body += `${words[getRndInteger(0, words.length - 1)]} `;
        }
    } else {
        body = Math.random().toString(36).substring(2, getRndInteger(5, 8));
    }
    const prefix = Math.random().toString(36).substring(2, 3);
    return `${prefix}${body}`;
}

export function buildSearchUrl(query: string): string {
    return `${BING_SEARCH_URL}${query}${BING_SEARCH_PARAMS}`;
}

// Chrome/Firefox alarms accept minutes; floor at 0.1 so the value is never 0.
// (Chrome still clamps sub-minute alarms in packed builds regardless.)
export function nextDelayMinutes(timeoutSeconds: number, jitterMs: number = getRndInteger(0, 2000)): number {
    const t = Math.max(timeoutSeconds, 1);
    return Math.max(((t - 1) * 1000 + jitterMs) / 60000, 0.1);
}

// True while another search tab should open. Opening exactly `searches` tabs
// (fixes the original off-by-one that opened searches + 1).
export function shouldOpenMore(opened: number, searches: number): boolean {
    return opened < searches;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run (from `wxt/`): `npx vitest run entrypoints/utils/search.test.ts`
Expected: PASS.

- [ ] **Step 7: Create `wxt/entrypoints/utils/browserAction.ts`** (cross-MV badge helper)

```ts
import { browser } from 'wxt/browser';

// MV3 exposes `browser.action`; MV2 (Firefox) exposes `browser.browserAction`.
export function setBadgeText(text: string): void {
    const api = browser as unknown as { action?: { setBadgeText(d: { text: string }): void }; browserAction?: { setBadgeText(d: { text: string }): void } };
    (api.action ?? api.browserAction)?.setBadgeText({ text });
}
```

- [ ] **Step 8: Type-check + full tests**

Run (from `wxt/`): `npm run compile && npm test`
Expected: 0 errors; all suites PASS.

- [ ] **Step 9: Commit**

```bash
git add wxt/entrypoints/settings.ts wxt/entrypoints/data wxt/entrypoints/utils/search.ts wxt/entrypoints/utils/search.test.ts wxt/entrypoints/utils/browserAction.ts
git commit -m "feat: add settings defaults and tested search/scheduling logic"
```

---

### Task 3: Background service worker (search runner, daily rewards, scheduling)

**Files:**
- Create: `wxt/entrypoints/background/searchRunner.ts`, `wxt/entrypoints/background/dailyRewards.ts`, `wxt/entrypoints/background/dailySchedule.ts`
- Create: `wxt/entrypoints/background.ts`

**Interfaces:**
- Consumes: `DEFAULTS`, `SEARCH_WORDS`, `toInt/buildSearchQuery/buildSearchUrl/nextDelayMinutes/shouldOpenMore`, `getRndInteger`, storage helpers with `StorageValues.SYNC`, `setBadgeText`.
- Produces: `startSearches(searchTimeout, searches, closeTimeSeconds, useWords)`, `handleAlarmStep(alarm)`, `stopSearches()`; `openDailyRewards()`; `runRewards(manualCall?)`, `checkLastOpened()`, `handleInstallOrUpdate(details)`, `handleStartup()`.

- [ ] **Step 1: Create `wxt/entrypoints/background/searchRunner.ts`**

```ts
import { browser } from 'wxt/browser';
import { getRndInteger } from '@/entrypoints/utils/helpers';
import { SEARCH_WORDS } from '@/entrypoints/data/searchWords';
import { buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore, toInt } from '@/entrypoints/utils/search';
import { getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS } from '@/entrypoints/settings';

const ALARM_NAME = 'openTabAlarm';

// Opens tab #1 immediately (currentSearch = 1), then schedules the rest via alarm.
export async function startSearches(searchTimeout: number, searches: number, closeTimeSeconds: number, useWords: boolean): Promise<void> {
    await setStorageItems({ isSearching: true, currentSearch: 1 }, StorageValues.SYNC);
    await openSearchTab(useWords, closeTimeSeconds * 1000);
    if (shouldOpenMore(1, searches)) {
        browser.alarms.create(ALARM_NAME, { delayInMinutes: nextDelayMinutes(searchTimeout) });
    } else {
        await stopSearches();
    }
}

export async function handleAlarmStep(alarm: { name: string }): Promise<void> {
    if (alarm.name !== ALARM_NAME) return;
    const s = await getStorageItems(['searches', 'timeout', 'closeTime', 'useWords', 'currentSearch'], StorageValues.SYNC);
    const searches = toInt(s.searches, DEFAULTS.searches);
    const searchTimeout = toInt(s.timeout, DEFAULTS.timeout);
    const closeTimeMs = toInt(s.closeTime, DEFAULTS.closeTime) * 1000;
    const useWords = s.useWords ?? DEFAULTS.useWords;
    const opened = toInt(s.currentSearch, searches);

    if (!shouldOpenMore(opened, searches)) {
        await stopSearches();
        return;
    }
    await openSearchTab(useWords, closeTimeMs);
    const nowOpened = opened + 1;
    if (shouldOpenMore(nowOpened, searches)) {
        await setStorageItem('currentSearch', nowOpened, StorageValues.SYNC);
        browser.alarms.create(ALARM_NAME, { delayInMinutes: nextDelayMinutes(searchTimeout) });
    } else {
        await stopSearches();
    }
}

export async function stopSearches(): Promise<void> {
    await setStorageItem('isSearching', false, StorageValues.SYNC);
    browser.runtime.sendMessage({ action: 'searchEnded' }).catch(() => {});
    await browser.alarms.clearAll();
}

async function openSearchTab(useWords: boolean, closeTimeMs: number): Promise<void> {
    const url = buildSearchUrl(buildSearchQuery(useWords, SEARCH_WORDS));
    await openAndClose(url, closeTimeMs + getRndInteger(0, 1000));
}

async function openAndClose(url: string, closeTimeMs: number): Promise<void> {
    const tab = await browser.tabs.create({ url, active: false });
    const tabId = tab.id!;
    function listener(updatedId: number, changeInfo: { status?: string }): void {
        if (updatedId === tabId && changeInfo.status === 'complete') {
            browser.tabs.onUpdated.removeListener(listener);
            waitAndClose(tabId, closeTimeMs);
        }
    }
    browser.tabs.onUpdated.addListener(listener);
}

function waitAndClose(id: number, closeTimeMs: number): void {
    const timeout = closeTimeMs <= 0 ? 500 : closeTimeMs;
    setTimeout(() => {
        browser.tabs.get(id).then(() => browser.tabs.remove(id)).catch(() => {});
    }, Math.max(timeout - 500, 0) + getRndInteger(0, 1000));
}
```

- [ ] **Step 2: Create `wxt/entrypoints/background/dailyRewards.ts`**

```ts
import { browser } from 'wxt/browser';

// Opens the rewards dashboard in a background tab, waits for load, tells the
// content script to click daily sets, then closes the tab after 10s.
export async function openDailyRewards(): Promise<void> {
    const tab = await browser.tabs.create({ url: 'https://rewards.bing.com/dashboard', active: false });
    const tabId = tab.id!;

    await new Promise<void>((resolve) => {
        function listener(updatedId: number, changeInfo: { status?: string }): void {
            if (updatedId === tabId && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener);
                setTimeout(() => {
                    browser.tabs.sendMessage(tabId, { action: 'openDaily' }).catch(() => {});
                    resolve();
                }, 300);
            }
        }
        browser.tabs.onUpdated.addListener(listener);
    });

    setTimeout(() => { browser.tabs.remove(tabId).catch(() => {}); }, 10000);
}
```

- [ ] **Step 3: Create `wxt/entrypoints/background/dailySchedule.ts`**

```ts
import { browser } from 'wxt/browser';
import { getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { toInt } from '@/entrypoints/utils/search';
import { DEFAULTS } from '@/entrypoints/settings';
import { setBadgeText } from '@/entrypoints/utils/browserAction';
import { openDailyRewards } from './dailyRewards';
import { startSearches } from './searchRunner';

const WEBSITE_URL = 'https://svitspindler.com/microsoft-automatic-rewards';

export async function runRewards(manualCall = false): Promise<void> {
    const s = await getStorageItems(['searches', 'timeout', 'closeTime', 'useWords', 'autoDaily', 'active'], StorageValues.SYNC);
    const searchTimeout = toInt(s.timeout, DEFAULTS.timeout);
    const searches = toInt(s.searches, DEFAULTS.searches);
    const closeTime = toInt(s.closeTime, DEFAULTS.closeTime);
    const useWords = s.useWords ?? DEFAULTS.useWords;
    const autoDaily = s.autoDaily ?? DEFAULTS.autoDaily;
    const autoTabs = s.active ?? DEFAULTS.active;

    if (autoDaily) await openDailyRewards();
    if ((manualCall || autoTabs) && searches > 0) {
        await startSearches(searchTimeout, searches, closeTime, useWords);
    }
}

export async function checkLastOpened(): Promise<void> {
    const today = new Date().toLocaleDateString();
    const s = await getStorageItems(['lastOpened'], StorageValues.SYNC);
    if (s.lastOpened !== today) {
        await runRewards();
        await setStorageItem('lastOpened', today, StorageValues.SYNC);
    }
}

export async function handleInstallOrUpdate(details: { reason: string }): Promise<void> {
    if (details.reason === 'install') {
        await setStorageItems({
            active: DEFAULTS.active,
            timeout: DEFAULTS.timeout,
            searches: DEFAULTS.searches,
            closeTime: DEFAULTS.closeTime,
            useWords: DEFAULTS.useWords,
            isSearching: false,
            autoDaily: DEFAULTS.autoDaily,
        }, StorageValues.SYNC);
        await browser.runtime.setUninstallURL(
            `https://svitspindler.com/uninstall?extension=${encodeURI('Microsoft Automatic Rewards')}`
        );
        setTimeout(() => { browser.tabs.create({ url: WEBSITE_URL, active: true }); }, 1000);
    } else if (details.reason === 'update') {
        setBadgeText('New');
    }
}

export async function handleStartup(): Promise<void> {
    const s = await getStorageItems(['active', 'autoDaily'], StorageValues.SYNC);
    if (s.active || s.autoDaily) await checkLastOpened();
    await setStorageItem('isSearching', false, StorageValues.SYNC);
}
```

- [ ] **Step 4: Create `wxt/entrypoints/background.ts`**

```ts
import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { handleInstallOrUpdate, handleStartup, runRewards, checkLastOpened } from './background/dailySchedule';
import { handleAlarmStep, stopSearches } from './background/searchRunner';

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(handleInstallOrUpdate);
    browser.runtime.onStartup.addListener(handleStartup);
    browser.runtime.onMessage.addListener((request: { action?: string }) => {
        if (request.action === 'popup') void runRewards(true);
        else if (request.action === 'check') void checkLastOpened();
        else if (request.action === 'stop') void stopSearches();
    });
    browser.alarms.onAlarm.addListener((alarm) => void handleAlarmStep(alarm));
});
```

- [ ] **Step 5: Type-check + build (Chrome)**

Run (from `wxt/`): `npm run compile && npm run build`
Expected: 0 type errors; `wxt build` succeeds and emits a background service worker.

- [ ] **Step 6: Commit**

```bash
git add wxt/entrypoints/background wxt/entrypoints/background.ts
git commit -m "feat: port background worker (search runner, daily rewards, scheduling)"
```

---

### Task 4: Content script + daily-anchor matcher

**Files:**
- Create: `wxt/entrypoints/utils/dailyAnchors.ts`, `wxt/entrypoints/rewards.content.ts`
- Test: `wxt/entrypoints/utils/dailyAnchors.test.ts`

**Interfaces:**
- Consumes: `getRndInteger`, `wait`, `oncePerPageRun`.
- Produces: `matchDailyAnchors(root: ParentNode): HTMLAnchorElement[]`.

- [ ] **Step 1: Write the failing test `wxt/entrypoints/utils/dailyAnchors.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { matchDailyAnchors } from './dailyAnchors';

describe('matchDailyAnchors', () => {
  it('returns only grid anchors that point at a Bing search', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="grid">
        <a href="https://www.bing.com/search?q=daily1">one</a>
        <a href="https://rewards.bing.com/other">skip</a>
        <a href="https://www.bing.com/search?q=daily2">two</a>
      </div>
      <div class="other">
        <a href="https://www.bing.com/search?q=notgrid">skip</a>
      </div>`;
    const anchors = matchDailyAnchors(root);
    expect(anchors.map((a) => a.textContent)).toEqual(['one', 'two']);
  });

  it('returns an empty array when the grid has no matching anchors', () => {
    const root = document.createElement('div');
    root.innerHTML = `<div class="grid"><a href="https://example.com">x</a></div>`;
    expect(matchDailyAnchors(root)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `wxt/`): `npx vitest run entrypoints/utils/dailyAnchors.test.ts`
Expected: FAIL — no `matchDailyAnchors` export.

- [ ] **Step 3: Create `wxt/entrypoints/utils/dailyAnchors.ts`**

```ts
// Daily-set links live in `div.grid > a`; keep only the ones that actually
// point at a Bing search (the current selector, resilient across Chrome/Firefox).
export function matchDailyAnchors(root: ParentNode): HTMLAnchorElement[] {
    return [...root.querySelectorAll<HTMLAnchorElement>('div.grid > a')]
        .filter((a) => a.href.includes('www.bing.com/search?q='));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `wxt/`): `npx vitest run entrypoints/utils/dailyAnchors.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `wxt/entrypoints/rewards.content.ts`**

```ts
import { defineContentScript } from '#imports';
import { browser } from 'wxt/browser';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';
import { matchDailyAnchors } from '@/entrypoints/utils/dailyAnchors';
import { oncePerPageRun } from '@/entrypoints/utils/oncePerPageRun';

export default defineContentScript({
    matches: ['https://rewards.bing.com/*'],
    main() {
        if (!oncePerPageRun('_marContentScriptInjected')) return;
        browser.runtime.onMessage.addListener((request: { action?: string }) => {
            if (request.action === 'openDaily') void openDailySets();
        });
    },
});

async function openDailySets(): Promise<void> {
    const anchors = await waitForDailyAnchors();
    for (const link of anchors) {
        link.click();
        await wait(1000 + getRndInteger(0, 1000));
    }
}

// Resolve as soon as the daily-set anchors appear (they render async).
function waitForDailyAnchors(): Promise<HTMLAnchorElement[]> {
    return new Promise((resolve) => {
        function check(observer: MutationObserver): void {
            const anchors = matchDailyAnchors(document);
            if (anchors.length > 0) {
                observer.disconnect();
                resolve(anchors);
            }
        }
        const observer = new MutationObserver(() => check(observer));
        observer.observe(document.body, { childList: true, subtree: true });
        check(observer);
    });
}
```

- [ ] **Step 6: Type-check + full tests**

Run (from `wxt/`): `npm run compile && npm test`
Expected: 0 errors; all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add wxt/entrypoints/utils/dailyAnchors.ts wxt/entrypoints/utils/dailyAnchors.test.ts wxt/entrypoints/rewards.content.ts
git commit -m "feat: port rewards content script with tested anchor matcher"
```

---

### Task 5: React popup UI

**Files:**
- Create: `wxt/entrypoints/popup/index.html`, `wxt/entrypoints/popup/main.tsx`, `wxt/entrypoints/popup/App.tsx`, `wxt/entrypoints/popup/App.css`
- Create: `wxt/entrypoints/components/Checkbox.tsx`, `NumberInput.tsx`, `SearchModeToggle.tsx`, `ManualClaimButton.tsx`

**Interfaces:**
- Consumes: `useStorage` (SYNC), `DEFAULTS`, `setBadgeText`, `StorageValues`.
- Produces: popup rendered as the extension `browser_action`/`action`.

- [ ] **Step 1: Copy the existing popup CSS verbatim**

Run (from repo root): `cp chrome/prod/styles/popup.css wxt/entrypoints/popup/App.css`
Expected: `wxt/entrypoints/popup/App.css` exists (423 lines).

- [ ] **Step 2: Create `wxt/entrypoints/popup/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Microsoft automatic rewards</title>
    <meta name="manifest.type" content="browser_action" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `wxt/entrypoints/popup/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Create `wxt/entrypoints/components/Checkbox.tsx`**

```tsx
interface CheckboxProps {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
}

function Checkbox({ checked, onChange, name }: CheckboxProps) {
    return (
        <span>
            <input type="checkbox" id={`${name}-checkbox`} checked={checked} onChange={onChange} />
            <label htmlFor={`${name}-checkbox`}>{name}</label>
        </span>
    );
}

export default Checkbox;
```

- [ ] **Step 5: Create `wxt/entrypoints/components/NumberInput.tsx`**

```tsx
interface NumberInputProps {
    id: string;
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

function NumberInput({ id, label, value, min, max, onChange }: NumberInputProps) {
    return (
        <span>
            <input type="number" id={id} min={min} max={max} value={value}
                   onChange={(e) => onChange(parseFloat(e.target.value))} />
            <label htmlFor={id}>{label}</label>
        </span>
    );
}

export default NumberInput;
```

- [ ] **Step 6: Create `wxt/entrypoints/components/SearchModeToggle.tsx`**

```tsx
interface SearchModeToggleProps {
    useWords: boolean;
    onChange: (useWords: boolean) => void;
}

function SearchModeToggle({ useWords, onChange }: SearchModeToggleProps) {
    return (
        <div className="justify-content-center my-2">
            <div className="form-check-label mb-2">For searches use random:</div>
            <div className="search mb-4">
                <ul>
                    <li id="wordsBtn" className={useWords ? 'active' : ''} onClick={() => onChange(true)}>
                        <span>words (new)</span>
                    </li>
                    <li id="stringsBtn" className={!useWords ? 'active' : ''} onClick={() => onChange(false)}>
                        <span>letters (old)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default SearchModeToggle;
```

- [ ] **Step 7: Create `wxt/entrypoints/components/ManualClaimButton.tsx`**

```tsx
import { useEffect } from 'react';
import { browser } from 'wxt/browser';
import { useStorage } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';

// "Get rewards" starts a run; while running it flips to "Stop searches".
// The background messages `searchEnded` when the run completes.
function ManualClaimButton() {
    const [isSearching, setIsSearching] = useStorage<boolean>('isSearching', false, StorageValues.SYNC);

    useEffect(() => {
        const listener = (request: { action?: string }) => {
            if (request.action === 'searchEnded') setIsSearching(false);
        };
        browser.runtime.onMessage.addListener(listener);
        return () => browser.runtime.onMessage.removeListener(listener);
    }, [setIsSearching]);

    function handleClick() {
        if (isSearching) {
            setIsSearching(false);
            browser.runtime.sendMessage({ action: 'stop' });
        } else {
            setIsSearching(true);
            browser.runtime.sendMessage({ action: 'popup' });
        }
    }

    return (
        <button id="button" className={`btn my-1 ${isSearching ? 'btn-fail' : 'btn-success'}`} onClick={handleClick}>
            {isSearching ? 'Stop searches' : 'Get rewards'}
        </button>
    );
}

export default ManualClaimButton;
```

- [ ] **Step 8: Create `wxt/entrypoints/popup/App.tsx`**

```tsx
import './App.css';
import { useEffect, useState } from 'react';
import { useStorage } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS } from '@/entrypoints/settings';
import { setBadgeText } from '@/entrypoints/utils/browserAction';
import NumberInput from '@/entrypoints/components/NumberInput';
import SearchModeToggle from '@/entrypoints/components/SearchModeToggle';
import ManualClaimButton from '@/entrypoints/components/ManualClaimButton';

function App() {
    const [active, setActive] = useStorage<boolean>('active', DEFAULTS.active, StorageValues.SYNC);
    const [autoDaily, setAutoDaily] = useStorage<boolean>('autoDaily', DEFAULTS.autoDaily, StorageValues.SYNC);
    const [searches, setSearches] = useStorage<number>('searches', DEFAULTS.searches, StorageValues.SYNC);
    const [timeout, setTimeoutValue] = useStorage<number>('timeout', DEFAULTS.timeout, StorageValues.SYNC);
    const [closeTime, setCloseTime] = useStorage<number>('closeTime', DEFAULTS.closeTime, StorageValues.SYNC);
    const [useWords, setUseWords] = useStorage<boolean>('useWords', DEFAULTS.useWords, StorageValues.SYNC);
    const [donateHover, setDonateHover] = useState(false);

    useEffect(() => { setBadgeText(''); }, []);

    return (
        <>
            <h3 className="container-fluid text-center mt-2 heading">Microsoft automatic rewards</h3>
            <div className="container-fluid text-center my-2">
                <a href="https://svitspindler.com/microsoft-automatic-rewards" className="float-start links" target="_blank">Help</a>
                <a href="https://svitspindler.com/microsoft-automatic-rewards/mobile/test-app" className="float-start links" target="_blank">Mobile</a>
                <a className="links" href="https://svitspindler.com/contact" target="_blank" id="contact">Contact Me</a>
            </div>

            <div className="text-center">
                <ManualClaimButton />
                <div className="checkboxes">
                    <div className="input-with-info">
                        <input className="form-check-input" type="checkbox" id="autoCheckbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                        <label htmlFor="autoCheckbox">Do daily searches automatically</label>
                        <span className="tooltip-icon info" data-tooltip="Opens bing tabs the first time browser opens every day">ℹ</span>
                    </div>
                    <div className="input-with-info">
                        <input className="form-check-input" type="checkbox" id="autoDaily" checked={autoDaily} onChange={(e) => setAutoDaily(e.target.checked)} />
                        <label htmlFor="autoDaily">Open daily set automatically</label>
                        <span className="tooltip-icon info" data-tooltip="Opens bing rewards tab and completes daily tasks for extra points">ℹ</span>
                    </div>
                </div>
                <div className="subtext mb-md">*allow popups at rewards.bing to work</div>

                <div className="left-align small-title">
                    <div className="ml-2">Extension for free games:</div>
                    <ul className="earn-list">
                        <li>
                            <a href="https://chromewebstore.google.com/detail/free-game-claimer-for-ste/mndghaafpgiinfecbbbcppppiblmjepk" className="normal-link" target="_blank" style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                                <img src="/imgs/free-games.png" alt="free games" className="earn-logo" />
                                Free games claimer for Steam & Epic
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="left-align ml-2 small-title">Mobile app to earn more points:</div>
                <div className="website-header">
                    <div className="qr-code-with-text">
                        <img src="/imgs/svgs/qr-code-app.svg" alt="QR code" className="qr-code" />
                        <span className="website-phone-text">Scan on phone</span>
                    </div>
                    <a href="https://play.google.com/store/apps/details?id=com.spin311.microsoft_automatic_rewards" className="website-phone normal-link no-underline try-mobile" target="_blank" rel="noopener noreferrer">
                        <img className="website-phone-image" src="/imgs/mar-phone.png" alt="Microsoft Automatic Rewards Phone App" />
                        <div className="normal-color">Download App</div>
                    </a>
                </div>

                <div className="inputs">
                    <div className="width-100">
                        <div className="input-with-info">
                            <NumberInput id="searches" label="Number of searches" value={searches} min={1} max={999} onChange={setSearches} />
                            <span className="tooltip-icon info" data-tooltip="Number of random tabs to open in bing">ℹ</span>
                        </div>
                    </div>
                    <div>
                        <NumberInput id="timeout" label="Time between searches (s)" value={timeout} min={0} max={9999} onChange={setTimeoutValue} />
                        <div className="subtext initial-text">*Set to 500 if your points are stuck</div>
                    </div>
                    <div>
                        <NumberInput id="closeTime" label="Time before closing tabs (s)" value={closeTime} min={0} max={300} onChange={setCloseTime} />
                    </div>
                </div>
            </div>

            <SearchModeToggle useWords={useWords} onChange={setUseWords} />

            <div className="container-fluid text-center mt-2">
                <span>
                    <a href="https://github.com/spin311/MicrosoftRewardsWebsite" className="float-start links" target="_blank">Github</a>
                    <img src="/imgs/github.png" alt="github-logo" />
                </span>
                <a className="links" href="https://rewards.bing.com/" target="_blank" id="rewardsLink">Rewards</a>
                <span className="float-end" style={{ display: 'flex', alignItems: 'center' }}>
                    <a href="https://svitspindler.com/donate" className="links" target="_blank" id="donateText" onMouseOver={() => setDonateHover(true)}>Donate</a>
                    <img src="/imgs/justAGirlSmol.png" alt="Cat" id="donateImg" style={{ visibility: donateHover ? 'visible' : 'hidden' }} />
                </span>
            </div>
        </>
    );
}

export default App;
```

- [ ] **Step 9: Type-check + build (Chrome)**

Run (from `wxt/`): `npm run compile && npm run build`
Expected: 0 type errors; `wxt build` succeeds and registers the popup.

- [ ] **Step 10: Commit**

```bash
git add wxt/entrypoints/popup wxt/entrypoints/components
git commit -m "feat: port popup to React with useStorage-backed settings"
```

---

### Task 6: Cross-browser build + manifest verification

**Files:** none created — verification and final wiring.

- [ ] **Step 1: Build both targets**

Run (from `wxt/`): `npm run build && npm run build:firefox`
Expected: both succeed.

- [ ] **Step 2: Verify the Chrome (MV3) manifest**

Run (from `wxt/`): `cat dist/chrome-mv3/manifest.json`
Expected: `manifest_version: 3`; `version: "2.2.9"`; `name: "Microsoft automatic rewards"`; `permissions` is exactly `["storage","alarms"]` (no `tabs`); a `content_scripts` entry matching `https://rewards.bing.com/*`; `action` with the popup and icons; a `background.service_worker`.

- [ ] **Step 3: Verify the Firefox (MV2) manifest**

Run (from `wxt/`): `cat dist/firefox-mv2/manifest.json`
Expected: `manifest_version: 2`; `version: "2.2.9"`; `browser_specific_settings.gecko.id === "microsoft_automatic_rewards@example.com"` and `strict_min_version === "91.0"`; `browser_action` present with popup; `background.scripts` present; content script match preserved.

- [ ] **Step 4: Full verification gate**

Run (from `wxt/`): `npm run compile && npm test && npm run build && npm run build:firefox`
Expected: type-check clean, all tests pass, both builds succeed.

- [ ] **Step 5: Manual smoke test (record results, do not skip silently)**

- Chrome: `chrome://extensions` → Developer mode → Load unpacked → `wxt/dist/chrome-mv3`. Open popup, confirm settings persist, "Get rewards" opens/closes Bing tabs and flips to "Stop searches".
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `wxt/dist/firefox-mv2/manifest.json`. Repeat the checks.
- On `rewards.bing.com/dashboard` with "Open daily set automatically" on, confirm daily-set links get clicked.

- [ ] **Step 6: Commit any manifest fixes discovered during verification**

```bash
git add wxt/wxt.config.ts
git commit -m "fix: adjust WXT manifest after cross-browser verification"
```

(Skip this commit if no fixes were needed.)

---

## Self-Review

**Spec coverage:**
- Single WXT project builds Chrome MV3 + Firefox MV2 → Tasks 1, 3, 6. ✓
- `wxt/` layout mirroring reference, `@` alias → Task 1 (tsconfig, wxt.config). ✓
- Reused helpers (useStorage, storageValues, oncePerPageRun, helpers) → Task 1. ✓
- Behavior: popup/background/content data flow → Tasks 3, 4, 5. ✓
- Storage on sync; referral logic dropped (was already commented out in current popup) → Tasks 3/5 use `StorageValues.SYNC`; no referral code. ✓
- wxt.config: name, version 2.2.9, permissions storage+alarms (no tabs), gecko id/min-version → Tasks 1, 6. ✓
- Fix #1 `parseInt ?? ` → `toInt` (Task 2, used in Task 3). ✓
- Fix #2 `//dashboard` → single slash (Task 3 dailyRewards). ✓
- Fix #3 selector `div.grid > a` + href filter (Task 4). ✓
- Fix #4 word count 3–5 (Task 2 buildSearchQuery). ✓
- Fix #5 alarm floor `Math.max(…,0.1)` (Task 2 nextDelayMinutes). ✓
- Fix #6 exactly `searches` tabs (Task 2 shouldOpenMore + Task 3 counter). ✓
- Tests: buildSearchQuery, toInt, scheduling math, anchor matcher, useStorage → Tasks 1, 2, 4. ✓
- Out-of-scope folders untouched → no task modifies `chrome/`, `firefox/`, `legacy/`, Flutter app. ✓

**Type consistency:** `StorageValues.SYNC`, `DEFAULTS.*`, `toInt`, `buildSearchQuery`, `buildSearchUrl`, `nextDelayMinutes`, `shouldOpenMore`, `matchDailyAnchors`, `setBadgeText`, `startSearches`, `handleAlarmStep`, `stopSearches`, `openDailyRewards`, `runRewards`, `checkLastOpened`, `handleInstallOrUpdate`, `handleStartup` — names/signatures consistent across producing and consuming tasks. ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code; bulk-verbatim assets (CSS, word array) use concrete `cp`/`sed` commands citing exact source paths/lines. ✓

**Open risk (flagged, not blocking):** WXT's `action`→`browser_action` translation for MV2 and popup auto-registration are verified in Task 6, Steps 2–3; adjust `wxt.config.ts` there if the generated manifests differ.
