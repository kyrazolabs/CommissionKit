import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function injectMeta(
  template: string,
  meta: { title: string; description: string; robots?: string; canonical: string },
) {
  const robots = meta.robots ?? "index, follow";

  return template
    .replace(
      /<title>.*?<\/title>/,
      `<title>${meta.title}</title>`,
    )
    .replace(
      /<meta name="description"[^>]*\/?>/,
      `<meta name="description" content="${meta.description}" />`,
    )
    .replace(
      /<meta name="robots"[^>]*\/?>/,
      `<meta name="robots" content="${robots}" />`,
    )
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
      /<link rel="alternate" hreflang="([^"]+)" href="[^"]*" ?\/?>/g,
      `<link rel="alternate" hreflang="$1" href="${meta.canonical}">`,
    )
    .replace(
      /<meta property="og:url"[^>]*\/?>/,
      `<meta property="og:url" content="${meta.canonical}">`,
    );
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

  // 1. Read the original Vite-built template into memory
  const originalTemplate = fs.readFileSync(templatePath, "utf-8");

  // 2. Save a copy as the SPA fallback (app.html) — must be the ORIGINAL template
  fs.writeFileSync(appPath, originalTemplate, "utf-8");
  console.log("[Prerender] Copied SPA fallback to app.html");

  // 3. Load the compiled SSR entry-server bundle
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error(`Compiled server entry not found at: ${serverEntryPath}`);
  }
  const { render } = await import(serverEntryPath);

  // 4. Pre-render indexable routes — always base off the ORIGINAL in-memory template
  const routes = ["/", "/home", "/commission-calculator", "/privacy", "/terms", "/security"];

  for (const route of routes) {
    const { html, meta } = render(route);

    // Start fresh from the original template (never mutate the shared base)
    let output = originalTemplate;

    // Inject route-specific meta tags into <head>
    output = injectMeta(output, meta);

    // Inject SSR body into <div id="root">
    output = output.replace(
      `<div id="root"></div>`,
      `<div id="root">${html}</div>`,
    );

    // Write the pre-rendered HTML to the route path
    const outputPath = route === "/" ? templatePath : path.join(distDir, route.replace(/^\//, ""), "index.html");
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, output, "utf-8");
    console.log(`[Prerender] Pre-rendered ${route} → ${outputPath}`);
    console.log(`[Prerender]   title: ${meta.title}, canonical: ${meta.canonical}, robots: ${meta.robots}`);
  }

  console.log("[Prerender] Prerender complete.");
}

run().catch((err) => {
  console.error("[Prerender] Failed to pre-render:", err);
  process.exit(1);
});
