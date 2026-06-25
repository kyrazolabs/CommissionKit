import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const COVER_NAMES = ["cover.png", "cover.jpg", "cover.jpeg", "cover.webp"];

function findCover(slug: string): string | null {
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
        if (fs.existsSync(p)) return p;
      }
      return null;
    }
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const coverPath = findCover(slug);
  if (!coverPath) return new NextResponse("Not Found", { status: 404 });

  const { searchParams } = new URL(request.url);
  const width = Math.min(parseInt(searchParams.get("w") || "800", 10) || 800, 2400);
  const format = searchParams.get("format") || "webp";

  try {
    const file = Bun.file(coverPath);
    let image = file.image();

    // Resize if requested width differs from natural width
    const { width: naturalWidth } = await image.metadata();
    if (naturalWidth && naturalWidth > width) {
      image = image.resize(width, undefined, { fit: "inside", withoutEnlargement: true });
    }

    // Encode to requested format
    let buffer: Uint8Array;
    let contentType: string;

    switch (format) {
      case "webp":
        buffer = await image.webp({ quality: 80 }).bytes();
        contentType = "image/webp";
        break;
      case "png":
        buffer = await image.png({ compressionLevel: 6 }).bytes();
        contentType = "image/png";
        break;
      case "jpeg":
        buffer = await image.jpeg({ quality: 85 }).bytes();
        contentType = "image/jpeg";
        break;
      case "avif":
        buffer = await image.avif({ quality: 60 }).bytes();
        contentType = "image/avif";
        break;
      default:
        return new NextResponse("Unsupported format", { status: 400 });
    }

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Vary": "Accept",
      },
    });
  } catch (err: any) {
    // Fallback: serve original file if image processing fails
    if (err?.code === "ERR_IMAGE_FORMAT_UNSUPPORTED") {
      const fallbackBuffer = fs.readFileSync(coverPath);
      const ext = path.extname(coverPath).slice(1);
      const mimeMap: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
      };
      return new NextResponse(Buffer.from(fallbackBuffer), {
        headers: {
          "Content-Type": mimeMap[ext] || "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
    console.error(`[cover] Failed to process image for ${slug}:`, err);
    return new NextResponse("Image processing failed", { status: 500 });
  }
}
