import { prisma } from "../src/lib/prisma";

const COLORS = [
  { nameEn: "Black", nameAr: "أسود", hex: "#000000" },
  { nameEn: "White", nameAr: "أبيض", hex: "#FFFFFF" },
  { nameEn: "Navy", nameAr: "كحلي", hex: "#1a237e" },
  { nameEn: "Gray", nameAr: "رمادي", hex: "#9e9e9e" },
  { nameEn: "Beige", nameAr: "بيج", hex: "#d4c4a8" },
  { nameEn: "Brown", nameAr: "بني", hex: "#5d4037" },
  { nameEn: "Olive", nameAr: "زيتي", hex: "#556b2f" },
  { nameEn: "Light Blue", nameAr: "أزرق فاتح", hex: "#90caf9" },
  { nameEn: "Pink", nameAr: "وردي", hex: "#f8bbd9" },
  { nameEn: "Red", nameAr: "أحمر", hex: "#c62828" },
];

const SIZES = [
  { nameEn: "XS", nameAr: "صغير جداً", position: 0 },
  { nameEn: "S", nameAr: "صغير", position: 1 },
  { nameEn: "M", nameAr: "وسط", position: 2 },
  { nameEn: "L", nameAr: "كبير", position: 3 },
  { nameEn: "XL", nameAr: "كبير جداً", position: 4 },
  { nameEn: "XXL", nameAr: "كبير جداً جداً", position: 5 },
];

const COLLECTIONS = [
  {
    slug: "men",
    nameEn: "Men",
    nameAr: "رجال",
    descriptionEn: "Explore our men's collection featuring modern streetwear and everyday essentials.",
    descriptionAr: "اكتشف مجموعتنا الرجالية التي تضم أزياء الشارع العصرية والأساسيات اليومية.",
    metaTitleEn: "Men's Collection | Shop Men's Fashion",
    metaTitleAr: "مجموعة الرجال | تسوق أزياء الرجال",
    metaDescriptionEn: "Shop the latest men's fashion including hoodies, jackets, t-shirts and more.",
    metaDescriptionAr: "تسوق أحدث أزياء الرجال بما في ذلك الهوديز والجاكيتات والتيشيرتات والمزيد.",
  },
  {
    slug: "women",
    nameEn: "Women",
    nameAr: "نساء",
    descriptionEn: "Discover our women's collection with trendy styles and comfortable fits.",
    descriptionAr: "اكتشفي مجموعتنا النسائية مع أنماط عصرية ومقاسات مريحة.",
    metaTitleEn: "Women's Collection | Shop Women's Fashion",
    metaTitleAr: "مجموعة النساء | تسوق أزياء النساء",
    metaDescriptionEn: "Shop the latest women's fashion including dresses, tops, and accessories.",
    metaDescriptionAr: "تسوقي أحدث أزياء النساء بما في ذلك الفساتين والبلوزات والإكسسوارات.",
  },
  {
    slug: "new-arrivals",
    nameEn: "New Arrivals",
    nameAr: "وصل حديثاً",
    descriptionEn: "Check out our latest arrivals and be the first to get the newest styles.",
    descriptionAr: "اطلع على أحدث الوصولات وكن أول من يحصل على أحدث الأنماط.",
    metaTitleEn: "New Arrivals | Latest Fashion",
    metaTitleAr: "وصل حديثاً | أحدث الأزياء",
    metaDescriptionEn: "Discover our newest collection of clothing and accessories.",
    metaDescriptionAr: "اكتشف أحدث مجموعاتنا من الملابس والإكسسوارات.",
  },
  {
    slug: "sale",
    nameEn: "Sale",
    nameAr: "تخفيضات",
    descriptionEn: "Shop our sale items and get amazing deals on your favorite styles.",
    descriptionAr: "تسوق منتجاتنا المخفضة واحصل على عروض مذهلة على أنماطك المفضلة.",
    metaTitleEn: "Sale | Discounted Fashion",
    metaTitleAr: "تخفيضات | أزياء مخفضة",
    metaDescriptionEn: "Get the best deals on clothing and accessories.",
    metaDescriptionAr: "احصل على أفضل العروض على الملابس والإكسسوارات.",
  },
];

const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1544441893-675973e31985?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=337&h=505&fit=crop",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=337&h=505&fit=crop",
];

const PRODUCTS = [
  // Featured products (8)
  {
    nameEn: "Boxy Hoodie",
    nameAr: "هودي بوكسي",
    descriptionEn: "Premium oversized hoodie with a relaxed fit. Made from heavyweight cotton for ultimate comfort and durability.",
    descriptionAr: "هودي أوفرسايز فاخر بقصة مريحة. مصنوع من القطن الثقيل لراحة ومتانة فائقة.",
    shortDescriptionEn: "Premium oversized hoodie with relaxed fit",
    shortDescriptionAr: "هودي أوفرسايز فاخر بقصة مريحة",
    gender: "UNISEX",
    isFeatured: true,
    price: 599,
    compareAtPrice: 650,
  },
  {
    nameEn: "Vintage Leather Jacket",
    nameAr: "جاكيت جلد فينتاج",
    descriptionEn: "Classic leather jacket with vintage styling. Features premium quality leather and timeless design.",
    descriptionAr: "جاكيت جلد كلاسيكي بطراز فينتاج. يتميز بجلد عالي الجودة وتصميم خالد.",
    shortDescriptionEn: "Classic leather jacket with vintage styling",
    shortDescriptionAr: "جاكيت جلد كلاسيكي بطراز فينتاج",
    gender: "MEN",
    isFeatured: true,
    price: 1199,
    compareAtPrice: 1600,
  },
  {
    nameEn: "Off-Shoulder Sweatshirt",
    nameAr: "سويتشيرت أوف شولدر",
    descriptionEn: "Trendy off-shoulder sweatshirt perfect for casual outings. Soft fabric with a flattering silhouette.",
    descriptionAr: "سويتشيرت عصري بكتف مكشوف مثالي للخروجات الكاجوال. قماش ناعم بقصة جذابة.",
    shortDescriptionEn: "Trendy off-shoulder sweatshirt",
    shortDescriptionAr: "سويتشيرت عصري بكتف مكشوف",
    gender: "WOMEN",
    isFeatured: true,
    price: 450,
    compareAtPrice: 599,
  },
  {
    nameEn: "Boxy Crewneck",
    nameAr: "كرونيك بوكسي",
    descriptionEn: "Essential crewneck sweatshirt with a boxy fit. Perfect for layering or wearing on its own.",
    descriptionAr: "سويتشيرت كرونيك أساسي بقصة بوكسي. مثالي للطبقات أو الارتداء بمفرده.",
    shortDescriptionEn: "Essential crewneck with boxy fit",
    shortDescriptionAr: "كرونيك أساسي بقصة بوكسي",
    gender: "UNISEX",
    isFeatured: true,
    price: 550,
    compareAtPrice: 650,
  },
  {
    nameEn: "Zip-Up Sweater",
    nameAr: "سويتر بسحاب",
    descriptionEn: "Versatile zip-up sweater for everyday wear. Features a comfortable fit and quality construction.",
    descriptionAr: "سويتر بسحاب متعدد الاستخدامات للارتداء اليومي. يتميز بقصة مريحة وجودة عالية.",
    shortDescriptionEn: "Versatile zip-up sweater",
    shortDescriptionAr: "سويتر بسحاب متعدد الاستخدامات",
    gender: "UNISEX",
    isFeatured: true,
    price: 699,
    compareAtPrice: 799,
  },
  {
    nameEn: "Double Sleeve Boxy T-shirt",
    nameAr: "تيشيرت بوكسي بأكمام مزدوجة",
    descriptionEn: "Unique double sleeve design with a boxy silhouette. Stand out with this statement piece.",
    descriptionAr: "تصميم فريد بأكمام مزدوجة وقصة بوكسي. تميز بهذه القطعة المميزة.",
    shortDescriptionEn: "Unique double sleeve boxy t-shirt",
    shortDescriptionAr: "تيشيرت بوكسي فريد بأكمام مزدوجة",
    gender: "MEN",
    isFeatured: true,
    price: 450,
    compareAtPrice: 599,
  },
  {
    nameEn: "Oversized Bomber Jacket",
    nameAr: "جاكيت بومبر أوفرسايز",
    descriptionEn: "Modern oversized bomber jacket with premium materials. Perfect for transitional weather.",
    descriptionAr: "جاكيت بومبر أوفرسايز عصري بمواد فاخرة. مثالي للطقس الانتقالي.",
    shortDescriptionEn: "Modern oversized bomber jacket",
    shortDescriptionAr: "جاكيت بومبر أوفرسايز عصري",
    gender: "WOMEN",
    isFeatured: true,
    price: 899,
    compareAtPrice: 1100,
  },
  {
    nameEn: "Relaxed Fit Joggers",
    nameAr: "بنطلون جوجر مريح",
    descriptionEn: "Comfortable joggers with a relaxed fit. Perfect for lounging or casual outings.",
    descriptionAr: "بنطلون جوجر مريح بقصة فضفاضة. مثالي للاسترخاء أو الخروجات الكاجوال.",
    shortDescriptionEn: "Comfortable relaxed fit joggers",
    shortDescriptionAr: "بنطلون جوجر مريح بقصة فضفاضة",
    gender: "UNISEX",
    isFeatured: true,
    price: 399,
    compareAtPrice: 499,
  },
  // Non-featured products (8)
  {
    nameEn: "Basic Cotton T-shirt",
    nameAr: "تيشيرت قطن أساسي",
    descriptionEn: "Essential cotton t-shirt for everyday wear. Soft, breathable, and versatile.",
    descriptionAr: "تيشيرت قطن أساسي للارتداء اليومي. ناعم ومسامي ومتعدد الاستخدامات.",
    shortDescriptionEn: "Essential cotton t-shirt",
    shortDescriptionAr: "تيشيرت قطن أساسي",
    gender: "UNISEX",
    isFeatured: false,
    price: 199,
    compareAtPrice: 250,
  },
  {
    nameEn: "Slim Fit Chinos",
    nameAr: "بنطلون تشينو ضيق",
    descriptionEn: "Classic slim fit chinos for a polished look. Perfect for work or casual occasions.",
    descriptionAr: "بنطلون تشينو كلاسيكي ضيق لإطلالة أنيقة. مثالي للعمل أو المناسبات الكاجوال.",
    shortDescriptionEn: "Classic slim fit chinos",
    shortDescriptionAr: "بنطلون تشينو كلاسيكي ضيق",
    gender: "MEN",
    isFeatured: false,
    price: 449,
    compareAtPrice: 550,
  },
  {
    nameEn: "Floral Print Dress",
    nameAr: "فستان بطبعة زهور",
    descriptionEn: "Beautiful floral print dress perfect for spring and summer. Lightweight and flowy.",
    descriptionAr: "فستان جميل بطبعة زهور مثالي للربيع والصيف. خفيف وانسيابي.",
    shortDescriptionEn: "Beautiful floral print dress",
    shortDescriptionAr: "فستان جميل بطبعة زهور",
    gender: "WOMEN",
    isFeatured: false,
    price: 599,
    compareAtPrice: 750,
  },
  {
    nameEn: "Denim Jacket",
    nameAr: "جاكيت جينز",
    descriptionEn: "Classic denim jacket that never goes out of style. Durable and versatile.",
    descriptionAr: "جاكيت جينز كلاسيكي لا يخرج عن الموضة أبداً. متين ومتعدد الاستخدامات.",
    shortDescriptionEn: "Classic denim jacket",
    shortDescriptionAr: "جاكيت جينز كلاسيكي",
    gender: "UNISEX",
    isFeatured: false,
    price: 699,
    compareAtPrice: 850,
  },
  {
    nameEn: "Knit Cardigan",
    nameAr: "كارديجان تريكو",
    descriptionEn: "Cozy knit cardigan for layering. Soft and warm for cooler days.",
    descriptionAr: "كارديجان تريكو مريح للطبقات. ناعم ودافئ للأيام الباردة.",
    shortDescriptionEn: "Cozy knit cardigan",
    shortDescriptionAr: "كارديجان تريكو مريح",
    gender: "WOMEN",
    isFeatured: false,
    price: 549,
    compareAtPrice: 650,
  },
  {
    nameEn: "Cargo Pants",
    nameAr: "بنطلون كارجو",
    descriptionEn: "Functional cargo pants with multiple pockets. Perfect for utility and style.",
    descriptionAr: "بنطلون كارجو عملي بجيوب متعددة. مثالي للعملية والأناقة.",
    shortDescriptionEn: "Functional cargo pants",
    shortDescriptionAr: "بنطلون كارجو عملي",
    gender: "MEN",
    isFeatured: false,
    price: 499,
    compareAtPrice: 599,
  },
  {
    nameEn: "Ribbed Tank Top",
    nameAr: "تانك توب مضلع",
    descriptionEn: "Stretchy ribbed tank top for a flattering fit. Great for layering or wearing alone.",
    descriptionAr: "تانك توب مضلع مطاطي بقصة جذابة. رائع للطبقات أو الارتداء بمفرده.",
    shortDescriptionEn: "Stretchy ribbed tank top",
    shortDescriptionAr: "تانك توب مضلع مطاطي",
    gender: "WOMEN",
    isFeatured: false,
    price: 149,
    compareAtPrice: 199,
  },
  {
    nameEn: "Linen Shirt",
    nameAr: "قميص كتان",
    descriptionEn: "Breathable linen shirt perfect for warm weather. Relaxed fit with a casual vibe.",
    descriptionAr: "قميص كتان مسامي مثالي للطقس الدافئ. قصة مريحة بأجواء كاجوال.",
    shortDescriptionEn: "Breathable linen shirt",
    shortDescriptionAr: "قميص كتان مسامي",
    gender: "MEN",
    isFeatured: false,
    price: 399,
    compareAtPrice: 499,
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function clearDatabase() {
  console.log("Clearing existing data...");
  await prisma.productVariantImage.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collectionImage.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  console.log("Database cleared.");
}

async function seedColors() {
  console.log("Seeding colors...");
  const colors = await Promise.all(
    COLORS.map((color) =>
      prisma.color.create({ data: color })
    )
  );
  console.log(`Created ${colors.length} colors.`);
  return colors;
}

async function seedSizes() {
  console.log("Seeding sizes...");
  const sizes = await Promise.all(
    SIZES.map((size) =>
      prisma.size.create({ data: size })
    )
  );
  console.log(`Created ${sizes.length} sizes.`);
  return sizes;
}

async function seedCollections() {
  console.log("Seeding collections...");
  const collections = await Promise.all(
    COLLECTIONS.map((collection) =>
      prisma.collection.create({
        data: {
          ...collection,
          isActive: true,
        },
      })
    )
  );
  console.log(`Created ${collections.length} collections.`);
  return collections;
}

async function seedProducts(
  colors: Awaited<ReturnType<typeof seedColors>>,
  sizes: Awaited<ReturnType<typeof seedSizes>>,
  collections: Awaited<ReturnType<typeof seedCollections>>
) {
  console.log("Seeding products...");
  
  const menCollection = collections.find((c) => c.slug === "men")!;
  const womenCollection = collections.find((c) => c.slug === "women")!;
  
  let imageIndex = 0;
  
  for (const productData of PRODUCTS) {
    const collection =
      productData.gender === "MEN"
        ? menCollection
        : productData.gender === "WOMEN"
        ? womenCollection
        : Math.random() > 0.5
        ? menCollection
        : womenCollection;

    const product = await prisma.product.create({
      data: {
        slug: slugify(productData.nameEn) + "-" + Date.now(),
        nameEn: productData.nameEn,
        nameAr: productData.nameAr,
        descriptionEn: productData.descriptionEn,
        descriptionAr: productData.descriptionAr,
        shortDescriptionEn: productData.shortDescriptionEn,
        shortDescriptionAr: productData.shortDescriptionAr,
        metaTitleEn: `${productData.nameEn} | Shop Now`,
        metaTitleAr: `${productData.nameAr} | تسوق الآن`,
        metaDescriptionEn: productData.shortDescriptionEn,
        metaDescriptionAr: productData.shortDescriptionAr,
        gender: productData.gender as "MEN" | "WOMEN" | "UNISEX",
        isActive: true,
        isFeatured: productData.isFeatured,
        collectionId: collection.id,
      },
    });

    // Create variants for each color × size combination
    // Use 3-4 colors and all 6 sizes for a realistic product matrix
    const variantColors = colors.slice(0, 3 + Math.floor(Math.random() * 2));
    const variantSizes = sizes; // All sizes

    let variantCount = 0;
    
    // First, create product-level images for each color (shared across sizes)
    const colorImages: Map<string, { img1Id: string; img2Id: string }> = new Map();
    
    for (const color of variantColors) {
      const img1Url = PRODUCT_IMAGES[imageIndex % PRODUCT_IMAGES.length];
      const img2Url = PRODUCT_IMAGES[(imageIndex + 1) % PRODUCT_IMAGES.length];
      imageIndex += 2;

      // Create ProductImage records (one upload, shared across all sizes of this color)
      const [productImage1, productImage2] = await Promise.all([
        prisma.productImage.create({
          data: {
            productId: product.id,
            url: img1Url,
            publicId: `seed-${product.id}-${color.nameEn.toLowerCase()}-front`,
            altEn: `${productData.nameEn} - ${color.nameEn} - Front`,
            altAr: `${productData.nameAr} - ${color.nameAr} - أمامي`,
          },
        }),
        prisma.productImage.create({
          data: {
            productId: product.id,
            url: img2Url,
            publicId: `seed-${product.id}-${color.nameEn.toLowerCase()}-back`,
            altEn: `${productData.nameEn} - ${color.nameEn} - Back`,
            altAr: `${productData.nameAr} - ${color.nameAr} - خلفي`,
          },
        }),
      ]);

      colorImages.set(color.id, { img1Id: productImage1.id, img2Id: productImage2.id });
    }

    // Now create variants and link them to the shared images
    for (const color of variantColors) {
      const images = colorImages.get(color.id)!;

      for (const size of variantSizes) {
        const variant = await prisma.productVariant.create({
          data: {
            slug: `${slugify(productData.nameEn)}-${slugify(color.nameEn)}-${slugify(size.nameEn)}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            productId: product.id,
            nameEn: `${productData.nameEn} - ${color.nameEn} / ${size.nameEn}`,
            nameAr: `${productData.nameAr} - ${color.nameAr} / ${size.nameAr}`,
            sku: `SKU-${product.id.slice(-4)}-${color.nameEn.slice(0, 2).toUpperCase()}-${size.nameEn}-${Date.now().toString().slice(-4)}`,
            price: productData.price,
            compareAtPrice: productData.compareAtPrice,
            colorId: color.id,
            sizeId: size.id,
            stock: 20 + Math.floor(Math.random() * 80),
            isActive: true,
            metaTitleEn: `${productData.nameEn} - ${color.nameEn} / ${size.nameEn}`,
            metaTitleAr: `${productData.nameAr} - ${color.nameAr} / ${size.nameAr}`,
            metaDescriptionEn: productData.shortDescriptionEn,
            metaDescriptionAr: productData.shortDescriptionAr,
          },
        });

        // Link the shared images to this variant (junction table)
        await prisma.productVariantImage.createMany({
          data: [
            {
              imageId: images.img1Id,
              variantId: variant.id,
              position: 0,
            },
            {
              imageId: images.img2Id,
              variantId: variant.id,
              position: 1,
            },
          ],
        });

        variantCount++;
      }
    }

    console.log(`Created product: ${productData.nameEn} with ${variantCount} variants (${variantColors.length} colors × ${variantSizes.length} sizes), ${variantColors.length * 2} shared images`);
  }

  console.log(`Created ${PRODUCTS.length} products.`);
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await Bun.password.hash(adminPassword, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  console.log(`Admin user created: ${admin.email}`);
}

async function main() {
  await clearDatabase();
  const colors = await seedColors();
  const sizes = await seedSizes();
  const collections = await seedCollections();
  await seedProducts(colors, sizes, collections);
  await seedAdmin();
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
