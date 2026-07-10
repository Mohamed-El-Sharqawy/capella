"use client";

import { useEffect, useId, useRef } from "react";

const TABBY_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY ||
  "pk_test_019eee84-841d-7cc8-6f2f-0c2e5a76861a";
const TABBY_MERCHANT_CODE =
  process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "CUAE";
const TABBY_CARD_SRC = "https://checkout.tabby.ai/tabby-card.js";

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

interface TabbyCardSnippetProps {
  price: number;
  locale: string;
}

/**
 * Official Tabby Checkout snippet (tabby-card.js). Renders Tabby's approved
 * cost-breakdown copy under the Tabby payment method, keeping wording
 * compliant and up to date automatically.
 * https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow#tabby-on-checkout
 */
export function TabbyCardSnippet({ price, locale }: TabbyCardSnippetProps) {
  const reactId = useId();
  const containerId = `tabby-card-${reactId.replace(/[:]/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const lang = locale === "ar" ? "ar" : "en";
  const priceStr = (Math.round(price * 100) / 100).toFixed(2);

  useEffect(() => {
    let active = true;
    loadScript(TABBY_CARD_SRC)
      .then(() => {
        if (!active) return;
        const w = window as unknown as {
          TabbyCard?: new (opts: Record<string, unknown>) => void;
        };
        const el = containerRef.current;
        if (!w.TabbyCard || !el) return;
        try {
          el.innerHTML = "";
          new w.TabbyCard({
            selector: `#${containerId}`,
            currency: "AED",
            price: priceStr,
            lang,
            publicKey: TABBY_PUBLIC_KEY,
            merchantCode: TABBY_MERCHANT_CODE,
          });
        } catch (err) {
          console.error("TabbyCard init failed:", err);
        }
      })
      .catch((err) => console.error(err));

    return () => {
      active = false;
    };
  }, [priceStr, lang, containerId]);

  return <div id={containerId} ref={containerRef} className="min-h-[20px]" />;
}
