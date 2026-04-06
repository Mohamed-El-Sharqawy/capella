/*
  Warnings:

  - You are about to drop the column `color` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `colorId` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `sizeGuidePublicId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sizeGuideUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `colors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sizes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_colorId_fkey";

-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_sizeId_fkey";

-- DropIndex
DROP INDEX "product_variants_colorId_idx";

-- DropIndex
DROP INDEX "product_variants_sizeId_idx";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "color",
DROP COLUMN "size";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "colorId",
DROP COLUMN "sizeId";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "sizeGuidePublicId",
DROP COLUMN "sizeGuideUrl";

-- DropTable
DROP TABLE "colors";

-- DropTable
DROP TABLE "sizes";
