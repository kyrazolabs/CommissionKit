import { Router } from "express";
import { Rep, Plan, Workspace } from "@workspace/db";
import { Types } from "mongoose";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { CreateRepBody, UpdateRepBody, GetRepParams, UpdateRepParams, DeleteRepParams, SendPortalLinkParams, ListRepsQueryParams } from "@workspace/api-zod";
import { requirePermission, type AuthenticatedRequest } from "../../middleware/auth";
import { checkLimits } from "../../lib/limits";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { repPortalTemplate } from "@workspace/email-templates";
import { auth } from "../../lib/auth";
import { logger } from "../../lib/logger";

const router = Router();

/** Generates a unique 24-char hex portal access code */
function generateAccessCode(): string {
  return randomBytes(12).toString("hex");
}

/** Builds the public portal URL for a given access code */
function portalUrl(accessCode: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/portal/${accessCode}`;
}

/** Sends the portal invite email to a rep (fire-and-forget) */
async function sendPortalLinkEmail(
  rep: { name: string; email: string; portalAccessCode: string; portalUsername: string; portalPassword?: string },
  workspaceName: string
): Promise<void> {
  try {
    const html = repPortalTemplate({
      repName: rep.name,
      workspaceName,
      portalUrl: portalUrl(rep.portalAccessCode),
      portalUsername: rep.portalUsername,
      portalPassword: rep.portalPassword,
    });
    await sendMediumPriorityEmail({
      to: rep.email,
      subject: `${workspaceName} has shared your commission portal`,
      html,
      meta: { type: "rep_portal_link", repEmail: rep.email },
    });
  } catch (err) {
    console.error("[Reps] Failed to send portal link email:", err);
  }
}

router.get("/reps", ...requirePermission("reps", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const query = ListRepsQueryParams.parse(req.query);
  const conditions: any = { workspaceId: new Types.ObjectId(workspaceId) };

  if (query.search !== undefined && query.search.trim() !== "") {
    const searchRegex = new RegExp(query.search.trim(), "i");
    conditions.$or = [
      { name: searchRegex },
      { email: searchRegex },
    ];
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));

  const [reps, total] = await Promise.all([
    Rep.find(conditions).populate('planId').sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
    Rep.countDocuments(conditions),
  ]);

  res.json({
    data: reps.map((r) => ({
      id: r._id,
      name: r.name,
      email: r.email,
      role: r.role,
      planId: r.planId ? (r.planId as any)._id ?? r.planId : null,
      planName: r.planId ? (r.planId as any).name ?? null : null,
      portalAccessCode: r.portalAccessCode ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.post("/reps", ...requirePermission("reps", "create"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;

  const limits = await checkLimits(workspaceId, "reps");
  if (!limits.allowed) {
    res.status(403).json({
      error: `You have reached the limit of ${limits.limit} sales reps for your current plan.`
    });
    return;
  }

  const body = CreateRepBody.parse(req.body);

  // Generate a unique portal access code
  const accessCode = generateAccessCode();

  const rep = await Rep.create({
    workspaceId: new Types.ObjectId(workspaceId),
    name: body.name,
    email: body.email,
    role: body.role,
    planId: body.planId ? new Types.ObjectId(body.planId) : null,
    portalAccessCode: accessCode,
  });

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findById(rep.planId);
    planName = plan?.name ?? null;
  }

  // Send the portal link email (non-blocking)
  const workspace = await Workspace.findById(workspaceId);
  const workspaceName = workspace?.name ?? "Your team";

  // Ensure the rep has a unique readable username
  let username = rep.portalUsername;
  if (!username) {
    let baseUsername = rep.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    if (!baseUsername) baseUsername = "user";

    // Check if base username is already taken globally
    let isUnique = false;
    let suffix = "";
    while (!isUnique) {
      const candidate = suffix ? `${baseUsername}.${suffix}` : baseUsername;
      const existing = await Rep.findOne({ portalUsername: candidate });
      if (!existing) {
        username = candidate;
        isUnique = true;
      } else {
        // If taken, append a random 3-character hex string
        suffix = randomBytes(2).toString("hex").substring(0, 3);
      }
    }

    rep.portalUsername = username;
    await rep.save();
  }

  // Generate a random temporary password
  const tempPassword = randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
  const portalEmail = `${username}@portal.commissionkit.io`;

  // Create or Update the Better Auth user
  try {
    const db = mongoose.connection.db;
    if (db) {
      // Find any existing auth user linked to this rep (by repId) or using this email
      const existingUser = await db.collection("user").findOne({
        $or: [
          { repId: rep._id.toString() },
          { email: portalEmail }
        ]
      });

      if (existingUser) {
        logger.info({ portalEmail, repId: rep._id }, "Found existing auth user, clearing old records...");
        const actualId = existingUser.id || existingUser._id.toString();
        // Delete old user, accounts, and sessions to avoid duplicate email conflicts
        await db.collection("user").deleteOne({ _id: existingUser._id });
        await db.collection("account").deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
        await db.collection("session").deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
      }
    }

    logger.info({ portalEmail, repId: rep._id }, "Creating fresh portal user in Better Auth");

    // Use signUpEmail to properly hash the password and create all necessary records
    await auth.api.signUpEmail({
      headers: req.headers,
      body: {
        email: portalEmail,
        password: tempPassword,
        name: rep.name,
        mustChangePassword: true,
        repId: rep._id.toString(),
      }
    });

    logger.info({ portalEmail }, "Successfully synced portal user to Better Auth");
  } catch (err: any) {
    logger.error({
      err: err.message,
      portalEmail,
      repId: rep._id
    }, "Failed to sync portal user to Better Auth");
    // This is the cause of login failures if it hits here
  }
  sendPortalLinkEmail(
    {
      name: rep.name,
      email: rep.email,
      portalAccessCode: rep.portalAccessCode ?? accessCode,
      portalUsername: username as string,
      portalPassword: tempPassword
    },
    workspaceName
  );

  res.status(201).json({
    id: rep._id,
    name: rep.name,
    email: rep.email,
    role: rep.role,
    planId: rep.planId,
    planName,
    portalAccessCode: accessCode,
    createdAt: rep.createdAt.toISOString(),
  });
});

router.get("/reps/:id", ...requirePermission("reps", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = GetRepParams.parse(req.params);
  const rep = await Rep.findOne({
    _id: new Types.ObjectId(id),
    workspaceId: new Types.ObjectId(workspaceId),
  }).populate('planId');

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }
  res.json({
    id: rep._id,
    name: rep.name,
    email: rep.email,
    role: rep.role,
    planId: rep.planId ? (rep.planId as any)._id ?? rep.planId : null,
    planName: rep.planId ? (rep.planId as any).name ?? null : null,
    portalAccessCode: rep.portalAccessCode ?? null,
    createdAt: rep.createdAt.toISOString(),
  });
});

router.put("/reps/:id", ...requirePermission("reps", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = UpdateRepParams.parse(req.params);
  const body = UpdateRepBody.parse(req.body);
  const rep = await Rep.findOneAndUpdate(
    { _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) },
    {
      name: body.name,
      email: body.email,
      role: body.role,
      planId: body.planId ? new Types.ObjectId(body.planId) : null,
      // We no longer save password in the Rep model
    },
    { new: true }
  );

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findById(rep.planId);
    planName = plan?.name ?? null;
  }

  res.json({
    id: rep._id,
    name: rep.name,
    email: rep.email,
    role: rep.role,
    planId: rep.planId,
    planName,
    portalAccessCode: rep.portalAccessCode ?? null,
    createdAt: rep.createdAt.toISOString(),
  });
});

router.delete("/reps/:id", ...requirePermission("reps", "delete"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = DeleteRepParams.parse(req.params);
  await Rep.deleteOne({ _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) });
  res.status(204).send();
});

/**
 * POST /reps/:id/send-portal-link
 * (Re)sends the portal link email to the rep. Rotates the access code on resend.
 * Admin only.
 */
router.post("/reps/:id/send-portal-link", ...requirePermission("reps", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = SendPortalLinkParams.parse(req.params);

  const rep = await Rep.findOne({
    _id: new Types.ObjectId(id),
    workspaceId: new Types.ObjectId(workspaceId)
  });

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  // Only generate a new access code if one doesn't exist yet
  // This prevents breaking existing links just because an invite was resent
  let newCode = rep.portalAccessCode;
  if (!newCode) {
    newCode = generateAccessCode();
    rep.portalAccessCode = newCode;
    await rep.save();
  }

  // Ensure the rep has a unique readable username
  let username = rep.portalUsername;
  if (!username) {
    let baseUsername = rep.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    if (!baseUsername) baseUsername = "user";

    // Check if base username is already taken globally
    let isUnique = false;
    let suffix = "";
    while (!isUnique) {
      const candidate = suffix ? `${baseUsername}.${suffix}` : baseUsername;
      const existing = await Rep.findOne({ portalUsername: candidate });
      if (!existing) {
        username = candidate;
        isUnique = true;
      } else {
        // If taken, append a random 3-character hex string
        suffix = randomBytes(2).toString("hex").substring(0, 3);
      }
    }

    rep.portalUsername = username;
    await rep.save();
  }

  // Generate a random temporary password
  const tempPassword = randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
  const portalEmail = `${username}@portal.commissionkit.io`;

  // Create or Update the Better Auth user
  try {
    const db = mongoose.connection.db;
    if (db) {
      // Find any existing auth user linked to this rep (by repId) or using this email
      const existingUser = await db.collection("user").findOne({
        $or: [
          { repId: rep._id.toString() },
          { email: portalEmail }
        ]
      });

      if (existingUser) {
        logger.info({ portalEmail, repId: rep._id }, "Found existing auth user, clearing old records...");
        const actualId = existingUser.id || existingUser._id.toString();
        // Delete old user, accounts, and sessions to avoid duplicate email conflicts
        await db.collection("user").deleteOne({ _id: existingUser._id });
        await db.collection("account").deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
        await db.collection("session").deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
      }
    }

    logger.info({ portalEmail, repId: rep._id }, "Creating fresh portal user in Better Auth");

    // Use signUpEmail to properly hash the password and create all necessary records
    await auth.api.signUpEmail({
      headers: req.headers,
      body: {
        email: portalEmail,
        password: tempPassword,
        name: rep.name,
        mustChangePassword: true,
        repId: rep._id.toString(),
      }
    });

    logger.info({ portalEmail }, "Successfully synced portal user to Better Auth");
  } catch (err: any) {
    logger.error({
      err: err.message,
      portalEmail,
      repId: rep._id
    }, "Failed to sync portal user to Better Auth");
    // This is the cause of login failures if it hits here
  }

  const workspace = await Workspace.findById(workspaceId);
  const workspaceName = workspace?.name ?? "Your team";

  await sendPortalLinkEmail(
    {
      name: rep.name,
      email: rep.email,
      portalAccessCode: newCode,
      portalUsername: username as string,
      portalPassword: tempPassword
    },
    workspaceName
  );

  res.json({ ok: true, portalAccessCode: newCode });
});

export default router;
