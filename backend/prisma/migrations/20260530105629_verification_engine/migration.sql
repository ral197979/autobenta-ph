-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('seller_identity', 'dealer_business', 'ownership', 'vehicle', 'transfer_readiness');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired', 'suspended');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('government_id', 'selfie', 'or_cr', 'deed_of_sale', 'business_registration', 'dealer_permit', 'proof_of_address', 'insurance_policy', 'inspection_report', 'other');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verificationExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationScore" INTEGER;

-- AlterTable
ALTER TABLE "vehicle_listings" ADD COLUMN     "readinessEvaluatedAt" TIMESTAMP(3),
ADD COLUMN     "readinessReason" JSONB,
ADD COLUMN     "readinessScore" INTEGER;

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "verificationType" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "verificationScore" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "fileName" TEXT,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_reviews" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" "VerificationStatus" NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_status_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "VerificationStatus",
    "toStatus" "VerificationStatus" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_requests_userId_idx" ON "verification_requests"("userId");

-- CreateIndex
CREATE INDEX "verification_requests_listingId_idx" ON "verification_requests"("listingId");

-- CreateIndex
CREATE INDEX "verification_requests_verificationType_idx" ON "verification_requests"("verificationType");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- CreateIndex
CREATE INDEX "verification_requests_submittedAt_idx" ON "verification_requests"("submittedAt");

-- CreateIndex
CREATE INDEX "verification_documents_requestId_idx" ON "verification_documents"("requestId");

-- CreateIndex
CREATE INDEX "verification_documents_documentType_idx" ON "verification_documents"("documentType");

-- CreateIndex
CREATE INDEX "verification_reviews_requestId_idx" ON "verification_reviews"("requestId");

-- CreateIndex
CREATE INDEX "verification_reviews_reviewerId_idx" ON "verification_reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "verification_status_history_requestId_idx" ON "verification_status_history"("requestId");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_status_history" ADD CONSTRAINT "verification_status_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
