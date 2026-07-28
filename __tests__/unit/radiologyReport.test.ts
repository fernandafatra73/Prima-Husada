import { describe, expect, test, vi } from 'vitest';
import { generateRadiologyReportVersions } from '../../apps/web/src/pdf/printRadiologyReport.tsx';

vi.mock('../../apps/web/src/pdf/loadLogoDataUrl.ts', () => ({
  loadLogoDataUrl: async (): Promise<string> =>
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
}));

vi.mock('../../apps/web/src/pdf/loadSignatureDataUrl.ts', () => ({
  loadSignatureDataUrl: async (): Promise<string> =>
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
}));

describe('generateRadiologyReportVersions', () => {
  test('generates PDF versions for multiline kesan and klinis without layout errors', async () => {
    const versions = await generateRadiologyReportVersions({
      regCode: 'REG-RAD-001',
      nama: 'Budi Pasien',
      umurLabel: '30 th',
      tanggal: '28/07/2026',
      alamat: 'Jl. Contoh Raya No. 1',
      pemeriksaan: 'Rontgen Thorax PA',
      dokterPengirim: 'dr. Pengirim, Sp.P',
      klinis: 'Batuk lama > 2 minggu\nSesak nafas dan demam subfebris',
      kesan: 'Tb paru aktif kanan dan kiri\nTidak tampak cardiomegali',
      radiologNama: 'Dr. Radiolog, Sp.Rad',
    });

    expect(versions).toBeDefined();
    expect(versions.filename).toBe('Budi Pasien.pdf');
    expect(versions.withSignature.size).toBeGreaterThan(0);
    expect(versions.withSignature.type).toBe('application/pdf');
    expect(versions.withoutSignature.size).toBeGreaterThan(0);
    expect(versions.withoutSignature.type).toBe('application/pdf');
  });
});
