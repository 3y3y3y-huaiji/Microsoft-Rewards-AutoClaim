// Daily-set links live in `div.grid > a`, mixed in with dashboard nav links
// (redeem, homepage). Every daily-set activity carries a `form`/`FORM` tracking
// code in its query string — search cards, quizzes, and non-search cards like the
// referral-style one alike — while the nav links don't. Filtering on that keeps
// all the real cards, drops the junk, doesn't assume a fixed card count, and
// stays empty until the cards render (so callers wait for the set, not the header).
export function matchDailyAnchors(root: ParentNode): HTMLAnchorElement[] {
    return [...root.querySelectorAll<HTMLAnchorElement>('div.grid > a')]
        .filter(hasFormCode);
}

function hasFormCode(anchor: HTMLAnchorElement): boolean {
    let url: URL;
    try {
        url = new URL(anchor.href);
    } catch {
        return false;
    }
    // searchParams.has is case-sensitive and Bing uses both `form` and `FORM`.
    return url.searchParams.has('form') || url.searchParams.has('FORM');
}
