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
import { formatDateShort } from '../lib/format.ts';
import { generateDaftarTelponCardBlob } from '../pdf/printDaftarTelponCard.tsx';
import '../components/ui/ui.css';

interface DaftarTelponItem {
  readonly id: string;
  readonly nama: string;
  readonly telpon: string | null;
  readonly admin: string | null;
  readonly password: string | null;
  readonly noKontrak: string | null;
  readonly namaInstansi: string | null;
}

const emptyForm = {
  nama: '',
  telpon: '',
  admin: '',
  password: '',
  noKontrak: '',
  namaInstansi: '',
};

export function DaftarTelponPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<DaftarTelponItem>('/api/daftar-telpon', queryParams);
  const reload = useMutationReload(reloadList);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [printingId, setPrintingId] = useState<string | null>(null);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(item: DaftarTelponItem) {
    setEditingId(item.id);
    setForm({
      nama: item.nama,
      telpon: item.telpon ?? '',
      admin: item.admin ?? '',
      password: item.password ?? '',
      noKontrak: item.noKontrak ?? '',
      namaInstansi: item.namaInstansi ?? '',
    });
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modalMode === 'add') {
        await apiPost('/api/daftar-telpon', form);
      } else if (editingId) {
        await apiPatch(`/api/daftar-telpon/${editingId}`, form);
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
      await apiDelete(`/api/daftar-telpon/${deleteTarget.id}`);
      setDeleteTarget(null);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handlePrint(item: DaftarTelponItem) {
    setPrintingId(item.id);
    try {
      const blob = await generateDaftarTelponCardBlob({
        tanggalCetak: formatDateShort(new Date().toISOString()),
        nama: item.nama,
        telpon: item.telpon ?? '',
        admin: item.admin ?? '',
        password: item.password ?? '',
        noKontrak: item.noKontrak ?? '',
        namaInstansi: item.namaInstansi ?? '',
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error('Gagal membuat preview PDF daftar telpon:', err);
    } finally {
      setPrintingId(null);
    }
  }

  return (
    <>
      <ListPageShell
        title="Daftar Telpon"
        subtitle="Kontak, admin, dan kredensial instansi/vendor yang bekerja sama dengan klinik"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Kontak
          </button>
        }
        metrics={[
          {
            label: 'Total kontak',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'clipboard',
          },
        ]}
        searchPlaceholder="Cari nama, telpon, instansi, no kontrak…"
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
              <th>Telpon</th>
              <th>Admin</th>
              <th>No Kontrak</th>
              <th>Nama Instansi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>Belum ada data.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama}</td>
                  <td>{item.telpon ?? '—'}</td>
                  <td>{item.admin ?? '—'}</td>
                  <td>{item.noKontrak ?? '—'}</td>
                  <td>{item.namaInstansi ?? '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleteTarget({ id: item.id, label: item.nama })}
                      onPrint={() => void handlePrint(item)}
                      printLabel={printingId === item.id ? 'Membuat PDF…' : 'Cetak / Preview'}
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
        title={modalMode === 'add' ? 'Tambah Kontak' : 'Ubah Kontak'}
        onClose={() => setModalMode(null)}
      >
        <form onSubmit={(e) => void onSubmit(e)} className="form-grid">
          <div className="form-field form-field--full">
            <label htmlFor="dt-nama">Nama</label>
            <input id="dt-nama" required value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="dt-telpon">Telpon</label>
            <input id="dt-telpon" value={form.telpon} onChange={(e) => setForm((f) => ({ ...f, telpon: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="dt-admin">Admin</label>
            <input id="dt-admin" value={form.admin} onChange={(e) => setForm((f) => ({ ...f, admin: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="dt-password">Password</label>
            <input id="dt-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="form-field">
            <label htmlFor="dt-kontrak">No Kontrak</label>
            <input id="dt-kontrak" value={form.noKontrak} onChange={(e) => setForm((f) => ({ ...f, noKontrak: e.target.value }))} />
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="dt-instansi">Nama Instansi</label>
            <input id="dt-instansi" value={form.namaInstansi} onChange={(e) => setForm((f) => ({ ...f, namaInstansi: e.target.value }))} />
          </div>
          <ModalFormFooter onCancel={() => setModalMode(null)} submitLabel="Simpan" loading={saving} />
        </form>
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Hapus kontak"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
