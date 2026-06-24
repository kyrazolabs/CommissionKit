import { describe, test, expect } from "bun:test";
import { formatDate, readingTime } from "../lib/format";

describe("formatDate", () => {
  test("formats ISO date string", () => {
    const result = formatDate("2024-06-15");
    expect(result).toContain("June");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  test("formats Date object", () => {
    const result = formatDate(new Date("2025-01-01"));
    expect(result).toContain("January");
    expect(result).toContain("1");
    expect(result).toContain("2025");
  });
});

describe("readingTime", () => {
  test("short text under 200 words", () => {
    const result = readingTime("Hello world");
    expect(result).toBe("1 min read");
  });

  test("medium text ~400 words", () => {
    const words = Array(400).fill("word").join(" ");
    const result = readingTime(words);
    expect(result).toBe("2 min read");
  });

  test("strips HTML tags before counting", () => {
    const html = "<p>Hello <strong>world</strong></p>".repeat(50);
    const result = readingTime(html);
    expect(result).toBe("1 min read");
  });

  test("empty string", () => {
    const result = readingTime("");
    expect(result).toBe("1 min read");
  });
});
