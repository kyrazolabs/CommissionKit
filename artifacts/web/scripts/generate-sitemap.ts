import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const today = new Date().toISOString().split("T")[0];

const urls = [
  { loc: "https://commissionkit.co/", changefreq: "weekly", priority: "1.0" },
  { loc: "https://commissionkit.co/home", changefreq: "weekly", priority: "0.9" },
  { loc: "https://commissionkit.co/features", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionkit.co/solutions", changefreq: "monthly", priority: "0.8" },
  { loc: "https://commissionkit.co/pricing", changefreq: "weekly", priority: "0.9" },
  { loc: "https://commissionkit.co/calculator", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionkit.co/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "https://commissionkit.co/privacy", changefreq: "monthly", priority: "0.5" },
  { loc: "https://commissionkit.co/terms", changefreq: "monthly", priority: "0.5" },
  { loc: "https://commissionkit.co/security", changefreq: "monthly", priority: "0.5" },
  { loc: "https://commissionkit.co/integrations/odoo", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionkit.co/integrations/hubspot", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionkit.co/integrations/salesforce", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionkit.co/integrations/custom", changefreq: "monthly", priority: "0.8" },
  { loc: "https://commissionkit.co/portal", changefreq: "monthly", priority: "0.9" },
  { loc: "https://commissionkit.co/careers", changefreq: "monthly", priority: "0.7" },
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
