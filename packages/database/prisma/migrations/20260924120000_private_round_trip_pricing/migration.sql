-- Precio propio del privado ida y vuelta. Sin cargar = no se vende round trip privado.
ALTER TABLE "Route" ADD COLUMN "pricePrivateRoundTrip" DECIMAL(10,2);

-- Infantes (0-2 anos): no pagan pero ocupan asiento
ALTER TABLE "Reservation" ADD COLUMN "infants" INTEGER NOT NULL DEFAULT 0;

-- Reglas globales del privado: pasajeros incluidos, precio por extra, capacidad de la van
CREATE TABLE "PricingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "includedPassengers" INTEGER NOT NULL DEFAULT 4,
    "extraPassengerPrice" DECIMAL(10,2) NOT NULL DEFAULT 20,
    "vehicleCapacity" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PricingSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);
