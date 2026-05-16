import { auth } from "../src/lib/auth.js";
import mongoose from "mongoose";
import "dotenv/config";

async function run() {
  await mongoose.connect(process.env.MONGO_URL!);
  const db = mongoose.connection.db;

  const rep = await db
    ?.collection("reps")
    .findOne({ portalUsername: "abdullah" });
  if (!rep) {
    console.log("Rep not found");
    process.exit(1);
  }

  const portalEmail = `abdullah@portal.commissionkit.io`;
  const tempPassword = "testpassword123";

  try {
    console.log(`Attempting signUpEmail for ${portalEmail}...`);
    const res = await auth.api.signUpEmail({
      body: {
        email: portalEmail,
        password: tempPassword,
        name: rep.name,
        mustChangePassword: true,
        repId: rep._id.toString(),
      },
    });
    console.log("Success! New user:", res.user.email);
  } catch (err: any) {
    console.error("signUpEmail Failed:", err.message);
    if (err.body) console.error("Error body:", err.body);
  }

  process.exit(0);
}

run();
