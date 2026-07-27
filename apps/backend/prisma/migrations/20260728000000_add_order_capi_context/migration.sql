-- AlterTable
-- Persisted browser CAPI context (fbp/fbc/IP/UA/eventSourceUrl) captured at
-- checkout creation and rehydrated by `capiContextFromOrder` on webhook
-- Purchase paths (Ziina/Tabby/Tamara). Nullable: legacy orders stay null and
-- fall back to the bare `fbp`/`fbc` columns.
ALTER TABLE "orders" ADD COLUMN "capiContext" JSONB;
