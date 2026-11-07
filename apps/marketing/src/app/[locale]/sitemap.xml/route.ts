import {
  buildUrlset,
  collectionUrls,
  getSeoCollections,
  getSeoProducts,
  productUrls,
  staticPageUrls,
  xmlResponse,
} from "@/lib/seo-data";

type Props = { params: Promise<{ locale: string }> };

/** Combined sitemap for one locale (kept for anyone who submitted it directly). */
export async function GET(_request: Request, { params }: Props) {
  const { locale } = await params;
  const [products, collections] = await Promise.all([getSeoProducts(), getSeoCollections()]);
  return xmlResponse(
    buildUrlset(locale, [...staticPageUrls(), ...collectionUrls(collections), ...productUrls(products)]),
  );
}
