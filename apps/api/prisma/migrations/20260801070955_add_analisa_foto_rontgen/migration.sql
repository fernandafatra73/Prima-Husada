-- CreateTable
CREATE TABLE "AnalisaFotoRontgen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPasien" TEXT NOT NULL,
    "regCode" TEXT,
    "jenisPemeriksaan" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fotoDataUrl" TEXT NOT NULL,
    "kesan" TEXT,
    "diagnosa" TEXT,
    "radiologNama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
