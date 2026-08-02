import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { getStorageItem } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';

// "Get rewards" starts a run; while running it flips to "Stop searches".
// The background owns the `isSearching` key (writes it and messages
// `searchEnded` when the run completes), so this component only reads it
// once at mount and mirrors it in local state — it must never write it back,
// or a stale read here would clobber the background's authoritative value.
function ManualClaimButton() {
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        getStorageItem<boolean>('isSearching', StorageValues.SYNC).then((v) => setIsSearching(v ?? false));
    }, []);

    useEffect(() => {
        const listener = (request: { action?: string }) => {
            if (request.action === 'searchEnded') setIsSearching(false);
        };
        browser.runtime.onMessage.addListener(listener);
        return () => browser.runtime.onMessage.removeListener(listener);
    }, []);

    function handleClick() {
        if (isSearching) {
            setIsSearching(false);
            browser.runtime.sendMessage({ action: 'stop' });
        } else {
            setIsSearching(true);
            browser.runtime.sendMessage({ action: 'popup' });
        }
    }

    return (
        <button id="button" className={`btn my-1 ${isSearching ? 'btn-fail' : 'btn-success'}`} onClick={handleClick}>
            {isSearching ? 'Stop searches' : 'Get rewards'}
        </button>
    );
}

export default ManualClaimButton;
