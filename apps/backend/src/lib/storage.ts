import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
export const R2_BUCKET_NAME = process.env.R2_BUCKET || "";
export const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

// All uploads live under one prefix — matches the legacy Cloudinary folder
// convention so migrated keys and new keys share the same shape.
export const KEY_PREFIX = "ecommerce";

console.log("[Storage] R2 config loaded:", {
  endpoint: !!R2_ENDPOINT,
  accessKeyId: !!R2_ACCESS_KEY_ID,
  secretAccessKey: !!R2_SECRET_ACCESS_KEY,
  bucket: !!R2_BUCKET_NAME,
  publicUrl: !!R2_PUBLIC_BASE,
});

// R2 speaks the S3 API. `region: "auto"` is required (R2 ignores it) and the
// `endpoint` is what steers the AWS SDK at R2 instead of AWS.
export const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  url: string;
  // The R2 object key — stored in the DB so media can be deleted later.
  publicId: string;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function extFor(file: File): string {
  if (file.type && EXT_BY_MIME[file.type]) return EXT_BY_MIME[file.type];
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return "bin";
}

function buildKey(folder: string, file: File): string {
  const ext = extFor(file);
  const id = crypto.randomUUID();
  return `${KEY_PREFIX}/${folder}/${id}.${ext}`;
}

export abstract class StorageService {
  static async upload(file: File, folder: string): Promise<UploadResult> {
    const key = buildKey(folder, file);
    const buffer = Buffer.from(await file.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );
    return { url: `${R2_PUBLIC_BASE}/${key}`, publicId: key };
  }

  static async uploadMultiple(
    files: File[],
    folder: string
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.upload(file, folder)));
  }

  // R2 does not distinguish image vs video resources (unlike Cloudinary), so
  // this is just an alias kept for API parity with the old service.
  static async uploadVideo(file: File, folder: string): Promise<UploadResult> {
    return this.upload(file, folder);
  }

  static async delete(publicId: string): Promise<void> {
    await r2.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: publicId })
    );
  }

  static async deleteVideo(publicId: string): Promise<void> {
    return this.delete(publicId);
  }

  static async deleteMultiple(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) return;
    await Promise.all(publicIds.map((id) => this.delete(id)));
  }

  static async replace(
    oldPublicId: string,
    newFile: File,
    folder: string
  ): Promise<UploadResult> {
    await this.delete(oldPublicId);
    return this.upload(newFile, folder);
  }

  // Used by the migration script for idempotent re-runs.
  static async exists(key: string): Promise<boolean> {
    try {
      await r2.send(
        new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
      );
      return true;
    } catch {
      return false;
    }
  }
}
