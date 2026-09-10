import { describe, expect, test } from "bun:test";
import { assertProductImage, resizeProductImage } from "./product-image";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("assertProductImage", () => {
  test("accepts jpeg under 2MB", () => {
    expect(() => assertProductImage("image/jpeg", 1000)).not.toThrow();
  });

  test("rejects pdf", () => {
    expect(() => assertProductImage("application/pdf", 1000)).toThrow();
  });

  test("rejects oversized files", () => {
    expect(() => assertProductImage("image/png", 3 * 1024 * 1024)).toThrow();
  });
});

describe("resizeProductImage", () => {
  test("returns webp bytes", async () => {
    const out = await resizeProductImage(new Uint8Array(PNG_1X1));
    expect(out.byteLength).toBeGreaterThan(0);
  });
});
