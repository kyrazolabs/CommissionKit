import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prerenderRoutes } from "../src/lib/seo";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function injectMeta(
  template: string,
  meta: {
    title: string;
    description: string;
    robots?: string;
    keywords?: string;
    canonical: string;
  },
) {
  const robots = meta.robots ?? "index, follow";

  let result = template
    .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
    .replace(
      /<meta name="description"[^>]*\/?>/,
      `<meta name="description" content="${meta.description}" />`,
    )
    .replace(/<meta name="robots"[^>]*\/?>/, `<meta name="robots" content="${robots}" />`)
    .replace(
      /<meta property="og:title"[^>]*\/?>/,
      `<meta property="og:title" content="${meta.title}" />`,
    )
    .replace(
      /<meta property="og:description"[^>]*\/?>/,
      `<meta property="og:description" content="${meta.description}" />`,
    )
    .replace(
      /<meta name="twitter:title"[^>]*\/?>/,
      `<meta name="twitter:title" content="${meta.title}" />`,
    )
    .replace(
      /<meta name="twitter:description"[^>]*\/?>/,
      `<meta name="twitter:description" content="${meta.description}" />`,
    )
    .replace(
      /<link rel="canonical"[^>]*>/,
      `<!-- Prerender: verified static HTML served for this route -->\n    <link rel="canonical" href="${meta.canonical}">`,
    )
    .replace(
      /<link rel="alternate" hreflang="([^"\s]+)" href="[^"]*" ?\/?>/g,
      `<link rel="alternate" hreflang="$1" href="${meta.canonical}">`,
    )
    .replace(
      /<meta property="og:url"[^>]*\/?>/,
      `<meta property="og:url" content="${meta.canonical}">`,
    );

  if (meta.keywords !== undefined) {
    const keywordsTag = `<meta name="keywords" content="${meta.keywords}" />`;
    result = result.replace(/<meta name="keywords"[^>]*\/?>/, keywordsTag);
    if (!result.includes('name="keywords"')) {
      result = result.replace("</head>", `  ${keywordsTag}\n</head>`);
    }

    const twitterKeywordsTag = `<meta name="twitter:keywords" content="${meta.keywords}" />`;
    result = result.replace(/<meta name="twitter:keywords"[^>]*\/?>/, twitterKeywordsTag);
    if (!result.includes('name="twitter:keywords"')) {
      result = result.replace("</head>", `  ${twitterKeywordsTag}\n</head>`);
    }
  }

  return result;
}

async function run() {
  const distDir = path.resolve(__dirname, "../dist/public");
  const templatePath = path.resolve(distDir, "index.html");
  const appPath = path.resolve(distDir, "app.html");
  const serverEntryPath = path.resolve(__dirname, "../dist/server/entry-server.js");

  console.log("[Prerender] Starting prerender process...");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template index.html not found at: ${templatePath}`);
  }

  const originalTemplate = fs.readFileSync(templatePath, "utf-8");
  fs.writeFileSync(appPath, originalTemplate, "utf-8");
  console.log("[Prerender] Copied SPA fallback to app.html");

  if (!fs.existsSync(serverEntryPath)) {
    throw new Error(`Compiled server entry not found at: ${serverEntryPath}`);
  }
  const { render } = await import(serverEntryPath);

  for (const route of prerenderRoutes) {
    const { html, meta } = render(route);
    let output = originalTemplate;
    output = injectMeta(output, meta);
    output = output.replace(`<div id="root"></div>`, `<div id="root">${html}</div>`);

    const outputPath =
      route === "/" ? templatePath : path.join(distDir, route.replace(/^\//, ""), "index.html");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, "utf-8");
    console.log(`[Prerender] Pre-rendered ${route} → ${outputPath}`);
  }

  console.log(`[Prerender] Prerender complete for ${prerenderRoutes.length} routes.`);
}

run().catch((error) => {
  console.error("[Prerender] Failed to pre-render:", error);
  process.exit(1);
});
