-- AlterTable
ALTER TABLE "vehicle_listings" ADD COLUMN     "financingEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownershipVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceScore" INTEGER,
ADD COLUMN     "sellerVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transferReady" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleHistoryAvailable" BOOLEAN NOT NULL DEFAULT false;
