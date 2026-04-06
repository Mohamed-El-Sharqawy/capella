"use client";

import { useState, useEffect, useRef } from "react";

export function useFixedBar() {
  const [showFixedBar, setShowFixedBar] = useState(false);
  const productInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (productInfoRef.current) {
        const rect = productInfoRef.current.getBoundingClientRect();
        setShowFixedBar(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return {
    showFixedBar,
    productInfoRef,
  };
}
