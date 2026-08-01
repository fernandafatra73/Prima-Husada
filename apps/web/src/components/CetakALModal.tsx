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
  const [labelPosition, setLabelPosition] = useState(1);
  const LABEL_POSITIONS = Array.from({ length: 12 }, (_, i) => i + 1);

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

    const labelCellHtml = `
        <div class="label-box">
          <div class="label-header">
            <div class="label-title">KLINIK PRIMA HUSADA</div>
            <div class="label-subtitle">Jl Siliwangi Ruko Palapa No 2 Parung Kuda</div>
          </div>
          <table class="label-table">
            <tr><th>No. Foto / RM</th><td>${pasien.regCode}</td></tr>
            <tr><th>Nama Pasien</th><td>${pasien.nama} (${umur} thn)</td></tr>
            <tr><th>Tanggal Foto</th><td>${tanggal}</td></tr>
            <tr><th>Jenis Pemeriksaan</th><td>${jenisNames}</td></tr>
            <tr><th>Dokter Pengirim</th><td>${pasien.pengirim.nama}</td></tr>
          </table>
        </div>
    `;

    const labelCellsHtml = LABEL_POSITIONS.map(
      (pos) => `<div class="label-cell">${pos === labelPosition ? labelCellHtml : ''}</div>`
    ).join('');

    const labelHtml = `
      <div class="label-sheet">
        ${labelCellsHtml}
      </div>
    `;

    const bodyHtml =
      mode === 'amplop'
        ? amplopHtml
        : mode === 'label'
          ? labelHtml
          : `${amplopHtml}<div style="page-break-after: always;"></div>${labelHtml}`;

    const pageCss =
      mode === 'label'
        ? '@page { size: 20.5cm 15cm landscape; margin: 0; }'
        : mode === 'amplop'
          ? '@page { margin: 0; }'
          : '@page { margin: 15mm; }';
    const bodyPadding = mode === 'label' ? '0' : '20px';

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Klinik Prima Husada</title>
          <style>
            ${pageCss}
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: ${bodyPadding};
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

            .label-sheet {
              width: 100%;
              max-width: 20.5cm;
              height: 15cm;
              margin: 0 auto;
              padding: 0;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(4, 1fr);
              column-gap: 0.25cm;
              row-gap: 0.3cm;
              box-sizing: border-box;
              transform: translate(-0.2cm, 0.1cm);
            }
            .label-cell {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .label-box {
              width: 6cm;
              height: 2.9cm;
              box-sizing: border-box;
              overflow: hidden;
              border: 2px solid #000;
              border-radius: 1.5mm;
              padding: 1.2mm 2mm;
              background: #fff;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .label-header {
              border-bottom: 0.75px solid #000;
              margin: 0 -2mm 0.6mm -2mm;
              padding: 0 2mm 0.5mm 2mm;
            }
            .label-title {
              font-size: 8px;
              font-weight: 700;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .label-subtitle {
              font-size: 6px;
              font-weight: 600;
              text-align: center;
              color: #0369a1;
              margin-top: 0.3mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .label-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 6.5px;
            }
            .label-table th {
              width: 38%;
              text-align: left;
              font-weight: 700;
              color: #334155;
              padding: 0.3mm 1mm 0.3mm 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .label-table td {
              width: 62%;
              font-weight: 600;
              color: #000;
              padding: 0.3mm 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print {
              .label-box {
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

        {(mode === 'label' || mode === 'both') && (
          <div
            style={{
              marginBottom: '1.25rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Pilih Posisi Label di Lembar Stiker (20,5×15 cm — 3 kolom × 4 baris, 12 posisi)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.4rem',
                maxWidth: '260px',
              }}
            >
              {LABEL_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setLabelPosition(pos)}
                  className={`btn btn--sm ${labelPosition === pos ? 'btn--primary' : 'btn--secondary'}`}
                  style={{ padding: '0.4rem 0', fontWeight: 700 }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}

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
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(4, 1fr)',
                  gap: '4px',
                  aspectRatio: '20.5 / 15',
                  background: '#ffffff',
                  border: '2px solid #1e293b',
                  borderRadius: '8px',
                  padding: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
              >
                {LABEL_POSITIONS.map((pos) => (
                  <div
                    key={pos}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: pos === labelPosition ? '1.5px solid #0369a1' : '1px dashed #cbd5e1',
                      borderRadius: '3px',
                      background: pos === labelPosition ? '#f0f9ff' : '#f8fafc',
                      overflow: 'hidden',
                      padding: '2px',
                    }}
                  >
                    {pos === labelPosition ? (
                      <div style={{ textAlign: 'center', lineHeight: 1.2, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.5rem',
                            fontWeight: 700,
                            color: '#0369a1',
                            textTransform: 'uppercase',
                          }}
                        >
                          Prima Husada
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>
                          {pasien.regCode}
                        </div>
                        <div
                          style={{
                            fontSize: '0.5rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {pasien.nama}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{pos}</span>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginTop: '0.5rem',
                }}
              >
                Posisi {labelPosition} akan berisi label pasien ini — posisi lain dikosongkan saat dicetak.
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
