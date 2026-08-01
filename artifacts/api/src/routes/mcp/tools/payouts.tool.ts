import { Payout } from "@workspace/db";
import { Types } from "mongoose";
import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceContext } from "../context";
import { requirePermission } from "../guard";

class PayoutTools {
  private static instance: PayoutTools;

  private constructor() {}

  static getInstance(): PayoutTools {
    if (!PayoutTools.instance) {
      PayoutTools.instance = new PayoutTools();
    }
    return PayoutTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const wsObjectId = new Types.ObjectId(ctx.workspaceId);

    server.tool("list_payouts", "List commission payouts in your workspace", {
      status: z.enum(["pending", "approved", "paid", "disputed", "on_hold"]).optional().describe("Filter by payout status"),
      repId: z.string().optional().describe("Filter by rep ID"),
      page: z.number().int().min(1).optional().default(1),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }, async ({ status, repId, page, limit }) => {
      requirePermission(ctx, "read:payouts", "list_payouts");
      const conditions: any = { workspaceId: wsObjectId };
      if (status) conditions.status = status;
      if (repId) conditions.repId = new Types.ObjectId(repId);

      const [payouts, total] = await Promise.all([
        Payout.find(conditions).populate("repId", "name email").sort({ createdAt: -1 })
          .skip((page - 1) * limit).limit(limit).lean(),
        Payout.countDocuments(conditions),
      ]);

      return {
        content: [{ type: "text", text: JSON.stringify({
          data: payouts.map((p: any) => ({
            id: p._id, repName: p.repId?.name ?? "Unknown", repId: p.repId?._id ?? null,
            amount: Number(p.amount), currency: p.currency ?? "USD", status: p.status,
            period: p.period, note: p.note ?? null, createdAt: p.createdAt,
          })),
          pagination: { page, limit, total },
        }, null, 2) }],
      };
    });

    server.tool("get_payout", "Get details of a specific payout", {
      payoutId: z.string().describe("The payout ID"),
    }, async ({ payoutId }) => {
      requirePermission(ctx, "read:payouts", "get_payout");
      const payout = await Payout.findOne({ _id: new Types.ObjectId(payoutId), workspaceId: wsObjectId })
        .populate("repId", "name email").lean();

      if (!payout) return { content: [{ type: "text", text: JSON.stringify({ error: "Payout not found" }) }] };

      return {
        content: [{ type: "text", text: JSON.stringify({
          id: (payout as any)._id, repName: (payout as any).repId?.name ?? "Unknown",
          repId: (payout as any).repId?._id ?? null, amount: Number((payout as any).amount),
          currency: (payout as any).currency ?? "USD", status: (payout as any).status,
          period: (payout as any).period, note: (payout as any).note ?? null,
          adjustments: (payout as any).adjustments ?? [],
          statusHistory: (payout as any).statusHistory ?? [],
          createdAt: (payout as any).createdAt,
        }, null, 2) }],
      };
    });
  }
}

export const payoutTools = PayoutTools.getInstance();
