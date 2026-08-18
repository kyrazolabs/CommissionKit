import { connectDB } from "@workspace/db";
import { verifyPassword } from "better-auth/crypto";
import mongoose from "mongoose";

async function run() {
  await connectDB();
  const db = mongoose.connection.db;

  // Find the test user we just created
  const authUser = await db
    .collection("user")
    .findOne({ email: "test-signup-1778798366290@portal.commissionkit.io" });
  if (!authUser) throw new Error("No user");

  const accountRecord = await db.collection("account").findOne({ userId: authUser._id.toString() });
  console.log("Account Record:", accountRecord);

  const isValid = await verifyPassword({
    password: "testpassword123",
    hash: accountRecord.password,
  });
  console.log("Is Valid?", isValid);

  process.exit(0);
}
run();
