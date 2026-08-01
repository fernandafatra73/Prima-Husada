-- CreateTable
CREATE TABLE "HitunganLed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPasien" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "jamPertama" DECIMAL NOT NULL,
    "jamKedua" DECIMAL NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
