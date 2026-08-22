// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room per docs/rewrite/spec.md §5.2 — dashboard daily-set clicker.

import { defineContentScript } from '#imports';
import { browser } from 'wxt/browser';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';
import { matchDailyAnchors } from '@/entrypoints/utils/dailyAnchors';
import { oncePerPageRun } from '@/entrypoints/utils/oncePerPageRun';

export default defineContentScript({
  matches: ['https://rewards.bing.com/*'],
  main() {
    if (!oncePerPageRun('_marContentScriptInjected')) return;
    browser.runtime.onMessage.addListener((msg: { action?: string }) => {
      if (msg.action === 'openDaily') void triggerDailyCards();
    });
  },
});

async function triggerDailyCards(): Promise<void> {
  const cards = await waitForCards();
  for (const a of cards) {
    a.click();
    await wait(1000 + getRndInteger(0, 1000));
  }
  browser.runtime.sendMessage({ action: 'dailyDone' }).catch(() => {});
}

function waitForCards(): Promise<HTMLAnchorElement[]> {
  return new Promise((resolve) => {
    const probe = (obs: MutationObserver): void => {
      const found = matchDailyAnchors(document);
      if (found.length > 0) {
        obs.disconnect();
        resolve(found);
      }
    };
    const obs = new MutationObserver(() => probe(obs));
    obs.observe(document.body, { childList: true, subtree: true });
    probe(obs);
  });
}
