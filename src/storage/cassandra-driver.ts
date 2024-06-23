import { Client } from 'cassandra-driver';
import { DataModel } from '../models/data-model';

export class CassandraDriver {
    private client: Client;
    private table: string;

    constructor(contactPoints: string[], keyspace: string, username: string, password: string, table: string) {
        this.client = new Client({
            contactPoints,
            localDataCenter: 'datacenter1',
            keyspace,
            credentials: { username, password }
        });
        this.table = table;
    }

    public async connect(): Promise<void> {
        await this.client.connect();
        console.log('Connected to Cassandra cluster');
    }

    public async disconnect(): Promise<void> {
        await this.client.shutdown();
        console.log('Disconnected from Cassandra cluster');
    }

    public async set(key: string, data: DataModel): Promise<void> {
        const query = `
            INSERT INTO ${this.table} (key, value, type, ttl)
            VALUES (?, ?, ?, ?)
            USING TTL ?;
        `;
        const values = [key, data.value, data.type, data.ttl, data.ttl || 0];
        await this.client.execute(query, values, { prepare: true });
    }

    public async get(key: string): Promise<DataModel | null> {
        const query = `
            SELECT * FROM ${this.table} WHERE key = ?;
        `;
        const result = await this.client.execute(query, [key], { prepare: true });
        const row = result.first();
        if (row) {
            return {
                key: row.key,
                value: row.value,
                type: row.type,
                ttl: row.ttl
            };
        }
        return null;
    }

    public async delete(key: string): Promise<void> {
        const query = `
            DELETE FROM ${this.table} WHERE key = ?;
        `;
        await this.client.execute(query, [key], { prepare: true });
    }

    public async clear(): Promise<void> {
        const query = `TRUNCATE ${this.table};`;
        await this.client.execute(query);
    }

    public async has(key: string): Promise<boolean> {
        const query = `
            SELECT COUNT(*) FROM ${this.table} WHERE key = ?;
        `;
        const result = await this.client.execute(query, [key], { prepare: true });
        const row = result.first();
        return row ? row['count'] > 0 : false;
    }

    public async all(): Promise<DataModel[]> {
        const query = `
            SELECT * FROM ${this.table};
        `;
        const result = await this.client.execute(query);
        return result.rows.map(row => ({
            key: row.key,
            value: row.value,
            type: row.type,
            ttl: row.ttl
        }));
    }
}
