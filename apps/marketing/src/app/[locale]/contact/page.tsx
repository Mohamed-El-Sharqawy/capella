import type { Metadata } from "next";
import { ContactPageClient } from "./client";
import { generatePageMetadata, STATIC_PAGE_METADATA } from "@/lib/metadata";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const content = isArabic ? STATIC_PAGE_METADATA.contact.ar : STATIC_PAGE_METADATA.contact.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "/contact",
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  return <ContactPageClient locale={locale} />;
}
