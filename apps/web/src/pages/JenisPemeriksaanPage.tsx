import { useMemo, useState, type FormEvent } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiPatch, apiPost } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import '../components/ui/ui.css';

interface Jenis {
  readonly id: string;
  readonly nama: string;
  readonly harga: string | null;
  readonly detailLayanan: string | null;
}

export function JenisPemeriksaanPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<Jenis>('/api/jenis-pemeriksaan', queryParams);
  const reload = useMutationReload(reloadList);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [detail, setDetail] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const stats = useMemo(() => {
    const withHarga = items.filter((j) => j.harga !== null).length;
    const totalHarga = items.reduce((sum, j) => sum + Number(j.harga ?? 0), 0);
    return { withHarga, totalHarga };
  }, [items]);

  function openAdd() {
    setNama('');
    setHarga('');
    setDetail('');
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(j: Jenis) {
    setEditingId(j.id);
    setNama(j.nama);
    setHarga(j.harga ?? '');
    setDetail(j.detailLayanan ?? '');
    setModalMode('edit');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!harga.trim()) {
      setError('Harga layanan wajib diisi');
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      nama,
      harga: Number(harga),
      detailLayanan: detail.trim() || undefined,
    };
    try {
      if (modalMode === 'add') {
        await apiPost('/api/jenis-pemeriksaan', body);
      } else if (editingId) {
        await apiPatch(`/api/jenis-pemeriksaan/${editingId}`, body);
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
      await apiDelete(`/api/jenis-pemeriksaan/${deleteTarget.id}`);
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
        title="Manajemen Jenis Pemeriksaan"
        subtitle="Jenis layanan radiologi beserta harga dan detail layanan"
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Jenis
          </button>
        }
        metrics={[
          {
            label: 'Total jenis',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'tag',
          },
          {
            label: 'Sudah ada harga',
            value: String(stats.withHarga),
            tone: 'green',
            iconKind: 'check',
          },
          {
            label: 'Akumulasi tarif',
            value: formatRupiah(String(stats.totalHarga)),
            tone: 'violet',
            iconKind: 'currency',
          },
        ]}
        searchPlaceholder="Cari nama pemeriksaan…"
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
              <th>Nama pemeriksaan</th>
              <th>Harga</th>
              <th>Detail layanan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4}>Belum ada jenis pemeriksaan.</td>
              </tr>
            ) : (
              items.map((j) => (
                <tr key={j.id}>
                  <td>{j.nama}</td>
                  <td>{j.harga ? formatRupiah(j.harga) : 'Belum diatur'}</td>
                  <td className="cell-wrap">{j.detailLayanan ?? '—'}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(j)}
                      onDelete={() => setDeleteTarget({ id: j.id, label: j.nama })}
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
        title={modalMode === 'add' ? 'Tambah Jenis Pemeriksaan' : 'Ubah Jenis Pemeriksaan'}
        onClose={() => setModalMode(null)}
      >
        <form onSubmit={(e) => void onSubmit(e)} className="form-grid">
          <div className="form-field form-grid--full">
            <label htmlFor="jn">Nama pemeriksaan</label>
            <input id="jn" required value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="jh">Harga (Rp)</label>
            <input
              id="jh"
              type="number"
              min="0"
              required
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
            />
          </div>
          <div className="form-field form-grid--full">
            <label htmlFor="jd">Detail / isi layanan</label>
            <textarea
              id="jd"
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Contoh: Foto thorax PA + interpretasi"
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
        title="Hapus jenis pemeriksaan"
        message={`Yakin hapus "${deleteTarget?.label ?? ''}"?`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
