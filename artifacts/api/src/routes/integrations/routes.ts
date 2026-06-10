import { Router, type IRouter } from "express";
import { IntegrationConnection, IntegrationSync, IntegrationLog, WorkspaceMember } from "@workspace/db";
import { pluginRegistry } from "@workspace/plugins-core";
import {
  syncRepsQueue,
  syncDealsQueue,
  webhookIngressQueue,
} from "@workspace/queue";
import {
  requirePermission,
  type AuthenticatedRequest,
} from "../../middleware/auth";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

// ─── List available connectors ──────────────────────────────────────

router.get(
  "/connectors",
  async (_req, res): Promise<void> => {
    const connectors = pluginRegistry.list().map((p) => {
      const meta = p.getUIMetadata();
      return {
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        icon: p.icon,
        category: meta.category,
        features: meta.features,
        version: p.version,
      };
    });

    res.json({ connectors });
  },
);

// ─── Get connector metadata + settings schema ───────────────────────

router.get(
  "/connectors/:name",
  async (req, res): Promise<void> => {
    const plugin = pluginRegistry.get(req.params.name);
    if (!plugin) {
      res.status(404).json({ error: "Connector not found" });
      return;
    }

    const meta = plugin.getUIMetadata();
    res.json({
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description,
      icon: plugin.icon,
      category: meta.category,
      version: plugin.version,
      features: meta.features,
      setupGuideUrl: meta.setupGuideUrl,
      settingsSchema: plugin.getSettingsSchema(),
    });
  },
);

// ─── Get connection status ──────────────────────────────────────────

router.get(
  "/:workspaceId/status",
  ...requirePermission("workspace", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const conn = await IntegrationConnection.findOne({
      workspaceId,
    });

    if (!conn) {
      res.json({ connected: false });
      return;
    }

    const plugin = pluginRegistry.get(conn.connectorName);
    const status = plugin ? await plugin.getStatus(workspaceId) : "disconnected";

    const recentSyncs = await IntegrationSync.find({
      workspaceId,
      connectorName: conn.connectorName,
    })
      .sort({ startedAt: -1 })
      .limit(10)
      .lean();

    res.json({
      connected: conn.status === "connected",
      connectorName: conn.connectorName,
      connectorDisplayName: plugin?.displayName || conn.connectorName,
      status,
      lastSyncedAt: conn.lastSyncedAt,
      syncSchedule: conn.syncSchedule,
      writeBackEnabled: conn.writeBackEnabled,
      lastError: conn.lastError,
      recentSyncs: recentSyncs.map((s: any) => ({
        id: s._id,
        entityType: s.entityType,
        status: s.status,
        trigger: s.trigger,
        stats: s.stats,
        completedAt: s.completedAt,
      })),
    });
  },
);

// ─── Test connection ────────────────────────────────────────────────

router.post(
  "/:workspaceId/test",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const { connectorName, config } = req.body;

    const plugin = pluginRegistry.get(connectorName);
    if (!plugin) {
      res.status(404).json({ error: "Connector not found" });
      return;
    }

    try {
      const result = await plugin.testConnection(config);
      res.json(result);
    } catch (err: any) {
      res.json({ success: false, message: err.message || "Test failed" });
    }
  },
);

// ─── Connect workspace to ERP ───────────────────────────────────────

router.post(
  "/:workspaceId/connect",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { connectorName, config, syncSchedule, writeBackEnabled } = req.body;

    const plugin = pluginRegistry.get(connectorName);
    if (!plugin) {
      res.status(404).json({ error: "Connector not found" });
      return;
    }

    try {
      // Test first
      const testResult = await plugin.testConnection(config);
      if (!testResult.success) {
        res.status(400).json({ error: "Connection test failed", details: testResult });
        return;
      }

      // Init plugin
      await plugin.init(workspaceId, config);

      // Upsert connection record
      const webhookSecret = Array.from(
        { length: 32 },
        () => Math.random().toString(36)[2],
      ).join("");

      const conn = await IntegrationConnection.findOneAndUpdate(
        { workspaceId },
        {
          workspaceId,
          connectorName,
          status: "connected",
          config,
          webhookSecret,
          syncSchedule: syncSchedule || { reps: "hourly", deals: "hourly" },
          writeBackEnabled: writeBackEnabled ?? false,
          lastConnectedAt: new Date(),
          lastError: undefined,
        },
        { upsert: true, new: true },
      );

      // Enqueue initial syncs
      await syncRepsQueue.add(`initial-reps-${workspaceId}`, {
        workspaceId,
        connectorName,
        trigger: "initial",
      });

      await syncDealsQueue.add(`initial-deals-${workspaceId}`, {
        workspaceId,
        connectorName,
        trigger: "initial",
      });

      // Schedule periodic syncs (only if not set to manual)
      if (syncSchedule?.reps !== "manual") {
        const repInterval = syncSchedule?.reps === "realtime" ? 600_000 : syncSchedule?.reps === "daily" ? 86_400_000 : 3_600_000;
        await syncRepsQueue.add(
          `scheduled-reps-${workspaceId}`,
          { workspaceId, connectorName, trigger: "scheduled" },
          { repeat: { every: repInterval }, jobId: `scheduled-reps-${workspaceId}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
        );
      }

      if (syncSchedule?.deals !== "manual") {
        const dealInterval = syncSchedule?.deals === "realtime" ? 600_000 : syncSchedule?.deals === "daily" ? 86_400_000 : 3_600_000;
        await syncDealsQueue.add(
          `scheduled-deals-${workspaceId}`,
          { workspaceId, connectorName, trigger: "scheduled" },
          { repeat: { every: dealInterval }, jobId: `scheduled-deals-${workspaceId}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
        );
      }

      const webhookUrl = `${process.env.API_BASE_URL || "http://localhost:8088"}/api/integrations/webhooks/${connectorName}`;

      logger.info({ workspaceId, connectorName }, "[Integrations] Workspace connected");

      res.json({
        success: true,
        connection: {
          workspaceId,
          connectorName,
          status: "connected",
          webhookUrl,
        },
      });
    } catch (err: any) {
      logger.error({ err, workspaceId, connectorName }, "[Integrations] Connection failed");
      res.status(500).json({ error: err.message || "Connection failed" });
    }
  },
);

// ─── Get config ────────────────────────────────────────────────────

router.get(
  "/:workspaceId/config",
  ...requirePermission("workspace", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const conn = await IntegrationConnection.findOne({ workspaceId });
    if (!conn) {
      res.status(404).json({ error: "No connection found" });
      return;
    }

    res.json({ config: conn.config });
  },
);

// ─── Update config ─────────────────────────────────────────────────

router.patch(
  "/:workspaceId/config",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { config, syncSchedule, writeBackEnabled } = req.body;

    const conn = await IntegrationConnection.findOne({ workspaceId });
    if (!conn) {
      res.status(404).json({ error: "No connection found" });
      return;
    }

    if (config) conn.config = config;
    if (syncSchedule) conn.syncSchedule = syncSchedule;
    if (writeBackEnabled !== undefined) conn.writeBackEnabled = writeBackEnabled;

    await conn.save();

    // Re-init plugin with new config
    const plugin = pluginRegistry.get(conn.connectorName);
    if (plugin && config) {
      await plugin.init(workspaceId, config);
    }

    // Update repeatable jobs if schedule changed
    if (syncSchedule) {
      // Remove old repeatable jobs (all possible intervals)
      const jobName = `scheduled-reps-${workspaceId}`;
      for (const ms of [600_000, 3_600_000, 86_400_000]) {
        await syncRepsQueue.removeRepeatable(jobName, { every: ms }).catch(() => {});
      }
      for (const ms of [600_000, 3_600_000, 86_400_000]) {
        await syncDealsQueue.removeRepeatable(`scheduled-deals-${workspaceId}`, { every: ms }).catch(() => {});
      }

      // Create new ones (unless set to manual)
      if (syncSchedule.reps !== "manual") {
        const repInterval = syncSchedule.reps === "realtime" ? 600_000 : syncSchedule.reps === "daily" ? 86_400_000 : 3_600_000;
        await syncRepsQueue.add(
          jobName,
          { workspaceId, connectorName: conn.connectorName, trigger: "scheduled" },
          { repeat: { every: repInterval }, jobId: jobName, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
        ).catch(() => {});
      }

      if (syncSchedule.deals !== "manual") {
        const dealInterval = syncSchedule.deals === "realtime" ? 600_000 : syncSchedule.deals === "daily" ? 86_400_000 : 3_600_000;
        await syncDealsQueue.add(
          `scheduled-deals-${workspaceId}`,
          { workspaceId, connectorName: conn.connectorName, trigger: "scheduled" },
          { repeat: { every: dealInterval }, jobId: `scheduled-deals-${workspaceId}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
        ).catch(() => {});
      }
    }

    res.json({ success: true });
  },
);

// ─── Disconnect ─────────────────────────────────────────────────────

router.delete(
  "/:workspaceId/disconnect",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const conn = await IntegrationConnection.findOne({ workspaceId });
    if (!conn) {
      res.status(404).json({ error: "No connection found" });
      return;
    }

    const plugin = pluginRegistry.get(conn.connectorName);
    if (plugin) {
      await plugin.destroy(workspaceId);
    }

    // Remove scheduled sync jobs
    for (const ms of [600_000, 3_600_000, 86_400_000]) {
      await syncRepsQueue.removeRepeatable(`scheduled-reps-${workspaceId}`, { every: ms }).catch(() => {});
      await syncDealsQueue.removeRepeatable(`scheduled-deals-${workspaceId}`, { every: ms }).catch(() => {});
    }

    await IntegrationConnection.findOneAndUpdate(
      { workspaceId },
      { status: "disconnected", lastError: undefined },
    );

    logger.info({ workspaceId, connectorName: conn.connectorName }, "[Integrations] Workspace disconnected");

    res.json({ success: true });
  },
);

// ─── Dismiss error ─────────────────────────────────────────────────

router.post(
  "/:workspaceId/dismiss-error",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    await IntegrationConnection.findOneAndUpdate(
      { workspaceId },
      { lastError: '' },
    );

    res.json({ success: true });
  },
);

// ─── Manual sync trigger ────────────────────────────────────────────

router.post(
  "/:workspaceId/sync/:entityType",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const entityType = String(req.params.entityType);
    const { externalIds, fullSync } = req.body || {};

    if (!["reps", "deals"].includes(entityType)) {
      res.status(400).json({ error: "entityType must be 'reps' or 'deals'" });
      return;
    }

    const conn = await IntegrationConnection.findOne({ workspaceId });
    if (!conn || conn.status !== "connected") {
      res.status(400).json({ error: "Not connected" });
      return;
    }

    // Clear stale error on manual sync
    await IntegrationConnection.findByIdAndUpdate(conn._id, { lastError: undefined });

    const queue = entityType === "reps" ? syncRepsQueue : syncDealsQueue;
    const job = await queue.add(`manual-${entityType}-${workspaceId}`, {
      workspaceId,
      connectorName: conn.connectorName,
      trigger: "manual",
      options: { externalIds, fullSync },
    });

    res.json({ syncId: job.id, status: "running" });
  },
);

// ─── Sync history ───────────────────────────────────────────────────

router.get(
  "/:workspaceId/sync-history",
  ...requirePermission("workspace", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { entityType, status, limit, offset } = req.query;

    const filter: any = { workspaceId };
    if (entityType) filter.entityType = entityType;
    if (status) filter.status = status;

    const syncs = await IntegrationSync.find(filter)
      .sort({ startedAt: -1 })
      .skip(Number(offset) || 0)
      .limit(Number(limit) || 50)
      .lean();

    const total = await IntegrationSync.countDocuments(filter);

    res.json({
      syncs: syncs.map((s: any) => ({
        id: s._id,
        entityType: s.entityType,
        direction: s.direction,
        trigger: s.trigger,
        status: s.status,
        stats: s.stats,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      })),
      total,
    });
  },
);

// ─── Sync detail ────────────────────────────────────────────────────

router.get(
  "/:workspaceId/sync-history/:syncId",
  ...requirePermission("workspace", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const sync = await IntegrationSync.findOne({
      _id: req.params.syncId,
      workspaceId,
    }).lean();

    if (!sync) {
      res.status(404).json({ error: "Sync not found" });
      return;
    }

    const logs = await IntegrationLog.find({ syncId: (sync as any)._id })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    res.json({
      ...sync,
      logs: logs.map((l: any) => ({
        id: l._id,
        entityType: l.entityType,
        externalId: l.externalId,
        action: l.action,
        message: l.message,
        createdAt: l.createdAt,
      })),
    });
  },
);

// ─── Webhook receiver (public) ──────────────────────────────────────

router.post(
  "/webhooks/:connectorName",
  async (req, res): Promise<void> => {
    const { connectorName } = req.params;

    const plugin = pluginRegistry.get(connectorName);
    if (!plugin) {
      res.status(404).json({ error: "Unknown connector" });
      return;
    }

    try {
      // Find all connections for this connector and try to verify
      const connections = await IntegrationConnection.find({
        connectorName,
        status: "connected",
      });

      if (connections.length === 0) {
        res.status(200).json({ received: true });
        return;
      }

      // Try each connection's webhook secret until one verifies
      let verifiedConn: typeof connections[0] | null = null;
      for (const conn of connections) {
        try {
          await plugin.verifyWebhook(
            {
              method: req.method,
              path: req.path,
              headers: req.headers as Record<string, string>,
              body: req.body,
              rawBody: Buffer.from(JSON.stringify(req.body)),
            },
            conn.webhookSecret || "",
          );
          verifiedConn = conn;
          break;
        } catch {
          // Try next
        }
      }

      if (!verifiedConn) {
        res.status(401).json({ error: "Webhook verification failed" });
        return;
      }

      const events = plugin.parseWebhook(req.body);

      for (const event of events) {
        await webhookIngressQueue.add(
          `wh-${event.type}-${event.externalId}`,
          {
            workspaceId: event.workspaceId,
            connectorName,
            entityType: event.type.startsWith("rep") ? "reps" : "deals",
            eventType: event.type.includes("created") ? "created" : event.type.includes("deleted") ? "deleted" : "updated",
            externalId: event.externalId,
            timestamp: event.timestamp.toISOString(),
            payload: event.payload,
          },
        );
      }

      res.status(200).json({ received: true, events: events.length });
    } catch (err: any) {
      logger.error({ err, connectorName }, "[Webhook] Processing failed");
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);

// ─── HubSpot OAuth callback ──────────────────────────────────────────

router.get(
  "/hubspot/callback",
  async (req, res) => {
    const code = req.query.code as string;
    const workspaceId = req.query.state as string;

    if (!code || !workspaceId) {
      res.status(400).json({ error: "Missing code or state (workspaceId)" });
      return;
    }

    try {
      const conn = await IntegrationConnection.findOne({ workspaceId, connectorName: "hubspot" });
      if (!conn) {
        res.status(404).send("No pending HubSpot connection found. Please connect first.");
        return;
      }

      const config = conn.config as any;
      const clientId = config?.clientId;
      const clientSecret = config?.clientSecret;
      const redirectUri = config?.redirectUri || `${req.protocol}://${req.get("host")}/api/integrations/hubspot/callback`;

      if (!clientId || !clientSecret) {
        res.status(400).send("HubSpot OAuth credentials not configured. Set clientId and clientSecret first.");
        return;
      }

      const { HubSpotClient } = await import("@workspace/plugins-hubspot");
      const tokens = await HubSpotClient.exchangeCode(clientId, clientSecret, redirectUri, code);

      await IntegrationConnection.findOneAndUpdate(
        { workspaceId, connectorName: "hubspot" },
        {
          status: "connected",
          $set: {
            "config.accessToken": tokens.accessToken,
            "config.refreshToken": tokens.refreshToken,
          },
        },
      );

      // Trigger initial sync
      syncRepsQueue.add(`sync-reps:${workspaceId}`, { workspaceId, connectorName: "hubspot", trigger: "manual" });
      syncDealsQueue.add(`sync-deals:${workspaceId}`, { workspaceId, connectorName: "hubspot", trigger: "manual" });

      res.redirect(`${process.env.APP_URL || "http://localhost:3000"}/dash/integrations?connected=hubspot`);
    } catch (err: any) {
      res.status(500).send(`OAuth failed: ${err.message}`);
    }
  },
);

// ─── Salesforce stage mapping ──────────────────────────────────────

router.get(
  "/:workspaceId/salesforce/stages",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res) => {
    const workspaceId = req.workspaceId!;

    try {
      const conn = await IntegrationConnection.findOne({ workspaceId, connectorName: "salesforce" });
      if (!conn) {
        res.status(404).json({ error: "Salesforce not connected" });
        return;
      }

      const config = conn.config as any;
      if (!config?.accessToken || !config?.instanceUrl) {
        res.status(400).json({ error: "Salesforce access token or instance URL not configured" });
        return;
      }

      const { SalesforceClient } = await import("@workspace/plugins-salesforce");
      const client = new SalesforceClient(config.accessToken, config.instanceUrl);
      const records = await client.query("SELECT MasterLabel, IsWon, IsClosed FROM OpportunityStage WHERE IsActive = true");

      const stages = records.map((s: any) => ({
        id: s.MasterLabel,
        label: s.MasterLabel,
        pipeline: s.IsWon === true ? "Won" : s.IsClosed === true ? "Lost" : "Open",
      }));

      const savedMapping = (conn.metadata as any)?.stageMapping || {};
      res.json({ stages, mapping: savedMapping });
    } catch (err: any) {
      logger.error({ err, workspaceId }, "[Salesforce] Failed to fetch opportunity stages");
      res.status(500).json({ error: err.message || "Failed to fetch stages" });
    }
  },
);

router.patch(
  "/:workspaceId/salesforce/stages",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res) => {
    const workspaceId = req.workspaceId!;
    const { mapping } = req.body;

    if (!mapping || typeof mapping !== "object") {
      res.status(400).json({ error: "mapping object required" });
      return;
    }

    await IntegrationConnection.findOneAndUpdate(
      { workspaceId, connectorName: "salesforce" },
      { $set: { "metadata.stageMapping": mapping } },
    );

    res.json({ success: true, mapping });
  },
);

// ─── HubSpot stage mapping ──────────────────────────────────────────

router.get(
  "/:workspaceId/hubspot/stages",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res) => {
    const workspaceId = req.workspaceId!;

    try {
      const conn = await IntegrationConnection.findOne({ workspaceId, connectorName: "hubspot" });
      if (!conn) {
        res.status(404).json({ error: "HubSpot not connected" });
        return;
      }

      const config = conn.config as any;
      if (!config?.accessToken) {
        res.status(400).json({ error: "HubSpot access token not configured" });
        return;
      }

      const { HubSpotClient } = await import("@workspace/plugins-hubspot");
      const client = new HubSpotClient(config.accessToken);
      const pipelines = await client.getPipelines();

      const stages: Array<{ id: string; label: string; pipeline: string }> = [];
      for (const p of pipelines) {
        for (const s of p.stages) {
          stages.push({ id: s.id, label: s.label, pipeline: p.label });
        }
      }

      const savedMapping = (conn.metadata as any)?.stageMapping || {};

      res.json({ stages, mapping: savedMapping });
    } catch (err: any) {
      logger.error({ err, workspaceId }, "[HubSpot] Failed to fetch pipeline stages");
      res.status(500).json({ error: err.message || "Failed to fetch stages" });
    }
  },
);

router.patch(
  "/:workspaceId/hubspot/stages",
  ...requirePermission("workspace", "edit"),
  async (req: AuthenticatedRequest, res) => {
    const workspaceId = req.workspaceId!;
    const { mapping } = req.body; // { "hubspot_stage_id": "closed_won" }

    if (!mapping || typeof mapping !== "object") {
      res.status(400).json({ error: "mapping object required" });
      return;
    }

    await IntegrationConnection.findOneAndUpdate(
      { workspaceId, connectorName: "hubspot" },
      { $set: { "metadata.stageMapping": mapping } },
    );

    res.json({ success: true, mapping });
  },
);

export default router;
