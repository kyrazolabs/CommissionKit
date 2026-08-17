import { Workspace } from "@workspace/db";
import { type NextFunction, type Response, Router } from "express";
import { Types } from "mongoose";
import type { AuthenticatedRequest } from "../../middleware/auth";

const router = Router();

router.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const raw = req.headers["x-workspace-id"];
  const workspaceId = Array.isArray(raw) ? raw[0] : (raw ?? "");
  if (!workspaceId) {
    res.status(400).json({ error: "X-Workspace-ID header is required" });
    return;
  }

  const ws = await Workspace.findById(new Types.ObjectId(workspaceId));
  if (!ws) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const engine = (ws as any)?.commissionEngine || "standard";

  if (engine === "aissol") {
    const { default: aissolRouter } = await import("./aissol/routes");
    aissolRouter(req, res, next);
  } else {
    res.status(404).json({
      error: `No enterprise features for commission engine "${engine}"`,
    });
  }
});

export default router;
