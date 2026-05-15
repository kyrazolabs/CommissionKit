import { auth } from "./src/lib/auth.js";
import mongoose from "mongoose";
import "dotenv/config";

async function run() {
  await mongoose.connect(process.env.MONGO_URL!);
  const db = mongoose.connection.db;
  
  const portalEmail = "testcode@portal.commissionkit.io";
  const tempPassword = "testpassword123";
  const repId = "6a05f0ddef8a9cd236453242"; // some rep ID

  try {
    console.log("Looking for existing user by repId or email...");
    const existingUser = await db?.collection("user").findOne({
      $or: [
        { repId: repId },
        { email: portalEmail }
      ]
    });

    if (existingUser) {
      console.log("Found existing user! Deleting old user, accounts, and sessions...");
      const userId = existingUser._id.toString(); // Better auth stores ID as string
      // Wait, let's check what ID format better auth uses in mongo
      const actualId = existingUser.id || existingUser._id.toString();

      await db?.collection("user").deleteOne({ _id: existingUser._id });
      await db?.collection("account").deleteMany({ userId: actualId });
      await db?.collection("session").deleteMany({ userId: actualId });
      console.log("Deleted.");
    }

    console.log("Creating new user via signUpEmail...");
    const res = await auth.api.signUpEmail({
      body: {
        email: portalEmail,
        password: tempPassword,
        name: "Test Rep",
        mustChangePassword: true,
        repId: repId,
      }
    });
    console.log("Success! New user:", res.user.email);
  } catch (err: any) {
    console.error("Failed:", err.message);
  }

  process.exit(0);
}

run();
