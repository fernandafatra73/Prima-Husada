import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import '../components/ui/ui.css';

export interface KeuanganSummary {
  totalPendapatanPasien: string;
  totalSharingDokter: string;
  totalKasMasuk: string;
  totalKasKeluar: string;
  totalPendapatanBruto: string;
  totalPengeluaran: string;
  nettoKas: string;
}

export interface KeuanganTransaksiItem {
  id: string;
  tanggal: string;
  jenis: 'MASUK' | 'KELUAR';
  kategori: string;
  keterangan: string;
  nominal: string;
  referensi?: string;
}

export function KeuanganPembukuanPage() {
  const [summary, setSummary] = useState<KeuanganSummary | null>(null);
  const [items, setItems] = useState<KeuanganTransaksiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'BUKU_KAS' | 'DEPARTEMEN'>('BUKU_KAS');
  const [filterJenis, setFilterJenis] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formTanggal, setFormTanggal] = useState(() => {
    return new Date().toISOString().split('T')[0] ?? '2026-07-28';
  });
  const [formJenis, setFormJenis] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [formKategori, setFormKategori] = useState('LAYANAN_PASIEN');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formNominal, setFormNominal] = useState('500000');
  const [formReferensi, setFormReferensi] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, txRes] = await Promise.all([
        apiGet<KeuanganSummary>('/api/keuangan/summary'),
        apiGet<{ items: KeuanganTransaksiItem[] }>('/api/keuangan/transaksi'),
      ]);
      setSummary(sumRes);
      setItems(txRes.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data keuangan klinik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleInitDefaults() {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/keuangan/init-defaults', {});
      await loadData();
      alert('Berhasil menginisialisasi transaksi standar pembukuan kas Klinik Prima Husada.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menginisialisasi pembukuan');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenCreate() {
    setFormTanggal(new Date().toISOString().split('T')[0] ?? '2026-07-28');
    setFormJenis('MASUK');
    setFormKategori('LAYANAN_PASIEN');
    setFormKeterangan('');
    setFormNominal('1000000');
    setFormReferensi(`KAS-${Date.now().toString().slice(-4)}`);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/keuangan/transaksi', {
        tanggal: formTanggal,
        jenis: formJenis,
        kategori: formKategori,
        keterangan: formKeterangan.trim(),
        nominal: formNominal,
        referensi: formReferensi.trim(),
      });
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi kas');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(it: KeuanganTransaksiItem) {
    if (!confirm(`Hapus catatan transaksi "${it.keterangan}"?`)) return;
    setSaving(true);
    try {
      await apiDelete(`/api/keuangan/transaksi/${it.id}`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus transaksi');
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = items.filter((it) => {
    if (filterJenis !== 'ALL' && it.jenis !== filterJenis) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.keterangan.toLowerCase().includes(q) ||
      it.kategori.toLowerCase().includes(q) ||
      (it.referensi && it.referensi.toLowerCase().includes(q))
    );
  });

  const totalPendapatanBrutoNum = summary ? Number(summary.totalPendapatanBruto) || 0 : 0;
  const totalSharingDokterNum = summary ? Number(summary.totalSharingDokter) || 0 : 0;
  const totalPengeluaranNum = summary ? Number(summary.totalPengeluaran) || 0 : 0;
  const nettoKasNum = summary ? Number(summary.nettoKas) || 0 : 0;

  return (
    <div className="list-page">
      <header className="list-page__header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Manajemen Keuangan &amp; Pembukuan Klinik
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Arus kas, rekap penerimaan layanan laboratorium, radiologi, klinik umum, komisi dokter, &amp; pengeluaran operasional.
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
              ✨ Inisialisasi Buku Kas Standar
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleOpenCreate}
              style={{ fontWeight: 600, background: '#0284c7' }}
            >
              + Catat Transaksi Kas Baru
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="alert alert--danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
            Total Pendapatan (Bruto)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>
            {formatRupiah(totalPendapatanBrutoNum)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Pasien Layanan &amp; Pemasukan Kas
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
            Total Sharing Dokter (Komisi)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e40af', marginTop: '0.35rem' }}>
            {formatRupiah(totalSharingDokterNum)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Insentif Dokter Lab &amp; Radiologi
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
            Total Pengeluaran Kas
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#b45309', marginTop: '0.35rem' }}>
            {formatRupiah(totalPengeluaranNum)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Operasional, Reagen, &amp; Sharing
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            borderLeft: `4px solid ${nettoKasNum >= 0 ? '#10b981' : '#ef4444'}`,
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Netto Kas / Laba Bersih
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: nettoKasNum >= 0 ? '#10b981' : '#ef4444',
              marginTop: '0.35rem',
            }}
          >
            {formatRupiah(nettoKasNum)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Surplus Kas Operasional Klinik
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('BUKU_KAS')}
          style={{
            padding: '0.7rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'BUKU_KAS' ? '3px solid #0284c7' : '3px solid transparent',
            background: activeTab === 'BUKU_KAS' ? '#f0f9ff' : 'transparent',
            color: activeTab === 'BUKU_KAS' ? '#0284c7' : '#64748b',
            fontWeight: activeTab === 'BUKU_KAS' ? 700 : 500,
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
          }}
        >
          📘 Buku Kas Umum (Arus Kas)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DEPARTEMEN')}
          style={{
            padding: '0.7rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'DEPARTEMEN' ? '3px solid #0284c7' : '3px solid transparent',
            background: activeTab === 'DEPARTEMEN' ? '#f0f9ff' : 'transparent',
            color: activeTab === 'DEPARTEMEN' ? '#0284c7' : '#64748b',
            fontWeight: activeTab === 'DEPARTEMEN' ? 700 : 500,
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
          }}
        >
          📊 Rekap Pendapatan per Departemen
        </button>
      </div>

      {activeTab === 'BUKU_KAS' ? (
        <>
          {/* Filter Jenis & Search */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'ALL', label: 'Semua Transaksi' },
                { id: 'MASUK', label: '💚 Pemasukan Kas' },
                { id: 'KELUAR', label: '🔻 Pengeluaran Kas' },
              ].map((b) => {
                const isActive = filterJenis === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setFilterJenis(b.id as 'ALL' | 'MASUK' | 'KELUAR')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      background: isActive ? '#f0f9ff' : '#ffffff',
                      color: isActive ? '#0284c7' : '#475569',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
            <div>
              <input
                type="text"
                placeholder="Cari keterangan, kategori, referensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.5rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  width: '280px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Memuat buku kas umum...
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
              <h3 style={{ margin: '0 0 0.5rem', color: '#334155' }}>Belum ada transaksi tercatat</h3>
              <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
                Klik tombol inisialisasi buku kas untuk mengisi transaksi standar Klinik Prima Husada.
              </p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleInitDefaults}
                disabled={saving}
              >
                ✨ Inisialisasi Buku Kas Standar
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
                    <th style={{ padding: '0.75rem 1rem', width: '120px' }}>Referensi</th>
                    <th style={{ padding: '0.75rem 1rem', width: '110px', textAlign: 'center' }}>Jenis</th>
                    <th style={{ padding: '0.75rem 1rem', width: '150px' }}>Kategori</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Keterangan Transaksi</th>
                    <th style={{ padding: '0.75rem 1rem', width: '160px', textAlign: 'right' }}>Nominal (Rp)</th>
                    <th style={{ padding: '0.75rem 1rem', width: '90px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((it, idx) => {
                    const isMasuk = it.jenis === 'MASUK';
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
                          {it.referensi || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              background: isMasuk ? '#dcfce7' : '#fee2e2',
                              color: isMasuk ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {it.jenis}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#334155',
                            }}
                          >
                            {it.kategori}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 500 }}>
                          {it.keterangan}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: isMasuk ? '#10b981' : '#ef4444',
                          }}
                        >
                          {isMasuk ? '+ ' : '- '}
                          {formatRupiah(Number(it.nominal) || 0)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => handleDelete(it)}
                            title="Hapus transaksi"
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
        </>
      ) : (
        /* Departemen Breakdown Tab */
        <div
          style={{
            background: '#ffffff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: '#0f172a' }}>
            Kontribusi Pendapatan Layanan per Departemen Klinik Prima Husada
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Distribusi estimasi pendapatan dari pendaftaran layanan Laboratorium, Radiologi, Klinik Umum, dan Apotek Farmasi.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              {
                nama: 'Laboratorium Klinik (6 Klasifikasi Pemeriksaan)',
                porsi: 45,
                warna: '#0284c7',
                desc: 'Hematologi, Kimia Darah, Diabetes, Urinalisa, Urin Rutin, Imunologi',
              },
              {
                nama: 'Radiologi Lengkap (Roentgen)',
                porsi: 25,
                warna: '#10b981',
                desc: 'Thorax, Cranium, Dental, Extremity dengan pilihan bacaan & keahlian radiolog',
              },
              {
                nama: 'Instalasi Farmasi & Apotek Rawat Jalan',
                porsi: 20,
                warna: '#8b5cf6',
                desc: 'Resep obat dokter, obat bebas, suplemen, & bahan habis pakai medis',
              },
              {
                nama: 'Poli Klinik Umum & Konsultasi Dokter',
                porsi: 10,
                warna: '#f59e0b',
                desc: 'Pemeriksaan dokter umum, surat sehat, tindakan medis ringan',
              },
            ].map((d) => (
              <div key={d.nama}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.nama}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                      ({d.desc})
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: d.warna }}>{d.porsi}%</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${d.porsi}%`,
                      background: d.warna,
                      height: '100%',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Catat Transaksi Baru */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Catat Transaksi Kas Baru">
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Tanggal Transaksi
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
                  No. Referensi
                </label>
                <input
                  type="text"
                  value={formReferensi}
                  onChange={(e) => setFormReferensi(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Jenis Transaksi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value as 'MASUK' | 'KELUAR')}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="MASUK">💚 PEMASUKAN KAS (IN)</option>
                  <option value="KELUAR">🔻 PENGELUARAN KAS (OUT)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Kategori <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="LAYANAN_PASIEN">Pendapatan Layanan Pasien (Lab &amp; Rad)</option>
                  <option value="FARMASI_BHP">Pendapatan / Pengadaan Farmasi &amp; Apotek</option>
                  <option value="OPERASIONAL">Beban Operasional Klinik (Listrik, Air, Wifi)</option>
                  <option value="PEMBELIAN_BHP">Pembelian Reagen &amp; BHP Medis</option>
                  <option value="GAJI_INSENTIF">Gaji Karyawan &amp; Sharing Dokter</option>
                  <option value="LAINNYA">Lain-lain</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Keterangan Transaksi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="mis. Pembayaran Tagihan Reagen AGFA / Penerimaan Kas Siang..."
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Nominal (Rp) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                required
                value={formNominal}
                onChange={(e) => setFormNominal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: formJenis === 'MASUK' ? '#15803d' : '#b91c1c',
                }}
              />
            </div>
          </div>

          <ModalFormFooter
            onCancel={() => setModalOpen(false)}
            submitLabel="Simpan Transaksi Kas"
            loading={saving}
          />
        </form>
      </Modal>
    </div>
  );
}
