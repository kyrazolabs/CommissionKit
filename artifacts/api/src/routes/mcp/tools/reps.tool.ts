import { Rep, Plan } from "@workspace/db";
import { Types } from "mongoose";
import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceContext } from "../context";
import { requirePermission } from "../guard";

class RepTools {
  private static instance: RepTools;

  private constructor() {}

  static getInstance(): RepTools {
    if (!RepTools.instance) {
      RepTools.instance = new RepTools();
    }
    return RepTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const wsObjectId = new Types.ObjectId(ctx.workspaceId);

    server.tool("list_reps", "List all sales reps in your workspace", {
      page: z.number().int().min(1).optional().default(1),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }, async ({ page, limit }) => {
      requirePermission(ctx, "read:reps", "list_reps");
      const [reps, total] = await Promise.all([
        Rep.find({ workspaceId: wsObjectId }).select("name email role planId createdAt portalAccessCode")
          .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Rep.countDocuments({ workspaceId: wsObjectId }),
      ]);

      return {
        content: [{ type: "text", text: JSON.stringify({
          data: reps.map((r: any) => ({
            id: r._id, name: r.name, email: r.email, role: r.role,
            planId: r.planId ?? null, createdAt: r.createdAt,
          })),
          pagination: { page, limit, total },
        }, null, 2) }],
      };
    });

    server.tool("get_rep", "Get a single rep by ID with their plan info", {
      repId: z.string().describe("The rep ID"),
    }, async ({ repId }) => {
      requirePermission(ctx, "read:reps", "get_rep");
      const rep = await Rep.findOne({ _id: new Types.ObjectId(repId), workspaceId: wsObjectId }).lean();
      if (!rep) return { content: [{ type: "text", text: JSON.stringify({ error: "Rep not found" }) }] };

      let planName: string | null = null;
      if ((rep as any).planId) {
        const plan = await Plan.findById((rep as any).planId).select("name").lean();
        planName = plan?.name ?? null;
      }

      return {
        content: [{ type: "text", text: JSON.stringify({
          id: (rep as any)._id, name: (rep as any).name, email: (rep as any).email,
          role: (rep as any).role, planId: (rep as any).planId ?? null, planName,
          createdAt: (rep as any).createdAt,
        }, null, 2) }],
      };
    });

    server.tool("create_rep", "Create a new sales rep in your workspace", {
      name: z.string().min(1).max(100).describe("Rep's full name"),
      email: z.string().email().describe("Rep's email address"),
      role: z.string().optional().default("Sales Rep").describe("Job title or role"),
      planId: z.string().optional().describe("Commission plan ID to assign"),
    }, async ({ name, email, role, planId }) => {
      requirePermission(ctx, "write:reps", "create_rep");

      if (planId) {
        const plan = await Plan.findOne({ _id: planId, workspaceId: wsObjectId });
        if (!plan) return { content: [{ type: "text", text: JSON.stringify({ error: "Plan not found" }) }] };
      }

      const rep = await Rep.create({
        workspaceId: wsObjectId, name, email, role,
        planId: planId ? new Types.ObjectId(planId) : undefined,
      });

      return {
        content: [{ type: "text", text: JSON.stringify({
          id: rep._id, name: rep.name, email: rep.email, role: rep.role,
          planId: rep.planId ?? null, createdAt: rep.createdAt,
        }, null, 2) }],
      };
    });
  }
}

export const repTools = RepTools.getInstance();
