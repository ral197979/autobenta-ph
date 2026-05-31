-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('LISTING_VIEW', 'LISTING_SAVE', 'LISTING_SHARE', 'SELLER_CONTACT', 'FINANCING_REQUEST', 'INSPECTION_REQUEST', 'TRANSFER_CHECKLIST_STARTED', 'TRANSFER_CHECKLIST_COMPLETED', 'VEHICLE_HISTORY_VIEWED', 'SAFE_BUYING_VIEWED', 'VERIFICATION_VIEWED', 'LEAD_CREATED', 'LEAD_CONVERTED', 'DEALER_PAGE_VIEW', 'SEARCH_PERFORMED', 'FILTER_APPLIED', 'SALE_RECORDED');

-- CreateTable
CREATE TABLE "marketplace_events" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "listingId" TEXT,
    "dealerId" TEXT,
    "source" TEXT,
    "device" TEXT,
    "referrer" TEXT,
    "meta" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_metrics" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "saveCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "financingCount" INTEGER NOT NULL DEFAULT 0,
    "inspectionCount" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_metrics" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "convertedLeads" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeMs" INTEGER,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "activeListings" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalInquiries" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "activeListings" INTEGER NOT NULL DEFAULT 0,
    "verifiedListings" INTEGER NOT NULL DEFAULT 0,
    "transferReady" INTEGER NOT NULL DEFAULT 0,
    "totalDealers" INTEGER NOT NULL DEFAULT 0,
    "leadVolume" INTEGER NOT NULL DEFAULT 0,
    "inspectionVolume" INTEGER NOT NULL DEFAULT 0,
    "financingVolume" INTEGER NOT NULL DEFAULT 0,
    "transferVolume" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "eventVolume" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_funnels" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "listingViews" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "inspections" INTEGER NOT NULL DEFAULT 0,
    "financing" INTEGER NOT NULL DEFAULT 0,
    "transfers" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_funnels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_events_idempotencyKey_key" ON "marketplace_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "marketplace_events_eventType_createdAt_idx" ON "marketplace_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_events_listingId_eventType_idx" ON "marketplace_events"("listingId", "eventType");

-- CreateIndex
CREATE INDEX "marketplace_events_dealerId_eventType_idx" ON "marketplace_events"("dealerId", "eventType");

-- CreateIndex
CREATE INDEX "marketplace_events_sessionId_idx" ON "marketplace_events"("sessionId");

-- CreateIndex
CREATE INDEX "marketplace_events_createdAt_idx" ON "marketplace_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "listing_metrics_listingId_key" ON "listing_metrics"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_metrics_dealerId_key" ON "dealer_metrics"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_snapshotDate_key" ON "analytics_snapshots"("snapshotDate");

-- CreateIndex
CREATE INDEX "conversion_funnels_periodStart_periodEnd_idx" ON "conversion_funnels"("periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "marketplace_events" ADD CONSTRAINT "marketplace_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_events" ADD CONSTRAINT "marketplace_events_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_events" ADD CONSTRAINT "marketplace_events_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_metrics" ADD CONSTRAINT "listing_metrics_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_metrics" ADD CONSTRAINT "dealer_metrics_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
