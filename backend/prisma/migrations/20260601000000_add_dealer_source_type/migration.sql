-- CreateEnum
CREATE TYPE "DealerSourceType" AS ENUM ('MANUAL', 'CSV', 'V8ATLAS', 'API');

-- AlterTable dealers: add sourceType and integrationMeta
ALTER TABLE "dealers" ADD COLUMN "sourceType" "DealerSourceType" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "dealers" ADD COLUMN "integrationMeta" JSONB;

-- AlterTable vehicle_listings: add inventorySource and externalId
ALTER TABLE "vehicle_listings" ADD COLUMN "inventorySource" "DealerSourceType";
ALTER TABLE "vehicle_listings" ADD COLUMN "externalId" TEXT;

-- CreateIndex: unique constraint for upsert by externalId + dealerId
CREATE UNIQUE INDEX "vehicle_listings_externalId_dealerId_key" ON "vehicle_listings"("externalId", "dealerId");
