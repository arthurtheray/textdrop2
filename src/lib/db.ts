import { MongoClient, Db } from 'mongodb';

type MongoConnection = {
  client: MongoClient;
  db: Db;
};

declare global {
  var _mongoConnection: MongoConnection | undefined;
}

let cachedEnv: { uri: string; dbName: string } | undefined;

function ensureEnv() {
  if (!cachedEnv) {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri) {
      throw new Error('Missing MONGODB_URI environment variable');
    }
    if (!dbName) {
      throw new Error('Missing MONGODB_DB environment variable');
    }

    cachedEnv = { uri, dbName };
  }

  return cachedEnv;
}

export async function getDb(): Promise<Db> {
  if (!global._mongoConnection) {
    const { uri, dbName } = ensureEnv();
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
    cachedEnv = undefined;
  }
}
