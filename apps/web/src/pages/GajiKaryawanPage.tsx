import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal.tsx';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { SharingPdfPreviewModal } from '../components/ui/SharingPdfPreviewModal.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import {
  useListQueryParams,
  useListSearch,
} from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import {
  GajiKaryawanReportDocument,
  type GajiKaryawanReportData,
} from '../pdf/GajiKaryawanReportDocument.tsx';
import { loadLogoDataUrl } from '../pdf/loadLogoDataUrl.ts';
import { pdf } from '@react-pdf/renderer';
import '../components/ui/ui.css';

interface GajiKaryawanItem {
  readonly id: string;
  readonly namaKaryawan: string;
  readonly jabatan: string | null;
  readonly bulan: string;
  readonly tanggal: string;
  readonly gajiPokok: string;
  readonly tunjangan: string;
  readonly potongan: string;
  readonly gajiBersih: string;
}

interface KaryawanOption {
  readonly id: string;
  readonly nama: string;
  readonly jabatan: string | null;
}

function formatTanggalDisplay(dateStr: string): string {
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

// Estimasi kasar PPh 21 bulanan berbasis bracket penghasilan bruto (gaji pokok +
// tunjangan) — BUKAN tabel TER resmi DJP. Nilainya hanya perkiraan untuk
// gambaran potongan pajak; wajib dicek ulang ke tabel TER resmi / konsultan
// pajak sebelum dipakai sebagai slip gaji sungguhan.
function estimasiPph21(grossMonthly: number): number {
  if (grossMonthly <= 5_000_000) return 0;
  if (grossMonthly <= 10_000_000) return grossMonthly * 0.05;
  if (grossMonthly <= 20_000_000) return grossMonthly * 0.1;
  if (grossMonthly <= 50_000_000) return grossMonthly * 0.15;
  return grossMonthly * 0.25;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatBulanLabel(bulan: string): string {
  const [y, m] = bulan.split('-');
  if (!y || !m) return bulan;
  const names = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const idx = Number(m) - 1;
  return names[idx] ? `${names[idx]} ${y}` : bulan;
}

const emptyForm = {
  namaKaryawan: '',
  jabatan: '',
  bulan: currentMonth(),
  tanggal: new Date().toISOString().split('T')[0]!,
  gajiPokok: '',
  tunjangan: '0',
  potongan: '0',
};

export function GajiKaryawanPage() {
  const { search, setSearch } = useListSearch();
  const [bulanFilter, setBulanFilter] = useState(currentMonth());

  const queryParams = useListQueryParams({ bulan: bulanFilter }, search);
  const {
    items,
    pagination,
    setPage,
    loading,
    error,
    setError,
    reload: reloadList,
  } = usePaginatedList<GajiKaryawanItem>('/api/gaji-karyawan', queryParams);
  const reload = useMutationReload(reloadList);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<GajiKaryawanItem | null>(null);
  const [deleting, setDeleting] = useState<GajiKaryawanItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [karyawanOptions, setKaryawanOptions] = useState<KaryawanOption[]>([]);

  const loadKaryawanOptions = useCallback(async () => {
    try {
      const res = await apiGet<{ items: KaryawanOption[] }>(
        '/api/karyawan?departemen=RADIOLOGI&limit=200',
      );
      setKaryawanOptions(res.items);
    } catch {
      setKaryawanOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadKaryawanOptions();
  }, [loadKaryawanOptions]);

  const [printingPdf, setPrintingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const gajiBersihPreview = useMemo(() => {
    const pokok = Number(form.gajiPokok) || 0;
    const tunj = Number(form.tunjangan) || 0;
    const pot = Number(form.potongan) || 0;
    return pokok + tunj - pot;
  }, [form.gajiPokok, form.tunjangan, form.potongan]);

  const pph21Preview = useMemo(() => {
    const pokok = Number(form.gajiPokok) || 0;
    const tunj = Number(form.tunjangan) || 0;
    return estimasiPph21(pokok + tunj);
  }, [form.gajiPokok, form.tunjangan]);

  function computePph21(item: GajiKaryawanItem): number {
    return estimasiPph21(Number(item.gajiPokok) + Number(item.tunjangan));
  }

  function computeTakeHome(item: GajiKaryawanItem): number {
    return Number(item.gajiBersih) - computePph21(item);
  }

  const totalGajiBersih = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.gajiBersih || 0), 0),
    [items],
  );

  const totalPph21 = useMemo(
    () => items.reduce((sum, item) => sum + computePph21(item), 0),
    [items],
  );

  const totalTakeHome = useMemo(
    () => items.reduce((sum, item) => sum + computeTakeHome(item), 0),
    [items],
  );

  function openCreate() {
    setForm({ ...emptyForm, bulan: bulanFilter });
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(item: GajiKaryawanItem) {
    setForm({
      namaKaryawan: item.namaKaryawan,
      jabatan: item.jabatan ?? '',
      bulan: item.bulan,
      tanggal: item.tanggal.split('T')[0]!,
      gajiPokok: item.gajiPokok,
      tunjangan: item.tunjangan,
      potongan: item.potongan,
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
        namaKaryawan: form.namaKaryawan,
        jabatan: form.jabatan || undefined,
        bulan: form.bulan,
        tanggal: form.tanggal,
        gajiPokok: Number(form.gajiPokok),
        tunjangan: Number(form.tunjangan) || 0,
        potongan: Number(form.potongan) || 0,
      };
      if (editing) {
        await apiPatch(`/api/gaji-karyawan/${editing.id}`, body);
      } else {
        await apiPost('/api/gaji-karyawan', body);
      }
      closeModal();
      await reload({ resetPage: !editing });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data gaji karyawan',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDelete(`/api/gaji-karyawan/${deleting.id}`);
      setDeleting(null);
      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus data gaji karyawan',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function buildReportData(): Promise<GajiKaryawanReportData> {
    const logoSrc = await loadLogoDataUrl().catch(() => '');
    return {
      logoSrc,
      bulanLabel: formatBulanLabel(bulanFilter),
      tanggalCetak: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      items: items.map((item, idx) => ({
        no: (pagination.page - 1) * pagination.limit + idx + 1,
        namaKaryawan: item.namaKaryawan,
        jabatan: item.jabatan || '—',
        gajiPokokFormatted: formatRupiah(item.gajiPokok),
        tunjanganFormatted: formatRupiah(item.tunjangan),
        potonganFormatted: formatRupiah(item.potongan),
        gajiBersihFormatted: formatRupiah(item.gajiBersih),
        pph21Formatted: formatRupiah(computePph21(item)),
        takeHomeFormatted: formatRupiah(computeTakeHome(item)),
      })),
      totalGajiBersihFormatted: formatRupiah(totalGajiBersih),
      totalPph21Formatted: formatRupiah(totalPph21),
      totalTakeHomeFormatted: formatRupiah(totalTakeHome),
    };
  }

  async function handleCetakPdf() {
    setPrintingPdf(true);
    try {
      const data = await buildReportData();
      const blob = await pdf(
        <GajiKaryawanReportDocument data={data} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Daftar_Gaji_Karyawan_${bulanFilter}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setPrintingPdf(false);
    }
  }

  async function handlePreviewPdf() {
    setPreviewingPdf(true);
    try {
      const data = await buildReportData();
      const blob = await pdf(
        <GajiKaryawanReportDocument data={data} />,
      ).toBlob();
      setPreviewBlob(blob);
      setPreviewModalOpen(true);
    } finally {
      setPreviewingPdf(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Daftar Gaji Karyawan"
        subtitle="Rekap gaji karyawan per bulan, termasuk estimasi PPh 21 (perkiraan kasar, bukan tabel TER resmi — cek ulang sebelum dipakai slip gaji sungguhan)"
        metrics={[
          {
            label: 'Total karyawan',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'clipboard',
          },
          {
            label: 'Periode',
            value: formatBulanLabel(bulanFilter),
            tone: 'green',
            iconKind: 'document',
          },
          {
            label: 'Total gaji bersih',
            value: formatRupiah(totalGajiBersih),
            tone: 'violet',
            iconKind: 'percent',
          },
          {
            label: 'Estimasi PPh 21',
            value: formatRupiah(totalPph21),
            tone: 'amber',
            iconKind: 'document',
          },
          {
            label: 'Take Home Pay',
            value: formatRupiah(totalTakeHome),
            tone: 'green',
            iconKind: 'clipboard',
          },
        ]}
        searchPlaceholder="Cari nama karyawan..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        filterExtra={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="month"
              value={bulanFilter}
              onChange={(e) => {
                setBulanFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
              }}
              aria-label="Filter bulan"
            />
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => void handleCetakPdf()}
              disabled={printingPdf || previewingPdf}
            >
              🖨️ {printingPdf ? 'Membuat PDF...' : 'Cetak PDF'}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => void handlePreviewPdf()}
              disabled={previewingPdf || printingPdf}
              style={{ border: '1px solid var(--color-border)' }}
            >
              👁️ {previewingPdf ? 'Memuat...' : 'Preview PDF'}
            </button>
          </div>
        }
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={openCreate}
          >
            + Tambah Data Gaji
          </button>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Karyawan</th>
                <th>Jabatan</th>
                <th>Bulan</th>
                <th>Tanggal</th>
                <th style={{ textAlign: 'right' }}>Gaji Pokok</th>
                <th style={{ textAlign: 'right' }}>Tunjangan</th>
                <th style={{ textAlign: 'right' }}>Potongan</th>
                <th style={{ textAlign: 'right' }}>Gaji Bersih</th>
                <th style={{ textAlign: 'right' }}>PPh 21 (Estimasi)</th>
                <th style={{ textAlign: 'right' }}>Take Home Pay</th>
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
                    Belum ada data gaji karyawan untuk periode ini.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.namaKaryawan}</td>
                    <td>{item.jabatan || '—'}</td>
                    <td>{formatBulanLabel(item.bulan)}</td>
                    <td>{formatTanggalDisplay(item.tanggal)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatRupiah(item.gajiPokok)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatRupiah(item.tunjangan)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatRupiah(item.potongan)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                      }}
                    >
                      {formatRupiah(item.gajiBersih)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#b45309' }}>
                      {formatRupiah(computePph21(item))}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#15803d',
                      }}
                    >
                      {formatRupiah(computeTakeHome(item))}
                    </td>
                    <td>
                      <TableRowActions
                        onEdit={() => openEdit(item)}
                        onDelete={() => setDeleting(item)}
                        editLabel="Ubah data gaji"
                        deleteLabel="Hapus data gaji"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ListPageShell>

      {(createOpen || editing) && (
        <Modal
          open={true}
          title={
            editing ? 'Ubah Data Gaji Karyawan' : 'Tambah Data Gaji Karyawan'
          }
          onClose={closeModal}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="form-grid">
            <div className="form-field form-field--full">
              <label htmlFor="gk-pilih-karyawan">Pilih dari Daftar Karyawan (Opsional)</label>
              <select
                id="gk-pilih-karyawan"
                value=""
                onChange={(e) => {
                  const selected = karyawanOptions.find((k) => k.id === e.target.value);
                  if (selected) {
                    setForm((f) => ({
                      ...f,
                      namaKaryawan: selected.nama,
                      jabatan: selected.jabatan ?? f.jabatan,
                    }));
                  }
                }}
              >
                <option value="">-- Pilih Karyawan / Ketik Manual di Bawah --</option>
                {karyawanOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="gk-nama">Nama Karyawan *</label>
              <input
                id="gk-nama"
                required
                value={form.namaKaryawan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, namaKaryawan: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="gk-jabatan">Jabatan</label>
              <input
                id="gk-jabatan"
                value={form.jabatan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jabatan: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="gk-bulan">Bulan *</label>
              <input
                id="gk-bulan"
                type="month"
                required
                value={form.bulan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bulan: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="gk-tanggal">Tanggal *</label>
              <input
                id="gk-tanggal"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tanggal: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="gk-pokok">Gaji Pokok (Rp) *</label>
              <input
                id="gk-pokok"
                type="number"
                min="0"
                step="1"
                required
                value={form.gajiPokok}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gajiPokok: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="gk-tunjangan">Tunjangan (Rp)</label>
              <input
                id="gk-tunjangan"
                type="number"
                min="0"
                step="1"
                value={form.tunjangan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tunjangan: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="gk-potongan">Potongan (Rp)</label>
              <input
                id="gk-potongan"
                type="number"
                min="0"
                step="1"
                value={form.potongan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, potongan: e.target.value }))
                }
              />
            </div>
            <div
              className="form-field form-field--full"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                padding: '0.5rem 0',
                borderTop: '1px dashed var(--color-border)',
              }}
            >
              <span>Gaji Bersih</span>
              <span style={{ color: 'var(--color-primary)' }}>
                {formatRupiah(gajiBersihPreview)}
              </span>
            </div>
            <div
              className="form-field form-field--full"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: '#b45309',
              }}
            >
              <span>Estimasi PPh 21 (perkiraan kasar)</span>
              <span>{formatRupiah(pph21Preview)}</span>
            </div>
            <div
              className="form-field form-field--full"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                padding: '0.5rem 0',
                borderTop: '1px dashed var(--color-border)',
              }}
            >
              <span>Take Home Pay</span>
              <span style={{ color: '#15803d' }}>
                {formatRupiah(gajiBersihPreview - pph21Preview)}
              </span>
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
        title="Hapus Data Gaji Karyawan"
        message={`Yakin hapus data gaji "${deleting?.namaKaryawan ?? ''}" untuk periode ${deleting ? formatBulanLabel(deleting.bulan) : ''}?`}
        loading={submitting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <SharingPdfPreviewModal
        open={previewModalOpen}
        blob={previewBlob}
        filename={`Daftar_Gaji_Karyawan_${bulanFilter}.pdf`}
        onClose={() => setPreviewModalOpen(false)}
        title="Pratinjau Daftar Gaji Karyawan"
      />
    </>
  );
}
