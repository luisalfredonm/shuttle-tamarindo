-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYPAL', 'BAC_CREDOMATIC');
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "orderId" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'PAYPAL';
-- CreateTable
CREATE TABLE "PaymentMethodConfig" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "publicKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentMethodConfig_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodConfig_provider_key" ON "PaymentMethodConfig"("provider");
-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
