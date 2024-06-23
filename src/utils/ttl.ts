export const isExpired = (ttl: number | null): boolean => {
    if (ttl === null) return false;
    return Date.now() > ttl;
};
