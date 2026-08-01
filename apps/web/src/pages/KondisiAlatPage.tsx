import { useCallback, useEffect, useState } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api.ts';
import '../components/ui/ui.css';

interface KondisiAlatItem {
  readonly id: string;
  readonly namaPasien: string;
  readonly kv: string;
  readonly sekon: string;
  readonly mAs: string;
  readonly beratBadan: string | null;
  readonly tanggal: string;
}

interface DuplikatRadiologiOption {
  readonly id: string;
  readonly nama: string;
  readonly regCode: string;
}

const KV_OPTIONS = [40, 44, 45, 48, 50, 51, 55, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120];
const SEKON_OPTIONS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.125, 0.16, 0.2, 0.25, 0.32, 0.4, 0.5, 0.63, 0.8, 1];
const MAS_OPTIONS = [0.001, 0.002, 0.005, 0.008, 0.01, 0.02, 0.04, 0.05, 0.08, 0.1, 0.125, 0.16, 0.2, 0.25, 0.32, 0.4];

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const emptyForm = {
  namaPasien: '',
  kv: '',
  sekon: '',
  mAs: '',
  beratBadan: '',
  tanggal: new Date().toISOString().split('T')[0]!,
};

export function KondisiAlatPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<KondisiAlatItem>('/api/kondisi-alat', queryParams);
  const reload = useMutationReload(reloadList);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<KondisiAlatItem | null>(null);
  const [deleting, setDeleting] = useState<KondisiAlatItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [pasienOptions, setPasienOptions] = useState<DuplikatRadiologiOption[]>([]);

  const loadPasienOptions = useCallback(async () => {
    try {
      const res = await apiGet<{ items: DuplikatRadiologiOption[] }>(
        '/api/pasien-duplikat?modul=RADIOLOGI&limit=500',
      );
      setPasienOptions(res.items);
    } catch {
      setPasienOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadPasienOptions();
  }, [loadPasienOptions]);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(item: KondisiAlatItem) {
    setForm({
      namaPasien: item.namaPasien,
      kv: item.kv,
      sekon: item.sekon,
      mAs: item.mAs,
      beratBadan: item.beratBadan ?? '',
      tanggal: item.tanggal.split('T')[0]!,
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
        namaPasien: form.namaPasien,
        kv: Number(form.kv),
        sekon: Number(form.sekon),
        mAs: Number(form.mAs),
        beratBadan: form.beratBadan ? Number(form.beratBadan) : undefined,
        tanggal: form.tanggal,
      };
      if (editing) {
        await apiPatch(`/api/kondisi-alat/${editing.id}`, body);
      } else {
        await apiPost('/api/kondisi-alat', body);
      }
      closeModal();
      await reload({ resetPage: !editing });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kondisi alat');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/kondisi-alat/${deleting.id}`);
      setDeleting(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kondisi alat');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Kondisi Alat"
        subtitle="Catatan faktor eksposi (KV, Sekond, mAs) per pasien radiologi"
        metrics={[
          {
            label: 'Total data',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'clipboard',
          },
        ]}
        searchPlaceholder="Cari nama pasien..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        action={
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + Tambah Kondisi Alat
          </button>
        }
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Pasien</th>
              <th>KV</th>
              <th>Sekond</th>
              <th>mAs</th>
              <th>Berat Badan</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  Belum ada data kondisi alat.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.namaPasien}</td>
                  <td>{item.kv}</td>
                  <td>{item.sekon}</td>
                  <td>{item.mAs}</td>
                  <td>{item.beratBadan ? `${item.beratBadan} kg` : '—'}</td>
                  <td>{formatDateDisplay(item.tanggal)}</td>
                  <td>
                    <TableRowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleting(item)}
                      editLabel="Ubah kondisi alat"
                      deleteLabel="Hapus kondisi alat"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListPageShell>

      {(createOpen || editing) && (
        <Modal
          open={true}
          title={editing ? 'Ubah Kondisi Alat' : 'Tambah Kondisi Alat'}
          onClose={closeModal}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="ka-nama">Nama Pasien *</label>
              <select
                id="ka-nama"
                required
                value={form.namaPasien}
                onChange={(e) => setForm((f) => ({ ...f, namaPasien: e.target.value }))}
              >
                <option value="">-- Pilih Pasien (dari Duplikat Radiologi) --</option>
                {pasienOptions.map((p) => (
                  <option key={p.id} value={p.nama}>
                    {p.nama} ({p.regCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="ka-tanggal">Tanggal *</label>
              <input
                id="ka-tanggal"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="ka-kv">KV *</label>
              <select
                id="ka-kv"
                required
                value={form.kv}
                onChange={(e) => setForm((f) => ({ ...f, kv: e.target.value }))}
              >
                <option value="">-- Pilih KV --</option>
                {KV_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v} KV
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="ka-sekon">Sekond *</label>
              <select
                id="ka-sekon"
                required
                value={form.sekon}
                onChange={(e) => setForm((f) => ({ ...f, sekon: e.target.value }))}
              >
                <option value="">-- Pilih Sekond --</option>
                {SEKON_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v} s
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="ka-mas">mAs *</label>
              <select
                id="ka-mas"
                required
                value={form.mAs}
                onChange={(e) => setForm((f) => ({ ...f, mAs: e.target.value }))}
              >
                <option value="">-- Pilih mAs --</option>
                {MAS_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v} mAs
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="ka-berat">Berat Badan (kg)</label>
              <input
                id="ka-berat"
                type="number"
                min="0"
                step="0.1"
                value={form.beratBadan}
                onChange={(e) => setForm((f) => ({ ...f, beratBadan: e.target.value }))}
              />
            </div>
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
        title="Hapus Kondisi Alat"
        message={`Yakin hapus data kondisi alat "${deleting?.namaPasien ?? ''}"?`}
        loading={submitting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </>
  );
}
