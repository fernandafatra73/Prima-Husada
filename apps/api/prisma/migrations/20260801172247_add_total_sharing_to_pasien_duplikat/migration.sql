-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PasienDuplikat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePasienId" TEXT NOT NULL,
    "regCode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "noTelepon" TEXT,
    "alamat" TEXT,
    "pengirimNama" TEXT NOT NULL,
    "radiologNama" TEXT,
    "asalModul" TEXT NOT NULL DEFAULT 'RADIOLOGI',
    "klinis" TEXT,
    "kesan" TEXT,
    "hasilStatus" TEXT NOT NULL DEFAULT 'MENUNGGU_HASIL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "pemeriksaanNama" TEXT NOT NULL DEFAULT '',
    "totalHarga" DECIMAL NOT NULL DEFAULT 0,
    "totalSharing" DECIMAL NOT NULL DEFAULT 0,
    "registeredAt" DATETIME NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PasienDuplikat" ("alamat", "archivedAt", "asalModul", "hasilStatus", "id", "kesan", "klinis", "nama", "noTelepon", "paymentStatus", "pemeriksaanNama", "pengirimNama", "radiologNama", "regCode", "registeredAt", "sourcePasienId", "tanggalLahir", "totalHarga", "updatedAt") SELECT "alamat", "archivedAt", "asalModul", "hasilStatus", "id", "kesan", "klinis", "nama", "noTelepon", "paymentStatus", "pemeriksaanNama", "pengirimNama", "radiologNama", "regCode", "registeredAt", "sourcePasienId", "tanggalLahir", "totalHarga", "updatedAt" FROM "PasienDuplikat";
DROP TABLE "PasienDuplikat";
ALTER TABLE "new_PasienDuplikat" RENAME TO "PasienDuplikat";
CREATE UNIQUE INDEX "PasienDuplikat_sourcePasienId_key" ON "PasienDuplikat"("sourcePasienId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
