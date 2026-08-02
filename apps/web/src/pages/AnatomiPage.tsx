import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api.ts';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';

type RegioKey =
  | 'thorak'
  | 'kepala'
  | 'ossa-manus'
  | 'anthebrachi'
  | 'shoulder-joint'
  | 'lumbosacral'
  | 'bno'
  | 'femur'
  | 'cruris'
  | 'ankle-joint'
  | 'pedis';

interface RegioConfig {
  readonly label: string;
  readonly color: string;
  readonly shapes: readonly { readonly cx: number; readonly cy: number; readonly r: number }[];
}

interface AnatomiGambarItem {
  readonly id: string;
  readonly regio: string;
  readonly gambar: string;
  readonly keterangan: string | null;
  readonly createdAt: string;
}

const REGIO_CONFIG: Record<RegioKey, RegioConfig> = {
  thorak: {
    label: 'Thorak',
    color: '#dc2626',
    shapes: [{ cx: 100, cy: 100, r: 32 }],
  },
  kepala: {
    label: 'Kepala',
    color: '#eab308',
    shapes: [{ cx: 100, cy: 35, r: 27 }],
  },
  'ossa-manus': {
    label: 'Ossa Manus',
    color: '#2563eb',
    shapes: [
      { cx: 33, cy: 242, r: 16 },
      { cx: 167, cy: 242, r: 16 },
    ],
  },
  anthebrachi: {
    label: 'Anthebrachi',
    color: '#dc2626',
    shapes: [
      { cx: 38, cy: 195, r: 20 },
      { cx: 162, cy: 195, r: 20 },
    ],
  },
  'shoulder-joint': {
    label: 'Shoulder Joint',
    color: '#eab308',
    shapes: [
      { cx: 48, cy: 80, r: 15 },
      { cx: 152, cy: 80, r: 15 },
    ],
  },
  lumbosacral: {
    label: 'Lumbosacral',
    color: '#2563eb',
    shapes: [{ cx: 100, cy: 192, r: 26 }],
  },
  bno: {
    label: 'BNO',
    color: '#dc2626',
    shapes: [{ cx: 100, cy: 160, r: 30 }],
  },
  femur: {
    label: 'Femur',
    color: '#eab308',
    shapes: [
      { cx: 82, cy: 255, r: 20 },
      { cx: 118, cy: 255, r: 20 },
    ],
  },
  cruris: {
    label: 'Cruris',
    color: '#2563eb',
    shapes: [
      { cx: 80, cy: 340, r: 20 },
      { cx: 120, cy: 340, r: 20 },
    ],
  },
  'ankle-joint': {
    label: 'Ankle Joint',
    color: '#dc2626',
    shapes: [
      { cx: 80, cy: 388, r: 10 },
      { cx: 120, cy: 388, r: 10 },
    ],
  },
  pedis: {
    label: 'Pedis',
    color: '#eab308',
    shapes: [
      { cx: 75, cy: 405, r: 14 },
      { cx: 125, cy: 405, r: 14 },
    ],
  },
};

function compressImageFile(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal memproses gambar'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca file gambar'));
    };
    img.src = objectUrl;
  });
}

function BodyOutline({ regio }: { readonly regio: RegioKey }) {
  const config = REGIO_CONFIG[regio];
  return (
    <svg viewBox="0 0 200 420" width="220" height="462" role="img" aria-label={`Diagram regio ${config.label}`}>
      {/* Siluet tubuh sederhana (skematik, bukan ilustrasi medis presisi) */}
      <g fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="100" cy="35" r="27" />
        <line x1="100" y1="62" x2="100" y2="75" />
        <path d="M 65 75 Q 100 65 135 75 L 135 190 Q 100 205 65 190 Z" />
        <line x1="65" y1="130" x2="135" y2="130" />
        <path d="M 65 190 L 135 190 L 128 215 L 72 215 Z" />
        <line x1="65" y1="75" x2="35" y2="235" />
        <line x1="135" y1="75" x2="165" y2="235" />
        <circle cx="33" cy="242" r="10" />
        <circle cx="167" cy="242" r="10" />
        <line x1="80" y1="215" x2="76" y2="390" />
        <line x1="120" y1="215" x2="124" y2="390" />
        <ellipse cx="75" cy="405" rx="16" ry="9" />
        <ellipse cx="125" cy="405" rx="16" ry="9" />
      </g>

      {/* Highlight regio aktif */}
      <g fill={config.color} opacity="0.45" stroke={config.color} strokeWidth="2">
        {config.shapes.map((s, idx) => (
          <circle key={idx} cx={s.cx} cy={s.cy} r={s.r} />
        ))}
      </g>
    </svg>
  );
}

interface AnatomiPageProps {
  readonly regio: RegioKey;
}

export function AnatomiPage({ regio }: AnatomiPageProps) {
  const config = REGIO_CONFIG[regio];

  const [images, setImages] = useState<readonly AnatomiGambarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<AnatomiGambarItem | null>(null);
  const [zoomedFullSrc, setZoomedFullSrc] = useState<string | null>(null);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<AnatomiGambarItem | null>(null);
  const [keteranganDraft, setKeteranganDraft] = useState('');
  const [savingKeterangan, setSavingKeterangan] = useState(false);

  async function loadImages() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: readonly AnatomiGambarItem[] }>(
        `/api/anatomi-gambar?regio=${regio}`,
      );
      setImages(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat gambar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regio]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    void (async () => {
      try {
        const [gambar, thumbnail] = await Promise.all([
          compressImageFile(file, 1000, 0.75),
          compressImageFile(file, 200, 0.6),
        ]);
        await apiPost('/api/anatomi-gambar', { regio, gambar, thumbnail });
        await loadImages();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar');
      } finally {
        setUploading(false);
      }
    })();
  }

  function openZoom(item: AnatomiGambarItem) {
    setZoomedImage(item);
    setZoomedFullSrc(null);
    setZoomLoading(true);
    void (async () => {
      try {
        const res = await apiGet<{ item: AnatomiGambarItem }>(`/api/anatomi-gambar/${item.id}`);
        setZoomedFullSrc(res.item.gambar);
      } catch {
        setZoomedFullSrc(item.gambar);
      } finally {
        setZoomLoading(false);
      }
    })();
  }

  function openEditKeterangan(item: AnatomiGambarItem) {
    setEditingImage(item);
    setKeteranganDraft(item.keterangan ?? '');
  }

  async function saveKeterangan() {
    if (!editingImage) return;
    setSavingKeterangan(true);
    setError(null);
    try {
      await apiPatch(`/api/anatomi-gambar/${editingImage.id}`, { keterangan: keteranganDraft });
      setEditingImage(null);
      await loadImages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan keterangan');
    } finally {
      setSavingKeterangan(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await apiDelete(`/api/anatomi-gambar/${id}`);
      await loadImages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus gambar');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <h2 style={{ margin: '0 0 0.25rem' }}>🦴 Anatomi — {config.label}</h2>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b' }}>
        Diagram skematik posisi regio {config.label} pada tubuh (bukan ilustrasi medis presisi — untuk referensi
        posisi pemeriksaan saja). Unggah foto/gambar referensi Anda sendiri di bawah.
      </p>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '0 0 auto',
          }}
        >
          <BodyOutline regio={regio} />
          <div
            style={{
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              background: `${config.color}1a`,
              border: `1px solid ${config.color}`,
              color: config.color,
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: config.color }} />
            {config.label}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            flex: '1 1 320px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Galeri Referensi</div>
            <label
              className="btn btn--sm btn--primary"
              style={{ cursor: uploading ? 'wait' : 'pointer', margin: 0 }}
            >
              {uploading ? 'Mengunggah…' : '+ Tambah Gambar'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}

          {loading ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Memuat gambar…</p>
          ) : images.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Belum ada gambar referensi untuk regio ini. Klik "+ Tambah Gambar" untuk mengunggah.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <img
                    src={img.gambar}
                    alt={img.keterangan ?? config.label}
                    onClick={() => openZoom(img)}
                    style={{ width: '100%', height: 120, objectFit: 'cover', cursor: 'zoom-in' }}
                    title="Klik untuk perbesar"
                  />
                  <div style={{ display: 'flex' }}>
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={() => openEditKeterangan(img)}
                      style={{ borderRadius: 0, flex: 1 }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--danger"
                      onClick={() => void handleDelete(img.id)}
                      disabled={deletingId === img.id}
                      style={{ borderRadius: 0, flex: 1 }}
                    >
                      🗑️ {deletingId === img.id ? 'Menghapus…' : 'Hapus'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={zoomedImage !== null}
        title={zoomedImage?.keterangan || config.label}
        onClose={() => setZoomedImage(null)}
        size="xl"
      >
        {zoomedImage && (
          zoomLoading ? (
            <p style={{ margin: 0, padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Memuat gambar...
            </p>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={zoomedFullSrc ?? zoomedImage.gambar}
                alt={zoomedImage.keterangan ?? config.label}
                style={{
                  width: 840,
                  height: 720,
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          )
        )}
      </Modal>

      <Modal
        open={editingImage !== null}
        title="Edit Keterangan Gambar"
        onClose={() => setEditingImage(null)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveKeterangan();
          }}
          className="form-grid"
        >
          <div className="form-field form-grid--full">
            <label htmlFor="anatomi-keterangan">Keterangan</label>
            <textarea
              id="anatomi-keterangan"
              rows={3}
              value={keteranganDraft}
              onChange={(e) => setKeteranganDraft(e.target.value)}
              placeholder="Keterangan gambar (opsional)…"
            />
          </div>
          <ModalFormFooter
            onCancel={() => setEditingImage(null)}
            submitLabel="Simpan"
            loading={savingKeterangan}
          />
        </form>
      </Modal>
    </div>
  );
}
