import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { SharingPdfPreviewModal } from '../components/ui/SharingPdfPreviewModal.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiGet, apiPatch } from '../lib/api.ts';
import { formatRupiah, formatUmurTahun } from '../lib/format.ts';
import type { PaginatedResponse } from '../lib/pagination.ts';
import { generateSharingReportBlob, printSharingReport } from '../pdf/printSharingReport.tsx';
import '../components/ui/ui.css';

interface DokterItem {
  readonly id: string;
  readonly nama: string;
}

interface SharingPasienItem {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur: number;
  readonly createdAt: string;
  readonly alamat: string | null;
  readonly pengirim: { readonly id: string; readonly nama: string };
  readonly pemeriksaan: readonly { readonly nama: string }[];
  readonly totalSharing: string;
}

type PeriodType = 'all' | 'week' | 'month' | 'custom';

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function getPeriodDates(period: PeriodType, customStart: string, customEnd: string) {
  if (period === 'custom') {
    return { startDate: customStart, endDate: customEnd };
  }
  if (period === 'week') {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const startStr = monday.toISOString().split('T')[0]!;
    const endStr = new Date().toISOString().split('T')[0]!;
    return { startDate: startStr, endDate: endStr };
  }
  if (period === 'month') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      startDate: firstDay.toISOString().split('T')[0]!,
      endDate: lastDay.toISOString().split('T')[0]!,
    };
  }
  return { startDate: '', endDate: '' };
}

export function SharingPage() {
  const { search, setSearch } = useListSearch();
  const [dokterList, setDokterList] = useState<DokterItem[]>([]);
  const [selectedDokterId, setSelectedDokterId] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [catatan, setCatatan] = useState('');
  const [adminFee, setAdminFee] = useState<number>(0);
  const [notesSaved, setNotesSaved] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('Laporan_Sharing.pdf');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemNama, setEditItemNama] = useState('');
  const [editSharingAmount, setEditSharingAmount] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(
    () => getPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const listParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (selectedDokterId !== 'all') {
      params.pengirimId = selectedDokterId;
    }
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [selectedDokterId, startDate, endDate]);

  const queryParams = useListQueryParams(listParams, search);
  const { items, pagination, setPage, loading, error, reload: reloadList } =
    usePaginatedList<SharingPasienItem>('/api/pasien', queryParams);
  const reload = useMutationReload(reloadList);

  const loadDokterList = useCallback(async () => {
    try {
      const res = await apiGet<PaginatedResponse<DokterItem>>('/api/dokter?page=1&limit=200');
      setDokterList(res.items);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    void loadDokterList();
  }, [loadDokterList]);

  // Load saved notes for doctor
  useEffect(() => {
    const storageKey = `sharing_note_${selectedDokterId}_${period}`;
    const saved = localStorage.getItem(storageKey);
    setCatatan(saved ?? '');
    setNotesSaved(false);
  }, [selectedDokterId, period]);

  const handleSaveNotes = () => {
    const storageKey = `sharing_note_${selectedDokterId}_${period}`;
    localStorage.setItem(storageKey, catatan);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const totalSharingSum = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.totalSharing) || 0), 0);
  }, [items]);

  const selectedDokterNama = useMemo(() => {
    if (selectedDokterId === 'all') return 'Semua Dokter';
    const found = dokterList.find((d) => d.id === selectedDokterId);
    return found ? found.nama : 'Dokter Pengirim';
  }, [selectedDokterId, dokterList]);

  const periodeLabel = useMemo(() => {
    if (period === 'week') return 'Minggu Ini';
    if (period === 'month') return 'Bulan Ini';
    if (period === 'custom') {
      return `${formatDateDisplay(customStart)} s/d ${formatDateDisplay(customEnd)}`;
    }
    return 'Semua Periode';
  }, [period, customStart, customEnd]);

  const buildReportInput = () => {
    const todayStr = formatDateDisplay(new Date().toISOString());
    const pdfItems = items.map((p, idx) => ({
      no: (pagination.page - 1) * pagination.limit + idx + 1,
      nama: p.nama,
      regCode: p.regCode,
      umurLabel: formatUmurTahun(p.umur),
      tanggal: formatDateDisplay(p.createdAt),
      alamat: p.alamat || '—',
      pemeriksaan: p.pemeriksaan.map((x) => x.nama).join(', '),
      sharingFormatted: formatRupiah(p.totalSharing),
    }));

    return {
      dokterNama: selectedDokterNama,
      periodeLabel,
      tanggalCetak: todayStr,
      items: pdfItems,
      totalPasien: pagination.total,
      totalSharingFormatted: formatRupiah(totalSharingSum),
      adminFeeFormatted: formatRupiah(adminFee),
      netSharingFormatted: formatRupiah(Math.max(0, totalSharingSum - adminFee)),
      catatan,
    };
  };

  const handlePrintPdf = async () => {
    setPrintingPdf(true);
    try {
      await printSharingReport(buildReportInput());
    } catch (err) {
      console.error('Gagal mencetak PDF sharing:', err);
    } finally {
      setPrintingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    setPreviewingPdf(true);
    try {
      const input = buildReportInput();
      const blob = await generateSharingReportBlob(input);
      const cleanDokter = input.dokterNama.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Dokter';
      setPreviewFilename(`Laporan_Sharing_${cleanDokter}.pdf`);
      setPreviewBlob(blob);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error('Gagal membuat pratinjau PDF sharing:', err);
    } finally {
      setPreviewingPdf(false);
    }
  };

  const openEditModal = (p: SharingPasienItem) => {
    setEditItemId(p.id);
    setEditItemNama(p.nama);
    setEditSharingAmount(p.totalSharing); // Default ke totalSharing saat ini (asumsi fixed sharing)
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editItemId) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await apiPatch(`/api/pasien/${editItemId}`, {
        sharingAmount: Number(editSharingAmount),
      });
      setEditModalOpen(false);
      setEditItemId(null);
      await reload();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan data sharing');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <ListPageShell
      title="Manajemen Sharing Dokter"
      metrics={[
        {
          label: 'Total pasien sharing',
          value: String(pagination.total),
          tone: 'blue',
          iconKind: 'clipboard',
        },
        {
          label: 'Dokter dipilih',
          value: selectedDokterNama,
          tone: 'green',
          iconKind: 'document',
        },
        {
          label: 'Total nominal sharing',
          value: formatRupiah(totalSharingSum),
          tone: 'violet',
          iconKind: 'percent',
        },
      ]}
      searchPlaceholder="Cari nama pasien, reg code, alamat..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void reload()}
      error={error}
      loading={loading}
      pagination={pagination}
      onPageChange={setPage}
    >
      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="form-field" style={{ minWidth: '220px' }}>
          <label htmlFor="filter-dokter">Dokter Pengirim</label>
          <select
            id="filter-dokter"
            value={selectedDokterId}
            onChange={(e) => setSelectedDokterId(e.target.value)}
          >
            <option value="all">Semua Dokter Pengirim</option>
            {dokterList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Periode Waktu</label>
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill ${period === 'all' ? 'filter-pill--active' : ''}`}
              onClick={() => setPeriod('all')}
            >
              Semua
            </button>
            <button
              type="button"
              className={`filter-pill ${period === 'week' ? 'filter-pill--active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Minggu Ini
            </button>
            <button
              type="button"
              className={`filter-pill ${period === 'month' ? 'filter-pill--active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              className={`filter-pill ${period === 'custom' ? 'filter-pill--active' : ''}`}
              onClick={() => setPeriod('custom')}
            >
              Kustom
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <>
            <div className="form-field">
              <label htmlFor="start-date">Dari Tanggal</label>
              <input
                id="start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="end-date">Sampai Tanggal</label>
              <input
                id="end-date"
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
            className="btn btn--ghost"
            onClick={() => void handlePreviewPdf()}
            disabled={previewingPdf || printingPdf}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>👁️</span>
            {previewingPdf ? 'Memuat Pratinjau...' : 'Preview PDF Sharing'}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handlePrintPdf()}
            disabled={printingPdf || previewingPdf}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>🖨️</span>
            {printingPdf ? 'Membuat PDF...' : 'Cetak PDF Sharing'}
          </button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>No</th>
            <th>Nama Pasien</th>
            <th>Umur</th>
            <th>Tanggal</th>
            <th>Alamat</th>
            <th>Pemeriksaan</th>
            <th style={{ textAlign: 'right' }}>Sharing</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7}>Belum ada data pasien sharing untuk kriteria ini.</td>
            </tr>
          ) : (
            items.map((p, idx) => (
              <tr key={p.id}>
                <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                <td>
                  <strong>{p.nama}</strong>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {p.regCode} • {p.pengirim.nama}
                  </div>
                </td>
                <td>{formatUmurTahun(p.umur)}</td>
                <td>{formatDateDisplay(p.createdAt)}</td>
                <td>{p.alamat || '—'}</td>
                <td>{p.pemeriksaan.map((x) => x.nama).join(', ')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {formatRupiah(p.totalSharing)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn--xs btn--ghost"
                    onClick={() => openEditModal(p)}
                    title="Edit Sharing"
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="sharing-bottom-layout">
        <div className="sharing-notes-box">
          <h4 className="sharing-notes-box__title">Catatan Pembayaran Sharing</h4>
          <textarea
            rows={4}
            placeholder="Isikan catatan transfer sharing (contoh: Sharing bulan Juli untuk Dokter Budi sudah ditransfer via BCA tgl 26/07/2026)..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {notesSaved ? '✓ Catatan tersimpan' : ''}
            </span>
            <button
              type="button"
              className="btn btn--xs btn--primary"
              onClick={handleSaveNotes}
            >
              Simpan Catatan
            </button>
          </div>
        </div>

        <div className="sharing-summary-box">
          <div className="sharing-summary-row">
            <span>Total Pasien:</span>
            <strong>{pagination.total} Pasien</strong>
          </div>
          <div className="sharing-summary-row">
            <span>Total Sharing:</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>
              {formatRupiah(totalSharingSum)}
            </strong>
          </div>
          <div className="sharing-summary-row">
            <span>Admin (Potongan/Biaya):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Rp</span>
              <input
                type="number"
                min="0"
                className="sharing-admin-input"
                value={adminFee || ''}
                placeholder="0"
                onChange={(e) => setAdminFee(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="sharing-summary-row sharing-summary-row--highlight">
            <span>Total Net Sharing:</span>
            <strong>{formatRupiah(Math.max(0, totalSharingSum - adminFee))}</strong>
          </div>
        </div>
      </div>

      <SharingPdfPreviewModal
        open={previewModalOpen}
        blob={previewBlob}
        filename={previewFilename}
        onClose={() => setPreviewModalOpen(false)}
      />

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Nominal Sharing">
        <form onSubmit={handleEditSubmit} className="form-stack">
          {editError && <div className="alert alert--error">{editError}</div>}
          <div className="form-field">
            <label>Nama Pasien</label>
            <input type="text" value={editItemNama} disabled />
          </div>
          <div className="form-field">
            <label htmlFor="sharingAmount">Nominal Sharing (Rp)</label>
            <input
              id="sharingAmount"
              type="number"
              min="0"
              step="1"
              required
              value={editSharingAmount}
              onChange={(e) => setEditSharingAmount(e.target.value)}
            />
          </div>
          <ModalFormFooter
            onCancel={() => setEditModalOpen(false)}
            loading={editSaving}
            submitLabel="Simpan"
          />
        </form>
      </Modal>
    </ListPageShell>
  );
}

