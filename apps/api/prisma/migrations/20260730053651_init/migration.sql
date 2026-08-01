-- CreateTable
CREATE TABLE "Dokter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "spesialisasi" TEXT,
    "noTelepon" TEXT,
    "defaultSharingAmount" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Radiolog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "noTelepon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PetugasLab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "nip" TEXT,
    "noTelepon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JenisPemeriksaan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HargaLayanan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jenisPemeriksaanId" TEXT NOT NULL,
    "harga" DECIMAL NOT NULL,
    "detailLayanan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HargaLayanan_jenisPemeriksaanId_fkey" FOREIGN KEY ("jenisPemeriksaanId") REFERENCES "JenisPemeriksaan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KesanTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "gambar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'KARYAWAN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pasien" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regCode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "noTelepon" TEXT,
    "alamat" TEXT,
    "pengirimId" TEXT NOT NULL,
    "klinis" TEXT,
    "hasilStatus" TEXT NOT NULL DEFAULT 'MENUNGGU_HASIL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "sharingType" TEXT NOT NULL DEFAULT 'PERCENT',
    "sharingPercent" DECIMAL NOT NULL DEFAULT 0,
    "sharingAmount" DECIMAL,
    "totalHarga" DECIMAL NOT NULL DEFAULT 0,
    "totalSharing" DECIMAL NOT NULL DEFAULT 0,
    "sharingLocked" BOOLEAN NOT NULL DEFAULT false,
    "kesan" TEXT,
    "admin" TEXT,
    "radiologId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pasien_pengirimId_fkey" FOREIGN KEY ("pengirimId") REFERENCES "Dokter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pasien_radiologId_fkey" FOREIGN KEY ("radiologId") REFERENCES "Radiolog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasienPemeriksaan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pasienId" TEXT NOT NULL,
    "jenisPemeriksaanId" TEXT NOT NULL,
    "hargaSnapshot" DECIMAL NOT NULL,
    CONSTRAINT "PasienPemeriksaan_pasienId_fkey" FOREIGN KEY ("pasienId") REFERENCES "Pasien" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PasienPemeriksaan_jenisPemeriksaanId_fkey" FOREIGN KEY ("jenisPemeriksaanId") REFERENCES "JenisPemeriksaan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaketLab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "harga" DECIMAL NOT NULL DEFAULT 0,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaketLabItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paketId" TEXT NOT NULL,
    "grup" TEXT,
    "pemeriksaan" TEXT NOT NULL,
    "nilaiRujukan" TEXT NOT NULL DEFAULT '',
    "satuan" TEXT NOT NULL DEFAULT '',
    "harga" DECIMAL NOT NULL DEFAULT 0,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaketLabItem_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "PaketLab" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PendaftaranUmum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noRegistrasi" TEXT NOT NULL,
    "namaPasien" TEXT NOT NULL,
    "umur" TEXT,
    "alamat" TEXT,
    "telpon" TEXT,
    "tanggalMasuk" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dokterPengirim" TEXT,
    "klinis" TEXT,
    "admin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FarmasiBhp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'OBAT',
    "satuan" TEXT NOT NULL DEFAULT 'Pcs',
    "stok" INTEGER NOT NULL DEFAULT 0,
    "stokMin" INTEGER NOT NULL DEFAULT 10,
    "hargaBeli" DECIMAL NOT NULL DEFAULT 0,
    "hargaJual" DECIMAL NOT NULL DEFAULT 0,
    "keterangan" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AbsensiKaryawan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaKaryawan" TEXT NOT NULL,
    "role" TEXT DEFAULT 'KARYAWAN',
    "tanggal" TEXT NOT NULL,
    "jamMasuk" TEXT DEFAULT '08:00',
    "jamPulang" TEXT DEFAULT '16:00',
    "status" TEXT NOT NULL DEFAULT 'HADIR',
    "keterangan" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KeuanganTransaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'MASUK',
    "kategori" TEXT NOT NULL DEFAULT 'LAYANAN',
    "keterangan" TEXT NOT NULL,
    "nominal" DECIMAL NOT NULL DEFAULT 0,
    "referensi" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "JenisPemeriksaan_nama_key" ON "JenisPemeriksaan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "HargaLayanan_jenisPemeriksaanId_key" ON "HargaLayanan"("jenisPemeriksaanId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pasien_regCode_key" ON "Pasien"("regCode");

-- CreateIndex
CREATE UNIQUE INDEX "PasienPemeriksaan_pasienId_jenisPemeriksaanId_key" ON "PasienPemeriksaan"("pasienId", "jenisPemeriksaanId");

-- CreateIndex
CREATE UNIQUE INDEX "PaketLab_nama_key" ON "PaketLab"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "PendaftaranUmum_noRegistrasi_key" ON "PendaftaranUmum"("noRegistrasi");

-- CreateIndex
CREATE UNIQUE INDEX "FarmasiBhp_kode_key" ON "FarmasiBhp"("kode");
