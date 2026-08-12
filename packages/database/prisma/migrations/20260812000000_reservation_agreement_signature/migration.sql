-- Respaldo de que el cliente aceptó la política de cancelación/no-show antes
-- de reservar. La fecha la pone el servidor (bookings.service.ts), no el
-- cliente, para que sea una prueba confiable de cuándo se firmó.

ALTER TABLE "Reservation" ADD COLUMN "agreementSignedName" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "agreementSignedAt" TIMESTAMP(3);
