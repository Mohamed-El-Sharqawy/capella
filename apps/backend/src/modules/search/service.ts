import { prisma } from "../../lib/prisma";
import type { SearchModel } from "./model";

const SEARCH_LIMIT = 5;
const TRENDING_LIMIT = 8;
const TRENDING_DAYS = 30;

export abstract class SearchService {
  /**
   * Search products and collections with enhanced matching
   * Matches: nameEn/Ar, shortDescriptionEn/Ar, sku, metaTitleEn/Ar, metaDescriptionEn/Ar
   */
  static async search(query: string, limit = SEARCH_LIMIT) {
    const q = query.trim();
    if (!q || q.length < 2) {
      return { products: [], collections: [] };
    }

    const [products, collections] = await Promise.all([
      // Search products with enhanced fields
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
            { shortDescriptionEn: { contains: q, mode: "insensitive" } },
            { shortDescriptionAr: { contains: q, mode: "insensitive" } },
            // T036: Extended search fields
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
            { metaTitleEn: { contains: q, mode: "insensitive" } },
            { metaTitleAr: { contains: q, mode: "insensitive" } },
            { metaDescriptionEn: { contains: q, mode: "insensitive" } },
            { metaDescriptionAr: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          badge: true,
          material: { select: { id: true, nameEn: true, nameAr: true } },
          stone: { select: { id: true, nameEn: true, nameAr: true } },
          clarity: { select: { id: true, nameEn: true, nameAr: true } },
          variants: {
            where: { isActive: true },
            take: 1,
            orderBy: { createdAt: "asc" },
            select: {
              price: true,
              sku: true,
              images: {
                take: 1,
                orderBy: { position: "asc" },
                include: { image: { select: { url: true } } },
              },
            },
          },
        },
        take: limit,
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
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Transform products to include image URL and jewellery attributes
    const transformedProducts = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      price: p.variants[0]?.price ?? null,
      imageUrl: p.variants[0]?.images[0]?.image?.url ?? null,
      badge: p.badge,
      material: p.material,
      stone: p.stone,
      clarity: p.clarity,
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
  }

  /**
   * Get trending products based on search analytics
   * Algorithm:
   * 1. Query AnalyticsDailyStat where type='search.query', last 30 days, group by productId, order by count DESC
   * 2. If fewer than 5 products, supplement with products where isTrending=true
   * 3. Return top 8
   */
  static async getTrending(limit = TRENDING_LIMIT) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - TRENDING_DAYS);

    // 1. Get products from search analytics
    const searchStats = await prisma.analyticsDailyStat.findMany({
      where: {
        type: "search.query",
        date: { gte: thirtyDaysAgo },
        productId: { not: null },
      },
      select: {
        productId: true,
        count: true,
      },
    });

    // Aggregate counts by productId
    const productCounts = new Map<string, number>();
    for (const stat of searchStats) {
      if (stat.productId) {
        const current = productCounts.get(stat.productId) ?? 0;
        productCounts.set(stat.productId, current + stat.count);
      }
    }

    // Sort by count and get top product IDs
    const sortedProductIds = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // Fetch trending products from analytics
    let trendingProducts = await prisma.product.findMany({
      where: {
        id: { in: sortedProductIds.slice(0, limit) },
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        badge: true,
        material: { select: { id: true, nameEn: true, nameAr: true } },
        stone: { select: { id: true, nameEn: true, nameAr: true } },
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
    });

    // 2. If fewer than 5, supplement with isTrending products
    if (trendingProducts.length < 5) {
      const existingIds = new Set(trendingProducts.map((p) => p.id));
      const additionalProducts = await prisma.product.findMany({
        where: {
          id: { notIn: Array.from(existingIds) },
          isActive: true,
          isTrending: true,
        },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameAr: true,
          badge: true,
          material: { select: { id: true, nameEn: true, nameAr: true } },
          stone: { select: { id: true, nameEn: true, nameAr: true } },
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
        take: limit - trendingProducts.length,
      });

      trendingProducts = [...trendingProducts, ...additionalProducts];
    }

    // Transform products
    return trendingProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      price: p.variants[0]?.price ?? null,
      imageUrl: p.variants[0]?.images[0]?.image?.url ?? null,
      badge: p.badge,
      material: p.material,
      stone: p.stone,
    }));
  }

  /**
   * Track a search query event
   */
  static async trackQuery(
    body: SearchModel["trackQueryBody"],
    userId?: string,
    sessionId?: string
  ) {
    await prisma.analyticsEvent.create({
      data: {
        type: "search.query",
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        productId: body.productId ?? null,
        collectionId: body.collectionId ?? null,
        data: {
          query: body.query,
          resultsCount: body.resultsCount,
        },
      },
    });

    // Also update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track query stats (without product/collection for general query tracking)
    // Using Prisma's native handling for composite unique with nullable fields
    const existingStat = await prisma.analyticsDailyStat.findFirst({
      where: {
        date: today,
        type: "search.query",
        productId: null,
        collectionId: null,
      },
    });

    if (existingStat) {
      await prisma.analyticsDailyStat.update({
        where: { id: existingStat.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await prisma.analyticsDailyStat.create({
        data: {
          date: today,
          type: "search.query",
          productId: null,
          collectionId: null,
          count: 1,
          uniqueUsers: userId ? 1 : 0,
        },
      });
    }

    // If product specified, also track product-specific stats
    if (body.productId) {
      const existingProductStat = await prisma.analyticsDailyStat.findFirst({
        where: {
          date: today,
          type: "search.query",
          productId: body.productId,
          collectionId: null,
        },
      });

      if (existingProductStat) {
        await prisma.analyticsDailyStat.update({
          where: { id: existingProductStat.id },
          data: { count: { increment: 1 } },
        });
      } else {
        await prisma.analyticsDailyStat.create({
          data: {
            date: today,
            type: "search.query",
            productId: body.productId,
            collectionId: null,
            count: 1,
            uniqueUsers: userId ? 1 : 0,
          },
        });
      }
    }

    return { tracked: true };
  }

  /**
   * Track a search result click event
   */
  static async trackClick(
    body: SearchModel["trackClickBody"],
    userId?: string,
    sessionId?: string
  ) {
    await prisma.analyticsEvent.create({
      data: {
        type: "search.click",
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        productId: body.productId ?? null,
        collectionId: body.collectionId ?? null,
        data: {
          query: body.query,
          position: body.position,
        },
      },
    });

    return { tracked: true };
  }

  /**
   * Get search analytics for admin dashboard
   * Returns: topQueries, zeroResultQueries, trendingProducts
   */
  static async getAnalytics(query: SearchModel["analyticsQuery"]) {
    const days = Number(query.days) || 7;
    const limit = Number(query.limit) || 10;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all search events
    const searchEvents = await prisma.analyticsEvent.findMany({
      where: {
        type: "search.query",
        createdAt: { gte: startDate },
      },
      select: {
        data: true,
        createdAt: true,
      },
    });

    // Aggregate queries
    const queryCounts = new Map<string, { count: number; resultsCount: number[] }>();
    for (const event of searchEvents) {
      const data = event.data as { query?: string; resultsCount?: number };
      if (data.query) {
        const existing = queryCounts.get(data.query) ?? { count: 0, resultsCount: [] };
        existing.count++;
        if (typeof data.resultsCount === "number") {
          existing.resultsCount.push(data.resultsCount);
        }
        queryCounts.set(data.query, existing);
      }
    }

    // Sort by count for top queries
    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgResults:
          data.resultsCount.length > 0
            ? Math.round(data.resultsCount.reduce((a, b) => a + b, 0) / data.resultsCount.length)
            : 0,
      }));

    // Zero result queries (avgResults === 0)
    const zeroResultQueries = Array.from(queryCounts.entries())
      .filter(([, data]) => {
        const avg =
          data.resultsCount.length > 0
            ? data.resultsCount.reduce((a, b) => a + b, 0) / data.resultsCount.length
            : 0;
        return avg === 0;
      })
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([query, data]) => ({
        query,
        count: data.count,
      }));

    // Get trending products from daily stats
    const trendingStats = await prisma.analyticsDailyStat.findMany({
      where: {
        type: "search.query",
        date: { gte: startDate },
        productId: { not: null },
      },
      select: {
        productId: true,
        count: true,
      },
    });

    const productCounts = new Map<string, number>();
    for (const stat of trendingStats) {
      if (stat.productId) {
        const current = productCounts.get(stat.productId) ?? 0;
        productCounts.set(stat.productId, current + stat.count);
      }
    }

    const trendingProductIds = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const trendingProducts = await prisma.product.findMany({
      where: { id: { in: trendingProductIds } },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
      },
    });

    // Merge with counts
    const trendingWithCounts = trendingProducts.map((p) => ({
      ...p,
      searchCount: productCounts.get(p.id) ?? 0,
    }));

    return {
      topQueries,
      zeroResultQueries,
      trendingProducts: trendingWithCounts,
    };
  }
}
