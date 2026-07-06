"use client";

import { createElement, useEffect, useId, useRef } from "react";
import { usePaymentMethods } from "@/lib/payment-methods";

const TABBY_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY ||
  "pk_test_019eee84-841d-7cc8-6f2f-0c2e5a76861a";
const TABBY_MERCHANT_CODE =
  process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "CUAE";
const TAMARA_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY ||
  "cc037f1d-f67e-42b2-9065-4e3fa2137f3a";

const TABBY_PROMO_SRC = "https://checkout.tabby.ai/tabby-promo.js";
const TAMARA_WIDGET_SRC = "https://cdn.tamara.co/widget/tamara-widget.js";

const scriptPromises = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  const existing = scriptPromises.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    if (
      typeof document !== "undefined" &&
      document.querySelector(`script[src="${src}"]`)
    ) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
  scriptPromises.set(src, promise);
  return promise;
}

interface BnplPromoProps {
  price: number;
  locale: string;
  source?: "product" | "cart";
  className?: string;
}

export function BnplPromo({
  price,
  locale,
  source = "product",
  className,
}: BnplPromoProps) {
  const enabled = usePaymentMethods();
  const tabbyEnabled = enabled?.tabby ?? false;
  const tamaraEnabled = enabled?.tamara ?? false;
  const reactId = useId();
  const tabbyContainerId = `tabby-promo-${reactId.replace(/[:]/g, "")}`;
  const tabbyContainerRef = useRef<HTMLDivElement>(null);
  const lang = locale === "ar" ? "ar" : "en";
  const priceStr = (Math.round(price * 100) / 100).toFixed(2);

  // Tabby promo snippet — skip entirely (script + DOM) when disabled so the
  // third-party tracker never loads on deployments where Tabby is hidden.
  useEffect(() => {
    if (!tabbyEnabled) return;
    let active = true;
    loadScript(TABBY_PROMO_SRC)
      .then(() => {
        if (!active) return;
        const w = window as unknown as {
          TabbyPromo?: new (opts: Record<string, unknown>) => void;
        };
        const el = tabbyContainerRef.current;
        if (!w.TabbyPromo || !el) return;
        try {
          el.innerHTML = "";
          new w.TabbyPromo({
            selector: `#${tabbyContainerId}`,
            currency: "AED",
            price: priceStr,
            lang,
            source,
            publicKey: TABBY_PUBLIC_KEY,
            merchantCode: TABBY_MERCHANT_CODE,
          });
        } catch (err) {
          console.error("Tabby promo init failed:", err);
        }
      })
      .catch((err) => console.error(err));

    return () => {
      active = false;
    };
  }, [priceStr, lang, source, tabbyContainerId, tabbyEnabled]);

  // Tamara widget global config — skip entirely when disabled.
  useEffect(() => {
    if (!tamaraEnabled) return;
    const w = window as unknown as { tamaraWidgetConfig?: Record<string, unknown> };
    w.tamaraWidgetConfig = {
      ...(w.tamaraWidgetConfig || {}),
      lang,
      currency: "AED",
      publicKey: TAMARA_PUBLIC_KEY,
    };
    loadScript(TAMARA_WIDGET_SRC).catch((err) => console.error(err));
  }, [lang, tamaraEnabled]);

  if (!tabbyEnabled && !tamaraEnabled) return null;

  return (
    <div className={className}>
      {tabbyEnabled && (
        <div id={tabbyContainerId} ref={tabbyContainerRef} className="min-h-[20px]" />
      )}
      {tamaraEnabled &&
        createElement("tamara-widget", {
          key: `tamara-${priceStr}`,
          type: "tamara-summary",
          lang,
          currency: "AED",
          price: priceStr,
          "public-key": TAMARA_PUBLIC_KEY,
          style: { display: "block", minHeight: "20px" },
        })}
    </div>
  );
}
