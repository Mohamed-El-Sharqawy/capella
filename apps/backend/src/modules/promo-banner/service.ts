import { prisma } from "../../lib/prisma";
import { StorageService } from "../../lib/storage";
import type { Static } from "elysia";
import type { PromoBannerModel } from "./model";

type CreateInput = Static<typeof PromoBannerModel.createBody>;
type UpdateInput = Static<typeof PromoBannerModel.updateBody>;

export abstract class PromoBannerService {
  static async list(query?: { isActive?: string }) {
    const where: any = {};

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    return prisma.promoBanner.findMany({
      where,
      orderBy: { position: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.promoBanner.findUnique({
      where: { id },
    });
  }

  static async create(data: CreateInput) {
    return prisma.promoBanner.create({
      data: {
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        buttonTextEn: data.buttonTextEn,
        buttonTextAr: data.buttonTextAr,
        linkUrl: data.linkUrl,
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async update(id: string, data: UpdateInput) {
    const banner = await prisma.promoBanner.findUnique({ where: { id } });
    if (!banner) return null;

    if (data.publicId && data.publicId !== banner.publicId) {
      await StorageService.delete(banner.publicId);
    }

    return prisma.promoBanner.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const banner = await prisma.promoBanner.findUnique({ where: { id } });
    if (!banner) return null;

    await StorageService.delete(banner.publicId);

    return prisma.promoBanner.delete({ where: { id } });
  }

  static async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      prisma.promoBanner.update({
        where: { id },
        data: { position: index },
      })
    );
    await prisma.$transaction(updates);
    return true;
  }
}
