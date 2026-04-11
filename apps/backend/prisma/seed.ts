import { prisma } from "../src/lib/prisma";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80";

const MATERIALS = [
  { nameEn: "18K Yellow Gold", nameAr: "ذهب أصفر عيار 18", position: 0 },
  { nameEn: "18K White Gold", nameAr: "ذهب أبيض عيار 18", position: 1 },
  { nameEn: "Rose Gold", nameAr: "ذهب وردي", position: 2 },
  { nameEn: "Platinum", nameAr: "بلاتين", position: 3 },
  { nameEn: "Sterling Silver", nameAr: "فضة إسترليني", position: 4 },
];

const STONES = [
  { nameEn: "Diamond", nameAr: "ألماس", position: 0 },
  { nameEn: "Sapphire", nameAr: "ياقوت أزرق", position: 1 },
  { nameEn: "Emerald", nameAr: "زمرد", position: 2 },
  { nameEn: "Ruby", nameAr: "ياقوت أحمر", position: 3 },
  { nameEn: "None", nameAr: "بدون حجر", position: 4 },
];

const CLARITIES = [
  { nameEn: "IF (Internally Flawless)", nameAr: "نقي داخلياً", position: 0 },
  { nameEn: "VVS1 (Very Very Slightly Included)", nameAr: "شوائب طفيفة جداً جداً", position: 1 },
  { nameEn: "VS1 (Very Slightly Included)", nameAr: "شوائب طفيفة جداً", position: 2 },
  { nameEn: "SI1 (Slightly Included)", nameAr: "شوائب طفيفة", position: 3 },
];

const COLLECTIONS = [
  {
    slug: "rings",
    nameEn: "Rings",
    nameAr: "خواتم",
    descriptionEn: "Discover our exquisite collection of diamond and gemstone rings.",
    descriptionAr: "اكتشف مجموعتنا الرائعة من خواتم الألماس والأحجار الكريمة.",
    isFeaturedOnHome: true,
    homeFeaturedPosition: 0,
  },
  {
    slug: "necklaces",
    nameEn: "Necklaces",
    nameAr: "قلادات",
    descriptionEn: "Elegant necklaces and pendants for every occasion.",
    descriptionAr: "قلادات ودلايات أنيقة لكل مناسبة.",
    isFeaturedOnHome: true,
    homeFeaturedPosition: 1,
  },
  {
    slug: "bracelets",
    nameEn: "Bracelets",
    nameAr: "أساور",
    descriptionEn: "Stunning bracelets crafted with precision and luxury.",
    descriptionAr: "أساور مذهلة صنعت بدقة وفخامة.",
  },
  {
    slug: "earrings",
    nameEn: "Earrings",
    nameAr: "أقراط",
    descriptionEn: "Beautiful earrings to complement your style.",
    descriptionAr: "أقراط جميلة لتكمل أسلوبك.",
  },
];

const PRODUCTS = [
  {
    nameEn: "Solitaire Diamond Ring",
    nameAr: "خاتم ألماس سوليتير",
    descriptionEn: "A timeless classic featuring a brilliant round-cut diamond set in 18K white gold.",
    descriptionAr: "كلاسيكية خالدة تتميز بقطعة ألماس مستديرة بقطع بريليانت مثبتة في ذهب أبيض عيار 18.",
    gender: "WOMEN",
    price: 15000,
    isFeatured: true,
    position: 0,
  },
  {
    nameEn: "Emerald & Diamond Necklace",
    nameAr: "قلادة الزمرد والألماس",
    descriptionEn: "A stunning emerald pendant surrounded by a halo of micro-pave diamonds.",
    descriptionAr: "دلاية زمرد مذهلة محاطة بهالة من الألماس الميكرو بافيه.",
    gender: "WOMEN",
    price: 28000,
    isFeatured: true,
    position: 1,
  },
  {
    nameEn: "Gold Link Bracelet",
    nameAr: "سوار من الذهب",
    descriptionEn: "Classic 18K yellow gold link bracelet with a modern polished finish.",
    descriptionAr: "سوار كلاسيكي من الذهب الأصفر عيار 18 بلمسة نهائية مصقولة عصرية.",
    gender: "UNISEX",
    price: 8500,
    isFeatured: true,
    position: 2,
  },
  {
    nameEn: "Sapphire Drop Earrings",
    nameAr: "أقراط ياقوت أزرق",
    descriptionEn: "Elegant deep blue sapphire drop earrings with platinum accents.",
    descriptionAr: "أقراط ياقوت أزرق عميق أنيقة مع لمسات من البلاتين.",
    gender: "WOMEN",
    price: 12500,
    isFeatured: false,
    position: 3,
  },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

async function clearDatabase() {
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.shoppableVideo.deleteMany();
  await prisma.instagramPost.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.productVariantImage.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collectionImage.deleteMany();
  await prisma.collectionBanner.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.material.deleteMany();
  await prisma.stone.deleteMany();
  await prisma.clarity.deleteMany();
  console.log("Database cleared.");
}

async function main() {
  await clearDatabase();

  console.log("Seeding attributes...");
  const materials = await Promise.all(MATERIALS.map(m => prisma.material.create({ data: m })));
  const stones = await Promise.all(STONES.map(s => prisma.stone.create({ data: s })));
  const clarities = await Promise.all(CLARITIES.map(c => prisma.clarity.create({ data: c })));

  console.log("Seeding collections...");
  const collections = await Promise.all(
    COLLECTIONS.map((c) =>
      prisma.collection.create({
        data: {
          ...c,
          isActive: true,
          image: {
            create: {
              url: PLACEHOLDER_IMAGE,
              publicId: `seed-col-${c.slug}`,
              altEn: c.nameEn,
              altAr: c.nameAr,
            },
          },
        },
      })
    )
  );

  console.log("Seeding products...");
  for (const pData of PRODUCTS) {
    const colId = collections.find(c => pData.nameEn.toLowerCase().includes(c.nameEn.toLowerCase().slice(0, -1)))?.id || collections[0].id;
    
    const product = await prisma.product.create({
      data: {
        slug: slugify(pData.nameEn) + "-" + Math.random().toString(36).slice(2, 7),
        nameEn: pData.nameEn,
        nameAr: pData.nameAr,
        descriptionEn: pData.descriptionEn,
        descriptionAr: pData.descriptionAr,
        gender: pData.gender as any,
        isActive: true,
        isFeatured: pData.isFeatured,
        position: pData.position,
        collectionId: colId,
        materialId: materials[Math.floor(Math.random() * materials.length)].id,
        stoneId: pData.nameEn.includes("Diamond") ? stones[0].id : stones[4].id,
        clarityId: pData.nameEn.includes("Diamond") ? clarities[0].id : undefined,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        slug: `${product.slug}-default`,
        productId: product.id,
        nameEn: pData.nameEn,
        nameAr: pData.nameAr,
        price: pData.price,
        stock: 10,
        isActive: true,
      },
    });

    const pImage = await prisma.productImage.create({
      data: {
        productId: product.id,
        url: PLACEHOLDER_IMAGE,
        publicId: `seed-prod-${product.id}`,
        altEn: pData.nameEn,
        altAr: pData.nameAr,
      },
    });

    await prisma.productVariantImage.create({
      data: {
        imageId: pImage.id,
        variantId: variant.id,
        position: 0,
      },
    });

    // Update product display variants
    await prisma.product.update({
      where: { id: product.id },
      data: {
        defaultVariantId: variant.id,
        hoverVariantId: variant.id,
      },
    });
  }

  console.log("Seeding banners...");
  await prisma.banner.create({
    data: {
      titleEn: "Luxury Defined",
      titleAr: "تعريف الفخامة",
      subtitleEn: "Exquisite jewellery for those who appreciate the finer things.",
      subtitleAr: "مجوهرات رائعة لمن يقدرون أرقى الأشياء.",
      imageUrl: PLACEHOLDER_IMAGE,
      publicId: "seed-banner-1",
      isActive: true,
      position: 0,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
