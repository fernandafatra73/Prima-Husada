import { pdf } from '@react-pdf/renderer';
import { loadLogoDataUrl } from './loadLogoDataUrl.ts';
import { loadSignatureDataUrl } from './loadSignatureDataUrl.ts';
import {
  RadiologyReportDocument,
  type RadiologyReportData,
} from './RadiologyReportDocument.tsx';

export type PrintRadiologyReportInput = Omit<
  RadiologyReportData,
  'logoSrc' | 'signatureSrc' | 'includeSignature'
>;

export interface RadiologyPdfPreview {
  readonly withSignature: Blob;
  readonly withoutSignature: Blob;
  readonly filename: string;
}

let openPreview: ((preview: RadiologyPdfPreview) => void) | null = null;

export function registerPdfPreviewHandler(
  handler: (preview: RadiologyPdfPreview) => void,
): () => void {
  openPreview = handler;
  return () => {
    openPreview = null;
  };
}

async function buildReportBlob(
  input: PrintRadiologyReportInput,
  logoSrc: string,
  includeSignature: boolean,
  signatureSrc?: string,
): Promise<Blob> {
  return pdf(
    <RadiologyReportDocument
      data={{
        ...input,
        logoSrc,
        includeSignature,
        signatureSrc: includeSignature ? signatureSrc : undefined,
      }}
    />,
  ).toBlob();
}

export async function generateRadiologyReportVersions(
  input: PrintRadiologyReportInput,
): Promise<RadiologyPdfPreview> {
  const logoSrc = await loadLogoDataUrl();
  let signatureSrc: string | undefined;
  try {
    signatureSrc = await loadSignatureDataUrl();
  } catch {
    signatureSrc = undefined;
  }

  const [withSignature, withoutSignature] = await Promise.all([
    buildReportBlob(input, logoSrc, true, signatureSrc),
    buildReportBlob(input, logoSrc, false),
  ]);

  const cleanName = input.nama.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'pasien';

  return {
    withSignature,
    withoutSignature,
    filename: `${cleanName}.pdf`,
  };
}

/** @deprecated Prefer `generateRadiologyReportVersions` for preview flows. */
export async function generateRadiologyReportBlob(
  input: PrintRadiologyReportInput,
  includeSignature = true,
): Promise<Blob> {
  const versions = await generateRadiologyReportVersions(input);
  return includeSignature ? versions.withSignature : versions.withoutSignature;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function printRadiologyReport(input: PrintRadiologyReportInput): Promise<void> {
  const versions = await generateRadiologyReportVersions(input);

  if (openPreview) {
    openPreview(versions);
    return;
  }

  downloadBlob(versions.withSignature, versions.filename);
}
