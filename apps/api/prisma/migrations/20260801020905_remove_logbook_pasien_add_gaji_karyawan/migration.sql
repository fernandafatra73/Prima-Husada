/*
  Warnings:

  - You are about to drop the `LogbookPasien` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LogbookPasien";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "GajiKaryawan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaKaryawan" TEXT NOT NULL,
    "jabatan" TEXT,
    "bulan" TEXT NOT NULL,
    "gajiPokok" DECIMAL NOT NULL DEFAULT 0,
    "tunjangan" DECIMAL NOT NULL DEFAULT 0,
    "potongan" DECIMAL NOT NULL DEFAULT 0,
    "gajiBersih" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
