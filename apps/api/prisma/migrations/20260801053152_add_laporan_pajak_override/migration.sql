-- CreateTable
CREATE TABLE "LaporanPajakOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "modul" TEXT NOT NULL DEFAULT 'RADIOLOGI',
    "jumlahPasien" INTEGER NOT NULL,
    "harga" DECIMAL NOT NULL,
    "totalPenerimaan" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LaporanPajakOverride_year_bulan_modul_key" ON "LaporanPajakOverride"("year", "bulan", "modul");
