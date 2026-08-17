import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getRedisClient, LOGS_FLUSH_QUEUE } from "@workspace/queue";
import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
  defaultJobOptions: {
    removeOnComplete: {
      age: 60 * 60 * 24 * 7, // 7 days
      count: 10000,
    },

    removeOnFail: {
      age: 60 * 60 * 24 * 30, // 30 days
      count: 5000,
    },

    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
};

// Initialize S3 Client from env variables
const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  endpoint: process.env.S3_ENDPOINT || undefined,
  // forcePathStyle is required for local dev environments (like MinIO) or Cloudflare R2 / DO Spaces
  forcePathStyle: !!process.env.S3_ENDPOINT,
});

/**
 * BullMQ Worker executing the logs rotation, file truncation, and S3 upload.
 */
export const logsWorker = new Worker(
  LOGS_FLUSH_QUEUE,
  async (job) => {
    logger.info(`[Worker:Logs] Starting logs flush job: ${job.id}`);

    const logFilePath = process.env.LOG_FILE_PATH ?? "./logs/app.log";

    if (!fs.existsSync(logFilePath)) {
      logger.info(`[Worker:Logs] Log file does not exist at ${logFilePath}. Skipping.`);
      return { status: "skipped", reason: "file_not_found" };
    }

    const stats = fs.statSync(logFilePath);
    if (stats.size === 0) {
      logger.info("[Worker:Logs] Log file is empty. Skipping flush.");
      return { status: "skipped", reason: "empty_file" };
    }

    const tempFilePath = `${logFilePath}.tmp`;

    try {
      // 1. Create a safe copy of the active log file
      fs.copyFileSync(logFilePath, tempFilePath);

      // 2. Truncate the active log file to 0 bytes instantly.
      // This is inode-safe; pino holds open file descriptor and continues writing from byte 0.
      fs.truncateSync(logFilePath, 0);
      logger.info("[Worker:Logs] Rotated active log file and truncated safely.");

      // 3. Read the temporary log content
      const fileContent = fs.readFileSync(tempFilePath);

      const bucketName = process.env.S3_BUCKET_NAME;
      if (!bucketName) {
        throw new Error("S3_BUCKET_NAME environment variable is not defined");
      }

      // Generate a structured key name using ISO timestamp
      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const key = `logs/app-${timestamp}.log`;

      logger.info(
        `[Worker:Logs] Uploading logs to S3 bucket "${bucketName}" under key "${key}"...`,
      );

      // 4. Send upload request to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: "application/json",
        }),
      );

      logger.info(`[Worker:Logs] Successfully uploaded log file to S3: ${key}`);

      // 5. Delete the temporary log copy
      fs.unlinkSync(tempFilePath);

      return { status: "completed", key };
    } catch (err: any) {
      logger.error({ err }, "[Worker:Logs] Failed to flush and upload logs to S3");

      // Clean up temp file on failure if it exists
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupErr) {
          logger.error(
            { err: cleanupErr },
            "[Worker:Logs] Failed to delete temp log copy after failed upload",
          );
        }
      }
      throw err;
    }
  },
  { ...WORKER_OPTS, concurrency: 1 },
);

// Register event handlers
logsWorker.on("completed", (job) => {
  logger.info(`[Worker:Logs] Logs flush job ${job?.id} completed successfully`);
});

logsWorker.on("failed", (job, err) => {
  if (job) {
    logger.error(`[Worker:Logs] Logs flush job ${job.id} failed: ${err.message}`);
  }
});

logsWorker.on("error", (err) => {
  logger.error({ err }, "[Worker:Logs] Worker error occurred");
});
