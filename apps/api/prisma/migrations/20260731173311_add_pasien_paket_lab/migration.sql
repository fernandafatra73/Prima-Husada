-- CreateTable
CREATE TABLE "PasienPaketLab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pasienId" TEXT NOT NULL,
    "paketLabId" TEXT NOT NULL,
    "hargaSnapshot" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasienPaketLab_pasienId_fkey" FOREIGN KEY ("pasienId") REFERENCES "Pasien" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PasienPaketLab_paketLabId_fkey" FOREIGN KEY ("paketLabId") REFERENCES "PaketLab" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PasienPaketLab_pasienId_paketLabId_key" ON "PasienPaketLab"("pasienId", "paketLabId");
