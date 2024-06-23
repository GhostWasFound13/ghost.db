import { Collection } from './collections/collection';
import { DataModel } from './models/data-model';

type StorageType = 'sqlite' | 'json' | 'mysql';

interface MyQuickDBConfig {
    dbPath?: string;
    jsonFilePath?: string;
    backupPath?: string;
    encryptionKey?: string;
    mysqlConfig?: any;
}

export class MyQuickDB {
    private storageType: StorageType;
    private config: MyQuickDBConfig;
    private collections: Map<string, Collection>;

    constructor(storageType: StorageType, config: MyQuickDBConfig) {
        this.storageType = storageType;
        this.config = config;
        this.collections = new Map();
    }

    private getCollection(table: string): Collection {
        if (!this.collections.has(table)) {
            const collection = new Collection(this.storageType, table, this.config);
            this.collections.set(table, collection);
        }
        return this.collections.get(table)!;
    }

    public async set(table: string, key: string, value: any, ttl?: number): Promise<void> {
        const collection = this.getCollection(table);
        await collection.set(key, value, ttl);
    }

    public async get<T>(table: string, key: string): Promise<T | null> {
        const collection = this.getCollection(table);
        return await collection.get<T>(key);
    }

    public async delete(table: string, key: string): Promise<void> {
        const collection = this.getCollection(table);
        await collection.delete(key);
    }

    public async clear(table: string): Promise<void> {
        const collection = this.getCollection(table);
        await collection.clear();
    }

    public async has(table: string, key: string): Promise<boolean> {
        const collection = this.getCollection(table);
        return await collection.has(key);
    }

    public async all(table: string): Promise<DataModel[]> {
        const collection = this.getCollection(table);
        return await collection.all();
    }

    public async push(table: string, key: string, value: any): Promise<void> {
        const collection = this.getCollection(table);
        await collection.push(key, value);
    }

    public async fetch(table: string, filter: (data: DataModel) => boolean): Promise<DataModel[]> {
        const collection = this.getCollection(table);
        return await collection.fetch(filter);
    }

    public async update(table: string, key: string, updates: Record<string, any>): Promise<void> {
        const collection = this.getCollection(table);
        await collection.update(key, updates);
    }

    public async increment(table: string, key: string, amount: number = 1): Promise<void> {
        const collection = this.getCollection(table);
        await collection.increment(key, amount);
    }

    public async decrement(table: string, key: string, amount: number = 1): Promise<void> {
        const collection = this.getCollection(table);
        await collection.decrement(key, amount);
    }

    public async batchSet(table: string, entries: Record<string, any>): Promise<void> {
        const collection = this.getCollection(table);
        await collection.batchSet(entries);
    }

    public async batchDelete(table: string, keys: string[]): Promise<void> {
        const collection = this.getCollection(table);
        await collection.batchDelete(keys);
    }
}
