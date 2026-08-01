-- CreateTable
CREATE TABLE "LogbookPasien" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "usia" TEXT,
    "alamat" TEXT,
    "pemeriksaan" TEXT,
    "pengirim" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kv" DECIMAL NOT NULL,
    "sekon" DECIMAL NOT NULL,
    "mAs" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
