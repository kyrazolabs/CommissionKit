import express, { type Express } from "express";
import * as Sentry from "@sentry/bun";
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

// Sentry error handler registered after all controllers and before other error middleware
Sentry.setupExpressErrorHandler(app);

// Global Error Handling Middleware
// Express requires all 4 arguments (err, req, res, next) to recognize it as an error-handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  // Handle Zod Validation Schema Validation Errors
  if (err.name === "ZodError" || err.issues) {
    logger.warn(
      { err: err.message, issues: err.issues, url: req.url, method: req.method },
      "[Express] Validation failed"
    );
    res.status(400).json({
      error: "ValidationError",
      message: "The request payload or parameters failed validation.",
      details: err.issues || err.message,
    });
    return;
  }

  // Handle all other unexpected server runtime exceptions
  logger.error(
    { err, url: req.url, method: req.method },
    `[Express] Unhandled error during request execution: ${err.message || String(err)}`
  );

  res.status(err.status || err.statusCode || 500).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred on the server.",
  });
});

export default app;

