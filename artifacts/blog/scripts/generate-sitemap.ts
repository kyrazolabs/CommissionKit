/**
 * Generates a static sitemap.xml for the blog at build time.
 * Replaces Next.js's dynamic MetadataRoute sitemap.ts to avoid
 * Content-Type / gzip corruption when served through nginx.
 *
 * Pattern: Same as web's artifacts/web/scripts/generate-sitemap.ts
 * — produces a plain static XML file in public/ that Next.js serves
 * directly with correct Content-Type: application/xml.
 */

import { writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename, resolve } from "node:path";

const ARTICLES_DIR = join(import.meta.dirname, "..", "articles");
const OUT_DIR = join(import.meta.dirname, "..", "public");
const BASE_URL = "https://commissionkit.co";

interface ArticleEntry {
  slug: string;
  languages: string[];
}

function getAvailableLanguages(slugDir: string): string[] {
  const langs: string[] = [];
  if (!existsSync(slugDir)) return langs;
  for (const file of readdirSync(slugDir)) {
    const match = file.match(/^([a-z]{2})\.(mdx|md)$/);
    if (match) langs.push(match[1]);
  }
  return [...new Set(langs)].sort();
}

function getAllArticles(): ArticleEntry[] {
  const result: ArticleEntry[] = [];
  if (!existsSync(ARTICLES_DIR)) return result;

  const dateEntries = readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      const slugDir = join(dateDir, slugEntry.name);
      const langs = getAvailableLanguages(slugDir);
      if (langs.length > 0) {
        result.push({ slug: slugEntry.name, languages: langs });
      }
    }
  }
  return result;
}

function getAllLanguages(articles: ArticleEntry[]): string[] {
  const langs = new Set<string>();
  for (const a of articles) {
    for (const l of a.languages) langs.add(l);
  }
  return [...langs].sort();
}

function renderAlternates(
  allLangs: string[],
  urlForLang: (lang: string) => string,
): string {
  const lines: string[] = [];
  for (const lang of allLangs) {
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${urlForLang(lang)}" />`,
    );
  }
  // x-default always points to English
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlForLang("en")}" />`,
  );
  return lines.join("\n");
}

function renderUrl(
  loc: string,
  alternates: string,
  changefreq: string,
  priority: string,
  lastmod: string,
): string {
  return `  <url>
    <loc>${loc}</loc>
${alternates}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const articles = getAllArticles();
const allLangs = getAllLanguages(articles);
const today = new Date().toISOString().split("T")[0];

const urlEntries: string[] = [];

// 1. Language index pages: /blog/{lang}
for (const lang of allLangs) {
  const loc = `${BASE_URL}/blog/${lang}`;
  const alts = renderAlternates(allLangs, (l) => `${BASE_URL}/blog/${l}`);
  urlEntries.push(renderUrl(loc, alts, "daily", "1.0", today));
}

// 2. Article pages: /blog/{lang}/{slug}
// Alternates only include languages the article is actually available in
for (const { slug, languages } of articles) {
  for (const lang of languages) {
    const loc = `${BASE_URL}/blog/${lang}/${slug}`;
    const alts = renderAlternates(languages, (l) => `${BASE_URL}/blog/${l}/${slug}`);
    const priority = lang === "en" ? "0.9" : "0.8";
    urlEntries.push(renderUrl(loc, alts, "weekly", priority, today));
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;

const outPath = resolve(OUT_DIR, "sitemap.xml");
writeFileSync(outPath, sitemap);
console.log(
  `[sitemap] Generated sitemap.xml with ${urlEntries.length} URLs (articles: ${articles.length}, languages: ${allLangs.join(", ")})`,
);
