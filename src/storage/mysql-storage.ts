import mysql from 'mysql2/promise';

interface StoredData {
    value: string;
    type: string;
    ttl: number | null;
}

export class MySQLStorage {
    private pool: mysql.Pool;
    private table: string;

    constructor(config: mysql.PoolOptions, table: string) {
        this.pool = mysql.createPool(config);
        this.table = table;
        this.setup();
    }

    private async setup() {
        const connection = await this.pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ${this.table} (
                id VARCHAR(255) PRIMARY KEY,
                value TEXT,
                type VARCHAR(255),
                ttl BIGINT
            )
        `);
        connection.release();
    }

    public async set(key: string, value: StoredData): Promise<void> {
        const connection = await this.pool.getConnection();
        await connection.query(`
            INSERT INTO ${this.table} (id, value, type, ttl)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE value = VALUES(value), type = VALUES(type), ttl = VALUES(ttl)
        `, [key, value.value, value.type, value.ttl]);
        connection.release();
    }

    public async get<T>(key: string): Promise<StoredData | null> {
        const connection = await this.pool.getConnection();
        const [rows] = await connection.query(`SELECT value, type, ttl FROM ${this.table} WHERE id = ?`, [key]);
        connection.release();
        if ((rows as any[]).length > 0) {
            return rows[0] as StoredData;
        }
        return null;
    }

    public async delete(key: string): Promise<void> {
        const connection = await this.pool.getConnection();
        await connection.query(`DELETE FROM ${this.table} WHERE id = ?`, [key]);
        connection.release();
    }

    public async clear(): Promise<void> {
        const connection = await this.pool.getConnection();
        await connection.query(`DELETE FROM ${this.table}`);
        connection.release();
    }

    public async has(key: string): Promise<boolean> {
        const connection = await this.pool.getConnection();
        const [rows] = await connection.query(`SELECT 1 FROM ${this.table} WHERE id = ?`, [key]);
        connection.release();
        return (rows as any[]).length > 0;
    }

    public async all(): Promise<Record<string, StoredData>> {
        const connection = await this.pool.getConnection();
        const [rows] = await connection.query(`SELECT * FROM ${this.table}`);
        connection.release();
        const result: Record<string, StoredData> = {};
        for (const row of rows as any[]) {
            result[row.id] = {
                value: row.value,
                type: row.type,
                ttl: row.ttl
            };
        }
        return result;
    }
}
