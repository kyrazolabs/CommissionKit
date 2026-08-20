import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalUrl, indexableRoutes } from "../src/lib/seo";

const today = new Date().toISOString().split("T")[0];

const routeOptions: Record<string, { changefreq: string; priority: string }> = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/pricing": { changefreq: "weekly", priority: "0.9" },
  "/calculator": { changefreq: "monthly", priority: "0.9" },
  "/integrations": { changefreq: "monthly", priority: "0.9" },
  "/integrations/odoo": { changefreq: "monthly", priority: "0.9" },
  "/integrations/hubspot": { changefreq: "monthly", priority: "0.9" },
  "/integrations/salesforce": { changefreq: "monthly", priority: "0.9" },
  "/integrations/custom": { changefreq: "monthly", priority: "0.8" },
  "/features": { changefreq: "monthly", priority: "0.8" },
  "/solutions": { changefreq: "monthly", priority: "0.8" },
  "/portal": { changefreq: "monthly", priority: "0.8" },
  "/contact": { changefreq: "monthly", priority: "0.7" },
  "/careers": { changefreq: "monthly", priority: "0.7" },
  "/privacy": { changefreq: "monthly", priority: "0.5" },
  "/terms": { changefreq: "monthly", priority: "0.5" },
  "/security": { changefreq: "monthly", priority: "0.5" },
};

const urls = indexableRoutes.map((route) => ({
  loc: canonicalUrl(route),
  ...(routeOptions[route] ?? { changefreq: "monthly", priority: "0.6" }),
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
writeFileSync(outPath, sitemap);
console.log(
  `[sitemap] Generated sitemap.xml with ${urls.length} canonical indexable URLs (lastmod: ${today})`,
);
