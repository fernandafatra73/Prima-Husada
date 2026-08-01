import { useState } from 'react';
import { Modal } from './ui/Modal.tsx';
import { computeUmurYears, formatDateShort } from '../lib/format.ts';
import './ui/ui.css';

export interface CetakLabelLabPasien {
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

interface CetakLabelLabModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly pasien: CetakLabelLabPasien | null;
}

const LABEL_POSITIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function CetakLabelLabModal({ open, onClose, pasien }: CetakLabelLabModalProps) {
  const [copied, setCopied] = useState(false);
  const [labelPosition, setLabelPosition] = useState(1);

  if (!pasien) {
    return null;
  }

  const umur = pasien.umur ?? computeUmurYears(pasien.tanggalLahir, pasien.createdAt) ?? 0;
  const tanggal = formatDateShort(pasien.createdAt);
  const jenisNames = pasien.pemeriksaan.map((p) => p.nama).join(', ') || 'Pemeriksaan Laboratorium';

  function handleCopyLabel() {
    if (!pasien) return;
    const text = `[PRIMA HUSADA LABORATORIUM]\nNo. Registrasi: ${pasien.regCode}\nNama: ${pasien.nama} (${umur} thn)\nPemeriksaan: ${jenisNames}\nTgl: ${tanggal} | Dr: ${pasien.pengirim.nama}`;
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

    const labelCellHtml = `
        <div class="label-box">
          <div class="label-header">
            <div class="label-title">KLINIK PRIMA HUSADA</div>
            <div class="label-subtitle">Jl Siliwangi Ruko Palapa No 2 Parung Kuda</div>
          </div>
          <table class="label-table">
            <tr><th>No. Registrasi</th><td>${pasien.regCode}</td></tr>
            <tr><th>Nama Pasien</th><td>${pasien.nama} (${umur} thn)</td></tr>
            <tr><th>Tanggal</th><td>${tanggal}</td></tr>
            <tr><th>Pemeriksaan</th><td>${jenisNames}</td></tr>
            <tr><th>Dokter Pengirim</th><td>${pasien.pengirim.nama}</td></tr>
          </table>
        </div>
    `;

    const labelCellsHtml = LABEL_POSITIONS.map(
      (pos) => `<div class="label-cell">${pos === labelPosition ? labelCellHtml : ''}</div>`,
    ).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Klinik Prima Husada — Label Laboratorium</title>
          <style>
            @page { size: 20.5cm 15cm landscape; margin: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 0;
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
          <div class="label-sheet">${labelCellsHtml}</div>
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
    <Modal open={open} title={`Pratinjau Cetak Label — ${pasien.regCode}`} onClose={onClose} size="lg">
      <div>
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
            <button type="button" className="btn btn--secondary btn--sm" onClick={handleCopyLabel}>
              {copied ? '✓ Tersalin' : '📋 Salin Teks Label'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Tutup
            </button>
            <button type="button" className="btn btn--primary" onClick={handlePrintNow} style={{ fontWeight: 600 }}>
              🖨️ Cetak Label Sekarang
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
