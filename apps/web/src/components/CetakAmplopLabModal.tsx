import { Modal } from './ui/Modal.tsx';
import { computeUmurYears, formatDateShort } from '../lib/format.ts';
import './ui/ui.css';

export interface CetakAmplopLabPasien {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur?: number;
  readonly tanggalLahir: string;
  readonly createdAt: string;
  readonly pengirim: {
    readonly nama: string;
  };
  readonly pemeriksaan: readonly {
    readonly nama: string;
  }[];
}

interface CetakAmplopLabModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly pasien: CetakAmplopLabPasien | null;
}

export function CetakAmplopLabModal({ open, onClose, pasien }: CetakAmplopLabModalProps) {
  if (!pasien) {
    return null;
  }

  const umur = pasien.umur ?? computeUmurYears(pasien.tanggalLahir, pasien.createdAt) ?? 0;
  const tanggal = formatDateShort(pasien.createdAt);
  const jenisNames = pasien.pemeriksaan.map((p) => p.nama).join(', ') || 'Pemeriksaan Laboratorium';

  function handlePrintNow() {
    if (!pasien) return;
    const win = window.open('', '_blank', 'width=850,height=700');
    if (!win) {
      alert('Jendela cetak diblokir oleh browser. Harap izinkan pop-up untuk situs ini.');
      return;
    }

    const amplopHtml = `
      <div class="amplop-sheet">
        <div class="amplop-header">
          <div class="amplop-title">KLINIK PRIMA HUSADA</div>
          <div class="amplop-subtitle">HASIL PEMERIKSAAN LABORATORIUM</div>
        </div>
        <div class="amplop-body">
          <table class="amplop-table">
            <tr>
              <th>No. Registrasi</th>
              <td><strong>${pasien.regCode}</strong></td>
            </tr>
            <tr>
              <th>Nama Pasien</th>
              <td><strong>${pasien.nama}</strong> (${umur} tahun)</td>
            </tr>
            <tr>
              <th>Tanggal</th>
              <td>${tanggal}</td>
            </tr>
            <tr>
              <th>Jenis Pemeriksaan</th>
              <td><strong>${jenisNames}</strong></td>
            </tr>
            <tr>
              <th>Kepada Yth. TS</th>
              <td>${pasien.pengirim.nama}</td>
            </tr>
          </table>
        </div>
        <div class="amplop-footer">
          * Harap membawa amplop ini saat pengambilan hasil pemeriksaan laboratorium.
        </div>
      </div>
    `;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Klinik Prima Husada — Amplop Laboratorium</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 20px;
            }
            .amplop-sheet {
              width: 12cm;
              height: 8cm;
              box-sizing: border-box;
              overflow: hidden;
              border: 2px solid #000;
              padding: 10px;
              border-radius: 6px;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
            }
            .amplop-header {
              text-align: center;
              border-bottom: 1.5px solid #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .amplop-title {
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 0.3px;
            }
            .amplop-subtitle {
              font-size: 11px;
              font-weight: 600;
              margin-top: 3px;
            }
            .amplop-body {
              flex: 1;
              min-height: 0;
            }
            .amplop-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            .amplop-table th {
              text-align: left;
              width: 100px;
              padding: 3px 6px 3px 0;
              font-size: 10.5px;
              color: #334155;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .amplop-table td {
              padding: 3px 0;
              font-size: 11.5px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .amplop-footer {
              margin-top: 6px;
              font-size: 8.5px;
              font-style: italic;
              color: #475569;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${amplopHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <Modal open={open} title={`Pratinjau Cetak Amplop — ${pasien.regCode}`} onClose={onClose} size="lg">
      <div>
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #1e293b',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                borderBottom: '2px solid #1e293b',
                paddingBottom: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>KLINIK PRIMA HUSADA</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0369a1', marginTop: '0.25rem' }}>
                HASIL PEMERIKSAAN LABORATORIUM
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', width: '180px', color: '#64748b' }}>
                    No. Registrasi
                  </th>
                  <td style={{ padding: '8px 4px', fontWeight: 700, fontSize: '1.05rem' }}>{pasien.regCode}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>Nama Pasien</th>
                  <td style={{ padding: '8px 4px' }}>
                    <strong>{pasien.nama}</strong> ({umur} tahun)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>Tanggal</th>
                  <td style={{ padding: '8px 4px' }}>{tanggal}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>Jenis Pemeriksaan</th>
                  <td style={{ padding: '8px 4px', fontWeight: 600, color: '#0f172a' }}>{jenisNames}</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>Kepada Yth. TS</th>
                  <td style={{ padding: '8px 4px' }}>{pasien.pengirim.nama}</td>
                </tr>
              </tbody>
            </table>
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed #cbd5e1',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#64748b',
                fontStyle: 'italic',
              }}
            >
              * Harap membawa amplop ini saat pengambilan hasil pemeriksaan laboratorium.
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            gap: '0.75rem',
          }}
        >
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="btn btn--primary" onClick={handlePrintNow} style={{ fontWeight: 600 }}>
            🖨️ Cetak Amplop Sekarang
          </button>
        </div>
      </div>
    </Modal>
  );
}
