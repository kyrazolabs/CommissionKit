import type { Request, Response, NextFunction, RequestHandler } from "express";
import { auditContext } from "../lib/audit-context";
import { auth } from "../lib/auth";

function extractIp(req: Request): string | undefined {
  const raw = req.headers["x-forwarded-for"];
  if (typeof raw === "string") {
    return raw.split(",")[0].trim();
  }
  if (Array.isArray(raw)) {
    return raw[0].trim();
  }
  return req.socket?.remoteAddress ?? req.ip ?? undefined;
}

export const auditContextMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const baseCtx: import("../lib/audit-context").AuditContext = {
    ipAddress: extractIp(req),
    userAgent: req.headers["user-agent"] as string | undefined,
  };

  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      baseCtx.userId = session.user.id;
      baseCtx.userEmail = session.user.email;
      baseCtx.userName = session.user.name;
    }
  } catch {
    // Ignore auth errors — request middleware should not fail authentication.
  }

  auditContext.run(baseCtx, () => {
    next();
  });
};
