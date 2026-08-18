import fs from "node:fs";
import path from "node:path";

const ARTICLES_DIR = /*turbopackIgnore: true*/ path.join(process.cwd(), "articles");
const COVER_NAMES = ["cover.webp", "cover.png", "cover.jpg", "cover.jpeg"];

export function findCover(slug: string): { filePath: string; ext: string } | null {
  if (/*turbopackIgnore: true*/ !fs.existsSync(ARTICLES_DIR)) return null;

  const dateEntries = /*turbopackIgnore: true*/ fs.readdirSync(ARTICLES_DIR, {
    withFileTypes: true,
  });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = /*turbopackIgnore: true*/ path.join(ARTICLES_DIR, dateEntry.name);
    const slugEntries = /*turbopackIgnore: true*/ fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      if (slugEntry.name !== slug) continue;
      for (const name of COVER_NAMES) {
        const p = /*turbopackIgnore: true*/ path.join(dateDir, slug, name);
        if (/*turbopackIgnore: true*/ fs.existsSync(p))
          return { filePath: p, ext: path.extname(name).slice(1) };
      }
      return null;
    }
  }
  return null;
}
