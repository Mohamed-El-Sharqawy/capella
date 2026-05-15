import { prisma } from "../../lib/prisma";

export abstract class DashboardService {
  static async getStats() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = thisMonth;

    const [
      totalRevenue,
      thisMonthRevenueResult,
      totalOrders,
      thisMonthOrdersCount,
      totalProducts,
      totalCustomers,
      thisMonthNewCustomers,
      recentOrders,
      paymentBreakdown,
      orderStatusBreakdown,
      topProductsRaw,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: { in: ["CUSTOMER", "GUEST"] } } }),
      prisma.user.count({
        where: { role: { in: ["CUSTOMER", "GUEST"] }, createdAt: { gte: thisMonth } },
      }),
      prisma.order.findMany({
        include: {
          items: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          coupon: { select: { id: true, code: true, discountType: true, discountValue: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["paymentMethod"],
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.orderItem.groupBy({
        by: ["variantId"],
        _sum: { quantity: true, price: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

    const currentDay = now.getDate();

    const lastMonthSamePeriodEnd = new Date(lastMonthStart);
    lastMonthSamePeriodEnd.setDate(lastMonthSamePeriodEnd.getDate() + currentDay);

    const [
      lastMonthSamePeriodRevenue,
      lastMonthSamePeriodOrders,
      lastMonthSamePeriodCustomers,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: lastMonthStart, lt: lastMonthSamePeriodEnd } },
      }),
      prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthSamePeriodEnd } } }),
      prisma.user.count({
        where: { role: { in: ["CUSTOMER", "GUEST"] }, createdAt: { gte: lastMonthStart, lt: lastMonthSamePeriodEnd } },
      }),
    ]);

    const revenueChange = lastMonthSamePeriodRevenue._sum.total
      ? ((thisMonthRevenueResult._sum.total || 0) - lastMonthSamePeriodRevenue._sum.total) / lastMonthSamePeriodRevenue._sum.total * 100
      : thisMonthRevenueResult._sum.total ? 100 : 0;

    const ordersChange = lastMonthSamePeriodOrders
      ? ((thisMonthOrdersCount - lastMonthSamePeriodOrders) / lastMonthSamePeriodOrders) * 100
      : thisMonthOrdersCount ? 100 : 0;

    const customersChange = lastMonthSamePeriodCustomers
      ? ((thisMonthNewCustomers - lastMonthSamePeriodCustomers) / lastMonthSamePeriodCustomers) * 100
      : thisMonthNewCustomers ? 100 : 0;
    const avgOrdersPerDay = currentDay > 0 ? Math.round((thisMonthOrdersCount / currentDay) * 100) / 100 : 0;

    const returningCustomers = totalCustomers > 0 ? totalCustomers - thisMonthNewCustomers : 0;

    const totalPaymentOrders = paymentBreakdown.reduce((sum, p) => sum + p._count.id, 0);
    const totalPaymentRevenue = paymentBreakdown.reduce((sum, p) => sum + (p._sum.total || 0), 0);

    const paymentMethods = paymentBreakdown.map((p) => ({
      method: p.paymentMethod || "COD",
      orderCount: p._count.id,
      revenue: p._sum.total || 0,
      orderPercentage: totalPaymentOrders > 0 ? Math.round((p._count.id / totalPaymentOrders) * 10000) / 100 : 0,
      revenuePercentage: totalPaymentRevenue > 0 ? Math.round(((p._sum.total || 0) / totalPaymentRevenue) * 10000) / 100 : 0,
    }));

    const orderStatusCounts = orderStatusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
      revenue: s._sum.total || 0,
    }));

    const revenueTrend = await DashboardService.getRevenueTrend(30);
    const ordersTrend = await DashboardService.getOrdersTrend(30);
    const topCollections = await DashboardService.getTopCollections();
    const topProducts = await DashboardService.getTopProducts(topProductsRaw);
    const topSearchTerms = await DashboardService.getTopSearchTerms(5);

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      revenueChange: Math.round(revenueChange * 100) / 100,
      totalOrders,
      ordersChange: Math.round(ordersChange * 100) / 100,
      totalProducts,
      totalCustomers,
      customersChange: Math.round(customersChange * 100) / 100,
      thisMonthRevenue: thisMonthRevenueResult._sum.total || 0,
      thisMonthOrders: thisMonthOrdersCount,
      avgOrdersPerDay,
      thisMonthNewCustomers,
      returningCustomers,
      recentOrders,
      paymentMethods,
      orderStatusCounts,
      revenueTrend,
      ordersTrend,
      topCollections,
      topProducts,
      topSearchTerms,
    };
  }

  private static async getRevenueTrend(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { total: true, createdAt: true },
    });

    const trend = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      trend.set(key, 0);
    }

    for (const order of orders) {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (trend.has(key)) {
        trend.set(key, (trend.get(key) || 0) + order.total);
      }
    }

    return Array.from(trend.entries()).map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));
  }

  private static async getOrdersTrend(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const trend = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      trend.set(key, 0);
    }

    for (const order of orders) {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (trend.has(key)) {
        trend.set(key, (trend.get(key) || 0) + 1);
      }
    }

    return Array.from(trend.entries()).map(([date, count]) => ({ date, count }));
  }

  private static async getTopCollections() {
    const topVariantIds = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 20,
    });

    if (topVariantIds.length === 0) return [];

    const variantIds = topVariantIds.map((t) => t.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, productId: true },
    });

    const productIds = [...new Set(variants.map((v) => v.productId))];

    const productCollections = await prisma.productCollection.findMany({
      where: { productId: { in: productIds } },
      select: {
        productId: true,
        collection: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            slug: true,
            image: { select: { url: true } },
          },
        },
      },
    });

    const variantProductMap = new Map(variants.map((v) => [v.id, v.productId]));
    const productCollectionMap = new Map<string, typeof productCollections[0]["collection"][]>();
    for (const pc of productCollections) {
      const list = productCollectionMap.get(pc.productId) || [];
      list.push(pc.collection);
      productCollectionMap.set(pc.productId, list);
    }

    const collectionStats = new Map<string, { id: string; nameEn: string; nameAr: string; slug: string; imageUrl: string | null; totalQuantity: number; orderCount: number }>();

    for (const tv of topVariantIds) {
      const productId = variantProductMap.get(tv.variantId);
      if (!productId) continue;
      const cols = productCollectionMap.get(productId);
      if (!cols) continue;

      for (const col of cols) {
        const existing = collectionStats.get(col.id);
        const qty = tv._sum.quantity || 0;
        if (existing) {
          existing.totalQuantity += qty;
          existing.orderCount += tv._count.id;
        } else {
          collectionStats.set(col.id, {
            id: col.id,
            nameEn: col.nameEn,
            nameAr: col.nameAr,
            slug: col.slug,
            imageUrl: col.image?.url || null,
            totalQuantity: qty,
            orderCount: tv._count.id,
          });
        }
      }
    }

    return [...collectionStats.values()].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 5);
  }

  private static async getTopProducts(topProductsRaw: { variantId: string; _sum: { quantity: number | null; price: number | null }; _count: { id: number } }[]) {
    if (topProductsRaw.length === 0) return [];

    const variantIds = topProductsRaw.map((t) => t.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        nameEn: true,
        productId: true,
        product: { select: { id: true, nameEn: true, slug: true } },
        images: {
          orderBy: { position: "asc" as const },
          take: 1,
          include: { image: { select: { url: true } } },
        },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return topProductsRaw.map((tp) => {
      const variant = variantMap.get(tp.variantId);
      const quantity = tp._sum.quantity || 0;
      const revenue = (tp._sum.price || 0) * quantity;
      return {
        productId: variant?.product.id || "",
        productName: variant?.product.nameEn || "",
        productSlug: variant?.product.slug || "",
        variantName: variant?.nameEn || "",
        imageUrl: variant?.images[0]?.image?.url || null,
        sales: quantity,
        revenue: Math.round(revenue * 100) / 100,
      };
    }).filter((p) => p.productId);
  }

  private static async getTopSearchTerms(limit: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchEvents = await prisma.analyticsEvent.findMany({
      where: {
        type: "search.query",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { data: true },
    });

    const queryCounts = new Map<string, number>();
    for (const event of searchEvents) {
      const data = event.data as { query?: string };
      if (data.query) {
        const q = data.query.toLowerCase().trim();
        queryCounts.set(q, (queryCounts.get(q) || 0) + 1);
      }
    }

    return Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }
}
