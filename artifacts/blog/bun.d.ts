// Type declarations for Bun APIs used in the blog
declare module "bun" {
  interface BunFile {
    image(): BunImage;
  }
}

declare var Bun: {
  file(path: string): {
    image(): BunImage;
  };
};

interface BunImageMetadata {
  width: number;
  height: number;
  format: string;
}

interface BunImageResizeOptions {
  fit?: "fill" | "inside";
  withoutEnlargement?: boolean;
  filter?: string;
}

interface BunImageFormatOptions {
  quality?: number;
  compressionLevel?: number;
  lossless?: boolean;
}

interface BunImage {
  metadata(): Promise<BunImageMetadata>;
  resize(width: number, height?: number, options?: BunImageResizeOptions): BunImage;
  webp(options?: BunImageFormatOptions): BunImage;
  png(options?: BunImageFormatOptions): BunImage;
  jpeg(options?: BunImageFormatOptions): BunImage;
  avif(options?: BunImageFormatOptions): BunImage;
  bytes(): Promise<Uint8Array>;
}
