-- CreateTable
CREATE TABLE "ZoningPrecedent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ks" REAL,
    "taks" REAL,
    "maxHeight" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoningPrecedent_city_district_neighborhood_type_key" ON "ZoningPrecedent"("city", "district", "neighborhood", "type");
