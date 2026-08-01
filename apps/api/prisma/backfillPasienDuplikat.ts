import { prisma } from '../src/lib/prisma.js';
import { syncPasienDuplikat } from '../src/lib/pasienDuplikat.js';

async function main() {
  const pasienList = await prisma.pasien.findMany({ select: { id: true } });
  for (const p of pasienList) {
    await syncPasienDuplikat(prisma, p.id);
  }
  console.log(`Backfilled ${pasienList.length} pasien into PasienDuplikat.`);
}

main().finally(() => prisma.$disconnect());
