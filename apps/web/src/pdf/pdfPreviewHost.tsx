import { useEffect, useState, type ReactNode } from 'react';
import { PdfPreviewModal } from '../components/ui/PdfPreviewModal.tsx';
import {
  registerPdfPreviewHandler,
  type RadiologyPdfPreview,
} from './printRadiologyReport.tsx';

export function PdfPreviewHost({ children }: { readonly children: ReactNode }) {
  const [preview, setPreview] = useState<RadiologyPdfPreview | null>(null);

  useEffect(() => {
    return registerPdfPreviewHandler((next) => {
      setPreview(next);
    });
  }, []);

  return (
    <>
      {children}
      <PdfPreviewModal
        open={preview !== null}
        withSignature={preview?.withSignature ?? null}
        withoutSignature={preview?.withoutSignature ?? null}
        filename={preview?.filename ?? 'hasil-radiologi.pdf'}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
