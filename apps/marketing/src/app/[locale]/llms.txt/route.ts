import { notFound } from "next/navigation";
import { buildLocaleLlmsTxt, llmsResponse } from "@/lib/llms";
import { SEO_LOCALES, type SeoLocale } from "@/lib/seo-data";

export const revalidate = 3600;

export function generateStaticParams() {
  return SEO_LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

/** /en/llms.txt and /ar/llms.txt: full catalogue + policies in one language. */
export async function GET(_request: Request, { params }: Props) {
  const { locale } = await params;
  if (!SEO_LOCALES.includes(locale as SeoLocale)) notFound();
  return llmsResponse(await buildLocaleLlmsTxt(locale as SeoLocale));
}
