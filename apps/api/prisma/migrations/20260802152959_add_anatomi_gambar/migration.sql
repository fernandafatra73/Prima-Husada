-- CreateTable
CREATE TABLE "AnatomiGambar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regio" TEXT NOT NULL,
    "gambar" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AnatomiGambar_regio_idx" ON "AnatomiGambar"("regio");
