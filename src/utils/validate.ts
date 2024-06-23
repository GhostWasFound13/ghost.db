export const isObject = (value: any): boolean => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isArray = (value: any): boolean => {
    return Array.isArray(value);
};

export const isNumber = (value: any): boolean => {
    return typeof value === 'number';
};

export const isString = (value: any): boolean => {
    return typeof value === 'string';
};

export const isBoolean = (value: any): boolean => {
    return typeof value === 'boolean';
};
