import Database from 'better-sqlite3';

interface StoredData {
    value: string;
    type: string;
    ttl: number | null;
}

export class SQLiteStorage {
    private db: Database.Database;
    private table: string;

    constructor(dbPath: string, table: string) {
        this.db = new Database(dbPath);
        this.table = table;
        this.setup();
    }

    private setup(): void {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.table} (
                id TEXT PRIMARY KEY,
                value TEXT,
                type TEXT,
                ttl INTEGER
            )
        `).run();
    }

    public set(key: string, value: StoredData): void {
        this.db.prepare(`
            INSERT INTO ${this.table} (id, value, type, ttl)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET value = excluded.value, type = excluded.type, ttl = excluded.ttl
        `).run(key, value.value, value.type, value.ttl);
    }

    public get(key: string): StoredData | null {
        const row = this.db.prepare(`SELECT value, type, ttl FROM ${this.table} WHERE id = ?`).get(key);
        if (row) {
            return row;
        }
        return null;
    }

    public delete(key: string): void {
        this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(key);
    }

    public clear(): void {
        this.db.prepare(`DELETE FROM ${this.table}`).run();
    }

    public has(key: string): boolean {
        const row = this.db.prepare(`SELECT 1 FROM ${this.table} WHERE id = ?`).get(key);
        return !!row;
    }

    public all(): Record<string, StoredData> {
        const rows = this.db.prepare(`SELECT * FROM ${this.table}`).all();
        const result: Record<string, StoredData> = {};
        for (const row of rows) {
            result[row.id] = {
                value: row.value,
                type: row.type,
                ttl: row.ttl
            };
        }
        return result;
    }
}
