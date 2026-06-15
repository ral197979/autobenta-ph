CREATE TYPE "LeadType" AS ENUM ('financing', 'insurance');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'approved', 'declined');
CREATE TABLE "partner_leads" (
    "id" TEXT NOT NULL,
    "type" "LeadType" NOT NULL DEFAULT 'financing',
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "listingId" TEXT,
    "vehicleInfo" TEXT,
    "amount" DECIMAL(12,2),
    "details" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partner_leads_pkey" PRIMARY KEY ("id")
);
