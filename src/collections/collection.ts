import { transformValue, determineType } from '../utils/transform';
import { parseValue } from '../utils/parse';
import { isExpired } from '../utils/ttl';
import { validateKey, validateValue } from '../utils/validate';
import { readJSONFile, writeJSONFile } from '../utils/file-operations';
import { encrypt, decrypt } from '../utils/encryption';
import { JSONStorage } from '../storage/json-storage';
import { transformValue, determineType } from '../utils/transform';
import { parseValue } from '../utils/parse';
import { isExpired } from '../utils/ttl';
import { validateKey, validateValue } from '../utils/validate';
import { DataModel } from '../models/data-model';
import { EventEmitter } from 'events';
import { SQLiteStorage } from '../storage/sqlite-storage';
import { JSONStorage } from '../storage/json-storage';
import { MySQLStorage } from '../storage/mysql-storage';
import { YMLStorage } from '../storage/yml-storage';
import { MongoDBStorage } from '../storage/mongodb-storage';
import { PostgreSQLStorage } from '../storage/postgresql-storage';
import { CacheStorage } from '../storage/cache-storage';
import { CassandraDriver } from '../storage/cassandra-driver';

type StorageType = 'sqlite' | 'json' | 'mysql' | 'yml' | 'mongodb' | 'postgresql' | 'cache' | 'cassandra';

export class Collection extends EventEmitter {
    private sqliteStorage?: SQLiteStorage;
    private jsonStorage?: JSONStorage;
    private mysqlStorage?: MySQLStorage;
    private ymlStorage?: YMLStorage;
    private mongodbStorage?: MongoDBStorage;
    private postgresqlStorage?: PostgreSQLStorage;
    private cacheStorage?: CacheStorage;
    private cassandraDriver?: CassandraDriver;
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
        } else if (storageType === 'postgresql') {
            this.postgresqlStorage = new PostgreSQLStorage(config.postgresConfig, table);
        } else if (storageType === 'cache') {
            this.cacheStorage = new CacheStorage();
        } else if (storageType === 'cassandra') {
            this.cassandraDriver = new CassandraDriver(config.contactPoints, config.keyspace, config.username, config.password, table);
        }
    }

    public async connect(): Promise<void> {
        if (this.cassandraDriver) {
            await this.cassandraDriver.connect();
        }
    }

    public async disconnect(): Promise<void> {
        if (this.cassandraDriver) {
            await this.cassandraDriver.disconnect();
        }
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        validateKey(key);
        validateValue(value);
        const dataModel: DataModel = {
            key,
            value: transformValue(value),
            type: determineType(value),
            ttl: ttl || null,
            storageType: this.storageType
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
        } else if (this.postgresqlStorage) {
            await this.postgresqlStorage.set(key, dataModel);
        } else if (this.cacheStorage) {
            this.cacheStorage.set(key, dataModel);
        } else if (this.cassandraDriver) {
            await this.cassandraDriver.set(key, dataModel);
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        if (this.sqliteStorage) {
            return this.sqliteStorage.get<T>(key);
        } else if (this.jsonStorage) {
            return this.jsonStorage.get<T>(key);
        } else if (this.mysqlStorage) {
            return this.mysqlStorage.get<T>(key);
        } else if (this.ymlStorage) {
            return this.ymlStorage.get<T>(key);
        } else if (this.mongodbStorage) {
            return this.mongodbStorage.get<T>(key);
        } else if (this.postgresqlStorage) {
            return this.postgresqlStorage.get<T>(key);
        } else if (this.cacheStorage) {
            return this.cacheStorage.get<T>(key);
        } else if (this.cassandraDriver) {
            return this.cassandraDriver.get<T>(key);
        }
        return null;
    }

    public async delete(key: string): Promise<void> {
        if (this.sqliteStorage) {
            await this.sqliteStorage.delete(key);
        } else if (this.jsonStorage) {
            await this.jsonStorage.delete(key);
        } else if (this.mysqlStorage) {
            await this.mysqlStorage.delete(key);
        } else if (this.ymlStorage) {
            await this.ymlStorage.delete(key);
        } else if (this.mongodbStorage) {
            await this.mongodbStorage.delete(key);
        } else if (this.postgresqlStorage) {
            await this.postgresqlStorage.delete(key);
        } else if (this.cacheStorage) {
            this.cacheStorage.delete(key);
        } else if (this.cassandraDriver) {
            await this.cassandraDriver.delete(key);
        }
    }

    public async clear(): Promise<void> {
        if (this.sqliteStorage) {
            await this.sqliteStorage.clear();
        } else if (this.jsonStorage) {
            await this.jsonStorage.clear();
        } else if (this.mysqlStorage) {
            await this.mysqlStorage.clear();
        } else if (this.ymlStorage) {
            await this.ymlStorage.clear();
        } else if (this.mongodbStorage) {
            await this.mongodbStorage.clear();
        } else if (this.postgresqlStorage) {
            await this.postgresqlStorage.clear();
        } else if (this.cacheStorage) {
            this.cacheStorage.clear();
        } else if (this.cassandraDriver) {
            await this.cassandraDriver.clear();
        }
    }

    public async has(key: string): Promise<boolean> {
        if (this.sqliteStorage) {
            return this.sqliteStorage.has(key);
        } else if (this.jsonStorage) {
            return this.jsonStorage.has(key);
        } else if (this.mysqlStorage) {
            return this.mysqlStorage.has(key);
        } else if (this.ymlStorage) {
            return this.ymlStorage.has(key);
        } else if (this.mongodbStorage) {
            return this.mongodbStorage.has(key);
        } else if (this.postgresqlStorage) {
            return this.postgresqlStorage.has(key);
        } else if (this.cacheStorage) {
            return this.cacheStorage.has(key);
        } else if (this.cassandraDriver) {
            return this.cassandraDriver.has(key);
        }
        return false;
    }

    public async all(): Promise<DataModel[]> {
        if (this.sqliteStorage) {
            return this.sqliteStorage.all();
        } else if (this.jsonStorage) {
            return this.jsonStorage.all();
        } else if (this.mysqlStorage) {
            return this.mysqlStorage.all();
        } else if (this.ymlStorage) {
            return this.ymlStorage.all();
        } else if (this.mongodbStorage) {
            return this.mongodbStorage.all();
        } else if (this.postgresqlStorage) {
            return this.postgresqlStorage.all();
        } else if (this.cacheStorage) {
            return this.cacheStorage.all();
        } else if (this.cassandraDriver) {
            return this.cassandraDriver.all();
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
