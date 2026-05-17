import pino from "pino";
import fs from "fs";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const logFilePath = process.env.LOG_FILE_PATH ?? "./logs/app.log";

// Ensure the local log directory exists on startup
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Set up multi-stream transport:
// 1. JSON file destination for permanent log persistence and S3 ingestion
// 2. Stdout destination (raw JSON in production, colorized pino-pretty in development)
const targets = [
  {
    target: "pino/file",
    options: { destination: logFilePath, mkdir: true },
    level: process.env.LOG_LEVEL ?? "info",
  },
  {
    target: isProduction ? "pino/file" : "pino-pretty",
    options: isProduction ? { destination: 1 } : { colorize: true },
    level: process.env.LOG_LEVEL ?? "info",
  },
];

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
  },
  pino.transport({ targets: targets as any })
);
