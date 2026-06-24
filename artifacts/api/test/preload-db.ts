// Preload script — starts in-memory MongoDB before any test module imports.
// This prevents auth.ts from failing its top-level await connectDB() call.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongoServer = await MongoMemoryServer.create();
const uri = mongoServer.getUri();
process.env.MONGO_URL = uri;
await mongoose.connect(uri);

// Store reference for cleanup — test files can access via global
(globalThis as any).__MONGO_SERVER__ = mongoServer;

console.log(`[preload-db] MongoDB memory server started at ${uri}`);
