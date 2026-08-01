import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  SharingArsipReportDocument,
  type SharingArsipReportData,
} from './SharingArsipReportDocument.tsx';

export type PrintSharingArsipReportInput = Omit<SharingArsipReportData, 'logoSrc'>;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function generateSharingArsipReportBlob(
  input: PrintSharingArsipReportInput,
): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return pdf(<SharingArsipReportDocument data={{ ...input, logoSrc }} />).toBlob();
}

export async function printSharingArsipReport(
  input: PrintSharingArsipReportInput,
): Promise<void> {
  const blob = await generateSharingArsipReportBlob(input);
  const cleanDokter = input.dokterNama.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Dokter';
  const filename = `Laporan_Sharing_${input.moduleLabel}_${cleanDokter}.pdf`;
  downloadBlob(blob, filename);
}
