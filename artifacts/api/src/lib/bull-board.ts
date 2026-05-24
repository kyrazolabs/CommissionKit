// src/lib/bull-board.ts

import { createRequire } from "node:module";
import path from "path";

import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

import { calcWorker } from "../workers/calc-worker";
import { Queue } from "bullmq";

import {
  COMMISSION_CALC_QUEUE,
  getRedisClient,
} from "@workspace/queue";
import { logger } from "./logger";

const _require = createRequire(import.meta.url);
const bullBoardUiPath = path.dirname(
  _require.resolve("@bull-board/ui/package.json"),
);

const BULL_BOARD_USERNAME = process.env.BULL_BOARD_USERNAME;
const BULL_BOARD_PASSWORD = process.env.BULL_BOARD_PASSWORD;

if (!BULL_BOARD_USERNAME || !BULL_BOARD_PASSWORD) {
  throw new Error(
    "Missing BULL_BOARD_USERNAME or BULL_BOARD_PASSWORD environment variables",
  );
}

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

export const commissionQueue = new Queue(COMMISSION_CALC_QUEUE, {
  connection: getRedisClient(),
  prefix: "ck",
});

createBullBoard({
  queues: [
    new BullMQAdapter(commissionQueue, {
      readOnlyMode: process.env.NODE_ENV === "production",
    }),
  ],
  serverAdapter,
  options: {
    uiBasePath: bullBoardUiPath,
  },
});

/**
 * Secure Bull Board middleware
 */
export function secureBullBoard(req: any, res: any, next: any) {
  // Optional IP allowlist
  const allowedIps = (
    process.env.BULL_BOARD_ALLOWED_IPS || ""
  )
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  const clientIp =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  if (
    allowedIps.length > 0 &&
    !allowedIps.includes(clientIp)
  ) {
    logger.warn(
      {
        ip: clientIp,
      },
      "[BullBoard] Blocked IP access attempt",
    );

    return res.status(403).json({
      error: "Forbidden",
      message: "Your IP is not allowed",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Basic ")) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Bull Board"',
    );

    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  const base64Credentials = authHeader.split(" ")[1];

  const credentials = Buffer.from(
    base64Credentials,
    "base64",
  ).toString("utf8");

  const [username, password] = credentials.split(":");

  const validUser =
    username === BULL_BOARD_USERNAME;

  const validPassword =
    password === BULL_BOARD_PASSWORD;

  if (!validUser || !validPassword) {
    logger.warn(
      {
        ip: clientIp,
        username,
      },
      "[BullBoard] Failed login attempt",
    );

    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Bull Board"',
    );

    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid credentials",
    });
  }

  next();
}

export { serverAdapter };