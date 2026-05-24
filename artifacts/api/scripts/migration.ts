import mongoose from "mongoose";
import "dotenv/config";

const OLD_MONGO_URL = process.env.MONGO_URL;
const NEW_MONGO_URL = process.env.NEW_MONGO_URL;

if (!OLD_MONGO_URL) {
  console.error("OLD_MONGO_URL is not set. Add it to artifacts/api/.env");
  process.exit(1);
}

if (!NEW_MONGO_URL) {
  console.error("MONGO_URL is not set.");
  process.exit(1);
}

async function getCollections(db: import("mongodb").Db) {
  const collections = await db.listCollections().toArray();
  return collections
    .map((c) => c.name)
    .filter((name) => !name.startsWith("system."));
}

async function migrate() {
  console.log("Connecting to old database...");
  const oldConn = await mongoose.createConnection(OLD_MONGO_URL).asPromise();
  const oldDb = oldConn.db!;

  console.log("Connecting to new database...");
  const newConn = await mongoose.createConnection(NEW_MONGO_URL).asPromise();
  const newDb = newConn.db!;

  const collectionNames = await getCollections(oldDb);
  console.log(`Found ${collectionNames.length} collections to migrate.\n`);

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const name of collectionNames) {
    const oldColl = oldDb.collection(name);
    const newColl = newDb.collection(name);

    const totalDocs = await oldColl.countDocuments();
    if (totalDocs === 0) {
      console.log(`[${name}] 0 documents, skipping.`);
      continue;
    }

    const existingIds = await newColl.distinct("_id");
    const existingSet = new Set(existingIds.map((id) => id.toString()));

    const batchSize = 1000;
    let batchInserted = 0;
    let batchSkipped = 0;
    let cursor = oldColl.find({}).batchSize(batchSize);

    let buffer: import("bson").Document[] = [];

    for await (const doc of cursor) {
      if (existingSet.has(doc._id.toString())) {
        batchSkipped++;
        continue;
      }
      buffer.push(doc);

      if (buffer.length >= batchSize) {
        const result = await newColl.bulkWrite(
          buffer.map((d) => ({ insertOne: { document: d } })),
          { ordered: false }
        );
        batchInserted += result.insertedCount;
        buffer = [];
      }
    }

    if (buffer.length > 0) {
      const result = await newColl.bulkWrite(
        buffer.map((d) => ({ insertOne: { document: d } })),
        { ordered: false }
      );
      batchInserted += result.insertedCount;
    }

    console.log(
      `[${name}] total: ${totalDocs}, inserted: ${batchInserted}, skipped (already existed): ${batchSkipped}`
    );
    totalInserted += batchInserted;
    totalSkipped += batchSkipped;
  }

  console.log("\n========================================");
  console.log("Migration complete!");
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total skipped:  ${totalSkipped}`);
  console.log("========================================");

  await oldConn.close();
  await newConn.close();
  process.exit(0);
}

migrate();
