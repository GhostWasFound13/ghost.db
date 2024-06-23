import Database from 'better-sqlite3';
import { transformValue, determineType } from '../utils/transform';
import { parseValue } from '../utils/parse';
import { JSONStorage } from '../storage/json-storage';
import { DataModel } from '../models/data-model';

export class Collection {
    private db: Database.Database;
    private table: string;
    private jsonStorage: JSONStorage;

    constructor(db: Database.Database, table: string, jsonFilePath: string) {
        this.db = db;
        this.table = table;
        this.jsonStorage = new JSONStorage(jsonFilePath);
        this.setup();
    }

    private setup() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.table} (
                id TEXT PRIMARY KEY,
                value TEXT,
                type TEXT
            )
        `).run();
    }

    public set(key: string, value: any): void {
        const transformedValue = transformValue(value);
        const type = determineType(value);
        this.db.prepare(`
            INSERT INTO ${this.table} (id, value, type)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET value = excluded.value, type = excluded.type
        `).run(key, transformedValue, type);
        this.jsonStorage.set(key, { value: transformedValue, type });
    }

    public get<T>(key: string): T | null {
        const row = this.db.prepare(`SELECT value, type FROM ${this.table} WHERE id = ?`).get(key);
        if (row) {
            return parseValue(row.value) as T;
        }
        return this.jsonStorage.get<T>(key);
    }

    public delete(key: string): void {
        this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(key);
        this.jsonStorage.delete(key);
    }

    public clear(): void {
        this.db.prepare(`DELETE FROM ${this.table}`).run();
        this.jsonStorage.clear();
    }

    public has(key: string): boolean {
        const row = this.db.prepare(`SELECT 1 FROM ${this.table} WHERE id = ?`).get(key);
        return !!row || this.jsonStorage.has(key);
    }

    public all(): DataModel[] {
        const rows = this.db.prepare(`SELECT * FROM ${this.table}`).all();
        const jsonRows = this.jsonStorage.all();
        const parsedRows = rows.map(row => ({ id: row.id, value: parseValue(row.value), type: row.type }));
        const combinedRows = [...parsedRows, ...Object.entries(jsonRows).map(([id, { value, type }]) => ({ id, value: parseValue(value), type }))];
        return combinedRows;
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
}
