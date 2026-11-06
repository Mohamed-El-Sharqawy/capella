-- AlterTable
-- Tracks whether an order's units are currently deducted from variant stock
-- (COD from placement; online from checkout-session start until paid,
-- cancelled or the hold expires). Existing orders default to false: they are
-- never restocked automatically, matching their previous behaviour.
ALTER TABLE "orders" ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "orders_status_stockReserved_createdAt_idx" ON "orders"("status", "stockReserved", "createdAt");
