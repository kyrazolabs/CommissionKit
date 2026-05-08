import { Router } from "express";
import { 
  CommissionRun, 
  CommissionResult, 
  Deal, 
  Rep, 
  Plan, 
  PlanTier,
  WorkspaceMember,
} from "@workspace/db";
import { Types } from "mongoose";
import { CreateRunBody, GetRunParams } from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { commissionRunTemplate } from "@workspace/email-templates";
import { createNotification } from "../lib/notify";

const router = Router();

function calculateCommission(
  amount: number,
  planType: string,
  flatRate: number | null,
  acceleratorThreshold: number | null,
  acceleratorRate: number | null,
  tiers: { fromAmount: number; toAmount: number | null; rate: number }[]
): { rate: number; commission: number; note: string } {
  if (planType === "flat" && flatRate !== null) {
    const commission = amount * flatRate;
    return { rate: flatRate, commission, note: `Flat rate ${(flatRate * 100).toFixed(2)}% on $${amount.toFixed(2)}` };
  }

  if (planType === "accelerator" && flatRate !== null) {
    if (acceleratorThreshold !== null && acceleratorRate !== null && amount > acceleratorThreshold) {
      const baseCommission = acceleratorThreshold * flatRate;
      const accelCommission = (amount - acceleratorThreshold) * acceleratorRate;
      const total = baseCommission + accelCommission;
      const effectiveRate = total / amount;
      return {
        rate: effectiveRate,
        commission: total,
        note: `Base ${(flatRate * 100).toFixed(2)}% up to $${acceleratorThreshold}, then ${(acceleratorRate * 100).toFixed(2)}% above`,
      };
    }
    const commission = amount * flatRate;
    return { rate: flatRate, commission, note: `Base rate ${(flatRate * 100).toFixed(2)}% (below threshold of $${acceleratorThreshold})` };
  }

  if (planType === "tiered" && tiers.length > 0) {
    let remaining = amount;
    let totalCommission = 0;
    const notes: string[] = [];
    let lastRate = 0;

    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierTop = tier.toAmount !== null ? tier.toAmount : Infinity;
      const tierBottom = tier.fromAmount;
      const applicable = Math.min(remaining, tierTop - tierBottom);
      if (applicable <= 0) continue;
      const commission = applicable * tier.rate;
      totalCommission += commission;
      notes.push(`${(tier.rate * 100).toFixed(2)}% on $${applicable.toFixed(2)}`);
      lastRate = tier.rate;
      remaining -= applicable;
    }

    const effectiveRate = amount > 0 ? totalCommission / amount : lastRate;
    return { rate: effectiveRate, commission: totalCommission, note: `Tiered: ${notes.join(", ")}` };
  }

  return { rate: 0, commission: 0, note: "No plan or rate configured" };
}

async function formatRun(run: any) {
  const results = await CommissionResult.find({ runId: run._id })
    .populate("repId")
    .populate("dealId");

  return {
    id: run._id,
    period: run.period,
    totalCommission: Number(run.totalCommission),
    totalDeals: run.totalDeals,
    repsCount: run.repsCount,
    createdAt: run.createdAt.toISOString(),
    results: results.map((r) => {
      const rep = r.repId as any;
      const deal = r.dealId as any;
      return {
        id: r._id,
        repId: rep?._id,
        repName: rep?.name ?? "Unknown",
        dealId: deal?._id,
        dealName: deal?.name ?? "Unknown",
        dealAmount: deal?.amount ? Number(deal.amount) : 0,
        rateApplied: Number(r.rateApplied),
        commissionAmount: Number(r.commissionAmount),
        calculationNote: r.calculationNote,
      };
    }),
  };
}

router.get("/runs", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const runs = await CommissionRun.find({ workspaceId: new Types.ObjectId(workspaceId) })
    .sort({ createdAt: -1 });
  res.json(
    runs.map((r) => ({
      id: r._id,
      period: r.period,
      totalCommission: Number(r.totalCommission),
      totalDeals: r.totalDeals,
      repsCount: r.repsCount,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/runs", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateRunBody.parse(req.body);
  const { period } = body;

  const deals = await Deal.find({ 
    workspaceId: new Types.ObjectId(workspaceId), 
    period, 
    stage: "closed_won" 
  });

  const reps = await Rep.find({ workspaceId: new Types.ObjectId(workspaceId) });
  const plans = await Plan.find({ workspaceId: new Types.ObjectId(workspaceId) });
  const tiers = await PlanTier.find({}).sort({ fromAmount: 1 });

  const planMap = new Map(plans.map((p) => [p._id.toString(), p]));
  const tierMap = new Map<string, { fromAmount: number; toAmount: number | null; rate: number }[]>();
  for (const t of tiers) {
    const planIdStr = t.planId.toString();
    if (!tierMap.has(planIdStr)) tierMap.set(planIdStr, []);
    tierMap.get(planIdStr)!.push({ fromAmount: Number(t.fromAmount), toAmount: t.toAmount !== null ? Number(t.toAmount) : null, rate: Number(t.rate) });
  }

  const repMap = new Map(reps.map((r) => [r._id.toString(), r]));

  const run = await CommissionRun.create({ 
    workspaceId: new Types.ObjectId(workspaceId), 
    period, 
    totalCommission: 0, 
    totalDeals: 0, 
    repsCount: 0 
  });

  let totalCommission = 0;
  const resultRows = [];
  const involvedReps = new Set<string>();

  for (const deal of deals) {
    const rep = repMap.get(deal.repId.toString());
    if (!rep || !rep.planId) continue;

    const plan = planMap.get(rep.planId.toString());
    if (!plan) continue;

    const { rate, commission, note } = calculateCommission(
      Number(deal.amount),
      plan.type,
      plan.flatRate !== null ? Number(plan.flatRate) : null,
      plan.acceleratorThreshold !== null ? Number(plan.acceleratorThreshold) : null,
      plan.acceleratorRate !== null ? Number(plan.acceleratorRate) : null,
      tierMap.get(plan._id.toString()) ?? []
    );

    totalCommission += commission;
    involvedReps.add(rep._id.toString());
    resultRows.push({
      runId: run._id,
      repId: rep._id,
      dealId: deal._id,
      rateApplied: rate,
      commissionAmount: commission,
      calculationNote: note,
    });
  }

  if (resultRows.length > 0) {
    await CommissionResult.insertMany(resultRows);
  }

  run.totalCommission = totalCommission;
  run.totalDeals = resultRows.length;
  run.repsCount = involvedReps.size;
  await run.save();

  const result = await formatRun(run);

  // ─── Notify workspace admins/owners ───────────────────────────────────────
  // Fire-and-forget — don't block the HTTP response
  setImmediate(async () => {
    try {
      const adminMembers = await WorkspaceMember.find({
        workspaceId: new Types.ObjectId(workspaceId),
        role: { $in: ["owner", "admin"] },
        userId: { $ne: null },
      });

      // Get top earner for the summary
      let topEarner: { name: string; amount: string } | undefined;
      if (result.results.length > 0) {
        const top = result.results.reduce((a, b) =>
          a.commissionAmount > b.commissionAmount ? a : b,
        );
        topEarner = {
          name: top.repName,
          amount: `$${top.commissionAmount.toFixed(2)}`,
        };
      }

      const APP_URL = process.env.APP_URL || "http://localhost:3000";
      const runUrl = `${APP_URL}/runs/${run._id}`;
      const totalPaid = `$${totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      const [py, pm] = period.split("-");
      const periodLabel = new Date(Number(py), Number(pm) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

      for (const member of adminMembers) {
        // Send email notification
        await sendMediumPriorityEmail({
          to: member.email,
          subject: `Commission run complete — ${period}`,
          html: commissionRunTemplate({
            recipientName: member.email.split("@")[0],
            workspaceName: workspaceId,
            period,
            totalPaid,
            totalDeals: resultRows.length,
            totalReps: involvedReps.size,
            topEarner,
            runUrl,
          }),
          meta: { runId: String(run._id), workspaceId, period },
        });

        // Create in-app notification (respects member's prefs)
        if (member.userId) {
          await createNotification({
            workspaceId,
            userId: member.userId,
            type: "commission_run_completed",
            title: "Commission run completed",
            message: `${periodLabel} run finished — ${totalPaid} across ${involvedReps.size} reps.`,
            href: runUrl,
            meta: { runId: String(run._id), period },
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error("[Runs] Failed to enqueue completion emails:", err);
    }
  });

  res.status(201).json(result);
});

router.get("/runs/:id", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = GetRunParams.parse(req.params);
  const run = await CommissionRun.findOne({ 
    _id: new Types.ObjectId(id), 
    workspaceId: new Types.ObjectId(workspaceId) 
  });
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  const result = await formatRun(run);
  res.json(result);
});

export default router;
