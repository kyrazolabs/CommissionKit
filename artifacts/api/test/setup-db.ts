import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer | null = (globalThis as any).__MONGO_SERVER__ || null;
let initPromise: Promise<MongoMemoryServer> | null = null;
let refCount = 0;

export async function setupTestDB(): Promise<string> {
  refCount++;

  if (mongoServer) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoServer.getUri());
    }
    return mongoServer.getUri();
  }

  if (initPromise) {
    await initPromise;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoServer!.getUri());
    }
    return mongoServer!.getUri();
  }

  initPromise = (async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URL = uri;
    await mongoose.connect(uri);
    return mongoServer;
  })();

  await initPromise;
  return mongoServer!.getUri();
}

export async function teardownTestDB(): Promise<void> {
  refCount--;
  if (refCount > 0) return;

  await mongoose.disconnect();
  // Don't stop the preload-created server — process exit handles cleanup
  if (mongoServer && !(globalThis as any).__MONGO_SERVER__) {
    await mongoServer.stop();
    mongoServer = null;
  }
  initPromise = null;
}

export async function clearCollections(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.collection(c.name).deleteMany({});
  }
}
