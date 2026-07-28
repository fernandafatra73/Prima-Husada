import { pdf } from '@react-pdf/renderer';
import { apiGet } from '../lib/api.ts';
import { formatUmurTahun } from '../lib/format.ts';
import { parseLabKesan } from '../pages/LaboratoriumPage.tsx';
import { groupLabRowsForPdf } from '../lib/labKesan.ts';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import { LabReportDocument, type LabReportData, type LabTestRow } from './LabReportDocument.tsx';

interface PasienDetailApi {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur: number;
  readonly jenisKelamin: 'L' | 'P';
  readonly alamat: string | null;
  readonly createdAt: string;
  readonly klinis: string | null;
  readonly kesan: string | null;
  readonly pengirim: { readonly nama: string };
  readonly pemeriksaan: readonly { readonly nama: string }[];
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchPasienDetail(pasienId: string): Promise<PasienDetailApi> {
  const res = await apiGet<{ item: PasienDetailApi }>(`/api/pasien/${pasienId}`);
  return res.item;
}

export async function generateLabReportBlob(pasienId: string): Promise<Blob> {
  const [logoSrc, pasien] = await Promise.all([
    loadLogoDataUrl().catch(() => ''),
    fetchPasienDetail(pasienId),
  ]);

  const parsed = parseLabKesan(pasien.kesan);

  let rows: LabTestRow[] | undefined;
  if (parsed.rows && parsed.rows.length > 0) {
    rows = groupLabRowsForPdf(parsed.rows, pasien.jenisKelamin);
  }

  const data: LabReportData = {
    logoSrc,
    regCode: pasien.regCode,
    dokterNama: pasien.pengirim?.nama || '—',
    tanggalPemeriksaan: formatDateDisplay(pasien.createdAt),
    namaPasien: pasien.nama,
    umurLabel: `${formatUmurTahun(pasien.umur)} (${pasien.jenisKelamin})`,
    alamat: pasien.alamat || '—',
    labResultsText: undefined,
    rows,
    petugasLabNama: parsed.analisNama || undefined,
  };

  return pdf(<LabReportDocument data={data} />).toBlob();
}

export async function printLabReport(pasienId: string): Promise<void> {
  const [pasien, blob] = await Promise.all([
    fetchPasienDetail(pasienId),
    generateLabReportBlob(pasienId),
  ]);
  const cleanName = (pasien.nama || 'Pasien').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Hasil_Lab_${cleanName}.pdf`;
  downloadBlob(blob, filename);
}
