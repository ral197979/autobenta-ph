-- Newsletter subscribers
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");
