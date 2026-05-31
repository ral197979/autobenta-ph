-- CreateTable
CREATE TABLE "TimeToValue" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "agreementSignedAt" TIMESTAMP(3),
    "invoicePaidAt" TIMESTAMP(3),
    "firstLoginAt" TIMESTAMP(3),
    "firstListingAt" TIMESTAMP(3),
    "firstLeadAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "firstQualifiedLeadAt" TIMESTAMP(3),
    "firstSaleAt" TIMESTAMP(3),
    "daysToFirstLogin" INTEGER,
    "daysToFirstListing" INTEGER,
    "daysToFirstLead" INTEGER,
    "daysToFirstResponse" INTEGER,
    "daysToFirstSale" INTEGER,
    "bottleneck" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeToValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdoptionSnapshot" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "logins" INTEGER NOT NULL DEFAULT 0,
    "listingsAdded" INTEGER NOT NULL DEFAULT 0,
    "leadsUpdated" INTEGER NOT NULL DEFAULT 0,
    "crmNotesAdded" INTEGER NOT NULL DEFAULT 0,
    "pipelineMovements" INTEGER NOT NULL DEFAULT 0,
    "analyticsViews" INTEGER NOT NULL DEFAULT 0,
    "lowAdoptionAlert" BOOLEAN NOT NULL DEFAULT false,
    "alertReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdoptionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSuccessTask" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "taskType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSuccessTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalReadiness" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "daysUntilRenewal" INTEGER,
    "healthReviewDone" BOOLEAN NOT NULL DEFAULT false,
    "usageReviewDone" BOOLEAN NOT NULL DEFAULT false,
    "roiReviewDone" BOOLEAN NOT NULL DEFAULT false,
    "expansionOpportunity" TEXT,
    "renewalProposalSent" BOOLEAN NOT NULL DEFAULT false,
    "renewalConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewalReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeToValue_dealerId_key" ON "TimeToValue"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "AdoptionSnapshot_dealerId_weekNumber_year_key" ON "AdoptionSnapshot"("dealerId", "weekNumber", "year");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalReadiness_dealerId_key" ON "RenewalReadiness"("dealerId");

-- AddForeignKey
ALTER TABLE "TimeToValue" ADD CONSTRAINT "TimeToValue_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionSnapshot" ADD CONSTRAINT "AdoptionSnapshot_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSuccessTask" ADD CONSTRAINT "CustomerSuccessTask_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalReadiness" ADD CONSTRAINT "RenewalReadiness_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
