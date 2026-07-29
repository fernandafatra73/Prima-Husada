import { useState } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { CetakALModal, type CetakALPasien } from '../components/CetakALModal.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { computeUmurYears, formatDateShort } from '../lib/format.ts';
import '../components/ui/ui.css';

export function CetakALPage() {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({}, search);
  const { items, pagination, setPage, loading, error, reload } =
    usePaginatedList<CetakALPasien>('/api/pasien', queryParams);

  const [selectedPasien, setSelectedPasien] = useState<CetakALPasien | null>(null);
  const [modalMode, setModalMode] = useState<'amplop' | 'label' | 'both'>('both');
  const [modalOpen, setModalOpen] = useState(false);

  function handleOpenPrint(pasien: CetakALPasien, mode: 'amplop' | 'label' | 'both') {
    setSelectedPasien(pasien);
    setModalMode(mode);
    setModalOpen(true);
  }

  return (
    <>
      <ListPageShell
        title="Cetak A+L (Amplop & Label Radiologi)"
        subtitle="Pencetakan stiker label identitas pasien dan kop amplop hasil foto radiologi"
        metrics={[
          {
            label: 'Total Pasien',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'document',
          },
        ]}
        searchPlaceholder="Cari nama pasien, no. foto, dokter pengirim..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void reload()}
        error={error}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>No</th>
              <th style={{ width: '160px' }}>Tanggal &amp; No. Foto</th>
              <th style={{ width: '220px' }}>Nama Pasien &amp; Usia</th>
              <th>Pemeriksaan Radiologi</th>
              <th style={{ width: '180px' }}>Dokter Pengirim</th>
              <th style={{ width: '280px', textAlign: 'center' }}>Cetak A+L</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Belum ada data pasien radiologi yang ditemukan.
                </td>
              </tr>
            ) : (
              items.map((p, idx) => {
                const rowNo = (pagination.page - 1) * pagination.limit + idx + 1;
                const umur = p.umur ?? computeUmurYears(p.tanggalLahir, p.createdAt) ?? 0;
                const tanggal = formatDateShort(p.createdAt);
                const jenisNames =
                  p.pemeriksaan.map((x) => x.nama).join(', ') || '—';

                return (
                  <tr key={p.id}>
                    <td>{rowNo}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0369a1' }}>{p.regCode}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{tanggal}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.nama}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {umur} tahun ({p.tanggalLahir})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#1e293b' }}>{jenisNames}</div>
                    </td>
                    <td>
                      <div style={{ color: '#334155' }}>{p.pengirim.nama}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '0.4rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn--xs btn--secondary"
                          onClick={() => handleOpenPrint(p, 'amplop')}
                          title="Cetak Amplop Hasil Foto (A)"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          ✉️ Amplop (A)
                        </button>
                        <button
                          type="button"
                          className="btn btn--xs btn--secondary"
                          onClick={() => handleOpenPrint(p, 'label')}
                          title="Cetak Label Stiker Identitas (L)"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          🏷️ Label (L)
                        </button>
                        <button
                          type="button"
                          className="btn btn--xs btn--primary"
                          onClick={() => handleOpenPrint(p, 'both')}
                          title="Cetak Amplop & Label Sekaligus (A+L)"
                          style={{ padding: '0.35rem 0.65rem', fontWeight: 600 }}
                        >
                          🖨️ A+L
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ListPageShell>

      <CetakALModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pasien={selectedPasien}
        initialMode={modalMode}
      />
    </>
  );
}
