import {
  Truck,
  ShieldCheck,
  Gift,
  Phone
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { Accordion, AccordionItem, Checkbox, SocialShare } from "@/components/ui";
import type { UniqueColor, UniqueSize, SizeAvailability } from "../types";
import { useState } from "react";
import Link from "next/link";

interface CartItemInfo {
  variantId: string;
  quantity: number;
}

interface ProductInfoProps {
  product: Product;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  discountPercent: number | null;
  reviewCount: number;
  locale: string;
  // Variant selection
  uniqueColors: UniqueColor[];
  uniqueSizes: UniqueSize[];
  selectedVariant: ProductVariant | null;
  onColorSelect: (colorId: string) => void;
  onSizeSelect: (sizeId: string) => void;
  getSizeAvailability: (sizeId: string) => SizeAvailability;
  hasSizeGuide: boolean;
  onOpenSizeGuide: () => void;
  // Quantity
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  // Actions
  onAddToCart: () => void;
  onBuyNow: () => void;
  isFavourite: boolean;
  isInWishlist: boolean;
  onToggleFavourite: () => void;
  onToggleWishlist: () => void;
  // Cart state
  cartItem: CartItemInfo | null;
  onUpdateCartQuantity: (variantId: string, quantity: number) => void;
}

export function ProductInfo({
  product,
  name,
  price,
  locale,
  uniqueColors,
  selectedVariant,
  onColorSelect,
  onAddToCart,
  isInWishlist,
  onToggleWishlist,
}: ProductInfoProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";
  const [addGiftMessage, setAddGiftMessage] = useState(false);

  const composition = [
    product.material?.[isArabic ? 'nameAr' : 'nameEn'],
    product.stone?.[isArabic ? 'nameAr' : 'nameEn'],
    product.clarity?.[isArabic ? 'nameAr' : 'nameEn']
  ].filter(Boolean).join(', ');

  const benefits = [
    { icon: <Truck className="h-4 w-4" />, text: t("freeShipping") },
    { icon: <ShieldCheck className="h-4 w-4" />, text: t("authenticityCard") },
    { icon: <Gift className="h-4 w-4" />, text: t("giftWrapping") },
  ];

  return (
    <div className="space-y-8 flex flex-col">
      {/* Title & Price */}
      <div className="space-y-3">
        <h1 className="text-xl md:text-2xl font-medium tracking-tight text-gray-900">{name}</h1>
        {composition && (
          <p className="text-sm md:text-base text-gray-500 font-light tracking-wide italic">
            {composition}
          </p>
        )}
        <div className="pt-2">
          <span className="text-lg md:text-xl font-medium">AED {price.toLocaleString()}</span>
        </div>
      </div>

      {/* Gift Toggle */}
      <div className="py-4 border-t border-gray-100">
        <Checkbox
          id="gift-message"
          label={t("addGiftMessage")}
          checked={addGiftMessage}
          onChange={setAddGiftMessage}
        />
      </div>

      {/* Main Actions */}
      <div className="space-y-4 mb-0">
        <button
          onClick={onAddToCart}
          className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors shadow-sm"
        >
          {t("addToBag")}
        </button>

        {/* Benefits List */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-4 text-gray-600">
              <span className="text-gray-400">{benefit.icon}</span>
              <span className="text-xs md:text-sm font-light tracking-wider">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Selection (simplified for Samra look) */}
      <div className="space-y-6">
        {uniqueColors.length > 0 && (
          <div>
            <p className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] mb-3">{t("color")}</p>
            <div className="flex gap-2">
              {uniqueColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onColorSelect(color.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded-full cursor-pointer transition-all ${selectedVariant?.color?.id === color.id
                    ? "ring-2 ring-offset-2 ring-black"
                    : ""
                    }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border-2 transition-all ${selectedVariant?.color?.id === color.id
                      ? "border-black"
                      : "border-gray-200"
                      }`}
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accordions */}
      <div className="pt-4 border-t border-gray-100">
        <Accordion>
          <AccordionItem title={t("description")}>
            <div className="space-y-4">
              <p>{isArabic ? product.shortDescriptionAr : product.shortDescriptionEn}</p>
              <ul className="list-disc pl-4 space-y-1">
                {product.material && <li>{isArabic ? product.material.nameAr : product.material.nameEn}</li>}
                {product.stone && <li>{isArabic ? product.stone.nameAr : product.stone.nameEn}</li>}
              </ul>
            </div>
          </AccordionItem>
          <AccordionItem title={t("exchangeReturn")}>
            <div className="space-y-4 text-xs md:text-sm font-light leading-relaxed text-gray-600">
              <p className="font-medium text-gray-900">
                {t("exchangePriority")}
              </p>
              <p>
                {t("exchangePolicy")}
              </p>
              <p>
                {t("exchangeFees")}
              </p>
              <p>
                {t("exchangeUae")}
              </p>
              <div className="pt-2 border-t border-gray-50 space-y-1">
                <p>{t("contactUsAny")}</p>
                <p className="text-gray-900">Capellaaae@hotmail.com</p>
                <p className="text-gray-900" dir="ltr">+971 52 451 4147</p>
              </div>
            </div>
          </AccordionItem>
          <AccordionItem title={t("orderWrapping")}>
            <p>{t("orderWrappingDesc")}</p>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-3 pt-6">
        {/* <button className="w-full py-3 border border-gray-900 text-[10px] font-medium uppercase tracking-widest hover:bg-gray-50 transition-colors">
          {isArabic ? "حجز موعد" : "BOOK AN APPOINTMENT"}
        </button> */}
        <button
          onClick={onToggleWishlist}
          className="w-full py-3 border border-gray-900 text-xs font-medium uppercase tracking-widest hover:bg-gray-50 transition-colors"
        >
          {isInWishlist ? t("removeFromWishlist") : t("addToWishlist")}
        </button>
      </div>

      {/* Info & SKU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-6">
          <Link href="https://wa.me/971524514147" target="_blank" className="text-gray-400 hover:text-black transition-colors">
            <Phone className="h-4 w-4" />
          </Link>
          <SocialShare
            title={name}
            image={product.variants?.[0]?.images?.[0]?.url}
          />
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-widest font-light">
          SKU: {selectedVariant?.sku || "N/A"}
        </div>
      </div>
    </div>
  );
}
