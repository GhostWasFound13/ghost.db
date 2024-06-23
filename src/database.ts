import Database from 'better-sqlite3';
import { Collection } from './collections/collection';

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

    public set(table: string, key: string, value: any): void {
        const collection = this.getCollection(table);
        collection.set(key, value);
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
}
