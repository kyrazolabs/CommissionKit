import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const TRANSLATIONS_DIR = resolve(import.meta.dirname, "../translations");
const OUTPUT_DIR = resolve(import.meta.dirname, "../src/generated/translations");

function mergeTranslations(): void {
  // Find all language subdirectories
  const items = readdirSync(TRANSLATIONS_DIR, { withFileTypes: true });
  const langs = items.filter((item) => item.isDirectory()).map((item) => item.name);

  if (langs.length === 0) {
    console.log("No language directories found in translations/");
    return;
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const lang of langs) {
    const langDir = join(TRANSLATIONS_DIR, lang);
    const sectionFiles = readdirSync(langDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    if (sectionFiles.length === 0) {
      console.log(`  [skip] ${lang}: no section files found`);
      continue;
    }

    const merged: Record<string, unknown> = {};

    for (const file of sectionFiles) {
      const raw = readFileSync(join(langDir, file), "utf-8");
      const data = JSON.parse(raw);
      // Ensure no key overlaps between sections
      const overlap = Object.keys(data).filter((k) => k in merged);
      if (overlap.length > 0) {
        console.error(
          `  [ERROR] ${lang}: key(s) "${overlap.join(", ")}" already exists from a previous section (${file})`,
        );
        process.exit(1);
      }
      Object.assign(merged, data);
    }

    const keyCount = Object.keys(merged).length;
    const sectionNames = sectionFiles.map((f) => f.replace(".json", "")).join(", ");
    const outputFile = join(OUTPUT_DIR, `${lang}.json`);

    Bun.write(outputFile, JSON.stringify(merged, null, 2));
    console.log(
      `Merged ${lang}: ${sectionFiles.length} section files (${sectionNames}) → src/generated/translations/${lang}.json (${keyCount} keys)`,
    );
  }

  console.log(`\nGenerated ${langs.length} translation files in src/generated/translations/`);
}

mergeTranslations();
