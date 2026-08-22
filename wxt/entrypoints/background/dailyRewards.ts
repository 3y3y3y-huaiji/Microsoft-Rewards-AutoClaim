// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation per docs/rewrite/spec.md §5.
// Fresh naming and comments; timing constants match spec §5.4.

import { browser } from 'wxt/browser';
import { getRndInteger } from '@/entrypoints/utils/helpers';

const DASHBOARD_MAX_MS = 90_000;
const CHILD_MIN_LINGER_MS = 2000;
const CHILD_MAX_LINGER_MS = 5000;
const CHILD_HARD_CLOSE_MS = 20_000;
const DASHBOARD_URL = 'https://rewards.bing.com/dashboard';

export async function openDailyRewards(): Promise<void> {
  const priorTab = await fetchActiveTabId();

  const dash = await browser.tabs.create({ url: DASHBOARD_URL, active: true });
  const dashId = dash.id!;

  const onChildCreated = (info: { id?: number; openerTabId?: number }): void => {
    if (info.openerTabId !== dashId || info.id == null) return;
    // Keep dashboard foregrounded so its SPA keeps rendering/clicking.
    browser.tabs.update(dashId, { active: true }).catch(() => {});
    autoCloseChildAfterLoad(info.id);
  };
  browser.tabs.onCreated.addListener(onChildCreated);

  let finished = false;
  const finalize = (): void => {
    if (finished) return;
    finished = true;
    browser.runtime.onMessage.removeListener(onDailyDone);
    browser.tabs.onCreated.removeListener(onChildCreated);
    browser.tabs.remove(dashId).catch(() => {});
    if (priorTab != null) {
      browser.tabs.update(priorTab, { active: true }).catch(() => {});
    }
  };

  const onDailyDone = (msg: { action?: string }, sender: { tab?: { id?: number } }): void => {
    if (msg.action === 'dailyDone' && sender.tab?.id === dashId) finalize();
  };
  browser.runtime.onMessage.addListener(onDailyDone);
  setTimeout(finalize, DASHBOARD_MAX_MS);

  await waitForDashboardLoad(dashId);
}

async function waitForDashboardLoad(dashId: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const onUpdated = (tabId: number, info: { status?: string }): void => {
      if (tabId === dashId && info.status === 'complete') {
        browser.tabs.onUpdated.removeListener(onUpdated);
        setTimeout(() => {
          browser.tabs.sendMessage(dashId, { action: 'openDaily' }).catch(() => {});
          resolve();
        }, 300);
      }
    };
    browser.tabs.onUpdated.addListener(onUpdated);
  });
}

async function fetchActiveTabId(): Promise<number | undefined> {
  try {
    const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0]?.id;
  } catch {
    return undefined;
  }
}

function autoCloseChildAfterLoad(childId: number): void {
  let closed = false;
  const doClose = (): void => {
    if (closed) return;
    closed = true;
    browser.tabs.onUpdated.removeListener(waitComplete);
    browser.tabs.get(childId).then(() => browser.tabs.remove(childId)).catch(() => {});
  };

  const waitComplete = (tabId: number, info: { status?: string }): void => {
    if (tabId === childId && info.status === 'complete') {
      browser.tabs.onUpdated.removeListener(waitComplete);
      setTimeout(doClose, getRndInteger(CHILD_MIN_LINGER_MS, CHILD_MAX_LINGER_MS));
    }
  };

  browser.tabs.onUpdated.addListener(waitComplete);
  setTimeout(doClose, CHILD_HARD_CLOSE_MS);
}
