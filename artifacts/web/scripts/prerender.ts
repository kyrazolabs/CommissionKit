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

  // 3. Render the landing page to HTML
  const appHtml = render();

  // 4. Inject pre-rendered HTML into index.html
  const template = fs.readFileSync(templatePath, "utf-8");
  const html = template.replace(
    `<div id="root"></div>`,
    `<div id="root">${appHtml}</div>`
  );

  fs.writeFileSync(templatePath, html, "utf-8");
  console.log("[Prerender] Pre-rendered HTML successfully written to index.html");
}

run().catch((err) => {
  console.error("[Prerender] Failed to pre-render:", err);
  process.exit(1);
});
