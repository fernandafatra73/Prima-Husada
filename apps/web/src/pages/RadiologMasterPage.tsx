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

interface Radiolog {
  readonly id: string;
  readonly nama: string;
  readonly noTelepon: string | null;
}

export function RadiologMasterPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<Radiolog>('/api/radiolog', queryParams);
  const reload = useMutationReload(reloadList);
  const [nama, setNama] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openAdd() {
    setNama('');
    setNoTelepon('');
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(r: Radiolog) {
    setEditingId(r.id);
    setNama(r.nama);
    setNoTelepon(r.noTelepon ?? '');
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { nama, noTelepon };
    try {
      if (modalMode === 'add') {
        await apiPost('/api/radiolog', body);
      } else if (editingId) {
        await apiPatch(`/api/radiolog/${editingId}`, body);
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
      await apiDelete(`/api/radiolog/${deleteTarget.id}`);
      setDeleteTarget(null);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Manajemen Radiolog"
        subtitle="Data radiolog penanggung jawab hasil bacaan"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Radiolog
          </button>
        }
        metrics={[
          {
            label: 'Total radiolog',
            value: String(pagination.total),
            tone: 'green',
            iconKind: 'stethoscope',
          },
        ]}
        searchPlaceholder="Cari nama atau HP…"
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
              <th>Nama</th>
              <th>HP</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3}>Belum ada radiolog.</td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>{r.nama}</td>
                  <td>{r.noTelepon ?? '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(r)}
                      onDelete={() => setDeleteTarget({ id: r.id, label: r.nama })}
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
        title={modalMode === 'add' ? 'Tambah Radiolog' : 'Ubah Data Radiolog'}
        onClose={() => setModalMode(null)}
      >
        <form onSubmit={(e) => void onSubmit(e)} className="form-grid">
          <div className="form-field">
            <label htmlFor="rn">Nama</label>
            <input id="rn" required value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="rt">No HP</label>
            <input id="rt" value={noTelepon} onChange={(e) => setNoTelepon(e.target.value)} />
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
        title="Hapus radiolog"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

    </>
  );
}
