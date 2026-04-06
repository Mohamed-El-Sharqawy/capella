import { prisma } from "../../lib/prisma";
import { CloudinaryService } from "../../lib/cloudinary";
import type { Static } from "elysia";
import type { BannerModel } from "./model";

type CreateBannerInput = Static<typeof BannerModel.createBody>;
type UpdateBannerInput = Static<typeof BannerModel.updateBody>;

export abstract class BannerService {
  static async list(query?: { isActive?: string }) {
    const where: any = {};
    
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    return prisma.banner.findMany({
      where,
      orderBy: { position: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.banner.findUnique({
      where: { id },
    });
  }

  static async create(data: CreateBannerInput) {
    return prisma.banner.create({
      data: {
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        subtitleEn: data.subtitleEn,
        subtitleAr: data.subtitleAr,
        buttonTextEn: data.buttonTextEn,
        buttonTextAr: data.buttonTextAr,
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        linkUrl: data.linkUrl,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async update(id: string, data: UpdateBannerInput) {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return null;

    // If image is being replaced, delete old one from Cloudinary
    if (data.publicId && data.publicId !== banner.publicId) {
      await CloudinaryService.delete(banner.publicId);
    }

    return prisma.banner.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return null;

    // Delete image from Cloudinary
    await CloudinaryService.delete(banner.publicId);

    return prisma.banner.delete({ where: { id } });
  }

  static async reorder(ids: string[]) {
    // Update positions based on array order
    const updates = ids.map((id, index) =>
      prisma.banner.update({
        where: { id },
        data: { position: index },
      })
    );
    await prisma.$transaction(updates);
    return true;
  }
}
