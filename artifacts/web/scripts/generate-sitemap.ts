import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const today = new Date().toISOString().split("T")[0];

const urls = [
  { loc: "https://commissionk.it/", changefreq: "weekly", priority: "1.0" },
  { loc: "https://commissionk.it/home", changefreq: "weekly", priority: "0.9" },
  { loc: "https://commissionk.it/commission-calculator", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionk.it/privacy", changefreq: "monthly", priority: "0.5" },
  { loc: "https://commissionk.it/terms", changefreq: "monthly", priority: "0.5" },
  { loc: "https://commissionk.it/security", changefreq: "monthly", priority: "0.5" },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
writeFileSync(outPath, sitemap);
console.log(`[sitemap] Generated sitemap.xml with ${urls.length} URLs (lastmod: ${today})`);
