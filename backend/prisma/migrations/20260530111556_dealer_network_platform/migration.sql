-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'verified', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "DealerTier" AS ENUM ('basic', 'verified', 'verified_pro', 'enterprise');

-- AlterTable
ALTER TABLE "dealers" ADD COLUMN     "firstLeadAt" TIMESTAMP(3),
ADD COLUMN     "firstListingAt" TIMESTAMP(3),
ADD COLUMN     "firstSaleAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tier" "DealerTier" NOT NULL DEFAULT 'basic';

-- CreateTable
CREATE TABLE "dealer_branches" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_subscriptions" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "billingCycle" TEXT,
    "features" JSONB,
    "trialEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_members" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "dealer_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dealer_branches_dealerId_idx" ON "dealer_branches"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_subscriptions_dealerId_key" ON "dealer_subscriptions"("dealerId");

-- CreateIndex
CREATE INDEX "dealer_members_dealerId_idx" ON "dealer_members"("dealerId");

-- CreateIndex
CREATE INDEX "dealer_members_userId_idx" ON "dealer_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_members_dealerId_userId_key" ON "dealer_members"("dealerId", "userId");

-- AddForeignKey
ALTER TABLE "dealer_branches" ADD CONSTRAINT "dealer_branches_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_subscriptions" ADD CONSTRAINT "dealer_subscriptions_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
