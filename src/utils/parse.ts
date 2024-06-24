

type Primitive = string | number | boolean | null | undefined | bigint | symbol;

interface ParseOptions {
  allowBigInt?: boolean;
  allowMaxSafeInteger?: boolean;
  fallbackType?: 'primitive' | 'object';
}

export function parseValue<T>(
  data: string,
  fallback: T,
  options?: ParseOptions
): T {
  const { allowBigInt = true, allowMaxSafeInteger = true, fallbackType = 'primitive' } = options || {};
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === typeof fallback) {
      if (typeof parsed === 'number' && !allowMaxSafeInteger && parsed > Number.MAX_SAFE_INTEGER) {
        throw new Error("Number exceeds MAX_SAFE_INTEGER");
      }
      return parsed as T;
    }
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
  } catch (error) {
    console.error("Failed to parse value:", error);
    if (fallbackType === 'object' && typeof fallback === 'object' && fallback !== null) {
      return { ...fallback } as T;
    }
    return fallback;
  }
}
