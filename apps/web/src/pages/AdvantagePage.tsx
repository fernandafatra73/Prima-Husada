import { useEffect, useMemo, useState } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { SharingPdfPreviewModal } from '../components/ui/SharingPdfPreviewModal.tsx';
import { apiGet } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import {
  generateAdvantageReportBlob,
  printAdvantageReport,
} from '../pdf/printAdvantageReport.tsx';
import '../components/ui/ui.css';

interface DuplikatRadiologiItem {
  readonly totalHarga: string;
  readonly createdAt: string;
}

interface KeuanganTransaksiItem {
  readonly tanggal: string;
  readonly jenis: string;
  readonly kategori: string;
  readonly nominal: string;
}

interface GajiKaryawanItem {
  readonly tanggal: string;
  readonly gajiPokok: string;
  readonly tunjangan: string;
  readonly gajiBersih: string;
}

type PeriodType = 'month' | 'year' | 'custom';

const BHP_KATEGORI = ['PEMBELIAN_BHP', 'FARMASI_BHP'];

// Estimasi kasar PPh 21 bulanan berbasis bracket penghasilan bruto — BUKAN
// tabel TER resmi DJP, hanya perkiraan gambaran potongan pajak. Sinkron
// dengan logika di GajiKaryawanPage.tsx.
function estimasiPph21(grossMonthly: number): number {
  if (grossMonthly <= 5_000_000) return 0;
  if (grossMonthly <= 10_000_000) return grossMonthly * 0.05;
  if (grossMonthly <= 20_000_000) return grossMonthly * 0.1;
  if (grossMonthly <= 50_000_000) return grossMonthly * 0.15;
  return grossMonthly * 0.25;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getPeriodDates(period: PeriodType, customStart: string, customEnd: string) {
  const now = new Date();
  if (period === 'custom') {
    return { startDate: customStart, endDate: customEnd };
  }
  if (period === 'year') {
    return { startDate: `${now.getFullYear()}-01-01`, endDate: toDateStr(now) };
  }
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toDateStr(firstDay), endDate: toDateStr(now) };
}

function formatPeriodeLabel(period: PeriodType, customStart: string, customEnd: string): string {
  const now = new Date();
  if (period === 'year') return `Tahun ${now.getFullYear()}`;
  if (period === 'custom') return `${customStart || '—'} s/d ${customEnd || '—'}`;
  const names = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${names[now.getMonth()]} ${now.getFullYear()}`;
}

export function AdvantagePage() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [penerimaan, setPenerimaan] = useState(0);
  const [bhp, setBhp] = useState(0);
  const [gajiKaryawan, setGajiKaryawan] = useState(0);
  const [pajak, setPajak] = useState(0);

  const [catatan, setCatatan] = useState('');
  const [adminNama, setAdminNama] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const [printingPdf, setPrintingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const { startDate, endDate } = useMemo(
    () => getPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );
  const periodeLabel = useMemo(
    () => formatPeriodeLabel(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  useEffect(() => {
    const saved = localStorage.getItem('advantage_admin_nama');
    if (saved) setAdminNama(saved);
  }, []);

  useEffect(() => {
    const storageKey = `advantage_note_${period}_${startDate}_${endDate}`;
    setCatatan(localStorage.getItem(storageKey) ?? '');
    setNotesSaved(false);
  }, [period, startDate, endDate]);

  function handleAdminNamaChange(value: string) {
    setAdminNama(value);
    localStorage.setItem('advantage_admin_nama', value);
  }

  function handleSaveNotes() {
    const storageKey = `advantage_note_${period}_${startDate}_${endDate}`;
    localStorage.setItem(storageKey, catatan);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  useEffect(() => {
    if (!startDate || !endDate) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [duplikatRes, keluarRes, gajiRes] = await Promise.all([
          apiGet<{ items: DuplikatRadiologiItem[] }>(
            `/api/pasien-duplikat?modul=RADIOLOGI&startDate=${startDate}&endDate=${endDate}&limit=2000`,
          ),
          apiGet<{ items: KeuanganTransaksiItem[] }>('/api/keuangan/transaksi?jenis=KELUAR'),
          apiGet<{ items: GajiKaryawanItem[] }>('/api/gaji-karyawan?limit=2000'),
        ]);
        if (cancelled) return;

        const totalPenerimaan = duplikatRes.items.reduce(
          (sum, item) => sum + (Number(item.totalHarga) || 0),
          0,
        );

        const totalBhp = keluarRes.items
          .filter(
            (t) =>
              BHP_KATEGORI.includes(t.kategori) &&
              t.tanggal >= startDate &&
              t.tanggal <= endDate,
          )
          .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);

        const gajiPeriode = gajiRes.items.filter((g) => {
          const tgl = g.tanggal.split('T')[0] ?? g.tanggal;
          return tgl >= startDate && tgl <= endDate;
        });
        const totalGaji = gajiPeriode.reduce((sum, g) => sum + (Number(g.gajiBersih) || 0), 0);
        const totalPajak = gajiPeriode.reduce(
          (sum, g) => sum + estimasiPph21(Number(g.gajiPokok) + Number(g.tunjangan)),
          0,
        );

        setPenerimaan(totalPenerimaan);
        setBhp(totalBhp);
        setGajiKaryawan(totalGaji);
        setPajak(totalPajak);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data advantage');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const pengeluaran = bhp + gajiKaryawan + pajak;
  const advantage = penerimaan - pengeluaran;

  function buildReportInput() {
    return {
      periodeLabel,
      tanggalCetak: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      penerimaanFormatted: formatRupiah(penerimaan),
      bhpFormatted: formatRupiah(bhp),
      gajiKaryawanFormatted: formatRupiah(gajiKaryawan),
      pajakFormatted: formatRupiah(pajak),
      pengeluaranFormatted: `- ${formatRupiah(pengeluaran)}`,
      advantageFormatted: formatRupiah(advantage),
      catatan,
      adminNama,
    };
  }

  async function handleCetakPdf() {
    setPrintingPdf(true);
    try {
      await printAdvantageReport(buildReportInput());
    } finally {
      setPrintingPdf(false);
    }
  }

  async function handlePreviewPdf() {
    setPreviewingPdf(true);
    try {
      const blob = await generateAdvantageReportBlob(buildReportInput());
      setPreviewBlob(blob);
      setPreviewModalOpen(true);
    } finally {
      setPreviewingPdf(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Advantage"
        subtitle="Jumlah Penerimaan (Total Harga Pemeriksaan) − Jumlah Pengeluaran (Gaji Karyawan + Pajak + BHP)"
        metrics={[
          { label: 'Jumlah Penerimaan', value: formatRupiah(penerimaan), tone: 'blue', iconKind: 'document' },
          { label: 'Jumlah Pengeluaran', value: `- ${formatRupiah(pengeluaran)}`, tone: 'rose', iconKind: 'clipboard' },
          {
            label: 'Advantage (Pendapatan Net)',
            value: formatRupiah(advantage),
            tone: advantage >= 0 ? 'green' : 'rose',
            iconKind: 'check',
          },
        ]}
        error={error}
        loading={loading}
      >
        <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
          <div className="form-field">
            <label>Periode</label>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${period === 'month' ? 'filter-pill--active' : ''}`}
                onClick={() => setPeriod('month')}
              >
                Bulanan
              </button>
              <button
                type="button"
                className={`filter-pill ${period === 'year' ? 'filter-pill--active' : ''}`}
                onClick={() => setPeriod('year')}
              >
                Tahunan
              </button>
              <button
                type="button"
                className={`filter-pill ${period === 'custom' ? 'filter-pill--active' : ''}`}
                onClick={() => setPeriod('custom')}
              >
                Custom
              </button>
            </div>
          </div>

          {period === 'custom' && (
            <>
              <div className="form-field">
                <label htmlFor="adv-start">Dari Tanggal</label>
                <input
                  id="adv-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="adv-end">Sampai Tanggal</label>
                <input
                  id="adv-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}

          <div
            className="form-field"
            style={{ alignSelf: 'flex-end', marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}
          >
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void handleCetakPdf()}
              disabled={printingPdf || previewingPdf}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>🖨️</span>
              {printingPdf ? 'Membuat PDF...' : 'Cetak PDF'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void handlePreviewPdf()}
              disabled={previewingPdf || printingPdf}
              style={{ border: '1px solid var(--color-border)' }}
            >
              👁️ {previewingPdf ? 'Memuat...' : 'Preview PDF'}
            </button>
          </div>
        </div>

        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ fontWeight: 700, fontSize: '1rem' }}>Jumlah Penerimaan (Total Harga Pemeriksaan)</td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                {formatRupiah(penerimaan)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', paddingTop: '0.75rem' }}>
                Rincian Pengeluaran:
              </td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '1.5rem' }}>BHP (Reagen &amp; BHP Medis)</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(bhp)}</td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '1.5rem' }}>Gaji Karyawan</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(gajiKaryawan)}</td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '1.5rem' }}>Pajak (Estimasi PPh 21)</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(pajak)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: '1rem' }}>Jumlah Pengeluaran</td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: '#b91c1c' }}>
                - {formatRupiah(pengeluaran)}
              </td>
            </tr>
            <tr style={{ background: '#f0f9ff' }}>
              <td style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                ADVANTAGE (PENDAPATAN NET)
              </td>
              <td
                style={{
                  textAlign: 'right',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: advantage >= 0 ? '#15803d' : '#b91c1c',
                }}
              >
                {formatRupiah(advantage)}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          * BHP diambil dari transaksi Buku Kas kategori "Pembelian Reagen & BHP Medis" / "Farmasi & Apotek"
          (pengeluaran klinik secara umum, bukan khusus Radiologi). Pajak adalah estimasi kasar berbasis
          bracket gaji, bukan tabel TER resmi DJP.
        </p>

        <div className="sharing-bottom-layout" style={{ marginTop: '1rem' }}>
          <div className="sharing-notes-box">
            <h4 className="sharing-notes-box__title">Catatan</h4>
            <textarea
              rows={4}
              placeholder="Catatan tambahan untuk laporan Advantage periode ini..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                {notesSaved ? '✓ Catatan tersimpan' : ''}
              </span>
              <button type="button" className="btn btn--xs btn--primary" onClick={handleSaveNotes}>
                Simpan Catatan
              </button>
            </div>
          </div>

          <div className="sharing-summary-box">
            <div className="sharing-summary-row">
              <span>Nama Admin:</span>
              <input
                type="text"
                className="sharing-admin-nama-input"
                value={adminNama}
                placeholder="Nama petugas admin"
                onChange={(e) => handleAdminNamaChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </ListPageShell>

      <SharingPdfPreviewModal
        open={previewModalOpen}
        blob={previewBlob}
        filename={`Laporan_Advantage_Radiologi_${periodeLabel.replace(/[/\\?%*:|"<> ]/g, '_')}.pdf`}
        onClose={() => setPreviewModalOpen(false)}
        title="Pratinjau Laporan Advantage"
      />
    </>
  );
}
