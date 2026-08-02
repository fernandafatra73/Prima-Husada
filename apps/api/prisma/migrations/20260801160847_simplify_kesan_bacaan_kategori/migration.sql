/*
  Warnings:

  - You are about to drop the column `urutan` on the `KesanBacaan` table. All the data in the column will be lost.
  - You are about to drop the column `urutan` on the `KesanBacaanGrup` table. All the data in the column will be lost.
  - You are about to drop the column `urutan` on the `KesanBacaanKategori` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KesanBacaan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategoriId" TEXT NOT NULL,
    "teks" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KesanBacaan_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KesanBacaanKategori" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KesanBacaan" ("createdAt", "id", "kategoriId", "teks", "updatedAt") SELECT "createdAt", "id", "kategoriId", "teks", "updatedAt" FROM "KesanBacaan";
DROP TABLE "KesanBacaan";
ALTER TABLE "new_KesanBacaan" RENAME TO "KesanBacaan";
CREATE INDEX "KesanBacaan_kategoriId_idx" ON "KesanBacaan"("kategoriId");
CREATE TABLE "new_KesanBacaanGrup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_KesanBacaanGrup" ("createdAt", "id", "nama", "updatedAt") SELECT "createdAt", "id", "nama", "updatedAt" FROM "KesanBacaanGrup";
DROP TABLE "KesanBacaanGrup";
ALTER TABLE "new_KesanBacaanGrup" RENAME TO "KesanBacaanGrup";
CREATE TABLE "new_KesanBacaanKategori" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grupId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KesanBacaanKategori_grupId_fkey" FOREIGN KEY ("grupId") REFERENCES "KesanBacaanGrup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KesanBacaanKategori" ("createdAt", "grupId", "id", "nama", "updatedAt") SELECT "createdAt", "grupId", "id", "nama", "updatedAt" FROM "KesanBacaanKategori";
DROP TABLE "KesanBacaanKategori";
ALTER TABLE "new_KesanBacaanKategori" RENAME TO "KesanBacaanKategori";
CREATE INDEX "KesanBacaanKategori_grupId_idx" ON "KesanBacaanKategori"("grupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
