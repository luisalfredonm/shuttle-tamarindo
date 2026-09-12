-- CreateTable
CREATE TABLE "RouteSchedule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "priceShared" DECIMAL(10,2) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteSchedule_routeId_departureTime_key" ON "RouteSchedule"("routeId", "departureTime");

-- AddForeignKey
ALTER TABLE "RouteSchedule" ADD CONSTRAINT "RouteSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
