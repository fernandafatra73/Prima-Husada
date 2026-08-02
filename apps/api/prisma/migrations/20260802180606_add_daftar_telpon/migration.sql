-- CreateTable
CREATE TABLE "DaftarTelpon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "telpon" TEXT,
    "admin" TEXT,
    "password" TEXT,
    "noKontrak" TEXT,
    "namaInstansi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
