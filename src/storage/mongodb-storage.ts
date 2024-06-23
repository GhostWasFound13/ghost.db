import { MongoClient, Db, Collection as MongoCollection } from 'mongodb';

interface StoredData {
    value: string;
    type: string;
    ttl: number | null;
}

export class MongoDBStorage {
    private client: MongoClient;
    private db: Db;
    private collection: MongoCollection;

    constructor(uri: string, dbName: string, collectionName: string) {
        this.client = new MongoClient(uri);
        this.db = this.client.db(dbName);
        this.collection = this.db.collection(collectionName);
    }

    public async connect(): Promise<void> {
        await this.client.connect();
    }

    public async disconnect(): Promise<void> {
        await this.client.close();
    }

    public async set(key: string, value: StoredData): Promise<void> {
        await this.collection.updateOne({ _id: key }, { $set: { ...value } }, { upsert: true });
    }

    public async get(key: string): Promise<StoredData | null> {
        const document = await this.collection.findOne({ _id: key });
        if (document) {
            return {
                value: document.value,
                type: document.type,
                ttl: document.ttl,
            };
        }
        return null;
    }

    public async delete(key: string): Promise<void> {
        await this.collection.deleteOne({ _id: key });
    }

    public async clear(): Promise<void> {
        await this.collection.deleteMany({});
    }

    public async has(key: string): Promise<boolean> {
        const document = await this.collection.findOne({ _id: key });
        return !!document;
    }

    public async all(): Promise<Record<string, StoredData>> {
        const documents = await this.collection.find({}).toArray();
        const result: Record<string, StoredData> = {};
        documents.forEach(doc => {
            result[doc._id] = {
                value: doc.value,
                type: doc.type,
                ttl: doc.ttl,
            };
        });
        return result;
    }
}
