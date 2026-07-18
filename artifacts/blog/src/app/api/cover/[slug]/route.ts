import { NextResponse } from "next/server";
import fs from "node:fs";
import { findCover } from "@/lib/cover";

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

  const buffer = /*turbopackIgnore: true*/ fs.readFileSync(cover.filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME_MAP[cover.ext] || "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
