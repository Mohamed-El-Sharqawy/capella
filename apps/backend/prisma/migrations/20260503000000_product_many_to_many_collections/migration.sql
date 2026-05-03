-- Create junction table for many-to-many product-collection relationship
CREATE TABLE "product_collections" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single collectionId data into the junction table
INSERT INTO "product_collections" ("id", "productId", "collectionId", "position")
SELECT
    CONCAT('mig_', p."id"),
    p."id",
    p."collectionId",
    0
FROM "products" p
WHERE p."collectionId" IS NOT NULL;

-- Create indexes
CREATE UNIQUE INDEX "product_collections_productId_collectionId_key" ON "product_collections"("productId", "collectionId");
CREATE INDEX "product_collections_productId_idx" ON "product_collections"("productId");
CREATE INDEX "product_collections_collectionId_idx" ON "product_collections"("collectionId");

-- Add foreign key constraints
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old relation
DROP INDEX IF EXISTS "products_collectionId_idx";
ALTER TABLE "products" DROP COLUMN "collectionId";
