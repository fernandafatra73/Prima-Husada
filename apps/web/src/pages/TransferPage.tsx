import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api.ts';
import { formatRupiah, formatDateShort } from '../lib/format.ts';
import { generateTransferReportBlob, printTransferReport } from '../pdf/printTransferReport.tsx';
import { SharingPdfPreviewModal } from '../components/ui/SharingPdfPreviewModal.tsx';
import '../components/ui/ui.css';

interface TransferItem {
  readonly id: string;
  readonly namaBank: string;
  readonly noRekening: string;
  readonly jumlah: string;
  readonly namaTransferan: string;
  readonly tanggal: string;
}

interface TransferSummary {
  readonly harian: string;
  readonly mingguan: string;
  readonly bulanan: string;
  readonly tahunan: string;
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const emptyForm = {
  namaBank: '',
  noRekening: '',
  jumlah: '',
  namaTransferan: '',
  tanggal: new Date().toISOString().split('T')[0]!,
};

export function TransferPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<TransferItem>('/api/transfer', queryParams);
  const reload = useMutationReload(reloadList);

  const [summary, setSummary] = useState<TransferSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TransferItem | null>(null);
  const [deleting, setDeleting] = useState<TransferItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const res = await apiGet<TransferSummary>('/api/transfer/summary');
      setSummary(res);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(item: TransferItem) {
    setForm({
      namaBank: item.namaBank,
      noRekening: item.noRekening,
      jumlah: item.jumlah,
      namaTransferan: item.namaTransferan,
      tanggal: item.tanggal.split('T')[0]!,
    });
    setError(null);
    setEditing(item);
  }

  function closeModal() {
    setCreateOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        namaBank: form.namaBank,
        noRekening: form.noRekening,
        jumlah: Number(form.jumlah),
        namaTransferan: form.namaTransferan,
        tanggal: form.tanggal,
      };
      if (editing) {
        await apiPatch(`/api/transfer/${editing.id}`, body);
      } else {
        await apiPost('/api/transfer', body);
      }
      closeModal();
      await reload({ resetPage: !editing });
      await loadSummary();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data transfer');
    } finally {
      setSubmitting(false);
    }
  }

  function buildReportInput() {
    const todayStr = formatDateShort(new Date().toISOString());
    const pdfItems = items.map((item, idx) => ({
      no: (pagination.page - 1) * pagination.limit + idx + 1,
      tanggal: formatDateDisplay(item.tanggal),
      namaBank: item.namaBank,
      noRekening: item.noRekening,
      namaTransferan: item.namaTransferan,
      jumlahFormatted: formatRupiah(item.jumlah),
    }));
    const totalJumlah = items.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
    return {
      tanggalCetak: todayStr,
      items: pdfItems,
      totalTransfer: pagination.total,
      totalJumlahFormatted: formatRupiah(totalJumlah),
      adminNama: '',
    };
  }

  async function handlePrintPdf() {
    setPrintingPdf(true);
    try {
      await printTransferReport(buildReportInput());
    } catch (err) {
      console.error('Gagal mencetak PDF transfer:', err);
    } finally {
      setPrintingPdf(false);
    }
  }

  async function handlePreviewPdf() {
    setPreviewingPdf(true);
    try {
      const blob = await generateTransferReportBlob(buildReportInput());
      setPreviewBlob(blob);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error('Gagal membuat pratinjau PDF transfer:', err);
    } finally {
      setPreviewingPdf(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/transfer/${deleting.id}`);
      setDeleting(null);
      await reload();
      await loadSummary();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data transfer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ListPageShell
      title="Transfer"
      subtitle="Catatan transfer bank & rekapitulasi jumlah transfer per periode"
      metrics={[
        {
          label: 'Transfer Harian',
          value: formatRupiah(summary?.harian ?? '0'),
          tone: 'blue',
          iconKind: 'currency',
        },
        {
          label: 'Transfer Mingguan',
          value: formatRupiah(summary?.mingguan ?? '0'),
          tone: 'violet',
          iconKind: 'currency',
        },
        {
          label: 'Transfer Bulanan',
          value: formatRupiah(summary?.bulanan ?? '0'),
          tone: 'green',
          iconKind: 'currency',
        },
        {
          label: 'Transfer Tahunan',
          value: formatRupiah(summary?.tahunan ?? '0'),
          tone: 'amber',
          iconKind: 'currency',
        },
      ]}
      searchPlaceholder="Cari nama bank, no rekening, nama transferan..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => {
        void reload();
        void loadSummary();
      }}
      error={error}
      loading={loading}
      pagination={pagination}
      onPageChange={setPage}
      action={
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void handlePreviewPdf()}
            disabled={previewingPdf || printingPdf}
            style={{ border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>👁️</span>
            {previewingPdf ? 'Memuat...' : 'Preview PDF'}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => void handlePrintPdf()}
            disabled={printingPdf || previewingPdf}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>🖨️</span>
            {printingPdf ? 'Membuat PDF...' : 'Cetak PDF'}
          </button>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + Tambah Transfer
          </button>
        </div>
      }
    >
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>No</th>
            <th>Nama Bank</th>
            <th>No Rekening</th>
            <th style={{ textAlign: 'right' }}>Jumlah</th>
            <th>Nama Transferan</th>
            <th>Tanggal</th>
            <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem' }}>
                Belum ada data transfer.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{item.namaBank}</td>
                <td>{item.noRekening}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {formatRupiah(item.jumlah)}
                </td>
                <td>{item.namaTransferan}</td>
                <td>{formatDateDisplay(item.tanggal)}</td>
                <td style={{ textAlign: 'center' }}>
                  <TableRowActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => setDeleting(item)}
                    editLabel="Ubah data transfer"
                    deleteLabel="Hapus data transfer"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {(createOpen || editing) && (
        <Modal
          open={true}
          title={editing ? 'Ubah Data Transfer' : 'Tambah Data Transfer'}
          onClose={closeModal}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="form-grid">
            <div className="form-field">
              <label htmlFor="namaBank">Nama Bank *</label>
              <input
                id="namaBank"
                required
                value={form.namaBank}
                onChange={(e) => setForm((f) => ({ ...f, namaBank: e.target.value }))}
                placeholder="mis. BCA, BRI, Mandiri..."
              />
            </div>
            <div className="form-field">
              <label htmlFor="noRekening">No Rekening *</label>
              <input
                id="noRekening"
                required
                value={form.noRekening}
                onChange={(e) => setForm((f) => ({ ...f, noRekening: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="jumlah">Jumlah (Rp) *</label>
              <input
                id="jumlah"
                type="number"
                min="0"
                step="1"
                required
                value={form.jumlah}
                onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="tanggal">Tanggal *</label>
              <input
                id="tanggal"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="namaTransferan">Nama Transferan *</label>
              <input
                id="namaTransferan"
                required
                value={form.namaTransferan}
                onChange={(e) => setForm((f) => ({ ...f, namaTransferan: e.target.value }))}
                placeholder="Nama pengirim/tujuan transfer..."
              />
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
        title="Hapus Data Transfer"
        message={`Yakin hapus transfer "${deleting?.namaTransferan ?? ''}" (${formatRupiah(deleting?.jumlah ?? '0')})?`}
        loading={submitting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <SharingPdfPreviewModal
        open={previewModalOpen}
        blob={previewBlob}
        filename="Laporan_Transfer.pdf"
        onClose={() => setPreviewModalOpen(false)}
        title="Pratinjau Laporan Transfer"
      />
    </ListPageShell>
  );
}
