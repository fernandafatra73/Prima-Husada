-- CreateTable
CREATE TABLE "LaporanNeraca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "namaPerusahaan" TEXT NOT NULL DEFAULT 'CV. PRIMA MANDIRI NUSANTARA',
    "kas" DECIMAL NOT NULL DEFAULT 0,
    "bank" DECIMAL NOT NULL DEFAULT 0,
    "piutang" DECIMAL NOT NULL DEFAULT 0,
    "persediaan" DECIMAL NOT NULL DEFAULT 0,
    "tanah" DECIMAL NOT NULL DEFAULT 0,
    "gedung" DECIMAL NOT NULL DEFAULT 0,
    "peralatan" DECIMAL NOT NULL DEFAULT 0,
    "kendaraan" DECIMAL NOT NULL DEFAULT 0,
    "utangUsaha" DECIMAL NOT NULL DEFAULT 0,
    "utangPajak" DECIMAL NOT NULL DEFAULT 0,
    "utangLainnya" DECIMAL NOT NULL DEFAULT 0,
    "utangJangkaPanjang" DECIMAL NOT NULL DEFAULT 0,
    "modalUsaha" DECIMAL NOT NULL DEFAULT 0,
    "pendapatan" DECIMAL NOT NULL DEFAULT 0,
    "biayaGaji" DECIMAL NOT NULL DEFAULT 0,
    "biayaAtkBahan" DECIMAL NOT NULL DEFAULT 0,
    "biayaListrik" DECIMAL NOT NULL DEFAULT 0,
    "biayaTelpon" DECIMAL NOT NULL DEFAULT 0,
    "biayaTransport" DECIMAL NOT NULL DEFAULT 0,
    "biayaSewa" DECIMAL NOT NULL DEFAULT 0,
    "biayaLainLain" DECIMAL NOT NULL DEFAULT 0,
    "tempatTandaTangan" TEXT NOT NULL DEFAULT 'Sukabumi',
    "tanggalTandaTangan" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "namaPenandatangan" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LaporanNeraca_year_key" ON "LaporanNeraca"("year");
