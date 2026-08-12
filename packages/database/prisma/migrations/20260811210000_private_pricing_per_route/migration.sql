-- El privado va en un vehiculo exclusivo a la hora que pida el cliente, no a
-- un horario precargado: ya no elige entre Trips existentes, asi que el
-- precio no puede seguir viviendo por Trip (se repetia identico en cada
-- horario sembrado de una misma ruta). Pasa a ser un precio fijo por Route.

-- Se agrega nullable para poder backfillear antes de exigir NOT NULL
ALTER TABLE "Route" ADD COLUMN "pricePrivate" DECIMAL(10,2);

-- Backfill: cada ruta toma el pricePrivate de cualquiera de sus Trips
-- existentes (hoy es el mismo valor en todos, porque el seed lo repetia).
-- Si una ruta no tiene Trips todavia, cae a un valor por defecto revisable
-- a mano desde el admin.
UPDATE "Route" r
SET "pricePrivate" = t."pricePrivate"
FROM (
    SELECT DISTINCT ON ("routeId") "routeId", "pricePrivate"
    FROM "Trip"
) t
WHERE t."routeId" = r."id";

UPDATE "Route" SET "pricePrivate" = 100 WHERE "pricePrivate" IS NULL;

ALTER TABLE "Route" ALTER COLUMN "pricePrivate" SET NOT NULL;

ALTER TABLE "Trip" DROP COLUMN "pricePrivate";
