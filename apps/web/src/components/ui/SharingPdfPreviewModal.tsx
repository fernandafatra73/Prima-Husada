import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal.tsx';

interface SharingPdfPreviewModalProps {
  readonly open: boolean;
  readonly blob: Blob | null;
  readonly filename: string;
  readonly onClose: () => void;
  readonly title?: string;
}

export function SharingPdfPreviewModal({
  open,
  blob,
  filename,
  onClose,
  title = 'Pratinjau Laporan Sharing Dokter',
}: SharingPdfPreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  function handleDownload() {
    if (!blob) return;
    const base = filename.replace(/\.pdf$/i, '');
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${base}.pdf`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <Modal open={open} title={title} onClose={onClose} size="xl">
      <div className="pdf-preview">
        <div className="pdf-preview__toolbar">
          <button type="button" className="btn btn--primary" onClick={handlePrint}>
            Cetak
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleDownload}>
            Unduh PDF
          </button>
        </div>
        {url ? (
          <iframe
            ref={iframeRef}
            title="Pratinjau PDF Sharing"
            className="pdf-preview__frame"
            src={url}
          />
        ) : (
          <p className="loading-text">Menyiapkan PDF…</p>
        )}
      </div>
    </Modal>
  );
}
