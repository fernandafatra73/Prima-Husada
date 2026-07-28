import { useState } from 'react';
import { Modal } from './ui/Modal.tsx';
import { COMMON_RAD_PRESETS } from '../lib/penunjang.ts';
import './ui/ui.css';

interface PemeriksaanPenunjangModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly radTambahan: readonly string[];
  readonly labTambahan?: readonly string[];
  readonly onChange: (rad: string[], lab: string[]) => void;
}

export function PemeriksaanPenunjangModal({
  open,
  onClose,
  radTambahan,
  labTambahan = [],
  onChange,
}: PemeriksaanPenunjangModalProps) {
  const [customRad, setCustomRad] = useState('');

  function toggleRad(item: string) {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (radTambahan.includes(trimmed)) {
      onChange(
        radTambahan.filter((r) => r !== trimmed),
        [...labTambahan],
      );
    } else {
      onChange([...radTambahan, trimmed], [...labTambahan]);
    }
  }

  function handleAddCustomRad() {
    const trimmed = customRad.trim();
    if (!trimmed) return;
    if (!radTambahan.includes(trimmed)) {
      onChange([...radTambahan, trimmed], [...labTambahan]);
    }
    setCustomRad('');
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Pemeriksaan Penunjang Radiologi Tambahan"
      onClose={onClose}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', padding: '0.25rem 0' }}>
        {/* Bagian Radiologi */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem', background: 'var(--color-bg-subtle, #f9fafb)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                Pemeriksaan Tambahan Radiologi
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Pilih atau ketik jenis pemeriksaan radiologi tambahan
              </p>
            </div>
            {radTambahan.length > 0 && (
              <span className="badge badge--blue" style={{ fontSize: '0.8rem' }}>
                {radTambahan.length} item terpilih
              </span>
            )}
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
            {COMMON_RAD_PRESETS.map((p) => {
              const selected = radTambahan.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`btn btn--xs ${selected ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => toggleRad(p)}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '999px',
                    padding: '0.25rem 0.7rem',
                    fontSize: '0.82rem',
                    backgroundColor: selected ? 'var(--color-primary)' : 'white',
                    color: selected ? 'white' : 'var(--color-text)',
                  }}
                >
                  {selected ? '✓ ' : '+ '}
                  {p}
                </button>
              );
            })}
          </div>

          {/* Custom input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Tulis nama pemeriksaan radiologi lainnya..."
              value={customRad}
              onChange={(e) => setCustomRad(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomRad();
                }
              }}
              style={{ flex: 1, padding: '0.45rem 0.7rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
            />
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleAddCustomRad}
            >
              + Tambah
            </button>
          </div>

          {/* Selected badges */}
          {radTambahan.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)' }}>
              {radTambahan.map((r) => (
                <span
                  key={r}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.6rem',
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                  }}
                >
                  {r}
                  <button
                    type="button"
                    onClick={() => toggleRad(r)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3730a3', fontWeight: 'bold', padding: 0 }}
                    title="Hapus"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onChange([], [...labTambahan])}
        >
          Kosongkan Semua
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onClose}
        >
          Selesai ({radTambahan.length} item)
        </button>
      </div>
    </Modal>
  );
}
