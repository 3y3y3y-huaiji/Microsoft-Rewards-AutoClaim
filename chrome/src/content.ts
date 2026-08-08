// content.ts (Chrome content script, injected on rewards.bing.com)

chrome.runtime.onMessage.addListener(handleContentMessage);

function waitForBingSearchAnchors(): Promise<HTMLAnchorElement[]> {
    function resolveAnchors(observer: MutationObserver, resolve: (value: (PromiseLike<HTMLAnchorElement[]> | HTMLAnchorElement[])) => void) {
        const anchors = [...document.querySelectorAll<HTMLAnchorElement>("div.grid > a")]
            .filter((anchor) => anchor.href.includes("www.bing.com/search?q="));

        if (anchors.length > 0) {
            observer.disconnect();
            resolve(anchors);
        }
    }

    return new Promise<HTMLAnchorElement[]>((resolve) => {
        const observer = new MutationObserver(() => {
            resolveAnchors(observer, resolve);
        });

        observer.observe(document.body!, { childList: true, subtree: true });

        resolveAnchors(observer, resolve);
    });
}

function handleContentMessage(request: { action: string }): void {
    if (request.action === "openDaily") {
        void openDailySets();
    }
}

async function openDailySets(): Promise<void> {
    const targetLinks = await waitForBingSearchAnchors();

    for (const link of targetLinks) {
        link.click();
        await contentDelay(1000 + contentGetRandomNumber(0, 1000));
    }
}

async function contentDelay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function contentGetRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
