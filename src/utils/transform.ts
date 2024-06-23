export const transformValue = (value: any): string => {
    return JSON.stringify(value);
};

export const determineType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};
