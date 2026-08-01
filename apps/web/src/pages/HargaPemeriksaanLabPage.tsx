import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiPut } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import '../components/ui/ui.css';

export interface PaketLabItemData {
  id: string;
  paketId: string;
  grup: string | null;
  pemeriksaan: string;
  nilaiRujukan: string;
  satuan?: string;
  harga?: string;
  urutan: number;
}

export interface PaketLabData {
  id: string;
  nama: string;
  harga?: string;
  urutan: number;
  items: PaketLabItemData[];
}

const TAB_CATEGORIES = [
  'Hematologi',
  'Kimia darah',
  'Diabetes',
  'Urinalisa',
  'Urin rutin',
  'Imunologi',
  'Diffcount',
  'Laju Endap Darah',
] as const;

interface TableRowItem {
  id: string;
  paketId: string;
  klasifikasi: string;
  grup: string | null;
  pemeriksaan: string;
  nilaiRujukan: string;
  satuan?: string;
  harga?: string;
  urutan: number;
  pkgIdx: number;
  origIdx: number;
}

export function HargaPemeriksaanLabPage() {
  const [paketList, setPaketList] = useState<PaketLabData[]>([]);
  const [editablePaketList, setEditablePaketList] = useState<PaketLabData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>(TAB_CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const [packageHarga, setPackageHarga] = useState<string>('0');
  const [saving, setSaving] = useState(false);

  // Modal state for adding a new item
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newKlasifikasi, setNewKlasifikasi] = useState<string>(TAB_CATEGORIES[0]);
  const [newPemeriksaan, setNewPemeriksaan] = useState('');
  const [newNilaiRujukan, setNewNilaiRujukan] = useState('');
  const [newSatuan, setNewSatuan] = useState('');
  const [newHarga, setNewHarga] = useState<string>('0');

  const loadPaketList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: PaketLabData[] }>('/api/paket-lab');
      setPaketList(res.items);
      setEditablePaketList(JSON.parse(JSON.stringify(res.items)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data paket lab');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaketList();
  }, [loadPaketList]);

  useEffect(() => {
    const pkg = editablePaketList.find(
      (p) => p.nama.toLowerCase() === activeTab.toLowerCase()
    );
    if (pkg && pkg.harga !== undefined) {
      setPackageHarga(String(pkg.harga));
    } else {
      setPackageHarga('0');
    }
  }, [activeTab, editablePaketList]);

  async function handleInitDefaults() {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/paket-lab/init-defaults', {});
      await loadPaketList();
      alert('Berhasil menginisialisasi 8 paket laboratorium standar!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal inisialisasi paket');
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePackageHarga(e: React.FormEvent) {
    e.preventDefault();
    const targetPkg = paketList.find(
      (p) => p.nama.toLowerCase() === activeTab.toLowerCase()
    );
    if (!targetPkg) return;

    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/api/paket-lab/${targetPkg.id}`, {
        harga: Number(packageHarga) || 0,
      });
      await loadPaketList();
      alert(`Harga Paket "${targetPkg.nama}" berhasil disimpan!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan harga paket');
    } finally {
      setSaving(false);
    }
  }

  function handleRowFieldChange(
    pkgIdx: number,
    origIdx: number,
    field: 'pemeriksaan' | 'nilaiRujukan' | 'satuan' | 'harga',
    value: string
  ) {
    const copy = [...editablePaketList];
    const targetPkg = copy[pkgIdx];
    if (targetPkg) {
      const updatedItems = targetPkg.items.map((it, idx) =>
        idx === origIdx ? { ...it, [field]: value } : it
      );
      copy[pkgIdx] = { ...targetPkg, items: updatedItems };
      setEditablePaketList(copy);
    }
  }

  async function handleSaveAllChanges() {
    setSaving(true);
    setError(null);
    try {
      const pkgsToSave =
        activeTab === 'Semua Klasifikasi (All)'
          ? editablePaketList
          : editablePaketList.filter((p) => p.nama.toLowerCase() === activeTab.toLowerCase());

      for (const pkg of pkgsToSave) {
        await apiPut(`/api/paket-lab/${pkg.id}/items`, {
          items: pkg.items.map((it, idx) => ({
            grup: it.grup ?? '',
            pemeriksaan: it.pemeriksaan,
            nilaiRujukan: it.nilaiRujukan,
            satuan: it.satuan ?? '',
            harga: Number(it.harga) || 0,
            urutan: idx + 1,
          })),
        });
      }
      await loadPaketList();
      alert('Seluruh perubahan data Klasifikasi, Pemeriksaan, Hasil, Nilai Rujukan, & Harga Pemeriksaan berhasil disimpan!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItemRow(pkgIdx: number, origIdx: number) {
    if (!confirm('Hapus item pemeriksaan ini dari klasifikasi paket?')) return;
    const copy = [...editablePaketList];
    const targetPkg = copy[pkgIdx];
    if (!targetPkg) return;
    const updatedItems = targetPkg.items.filter((_, idx) => idx !== origIdx);
    copy[pkgIdx] = { ...targetPkg, items: updatedItems };
    setEditablePaketList(copy);

    setSaving(true);
    try {
      await apiPut(`/api/paket-lab/${targetPkg.id}/items`, {
        items: updatedItems.map((it, idx) => ({
          grup: it.grup ?? '',
          pemeriksaan: it.pemeriksaan,
          nilaiRujukan: it.nilaiRujukan,
          satuan: it.satuan ?? '',
          harga: Number(it.harga) || 0,
          urutan: idx + 1,
        })),
      });
      await loadPaketList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus item');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newPemeriksaan.trim()) return;
    const targetPkg = paketList.find((p) => p.nama.toLowerCase() === newKlasifikasi.toLowerCase());
    if (!targetPkg) {
      alert(`Paket "${newKlasifikasi}" belum ada. Silakan buat atau inisialisasi paket terlebih dahulu.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = [
        ...targetPkg.items,
        {
          id: `tmp-${Date.now()}`,
          paketId: targetPkg.id,
          grup: '',
          pemeriksaan: newPemeriksaan.trim(),
          nilaiRujukan: newNilaiRujukan.trim(),
          satuan: newSatuan.trim(),
          harga: newHarga,
          urutan: targetPkg.items.length + 1,
        },
      ];
      await apiPut(`/api/paket-lab/${targetPkg.id}/items`, {
        items: updated.map((it, idx) => ({
          grup: it.grup ?? '',
          pemeriksaan: it.pemeriksaan,
          nilaiRujukan: it.nilaiRujukan,
          satuan: it.satuan ?? '',
          harga: Number(it.harga) || 0,
          urutan: idx + 1,
        })),
      });
      setNewPemeriksaan('');
      setNewNilaiRujukan('');
      setNewSatuan('');
      setNewHarga('0');
      setAddItemModalOpen(false);
      await loadPaketList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambah item pemeriksaan');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMissingPackage(namaPaket: string) {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/paket-lab', {
        nama: namaPaket,
        urutan: TAB_CATEGORIES.indexOf(namaPaket as typeof TAB_CATEGORIES[number]) + 1,
      });
      await loadPaketList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat paket');
    } finally {
      setSaving(false);
    }
  }

  const activePackage = paketList.find(
    (p) => p.nama.toLowerCase() === activeTab.toLowerCase()
  );

  const tableRows: TableRowItem[] = [];
  editablePaketList.forEach((pkg, pkgIdx) => {
    if (
      activeTab === 'Semua Klasifikasi (All)' ||
      pkg.nama.toLowerCase() === activeTab.toLowerCase()
    ) {
      pkg.items.forEach((it, origIdx) => {
        const q = searchQuery.trim().toLowerCase();
        const match =
          !q ||
          it.pemeriksaan.toLowerCase().includes(q) ||
          pkg.nama.toLowerCase().includes(q) ||
          (it.nilaiRujukan && it.nilaiRujukan.toLowerCase().includes(q)) ||
          (it.satuan && it.satuan.toLowerCase().includes(q));
        if (match) {
          tableRows.push({
            ...it,
            klasifikasi: pkg.nama,
            pkgIdx,
            origIdx,
          });
        }
      });
    }
  });

  return (
    <div className="list-page">
      <header className="list-page__header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Harga Pemeriksaan Lab &amp; Tarif Layanan
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Tabel tarif pemeriksaan lab dengan <strong>Klasifikasi</strong>, <strong>Pemeriksaan</strong>, <strong>Hasil (Format/Satuan)</strong>, <strong>Nilai Rujukan</strong>, &amp; <strong>Harga Pemeriksaan</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleInitDefaults}
              disabled={saving}
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0284c7', color: '#ffffff' }}
            >
              ✨ Inisialisasi 8 Paket Langsung Jadi
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="alert alert--danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}

      {/* Light-Blue Banner Card for 8 Packages */}
      <div
        style={{
          background: '#e0f2fe',
          border: '1px solid #7dd3fc',
          borderRadius: '12px',
          padding: '1.1rem 1.4rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0369a1' }}>
              ⚡ Paket Pemeriksaan Lab Langsung Jadi (Klinik Prima Husada)
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#0c4a6e' }}>
              Standar 8 klasifikasi utama: <strong>Hematologi</strong>, <strong>Kimia Darah</strong>, <strong>Diabetes</strong>, <strong>Urinalisa</strong>, <strong>Urine Rutin</strong>, <strong>Imunologi</strong>, <strong>Diffcount</strong>, dan <strong>Laju Endap Darah</strong> telah siap beserta parameter dan nilai rujukannya.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleInitDefaults}
              disabled={saving}
              style={{ background: '#ffffff', color: '#0369a1', fontWeight: 700, border: '1px solid #38bdf8' }}
            >
              🔄 Reset / Muat Ulang Standar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector for the requested categories */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {TAB_CATEGORIES.map((cat) => {
          const isActive = activeTab.toLowerCase() === cat.toLowerCase();
          const pkg = paketList.find((p) => p.nama.toLowerCase() === cat.toLowerCase());
          const count = pkg?.items.length ?? 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                background: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{cat}</span>
              <span
                style={{
                  background: isActive ? '#0284c7' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                {count} item
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Memuat data harga pemeriksaan laboratorium...
        </div>
      ) : activeTab !== 'Semua Klasifikasi (All)' && !activePackage ? (
        <div
          style={{
            background: '#ffffff',
            padding: '2.5rem',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#334155' }}>
            Paket &quot;{activeTab}&quot; Belum Terdaftar
          </h3>
          <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
            Anda dapat membuat paket ini sekarang atau menginisialisasi 6 paket standar laboratorium.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => handleCreateMissingPackage(activeTab)}
              disabled={saving}
            >
              + Buat Paket &quot;{activeTab}&quot;
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleInitDefaults}
              disabled={saving}
            >
              ✨ Inisialisasi Semua Paket Standar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Card: Harga Paket Keseluruhan (or Summary for All) */}
          {activeTab === 'Semua Klasifikasi (All)' ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0284c7', textTransform: 'uppercase' }}>
                  Ringkasan Tarif &amp; Standar Pemeriksaan Laboratorium
                </div>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
                  Semua Klasifikasi Paket Pemeriksaan Lab
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Menampilkan {paketList.length} klasifikasi paket dengan total {tableRows.length} parameter pemeriksaan laboratorium.
                </p>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setAddItemModalOpen(true)}
                style={{ fontWeight: 600, background: '#0284c7', color: '#ffffff' }}
              >
                + Tambah Item Pemeriksaan
              </button>
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0284c7', textTransform: 'uppercase' }}>
                  Tarif Paket Keseluruhan (Bundling)
                </div>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
                  {activePackage?.nama}
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Total {activePackage?.items.length} item pemeriksaan di dalam paket ini.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                  Harga Paket:
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="number"
                    value={packageHarga}
                    onChange={(e) => setPackageHarga(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      width: '140px',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleSavePackageHarga}
                  disabled={saving}
                  style={{ fontWeight: 600 }}
                >
                  Simpan Harga Paket
                </button>
              </div>
            </div>
          )}

          {/* Table Card: Klasifikasi, Pemeriksaan, Hasil, Nilai Rujukan, Harga Pemeriksaan */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Tabel Tarif &amp; Standar Pemeriksaan Lab ({activeTab})
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Lengkap dengan <strong>Klasifikasi</strong>, <strong>Pemeriksaan</strong>, <strong>Hasil (Format Default)</strong>, <strong>Nilai Rujukan</strong>, &amp; <strong>Harga Pemeriksaan</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Cari item pemeriksaan / klasifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    width: '240px',
                    fontSize: '0.9rem',
                  }}
                />
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setAddItemModalOpen(true)}
                  style={{ fontWeight: 600 }}
                >
                  + Tambah Item
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleSaveAllChanges}
                  disabled={saving || tableRows.length === 0}
                  style={{ fontWeight: 600, background: '#0284c7' }}
                >
                  💾 Simpan Semua Perubahan
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '50px' }}>No</th>
                    <th style={{ padding: '0.75rem 1rem', width: '160px' }}>Klasifikasi</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Pemeriksaan</th>
                    <th style={{ padding: '0.75rem 1rem', width: '170px' }}>Hasil (Satuan/Format)</th>
                    <th style={{ padding: '0.75rem 1rem', width: '200px' }}>Nilai Rujukan</th>
                    <th style={{ padding: '0.75rem 1rem', width: '180px' }}>Harga Pemeriksaan (Rp)</th>
                    <th style={{ padding: '0.75rem 1rem', width: '80px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada item pemeriksaan yang cocok.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, idx) => {
                      const isOdd = idx % 2 === 1;
                      return (
                        <tr
                          key={row.id || `${row.pkgIdx}-${row.origIdx}`}
                          style={{
                            background: isOdd ? '#f8fafc' : '#ffffff',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.klasifikasi}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input
                              type="text"
                              value={row.pemeriksaan}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  row.pkgIdx,
                                  row.origIdx,
                                  'pemeriksaan',
                                  e.target.value
                                )
                              }
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontWeight: 600,
                                color: '#0f172a',
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input
                              type="text"
                              value={row.satuan ?? ''}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  row.pkgIdx,
                                  row.origIdx,
                                  'satuan',
                                  e.target.value
                                )
                              }
                              placeholder="mis. g/dL / Negatif"
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input
                              type="text"
                              value={row.nilaiRujukan}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  row.pkgIdx,
                                  row.origIdx,
                                  'nilaiRujukan',
                                  e.target.value
                                )
                              }
                              placeholder="mis. 12 - 16 g/dL"
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ position: 'relative' }}>
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '0.6rem',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#64748b',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                }}
                              >
                                Rp
                              </span>
                              <input
                                type="number"
                                value={row.harga ?? '0'}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    row.pkgIdx,
                                    row.origIdx,
                                    'harga',
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.6rem 0.4rem 1.9rem',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontWeight: 600,
                                }}
                              />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                              {formatRupiah(Number(row.harga || 0))}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteItemRow(row.pkgIdx, row.origIdx)}
                              className="btn btn--danger btn--sm"
                              title="Hapus item ini"
                              style={{ padding: '0.3rem 0.6rem' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Total estimasi akumulasi {tableRows.length} item yang ditampilkan:{' '}
                <strong style={{ color: '#0f172a' }}>
                  {formatRupiah(
                    tableRows.reduce((acc, curr) => acc + (Number(curr.harga) || 0), 0)
                  )}
                </strong>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveAllChanges}
                disabled={saving || tableRows.length === 0}
                style={{ fontWeight: 600, background: '#0284c7' }}
              >
                💾 Simpan Semua Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Item Baru */}
      <Modal
        open={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        title="Tambah Item Pemeriksaan Baru"
      >
        <form onSubmit={handleAddItem}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Klasifikasi Paket <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={newKlasifikasi}
                onChange={(e) => setNewKlasifikasi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                }}
              >
                {paketList.map((p) => (
                  <option key={p.id} value={p.nama}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Nama Pemeriksaan / Item <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={newPemeriksaan}
                onChange={(e) => setNewPemeriksaan(e.target.value)}
                placeholder="mis. Hemoglobin, SGOT, Gula Darah Sewaktu..."
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Nilai Rujukan / Normal
                </label>
                <input
                  type="text"
                  value={newNilaiRujukan}
                  onChange={(e) => setNewNilaiRujukan(e.target.value)}
                  placeholder="mis. 12 - 16 g/dL"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Hasil (Format / Satuan)
                </label>
                <input
                  type="text"
                  value={newSatuan}
                  onChange={(e) => setNewSatuan(e.target.value)}
                  placeholder="mis. g/dL, /µL, Negatif"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Harga Pemeriksaan (Rp)
              </label>
              <input
                type="number"
                value={newHarga}
                onChange={(e) => setNewHarga(e.target.value)}
                placeholder="0"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
              />
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                {formatRupiah(Number(newHarga || 0))}
              </div>
            </div>
          </div>
          <ModalFormFooter
            onCancel={() => setAddItemModalOpen(false)}
            submitLabel="Tambahkan Item"
            loading={saving}
          />
        </form>
      </Modal>
    </div>
  );
}

