/*
  Restore optional product sizes, order gift messages and product size guides.

  - Re-create the `sizes` lookup table and `product_variants.sizeId` (dropped in
    20260406170641_remove_size_and_color_from_variants).
  - Re-add `products.sizeGuideUrl` / `sizeGuidePublicId`.
  - Add `orders.giftMessage` (order-level gift card option).
  - Add `order_items.sizeEn` / `sizeAr` snapshots taken at order creation.
*/
-- CreateTable
CREATE TABLE "sizes" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "sizeEn" TEXT,
ADD COLUMN "sizeAr" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "giftMessage" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "sizeId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "sizeGuideUrl" TEXT,
ADD COLUMN "sizeGuidePublicId" TEXT;

-- CreateIndex
CREATE INDEX "sizes_nameEn_idx" ON "sizes"("nameEn");

-- CreateIndex
CREATE INDEX "sizes_position_idx" ON "sizes"("position");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_nameEn_key" ON "sizes"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_nameAr_key" ON "sizes"("nameAr");

-- CreateIndex
CREATE INDEX "product_variants_sizeId_idx" ON "product_variants"("sizeId");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
