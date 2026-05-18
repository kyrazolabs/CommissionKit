import "dotenv/config";
import { connectDB } from "@workspace/db";

async function run() {
  const conn = await connectDB() as any;
  const db = conn?.connection?.db ?? conn?.db;
  
  if (!db) {
    console.error("No db");
    process.exit(1);
  }
  
  const result = await db.collection("user").updateMany(
    {},
    { $set: { image: "" } }
  );
  
  console.log("Cleared images for users:", result.modifiedCount);
  process.exit(0);
}

run().catch(console.error);
