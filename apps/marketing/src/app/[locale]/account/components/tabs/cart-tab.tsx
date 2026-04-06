"use client";

import Image from "next/image";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import type { CartTabProps } from "../../types";

export function CartTab({ locale }: CartTabProps) {
  const t = useTranslations("account.cartTab");
  const { items: cartItems, total: cartTotal, removeItem, updateQuantity } = useCart();
  const isArabic = locale === "ar";

  if (cartItems.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t("title")} (0)
        </h2>
        <div className="bg-white border rounded-lg p-8 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t("emptyCart")}
          </p>
          <Link
            href="/collections"
            className="inline-block mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            {t("startShopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {t("title")} ({cartItems.length})
      </h2>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm">
            <tr>
              <th className="text-left px-4 py-3">{t("product")}</th>
              <th className="text-center px-4 py-3">{isArabic ? "اللون" : "Color"}</th>
              <th className="text-center px-4 py-3">{isArabic ? "المقاس" : "Size"}</th>
              <th className="text-center px-4 py-3">{t("price")}</th>
              <th className="text-center px-4 py-3">{t("quantity")}</th>
              <th className="text-right px-4 py-3">{t("total")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cartItems.map((item) => (
              <tr key={item.variantId}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden relative shrink-0">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={isArabic ? item.productNameAr : item.productNameEn}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                    </div>
                    <div>
                      <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline text-sm">
                        {isArabic ? item.productNameAr : item.productNameEn}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? item.variantNameAr : item.variantNameEn}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.colorHex ? (
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="text-xs">{isArabic ? item.colorNameAr : item.colorNameEn}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  {isArabic ? item.sizeNameAr : item.sizeNameEn || "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center">
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        LE {item.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-sm font-medium">LE {item.price.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-6 h-6 border rounded text-xs hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-6 h-6 border rounded text-xs hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  LE {(item.price * item.quantity).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("subtotal")}</p>
          <p className="text-xl font-bold">LE {cartTotal.toLocaleString()} EGP</p>
        </div>
        <Link
          href="/checkout"
          className="px-6 py-3 bg-black text-white font-medium rounded hover:bg-gray-800 transition"
        >
          {t("checkout")}
        </Link>
      </div>
    </div>
  );
}
