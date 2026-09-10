const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024;

export function assertProductImage(contentType: string | undefined, size: number): void {
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    throw new Error("Image must be jpeg, png, webp, or gif");
  }
  if (size > MAX_BYTES) {
    throw new Error("Image must be 2MB or smaller");
  }
}

export async function resizeProductImage(input: Uint8Array): Promise<Uint8Array> {
  const Image = (globalThis as unknown as { Bun: { Image: new (data: Uint8Array) => BunImage } })
    .Bun.Image;
  const bytes = await new Image(input)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .bytes();
  return bytes;
}

interface BunImage {
  resize: (
    width: number,
    height?: number,
    options?: { fit?: string; withoutEnlargement?: boolean },
  ) => BunImage;
  webp: (options?: { quality?: number }) => BunImage;
  bytes: () => Promise<Uint8Array>;
}
