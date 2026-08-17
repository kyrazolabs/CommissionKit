import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Deal, Rep } from "@workspace/db";
import { Types } from "mongoose";
import { z } from "zod/v4";
import type { WorkspaceContext } from "../context";
import { requirePermission } from "../guard";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

class DealTools {
  private static instance: DealTools;

  private constructor() {}

  static getInstance(): DealTools {
    if (!DealTools.instance) {
      DealTools.instance = new DealTools();
    }
    return DealTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const wsObjectId = new Types.ObjectId(ctx.workspaceId);

    server.tool(
      "list_deals",
      "List deals in your workspace with optional filters",
      {
        status: z
          .enum(["closed_won", "closed_lost", "pending"])
          .optional()
          .describe("Filter by deal stage"),
        repId: z.string().optional().describe("Filter by rep ID"),
        paymentStatus: z
          .enum(["unpaid", "paid", "partial", "on_hold"])
          .optional()
          .describe("Filter by payment status"),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(50),
      },
      async ({ status, repId, paymentStatus, page, limit }) => {
        requirePermission(ctx, "read:deals", "list_deals");
        const conditions: any = { workspaceId: wsObjectId };
        if (status) conditions.stage = status;
        if (repId) conditions.repId = new Types.ObjectId(repId);
        if (paymentStatus) conditions.paymentStatus = paymentStatus;

        const [deals, total] = await Promise.all([
          Deal.find(conditions)
            .populate("repId", "name email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Deal.countDocuments(conditions),
        ]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  data: deals.map((d: any) => ({
                    id: d._id,
                    name: d.name,
                    amount: d.amount,
                    currency: d.currency ?? "USD",
                    stage: d.stage,
                    paymentStatus: d.paymentStatus ?? "unpaid",
                    closeDate: d.closeDate ?? null,
                    period: d.period,
                    repName: d.repId?.name ?? "Unknown",
                    repId: d.repId?._id ?? null,
                    clawbackApplied: d.clawbackApplied ?? false,
                    clawbackAmount: d.clawbackAmount ?? 0,
                    createdAt: d.createdAt,
                  })),
                  pagination: { page, limit, total },
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "get_deal",
      "Get a single deal by ID",
      {
        dealId: z.string().describe("The deal ID"),
      },
      async ({ dealId }) => {
        requirePermission(ctx, "read:deals", "get_deal");
        const deal = await Deal.findOne({
          _id: new Types.ObjectId(dealId),
          workspaceId: wsObjectId,
        })
          .populate("repId", "name email")
          .lean();

        if (!deal)
          return { content: [{ type: "text", text: JSON.stringify({ error: "Deal not found" }) }] };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: (deal as any)._id,
                  name: (deal as any).name,
                  amount: (deal as any).amount,
                  currency: (deal as any).currency ?? "USD",
                  stage: (deal as any).stage,
                  paymentStatus: (deal as any).paymentStatus ?? "unpaid",
                  period: (deal as any).period,
                  closeDate: (deal as any).closeDate ?? null,
                  notes: (deal as any).notes ?? null,
                  repName: (deal as any).repId?.name ?? "Unknown",
                  repId: (deal as any).repId?._id ?? null,
                  clawbackApplied: (deal as any).clawbackApplied ?? false,
                  clawbackAmount: (deal as any).clawbackAmount ?? 0,
                  createdAt: (deal as any).createdAt,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "create_deal",
      "Create a new deal in your workspace",
      {
        repId: z.string().describe("The rep ID to associate with this deal"),
        name: z.string().min(1).max(255).describe("Deal name or customer name"),
        amount: z.number().positive().describe("Deal amount in the specified currency"),
        currency: z.string().optional().default("USD").describe("ISO 4217 currency code"),
        period: z.string().optional().describe("Period in YYYY-MM format (default: current month)"),
        stage: z
          .enum(["closed_won", "closed_lost", "pending"])
          .optional()
          .default("pending")
          .describe("Deal stage"),
        paymentStatus: z
          .enum(["unpaid", "paid", "partial", "on_hold"])
          .optional()
          .default("unpaid")
          .describe("Payment status"),
        notes: z.string().optional().describe("Optional notes"),
        closeDate: z.string().optional().describe("Close date in YYYY-MM-DD format"),
      },
      async ({ repId, name, amount, currency, period, stage, paymentStatus, notes, closeDate }) => {
        requirePermission(ctx, "write:deals", "create_deal");

        const rep = await Rep.findOne({ _id: repId, workspaceId: wsObjectId });
        if (!rep)
          return {
            content: [
              { type: "text", text: JSON.stringify({ error: "Rep not found in this workspace" }) },
            ],
          };

        const deal = await Deal.create({
          workspaceId: wsObjectId,
          repId: new Types.ObjectId(repId),
          name,
          amount,
          currency,
          period: period || currentPeriod(),
          stage,
          paymentStatus,
          notes: notes ?? null,
          closeDate: closeDate ?? undefined,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: deal._id,
                  name: deal.name,
                  amount: deal.amount,
                  currency: deal.currency ?? "USD",
                  stage: deal.stage,
                  period: deal.period,
                  repName: rep.name,
                  createdAt: deal.createdAt,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "search_deals",
      "Search deals by name or customer",
      {
        query: z.string().min(1).max(100).describe("Search term (matched against deal name)"),
      },
      async ({ query }) => {
        requirePermission(ctx, "read:deals", "search_deals");
        const deals = await Deal.find({ workspaceId: wsObjectId, name: new RegExp(query, "i") })
          .populate("repId", "name email")
          .sort({ createdAt: -1 })
          .limit(25)
          .lean();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query,
                  count: deals.length,
                  data: deals.map((d: any) => ({
                    id: d._id,
                    name: d.name,
                    amount: d.amount,
                    currency: d.currency ?? "USD",
                    stage: d.stage,
                    repName: d.repId?.name ?? "Unknown",
                    createdAt: d.createdAt,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "update_deal",
      "Update an existing deal's fields",
      {
        dealId: z.string().describe("The deal ID to update"),
        name: z.string().min(1).max(255).optional().describe("Updated deal name"),
        amount: z.number().positive().optional().describe("Updated deal amount"),
        stage: z
          .enum(["closed_won", "closed_lost", "pending"])
          .optional()
          .describe("Updated deal stage"),
        paymentStatus: z
          .enum(["unpaid", "paid", "partial", "on_hold"])
          .optional()
          .describe("Updated payment status"),
        notes: z.string().optional().describe("Updated notes"),
        closeDate: z.string().optional().describe("Updated close date in YYYY-MM-DD format"),
      },
      async ({ dealId, name, amount, stage, paymentStatus, notes, closeDate }) => {
        requirePermission(ctx, "write:deals", "update_deal");

        const update: any = {};
        if (name !== undefined) update.name = name;
        if (amount !== undefined) update.amount = amount;
        if (stage !== undefined) update.stage = stage;
        if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
        if (notes !== undefined) update.notes = notes;
        if (closeDate !== undefined) update.closeDate = closeDate;

        const deal = await Deal.findOneAndUpdate(
          { _id: new Types.ObjectId(dealId), workspaceId: wsObjectId },
          { $set: update },
          { new: true },
        )
          .populate("repId", "name email")
          .lean();

        if (!deal)
          return { content: [{ type: "text", text: JSON.stringify({ error: "Deal not found" }) }] };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: (deal as any)._id,
                  name: (deal as any).name,
                  amount: (deal as any).amount,
                  currency: (deal as any).currency ?? "USD",
                  stage: (deal as any).stage,
                  paymentStatus: (deal as any).paymentStatus ?? "unpaid",
                  period: (deal as any).period,
                  closeDate: (deal as any).closeDate ?? null,
                  notes: (deal as any).notes ?? null,
                  repName: (deal as any).repId?.name ?? "Unknown",
                  updatedAt: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  }
}

export const dealTools = DealTools.getInstance();
