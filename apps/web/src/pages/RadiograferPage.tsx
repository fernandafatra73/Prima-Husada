import { useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiPatch, apiPost } from '../lib/api.ts';
import { loadLogoDataUrl } from '../pdf/loadLogoDataUrl.ts';
import { RadiograferReportDocument } from '../pdf/RadiograferReportDocument.tsx';
import '../components/ui/ui.css';

interface RadiograferItem {
  readonly id: string;
  readonly nama: string;
  readonly noHp: string | null;
  readonly createdAt: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatTanggalCetak(): string {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function RadiograferPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<RadiograferItem>('/api/radiografer', queryParams);
  const reload = useMutationReload(reloadList);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<RadiograferItem | null>(null);
  const [deleting, setDeleting] = useState<RadiograferItem | null>(null);
  const [previewItem, setPreviewItem] = useState<RadiograferItem | null>(null);
  const [logoSrc, setLogoSrc] = useState('');
  const [printing, setPrinting] = useState(false);

  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setNama('');
    setNoHp('');
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(item: RadiograferItem) {
    setEditing(item);
    setNama(item.nama);
    setNoHp(item.noHp ?? '');
    setError(null);
  }

  function closeModal() {
    setCreateOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await apiPatch(`/api/radiografer/${editing.id}`, {
          nama: nama.trim(),
          noHp: noHp.trim() || undefined,
        });
      } else {
        await apiPost('/api/radiografer', {
          nama: nama.trim(),
          noHp: noHp.trim() || undefined,
        });
      }
      closeModal();
      await reload({ resetPage: !editing });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan radiografer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/radiografer/${deleting.id}`);
      setDeleting(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus radiografer');
    } finally {
      setSubmitting(false);
    }
  }

  function openPreview(item: RadiograferItem) {
    setPreviewItem(item);
    if (!logoSrc) {
      void loadLogoDataUrl().then(setLogoSrc).catch(() => setLogoSrc(''));
    }
  }

  async function handlePrint(item: RadiograferItem) {
    setPrinting(true);
    try {
      const blob = await pdf(
        <RadiograferReportDocument
          data={{ logoSrc, nama: item.nama, noHp: item.noHp ?? '', tanggalCetak: formatTanggalCetak() }}
        />,
      ).toBlob();
      const cleanName = item.nama.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Radiografer';
      downloadBlob(blob, `Data_Radiografer_${cleanName}.pdf`);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Manajemen Radiografer"
        metrics={[
          {
            label: 'Total Radiografer',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'users',
          },
        ]}
        searchPlaceholder="Cari nama, no. HP..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        action={
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + Tambah Radiografer
          </button>
        }
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Radiografer</th>
              <th>No. HP</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                  Belum ada data radiografer.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                  <td>
                    <strong>{item.nama}</strong>
                  </td>
                  <td>{item.noHp || '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleting(item)}
                      onPrint={() => openPreview(item)}
                      editLabel="Ubah radiografer"
                      deleteLabel="Hapus radiografer"
                      printLabel="Cetak / Preview data radiografer"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListPageShell>

      {(createOpen || editing) && (
        <Modal
          open={true}
          title={editing ? 'Ubah Radiografer' : 'Tambah Radiografer'}
          onClose={closeModal}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="radiografer-nama">Nama Radiografer *</label>
              <input
                id="radiografer-nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap radiografer..."
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="radiografer-nohp">No. HP</label>
              <input
                id="radiografer-nohp"
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
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
        title="Hapus Radiografer"
        message={`Apakah Anda yakin ingin menghapus radiografer "${deleting?.nama ?? ''}"?`}
        loading={submitting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      {previewItem && (
        <Modal
          title={`Preview Data — ${previewItem.nama}`}
          open={true}
          onClose={() => setPreviewItem(null)}
          size="lg"
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void handlePrint(previewItem)}
              disabled={printing}
            >
              {printing ? 'Membuat PDF...' : '🖨️ Cetak PDF'}
            </button>
          </div>
          <div
            style={{
              width: '100%',
              height: '500px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
              background: '#525659',
            }}
          >
            <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
              <RadiograferReportDocument
                data={{
                  logoSrc,
                  nama: previewItem.nama,
                  noHp: previewItem.noHp ?? '',
                  tanggalCetak: formatTanggalCetak(),
                }}
              />
            </PDFViewer>
          </div>
        </Modal>
      )}
    </>
  );
}
