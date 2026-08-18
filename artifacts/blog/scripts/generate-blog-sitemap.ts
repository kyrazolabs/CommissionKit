import fs, { writeFileSync } from "node:fs";
import path, { resolve } from "node:path";
import { getAllLanguages, getAllSlugs } from "../src/lib/posts";

const hostname = process.env.HOSTNAME || "commissionkit.co";
const baseUrl = `https://${hostname}`;

const ARTICLES_DIR = process.env.BLOG_ARTICLES_DIR
  ? path.resolve(process.env.BLOG_ARTICLES_DIR)
  : path.join(process.cwd(), "articles");

const today = new Date().toISOString().split("T")[0];

/** Get the YYYY-MM-DD date from the article's parent directory. */
function getSlugDate(slug: string): string | null {
  if (!fs.existsSync(ARTICLES_DIR)) return null;
  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const match = dateEntry.name.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!match) continue;
    const slugDir = path.join(ARTICLES_DIR, dateEntry.name, slug);
    if (fs.existsSync(slugDir) && fs.statSync(slugDir).isDirectory()) {
      return match[1];
    }
  }
  return null;
}

function alternatesXml(languages: string[], urlForLang: (lang: string) => string): string {
  const links = languages.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlForLang(l)}"/>`,
  );
  links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlForLang("en")}"/>`);
  return links.join("\n");
}

function buildSitemapXml(): string {
  const languages = getAllLanguages();
  const entries: string[] = [];

  // Language index pages (e.g. /blog/en, /blog/ar)
  for (const lang of languages) {
    const alts = alternatesXml(languages, (l) => `${baseUrl}/blog/${l}`);
    entries.push(`  <url>
    <loc>${baseUrl}/blog/${lang}</loc>
    <lastmod>${today}</lastmod>
${alts}
  </url>`);
  }

  // Post pages (e.g. /blog/en/some-post) — use real article dates
  const slugs = getAllSlugs();
  for (const { slug, languages: postLangs } of slugs) {
    const date = getSlugDate(slug) || today;
    for (const lang of postLangs) {
      const alts = alternatesXml(postLangs, (l) => `${baseUrl}/blog/${l}/${slug}`);
      entries.push(`  <url>
    <loc>${baseUrl}/blog/${lang}/${slug}</loc>
    <lastmod>${date}</lastmod>
${alts}
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}

const xml = buildSitemapXml();
const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml);
console.log(`[sitemap] Generated blog sitemap.xml (${xml.split("\n").length} lines)`);
