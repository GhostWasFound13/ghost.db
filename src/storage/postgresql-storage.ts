import { Client } from 'pg';
import { DataModel } from '../models/data-model';

export class PostgreSQLStorage {
    private client: Client;
    private table: string;

    constructor(config: any, table: string) {
        this.client = new Client(config);
        this.table = table;
        this.client.connect().catch(console.error);
        this.createTable();
    }

    private async createTable(): Promise<void> {
        const query = `
            CREATE TABLE IF NOT EXISTS ${this.table} (
                key TEXT PRIMARY KEY,
                value TEXT,
                type TEXT,
                ttl BIGINT
            );
        `;
        await this.client.query(query);
    }

    public async set(key: string, data: DataModel): Promise<void> {
        const query = `
            INSERT INTO ${this.table} (key, value, type, ttl)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                type = EXCLUDED.type,
                ttl = EXCLUDED.ttl;
        `;
        const values = [key, data.value, data.type, data.ttl];
        await this.client.query(query, values);
    }

    public async get(key: string): Promise<DataModel | null> {
        const query = `SELECT * FROM ${this.table} WHERE key = $1;`;
        const res = await this.client.query(query, [key]);
        return res.rows[0] || null;
    }

    public async delete(key: string): Promise<void> {
        const query = `DELETE FROM ${this.table} WHERE key = $1;`;
        await this.client.query(query, [key]);
    }

    public async clear(): Promise<void> {
        const query = `DELETE FROM ${this.table};`;
        await this.client.query(query);
    }

    public async has(key: string): Promise<boolean> {
        const query = `SELECT 1 FROM ${this.table} WHERE key = $1;`;
        const res = await this.client.query(query, [key]);
        return res.rowCount > 0;
    }

    public async all(): Promise<DataModel[]> {
        const query = `SELECT * FROM ${this.table};`;
        const res = await this.client.query(query);
        return res.rows;
    }
}
