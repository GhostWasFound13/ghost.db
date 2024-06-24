import fs from 'fs';
import yaml from 'yaml';
import { parseValue, ParseOptions } from '../utils/parse';

export interface YMLDriverOptions {
    path?: string;
}

export class YMLDriver {
    public readonly path: string;

    constructor(public readonly options?: YMLDriverOptions) {
        this.path = options?.path || './db.yml';
    }

    private checkFile(): boolean {
        return fs.existsSync(this.path);
    }

    public init(table: string): void {
        if (!this.checkFile()) {
            fs.writeFileSync(this.path, '');
        }

        const data = this.read();
        if (!data[table]) {
            data[table] = {};
            this.write(data);
        }
    }

    public createTable(table: string): boolean {
        if (!this.checkFile()) {
            fs.writeFileSync(this.path, '');
        }

        const data = this.read();
        if (!data[table]) {
            data[table] = {};
            this.write(data);
        }

        return true;
    }

    public tables(): string[] {
        return Object.keys(this.read());
    }

    // Inserters/Updaters
    public insert(table: string, array: { key: string; value: any }[]): boolean {
        const data = this.read();
        for (const { key, value } of array) {
            data[table][key] = value;
        }
        this.write(data);
        return true;
    }

    public setRowByKey(table: string, key: string, value: any): boolean {
        const data = this.read();
        data[table][key] = value;
        this.write(data);
        return true;
    }

    // Getters
    public getAllRows(table: string): any {
        return this.read()[table] || {};
    }

    public getRowByKey(table: string, key: string): any {
        return this.read()[table]?.[key];
    }

    // Deleters
    public deleteRowByKey(table: string, key: string): number {
        const data = this.read();
        delete data[table][key];
        this.write(data);
        return 1;
    }

    public deleteAllRows(table: string): boolean {
        const data = this.read();
        delete data[table];
        this.write(data);
        return true;
    }

    public read(): any {
        if (!this.checkFile()) {
            return {};
        }
        const fileContent = fs.readFileSync(this.path, 'utf-8');
        return parseValue(fileContent, {}, { type: 'yml' });
    }

    public write(data: any): void {
        const yamlData = yaml.stringify(data);
        fs.writeFileSync(this.path, yamlData);
    }

    public clear(): void {
        this.write({});
    }
}
