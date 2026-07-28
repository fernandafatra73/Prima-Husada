import { describe, expect, test, vi } from 'vitest';
import { generateSharingReportBlob } from '../../apps/web/src/pdf/printSharingReport.tsx';

vi.mock('../../apps/web/src/pdf/loadLogoDataUrl.ts', () => ({
  loadLogoDataUrl: async (): Promise<string> =>
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
}));

describe('generateSharingReportBlob', () => {
  test('generates a PDF Blob for previewing sharing report', async () => {
    const blob = await generateSharingReportBlob({
      dokterNama: 'Dr. John Doe',
      periodeLabel: 'Bulan Ini',
      tanggalCetak: '27/07/2026',
      items: [
        {
          no: 1,
          nama: 'Budi Pasien',
          regCode: 'REG-001',
          umurLabel: '30 th',
          tanggal: '27/07/2026',
          alamat: 'Jl. Contoh 1',
          pemeriksaan: 'Rontgen Thorax',
          sharingFormatted: 'Rp 50.000',
        },
      ],
      totalPasien: 1,
      totalSharingFormatted: 'Rp 50.000',
      adminFeeFormatted: 'Rp 5.000',
      netSharingFormatted: 'Rp 45.000',
      catatan: 'Catatan pengiriman',
    });

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
  });
});
