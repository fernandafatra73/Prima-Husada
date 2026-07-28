import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  SharingReportDocument,
  type SharingReportData,
} from './SharingReportDocument.tsx';

export type PrintSharingReportInput = Omit<SharingReportData, 'logoSrc'>;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function generateSharingReportBlob(
  input: PrintSharingReportInput,
): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return pdf(<SharingReportDocument data={{ ...input, logoSrc }} />).toBlob();
}

export async function printSharingReport(
  input: PrintSharingReportInput,
): Promise<void> {
  const blob = await generateSharingReportBlob(input);
  const cleanDokter = input.dokterNama.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Dokter';
  const filename = `Laporan_Sharing_${cleanDokter}.pdf`;
  downloadBlob(blob, filename);
}
