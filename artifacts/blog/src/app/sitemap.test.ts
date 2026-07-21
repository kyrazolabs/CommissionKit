import { describe, test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const workspaceArticles = path.join(process.cwd(), "articles");
process.env.BLOG_ARTICLES_DIR = fs.existsSync(workspaceArticles)
  ? workspaceArticles
  : path.join(process.cwd(), "artifacts", "blog", "articles");

const { getAllLanguages } = await import("../lib/posts");
// Use the same default as baseUrl.ts (HOSTNAME not set in test → "commissionk.it")
const baseUrl = "https://commissionk.it";

async function loadSitemap() {
  const { default: sitemap } = await import("../app/sitemap");
  return sitemap();
}

describe("blog sitemap", () => {
  test("does not include redirecting /blog root", async () => {
    const entries = await loadSitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).not.toContain(`${baseUrl}/blog`);
  });

  test("includes all language index pages", async () => {
    const languages = getAllLanguages();
    const entries = await loadSitemap();
    const urls = entries.map((e) => e.url);
    for (const lang of languages) {
      expect(urls).toContain(`${baseUrl}/blog/${lang}`);
    }
  });

  test("every entry has absolute https URLs", async () => {
    const entries = await loadSitemap();
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\/commissionk\.it\/blog\//);
    }
  });

  test("every alternate set includes x-default pointing to English", async () => {
    const entries = await loadSitemap();
    for (const entry of entries) {
      const alts = entry.alternates?.languages;
      expect(alts).toBeDefined();
      expect(alts?.["x-default"]).toMatch(
        /^https:\/\/commissionk\.it\/blog\/en/,
      );
    }
  });

  test("does not include _next, api, or other internal paths", async () => {
    const entries = await loadSitemap();
    const urls = entries.map((e) => e.url);
    for (const url of urls) {
      expect(url).not.toContain("/_next/");
      expect(url).not.toContain("/api/");
    }
  });
});
