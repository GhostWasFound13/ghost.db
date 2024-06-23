import fs from 'fs';

interface StoredData {
    value: string;
    type: string;
    ttl: number | null;
}

export class JSONStorage {
    private filePath: string;
    private data: Record<string, StoredData>;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.data = this.loadData();
    }

    private loadData(): Record<string, StoredData> {
        if (fs.existsSync(this.filePath)) {
            const rawData = fs.readFileSync(this.filePath, 'utf-8');
            return JSON.parse(rawData);
        }
        return {};
    }

    private saveData(): void {
        const rawData = JSON.stringify(this.data, null, 2);
        fs.writeFileSync(this.filePath, rawData, 'utf-8');
    }

    public set(key: string, value: StoredData): void {
        this.data[key] = value;
        this.saveData();
    }

    public get<T>(key: string): StoredData | null {
        return this.data[key] || null;
    }

    public delete(key: string): void {
        delete this.data[key];
        this.saveData();
    }

    public clear(): void {
        this.data = {};
        this.saveData();
    }

    public has(key: string): boolean {
        return key in this.data;
    }

    public all(): Record<string, StoredData> {
        return this.data;
    }
}
