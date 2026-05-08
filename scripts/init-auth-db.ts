import mongoose from "mongoose";
import "dotenv/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), "artifacts/api/.env") });

const MONGO_URL = process.env.MONGO_URL!;

async function main() {
  await mongoose.connect(MONGO_URL);
  const db = mongoose.connection.db;
  
  const collections = ["user", "session", "account", "verification", "organization", "member", "invitation"];
  
  for (const name of collections) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      console.log(`Creating collection: ${name}`);
      await db.createCollection(name);
    } else {
      console.log(`Collection already exists: ${name}`);
    }
  }
  
  process.exit(0);
}

main();
