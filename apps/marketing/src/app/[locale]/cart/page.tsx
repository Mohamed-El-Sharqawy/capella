import { Metadata } from "next";
import { CartPageClient } from "./client";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "View your shopping cart",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  return <CartPageClient locale={locale} />;
}
