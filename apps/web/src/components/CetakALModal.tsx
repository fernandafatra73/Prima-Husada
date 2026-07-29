import { useState } from 'react';
import { Modal } from './ui/Modal.tsx';
import { computeUmurYears, formatDateShort } from '../lib/format.ts';
import './ui/ui.css';

export interface CetakALPasien {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur?: number;
  readonly tanggalLahir: string;
  readonly createdAt: string;
  readonly pengirim: {
    readonly nama: string;
  };
  readonly radiolog: {
    readonly nama: string;
  } | null;
  readonly pemeriksaan: readonly {
    readonly nama: string;
  }[];
}

interface CetakALModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly pasien: CetakALPasien | null;
  readonly initialMode?: 'amplop' | 'label' | 'both';
}

export function CetakALModal({
  open,
  onClose,
  pasien,
  initialMode = 'both',
}: CetakALModalProps) {
  const [mode, setMode] = useState<'amplop' | 'label' | 'both'>(initialMode);
  const [copied, setCopied] = useState(false);

  if (!pasien) {
    return null;
  }

  const umur = pasien.umur ?? computeUmurYears(pasien.tanggalLahir, pasien.createdAt) ?? 0;
  const tanggal = formatDateShort(pasien.createdAt);
  const jenisNames =
    pasien.pemeriksaan.map((p) => p.nama).join(', ') || 'Pemeriksaan Radiologi';

  function handleCopyLabel() {
    if (!pasien) return;
    const text = `[PRIMA HUSADA RADIOLOGI]\nRM/FOTO: ${pasien.regCode}\nNama: ${pasien.nama} (${umur} thn)\nPemeriksaan: ${jenisNames}\nTgl: ${tanggal} | Dr: ${pasien.pengirim.nama}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
          <div class="amplop-subtitle">HASIL PEMERIKSAAN RADIOLOGI</div>
        </div>
        <div class="amplop-body">
          <table class="amplop-table">
            <tr>
              <th>No. Foto / RM</th>
              <td><strong>${pasien.regCode}</strong></td>
            </tr>
            <tr>
              <th>Nama Pasien</th>
              <td><strong>${pasien.nama}</strong> (${umur} tahun)</td>
            </tr>
            <tr>
              <th>Tanggal Foto</th>
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
          * Harap membawa amplop & hasil foto ini saat kontrol kembali ke dokter yang merawat.
        </div>
      </div>
    `;

    const labelHtml = `
      <div class="label-sheet">
        <div class="label-box">
          <div class="label-header">PRIMA HUSADA — RADIOLOGI</div>
          <div class="label-reg">${pasien.regCode}</div>
          <div class="label-name">${pasien.nama} <span>(${umur} thn)</span></div>
          <div class="label-exam">${jenisNames}</div>
          <div class="label-meta">Tgl: ${tanggal} | Dr: ${pasien.pengirim.nama}</div>
        </div>
      </div>
    `;

    const bodyHtml =
      mode === 'amplop'
        ? amplopHtml
        : mode === 'label'
          ? labelHtml
          : `${amplopHtml}<div style="page-break-after: always;"></div>${labelHtml}`;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak A+L - ${pasien.regCode} - ${pasien.nama}</title>
          <style>
            @page {
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 20px;
            }
            .amplop-sheet {
              border: 2px solid #000;
              padding: 25px;
              border-radius: 8px;
              max-width: 700px;
              margin: 0 auto 30px auto;
            }
            .amplop-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .amplop-title {
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .amplop-subtitle {
              font-size: 16px;
              font-weight: 600;
              margin-top: 5px;
            }
            .amplop-table {
              width: 100%;
              border-collapse: collapse;
            }
            .amplop-table th {
              text-align: left;
              width: 180px;
              padding: 8px 10px;
              font-size: 15px;
              color: #334155;
              border-bottom: 1px solid #e2e8f0;
            }
            .amplop-table td {
              padding: 8px 10px;
              font-size: 16px;
              border-bottom: 1px solid #e2e8f0;
            }
            .amplop-footer {
              margin-top: 25px;
              font-size: 13px;
              font-style: italic;
              color: #475569;
              text-align: center;
            }

            .label-sheet {
              max-width: 420px;
              margin: 0 auto;
            }
            .label-box {
              border: 2px solid #000;
              border-radius: 6px;
              padding: 12px 16px;
              background: #fff;
            }
            .label-header {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .label-reg {
              font-size: 24px;
              font-weight: 800;
              line-height: 1.1;
              color: #000;
            }
            .label-name {
              font-size: 16px;
              font-weight: 700;
              margin-top: 4px;
            }
            .label-name span {
              font-weight: 500;
              font-size: 14px;
            }
            .label-exam {
              font-size: 14px;
              font-weight: 600;
              margin-top: 6px;
              color: #1e293b;
            }
            .label-meta {
              font-size: 12px;
              color: #475569;
              margin-top: 8px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 6px;
            }
            @media print {
              body {
                padding: 0;
              }
              .amplop-sheet, .label-box {
                margin: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          ${bodyHtml}
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
    <Modal
      open={open}
      title={`Pratinjau Cetak A+L — ${pasien.regCode}`}
      onClose={onClose}
      size="lg"
    >
      <div>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <button
            type="button"
            className={`btn btn--sm ${mode === 'amplop' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMode('amplop')}
          >
            ✉️ Amplop (A)
          </button>
          <button
            type="button"
            className={`btn btn--sm ${mode === 'label' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMode('label')}
          >
            🏷️ Label Stiker (L)
          </button>
          <button
            type="button"
            className={`btn btn--sm ${mode === 'both' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMode('both')}
          >
            🖨️ Keduanya (A+L)
          </button>
        </div>

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
          {(mode === 'amplop' || mode === 'both') && (
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #1e293b',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: mode === 'both' ? '1.5rem' : 0,
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
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  KLINIK PRIMA HUSADA
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0369a1', marginTop: '0.25rem' }}>
                  HASIL PEMERIKSAAN RADIOLOGI
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', width: '180px', color: '#64748b' }}>
                      No. Foto / RM
                    </th>
                    <td style={{ padding: '8px 4px', fontWeight: 700, fontSize: '1.05rem' }}>
                      {pasien.regCode}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>
                      Nama Pasien
                    </th>
                    <td style={{ padding: '8px 4px' }}>
                      <strong>{pasien.nama}</strong> ({umur} tahun)
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>
                      Tanggal Foto
                    </th>
                    <td style={{ padding: '8px 4px' }}>{tanggal}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>
                      Jenis Pemeriksaan
                    </th>
                    <td style={{ padding: '8px 4px', fontWeight: 600, color: '#0f172a' }}>
                      {jenisNames}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: '#64748b' }}>
                      Kepada Yth. TS
                    </th>
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
                * Harap membawa amplop &amp; hasil foto ini saat kontrol kembali ke dokter yang merawat.
              </div>
            </div>
          )}

          {(mode === 'label' || mode === 'both') && (
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #1e293b',
                borderRadius: '8px',
                padding: '1.25rem',
                maxWidth: '420px',
                margin: '0 auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0369a1',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #1e293b',
                  paddingBottom: '0.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                PRIMA HUSADA — RADIOLOGI
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {pasien.regCode}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', color: '#1e293b' }}>
                {pasien.nama} <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>({umur} thn)</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.5rem', color: '#334155' }}>
                {jenisNames}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  marginTop: '0.6rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed #cbd5e1',
                }}
              >
                Tgl: {tanggal} | Dr: {pasien.pengirim.nama}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleCopyLabel}
            >
              {copied ? '✓ Tersalin' : '📋 Salin Teks Label'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Tutup
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handlePrintNow}
              style={{ fontWeight: 600 }}
            >
              🖨️ Cetak Sekarang ({mode.toUpperCase()})
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
