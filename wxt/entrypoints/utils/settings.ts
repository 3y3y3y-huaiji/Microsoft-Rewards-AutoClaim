// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Spec §3.2 — single source of truth for defaults and level mapping.
// Clean-room: values are dictated by spec, naming and comments are fresh.

export const DEFAULTS = {
  active: true,
  autoDaily: true,
  accountLevel: 'member' as const,
  timeout: 60,
  searches: 5,
  closeTime: 5,
  openFirstResult: true,
} as const;

export const LEVEL_SEARCHES: Record<string, number> = {
  member: 5,
  silver: 10,
  gold: 20,
};
