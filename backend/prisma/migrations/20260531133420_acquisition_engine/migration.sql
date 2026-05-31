-- CreateEnum
CREATE TYPE "ProspectStage" AS ENUM ('prospect', 'contacted', 'demo_scheduled', 'demo_completed', 'proposal_sent', 'negotiating', 'won', 'lost');

-- CreateEnum
CREATE TYPE "DemoType" AS ENUM ('marketplace', 'crm', 'v8atlas', 'full_platform');

-- CreateEnum
CREATE TYPE "DemoStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('onboarding', 'crm', 'listings', 'leads', 'billing', 'general');

-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('open', 'planned', 'in_progress', 'shipped', 'declined');

-- CreateEnum
CREATE TYPE "RenewalLikelihood" AS ENUM ('high', 'medium', 'low', 'at_risk', 'unknown');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "DealerProspect" (
    "id" TEXT NOT NULL,
    "dealerName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "location" TEXT,
    "branches" INTEGER NOT NULL DEFAULT 1,
    "inventorySize" TEXT,
    "currentSystem" TEXT,
    "source" TEXT,
    "stage" "ProspectStage" NOT NULL DEFAULT 'prospect',
    "owner" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "expectedMrr" INTEGER,
    "closeProbability" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerProspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectActivity" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoBooking" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "inventoryCount" TEXT,
    "currentProcess" TEXT,
    "challenges" TEXT,
    "demoType" "DemoType" NOT NULL DEFAULT 'full_platform',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "DemoStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pricing" TEXT,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "weaknesses" JSONB NOT NULL DEFAULT '[]',
    "objections" JSONB NOT NULL DEFAULT '[]',
    "positioning" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerSuccessPlan" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "inventoryImported" BOOLEAN NOT NULL DEFAULT false,
    "firstListingLive" BOOLEAN NOT NULL DEFAULT false,
    "firstLeadReceived" BOOLEAN NOT NULL DEFAULT false,
    "firstLeadResponded" BOOLEAN NOT NULL DEFAULT false,
    "firstSaleReported" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionActive" BOOLEAN NOT NULL DEFAULT false,
    "crmAdoptionRate" DOUBLE PRECISION,
    "renewalLikelihood" "RenewalLikelihood" NOT NULL DEFAULT 'unknown',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'low',
    "thirtyDayScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerSuccessPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "priority" TEXT NOT NULL DEFAULT 'low',
    "revenueImpact" INTEGER,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerFeedback" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT,
    "category" "FeedbackCategory" NOT NULL DEFAULT 'general',
    "rating" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" "TicketPriority" NOT NULL DEFAULT 'normal',
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPSResponse" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NPSResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorProfile_name_key" ON "CompetitorProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DealerSuccessPlan_dealerId_key" ON "DealerSuccessPlan"("dealerId");

-- AddForeignKey
ALTER TABLE "ProspectActivity" ADD CONSTRAINT "ProspectActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "DealerProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoBooking" ADD CONSTRAINT "DemoBooking_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "DealerProspect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerSuccessPlan" ADD CONSTRAINT "DealerSuccessPlan_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
