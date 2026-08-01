-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GajiKaryawan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaKaryawan" TEXT NOT NULL,
    "jabatan" TEXT,
    "bulan" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gajiPokok" DECIMAL NOT NULL DEFAULT 0,
    "tunjangan" DECIMAL NOT NULL DEFAULT 0,
    "potongan" DECIMAL NOT NULL DEFAULT 0,
    "gajiBersih" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GajiKaryawan" ("bulan", "createdAt", "gajiBersih", "gajiPokok", "id", "jabatan", "namaKaryawan", "potongan", "tunjangan", "updatedAt") SELECT "bulan", "createdAt", "gajiBersih", "gajiPokok", "id", "jabatan", "namaKaryawan", "potongan", "tunjangan", "updatedAt" FROM "GajiKaryawan";
DROP TABLE "GajiKaryawan";
ALTER TABLE "new_GajiKaryawan" RENAME TO "GajiKaryawan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
