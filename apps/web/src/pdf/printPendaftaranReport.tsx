import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  PendaftaranReportDocument,
  type PendaftaranReportData,
} from './PendaftaranReportDocument.tsx';

export type PrintPendaftaranReportInput = Omit<PendaftaranReportData, 'logoSrc'>;

async function buildReportBlob(
  input: PrintPendaftaranReportInput,
  logoSrc: string,
): Promise<Blob> {
  return pdf(
    <PendaftaranReportDocument
      data={{
        ...input,
        logoSrc,
      }}
    />,
  ).toBlob();
}

export async function generatePendaftaranReportBlob(
  input: PrintPendaftaranReportInput,
): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return buildReportBlob(input, logoSrc);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function printPendaftaranReport(input: PrintPendaftaranReportInput): Promise<void> {
  const blob = await generatePendaftaranReportBlob(input);
  const cleanName = input.namaPasien.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'pendaftaran';
  downloadBlob(blob, `${cleanName}.pdf`);
}
