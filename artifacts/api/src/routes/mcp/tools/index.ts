import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceContext } from "../context";
import { dashboardTools } from "./dashboard.tool";
import { dealTools } from "./deals.tool";
import { disputeTools } from "./disputes.tool";
import { payoutTools } from "./payouts.tool";
import { repTools } from "./reps.tool";
import { runTools } from "./runs.tool";

export function createMcpServer(ctx: WorkspaceContext): McpServer {
  const server = new McpServer({
    name: "commissionkit",
    version: "1.0.0",
  });

  dealTools.register(server, ctx);
  repTools.register(server, ctx);
  runTools.register(server, ctx);
  payoutTools.register(server, ctx);
  disputeTools.register(server, ctx);
  dashboardTools.register(server, ctx);

  return server;
}
