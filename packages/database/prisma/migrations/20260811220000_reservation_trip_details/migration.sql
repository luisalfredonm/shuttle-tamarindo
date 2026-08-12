-- Datos operativos del viaje que hoy no se capturan: el conductor necesita
-- saber el vuelo (para rastrear demoras) y la direccion exacta de pickup
-- puerta a puerta, no solo la ruta a nivel ciudad.

ALTER TABLE "Reservation" ADD COLUMN "flightNumber" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "pickupAddress" TEXT;
