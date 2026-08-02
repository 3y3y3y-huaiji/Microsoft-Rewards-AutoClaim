export function getRndInteger(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
