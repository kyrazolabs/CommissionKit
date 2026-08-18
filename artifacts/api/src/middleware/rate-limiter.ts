import { getRedisClient } from "@workspace/queue";
import type { NextFunction, Request, Response } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { logger } from "../lib/logger";

const redisClient = getRedisClient();

const defaultLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:default",
  points: 300,
  duration: 60,
  blockDuration: 0,
});

const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:auth",
  points: 30,
  duration: 60,
  blockDuration: 60,
});

const webhookLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:webhook",
  points: 120,
  duration: 60,
  blockDuration: 0,
});

const applyLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:apply",
  points: 5,
  duration: 3600, // 1 hour
  blockDuration: 3600, // block for 1 hour after exceeding
});

const leadLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:lead",
  points: 5,
  duration: 3600, // 1 hour
  blockDuration: 3600, // block for 1 hour after exceeding
});

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].split(",")[0].trim();
  return req.ip ?? "unknown";
}

async function consumeRateLimit(
  limiter: RateLimiterRedis,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const key = getClientIp(req);
    const result = await limiter.consume(key);
    res.setHeader("X-RateLimit-Limit", limiter.points);
    res.setHeader("X-RateLimit-Remaining", result.remainingPoints);
    res.setHeader("X-RateLimit-Reset", new Date(Date.now() + result.msBeforeNext).toISOString());
    next();
  } catch (err: any) {
    if (err?.remainingPoints !== undefined) {
      res.setHeader("X-RateLimit-Limit", limiter.points);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", new Date(Date.now() + err.msBeforeNext).toISOString());
      res.setHeader("Retry-After", Math.ceil(err.msBeforeNext / 1000));
      res.status(429).json({
        error: "TooManyRequests",
        message: "Rate limit exceeded. Please slow down.",
      });
      return;
    }
    logger.error({ err, ip: getClientIp(req) }, "[RateLimiter] Redis error — allowing request");
    next();
  }
}

export function defaultRateLimit(req: Request, res: Response, next: NextFunction): void {
  consumeRateLimit(defaultLimiter, req, res, next);
}

export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  consumeRateLimit(authLimiter, req, res, next);
}

export function webhookRateLimit(req: Request, res: Response, next: NextFunction): void {
  consumeRateLimit(webhookLimiter, req, res, next);
}

export function applyRateLimit(req: Request, res: Response, next: NextFunction): void {
  consumeRateLimit(applyLimiter, req, res, next);
}

export function leadRateLimit(req: Request, res: Response, next: NextFunction): void {
  consumeRateLimit(leadLimiter, req, res, next);
}
