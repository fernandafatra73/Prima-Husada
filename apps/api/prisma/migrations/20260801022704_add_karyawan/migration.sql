-- CreateTable
CREATE TABLE "Karyawan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT,
    "noTelepon" TEXT,
    "alamat" TEXT,
    "departemen" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
