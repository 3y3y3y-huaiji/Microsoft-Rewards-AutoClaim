// Clamped view of a search run, for the popup's progress indicator.
export interface SearchProgressView {
    completed: number;
    total: number;
    percent: number;
}

function toCount(value: number): number {
    const n = Math.trunc(value);
    return Number.isFinite(n) ? n : 0;
}

// Stored counts come from a previous run and from a user-editable field, so they
// can disagree (e.g. lowering "number of searches" mid-run leaves completed >
// total). Clamping here keeps the bar inside its track and the label sensible.
export function toSearchProgress(completed: number, total: number): SearchProgressView {
    const safeTotal = Math.max(toCount(total), 1);
    const safeCompleted = Math.min(Math.max(toCount(completed), 0), safeTotal);
    return {
        completed: safeCompleted,
        total: safeTotal,
        percent: Math.round((safeCompleted / safeTotal) * 100),
    };
}
