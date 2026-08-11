-- Reservation pasa a ser el padre de la compra y Booking queda como tramo.
-- El pago se mueve al padre porque un round trip es un solo cobro sobre dos
-- tramos, y Payment.bookingId era @unique.
--
-- Migracion con backfill: cada Booking existente se convierte en una
-- Reservation ONE_WAY con su unico tramo OUTBOUND. Se reusa el id del booking
-- como id de la reserva para no perder el vinculo durante el proceso.

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');
CREATE TYPE "LegDirection" AS ENUM ('OUTBOUND', 'RETURN');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "tripType" "TripType" NOT NULL DEFAULT 'ONE_WAY',
    "passengers" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "heldUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- Columnas nuevas en Booking, nullable para poder backfillear
ALTER TABLE "Booking"
    ADD COLUMN "reservationId" TEXT,
    ADD COLUMN "direction" "LegDirection" NOT NULL DEFAULT 'OUTBOUND',
    ADD COLUMN "amount" DECIMAL(10,2);

-- Backfill: una Reservation por cada Booking existente
INSERT INTO "Reservation" (
    "id", "userId", "type", "tripType", "passengers",
    "totalAmount", "status", "heldUntil", "notes", "createdAt", "updatedAt"
)
SELECT
    b."id", b."userId", b."type", 'ONE_WAY', b."passengers",
    b."totalAmount", b."status", b."heldUntil", b."notes", b."createdAt", b."updatedAt"
FROM "Booking" b;

UPDATE "Booking" SET "reservationId" = "id", "amount" = "totalAmount";

-- Recien ahora se pueden exigir NOT NULL
ALTER TABLE "Booking"
    ALTER COLUMN "reservationId" SET NOT NULL,
    ALTER COLUMN "amount" SET NOT NULL;

-- Payment pasa a colgar de Reservation (mismo id por el backfill de arriba)
ALTER TABLE "Payment" ADD COLUMN "reservationId" TEXT;
UPDATE "Payment" SET "reservationId" = "bookingId";
ALTER TABLE "Payment" ALTER COLUMN "reservationId" SET NOT NULL;

ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";
DROP INDEX "Payment_bookingId_key";
ALTER TABLE "Payment" DROP COLUMN "bookingId";

-- Lo que ahora vive en Reservation sale de Booking
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";
ALTER TABLE "Booking"
    DROP COLUMN "userId",
    DROP COLUMN "type",
    DROP COLUMN "totalAmount",
    DROP COLUMN "status",
    DROP COLUMN "heldUntil",
    DROP COLUMN "notes",
    DROP COLUMN "updatedAt";

-- CreateIndex
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");
CREATE UNIQUE INDEX "Booking_reservationId_direction_key" ON "Booking"("reservationId", "direction");
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "Payment"("reservationId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
