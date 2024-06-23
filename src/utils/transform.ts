export function transformValue(value: any): string {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

export function determineType(value: any): string {
    return typeof value;
}
