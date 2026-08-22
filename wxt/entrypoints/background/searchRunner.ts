// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation per docs/rewrite/spec.md §4.
// Alarm/storage logic freshly authored; external names preserved for tests.

import { browser } from 'wxt/browser';
import { storage } from '#imports';
import { getRndInteger } from '@/entrypoints/utils/helpers';
import { buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore, toInt } from '@/entrypoints/utils/search';
import { getStorageItem, getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS } from '@/entrypoints/utils/settings';
import { clearBadge, setSearchCountBadge } from '@/entrypoints/utils/browserAction';

const SEARCH_ALARM = 'openTabAlarm';

export async function startSearches(timeoutSec: number, total: number, closeSec: number): Promise<void> {
  await launchSearchTab(closeSec * 1000);
  await persistProgress(1);
  if (shouldOpenMore(1, total)) {
    browser.alarms.create(SEARCH_ALARM, { delayInMinutes: nextDelayMinutes(timeoutSec) });
  } else {
    await stopSearches();
  }
}

export async function handleAlarmStep(alarm: { name: string }): Promise<void> {
  if (alarm.name !== SEARCH_ALARM) return;

  const snapshot = await getStorageItems(
    ['searches', 'timeout', 'closeTime', 'currentSearch', 'active'],
    StorageValues.SYNC,
  );
  const total = toInt(snapshot.searches, DEFAULTS.searches);
  const timeoutSec = toInt(snapshot.timeout, DEFAULTS.timeout);
  const closeMs = toInt(snapshot.closeTime, DEFAULTS.closeTime) * 1000;
  const already = toInt(snapshot.currentSearch, total);
  const enabled = snapshot.active ?? DEFAULTS.active;

  if (!enabled || !shouldOpenMore(already, total)) {
    await stopSearches();
    return;
  }

  await launchSearchTab(closeMs);
  const updated = already + 1;
  await persistProgress(updated);

  if (shouldOpenMore(updated, total)) {
    browser.alarms.create(SEARCH_ALARM, { delayInMinutes: nextDelayMinutes(timeoutSec) });
  } else {
    await stopSearches();
  }
}

export async function stopSearches(): Promise<void> {
  await setStorageItem('isSearching', false, StorageValues.SYNC);
  clearBadge();
  await browser.alarms.clearAll();
}

// Watch the sync toggle: if user (or another device) turns off daily searches
// while a run is in flight, stop immediately instead of waiting for next alarm.
export function watchSearchesToggle(): void {
  storage.watch<boolean>('sync:active', (next) => {
    if (next === false) void stopSearches();
  });
}

async function persistProgress(opened: number): Promise<void> {
  await setStorageItems({ currentSearch: opened, isSearching: true }, StorageValues.SYNC);
  setSearchCountBadge(opened);
}

async function launchSearchTab(closeDelayMs: number): Promise<void> {
  const openFirst = await getStorageItem<boolean>('openFirstResult', StorageValues.SYNC);
  const q = buildSearchQuery();
  const base = buildSearchUrl(q);
  const finalUrl = openFirst ? `${base}&marAuto=1` : base;
  await createAndScheduleClose(finalUrl, closeDelayMs + getRndInteger(0, 1000));
}

async function createAndScheduleClose(target: string, lifetimeMs: number): Promise<void> {
  const created = await browser.tabs.create({ url: target, active: false });
  const tid = created.id!;
  const onUpdate = (updatedId: number, info: { status?: string }): void => {
    if (updatedId === tid && info.status === 'complete') {
      browser.tabs.onUpdated.removeListener(onUpdate);
      scheduleClose(tid, lifetimeMs);
    }
  };
  browser.tabs.onUpdated.addListener(onUpdate);
}

function scheduleClose(tabId: number, lifetimeMs: number): void {
  const effective = lifetimeMs <= 0 ? 500 : lifetimeMs;
  // Compensate 500ms then add jitter so close timing is less uniform.
  const delay = Math.max(effective - 500, 0) + getRndInteger(0, 1000);
  setTimeout(() => {
    browser.tabs
      .get(tabId)
      .then(() => browser.tabs.remove(tabId))
      .catch(() => {});
  }, delay);
}
