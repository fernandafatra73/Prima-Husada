import { useCallback, useEffect, useState } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import { TableRowActions } from '../components/ui/TableRowActions.tsx';
import { ExpertiseModal } from '../components/ExpertiseModal.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { useMutationReload } from '../hooks/useMutationReload.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { apiGet, apiPatch } from '../lib/api.ts';
import { clampClinicalInput } from '../lib/clinicalText.ts';
import { formatUmurTahun } from '../lib/format.ts';
import type { PaginatedResponse } from '../lib/pagination.ts';
import { printPasienReport } from '../lib/pasienPrint.ts';
import { formatKlinisDisplay, parseKlinisData } from '../lib/penunjang.ts';
import '../components/ui/ui.css';

interface Dokter {
  readonly id: string;
  readonly nama: string;
}

interface Radiolog {
  readonly id: string;
  readonly nama: string;
}

interface PemeriksaanItem {
  readonly id: string;
  readonly jenisPemeriksaanId: string;
  readonly nama: string;
  readonly harga: string;
}

interface PasienItem {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur: number;
  readonly tanggalLahir: string;
  readonly noTelepon: string | null;
  readonly alamat: string | null;
  readonly klinis: string | null;
  readonly pengirim: Dokter;
  readonly radiolog: Radiolog | null;
  readonly pemeriksaan: readonly PemeriksaanItem[];
  readonly kesan: string | null;
  readonly hasilStatus: 'MENUNGGU_HASIL' | 'SELESAI';
  readonly paymentStatus: 'BELUM_LUNAS' | 'LUNAS';
  readonly totalHarga: string;
  readonly totalSharing: string;
  readonly createdAt: string;
}

interface KesanTemplateItem {
  readonly id: string;
  readonly judul: string;
  readonly isi: string;
}

interface PasienSummary {
  readonly totalPasien: number;
  readonly menungguHasil: number;
  readonly selesai: number;
  readonly totalOmzet: string;
  readonly totalSharing: string;
}

const DEFAULT_KESAN_TEMPLATES: readonly KesanTemplateItem[] = [
  {
    id: 'default-thorax',
    judul: 'Thorax',
    isi: 'Tb paru aktif kanan dan kiri\nTidak tampak cardiomegali',
  },
  {
    id: 'default-normal',
    judul: 'Thorax Normal',
    isi: 'Cor dan pulmo dalam batas normal.\nTidak tampak infiltrat.',
  },
];

const HASIL_TABS = [
  { id: 'all', label: 'Semua data' },
  { id: 'SELESAI', label: 'Selesai' },
  { id: 'MENUNGGU_HASIL', label: 'Menunggu hasil' },
] as const;

export function RadiologDuplikatPage() {
  const { search, setSearch } = useListSearch();
  const [hasilTab, setHasilTab] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dokterFilter, setDokterFilter] = useState('');

  const queryParams = useListQueryParams(
    {
      ...(hasilTab !== 'all' ? { hasilStatus: hasilTab } : {}),
      ...(paymentFilter ? { paymentStatus: paymentFilter } : {}),
      ...(dokterFilter ? { pengirimId: dokterFilter } : {}),
    },
    search,
  );

  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<PasienItem>('/api/pasien', queryParams);
  const reload = useMutationReload(reloadList);

  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [summary, setSummary] = useState<PasienSummary | null>(null);
  const [selected, setSelected] = useState<PasienItem | null>(null);
  const [kesan, setKesan] = useState('');
  const [kesanTemplates, setKesanTemplates] = useState<KesanTemplateItem[]>([]);
  const [expertiseModalOpen, setExpertiseModalOpen] = useState(false);
  const [hasilStatus, setHasilStatus] = useState<'MENUNGGU_HASIL' | 'SELESAI'>('MENUNGGU_HASIL');
  const [paymentStatus, setPaymentStatus] = useState<'BELUM_LUNAS' | 'LUNAS'>('BELUM_LUNAS');
  const [saving, setSaving] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await apiGet<PaginatedResponse<KesanTemplateItem>>('/api/kesan-template?page=1&limit=200');
      setKesanTemplates(res.items.length > 0 ? res.items : Array.from(DEFAULT_KESAN_TEMPLATES));
    } catch {
      setKesanTemplates(Array.from(DEFAULT_KESAN_TEMPLATES));
    }
  }, []);

  const loadDokter = useCallback(async () => {
    try {
      const res = await apiGet<PaginatedResponse<Dokter>>('/api/dokter?page=1&limit=200');
      setDokterList(res.items);
    } catch {
      setDokterList([]);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const res = await apiGet<PasienSummary>('/api/pasien/summary');
      setSummary(res);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
    void loadDokter();
    void loadSummary();
  }, [loadTemplates, loadDokter, loadSummary]);

  function openEdit(item: PasienItem) {
    setSelected(item);
    setKesan(item.kesan ?? '');
    setHasilStatus(item.hasilStatus);
    setPaymentStatus(item.paymentStatus);
  }

  async function simpanHasil() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/api/pasien/${selected.id}`, {
        kesan,
        hasilStatus,
        paymentStatus,
      });
      setSelected(null);
      setKesan('');
      await reload();
      await loadSummary();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function handlePrint(id: string) {
    setPrintingId(id);
    setError(null);
    try {
      await printPasienReport(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat PDF');
    } finally {
      setPrintingId(null);
    }
  }

  const metrics = summary
    ? [
        {
          label: 'Total data radiologi',
          value: String(summary.totalPasien),
          tone: 'blue' as const,
          iconKind: 'document' as const,
        },
        {
          label: 'Hasil selesai',
          value: String(summary.selesai),
          tone: 'green' as const,
          iconKind: 'check' as const,
        },
        {
          label: 'Menunggu hasil',
          value: String(summary.menungguHasil),
          tone: 'amber' as const,
          iconKind: 'clock' as const,
        },
      ]
    : undefined;

  return (
    <>
      <ListPageShell
        title="Duplikat Radiologi — Data Registrasi Pasien"
        subtitle="Arsip data registrasi pasien dan cetak ulang duplikat hasil radiologi"
        metrics={metrics}
        tabs={HASIL_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={hasilTab}
        onTabChange={setHasilTab}
        selects={[
          {
            id: 'filter-bayar',
            label: 'Pembayaran',
            value: paymentFilter,
            placeholder: 'Semua',
            options: [
              { value: 'BELUM_LUNAS', label: 'Belum lunas' },
              { value: 'LUNAS', label: 'Lunas' },
            ],
            onChange: setPaymentFilter,
          },
          {
            id: 'filter-dokter',
            label: 'Dokter pengirim',
            value: dokterFilter,
            placeholder: 'Semua dokter',
            options: dokterList.map((d) => ({ value: d.id, label: d.nama })),
            onChange: setDokterFilter,
          },
        ]}
        searchPlaceholder="Cari nama, no. reg, telepon…"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => {
          void reload();
          void loadSummary();
        }}
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Tgl / Reg</th>
              <th>Nama Pasien</th>
              <th>Umur / Tgl Lahir</th>
              <th>Pengirim</th>
              <th>Pemeriksaan</th>
              <th>Klinis</th>
              <th>Kesan Radiologi</th>
              <th>Hasil</th>
              <th>Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10}>Tidak ada data registrasi radiologi.</td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.regCode}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.nama}</div>
                    {p.alamat && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {p.alamat}
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div>{formatUmurTahun(p.umur)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {new Date(p.tanggalLahir).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td>{p.pengirim.nama}</td>
                  <td>
                    {(() => {
                      const parsed = parseKlinisData(p.klinis);
                      const list = [
                        ...p.pemeriksaan.map((x) => x.nama),
                        ...parsed.radTambahan.map((r) => `+Rad: ${r}`),
                        ...parsed.labTambahan.map((l) => `+Lab: ${l}`),
                      ];
                      return list.join(', ') || '—';
                    })()}
                  </td>
                  <td
                    style={{
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatKlinisDisplay(p.klinis) || '—'}
                  </td>
                  <td
                    style={{
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.kesan ? (
                      <span style={{ color: 'var(--color-text)' }}>{p.kesan}</span>
                    ) : (
                      <span className="badge badge--muted">Belum diisi</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${p.hasilStatus === 'SELESAI' ? 'badge--ok' : 'badge--warn'}`}
                    >
                      {p.hasilStatus === 'SELESAI' ? 'Selesai' : 'Menunggu'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${p.paymentStatus === 'LUNAS' ? 'badge--ok' : 'badge--muted'}`}
                    >
                      {p.paymentStatus === 'LUNAS' ? 'Lunas' : 'Belum'}
                    </span>
                  </td>
                  <td>
                    <TableRowActions
                      onPrint={() => void handlePrint(p.id)}
                      onEdit={() => openEdit(p)}
                      editLabel="Lihat & ubah kesan radiologi"
                      printLabel={
                        printingId === p.id ? 'Membuat PDF…' : 'Cetak duplikat hasil radiologi'
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ListPageShell>

      <Modal
        open={selected !== null}
        title={selected ? `Duplikat & Kesan Radiologi — ${selected.nama} (${selected.regCode})` : 'Ubah data'}
        onClose={() => setSelected(null)}
        size="lg"
      >
        {selected && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void simpanHasil();
            }}
          >
            <div
              style={{
                background: 'var(--color-surface-2, #f8fafc)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem 1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>No. Reg</span>
                <br />
                <strong>{selected.regCode}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Tanggal</span>
                <br />
                <strong>
                  {new Date(selected.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Nama Pasien</span>
                <br />
                <strong>{selected.nama}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Umur</span>
                <br />
                <strong>{selected.umur} tahun</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Alamat</span>
                <br />
                <strong>{selected.alamat ?? '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>No. Telepon</span>
                <br />
                <strong>{selected.noTelepon ?? '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Pengirim</span>
                <br />
                <strong>{selected.pengirim.nama}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Pemeriksaan</span>
                <br />
                <strong>{selected.pemeriksaan.map((x) => x.nama).join(', ')}</strong>
              </div>
              {selected.klinis && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Klinis</span>
                  <br />
                  <strong>{selected.klinis}</strong>
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="hasil-duplikat">Status hasil</label>
                <select
                  id="hasil-duplikat"
                  value={hasilStatus}
                  onChange={(e) =>
                    setHasilStatus(e.target.value as 'MENUNGGU_HASIL' | 'SELESAI')
                  }
                >
                  <option value="MENUNGGU_HASIL">Menunggu hasil</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="bayar-duplikat">Status pembayaran</label>
                <select
                  id="bayar-duplikat"
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as 'BELUM_LUNAS' | 'LUNAS')
                  }
                >
                  <option value="BELUM_LUNAS">Belum lunas</option>
                  <option value="LUNAS">Lunas</option>
                </select>
              </div>
              <div className="form-field form-grid--full">
                <div className="form-field__header">
                  <label htmlFor="kesan-duplikat" style={{ margin: 0 }}>
                    Kesan & saran
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn--xs btn--secondary"
                      onClick={() => void handlePrint(selected.id)}
                    >
                      🖨️ Cetak Duplikat
                    </button>
                    <button
                      type="button"
                      className="btn btn--xs btn--primary"
                      onClick={() => setExpertiseModalOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>⚡</span> Expertise
                    </button>
                  </div>
                </div>
                <textarea
                  id="kesan-duplikat"
                  value={kesan}
                  onChange={(e) => setKesan(clampClinicalInput(e.target.value))}
                  placeholder="Isi kesan & saran radiologi..."
                  rows={8}
                />
              </div>
            </div>
            <ModalFormFooter
              onCancel={() => setSelected(null)}
              submitLabel="Simpan perubahan"
              loading={saving}
            />
          </form>
        )}
      </Modal>

      <ExpertiseModal
        open={expertiseModalOpen}
        onClose={() => setExpertiseModalOpen(false)}
        onSelectTemplate={(isiText) => setKesan(clampClinicalInput(isiText))}
        templates={kesanTemplates}
        onTemplatesChanged={loadTemplates}
      />
    </>
  );
}
