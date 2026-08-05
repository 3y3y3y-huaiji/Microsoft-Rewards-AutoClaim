declare global {
    interface Window {
        _marContentScriptInjected?: boolean;
        _marFirstResultClicked?: boolean;
    }
}
export {};
