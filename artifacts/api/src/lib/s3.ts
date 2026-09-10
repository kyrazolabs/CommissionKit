import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function getS3Bucket(): string | null {
  return process.env.S3_BUCKET_NAME || null;
}

export function getS3Client(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY || "",
    },
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
  return client;
}

export function isS3Configured(): boolean {
  return Boolean(getS3Bucket() && (process.env.S3_ACCESS_KEY_ID || process.env.S3_ENDPOINT));
}
