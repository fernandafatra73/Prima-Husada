import type { PrismaClient } from '../generated/prisma/client.js';

export async function nextRegCode(prisma: PrismaClient): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = `REG-${y}${m}${d}`;

  const count = await prisma.pasien.count({
    where: { regCode: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export async function nextPendaftaranUmumCode(prisma: PrismaClient): Promise<string> {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2); // e.g. 26
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = `PH${y}${m}${d}`; // PH260727

  const count = await prisma.pendaftaranUmum.count({
    where: { noRegistrasi: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}
