import mongoose from "mongoose";
import { Deal } from "../lib/db/src/schema/deals";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "artifacts/api/.env") });

async function checkDeals() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error("MONGO_URL not found in .env");
  
  await mongoose.connect(uri);
  const deals = await Deal.find({}).limit(5);
  console.log("Sample Deals:", JSON.stringify(deals.map(d => ({
    name: d.name,
    period: d.period,
    stage: d.stage,
    workspaceId: d.workspaceId
  })), null, 2));
  
  const count = await Deal.countDocuments({});
  console.log("Total Deals:", count);
  
  const distinctPeriods = await Deal.distinct("period");
  console.log("Distinct Periods:", distinctPeriods);
  
  const distinctStages = await Deal.distinct("stage");
  console.log("Distinct Stages:", distinctStages);

  await mongoose.disconnect();
}

checkDeals().catch(console.error);
