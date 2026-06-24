import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const ARTICLES_DIR = path.join(process.cwd(), "articles");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Walk articles directory to find the slug
  if (!fs.existsSync(ARTICLES_DIR)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });

  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      if (slugEntry.name !== slug) continue;

      const coverPath = path.join(dateDir, slugEntry.name, "cover.png");
      if (!fs.existsSync(coverPath)) {
        return new NextResponse("Not Found", { status: 404 });
      }

      const buffer = fs.readFileSync(coverPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}
