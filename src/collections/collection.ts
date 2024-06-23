import { transformValue, determineType } from '../utils/transform';
import { parseValue } from '../utils/parse';
import { isExpired } from '../utils/ttl';
import { validateKey, validateValue } from '../utils/validate';
import { readJSONFile, writeJSONFile } from '../utils/file-operations';
import { encrypt, decrypt } from '../utils/encryption';
import { JSONStorage } from '../storage/json-storage';
import { MySQLStorage } from '../storage/mysql-storage';
import { SQLiteStorage } from '../storage/sqlite-storage';
import { YMLStorage } from '../storage/yml-storage';
import { MongoDBStorage } from '../storage/mongodb-storage';
import { DataModel } from '../models/data-model';
import { EventEmitter } from 'events';

type StorageType = 'sqlite' | 'json' | 'mysql' | 'yml' | 'mongodb';

export class Collection extends EventEmitter {
    private sqliteStorage?: SQLiteStorage;
    private jsonStorage?: JSONStorage;
    private mysqlStorage?: MySQLStorage;
    private ymlStorage?: YMLStorage;
    private mongodbStorage?: MongoDBStorage;
    private storageType: StorageType;
    private encryptionKey?: string;

    constructor(storageType: StorageType, table: string, config: any) {
        super();
        this.storageType = storageType;
        this.encryptionKey = config.encryptionKey;
        if (storageType === 'sqlite') {
            this.sqliteStorage = new SQLiteStorage(config.dbPath, table);
        } else if (storageType === 'json') {
            this.jsonStorage = new JSONStorage(config.jsonFilePath, config.backupPath, config.encryptionKey);
        } else if (storageType === 'mysql') {
            this.mysqlStorage = new MySQLStorage(config.mysqlConfig, table);
        } else if (storageType === 'yml') {
            this.ymlStorage = new YMLStorage(config.ymlFilePath);
        } else if (storageType === 'mongodb') {
            this.mongodbStorage = new MongoDBStorage(config.mongoUri, config.dbName, table);
        }
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!validateKey(key)) {
            throw new Error('Invalid key');
        }
        if (!validateValue(value)) {
            throw new Error('Invalid value');
        }
        const type = determineType(value);
        const transformedValue = transformValue(value);
        const storedValue = this.encryptionKey ? encrypt(transformedValue, this.encryptionKey) : transformedValue;
        const dataModel: DataModel = {
            key,
            value: storedValue,
            type,
            ttl: ttl ? Date.now() + ttl : null,
        };

        if (this.sqliteStorage) {
            await this.sqliteStorage.set(key, dataModel);
        } else if (this.jsonStorage) {
            await this.jsonStorage.set(key, dataModel);
        } else if (this.mysqlStorage) {
            await this.mysqlStorage.set(key, dataModel);
        } else if (this.ymlStorage) {
            await this.ymlStorage.set(key, dataModel);
        } else if (this.mongodbStorage) {
            await this.mongodbStorage.set(key, dataModel);
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        if (!validateKey(key)) {
            throw new Error('Invalid key');
        }

        let storedData: DataModel | null = null;
        if (this.sqliteStorage) {
            storedData = await this.sqliteStorage.get(key);
        } else if (this.jsonStorage) {
            storedData = await this.jsonStorage.get(key);
        } else if (this.mysqlStorage) {
            storedData = await this.mysqlStorage.get(key);
        } else if (this.ymlStorage) {
            storedData = await this.ymlStorage.get(key);
        } else if (this.mongodbStorage) {
            storedData = await this.mongodbStorage.get(key);
        }

        if (!storedData) {
            return null;
        }

        if (isExpired(storedData.ttl)) {
            await this.delete(key);
            return null;
        }

        const decryptedValue = this.encryptionKey ? decrypt(storedData.value, this.encryptionKey) : storedData.value;
        return parseValue(decryptedValue, storedData.type) as T;
    }

    public async delete(key: string): Promise<void> {
        if (this.storageType === 'sqlite') {
            this.sqliteStorage!.delete(key);
        } else if (this.storageType === 'json') {
            this.jsonStorage!.delete(key);
        } else if (this.storageType === 'mysql') {
            await this.mysqlStorage!.delete(key);
        }
        this.emit('delete', { key });
    }

    public async clear(): Promise<void> {
        if (this.storageType === 'sqlite') {
            this.sqliteStorage!.clear();
        } else if (this.storageType === 'json') {
            this.jsonStorage!.clear();
        } else if (this.storageType === 'mysql') {
            await this.mysqlStorage!.clear();
        }
        this.emit('clear');
    }

    public async has(key: string): Promise<boolean> {
        if (this.storageType === 'sqlite') {
            return this.sqliteStorage!.has(key);
        } else if (this.storageType === 'json') {
            return this.jsonStorage!.has(key);
        } else if (this.storageType === 'mysql') {
            return await this.mysqlStorage!.has(key);
        }
        return false;
    }

    public async all(): Promise<DataModel[]> {
        if (this.storageType === 'sqlite') {
            const rows = this.sqliteStorage!.all();
            return Object.entries(rows).map(([id, { value, type, ttl }]) => ({ id, value: parseValue(value), type, ttl }))
                                         .filter(row => !isExpired(row.ttl));
        } else if (this.storageType === 'json') {
            const rows = this.jsonStorage!.all();
            return Object.entries(rows).map(([id, { value, type, ttl }]) => ({ id, value: parseValue(value), type, ttl }))
                                         .filter(row => !isExpired(row.ttl));
        } else if (this.storageType === 'mysql') {
            const rows = await this.mysqlStorage!.all();
            return Object.entries(rows).map(([id, { value, type, ttl }]) => ({ id, value: parseValue(value), type, ttl }))
                                         .filter(row => !isExpired(row.ttl));
        }
        return [];
    }

    public async push(key: string, value: any): Promise<void> {
        const data = await this.get<any[]>(key) || [];
        if (!Array.isArray(data)) {
            throw new Error(`Data at key ${key} is not an array`);
        }
        data.push(value);
        await this.set(key, data);
    }

    public async fetch(filter: (data: DataModel) => boolean): Promise<DataModel[]> {
        const allData = await this.all();
        return allData.filter(filter);
    }

    public async update(key: string, updates: Record<string, any>): Promise<void> {
        const data = await this.get<any>(key);
        if (!data || typeof data !== 'object') {
            throw new Error(`Data at key ${key} is not an object`);
        }
        const updatedData = { ...data, ...updates };
        await this.set(key, updatedData);
    }

    public async increment(key: string, amount: number = 1): Promise<void> {
        let data = await this.get<number>(key);
        if (typeof data !== 'number') {
            data = 0;
        }
        data += amount;
        await this.set(key, data);
    }

    public async decrement(key: string, amount: number = 1): Promise<void> {
        let data = await this.get<number>(key);
        if (typeof data !== 'number') {
            data = 0;
        }
        data -= amount;
        await this.set(key, data);
    }

    public async batchSet(entries: Record<string, any>): Promise<void> {
        for (const key in entries) {
            await this.set(key, entries[key]);
        }
    }

    public async batchDelete(keys: string[]): Promise<void> {
        for (const key of keys) {
            await this.delete(key);
        }
    }
  public async shift(key: string): Promise<any> {
        const data = await this.get<any[]>(key) || [];
        if (!Array.isArray(data)) {
            throw new Error(`Data at key ${key} is not an array`);
        }
        const shiftedValue = data.shift();
        await this.set(key, data);
        return shiftedValue;
    }

    public async unshift(key: string, value: any): Promise<void> {
        const data = await this.get<any[]>(key) || [];
        if (!Array.isArray(data)) {
            throw new Error(`Data at key ${key} is not an array`);
        }
        data.unshift(value);
        await this.set(key, data);
    }
    public async restore(): Promise<void> {
        if (this.storageType === 'json') {
            this.jsonStorage!.restore();
        }
    }
}
