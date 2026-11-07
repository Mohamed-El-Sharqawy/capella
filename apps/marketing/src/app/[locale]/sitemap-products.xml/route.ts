import { buildUrlset, getSeoProducts, productUrls, xmlResponse } from "@/lib/seo-data";

type Props = { params: Promise<{ locale: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { locale } = await params;
  return xmlResponse(buildUrlset(locale, productUrls(await getSeoProducts())));
}
