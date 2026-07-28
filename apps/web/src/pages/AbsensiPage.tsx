import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/api.ts';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import '../components/ui/ui.css';

export interface AbsensiItem {
  id: string;
  namaKaryawan: string;
  role: string;
  tanggal: string;
  jamMasuk: string;
  jamPulang: string;
  status: string;
  keterangan?: string;
}

export function AbsensiPage() {
  const [items, setItems] = useState<AbsensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [filterTanggal, setFilterTanggal] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] ?? '2026-07-28';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formNama, setFormNama] = useState('');
  const [formRole, setFormRole] = useState('DOKTER');
  const [formTanggal, setFormTanggal] = useState(() => {
    return new Date().toISOString().split('T')[0] ?? '2026-07-28';
  });
  const [formJamMasuk, setFormJamMasuk] = useState('08:00');
  const [formJamPulang, setFormJamPulang] = useState('16:00');
  const [formStatus, setFormStatus] = useState('HADIR');
  const [formKeterangan, setFormKeterangan] = useState('Praktik Pagi');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: AbsensiItem[] }>(`/api/absensi?tanggal=${filterTanggal}`);
      setItems(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar hadir karyawan');
    } finally {
      setLoading(false);
    }
  }, [filterTanggal]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleInitDefaults() {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/absensi/init-defaults', {});
      await loadItems();
      alert('Berhasil menginisialisasi absensi harian standar Klinik Prima Husada.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menginisialisasi absensi');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenCreate() {
    setFormNama('');
    setFormRole('DOKTER');
    setFormTanggal(filterTanggal);
    setFormJamMasuk('08:00');
    setFormJamPulang('16:00');
    setFormStatus('HADIR');
    setFormKeterangan('Shift Pagi');
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/absensi', {
        namaKaryawan: formNama.trim(),
        role: formRole,
        tanggal: formTanggal,
        jamMasuk: formJamMasuk,
        jamPulang: formJamPulang,
        status: formStatus,
        keterangan: formKeterangan.trim(),
      });
      setModalOpen(false);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan absensi karyawan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus catatan absensi untuk "${nama}"?`)) return;
    setSaving(true);
    try {
      await apiDelete(`/api/absensi/${id}`);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus absensi');
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.namaKaryawan.toLowerCase().includes(q) ||
      it.role.toLowerCase().includes(q) ||
      (it.keterangan && it.keterangan.toLowerCase().includes(q))
    );
  });

  const countHadir = items.filter((i) => i.status === 'HADIR').length;
  const countIzin = items.filter((i) => i.status === 'IZIN').length;
  const countSakit = items.filter((i) => i.status === 'SAKIT').length;
  const countCuti = items.filter((i) => i.status === 'CUTI').length;

  return (
    <div className="list-page">
      <header className="list-page__header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Daftar Hadir Karyawan &amp; Staf (Presensi)
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Presensi harian dokter, analis lab, radiografer, apoteker, dan admin kasir Klinik Prima Husada.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleInitDefaults}
              disabled={saving}
              style={{ fontWeight: 600 }}
            >
              ✨ Inisialisasi Absensi Hari Ini
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleOpenCreate}
              style={{ fontWeight: 600, background: '#0284c7' }}
            >
              + Catat Kehadiran Baru
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="alert alert--danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            borderLeft: '4px solid #10b981',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Hadir / Dinas
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {countHadir} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>orang</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Izin / Dinas Luar
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {countIzin} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>orang</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Sakit
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {countSakit} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>orang</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            borderLeft: '4px solid #ef4444',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Cuti / Libur
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {countCuti} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>orang</span>
          </div>
        </div>
      </div>

      {/* Filter by date & search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontWeight: 600, color: '#334155' }}>Tanggal Presensi:</label>
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
            }}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Cari nama karyawan, jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.45rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              width: '260px',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Memuat data kehadiran karyawan...
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            padding: '3rem',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#334155' }}>Belum ada data kehadiran</h3>
          <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
            Klik tombol inisialisasi atau catat kehadiran baru untuk tanggal {filterTanggal}.
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleInitDefaults}
            disabled={saving}
          >
            ✨ Inisialisasi Absensi Hari Ini
          </button>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', width: '110px' }}>Tanggal</th>
                <th style={{ padding: '0.75rem 1rem' }}>Nama Karyawan / Staf</th>
                <th style={{ padding: '0.75rem 1rem', width: '160px' }}>Jabatan / Role</th>
                <th style={{ padding: '0.75rem 1rem', width: '130px', textAlign: 'center' }}>Jam Masuk - Pulang</th>
                <th style={{ padding: '0.75rem 1rem', width: '110px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Keterangan / Shift</th>
                <th style={{ padding: '0.75rem 1rem', width: '90px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                let badgeBg = '#dcfce7';
                let badgeCol = '#15803d';
                if (it.status === 'IZIN') {
                  badgeBg = '#dbeafe';
                  badgeCol = '#1e40af';
                } else if (it.status === 'SAKIT') {
                  badgeBg = '#fef3c7';
                  badgeCol = '#92400e';
                } else if (it.status === 'CUTI') {
                  badgeBg = '#fee2e2';
                  badgeCol = '#b91c1c';
                }

                return (
                  <tr
                    key={it.id}
                    style={{
                      background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>
                      {it.tanggal}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {it.namaKaryawan}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                          background: '#e2e8f0',
                          color: '#334155',
                        }}
                      >
                        {it.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                      {it.jamMasuk} - {it.jamPulang}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          background: badgeBg,
                          color: badgeCol,
                        }}
                      >
                        {it.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {it.keterangan || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => handleDelete(it.id, it.namaKaryawan)}
                        title="Hapus presensi"
                        style={{ padding: '0.3rem 0.5rem' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Check-In */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Catat Kehadiran Karyawan Baru">
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Nama Karyawan / Dokter <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="mis. dr. Hendra Kusumah, Sp.Rad / Ahmad Fauzi..."
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Jabatan / Role <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="DOKTER RADIOLOGI">DOKTER RADIOLOGI</option>
                  <option value="DOKTER LAB">DOKTER LABORATORIUM</option>
                  <option value="DOKTER UMUM">DOKTER KLINIK UMUM</option>
                  <option value="ANALIS LAB">ANALIS LABORATORIUM</option>
                  <option value="RADIOGRAFER">RADIOGRAFER</option>
                  <option value="APOTEKER">APOTEKER (FARMASI)</option>
                  <option value="PERAWAT">PERAWAT MEDIS</option>
                  <option value="ADMIN KASIR">ADMIN / KASIR</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Status Kehadiran <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="HADIR">HADIR / DINAS</option>
                  <option value="IZIN">IZIN / DINAS LUAR</option>
                  <option value="SAKIT">SAKIT</option>
                  <option value="CUTI">CUTI / LIBUR</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Jam Masuk
                </label>
                <input
                  type="time"
                  value={formJamMasuk}
                  onChange={(e) => setFormJamMasuk(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Jam Pulang
                </label>
                <input
                  type="time"
                  value={formJamPulang}
                  onChange={(e) => setFormJamPulang(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Keterangan / Shift
              </label>
              <input
                type="text"
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="mis. Praktik Pagi / Shift 1 / Dinas Luar Kota"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <ModalFormFooter
            onCancel={() => setModalOpen(false)}
            submitLabel="Simpan Presensi"
            loading={saving}
          />
        </form>
      </Modal>
    </div>
  );
}
