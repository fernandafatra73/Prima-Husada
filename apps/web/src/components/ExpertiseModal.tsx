import { useState, type FormEvent } from 'react';
import { Modal } from './ui/Modal.tsx';
import { apiDelete, apiPatch, apiPost } from '../lib/api.ts';
import { clampClinicalInput } from '../lib/clinicalText.ts';
import './ui/ui.css';

export interface KesanTemplateItem {
  readonly id: string;
  readonly judul: string;
  readonly isi: string;
}

interface ExpertiseModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelectTemplate: (isi: string) => void;
  readonly templates: readonly KesanTemplateItem[];
  readonly onTemplatesChanged: () => void | Promise<void>;
}

export function ExpertiseModal({
  open,
  onClose,
  onSelectTemplate,
  templates,
  onTemplatesChanged,
}: ExpertiseModalProps) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setJudul('');
    setIsi('');
    setError(null);
    setSelectedIds([]);
  }

  function handleOpenAdd() {
    setEditingId(null);
    setJudul('');
    setIsi('');
    setError(null);
    setShowForm(true);
  }

  function handleOpenEdit(t: KesanTemplateItem) {
    setEditingId(t.id);
    setJudul(t.judul);
    setIsi(t.isi);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !isi.trim()) {
      setError('Judul dan isi template wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const sanitizedIsi = clampClinicalInput(isi);
      if (editingId) {
        await apiPatch(`/api/kesan-template/${editingId}`, { judul, isi: sanitizedIsi });
      } else {
        await apiPost('/api/kesan-template', { judul, isi: sanitizedIsi });
      }
      resetForm();
      await onTemplatesChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan template');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/kesan-template/${id}`);
      setDeleteTargetId(null);
      await onTemplatesChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus template');
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    const allFilteredIds = filtered.map((t) => t.id);
    const allChecked =
      allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));
    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  }

  function handleApplySelected() {
    if (selectedIds.length === 0) return;
    const selectedTexts = templates
      .filter((t) => selectedIds.includes(t.id))
      .map((t) => t.isi);
    onSelectTemplate(selectedTexts.join('\n\n'));
    setSelectedIds([]);
    resetForm();
    onClose();
  }

  const filtered = templates.filter(
    (t) =>
      !search.trim() ||
      t.judul.toLowerCase().includes(search.toLowerCase()) ||
      t.isi.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal
      open={open}
      title="Pilih Template Expertise (Centang Satu / Lebih)"
      onClose={() => {
        resetForm();
        onClose();
      }}
      size="lg"
    >
      <div className="expertise-modal">
        {error && <div className="alert alert--error">{error}</div>}

        <div className="expertise-modal__topbar">
          <div className="filter-control filter-control--search" style={{ flex: 1 }}>
            <input
              type="text"
              className="filter-search__input"
              placeholder="Cari jenis pemeriksaan atau template kesan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={showForm ? resetForm : handleOpenAdd}
          >
            {showForm ? '× Batal Form' : '+ Tambah Expertise Baru'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={(e) => void handleSubmit(e)} className="expertise-form-card">
            <h4 className="expertise-form-card__title">
              {editingId ? 'Edit Template Expertise' : 'Tambah Template Expertise Baru'}
            </h4>
            <div className="form-field">
              <label htmlFor="exp-judul">Judul Template / Jenis Pemeriksaan</label>
              <input
                id="exp-judul"
                type="text"
                required
                placeholder="Contoh: Thorax Abdomen, USG Upper..."
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="exp-isi">Isi Teks Kesan</label>
              <textarea
                id="exp-isi"
                required
                rows={4}
                placeholder="Isikan draf template kesan radiologi..."
                value={isi}
                onChange={(e) => setIsi(clampClinicalInput(e.target.value))}
              />
            </div>
            <div className="form-actions form-actions--end">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={resetForm}
                disabled={saving}
              >
                Batal
              </button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
                {saving ? 'Memproses...' : editingId ? 'Simpan Perubahan' : 'Tambah Template'}
              </button>
            </div>
          </form>
        )}

        <div style={{ overflowX: 'auto', marginTop: '1rem', maxHeight: '55vh', overflowY: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
            <thead style={{ background: '#f0f9ff', color: '#0369a1', borderBottom: '2px solid #bae6fd', position: 'sticky', top: 0, zIndex: 5 }}>
              <tr>
                <th style={{ width: '50px', textAlign: 'center', padding: '10px' }}>
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((t) => selectedIds.includes(t.id))
                    }
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    title="Centang semua"
                  />
                </th>
                <th style={{ width: '220px', textAlign: 'left', padding: '10px' }}>
                  Judul / Pemeriksaan
                </th>
                <th style={{ textAlign: 'left', padding: '10px' }}>
                  Isi Kesan (Expertise)
                </th>
                <th style={{ width: '150px', textAlign: 'center', padding: '10px' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Tidak ada template expertise yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isChecked = selectedIds.includes(t.id);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => toggleSelect(t.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isChecked ? '#eff6ff' : 'transparent',
                        transition: 'background-color 0.15s ease',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(t.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                          {t.judul}
                        </div>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <pre
                          style={{
                            margin: 0,
                            fontFamily: 'inherit',
                            whiteSpace: 'pre-wrap',
                            color: '#334155',
                            fontSize: '0.88rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {t.isi}
                        </pre>
                        {deleteTargetId === t.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.6rem',
                              background: '#fef2f2',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <span style={{ fontSize: '0.82rem', color: '#b91c1c' }}>Hapus template ini?</span>
                            <button
                              type="button"
                              className="btn btn--xs btn--danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDelete(t.id);
                              }}
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              className="btn btn--xs btn--secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(null);
                              }}
                            >
                              Batal
                            </button>
                          </div>
                        )}
                      </td>
                      <td
                        style={{ textAlign: 'center', padding: '12px', verticalAlign: 'top' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn--xs btn--primary"
                            onClick={() => {
                              onSelectTemplate(t.isi);
                              setSelectedIds([]);
                              resetForm();
                              onClose();
                            }}
                            style={{ padding: '0.3rem 0.6rem', fontWeight: 600 }}
                            title="Pilih langsung template ini"
                          >
                            Pilih
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--edit"
                            onClick={() => handleOpenEdit(t)}
                            title="Edit template"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--delete"
                            onClick={() => setDeleteTargetId(t.id)}
                            title="Hapus template"
                          >
                            🗑️
                          </button>
                        </div>
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
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#475569' }}>
            {selectedIds.length > 0 ? (
              <span style={{ fontWeight: 600, color: '#0369a1' }}>
                ✓ {selectedIds.length} template terpilih
              </span>
            ) : (
              <span>Klik baris atau centang untuk memilih template.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setSelectedIds([]);
                resetForm();
                onClose();
              }}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleApplySelected}
              disabled={selectedIds.length === 0}
              style={{ fontWeight: 600 }}
            >
              ✓ Gunakan Template Terpilih ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
