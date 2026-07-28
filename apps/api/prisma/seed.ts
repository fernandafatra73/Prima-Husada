import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient, StaffRole } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/lib/password.js';

const url = process.env.DATABASE_URL ?? 'file:dev.db';
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.pasienPemeriksaan.deleteMany();
  await prisma.pasien.deleteMany();
  await prisma.hargaLayanan.deleteMany();
  await prisma.jenisPemeriksaan.deleteMany();
  await prisma.kesanTemplate.deleteMany();
  await prisma.dokter.deleteMany();
  await prisma.radiolog.deleteMany();
  await prisma.staff.deleteMany();

  const adminPasswordHash = await hashPassword('admin123');
  const karyawanPasswordHash = await hashPassword('karyawan123');

  await prisma.staff.createMany({
    data: [
      {
        nama: 'Admin LabPrima',
        email: 'admin@labprima.local',
        passwordHash: adminPasswordHash,
        role: StaffRole.ADMIN,
      },
      {
        nama: 'Karyawan Demo',
        email: 'karyawan@labprima.local',
        passwordHash: karyawanPasswordHash,
        role: StaffRole.KARYAWAN,
      },
    ],
  });

  const dokter = await prisma.dokter.create({
    data: {
      nama: 'dr. Andi Wijaya',
      spesialisasi: 'Dokter Umum',
      noTelepon: '081234567890',
      defaultSharingAmount: 50000,
    },
  });

  const radiolog = await prisma.radiolog.create({
    data: { nama: 'dr. Siti Radiologi', noTelepon: '081298765432' },
  });

  const thorax = await prisma.jenisPemeriksaan.create({ data: { nama: 'Rontgen Thorax' } });
  const ctScan = await prisma.jenisPemeriksaan.create({ data: { nama: 'CT Scan Abdomen' } });

  await prisma.hargaLayanan.createMany({
    data: [
      {
        jenisPemeriksaanId: thorax.id,
        harga: 150000,
        detailLayanan: 'Foto thorax PA + interpretasi',
      },
      {
        jenisPemeriksaanId: ctScan.id,
        harga: 2500000,
        detailLayanan: 'CT scan abdomen dengan kontras',
      },
    ],
  });

  await prisma.kesanTemplate.createMany({
    data: [
      {
        judul: 'Thorax',
        isi: 'Tb paru aktif kanan dan kiri\nTidak tampak cardiomegali',
      },
      {
        judul: 'Thorax Normal',
        isi: 'Cor dan pulmo dalam batas normal.\nTidak tampak infiltrat.',
      },
    ],
  });

  const today = new Date();
  const regDate = today.toISOString().slice(0, 10).replace(/-/g, '');

  await prisma.pasien.create({
    data: {
      regCode: `REG-${regDate}-001`,
      nama: 'Budi Santoso',
      tanggalLahir: new Date('1990-05-15'),
      noTelepon: '081211223344',
      alamat: 'Jl. Melati No. 12, Jakarta',
      pengirimId: dokter.id,
      klinis: 'Batuk berdahak 2 minggu',
      hasilStatus: 'MENUNGGU_HASIL',
      paymentStatus: 'BELUM_LUNAS',
      sharingType: 'FIXED',
      sharingPercent: 0,
      sharingAmount: 50000,
      totalHarga: 150000,
      totalSharing: 50000,
      radiologId: radiolog.id,
      pemeriksaan: {
        create: [{ jenisPemeriksaanId: thorax.id, hargaSnapshot: 150000 }],
      },
    },
  });

  console.log('Seed selesai.');
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
