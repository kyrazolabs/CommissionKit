import { type IRouter, Router } from "express";
import apiKeysRouter from "./api-keys/routes";
import applyRouter from "./apply/routes";
import auditLogRouter from "./audit-log/routes";
import billingRouter from "./billing/routes";
import dashboardRouter from "./dashboard/routes";
import dealsRouter from "./deals/routes";
import disputesRouter from "./disputes/routes";
import enterpriseRouter from "./enterprise";
import exportRouter from "./export/routes";
import healthRouter from "./health/routes";
import integrationsRouter from "./integrations/routes";
import leadsRouter from "./leads/routes";
import mcpRouter from "./mcp";
import notificationsRouter from "./notifications/routes";
import payoutsRouter from "./payouts/routes";
import plansRouter from "./plans/routes";
import portalRouter from "./portal/routes";
import productsRouter from "./products/routes";
import reportsRouter from "./reports/routes";
import repsRouter from "./reps/routes";
import rolesRouter from "./roles/routes";
import runsRouter from "./runs/routes";
import supportRouter from "./support/routes";
import sampleDataRouter from "./workspace/sample-data.routes";
import workspacesRouter from "./workspaces/routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portalRouter);
router.use(workspacesRouter);
router.use(repsRouter);
router.use(plansRouter);
router.use(productsRouter);
router.use(dealsRouter);
router.use(runsRouter);
router.use(dashboardRouter);
router.use("/billing", billingRouter);
router.use(notificationsRouter);
router.use(exportRouter);
router.use("/reports", reportsRouter);
router.use("/payouts", payoutsRouter);
router.use("/disputes", disputesRouter);
router.use(rolesRouter);
router.use("/enterprise", enterpriseRouter);
router.use("/integrations", integrationsRouter);
router.use(applyRouter);
router.use(leadsRouter);
router.use("/workspace", sampleDataRouter);
router.use("/audit-log", auditLogRouter);
router.use(apiKeysRouter);
router.use(supportRouter);
router.use(mcpRouter);

// Sentry integration test route
router.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});

export default router;
