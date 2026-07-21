import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import mongoose, { Schema, model, Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearCollections } from "../../../../artifacts/api/test/setup-db";
import type { AuditEventPayload } from "./audit-dispatcher";

let capturedEvents: AuditEventPayload[] = [];

// Mock the dispatcher BEFORE importing the plugin module.
mock.module("./audit-dispatcher", () => ({
  dispatchAuditEvent: (event: AuditEventPayload) => {
    capturedEvents.push(event);
  },
  setAuditDispatcher: () => {},
  setAuditContextProvider: () => {},
  getAuditContext: () => ({
    userId: "u1",
    userName: "Admin",
    userEmail: "admin@test.com",
    workspaceId: "ws1",
    ipAddress: "127.0.0.1",
  }),
}));

let TestModel: mongoose.Model<any>;

beforeAll(async () => {
  await setupTestDB();
  const db = await import("@workspace/db");
  await db.connectDB();

  const { auditPlugin } = await import("./audit");
  const TestSchema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    amount: { type: Number },
    secretKey: { type: String },
  });
  TestSchema.plugin(auditPlugin({ resourceType: "deal", resourceNameField: "name" }));
  TestModel = model("AuditTestModel", TestSchema);
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  capturedEvents = [];
});

describe("auditPlugin", () => {
  test("captures create event on save", async () => {
    const wsId = new Types.ObjectId();
    await TestModel.create({
      workspaceId: wsId,
      name: "New Deal",
      amount: 1000,
    });

    expect(capturedEvents.length).toBe(1);
    expect(capturedEvents[0].action).toBe("create");
    expect(capturedEvents[0].resourceType).toBe("deal");
    expect(capturedEvents[0].resourceName).toBe("New Deal");
    expect(capturedEvents[0].userId).toBe("u1");
    expect(capturedEvents[0].changes).toContainEqual({ field: "name", from: null, to: "New Deal" });
    expect(capturedEvents[0].changes).toContainEqual({ field: "amount", from: null, to: 1000 });
  });

  test("captures update event on findOneAndUpdate", async () => {
    const wsId = new Types.ObjectId();
    const doc = await TestModel.create({ workspaceId: wsId, name: "Old Deal", amount: 500 });
    capturedEvents = [];

    await TestModel.findOneAndUpdate(
      { _id: doc._id },
      { name: "Updated Deal", amount: 750 },
      { new: true },
    );

    expect(capturedEvents.length).toBe(1);
    expect(capturedEvents[0].action).toBe("update");
    expect(capturedEvents[0].resourceType).toBe("deal");
    expect(capturedEvents[0].changes).toContainEqual({ field: "name", from: "Old Deal", to: "Updated Deal" });
    expect(capturedEvents[0].changes).toContainEqual({ field: "amount", from: 500, to: 750 });
  });

  test("captures delete event on findOneAndDelete", async () => {
    const wsId = new Types.ObjectId();
    const doc = await TestModel.create({ workspaceId: wsId, name: "Gone Deal", amount: 200 });
    capturedEvents = [];

    await TestModel.findOneAndDelete({ _id: doc._id });

    expect(capturedEvents.length).toBe(1);
    expect(capturedEvents[0].action).toBe("delete");
    expect(capturedEvents[0].resourceType).toBe("deal");
    expect(capturedEvents[0].changes).toContainEqual({ field: "name", from: "Gone Deal", to: null });
  });

  test("redacts sensitive fields", async () => {
    const wsId = new Types.ObjectId();
    await TestModel.create({ workspaceId: wsId, name: "Secret Deal", secretKey: "top-secret" });

    expect(capturedEvents.length).toBe(1);
    const change = capturedEvents[0].changes.find((c: any) => c.field === "secretKey");
    expect(change).toBeTruthy();
    expect(change.to).toBe("[REDACTED]");
  });

  test("does not emit update event when nothing changes", async () => {
    const wsId = new Types.ObjectId();
    const doc = await TestModel.create({ workspaceId: wsId, name: "Stable Deal", amount: 100 });
    capturedEvents = [];

    await TestModel.findOneAndUpdate(
      { _id: doc._id },
      { name: "Stable Deal" },
      { new: true },
    );

    expect(capturedEvents.length).toBe(0);
  });
});
