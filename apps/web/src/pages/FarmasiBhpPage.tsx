import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import { Modal } from '../components/ui/Modal.tsx';
import { ModalFormFooter } from '../components/ui/ModalFormFooter.tsx';
import '../components/ui/ui.css';

export interface FarmasiBhpItem {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  stokMin: number;
  hargaBeli: string;
  hargaJual: string;
  keterangan?: string;
}

export function FarmasiBhpPage() {
  const [items, setItems] = useState<FarmasiBhpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'OBAT' | 'BHP' | 'MIN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState<'OBAT' | 'BHP'>('OBAT');
  const [formSatuan, setFormSatuan] = useState('Strip');
  const [formStok, setFormStok] = useState('100');
  const [formStokMin, setFormStokMin] = useState('15');
  const [formHargaBeli, setFormHargaBeli] = useState('5000');
  const [formHargaJual, setFormHargaJual] = useState('10000');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Modal Adjust Stock (Pakai / Restock)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<FarmasiBhpItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustType, setAdjustType] = useState<'PAKAI' | 'TAMBAH'>('PAKAI');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: FarmasiBhpItem[] }>('/api/farmasi-bhp');
      setItems(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data Farmasi & BHP');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleInitDefaults() {
    if (
      !confirm(
        'Inisialisasi 20 standar stok obat apotek dan bahan habis pakai (BHP) laboratorium & radiologi?'
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/farmasi-bhp/init-defaults', {});
      await loadItems();
      alert('Berhasil menginisialisasi standar 20 data Obat dan BHP.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menginisialisasi data standar');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenCreate() {
    setEditId(null);
    setFormKode(`OBT-${Date.now().toString().slice(-4)}`);
    setFormNama('');
    setFormKategori('OBAT');
    setFormSatuan('Strip');
    setFormStok('100');
    setFormStokMin('15');
    setFormHargaBeli('5000');
    setFormHargaJual('10000');
    setFormKeterangan('');
    setModalOpen(true);
  }

  function handleOpenEdit(it: FarmasiBhpItem) {
    setEditId(it.id);
    setFormKode(it.kode);
    setFormNama(it.nama);
    setFormKategori(it.kategori === 'BHP' ? 'BHP' : 'OBAT');
    setFormSatuan(it.satuan);
    setFormStok(String(it.stok));
    setFormStokMin(String(it.stokMin));
    setFormHargaBeli(it.hargaBeli);
    setFormHargaJual(it.hargaJual);
    setFormKeterangan(it.keterangan ?? '');
    setModalOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        kode: formKode.trim(),
        nama: formNama.trim(),
        kategori: formKategori,
        satuan: formSatuan.trim(),
        stok: Number(formStok) || 0,
        stokMin: Number(formStokMin) || 10,
        hargaBeli: formHargaBeli,
        hargaJual: formHargaJual,
        keterangan: formKeterangan.trim(),
      };
      if (editId) {
        await apiPatch(`/api/farmasi-bhp/${editId}`, payload);
      } else {
        await apiPost('/api/farmasi-bhp', payload);
      }
      setModalOpen(false);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan barang farmasi/BHP');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(it: FarmasiBhpItem) {
    if (!confirm(`Hapus barang "${it.nama}" dari inventaris?`)) return;
    setSaving(true);
    try {
      await apiDelete(`/api/farmasi-bhp/${it.id}`);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus barang');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustItem) return;
    const q = Number(adjustQty) || 0;
    if (q <= 0) return;

    const newStok =
      adjustType === 'PAKAI' ? Math.max(0, adjustItem.stok - q) : adjustItem.stok + q;

    setSaving(true);
    try {
      await apiPatch(`/api/farmasi-bhp/${adjustItem.id}`, { stok: newStok });
      setAdjustModalOpen(false);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui stok');
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = items.filter((it) => {
    if (activeTab === 'OBAT' && it.kategori !== 'OBAT') return false;
    if (activeTab === 'BHP' && it.kategori !== 'BHP') return false;
    if (activeTab === 'MIN' && it.stok > it.stokMin) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.nama.toLowerCase().includes(q) ||
      it.kode.toLowerCase().includes(q) ||
      (it.keterangan && it.keterangan.toLowerCase().includes(q))
    );
  });

  const totalObatCount = items.filter((i) => i.kategori === 'OBAT').length;
  const totalBhpCount = items.filter((i) => i.kategori === 'BHP').length;
  const lowStockCount = items.filter((i) => i.stok <= i.stokMin).length;
  const totalAsetValue = items.reduce(
    (acc, curr) => acc + curr.stok * (Number(curr.hargaBeli) || 0),
    0
  );

  return (
    <div className="list-page">
      <header className="list-page__header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Manajemen Farmasi &amp; Bahan Habis Pakai (BHP)
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Stok obat apotek, resep pasien, dan inventaris bahan medis habis pakai (Reagen Lab, Film Rontgen, Spuit, dll).
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
              ✨ Inisialisasi 20 Stok Obat &amp; BHP Standar
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleOpenCreate}
              style={{ fontWeight: 600, background: '#0284c7' }}
            >
              + Tambah Barang Baru
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
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Item Obat (Farmasi)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {totalObatCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>jenis obat</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Item BHP Medis
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {totalBhpCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>item habis pakai</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Stok Perlu Restock (&le; Min)
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: lowStockCount > 0 ? '#ef4444' : '#10b981',
              marginTop: '0.25rem',
            }}
          >
            {lowStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>item menipis</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Total Nilai Aset Stok
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>
            {formatRupiah(totalAsetValue)}
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'Semua Barang', count: items.length },
            { id: 'OBAT', label: 'Obat-obatan (Farmasi)', count: totalObatCount },
            { id: 'BHP', label: 'Bahan Habis Pakai (BHP)', count: totalBhpCount },
            { id: 'MIN', label: '⚠️ Stok Menipis / Kritis', count: lowStockCount },
          ].map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                style={{
                  padding: '0.65rem 1.1rem',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                  background: isActive ? '#f0f9ff' : 'transparent',
                  color: isActive ? '#0284c7' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  transition: 'all 0.2s',
                }}
              >
                {t.label} ({t.count})
              </button>
            );
          })}
        </div>
        <div>
          <input
            type="text"
            placeholder="Cari kode, nama obat/BHP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 0.8rem',
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
          Memuat data stok farmasi dan bahan habis pakai...
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
          <h3 style={{ margin: '0 0 0.5rem', color: '#334155' }}>Inventaris Masih Kosong</h3>
          <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
            Klik tombol inisialisasi di bawah untuk mengisi data otomatis dengan 20 item standar Klinik Prima Husada.
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleInitDefaults}
            disabled={saving}
          >
            ✨ Inisialisasi 20 Stok Obat &amp; BHP Standar
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
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '120px' }}>Kode / Tipe</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Barang / Obat</th>
                  <th style={{ padding: '0.75rem 1rem', width: '90px' }}>Satuan</th>
                  <th style={{ padding: '0.75rem 1rem', width: '130px', textAlign: 'center' }}>Stok Saat Ini</th>
                  <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Harga Beli</th>
                  <th style={{ padding: '0.75rem 1rem', width: '140px' }}>Harga Jual / Tarif</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Keterangan</th>
                  <th style={{ padding: '0.75rem 1rem', width: '170px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it, idx) => {
                  const isLow = it.stok <= it.stokMin;
                  return (
                    <tr
                      key={it.id}
                      style={{
                        background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.kode}</div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: it.kategori === 'OBAT' ? '#dbeafe' : '#fef3c7',
                            color: it.kategori === 'OBAT' ? '#1e40af' : '#92400e',
                          }}
                        >
                          {it.kategori}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {it.nama}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{it.satuan}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            background: isLow ? '#fee2e2' : '#dcfce7',
                            color: isLow ? '#b91c1c' : '#15803d',
                          }}
                        >
                          {it.stok} {it.satuan}
                        </span>
                        {isLow ? (
                          <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, marginTop: '0.15rem' }}>
                            Min: {it.stokMin}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                        {formatRupiah(Number(it.hargaBeli) || 0)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>
                        {formatRupiah(Number(it.hargaJual) || 0)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
                        {it.keterangan || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => {
                              setAdjustItem(it);
                              setAdjustType('PAKAI');
                              setAdjustQty('1');
                              setAdjustModalOpen(true);
                            }}
                            title="Catat pemakaian / resep"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            - Pakai
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => {
                              setAdjustItem(it);
                              setAdjustType('TAMBAH');
                              setAdjustQty('10');
                              setAdjustModalOpen(true);
                            }}
                            title="Restock barang masuk"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            + Stok
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => handleOpenEdit(it)}
                            title="Edit data"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => handleDelete(it)}
                            title="Hapus"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Obat / BHP' : 'Tambah Barang Baru'}
      >
        <form onSubmit={handleSaveItem}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Kode Barang <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Kategori <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as 'OBAT' | 'BHP')}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="OBAT">OBAT (Farmasi Apotek)</option>
                  <option value="BHP">BHP (Bahan Habis Pakai Medis/Lab)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Nama Barang / Obat <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="mis. Paracetamol 500mg, Spuit 3cc Terumo..."
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Satuan
                </label>
                <input
                  type="text"
                  value={formSatuan}
                  onChange={(e) => setFormSatuan(e.target.value)}
                  placeholder="Strip, Pcs, Box..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Stok Awal
                </label>
                <input
                  type="number"
                  value={formStok}
                  onChange={(e) => setFormStok(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Stok Min (Alert)
                </label>
                <input
                  type="number"
                  value={formStokMin}
                  onChange={(e) => setFormStokMin(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Harga Beli (Rp)
                </label>
                <input
                  type="number"
                  value={formHargaBeli}
                  onChange={(e) => setFormHargaBeli(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Harga Jual / Tarif (Rp)
                </label>
                <input
                  type="number"
                  value={formHargaJual}
                  onChange={(e) => setFormHargaJual(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                Keterangan
              </label>
              <input
                type="text"
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="Kegunaan atau spesifikasi barang"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <ModalFormFooter
            onCancel={() => setModalOpen(false)}
            submitLabel={editId ? 'Simpan Perubahan' : 'Tambahkan Barang'}
            loading={saving}
          />
        </form>
      </Modal>

      {/* Modal Adjust Stok */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={
          adjustItem
            ? `${adjustType === 'PAKAI' ? 'Catat Pemakaian / Resep' : 'Restock Barang Masuk'} - ${adjustItem.nama}`
            : 'Sesuaikan Stok'
        }
      >
        <form onSubmit={handleSaveAdjust}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Stok Saat Ini:</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {adjustItem?.stok} {adjustItem?.satuan}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                {adjustType === 'PAKAI' ? 'Jumlah Dipakai / Resep Pasien' : 'Jumlah Masuk (Restock)'}{' '}
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              />
            </div>
          </div>

          <ModalFormFooter
            onCancel={() => setAdjustModalOpen(false)}
            submitLabel={adjustType === 'PAKAI' ? 'Simpan Pemakaian' : 'Simpan Restock'}
            loading={saving}
          />
        </form>
      </Modal>
    </div>
  );
}
