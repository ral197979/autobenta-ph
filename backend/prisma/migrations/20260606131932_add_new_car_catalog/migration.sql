-- New-car catalog: models + variants
CREATE TABLE "new_car_models" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "startingPrice" DECIMAL(12,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "brochureUrl" TEXT,
    "description" TEXT,
    "isElectric" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "specs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "new_car_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "new_car_variants" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "transmission" TEXT,
    "fuelType" TEXT,
    CONSTRAINT "new_car_variants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "new_car_variants" ADD CONSTRAINT "new_car_variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "new_car_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
