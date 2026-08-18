// Pre-optimize cover images to WebP at build time.
// Bun.Image pipeline — zero npm deps, runs off the JS thread.
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = join(__dirname, "..", "articles");
const COVER_NAMES = ["cover.png", "cover.jpg", "cover.jpeg"];

async function optimize() {
  if (!existsSync(ARTICLES_DIR)) {
    console.warn("[optimize-covers] No articles directory found — skipping");
    return;
  }

  let optimized = 0;
  let saved = 0;

  const dateEntries = readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      const slugDir = join(dateDir, slugEntry.name);

      for (const name of COVER_NAMES) {
        const sourcePath = join(slugDir, name);
        const webpPath = join(slugDir, "cover.webp");

        if (!existsSync(sourcePath)) continue;
        if (existsSync(webpPath)) {
          // Skip if webp is newer than source
          const srcStat = statSync(sourcePath);
          const webpStat = statSync(webpPath);
          if (webpStat.mtimeMs >= srcStat.mtimeMs) continue;
        }

        try {
          const originalSize = statSync(sourcePath).size;
          const out = await Bun.file(sourcePath)
            .image()
            .resize(1200, undefined, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .bytes();

          Bun.write(webpPath, out);
          const newSize = out.byteLength;
          const pct = ((1 - newSize / originalSize) * 100).toFixed(0);
          console.log(
            `[optimize-covers] ${slugEntry.name}: ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB WebP (${pct}% smaller)`,
          );
          optimized++;
          saved += originalSize - newSize;
        } catch (err) {
          console.error(`[optimize-covers] Failed to optimize ${sourcePath}:`, err);
        }
      }
    }
  }

  if (optimized > 0) {
    console.log(
      `[optimize-covers] Optimized ${optimized} cover(s), saved ${(saved / 1024).toFixed(0)}KB total`,
    );
  }
}

optimize().catch((err) => {
  console.error("[optimize-covers] Fatal error:", err);
  process.exit(1);
});
