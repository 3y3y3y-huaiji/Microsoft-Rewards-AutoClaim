"use strict";
// content.ts (Firefox WebExtension)
browser.runtime.onMessage.addListener(handleContentMessage);
function waitForBingSearchAnchors() {
    function extracted(observer, resolve) {
        const anchors = [...document.querySelectorAll("div.grid.gap-3 > a")]
            .filter((anchor) => anchor.href.includes("www.bing.com/search?q="));
        if (anchors.length > 0) {
            observer.disconnect();
            resolve(anchors);
        }
    }
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            extracted(observer, resolve);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        extracted(observer, resolve);
    });
}
function handleContentMessage(request) {
    if (request.action === 'openDaily') {
        void openDailySets();
    }
}
async function openDailySets() {
    const targetLinks = await waitForBingSearchAnchors();
    for (const link of targetLinks) {
        link.click();
        await contentDelay(1000 + contentGetRandomNumber(0, 1000));
    }
}
function contentDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function contentGetRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
