import type { ApexOptions } from 'apexcharts';

export const CHART_COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  danger: '#dc2626',
  muted: '#94a3b8',
  violet: '#7c3aed',
} as const;

export function baseChartOptions(): ApexOptions {
  return {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: '#64748b' },
    },
    tooltip: { theme: 'light' },
  };
}
