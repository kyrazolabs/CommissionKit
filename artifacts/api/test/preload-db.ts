// Preload script — starts in-memory MongoDB before any test module imports.
// This prevents auth.ts from failing its top-level await connectDB() call.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, name: "rs0" },
});
const uri = replSet.getUri();
process.env.MONGO_URL = uri;
await mongoose.connect(uri);

// Store reference for cleanup — test files can access via global
(globalThis as any).__MONGO_SERVER__ = replSet;

console.log(`[preload-db] MongoDB memory server started at ${uri}`);

// Eagerly import auth module to ensure it initializes before tests run.
// The top-level await connectDB() must succeed; otherwise all tests fail.
try {
  const auth = await import("../src/lib/auth");
  if (typeof auth.findUserById !== "function") {
    throw new Error("auth.findUserById is not a function — module may have thrown during init");
  }
  console.log("[preload-db] auth module loaded successfully");
} catch (err) {
  console.error("[preload-db] Failed to load auth module:", err);
  throw err;
}
