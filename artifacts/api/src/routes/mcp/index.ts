import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { Router } from "express";
import { auditContext } from "../../lib/audit-context";
import { logger } from "../../lib/logger";
import { resolveWorkspaceFromApiKey } from "./auth";
import type { WorkspaceContext } from "./context";
import { createMcpServer } from "./tools";

const router = Router();

const transports = new Map<string, StreamableHTTPServerTransport>();
/** Stores the WorkspaceContext per session so we can re-apply audit context on re-requests. */
const sessionContexts = new Map<string, WorkspaceContext>();

/**
 * Wrap the transport handleRequest inside the AsyncLocalStorage audit context
 * so any Mongoose audit plugin or manual logAudit call picks up the MCP user identity.
 */
function handleWithAuditContext(
  ctx: WorkspaceContext,
  transport: StreamableHTTPServerTransport,
  req: any,
  res: any,
  body: unknown,
): Promise<void> {
  const mcpUserName = `MCP ${ctx.apiKeyName}`;

  const baseCtx = {
    userId: ctx.creatorUserId,
    userName: mcpUserName,
    userEmail: ctx.creatorEmail,
    workspaceId: ctx.workspaceId,
    ipAddress:
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.socket?.remoteAddress ??
      req.ip ??
      undefined,
    userAgent: req.headers["user-agent"] as string | undefined,
  };

  return new Promise<void>((resolve, reject) => {
    auditContext.run(baseCtx, async () => {
      try {
        await transport.handleRequest(req, res, body);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

router.all("/mcp", async (req, res): Promise<void> => {
  const existingSessionId = req.headers["mcp-session-id"] as string | undefined;

  if (existingSessionId) {
    const transport = transports.get(existingSessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found. Reconnect to establish a new session." });
      return;
    }
    const ctx = sessionContexts.get(existingSessionId);
    if (!ctx) {
      res.status(500).json({ error: "Session context not found." });
      return;
    }
    try {
      await handleWithAuditContext(ctx, transport, req, res, req.body);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message, sessionId: existingSessionId }, "MCP message handling error");
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
    return;
  }

  try {
    const ctx = await resolveWorkspaceFromApiKey(req.headers.authorization);
    const server = createMcpServer(ctx);

    const sessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
      onsessionclosed: (id) => {
        transports.delete(id);
        sessionContexts.delete(id);
      },
    });

    await server.connect(transport);
    transports.set(sessionId, transport);
    sessionContexts.set(sessionId, ctx);

    logger.info(
      { sessionId, workspaceId: ctx.workspaceId, apiKeyName: ctx.apiKeyName },
      "MCP streamable HTTP session established",
    );

    await handleWithAuditContext(ctx, transport, req, res, req.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err: message }, "MCP streamable HTTP connection rejected");
    res.status(401).json({ error: message });
  }
});

export default router;
