-- CreateTable
CREATE TABLE "KopSurat" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "namaKlinik" TEXT NOT NULL DEFAULT 'KLINIK PRIMA HUSADA',
    "alamat" TEXT NOT NULL DEFAULT 'Jl. Siliwangi Ruko Palapa No 2 Parung Kuda',
    "telepon" TEXT NOT NULL DEFAULT '0857-1932-5557',
    "logoDataUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);
