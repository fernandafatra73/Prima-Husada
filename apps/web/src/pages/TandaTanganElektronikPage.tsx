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

interface TandaTanganElektronikItem {
  readonly id: string;
  readonly nama: string;
  readonly alamat: string | null;
  readonly logoTandaTangan: string | null;
}

export function TandaTanganElektronikPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<TandaTanganElektronikItem>('/api/tanda-tangan-elektronik', queryParams);
  const reload = useMutationReload(reloadList);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [logoTandaTangan, setLogoTandaTangan] = useState<string | null>(null);

  function resetForm() {
    setNama('');
    setAlamat('');
    setLogoTandaTangan(null);
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setModalMode('add');
  }

  function openEdit(item: TandaTanganElektronikItem) {
    setEditingId(item.id);
    setNama(item.nama);
    setAlamat(item.alamat ?? '');
    setLogoTandaTangan(item.logoTandaTangan);
    setModalMode('edit');
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoTandaTangan(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { nama, alamat, logoTandaTangan };
    try {
      if (modalMode === 'add') {
        await apiPost('/api/tanda-tangan-elektronik', body);
      } else if (editingId) {
        await apiPatch(`/api/tanda-tangan-elektronik/${editingId}`, body);
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
      await apiDelete(`/api/tanda-tangan-elektronik/${deleteTarget.id}`);
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
      <div className="form-field form-field--full">
        <label htmlFor="ttd-nama">Nama</label>
        <input id="ttd-nama" required value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>
      <div className="form-field form-field--full">
        <label htmlFor="ttd-alamat">Alamat</label>
        <input id="ttd-alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
      </div>
      <div className="form-field form-field--full">
        <label htmlFor="ttd-logo">Logo Tanda Tangan</label>
        <input id="ttd-logo" type="file" accept="image/*" onChange={handleLogoFileChange} />
        {logoTandaTangan && (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={logoTandaTangan}
              alt="Preview tanda tangan"
              style={{ width: 120, height: 64, objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '6px', background: '#fff' }}
            />
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setLogoTandaTangan(null)}
              style={{ border: '1px solid var(--color-border)' }}
            >
              Hapus Logo
            </button>
          </div>
        )}
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
        title="Manajemen Tanda Tangan Elektronik"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Tanda Tangan
          </button>
        }
        metrics={[
          {
            label: 'Total tanda tangan',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'clipboard',
          },
        ]}
        searchPlaceholder="Cari nama, alamat…"
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
              <th>Logo</th>
              <th>Nama</th>
              <th>Alamat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4}>Belum ada tanda tangan elektronik.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.logoTandaTangan ? (
                      <img
                        src={item.logoTandaTangan}
                        alt={item.nama}
                        style={{ width: 80, height: 44, objectFit: 'contain', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{item.nama}</td>
                  <td>{item.alamat ?? '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleteTarget({ id: item.id, label: item.nama })}
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
        title="Tambah Tanda Tangan Elektronik"
        onClose={() => setModalMode(null)}
      >
        {form}
      </Modal>
      <Modal
        open={modalMode === 'edit'}
        title="Ubah Tanda Tangan Elektronik"
        onClose={() => setModalMode(null)}
      >
        {form}
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Hapus tanda tangan"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
