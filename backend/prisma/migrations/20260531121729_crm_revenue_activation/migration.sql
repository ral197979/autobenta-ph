-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DealerActivityType" ADD VALUE 'call_made';
ALTER TYPE "DealerActivityType" ADD VALUE 'sms_sent';
ALTER TYPE "DealerActivityType" ADD VALUE 'email_sent';
ALTER TYPE "DealerActivityType" ADD VALUE 'meeting_held';
ALTER TYPE "DealerActivityType" ADD VALUE 'test_drive_completed';
ALTER TYPE "DealerActivityType" ADD VALUE 'automation_triggered';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InquiryStatus" ADD VALUE 'qualified';
ALTER TYPE "InquiryStatus" ADD VALUE 'test_drive_scheduled';
ALTER TYPE "InquiryStatus" ADD VALUE 'negotiating';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "assignedUserId" TEXT,
ADD COLUMN     "leadScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_listings" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "featureType" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3) NOT NULL,
    "pricePhp" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_credits" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "pricePhp" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "packageId" TEXT,
    "leadId" TEXT,
    "type" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_rules_dealerId_isActive_idx" ON "automation_rules"("dealerId", "isActive");

-- CreateIndex
CREATE INDEX "featured_listings_listingId_idx" ON "featured_listings"("listingId");

-- CreateIndex
CREATE INDEX "featured_listings_dealerId_idx" ON "featured_listings"("dealerId");

-- CreateIndex
CREATE INDEX "featured_listings_status_endAt_idx" ON "featured_listings"("status", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "lead_credits_dealerId_key" ON "lead_credits"("dealerId");

-- CreateIndex
CREATE INDEX "credit_transactions_dealerId_idx" ON "credit_transactions"("dealerId");

-- CreateIndex
CREATE INDEX "credit_transactions_creditId_idx" ON "credit_transactions"("creditId");

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_credits" ADD CONSTRAINT "lead_credits_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "lead_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
