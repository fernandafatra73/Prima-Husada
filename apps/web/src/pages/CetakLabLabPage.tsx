import { useState } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { CetakAmplopLabModal, type CetakAmplopLabPasien } from '../components/CetakAmplopLabModal.tsx';
import { CetakLabelLabModal, type CetakLabelLabPasien } from '../components/CetakLabelLabModal.tsx';
import { useListQueryParams, useListSearch } from '../hooks/useListQueryParams.ts';
import { usePaginatedList } from '../hooks/usePaginatedList.ts';
import { computeUmurYears, formatDateShort } from '../lib/format.ts';
import '../components/ui/ui.css';

interface CetakLabPasienRow {
  readonly id: string;
  readonly regCode: string;
  readonly nama: string;
  readonly umur?: number;
  readonly tanggalLahir: string;
  readonly createdAt: string;
  readonly pengirim: { readonly nama: string };
  readonly pemeriksaan: readonly { readonly nama: string }[];
}

interface CetakLabLabPageProps {
  readonly mode: 'amplop' | 'label';
}

export function CetakLabLabPage({ mode }: CetakLabLabPageProps) {
  const { search, setSearch } = useListSearch();
  const queryParams = useListQueryParams({ modul: 'LABORATORIUM' }, search);
  const { items, pagination, setPage, loading, error, reload } =
    usePaginatedList<CetakLabPasienRow>('/api/pasien', queryParams);

  const [selectedPasien, setSelectedPasien] = useState<CetakLabPasienRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleOpenPrint(pasien: CetakLabPasienRow) {
    setSelectedPasien(pasien);
    setModalOpen(true);
  }

  const isAmplop = mode === 'amplop';

  return (
    <>
      <ListPageShell
        title={isAmplop ? 'Cetak Amplop (Laboratorium)' : 'Cetak Label (Laboratorium)'}
        subtitle={
          isAmplop
            ? 'Pencetakan kop amplop hasil pemeriksaan laboratorium'
            : 'Pencetakan stiker label identitas pasien laboratorium'
        }
        metrics={[
          {
            label: 'Total Pasien',
            value: String(pagination.total),
            tone: 'blue',
            iconKind: 'document',
          },
        ]}
        searchPlaceholder="Cari nama pasien, no. registrasi, dokter pengirim..."
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
              <th style={{ width: '160px' }}>Tanggal &amp; No. Registrasi</th>
              <th style={{ width: '220px' }}>Nama Pasien &amp; Usia</th>
              <th>Pemeriksaan Laboratorium</th>
              <th style={{ width: '180px' }}>Dokter Pengirim</th>
              <th style={{ width: '160px', textAlign: 'center' }}>
                {isAmplop ? 'Cetak Amplop' : 'Cetak Label'}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Belum ada data pasien laboratorium yang ditemukan.
                </td>
              </tr>
            ) : (
              items.map((p, idx) => {
                const rowNo = (pagination.page - 1) * pagination.limit + idx + 1;
                const umur = p.umur ?? computeUmurYears(p.tanggalLahir, p.createdAt) ?? 0;
                const tanggal = formatDateShort(p.createdAt);
                const jenisNames = p.pemeriksaan.map((x) => x.nama).join(', ') || '—';

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
                      <button
                        type="button"
                        className="btn btn--xs btn--primary"
                        onClick={() => handleOpenPrint(p)}
                        title={isAmplop ? 'Cetak Amplop Hasil Laboratorium' : 'Cetak Label Stiker Identitas'}
                        style={{ padding: '0.35rem 0.65rem', fontWeight: 600 }}
                      >
                        {isAmplop ? '✉️ Amplop' : '🏷️ Label'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ListPageShell>

      {isAmplop ? (
        <CetakAmplopLabModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          pasien={selectedPasien as CetakAmplopLabPasien | null}
        />
      ) : (
        <CetakLabelLabModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          pasien={selectedPasien as CetakLabelLabPasien | null}
        />
      )}
    </>
  );
}
