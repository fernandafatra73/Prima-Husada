import { Decimal } from '../generated/prisma/internal/prismaNamespace.js';

export function serializeDecimal(value: Decimal | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toString();
}

export function toNumber(value: Decimal): number {
  return Number(value.toString());
}

export function computeUmur(tanggalLahir: Date): number {
  const today = new Date();
  let age = today.getFullYear() - tanggalLahir.getFullYear();
  const monthDiff = today.getMonth() - tanggalLahir.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < tanggalLahir.getDate())) {
    age -= 1;
  }
  return age;
}
