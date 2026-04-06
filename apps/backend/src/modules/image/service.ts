import { prisma } from "../../lib/prisma";
import { CloudinaryService } from "../../lib/cloudinary";

export abstract class ImageService {
  // ==========================================
  // Product Images (the actual files)
  // ==========================================

  // Upload images to a product (creates ProductImage records)
  static async uploadProductImages(
    productId: string,
    files: File[],
    altEn?: string,
    altAr?: string
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return null;

    const uploads = await CloudinaryService.uploadMultiple(files, "products");

    const images = await Promise.all(
      uploads.map((upload) =>
        prisma.productImage.create({
          data: {
            productId,
            url: upload.url,
            publicId: upload.publicId,
            altEn,
            altAr,
          },
        })
      )
    );

    return images;
  }

  // Get all images for a product
  static async getProductImages(productId: string) {
    return prisma.productImage.findMany({
      where: { productId },
      include: {
        variantImages: {
          include: { variant: { select: { id: true, nameEn: true, nameAr: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // Delete a product image (also removes from Cloudinary and all variant links)
  static async deleteProductImage(imageId: string) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return null;

    await CloudinaryService.delete(image.publicId);
    // Cascade delete will remove ProductVariantImage links
    await prisma.productImage.delete({ where: { id: imageId } });
    return true;
  }

  // Update image alt text
  static async updateProductImage(imageId: string, altEn?: string, altAr?: string) {
    return prisma.productImage.update({
      where: { id: imageId },
      data: { altEn, altAr },
    });
  }

  // ==========================================
  // Variant Image Links (junction table)
  // ==========================================

  // Link an existing image to a variant with a specific position
  static async linkImageToVariant(imageId: string, variantId: string, position?: number) {
    // Check if image and variant exist
    const [image, variant] = await Promise.all([
      prisma.productImage.findUnique({ where: { id: imageId } }),
      prisma.productVariant.findUnique({ where: { id: variantId } }),
    ]);
    if (!image || !variant) return null;

    // Get next position if not specified
    if (position === undefined) {
      const lastLink = await prisma.productVariantImage.findFirst({
        where: { variantId },
        orderBy: { position: "desc" },
      });
      position = (lastLink?.position ?? -1) + 1;
    }

    // Create or update the link
    return prisma.productVariantImage.upsert({
      where: { imageId_variantId: { imageId, variantId } },
      create: { imageId, variantId, position },
      update: { position },
      include: { image: true },
    });
  }

  // Link an image to multiple variants at once
  static async linkImageToVariants(
    imageId: string,
    variantIds: string[]
  ) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return null;

    const results = await Promise.all(
      variantIds.map(async (variantId) => {
        const lastLink = await prisma.productVariantImage.findFirst({
          where: { variantId },
          orderBy: { position: "desc" },
        });
        const position = (lastLink?.position ?? -1) + 1;

        return prisma.productVariantImage.upsert({
          where: { imageId_variantId: { imageId, variantId } },
          create: { imageId, variantId, position },
          update: {},
          include: { image: true },
        });
      })
    );

    return results;
  }

  // Unlink an image from a variant
  static async unlinkImageFromVariant(imageId: string, variantId: string) {
    const link = await prisma.productVariantImage.findUnique({
      where: { imageId_variantId: { imageId, variantId } },
    });
    if (!link) return null;

    await prisma.productVariantImage.delete({
      where: { imageId_variantId: { imageId, variantId } },
    });
    return true;
  }

  // Update image position within a variant
  static async updateImagePosition(imageId: string, variantId: string, position: number) {
    return prisma.productVariantImage.update({
      where: { imageId_variantId: { imageId, variantId } },
      data: { position },
    });
  }

  // Reorder all images for a variant
  static async reorderVariantImages(variantId: string, imageIds: string[]) {
    const updates = imageIds.map((imageId, index) =>
      prisma.productVariantImage.update({
        where: { imageId_variantId: { imageId, variantId } },
        data: { position: index },
      })
    );
    return prisma.$transaction(updates);
  }

  // Get all images for a variant (with position)
  static async getVariantImages(variantId: string) {
    const links = await prisma.productVariantImage.findMany({
      where: { variantId },
      include: { image: true },
      orderBy: { position: "asc" },
    });

    // Return flattened format for frontend
    return links.map((link) => ({
      id: link.id,
      imageId: link.imageId,
      url: link.image.url,
      publicId: link.image.publicId,
      altEn: link.image.altEn,
      altAr: link.image.altAr,
      position: link.position,
    }));
  }

  // ==========================================
  // Legacy support: Upload and link in one step
  // ==========================================

  // Upload images and immediately link to a variant
  static async addVariantImages(
    variantId: string,
    files: File[],
    altEn?: string,
    altAr?: string
  ) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true },
    });
    if (!variant) return null;

    // Upload to product level
    const uploads = await CloudinaryService.uploadMultiple(files, "products");

    // Get next position
    const lastLink = await prisma.productVariantImage.findFirst({
      where: { variantId },
      orderBy: { position: "desc" },
    });
    let position = (lastLink?.position ?? -1) + 1;

    // Create ProductImage and link to variant in one go
    const results = await Promise.all(
      uploads.map(async (upload) => {
        const image = await prisma.productImage.create({
          data: {
            productId: variant.productId,
            url: upload.url,
            publicId: upload.publicId,
            altEn,
            altAr,
          },
        });

        const link = await prisma.productVariantImage.create({
          data: {
            imageId: image.id,
            variantId,
            position: position++,
          },
          include: { image: true },
        });

        return {
          id: link.id,
          imageId: image.id,
          url: image.url,
          publicId: image.publicId,
          altEn: image.altEn,
          altAr: image.altAr,
          position: link.position,
        };
      })
    );

    return results;
  }

  // Delete variant image link (keeps the ProductImage for other variants)
  static async deleteVariantImage(linkId: string) {
    const link = await prisma.productVariantImage.findUnique({
      where: { id: linkId },
      include: { image: true },
    });
    if (!link) return null;

    // Delete the link
    await prisma.productVariantImage.delete({ where: { id: linkId } });

    // Check if image is still used by other variants
    const otherLinks = await prisma.productVariantImage.count({
      where: { imageId: link.imageId },
    });

    // If no other variants use this image, delete it from Cloudinary
    if (otherLinks === 0) {
      await CloudinaryService.delete(link.image.publicId);
      await prisma.productImage.delete({ where: { id: link.imageId } });
    }

    return true;
  }

  // Size Guide Image (stored on Product)
  static async setSizeGuide(productId: string, file: File) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return null;

    // Delete old size guide from Cloudinary if exists
    if (product.sizeGuidePublicId) {
      await CloudinaryService.delete(product.sizeGuidePublicId);
    }

    const upload = await CloudinaryService.upload(file, "size-guides");

    return prisma.product.update({
      where: { id: productId },
      data: {
        sizeGuideUrl: upload.url,
        sizeGuidePublicId: upload.publicId,
      },
      select: { id: true, sizeGuideUrl: true },
    });
  }

  static async deleteSizeGuide(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.sizeGuidePublicId) return null;

    await CloudinaryService.delete(product.sizeGuidePublicId);

    await prisma.product.update({
      where: { id: productId },
      data: { sizeGuideUrl: null, sizeGuidePublicId: null },
    });
    return true;
  }

  // Collection Image (1:1)
  static async setCollectionImage(collectionId: string, file: File, altEn?: string, altAr?: string) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { image: true },
    });
    if (!collection) return null;

    // Delete old image from Cloudinary if exists
    if (collection.image) {
      await CloudinaryService.delete(collection.image.publicId);
      await prisma.collectionImage.delete({ where: { id: collection.image.id } });
    }

    const upload = await CloudinaryService.upload(file, "collections");

    return prisma.collectionImage.create({
      data: {
        collectionId,
        url: upload.url,
        publicId: upload.publicId,
        altEn,
        altAr,
      },
    });
  }

  static async deleteCollectionImage(collectionId: string) {
    const image = await prisma.collectionImage.findUnique({
      where: { collectionId },
    });
    if (!image) return null;

    await CloudinaryService.delete(image.publicId);
    await prisma.collectionImage.delete({ where: { id: image.id } });
    return true;
  }

  // Generic upload (for banners, etc.) - returns URL and publicId without DB storage
  static async uploadGeneric(file: File, folder: string) {
    const upload = await CloudinaryService.upload(file, folder);
    return {
      url: upload.url,
      publicId: upload.publicId,
    };
  }
}
