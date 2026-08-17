import { AissolCommissionMatrix, AissolInvoice, AissolProject } from "@workspace/db/schema/aissol";
import { Types } from "mongoose";
import { logger } from "../../lib/logger";
import type {
  CalcEngine,
  CalcEngineInput,
  CalcEngineOutput,
  CalcEngineResult,
  EngineFeature,
} from "./CalcEngine";

function determineSlab(value: number, slabs: { index: number; max: number | null }[]): number {
  for (const slab of slabs) {
    if (slab.max === null) return slab.index;
    if (value < slab.max) return slab.index;
  }
  return slabs[slabs.length - 1]?.index ?? 0;
}

function determineGmBracket(
  gmPercent: number,
  brackets: { key: string; max: number | null }[],
): string {
  for (const bracket of brackets) {
    if (bracket.max === null) return bracket.key;
    if (gmPercent < bracket.max) return bracket.key;
  }
  return brackets[brackets.length - 1]?.key ?? "";
}

export class AissolEngine implements CalcEngine {
  name = "aissol";
  label = "AISSOL (Sales Slabs + GM Matrix)";

  features(): EngineFeature {
    return {
      navItems: [
        {
          name: "Matrix",
          href: "/dash/enterprise/matrix",
          icon: "Grid3X3",
          replaces: "/dash/plans",
        },
        {
          name: "Projects",
          href: "/dash/enterprise/projects",
          icon: "FolderKanban",
          replaces: "/dash/deals",
        },
        {
          name: "Reports",
          href: "/dash/enterprise/reports",
          icon: "PieChart",
          replaces: "/dash/reports",
        },
      ],
    };
  }

  async calculate(input: CalcEngineInput): Promise<CalcEngineOutput> {
    const { workspaceId, period } = input;

    logger.info(`[Engine:AISSOL] Calculating run ${input.runId} for workspace ${workspaceId}`);

    const matrix = await AissolCommissionMatrix.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!matrix || !matrix.slabs?.length || !matrix.gmBrackets?.length) {
      logger.warn(
        `[Engine:AISSOL] No commission matrix configured for workspace ${workspaceId}. Returning empty results.`,
      );
      return {
        results: [],
        summary: {
          totalCommission: 0,
          totalItems: 0,
          skippedItems: 0,
          involvedReps: new Set(),
        },
      };
    }

    const slabs = matrix.slabs.sort((a, b) => a.index - b.index);
    const gmBrackets = matrix.gmBrackets.sort((a, b) => {
      const aMax = a.max === null ? Infinity : a.max;
      const bMax = b.max === null ? Infinity : b.max;
      return aMax - bMax;
    });
    const rates = matrix.rates ?? {};

    const projects = await AissolProject.find({
      workspaceId: new Types.ObjectId(workspaceId),
      period,
    });
    logger.info(`[Engine:AISSOL] Found ${projects.length} projects for period ${period}`);
    const projectIds = projects.map((p) => p._id);

    const invoiceQuery: any = {
      projectId: { $in: projectIds },
    };
    if (input.paymentStatuses && input.paymentStatuses.length > 0) {
      invoiceQuery.paymentStatus = { $in: input.paymentStatuses };
    }
    const invoices = await AissolInvoice.find(invoiceQuery);
    logger.info(
      `[Engine:AISSOL] Found ${invoices.length} invoices for ${projects.length} projects`,
    );

    const projectMap = new Map(projects.map((p) => [p._id.toString(), p]));
    const invoicesByProject = new Map<string, typeof invoices>();
    for (const inv of invoices) {
      const key = inv.projectId.toString();
      if (!invoicesByProject.has(key)) invoicesByProject.set(key, []);
      invoicesByProject.get(key)!.push(inv);
    }

    let totalCommission = 0;
    let skippedProjects = 0;
    const resultRows: CalcEngineResult[] = [];
    const involvedReps = new Set<string>();

    for (const project of projects) {
      const totalValue = Number(project.totalValue);
      const totalCost = Number(project.totalCost);

      const slabIdx = determineSlab(totalValue, slabs);
      const slabDef = slabs[slabIdx] ?? { index: slabIdx, label: `Slab ${slabIdx}` };
      const gmPercent = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;
      const gmBracket = determineGmBracket(gmPercent, gmBrackets);

      const slabRates = rates[String(slabIdx)];
      const commissionPct = slabRates?.[gmBracket];

      if (commissionPct === undefined || commissionPct === null) {
        logger.warn(
          `[Engine:AISSOL] No commission rate found for Slab ${slabIdx}, GM bracket ${gmBracket}. Skipping project ${project.name}.`,
        );
        skippedProjects++;
        continue;
      }

      const rate = Number(commissionPct);
      const projectInvoices = invoicesByProject.get(project._id.toString()) ?? [];

      if (projectInvoices.length === 0) {
        logger.warn(`[Engine:AISSOL] No invoices found for project ${project.name}. Skipping.`);
        skippedProjects++;
        continue;
      }

      for (const invoice of projectInvoices) {
        const commissionAmount = Number(invoice.amount) * rate;
        totalCommission += commissionAmount;
        involvedReps.add(project.repId.toString());

        resultRows.push({
          repId: project.repId.toString(),
          dealId: invoice._id.toString(),
          rateApplied: rate,
          commissionAmount,
          currency: invoice.currency || "SAR",
          calculationNote: `AISSOL: Slab ${slabIdx} (${slabDef.label}), GM ${gmPercent.toFixed(1)}% (${gmBracket}), Rate ${(rate * 100).toFixed(2)}% on ${invoice.currency || "SAR"} ${Number(invoice.amount).toFixed(2)}`,
          meta: {
            engineType: "aissol",
            projectId: project._id.toString(),
            invoiceId: invoice._id.toString(),
            slab: slabIdx,
            slabLabel: slabDef.label,
            gmPercent: Math.round(gmPercent * 100) / 100,
            gmBracket,
            projectTotalValue: totalValue,
            projectTotalCost: totalCost,
            invoiceNumber: invoice.invoiceNumber,
          },
        });
      }
    }

    logger.info(
      `[Engine:AISSOL] Completed run ${input.runId}: ${totalCommission} commission across ${resultRows.length} invoices (${skippedProjects} projects skipped)`,
    );

    return {
      results: resultRows,
      summary: {
        totalCommission,
        totalItems: resultRows.length,
        skippedItems: skippedProjects,
        involvedReps,
      },
    };
  }
}
