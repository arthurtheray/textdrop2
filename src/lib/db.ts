import { MongoClient, Db } from 'mongodb';

function requiredEnv(key: 'MONGODB_URI' | 'MONGODB_DB'): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable`);
  }
  return value;
}

const uri = requiredEnv('MONGODB_URI');
const dbName = requiredEnv('MONGODB_DB');

type MongoConnection = {
  client: MongoClient;
  db: Db;
};

declare global {
  var _mongoConnection: MongoConnection | undefined;
}

export async function getDb(): Promise<Db> {
  if (!global._mongoConnection) {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    global._mongoConnection = { client, db };
  }

  return global._mongoConnection.db;
}

export async function closeDb(): Promise<void> {
  if (global._mongoConnection) {
    await global._mongoConnection.client.close();
    global._mongoConnection = undefined;
  }
}
