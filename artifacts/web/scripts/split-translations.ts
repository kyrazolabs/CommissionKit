import { readFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const LOCALES_DIR = resolve(import.meta.dirname, "../src/i18n/locales");
const OUTPUT_DIR = resolve(import.meta.dirname, "../translations");

// Read all locale JSON files
const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const file of files) {
  const lang = file.replace(".json", "");
  const raw = readFileSync(join(LOCALES_DIR, file), "utf-8");
  const data = JSON.parse(raw);

  const langDir = join(OUTPUT_DIR, lang);
  if (!existsSync(langDir)) {
    mkdirSync(langDir, { recursive: true });
  }

  for (const [section, content] of Object.entries(data)) {
    const sectionFile = join(langDir, `${section}.json`);
    Bun.write(sectionFile, JSON.stringify(content, null, 2));
    console.log(`  ${lang}/${section}.json`);
  }

  console.log(`Split ${lang}: ${Object.keys(data).length} sections`);
}

console.log(`\nDone. Split ${files.length} locale(s) into ${OUTPUT_DIR}/`);
