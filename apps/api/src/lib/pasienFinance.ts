import { Decimal } from '../generated/prisma/internal/prismaNamespace.js';
import type { SharingType } from '../generated/prisma/client.js';

export function calcTotalSharing(
  totalHarga: Decimal,
  sharingType: SharingType,
  sharingPercent: Decimal,
  sharingAmount: Decimal | null,
): Decimal {
  if (sharingType === 'FIXED' && sharingAmount !== null) {
    return sharingAmount;
  }
  return totalHarga.mul(sharingPercent).div(100);
}

export function sumHarga(items: readonly { hargaSnapshot: Decimal }[]): Decimal {
  return items.reduce((acc, item) => acc.add(item.hargaSnapshot), new Decimal(0));
}
