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

interface KaryawanKlinik {
  readonly id: string;
  readonly nama: string;
  readonly spesialisasi: string | null;
  readonly noTelepon: string | null;
  readonly namaBank: string | null;
  readonly noRekening: string | null;
}

export function KaryawanKlinikPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<KaryawanKlinik>('/api/karyawan-klinik', queryParams);
  const reload = useMutationReload(reloadList);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [nama, setNama] = useState('');
  const [spesialisasi, setSpesialisasi] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [namaBank, setNamaBank] = useState('');
  const [noRekening, setNoRekening] = useState('');

  function resetForm() {
    setNama('');
    setSpesialisasi('');
    setNoTelepon('');
    setNamaBank('');
    setNoRekening('');
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setModalMode('add');
  }

  function openEdit(d: KaryawanKlinik) {
    setEditingId(d.id);
    setNama(d.nama);
    setSpesialisasi(d.spesialisasi ?? '');
    setNoTelepon(d.noTelepon ?? '');
    setNamaBank(d.namaBank ?? '');
    setNoRekening(d.noRekening ?? '');
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { nama, spesialisasi, noTelepon, namaBank, noRekening };
    try {
      if (modalMode === 'add') {
        await apiPost('/api/karyawan-klinik', body);
      } else if (editingId) {
        await apiPatch(`/api/karyawan-klinik/${editingId}`, body);
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
      await apiDelete(`/api/karyawan-klinik/${deleteTarget.id}`);
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
        <label htmlFor="kkn">Nama</label>
        <input id="kkn" required value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="kks">Spesialisasi / Jabatan</label>
        <input id="kks" value={spesialisasi} onChange={(e) => setSpesialisasi(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="kkt">No HP</label>
        <input id="kkt" value={noTelepon} onChange={(e) => setNoTelepon(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="kkb">Nama Bank</label>
        <input id="kkb" value={namaBank} onChange={(e) => setNamaBank(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="kkr">Nomor Rekening</label>
        <input id="kkr" value={noRekening} onChange={(e) => setNoRekening(e.target.value)} />
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
        title="Manajemen Karyawan Klinik"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Karyawan
          </button>
        }
        metrics={[
          {
            label: 'Total karyawan',
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
              <th>Spesialisasi / Jabatan</th>
              <th>HP</th>
              <th>Nama Bank</th>
              <th>Nomor Rekening</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>Belum ada karyawan.</td>
              </tr>
            ) : (
              items.map((d) => (
                <tr key={d.id}>
                  <td>{d.nama}</td>
                  <td>{d.spesialisasi ?? '—'}</td>
                  <td>{d.noTelepon ?? '—'}</td>
                  <td>{d.namaBank ?? '—'}</td>
                  <td>{d.noRekening ?? '—'}</td>
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
        title="Tambah Karyawan Klinik"
        onClose={() => setModalMode(null)}
      >
        {form}
      </Modal>
      <Modal
        open={modalMode === 'edit'}
        title="Ubah Data Karyawan Klinik"
        onClose={() => setModalMode(null)}
      >
        {form}
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Hapus karyawan"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
