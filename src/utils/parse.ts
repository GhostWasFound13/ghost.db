export function parseValue(value: any): any {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}
