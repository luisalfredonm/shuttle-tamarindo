-- Las reservas privadas crean un Trip puntual al vuelo para la hora que
-- pide el cliente. Sin esta marca, ese Trip se mezclaba en la lista de
-- compartido junto con los horarios fijos que carga el admin.

CREATE TYPE "TripSource" AS ENUM ('SCHEDULED', 'ON_DEMAND');

ALTER TABLE "Trip" ADD COLUMN "source" "TripSource" NOT NULL DEFAULT 'SCHEDULED';

-- Backfill: los Trips ad-hoc ya creados se identifican porque priceShared
-- no aplica ahi (ver bookings.service.ts resolveTripId) y quedo en 0
UPDATE "Trip" SET "source" = 'ON_DEMAND' WHERE "priceShared" = 0;
