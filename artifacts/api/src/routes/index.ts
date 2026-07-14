import { Router, type IRouter } from "express";
import healthRouter from "./health/routes";
import workspacesRouter from "./workspaces/routes";
import repsRouter from "./reps/routes";
import plansRouter from "./plans/routes";
import dealsRouter from "./deals/routes";
import runsRouter from "./runs/routes";
import dashboardRouter from "./dashboard/routes";
import billingRouter from "./billing/routes";
import notificationsRouter from "./notifications/routes";
import portalRouter from "./portal/routes";
import exportRouter from "./export/routes";
import reportsRouter from "./reports/routes";
import payoutsRouter from "./payouts/routes";
import disputesRouter from "./disputes/routes";
import rolesRouter from "./roles/routes";
import enterpriseRouter from "./enterprise";
import integrationsRouter from "./integrations/routes";
import applyRouter from "./apply/routes";
import leadsRouter from "./leads/routes";
import sampleDataRouter from "./workspace/sample-data.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portalRouter);
router.use(workspacesRouter);
router.use(repsRouter);
router.use(plansRouter);
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

// Sentry integration test route
router.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});

export default router;

