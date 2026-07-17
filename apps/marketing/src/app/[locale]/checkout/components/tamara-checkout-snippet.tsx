"use client";

import { useEffect, useRef } from "react";

const TAMARA_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY ||
  "cc037f1d-f67e-42b2-9065-4e3fa2137f3a";
const TAMARA_WIDGET_SRC = "https://cdn.tamara.co/widget-v2/tamara-widget.js";

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

interface TamaraCheckoutSnippetProps {
  price: number;
  locale: string;
}

/**
 * Tamara checkout snippet — the Tamara counterpart of the Tabby Checkout card.
 * Renders Tamara's "Checkout page" widget (inline-type=3) with the cart total,
 * beneath the Tamara payment option when it is selected.
 * https://widget-docs.tamara.co/tamara-summary
 */
export function TamaraCheckoutSnippet({
  price,
  locale,
}: TamaraCheckoutSnippetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lang = locale === "ar" ? "ar" : "en";
  const priceStr = (Math.round(price * 100) / 100).toFixed(2);

  useEffect(() => {
    let active = true;
    const w = window as unknown as { tamaraWidgetConfig?: Record<string, unknown> };
    // Tamara derives currency FROM country (not from `currency`), and defaults
    // country to "SA" when omitted — which 404s the merchant-config lookup.
    w.tamaraWidgetConfig = {
      lang,
      country: "AE",
      currency: "AED",
      publicKey: TAMARA_PUBLIC_KEY,
    };
    loadScript(TAMARA_WIDGET_SRC)
      .then(() => {
        if (!active) return;
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = "";
        const widget = document.createElement("tamara-widget");
        widget.setAttribute("type", "tamara-summary");
        widget.setAttribute("lang", lang);
        widget.setAttribute("country", "AE");
        widget.setAttribute("amount", priceStr);
        widget.setAttribute("inline-type", "3");
        widget.setAttribute("inline-variant", "text");
        // Logo (badge) aligns to the start of the reading direction per locale:
        // Arabic (RTL) → right, English (LTR) → left.
        widget.setAttribute(
          "config",
          JSON.stringify({ badgePosition: lang === "ar" ? "right" : "left" })
        );
        widget.setAttribute("public-key", TAMARA_PUBLIC_KEY);
        widget.style.display = "block";
        widget.style.width = "100%";
        widget.style.minHeight = "24px";
        el.appendChild(widget);
      })
      .catch((err) => console.error(err));

    return () => {
      active = false;
    };
  }, [priceStr, lang]);

  return <div ref={containerRef} className="min-h-[24px]" />;
}
