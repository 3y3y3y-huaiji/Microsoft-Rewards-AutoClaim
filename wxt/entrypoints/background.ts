// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation per docs/rewrite/spec.md §2.
// Wires background lifecycle events; business logic lives in submodules.

import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { handleInstallOrUpdate, handleStartup, runRewards } from './background/dailySchedule';
import { handleAlarmStep, stopSearches, watchSearchesToggle } from './background/searchRunner';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(handleInstallOrUpdate);
  browser.runtime.onStartup.addListener(handleStartup);
  watchSearchesToggle();

  browser.runtime.onMessage.addListener((msg: { action?: string }) => {
    if (msg.action === 'popup') void runRewards();
    else if (msg.action === 'stop') void stopSearches();
  });

  browser.alarms.onAlarm.addListener((alarm) => void handleAlarmStep(alarm));
});
