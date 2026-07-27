import { prisma } from "../../lib/prisma";
import { CURRENCY, toContentId } from "@ecommerce/shared-utils";

const MAX_ADDITIONAL_IMAGES = 10;
const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_BRAND_LENGTH = 70;
const MAX_ID_LENGTH = 50;
const FEED_CACHE_TTL_MS = 5 * 60 * 1000;

const COLLECTION_TO_GPC: Record<string, number> = {
  rings: 200,
  necklaces: 196,
  earrings: 194,
  bracelets: 191,
  anklets: 189,
  charms: 192,
  pendants: 192,
  sets: 6463,
  watches: 201,
  brooches: 197,
  pins: 197,
};

const FALLBACK_GPC = 188;

const FEED_COLUMNS = [
  "id",
  "item_group_id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "mpn",
  "google_product_category",
  "product_type",
  "gender",
  "age_group",
  "material",
  "color",
] as const;

function getBrand(): string {
  return (process.env.META_FEED_BRAND || "Capella").slice(0, MAX_BRAND_LENGTH);
}

function getStorefrontUrl(): string {
  return (process.env.MARKETING_URL || "http://localhost:3000").replace(/\/$/, "");
}

function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} ${CURRENCY}`;
}

function mapGender(gender: string): string {
  if (gender === "MEN") return "male";
  if (gender === "WOMEN") return "female";
  return "unisex";
}

function pickGoogleCategory(collectionSlugs: string[]): number {
  for (const slug of collectionSlugs) {
    const lower = slug.toLowerCase();
    if (COLLECTION_TO_GPC[lower] != null) return COLLECTION_TO_GPC[lower];
    for (const key of Object.keys(COLLECTION_TO_GPC)) {
      if (lower.includes(key)) return COLLECTION_TO_GPC[key];
    }
  }
  return FALLBACK_GPC;
}

function tsvEscape(value: string): string {
  return value.replace(/[\t\r\n]/g, " ");
}

interface VariantImageLink {
  position: number;
  image: { url: string };
}

interface FeedProduct {
  id: string;
  slug: string;
  nameEn: string;
  descriptionEn: string;
  shortDescriptionEn: string | null;
  gender: string;
  isActive: boolean;
  material: { nameEn: string } | null;
  productCollections: Array<{ collection: { slug: string; nameEn: string } }>;
  images: Array<{ url: string }>;
  variants: Array<{
    id: string;
    sku: string | null;
    nameEn: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    isActive: boolean;
    images: VariantImageLink[];
  }>;
}

function buildTitle(productName: string, variantName: string): string {
  const title = variantName && variantName.trim()
    ? `${productName} - ${variantName}`
    : productName;
  return truncateAtWord(cleanText(title), MAX_TITLE_LENGTH);
}

function buildAvailability(stock: number, variantActive: boolean, productActive: boolean): string {
  return stock > 0 && variantActive && productActive ? "in stock" : "out of stock";
}

function collectImageUrls(variant: FeedProduct["variants"][number], product: FeedProduct): string[] {
  const urls: string[] = [];
  for (const link of variant.images) {
    if (link.image?.url) urls.push(link.image.url);
  }
  for (const img of product.images) {
    if (img.url && !urls.includes(img.url)) urls.push(img.url);
  }
  return urls;
}

function buildRow(product: FeedProduct, variant: FeedProduct["variants"][number]): string[] | null {
  const imageUrls = collectImageUrls(variant, product);
  if (imageUrls.length === 0) return null;

  // Single source of truth: `toContentId` in shared-utils. Every Pixel/CAPI event
  // emits the same string so Meta can correlate events with this feed row.
  const id = toContentId({ sku: variant.sku, id: variant.id }).slice(0, MAX_ID_LENGTH);

  const description = truncateAtWord(
    cleanText(product.descriptionEn || product.shortDescriptionEn),
    MAX_DESCRIPTION_LENGTH
  );
  if (!description) return null;

  const productName = cleanText(product.nameEn);
  if (!productName) return null;

  const title = buildTitle(productName, variant.nameEn);

  const hasSale =
    variant.compareAtPrice != null && variant.compareAtPrice > variant.price;
  const priceValue = hasSale ? (variant.compareAtPrice as number) : variant.price;
  const salePrice = hasSale ? variant.price : null;

  const collectionSlugs = product.productCollections.map((pc) => pc.collection.slug);
  const googleCategory = pickGoogleCategory(collectionSlugs);
  const productType =
    product.productCollections[0]?.collection.nameEn || "Jewelry";

  const imageLink = imageUrls[0];
  const additionalImages = imageUrls.slice(1, 1 + MAX_ADDITIONAL_IMAGES);

  const fields: Record<string, string> = {
    id,
    item_group_id: product.id,
    title,
    description,
    availability: buildAvailability(variant.stock, variant.isActive, product.isActive),
    condition: "new",
    price: formatPrice(priceValue),
    sale_price: salePrice != null ? formatPrice(salePrice) : "",
    link: `${getStorefrontUrl()}/en/products/${product.slug}`,
    image_link: imageLink,
    additional_image_link: additionalImages.join(","),
    brand: getBrand(),
    mpn: variant.sku ? tsvEscape(variant.sku) : "",
    google_product_category: String(googleCategory),
    product_type: tsvEscape(productType),
    gender: mapGender(product.gender),
    age_group: "adult",
    material: product.material ? tsvEscape(product.material.nameEn) : "",
    color: product.material ? tsvEscape(product.material.nameEn) : "",
  };

  return FEED_COLUMNS.map((col) => tsvEscape(fields[col] ?? ""));
}

function serializeFeed(rows: string[][]): string {
  const lines = [FEED_COLUMNS.join("\t")];
  for (const row of rows) {
    lines.push(row.join("\t"));
  }
  return lines.join("\n");
}

async function buildFeed(): Promise<string> {
  const products = (await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        include: {
          images: {
            orderBy: { position: "asc" },
            include: { image: { select: { url: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      productCollections: {
        include: { collection: { select: { slug: true, nameEn: true } } },
        orderBy: { position: "asc" },
      },
      material: { select: { nameEn: true } },
      images: { select: { url: true } },
    },
  })) as unknown as FeedProduct[];

  const rows: string[][] = [];
  let skipped = 0;

  for (const product of products) {
    for (const variant of product.variants) {
      const row = buildRow(product, variant);
      if (row) {
        rows.push(row);
      } else {
        skipped++;
      }
    }
  }

  if (skipped > 0) {
    console.warn(`[meta-catalog] Skipped ${skipped} variant(s) missing image or description`);
  }

  return serializeFeed(rows);
}

let cache: { at: number; body: string } | null = null;

export abstract class MetaCatalogService {
  static async getFeed(): Promise<string> {
    if (cache && Date.now() - cache.at < FEED_CACHE_TTL_MS) {
      return cache.body;
    }
    const body = await buildFeed();
    cache = { at: Date.now(), body };
    return body;
  }

  static clearCache(): void {
    cache = null;
  }
}
