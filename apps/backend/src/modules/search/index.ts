import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";

const SEARCH_LIMIT = 5;

export const searchController = new Elysia({ prefix: "/search" })
  .get("/", async ({ query }) => {
    const q = query.q?.trim();
    
    if (!q || q.length < 2) {
      return { products: [], collections: [] };
    }

    const [products, collections] = await Promise.all([
      // Search products
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
            { shortDescriptionEn: { contains: q, mode: "insensitive" } },
            { shortDescriptionAr: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          variants: {
            where: { isActive: true },
            take: 1,
            orderBy: { createdAt: "asc" },
            select: {
              price: true,
              images: {
                take: 1,
                orderBy: { position: "asc" },
                include: { image: { select: { url: true } } },
              },
            },
          },
        },
        take: SEARCH_LIMIT,
        orderBy: { createdAt: "desc" },
      }),

      // Search collections
      prisma.collection.findMany({
        where: {
          isActive: true,
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
            { descriptionEn: { contains: q, mode: "insensitive" } },
            { descriptionAr: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          image: true,
        },
        take: SEARCH_LIMIT,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Transform products to include image URL
    const transformedProducts = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      price: p.variants[0]?.price ?? null,
      imageUrl: p.variants[0]?.images[0]?.image?.url ?? null,
    }));

    // Transform collections to include image URL
    const transformedCollections = collections.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      imageUrl: (c.image as any)?.url ?? null,
    }));

    return {
      products: transformedProducts,
      collections: transformedCollections,
    };
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
    }),
  });
