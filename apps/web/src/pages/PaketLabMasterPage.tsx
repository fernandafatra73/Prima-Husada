import { useState, useCallback, useEffect } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api.ts';

export interface PaketLabItemData {
  id: string;
  paketId: string;
  grup: string;
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

const STANDARD_PACKAGES = [
  'Hematologi',
  'Kimia darah',
  'Diabetes',
  'Urinalisa',
  'Urin rutin',
  'Imunologi',
] as const;

export function PaketLabMasterPage() {
  const [paketList, setPaketList] = useState<PaketLabData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paketError, setPaketError] = useState<string | null>(null);
  
  const [newPaketNama, setNewPaketNama] = useState('');
  const [paketSaving, setPaketSaving] = useState(false);
  const [editPaket, setEditPaket] = useState<PaketLabData | null>(null);

  const loadPaketList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: PaketLabData[] }>('/api/paket-lab');
      setPaketList(res.items);
    } catch {
      setPaketList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaketList();
  }, [loadPaketList]);

  async function handleInitDefaults() {
    if (!confirm('Inisialisasi 6 Paket Pemeriksaan Lab Langsung Jadi (Hematologi, Kimia Darah, Diabetes, Urinalisa, Urin Rutin, Imunologi) beserta parameter standarnya?')) return;
    setPaketSaving(true);
    setPaketError(null);
    try {
      await apiPost('/api/paket-lab/init-defaults', {});
      await loadPaketList();
      alert('Berhasil menginisialisasi 6 paket pemeriksaan lab langsung jadi!');
    } catch (err: unknown) {
      setPaketError(err instanceof Error ? err.message : 'Gagal menginisialisasi paket lab');
    } finally {
      setPaketSaving(false);
    }
  }

  async function handleSelectOrInitPackage(pkgName: string) {
    const existing = paketList.find((p) => p.nama.toLowerCase() === pkgName.toLowerCase());
    if (existing) {
      setEditPaket(existing);
    } else {
      setPaketSaving(true);
      try {
        await apiPost('/api/paket-lab/init-defaults', {});
        const res = await apiGet<{ items: PaketLabData[] }>('/api/paket-lab');
        setPaketList(res.items);
        const created = res.items.find((p) => p.nama.toLowerCase() === pkgName.toLowerCase());
        if (created) setEditPaket(created);
      } catch (err: unknown) {
        setPaketError(err instanceof Error ? err.message : 'Gagal membuat paket');
      } finally {
        setPaketSaving(false);
      }
    }
  }

  async function handleCreatePaket(e: React.FormEvent) {
    e.preventDefault();
    if (!newPaketNama.trim()) return;
    setPaketSaving(true);
    setPaketError(null);
    try {
      await apiPost('/api/paket-lab', { nama: newPaketNama });
      setNewPaketNama('');
      await loadPaketList();
    } catch (err: unknown) {
      setPaketError(err instanceof Error ? err.message : 'Gagal membuat paket');
    } finally {
      setPaketSaving(false);
    }
  }

  async function handleDeletePaket(id: string) {
    if (!confirm('Hapus paket ini beserta semua itemnya?')) return;
    setPaketError(null);
    try {
      await apiDelete(`/api/paket-lab/${id}`);
      if (editPaket?.id === id) setEditPaket(null);
      await loadPaketList();
    } catch (err: unknown) {
      setPaketError(err instanceof Error ? err.message : 'Gagal menghapus paket');
    }
  }

  async function handleSavePaketItems(e: React.FormEvent) {
    e.preventDefault();
    if (!editPaket) return;
    setPaketSaving(true);
    setPaketError(null);
    try {
      await apiPatch(`/api/paket-lab/${editPaket.id}/items`, { items: editPaket.items });
      await loadPaketList();
      alert('Paket berhasil disimpan.');
    } catch (err: unknown) {
      setPaketError(err instanceof Error ? err.message : 'Gagal menyimpan item paket');
    } finally {
      setPaketSaving(false);
    }
  }

  return (
    <ListPageShell
      title="Master Jenis Pemeriksaan Lab / Paket"
      metrics={[]}
      searchPlaceholder="Cari paket..."
      searchValue=""
      onSearchChange={() => {}}
      onRefresh={loadPaketList}
      loading={loading}
      pagination={{ page: 1, limit: 100, total: paketList.length, totalPages: 1 }}
      onPageChange={() => {}}
      action={<div />}
    >
      <div style={{ padding: '1.25rem' }}>
        {/* Top Banner: Paket Langsung Jadi */}
        <div
          style={{
            background: '#e0f2fe',
            border: '1px solid #7dd3fc',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0369a1' }}>
                ⚡ Paket Pemeriksaan Lab Langsung Jadi (6 Klasifikasi Standar)
              </h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: '#0c4a6e' }}>
                Inisialisasi otomatis paket pemeriksaan lengkap: <strong>Hematologi</strong>, <strong>Kimia Darah</strong>, <strong>Diabetes</strong>, <strong>Urinalisa</strong>, <strong>Urine Rutin</strong>, dan <strong>Imunologi</strong> agar siap digunakan petugas.
              </p>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleInitDefaults}
              disabled={paketSaving}
              style={{ background: '#0284c7', color: '#ffffff', fontWeight: 600, padding: '0.6rem 1.1rem' }}
            >
              ✨ Inisialisasi 6 Paket Langsung Jadi
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid #bae6fd' }}>
            {STANDARD_PACKAGES.map((pkgName) => {
              const existing = paketList.find((p) => p.nama.toLowerCase() === pkgName.toLowerCase());
              const isSelected = editPaket?.nama.toLowerCase() === pkgName.toLowerCase();
              return (
                <button
                  key={pkgName}
                  type="button"
                  onClick={() => handleSelectOrInitPackage(pkgName)}
                  style={{
                    background: isSelected ? '#0284c7' : existing ? '#ffffff' : '#f0f9ff',
                    border: existing ? '2px solid #0284c7' : '1px dashed #0284c7',
                    borderRadius: '20px',
                    padding: '0.4rem 0.95rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isSelected ? '#ffffff' : '#0369a1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{existing ? '✔' : '+'}</span>
                  <span>{pkgName}</span>
                  {existing && (
                    <span style={{ fontSize: '0.75rem', color: isSelected ? '#e0f2fe' : '#64748b' }}>
                      ({existing.items.length} item)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', minHeight: '600px', alignItems: 'start' }}>
          
          {/* Left Sidebar: List of Packages */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', background: 'var(--color-bg-card)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <form onSubmit={handleCreatePaket} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Buat Paket Baru</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  value={newPaketNama}
                  onChange={(e) => setNewPaketNama(e.target.value)}
                  placeholder="Nama paket..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-button)' }}
                />
                <button type="submit" className="btn btn--primary btn--sm" disabled={paketSaving || !newPaketNama.trim()}>
                  {paketSaving ? '...' : 'Tambah'}
                </button>
              </div>
            </form>
            
            {paketError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{paketError}</p>}
            
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              Daftar Paket ({paketList.length})
            </div>
            
            {loading ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Memuat...</p>
            ) : paketList.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Belum ada paket</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', maxHeight: '500px', paddingRight: '0.5rem' }}>
                {paketList.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-button)',
                      background: editPaket?.id === p.id ? 'var(--color-bg-body)' : 'transparent',
                      border: editPaket?.id === p.id ? '1px solid var(--color-border)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => {
                      if (editPaket?.id !== p.id) {
                        setEditPaket(JSON.parse(JSON.stringify(p))); // deep copy
                        setPaketError(null);
                      }
                    }}
                  >
                    <span style={{ fontWeight: editPaket?.id === p.id ? 600 : 400, fontSize: '0.9rem' }}>{p.nama}</span>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', opacity: 0.7 }}
                      onClick={(e) => { e.stopPropagation(); void handleDeletePaket(p.id); }}
                      title="Hapus paket"
                    >
                      Del
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Area: Package Editor */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', background: 'var(--color-bg-card)', padding: '1.5rem', minHeight: '600px' }}>
            {editPaket ? (
              <form onSubmit={handleSavePaketItems}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Edit Paket: {editPaket.nama}</h3>
                    <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Tambahkan dan atur pemeriksaan yang tergabung dalam paket ini.
                    </p>
                  </div>
                  <button type="submit" className="btn btn--primary" disabled={paketSaving}>
                    {paketSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {editPaket.items.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                      Belum ada pemeriksaan di paket ini.
                    </p>
                  ) : (
                    editPaket.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 0.9fr 1fr 0.9fr auto', gap: '0.6rem', alignItems: 'center', background: 'var(--color-bg-body)', padding: '0.75rem', borderRadius: 'var(--radius-button)', border: '1px solid var(--color-border)' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Klasifikasi/Grup</label>
                          <input
                            type="text"
                            value={it.grup}
                            onChange={(e) => {
                              const newItems = [...editPaket.items];
                              newItems[idx].grup = e.target.value;
                              setEditPaket({ ...editPaket, items: newItems });
                            }}
                            placeholder="Cth: Hematologi"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Pemeriksaan *</label>
                          <input
                            type="text"
                            required
                            value={it.pemeriksaan}
                            onChange={(e) => {
                              const newItems = [...editPaket.items];
                              newItems[idx].pemeriksaan = e.target.value;
                              setEditPaket({ ...editPaket, items: newItems });
                            }}
                            placeholder="Cth: Hemoglobin"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Satuan / Format Hasil</label>
                          <input
                            type="text"
                            value={it.satuan ?? ''}
                            onChange={(e) => {
                              const newItems = [...editPaket.items];
                              newItems[idx].satuan = e.target.value;
                              setEditPaket({ ...editPaket, items: newItems });
                            }}
                            placeholder="Cth: g/dL / Negatif"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Nilai Rujukan</label>
                          <input
                            type="text"
                            value={it.nilaiRujukan}
                            onChange={(e) => {
                              const newItems = [...editPaket.items];
                              newItems[idx].nilaiRujukan = e.target.value;
                              setEditPaket({ ...editPaket, items: newItems });
                            }}
                            placeholder="Cth: L: 14-18"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Harga Item (Rp)</label>
                          <input
                            type="number"
                            value={it.harga ?? '0'}
                            onChange={(e) => {
                              const newItems = [...editPaket.items];
                              newItems[idx].harga = e.target.value;
                              setEditPaket({ ...editPaket, items: newItems });
                            }}
                            placeholder="0"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ marginTop: '1.25rem' }}>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => {
                              const newItems = editPaket.items.filter((_, i) => i !== idx);
                              setEditPaket({ ...editPaket, items: newItems });
                            }}
                            title="Hapus baris ini"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                    onClick={() => {
                      const prevGrup = editPaket.items.length > 0 ? editPaket.items[editPaket.items.length - 1].grup : '';
                      setEditPaket({
                        ...editPaket,
                        items: [...editPaket.items, { id: '', paketId: editPaket.id, grup: prevGrup, pemeriksaan: '', nilaiRujukan: '', satuan: '', harga: '0', urutan: editPaket.items.length }]
                      });
                    }}
                  >
                    + Tambah Baris Pemeriksaan
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: '1rem', fontStyle: 'italic' }}>Pilih paket dari daftar di sebelah kiri untuk mengedit item.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ListPageShell>
  );
}
