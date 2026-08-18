import { describe, expect, test } from "bun:test";
import { createDisputeSchema, updateDisputeSchema } from "./disputes";

describe("createDisputeSchema", () => {
  test("accepts valid dispute with minimum reason length", () => {
    const result = createDisputeSchema.parse({
      payoutId: "payout1",
      reason: "The commission amount does not match my calculation records.",
    });
    expect(result.payoutId).toBe("payout1");
    expect(result.reason).toBe("The commission amount does not match my calculation records.");
  });

  test("accepts exactly 10 character reason", () => {
    const result = createDisputeSchema.parse({
      payoutId: "payout1",
      reason: "1234567890",
    });
    expect(result.reason).toBe("1234567890");
  });

  test("rejects reason shorter than 10 characters", () => {
    expect(() =>
      createDisputeSchema.parse({
        payoutId: "payout1",
        reason: "Too short",
      }),
    ).toThrow();
  });

  test("rejects empty reason", () => {
    expect(() =>
      createDisputeSchema.parse({
        payoutId: "payout1",
        reason: "",
      }),
    ).toThrow();
  });

  test("rejects missing payoutId", () => {
    expect(() =>
      createDisputeSchema.parse({
        reason: "This is a valid reason with enough text length.",
      }),
    ).toThrow();
  });

  test("rejects empty payoutId", () => {
    expect(() =>
      createDisputeSchema.parse({
        payoutId: "",
        reason: "This is a valid reason with enough text length.",
      }),
    ).toThrow();
  });

  test("rejects missing reason", () => {
    expect(() => createDisputeSchema.parse({ payoutId: "payout1" })).toThrow();
  });
});

describe("updateDisputeSchema", () => {
  test("accepts status only", () => {
    const result = updateDisputeSchema.parse({ status: "under_review" });
    expect(result.status).toBe("under_review");
    expect(result.adminNotes).toBeUndefined();
  });

  test("accepts adminNotes only", () => {
    const result = updateDisputeSchema.parse({
      adminNotes: "Reviewed and approved adjustment.",
    });
    expect(result.adminNotes).toBe("Reviewed and approved adjustment.");
    expect(result.status).toBeUndefined();
  });

  test("accepts both status and adminNotes", () => {
    const result = updateDisputeSchema.parse({
      status: "resolved",
      adminNotes: "Adjustment applied. Dispute closed.",
    });
    expect(result.status).toBe("resolved");
    expect(result.adminNotes).toBe("Adjustment applied. Dispute closed.");
  });

  test("accepts empty object (all fields optional)", () => {
    const result = updateDisputeSchema.parse({});
    expect(result.status).toBeUndefined();
    expect(result.adminNotes).toBeUndefined();
  });

  test("rejects invalid status", () => {
    expect(() => updateDisputeSchema.parse({ status: "closed" })).toThrow();
  });

  test("accepts all valid statuses", () => {
    for (const status of ["open", "under_review", "resolved"]) {
      const result = updateDisputeSchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });
});
