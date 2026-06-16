-- Add CRM pipeline stage to Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "crmStage" TEXT NOT NULL DEFAULT 'LISTING';

-- Add konut/ticari specific fields
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bathroomCount" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "balconyCount" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "isFurnished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "monthlyDues" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "hasOccupancyCertificate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "usageType" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "commonAreaRatio" DOUBLE PRECISION;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Property_crmStage_idx" ON "Property"("crmStage");

-- Create PropertyDocument table
CREATE TABLE IF NOT EXISTS "PropertyDocument" (
  "id" SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL,
  "docType" TEXT NOT NULL DEFAULT 'OTHER',
  "name" TEXT NOT NULL,
  "url" TEXT,
  "expiryDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyDocument_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PropertyDocument_propertyId_idx" ON "PropertyDocument"("propertyId");
