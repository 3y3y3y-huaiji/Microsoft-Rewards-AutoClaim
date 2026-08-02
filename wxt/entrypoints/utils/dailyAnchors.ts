// Daily-set links live in `div.grid > a`; keep only the ones that actually
// point at a Bing search (the current selector, resilient across Chrome/Firefox).
export function matchDailyAnchors(root: ParentNode): HTMLAnchorElement[] {
    return [...root.querySelectorAll<HTMLAnchorElement>('div.grid > a')]
        .filter((a) => a.href.includes('www.bing.com/search?q='));
}
