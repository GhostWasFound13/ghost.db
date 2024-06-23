import * as fs from 'fs';
import * as path from 'path';

export class JSONStorage {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.ensureFile();
    }

    private ensureFile() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}));
        }
    }

    private readData(): any {
        this.ensureFile();
        const data = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(data);
    }

    private writeData(data: any) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    public set(key: string, value: any): void {
        const data = this.readData();
        data[key] = value;
        this.writeData(data);
    }

    public get<T>(key: string): T | null {
        const data = this.readData();
        return data[key] || null;
    }

    public delete(key: string): void {
        const data = this.readData();
        delete data[key];
        this.writeData(data);
    }

    public clear(): void {
        this.writeData({});
    }

    public has(key: string): boolean {
        const data = this.readData();
        return key in data;
    }

    public all(): any {
        return this.readData();
    }
}
