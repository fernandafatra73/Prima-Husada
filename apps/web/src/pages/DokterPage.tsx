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

interface Dokter {
  readonly id: string;
  readonly nama: string;
  readonly spesialisasi: string | null;
  readonly noTelepon: string | null;
}

export function DokterPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<Dokter>('/api/dokter', queryParams);
  const reload = useMutationReload(reloadList);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [nama, setNama] = useState('');
  const [spesialisasi, setSpesialisasi] = useState('');
  const [noTelepon, setNoTelepon] = useState('');

  function resetForm() {
    setNama('');
    setSpesialisasi('');
    setNoTelepon('');
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setModalMode('add');
  }

  function openEdit(d: Dokter) {
    setEditingId(d.id);
    setNama(d.nama);
    setSpesialisasi(d.spesialisasi ?? '');
    setNoTelepon(d.noTelepon ?? '');
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { nama, spesialisasi, noTelepon };
    try {
      if (modalMode === 'add') {
        await apiPost('/api/dokter', body);
      } else if (editingId) {
        await apiPatch(`/api/dokter/${editingId}`, body);
      }
      setModalMode(null);
      resetForm();
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
      await apiDelete(`/api/dokter/${deleteTarget.id}`);
      setDeleteTarget(null);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleteLoading(false);
    }
  }

  const form = (
    <form onSubmit={(e) => void onSubmit(e)} className="form-grid">
      <div className="form-field">
        <label htmlFor="dn">Nama</label>
        <input id="dn" required value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="ds">Spesialisasi</label>
        <input id="ds" value={spesialisasi} onChange={(e) => setSpesialisasi(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="dt">No HP</label>
        <input id="dt" value={noTelepon} onChange={(e) => setNoTelepon(e.target.value)} />
      </div>
      <ModalFormFooter
        onCancel={() => setModalMode(null)}
        submitLabel="Simpan"
        loading={saving}
      />
    </form>
  );

  return (
    <>
      <ListPageShell
        title="Manajemen Dokter"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Dokter
          </button>
        }
        metrics={[
          {
            label: 'Total dokter',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'clipboard',
          },
        ]}
        searchPlaceholder="Cari nama, spesialisasi, HP…"
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
              <th>Spesialisasi</th>
              <th>HP</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4}>Belum ada dokter.</td>
              </tr>
            ) : (
              items.map((d) => (
                <tr key={d.id}>
                  <td>{d.nama}</td>
                  <td>{d.spesialisasi ?? '—'}</td>
                  <td>{d.noTelepon ?? '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(d)}
                      onDelete={() => setDeleteTarget({ id: d.id, label: d.nama })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListPageShell>

      <Modal
        open={modalMode === 'add'}
        title="Tambah Dokter"
        onClose={() => setModalMode(null)}
      >
        {form}
      </Modal>
      <Modal
        open={modalMode === 'edit'}
        title="Ubah Data Dokter"
        onClose={() => setModalMode(null)}
      >
        {form}
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Hapus dokter"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
