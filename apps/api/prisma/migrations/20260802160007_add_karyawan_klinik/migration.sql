-- CreateTable
CREATE TABLE "KaryawanKlinik" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "spesialisasi" TEXT,
    "noTelepon" TEXT,
    "namaBank" TEXT,
    "noRekening" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
