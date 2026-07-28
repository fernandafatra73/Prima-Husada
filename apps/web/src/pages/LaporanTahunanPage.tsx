import { useEffect, useState } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { apiGet } from '../lib/api.ts';
import { formatRupiah } from '../lib/format.ts';
import '../components/ui/ui.css';

interface PemeriksaanStat {
  readonly nama: string;
  readonly count: number;
}

interface DokterStat {
  readonly nama: string;
  readonly count: number;
  readonly percentage: number;
}

interface LaporanTahunanData {
  readonly year: number;
  readonly totalPendapatan: number;
  readonly totalPasien: number;
  readonly pemeriksaan: readonly PemeriksaanStat[];
  readonly dokterPengirim: readonly DokterStat[];
}

export function LaporanTahunanPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [data, setData] = useState<LaporanTahunanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<LaporanTahunanData>(`/api/laporan/tahunan?year=${year}`);
        if (!ignore) {
          setData(res);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    void fetchData();
    return () => {
      ignore = true;
    };
  }, [year]);

  const yearOptions = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    yearOptions.push(y);
  }

  return (
    <ListPageShell
      title="Laporan Tahunan"
      subtitle="Ringkasan dan rekapitulasi data analitik tahunan"
    >
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <div className="form-field" style={{ minWidth: '150px' }}>
          <label htmlFor="filter-year">Pilih Tahun</label>
          <select
            id="filter-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      {loading ? (
        <div className="loading-state">Memuat data laporan...</div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Metrics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '1.1rem', color: '#1e3a8a', fontWeight: 600, marginBottom: '0.5rem' }}>
                Total Pendapatan Tahunan
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>
                {formatRupiah(data.totalPendapatan)}
              </div>
            </div>
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '1.1rem', color: '#14532d', fontWeight: 600, marginBottom: '0.5rem' }}>
                Total Pasien
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#15803d' }}>
                {data.totalPasien} <span style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>pasien</span>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Table Jenis Pemeriksaan */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-text)' }}>
                Statistik Jenis Pemeriksaan
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Jenis Pemeriksaan</th>
                    <th style={{ textAlign: 'right' }}>Jumlah Pasien</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pemeriksaan.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center' }}>Tidak ada data</td>
                    </tr>
                  ) : (
                    data.pemeriksaan.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.nama}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Dokter Pengirim */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-text)' }}>
                Statistik Dokter Pengirim
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Dokter</th>
                    <th style={{ textAlign: 'center' }}>Rujukan</th>
                    <th style={{ textAlign: 'right' }}>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dokterPengirim.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center' }}>Tidak ada data</td>
                    </tr>
                  ) : (
                    data.dokterPengirim.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.nama}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <span>{item.percentage.toFixed(1)}%</span>
                            <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${item.percentage}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      ) : null}
    </ListPageShell>
  );
}
