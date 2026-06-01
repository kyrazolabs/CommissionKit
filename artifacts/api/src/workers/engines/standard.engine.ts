import type { CalcEngine, CalcEngineInput, CalcEngineOutput, CalcEngineResult, EngineFeature } from "./CalcEngine";
import { Types } from "mongoose";
import {
  CommissionRun,
  Deal,
  Rep,
  Plan,
  PlanTier,
  Workspace,
} from "@workspace/db";
import { convertCurrencyAt } from "../../lib/exchange";
import { logger } from "../../lib/logger";

function calculateCommission(
  amount: number,
  currency: string,
  planType: string,
  flatRate: number | null,
  acceleratorThreshold: number | null,
  acceleratorRate: number | null,
  tiers: { fromAmount: number; toAmount: number | null; rate: number }[],
): { rate: number; commission: number; note: string } {
  if (planType === "flat" && flatRate !== null) {
    const commission = amount * flatRate;
    return {
      rate: flatRate,
      commission,
      note: `Flat rate ${(flatRate * 100).toFixed(2)}% on ${currency} ${amount.toFixed(2)}`,
    };
  }

  if (planType === "accelerator" && flatRate !== null) {
    if (
      acceleratorThreshold !== null &&
      acceleratorRate !== null &&
      amount > acceleratorThreshold
    ) {
      const total = amount * acceleratorRate;
      return {
        rate: acceleratorRate,
        commission: total,
        note: `Accelerated: ${(acceleratorRate * 100).toFixed(2)}% on full ${currency} ${amount.toFixed(2)} (exceeded ${currency} ${acceleratorThreshold} threshold)`,
      };
    }
    const commission = amount * flatRate;
    return {
      rate: flatRate,
      commission,
      note: `Base rate ${(flatRate * 100).toFixed(2)}% (below threshold of ${currency} ${acceleratorThreshold})`,
    };
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
      const allocated = amount - remaining;
      const tierStart = Math.max(tierBottom, allocated);
      const tierEnd = Math.min(tierTop, amount);
      const applicable = Math.max(0, tierEnd - tierStart);
      if (applicable <= 0) continue;
      const commission = applicable * tier.rate;
      totalCommission += commission;
      notes.push(
        `${(tier.rate * 100).toFixed(2)}% on ${currency} ${applicable.toFixed(2)}`,
      );
      lastRate = tier.rate;
      remaining -= applicable;
    }

    const effectiveRate = amount > 0 ? totalCommission / amount : lastRate;
    return {
      rate: effectiveRate,
      commission: totalCommission,
      note: `Tiered: ${notes.join(", ")}`,
    };
  }

  return { rate: 0, commission: 0, note: "No plan or rate configured" };
}

export class StandardEngine implements CalcEngine {
  name = "standard";
  label = "Standard (Flat / Tiered / Accelerator)";

  features(): EngineFeature {
    return { navItems: [] };
  }

  async calculate(input: CalcEngineInput): Promise<CalcEngineOutput> {
    const { workspaceId, period, wsCurrency } = input;

    logger.info(
      `[Engine:Standard] Calculating run ${input.runId} for workspace ${workspaceId}`,
    );

    const dealQuery: any = {
      workspaceId: new Types.ObjectId(workspaceId),
      period,
      stage: { $in: ["closed_won", "Closed Won", "Won", "won"] },
    };
    if (input.paymentStatuses) {
      dealQuery.paymentStatus = { $in: input.paymentStatuses };
    }
    const deals = await Deal.find(dealQuery);
    logger.info(`[Engine:Standard] Found ${deals.length} deals for period ${period}`);

    const reps = await Rep.find({ workspaceId: new Types.ObjectId(workspaceId) });
    const plans = await Plan.find({ workspaceId: new Types.ObjectId(workspaceId) });
    const tiers = await PlanTier.find({
      planId: { $in: plans.map((p) => p._id) },
    }).sort({ fromAmount: 1 });

    const planMap = new Map(plans.map((p) => [p._id.toString(), p]));
    const tierMap = new Map<
      string,
      { fromAmount: number; toAmount: number | null; rate: number }[]
    >();
    for (const t of tiers) {
      const planIdStr = t.planId.toString();
      if (!tierMap.has(planIdStr)) tierMap.set(planIdStr, []);
      tierMap.get(planIdStr)!.push({
        fromAmount: Number(t.fromAmount),
        toAmount: t.toAmount !== null ? Number(t.toAmount) : null,
        rate: Number(t.rate),
      });
    }
    const repMap = new Map(reps.map((r) => [r._id.toString(), r]));

    let totalCommission = 0;
    let skippedDeals = 0;
    const resultRows: CalcEngineResult[] = [];
    const involvedReps = new Set<string>();

    for (const deal of deals) {
      const rep = repMap.get(deal.repId.toString());
      if (!rep) {
        logger.warn(`[Engine:Standard] Deal ${deal._id} has no rep`);
        skippedDeals++;
        continue;
      }

      if (!rep.planId) {
        logger.warn(`[Engine:Standard] Rep ${rep.name} has no plan. Skipping deal ${deal.name}`);
        skippedDeals++;
        continue;
      }

      const plan = planMap.get(rep.planId.toString());
      if (!plan) {
        logger.warn(`[Engine:Standard] Plan ${rep.planId} not found for rep ${rep.name}`);
        skippedDeals++;
        continue;
      }

      const dealCreatedAt = (deal as any).createdAt instanceof Date
        ? (deal as any).createdAt
        : new Date((deal as any).createdAt || Date.now());

      const { converted: normalizedAmount, rate: snapshotRate, snapshotDate } =
        await convertCurrencyAt(Number(deal.amount), deal.currency || "USD", wsCurrency, dealCreatedAt);

      const { rate, commission: commissionInWsCurrency, note } = calculateCommission(
        normalizedAmount,
        wsCurrency,
        plan.type,
        plan.flatRate !== null ? Number(plan.flatRate) : null,
        plan.acceleratorThreshold !== null ? Number(plan.acceleratorThreshold) : null,
        plan.acceleratorRate !== null ? Number(plan.acceleratorRate) : null,
        tierMap.get(plan._id.toString()) ?? [],
      );

      const commissionInOriginalCurrency = Number(deal.amount) * rate;
      const commissionConverted = commissionInOriginalCurrency * snapshotRate;

      totalCommission += commissionInWsCurrency;
      involvedReps.add(rep._id.toString());
      resultRows.push({
        repId: rep._id.toString(),
        dealId: deal._id.toString(),
        rateApplied: rate,
        commissionAmount: commissionInOriginalCurrency,
        currency: deal.currency || "USD",
        calculationNote: note,
        wsCurrency,
        convertedDealAmount: normalizedAmount,
        convertedCommission: commissionConverted,
        exchangeRateSnapshot: snapshotRate,
        rateSnapshotDate: snapshotDate,
      });
    }

    return {
      results: resultRows,
      summary: {
        totalCommission,
        totalItems: resultRows.length,
        skippedItems: skippedDeals,
        involvedReps,
      },
    };
  }
}
