import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getAllSlugs, getAllLanguages } from "../src/lib/posts";

const hostname = process.env.HOSTNAME || "commissionkit.co";
const baseUrl = `https://${hostname}`;

const today = new Date().toISOString().split("T")[0];

function alternatesXml(
  languages: string[],
  urlForLang: (lang: string) => string,
): string {
  const links = languages.map(
    (l) =>
      `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlForLang(l)}"/>`,
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlForLang("en")}"/>`,
  );
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
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${alts}
  </url>`);
  }

  // Post pages (e.g. /blog/en/some-post)
  const slugs = getAllSlugs();
  for (const { slug, languages: postLangs } of slugs) {
    for (const lang of postLangs) {
      const priority = lang === "en" ? "0.9" : "0.8";
      const alts = alternatesXml(postLangs, (l) => `${baseUrl}/blog/${l}/${slug}`);
      entries.push(`  <url>
    <loc>${baseUrl}/blog/${lang}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
${alts}
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
}

const xml = buildSitemapXml();
const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml);
console.log(
  `[sitemap] Generated blog sitemap.xml (${xml.split("\n").length} lines, lastmod: ${today})`,
);
