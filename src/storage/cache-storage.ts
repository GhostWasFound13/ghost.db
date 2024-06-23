import { DataModel } from '../models/data-model';

export class CacheStorage {
    private cache: Map<string, DataModel>;

    constructor() {
        this.cache = new Map();
    }

    public set(key: string, data: DataModel): void {
        this.cache.set(key, data);
    }

    public get(key: string): DataModel | null {
        return this.cache.get(key) || null;
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }

    public all(): DataModel[] {
        return Array.from(this.cache.values());
    }
}
