import { connectDB } from "@workspace/db";
import mongoose from "mongoose";

async function run() {
  await connectDB();
  const db = mongoose.connection.db;

  const authUser = await db
    .collection("user")
    .findOne({ email: "test-signup-1778798366290@portal.commissionkit.io" });
  console.log("User id type:", typeof authUser._id, authUser._id, "id field:", authUser.id);

  const accounts = await db.collection("account").find({}).toArray();
  const account = accounts.find(
    (a) =>
      a.userId === authUser._id.toString() ||
      a.userId === authUser.id ||
      a.userId?.toString() === authUser._id.toString(),
  );
  console.log("Found account?", account ? "YES" : "NO");
  if (account) {
    console.log("Account userId:", account.userId, "type:", typeof account.userId);
  }

  process.exit(0);
}
run();
