import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import {
  useListQueryParams,
  useListSearch,
} from '../hooks/useListQueryParams.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api.ts';
import { formatRupiah, formatUmurTahun } from '../lib/format.ts';
import { loadLogoDataUrl } from '../pdf/loadLogoDataUrl.ts';
import {
  LogbookPasienReportDocument,
  type LogbookPasienReportData,
} from '../pdf/LogbookPasienReportDocument.tsx';
import '../components/ui/ui.css';

interface DuplikatRadiologiItem {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur: number;
  readonly alamat: string | null;
  readonly pengirimNama: string;
  readonly pemeriksaanNama: string;
  readonly createdAt: string;
}

interface KondisiAlatItem {
  readonly id: string;
  readonly namaPasien: string;
  readonly kv: string;
  readonly sekon: string;
  readonly mAs: string;
  readonly beratBadan: string | null;
  readonly tanggal: string;
}

interface DokterItem {
  readonly id: string;
  readonly nama: string;
}

interface JenisItem {
  readonly id: string;
  readonly nama: string;
  readonly harga: string | null;
}

const emptyAddForm = {
  nama: '',
  tanggalLahir: '',
  noTelepon: '',
  alamat: '',
  pengirimId: '',
};

const BERAT_BADAN_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];

const KV_OPTIONS = [40, 44, 45, 48, 50, 51, 55, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120];
const SEKON_OPTIONS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.125, 0.16, 0.2, 0.25, 0.32, 0.4, 0.5, 0.63, 0.8, 1];
const MAS_OPTIONS = [0.001, 0.002, 0.005, 0.008, 0.01, 0.02, 0.04, 0.05, 0.08, 0.1, 0.125, 0.16, 0.2, 0.25, 0.32, 0.4];

function isThoraxExam(pemeriksaan: string): boolean {
  return /thora/i.test(pemeriksaan);
}

function PilihanTable({
  label,
  unit,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly unit: string;
  readonly options: readonly number[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="form-field form-field--full">
      <label style={{ fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>{label}</label>
      <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)' }}>
        <table className="data-table" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>Pilih</th>
              <th>Nilai ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => {
              const optStr = String(opt);
              const checked = value === optStr;
              return (
                <tr
                  key={opt}
                  onClick={() => onChange(checked ? '' : optStr)}
                  style={{ cursor: 'pointer', background: checked ? '#eff6ff' : 'transparent' }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onChange(checked ? '' : optStr)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{opt} {unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function normalizeNama(nama: string): string {
  return nama.trim().toLowerCase();
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

export function LogbookPasienPage() {
  const { search, setSearch } = useListSearch();
  const [monthOnly, setMonthOnly] = useState(false);

  const dateParams = useMemo(() => {
    if (!monthOnly) return {};
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const fy = firstDay.getFullYear();
    const fm = String(firstDay.getMonth() + 1).padStart(2, '0');
    const fd = String(firstDay.getDate()).padStart(2, '0');
    const ty = now.getFullYear();
    const tm = String(now.getMonth() + 1).padStart(2, '0');
    const td = String(now.getDate()).padStart(2, '0');
    return { startDate: `${fy}-${fm}-${fd}`, endDate: `${ty}-${tm}-${td}` };
  }, [monthOnly]);

  const queryParams = useListQueryParams(
    { modul: 'RADIOLOGI', ...(dateParams as Record<string, string>) },
    search,
  );
  const { items, pagination, setPage, loading, error, setError, reload } =
    usePaginatedList<DuplikatRadiologiItem>(
      '/api/pasien-duplikat',
      queryParams,
    );

  const [dokterList, setDokterList] = useState<DokterItem[]>([]);
  const [jenisList, setJenisList] = useState<JenisItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addSelectedJenis, setAddSelectedJenis] = useState<string[]>([]);
  const [addSaving, setAddSaving] = useState(false);

  const loadRegistrationMasters = useCallback(async () => {
    try {
      const [dokterRes, jenisRes] = await Promise.all([
        apiGet<{ items: DokterItem[] }>('/api/dokter?limit=200'),
        apiGet<{ items: JenisItem[] }>('/api/jenis-pemeriksaan?limit=200'),
      ]);
      setDokterList(dokterRes.items);
      setJenisList(jenisRes.items.filter((j) => j.harga !== null));
    } catch {
      setDokterList([]);
      setJenisList([]);
    }
  }, []);

  useEffect(() => {
    void loadRegistrationMasters();
  }, [loadRegistrationMasters]);

  const addTotalHarga = useMemo(
    () =>
      jenisList
        .filter((j) => addSelectedJenis.includes(j.id))
        .reduce((sum, j) => sum + Number(j.harga ?? 0), 0),
    [jenisList, addSelectedJenis],
  );

  function openAdd() {
    setAddForm(emptyAddForm);
    setAddSelectedJenis([]);
    setError(null);
    setAddOpen(true);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (addSelectedJenis.length === 0) {
      setError('Pilih minimal satu jenis pemeriksaan');
      return;
    }
    setAddSaving(true);
    setError(null);
    try {
      await apiPost('/api/pasien', {
        nama: addForm.nama,
        tanggalLahir: addForm.tanggalLahir,
        noTelepon: addForm.noTelepon || undefined,
        alamat: addForm.alamat || undefined,
        pengirimId: addForm.pengirimId,
        jenisPemeriksaanIds: addSelectedJenis,
        asalModul: 'RADIOLOGI',
      });
      setAddOpen(false);
      await reload({ resetPage: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftarkan pasien');
    } finally {
      setAddSaving(false);
    }
  }

  const [kondisiList, setKondisiList] = useState<KondisiAlatItem[]>([]);

  const loadKondisiList = useCallback(async () => {
    try {
      const res = await apiGet<{ items: KondisiAlatItem[] }>(
        '/api/kondisi-alat?limit=1000',
      );
      setKondisiList(res.items);
    } catch {
      setKondisiList([]);
    }
  }, []);

  useEffect(() => {
    void loadKondisiList();
  }, [loadKondisiList]);

  const kondisiMap = useMemo(() => {
    const map = new Map<string, KondisiAlatItem>();
    for (const k of kondisiList) {
      const key = normalizeNama(k.namaPasien);
      if (!map.has(key)) map.set(key, k);
    }
    return map;
  }, [kondisiList]);

  const [editItem, setEditItem] = useState<DuplikatRadiologiItem | null>(null);
  const [editKv, setEditKv] = useState('');
  const [editSekon, setEditSekon] = useState('');
  const [editMas, setEditMas] = useState('');
  const [editBeratBadan, setEditBeratBadan] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [printItem, setPrintItem] = useState<DuplikatRadiologiItem | null>(
    null,
  );
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const editIsThoraxOver10 =
    editItem !== null && isThoraxExam(editItem.pemeriksaanNama || '') && editItem.umur >= 10;

  function openEdit(item: DuplikatRadiologiItem) {
    const matched = kondisiMap.get(normalizeNama(item.nama));
    setEditItem(item);
    setEditError(null);

    if (matched) {
      setEditKv(matched.kv);
      setEditSekon(matched.sekon);
      setEditMas(matched.mAs);
      setEditBeratBadan(matched.beratBadan ?? '');
      return;
    }

    // Belum ada data tersimpan — isi otomatis nilai standar untuk pemeriksaan
    // Thorax berdasarkan usia pasien (default klinik, tetap bisa diubah).
    if (isThoraxExam(item.pemeriksaanNama || '')) {
      if (item.umur < 10) {
        setEditKv('45');
        setEditSekon('0.04');
        setEditMas('3.2');
        setEditBeratBadan('6');
        return;
      }
      setEditKv('51');
      setEditSekon('0.05');
      setEditMas('');
      setEditBeratBadan('');
      return;
    }

    setEditKv('');
    setEditSekon('');
    setEditMas('');
    setEditBeratBadan('');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const matched = kondisiMap.get(normalizeNama(editItem.nama));
      const body = {
        namaPasien: editItem.nama,
        kv: Number(editKv),
        sekon: Number(editSekon),
        mAs: Number(editMas),
        beratBadan: editBeratBadan ? Number(editBeratBadan) : undefined,
        tanggal: editItem.createdAt,
      };
      if (matched) {
        await apiPatch(`/api/kondisi-alat/${matched.id}`, body);
      } else {
        await apiPost('/api/kondisi-alat', body);
      }
      setEditItem(null);
      await loadKondisiList();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Gagal menyimpan kondisi alat',
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteKondisi(item: DuplikatRadiologiItem) {
    const matched = kondisiMap.get(normalizeNama(item.nama));
    if (!matched) return;
    if (!confirm(`Hapus data KV/Sekond/mAs/Berat Badan untuk "${item.nama}"?`)) return;
    try {
      await apiDelete(`/api/kondisi-alat/${matched.id}`);
      await loadKondisiList();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Gagal menghapus kondisi alat',
      );
    }
  }

  function toReportItem(item: DuplikatRadiologiItem, no: number) {
    const matched = kondisiMap.get(normalizeNama(item.nama));
    return {
      no,
      nama: item.nama,
      usia: formatUmurTahun(item.umur),
      alamat: item.alamat || '—',
      pemeriksaan: item.pemeriksaanNama || '—',
      pengirim: item.pengirimNama || '—',
      tanggal: formatDateDisplay(item.createdAt),
      kv: matched?.kv ?? '—',
      sekon: matched?.sekon ?? '—',
      mAs: matched?.mAs ?? '—',
      beratBadan: matched?.beratBadan ? `${matched.beratBadan} kg` : '—',
    };
  }

  async function buildReportData(
    list: readonly DuplikatRadiologiItem[],
  ): Promise<LogbookPasienReportData> {
    const logoSrc = await loadLogoDataUrl().catch(() => '');
    return {
      logoSrc,
      periodeLabel: monthOnly ? 'Bulan Ini' : 'Semua Periode',
      tanggalCetak: formatDateDisplay(new Date().toISOString()),
      items: list.map((item, idx) =>
        toReportItem(item, (pagination.page - 1) * pagination.limit + idx + 1),
      ),
    };
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const data = await buildReportData(items);
      const blob = await pdf(
        <LogbookPasienReportDocument data={data} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Logbook_Pasien_Radiologi.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExportExcel() {
    setExportingExcel(true);
    try {
      const rows = items.map((item, idx) => {
        const r = toReportItem(
          item,
          (pagination.page - 1) * pagination.limit + idx + 1,
        );
        return {
          No: r.no,
          Nama: r.nama,
          Usia: r.usia,
          Alamat: r.alamat,
          Pemeriksaan: r.pemeriksaan,
          Pengirim: r.pengirim,
          Tanggal: r.tanggal,
          KV: r.kv,
          Sekond: r.sekon,
          mAs: r.mAs,
          'Berat Badan': r.beratBadan,
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Logbook Pasien');
      XLSX.writeFile(workbook, 'Logbook_Pasien_Radiologi.xlsx');
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Logbook Pasien"
        subtitle="Riwayat pasien radiologi (dari arsip Duplikat Radiologi) beserta faktor eksposi KV, Sekond, mAs, Berat Badan"
        metrics={[
          {
            label: 'Total data',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'clipboard',
          },
        ]}
        searchPlaceholder="Cari nama, alamat, pemeriksaan, dokter pengirim..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => {
          void reload();
          void loadKondisiList();
        }}
        filterExtra={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={`btn btn--sm ${monthOnly ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => {
                setMonthOnly((v) => !v);
                setPage(1);
              }}
              style={
                !monthOnly ? { border: '1px solid var(--color-border)' } : {}
              }
            >
              📅 Pasien Perbulan
            </button>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => void handleExportExcel()}
              disabled={exportingExcel}
            >
              📊 {exportingExcel ? 'Memproses...' : 'Export Excel'}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => void handleExportPdf()}
              disabled={exportingPdf}
            >
              🖨️ {exportingPdf ? 'Memproses...' : 'Export PDF'}
            </button>
          </div>
        }
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        action={
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            + Tambah Pasien
          </button>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Usia</th>
                <th>Alamat</th>
                <th>Pemeriksaan</th>
                <th>Pengirim</th>
                <th>Tanggal</th>
                <th>KV</th>
                <th>Sekond</th>
                <th>mAs</th>
                <th>Berat Badan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    style={{ textAlign: 'center', padding: '1.5rem' }}
                  >
                    Belum ada data pasien radiologi untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const matched = kondisiMap.get(normalizeNama(item.nama));
                  return (
                    <tr key={item.id}>
                      <td>
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.nama}</td>
                      <td>{formatUmurTahun(item.umur)}</td>
                      <td>{item.alamat || '—'}</td>
                      <td>{item.pemeriksaanNama || '—'}</td>
                      <td>{item.pengirimNama || '—'}</td>
                      <td>{formatDateDisplay(item.createdAt)}</td>
                      <td>{matched?.kv ?? '—'}</td>
                      <td>{matched?.sekon ?? '—'}</td>
                      <td>{matched?.mAs ?? '—'}</td>
                      <td>{matched?.beratBadan ? `${matched.beratBadan} kg` : '—'}</td>
                      <td>
                        <TableRowActions
                          onEdit={() => openEdit(item)}
                          onDelete={
                            matched
                              ? () => void handleDeleteKondisi(item)
                              : undefined
                          }
                          onPrint={() => setPrintItem(item)}
                          editLabel="Isi/ubah KV, Sekond, mAs, Berat Badan"
                          deleteLabel="Hapus KV, Sekond, mAs, Berat Badan"
                          printLabel="Cetak data logbook"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ListPageShell>

      {addOpen && (
        <Modal
          open={true}
          title="Tambah Pasien Radiologi"
          onClose={() => setAddOpen(false)}
          size="lg"
        >
          <form onSubmit={(e) => void handleAddSubmit(e)} className="form-grid">
            {error && <p className="alert alert--error">{error}</p>}
            <div className="form-field form-field--full">
              <label htmlFor="add-nama">Nama Pasien *</label>
              <input
                id="add-nama"
                required
                value={addForm.nama}
                onChange={(e) => setAddForm((f) => ({ ...f, nama: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="add-tgl-lahir">Tanggal Lahir *</label>
              <input
                id="add-tgl-lahir"
                type="date"
                required
                value={addForm.tanggalLahir}
                onChange={(e) => setAddForm((f) => ({ ...f, tanggalLahir: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="add-telepon">No. Telepon</label>
              <input
                id="add-telepon"
                value={addForm.noTelepon}
                onChange={(e) => setAddForm((f) => ({ ...f, noTelepon: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="add-alamat">Alamat</label>
              <input
                id="add-alamat"
                value={addForm.alamat}
                onChange={(e) => setAddForm((f) => ({ ...f, alamat: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="add-pengirim">Dokter Pengirim *</label>
              <select
                id="add-pengirim"
                required
                value={addForm.pengirimId}
                onChange={(e) => setAddForm((f) => ({ ...f, pengirimId: e.target.value }))}
              >
                <option value="">-- Pilih Dokter --</option>
                {dokterList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="form-field form-field--full"
              style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)' }}
            >
              <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                Jenis Pemeriksaan *
              </label>
              <div className="checkbox-list" style={{ flexDirection: 'row', flexWrap: 'wrap', maxHeight: '180px', overflowY: 'auto' }}>
                {jenisList.map((j) => (
                  <label key={j.id} style={{ minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="checkbox"
                        checked={addSelectedJenis.includes(j.id)}
                        onChange={() => {
                          setAddSelectedJenis((prev) =>
                            prev.includes(j.id) ? prev.filter((id) => id !== j.id) : [...prev, j.id],
                          );
                        }}
                      />
                      {j.nama}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatRupiah(j.harga ?? '0')}
                    </span>
                  </label>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.75rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px dashed var(--color-border)',
                  fontWeight: 700,
                }}
              >
                <span>Estimasi Total Biaya</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatRupiah(addTotalHarga)}</span>
              </div>
            </div>

            <ModalFormFooter
              onCancel={() => setAddOpen(false)}
              submitLabel="Daftarkan Pasien"
              loading={addSaving}
            />
          </form>
        </Modal>
      )}

      {editItem && (
        <Modal
          open={true}
          title={`Isi Kondisi Alat — ${editItem.nama}`}
          onClose={() => setEditItem(null)}
          size="lg"
        >
          <form onSubmit={(e) => void handleSaveEdit(e)} className="form-grid">
            {editError && <p className="alert alert--error">{editError}</p>}
            <PilihanTable label="KV *" unit="KV" options={KV_OPTIONS} value={editKv} onChange={setEditKv} />
            <PilihanTable label="Sekond *" unit="s" options={SEKON_OPTIONS} value={editSekon} onChange={setEditSekon} />
            <PilihanTable label="mAs *" unit="mAs" options={MAS_OPTIONS} value={editMas} onChange={setEditMas} />
            <div className="form-field">
              <label htmlFor="lb-edit-berat">Berat Badan (kg)</label>
              {editIsThoraxOver10 ? (
                <select
                  id="lb-edit-berat"
                  value={editBeratBadan}
                  onChange={(e) => setEditBeratBadan(e.target.value)}
                >
                  <option value="">-- Pilih Berat Badan --</option>
                  {BERAT_BADAN_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w} kg
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="lb-edit-berat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editBeratBadan}
                  onChange={(e) => setEditBeratBadan(e.target.value)}
                />
              )}
            </div>
            <ModalFormFooter
              onCancel={() => setEditItem(null)}
              submitLabel="Simpan"
              loading={editSaving}
            />
          </form>
        </Modal>
      )}

      {printItem && (
        <LogbookPrintModal
          item={printItem}
          reportItem={toReportItem(printItem, 1)}
          periodeLabel={monthOnly ? 'Bulan Ini' : 'Semua Periode'}
          onClose={() => setPrintItem(null)}
        />
      )}
    </>
  );
}

function LogbookPrintModal({
  item,
  reportItem,
  periodeLabel,
  onClose,
}: {
  readonly item: DuplikatRadiologiItem;
  readonly reportItem: LogbookPasienReportData['items'][number];
  readonly periodeLabel: string;
  readonly onClose: () => void;
}) {
  const [data, setData] = useState<LogbookPasienReportData | null>(null);

  useEffect(() => {
    void loadLogoDataUrl()
      .catch(() => '')
      .then((logoSrc) => {
        setData({
          logoSrc,
          periodeLabel,
          tanggalCetak: formatDateDisplay(new Date().toISOString()),
          items: [reportItem],
        });
      });
  }, [reportItem, periodeLabel]);

  async function handleDownload() {
    if (!data) return;
    const blob = await pdf(
      <LogbookPasienReportDocument data={data} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Logbook_${item.nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal
      title={`Cetak Logbook — ${item.nama}`}
      open={true}
      onClose={onClose}
      size="xl"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '0.75rem',
        }}
      >
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void handleDownload()}
          style={{ fontWeight: 600 }}
        >
          ⬇️ Unduh / Cetak PDF
        </button>
      </div>
      <div
        style={{
          width: '100%',
          height: 'calc(100vh - 14rem)',
          minHeight: '500px',
        }}
      >
        {data ? (
          <PDFViewer width="100%" height="100%" className="pdf-viewer">
            <LogbookPasienReportDocument data={data} />
          </PDFViewer>
        ) : (
          <p className="loading-text">Menyiapkan PDF…</p>
        )}
      </div>
    </Modal>
  );
}
