// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation: uniform integer in inclusive range [lower, upper].
// Spec: docs/rewrite/spec.md §4.3 — jitter via getRndInteger.

export function getRndInteger(lower: number, upper: number): number {
  const span = upper - lower + 1;
  // Math.random() yields [0,1); scaling then flooring gives uniform distribution.
  return Math.floor(Math.random() * span) + lower;
}

export function wait(durationMs: number): Promise<void> {
  return new Promise((done) => {
    setTimeout(done, durationMs);
  });
}
