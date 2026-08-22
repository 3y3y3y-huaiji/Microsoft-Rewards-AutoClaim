// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Spec §4.4 — popup progress view; clamped so the bar never overflows when
// stored counts disagree (user lowers total mid-run).

export interface SearchProgressView {
  completed: number;
  total: number;
  percent: number;
}

function sanitizeCount(raw: number): number {
  const truncated = Math.trunc(raw);
  return Number.isFinite(truncated) ? truncated : 0;
}

export function toSearchProgress(done: number, total: number): SearchProgressView {
  const safeTotal = Math.max(sanitizeCount(total), 1);
  const safeDone = Math.min(Math.max(sanitizeCount(done), 0), safeTotal);
  return {
    completed: safeDone,
    total: safeTotal,
    percent: Math.round((safeDone / safeTotal) * 100),
  };
}
