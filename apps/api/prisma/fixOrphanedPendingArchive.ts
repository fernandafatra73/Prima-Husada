import { prisma } from '../src/lib/prisma.js';

async function main() {
  const pending = await prisma.pasienDuplikat.findMany({
    where: { hasilStatus: 'MENUNGGU_HASIL' },
    select: { id: true, sourcePasienId: true, nama: true },
  });

  let fixed = 0;
  for (const row of pending) {
    const live = await prisma.pasien.findUnique({ where: { id: row.sourcePasienId } });
    if (!live) {
      await prisma.pasienDuplikat.update({
        where: { id: row.id },
        data: { hasilStatus: 'SELESAI' },
      });
      fixed += 1;
      console.log(`Fixed orphaned entry: ${row.nama} (${row.sourcePasienId})`);
    }
  }
  console.log(`Done. Fixed ${fixed} of ${pending.length} pending archive entries.`);
}

main().finally(() => prisma.$disconnect());
