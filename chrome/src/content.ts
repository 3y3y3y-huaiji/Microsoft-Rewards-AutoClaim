// content.ts (Chrome content script, injected on rewards.bing.com)

chrome.runtime.onMessage.addListener(handleContentMessage);

const targetSelector = '#daily-sets > mee-card-group:nth-child(7) > div';

async function waitForElement(selector: string): Promise<Element> {

    return new Promise<Element>((resolve) => {
        const observer = new MutationObserver(() => {
            const target = document.querySelector(selector);
            if (target) {
                observer.disconnect();
                resolve(target);
            }
        });
        observer.observe(document.body!, { childList: true, subtree: true });
        const target = document.querySelector(selector);
        if (target) {
            observer.disconnect();
            resolve(target);
        }
    });
}

function handleContentMessage(request: { action: string }): void {
        if (request.action === "openDaily") {
            openDailySets();
        }
}


function openDailySets(): void {
    waitForElement(targetSelector).then(async (targetNode) => {
        if (!targetNode) return;
        const targetLinks = targetNode.getElementsByClassName("ds-card-sec ng-scope") as HTMLCollectionOf<HTMLElement>;
        for (const link of targetLinks) {
            link.click();
            await contentDelay(1000 + contentGetRandomNumber(0, 1000));
        }
    });
}

async function contentDelay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function contentGetRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
