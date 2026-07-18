import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(SCRIPT_DIR, "..", "articles");

function migrate() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log("No articles directory found.");
    return;
  }

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  let migrated = 0;
  let skipped = 0;

  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      const slugDir = path.join(dateDir, slugEntry.name);

      for (const [oldName, newName] of [
        ["index.mdx", "en.mdx"],
        ["index.md", "en.md"],
      ] as const) {
        const oldPath = path.join(slugDir, oldName);
        const newPath = path.join(slugDir, newName);

        if (!fs.existsSync(oldPath)) continue;
        if (fs.existsSync(newPath)) {
          console.log(`Skip: ${oldPath} -> ${newName} (target already exists)`);
          skipped++;
          continue;
        }

        fs.renameSync(oldPath, newPath);
        console.log(`Migrated: ${oldPath} -> ${newPath}`);
        migrated++;
      }
    }
  }

  console.log(`\nDone. Migrated ${migrated}, skipped ${skipped}.`);
}

migrate();
