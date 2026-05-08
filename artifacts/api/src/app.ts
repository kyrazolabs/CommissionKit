import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { toNodeHandler } from "better-auth/node";
import router from "./routes";
import { logger } from "./lib/logger";
import { auth } from "./lib/auth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
// Raw body for Stripe webhook signature verification
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.all(/\/api\/auth\/.*/, toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

export default app;
