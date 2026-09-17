-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "bookedAsGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_accessToken_key" ON "Reservation"("accessToken");

