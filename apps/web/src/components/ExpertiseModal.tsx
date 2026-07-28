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

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setJudul('');
    setIsi('');
    setError(null);
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

  const filtered = templates.filter(
    (t) =>
      !search.trim() ||
      t.judul.toLowerCase().includes(search.toLowerCase()) ||
      t.isi.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal open={open} title="Pilih Template Expertise" onClose={() => { resetForm(); onClose(); }} size="lg">
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

        <div className="expertise-grid">
          {filtered.length === 0 ? (
            <p className="loading-text" style={{ textAlign: 'center', padding: '1.5rem', width: '100%' }}>
              Tidak ada template expertise yang ditemukan.
            </p>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="expertise-card">
                <div className="expertise-card__header">
                  <h4 className="expertise-card__title">{t.judul}</h4>
                  <div className="expertise-card__actions">
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
                    <button
                      type="button"
                      className="btn btn--xs btn--primary"
                      onClick={() => {
                        onSelectTemplate(t.isi);
                        resetForm();
                        onClose();
                      }}
                    >
                      Pilih
                    </button>
                  </div>
                </div>
                <div className="expertise-card__body">
                  <pre className="expertise-card__text">{t.isi}</pre>
                </div>
                {deleteTargetId === t.id && (
                  <div className="expertise-card__delete-confirm">
                    <span>Hapus template ini?</span>
                    <button
                      type="button"
                      className="btn btn--xs btn--danger"
                      onClick={() => void handleDelete(t.id)}
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      className="btn btn--xs btn--secondary"
                      onClick={() => setDeleteTargetId(null)}
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
