// Single source of truth for setting defaults, used by install seeding,
// background reads (fallbacks), and the popup's useStorage defaults.
export const DEFAULTS = {
    active: true,
    autoDaily: true,
    accountLevel: 'member',
    timeout: 60,
    searches: 5,
    closeTime: 5,
    // When on, each search tab opens its first organic result after a short
    // random delay (without stealing focus); otherwise the tab just loads the SERP.
    openFirstResult: true,
    // MV3 opt-in ad slot: default off, user must explicitly enable.
    // Stored as sync:adsEnabled (see StorageValues.SYNC and docs/ads/ads-spec.md §4).
    // AdBanner only renders when this is true; no remote JS is ever loaded.
    adsEnabled: false,
} as const;

// Selecting an account level sets a sensible default number of daily searches
// (the user can still override the number manually).
export const LEVEL_SEARCHES: Record<string, number> = {
    member: 5,
    silver: 10,
    gold: 20,
};
