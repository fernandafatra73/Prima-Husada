import { useState, type FormEvent } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiPatch, apiPost } from '../lib/api.ts';
import '../components/ui/ui.css';

interface Template {
  readonly id: string;
  readonly judul: string;
  readonly isi: string;
  readonly gambar?: string | null;
}

export function KesanPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<Template>('/api/kesan-template', queryParams);
  const reload = useMutationReload(reloadList);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [gambar, setGambar] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openAdd() {
    setJudul('');
    setIsi('');
    setGambar(null);
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setJudul(t.judul);
    setIsi(t.isi);
    setGambar(t.gambar || null);
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modalMode === 'add') {
        await apiPost('/api/kesan-template', { judul, isi, gambar });
      } else if (editingId) {
        await apiPatch(`/api/kesan-template/${editingId}`, { judul, isi, gambar });
      }
      setModalMode(null);
      await reload({ resetPage: modalMode === 'add' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await apiDelete(`/api/kesan-template/${deleteTarget.id}`);
      setDeleteTarget(null);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGambar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <ListPageShell
        title="Manajemen Kesan (Template)"
        subtitle="Template kesan untuk pemeriksaan radiologi"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Template
          </button>
        }
        metrics={[
          {
            label: 'Total template',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'document',
          },
        ]}
        searchPlaceholder="Cari judul atau isi template…"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Isi</th>
              <th>Gambar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3}>Belum ada template.</td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id}>
                  <td>{t.judul}</td>
                  <td>{t.isi}</td>
                  <td>
                    {t.gambar ? (
                      <img src={t.gambar} alt={t.judul} style={{ width: 60, height: 'auto', objectFit: 'contain' }} />
                    ) : (
                      <span className="text-sm text-gray-500" style={{ fontSize: 12 }}>Tidak ada</span>
                    )}
                  </td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(t)}
                      onDelete={() => setDeleteTarget({ id: t.id, label: t.judul })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListPageShell>

      <Modal
        open={modalMode !== null}
        title={modalMode === 'add' ? 'Tambah Template Kesan' : 'Ubah Template Kesan'}
        onClose={() => setModalMode(null)}
        size="lg"
      >
        <form onSubmit={(e) => void onSubmit(e)} className="form-grid">
          <div className="form-field form-grid--full">
            <label htmlFor="kj">Judul template</label>
            <input id="kj" required value={judul} onChange={(e) => setJudul(e.target.value)} />
          </div>
          <div className="form-field form-grid--full">
            <label htmlFor="ki">Isi template</label>
            <textarea id="ki" required value={isi} onChange={(e) => setIsi(e.target.value)} />
          </div>
          <div className="form-field form-grid--full">
            <label htmlFor="kg">Gambar referensi (opsional)</label>
            <input id="kg" type="file" accept="image/*" onChange={handleFileChange} />
            {gambar && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, marginBottom: 4 }}>Preview:</p>
                <img src={gambar} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setGambar(null)}
                  >
                    Hapus Gambar
                  </button>
                </div>
              </div>
            )}
          </div>
          <ModalFormFooter
            onCancel={() => setModalMode(null)}
            submitLabel="Simpan"
            loading={saving}
          />
        </form>
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Hapus template"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

    </>
  );
}
