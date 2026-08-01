-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaBank" TEXT NOT NULL,
    "noRekening" TEXT NOT NULL,
    "jumlah" DECIMAL NOT NULL,
    "namaTransferan" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
