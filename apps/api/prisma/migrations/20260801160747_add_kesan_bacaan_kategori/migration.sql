-- CreateTable
CREATE TABLE "KesanBacaanGrup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KesanBacaanKategori" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grupId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KesanBacaanKategori_grupId_fkey" FOREIGN KEY ("grupId") REFERENCES "KesanBacaanGrup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KesanBacaan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategoriId" TEXT NOT NULL,
    "teks" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KesanBacaan_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KesanBacaanKategori" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "KesanBacaanKategori_grupId_idx" ON "KesanBacaanKategori"("grupId");

-- CreateIndex
CREATE INDEX "KesanBacaan_kategoriId_idx" ON "KesanBacaan"("kategoriId");
