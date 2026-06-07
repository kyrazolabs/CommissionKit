import { describe, test, expect } from "bun:test";
import { createPayoutSchema } from "./payouts";

describe("createPayoutSchema", () => {
  const validPayout = {
    repId: "rep1",
    periodStart: "2024-03-01T00:00:00.000Z",
    periodEnd: "2024-03-31T23:59:59.999Z",
    commissionAmount: 2500,
  };

  test("accepts valid input with defaults", () => {
    const result = createPayoutSchema.parse(validPayout);
    expect(result.repId).toBe("rep1");
    expect(result.commissionAmount).toBe(2500);
    expect(result.adjustments).toBe(0);
  });

  test("accepts all optional fields", () => {
    const result = createPayoutSchema.parse({
      ...validPayout,
      adjustments: -100,
      currency: "EUR",
      paymentMethod: "bank_transfer",
      scheduledPaymentDate: "2024-04-15T00:00:00.000Z",
      notes: "Quarterly bonus adjustment",
    });
    expect(result.adjustments).toBe(-100);
    expect(result.currency).toBe("EUR");
    expect(result.paymentMethod).toBe("bank_transfer");
    expect(result.scheduledPaymentDate).toBe("2024-04-15T00:00:00.000Z");
    expect(result.notes).toBe("Quarterly bonus adjustment");
  });

  test("rejects missing repId", () => {
    const { repId, ...rest } = validPayout;
    expect(() => createPayoutSchema.parse(rest)).toThrow();
  });

  test("rejects missing periodStart", () => {
    const { periodStart, ...rest } = validPayout;
    expect(() => createPayoutSchema.parse(rest)).toThrow();
  });

  test("rejects missing periodEnd", () => {
    const { periodEnd, ...rest } = validPayout;
    expect(() => createPayoutSchema.parse(rest)).toThrow();
  });

  test("rejects missing commissionAmount", () => {
    const { commissionAmount, ...rest } = validPayout;
    expect(() => createPayoutSchema.parse(rest)).toThrow();
  });

  test("rejects negative commissionAmount", () => {
    expect(() =>
      createPayoutSchema.parse({
        ...validPayout,
        commissionAmount: -100,
      }),
    ).toThrow();
  });

  test("accepts zero commissionAmount", () => {
    const result = createPayoutSchema.parse({
      ...validPayout,
      commissionAmount: 0,
    });
    expect(result.commissionAmount).toBe(0);
  });

  test("rejects invalid paymentMethod", () => {
    expect(() =>
      createPayoutSchema.parse({
        ...validPayout,
        paymentMethod: "crypto",
      }),
    ).toThrow();
  });

  test("accepts all valid payment methods", () => {
    for (const method of ["payroll", "bank_transfer", "other"]) {
      const result = createPayoutSchema.parse({
        ...validPayout,
        paymentMethod: method,
      });
      expect(result.paymentMethod).toBe(method);
    }
  });

  test("rejects non-numeric commissionAmount", () => {
    expect(() =>
      createPayoutSchema.parse({
        ...validPayout,
        commissionAmount: "twenty five hundred",
      }),
    ).toThrow();
  });
});
