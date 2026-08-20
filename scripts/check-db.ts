import mongoose from "mongoose";
import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), "artifacts/api/.env") });

const MONGO_URL = process.env.MONGO_URL!;

async function main() {
  await mongoose.connect(MONGO_URL);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(
    "Collections:",
    collections.map((c) => c.name),
  );
  process.exit(0);
}

main();
