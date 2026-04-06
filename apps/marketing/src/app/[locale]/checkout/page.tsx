import { Metadata } from "next";
import { CheckoutPageClient } from "./client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  return <CheckoutPageClient locale={locale} />;
}
