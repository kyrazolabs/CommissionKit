import { Router } from "express";
import { ApiKey, createApiKeySchema } from "@workspace/db";
import { Types } from "mongoose";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../../middleware/auth";
import { generateApiKey, hashKey } from "../../lib/api-keys";
import { logger } from "../../lib/logger";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get(
  "/api-keys",
  ...requireWorkspaceMember("admin"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const keys = await ApiKey.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isActive: true,
    })
      .select("-keyHash")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      data: keys.map((k: any) => ({
        id: k._id,
        name: k.name,
        prefix: k.prefix,
        permissions: k.permissions,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
    });
  },
);

router.post(
  "/api-keys",
  ...requireWorkspaceMember("admin"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const body = createApiKeySchema.parse(req.body);
    const { raw, hash, prefix } = generateApiKey();

    const key = await ApiKey.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name: body.name,
      keyHash: hash,
      prefix,
      permissions: body.permissions,
      createdBy: new Types.ObjectId(req.userId!),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    logger.info({ keyId: key._id, prefix, workspaceId }, "API key created");

    logAudit("create", "api_key", {
      workspaceId: req.workspaceId!,
      resourceId: String(key._id),
      metadata: { name: key.name, prefix: key.prefix },
    });

    res.status(201).json({
      id: key._id,
      name: key.name,
      key: raw,
      prefix: key.prefix,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    });
  },
);

router.delete(
  "/api-keys/:keyId",
  ...requireWorkspaceMember("admin"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const keyId = req.params.keyId as string;

    const key = await ApiKey.findOneAndUpdate(
      {
        _id: new Types.ObjectId(keyId),
        workspaceId: new Types.ObjectId(workspaceId),
        isActive: true,
      },
      { isActive: false },
    );

    if (!key) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    logger.info({ keyId, prefix: key.prefix, workspaceId }, "API key revoked");

    logAudit("delete", "api_key", {
      workspaceId: req.workspaceId!,
      resourceId: keyId,
      metadata: { name: key.name, prefix: key.prefix },
    });

    res.status(204).send();
  },
);

export default router;
