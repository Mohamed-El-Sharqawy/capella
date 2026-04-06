"use client";

import Image from "next/image";
import { Package, Loader2, CreditCard, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { OrdersTabProps } from "../../types";
import { ORDERS_PER_PAGE, getOrderStatusColor } from "../../constants";

export function OrdersTab({ locale, orders, isLoading, page, onPageChange }: OrdersTabProps) {
  const t = useTranslations("account.ordersTab");
  const isArabic = locale === "ar";
  const totalPages = Math.ceil((orders.meta?.total || 0) / ORDERS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (orders.data?.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t("title")} (0)
        </h2>
        <div className="bg-white border rounded-lg p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t("noOrders")}
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

  const paginatedOrders = orders.data?.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {t("title")} ({orders.meta?.total || 0})
      </h2>
      <div className="space-y-4">
        {paginatedOrders?.map((order) => (
          <div key={order.id} className="bg-white border rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("orderId")}
                </p>
                <p className="font-mono font-medium">{order.orderNumber || order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("date")}
                </p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString(isArabic ? "ar-EG" : "en-US")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("status")}
                </p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("payment")}
                </p>
                <p className="font-medium flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {order.paymentMethod || "COD"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("total")}
                </p>
                <p className="font-bold text-lg">LE {order.total?.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">
                {t("items")} ({order.items?.length || 0})
              </p>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {isArabic ? item.productNameAr : item.productNameEn}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isArabic ? item.variantNameAr : item.variantNameEn}
                        {" × "}{item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">LE {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {order.shippingAddress && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t("shippingAddress")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.address}, {order.shippingAddress.city}
                  {order.shippingAddress.area && `, ${order.shippingAddress.area}`}
                </p>
              </div>
            )}
          </div>
        ))}

        {orders.data?.length > ORDERS_PER_PAGE && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border rounded hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm px-4">
              {t("page")} {page} {t("of")} {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 border rounded hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
