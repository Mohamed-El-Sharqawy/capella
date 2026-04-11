import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Gift,
  Phone
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { Accordion, AccordionItem, Checkbox, SocialShare } from "@/components/ui";
import type { UniqueColor, UniqueSize, SizeAvailability } from "../types";
import { useState } from "react";

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
  compareAtPrice,
  discountPercent,
  locale,
  uniqueColors,
  uniqueSizes,
  selectedVariant,
  onColorSelect,
  onSizeSelect,
  getSizeAvailability,
  hasSizeGuide,
  onOpenSizeGuide,
  onAddToCart,
  onBuyNow,
  isFavourite,
  isInWishlist,
  onToggleFavourite,
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
    { icon: <Truck className="h-4 w-4" />, text: isArabic ? "شحن مجاني خلال 1-2 أيام في الإمارات" : "Complimentary 1-2 days shipping in UAE" },
    { icon: <Truck className="h-4 w-4" />, text: isArabic ? "شحن مجاني في جميع أنحاء العالم" : "Complimentary worldwide shipping" },
    { icon: <RotateCcw className="h-4 w-4" />, text: isArabic ? "إرجاع سهل خلال 7 أيام" : "No questions asked 7 days easy returns" },
    { icon: <ShieldCheck className="h-4 w-4" />, text: isArabic ? "بطاقة أصالة المجوهرات" : "Jewellery authenticity card" },
    { icon: <Gift className="h-4 w-4" />, text: isArabic ? "تغليف هدايا سامرا الفاخر" : "Signature Samra gift wrapping" },
  ];

  return (
    <div className="space-y-8 flex flex-col">
      {/* Title & Price */}
      <div className="space-y-3">
        <h1 className="text-xl md:text-2xl font-medium tracking-tight text-gray-900">{name}</h1>
        {composition && (
          <p className="text-[11px] md:text-sm text-gray-500 font-light tracking-wide italic">
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
          label={isArabic ? "أضف رسالة هدية" : "ADD A GIFT MESSAGE"}
          checked={addGiftMessage}
          onChange={setAddGiftMessage}
        />
      </div>

      {/* Main Actions */}
      <div className="space-y-4 mb-0">
        <button
          onClick={onAddToCart}
          className="w-full bg-black text-white py-4 text-[11px] font-medium uppercase tracking-[0.3em] hover:bg-neutral-800 transition-colors shadow-sm"
        >
          {isArabic ? "أضف إلى الحقبة" : "ADD TO BAG"}
        </button>

        {/* Benefits List */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-4 text-gray-600">
              <span className="text-gray-400">{benefit.icon}</span>
              <span className="text-[10px] md:text-xs font-light tracking-wider">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Selection (simplified for Samra look) */}
      <div className="space-y-6">
        {uniqueColors.length > 0 && (
          <div>
            <p className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] mb-3">{isArabic ? "اللون" : "Color"}</p>
            <div className="flex gap-3">
              {uniqueColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onColorSelect(color.id)}
                  className={`w-6 h-6 rounded-full border transition-all ${selectedVariant?.color?.id === color.id
                    ? "border-black ring-1 ring-offset-1 ring-black"
                    : "border-gray-200"
                    }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accordions */}
      <div className="pt-4 border-t border-gray-100">
        <Accordion>
          <AccordionItem title={isArabic ? "الوصف" : "Description"}>
            <div className="space-y-4">
              <p>{isArabic ? product.shortDescriptionAr : product.shortDescriptionEn}</p>
              <ul className="list-disc pl-4 space-y-1">
                {product.material && <li>{isArabic ? product.material.nameAr : product.material.nameEn}</li>}
                {product.stone && <li>{isArabic ? product.stone.nameAr : product.stone.nameEn}</li>}
              </ul>
            </div>
          </AccordionItem>
          <AccordionItem title={isArabic ? "الشحن والإرجاع" : "Shipping & Returns"}>
            <p>{isArabic ? "نحن نقدم شحنًا مجانيًا في جميع أنحاء العالم لجميع الطلبات. الإرجاع متاح في غضون 7 أيام." : "We offer complimentary worldwide shipping on all orders. Returns are available within 7 days for any unworn items."}</p>
          </AccordionItem>
          <AccordionItem title={isArabic ? "تغليف الطلبات وتقديم الهدايا" : "Order Wrapping & Gifting"}>
            <p>{isArabic ? "يصل كل طلب من سامرا مغلفًا بذوق رفيع في صندوق هدايا مميز." : "Every Samra order arrives exquisitely wrapped in our signature gift box."}</p>
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
          className="w-full py-3 border border-gray-900 text-[10px] font-medium uppercase tracking-widest hover:bg-gray-50 transition-colors"
        >
          {isArabic ? (isInWishlist ? "حذف من قائمة الأمنيات" : "إضافة إلى قائمة الأمنيات") : (isInWishlist ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST")}
        </button>
      </div>

      {/* Info & SKU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-6">
          <a href="#" className="text-gray-400 hover:text-black transition-colors"><Phone className="h-4 w-4" /></a>
          <SocialShare 
            title={name} 
            image={product.variants?.[0]?.images?.[0]?.url} 
          />
        </div>
        <div className="text-[9px] text-gray-400 uppercase tracking-widest font-light">
          SKU: {selectedVariant?.sku || "N/A"}
        </div>
      </div>
    </div>
  );
}
