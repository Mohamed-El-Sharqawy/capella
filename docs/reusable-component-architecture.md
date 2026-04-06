# Reusable Component Architecture Guide

This document defines the standard architecture for building clean, maintainable reusable components (non-page components like drawers, modals, cards, etc.).

## Core Principles

1. **Single Responsibility** - Each component/file has one clear purpose
2. **Co-location** - Keep related code together in a dedicated folder
3. **Thin Orchestrators** - Main component delegates to sub-components and hooks
4. **Custom Hooks** - Extract all stateful logic into reusable hooks
5. **Composability** - Build larger components from smaller, focused ones
6. **Type Safety** - Dedicated type definitions for all props and data

---

## Component Folder Structure

For any reusable component (e.g., cart-drawer, modal, dropdown):

```
components/[category]/[component-name]/
├── index.tsx                    # Main component (thin orchestrator)
├── types.ts                     # Component-specific types & interfaces
├── constants.ts                 # Component constants (optional)
├── hooks/
│   ├── use-[feature].ts        # Custom hooks for logic
│   └── index.ts                # Barrel export
└── components/
    ├── [sub-component].tsx     # Focused sub-components
    └── index.ts                # Barrel export
```

### Example: Cart Drawer

```
components/cart/cart-drawer/
├── index.tsx                    # Main CartDrawer component
├── types.ts                     # CartDrawerProps, SuggestedProduct, etc.
├── constants.ts                 # DRAWER_WIDTH, SUGGESTED_LIMIT, etc.
├── hooks/
│   ├── use-drawer-state.ts     # Drawer open/close, body scroll lock
│   ├── use-suggested-products.ts # Fetch suggested products logic
│   └── index.ts                # export { useDrawerState, useSuggestedProducts }
└── components/
    ├── drawer-header.tsx       # Header with title & close button
    ├── empty-state.tsx         # Empty cart message
    ├── cart-item-row.tsx       # Individual cart item display
    ├── suggested-item.tsx      # Suggested product card
    ├── drawer-footer.tsx       # Total & checkout button
    └── index.ts                # Barrel export all sub-components
```

---

## File Responsibilities

### `index.tsx` - Main Component (Orchestrator)

**Purpose:** Thin wrapper that composes sub-components and hooks

**Responsibilities:**
- Import and use custom hooks
- Import and compose sub-components
- Pass props down to children
- Handle top-level layout/structure
- **Should be < 100 lines**

**Example:**
```tsx
"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { useDrawerState, useSuggestedProducts } from "./hooks";
import {
  DrawerHeader,
  EmptyState,
  CartItemRow,
  SuggestedItem,
  DrawerFooter,
} from "./components";
import type { CartDrawerProps } from "./types";

export function CartDrawer({ locale }: CartDrawerProps) {
  const t = useTranslations("cartDrawer");
  const { items, total, isOpen, closeCart, updateQuantity, removeItem } = useCart();
  const suggestedProducts = useSuggestedProducts(items, isOpen);
  useDrawerState(isOpen);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <DrawerHeader onClose={closeCart} />
        
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState onClose={closeCart} />
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  locale={locale}
                  onClose={closeCart}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        <DrawerFooter
          total={total}
          itemCount={items.length}
          locale={locale}
          onClose={closeCart}
        />
      </div>
    </>
  );
}
```

---

### `types.ts` - Type Definitions

**Purpose:** All TypeScript types and interfaces for the component

**What to include:**
- Component props interfaces
- Data model types
- Sub-component props
- Callback function types

**Example:**
```typescript
export interface CartDrawerProps {
  locale: string;
}

export interface SuggestedProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  variants: Array<{
    price: number;
    compareAtPrice?: number | null;
    images?: Array<{ url: string }>;
  }>;
}

export interface CartItemRowProps {
  item: CartItem;
  locale: string;
  onClose: () => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}

export interface DrawerFooterProps {
  total: number;
  itemCount: number;
  locale: string;
  onClose: () => void;
}
```

---

### `constants.ts` - Component Constants

**Purpose:** Static configuration values

**What to include:**
- Magic numbers (sizes, limits, delays)
- CSS class strings (if reused)
- Default values
- Configuration objects

**Example:**
```typescript
export const DRAWER_WIDTH = "max-w-md";
export const SUGGESTED_PRODUCTS_LIMIT = 2;
export const ANIMATION_DURATION = 300;

export const DRAWER_CLASSES = {
  backdrop: "fixed inset-0 bg-black/50 z-50 transition-opacity",
  drawer: "fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform",
} as const;
```

---

### `hooks/` - Custom Hooks

**Purpose:** Extract all stateful logic and side effects

**When to create a hook:**
- Managing local state
- API calls / data fetching
- Side effects (useEffect)
- Complex calculations
- Reusable logic

**Naming:** `use-[feature-name].ts`

**Example: `use-drawer-state.ts`**
```typescript
"use client";

import { useEffect } from "react";

export function useDrawerState(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
}
```

**Example: `use-suggested-products.ts`**
```typescript
"use client";

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api-client";
import type { SuggestedProduct } from "../types";
import { SUGGESTED_PRODUCTS_LIMIT } from "../constants";

export function useSuggestedProducts(items: any[], isOpen: boolean) {
  const [products, setProducts] = useState<SuggestedProduct[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchSuggested = async () => {
      // ... fetch logic
    };
    
    fetchSuggested();
  }, [isOpen, items]);

  return products;
}
```

---

### `components/` - Sub-Components

**Purpose:** Focused, single-responsibility UI components

**When to create a sub-component:**
- Repeated UI patterns
- Complex sections (> 30 lines)
- Independent functionality
- Improves readability

**Naming:** Descriptive, component-specific names

**Example: `drawer-header.tsx`**
```tsx
"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface DrawerHeaderProps {
  onClose: () => void;
}

export function DrawerHeader({ onClose }: DrawerHeaderProps) {
  const t = useTranslations("cartDrawer");

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-100 rounded-full transition"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
```

**Example: `empty-state.tsx`**
```tsx
"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  onClose: () => void;
}

export function EmptyState({ onClose }: EmptyStateProps) {
  const t = useTranslations("cartDrawer");

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
      <p className="text-lg font-medium text-gray-600">{t("empty")}</p>
      <p className="text-sm text-muted-foreground mt-2">{t("emptyDesc")}</p>
      <button
        onClick={onClose}
        className="mt-6 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        {t("shopNow")}
      </button>
    </div>
  );
}
```

---

## Best Practices

### 1. Use Translations, Not Conditionals

❌ **Bad:**
```tsx
{isArabic ? "سلة التسوق" : "Shopping Cart"}
```

✅ **Good:**
```tsx
const t = useTranslations("cartDrawer");
{t("title")}
```

### 2. Extract Complex Logic to Hooks

❌ **Bad:**
```tsx
export function MyComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 50 lines of fetch logic
  }, []);
  
  // More component code
}
```

✅ **Good:**
```tsx
// hooks/use-data-fetch.ts
export function useDataFetch() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 50 lines of fetch logic
  }, []);
  
  return data;
}

// index.tsx
export function MyComponent() {
  const data = useDataFetch();
  // Clean component code
}
```

### 3. Break Down Large Components

❌ **Bad:** 300-line component with everything inline

✅ **Good:** Main component < 100 lines, delegates to sub-components

### 4. Type Everything

```typescript
// Always define prop interfaces
interface MyComponentProps {
  title: string;
  onClose: () => void;
  items: Item[];
}

export function MyComponent({ title, onClose, items }: MyComponentProps) {
  // ...
}
```

### 5. Use Barrel Exports

```typescript
// components/index.ts
export { DrawerHeader } from "./drawer-header";
export { EmptyState } from "./empty-state";
export { CartItemRow } from "./cart-item-row";

// Then import cleanly:
import { DrawerHeader, EmptyState, CartItemRow } from "./components";
```

---

## Comparison: Page vs Component Architecture

| Aspect | Page Architecture | Component Architecture |
|--------|------------------|----------------------|
| **Location** | `app/[locale]/[page]/` | `components/[category]/[name]/` |
| **Structure** | Deeper nesting (sections, tabs) | Flatter structure |
| **Main File** | `client.tsx` or `page.tsx` | `index.tsx` |
| **Scope** | Full page features | Single reusable component |
| **Complexity** | Can be larger (100-200 lines) | Keep smaller (< 100 lines) |
| **Sub-folders** | sections/, tabs/, etc. | components/, hooks/ |

---

## Migration Checklist

When refactoring an existing component:

- [ ] Create folder structure
- [ ] Extract types to `types.ts`
- [ ] Move constants to `constants.ts`
- [ ] Identify stateful logic → create hooks
- [ ] Identify repeated UI → create sub-components
- [ ] Replace `isArabic` checks with translations
- [ ] Create barrel exports (`index.ts`)
- [ ] Refactor main component to orchestrator
- [ ] Test all functionality
- [ ] Update imports in parent components

---

## Example: Before & After

### Before (344 lines, monolithic)
```tsx
export function CartDrawer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  
  useEffect(() => {
    // 100 lines of fetch logic
  }, []);
  
  useEffect(() => {
    // Body scroll lock logic
  }, [isOpen]);
  
  return (
    <div>
      {/* 200+ lines of JSX */}
    </div>
  );
}
```

### After (70 lines, clean)
```tsx
export function CartDrawer({ locale }: CartDrawerProps) {
  const t = useTranslations("cartDrawer");
  const { items, total, isOpen, closeCart } = useCart();
  const suggestedProducts = useSuggestedProducts(items, isOpen);
  useDrawerState(isOpen);

  return (
    <>
      <Backdrop isOpen={isOpen} onClick={closeCart} />
      <Drawer isOpen={isOpen}>
        <DrawerHeader onClose={closeCart} />
        <DrawerContent items={items} locale={locale} />
        <DrawerFooter total={total} onClose={closeCart} />
      </Drawer>
    </>
  );
}
```

---

## Summary

**For reusable components:**
1. Create a dedicated folder with sub-folders for hooks and components
2. Keep main component thin (< 100 lines)
3. Extract logic to custom hooks
4. Break UI into focused sub-components
5. Use translations, not conditionals
6. Type everything
7. Use barrel exports for clean imports

This architecture makes components:
- ✅ Easy to read and understand
- ✅ Simple to test
- ✅ Straightforward to modify
- ✅ Quick to debug
- ✅ Reusable across the app
