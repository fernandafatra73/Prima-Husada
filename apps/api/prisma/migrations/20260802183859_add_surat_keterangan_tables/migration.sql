-- CreateTable
CREATE TABLE "SuratKeteranganSehat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorSurat" TEXT,
    "namaPasien" TEXT NOT NULL,
    "tempatTanggalLahir" TEXT,
    "jenisKelamin" TEXT NOT NULL DEFAULT 'Laki-laki',
    "pekerjaan" TEXT,
    "alamatPasien" TEXT,
    "hasilPemeriksaan" TEXT,
    "keperluan" TEXT,
    "tempatSurat" TEXT,
    "tanggalSurat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "namaDokter" TEXT,
    "jabatanDokter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SuratKeteranganRujukan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorSurat" TEXT,
    "namaPasien" TEXT NOT NULL,
    "tempatTanggalLahir" TEXT,
    "jenisKelamin" TEXT NOT NULL DEFAULT 'Laki-laki',
    "alamatPasien" TEXT,
    "dirujukKe" TEXT,
    "diagnosaKeluhan" TEXT,
    "alasanRujukan" TEXT,
    "tempatSurat" TEXT,
    "tanggalSurat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "namaDokter" TEXT,
    "jabatanDokter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
