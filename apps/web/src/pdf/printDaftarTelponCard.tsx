import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  DaftarTelponCardDocument,
  type DaftarTelponCardData,
} from './DaftarTelponCardDocument.tsx';

export type PrintDaftarTelponCardInput = Omit<DaftarTelponCardData, 'logoSrc'>;

export async function generateDaftarTelponCardBlob(
  input: PrintDaftarTelponCardInput,
): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return pdf(<DaftarTelponCardDocument data={{ ...input, logoSrc }} />).toBlob();
}
