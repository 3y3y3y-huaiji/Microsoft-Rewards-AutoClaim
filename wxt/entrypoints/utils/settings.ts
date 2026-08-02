// Single source of truth for setting defaults, used by install seeding,
// background reads (fallbacks), and the popup's useStorage defaults.
export const DEFAULTS = {
    active: true,
    autoDaily: true,
    timeout: 60,
    searches: 3,
    closeTime: 5,
    useWords: true,
} as const;
