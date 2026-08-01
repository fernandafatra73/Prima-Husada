-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pasien" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regCode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "noTelepon" TEXT,
    "alamat" TEXT,
    "pengirimId" TEXT NOT NULL,
    "asalModul" TEXT NOT NULL DEFAULT 'RADIOLOGI',
    "klinis" TEXT,
    "hasilStatus" TEXT NOT NULL DEFAULT 'MENUNGGU_HASIL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "sharingType" TEXT NOT NULL DEFAULT 'PERCENT',
    "sharingPercent" DECIMAL NOT NULL DEFAULT 0,
    "sharingAmount" DECIMAL,
    "totalHarga" DECIMAL NOT NULL DEFAULT 0,
    "totalSharing" DECIMAL NOT NULL DEFAULT 0,
    "sharingLocked" BOOLEAN NOT NULL DEFAULT false,
    "kesan" TEXT,
    "admin" TEXT,
    "radiologId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pasien_pengirimId_fkey" FOREIGN KEY ("pengirimId") REFERENCES "Dokter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pasien_radiologId_fkey" FOREIGN KEY ("radiologId") REFERENCES "Radiolog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pasien" ("admin", "alamat", "createdAt", "hasilStatus", "id", "kesan", "klinis", "nama", "noTelepon", "paymentStatus", "pengirimId", "radiologId", "regCode", "sharingAmount", "sharingLocked", "sharingPercent", "sharingType", "tanggalLahir", "totalHarga", "totalSharing", "updatedAt") SELECT "admin", "alamat", "createdAt", "hasilStatus", "id", "kesan", "klinis", "nama", "noTelepon", "paymentStatus", "pengirimId", "radiologId", "regCode", "sharingAmount", "sharingLocked", "sharingPercent", "sharingType", "tanggalLahir", "totalHarga", "totalSharing", "updatedAt" FROM "Pasien";
DROP TABLE "Pasien";
ALTER TABLE "new_Pasien" RENAME TO "Pasien";
CREATE UNIQUE INDEX "Pasien_regCode_key" ON "Pasien"("regCode");
CREATE TABLE "new_PasienDuplikat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePasienId" TEXT NOT NULL,
    "regCode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "noTelepon" TEXT,
    "alamat" TEXT,
    "pengirimNama" TEXT NOT NULL,
    "asalModul" TEXT NOT NULL DEFAULT 'RADIOLOGI',
    "klinis" TEXT,
    "kesan" TEXT,
    "hasilStatus" TEXT NOT NULL DEFAULT 'MENUNGGU_HASIL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "pemeriksaanNama" TEXT NOT NULL DEFAULT '',
    "registeredAt" DATETIME NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PasienDuplikat" ("alamat", "archivedAt", "hasilStatus", "id", "kesan", "klinis", "nama", "noTelepon", "paymentStatus", "pemeriksaanNama", "pengirimNama", "regCode", "registeredAt", "sourcePasienId", "tanggalLahir", "updatedAt") SELECT "alamat", "archivedAt", "hasilStatus", "id", "kesan", "klinis", "nama", "noTelepon", "paymentStatus", "pemeriksaanNama", "pengirimNama", "regCode", "registeredAt", "sourcePasienId", "tanggalLahir", "updatedAt" FROM "PasienDuplikat";
DROP TABLE "PasienDuplikat";
ALTER TABLE "new_PasienDuplikat" RENAME TO "PasienDuplikat";
CREATE UNIQUE INDEX "PasienDuplikat_sourcePasienId_key" ON "PasienDuplikat"("sourcePasienId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
