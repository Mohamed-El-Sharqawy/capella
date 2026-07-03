-- AlterTable
ALTER TABLE "orders" ADD COLUMN "tabbyPaymentId" TEXT;
ALTER TABLE "orders" ADD COLUMN "tamaraCheckoutId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_tabbyPaymentId_key" ON "orders"("tabbyPaymentId");
CREATE UNIQUE INDEX "orders_tamaraCheckoutId_key" ON "orders"("tamaraCheckoutId");

-- CreateIndex
CREATE INDEX "orders_tabbyPaymentId_idx" ON "orders"("tabbyPaymentId");
CREATE INDEX "orders_tamaraCheckoutId_idx" ON "orders"("tamaraCheckoutId");
