import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  TransferReportDocument,
  type TransferReportData,
} from './TransferReportDocument.tsx';

export type PrintTransferReportInput = Omit<TransferReportData, 'logoSrc'>;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function generateTransferReportBlob(input: PrintTransferReportInput): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return pdf(<TransferReportDocument data={{ ...input, logoSrc }} />).toBlob();
}

export async function printTransferReport(input: PrintTransferReportInput): Promise<void> {
  const blob = await generateTransferReportBlob(input);
  downloadBlob(blob, 'Laporan_Transfer.pdf');
}
