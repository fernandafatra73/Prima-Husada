-- CreateTable
CREATE TABLE "PasienDuplikat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePasienId" TEXT NOT NULL,
    "regCode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "noTelepon" TEXT,
    "alamat" TEXT,
    "pengirimNama" TEXT NOT NULL,
    "klinis" TEXT,
    "kesan" TEXT,
    "hasilStatus" TEXT NOT NULL DEFAULT 'MENUNGGU_HASIL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "pemeriksaanNama" TEXT NOT NULL DEFAULT '',
    "registeredAt" DATETIME NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PasienDuplikat_sourcePasienId_key" ON "PasienDuplikat"("sourcePasienId");
