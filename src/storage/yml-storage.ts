import fs from 'fs';
import yaml from 'js-yaml';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

interface StoredData {
    value: string;
    type: string;
    ttl: number | null;
}

export class YMLStorage {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.init();
    }

    private async init(): Promise<void> {
        try {
            await readFile(this.filePath, 'utf8');
        } catch (error) {
            await writeFile(this.filePath, yaml.dump({}), 'utf8');
        }
    }

    private async readData(): Promise<Record<string, StoredData>> {
        const fileContent = await readFile(this.filePath, 'utf8');
        return yaml.load(fileContent) as Record<string, StoredData>;
    }

    private async writeData(data: Record<string, StoredData>): Promise<void> {
        const yamlContent = yaml.dump(data);
        await writeFile(this.filePath, yamlContent, 'utf8');
    }

    public async set(key: string, value: StoredData): Promise<void> {
        const data = await this.readData();
        data[key] = value;
        await this.writeData(data);
    }

    public async get(key: string): Promise<StoredData | null> {
        const data = await this.readData();
        return data[key] || null;
    }

    public async delete(key: string): Promise<void> {
        const data = await this.readData();
        delete data[key];
        await this.writeData(data);
    }

    public async clear(): Promise<void> {
        await this.writeData({});
    }

    public async has(key: string): Promise<boolean> {
        const data = await this.readData();
        return key in data;
    }

    public async all(): Promise<Record<string, StoredData>> {
        return await this.readData();
    }
}
