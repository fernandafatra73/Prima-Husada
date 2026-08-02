-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KesanBacaanKategori" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grupId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
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
