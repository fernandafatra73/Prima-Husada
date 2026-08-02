-- CreateTable
CREATE TABLE "TandaTanganElektronik" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "nama" TEXT NOT NULL DEFAULT '',
    "logoTandaTangan" TEXT,
    "alamat" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
