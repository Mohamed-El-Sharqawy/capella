import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

// Debug: Log if credentials are present (not the actual values)
console.log("[Cloudinary] Config loaded:", {
  cloud_name: !!CLOUD_NAME,
  api_key: !!API_KEY,
  api_secret: !!API_SECRET,
});

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export { cloudinary };

export interface UploadResult {
  url: string;
  publicId: string;
}

export abstract class CloudinaryService {
  static async upload(
    file: File,
    folder: string
  ): Promise<UploadResult> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `ecommerce/${folder}`,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  static async uploadMultiple(
    files: File[],
    folder: string
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.upload(file, folder)));
  }

  static async uploadVideo(
    file: File,
    folder: string
  ): Promise<UploadResult> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `ecommerce/${folder}`,
      resource_type: "video",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  static async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  static async deleteVideo(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
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
}
