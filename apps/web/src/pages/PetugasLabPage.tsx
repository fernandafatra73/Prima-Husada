import { useState } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiPatch, apiPost } from '../lib/api.ts';
import '../components/ui/ui.css';

interface PetugasLabItem {
  readonly id: string;
  readonly nama: string;
  readonly nip: string | null;
  readonly noTelepon: string | null;
  readonly createdAt: string;
}

export function PetugasLabPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<PetugasLabItem>('/api/petugas-lab', queryParams);
  const reload = useMutationReload(reloadList);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PetugasLabItem | null>(null);
  const [deleting, setDeleting] = useState<PetugasLabItem | null>(null);

  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setNama('');
    setNip('');
    setNoTelepon('');
    setCreateOpen(true);
  }

  function openEdit(item: PetugasLabItem) {
    setEditing(item);
    setNama(item.nama);
    setNip(item.nip ?? '');
    setNoTelepon(item.noTelepon ?? '');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/api/petugas-lab', {
        nama: nama.trim(),
        nip: nip.trim() || undefined,
        noTelepon: noTelepon.trim() || undefined,
      });
      setCreateOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat analis');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !nama.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPatch(`/api/petugas-lab/${editing.id}`, {
        nama: nama.trim(),
        nip: nip.trim() || undefined,
        noTelepon: noTelepon.trim() || undefined,
      });
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah analis');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/petugas-lab/${deleting.id}`);
      setDeleting(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus analis');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ListPageShell
      title="Manajemen Analis Laboratorium"
      metrics={[
        {
          label: 'Total Analis',
          value: String(pagination.total),
          tone: 'blue',
          iconKind: 'users',
        },
      ]}
      searchPlaceholder="Cari nama, NIP, no. telepon..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void reload()}
      error={error}
      loading={loading}
      pagination={pagination}
      onPageChange={setPage}
      action={
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Tambah Analis
        </button>
      }
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Analis</th>
            <th>NIP / SIP</th>
            <th>No. Telepon</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                Belum ada data analis laboratorium.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                <td>
                  <strong>{item.nama}</strong>
                </td>
                <td>{item.nip || '—'}</td>
                <td>{item.noTelepon || '—'}</td>
                <td>
                  <TableRowActions
                    onEdit={() => openEdit(item)}
                    onDelete={() => setDeleting(item)}
                    editLabel="Ubah analis"
                    deleteLabel="Hapus analis"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {createOpen && (
        <Modal open={true} title="Tambah Analis Laboratorium" onClose={() => setCreateOpen(false)}>
          <form onSubmit={(e) => void handleCreate(e)} className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="petugas-nama">Nama Analis *</label>
              <input
                id="petugas-nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: SUPATMI, Amd.A.K."
              />
            </div>

            <div className="form-field">
              <label htmlFor="petugas-nip">NIP / SIP (Opsional)</label>
              <input
                id="petugas-nip"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 197501022009022002"
              />
            </div>

            <div className="form-field">
              <label htmlFor="petugas-telepon">No. Telepon (Opsional)</label>
              <input
                id="petugas-telepon"
                type="text"
                value={noTelepon}
                onChange={(e) => setNoTelepon(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
              />
            </div>

            <ModalFormFooter
              onCancel={() => setCreateOpen(false)}
              submitLabel="Simpan"
              loading={submitting}
            />
          </form>
        </Modal>
      )}

      {editing && (
        <Modal open={true} title="Ubah Analis Laboratorium" onClose={() => setEditing(null)}>
          <form onSubmit={(e) => void handleUpdate(e)} className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="edit-petugas-nama">Nama Analis *</label>
              <input
                id="edit-petugas-nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-petugas-nip">NIP / SIP</label>
              <input
                id="edit-petugas-nip"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-petugas-telepon">No. Telepon</label>
              <input
                id="edit-petugas-telepon"
                type="text"
                value={noTelepon}
                onChange={(e) => setNoTelepon(e.target.value)}
              />
            </div>

            <ModalFormFooter
              onCancel={() => setEditing(null)}
              submitLabel="Simpan Perubahan"
              loading={submitting}
            />
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          open={true}
          title="Hapus Analis Laboratorium"
          message={`Apakah Anda yakin ingin menghapus analis "${deleting.nama}"?`}
          confirmLabel="Hapus"
          onConfirm={() => void handleDeleteConfirm()}
          onClose={() => setDeleting(null)}
          loading={submitting}
        />
      )}
    </ListPageShell>
  );
}
