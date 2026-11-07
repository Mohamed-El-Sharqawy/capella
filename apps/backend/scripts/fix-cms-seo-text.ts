/**
 * One-shot CMS text fix: replaces placeholder / missing SEO copy on
 * collections and products with real, accurate content (EN + AR).
 *
 * What this fixes (all live in the database, not in code):
 *
 *   Collections
 *     - nova-collection: meta title + description were literally "test"
 *     - amour-collection / oria-collection: one-word placeholders ("Amour",
 *       "Oria") as description AND meta text
 *     - Arabic names of the three brand collections were English
 *     - Category collections (rings/necklaces/bracelets/earrings) had
 *       one-line descriptions, no meta titles/descriptions, and rings claimed
 *       "diamond and gemstone rings" — the stones are cubic zirconia and
 *       mother of pearl, which is misleading
 *
 *   Products (all 26)
 *     - No meta descriptions at all → one clean ~150-char description per
 *       product, per language (the storefront falls back to shortDescription
 *       which contains HTML entities and gets truncated mid-sentence)
 *     - Inconsistent capitals: "NOVA RING", "NOVA Y RING" vs "NOVA Ring"
 *     - Trailing spaces in several English and Arabic names
 *     - "قرط" (singular) vs "أقراط" for the triple ORIA earrings
 *
 * Facts used everywhere (from the official policy pages):
 *   UAE delivery in 2-5 business days, 25 AED shipping under 600 AED
 *   (free above), handcrafted sterling silver / 18K gold plating,
 *   white cubic zirconia + mother of pearl, anti-tarnish, hypoallergenic,
 *   adjustable ring bands. No diamond claims, no "since 1990".
 *
 * Meta titles deliberately exclude "| Capella" — the page template appends
 * the brand. Product metaTitle stays null: the storefront already generates
 * "<Name> – <Material>" which is better than anything stored.
 *
 * Idempotent: re-running is a no-op — only fields whose value actually
 * differs are written. Dry-run by default; pass --apply to write.
 *
 * Usage (from repo root):
 *   pnpm fix:cms-text             # dry-run: print every change, write nothing
 *   pnpm fix:cms-text -- --apply  # write to the database pointed at by DATABASE_URL
 *
 * On the production VPS (backend container has DATABASE_URL):
 *   docker exec capella-backend bun run scripts/fix-cms-seo-text.ts --apply
 *
 * ⚠️ Take a pg_dump first.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const apply = process.argv.includes("--apply");

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};
const log = (msg: string) => console.log(msg);
const trunc = (s: string, n = 70) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

interface CollectionUpdate {
  nameAr?: string;
  descriptionEn: string;
  descriptionAr: string;
  metaTitleEn: string;
  metaTitleAr: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
}

interface ProductUpdate {
  /** Only set when the stored name needs fixing (caps, trailing space, spelling). */
  nameEn?: string;
  nameAr?: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
}

const COLLECTIONS: Record<string, CollectionUpdate> = {
  rings: {
    descriptionEn:
      "Handcrafted rings in sterling silver and 18K yellow gold plating, micro-set with white cubic zirconia and mother of pearl. Every band is adjustable, anti-tarnish and hypoallergenic, made to shine through everyday wear.",
    descriptionAr:
      "خواتم مصنوعة يدوياً من الفضة الإسترلينية والمطلي بالذهب الأصفر عيار 18 قيراط، مرصّعة بدقة بالزركونيا البيضاء وصدف اللؤلؤ. كل شريط قابل للتعديل، ومقاوم للأسوداد، ولطيف على البشرة الحساسة ليتألق مع إطلالاتك اليومية.",
    metaTitleEn: "Rings – Sterling Silver & 18K Gold-Plated",
    metaTitleAr: "خواتم – فضة إسترلينية ومطلية بالذهب عيار 18",
    metaDescriptionEn:
      "Handcrafted Capella rings in sterling silver and 18K gold plating, set with cubic zirconia and mother of pearl. Adjustable fit, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "خواتم كابيلا المصنوعة يدوياً من الفضة والمطلي بالذهب مع الزركونيا وصدف اللؤلؤ. مقاس قابل للتعديل وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  necklaces: {
    descriptionEn:
      "From delicate chains to statement Y-necklaces and triple-strand designs, each piece is handcrafted in sterling silver or 18K yellow gold plating with mother of pearl and micro-set cubic zirconia. Layer them together or let one shine on its own.",
    descriptionAr:
      "من السلاسل الرقيقة إلى قلادات Y المميزة والتصاميم ثلاثية الطبقات، كل قطعة مصنوعة يدوياً من الفضة الإسترلينية أو المطلي بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا المرصّعة بدقة. نسّقها معاً أو دع قطعة واحدة تتألق وحدها.",
    metaTitleEn: "Necklaces & Pendants – Silver & 18K Gold-Plated",
    metaTitleAr: "قلائد ودلايات – فضة ومطلية بالذهب عيار 18",
    metaDescriptionEn:
      "Handcrafted necklaces and pendants in sterling silver and 18K gold plating with mother of pearl and cubic zirconia. Free UAE delivery over 600 AED.",
    metaDescriptionAr:
      "قلائد ودلايات مصنوعة يدوياً من الفضة والمطلي بالذهب مع صدف اللؤلؤ والزركونيا. توصيل مجاني داخل الإمارات للطلبات فوق 600 درهم.",
  },
  bracelets: {
    descriptionEn:
      "Delicate bracelets handcrafted in sterling silver and 18K yellow gold plating, finished with mother of pearl and micro-set white cubic zirconia. Anti-tarnish and hypoallergenic, designed for stacking or wearing solo.",
    descriptionAr:
      "أساور رقيقة مصنوعة يدوياً من الفضة الإسترلينية والمطلي بالذهب الأصفر عيار 18، مزيّنة بصدف اللؤلؤ والزركونيا البيضاء المرصّعة بدقة. مقاومة للأسوداد ولطيفة على البشرة، صُممت للتنسيق المتعدد أو الفردي.",
    metaTitleEn: "Bracelets – Sterling Silver & 18K Gold-Plated",
    metaTitleAr: "أساور – فضة إسترلينية ومطلية بالذهب عيار 18",
    metaDescriptionEn:
      "Handcrafted Capella bracelets in sterling silver and 18K gold plating with cubic zirconia and mother of pearl. Anti-tarnish, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "أساور كابيلا المصنوعة يدوياً من الفضة والمطلي بالذهب مع الزركونيا وصدف اللؤلؤ. مقاومة للأسوداد وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  earrings: {
    descriptionEn:
      "From everyday studs to sculptural triple-drop earrings, every pair is handcrafted in sterling silver and 18K yellow gold plating with mother of pearl and micro-set white cubic zirconia. Light enough to wear all day, bright enough to be noticed.",
    descriptionAr:
      "من الأقراط اليومية الصغيرة إلى التصاميم الثلاثية الجذابة، كل قطعة مصنوعة يدوياً من الفضة الإسترلينية والمطلي بالذهب الأصفر عيار 18 مع صدف اللؤلؤ والزركونيا البيضاء. خفيفة لتومض طوال اليوم ومتألقة لتلفت الأنظار.",
    metaTitleEn: "Earrings – Studs & Drops in Silver & 18K Gold",
    metaTitleAr: "أقراط – فضية ومطلية بالذهب عيار 18",
    metaDescriptionEn:
      "Handcrafted Capella earrings in sterling silver and 18K gold plating with cubic zirconia and mother of pearl. Hypoallergenic, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "أقراط كابيلا المصنوعة يدوياً من الفضة والمطلي بالذهب مع الزركونيا وصدف اللؤلؤ. لطيفة على البشرة وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "amour-collection": {
    nameAr: "مجموعة أمور",
    descriptionEn:
      "Amour is Capella's love letter — pieces that capture how love arrives suddenly and glows forever. Handcrafted in sterling silver with clean, romantic lines made for gifting and for every day.",
    descriptionAr:
      "أمور رسالة حب من كابيلا — قطع تجسّد كيف يأتي الحب فجأة ويضيء إلى الأبد. مصنوعة يدوياً من الفضة الإسترلينية بخطوط رومانسية نقية، مثالية للإهداء وللإطلالات اليومية.",
    metaTitleEn: "Amour Collection – Sterling Silver Jewellery",
    metaTitleAr: "مجموعة أمور – مجوهرات من الفضة الإسترلينية",
    metaDescriptionEn:
      "Discover the Amour collection: handcrafted sterling silver rings, necklaces, bracelets and earrings inspired by enduring love. UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "اكتشف مجموعة أمور: خواتم وقلائد وأساور وأقراط من الفضة الإسترلينية مستوحاة من الحب الأبدي. توصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-collection": {
    nameAr: "مجموعة نوفا",
    descriptionEn:
      "Named for the star that suddenly blazes with new light, Nova is built to be noticed. Radiant sterling silver and 18K gold-plated pieces, micro-set with white cubic zirconia that catches every flash of light.",
    descriptionAr:
      "سُميت نوفا على النجم الذي يشتعل فجأة بنورٍ جديد، فتصاميمها صُنعت لتلفت الأنظار. قطع متألقة من الفضة الإسترلينية والمطلي بالذهب، مرصّعة بزركونيا بيضاء تلتقط كل شعاع ضوء.",
    metaTitleEn: "Nova Collection – Silver & Gold-Plated Jewellery",
    metaTitleAr: "مجموعة نوفا – مجوهرات فضية ومطلية بالذهب",
    metaDescriptionEn:
      "Shop the Nova collection: radiant silver and 18K gold-plated rings, necklaces, bracelets and earrings set with white cubic zirconia. UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "تسوق مجموعة نوفا: خواتم وقلائد وأساور وأقراط فضية ومطلية بالذهب مرصّعة بالزركونيا البيضاء. توصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-collection": {
    nameAr: "مجموعة أوريا",
    descriptionEn:
      "Oria pairs the soft iridescence of mother of pearl with micro-set white cubic zirconia in sterling silver and 18K yellow gold plating. Quietly luxurious designs that move with you from morning to evening.",
    descriptionAr:
      "تجمع أوريا بين لمعان صدف اللؤلؤ الناعم والزركونيا البيضاء المرصّعة بدقة في الفضة الإسترلينية والمطلي بالذهب عيار 18. تصاميم فاخرة بهدوء ترافقك من الصباح إلى المساء.",
    metaTitleEn: "Oria Collection – Mother of Pearl Jewellery",
    metaTitleAr: "مجموعة أوريا – مجوهرات بصدف اللؤلؤ",
    metaDescriptionEn:
      "Shop the Oria collection: sterling silver and 18K gold-plated jewellery with mother of pearl and cubic zirconia. Handcrafted, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "تسوق مجموعة أوريا: مجوهرات من الفضة والمطلي بالذهب مع صدف اللؤلؤ والزركونيا. مصنوعة يدوياً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
};

const PRODUCTS: Record<string, ProductUpdate> = {
  "nova-ring": {
    nameEn: "NOVA Ring",
    metaDescriptionEn:
      "NOVA ring in handcrafted sterling silver, micro-set with white cubic zirconia on an adjustable band. 255 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "خاتم نوفا من الفضة الإسترلينية المصنوع يدوياً، مرصّع بالزركونيا البيضاء بشريط قابل للتعديل. 255 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-y-ring": {
    nameEn: "NOVA Y Ring",
    metaDescriptionEn:
      "NOVA Y ring in 18K yellow gold plating, micro-set with white cubic zirconia on an adjustable band. 255 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "خاتم نوفا أصفر مطلي بالذهب عيار 18، مرصّع بالزركونيا البيضاء بشريط قابل للتعديل. 255 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "amour-ring": {
    nameAr: "خاتم أمور",
    metaDescriptionEn:
      "AMOUR ring in handcrafted sterling silver with an adjustable band — a feeling, a promise, a quiet expression of love. 300 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "خاتم أمور من الفضة الإسترلينية بشريط قابل للتعديل — شعورٌ ووعدٌ وتعبير هادئ عن الحب. 300 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-ring": {
    nameEn: "ORIA Ring",
    nameAr: "خاتم أوريا",
    metaDescriptionEn:
      "ORIA ring in handcrafted sterling silver with mother of pearl and micro-set cubic zirconia, on an adjustable band. 255 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "خاتم أوريا من الفضة الإسترلينية مع صدف اللؤلؤ والزركونيا، بشريط قابل للتعديل. 255 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-y-ring": {
    metaDescriptionEn:
      "ORIA Y ring in 18K gold plating with mother of pearl and micro-set cubic zirconia, on an adjustable band. 255 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "خاتم أوريا أصفر مطلي بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا، بشريط قابل للتعديل. 255 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "amour-necklace": {
    nameAr: "عقد أمور",
    metaDescriptionEn:
      "AMOUR necklace in handcrafted sterling silver — a quiet expression of love, anti-tarnish and hypoallergenic. 350 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "عقد أمور من الفضة الإسترلينية المصنوع يدوياً — تعبير هادئ عن الحب، مقاوم للأسوداد ولطيف على البشرة. 350 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-necklace": {
    metaDescriptionEn:
      "NOVA necklace in handcrafted sterling silver, micro-set with white cubic zirconia that shines like a burst of starlight. 300 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "عقد نوفا من الفضة الإسترلينية المصنوع يدوياً، مرصّع بزركونيا بيضاء تتألق كوميض نجم. 300 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-y-necklace": {
    nameEn: "NOVA Y Necklace",
    metaDescriptionEn:
      "NOVA Y necklace in 18K yellow gold plating, micro-set with white cubic zirconia that catches every flash of light. 300 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "عقد نوفا أصفر مطلي بالذهب عيار 18، مرصّع بزركونيا بيضاء تلتقط كل شعاع ضوء. 300 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-large-necklace": {
    nameEn: "NOVA Large Necklace",
    nameAr: "عقد نوفا الحجم الكبير",
    metaDescriptionEn:
      "NOVA Large necklace in handcrafted sterling silver, micro-set with white cubic zirconia for maximum brilliance. 410 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "عقد نوفا الحجم الكبير من الفضة الإسترلينية، مرصّع بزركونيا بيضاء لأقصى درجات التألق. 410 دراهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-large-y-necklace": {
    metaDescriptionEn:
      "NOVA Large Y necklace in 18K yellow gold plating, micro-set with white cubic zirconia — a bolder statement drop. 410 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "عقد نوفا الحجم الكبير أصفر مطلي بالذهب عيار 18، مرصّع بزركونيا بيضاء بتصميم جريء. 410 دراهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-necklace": {
    nameAr: "عقد أوريا",
    metaDescriptionEn:
      "ORIA necklace in handcrafted sterling silver with mother of pearl and micro-set white cubic zirconia. 300 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "عقد أوريا من الفضة الإسترلينية مع صدف اللؤلؤ وزركونيا بيضاء مرصّعة بدقة. 300 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-y-necklace": {
    metaDescriptionEn:
      "ORIA Y necklace in 18K gold plating with mother of pearl and micro-set cubic zirconia. Handcrafted. 300 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "عقد أوريا أصفر مطلي بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا. مصنوع يدوياً. 300 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "triple-oria-necklace": {
    metaDescriptionEn:
      "Triple-strand ORIA necklace in handcrafted sterling silver with mother of pearl and micro-set cubic zirconia. 380 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "عقد أوريا الثلاثي من الفضة الإسترلينية مع صدف اللؤلؤ والزركونيا. 380 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "triple-oria-y-necklace": {
    metaDescriptionEn:
      "Triple-strand ORIA Y necklace in 18K gold plating with mother of pearl and micro-set cubic zirconia. 380 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "عقد أوريا الثلاثي أصفر مطلي بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا. 380 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "amour-bracelet": {
    metaDescriptionEn:
      "AMOUR bracelet in handcrafted sterling silver — delicate, luminous and anti-tarnish, made to glow forever. 310 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "سوارة أمور من الفضة الإسترلينية — رقيقة ومضيئة ومقاومة للأسوداد، صُنعت لتتألق دائماً. 310 دراهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-bracelet": {
    metaDescriptionEn:
      "NOVA bracelet in handcrafted sterling silver, micro-set with white cubic zirconia. Anti-tarnish and hypoallergenic. 270 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "سوارة نوفا من الفضة الإسترلينية، مرصّعة بالزركونيا البيضاء. مقاومة للأسوداد ولطيفة على البشرة. 270 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-y-bracelet": {
    metaDescriptionEn:
      "NOVA Y bracelet in 18K yellow gold plating, micro-set with white cubic zirconia. Handcrafted and hypoallergenic. 270 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "سوارة نوفا صفراء مطلية بالذهب عيار 18، مرصّعة بالزركونيا البيضاء. مصنوعة يدوياً ولطيفة على البشرة. 270 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-bracelet": {
    nameEn: "ORIA Bracelet",
    nameAr: "سوارة أوريا",
    metaDescriptionEn:
      "ORIA bracelet in handcrafted sterling silver with mother of pearl and micro-set cubic zirconia. 280 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "سوارة أوريا من الفضة الإسترلينية مع صدف اللؤلؤ والزركونيا. 280 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-y-bracelet": {
    metaDescriptionEn:
      "ORIA Y bracelet in 18K gold plating with mother of pearl and micro-set cubic zirconia. Handcrafted. 280 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "سوارة أوريا صفراء مطلية بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا. مصنوعة يدوياً. 280 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "amour-earrings": {
    metaDescriptionEn:
      "AMOUR earrings in handcrafted sterling silver, anti-tarnish and hypoallergenic. Inspired by enduring love. 330 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "أقراط أمور من الفضة الإسترلينية، مقاومة للأسوداد ولطيفة على البشرة. مستوحاة من الحب الأبيد. 330 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-earrings": {
    metaDescriptionEn:
      "NOVA drop earrings in handcrafted sterling silver, micro-set with white cubic zirconia. Anti-tarnish and hypoallergenic. 320 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "أقراط نوفا من الفضة الإسترلينية، مرصّعة بالزركونيا البيضاء. مقاومة للأسوداد ولطيفة على البشرة. 320 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "nova-y-earrings": {
    metaDescriptionEn:
      "NOVA Y earrings in 18K yellow gold plating, micro-set with white cubic zirconia. Handcrafted and hypoallergenic. 320 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "أقراط نوفا صفراء مطلية بالذهب عيار 18، مرصّعة بالزركونيا البيضاء. مصنوعة يدوياً ولطيفة على البشرة. 320 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-stud-earrings": {
    metaDescriptionEn:
      "ORIA stud earrings in handcrafted sterling silver with mother of pearl and micro-set white cubic zirconia. 290 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "أقراط أوريا الصغيرة من الفضة الإسترلينية مع صدف اللؤلؤ والزركونيا البيضاء. 290 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "oria-stud-y-earrings": {
    nameEn: "ORIA Stud Y Earrings",
    metaDescriptionEn:
      "ORIA Y stud earrings in 18K gold plating with mother of pearl and micro-set cubic zirconia. Handcrafted. 290 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "أقراط أوريا الصغيرة أصفر مطلي بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا. مصنوعة يدوياً. 290 درهماً وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "triple-oria-earrings": {
    nameEn: "Triple ORIA Earrings",
    nameAr: "أقراط أوريا الثلاثية",
    metaDescriptionEn:
      "Triple-drop ORIA earrings in handcrafted sterling silver with mother of pearl and micro-set cubic zirconia. 400 AED, UAE delivery in 2-5 days.",
    metaDescriptionAr:
      "أقراط أوريا الثلاثية من الفضة الإسترلينية مع صدف اللؤلؤ والزركونيا. 400 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
  "triple-oria-y-earrings": {
    nameAr: "أقراط أوريا الثلاثية أصفر",
    metaDescriptionEn:
      "Triple-drop ORIA Y earrings in 18K gold plating with mother of pearl and micro-set cubic zirconia. 400 AED, delivered across the UAE in 2-5 days.",
    metaDescriptionAr:
      "أقراط أوريا الثلاثية أصفر مطلي بالذهب عيار 18 مع صدف اللؤلؤ والزركونيا. 400 درهم وتوصيل داخل الإمارات خلال 2-5 أيام.",
  },
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

type FieldMap = Record<string, string | undefined>;

function diffFields(current: FieldMap, desired: FieldMap): FieldMap {
  const changes: FieldMap = {};
  for (const [key, want] of Object.entries(desired)) {
    if (want === undefined) continue;
    const have = current[key];
    if ((have ?? "") !== want) changes[key] = want;
  }
  return changes;
}

function printChanges(label: string, changes: FieldMap) {
  log(`  ${c.cyan}${label}${c.reset}`);
  for (const [key, value] of Object.entries(changes)) {
    log(`    ${c.yellow}${key}${c.reset}:`);
    log(`      ${c.dim}${trunc(String(value))}${c.reset}`);
  }
}

async function main() {
  log(`\n${c.bright}CMS SEO text fix${c.reset}`);
  log(`${c.yellow}mode: ${apply ? "APPLY (writes)" : "DRY-RUN (no writes)"}${c.reset}\n`);

  // Length sanity: the storefront truncates meta descriptions at 160 chars,
  // so anything longer would end mid-sentence.
  for (const [slug, up] of Object.entries({ ...COLLECTIONS, ...PRODUCTS })) {
    const mde = up.metaDescriptionEn ?? "";
    const mda = up.metaDescriptionAr ?? "";
    if (mde.length > 160) log(`${c.red}⚠ ${slug}: metaDescriptionEn is ${mde.length} chars${c.reset}`);
    if (mda.length > 160) log(`${c.red}⚠ ${slug}: metaDescriptionAr is ${mda.length} chars${c.reset}`);
  }

  let changed = 0;
  let unchanged = 0;
  const missing: string[] = [];

  log(`${c.bright}Collections${c.reset}`);
  for (const [slug, up] of Object.entries(COLLECTIONS)) {
    const col = await prisma.collection.findUnique({ where: { slug } });
    if (!col) {
      missing.push(`collection:${slug}`);
      log(`  ${c.red}✗ ${slug} — NOT FOUND in database${c.reset}`);
      continue;
    }
    const changes = diffFields(col as unknown as FieldMap, up as FieldMap);
    if (Object.keys(changes).length === 0) {
      unchanged++;
      continue;
    }
    changed++;
    printChanges(slug, changes);
    if (apply) await prisma.collection.update({ where: { id: col.id }, data: changes });
  }

  log(`\n${c.bright}Products${c.reset}`);
  for (const [slug, up] of Object.entries(PRODUCTS)) {
    const prod = await prisma.product.findUnique({ where: { slug } });
    if (!prod) {
      missing.push(`product:${slug}`);
      log(`  ${c.red}✗ ${slug} — NOT FOUND in database${c.reset}`);
      continue;
    }
    const changes = diffFields(prod as unknown as FieldMap, up as FieldMap);
    if (Object.keys(changes).length === 0) {
      unchanged++;
      continue;
    }
    changed++;
    printChanges(slug, changes);
    if (apply) await prisma.product.update({ where: { id: prod.id }, data: changes });
  }

  log(
    `\n${c.green}${changed} record(s) ${apply ? "updated" : "to update"}, ` +
      `${unchanged} already current, ${missing.length} missing${c.reset}` +
      (missing.length ? ` ${c.red}(${missing.join(", ")})${c.reset}` : "") +
      (apply ? "" : `\n${c.dim}re-run with --apply to write${c.reset}`) + "\n`
  );

  if (missing.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
