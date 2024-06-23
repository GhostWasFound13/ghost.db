import fs from 'fs';
import zlib from 'zlib';
import crypto from 'crypto';

interface StoredData {
    value: string;
    type: string;
    ttl: number | null;
}

export class JSONStorage {
    private filePath: string;
    private data: Record<string, StoredData>;
    private backupPath: string;
    private encryptionKey: string;

    constructor(filePath: string, backupPath: string, encryptionKey: string) {
        this.filePath = filePath;
        this.backupPath = backupPath;
        this.encryptionKey = encryptionKey;
        this.data = this.loadData();
    }

    private loadData(): Record<string, StoredData> {
        if (fs.existsSync(this.filePath)) {
            const encryptedData = fs.readFileSync(this.filePath, 'utf-8');
            const compressedData = this.decryptData(encryptedData);
            const rawData = this.decompressData(compressedData);
            return JSON.parse(rawData);
        }
        return {};
    }

    private saveData(): void {
        const rawData = JSON.stringify(this.data, null, 2);
        const compressedData = this.compressData(rawData);
        const encryptedData = this.encryptData(compressedData);
        fs.writeFileSync(this.filePath, encryptedData, 'utf-8');
    }

    private backupData(): void {
        const rawData = JSON.stringify(this.data, null, 2);
        const compressedData = this.compressData(rawData);
        const encryptedData = this.encryptData(compressedData);
        fs.writeFileSync(this.backupPath, encryptedData, 'utf-8');
    }

    private restoreData(): void {
        if (fs.existsSync(this.backupPath)) {
            const encryptedData = fs.readFileSync(this.backupPath, 'utf-8');
            const compressedData = this.decryptData(encryptedData);
            const rawData = this.decompressData(compressedData);
            this.data = JSON.parse(rawData);
            this.saveData();
        }
    }

    private compressData(data: string): string {
        return zlib.gzipSync(data).toString('base64');
    }

    private decompressData(data: string): string {
        return zlib.gunzipSync(Buffer.from(data, 'base64')).toString();
    }

    private encryptData(data: string): string {
        const cipher = crypto.createCipher('aes-256-ctr', this.encryptionKey);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    private decryptData(data: string): string {
        const decipher = crypto.createDecipher('aes-256-ctr', this.encryptionKey);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    public set(key: string, value: StoredData): void {
        this.data[key] = value;
        this.saveData();
        this.backupData();
    }

    public get<T>(key: string): StoredData | null {
        return this.data[key] || null;
    }

    public delete(key: string): void {
        delete this.data[key];
        this.saveData();
        this.backupData();
    }

    public clear(): void {
        this.data = {};
        this.saveData();
        this.backupData();
    }

    public has(key: string): boolean {
        return key in this.data;
    }

    public all(): Record<string, StoredData> {
        return this.data;
    }

    public restore(): void {
        this.restoreData();
    }
}
