import fs from 'fs';
import yaml from 'yaml';

export type Primitive = string | number | boolean | null | undefined | bigint | symbol;

export interface ParseOptions {
    type?: 'json' | 'yml';
    allowBigInt?: boolean;
    allowMaxSafeInteger?: boolean;
    fallbackType?: 'primitive' | 'object';
}

export function parseValue<T>(
    data: string,
    fallback: T,
    options?: ParseOptions
): T {
    const {
        type = 'json', // Default to JSON parsing if type is not specified
        allowBigInt = true,
        allowMaxSafeInteger = true,
        fallbackType = 'primitive'
    } = options || {};

    try {
        if (type === 'json') {
            const parsed = JSON.parse(data);

            // Handle JSON parsing logic
            if (typeof parsed === typeof fallback) {
                if (typeof parsed === 'number' && !allowMaxSafeInteger && parsed > Number.MAX_SAFE_INTEGER) {
                    throw new Error("Number exceeds MAX_SAFE_INTEGER");
                }
                return parsed as T;
            }
            // Handle specific types like number and bigint
            if (typeof fallback === 'number') {
                const parsedNumber = Number(parsed);
                if (!isNaN(parsedNumber)) {
                    if (allowMaxSafeInteger && parsedNumber <= Number.MAX_SAFE_INTEGER) {
                        return parsedNumber as T;
                    } else if (!allowMaxSafeInteger) {
                        return parsedNumber as T;
                    } else {
                        throw new Error("Invalid number or exceeds MAX_SAFE_INTEGER");
                    }
                }
            }
            if (typeof fallback === 'bigint' && allowBigInt) {
                try {
                    return BigInt(parsed) as T;
                } catch {
                    throw new Error("Failed to parse BigInt");
                }
            }
            // Handle object and other types
            if (typeof fallback === 'object' && fallback !== null) {
                if (typeof parsed === 'object' && parsed !== null) {
                    return parsed as T;
                }
                throw new Error("Type mismatch: expected object or array");
            }
            if (typeof fallback === 'string' || typeof fallback === 'boolean' || fallback === null || fallback === undefined) {
                return parsed as T;
            }
            if (typeof fallback === 'symbol' && typeof parsed === 'string') {
                return Symbol(parsed) as T;
            }
            throw new Error("Type mismatch or unsupported type");
        } else if (type === 'yml') {
            // Handle YAML parsing logic
            const parsedYAML = yaml.parse(data);
            if (typeof parsedYAML === typeof fallback) {
                return parsedYAML as T;
            }
            // Handle object and other types for YAML
            if (typeof fallback === 'object' && fallback !== null) {
                if (typeof parsedYAML === 'object' && parsedYAML !== null) {
                    return parsedYAML as T;
                }
                throw new Error("Type mismatch: expected object or array");
            }
            if (typeof fallback === 'string' || typeof fallback === 'boolean' || fallback === null || fallback === undefined) {
                return parsedYAML as T;
            }
            if (typeof fallback === 'symbol' && typeof parsedYAML === 'string') {
                return Symbol(parsedYAML) as T;
            }
            throw new Error("Type mismatch or unsupported type");
        } else {
            throw new Error(`Unsupported type: ${type}`);
        }
    } catch (error) {
        console.error("Failed to parse value:", error);
        if (fallbackType === 'object' && typeof fallback === 'object' && fallback !== null) {
            return { ...fallback } as T;
        }
        return fallback;
    }
}
