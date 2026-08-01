import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  AdvantageReportDocument,
  type AdvantageReportData,
} from './AdvantageReportDocument.tsx';

export type PrintAdvantageReportInput = Omit<AdvantageReportData, 'logoSrc'>;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function generateAdvantageReportBlob(
  input: PrintAdvantageReportInput,
): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return pdf(<AdvantageReportDocument data={{ ...input, logoSrc }} />).toBlob();
}

export async function printAdvantageReport(
  input: PrintAdvantageReportInput,
): Promise<void> {
  const blob = await generateAdvantageReportBlob(input);
  downloadBlob(blob, `Laporan_Advantage_Radiologi_${input.periodeLabel.replace(/[/\\?%*:|"<> ]/g, '_')}.pdf`);
}
