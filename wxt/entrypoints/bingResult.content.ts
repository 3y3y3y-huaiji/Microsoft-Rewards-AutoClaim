// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room per docs/rewrite/spec.md §6 — Bing SERP first-result auto-navigation.
// Only acts on tabs tagged with ?marAuto=1 (extension-initiated).

import { defineContentScript } from '#imports';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';
import { oncePerPageRun } from '@/entrypoints/utils/oncePerPageRun';

const FIRST_RESULT_SELECTOR = '#b_results li.b_algo h2 a';
const FIND_TIMEOUT_MS = 8000;
const NAV_MIN_WAIT_MS = 1500;
const NAV_JITTER_MS = 4000;

export default defineContentScript({
  matches: ['https://www.bing.com/search*'],
  async main() {
    if (!new URLSearchParams(location.search).has('marAuto')) return;
    if (!oncePerPageRun('_marFirstResultClicked')) return;

    const link = await waitForResult();
    if (!link) {
      console.warn('[MAR] no organic result found for this query');
      return;
    }
    console.log('[MAR] first result:', link.textContent?.trim(), '→', link.href);
    await wait(NAV_MIN_WAIT_MS + getRndInteger(0, NAV_JITTER_MS));
    location.assign(link.href);
  },
});

function waitForResult(): Promise<HTMLAnchorElement | null> {
  return new Promise((resolve) => {
    const ready = document.querySelector<HTMLAnchorElement>(FIRST_RESULT_SELECTOR);
    if (ready) {
      resolve(ready);
      return;
    }
    const obs = new MutationObserver(() => {
      const found = document.querySelector<HTMLAnchorElement>(FIRST_RESULT_SELECTOR);
      if (found) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(found);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      obs.disconnect();
      resolve(null);
    }, FIND_TIMEOUT_MS);
  });
}
