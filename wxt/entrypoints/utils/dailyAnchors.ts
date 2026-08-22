// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Spec §5.3 — daily-set anchors live under div.grid > a and are distinguished
// by a `form`/`FORM` query param. Nav links lack it. Clean-room implementation.

export function matchDailyAnchors(scope: ParentNode): HTMLAnchorElement[] {
  const candidates = [...scope.querySelectorAll<HTMLAnchorElement>('div.grid > a')];
  return candidates.filter(containsFormParam);
}

function containsFormParam(link: HTMLAnchorElement): boolean {
  try {
    const parsed = new URL(link.href);
    // URLSearchParams is case-sensitive; Bing uses both casings.
    return parsed.searchParams.has('form') || parsed.searchParams.has('FORM');
  } catch {
    return false;
  }
}
