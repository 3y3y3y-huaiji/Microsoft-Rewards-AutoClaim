// popup.ts (Firefox WebExtension)

browser.runtime.onMessage.addListener(handlePopupMessages);

function handlePopupMessages(request: { action: string }): void {
    if (request.action === 'searchEnded') {
        const button = document.getElementById('button') as HTMLButtonElement;
        enableButton(button);
    }
}

// opens searches
function openSearches(): void {
    void browser.runtime.sendMessage({ action: 'popup' });
}

function stopSearches(): void {
    void browser.runtime.sendMessage({ action: 'stop' });
}

function setupDonateImage(donateImg: HTMLElement | null, donateText: HTMLElement | null): void {
    if (donateImg && donateText) {
        donateText.addEventListener('mouseover', () => {
            donateImg.style.visibility = 'visible';
        });
    }
}

async function setupSearchButton(button: HTMLButtonElement | null): Promise<void> {
    if (!button) return;

    const result = await browser.storage.sync.get('isSearching');
    if (result.isSearching) {
        disableButton(button);
    }

    button.addEventListener('click', async () => {
        if (button.classList.contains('btn-fail')) {
            enableButton(button);
            stopSearches();
        } else {
            disableButton(button);
            openSearches();
        }
    });
}

async function setupRewardsLink(rewardsLink: HTMLAnchorElement | null): Promise<void> {
    if (!rewardsLink) return;

    const result = await browser.storage.local.get('referralClicked');
    if (result.referralClicked) {
        rewardsLink.href = 'https://rewards.bing.com/';
    } else {
        rewardsLink.addEventListener('click', async () => {
            await browser.storage.local.set({ referralClicked: true });
        });
    }
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    // Use browser.browserAction for MV2 APIs
    await browser.browserAction.setBadgeText({ text: '' });

    const button = document.getElementById('button') as HTMLButtonElement | null;
    const donateText = document.getElementById('donateText');
    const donateImg = document.getElementById('donateImg');
    const rewardsLink = document.getElementById('rewardsLink') as HTMLAnchorElement | null;

    setupDonateImage(donateImg, donateText);
    // await setupRewardsLink(rewardsLink);
    await setupSearchButton(button);

    await setCheckboxState('autoCheckbox', 'active');
    await setCheckboxState('autoDaily', 'autoDaily');
    await setInputState('timeout', 'timeout');
    await setInputState('searches', 'searches');
    await setInputState('closeTime', 'closeTime');

    await setSearchState();
});

function disableButton(button: HTMLElement): void {
    button.classList.replace('btn-success', 'btn-fail');
    button.textContent = 'Stop searches';
}

function enableButton(button: HTMLElement): void {
    button.textContent = 'Get rewards';
    button.classList.replace('btn-fail', 'btn-success');
}

async function setSearchState(): Promise<void> {
    const wordsButton = document.getElementById('wordsBtn') as HTMLElement;
    const stringsButton = document.getElementById('stringsBtn') as HTMLElement;
    const result = await browser.storage.sync.get('useWords');
    const useWords = result.useWords;

    (useWords ? wordsButton : stringsButton).classList.add('active');

    wordsButton.addEventListener('click', async () => {
        wordsButton.classList.add('active');
        stringsButton.classList.remove('active');
        await browser.storage.sync.set({ useWords: true });
    });

    stringsButton.addEventListener('click', async () => {
        stringsButton.classList.add('active');
        wordsButton.classList.remove('active');
        await browser.storage.sync.set({ useWords: false });
    });
}

async function setInputState(elementId: string, storageKey: string): Promise<void> {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    if (!element) return;

    const result = await browser.storage.sync.get(storageKey);
    if (result[storageKey] !== undefined) {
        element.value = result[storageKey];
    }
    element.addEventListener('change', async () => {
        await browser.storage.sync.set({ [storageKey]: parseFloat(element.value) });
    });
}

async function setCheckboxState(elementId: string, storageKey: string): Promise<void> {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    if (!element) return;

    const result = await browser.storage.sync.get(storageKey);
    if (result[storageKey] !== undefined) {
        element.checked = result[storageKey];
    }
    element.addEventListener('click', async () => {
        await browser.storage.sync.set({ [storageKey]: element.checked });
    });
}
