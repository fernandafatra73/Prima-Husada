import { prisma } from '../src/lib/prisma.js';

const NAMA_LIST = [
  'BNO',
  'Schedel Ap/lat',
  'Shoulder Joint R',
  'Shoulder Joint L',
  'Ossa manus kanan',
  'Anthebrachi',
  'Art Cubiti Kanan',
  'Humerus Kanan',
  'Femur Kanan',
  'Cruris kanan',
  'Pedis Kanan',
  'Ankle Kanan',
  'Genu Kanan',
  'Cervikal Kanan',
  'Lumbosacral kanan',
];

async function main() {
  for (const nama of NAMA_LIST) {
    await prisma.jenisPemeriksaan.upsert({
      where: { nama },
      create: { nama },
      update: {},
    });
  }
  console.log(`Seeded ${NAMA_LIST.length} jenis pemeriksaan radiologi.`);
}

main().finally(() => prisma.$disconnect());
