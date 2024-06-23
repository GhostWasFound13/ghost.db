import Database from 'better-sqlite3';
import { transformValue, determineType } from '../utils/transform';
import { parseValue } from '../utils/parse';
import { isExpired } from '../utils/ttl';
import { JSONStorage } from '../storage/json-storage';
import { DataModel } from '../models/data-model';
import { EventEmitter } from 'events';

export class Collection extends EventEmitter {
    private db: Database.Database;
    private table: string;
    private jsonStorage: JSONStorage;

    constructor(db: Database.Database, table: string, jsonFilePath: string, backupPath: string, encryptionKey: string) {
        super();
        this.db = db;
        this.table = table;
        this.jsonStorage = new JSONStorage(jsonFilePath, backupPath, encryptionKey);
        this.setup();
    }

    private setup() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.table} (
                id TEXT PRIMARY KEY,
                value TEXT,
                type TEXT,
                ttl INTEGER
            )
        `).run();
    }

    public set(key: string, value: any, ttl?: number): void {
        const transformedValue = transformValue(value);
        const type = determineType(value);
        const expireAt = ttl ? Date.now() + ttl : null;
        this.db.prepare(`
            INSERT INTO ${this.table} (id, value, type, ttl)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET value = excluded.value, type = excluded.type, ttl = excluded.ttl
        `).run(key, transformedValue, type, expireAt);
        this.jsonStorage.set(key, { value: transformedValue, type, ttl: expireAt });
        this.emit('set', { key, value });
    }

    public get<T>(key: string): T | null {
        const row = this.db.prepare(`SELECT value, type, ttl FROM ${this.table} WHERE id = ?`).get(key);
        if (row) {
            if (isExpired(row.ttl)) {
                this.delete(key);
                return null;
            }
            return parseValue(row.value) as T;
        }
        const jsonData = this.jsonStorage.get<T>(key);
        if (jsonData && isExpired(jsonData.ttl)) {
            this.delete(key);
            return null;
        }
        return jsonData ? jsonData.value : null;
    }

    public delete(key: string): void {
        this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(key);
        this.jsonStorage.delete(key);
        this.emit('delete', { key });
    }

    public clear(): void {
        this.db.prepare(`DELETE FROM ${this.table}`).run();
        this.jsonStorage.clear();
        this.emit('clear');
    }

    public has(key: string): boolean {
        const row = this.db.prepare(`SELECT 1 FROM ${this.table} WHERE id = ?`).get(key);
        return !!row || this.jsonStorage.has(key);
    }

    public all(): DataModel[] {
        const rows = this.db.prepare(`SELECT * FROM ${this.table}`).all();
        const jsonRows = this.jsonStorage.all();
        const parsedRows = rows.map(row => ({ id: row.id, value: parseValue(row.value), type: row.type, ttl: row.ttl }));
        const combinedRows = [...parsedRows, ...Object.entries(jsonRows).map(([id, { value, type, ttl }]) => ({ id, value: parseValue(value), type, ttl }))];
        return combinedRows.filter(row => !isExpired(row.ttl));
    }

    public push(key: string, value: any): void {
        const data = this.get<any[]>(key) || [];
        if (!Array.isArray(data)) {
            throw new Error(`Data at key ${key} is not an array`);
        }
        data.push(value);
        this.set(key, data);
    }

    public fetch(filter: (data: DataModel) => boolean): DataModel[] {
        return this.all().filter(filter);
    }

    public update(key: string, updates: Record<string, any>): void {
        const data = this.get<any>(key);
        if (!data || typeof data !== 'object') {
            throw new Error(`Data at key ${key} is not an object`);
        }
        const updatedData = { ...data, ...updates };
        this.set(key, updatedData);
    }

    public increment(key: string, amount: number = 1): void {
        let data = this.get<number>(key);
        if (typeof data !== 'number') {
            data = 0;
        }
        data += amount;
        this.set(key, data);
    }

    public decrement(key: string, amount: number = 1): void {
        let data = this.get<number>(key);
        if (typeof data !== 'number') {
            data = 0;
        }
        data -= amount;
        this.set(key, data);
    }

    public batchSet(entries: Record<string, any>): void {
        for (const key in entries) {
            this.set(key, entries[key]);
        }
    }

    public batchDelete(keys: string[]): void {
        for (const key of keys) {
            this.delete(key);
        }
    }

    public restore(): void {
        this.jsonStorage.restore();
    }
}
