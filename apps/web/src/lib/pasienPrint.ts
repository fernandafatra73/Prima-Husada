import { apiGet } from './api.ts';
import { formatDateShort, formatUmurDetail } from './format.ts';
import { formatKlinisDisplay, parseKlinisData } from './penunjang.ts';
import { printRadiologyReport } from '../pdf/printRadiologyReport.tsx';

interface PasienPrintSource {
  readonly regCode: string;
  readonly nama: string;
  readonly tanggalLahir: string;
  readonly createdAt: string;
  readonly alamat: string | null;
  readonly klinis: string | null;
  readonly kesan: string | null;
  readonly pengirim: { readonly nama: string };
  readonly radiolog: { readonly nama: string } | null;
  readonly pemeriksaan: readonly { readonly nama: string }[];
}

function formatRadiologName(nama: string | undefined): string {
  if (!nama) {
    return '—';
  }
  const trimmed = nama.trim();
  if (trimmed.toLowerCase().startsWith('dr.')) {
    return trimmed.includes('Sp.') ? trimmed : `${trimmed}, Sp.Rad`;
  }
  return `Dr. ${trimmed}, Sp.Rad`;
}

export async function printPasienReport(pasienId: string): Promise<void> {
  const res = await apiGet<{ item: PasienPrintSource }>(`/api/pasien/${pasienId}`);
  const p = res.item;
  const parsedKlinis = parseKlinisData(p.klinis);

  const allPemeriksaan =
    [
      ...p.pemeriksaan.map((x) => x.nama),
      ...parsedKlinis.radTambahan.map((r) => `+Rad: ${r}`),
      ...parsedKlinis.labTambahan.map((l) => `+Lab: ${l}`),
    ].join(', ') || '—';

  await printRadiologyReport({
    regCode: p.regCode,
    nama: p.nama,
    umurLabel: formatUmurDetail(p.tanggalLahir, p.createdAt),
    tanggal: formatDateShort(p.createdAt),
    alamat: p.alamat?.trim() || '—',
    pemeriksaan: allPemeriksaan,
    dokterPengirim: p.pengirim.nama,
    klinis: formatKlinisDisplay(p.klinis) || '—',
    kesan: p.kesan?.trim() || '—',
    radiologNama: formatRadiologName(p.radiolog?.nama),
  });
}
