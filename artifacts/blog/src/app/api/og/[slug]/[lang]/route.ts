import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { findArticleDir } from "@/lib/posts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; lang: string }> }
) {
  const { slug, lang } = await params;

  // Look for per-article per-language OG image
  const articleDir = findArticleDir(slug);
  if (articleDir) {
    const ogPath = path.join(articleDir, "opengraphimages", `${lang}.webp`);
    if (fs.existsSync(ogPath)) {
      const buffer = /*turbopackIgnore: true*/ fs.readFileSync(ogPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  // Fallback to generic og.png
  const fallbackPath = path.join(process.cwd(), "public", "og.png");
  if (fs.existsSync(fallbackPath)) {
    const buffer = /*turbopackIgnore: true*/ fs.readFileSync(fallbackPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new NextResponse("Not Found", { status: 404 });
}
