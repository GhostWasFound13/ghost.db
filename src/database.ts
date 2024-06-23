import Database from 'better-sqlite3';
import { Collection } from './collections/collection';
import { DataModel } from './models/data-model';

export class MyQuickDB {
    private db: Database.Database;
    private collections: Map<string, Collection>;

    constructor(path: string) {
        this.db = new Database(path);
        this.collections = new Map();
    }

    private getCollection(table: string): Collection {
        if (!this.collections.has(table)) {
            const collection = new Collection(this.db, table, `${table}.json`);
            this.collections.set(table, collection);
        }
        return this.collections.get(table)!;
    }

    public set(table: string, key: string, value: any, ttl?: number): void {
        const collection = this.getCollection(table);
        collection.set(key, value, ttl);
    }

    public get<T>(table: string, key: string): T | null {
        const collection = this.getCollection(table);
        return collection.get<T>(key);
    }

    public delete(table: string, key: string): void {
        const collection = this.getCollection(table);
        collection.delete(key);
    }

    public clear(table: string): void {
        const collection = this.getCollection(table);
        collection.clear();
    }

    public has(table: string, key: string): boolean {
        const collection = this.getCollection(table);
        return collection.has(key);
    }

    public all(table: string): DataModel[] {
        const collection = this.getCollection(table);
        return collection.all();
    }

    public push(table: string, key: string, value: any): void {
        const collection = this.getCollection(table);
        collection.push(key, value);
    }

    public fetch(table: string, filter: (data: DataModel) => boolean): DataModel[] {
        const collection = this.getCollection(table);
        return collection.fetch(filter);
    }

    public update(table: string, key: string, updates: Record<string, any>): void {
        const collection = this.getCollection(table);
        collection.update(key, updates);
    }

    public increment(table: string, key: string, amount: number = 1): void {
        const collection = this.getCollection(table);
        collection.increment(key, amount);
    }

    public decrement(table: string, key: string, amount: number = 1): void {
        const collection = this.getCollection(table);
        collection.decrement(key, amount);
    }

    public batchSet(table: string, entries: Record<string, any>): void {
        const collection = this.getCollection(table);
        collection.batchSet(entries);
    }

    public batchDelete(table: string, keys: string[]): void {
        const collection = this.getCollection(table);
        collection.batchDelete(keys);
    }
}
