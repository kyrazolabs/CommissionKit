import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const distDir = path.resolve(__dirname, "../dist/public");
  const templatePath = path.resolve(distDir, "index.html");
  const appPath = path.resolve(distDir, "app.html");
  const serverEntryPath = path.resolve(__dirname, "../dist/server/entry-server.js");

  console.log("[Prerender] Starting prerender process...");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template index.html not found at: ${templatePath}`);
  }

  // 1. Copy original index.html to app.html (as a clean SPA fallback)
  fs.copyFileSync(templatePath, appPath);
  console.log("[Prerender] Copied SPA fallback to app.html");

  // 2. Load the compiled SSR entry-server bundle
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error(`Compiled server entry not found at: ${serverEntryPath}`);
  }
  const { render } = await import(serverEntryPath);

  // 3. Pre-render indexable routes
  const routes = ["/", "/home", "/commission-calculator", "/privacy", "/terms", "/security"];

  for (const route of routes) {
    const appHtml = render(route);
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = template.replace(
      `<div id="root"></div>`,
      `<div id="root">${appHtml}</div>`,
    );

    const outputPath = route === "/" ? templatePath : path.join(distDir, route.replace(/^\//, ""), "index.html");
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, html, "utf-8");
    console.log(`[Prerender] Pre-rendered ${route} → ${outputPath}`);
  }

  console.log("[Prerender] Prerender complete.");
}

run().catch((err) => {
  console.error("[Prerender] Failed to pre-render:", err);
  process.exit(1);
});
