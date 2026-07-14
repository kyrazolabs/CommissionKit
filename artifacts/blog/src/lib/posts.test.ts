import { describe, test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const workspaceArticles = path.join(process.cwd(), "articles");
process.env.BLOG_ARTICLES_DIR = fs.existsSync(workspaceArticles)
  ? workspaceArticles
  : path.join(process.cwd(), "artifacts", "blog", "articles");

const { getPost, getAllPosts, getAvailableLanguages, getAllSlugs, getAllLanguages } =
  await import("./posts");

describe("getAllLanguages", () => {
  test("returns languages derived from translation files", () => {
    const languages = getAllLanguages();
    expect(languages).toContain("en");
    expect(languages.length).toBeGreaterThan(0);
  });
});

describe("getPost", () => {
  test("returns English post", () => {
    const post = getPost("welcome-to-commissionkit", "en");
    expect(post).not.toBeNull();
    expect(post?.slug).toBe("welcome-to-commissionkit");
    expect(post?.lang).toBe("en");
    expect(post?.title).toBeTruthy();
  });

  test("returns post for available translation language", () => {
    const post = getPost("welcome-to-commissionkit", "es");
    expect(post).not.toBeNull();
    expect(post?.lang).toBe("es");
  });

  test("returns null for unknown slug", () => {
    const post = getPost("does-not-exist", "en");
    expect(post).toBeNull();
  });
});

describe("getAvailableLanguages", () => {
  test("returns available translations for post", () => {
    const langs = getAvailableLanguages("welcome-to-commissionkit");
    expect(langs).toContain("en");
    expect(langs).toContain("es");
    expect(langs.length).toBeGreaterThan(1);
  });

  test("returns empty array for unknown slug", () => {
    const langs = getAvailableLanguages("does-not-exist");
    expect(langs).toEqual([]);
  });
});

describe("getAllPosts", () => {
  test("filters by Spanish language", () => {
    const posts = getAllPosts("es");
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((p) => p.lang === "es")).toBe(true);
  });

  test("filters by English language", () => {
    const posts = getAllPosts("en");
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((p) => p.lang === "en")).toBe(true);
  });

  test("returns all posts unfiltered", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.some((p) => p.slug === "welcome-to-commissionkit" && p.lang === "en")).toBe(true);
  });
});

describe("getAllSlugs", () => {
  test("returns slugs with languages", () => {
    const slugs = getAllSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    const welcome = slugs.find((s) => s.slug === "welcome-to-commissionkit");
    expect(welcome).toBeDefined();
    expect(welcome?.languages).toContain("en");
  });
});
