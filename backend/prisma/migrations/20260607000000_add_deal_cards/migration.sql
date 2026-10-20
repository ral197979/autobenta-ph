-- CreateTable
CREATE TABLE "deal_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'saved',
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deal_cards_userId_idx" ON "deal_cards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "deal_cards_userId_listingId_key" ON "deal_cards"("userId", "listingId");

-- AddForeignKey
ALTER TABLE "deal_cards" ADD CONSTRAINT "deal_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_cards" ADD CONSTRAINT "deal_cards_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "vehicle_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
