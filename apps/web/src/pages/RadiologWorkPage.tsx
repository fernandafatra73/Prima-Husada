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
import type { PaginatedResponse } from '../lib/pagination.ts';
import { printPasienReport } from '../lib/pasienPrint.ts';
import { formatKlinisDisplay, parseKlinisData } from '../lib/penunjang.ts';
import { formatRupiah } from '../lib/format.ts';
import '../components/ui/ui.css';

interface AntreanItem {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly tanggalLahir: string;
  readonly umur: number;
  readonly noTelepon: string | null;
  readonly alamat: string | null;
  readonly klinis: string | null;
  readonly pengirim: { readonly id: string; readonly nama: string };
  readonly radiolog: { readonly id: string; readonly nama: string } | null;
  readonly pemeriksaan: readonly { readonly id: string; readonly nama: string; readonly harga: string }[];
  readonly kesan: string | null;
  readonly hasilStatus: 'MENUNGGU_HASIL' | 'SELESAI';
  readonly paymentStatus: 'BELUM_LUNAS' | 'LUNAS';
  readonly totalHarga: string;
  readonly createdAt: string;
}

interface KesanTemplateItem {
  readonly id: string;
  readonly judul: string;
  readonly isi: string;
}

const DEFAULT_KESAN_TEMPLATES: readonly KesanTemplateItem[] = [
  {
    id: 'default-normal',
    judul: 'Thorax Normal (Cor & Pulmo)',
    isi: 'Cor dan pulmo dalam batas normal.\nTidak tampak infiltrat maupun nodul.\nSinus dan diafragma baik.',
  },
  {
    id: 'default-thorax-tb',
    judul: 'Thorax - TB Paru Aktif',
    isi: 'Tampak bercak infiltrat pada apeks pulmo kanan dan kiri.\nKesan: TB Paru Aktif bilateral.\nSaran: Korelasi klinis dan pemeriksaan BTA / GeneXpert.',
  },
  {
    id: 'default-thorax-cardio',
    judul: 'Thorax - Cardiomegaly',
    isi: 'CTR > 55% dengan apex terdorong ke lateral.\nTampak bendungan pembuluh darah paru.\nKesan: Cardiomegali dengan tanda awal edema paru.',
  },
  {
    id: 'default-cranium',
    judul: 'Cranium Normal / Trauma',
    isi: 'Tulang-tulang calvaria cranii utuh, tidak tampak garis fraktur.\nSella turcica normal.\nSinus paranasalis cerah.',
  },
  {
    id: 'default-fracture',
    judul: 'Extremitas - Fraktur',
    isi: 'Tampak garis fraktur pada sepertiga tengah corpus os tibia/fibula dengan aposisi dan alinement cukup.\nTidak tampak pembengkakan jaringan lunak berlebih.',
  },
  {
    id: 'default-dental',
    judul: 'Dental Panoramic Normal',
    isi: 'Susunan gigi geligi rahang atas dan bawah dalam batas normal.\nTidak tampak lesi periapikal maupun kista rahang.',
  },
];

function XRayDicomViewer({
  patientName,
  regCode,
  totalHarga,
}: {
  readonly patientName: string;
  readonly regCode: string;
  readonly totalHarga: string;
}) {
  const [xrayMode, setXrayMode] = useState<'THORAX' | 'CRANIUM' | 'DENTAL' | 'EXTREMITAS'>('THORAX');
  const [zoom, setZoom] = useState(1);
  const [invert, setInvert] = useState(false);

  const totalNum = Number(totalHarga) || 0;
  const sharingNum = Math.round(totalNum * 0.3); // 30% komisi radiolog standar

  const titles: Record<'THORAX' | 'CRANIUM' | 'DENTAL' | 'EXTREMITAS', string> = {
    THORAX: 'Thorax PA (Posteroanterior)',
    CRANIUM: 'Cranium AP / Lateral (Head X-Ray)',
    DENTAL: 'Dental Panoramic (Jaw & Teeth)',
    EXTREMITAS: 'Extremity Bone / Fracture Study',
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
            🖼️ DICOM Viewer &amp; Gambar Roentgen — <strong>{titles[xrayMode]}</strong>
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Klinik Prima Husada Digital Radiography (DR/DICOM 3.0)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['THORAX', 'CRANIUM', 'DENTAL', 'EXTREMITAS'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setXrayMode(m);
                setZoom(1);
              }}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: xrayMode === m ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: xrayMode === m ? '#f0f9ff' : '#f8fafc',
                color: xrayMode === m ? '#0284c7' : '#475569',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Dark DICOM Viewer Canvas */}
      <div
        style={{
          background: invert ? '#e2e8f0' : '#090d16',
          borderRadius: '8px',
          padding: '1rem',
          position: 'relative',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '1px solid #334155',
        }}
      >
        {/* DICOM Overlay Metadata */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            color: invert ? '#0f172a' : '#22d3ee',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            lineHeight: 1.3,
            pointerEvents: 'none',
          }}
        >
          <div>PID: {regCode}</div>
          <div>NAME: {patientName}</div>
          <div>STUDY: {xrayMode} PA/AP</div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            color: invert ? '#0f172a' : '#22d3ee',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            textAlign: 'right',
            pointerEvents: 'none',
          }}
        >
          <div>KLINIK PRIMA HUSADA</div>
          <div>kVp: 72 | mAs: 12.5</div>
          <div>DICOM ARCHIVE #1</div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '12px',
            color: invert ? '#0f172a' : '#f87171',
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '1rem',
            pointerEvents: 'none',
          }}
        >
          R
        </div>

        {/* Simulated Anatomical Image */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease',
            color: invert ? '#0f172a' : '#e2e8f0',
            textAlign: 'center',
          }}
        >
          {xrayMode === 'THORAX' && (
            <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="50" rx="36" ry="44" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 1" />
              <path d="M50 15V85 M35 30Q50 40 65 30 M30 50Q50 60 70 50 M35 70Q50 78 65 70" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="45" cy="55" r="10" fill="currentColor" fillOpacity="0.25" />
            </svg>
          )}
          {xrayMode === 'CRANIUM' && (
            <svg width="170" height="170" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="45" r="35" stroke="currentColor" strokeWidth="3" />
              <path d="M35 50 Q50 65 65 50" stroke="currentColor" strokeWidth="2" />
              <circle cx="38" cy="42" r="6" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="62" cy="42" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
          {xrayMode === 'DENTAL' && (
            <svg width="200" height="140" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 40 Q50 75 90 40" stroke="currentColor" strokeWidth="3" />
              <path d="M15 35 Q50 68 85 35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
              <circle cx="50" cy="50" r="3" fill="currentColor" />
            </svg>
          )}
          {xrayMode === 'EXTREMITAS' && (
            <svg width="140" height="180" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="38" y1="10" x2="38" y2="90" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <line x1="48" y1="20" x2="48" y2="85" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              <path d="M30 48 L56 53" stroke="#f87171" strokeWidth="2" />
            </svg>
          )}
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
            [{titles[xrayMode]} Digital Image]
          </div>
        </div>

        {/* Viewer Tools */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '12px',
            display: 'flex',
            gap: '0.3rem',
          }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
            style={{ padding: '0.2rem 0.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            - Zoom
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
            style={{ padding: '0.2rem 0.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            + Zoom
          </button>
          <button
            type="button"
            onClick={() => setInvert((v) => !v)}
            style={{ padding: '0.2rem 0.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {invert ? 'Dark Mode' : 'Invert'}
          </button>
        </div>
      </div>

      {/* Keuangan & Sharing Dokter Radiologi */}
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.65rem 0.85rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.85rem',
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>Tarif Pemeriksaan Radiologi: </span>
          <strong style={{ color: '#0f172a' }}>{formatRupiah(totalNum)}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Estimasi Komisi Radiolog (30%): </span>
          <strong style={{ color: '#0284c7' }}>{formatRupiah(sharingNum)}</strong>
        </div>
      </div>
    </div>
  );
}

export function RadiologWorkPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, setError, reload: reloadList } =
    usePaginatedList<AntreanItem>('/api/radiolog/antrean', queryParams);
  const reload = useMutationReload(reloadList);
  const [selected, setSelected] = useState<AntreanItem | null>(null);
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

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  function openEdit(item: AntreanItem) {
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

  return (
    <>
      <ListPageShell
        title="Radiolog — Antrean & Kesan"
        subtitle="Pasien menunggu hasil bacaan radiologi"
        metrics={[
          {
            label: 'Antrean aktif',
            value: String(pagination.total),
            tone: 'amber',
            iconKind: 'clock',
          },
          {
            label: 'Di halaman ini',
            value: String(items.length),
            tone: 'blue',
            iconKind: 'users',
          },
        ]}
        searchPlaceholder="Cari nama atau no. reg…"
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
              <th>Tgl / Reg</th>
              <th>Nama Pasien</th>
              <th>Umur / JK</th>
              <th>Pengirim</th>
              <th>Pemeriksaan</th>
              <th>Klinis</th>
              <th>Hasil</th>
              <th>Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9}>Tidak ada antrean pasien.</td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.regCode}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.nama}</div>
                    {p.alamat && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p.alamat}</div>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {p.umur} thn
                  </td>
                  <td>{p.pengirim.nama}</td>
                  <td>{p.pemeriksaan.map((x) => x.nama).join(', ')}</td>
                  <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.klinis ?? '—'}
                  </td>
                  <td>
                    <span className={`badge ${p.hasilStatus === 'SELESAI' ? 'badge--ok' : 'badge--warn'}`}>
                      {p.hasilStatus === 'SELESAI' ? 'Selesai' : 'Menunggu'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.paymentStatus === 'LUNAS' ? 'badge--ok' : 'badge--muted'}`}>
                      {p.paymentStatus === 'LUNAS' ? 'Lunas' : 'Belum'}
                    </span>
                  </td>
                  <td>
                    <TableRowActions
                      onPrint={() => void handlePrint(p.id)}
                      onEdit={() => openEdit(p)}
                      editLabel="Ubah kesan dan status"
                      printLabel={printingId === p.id ? 'Membuat PDF…' : 'Cetak hasil radiologi'}
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
        title={selected ? `Kesan Radiologi — ${selected.nama} (${selected.regCode})` : 'Ubah data'}
        onClose={() => setSelected(null)}
        size="lg"
      >
        {selected && (
          <form onSubmit={(e) => { e.preventDefault(); void simpanHasil(); }}>
            {/* Patient Info Card */}
            <div style={{
              background: 'var(--color-surface-2, #f8fafc)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.35rem 1.5rem',
              fontSize: '0.85rem',
            }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>No. Reg</span><br /><strong>{selected.regCode}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Tanggal</span><br /><strong>{new Date(selected.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Nama Pasien</span><br /><strong>{selected.nama}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Umur</span><br /><strong>{selected.umur} tahun</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Alamat</span><br /><strong>{selected.alamat ?? '—'}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>No. Telepon</span><br /><strong>{selected.noTelepon ?? '—'}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Pengirim</span><br /><strong>{selected.pengirim.nama}</strong></div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Pemeriksaan</span><br />
                <strong>
                  {(() => {
                    const parsed = parseKlinisData(selected.klinis);
                    const list = [
                      ...selected.pemeriksaan.map((x) => x.nama),
                      ...parsed.radTambahan.map((r) => `+Rad: ${r}`),
                      ...parsed.labTambahan.map((l) => `+Lab: ${l}`),
                    ];
                    return list.join(', ') || '—';
                  })()}
                </strong>
              </div>
              {selected.klinis && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Klinis</span><br />
                  <strong>{formatKlinisDisplay(selected.klinis)}</strong>
                </div>
              )}
            </div>

            {/* DICOM Viewer & Gambar Roentgen + Keuangan */}
            <XRayDicomViewer
              patientName={selected.nama}
              regCode={selected.regCode}
              totalHarga={selected.totalHarga}
            />

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="hasil-r">Status hasil</label>
                <select
                  id="hasil-r"
                  value={hasilStatus}
                  onChange={(e) => setHasilStatus(e.target.value as 'MENUNGGU_HASIL' | 'SELESAI')}
                >
                  <option value="MENUNGGU_HASIL">Menunggu hasil</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="bayar-r">Status pembayaran</label>
                <select
                  id="bayar-r"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as 'BELUM_LUNAS' | 'LUNAS')}
                >
                  <option value="BELUM_LUNAS">Belum lunas</option>
                  <option value="LUNAS">Lunas</option>
                </select>
              </div>
              <div className="form-field form-grid--full">
                <div className="form-field__header">
                  <label htmlFor="kesan" style={{ margin: 0 }}>Kesan & saran</label>
                  <button
                    type="button"
                    className="btn btn--xs btn--primary"
                    onClick={() => setExpertiseModalOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>⚡</span> Expertise
                  </button>
                </div>
                <textarea
                  id="kesan"
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
        onSelectTemplate={(isiText) => setKesan((prev) => clampClinicalInput(prev ? prev + '\n\n' + isiText : isiText))}
        templates={kesanTemplates}
        onTemplatesChanged={loadTemplates}
      />
    </>
  );
}
