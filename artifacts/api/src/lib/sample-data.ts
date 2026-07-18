import mongoose, { Types } from "mongoose";
import { randomBytes } from "crypto";
import {
  Rep,
  Plan,
  PlanTier,
  Deal,
  CommissionRun,
  CommissionResult,
  Workspace,
} from "@workspace/db";
import { StandardEngine } from "../workers/engines/standard.engine";
import { logger } from "./logger";

export interface SampleRepInput {
  name: string;
  email: string;
  role: string;
  region: string;
}

export interface SampleDealInput {
  repName: string;
  name: string;
  amount: number;
  stage: string;
}

export const sampleReps: SampleRepInput[] = [
  { name: "Sarah Chen", email: "sarah.chen@sample.com", role: "Sales Rep", region: "West" },
  { name: "Marcus Johnson", email: "marcus.j@sample.com", role: "Sales Rep", region: "East" },
  { name: "Priya Patel", email: "priya.p@sample.com", role: "Sales Rep", region: "Central" },
  { name: "James O'Brien", email: "james.ob@sample.com", role: "Sales Rep", region: "West" },
  { name: "Aisha Mohammed", email: "aisha.m@sample.com", role: "Sales Rep", region: "East" },
  { name: "Carlos Rivera", email: "carlos.r@sample.com", role: "Sales Rep", region: "Central" },
];

export const samplePlan = {
  name: "Standard Commission Plan",
  type: "tiered",
};

export const sampleTiers = [
  { fromAmount: 0, toAmount: 10000, rate: 0.05 },
  { fromAmount: 10000, toAmount: 25000, rate: 0.08 },
  { fromAmount: 25000, toAmount: null as number | null, rate: 0.12 },
];

export const sampleDeals: SampleDealInput[] = [
  { repName: "Sarah Chen", name: "Acme Corp — Enterprise License", amount: 32000, stage: "closed_won" },
  { repName: "Sarah Chen", name: "DataSync — Platform Upgrade", amount: 18500, stage: "closed_won" },
  { repName: "Sarah Chen", name: "CloudNine — New Subscription", amount: 8200, stage: "closed_won" },
  { repName: "Marcus Johnson", name: "TechFlow — Annual Renewal", amount: 27000, stage: "closed_won" },
  { repName: "Marcus Johnson", name: "BrightEdge — Expansion Deal", amount: 14800, stage: "closed_won" },
  { repName: "Marcus Johnson", name: "NovaStar — Pilot Program", amount: 5500, stage: "pending" },
  { repName: "Priya Patel", name: "Meridian — Full Suite", amount: 41000, stage: "closed_won" },
  { repName: "Priya Patel", name: "Apex Solutions — Add-on", amount: 9750, stage: "closed_won" },
  { repName: "Priya Patel", name: "Vertex Inc — Starter Pack", amount: 3200, stage: "closed_won" },
  { repName: "James O'Brien", name: "Pinnacle — Enterprise Deal", amount: 38500, stage: "closed_won" },
  { repName: "James O'Brien", name: "Horizon Labs — Mid-Market", amount: 16200, stage: "closed_won" },
  { repName: "James O'Brien", name: "SwiftScale — Growth Plan", amount: 7800, stage: "pending" },
  { repName: "Aisha Mohammed", name: "Quantum Dynamics — Platform", amount: 29000, stage: "closed_won" },
  { repName: "Aisha Mohammed", name: "BlueWave — Renewal", amount: 12400, stage: "closed_won" },
  { repName: "Aisha Mohammed", name: "Ember Tech — Starter", amount: 4600, stage: "closed_won" },
  { repName: "Carlos Rivera", name: "Atlas Group — Enterprise", amount: 45000, stage: "closed_won" },
  { repName: "Carlos Rivera", name: "Compass AI — Expansion", amount: 22300, stage: "closed_won" },
  { repName: "Carlos Rivera", name: "Relay Systems — Pilot", amount: 6900, stage: "pending" },
];

function generatePortalAccessCode(): string {
  return randomBytes(12).toString("hex");
}

function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCloseDate(): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 60);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

export interface SeedResult {
  seeded: boolean;
  counts: {
    reps: number;
    plans: number;
    deals: number;
    runs: number;
    results: number;
  };
}

export interface ClearResult {
  cleared: boolean;
  removed: {
    reps: number;
    plans: number;
    deals: number;
    runs: number;
  };
}

class SampleDataError extends Error {
  status?: number;
  alreadySeeded?: boolean;

  constructor(message: string) {
    super(message);
    this.name = "SampleDataError";
  }
}

async function cleanupSampleData(workspaceId: string): Promise<void> {
  const wsObjectId = new Types.ObjectId(workspaceId);

  const plans = await Plan.find({ workspaceId: wsObjectId, isSampleData: true });
  const planIds = plans.map((p) => p._id);

  const runs = await CommissionRun.find({ workspaceId: wsObjectId, isSampleData: true });
  const runIds = runs.map((r) => r._id);

  if (runIds.length > 0) {
    await CommissionResult.deleteMany({ runId: { $in: runIds } });
    await CommissionRun.deleteMany({ _id: { $in: runIds } });
  }

  await Deal.deleteMany({ workspaceId: wsObjectId, isSampleData: true });

  if (planIds.length > 0) {
    await PlanTier.deleteMany({ planId: { $in: planIds } });
    await Plan.deleteMany({ _id: { $in: planIds } });
  }

  await Rep.deleteMany({ workspaceId: wsObjectId, isSampleData: true });

  await Workspace.findByIdAndUpdate(wsObjectId, { sampleDataLoaded: false });
}

async function detectReplicaSet(): Promise<boolean> {
  try {
    const conn = mongoose.connection;
    if (conn.readyState !== 1 || !conn.db) return false;
    const hello = await conn.db.admin().command({ hello: 1 });
    return typeof hello.setName === "string";
  } catch {
    return false;
  }
}

async function performSeeding(
  workspaceId: string,
  session?: mongoose.ClientSession,
): Promise<SeedResult> {
  const workspace = await Workspace.findById(workspaceId).session(session ?? null);
  if (!workspace) {
    throw new SampleDataError("Workspace not found");
  }

  if (workspace.sampleDataLoaded) {
    const err = new SampleDataError("Sample data already loaded");
    err.status = 409;
    err.alreadySeeded = true;
    throw err;
  }

  // Flag workspace early so any limit checks during seeding are bypassed.
  // When a session is provided, this update is part of the transaction and
  // will be rolled back on failure.
  workspace.sampleDataLoaded = true;
  await workspace.save({ session });

  const wsObjectId = workspace._id;
  const wsCurrency = workspace.currency || "USD";
  const period = getCurrentPeriod();

  const createdPlanIds: Types.ObjectId[] = [];
  const createdDealIds: Types.ObjectId[] = [];

  const [plan] = await Plan.create(
    [
      {
        workspaceId: wsObjectId,
        name: samplePlan.name,
        type: samplePlan.type,
        isSampleData: true,
      },
    ],
    { session },
  );
  createdPlanIds.push(plan._id);

  await PlanTier.insertMany(
    sampleTiers.map((t) => ({
      planId: plan._id,
      fromAmount: t.fromAmount,
      toAmount: t.toAmount,
      rate: t.rate,
    })),
    { session },
  );

  const repNameToId = new Map<string, Types.ObjectId>();
  for (const r of sampleReps) {
    const [rep] = await Rep.create(
      [
        {
          workspaceId: wsObjectId,
          name: r.name,
          email: r.email,
          role: r.role,
          planId: plan._id,
          portalAccessCode: generatePortalAccessCode(),
          isSampleData: true,
        },
      ],
      { session },
    );
    repNameToId.set(r.name, rep._id);
  }

  for (const d of sampleDeals) {
    const repId = repNameToId.get(d.repName);
    if (!repId) {
      throw new SampleDataError(`Unknown rep name in sample deals: ${d.repName}`);
    }

    const [deal] = await Deal.create(
      [
        {
          workspaceId: wsObjectId,
          repId,
          name: d.name,
          amount: d.amount,
          closeDate: getCloseDate(),
          period,
          stage: d.stage,
          currency: wsCurrency,
          paymentStatus: d.stage === "pending" ? "unpaid" : "paid",
          isSampleData: true,
        },
      ],
      { session },
    );
    createdDealIds.push(deal._id);
  }

  const [run] = await CommissionRun.create(
    [
      {
        workspaceId: wsObjectId,
        period,
        totalCommission: 0,
        totalDeals: 0,
        skippedDeals: 0,
        repsCount: 0,
        status: "pending",
        isSampleData: true,
      },
    ],
    { session },
  );

  const engine = new StandardEngine();
  const output = await engine.calculate({
    workspaceId: workspaceId.toString(),
    runId: run._id.toString(),
    period,
    paymentStatuses: ["paid"],
    wsCurrency,
    session,
  });

  if (output.results.length > 0) {
    await CommissionResult.insertMany(
      output.results.map((r) => ({
        runId: run._id,
        repId: new Types.ObjectId(r.repId),
        dealId: new Types.ObjectId(r.dealId),
        rateApplied: r.rateApplied,
        commissionAmount: r.commissionAmount,
        currency: r.currency,
        calculationNote: r.calculationNote,
        wsCurrency: r.wsCurrency,
        convertedDealAmount: r.convertedDealAmount,
        convertedCommission: r.convertedCommission,
        exchangeRateSnapshot: r.exchangeRateSnapshot,
        rateSnapshotDate: r.rateSnapshotDate,
        meta: r.meta,
        isSampleData: true,
      })),
      { session },
    );
  }

  const { totalCommission, totalItems, skippedItems, involvedReps } = output.summary;

  run.totalCommission = totalCommission;
  run.totalDeals = totalItems;
  run.skippedDeals = skippedItems;
  run.repsCount = involvedReps.size;
  run.status = "completed";
  await run.save({ session });

  return {
    seeded: true,
    counts: {
      reps: sampleReps.length,
      plans: createdPlanIds.length,
      deals: createdDealIds.length,
      runs: 1,
      results: output.results.length,
    },
  };
}

export async function seedSampleData(workspaceId: string): Promise<SeedResult> {
  const useTransaction = await detectReplicaSet();

  if (!useTransaction) {
    logger.warn(
      { workspaceId },
      "[SampleData] MongoDB is not a replica set; seeding will use best-effort cleanup instead of transactions",
    );
    try {
      return await performSeeding(workspaceId);
    } catch (err) {
      logger.error({ err, workspaceId }, "[SampleData] Seeding failed, rolling back");
      await cleanupSampleData(workspaceId).catch((cleanupErr) => {
        logger.error({ cleanupErr, workspaceId }, "[SampleData] Cleanup after failed seed also failed");
      });
      throw err;
    }
  }

  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const result = await performSeeding(workspaceId, session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    logger.error({ err, workspaceId }, "[SampleData] Seeding failed, transaction rolled back");
    throw err;
  } finally {
    session.endSession();
  }
}

export async function clearSampleData(workspaceId: string): Promise<ClearResult> {
  const wsObjectId = new Types.ObjectId(workspaceId);

  const removedReps = await Rep.countDocuments({ workspaceId: wsObjectId, isSampleData: true });
  const removedPlans = await Plan.countDocuments({ workspaceId: wsObjectId, isSampleData: true });
  const removedDeals = await Deal.countDocuments({ workspaceId: wsObjectId, isSampleData: true });
  const removedRuns = await CommissionRun.countDocuments({ workspaceId: wsObjectId, isSampleData: true });

  await cleanupSampleData(workspaceId);

  return {
    cleared: true,
    removed: {
      reps: removedReps,
      plans: removedPlans,
      deals: removedDeals,
      runs: removedRuns,
    },
  };
}
