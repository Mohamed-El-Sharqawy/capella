import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const reviewData = [
  {
    customerName: "Omnia",
    title: "I TRUST YOU!",
    content: "THANK YOU! for this order you delivered it on time and the clothes material are super comfy I'm so grateful for what you do.",
    rating: 5,
  },
  {
    customerName: "Nourhane Amr",
    title: "Perfect Quality and service",
    content: "The order was delivered yesterday and am so thankful it came that fast. Thank you for the quality and the rapid response.",
    rating: 5,
  },
  {
    customerName: "Omar Elsayed",
    title: "BEST LEATHER JACKET EVER",
    content: "Quality el leather jacket bgdd ganda awy",
    rating: 5,
  },
  {
    customerName: "Ahmed Hassan",
    title: "Amazing Quality",
    content: "The fabric quality is exceptional. Will definitely order again!",
    rating: 5,
  },
  {
    customerName: "Sara Mohamed",
    title: "Fast Delivery",
    content: "Received my order within 2 days. The packaging was perfect and the clothes fit great.",
    rating: 5,
  },
  {
    customerName: "Youssef Ali",
    title: "Great Customer Service",
    content: "Had a question about sizing and the team responded immediately. Very helpful!",
    rating: 4,
  },
];

async function seedReviews() {
  console.log("🌱 Seeding reviews...");

  // Get all active products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        take: 1,
        include: {
          images: {
            take: 1,
            include: { image: true },
          },
        },
      },
    },
  });

  if (products.length === 0) {
    console.log("❌ No products found. Please seed products first.");
    return;
  }

  console.log(`📦 Found ${products.length} products`);

  // Delete existing reviews
  await prisma.review.deleteMany();
  console.log("🗑️  Cleared existing reviews");

  // Create reviews for random products
  for (let i = 0; i < reviewData.length; i++) {
    const review = reviewData[i];
    const product = products[i % products.length];

    await prisma.review.create({
      data: {
        productId: product.id,
        customerName: review.customerName,
        title: review.title,
        content: review.content,
        rating: review.rating,
        isApproved: true,
        isActive: true,
      },
    });

    console.log(`✅ Created review: "${review.title}" for ${product.nameEn}`);
  }

  console.log(`\n🎉 Seeded ${reviewData.length} reviews successfully!`);
}

seedReviews()
  .catch((e) => {
    console.error("❌ Error seeding reviews:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
