import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { CHART_COLORS, baseChartOptions } from './chartTheme.ts';

interface StatusSlice {
  readonly menunggu: number;
  readonly selesai: number;
}

interface PaymentSlice {
  readonly lunas: number;
  readonly belum: number;
}

interface DashboardChartsProps {
  readonly statusHasil: StatusSlice;
  readonly statusBayar: PaymentSlice;
  readonly omzetHariIni: number;
  readonly totalSharingHariIni: number;
  readonly pasienHariIni: number;
  readonly menungguHasil: number;
  readonly selesaiHariIni: number;
  readonly totalPemeriksaan: number;
}

function donutOptions(labels: string[], colors: string[]): ApexOptions {
  return {
    ...baseChartOptions(),
    chart: { ...baseChartOptions().chart, type: 'donut' },
    labels,
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              color: '#64748b',
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { height: 260 }, legend: { position: 'bottom' } },
      },
    ],
  };
}

function barOptions(categories: string[], colors: string[]): ApexOptions {
  return {
    ...baseChartOptions(),
    chart: { ...baseChartOptions().chart, type: 'bar', height: 280 },
    colors,
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '48%',
        distributed: true,
      },
    },
    xaxis: {
      categories,
      labels: { style: { colors: '#64748b', fontSize: '12px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val: number) => (val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}jt` : String(Math.round(val))),
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val: number) =>
          new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val),
      },
    },
  };
}

export function DashboardCharts({
  statusHasil,
  statusBayar,
  omzetHariIni,
  totalSharingHariIni,
  pasienHariIni,
  menungguHasil,
  selesaiHariIni,
  totalPemeriksaan,
}: DashboardChartsProps) {
  const hasilTotal = statusHasil.menunggu + statusHasil.selesai;
  const bayarTotal = statusBayar.lunas + statusBayar.belum;

  return (
    <>
      <div className="chart-grid">
        <section className="chart-card">
          <h3 className="chart-card__title">Status Hasil</h3>
          <Chart
            type="donut"
            height={300}
            options={donutOptions(
              ['Menunggu', 'Selesai'],
              [CHART_COLORS.danger, CHART_COLORS.success],
            )}
            series={
              hasilTotal > 0
                ? [statusHasil.menunggu, statusHasil.selesai]
                : [0, 0]
            }
          />
        </section>

        <section className="chart-card">
          <h3 className="chart-card__title">Status Pembayaran</h3>
          <Chart
            type="donut"
            height={300}
            options={donutOptions(
              ['Belum lunas', 'Lunas'],
              [CHART_COLORS.muted, CHART_COLORS.primary],
            )}
            series={bayarTotal > 0 ? [statusBayar.belum, statusBayar.lunas] : [0, 0]}
          />
        </section>
      </div>

      <div className="chart-grid">
        <section className="chart-card">
          <h3 className="chart-card__title">Keuangan Hari Ini</h3>
          <Chart
            type="bar"
            height={280}
            options={barOptions(['Omzet', 'Sharing'], [CHART_COLORS.primary, CHART_COLORS.violet])}
            series={[{ name: 'Nominal', data: [omzetHariIni, totalSharingHariIni] }]}
          />
        </section>

        <section className="chart-card">
          <h3 className="chart-card__title">Operasional</h3>
          <Chart
            type="bar"
            height={280}
            options={barOptions(
              ['Pasien baru', 'Menunggu', 'Selesai', 'Pemeriksaan'],
              [CHART_COLORS.primary, CHART_COLORS.danger, CHART_COLORS.success, CHART_COLORS.violet],
            )}
            series={[
              {
                name: 'Jumlah',
                data: [pasienHariIni, menungguHasil, selesaiHariIni, totalPemeriksaan],
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
