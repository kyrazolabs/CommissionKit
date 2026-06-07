# Sync Engine Design

The sync engine is the core orchestration layer that moves data between CommissionKit and external ERP/CRM systems. It handles ingress (ERP → CKit), egress (CKit → ERP), webhook dispatch, reconciliation, and error recovery.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sync Engine                               │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Sync Scheduler  │  │Webhook Handler │  │ Manual Trigger  │    │
│  │ (BullMQ repeat) │  │ (HTTP route)   │  │ (API endpoint)  │    │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘    │
│          │                   │                    │              │
│          └───────────────────┼────────────────────┘              │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Sync Dispatcher                          │    │
│  │                                                           │    │
│  │  1. Validate connection status                            │    │
│  │  2. Acquire workspace-level lock (prevents concurrent)    │    │
│  │  3. Resolve connector from registry                       │    │
│  │  4. Create IntegrationSync record                          │    │
│  │  5. Call connector.fetch*(workspaceId, config, options)    │    │
│  │  6. Pass results to Upsert Engine                         │    │
│  │  7. Update IntegrationSync with stats                     │    │
│  │  8. Release lock                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Upsert Engine                           │    │
│  │                                                           │    │
│  │  For each normalized entity:                              │    │
│  │    1. Resolve externalId → CKit entity                    │    │
│  │    2. Compute syncHash of incoming data                   │    │
│  │    3. Compare hashes — skip if unchanged                  │    │
│  │    4. Upsert CKit entity                                  │    │
│  │    5. Log to IntegrationLog                               │    │
│  │    6. Emit change event (for notifications, auto-calc)    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Utility Services                         │    │
│  │                                                           │    │
│  │  ChangeDetector    WorkspaceLock    RateLimiter           │    │
│  │  ErrorRecovery     MetricsCollector  AuditLogger          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sync Job Types

```typescript
// lib/queue/src/schemas.ts (new additions)

const SyncRepsJobSchema = z.object({
  workspaceId: z.string(),
  connectorName: z.string(),
  trigger: z.enum(["scheduled", "webhook", "manual", "initial"]),
  options: z.object({
    modifiedAfter: z.date().optional(),
    externalIds: z.array(z.string()).optional(),  // Specific entities to sync
    fullSync: z.boolean().optional(),              // Skip hash check, force update all
  }).optional(),
});

const SyncDealsJobSchema = z.object({
  workspaceId: z.string(),
  connectorName: z.string(),
  trigger: z.enum(["scheduled", "webhook", "manual", "initial"]),
  options: z.object({
    modifiedAfter: z.date().optional(),
    externalIds: z.array(z.string()).optional(),
    fullSync: z.boolean().optional(),
  }).optional(),
});

// Similar for SyncProjectsJobSchema, SyncInvoicesJobSchema, SyncPaymentsJobSchema
```

---

## Upsert Engine Logic

The upsert engine is a shared function used by all sync job types:

```typescript
// artifacts/api/src/lib/sync/upsert-engine.ts

async function upsertEntities<T extends NormalizedEntity>(
  workspaceId: string,
  entityType: "reps" | "deals" | "projects" | "invoices",
  entities: T[],
  options?: { fullSync?: boolean }
): Promise<SyncStats> {
  const stats: SyncStats = { total: entities.length, created: 0, updated: 0, skipped: 0, failed: 0 };

  for (const entity of entities) {
    try {
      // 1. Compute hash of incoming data
      const incomingHash = createHash("sha256")
        .update(JSON.stringify(entity))
        .digest("hex");

      // 2. Find existing by compound key
      const existing = await findExistingEntity(entityType, workspaceId, entity.externalId);

      if (existing) {
        if (!options?.fullSync && existing.syncHash === incomingHash) {
          stats.skipped++;
          continue;
        }
        // Update
        await updateCKitEntity(entityType, existing._id, entity, incomingHash);
        stats.updated++;
      } else {
        // Create
        await createCKitEntity(entityType, workspaceId, entity, incomingHash);
        stats.created++;
      }

      // Log the action
      await IntegrationLog.create({
        workspaceId,
        entityType,
        externalId: entity.externalId,
        action: existing ? "updated" : "created",
        message: existing ? "Updated from ERP" : "Created from ERP",
      });

    } catch (err) {
      stats.failed++;
      // Log error, continue with next entity
      await IntegrationLog.create({
        workspaceId,
        entityType,
        externalId: entity.externalId,
        action: "failed",
        message: (err as Error).message,
      });
    }
  }

  return stats;
}
```

### Entity-Type-Specific Upsert Logic

#### Reps

```typescript
async function upsertRep(workspaceId: string, rep: NormalizedRep, hash: string): Promise<void> {
  const existing = await Rep.findOne({ workspaceId, externalId: rep.externalId });

  if (existing) {
    existing.name = rep.name;
    existing.email = rep.email;
    existing.role = rep.role || existing.role;
    existing.syncHash = hash;
    existing.lastSyncedAt = new Date();
    existing.metadata = rep.metadata;
    await existing.save();
  } else {
    const portalAccessCode = generateAccessCode();  // 12-char unique
    const portalUsername = `${rep.name.toLowerCase().replace(/\s+/g, ".")}.${randomBytes(4).toString("hex")}`;

    await Rep.create({
      workspaceId,
      externalId: rep.externalId,
      sourceSystem: getConnectorName(workspaceId),
      name: rep.name,
      email: rep.email,
      role: rep.role,
      portalAccessCode,
      portalUsername,
      syncHash: hash,
      lastSyncedAt: new Date(),
      metadata: rep.metadata,
    });

    // Optionally create Better Auth user for portal
    if (process.env.PORTAL_ENABLED) {
      await createPortalUser(rep.email, portalUsername, portalAccessCode);
      await sendPortalWelcomeEmail(workspaceId, rep.name, rep.email, portalAccessCode, portalUsername);
    }

    // Auto-assign default plan if configured
    const conn = await IntegrationConnection.findOne({ workspaceId });
    if (conn?.config?.autoAssignPlanId) {
      await Rep.findByIdAndUpdate(newRep._id, { planId: conn.config.autoAssignPlanId });
    }
  }
}
```

#### Deals

```typescript
async function upsertDeal(workspaceId: string, deal: NormalizedDeal, hash: string): Promise<void> {
  // Resolve rep from externalId
  const rep = await Rep.findOne({ workspaceId, externalId: deal.repExternalId });
  if (!rep) {
    throw new Error(`Rep not found for externalId: ${deal.repExternalId}`);
  }

  const existing = await Deal.findOne({ workspaceId, externalId: deal.externalId });

  if (existing) {
    // Only overwrite ERP-owned fields
    existing.name = deal.name;
    existing.amount = deal.amount;
    existing.closeDate = deal.closeDate;
    existing.stage = deal.stage;
    existing.currency = deal.currency || existing.currency;
    if (deal.paymentStatus) existing.paymentStatus = deal.paymentStatus;
    existing.notes = deal.notes || existing.notes;
    existing.syncHash = hash;
    existing.lastSyncedAt = new Date();
    existing.metadata = deal.metadata;
    await existing.save();

    // Clawback check if payment status changed to unpaid
    if (deal.paymentStatus === "unpaid" && existing.paymentStatus !== "unpaid") {
      await enforceClawback(existing._id);
    }
  } else {
    await Deal.create({
      workspaceId,
      externalId: deal.externalId,
      sourceSystem: getConnectorName(workspaceId),
      repId: rep._id,
      name: deal.name,
      amount: deal.amount,
      closeDate: deal.closeDate,
      stage: deal.stage,
      period: derivePeriod(deal.closeDate),
      currency: deal.currency || "USD",
      paymentStatus: deal.paymentStatus || "unpaid",
      notes: deal.notes,
      syncHash: hash,
      lastSyncedAt: new Date(),
      metadata: deal.metadata,
    });
  }
}
```

---

## Workspace-Level Locking

To prevent concurrent syncs on the same workspace from corrupting data:

```typescript
// artifacts/api/src/lib/sync/lock.ts

class WorkspaceLock {
  private locks = new Map<string, Promise<void>>();

  async acquire(workspaceId: string): Promise<() => void> {
    // Wait for any existing lock to release
    while (this.locks.has(workspaceId)) {
      await this.locks.get(workspaceId);
    }

    let release: () => void;
    const promise = new Promise<void>((resolve) => { release = resolve; });
    this.locks.set(workspaceId, promise);

    return () => {
      this.locks.delete(workspaceId);
      release!();
    };
  }
}
```

Alternative: Redis-based distributed lock using `ioredis`'s `SET NX EX` (for multi-instance deployments).

---

## Scheduled Sync

BullMQ repeatable jobs that trigger sync on a configurable cadence:

```typescript
// artifacts/api/src/lib/sync/scheduler.ts

async function scheduleSyncsForWorkspace(workspaceId: string, schedule: SyncSchedule): Promise<void> {
  // Remove old repeatable jobs
  await removeRepeatableJobs(`sync-reps-${workspaceId}`);
  await removeRepeatableJobs(`sync-deals-${workspaceId}`);

  // Create new repeatable jobs
  if (schedule.reps === "hourly") {
    await syncRepsQueue.add(`sync-reps-${workspaceId}`, {
      workspaceId,
      connectorName: getConnectorName(workspaceId),
      trigger: "scheduled",
      options: { modifiedAfter: new Date(Date.now() - 3600000) },
    }, { repeat: { every: 3600000 } }); // every hour
  }

  if (schedule.deals === "hourly") {
    await syncDealsQueue.add(`sync-deals-${workspaceId}`, {
      workspaceId,
      connectorName: getConnectorName(workspaceId),
      trigger: "scheduled",
      options: { modifiedAfter: new Date(Date.now() - 3600000) },
    }, { repeat: { every: 3600000 } });
  }

  // Daily full reconciliation (catch-all for missed webhooks)
  await syncDealsQueue.add(`reconcile-deals-${workspaceId}`, {
    workspaceId,
    connectorName: getConnectorName(workspaceId),
    trigger: "scheduled",
    options: { fullSync: true },
  }, { repeat: { pattern: "0 2 * * *" } }); // 2 AM daily
}
```

---

## Webhook Ingress Flow

```
External ERP emits webhook
        │
        ▼
POST /api/integrations/webhooks/:connectorName
        │
        ▼
┌──────────────────────────────────────┐
│ 1. Route to correct connector        │
│    by :connectorName param           │
│                                      │
│ 2. Look up workspace by webhook      │
│    secret or payload metadata        │
│                                      │
│ 3. connector.verifyWebhook(req,      │
│    connection.webhookSecret)          │
│                                      │
│ 4. connector.parseWebhook(body)      │
│    → IngresEvent[]                   │
│                                      │
│ 5. For each event:                   │
│    → enqueue to {ck-webhook-ingress} │
└──────────────────────────────────────┘
        │
        ▼
{ck-webhook-ingress} worker
        │
        ▼
┌──────────────────────────────────────┐
│ 1. Decode event type + externalId    │
│                                      │
│ 2. Route to specific sync queue:     │
│    rep.created/updated  → sync-reps  │
│    deal.created/updated → sync-deals │
│    project.*           → sync-proj   │
│    invoice.*           → sync-inv    │
│    payment.*           → sync-pay    │
│                                      │
│ 3. Sync options:                     │
│    { externalIds: [event.externalId] }│
└──────────────────────────────────────┘
```

---

## Error Handling & Retry

### Error Categories

| Category | Examples | Strategy |
|---|---|---|
| **Transient** | Network timeout, rate limit (HTTP 429), temporary DNS failure | Exponential backoff (1s, 2s, 4s, 8s, 16s) × 5 retries |
| **Auth** | Expired token, revoked credentials (HTTP 401/403) | Set connector status to "error", notify workspace admin, pause sync |
| **Data** | Validation failure, missing required fields, duplicate key | Log to IntegrationLog, skip entity, continue batch |
| **Permanent** | ERP API removed, 404 on known endpoint | Set connector status to "error", halt sync for entity type |

### Retry Strategy (BullMQ)

```typescript
const syncQueueOpts = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: { age: 86400 },   // Keep 24h for debugging
  removeOnFail: { age: 604800 },       // Keep 7 days for debugging
};
```

### Stale Data Detection

- After 3 consecutive failed syncs, mark data as "stale" in the UI
- After 24h without successful sync, send email notification to workspace admin
- After 7 days, show prominent banner in dashboard: "Data may be outdated. Please check your ERP connection."

---

## Egress (Write-Back) Engine

When commission calculations complete, optionally write results back to the ERP:

```typescript
// artifacts/api/src/lib/sync/egress.ts

async function handleEgressWriteBack(runId: string): Promise<void> {
  const run = await CommissionRun.findById(runId).populate("workspaceId");
  const conn = await IntegrationConnection.findOne({ workspaceId: run.workspaceId });

  if (!conn?.writeBackEnabled) return;

  const plugin = pluginRegistry.get(conn.connectorName);
  if (!plugin?.writeBackCommission) return;

  const results = await CommissionResult.find({ runId })
    .populate("repId")
    .populate("dealId");

  const writeBackData: CommissionWriteBack[] = results.map((r) => ({
    dealExternalId: (r.dealId as any).externalId,
    repExternalId: (r.repId as any).externalId,
    commissionAmount: r.commissionAmount,
    commissionRate: r.rateApplied,
    currency: r.currency,
    runId: runId,
  }));

  const writeResults = await plugin.writeBackCommission(
    run.workspaceId.toString(),
    conn.config,
    writeBackData
  );

  // Log write-back results
  for (const wr of writeResults) {
    await IntegrationLog.create({
      workspaceId: run.workspaceId,
      entityType: "commission",
      externalId: wr.externalId,
      action: wr.success ? "writeback_success" : "writeback_failed",
      message: wr.error || "OK",
    });
  }
}
```

---

## Initial Bulk Sync (First Connection)

When a workspace first connects an ERP:

1. **Reps** — Full fetch, create all. Generate portal codes. Send welcome emails (batched).
2. **Deals** — Full fetch (all closed-won). Create all. This may be thousands of records.
3. **Projects/Invoices** — Full fetch (enterprise only).
4. **Progress**: Report progress via BullMQ job progress events, polled by the UI.
5. **Time**: Expected 5-15 minutes for 50K deals with a well-paced ERP API.

The UI shows a progress bar during initial sync:

```
┌─────────────────────────────────────────────────┐
│  Syncing your Odoo data...                      │
│                                                  │
│  ████████████░░░░░░░░░░░░  65%                   │
│                                                  │
│  ✓ Reps: 142 synced                              │
│  ✓ Deals: 12,340 / 18,500                        │
│  ⏳ Invoices: queued                              │
└─────────────────────────────────────────────────┘
```
