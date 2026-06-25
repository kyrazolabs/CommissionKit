import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const COVER_NAMES = ["cover.webp", "cover.png", "cover.jpg", "cover.jpeg"];

function findCover(slug: string): { filePath: string; ext: string } | null {
  if (!fs.existsSync(ARTICLES_DIR)) return null;

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);
    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      if (slugEntry.name !== slug) continue;
      for (const name of COVER_NAMES) {
        const p = path.join(dateDir, slug, name);
        if (fs.existsSync(p)) return { filePath: p, ext: path.extname(name).slice(1) };
      }
      return null;
    }
  }
  return null;
}

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cover = findCover(slug);
  if (!cover) return new NextResponse("Not Found", { status: 404 });

  const buffer = fs.readFileSync(cover.filePath);

  return new Response(buffer, {
    headers: {
      "Content-Type": MIME_MAP[cover.ext] || "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
