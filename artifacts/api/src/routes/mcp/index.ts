import { Router } from "express";
import { randomUUID } from "crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { resolveWorkspaceFromApiKey } from "./auth";
import { createMcpServer } from "./tools";
import { logger } from "../../lib/logger";

const router = Router();

const transports = new Map<string, StreamableHTTPServerTransport>();

router.all("/mcp", async (req, res): Promise<void> => {
  const existingSessionId = req.headers["mcp-session-id"] as string | undefined;

  if (existingSessionId) {
    const transport = transports.get(existingSessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found. Reconnect to establish a new session." });
      return;
    }
    try {
      await transport.handleRequest(req, res, req.body);
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
      },
    });

    await server.connect(transport);
    transports.set(sessionId, transport);

    logger.info({ sessionId, workspaceId: ctx.workspaceId }, "MCP streamable HTTP session established");

    await transport.handleRequest(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err: message }, "MCP streamable HTTP connection rejected");
    res.status(401).json({ error: message });
  }
});

export default router;
