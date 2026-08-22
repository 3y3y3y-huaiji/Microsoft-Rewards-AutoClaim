// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Spec §6 / §5.2 — guard so a content script runs only once per page load.
// Clean-room: uses a window flag keyed by caller; no code copied.

export function oncePerPageRun(flag: keyof Window): boolean {
  if ((window as unknown as Record<string, unknown>)[flag as string]) {
    return false;
  }
  (window as unknown as Record<string, unknown>)[flag as string] = true;
  return true;
}
