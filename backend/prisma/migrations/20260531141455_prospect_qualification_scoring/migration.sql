-- AlterTable
ALTER TABLE "DealerProspect" ADD COLUMN     "budgetRange" TEXT,
ADD COLUMN     "buyingTimeline" TEXT,
ADD COLUMN     "currentDms" TEXT,
ADD COLUMN     "currentLeadProcess" TEXT,
ADD COLUMN     "decisionMakerAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlyVehiclesSold" INTEGER,
ADD COLUMN     "painLevel" INTEGER,
ADD COLUMN     "qualificationScore" INTEGER,
ADD COLUMN     "qualificationTier" TEXT,
ADD COLUMN     "salesTeamSize" INTEGER;
