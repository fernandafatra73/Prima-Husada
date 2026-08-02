import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api.ts';

interface KesanBacaanItem {
  readonly id: string;
  readonly teks: string;
}

interface KesanRegioItem {
  readonly id: string;
  readonly nama: string;
  readonly bacaan: readonly KesanBacaanItem[];
}

const KESAN_REGIO_GRUP_NAMA = 'Menu Kesan Cepat';

interface KesanRegioPickerProps {
  readonly onSelect: (teks: string) => void;
}

/** Menu kesan cepat bertingkat (regio → bacaan) dipakai di form Edit Cepat radiologi. */
export function KesanRegioPicker({ onSelect }: KesanRegioPickerProps) {
  const [kesanRegioList, setKesanRegioList] = useState<readonly KesanRegioItem[]>([]);
  const [kesanRegioLoaded, setKesanRegioLoaded] = useState(false);
  const [activeKesanRegioId, setActiveKesanRegioId] = useState<string | null>(null);
  const [newBacaanText, setNewBacaanText] = useState('');
  const [addingBacaan, setAddingBacaan] = useState(false);
  const [editingBacaanId, setEditingBacaanId] = useState<string | null>(null);

  async function loadKesanRegioList() {
    try {
      const res = await apiGet<{
        items: readonly { readonly id: string; readonly nama: string; readonly kategori: readonly KesanRegioItem[] }[];
      }>('/api/kesan-bacaan-grup');
      const grup = res.items.find((g) => g.nama === KESAN_REGIO_GRUP_NAMA);
      setKesanRegioList(grup?.kategori ?? []);
    } catch {
      // Menu kesan cepat bersifat opsional; form tetap bisa dipakai tanpanya.
    } finally {
      setKesanRegioLoaded(true);
    }
  }

  useEffect(() => {
    void loadKesanRegioList();
  }, []);

  function cancelEditBacaan() {
    setEditingBacaanId(null);
    setNewBacaanText('');
  }

  function startEditBacaan(bacaan: KesanBacaanItem) {
    setEditingBacaanId(bacaan.id);
    setNewBacaanText(bacaan.teks);
  }

  async function saveBacaanToActiveRegio() {
    if (!newBacaanText.trim()) return;
    setAddingBacaan(true);
    try {
      if (editingBacaanId) {
        await apiPatch(`/api/kesan-bacaan/${editingBacaanId}`, { teks: newBacaanText.trim() });
      } else {
        if (!activeKesanRegioId) return;
        await apiPost('/api/kesan-bacaan', { kategoriId: activeKesanRegioId, teks: newBacaanText.trim() });
      }
      setNewBacaanText('');
      setEditingBacaanId(null);
      await loadKesanRegioList();
    } finally {
      setAddingBacaan(false);
    }
  }

  if (!kesanRegioLoaded) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Memuat menu kesan cepat…</p>;
  }

  return (
    <div>
      <span className="form-field__static-label">Menu kesan cepat (klik regio, lalu pilih bacaan)</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
        {kesanRegioList.map((regio) => (
          <button
            key={regio.id}
            type="button"
            className={`btn btn--xs ${activeKesanRegioId === regio.id ? 'btn--primary' : 'btn--ghost'}`}
            style={activeKesanRegioId !== regio.id ? { border: '1px solid var(--color-border)' } : {}}
            onClick={() => {
              setActiveKesanRegioId((cur) => (cur === regio.id ? null : regio.id));
              cancelEditBacaan();
            }}
          >
            {regio.nama}
          </button>
        ))}
      </div>

      {activeKesanRegioId && (
        <div
          style={{
            marginTop: '0.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
          }}
        >
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {(() => {
              const regio = kesanRegioList.find((r) => r.id === activeKesanRegioId);
              if (!regio || regio.bacaan.length === 0) {
                return (
                  <p style={{ margin: 0, padding: '0.6rem 0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Belum ada bacaan untuk regio ini.
                  </p>
                );
              }
              return regio.bacaan.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(b.teks);
                      setActiveKesanRegioId(null);
                    }}
                    style={{
                      flex: 1,
                      display: 'block',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-alt, #f1f5f9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {b.teks}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditBacaan(b)}
                    title="Edit bacaan ini"
                    style={{
                      border: 'none',
                      borderLeft: '1px solid var(--color-border)',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '0 0.6rem',
                    }}
                  >
                    ✏️
                  </button>
                </div>
              ));
            })()}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.4rem',
              padding: '0.5rem',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface-alt, #f8fafc)',
            }}
          >
            <textarea
              rows={3}
              value={newBacaanText}
              onChange={(e) => setNewBacaanText(e.target.value)}
              placeholder={editingBacaanId ? 'Ubah teks bacaan… (bisa sampai 3 baris)' : 'Tambah opsi bacaan baru… (bisa sampai 3 baris)'}
              style={{ flex: 1, fontSize: '0.85rem', resize: 'vertical' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void saveBacaanToActiveRegio();
                }
              }}
            />
            {editingBacaanId && (
              <button type="button" className="btn btn--xs btn--ghost" onClick={cancelEditBacaan}>
                Batal
              </button>
            )}
            <button
              type="button"
              className="btn btn--xs btn--primary"
              disabled={!newBacaanText.trim() || addingBacaan}
              onClick={() => void saveBacaanToActiveRegio()}
            >
              {addingBacaan ? 'Menyimpan…' : editingBacaanId ? 'Simpan' : '+ Tambah'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
