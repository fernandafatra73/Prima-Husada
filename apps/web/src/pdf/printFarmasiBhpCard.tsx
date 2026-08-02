import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import {
  FarmasiBhpCardDocument,
  type FarmasiBhpCardData,
} from './FarmasiBhpCardDocument.tsx';

export type PrintFarmasiBhpCardInput = Omit<FarmasiBhpCardData, 'logoSrc'>;

export async function generateFarmasiBhpCardBlob(
  input: PrintFarmasiBhpCardInput,
): Promise<Blob> {
  const logoSrc = await loadLogoDataUrl();
  return pdf(<FarmasiBhpCardDocument data={{ ...input, logoSrc }} />).toBlob();
}
