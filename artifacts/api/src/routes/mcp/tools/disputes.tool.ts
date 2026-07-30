import { Dispute } from "@workspace/db";
import { Types } from "mongoose";
import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceContext } from "../context";

class DisputeTools {
  private static instance: DisputeTools;

  private constructor() {}

  static getInstance(): DisputeTools {
    if (!DisputeTools.instance) {
      DisputeTools.instance = new DisputeTools();
    }
    return DisputeTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const wsObjectId = new Types.ObjectId(ctx.workspaceId);

    server.tool("list_disputes", "List disputes in your workspace", {
      status: z.string().optional().describe("Filter by status (open, resolved, closed)"),
      page: z.number().int().min(1).optional().default(1),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }, async ({ status, page, limit }) => {
      const conditions: any = { workspaceId: wsObjectId };
      if (status) conditions.status = status;

      const [disputes, total] = await Promise.all([
        Dispute.find(conditions).populate("repId", "name email").populate("payoutId", "amount currency period")
          .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Dispute.countDocuments(conditions),
      ]);

      return {
        content: [{ type: "text", text: JSON.stringify({
          data: disputes.map((d: any) => ({
            id: d._id, repName: d.repId?.name ?? "Unknown", repId: d.repId?._id ?? null,
            payoutId: d.payoutId?._id ?? null, payoutAmount: d.payoutId?.amount ? Number(d.payoutId.amount) : null,
            payoutPeriod: d.payoutId?.period ?? null, reason: d.reason, status: d.status,
            resolution: d.resolution ?? null, createdAt: d.createdAt,
          })),
          pagination: { page, limit, total },
        }, null, 2) }],
      };
    });

    server.tool("get_dispute", "Get details of a specific dispute", {
      disputeId: z.string().describe("The dispute ID"),
    }, async ({ disputeId }) => {
      const dispute = await Dispute.findOne({ _id: new Types.ObjectId(disputeId), workspaceId: wsObjectId })
        .populate("repId", "name email").populate("payoutId", "amount currency period").lean();

      if (!dispute) return { content: [{ type: "text", text: JSON.stringify({ error: "Dispute not found" }) }] };

      return {
        content: [{ type: "text", text: JSON.stringify({
          id: (dispute as any)._id, repName: (dispute as any).repId?.name ?? "Unknown",
          repId: (dispute as any).repId?._id ?? null, payoutId: (dispute as any).payoutId?._id ?? null,
          payoutAmount: (dispute as any).payoutId?.amount ? Number((dispute as any).payoutId.amount) : null,
          reason: (dispute as any).reason, status: (dispute as any).status,
          resolution: (dispute as any).resolution ?? null, resolvedAt: (dispute as any).resolvedAt ?? null,
          createdAt: (dispute as any).createdAt,
        }, null, 2) }],
      };
    });
  }
}

export const disputeTools = DisputeTools.getInstance();
