-- Impuesto configurable desde el panel. Apagado hasta que el admin lo prenda.
ALTER TABLE "PricingSettings" ADD COLUMN "taxEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PricingSettings" ADD COLUMN "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 13;

-- Desglose por reserva. Las existentes no llevaban impuesto: subtotal = total.
ALTER TABLE "Reservation" ADD COLUMN "subtotalAmount" DECIMAL(10,2);
ALTER TABLE "Reservation" ADD COLUMN "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
UPDATE "Reservation" SET "subtotalAmount" = "totalAmount";
ALTER TABLE "Reservation" ALTER COLUMN "subtotalAmount" SET NOT NULL;
