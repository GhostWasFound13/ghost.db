import fs from 'fs';
import { parseValue } from '../utils/parse';

interface JSONDriverOptions {
    path?: string;
    format?: boolean;
}

export class JSONDriver {
    public readonly path: string;
    public readonly format: boolean;

    constructor(
        public readonly options?: JSONDriverOptions
    ) {
        this.path = options?.path || './db.json';
        this.format = options?.format || false;
    }

    private checkFile(): boolean {
        return fs.existsSync(this.path);
    }

    public init(table: string): void {
        if (!this.checkFile()) {
            fs.writeFileSync(this.path, JSON.stringify({}));
        }

        const data = this.read();
        if (!data[table]) {
            data[table] = {};
            this.write(data);
        }
    }

    public createTable(table: string): void {
        if (!this.checkFile()) {
            fs.writeFileSync(this.path, JSON.stringify({}));
        }

        const data = this.read();
        if (!data[table]) {
            data[table] = {};
            this.write(data);
        }
    }

    public tables(): string[] {
        return Object.keys(this.read());
    }

    // Inserters/Updaters
    public insert(table: string, entries: { key: string; value: any }[]): void {
        const data = this.read();
        entries.forEach(({ key, value }) => {
            data[table][key] = value;
        });
        this.write(data);
    }

    public setRowByKey(table: string, key: string, value: any): void {
        const data = this.read();
        data[table][key] = value;
        this.write(data);
    }

    // Getters
    public getAllRows(table: string): any {
        return this.read()[table] || {};
    }

    public getRowByKey(table: string, key: string): any {
        return this.read()[table]?.[key];
    }

    // Deleters
    public deleteRowByKey(table: string, key: string): boolean {
        const data = this.read();
        if (data[table] && data[table][key]) {
            delete data[table][key];
            this.write(data);
            return true;
        }
        return false;
    }

    public deleteAllRows(table: string): boolean {
        const data = this.read();
        if (data[table]) {
            delete data[table];
            this.write(data);
            return true;
        }
        return false;
    }

    // Batch operations
    public batchInsert(table: string, entries: { key: string; value: any }[]): void {
        const data = this.read();
        entries.forEach(({ key, value }) => {
            data[table][key] = value;
        });
        this.write(data);
    }

    public batchDelete(table: string, keys: string[]): void {
        const data = this.read();
        keys.forEach(key => {
            delete data[table][key];
        });
        this.write(data);
    }

    // Read and write operations
    public read(): any {
        if (!this.checkFile()) {
            return {};
        }
        const fileContent = fs.readFileSync(this.path, 'utf-8');
        return parseValue(fileContent, {});
    }

    public write(data: any): void {
        const jsonData = this.format ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        fs.writeFileSync(this.path, jsonData);
    }

    // Clear the database
    public clear(): void {
        this.write({});
    }
}
