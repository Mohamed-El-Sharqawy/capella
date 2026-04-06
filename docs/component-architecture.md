# Component Architecture Guide

This document defines the standard architecture for refactoring large components into a clean, maintainable structure.

## Core Principles

1. **Separation of Concerns** - Each file has a single responsibility
2. **Co-location** - Related code lives together in feature folders
3. **Thin Orchestrators** - Main components delegate to sub-components and hooks
4. **Custom Hooks** - All stateful logic extracted into reusable hooks
5. **Type Safety** - Dedicated type files for each feature

---

## Feature Folder Structure

For any feature page (e.g., account, checkout, cart):

```
src/app/[locale]/[feature]/
├── page.tsx                    # Server component (data fetching, metadata)
├── client.tsx                  # Client orchestrator (thin, delegates to children)
├── components/
│   ├── [feature]-layout.tsx    # Layout wrapper (sidebar + content, etc.)
│   ├── [feature]-sidebar.tsx   # Navigation/sidebar if needed
│   ├── sections/               # Major sections of the page
│   │   ├── section-a.tsx
│   │   ├── section-b.tsx
│   │   └── section-c.tsx
│   └── shared/                 # Components shared within this feature
│       ├── item-card.tsx
│       └── empty-state.tsx
├── hooks/
│   ├── use-[feature]-state.ts  # Main state management hook
│   ├── use-[specific].ts       # Specific functionality hooks
│   └── index.ts                # Re-export all hooks
├── types.ts                    # Feature-specific TypeScript types
├── constants.ts                # Static config, labels, options
└── utils.ts                    # Feature-specific utility functions
```

---

## File Responsibilities

### `page.tsx` (Server Component)
- Fetch initial data
- Generate metadata
- Pass data to client component
- **No client-side state or interactivity**

```tsx
import { Metadata } from "next";
import { FeaturePageClient } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Feature Page" };
}

export default async function FeaturePage({ params }: Props) {
  const { locale } = await params;
  const initialData = await fetchData();
  
  return <FeaturePageClient locale={locale} initialData={initialData} />;
}
```

### `client.tsx` (Client Orchestrator)
- Minimal logic - delegates to hooks and components
- Handles top-level state coordination
- Renders layout and sections
- **Should be readable at a glance (<100 lines ideal)**

```tsx
"use client";

import { useFeatureState } from "./hooks";
import { FeatureLayout } from "./components/feature-layout";
import { SectionA, SectionB } from "./components/sections";

export function FeaturePageClient({ locale, initialData }: Props) {
  const { state, handlers } = useFeatureState(initialData);
  
  if (state.isLoading) return <LoadingState />;
  
  return (
    <FeatureLayout>
      <SectionA data={state.dataA} onAction={handlers.handleA} />
      <SectionB data={state.dataB} onAction={handlers.handleB} />
    </FeatureLayout>
  );
}
```

### `hooks/use-[feature]-state.ts` (State Management)
- All useState, useEffect, useCallback
- Data fetching logic
- Event handlers
- Returns state object and handlers object

```tsx
export function useFeatureState(initialData: Data) {
  const [items, setItems] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAdd = useCallback(async (item: Item) => {
    // logic
  }, []);
  
  const handleRemove = useCallback(async (id: string) => {
    // logic
  }, []);
  
  return {
    state: { items, isLoading },
    handlers: { handleAdd, handleRemove },
  };
}
```

### `components/sections/section-a.tsx` (UI Section)
- Pure presentational component
- Receives data and callbacks as props
- Contains only rendering logic
- Can have local UI state (hover, open/close)

```tsx
interface SectionAProps {
  data: DataType[];
  locale: string;
  onAction: (id: string) => void;
}

export function SectionA({ data, locale, onAction }: SectionAProps) {
  const t = useTranslations("feature");
  
  return (
    <div>
      {data.map((item) => (
        <ItemCard key={item.id} item={item} onAction={onAction} />
      ))}
    </div>
  );
}
```

### `types.ts` (Type Definitions)
- All interfaces and types for this feature
- Import shared types from `@ecommerce/shared-types`

```tsx
import type { Product, Order } from "@ecommerce/shared-types";

export type TabType = "profile" | "orders" | "favourites";

export interface FeatureState {
  activeTab: TabType;
  items: Product[];
  isLoading: boolean;
}

export interface FeatureHandlers {
  handleTabChange: (tab: TabType) => void;
  handleItemRemove: (id: string) => void;
}
```

### `constants.ts` (Static Configuration)
- Pagination limits
- Tab configurations
- Static labels (if not using i18n)
- Option arrays

```tsx
export const ITEMS_PER_PAGE = 10;

export const TAB_CONFIG = [
  { id: "profile", icon: "User" },
  { id: "orders", icon: "Package" },
  { id: "favourites", icon: "Heart" },
] as const;

export const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
} as const;
```

---

## Global Project Structure

```
src/
├── app/                        # Next.js App Router
│   └── [locale]/
│       ├── page.tsx            # Home page
│       ├── layout.tsx          # Root layout
│       ├── account/            # Feature: Account
│       ├── checkout/           # Feature: Checkout
│       ├── cart/               # Feature: Cart
│       ├── products/           # Feature: Products
│       └── collections/        # Feature: Collections
│
├── components/
│   ├── ui/                     # Shared UI primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   ├── layout/                 # Global layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── ...
│   └── shared/                 # Shared feature components
│       ├── product-card.tsx
│       └── ...
│
├── contexts/                   # Global React contexts
│   ├── auth-context.tsx
│   ├── cart-context.tsx
│   └── ...
│
├── hooks/                      # Shared custom hooks
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   └── ...
│
├── lib/                        # Utilities and clients
│   ├── api-client.ts           # Centralized API client
│   ├── utils.ts                # General utilities
│   └── ...
│
├── types/                      # Shared TypeScript types
│   └── index.ts
│
└── i18n/                       # Internationalization
    ├── navigation.ts
    └── ...
```

---

## Refactoring Checklist

When refactoring a large component:

- [ ] **Identify sections** - What are the distinct UI sections?
- [ ] **Extract types** - Create `types.ts` with all interfaces
- [ ] **Extract constants** - Move static config to `constants.ts`
- [ ] **Extract hooks** - Move all useState/useEffect/useCallback to hooks
- [ ] **Create section components** - One component per UI section
- [ ] **Create shared components** - Reusable pieces within the feature
- [ ] **Thin the orchestrator** - Main client.tsx should be <100 lines
- [ ] **Add barrel exports** - `index.ts` files for clean imports

---

## Hook Patterns

### Pattern 1: Single State Hook
For simple features with one main state:

```tsx
export function useFeature() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // All related logic here
  
  return { data, isLoading, handlers };
}
```

### Pattern 2: Multiple Focused Hooks
For complex features, split by concern:

```tsx
// use-tabs.ts
export function useTabs() {
  const [activeTab, setActiveTab] = useState("profile");
  return { activeTab, setActiveTab };
}

// use-addresses.ts
export function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  // fetch, add, remove logic
  return { addresses, addAddress, removeAddress };
}

// use-phone-edit.ts
export function usePhoneEdit() {
  const [isEditing, setIsEditing] = useState(false);
  // edit logic
  return { isEditing, phone, savePhone, cancelEdit };
}
```

### Pattern 3: Composed Hook
Combine multiple hooks in the main hook:

```tsx
export function useAccountPage() {
  const tabs = useTabs();
  const addresses = useAddresses();
  const phoneEdit = usePhoneEdit();
  
  return { tabs, addresses, phoneEdit };
}
```

---

## Component Patterns

### Pattern 1: Render Props for Flexibility

```tsx
<DataList
  items={items}
  renderItem={(item) => <CustomCard item={item} />}
  renderEmpty={() => <EmptyState />}
/>
```

### Pattern 2: Compound Components

```tsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="orders">Orders</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile"><ProfileSection /></Tabs.Panel>
  <Tabs.Panel value="orders"><OrdersSection /></Tabs.Panel>
</Tabs>
```

### Pattern 3: Container/Presenter

```tsx
// Container (logic)
function OrdersContainer() {
  const { orders, isLoading } = useOrders();
  return <OrdersList orders={orders} isLoading={isLoading} />;
}

// Presenter (UI only)
function OrdersList({ orders, isLoading }: Props) {
  if (isLoading) return <Skeleton />;
  return orders.map((order) => <OrderCard key={order.id} order={order} />);
}
```

---

## File Size Guidelines

| File Type | Ideal Lines | Max Lines |
|-----------|-------------|-----------|
| `client.tsx` (orchestrator) | 50-100 | 150 |
| Section component | 50-150 | 250 |
| Custom hook | 30-80 | 150 |
| Types file | 20-50 | 100 |
| Constants file | 10-30 | 50 |

If a file exceeds max lines, consider splitting it further.

---

## Example: Account Page Refactored

```
src/app/[locale]/account/
├── page.tsx                    # 20 lines
├── client.tsx                  # 80 lines (orchestrator)
├── components/
│   ├── account-layout.tsx      # 40 lines
│   ├── account-sidebar.tsx     # 60 lines
│   └── tabs/
│       ├── profile-tab.tsx     # 120 lines
│       ├── orders-tab.tsx      # 150 lines
│       ├── favourites-tab.tsx  # 80 lines
│       ├── wishlist-tab.tsx    # 80 lines
│       ├── cart-tab.tsx        # 100 lines
│       └── addresses-tab.tsx   # 100 lines
├── hooks/
│   ├── use-account-tabs.ts     # 40 lines
│   ├── use-addresses.ts        # 50 lines
│   ├── use-phone-edit.ts       # 40 lines
│   └── index.ts                # 5 lines
├── types.ts                    # 30 lines
└── constants.ts                # 25 lines

Total: ~900 lines across 15 files (vs 881 lines in 1 file)
```

---

## Benefits

| Before | After |
|--------|-------|
| 1 file, 881 lines | 15 files, ~60 lines avg |
| Hard to find code | Clear file names |
| Merge conflicts | Isolated changes |
| Difficult testing | Testable hooks |
| Tight coupling | Loose coupling |
| Hard to reuse | Reusable components |
