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

interface KaryawanItem {
  readonly id: string;
  readonly nama: string;
  readonly jabatan: string | null;
  readonly noTelepon: string | null;
  readonly alamat: string | null;
}

const tableInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  borderRadius: 'var(--radius-button)',
  border: '1px solid var(--color-border)',
  background: '#fff',
  color: 'var(--color-text-body)',
};

const emptyForm = {
  nama: '',
  jabatan: '',
  noTelepon: '',
  alamat: '',
};

interface KaryawanPageProps {
  readonly departemen: 'RADIOLOGI' | 'LABORATORIUM';
}

export function KaryawanPage({ departemen }: KaryawanPageProps) {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({ departemen }, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<KaryawanItem>('/api/karyawan', queryParams);
  const reload = useMutationReload(reloadList);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<KaryawanItem | null>(null);
  const [deleting, setDeleting] = useState<KaryawanItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const title = departemen === 'RADIOLOGI' ? 'Daftar Karyawan Radiologi' : 'Daftar Karyawan Laboratorium';

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(item: KaryawanItem) {
    setForm({
      nama: item.nama,
      jabatan: item.jabatan ?? '',
      noTelepon: item.noTelepon ?? '',
      alamat: item.alamat ?? '',
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
        nama: form.nama,
        jabatan: form.jabatan || undefined,
        noTelepon: form.noTelepon || undefined,
        alamat: form.alamat || undefined,
        departemen,
      };
      if (editing) {
        await apiPatch(`/api/karyawan/${editing.id}`, body);
      } else {
        await apiPost('/api/karyawan', body);
      }
      closeModal();
      await reload({ resetPage: !editing });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data karyawan');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/karyawan/${deleting.id}`);
      setDeleting(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data karyawan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ListPageShell
        title={title}
        metrics={[
          {
            label: 'Total karyawan',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'users',
          },
        ]}
        searchPlaceholder="Cari nama karyawan..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        action={
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + Tambah Karyawan
          </button>
        }
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Jabatan</th>
              <th>No. Telepon</th>
              <th>Alamat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  Belum ada data karyawan.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.nama}</td>
                  <td>{item.jabatan || '—'}</td>
                  <td>{item.noTelepon || '—'}</td>
                  <td>{item.alamat || '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleting(item)}
                      editLabel="Ubah karyawan"
                      deleteLabel="Hapus karyawan"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListPageShell>

      {(createOpen || editing) && (
        <Modal open={true} title={editing ? 'Ubah Karyawan' : 'Tambah Karyawan'} onClose={closeModal}>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <table className="data-table" style={{ marginBottom: '1rem' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, width: '35%' }}>
                    <label htmlFor="kw-nama">Nama Karyawan *</label>
                  </td>
                  <td>
                    <input
                      id="kw-nama"
                      required
                      style={tableInputStyle}
                      value={form.nama}
                      onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    <label htmlFor="kw-jabatan">Jabatan</label>
                  </td>
                  <td>
                    <input
                      id="kw-jabatan"
                      style={tableInputStyle}
                      value={form.jabatan}
                      onChange={(e) => setForm((f) => ({ ...f, jabatan: e.target.value }))}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    <label htmlFor="kw-telepon">No. Telepon</label>
                  </td>
                  <td>
                    <input
                      id="kw-telepon"
                      style={tableInputStyle}
                      value={form.noTelepon}
                      onChange={(e) => setForm((f) => ({ ...f, noTelepon: e.target.value }))}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    <label htmlFor="kw-alamat">Alamat</label>
                  </td>
                  <td>
                    <input
                      id="kw-alamat"
                      style={tableInputStyle}
                      value={form.alamat}
                      onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
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
        title="Hapus Karyawan"
        message={`Yakin hapus data karyawan "${deleting?.nama ?? ''}"?`}
        loading={submitting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </>
  );
}
