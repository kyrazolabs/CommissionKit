import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspacesRouter from "./workspaces";
import repsRouter from "./reps";
import plansRouter from "./plans";
import dealsRouter from "./deals";
import runsRouter from "./runs";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";
import notificationsRouter from "./notifications";
import portalRouter from "./portal";

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

export default router;
