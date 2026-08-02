import { useEffect } from 'react';
import { browser } from 'wxt/browser';
import { useStorage } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';

// "Get rewards" starts a run; while running it flips to "Stop searches".
// The background messages `searchEnded` when the run completes.
function ManualClaimButton() {
    const [isSearching, setIsSearching] = useStorage<boolean>('isSearching', false, StorageValues.SYNC);

    useEffect(() => {
        const listener = (request: { action?: string }) => {
            if (request.action === 'searchEnded') setIsSearching(false);
        };
        browser.runtime.onMessage.addListener(listener);
        return () => browser.runtime.onMessage.removeListener(listener);
    }, [setIsSearching]);

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
