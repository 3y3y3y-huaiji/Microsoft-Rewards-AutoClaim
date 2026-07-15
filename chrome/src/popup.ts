// popup.ts (Chrome popup UI)

chrome.runtime.onMessage.addListener(handlePopupMessages);

function handlePopupMessages(request: { action: string }): void {
    if (request.action === "searchEnded") {
        const button = document.getElementById("button") as HTMLButtonElement;
        enableButton(button);
    }
}


//opens 10 tabs with bing searches
function openSearches(): void {
    chrome.runtime.sendMessage({ action: "popup" });
}

function stopSearches(): void {
    chrome.runtime.sendMessage({action: "stop"});
}

function setupDonateImage(donateImg: HTMLElement | null, donateText: HTMLElement | null): void {
    if (donateImg && donateText) {
        donateText.addEventListener('mouseover', function () {
            donateImg.style.visibility = 'visible';
        });
    }
}

async function setupSearchButton(button: HTMLButtonElement | null): Promise<void> {
    if (button) {
        const {isSearching} = await chrome.storage.sync.get("isSearching");
        if (isSearching) {
            disableButton(button);
        }
        button.addEventListener("click", async function () {
            if (button.classList.contains('btn-fail')) {
                enableButton(button);
                stopSearches();
            } else {
                disableButton(button);
                openSearches();
            }

        });
    }
}

async function setupRewardsLink(rewardsLink: HTMLAnchorElement | null): Promise<void> {
    if (rewardsLink) {
        const { referralClicked } = await chrome.storage.local.get("referralClicked");
        if (referralClicked) {
            rewardsLink.href = "https://rewards.bing.com/"
        }
        else {
            rewardsLink.addEventListener("click", async function () {
                await chrome.storage.local.set({referralClicked: true});
            });
        }
    }
}

//wait for popup to load before adding event listeners
document.addEventListener('DOMContentLoaded', async function () {
    await chrome.action.setBadgeText({text: ""});
    const button = document.getElementById("button") as HTMLButtonElement | null;
    const donateText = document.getElementById('donateText');
    const donateImg = document.getElementById('donateImg');
    const rewardsLink = document.getElementById('rewardsLink') as HTMLAnchorElement | null;

    setupDonateImage(donateImg, donateText);
    // await setupRewardsLink(rewardsLink);
    await setupSearchButton(button);

    await setCheckboxState("autoCheckbox", "active");
    await setCheckboxState("autoDaily", "autoDaily");
    await setInputState("timeout", "timeout");
    await setInputState("searches", "searches");
    await setInputState("closeTime", "closeTime");

    await setSearchState();
});
//disable button for time it takes to complete searches
function disableButton(button: HTMLElement): void {
    button.classList.replace("btn-success", "btn-fail");
    button.innerHTML = "Stop searches";
}

function enableButton(button: HTMLElement): void {
    button.innerHTML = "Get rewards";
    button.classList.replace("btn-fail", "btn-success");
}

async function setSearchState(): Promise<void> {
    const wordsButton = document.getElementById("wordsBtn") as HTMLElement;
    const stringsButton = document.getElementById("stringsBtn") as HTMLElement;
    const { useWords } = await chrome.storage.sync.get("useWords");

    (useWords ? wordsButton  : stringsButton).classList.add("active");

    wordsButton.addEventListener("click", async () => {
        wordsButton.classList.add("active");
        stringsButton.classList.remove("active");
        await chrome.storage.sync.set({ useWords: true });
    });

    stringsButton.addEventListener("click", async () => {
        stringsButton.classList.add("active");
        wordsButton.classList.remove("active");
        await chrome.storage.sync.set({ useWords: false });
    });
}

async function setInputState(elementId: string, storageKey: string): Promise<void> {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    if (!element) return;
    const result = await chrome.storage.sync.get(storageKey);
    if (result[storageKey] !== undefined) {
        element.value = result[storageKey];
    }
    element.addEventListener("change", async function () {
        await chrome.storage.sync.set({[storageKey]: parseFloat(element.value)});
    });
}

async function setCheckboxState(elementId: string, storageKey: string): Promise<void> {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    if (!element) return;
    const result = await chrome.storage.sync.get(storageKey);
    if (result[storageKey] !== undefined) {
        element.checked = result[storageKey];
    }
    element.addEventListener("click", async function () {
        await chrome.storage.sync.set({[storageKey]: element.checked});
    });
}
