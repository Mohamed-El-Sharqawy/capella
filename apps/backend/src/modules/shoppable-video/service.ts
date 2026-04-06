import { prisma } from "../../lib/prisma";
import { CloudinaryService } from "../../lib/cloudinary";

const SHOPPABLE_VIDEO_INCLUDE = {
  product: {
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" as const },
        include: {
          color: true,
          size: true,
          images: {
            orderBy: { position: "asc" as const },
            include: { image: true },
          },
        },
      },
    },
  },
} as const;

export abstract class ShoppableVideoService {
  static async list(activeOnly = false) {
    return prisma.shoppableVideo.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: SHOPPABLE_VIDEO_INCLUDE,
      orderBy: { position: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.shoppableVideo.findUnique({
      where: { id },
      include: SHOPPABLE_VIDEO_INCLUDE,
    });
  }

  static async create(data: {
    productId: string;
    videoUrl: string;
    videoPublicId: string;
    thumbnailUrl: string;
    thumbnailPublicId: string;
    position?: number;
    isActive?: boolean;
  }) {
    return prisma.shoppableVideo.create({
      data: {
        productId: data.productId,
        videoUrl: data.videoUrl,
        videoPublicId: data.videoPublicId,
        thumbnailUrl: data.thumbnailUrl,
        thumbnailPublicId: data.thumbnailPublicId,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
      include: SHOPPABLE_VIDEO_INCLUDE,
    });
  }

  static async update(
    id: string,
    data: {
      productId?: string;
      position?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.shoppableVideo.update({
      where: { id },
      data,
      include: SHOPPABLE_VIDEO_INCLUDE,
    });
  }

  static async delete(id: string) {
    const video = await prisma.shoppableVideo.findUnique({ where: { id } });
    if (!video) return null;

    // Delete from Cloudinary (video needs resource_type: video)
    await CloudinaryService.deleteVideo(video.videoPublicId);
    await CloudinaryService.delete(video.thumbnailPublicId);

    await prisma.shoppableVideo.delete({ where: { id } });
    return true;
  }

  static async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      prisma.shoppableVideo.update({
        where: { id },
        data: { position: index },
      })
    );
    await prisma.$transaction(updates);
    return true;
  }
}
