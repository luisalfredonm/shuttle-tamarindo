-- Dias de la semana de cada horario (0 = domingo). Los existentes quedan con
-- todos los dias, que es como venian funcionando.
ALTER TABLE "RouteSchedule" ADD COLUMN "daysOfWeek" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[];
