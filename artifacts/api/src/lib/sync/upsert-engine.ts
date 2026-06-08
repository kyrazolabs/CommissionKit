import { createHash } from "crypto";
import { Rep, Deal, IntegrationLog } from "@workspace/db";
import type { NormalizedRep, NormalizedDeal } from "@workspace/plugins-core";
import { logger } from "../logger";
import * as Sentry from "@sentry/bun";

// ─── Sync Stats ─────────────────────────────────────────────────────

export interface SyncStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export function emptyStats(): SyncStats {
  return { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };
}

function computeHash(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

// ─── Stage normalization ─────────────────────────────────────────────

const VALID_STAGES = ["closed_won", "closed_lost", "pending"] as const;

function normalizeStage(raw: string): string {
  const lower = raw.toLowerCase().trim();

  // Direct match
  if (VALID_STAGES.includes(raw as any)) return raw;

  // Common aliases from external systems
  if (lower === "won" || lower === "closed won" || lower === "sale" || lower === "done") return "closed_won";
  if (lower === "lost" || lower === "closed lost" || lower === "cancel" || lower === "cancelled") return "closed_lost";
  if (lower === "draft" || lower === "sent" || lower === "negotiation" || lower === "open") return "pending";

  // Fallback
  return "closed_won";
}

// ─── Rep Upsert ─────────────────────────────────────────────────────

export async function upsertReps(
  workspaceId: string,
  connectorName: string,
  reps: NormalizedRep[],
  syncId?: string,
): Promise<SyncStats> {
  const stats = emptyStats();
  stats.total = reps.length;

  for (const rep of reps) {
    try {
      const incomingHash = computeHash({
        name: rep.name,
        email: rep.email,
        role: rep.role,
      });

      const existing = await Rep.findOne({
        workspaceId,
        sourceSystem: connectorName,
        externalId: rep.externalId,
      });

      if (existing) {
        if (existing.syncHash === incomingHash) {
          stats.skipped++;
          continue;
        }

        existing.name = rep.name;
        existing.email = rep.email;
        if (rep.role) existing.role = rep.role;
        existing.syncHash = incomingHash;
        existing.lastSyncedAt = new Date();
        if (rep.metadata) existing.metadata = rep.metadata;
        await existing.save();
        stats.updated++;

        await IntegrationLog.create({
          workspaceId,
          syncId: syncId || undefined,
          connectorName,
          entityType: "reps",
          externalId: rep.externalId,
          action: "updated",
          message: "Updated from connector",
        });
      } else {
        await Rep.create({
          workspaceId,
          sourceSystem: connectorName,
          externalId: rep.externalId,
          name: rep.name,
          email: rep.email,
          role: rep.role || "Sales Rep",
          syncHash: incomingHash,
          lastSyncedAt: new Date(),
          metadata: rep.metadata,
        });
        stats.created++;

        await IntegrationLog.create({
          workspaceId,
          syncId: syncId || undefined,
          connectorName,
          entityType: "reps",
          externalId: rep.externalId,
          action: "created",
          message: "Created from connector",
        });
      }
    } catch (err: any) {
      stats.failed++;
      logger.error({ err, externalId: rep.externalId, connectorName }, "[SyncEngine] Failed to upsert rep");
      Sentry.captureException(err, {
        tags: { phase: "upsert-rep", connectorName },
        extra: { externalId: rep.externalId, workspaceId },
      });

      await IntegrationLog.create({
        workspaceId,
        syncId: syncId || undefined,
        connectorName,
        entityType: "reps",
        externalId: rep.externalId,
        action: "failed",
        message: err.message || "Unknown error",
      }).catch(() => {});
    }
  }

  return stats;
}

// ─── Deal Upsert ────────────────────────────────────────────────────

export async function upsertDeals(
  workspaceId: string,
  connectorName: string,
  deals: NormalizedDeal[],
  syncId?: string,
): Promise<SyncStats> {
  const stats = emptyStats();
  stats.total = deals.length;

  for (const deal of deals) {
    try {
      const incomingHash = computeHash({
        name: deal.name,
        amount: deal.amount,
        closeDate: deal.closeDate,
        stage: normalizeStage(deal.stage),
        currency: deal.currency,
        paymentStatus: deal.paymentStatus,
        notes: deal.notes,
        repExternalId: deal.repExternalId,
      });

      // Resolve rep by externalId + sourceSystem
      const rep = await Rep.findOne({
        workspaceId,
        sourceSystem: connectorName,
        externalId: deal.repExternalId,
      });

      if (!rep) {
        stats.failed++;
        logger.error(
          { dealExternalId: deal.externalId, repExternalId: deal.repExternalId, connectorName },
          "[SyncEngine] Rep not found for deal — sync reps first",
        );
        Sentry.captureMessage("Rep not found for deal", {
          level: "warning",
          tags: { phase: "upsert-deal", connectorName },
          extra: { dealExternalId: deal.externalId, repExternalId: deal.repExternalId, workspaceId },
        });
        await IntegrationLog.create({
          workspaceId,
          syncId: syncId || undefined,
          connectorName,
          entityType: "deals",
          externalId: deal.externalId,
          action: "failed",
          message: `Rep not found for externalId: ${deal.repExternalId}`,
        }).catch(() => {});
        continue;
      }

      const existing = await Deal.findOne({
        workspaceId,
        sourceSystem: connectorName,
        externalId: deal.externalId,
      });

      if (existing) {
        if (existing.syncHash === incomingHash) {
          stats.skipped++;
          continue;
        }

        existing.name = deal.name;
        existing.amount = deal.amount;
        existing.closeDate = String(deal.closeDate.toISOString());
        existing.stage = deal.stage;
        existing.currency = deal.currency || existing.currency;
        if (deal.paymentStatus) existing.paymentStatus = deal.paymentStatus;
        existing.notes = deal.notes || existing.notes;
        existing.repId = rep._id;
        existing.syncHash = incomingHash;
        existing.lastSyncedAt = new Date();
        if (deal.metadata) existing.metadata = deal.metadata;
        await existing.save();
        stats.updated++;

        await IntegrationLog.create({
          workspaceId,
          syncId: syncId || undefined,
          connectorName,
          entityType: "deals",
          externalId: deal.externalId,
          action: "updated",
          message: "Updated from connector",
        });
      } else {
        const period = derivePeriod(deal.closeDate);

        await Deal.create({
          workspaceId,
          sourceSystem: connectorName,
          externalId: deal.externalId,
          repId: rep._id,
          name: deal.name,
          amount: deal.amount,
          closeDate: String(deal.closeDate.toISOString()),
          period,
          stage: normalizeStage(deal.stage),
          currency: deal.currency || "USD",
          paymentStatus: deal.paymentStatus || "unpaid",
          notes: deal.notes,
          syncHash: incomingHash,
          lastSyncedAt: new Date(),
          metadata: deal.metadata,
        });
        stats.created++;

        await IntegrationLog.create({
          workspaceId,
          syncId: syncId || undefined,
          connectorName,
          entityType: "deals",
          externalId: deal.externalId,
          action: "created",
          message: "Created from connector",
        });
      }
    } catch (err: any) {
      stats.failed++;
      logger.error({ err, externalId: deal.externalId, connectorName }, "[SyncEngine] Failed to upsert deal");
      Sentry.captureException(err, {
        tags: { phase: "upsert-deal", connectorName },
        extra: { externalId: deal.externalId, workspaceId },
      });

      await IntegrationLog.create({
        workspaceId,
        syncId: syncId || undefined,
        connectorName,
        entityType: "deals",
        externalId: deal.externalId,
        action: "failed",
        message: err.message || "Unknown error",
        details: { error: err.message },
      }).catch(() => {});
    }
  }

  return stats;
}

function derivePeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
