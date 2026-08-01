import { prisma } from '../src/lib/prisma.js';

const NAMA_LIST = [
  'BNO',
  'Cranium Ap/Lat',
  'Shoulder Joint Kanan',
  'Ossa manus kanan',
  'Wrist Joint Kanan',
  'Anthebrachi kanan',
  'Art Cubiti kanan',
  'Shoulder Joint Kanan',
  'Femur kanan',
  'Genu Kanan',
  'Cruris Kanan',
  'Ankle Joint Kanan',
  'Pedis Kanan',
  'Cruris Kanan',
];

async function main() {
  const existing = await prisma.jenisPemeriksaan.findMany({ select: { nama: true } });
  const existingLower = new Set(existing.map((e) => e.nama.toLowerCase()));

  const seenLower = new Set<string>();
  const toCreate: string[] = [];
  const skipped: string[] = [];

  for (const nama of NAMA_LIST) {
    const lower = nama.toLowerCase();
    if (existingLower.has(lower) || seenLower.has(lower)) {
      skipped.push(nama);
      continue;
    }
    seenLower.add(lower);
    toCreate.push(nama);
  }

  for (const nama of toCreate) {
    await prisma.jenisPemeriksaan.create({ data: { nama } });
  }

  console.log(`Created ${toCreate.length}: ${toCreate.join(', ') || '(none)'}`);
  console.log(`Skipped (already exist / duplicate) ${skipped.length}: ${skipped.join(', ') || '(none)'}`);
}

main().finally(() => prisma.$disconnect());
