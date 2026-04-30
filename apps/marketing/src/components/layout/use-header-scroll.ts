"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface HeaderScrollState {
  isAtTop: boolean;
  isVisible: boolean;
}

export function useHeaderScroll(): HeaderScrollState {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollState = useCallback(() => {
    const scrollY = window.scrollY;
    const scrollDelta = scrollY - lastScrollY.current;
    const scrollingDown = scrollDelta > 0;

    setIsAtTop(scrollY <= 0);

    if (scrollingDown && scrollY > 24 && scrollDelta > 2) {
      setIsVisible(false);
    } else if (!scrollingDown && scrollDelta < -2) {
      setIsVisible(true);
    } else if (scrollY <= 0) {
      setIsVisible(true);
    }

    lastScrollY.current = scrollY;
    ticking.current = false;
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    updateScrollState();

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(updateScrollState);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [updateScrollState]);

  return { isAtTop, isVisible };
}
