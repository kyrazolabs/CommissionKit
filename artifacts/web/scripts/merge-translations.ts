import { readdirSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const TRANSLATIONS_DIR = resolve(import.meta.dirname, "../translations");
const OUTPUT_DIR = resolve(import.meta.dirname, "../src/i18n/generated");

function mergeTranslations(): void {
  const items = readdirSync(TRANSLATIONS_DIR, { withFileTypes: true });
  const langs = items
    .filter((item) => item.isDirectory())
    .map((item) => item.name);

  if (langs.length === 0) {
    console.log("No language directories found in translations/");
    return;
  }

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
      const sectionName = file.replace(".json", "");
      const raw = readFileSync(join(langDir, file), "utf-8");
      merged[sectionName] = JSON.parse(raw);
    }

    const keyCount = Object.keys(merged).length;
    const sectionNames = sectionFiles
      .map((f) => f.replace(".json", ""))
      .join(", ");
    const outputFile = join(OUTPUT_DIR, `${lang}.json`);

    Bun.write(outputFile, JSON.stringify(merged, null, 2));
    console.log(
      `Merged ${lang}: ${sectionFiles.length} section files (${sectionNames}) → src/i18n/generated/${lang}.json (${keyCount} sections)`,
    );
  }

  console.log(`\nGenerated ${langs.length} translation files in src/i18n/generated/`);
}

mergeTranslations();
