import { prisma } from '../src/lib/prisma.js';

const GRUP_NAMA = 'Menu Kesan Cepat';

async function main() {
  const grup = await prisma.kesanBacaanGrup.findFirst({
    where: { nama: GRUP_NAMA },
    include: { kategori: { orderBy: { createdAt: 'asc' } } },
  });
  if (!grup) throw new Error(`Grup "${GRUP_NAMA}" tidak ditemukan`);

  for (let i = 0; i < grup.kategori.length; i++) {
    await prisma.kesanBacaanKategori.update({
      where: { id: grup.kategori[i]!.id },
      data: { urutan: i * 10 },
    });
  }
  console.log(`Renumbered ${grup.kategori.length} kategori dengan step 10.`);

  const byNama = (nama: string) => grup.kategori.find((k) => k.nama === nama);
  const thorax = byNama('Thorax');
  const anthebrachi = byNama('Anthebrachi');
  if (!thorax || !anthebrachi) throw new Error('Kategori acuan tidak ditemukan');

  const existingCardio = await prisma.kesanBacaanKategori.findFirst({
    where: { grupId: grup.id, nama: 'Cardiomegali' },
  });
  if (!existingCardio) {
    await prisma.kesanBacaanKategori.create({
      data: { grupId: grup.id, nama: 'Cardiomegali', urutan: 5 },
    });
    console.log('Ditambahkan: Cardiomegali (sebelah Thorax)');
  }

  const existingOssa = await prisma.kesanBacaanKategori.findFirst({
    where: { grupId: grup.id, nama: 'Ossa manus' },
  });
  if (!existingOssa) {
    await prisma.kesanBacaanKategori.create({
      data: { grupId: grup.id, nama: 'Ossa manus', urutan: 83 },
    });
    console.log('Ditambahkan: Ossa manus (sebelah Anthebrachi)');
  }

  const existingOat = await prisma.kesanBacaanKategori.findFirst({
    where: { grupId: grup.id, nama: 'OAT 6 bln Sembuh' },
  });
  if (!existingOat) {
    await prisma.kesanBacaanKategori.create({
      data: { grupId: grup.id, nama: 'OAT 6 bln Sembuh', urutan: 86 },
    });
    console.log('Ditambahkan: OAT 6 bln Sembuh (sebelah Anthebrachi)');
  }
}

main().finally(() => prisma.$disconnect());
