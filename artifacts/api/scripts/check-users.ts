import mongoose from "mongoose";
import "dotenv/config";

async function run() {
  await mongoose.connect(process.env.MONGO_URL!);
  const db = mongoose.connection.db;

  const reps = await db?.collection("reps").find({ portalUsername: { $exists: true } }).toArray();
  console.log(`Found ${reps?.length} reps with portalUsername.`);
  
  if (reps && reps.length > 0) {
    for (const rep of reps) {
      console.log(`Rep: ${rep.name}, Username: ${rep.portalUsername}`);
      const authUser = await db?.collection("user").findOne({ repId: rep._id.toString() });
      if (authUser) {
        console.log(`  -> Better Auth User Email: ${authUser.email}`);
      } else {
        console.log(`  -> NO Better Auth User found for this repId!`);
      }
    }
  } else {
    console.log("No reps have a portalUsername set yet. Have you clicked 'Send Portal Link'?");
  }
  
  process.exit(0);
}

run();
