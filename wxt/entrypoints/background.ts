import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { handleInstallOrUpdate, handleStartup, runRewards } from './background/dailySchedule';
import { handleAlarmStep, stopSearches } from './background/searchRunner';

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(handleInstallOrUpdate);
    browser.runtime.onStartup.addListener(handleStartup);
    browser.runtime.onMessage.addListener((request: { action?: string }) => {
        if (request.action === 'popup') void runRewards(true);
        else if (request.action === 'stop') void stopSearches();
    });
    browser.alarms.onAlarm.addListener((alarm) => void handleAlarmStep(alarm));
});
