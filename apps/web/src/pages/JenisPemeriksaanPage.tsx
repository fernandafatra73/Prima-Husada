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

function getSharingInfo(nama: string): { readonly amountText: string; readonly note: string } {
  const lower = (nama || '').toLowerCase();
  if (lower.includes('lumbosacral')) {
    return { amountText: 'Rp 88.000', note: 'Lumbosacral' };
  }
  if (lower.includes('shoulder')) {
    return { amountText: 'Rp 58.000', note: 'Shoulder Joint' };
  }
  if (lower.includes('thorak') || lower.includes('thorax')) {
    return { amountText: 'Rp 18.000 – Rp 35.000', note: 'Sesuai Usia & Dokter' };
  }
  return { amountText: 'Rp 50.000', note: 'Standar Dokter' };
}

export function JenisPemeriksaanPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<Jenis>('/api/jenis-pemeriksaan', queryParams);
  const reload = useMutationReload(reloadList);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
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
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(j: Jenis) {
    setEditingId(j.id);
    setNama(j.nama);
    setHarga(j.harga ?? '');
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
        title="Manajemen Jenis Pemeriksaan, Harga & Sharing"
        subtitle="Daftar jenis pemeriksaan radiologi beserta tarif harga dan ketentuan sharing dokter"
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
              <th style={{ width: '60px', textAlign: 'center' }}>No</th>
              <th>Jenis Pemeriksaan</th>
              <th style={{ textAlign: 'right' }}>Harga</th>
              <th style={{ textAlign: 'right' }}>Sharing (Otomatis)</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  Belum ada jenis pemeriksaan.
                </td>
              </tr>
            ) : (
              items.map((j, index) => {
                const sharingInfo = getSharingInfo(j.nama);
                return (
                  <tr key={j.id}>
                    <td style={{ textAlign: 'center' }}>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td style={{ fontWeight: 500, color: '#0f172a' }}>{j.nama}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {j.harga ? formatRupiah(j.harga) : 'Belum diatur'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#0284c7' }}>
                        {sharingInfo.amountText}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {sharingInfo.note}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <TableRowActions
                        onEdit={() => openEdit(j)}
                        onDelete={() => setDeleteTarget({ id: j.id, label: j.nama })}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ListPageShell>

      <Modal
        open={modalMode !== null}
        title={modalMode === 'add' ? 'Tambah Jenis Pemeriksaan' : 'Ubah Jenis Pemeriksaan, Harga & Sharing'}
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
          <div className="form-field">
            <label>Ketentuan Sharing Dokter</label>
            <div
              style={{
                padding: '0.6rem 0.8rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                color: '#0369a1',
                fontWeight: 600,
              }}
            >
              {nama ? getSharingInfo(nama).amountText : 'Rp 50.000'}{' '}
              <span style={{ fontWeight: 400, color: '#0284c7', fontSize: '0.85em' }}>
                ({nama ? getSharingInfo(nama).note : 'Standar Dokter'})
              </span>
            </div>
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
