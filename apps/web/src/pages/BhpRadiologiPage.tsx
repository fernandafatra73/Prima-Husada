import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { SharingPdfPreviewModal } from '../components/ui/SharingPdfPreviewModal.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import {
  BhpRadiologiReportDocument,
  type BhpRadiologiReportData,
} from '../pdf/BhpRadiologiReportDocument.tsx';
import { loadLogoDataUrl } from '../pdf/loadLogoDataUrl.ts';
import { pdf } from '@react-pdf/renderer';
import '../components/ui/ui.css';

interface BhpRadiologiItem {
  readonly id: string;
  readonly tanggal: string;
  readonly pemakaian: string;
  readonly harga: string;
  readonly dev: string;
  readonly fixer: string;
  readonly film: string;
  readonly amplopKertas: string;
  readonly listrik: string;
  readonly gajiKaryawan: string;
  readonly kertasCetak: string;
  readonly amplop: string;
}

interface DuplikatRadiologiOption {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly pemeriksaanNama: string;
  readonly totalHarga: string;
}

function formatTanggalDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

function computeTotalBiaya(item: BhpRadiologiItem): number {
  return (
    Number(item.dev) +
    Number(item.fixer) +
    Number(item.film) +
    Number(item.amplopKertas) +
    Number(item.listrik) +
    Number(item.gajiKaryawan) +
    Number(item.kertasCetak) +
    Number(item.amplop)
  );
}

function computeSelisih(item: BhpRadiologiItem): number {
  return Number(item.harga) - computeTotalBiaya(item);
}

const emptyForm = {
  tanggal: new Date().toISOString().split('T')[0]!,
  pemakaian: '',
  harga: '0',
  dev: '1000',
  fixer: '1000',
  film: '38000',
  amplopKertas: '1000',
  listrik: '2000',
  gajiKaryawan: '2500000',
  kertasCetak: '2000',
  amplop: '2000',
};

export function BhpRadiologiPage() {
  const { search, setSearch } = useListSearch();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryParams = useListQueryParams({ startDate, endDate }, search);
  const {
    items,
    pagination,
    setPage,
    loading,
    error,
    setError,
    reload: reloadList,
  } = usePaginatedList<BhpRadiologiItem>('/api/bhp-radiologi', queryParams);
  const reload = useMutationReload(reloadList);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BhpRadiologiItem | null>(null);
  const [deleting, setDeleting] = useState<BhpRadiologiItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [duplikatOptions, setDuplikatOptions] = useState<DuplikatRadiologiOption[]>([]);

  const loadDuplikatOptions = useCallback(async () => {
    try {
      const res = await apiGet<{ items: DuplikatRadiologiOption[] }>(
        '/api/pasien-duplikat?modul=RADIOLOGI&limit=200',
      );
      setDuplikatOptions(res.items);
    } catch {
      setDuplikatOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadDuplikatOptions();
  }, [loadDuplikatOptions]);
  const [form, setForm] = useState(emptyForm);

  const [printingPdf, setPrintingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const totalBiayaPreview = useMemo(() => {
    return (
      (Number(form.dev) || 0) +
      (Number(form.fixer) || 0) +
      (Number(form.film) || 0) +
      (Number(form.amplopKertas) || 0) +
      (Number(form.listrik) || 0) +
      (Number(form.gajiKaryawan) || 0) +
      (Number(form.kertasCetak) || 0) +
      (Number(form.amplop) || 0)
    );
  }, [
    form.dev,
    form.fixer,
    form.film,
    form.amplopKertas,
    form.listrik,
    form.gajiKaryawan,
    form.kertasCetak,
    form.amplop,
  ]);

  const selisihPreview = useMemo(
    () => (Number(form.harga) || 0) - totalBiayaPreview,
    [form.harga, totalBiayaPreview],
  );

  const totalHarga = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.harga || 0), 0),
    [items],
  );

  const totalBiaya = useMemo(
    () => items.reduce((sum, item) => sum + computeTotalBiaya(item), 0),
    [items],
  );

  const totalSelisih = useMemo(() => totalHarga - totalBiaya, [totalHarga, totalBiaya]);

  const periodeLabel = useMemo(() => {
    if (startDate && endDate) return `${formatTanggalDisplay(startDate)} s/d ${formatTanggalDisplay(endDate)}`;
    if (startDate) return `Sejak ${formatTanggalDisplay(startDate)}`;
    if (endDate) return `Hingga ${formatTanggalDisplay(endDate)}`;
    return 'Semua Periode';
  }, [startDate, endDate]);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(item: BhpRadiologiItem) {
    setForm({
      tanggal: item.tanggal.split('T')[0]!,
      pemakaian: item.pemakaian,
      harga: item.harga,
      dev: item.dev,
      fixer: item.fixer,
      film: item.film,
      amplopKertas: item.amplopKertas,
      listrik: item.listrik,
      gajiKaryawan: item.gajiKaryawan,
      kertasCetak: item.kertasCetak,
      amplop: item.amplop,
    });
    setError(null);
    setEditing(item);
  }

  function closeModal() {
    setCreateOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        tanggal: form.tanggal,
        pemakaian: form.pemakaian,
        harga: Number(form.harga) || 0,
        dev: Number(form.dev) || 0,
        fixer: Number(form.fixer) || 0,
        film: Number(form.film) || 0,
        amplopKertas: Number(form.amplopKertas) || 0,
        listrik: Number(form.listrik) || 0,
        gajiKaryawan: Number(form.gajiKaryawan) || 0,
        kertasCetak: Number(form.kertasCetak) || 0,
        amplop: Number(form.amplop) || 0,
      };
      if (editing) {
        await apiPatch(`/api/bhp-radiologi/${editing.id}`, body);
      } else {
        await apiPost('/api/bhp-radiologi', body);
      }
      closeModal();
      await reload({ resetPage: !editing });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data BHP radiologi');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/bhp-radiologi/${deleting.id}`);
      setDeleting(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data BHP radiologi');
    } finally {
      setSubmitting(false);
    }
  }

  async function buildReportData(): Promise<BhpRadiologiReportData> {
    const logoSrc = await loadLogoDataUrl().catch(() => '');
    return {
      logoSrc,
      periodeLabel,
      tanggalCetak: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      items: items.map((item, idx) => ({
        no: (pagination.page - 1) * pagination.limit + idx + 1,
        tanggal: formatTanggalDisplay(item.tanggal),
        pemakaian: item.pemakaian,
        hargaFormatted: formatRupiah(item.harga),
        devFormatted: formatRupiah(item.dev),
        fixerFormatted: formatRupiah(item.fixer),
        filmFormatted: formatRupiah(item.film),
        amplopKertasFormatted: formatRupiah(item.amplopKertas),
        listrikFormatted: formatRupiah(item.listrik),
        gajiKaryawanFormatted: formatRupiah(item.gajiKaryawan),
        kertasCetakFormatted: formatRupiah(item.kertasCetak),
        amplopFormatted: formatRupiah(item.amplop),
        totalBiayaFormatted: formatRupiah(computeTotalBiaya(item)),
        selisihFormatted: formatRupiah(computeSelisih(item)),
      })),
      totalHargaFormatted: formatRupiah(totalHarga),
      totalBiayaFormatted: formatRupiah(totalBiaya),
      totalSelisihFormatted: formatRupiah(totalSelisih),
    };
  }

  async function handleCetakPdf() {
    setPrintingPdf(true);
    try {
      const data = await buildReportData();
      const blob = await pdf(<BhpRadiologiReportDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Laporan_BHP_Radiologi_${periodeLabel.replace(/[/\\?%*:|"<> ]/g, '_')}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setPrintingPdf(false);
    }
  }

  async function handlePreviewPdf() {
    setPreviewingPdf(true);
    try {
      const data = await buildReportData();
      const blob = await pdf(<BhpRadiologiReportDocument data={data} />).toBlob();
      setPreviewBlob(blob);
      setPreviewModalOpen(true);
    } finally {
      setPreviewingPdf(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="BHP Radiologi"
        subtitle="Catatan pemakaian & biaya BHP radiologi (Dev, Fixer, Film, Amplop, Listrik, Gaji Karyawan, Kertas Cetak) dibandingkan Harga"
        metrics={[
          { label: 'Total Data', value: String(pagination.total), tone: 'blue', iconKind: 'clipboard' },
          { label: 'Total Harga', value: formatRupiah(totalHarga), tone: 'green', iconKind: 'document' },
          { label: 'Total Biaya', value: formatRupiah(totalBiaya), tone: 'rose', iconKind: 'clipboard' },
          {
            label: 'Total Selisih',
            value: formatRupiah(totalSelisih),
            tone: totalSelisih >= 0 ? 'green' : 'rose',
            iconKind: 'check',
          },
        ]}
        searchPlaceholder="Cari pemakaian..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        filterExtra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
              aria-label="Dari tanggal"
            />
            <span>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
              aria-label="Sampai tanggal"
            />
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => void handleCetakPdf()}
              disabled={printingPdf || previewingPdf}
            >
              🖨️ {printingPdf ? 'Membuat PDF...' : 'Cetak PDF'}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => void handlePreviewPdf()}
              disabled={previewingPdf || printingPdf}
              style={{ border: '1px solid var(--color-border)' }}
            >
              👁️ {previewingPdf ? 'Memuat...' : 'Preview PDF'}
            </button>
          </div>
        }
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        action={
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + Tambah Data BHP
          </button>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Pemakaian</th>
                <th style={{ textAlign: 'right' }}>Harga</th>
                <th style={{ textAlign: 'right' }}>Dev</th>
                <th style={{ textAlign: 'right' }}>Fixer</th>
                <th style={{ textAlign: 'right' }}>Film</th>
                <th style={{ textAlign: 'right' }}>Amplop Kertas</th>
                <th style={{ textAlign: 'right' }}>Listrik</th>
                <th style={{ textAlign: 'right' }}>Gaji Karyawan</th>
                <th style={{ textAlign: 'right' }}>Kertas Cetak</th>
                <th style={{ textAlign: 'right' }}>Amplop</th>
                <th style={{ textAlign: 'right' }}>Total Biaya</th>
                <th style={{ textAlign: 'right' }}>Selisih</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '1.5rem' }}>
                    Belum ada data BHP radiologi.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const totalBiayaItem = computeTotalBiaya(item);
                  const selisihItem = computeSelisih(item);
                  return (
                    <tr key={item.id}>
                      <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td>{formatTanggalDisplay(item.tanggal)}</td>
                      <td style={{ fontWeight: 600 }}>{item.pemakaian}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.harga)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.dev)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.fixer)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.film)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.amplopKertas)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.listrik)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.gajiKaryawan)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.kertasCetak)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.amplop)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatRupiah(totalBiayaItem)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: selisihItem >= 0 ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {formatRupiah(selisihItem)}
                      </td>
                      <td>
                        <TableRowActions
                          onEdit={() => openEdit(item)}
                          onDelete={() => setDeleting(item)}
                          editLabel="Ubah data BHP"
                          deleteLabel="Hapus data BHP"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ListPageShell>

      {(createOpen || editing) && (
        <Modal
          open={true}
          title={editing ? 'Ubah Data BHP Radiologi' : 'Tambah Data BHP Radiologi'}
          onClose={closeModal}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="bhp-pilih-duplikat">Pilih dari Duplikat Radiologi (Opsional)</label>
              <select
                id="bhp-pilih-duplikat"
                value=""
                onChange={(e) => {
                  const selected = duplikatOptions.find((d) => d.id === e.target.value);
                  if (selected) {
                    setForm((f) => ({
                      ...f,
                      pemakaian: `${selected.nama} — ${selected.pemeriksaanNama} (${selected.regCode})`,
                      harga: selected.totalHarga,
                    }));
                  }
                }}
              >
                <option value="">-- Pilih Pasien / Ketik Manual di Bawah --</option>
                {duplikatOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} — {d.pemeriksaanNama} ({d.regCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="bhp-pemakaian">Pemakaian *</label>
              <input
                id="bhp-pemakaian"
                required
                placeholder="Contoh: Pemakaian BHP Rontgen Thorax"
                value={form.pemakaian}
                onChange={(e) => setForm((f) => ({ ...f, pemakaian: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-tanggal">Tanggal *</label>
              <input
                id="bhp-tanggal"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-harga">Harga (Rp)</label>
              <input
                id="bhp-harga"
                type="number"
                min="0"
                step="1"
                value={form.harga}
                onChange={(e) => setForm((f) => ({ ...f, harga: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-dev">Dev (Rp)</label>
              <input
                id="bhp-dev"
                type="number"
                min="0"
                step="1"
                value={form.dev}
                onChange={(e) => setForm((f) => ({ ...f, dev: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-fixer">Fixer (Rp)</label>
              <input
                id="bhp-fixer"
                type="number"
                min="0"
                step="1"
                value={form.fixer}
                onChange={(e) => setForm((f) => ({ ...f, fixer: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-film">Film Setiap Pemeriksaan (Rp)</label>
              <input
                id="bhp-film"
                type="number"
                min="0"
                step="1"
                value={form.film}
                onChange={(e) => setForm((f) => ({ ...f, film: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-amplop-kertas">Amplop Kertas (Rp)</label>
              <input
                id="bhp-amplop-kertas"
                type="number"
                min="0"
                step="1"
                value={form.amplopKertas}
                onChange={(e) => setForm((f) => ({ ...f, amplopKertas: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-listrik">Listrik (Rp)</label>
              <input
                id="bhp-listrik"
                type="number"
                min="0"
                step="1"
                value={form.listrik}
                onChange={(e) => setForm((f) => ({ ...f, listrik: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-gaji-karyawan">Gaji Karyawan (Rp)</label>
              <input
                id="bhp-gaji-karyawan"
                type="number"
                min="0"
                step="1"
                value={form.gajiKaryawan}
                onChange={(e) => setForm((f) => ({ ...f, gajiKaryawan: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-kertas-cetak">Kertas Cetak (Rp)</label>
              <input
                id="bhp-kertas-cetak"
                type="number"
                min="0"
                step="1"
                value={form.kertasCetak}
                onChange={(e) => setForm((f) => ({ ...f, kertasCetak: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bhp-amplop">Amplop (Rp)</label>
              <input
                id="bhp-amplop"
                type="number"
                min="0"
                step="1"
                value={form.amplop}
                onChange={(e) => setForm((f) => ({ ...f, amplop: e.target.value }))}
              />
            </div>
            <div
              className="form-field form-field--full"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                padding: '0.5rem 0',
                borderTop: '1px dashed var(--color-border)',
              }}
            >
              <span>Total Biaya</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatRupiah(totalBiayaPreview)}</span>
            </div>
            <div
              className="form-field form-field--full"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                padding: '0.5rem 0',
                borderTop: '1px dashed var(--color-border)',
              }}
            >
              <span>Selisih (Harga - Total Biaya)</span>
              <span style={{ color: selisihPreview >= 0 ? '#15803d' : '#b91c1c' }}>
                {formatRupiah(selisihPreview)}
              </span>
            </div>
            <ModalFormFooter
              onCancel={closeModal}
              submitLabel={editing ? 'Simpan Perubahan' : 'Simpan'}
              loading={submitting}
            />
          </form>
        </Modal>
      )}

      <ConfirmModal
        open={deleting !== null}
        title="Hapus Data BHP Radiologi"
        message={`Yakin hapus data pemakaian "${deleting?.pemakaian ?? ''}" tanggal ${deleting ? formatTanggalDisplay(deleting.tanggal) : ''}?`}
        loading={submitting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <SharingPdfPreviewModal
        open={previewModalOpen}
        blob={previewBlob}
        filename={`Laporan_BHP_Radiologi_${periodeLabel.replace(/[/\\?%*:|"<> ]/g, '_')}.pdf`}
        onClose={() => setPreviewModalOpen(false)}
        title="Pratinjau Laporan BHP Radiologi"
      />
    </>
  );
}
