import { Router } from "express";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../../middleware/auth";
import { seedSampleData, clearSampleData } from "../../lib/sample-data";
import { logger } from "../../lib/logger";
import { logAudit } from "../../lib/audit";

const router = Router();

router.post(
  "/sample-data",
  ...requireWorkspaceMember("admin"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
      // Sample-data seeding bypasses rep/plan limits so Free/Trial workspaces
      // can load the full demo dataset. The workspace is flagged
      // sampleDataLoaded = true inside the seeding transaction.
      const result = await seedSampleData(req.workspaceId!);
      logAudit("sample_data_loaded", "sample_data", {
        workspaceId: req.workspaceId,
        metadata: { counts: result.counts },
      }).catch(() => {});
      res.status(201).json(result);
    } catch (err: any) {
      if (err.status === 409 || err.alreadySeeded) {
        res.status(409).json({ error: "Sample data already loaded", alreadySeeded: true });
        return;
      }
      logger.error({ err, workspaceId: req.workspaceId }, "[SampleData] POST failed");
      res.status(500).json({ error: "Failed to load sample data" });
    }
  },
);

router.delete(
  "/sample-data",
  ...requireWorkspaceMember("admin"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
      const result = await clearSampleData(req.workspaceId!);
      logAudit("sample_data_deleted", "sample_data", {
        workspaceId: req.workspaceId,
        metadata: { removed: result.removed },
      }).catch(() => {});
      res.status(200).json(result);
    } catch (err: any) {
      logger.error({ err, workspaceId: req.workspaceId }, "[SampleData] DELETE failed");
      res.status(500).json({ error: "Failed to clear sample data" });
    }
  },
);

export default router;
