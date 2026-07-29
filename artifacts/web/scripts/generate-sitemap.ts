import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const today = new Date().toISOString().split("T")[0];
const publicDir = resolve(import.meta.dirname, "../public");

const pages = [
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

// 1. Generate sitemap-pages.xml (the actual page URL entries)
const pagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(resolve(publicDir, "sitemap-pages.xml"), pagesXml);
console.log(`[sitemap] Generated sitemap-pages.xml with ${pages.length} URLs`);

// 2. Generate sitemap.xml as a sitemap index
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://commissionkit.co/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://commissionkit.co/blog/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;

writeFileSync(resolve(publicDir, "sitemap.xml"), indexXml);
console.log(`[sitemap] Generated sitemap.xml (index with 2 sub-sitemaps, lastmod: ${today})`);
