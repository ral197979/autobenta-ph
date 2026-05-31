-- AlterTable
ALTER TABLE "DealerProspect" ADD COLUMN     "closingStage" TEXT,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "ownedBy" TEXT,
ADD COLUMN     "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "dealerProspectId" TEXT NOT NULL,
    "dealerName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "location" TEXT,
    "currentProcess" TEXT,
    "painPoints" TEXT,
    "recommendedPlan" TEXT NOT NULL DEFAULT 'founding_dealer',
    "monthlyVehicles" INTEGER,
    "avgGrossProfit" INTEGER,
    "projectedLeads" INTEGER,
    "roiEstimate" JSONB,
    "pricingMonthly" INTEGER NOT NULL DEFAULT 3599,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'generated',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signerEmail" TEXT,
    "signerTitle" TEXT,
    "auditLog" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosingInvoice" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT,
    "dealerId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "dealerName" TEXT NOT NULL,
    "dealerEmail" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'Founding Dealer Plan',
    "billingPeriod" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClosingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerSuccessScore" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "loginFrequency" INTEGER NOT NULL DEFAULT 0,
    "listingsAdded" INTEGER NOT NULL DEFAULT 0,
    "leadResponseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crmUsageScore" INTEGER NOT NULL DEFAULT 0,
    "inventoryQuality" INTEGER NOT NULL DEFAULT 0,
    "supportRequests" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "healthStatus" TEXT NOT NULL DEFAULT 'watch',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerSuccessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnRisk" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "triggers" JSONB NOT NULL DEFAULT '[]',
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurnRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "leadsGenerated" INTEGER,
    "responseImprovement" TEXT,
    "crmAdoption" TEXT,
    "revenueImpact" TEXT,
    "timeSaved" TEXT,
    "testimonial" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_proposalId_key" ON "Agreement"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ClosingInvoice_agreementId_key" ON "ClosingInvoice"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "ClosingInvoice_invoiceNumber_key" ON "ClosingInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DealerSuccessScore_dealerId_key" ON "DealerSuccessScore"("dealerId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_dealerProspectId_fkey" FOREIGN KEY ("dealerProspectId") REFERENCES "DealerProspect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingInvoice" ADD CONSTRAINT "ClosingInvoice_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingInvoice" ADD CONSTRAINT "ClosingInvoice_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerSuccessScore" ADD CONSTRAINT "DealerSuccessScore_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurnRisk" ADD CONSTRAINT "ChurnRisk_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStudy" ADD CONSTRAINT "CaseStudy_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
