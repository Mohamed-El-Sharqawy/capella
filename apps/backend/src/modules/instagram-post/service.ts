import { prisma } from "../../lib/prisma";
import { CloudinaryService } from "../../lib/cloudinary";

export abstract class InstagramPostService {
  static async list(activeOnly = false) {
    return prisma.instagramPost.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.instagramPost.findUnique({
      where: { id },
    });
  }

  static async create(data: {
    imageUrl: string;
    publicId: string;
    linkUrl?: string;
    altEn?: string;
    altAr?: string;
    position?: number;
    isActive?: boolean;
  }) {
    return prisma.instagramPost.create({
      data: {
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        linkUrl: data.linkUrl,
        altEn: data.altEn,
        altAr: data.altAr,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async update(
    id: string,
    data: {
      linkUrl?: string;
      altEn?: string;
      altAr?: string;
      position?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.instagramPost.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const post = await prisma.instagramPost.findUnique({ where: { id } });
    if (!post) return null;

    // Delete from Cloudinary
    await CloudinaryService.delete(post.publicId);

    await prisma.instagramPost.delete({ where: { id } });
    return true;
  }

  static async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      prisma.instagramPost.update({
        where: { id },
        data: { position: index },
      })
    );
    await prisma.$transaction(updates);
    return true;
  }
}
