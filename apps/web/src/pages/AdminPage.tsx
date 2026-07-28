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

interface Staff {
  readonly id: string;
  readonly nama: string;
  readonly email: string;
  readonly role: 'ADMIN' | 'KARYAWAN';
}

export function AdminPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({ role: 'ADMIN' }, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<Staff>('/api/staff', queryParams);
  const reload = useMutationReload(reloadList);
  
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openAdd() {
    setNama('');
    setEmail('');
    setPassword('');
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(s: Staff) {
    setEditingId(s.id);
    setNama(s.nama);
    setEmail(s.email);
    setPassword('');
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body =
      modalMode === 'add' || password.trim()
        ? { nama, email, password, role: 'ADMIN' }
        : { nama, email, role: 'ADMIN' };
    try {
      if (modalMode === 'add') {
        await apiPost('/api/staff', body);
      } else if (editingId) {
        await apiPatch(`/api/staff/${editingId}`, body);
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
      await apiDelete(`/api/staff/${deleteTarget.id}`);
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
        title="Manajemen Admin"
        subtitle="Kelola data akun Admin pada sistem"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Admin
          </button>
        }
        metrics={[
          {
            label: 'Total admin',
            value: String(pagination.total),
            tone: 'slate',
            iconKind: 'users',
          },
        ]}
        searchPlaceholder="Cari nama atau email…"
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
              <th>Email</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3}>Belum ada admin.</td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>{s.nama}</td>
                  <td>{s.email}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(s)}
                      onDelete={() => setDeleteTarget({ id: s.id, label: s.nama })}
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
        title={modalMode === 'add' ? 'Tambah Admin' : 'Ubah Data Admin'}
        onClose={() => setModalMode(null)}
      >
        <form onSubmit={(e) => void onSubmit(e)} className="form-grid">
          <div className="form-field">
            <label htmlFor="sn">Nama Lengkap</label>
            <input id="sn" required value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="se">Alamat Email</label>
            <input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="sp">Password</label>
            <input
              id="sp"
              type="password"
              required={modalMode === 'add'}
              minLength={6}
              autoComplete="new-password"
              placeholder={modalMode === 'edit' ? 'Kosongkan jika tidak diganti' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
        title="Hapus Admin"
        message={`Yakin hapus akun admin "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
