export interface SearchEvent {
  query: string;
  resultCount: number;
  timestamp?: Date;
}

export interface SearchClickEvent {
  query: string;
  productId: string;
  timestamp?: Date;
}

export interface TrendingProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  badge?: string | null;
}

export interface SearchAnalytics {
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  zeroResultQueries: Array<{
    query: string;
    count: number;
  }>;
  trendingProducts: TrendingProduct[];
}
