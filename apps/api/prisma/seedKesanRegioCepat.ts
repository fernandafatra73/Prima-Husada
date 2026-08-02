import { prisma } from '../src/lib/prisma.js';

const GRUP_NAMA = 'Menu Kesan Cepat';

const REGIO_LIST = [
  'Thorax',
  'BNO',
  'Schedel',
  'LS',
  'Genu',
  'Cruris',
  'Ankle Joint',
  'Pedis',
  'Anthebrachi',
  'OAT 6 bulan',
];

const THORAX_BACAAN = [
  'Tb paru kanan dan kiri, Tidak tampak cardiomegali',
  'Tb paru aktif kanan dan kiri dd/BP\nTidak tampak cardiomegali',
  'Bronchopneumonia paru kanan dan kiri\nTidak tampak cardiomegali',
  'Bronchopneumonia paru kanan dan kiri dd/Tb\nTidak tampak cardiomegali',
  'Tb paru aktif kanan dan kiri dd/Pneumonia\nTidak tampak cardiomegali',
  'Bronchitis dd/TB\nTidak tampak cardiomegali',
  'Bronchitis\nTidak tampak cardiomegali',
  'Bronchitis dd/BP\nTidak tampak cardiomegali',
];

async function main() {
  const grup =
    (await prisma.kesanBacaanGrup.findFirst({ where: { nama: GRUP_NAMA } })) ??
    (await prisma.kesanBacaanGrup.create({ data: { nama: GRUP_NAMA } }));

  for (const nama of REGIO_LIST) {
    const kategori =
      (await prisma.kesanBacaanKategori.findFirst({ where: { grupId: grup.id, nama } })) ??
      (await prisma.kesanBacaanKategori.create({ data: { grupId: grup.id, nama } }));

    if (nama === 'Thorax') {
      for (const teks of THORAX_BACAAN) {
        const existing = await prisma.kesanBacaan.findFirst({ where: { kategoriId: kategori.id, teks } });
        if (!existing) {
          await prisma.kesanBacaan.create({ data: { kategoriId: kategori.id, teks } });
        }
      }
    }
  }

  console.log(`Seeded grup "${GRUP_NAMA}" dengan ${REGIO_LIST.length} kategori regio.`);
}

main().finally(() => prisma.$disconnect());
