import { prisma } from '../src/lib/prisma.js';

const GRUP_NAMA = 'Thorax';
const KATEGORI_NAMA = 'Tb Paru aktif';
const BACAAN_LIST = [
  'Tb',
  'Tb+ Bronchitis',
  'Tb + BP',
  'Tb+Pneumonia',
  'Tb+Effusi pleura Kanan',
  'Tb+Effusi pleura kiri',
  'KGB+Tb extraparu',
];

async function main() {
  const grup =
    (await prisma.kesanBacaanGrup.findFirst({ where: { nama: GRUP_NAMA } })) ??
    (await prisma.kesanBacaanGrup.create({ data: { nama: GRUP_NAMA } }));

  const kategori =
    (await prisma.kesanBacaanKategori.findFirst({ where: { grupId: grup.id, nama: KATEGORI_NAMA } })) ??
    (await prisma.kesanBacaanKategori.create({ data: { grupId: grup.id, nama: KATEGORI_NAMA } }));

  for (const teks of BACAAN_LIST) {
    const existing = await prisma.kesanBacaan.findFirst({ where: { kategoriId: kategori.id, teks } });
    if (!existing) {
      await prisma.kesanBacaan.create({ data: { kategoriId: kategori.id, teks } });
    }
  }

  console.log(`Seeded grup "${GRUP_NAMA}" > kategori "${KATEGORI_NAMA}" (${BACAAN_LIST.length} bacaan).`);
}

main().finally(() => prisma.$disconnect());
