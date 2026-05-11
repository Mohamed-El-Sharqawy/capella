# i18n Migration Plan — Marketing App

## Overview

Remove all hardcoded `isArabic ? "ar" : "en"` translation patterns and replace with proper `next-intl` i18n using `useTranslations()`.

**Total hardcoded UI strings:** 112 across 26 files

---

## Phase 1 — Critical (42 strings)

### 1.1 `components/ui/review-modal.tsx` (27 strings)

**Status:** Entire modal form is hardcoded. No `useTranslations` imported.

**New namespace:** `"reviewModal"` (or add to existing `"product"` namespace)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 166 | `isArabic ? "حدث خطأ أثناء إرسال المراجعة" : "Failed to submit review"` | `reviewModal.errorSubmit` | Failed to submit review | حدث خطأ أثناء إرسال المراجعة |
| 192 | `isArabic ? "تسجيل الدخول" : "Sign In"` | `reviewModal.signIn` | Sign In | تسجيل الدخول |
| 194 | `isArabic ? "اكتب مراجعة" : "Write a Review"` | `reviewModal.title` | Write a Review | اكتب مراجعة |
| 212 | `isArabic ? "جاري التحميل..." : "Loading..."` | `reviewModal.loading` | Loading... | جاري التحميل... |
| 237 | `isArabic ? "سجل دخولك لكتابة مراجعة" : "Sign in to write a review"` | `reviewModal.signInPrompt` | Sign in to write a review | سجل دخولك لكتابة مراجعة |
| 265 | `isArabic ? "إنشاء حساب" : "Sign Up"` | `reviewModal.signUp` | Sign Up | إنشاء حساب |
| 275 | `isArabic ? "الاسم الأول" : "First Name"` | `reviewModal.firstName` | First Name | الاسم الأول |
| 283 | `isArabic ? "الاسم الأخير" : "Last Name"` | `reviewModal.lastName` | Last Name | الاسم الأخير |
| 293 | `isArabic ? "البريد الإلكتروني" : "Email"` | `reviewModal.email` | Email | البريد الإلكتروني |
| 301 | `isArabic ? "كلمة المرور" : "Password"` | `reviewModal.password` | Password | كلمة المرور |
| 320 | `isArabic ? "تسجيل الدخول" : "Sign In"` | `reviewModal.signInBtn` | Sign In | تسجيل الدخول |
| 322 | `isArabic ? "إنشاء حساب" : "Create Account"` | `reviewModal.createAccount` | Create Account | إنشاء حساب |
| 352 | `isArabic ? "لا يمكنك كتابة مراجعة لمنتج لم تشتريه بعد" : "You can only review products you've purchased"` | `reviewModal.notPurchased` | You can only review products you've purchased | لا يمكنك كتابة مراجعة لمنتج لم تشتريه بعد |
| 361 | `isArabic ? "هل تريد شراء هذا المنتج؟" : "Would you like to buy this product?"` | `reviewModal.buyPrompt` | Would you like to buy this product? | هل تريد شراء هذا المنتج؟ |
| 369 | `isArabic ? "أضف إلى السلة" : "Add to Cart"` | `reviewModal.addToCart` | Add to Cart | أضف إلى السلة |
| 375 | `isArabic ? "ربما لاحقاً" : "Maybe Later"` | `reviewModal.maybeLater` | Maybe Later | ربما لاحقاً |
| 390 | `isArabic ? "شكراً لك!" : "Thank You!"` | `reviewModal.thankYou` | Thank You! | شكراً لك! |
| 394 | `isArabic ? "تم إرسال مراجعتك بنجاح" : "Your review has been submitted successfully"` | `reviewModal.successMessage` | Your review has been submitted successfully | تم إرسال مراجعتك بنجاح |
| 417 | `` isArabic ? `مرحباً ${name}، شاركنا رأيك` : `Hi ${name}, share your thoughts` `` | `reviewModal.greeting` | Hi {name}, share your thoughts | مرحباً {name}، شاركنا رأيك |
| 428 | `isArabic ? "التقييم" : "Rating"` | `reviewModal.rating` | Rating | التقييم |
| 453 | `isArabic ? "عنوان المراجعة" : "Review Title"` | `reviewModal.reviewTitle` | Review Title | عنوان المراجعة |
| 461 | `isArabic ? "اكتب عنوان مختصر..." : "Write a brief title..."` | `reviewModal.titlePlaceholder` | Write a brief title... | اكتب عنوان مختصر... |
| 472 | `isArabic ? "مراجعتك" : "Your Review"` | `reviewModal.yourReview` | Your Review | مراجعتك |
| 479 | `isArabic ? "شاركنا تجربتك مع هذا المنتج..." : "Share your experience with this product..."` | `reviewModal.reviewPlaceholder` | Share your experience with this product... | شاركنا تجربتك مع هذا المنتج... |
| 502 | `isArabic ? "إرسال المراجعة" : "Submit Review"` | `reviewModal.submitReview` | Submit Review | إرسال المراجعة |

**Action:** Add `import { useTranslations } from "next-intl"`, add `const t = useTranslations("reviewModal")`, add all keys to `en.json` and `ar.json` under `"reviewModal"` namespace.

---

### 1.2 `app/[locale]/checkout/components/order-confirmation-modal.tsx` (15 strings)

**Status:** Partially uses `t("orderSummary")` but most strings hardcoded.

**New namespace:** `"orderConfirmation"` (or extend existing `"checkout"` namespace)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 59 | `isArabic ? "مراجعة الطلب" : "Review Order"` | `orderConfirmation.reviewOrder` | Review Order | مراجعة الطلب |
| 75 | `isArabic ? "منتجات" : "items"` | `orderConfirmation.items` | items | منتجات |
| 98 | `isArabic ? "درهم" : "AED"` | `orderConfirmation.aed` | AED | درهم |
| 108 | `isArabic ? "منتجات أخرى في سلتك" : "more items in your cart"` | `orderConfirmation.moreItems` | more items in your cart | منتجات أخرى في سلتك |
| 118 | `isArabic ? "تفاصيل الشحن" : "Shipping Details"` | `orderConfirmation.shippingDetails` | Shipping Details | تفاصيل الشحن |
| 135 | `isArabic ? "طريقة الدفع" : "Payment Method"` | `orderConfirmation.paymentMethod` | Payment Method | طريقة الدفع |
| 138 | `isArabic ? "بطاقة ائتمان" : "Credit Card"` | `orderConfirmation.creditCard` | Credit Card | بطاقة ائتمان |
| 140 | `isArabic ? "دفع عند الاستلام" : "Cash on Delivery"` | `orderConfirmation.cashOnDelivery` | Cash on Delivery | دفع عند الاستلام |
| 173 | `isArabic ? "رجوع" : "Back"` | `orderConfirmation.back` | Back | رجوع |
| 179 | `isArabic ? "تأكيد الطلب" : "Confirm Order"` | `orderConfirmation.confirmOrder` | Confirm Order | تأكيد الطلب |

**Note:** Lines 102, 148, 153, 158, 162 are all `isArabic ? "درهم" : "AED"` — use the same `orderConfirmation.aed` key for all.

**Action:** Add `useTranslations("orderConfirmation")`, add keys to both JSON files.

---

## Phase 2 — High (25 strings)

### 2.1 `components/layout/footer.tsx` (14 strings)

**Status:** No `useTranslations` imported. Entire footer is hardcoded.

**New namespace:** `"footer"`

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 13 | `isArabic ? "عن كابيلا" : "About Us"` | `footer.aboutUs` | About Us | عن كابيلا |
| 14 | `isArabic ? "تسوق الكل" : "Shop All"` | `footer.shopAll` | Shop All | تسوق الكل |
| 15 | `isArabic ? "تسوق حسب المجموعة" : "Shop by Collection"` | `footer.shopByCollection` | Shop by Collection | تسوق حسب المجموعة |
| 16 | `isArabic ? "اتصل بنا" : "Contact Us"` | `footer.contactUs` | Contact Us | اتصل بنا |
| 20 | `isArabic ? "سياسة الخصوصية" : "Privacy Policy"` | `footer.privacyPolicy` | Privacy Policy | سياسة الخصوصية |
| 21 | `isArabic ? "سياسة الاسترداد والإرجاع" : "Refund & Return Policy"` | `footer.refundPolicy` | Refund & Return Policy | سياسة الاسترداد والإرجاع |
| 22 | `isArabic ? "سياسة الشحن" : "Shipping Policy"` | `footer.shippingPolicy` | Shipping Policy | سياسة الشحن |
| 23 | `isArabic ? "شروط الخدمة" : "Terms of Service"` | `footer.termsOfService` | Terms of Service | شروط الخدمة |
| 37 | `isArabic ? "اشترك للحصول على التحديثات" : "Subscribe for Updates"` | `footer.subscribe` | Subscribe for Updates | اشترك للحصول على التحديثات |
| 42 | `isArabic ? "أدخل بريدك الإلكتروني" : "Enter your email"` | `footer.emailPlaceholder` | Enter your email | أدخل بريدك الإلكتروني |
| 53 | `isArabic ? "إرسال" : "Submit"` | `footer.submit` | Submit | إرسال |
| 63 | `isArabic ? "تسوق" : "Shop"` | `footer.shop` | Shop | تسوق |
| 82 | `isArabic ? "السياسات" : "Policies"` | `footer.policies` | Policies | السياسات |
| 102 | `isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."` | `footer.allRightsReserved` | All rights reserved. | جميع الحقوق محفوظة. |

**Action:** Add `"use client"`, import `useTranslations`, add `const t = useTranslations("footer")`, create `"footer"` namespace in both JSON files.

---

### 2.2 `components/layout/mobile-menu.tsx` (11 strings)

**Status:** No `useTranslations` imported. Navigation labels hardcoded.

**New namespace:** `"header"` (or extend existing — check if `"header"` namespace exists)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 105 | `isArabic ? "العودة" : "Back"` | `header.back` | Back | العودة |
| 109 | `isArabic ? "عرض الكل" : "Shop All"` | `header.shopAll` | Shop All | عرض الكل |
| 190 | `isArabic ? "تسوق الكل" : "Shop All"` | `header.shopAll` (reuse) | Shop All | تسوق الكل |
| 222 | `isArabic ? "الرئيسية" : "Home"` | `header.home` | Home | الرئيسية |
| 226 | `isArabic ? "من نحن" : "About Us"` | `header.aboutUs` | About Us | من نحن |
| 230 | `isArabic ? "اتصل بنا" : "Contact Us"` | `header.contactUs` | Contact Us | اتصل بنا |
| 243 | `isArabic ? "بحث" : "SEARCH"` | `header.search` | SEARCH | بحث |
| 263 | `isArabic ? "اللغة" : "LANGUAGE"` | `header.language` | LANGUAGE | اللغة |
| 276 | `isArabic ? "الحساب" : "ACCOUNT"` | `header.account` | ACCOUNT | الحساب |
| 146 | `isArabic ? "العودة" : "Back"` | `header.back` (reuse) | Back | العودة |

**Note:** Line 153 uses `isArabic ? "عرض الكل في ${nameAr}" : "Shop All ${nameEn}"` — mixed hardcoded + data-driven. Convert to: `t("header.shopAllIn", { name: isArabic ? collection.nameAr : collection.nameEn })` with `"Shop All in {name}"` / `"عرض الكل في {name}"`.

**Action:** Add `useTranslations("header")`, check if `"header"` namespace exists in JSON files, extend it.

---

### 2.3 `components/layout/header-nav.tsx` (2 strings)

**Status:** Shares header navigation, likely same `"header"` namespace.

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 93 | `isArabic ? "عرض الكل" : "View All Collections"` | `header.viewAllCollections` | View All Collections | عرض الكل |
| 119 | `isArabic ? "من نحن" : "About Us"` | `header.aboutUs` (reuse from 2.2) | About Us | من نحن |

---

## Phase 3 — Medium & Low (45 strings)

### 3.1 `components/layout/global-search.tsx` (6 strings) — MEDIUM

**Namespace:** `"search"`

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 134 | `isArabic ? "بحث" : "Search"` | `search.ariaLabel` | Search | بحث |
| 159 | `isArabic ? "ابحث عن منتجات أو مجموعات..." : "Search products or collections..."` | `search.placeholder` | Search products or collections... | ابحث عن منتجات أو مجموعات... |
| 177 | `isArabic ? "لا توجد نتائج" : "No results found"` | `search.noResults` | No results found | لا توجد نتائج |
| 186 | `isArabic ? "المنتجات" : "Products"` | `search.products` | Products | المنتجات |
| 226 | `isArabic ? "المجموعات" : "Collections"` | `search.collections` | Collections | المجموعات |
| 262 | `isArabic ? "عرض جميع النتائج" : "View all results"` | `search.viewAllResults` | View all results | عرض جميع النتائج |

---

### 3.2 `components/layout/search-overlay.tsx` (1 string) — LOW

**Namespace:** `"search"` (reuse from 3.1)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 114 | `isArabic ? "ابحث هنا..." : "Search product..."` | `search.overlayPlaceholder` | Search product... | ابحث هنا... |

---

### 3.3 `app/[locale]/(home)/components/features.tsx` (6 strings) — MEDIUM

**Namespace:** `"features"`

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 13 | `isArabic ? "دفع مرن" : "Flexible Payment"` | `features.flexiblePayment` | Flexible Payment | دفع مرن |
| 15 | `isArabic ? "ادفع ببطاقات ائتمان متعددة" : "Pay with Multiple Credit Cards"` | `features.flexiblePaymentDesc` | Pay with Multiple Credit Cards | ادفع ببطاقات ائتمان متعددة |
| 20 | `isArabic ? "إرجاع سهل وسريع" : "Fast and Easy Returns"` | `features.fastReturns` | Fast and Easy Returns | إرجاع سهل وسريع |
| 22 | `isArabic ? "خلال يومين للاستبدال" : "Within 2 days for an exchange"` | `features.fastReturnsDesc` | Within 2 days for an exchange | خلال يومين للاستبدال |
| 27 | `isArabic ? "دعم متميز" : "Premium Support"` | `features.premiumSupport` | Premium Support | دعم متميز |
| 29 | `isArabic ? "دعم متميز متواصل" : "Outstanding premium support"` | `features.premiumSupportDesc` | Outstanding premium support | دعم متميز متواصل |

---

### 3.4 `app/[locale]/checkout/cancel/page.tsx` (4 strings) — MEDIUM

**Status:** Imports `getTranslations` but never calls `t()`. Completely hardcoded.

**Namespace:** `"checkout"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 22 | `isArabic ? "تم إلغاء الدفع" : "Payment Cancelled"` | `checkout.cancelTitle` | Payment Cancelled | تم إلغاء الدفع |
| 27 | `isArabic ? "لم تتم عملية الدفع..." : "Your payment was not completed..."` | `checkout.cancelMessage` | Your payment was not completed... | لم تتم عملية الدفع... |
| 36 | `isArabic ? "العودة إلى السلة" : "Return to Cart"` | `checkout.returnToCart` | Return to Cart | العودة إلى السلة |
| 42 | `isArabic ? "متابعة التسوق" : "Continue Shopping"` | `checkout.continueShopping` | Continue Shopping | متابعة التسوق |

---

### 3.5 `app/[locale]/account/components/tabs/profile-tab.tsx` (3 strings) — MEDIUM

**Namespace:** `"account"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 23 | `isArabic ? "الاسم الأول" : "First Name"` | `account.firstName` | First Name | الاسم الأول |
| 29 | `isArabic ? "الاسم الأخير" : "Last Name"` | `account.lastName` | Last Name | الاسم الأخير |
| 93 | `isArabic ? "الدور" : "Role"` | `account.role` | Role | الدور |

---

### 3.6 `app/[locale]/(home)/components/shoppable-videos.tsx` (2 strings) — LOW

**Namespace:** `"product"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 23 | `locale === "ar" ? "تسوق عبر الفيديو" : "Shoppable Videos"` | `product.shoppableVideos` | Shoppable Videos | تسوق عبر الفيديو |
| 27 | `locale === "ar" ? "شاهد. تحرك. تسوق." : "See it. Move in it. Shop it."` | `product.shoppableVideosDesc` | See it. Move in it. Shop it. | شاهد. تحرك. تسوق. |

---

### 3.7 `app/[locale]/(home)/components/hero-banner.tsx` (1 string) — LOW

**Namespace:** `"home"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 181 | `isArabic ? "اكتشف" : "Discover"` | `home.discover` | Discover | اكتشف |

---

### 3.8 `app/[locale]/about/page.tsx` (2 strings) — LOW

**Namespace:** `"about"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 87 | `locale === "ar" ? "اكتشف مجموعتنا" : "Explore Our Collection"` | `about.exploreCollection` | Explore Our Collection | اكتشف مجموعتنا |
| 93 | `locale === "ar" ? "تسوق الآن" : "Shop Now"` | `about.shopNow` | Shop Now | تسوق الآن |

---

### 3.9 `app/[locale]/(home)/page.tsx` (1 string) — LOW

**Namespace:** `"home"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 57 | `isArabic ? "توصيل مجاني فوق 500 درهم..." : "FREE SHIPPING ABOVE 500 AED..."` | `home.freeShippingMarquee` | FREE SHIPPING ABOVE 500 AED... | توصيل مجاني فوق 500 درهم... |

---

### 3.10 `app/[locale]/(home)/components/customers-feedback.tsx` (1 string) — LOW

**Namespace:** `"home"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 22 | `isArabic ? "آراء العملاء" : "Customers Feedback"` | `home.customersFeedback` | Customers Feedback | آراء العملاء |

---

### 3.11 `app/[locale]/account/components/tabs/cart-tab.tsx` (2 strings) — LOW

**Namespace:** `"account"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 47 | `isArabic ? "اللون" : "Color"` | `account.color` | Color | اللون |
| 48 | `isArabic ? "المقاس" : "Size"` | `account.size` | Size | المقاس |

---

### 3.12 `app/[locale]/account/components/tabs/wishlist-tab.tsx` (1 string) — LOW

**Namespace:** `"account"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 96 | `isArabic ? "عرض" : "View"` | `account.view` | View | عرض |

---

### 3.13 `app/[locale]/account/components/tabs/favourites-tab.tsx` (1 string) — LOW

**Namespace:** `"account"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 93 | `isArabic ? "عرض" : "View"` | `account.view` (reuse from 3.12) | View | عرض |

---

### 3.14 `app/[locale]/account/components/tabs/addresses-tab.tsx` (1 string) — LOW

**Namespace:** `"account"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 32 | `isArabic ? "ستُحفظ العناوين تلقائياً..." : "Addresses will be saved automatically..."` | `account.addressesAutoSaved` | Addresses will be saved automatically when you checkout | ستُحفظ العناوين تلقائياً عند إتمام طلبك |

---

### 3.15 `app/[locale]/account/client.tsx` (1 string) — LOW

**Status:** Uses `t()` for greeting but hardcodes Arabic comma.

| Line | Current Pattern | Fix |
|------|----------------|-----|
| 98 | `` `${t("greeting")}، ${user?.firstName}` `` | Use `t("greeting", { name: user?.firstName })` with ICU format in JSON: `"Hello, {name}"` / `"مرحباً، {name}"` |

---

### 3.16 `app/[locale]/checkout/success/page.tsx` (1 string) — LOW

**Namespace:** `"checkout"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 46 | `isArabic ? "معرف الجلسة: " : "Session ID: "` | `checkout.sessionId` | Session ID: | معرف الجلسة: |

---

### 3.17 `components/ui/size-guide-modal.tsx` (2 strings) — LOW

**Namespace:** `"product"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 38 | `isArabic ? "دليل المقاسات" : "Size Guide"` | `product.sizeGuide` (already exists — just replace hardcoded with `t("sizeGuide")`) | — | — |
| 53 | `isArabic ? "دليل المقاسات" : "Size Guide"` | `product.sizeGuide` (reuse) | — | — |

**Note:** Key already exists in both JSON files. Just need to replace the hardcoded pattern with `t("sizeGuide")`.

---

### 3.18 `components/cart/cart-drawer/components/suggested-item.tsx` (1 string) — LOW

**Namespace:** `"product"` (extend existing — `view` key already exists)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 51 | `isArabic ? "عرض" : "View"` | `product.view` (already exists — just replace with `t("view")`) | — | — |

---

### 3.19 `app/[locale]/collections/[slug]/page.tsx` (3 strings) — LOW (SEO metadata)

**Namespace:** `"collection"` (extend existing)

| Line | Current Pattern | New Key | English | Arabic |
|------|----------------|---------|---------|--------|
| 91 | `isArabic ? "جميع المنتجات - إن زد إن ستوديو" : "All Products - NZN Studio"` | `collection.allProductsTitle` | All Products - NZN Studio | جميع المنتجات - إن زد إن ستوديو |
| 93 | `isArabic ? "تصفح جميع منتجاتنا من الأزياء..." : "Browse all our fashion..."` | `collection.allProductsDesc` | Browse all our fashion... | تصفح جميع منتجاتنا من الأزياء... |
| 103 | `isArabic ? "المجموعة غير موجودة" : "Collection Not Found"` | `collection.notFound` | Collection Not Found | المجموعة غير موجودة |

---

## Summary Checklist

### Files count per phase

| Phase | Files | Strings | Severity |
|-------|-------|---------|----------|
| Phase 1 | 2 | 42 | Critical |
| Phase 2 | 3 | 25 | High |
| Phase 3 | 19 | 45 | Medium/Low |
| **Total** | **24** | **112** | — |

### New namespaces to create

| Namespace | Phase | Keys |
|-----------|-------|------|
| `reviewModal` | 1 | 25 |
| `orderConfirmation` | 1 | 10 |
| `footer` | 2 | 14 |
| `header` | 2 | 8 |
| `search` | 3 | 7 |
| `features` | 3 | 6 |
| `checkout` (extend) | 3 | 6 |
| `account` (extend) | 3 | 8 |
| `home` (extend) | 3 | 3 |
| `about` (extend) | 3 | 2 |
| `product` (extend) | 3 | 3 |
| `collection` (extend) | 3 | 3 |

### Files that need NO changes (already clean or data-driven)

- `components/layout/language-switcher.tsx` — native language name (standard UX)
- `image-gallery.tsx` — `isArabic` only for RTL direction, alt text uses DB fields
- `fixed-bottom-bar.tsx` — `isArabic` only for variant color/size names from DB
- `product-card.tsx` / `product-card-with-variants.tsx` — already uses `useTranslations`
- `hero-banner.tsx` / `hero-collections.tsx` / `promo-banner.tsx` — data from DB
- `instagram-gallery.tsx` — data from DB
- Date formatting with `toLocaleDateString` — standard pattern, not i18n issue
