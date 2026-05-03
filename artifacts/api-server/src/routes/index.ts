import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspacesRouter from "./workspaces";
import repsRouter from "./reps";
import plansRouter from "./plans";
import dealsRouter from "./deals";
import runsRouter from "./runs";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspacesRouter);
router.use(repsRouter);
router.use(plansRouter);
router.use(dealsRouter);
router.use(runsRouter);
router.use(dashboardRouter);
router.use("/billing", billingRouter);

export default router;
