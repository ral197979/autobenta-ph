-- CreateEnum
CREATE TYPE "Role" AS ENUM ('buyer', 'seller', 'dealer', 'inspector', 'admin');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'pending', 'active', 'sold', 'archived', 'rejected', 'flagged');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('new', 'contacted', 'viewing_scheduled', 'financing', 'closed_won', 'closed_lost');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('pass', 'warning', 'fail');

-- CreateEnum
CREATE TYPE "FinancingStatus" AS ENUM ('requested', 'prequalified', 'docs_needed', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('gasoline', 'diesel', 'hybrid', 'electric', 'lpg');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('automatic', 'manual', 'cvt');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('private', 'dealer', 'repossessed');

-- CreateEnum
CREATE TYPE "ConditionGrade" AS ENUM ('excellent', 'good', 'fair', 'poor');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('approve', 'reject', 'flag', 'request_info', 'escalate', 'suspend_seller', 'restore');

-- CreateEnum
CREATE TYPE "FraudFlagSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DealerActivityType" AS ENUM ('lead_created', 'lead_updated', 'note_added', 'reminder_set', 'listing_created', 'listing_sold', 'inquiry_received', 'financing_requested');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'buyer',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendReason" TEXT,
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "licenseNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avgResponseHours" DOUBLE PRECISION,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalWon" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "dealerId" TEXT,
    "sellerType" "SellerType" NOT NULL DEFAULT 'private',
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "variant" TEXT,
    "plateEnding" TEXT,
    "mileage" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT true,
    "fuelType" "FuelType" NOT NULL DEFAULT 'gasoline',
    "transmission" "Transmission" NOT NULL DEFAULT 'automatic',
    "color" TEXT,
    "bodyType" TEXT,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "condition" "ConditionGrade" NOT NULL DEFAULT 'good',
    "description" TEXT,
    "hasOrCr" BOOLEAN NOT NULL DEFAULT true,
    "orCrNotes" TEXT,
    "ownerCount" INTEGER NOT NULL DEFAULT 1,
    "serviceHistory" BOOLEAN NOT NULL DEFAULT false,
    "serviceNotes" TEXT,
    "hasAccident" BOOLEAN NOT NULL DEFAULT false,
    "accidentNotes" TEXT,
    "hasFlood" BOOLEAN NOT NULL DEFAULT false,
    "floodNotes" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "aiDraftData" JSONB,
    "searchVector" TEXT,
    "fraudFlags" JSONB,
    "fraudScore" INTEGER DEFAULT 0,
    "moderationNote" TEXT,
    "aiAnalysisId" TEXT,
    "listedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "vehicle_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_photos" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contactPhone" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'new',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "listingId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "source" TEXT DEFAULT 'inquiry',
    "lostReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_requests" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'requested',
    "preferredDate" TIMESTAMP(3),
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_reports" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "result" "InspectionResult" NOT NULL,
    "exterior" JSONB NOT NULL,
    "interior" JSONB NOT NULL,
    "engine" JSONB NOT NULL,
    "transmission" JSONB NOT NULL,
    "suspension" JSONB NOT NULL,
    "tires" JSONB NOT NULL,
    "electrical" JSONB NOT NULL,
    "floodSigns" JSONB NOT NULL,
    "accidentSigns" JSONB NOT NULL,
    "testDriveNotes" TEXT,
    "photos" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financing_requests" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "FinancingStatus" NOT NULL DEFAULT 'requested',
    "vehiclePrice" DECIMAL(12,2) NOT NULL,
    "downPayment" DECIMAL(12,2) NOT NULL,
    "loanAmount" DECIMAL(12,2) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyPayment" DECIMAL(12,2),
    "incomeRange" TEXT NOT NULL,
    "employmentType" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "estimatedPrice" DECIMAL(12,2),
    "priceLow" DECIMAL(12,2),
    "priceHigh" DECIMAL(12,2),
    "listingScore" INTEGER,
    "fraudScore" INTEGER,
    "fraudFlags" JSONB,
    "qualityFlags" JSONB,
    "buyerChecklist" JSONB,
    "negotiationTips" JSONB,
    "summary" TEXT,
    "model" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "flagType" TEXT NOT NULL,
    "severity" "FraudFlagSeverity" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolveNote" TEXT,
    "autoDetected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_risk_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "flags" JSONB,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "flaggedListings" INTEGER NOT NULL DEFAULT 0,
    "rapidListings" BOOLEAN NOT NULL DEFAULT false,
    "duplicateHistory" BOOLEAN NOT NULL DEFAULT false,
    "suspiciousEdits" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_moderation_actions" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "alertOn" BOOLEAN NOT NULL DEFAULT false,
    "lastRun" TIMESTAMP(3),
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recently_viewed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_activities" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "leadId" TEXT,
    "actorId" TEXT,
    "type" "DealerActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_reminders" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "prevHash" TEXT,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_hash_anchors" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "logId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_hash_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_userId_key" ON "dealers"("userId");

-- CreateIndex
CREATE INDEX "vehicle_listings_status_idx" ON "vehicle_listings"("status");

-- CreateIndex
CREATE INDEX "vehicle_listings_make_model_idx" ON "vehicle_listings"("make", "model");

-- CreateIndex
CREATE INDEX "vehicle_listings_city_idx" ON "vehicle_listings"("city");

-- CreateIndex
CREATE INDEX "vehicle_listings_price_idx" ON "vehicle_listings"("price");

-- CreateIndex
CREATE INDEX "vehicle_listings_year_idx" ON "vehicle_listings"("year");

-- CreateIndex
CREATE INDEX "vehicle_listings_mileage_idx" ON "vehicle_listings"("mileage");

-- CreateIndex
CREATE INDEX "vehicle_listings_createdAt_idx" ON "vehicle_listings"("createdAt");

-- CreateIndex
CREATE INDEX "vehicle_listings_sellerId_idx" ON "vehicle_listings"("sellerId");

-- CreateIndex
CREATE INDEX "vehicle_listings_dealerId_idx" ON "vehicle_listings"("dealerId");

-- CreateIndex
CREATE INDEX "vehicle_listings_fraudScore_idx" ON "vehicle_listings"("fraudScore");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_listingId_key" ON "favorites"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_inquiryId_key" ON "leads"("inquiryId");

-- CreateIndex
CREATE INDEX "leads_dealerId_status_idx" ON "leads"("dealerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_reports_requestId_key" ON "inspection_reports"("requestId");

-- CreateIndex
CREATE INDEX "fraud_flags_listingId_idx" ON "fraud_flags"("listingId");

-- CreateIndex
CREATE INDEX "fraud_flags_flagType_idx" ON "fraud_flags"("flagType");

-- CreateIndex
CREATE INDEX "fraud_flags_severity_idx" ON "fraud_flags"("severity");

-- CreateIndex
CREATE INDEX "fraud_flags_isResolved_idx" ON "fraud_flags"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "seller_risk_profiles_userId_key" ON "seller_risk_profiles"("userId");

-- CreateIndex
CREATE INDEX "listing_moderation_actions_listingId_idx" ON "listing_moderation_actions"("listingId");

-- CreateIndex
CREATE INDEX "listing_moderation_actions_adminId_idx" ON "listing_moderation_actions"("adminId");

-- CreateIndex
CREATE INDEX "listing_moderation_actions_action_idx" ON "listing_moderation_actions"("action");

-- CreateIndex
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");

-- CreateIndex
CREATE INDEX "recently_viewed_userId_idx" ON "recently_viewed"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "recently_viewed_userId_listingId_key" ON "recently_viewed"("userId", "listingId");

-- CreateIndex
CREATE INDEX "dealer_activities_dealerId_idx" ON "dealer_activities"("dealerId");

-- CreateIndex
CREATE INDEX "dealer_activities_leadId_idx" ON "dealer_activities"("leadId");

-- CreateIndex
CREATE INDEX "dealer_reminders_dealerId_isDone_idx" ON "dealer_reminders"("dealerId", "isDone");

-- CreateIndex
CREATE INDEX "dealer_reminders_dueAt_idx" ON "dealer_reminders"("dueAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "audit_hash_anchors_sequence_key" ON "audit_hash_anchors"("sequence");

-- AddForeignKey
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_listings" ADD CONSTRAINT "vehicle_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_listings" ADD CONSTRAINT "vehicle_listings_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "inspection_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financing_requests" ADD CONSTRAINT "financing_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financing_requests" ADD CONSTRAINT "financing_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_risk_profiles" ADD CONSTRAINT "seller_risk_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_moderation_actions" ADD CONSTRAINT "listing_moderation_actions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_activities" ADD CONSTRAINT "dealer_activities_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_activities" ADD CONSTRAINT "dealer_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_reminders" ADD CONSTRAINT "dealer_reminders_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
