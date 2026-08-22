// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room: badge helpers for MV3/MV2 compatibility.
// Spec §4.4 / §8 — toolbar badge shows completed count; color matches popup accent.

import { browser } from 'wxt/browser';

const BADGE_BG = '#2282ad';

type BadgePort = {
  setBadgeText(details: { text: string }): void;
  setBadgeBackgroundColor?(details: { color: string }): void;
};

function resolveBadge(): BadgePort | undefined {
  const b = browser as unknown as { action?: BadgePort; browserAction?: BadgePort };
  return b.action ?? b.browserAction;
}

export function setBadgeText(text: string): void {
  resolveBadge()?.setBadgeText({ text });
}

export function setSearchCountBadge(done: number): void {
  const api = resolveBadge();
  if (!api) return;
  api.setBadgeBackgroundColor?.({ color: BADGE_BG });
  api.setBadgeText({ text: String(done) });
}

export function clearBadge(): void {
  setBadgeText('');
}
